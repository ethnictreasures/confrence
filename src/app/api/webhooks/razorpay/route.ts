import { NextRequest, NextResponse } from 'next/server';
import { and, eq, or, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { paymentRefunds, paymentWebhookEvents, payments, registrations } from '@/db/schema';
import { configuredPaymentLinkId, verifyWebhookSignature } from '@/lib/razorpay';
import { REGISTRATION_PRICING, type NewRegistrationType } from '@/config/conference';

export const dynamic = 'force-dynamic';

const paymentEntitySchema = z.object({
  id: z.string().optional(),
  payment_id: z.string().optional(),
  amount: z.number().int().nonnegative().optional(),
  amount_paid: z.number().int().nonnegative().optional(),
  amount_due: z.number().int().nonnegative().optional(),
  currency: z.string().optional(),
  email: z.string().nullable().optional(),
  contact: z.string().nullable().optional(),
  customer: z.object({ email: z.string().optional(), contact: z.string().optional() }).optional(),
  notes: z.record(z.string(), z.unknown()).optional(),
  created_at: z.number().optional(),
});

const webhookSchema = z.object({
  id: z.string().min(1),
  event: z.enum([
    'payment_link.paid',
    'payment_link.partially_paid',
    'payment_link.expired',
    'payment_link.cancelled',
    'payment.captured',
    'payment.failed',
    'refund.created',
    'refund.processed',
    'refund.failed',
    'refund.speed_changed',
  ]),
  payload: z.object({
    order: z.object({ entity: z.object({ amount_paid: z.number().int().nonnegative().optional(), amount_due: z.number().int().nonnegative().optional(), amount: z.number().int().nonnegative().optional(), currency: z.string().optional() }).passthrough() }).optional(),
    payment_link: z.object({ entity: paymentEntitySchema }).optional(),
    payment: z.object({ entity: paymentEntitySchema }).optional(),
    refund: z.object({ entity: z.object({ id: z.string(), payment_id: z.string(), amount: z.number().int().nonnegative(), status: z.string().optional() }) }).optional(),
  }),
});

function normalizedPhone(value: string | undefined): string | null {
  if (!value) return null;
  const digits = value.replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : null;
}

function categoryForPaymentLink(linkId: string | undefined): NewRegistrationType | null {
  if (!linkId) return null;
  if (configuredPaymentLinkId('student') === linkId) return 'student';
  if (configuredPaymentLinkId('industry_professional') === linkId) return 'industry_professional';
  return null;
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
    return NextResponse.json({ error: 'Unsupported or malformed webhook event' }, { status: 400 });
  }

  const event = parsed.data;
  const linkEntity = event.payload.payment_link?.entity;
  const paymentEntity = event.payload.payment?.entity;
  const refund = event.payload.refund?.entity;
  const entity = linkEntity ?? paymentEntity;
  const paymentLinkId = linkEntity?.id;
  const paymentId = refund?.payment_id ?? paymentEntity?.id ?? entity?.payment_id;
  const amountPaise = refund?.amount ?? paymentEntity?.amount ?? event.payload.order?.entity.amount_paid ?? entity?.amount_paid ?? entity?.amount;
  const currency = paymentEntity?.currency ?? entity?.currency ?? 'INR';
  const payerEmail = (paymentEntity?.email ?? entity?.customer?.email)?.trim().toLowerCase();
  const payerPhone = normalizedPhone(paymentEntity?.contact ?? entity?.customer?.contact);

  const existingEvent = await db.select({ id: paymentWebhookEvents.id })
    .from(paymentWebhookEvents)
    .where(eq(paymentWebhookEvents.webhookEventId, eventId))
    .limit(1);
  if (existingEvent.length > 0) return NextResponse.json({ status: 'duplicate' });

  const category = categoryForPaymentLink(paymentLinkId);
  const paymentEvents = ['payment_link.paid', 'payment_link.partially_paid', 'payment.captured', 'payment.failed'];
  const isPaymentEvent = paymentEvents.includes(event.event);

  if (isPaymentEvent && paymentId) {
    const [priorAttempt] = await db.select().from(payments)
      .where(eq(payments.razorpayPaymentId, paymentId)).limit(1);
    if (priorAttempt) {
      const [priorRegistration] = await db.select().from(registrations)
        .where(eq(registrations.id, priorAttempt.registrationId)).limit(1);
      const priorCategory = priorRegistration && (priorRegistration.registrationType === 'student' || priorRegistration.registrationType === 'industry_professional')
        ? priorRegistration.registrationType
        : null;
      const categoryMatches = !paymentLinkId || category === priorCategory;
      const payerMatches = Boolean(priorRegistration) &&
        (!payerEmail || priorRegistration!.email.trim().toLowerCase() === payerEmail) &&
        (!payerPhone || normalizedPhone(priorRegistration!.phone) === payerPhone);
      const expectedPaise = priorRegistration?.totalAmountPaise ?? (priorCategory ? REGISTRATION_PRICING[priorCategory].totalAmountPaise : null);
      const validAmount = currency === 'INR' &&
        (amountPaise === undefined || expectedPaise !== null && amountPaise <= expectedPaise) &&
        (priorAttempt.amountPaise === null || amountPaise === undefined || priorAttempt.amountPaise === amountPaise);
      const cumulativeAmountPaise = event.payload.order?.entity.amount_paid ?? linkEntity?.amount_paid;
      const confirmsFullAmount = Boolean(priorRegistration && expectedPaise !== null && cumulativeAmountPaise === expectedPaise && ['payment_link.paid', 'payment.captured'].includes(event.event));
      const safeAssociation = categoryMatches && payerMatches && validAmount;

      await db.transaction(async (tx) => {
        await tx.insert(paymentWebhookEvents).values({
          webhookEventId: eventId,
          eventType: event.event,
          paymentLinkId: paymentLinkId ?? priorAttempt.paymentLinkId,
          razorpayPaymentId: paymentId,
          amountPaise: amountPaise ?? null,
          currency,
          payerEmail: payerEmail ?? null,
          payerPhone,
          registrationId: priorRegistration?.id ?? null,
          reconciliationStatus: safeAssociation ? 'matched' : 'unresolved',
          reconciliationReason: safeAssociation
            ? 'Additional signed event for an already-associated payment; no duplicate payment attempt was created.'
            : 'Repeated payment ID event conflicts with the existing registration association.',
          rawEvent: body,
        });

        if (!safeAssociation || !priorRegistration || !confirmsFullAmount) return;
        await tx.update(payments).set({ paymentStatus: 'paid', paymentCompletedAt: new Date(), updatedAt: new Date() })
          .where(eq(payments.id, priorAttempt.id));
        await tx.update(payments).set({ paymentStatus: 'paid', updatedAt: new Date() }).where(and(
          eq(payments.registrationId, priorRegistration.id),
          eq(payments.paymentStatus, 'partially_paid'),
        ));
        await tx.update(registrations).set({
          paymentStatus: 'paid',
          amountPaidPaise: cumulativeAmountPaise,
          paymentCompletedAt: new Date(),
          updatedAt: new Date(),
        }).where(and(
          eq(registrations.id, priorRegistration.id),
          or(eq(registrations.paymentStatus, 'pending'), eq(registrations.paymentStatus, 'partially_paid'), eq(registrations.paymentStatus, 'failed'), eq(registrations.paymentStatus, 'paid')),
        ));
      });
      return NextResponse.json({ status: safeAssociation ? 'already_associated' : 'requires_reconciliation' });
    }
  }

  let matchedRegistration: typeof registrations.$inferSelect | undefined;
  let unresolvedReason = 'Event does not identify an individual registration.';

  if (isPaymentEvent && category && payerEmail && payerPhone && amountPaise !== undefined && currency === 'INR') {
    const pricing = REGISTRATION_PRICING[category];
    const candidates = await db.select().from(registrations).where(and(
      eq(registrations.registrationType, category),
      sql`lower(${registrations.email}) = ${payerEmail}`,
      or(eq(registrations.paymentReconciliationStatus, 'pending'), eq(registrations.paymentReconciliationStatus, 'matched')),
      or(eq(registrations.paymentStatus, 'pending'), eq(registrations.paymentStatus, 'partially_paid'), eq(registrations.paymentStatus, 'failed')),
      eq(registrations.totalAmountPaise, pricing.totalAmountPaise),
    ));
    const exactCandidates = candidates.filter((registration) =>
      normalizedPhone(registration.phone) === payerPhone && amountPaise <= pricing.totalAmountPaise
    );
    if (exactCandidates.length === 1) {
      matchedRegistration = exactCandidates[0];
      unresolvedReason = '';
    } else {
      unresolvedReason = exactCandidates.length === 0
        ? 'No eligible registration matches verified payer email, phone, category, and amount.'
        : 'Multiple eligible registrations match payer details; manual reconciliation is required.';
    }
  } else if (isPaymentEvent) {
    unresolvedReason = !category
      ? 'Payment Link ID is missing or is not one of the configured category links.'
      : 'Verified payer email, phone, INR currency, or amount is missing.';
  } else if (event.event === 'payment_link.expired' || event.event === 'payment_link.cancelled') {
    unresolvedReason = 'A shared Payment Link event cannot identify one registration; no registration status was changed.';
  } else if (event.event.startsWith('refund.')) {
    unresolvedReason = 'Refund must be linked to a previously matched Razorpay payment.';
  }

  try {
    await db.transaction(async (tx) => {
      await tx.insert(paymentWebhookEvents).values({
        webhookEventId: eventId,
        eventType: event.event,
        paymentLinkId: paymentLinkId ?? null,
        razorpayPaymentId: paymentId ?? null,
        amountPaise: amountPaise ?? null,
        currency,
        payerEmail: payerEmail ?? null,
        payerPhone,
        registrationId: matchedRegistration?.id ?? null,
        reconciliationStatus: matchedRegistration ? 'matched' : 'unresolved',
        reconciliationReason: matchedRegistration ? null : unresolvedReason,
        rawEvent: body,
      });

      if (event.event.startsWith('refund.') && paymentId && amountPaise !== undefined) {
        const [payment] = await tx.select().from(payments).where(eq(payments.razorpayPaymentId, paymentId)).limit(1);
        if (!payment || !refund) {
          await tx.update(paymentWebhookEvents).set({ reconciliationReason: 'Refund payment ID does not match a previously associated payment.' }).where(eq(paymentWebhookEvents.webhookEventId, eventId));
          return;
        }

        const [existingRefund] = await tx.select().from(paymentRefunds)
          .where(eq(paymentRefunds.razorpayRefundId, refund.id)).limit(1);
        if (event.event === 'refund.speed_changed') {
          await tx.update(paymentWebhookEvents).set({ registrationId: payment.registrationId, reconciliationStatus: 'ignored', reconciliationReason: 'Refund speed change only; no refund amount was recorded.' }).where(eq(paymentWebhookEvents.webhookEventId, eventId));
          return;
        }

        if (event.event === 'refund.failed') {
          if (existingRefund) {
            await tx.update(paymentRefunds).set({ status: 'failed', webhookEventId: eventId, rawEvent: event, updatedAt: new Date() }).where(eq(paymentRefunds.id, existingRefund.id));
          } else {
            await tx.insert(paymentRefunds).values({ paymentId: payment.id, razorpayRefundId: refund.id, amountPaise, status: 'failed', webhookEventId: eventId, rawEvent: event });
          }
          await tx.update(paymentWebhookEvents).set({ registrationId: payment.registrationId, reconciliationStatus: 'ignored', reconciliationReason: 'Razorpay refund failed; no refund amount was deducted from revenue.' }).where(eq(paymentWebhookEvents.webhookEventId, eventId));
          return;
        }

        if (event.event === 'refund.created') {
          if (!existingRefund) {
            await tx.insert(paymentRefunds).values({ paymentId: payment.id, razorpayRefundId: refund.id, amountPaise, status: 'pending', webhookEventId: eventId, rawEvent: event });
          }
          await tx.update(paymentWebhookEvents).set({ registrationId: payment.registrationId, reconciliationStatus: 'matched', reconciliationReason: 'Refund initiated; net revenue changes when Razorpay confirms it as processed.' }).where(eq(paymentWebhookEvents.webhookEventId, eventId));
          return;
        }

        if (existingRefund) {
          await tx.update(paymentRefunds).set({ status: 'processed', webhookEventId: eventId, rawEvent: event, updatedAt: new Date() }).where(eq(paymentRefunds.id, existingRefund.id));
        } else {
          await tx.insert(paymentRefunds).values({ paymentId: payment.id, razorpayRefundId: refund.id, amountPaise, status: 'processed', webhookEventId: eventId, rawEvent: event });
        }
        const [refundTotals] = await tx.select({ total: sql<number>`COALESCE(SUM(${paymentRefunds.amountPaise}), 0)::int` })
          .from(paymentRefunds).where(and(eq(paymentRefunds.paymentId, payment.id), eq(paymentRefunds.status, 'processed')));
        const totalPaymentPaise = payment.amountPaise ?? Math.round(Number(payment.amount) * 100);
        const refundTotal = Math.min(totalPaymentPaise, refundTotals.total);
        const refundStatus = refundTotal >= totalPaymentPaise ? 'refunded' : 'partially_refunded';
        await tx.update(payments).set({ refundedAmountPaise: refundTotal, paymentStatus: refundStatus, updatedAt: new Date() }).where(eq(payments.id, payment.id));
        const [registrationTotals] = await tx.select({
          collected: sql<number>`COALESCE(SUM(${payments.amountPaise}), 0)::int`,
          refunded: sql<number>`COALESCE(SUM(${payments.refundedAmountPaise}), 0)::int`,
        }).from(payments).where(and(
          eq(payments.registrationId, payment.registrationId),
          sql`${payments.paymentStatus} IN ('paid', 'partially_refunded', 'refunded')`,
        ));
        const [refundRegistration] = await tx.select({ totalAmountPaise: registrations.totalAmountPaise })
          .from(registrations).where(eq(registrations.id, payment.registrationId)).limit(1);
        const totalRegistrationPaise = refundRegistration?.totalAmountPaise;
        const registrationRefundStatus = totalRegistrationPaise !== null && totalRegistrationPaise !== undefined && registrationTotals.refunded >= totalRegistrationPaise && registrationTotals.refunded >= registrationTotals.collected
          ? 'refunded'
          : 'partially_refunded';
        await tx.update(registrations).set({ paymentStatus: registrationRefundStatus, updatedAt: new Date() }).where(eq(registrations.id, payment.registrationId));
        await tx.update(paymentWebhookEvents).set({ registrationId: payment.registrationId, reconciliationStatus: 'matched', reconciliationReason: null }).where(eq(paymentWebhookEvents.webhookEventId, eventId));
        return;
      }

      if (!matchedRegistration || !paymentId || amountPaise === undefined) return;
      const pricing = REGISTRATION_PRICING[matchedRegistration.registrationType as NewRegistrationType];
      const expectedPaise = matchedRegistration.totalAmountPaise ?? pricing.totalAmountPaise;
      const cumulativeAmountPaise = event.payload.order?.entity.amount_paid ?? linkEntity?.amount_paid ?? amountPaise;
      const status = event.event === 'payment.failed'
        ? 'failed'
        : event.event === 'payment_link.partially_paid'
          ? 'partially_paid'
          : cumulativeAmountPaise === expectedPaise && (event.event === 'payment_link.paid' || event.event === 'payment.captured')
            ? 'paid'
            : 'requires_reconciliation';

      if (cumulativeAmountPaise !== expectedPaise && status !== 'partially_paid' && status !== 'failed') {
        await tx.update(paymentWebhookEvents).set({ reconciliationStatus: 'unresolved', reconciliationReason: `Payment Link amount paid ${cumulativeAmountPaise} paise does not match expected total ${expectedPaise} paise.` }).where(eq(paymentWebhookEvents.webhookEventId, eventId));
        return;
      }

      const newAmountPaid = status === 'partially_paid'
        ? Math.max(matchedRegistration.amountPaidPaise, cumulativeAmountPaise)
        : status === 'paid'
          ? cumulativeAmountPaise
          : matchedRegistration.amountPaidPaise;
      const registrationStatus = status === 'failed' && matchedRegistration.amountPaidPaise > 0
        ? 'partially_paid'
        : status;

      const [claimedRegistration] = await tx.update(registrations).set({
        paymentStatus: registrationStatus,
        amountPaidPaise: newAmountPaid,
        razorpayPaymentId: paymentId,
        paymentLinkId: paymentLinkId ?? null,
        paymentReconciliationStatus: 'matched',
        paymentCompletedAt: registrationStatus === 'paid' ? new Date() : null,
        updatedAt: new Date(),
      }).where(and(
        eq(registrations.id, matchedRegistration.id),
        eq(registrations.amountPaidPaise, matchedRegistration.amountPaidPaise),
        or(eq(registrations.paymentStatus, 'pending'), eq(registrations.paymentStatus, 'partially_paid'), eq(registrations.paymentStatus, 'failed')),
      )).returning({ id: registrations.id });

      if (!claimedRegistration) {
        await tx.update(paymentWebhookEvents).set({
          reconciliationStatus: 'unresolved',
          reconciliationReason: 'Registration state changed while this payment event was being processed; manual review is required.',
        }).where(eq(paymentWebhookEvents.webhookEventId, eventId));
        return;
      }

      const [existingPayment] = await tx.select().from(payments)
        .where(eq(payments.razorpayPaymentId, paymentId)).limit(1);
      if (existingPayment && existingPayment.registrationId !== matchedRegistration.id) {
        await tx.update(paymentWebhookEvents).set({
          reconciliationStatus: 'unresolved',
          reconciliationReason: 'Razorpay payment ID is already associated with another registration.',
        }).where(eq(paymentWebhookEvents.webhookEventId, eventId));
        return;
      }

      if (existingPayment) {
        await tx.update(payments).set({
          paymentStatus: status === 'paid' ? 'paid' : existingPayment.paymentStatus,
          paymentCompletedAt: status === 'paid' ? new Date() : existingPayment.paymentCompletedAt,
          updatedAt: new Date(),
        }).where(eq(payments.id, existingPayment.id));
      } else {
        await tx.insert(payments).values({
          registrationId: matchedRegistration.id,
          provider: 'razorpay',
          paymentLinkId: paymentLinkId ?? null,
          razorpayPaymentId: paymentId,
          amount: (amountPaise / 100).toFixed(2),
          amountPaise,
          currency,
          paymentStatus: status,
          webhookEventId: eventId,
          rawWebhookData: body,
          paymentCreatedAt: entity?.created_at ? new Date(entity.created_at * 1000) : new Date(),
          paymentCompletedAt: status === 'paid' ? new Date() : null,
        });
      }

      if (status === 'paid') {
        await tx.update(payments).set({ paymentStatus: 'paid' }).where(and(
          eq(payments.registrationId, matchedRegistration.id),
          eq(payments.paymentStatus, 'partially_paid'),
        ));
      }

    });
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes('unique')) {
      const [recordedEvent] = await db.select({ id: paymentWebhookEvents.id })
        .from(paymentWebhookEvents).where(eq(paymentWebhookEvents.webhookEventId, eventId)).limit(1);
      if (recordedEvent) return NextResponse.json({ status: 'duplicate' });
      return NextResponse.json({ error: 'Payment event raced with an existing association; retry for reconciliation.' }, { status: 500 });
    }
    console.error('Razorpay webhook processing failed:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }

  return NextResponse.json({ status: matchedRegistration ? 'processed' : 'requires_reconciliation' });
}
