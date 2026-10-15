import { NextRequest, NextResponse } from 'next/server';
import { and, eq, or, sql } from 'drizzle-orm';
import { z } from 'zod';
import { auth, isAdminRole } from '@/lib/auth';
import { db } from '@/db';
import { auditLogs, paymentWebhookEvents, payments, registrations } from '@/db/schema';
import { fetchRazorpayPayment } from '@/lib/razorpay';
import { REGISTRATION_PRICING } from '@/config/conference';

const reconcileSchema = z.object({
  eventId: z.string().uuid(),
  registrationId: z.string().uuid(),
  reason: z.string().trim().min(10).max(1000),
});

function normalizedPhone(value: string | null | undefined): string | null {
  if (!value) return null;
  const digits = value.replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : null;
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session || !isAdminRole(session.user.role) || !session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = reconcileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Event, registration, and a reconciliation explanation are required.' }, { status: 400 });
  }

  const { eventId, registrationId, reason } = parsed.data;
  const [event] = await db.select().from(paymentWebhookEvents)
    .where(eq(paymentWebhookEvents.id, eventId)).limit(1);
  const [registration] = await db.select().from(registrations)
    .where(eq(registrations.id, registrationId)).limit(1);

  if (!event || !registration || event.reconciliationStatus !== 'unresolved') {
    return NextResponse.json({ error: 'This unresolved event or registration is unavailable.' }, { status: 404 });
  }

  const allowedLinkTypes = [
    { type: 'student' as const, id: process.env.STUDENT_RAZORPAY_PAYMENT_LINK_ID },
    { type: 'industry_professional' as const, id: process.env.PROFESSIONAL_RAZORPAY_PAYMENT_LINK_ID },
  ];
  const matchingLink = allowedLinkTypes.find(({ id }) => id && id === event.paymentLinkId);
  if (!matchingLink || registration.registrationType !== matchingLink.type) {
    return NextResponse.json({ error: 'The event Payment Link does not match the selected registration category.' }, { status: 409 });
  }

  const paymentId = event.razorpayPaymentId;
  if (!paymentId) {
    return NextResponse.json({ error: 'This event has no payment ID that can be verified with Razorpay.' }, { status: 409 });
  }

  const paymentEvidence = await fetchRazorpayPayment(paymentId);
  if (!paymentEvidence || paymentEvidence.status !== 'captured' || !paymentEvidence.captured) {
    return NextResponse.json({ error: 'Razorpay does not report this payment as captured.' }, { status: 409 });
  }

  const expectedAmount = registration.totalAmountPaise ?? REGISTRATION_PRICING[matchingLink.type].totalAmountPaise;
  const [priorAmounts] = await db.select({
    captured: sql<number>`COALESCE(SUM(${payments.amountPaise}), 0)::int`,
    refunds: sql<number>`COALESCE(SUM(${payments.refundedAmountPaise}), 0)::int`,
  }).from(payments).where(and(
    eq(payments.registrationId, registration.id),
    sql`${payments.paymentStatus} IN ('paid', 'partially_paid', 'partially_refunded', 'refunded')`,
  ));
  const totalVerifiedAmount = priorAmounts.captured - priorAmounts.refunds + paymentEvidence.amount;
  if (paymentEvidence.currency !== 'INR' || totalVerifiedAmount !== expectedAmount || (event.amountPaise !== null && event.amountPaise !== paymentEvidence.amount)) {
    return NextResponse.json({ error: 'Verified payment currency or amount does not match the registration snapshot and webhook.' }, { status: 409 });
  }

  const paymentEmail = paymentEvidence.email?.trim().toLowerCase();
  const paymentPhone = normalizedPhone(paymentEvidence.contact);
  if (!paymentEmail || paymentEmail !== registration.email.trim().toLowerCase() || !paymentPhone || paymentPhone !== normalizedPhone(registration.phone)) {
    return NextResponse.json({ error: 'Verified Razorpay payer details do not match this registration.' }, { status: 409 });
  }

  const alreadyAssociated = await db.select({ id: payments.id }).from(payments)
    .where(eq(payments.razorpayPaymentId, paymentId)).limit(1);
  if (alreadyAssociated.length > 0) {
    return NextResponse.json({ error: 'This Razorpay payment is already associated with a registration.' }, { status: 409 });
  }

  try {
    await db.transaction(async (tx) => {
      const [existingPayment] = await tx.select().from(payments)
        .where(eq(payments.razorpayPaymentId, paymentId)).limit(1);
      if (existingPayment) throw new Error('Razorpay payment is already associated.');

      const [claimedRegistration] = await tx.update(registrations).set({
        paymentStatus: 'paid',
        amountPaidPaise: totalVerifiedAmount,
        razorpayPaymentId: paymentId,
        paymentLinkId: event.paymentLinkId,
        paymentReconciliationStatus: 'matched',
        paymentCompletedAt: new Date(),
        updatedAt: new Date(),
      }).where(and(
        eq(registrations.id, registration.id),
        eq(registrations.amountPaidPaise, registration.amountPaidPaise),
        or(eq(registrations.paymentStatus, 'pending'), eq(registrations.paymentStatus, 'partially_paid'), eq(registrations.paymentStatus, 'failed')),
      )).returning({ id: registrations.id });
      if (!claimedRegistration) throw new Error('Registration state changed; reload and review again.');

      const [reconciledEvent] = await tx.update(paymentWebhookEvents).set({
        registrationId: registration.id,
        reconciliationStatus: 'manual',
        reconciliationReason: reason,
        reconciledBy: session.user.id,
        reconciledAt: new Date(),
      }).where(and(eq(paymentWebhookEvents.id, event.id), eq(paymentWebhookEvents.reconciliationStatus, 'unresolved'))).returning({ id: paymentWebhookEvents.id });
      if (!reconciledEvent) throw new Error('Webhook event was reconciled by another administrator.');

      await tx.insert(payments).values({
        registrationId: registration.id,
        provider: 'razorpay',
        paymentLinkId: event.paymentLinkId,
        razorpayPaymentId: paymentId,
        amount: (paymentEvidence.amount / 100).toFixed(2),
        amountPaise: paymentEvidence.amount,
        currency: paymentEvidence.currency,
        paymentStatus: 'paid',
        webhookEventId: event.webhookEventId,
        rawWebhookData: event.rawEvent,
        paymentCreatedAt: new Date(),
        paymentCompletedAt: new Date(),
      });

      await tx.update(payments).set({ paymentStatus: 'paid', updatedAt: new Date() }).where(and(
        eq(payments.registrationId, registration.id),
        eq(payments.paymentStatus, 'partially_paid'),
      ));

      await tx.insert(auditLogs).values({
        adminId: session.user.id,
        registrationId: registration.id,
        action: 'payment_manually_reconciled',
        entityType: 'payment_webhook_event',
        entityId: event.id,
        oldValues: { paymentStatus: registration.paymentStatus, reconciliationStatus: event.reconciliationStatus },
        newValues: { paymentStatus: 'paid', paymentId, amountPaise: paymentEvidence.amount },
        reason,
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
        userAgent: request.headers.get('user-agent'),
      });
    });
  } catch (error) {
    console.error('Payment reconciliation failed:', error);
    return NextResponse.json({ error: 'Could not reconcile this event.' }, { status: 409 });
  }

  return NextResponse.json({ status: 'reconciled' });
}
