import { redirect } from 'next/navigation';
import Link from 'next/link';
import { and, eq, or, sql } from 'drizzle-orm';
import { auth, isAdminRole } from '@/lib/auth';
import { db } from '@/db';
import { paymentWebhookEvents, registrations } from '@/db/schema';
import { Button } from '@/components/ui/button';
import ReconciliationForm from './ReconciliationForm';

function normalizePhone(value: string | null): string | null {
  if (!value) return null;
  const digits = value.replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : null;
}

export default async function PaymentReconciliationPage() {
  const session = await auth();
  if (!session || !isAdminRole(session.user.role)) redirect('/admin/login');

  const events = await db.select().from(paymentWebhookEvents)
    .where(eq(paymentWebhookEvents.reconciliationStatus, 'unresolved'))
    .orderBy(paymentWebhookEvents.createdAt);

  const eventViews = await Promise.all(events.map(async (event) => {
    const linkType = event.paymentLinkId === process.env.STUDENT_RAZORPAY_PAYMENT_LINK_ID
      ? 'student' as const
      : event.paymentLinkId === process.env.PROFESSIONAL_RAZORPAY_PAYMENT_LINK_ID
        ? 'industry_professional' as const
        : null;
    const candidates = event.payerEmail && event.payerPhone && linkType
      ? await db.select({
          id: registrations.id,
          registrationNumber: registrations.registrationNumber,
          fullName: registrations.fullName,
          email: registrations.email,
          phone: registrations.phone,
          totalAmountPaise: registrations.totalAmountPaise,
        }).from(registrations).where(and(
          sql`lower(${registrations.email}) = ${event.payerEmail}`,
          or(eq(registrations.paymentStatus, 'pending'), eq(registrations.paymentStatus, 'partially_paid'), eq(registrations.paymentStatus, 'failed')),
          or(eq(registrations.paymentReconciliationStatus, 'pending'), eq(registrations.paymentReconciliationStatus, 'matched')),
          eq(registrations.registrationType, linkType),
        ))
      : [];
    const normalizedCandidates = candidates.filter((candidate) =>
      normalizePhone(candidate.phone) === normalizePhone(event.payerPhone) &&
      (event.amountPaise === null || candidate.totalAmountPaise !== null && event.amountPaise <= candidate.totalAmountPaise)
    );
    return { event, candidates: normalizedCandidates };
  }));

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">Payments</p>
            <h1 className="text-xl font-semibold text-gray-900">Requires reconciliation</h1>
          </div>
          <Link href="/admin/dashboard"><Button variant="outline">Back to Dashboard</Button></Link>
        </div>
      </header>
      <div className="mx-auto max-w-7xl space-y-4 px-4 py-8">
        <p className="max-w-4xl text-sm leading-6 text-gray-600">Shared Razorpay Payment Links do not identify an application registration by themselves. Each selected event is re-verified against Razorpay’s payment API and must match the category, exact INR snapshot, payer email and phone. Reconciliation requires a reason and creates an audit entry.</p>
        {eventViews.length === 0 ? (
          <p className="border-y border-gray-200 bg-white px-5 py-8 text-sm text-gray-600">No unresolved payment events.</p>
        ) : eventViews.map(({ event, candidates }) => (
          <section key={event.id} className="border border-gray-200 bg-white p-5">
            <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <div><p className="text-xs text-gray-500">Event</p><p className="font-medium">{event.eventType}</p></div>
              <div><p className="text-xs text-gray-500">Received</p><p>{event.createdAt?.toLocaleString() ?? 'Unknown'}</p></div>
              <div><p className="text-xs text-gray-500">Payment ID</p><p className="break-all font-mono text-xs">{event.razorpayPaymentId ?? 'Unavailable'}</p></div>
              <div><p className="text-xs text-gray-500">Amount / currency</p><p>{event.amountPaise === null ? 'Unknown' : `₹${(event.amountPaise / 100).toLocaleString('en-IN')}`} {event.currency ?? ''}</p></div>
              <div><p className="text-xs text-gray-500">Payment Link ID</p><p className="break-all font-mono text-xs">{event.paymentLinkId ?? 'Unavailable'}</p></div>
              <div><p className="text-xs text-gray-500">Verified payer email</p><p>{event.payerEmail ?? 'Unavailable'}</p></div>
              <div><p className="text-xs text-gray-500">Verified payer phone</p><p>{event.payerPhone ?? 'Unavailable'}</p></div>
              <div><p className="text-xs text-gray-500">Reason</p><p>{event.reconciliationReason ?? 'No reason stored'}</p></div>
            </div>
            <ReconciliationForm eventId={event.id} candidates={candidates} />
          </section>
        ))}
      </div>
    </main>
  );
}
