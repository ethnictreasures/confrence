
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db';
import { payments, registrations } from '@/db/schema';
import {
  fetchRazorpayOrder,
  fetchRazorpayPayment,
  verifyCheckoutSignature,
} from '@/lib/razorpay';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const requestSchema = z.object({
  razorpay_payment_id: z.string().min(1).max(255),
  razorpay_order_id: z.string().min(1).max(255),
  razorpay_signature: z.string().regex(/^[a-f\d]{64}$/i),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const parsedBody = requestSchema.safeParse(await request.json());

    if (!parsedBody.success) {
      return NextResponse.json(
        { verified: false, message: 'Invalid payment verification data.' },
        { status: 400 },
      );
    }

    const {
      razorpay_payment_id: paymentId,
      razorpay_order_id: submittedOrderId,
      razorpay_signature: signature,
    } = parsedBody.data;

    const [registration] = await db
      .select()
      .from(registrations)
      .where(eq(registrations.id, id))
      .limit(1);

    if (!registration) {
      return NextResponse.json(
        { verified: false, message: 'Registration not found.' },
        { status: 404 },
      );
    }

    if (
      registration.registrationType !== 'student' &&
      registration.registrationType !== 'industry_professional'
    ) {
      return NextResponse.json(
        { verified: false, message: 'Unsupported registration category.' },
        { status: 400 },
      );
    }

    if (
      registration.paymentStatus === 'refunded' ||
      registration.paymentStatus === 'cancelled' ||
      registration.paymentStatus === 'expired'
    ) {
      return NextResponse.json(
        { verified: false, status: registration.paymentStatus,
          message: 'This registration is not eligible for payment verification.' },
        { status: 409 },
      );
    }

    const expectedAmount = registration.totalAmountPaise;
    const savedOrderId = registration.razorpayOrderId;

    if (!expectedAmount || expectedAmount <= 0 || !savedOrderId) {
      return NextResponse.json(
        { verified: false, message: 'No valid payment order is saved for this registration.' },
        { status: 409 },
      );
    }

    // Never verify against an arbitrary order supplied by the browser.
    if (submittedOrderId !== savedOrderId) {
      return NextResponse.json(
        { verified: false, message: 'The order does not belong to this registration.' },
        { status: 409 },
      );
    }

    if (
      !verifyCheckoutSignature(
        savedOrderId,
        paymentId,
        signature,
      )
    ) {
      return NextResponse.json(
        { verified: false, message: 'Payment signature verification failed.' },
        { status: 400 },
      );
    }

    // Fetch both resources directly from Razorpay.
    const [order, payment] = await Promise.all([
      fetchRazorpayOrder(savedOrderId),
      fetchRazorpayPayment(paymentId),
    ]);

    if (!order || !payment) {
      return NextResponse.json(
        { verified: false, message: 'Unable to retrieve payment details from Razorpay.' },
        { status: 502 },
      );
    }

    if (
      order.id !== savedOrderId ||
      order.amount !== expectedAmount ||
      order.currency !== 'INR'
    ) {
      return NextResponse.json(
        { verified: false, message: 'The Razorpay order does not match the registration amount.' },
        { status: 409 },
      );
    }

    if (
      payment.order_id !== savedOrderId ||
      payment.id !== paymentId ||
      payment.amount !== expectedAmount ||
      payment.currency !== 'INR'
    ) {
      return NextResponse.json(
        { verified: false, message: 'The Razorpay payment does not match this registration.' },
        { status: 409 },
      );
    }

    // A valid Checkout signature does not, by itself, prove capture.
    if (payment.status !== 'captured' || payment.captured !== true) {
      return NextResponse.json({
        verified: false,
        status: payment.status,
        message: 'Payment has not been captured yet. Check again shortly; do not pay again until its status is resolved.',
      });
    }

    const now = new Date();

    await db.transaction(async (tx) => {
      // Check whether this payment ID has already been assigned elsewhere.
      const [existingPayment] = await tx
        .select()
        .from(payments)
        .where(eq(payments.razorpayPaymentId, payment.id))
        .limit(1);

      if (
        existingPayment &&
        existingPayment.registrationId !== registration.id
      ) {
        throw new Error('PAYMENT_ALREADY_ASSOCIATED');
      }

      // Re-read the registration inside the transaction to reduce races.
      const [currentRegistration] = await tx
        .select()
        .from(registrations)
        .where(eq(registrations.id, registration.id))
        .limit(1);

      if (!currentRegistration) {
        throw new Error('REGISTRATION_NOT_FOUND');
      }

      if (
        currentRegistration.razorpayOrderId !== savedOrderId ||
        currentRegistration.totalAmountPaise !== expectedAmount
      ) {
        throw new Error('REGISTRATION_PAYMENT_DATA_CHANGED');
      }

      if (
        currentRegistration.razorpayPaymentId &&
        currentRegistration.razorpayPaymentId !== payment.id
      ) {
        throw new Error('DIFFERENT_PAYMENT_ALREADY_RECORDED');
      }

      if (existingPayment) {
        await tx
          .update(payments)
          .set({
            paymentStatus: 'paid',
            amount: (payment.amount / 100).toFixed(2),
            amountPaise: payment.amount,
            currency: payment.currency,
            paymentCompletedAt: existingPayment.paymentCompletedAt ?? now,
            updatedAt: now,
          })
          .where(eq(payments.id, existingPayment.id));
      } else {
        await tx.insert(payments).values({
          registrationId: registration.id,
          provider: 'razorpay',
          razorpayPaymentId: payment.id,
          amount: (payment.amount / 100).toFixed(2),
          amountPaise: payment.amount,
          currency: payment.currency,
          paymentStatus: 'paid',
          paymentCreatedAt: now,
          paymentCompletedAt: now,
          updatedAt: now,
        });
      }

      await tx
        .update(registrations)
        .set({
          paymentStatus: 'paid',
          amountPaidPaise: payment.amount,
          razorpayPaymentId: payment.id,
          paymentLinkId: null,
          paymentReconciliationStatus: 'matched',
          paymentCompletedAt: currentRegistration.paymentCompletedAt ?? now,
          updatedAt: now,
        })
        .where(eq(registrations.id, registration.id));
    });

    return NextResponse.json({
      verified: true,
      status: 'paid',
      paymentId: payment.id,
      orderId: savedOrderId,
      amountPaise: payment.amount,
      currency: payment.currency,
      message: 'Payment verified successfully. you will receive the confirmation email shortly.',
    });
  } catch (error) {
    console.error('[Payment verification] Failed:', error);

    const errorMessage =
      error instanceof Error ? error.message : '';

    if (errorMessage === 'PAYMENT_ALREADY_ASSOCIATED') {
      return NextResponse.json(
        { verified: false, message: 'This payment is already associated with another registration.' },
        { status: 409 },
      );
    }

    if (
      errorMessage === 'DIFFERENT_PAYMENT_ALREADY_RECORDED' ||
      errorMessage === 'REGISTRATION_PAYMENT_DATA_CHANGED'
    ) {
      return NextResponse.json(
        { verified: false, message: 'The registration payment has changed. Please contact support if payment was deducted.' },
        { status: 409 },
      );
    }

    if (errorMessage === 'REGISTRATION_NOT_FOUND') {
      return NextResponse.json(
        { verified: false, message: 'Registration not found.' },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { verified: false, message: 'Payment verification failed. Please check your registration status.' },
      { status: 500 },
    );
  }
}
