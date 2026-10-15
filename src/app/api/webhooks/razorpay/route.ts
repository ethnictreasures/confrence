import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/razorpay';
import { db } from '@/db';
import { registrations, payments } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    const isValid = verifyWebhookSignature(rawBody, signature);

    if (!isValid) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event;
    const eventData = event.payload.payment_link.entity;

    console.log('Webhook event:', eventType);

    if (eventType === 'payment_link.paid') {
      const { notes, payment_id, amount, currency } = eventData;
      const paymentLinkId = eventData.id;

      if (!notes || !notes.registrationId) {
        console.error('Webhook missing registration ID in notes');
        return NextResponse.json(
          { error: 'Missing registration ID' },
          { status: 400 }
        );
      }

      const registrationId = notes.registrationId;

      const existingPayment = await db
        .select()
        .from(payments)
        .where(eq(payments.razorpayPaymentId, payment_id))
        .limit(1);

      if (existingPayment.length > 0) {
        console.log('Payment already processed, skipping');
        return NextResponse.json({ status: 'already_processed' });
      }

      await db.transaction(async (tx) => {
        await tx.insert(payments).values({
          registrationId,
          provider: 'razorpay',
          paymentLinkId,
          razorpayPaymentId: payment_id,
          amount: amount / 100,
          currency,
          paymentStatus: 'paid',
          webhookEventId: event.id,
          rawWebhookData: event,
          paymentCreatedAt: new Date(eventData.created_at * 1000),
          paymentCompletedAt: new Date(),
        });

        await tx
          .update(registrations)
          .set({
            paymentStatus: 'paid',
            razorpayPaymentId: payment_id,
            paymentLinkId,
            updatedAt: new Date(),
          })
          .where(eq(registrations.id, registrationId));
      });

      console.log('Payment processed successfully for registration:', registrationId);
    } else if (eventType === 'payment_link.failed') {
      const { notes, payment_id } = eventData;
      const paymentLinkId = eventData.id;

      if (notes && notes.registrationId) {
        const registrationId = notes.registrationId;

        await db.transaction(async (tx) => {
          await tx.insert(payments).values({
            registrationId,
            provider: 'razorpay',
            paymentLinkId,
            razorpayPaymentId: payment_id,
            amount: eventData.amount / 100,
            currency: eventData.currency,
            paymentStatus: 'failed',
            webhookEventId: event.id,
            rawWebhookData: event,
            paymentCreatedAt: new Date(eventData.created_at * 1000),
          });

          await tx
            .update(registrations)
            .set({
              paymentStatus: 'failed',
              razorpayPaymentId: payment_id,
              paymentLinkId,
              updatedAt: new Date(),
            })
            .where(eq(registrations.id, registrationId));
        });
      }
    } else if (eventType === 'payment_link.expired') {
      const { notes } = eventData;
      const paymentLinkId = eventData.id;

      if (notes && notes.registrationId) {
        const registrationId = notes.registrationId;

        await db
          .update(registrations)
          .set({
            paymentStatus: 'expired',
            paymentLinkId,
            updatedAt: new Date(),
          })
          .where(eq(registrations.id, registrationId));
      }
    }

    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}
