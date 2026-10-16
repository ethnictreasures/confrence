
import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { registrations } from '@/db/schema';
import RazorpayCheckoutButton from './RazorpayCheckoutButton';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function formatINR(amountPaise: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amountPaise / 100);
}

export default async function PaymentPage({ params }: PageProps) {
  const { id } = await params;

  if (!UUID_PATTERN.test(id)) {
    notFound();
  }

  const [registration] = await db
    .select()
    .from(registrations)
    .where(eq(registrations.id, id))
    .limit(1);

  if (!registration) {
    notFound();
  }

  const supportedType =
    registration.registrationType === 'student' ||
    registration.registrationType === 'industry_professional';

  const amountPaise = Number(registration.totalAmountPaise);

  const isPaid = registration.paymentStatus === 'paid';

  const isUnavailable =
    ['cancelled', 'expired', 'refunded', 'partially_refunded'].includes(
      registration.paymentStatus
    );

  const canPay =
    supportedType &&
    !isPaid &&
    !isUnavailable &&
    Number.isSafeInteger(amountPaise) &&
    amountPaise > 0;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
            {/* JUST POLYMER SOLUTIONS */}
          </p>

          <h1 className="mt-3 text-2xl font-bold text-slate-900">
            Conference Registration Payment
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            Conference dates: October 31 – November 1, 2026
          </p>

          <div className="mt-8 space-y-4 border-y border-slate-200 py-5">
            <div className="flex justify-between gap-4">
              <span className="text-slate-600 ">Registration number</span>
              <span className="text-right font-medium text-blue-800">
                {registration.registrationNumber}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-slate-600">Name</span>
              <span className="text-right font-medium text-blue-900 break-all">
                {registration.fullName}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-slate-600">Email</span>
              <span className="break-all text-right font-medium text-blue-900">
                {registration.email}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-slate-600">Registration type</span>
              <span className="text-right font-medium text-blue-900">
                {registration.registrationType === 'student'
                  ? 'Student'
                  : registration.registrationType ===
                      'industry_professional'
                    ? 'Industry Professional'
                    : 'Other'}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-slate-600">Registration fee</span>
              <span className="font-medium text-blue-900">
                {formatINR(Number(registration.baseFeePaise))}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-slate-600">
                GST ({Number(registration.gstRate)}%)
              </span>
              <span className="font-medium text-blue-900">
                {formatINR(Number(registration.gstAmountPaise))}
              </span>
            </div>

            <div className="flex justify-between gap-4 pt-2 text-lg">
              <span className="font-semibold text-slate-900">
                Total payable
              </span>
              <span className="font-bold text-slate-900">
                {formatINR(amountPaise)}
              </span>
            </div>
          </div>

          <div className="mt-6">
            {isPaid ? (
              <p className="rounded-lg bg-green-50 p-4 text-sm font-medium text-green-800">
                Payment has already been recorded for this registration.
              </p>
            ) : isUnavailable ? (
              <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
                This registration cannot currently accept payment. Please contact the organizer.
              </p>
            ) : !supportedType ? (
              <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
                Online payment is not available for this registration type.
              </p>
            ) : !canPay ? (
              <p className="rounded-lg bg-red-50 p-4 text-sm text-red-800">
                The payable amount is invalid. Please contact the organizer.
              </p>
            ) : (
              <RazorpayCheckoutButton
                registrationId={registration.id}
                amountPaise={amountPaise}
                fullName={registration.fullName}
                email={registration.email}
                phone={registration.phone}
              />
            )}
          </div>

          <p className="mt-5 text-center text-xs text-slate-500">
            Your payment is confirmed only after server-side verification.
          </p>
        </div>
      </div>
    </main>
  );
}
