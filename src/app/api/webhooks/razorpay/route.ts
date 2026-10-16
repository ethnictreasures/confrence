import { NextRequest, NextResponse } from 'next/server';
import { and, eq, sql } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db';
import {
  paymentRefunds,
  paymentWebhookEvents,
  payments,
  registrations,
} from '@/db/schema';
import { verifyWebhookSignature } from '@/lib/razorpay';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const paymentEntitySchema = z.object({
  id: z.string().optional(),
  order_id: z.string().optional(),
  amount: z.number().int().nonnegative().optional(),
  amount_captured: z.number().int().nonnegative().optional(),
  currency: z.string().optional(),
  status: z.string().optional(),
  captured: z.boolean().optional(),
  email: z.string().nullable().optional(),
  contact: z.string().nullable().optional(),
  notes: z.record(z.string(), z.unknown()).optional(),
  created_at: z.number().optional(),
});

const refundEntitySchema = z.object({
  id: z.string().min(1),
  payment_id: z.string().min(1),
  amount: z.number().int().nonnegative(),
  status: z.string().optional(),
});

const webhookSchema = z.object({
  id: z.string().min(1),
  event: z.enum([
    'payment.captured',
    'payment.failed',
    'refund.created',
    'refund.processed',
    'refund.failed',
    'refund.speed_changed',
  ]),
  payload: z.object({
    payment: z.object({ entity: paymentEntitySchema }).optional(),
    refund: z.object({ entity: refundEntitySchema }).optional(),
  }),
});

