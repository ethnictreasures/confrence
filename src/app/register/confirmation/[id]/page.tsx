
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { registrations } from '@/db/schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function ConfirmationPage({
  params,
}: PageProps) {
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

  const isPaid = registration.paymentStatus === 'paid';

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        {isPaid ? (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl text-green-700">
              ✓
            </div>

            <h1 className="mt-5 text-2xl font-bold text-slate-900">
              Payment Successful!
            </h1>

            <p className="mt-3 text-slate-600">
              Your conference registration payment has been
              verified successfully.
            </p>

            <div className="mt-6 rounded-xl bg-slate-50 p-5 text-left">
              <p className="text-sm text-slate-500">
                Registration Number
              </p>
              <p className="mt-1 font-semibold text-slate-900">
                {registration.registrationNumber}
              </p>

              <p className="mt-4 text-sm text-slate-500">
                Name
              </p>
              <p className="mt-1 font-medium text-slate-900">
                {registration.fullName}
              </p>

              <p className="mt-4 text-sm text-slate-500">
                Payment Status
              </p>
              <p className="mt-1 font-semibold text-green-700">
                Paid
              </p>

              {registration.razorpayPaymentId && (
                <>
                  <p className="mt-4 text-sm text-slate-500">
                    Razorpay Payment ID
                  </p>
                  <p className="mt-1 break-all text-sm font-medium text-slate-900">
                    {registration.razorpayPaymentId}
                  </p>
                </>
              )}
            </div>

            <p className="mt-5 text-sm text-slate-600">
              Please save your registration number for future
              reference.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-slate-900">
              Payment Confirmation Pending
            </h1>

            <p className="mt-3 text-slate-600">
              We have not yet recorded this registration as fully
              paid. If your bank or Razorpay shows a successful
              payment, please do not pay again until the status
              has been checked.
            </p>

            <p className="mt-4 text-sm text-slate-500">
              Registration Number:{' '}
              {registration.registrationNumber}
            </p>

            <Link
              href={`/register/payment/${registration.id}`}
              className="mt-6 inline-block rounded-lg bg-blue-700 px-5 py-3 font-medium text-white hover:bg-blue-800"
            >
              Return to Payment Page
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
