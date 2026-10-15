import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Clock, RefreshCw, Download } from 'lucide-react';
import Link from 'next/link';

async function getRegistration(id: string) {
  try {
    const { db } = await import('@/db');
    const { registrations } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');

    const [registration] = await db
      .select()
      .from(registrations)
      .where(eq(registrations.id, id));

    return registration;
  } catch (error) {
    console.error('Error fetching registration:', error);
    return null;
  }
}

export default async function ConfirmPage({ params }: { params: { id: string } }) {
  const registration = await getRegistration(params.id);

  if (!registration) {
    notFound();
  }

  const isPaid = registration.paymentStatus === 'paid';
  const isVerified = registration.verificationStatus === 'approved';

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6">
            ← Back to Home
          </Link>

          <Card>
            <CardHeader>
              <div className={`flex items-center gap-3 mb-4 ${isPaid ? 'text-green-600' : 'text-yellow-600'}`}>
                {isPaid ? (
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Clock className="w-6 h-6" />
                  </div>
                )}
                <div>
                  <CardTitle>
                    {isPaid ? 'Payment Confirmed' : 'Payment Pending'}
                  </CardTitle>
                  <CardDescription>
                    {isPaid
                      ? 'Your payment has been successfully processed'
                      : 'Payment is pending or being processed'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Registration Summary</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Registration Number:</span>
                    <span className="font-medium">{registration.registrationNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Participant Name:</span>
                    <span className="font-medium">{registration.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium">{registration.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Category:</span>
                    <span className="font-medium capitalize">
                      {registration.registrationType.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount Paid:</span>
                    <span className="font-semibold">
                      {registration.paymentAmount
                        ? `₹${Number(registration.paymentAmount).toLocaleString()}`
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Reference:</span>
                    <span className="font-medium">
                      {registration.razorpayPaymentId || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Status:</span>
                    <span className={`font-medium capitalize ${
                      registration.paymentStatus === 'paid' ? 'text-green-600' :
                      registration.paymentStatus === 'failed' ? 'text-red-600' :
                      'text-yellow-600'
                    }`}>
                      {registration.paymentStatus.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Document Verification:</span>
                    <span className={`font-medium capitalize ${
                      registration.verificationStatus === 'approved' ? 'text-green-600' :
                      registration.verificationStatus === 'rejected' ? 'text-red-600' :
                      'text-yellow-600'
                    }`}>
                      {registration.verificationStatus.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>

              {!isPaid && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-900 mb-2">Payment Not Complete</h3>
                  <p className="text-sm text-gray-700 mb-4">
                    Your payment has not been completed yet. Please complete the payment to finalize your registration.
                  </p>
                  <Link href={`/register/payment/${registration.id}`}>
                    <Button className="w-full" asChild>
                      <a>Complete Payment</a>
                    </Button>
                  </Link>
                </div>
              )}

              {isPaid && !isVerified && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">Document Verification Pending</h3>
                  <p className="text-sm text-gray-700">
                    Your payment is confirmed, but your document is still under review. You will receive an email once verification is complete.
                  </p>
                </div>
              )}

              {isPaid && isVerified && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 mb-2">Registration Complete</h3>
                  <p className="text-sm text-gray-700 mb-4">
                    Congratulations! Your registration is complete and verified. You are all set to attend the conference.
                  </p>
                  <Button className="w-full" variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Download Receipt
                  </Button>
                </div>
              )}

              <div className="flex gap-4">
                <Link href={`/register/payment/${registration.id}`} className="flex-1">
                  <Button variant="outline" className="w-full">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh Status
                  </Button>
                </Link>
                <Link href="/" className="flex-1">
                  <Button variant="outline" className="w-full">
                    Back to Home
                  </Button>
                </Link>
              </div>

              <div className="text-center text-sm text-gray-500">
                <p>For assistance, contact us at support@techconference2025.com</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