function normalizedPhone(value: string | null | undefined): string | null {
  if (!value) return null;
  const digits = value.replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : null;
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-razorpay-signature');
  const eventId = request.headers.get('x-razorpay-event-id');

  if (!signature || !verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = webhookSchema.safeParse(body);
  if (!parsed.success || !eventId) {
    return NextResponse.json(
      { error: 'Unsupported or malformed webhook event' },
      { status: 400 },
    );
  }

  const event = parsed.data;
  const paymentEntity = event.payload.payment?.entity;
  const refund = event.payload.refund?.entity;
  const paymentId = refund?.payment_id ?? paymentEntity?.id;
  const amountPaise = refund?.amount ?? paymentEntity?.amount_captured ?? paymentEntity?.amount;
  const currency = paymentEntity?.currency ?? 'INR';
  const payerEmail = paymentEntity?.email?.trim().toLowerCase() ?? null;
  const payerPhone = normalizedPhone(paymentEntity?.contact);

  try {
    const [existingEvent] = await db
      .select({ id: paymentWebhookEvents.id })
      .from(paymentWebhookEvents)
      .where(eq(paymentWebhookEvents.webhookEventId, eventId))
      .limit(1);

    if (existingEvent) {
      return NextResponse.json({ status: 'duplicate' });
    }

    // Refund events must refer to a payment already associated with a registration.
    if (event.event.startsWith('refund.')) {
      if (!refund || !paymentId || amountPaise === undefined) {
        return NextResponse.json({ error: 'Malformed refund event' }, { status: 400 });
      }

      await db.transaction(async (tx) => {
        const [payment] = await tx
          .select()
          .from(payments)
          .where(eq(payments.razorpayPaymentId, paymentId))
          .limit(1);

        await tx.insert(paymentWebhookEvents).values({
          webhookEventId: eventId,
          eventType: event.event,
          razorpayPaymentId: paymentId,
          amountPaise,
          currency,
          payerEmail,
          payerPhone,
          registrationId: payment?.registrationId ?? null,
          reconciliationStatus: payment ? 'matched' : 'unresolved',
          reconciliationReason: payment
            ? null
            : 'Refund refers to a payment that is not associated with a registration.',
          rawEvent: body,
        });

        if (!payment) return;

        const [existingRefund] = await tx
          .select()
          .from(paymentRefunds)
          .where(eq(paymentRefunds.razorpayRefundId, refund.id))
          .limit(1);

        if (event.event === 'refund.speed_changed') {
          await tx
            .update(paymentWebhookEvents)
            .set({
              reconciliationStatus: 'ignored',
              reconciliationReason: 'Refund speed changed; no refund total was changed.',
            })
            .where(eq(paymentWebhookEvents.webhookEventId, eventId));
          return;
        }

        if (event.event === 'refund.failed') {
          if (existingRefund) {
            await tx
              .update(paymentRefunds)
              .set({
                status: 'failed',
                webhookEventId: eventId,
                rawEvent: body,
                updatedAt: new Date(),
              })
              .where(eq(paymentRefunds.id, existingRefund.id));
          } else {
            await tx.insert(paymentRefunds).values({
              paymentId: payment.id,
              razorpayRefundId: refund.id,
              amountPaise: refund.amount,
              status: 'failed',
              webhookEventId: eventId,
              rawEvent: body,
            });
          }

          await tx
            .update(paymentWebhookEvents)
            .set({
              reconciliationStatus: 'ignored',
              reconciliationReason: 'Razorpay refund failed; no refund amount was deducted.',
            })
            .where(eq(paymentWebhookEvents.webhookEventId, eventId));
          return;
        }

        if (event.event === 'refund.created') {
          if (!existingRefund) {
            await tx.insert(paymentRefunds).values({
              paymentId: payment.id,
              razorpayRefundId: refund.id,
              amountPaise: refund.amount,
              status: 'pending',
              webhookEventId: eventId,
              rawEvent: body,
            });
          }

          await tx
            .update(paymentWebhookEvents)
            .set({
              reconciliationStatus: 'matched',
              reconciliationReason: 'Refund initiated; awaiting processed confirmation.',
            })
            .where(eq(paymentWebhookEvents.webhookEventId, eventId));
          return;
        }

        // refund.processed
        if (existingRefund) {
          await tx
            .update(paymentRefunds)
            .set({
              status: 'processed',
              webhookEventId: eventId,
              rawEvent: body,
              updatedAt: new Date(),
            })
            .where(eq(paymentRefunds.id, existingRefund.id));
        } else {
          await tx.insert(paymentRefunds).values({
            paymentId: payment.id,
            razorpayRefundId: refund.id,
            amountPaise: refund.amount,
            status: 'processed',
            webhookEventId: eventId,
            rawEvent: body,
          });
        }

        const [refundTotals] = await tx
          .select({
            total: sql<number>`COALESCE(SUM(${paymentRefunds.amountPaise}), 0)::int`,
          })
          .from(paymentRefunds)
          .where(
            and(
              eq(paymentRefunds.paymentId, payment.id),
              eq(paymentRefunds.status, 'processed'),
            ),
          );

        const totalPaymentPaise =
          payment.amountPaise ?? Math.round(Number(payment.amount) * 100);
        const refundTotal = Math.min(totalPaymentPaise, Number(refundTotals.total));
        const paymentRefundStatus =
          refundTotal >= totalPaymentPaise ? 'refunded' : 'partially_refunded';

        await tx
          .update(payments)
          .set({
            refundedAmountPaise: refundTotal,
            paymentStatus: paymentRefundStatus,
            updatedAt: new Date(),
          })
          .where(eq(payments.id, payment.id));

        const [registrationTotals] = await tx
          .select({
            collected: sql<number>`COALESCE(SUM(${payments.amountPaise}), 0)::int`,
            refunded: sql<number>`COALESCE(SUM(${payments.refundedAmountPaise}), 0)::int`,
          })
          .from(payments)
          .where(
            and(
              eq(payments.registrationId, payment.registrationId),
              sql`${payments.paymentStatus} IN ('paid', 'partially_refunded', 'refunded')`,
            ),
          );

        const [registration] = await tx
          .select({ totalAmountPaise: registrations.totalAmountPaise })
          .from(registrations)
          .where(eq(registrations.id, payment.registrationId))
          .limit(1);

        const expectedRegistrationPaise = registration?.totalAmountPaise;
        const registrationRefundStatus =
          expectedRegistrationPaise != null &&
          Number(registrationTotals.refunded) >= expectedRegistrationPaise &&
          Number(registrationTotals.refunded) >= Number(registrationTotals.collected)
            ? 'refunded'
            : 'partially_refunded';

        await tx
          .update(registrations)
          .set({ paymentStatus: registrationRefundStatus, updatedAt: new Date() })
          .where(eq(registrations.id, payment.registrationId));

        await tx
          .update(paymentWebhookEvents)
          .set({
            registrationId: payment.registrationId,
            reconciliationStatus: 'matched',
            reconciliationReason: null,
          })
          .where(eq(paymentWebhookEvents.webhookEventId, eventId));
      });

      return NextResponse.json({ status: 'processed' });
    }

    // Payment events are associated only by the saved Razorpay Order ID.
    if (!paymentEntity?.id || !paymentEntity.order_id) {
      await db.insert(paymentWebhookEvents).values({
        webhookEventId: eventId,
        eventType: event.event,
        razorpayPaymentId: paymentEntity?.id ?? null,
        amountPaise: amountPaise ?? null,
        currency,
        payerEmail,
        payerPhone,
        reconciliationStatus: 'unresolved',
        reconciliationReason: 'Payment event did not include a payment ID and order ID.',
        rawEvent: body,
      });

      return NextResponse.json({ status: 'requires_reconciliation' });
    }

    await db.transaction(async (tx) => {
      const [registration] = await tx
        .select()
        .from(registrations)
        .where(eq(registrations.razorpayOrderId, paymentEntity.order_id!))
        .limit(1);

      const [existingPayment] = await tx
        .select()
        .from(payments)
        .where(eq(payments.razorpayPaymentId, paymentEntity.id!))
        .limit(1);

      if (existingPayment && registration && existingPayment.registrationId !== registration.id) {
        await tx.insert(paymentWebhookEvents).values({
          webhookEventId: eventId,
          eventType: event.event,
          razorpayPaymentId: paymentEntity.id!,
          amountPaise: amountPaise ?? null,
          currency,
          payerEmail,
          payerPhone,
          registrationId: registration.id,
          reconciliationStatus: 'unresolved',
          reconciliationReason: 'Payment ID is already associated with a different registration.',
          rawEvent: body,
        });
        return;
      }

      const payerMatches =
        !!registration &&
        (!payerEmail || registration.email.trim().toLowerCase() === payerEmail) &&
        (!payerPhone || normalizedPhone(registration.phone) === payerPhone);

      const expectedAmount = registration?.totalAmountPaise;
      const amountMatches =
        !!registration &&
        currency === 'INR' &&
        amountPaise === expectedAmount;

      const isCapturedEvent = event.event === 'payment.captured';
      const captured =
        isCapturedEvent &&
        (paymentEntity.captured === true || paymentEntity.status === 'captured') &&
        payerMatches &&
        amountMatches;

      const eventStatus = event.event === 'payment.failed' ? 'failed' : captured ? 'paid' : 'requires_reconciliation';

      await tx.insert(paymentWebhookEvents).values({
        webhookEventId: eventId,
        eventType: event.event,
        razorpayPaymentId: paymentEntity.id!,
        amountPaise: amountPaise ?? null,
        currency,
        payerEmail,
        payerPhone,
        registrationId: registration?.id ?? null,
        reconciliationStatus: registration && payerMatches && amountMatches ? 'matched' : 'unresolved',
        reconciliationReason:
          registration && payerMatches && amountMatches
            ? null
            : 'Could not verify registration, payer details, currency, or exact amount.',
        rawEvent: body,
      });

      if (!registration || !payerMatches || !amountMatches) return;

      if (existingPayment) {
        await tx
          .update(payments)
          .set({
            paymentStatus: eventStatus,
            paymentCompletedAt: captured ? new Date() : existingPayment.paymentCompletedAt,
            updatedAt: new Date(),
          })
          .where(eq(payments.id, existingPayment.id));
      } else {
        await tx.insert(payments).values({
          registrationId: registration.id,
          provider: 'razorpay',
          razorpayPaymentId: paymentEntity.id!,
          amount: ((amountPaise ?? 0) / 100).toFixed(2),
          amountPaise: amountPaise ?? 0,
          currency,
          paymentStatus: eventStatus,
          webhookEventId: eventId,
          rawWebhookData: body,
          paymentCreatedAt: paymentEntity.created_at
            ? new Date(paymentEntity.created_at * 1000)
            : new Date(),
          paymentCompletedAt: captured ? new Date() : null,
        });
      }

      if (captured) {
        await tx
          .update(registrations)
          .set({
            paymentStatus: 'paid',
            amountPaidPaise: amountPaise!,
            razorpayPaymentId: paymentEntity.id!,
            paymentReconciliationStatus: 'matched',
            paymentCompletedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(registrations.id, registration.id));
      } else if (event.event === 'payment.failed') {
        await tx
          .update(registrations)
          .set({
            paymentStatus:
              registration.amountPaidPaise > 0 ? 'partially_paid' : 'failed',
            paymentReconciliationStatus: 'matched',
            updatedAt: new Date(),
          })
          .where(eq(registrations.id, registration.id));
      }
    });

    return NextResponse.json({ status: 'processed' });
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes('unique')) {
      const [recordedEvent] = await db
        .select({ id: paymentWebhookEvents.id })
        .from(paymentWebhookEvents)
        .where(eq(paymentWebhookEvents.webhookEventId, eventId))
        .limit(1);

      if (recordedEvent) return NextResponse.json({ status: 'duplicate' });
    }

    console.error('Razorpay webhook processing failed:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
