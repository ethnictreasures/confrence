import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Loader2, ExternalLink } from 'lucide-react';
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

export default async function PaymentPage({ params }: { params: { id: string } }) {
  const registration = await getRegistration(params.id);

  if (!registration) {
    notFound();
  }

  const feeAmounts: Record<string, number> = {
    student: 1500,
    industry_professional: 3000,
    other: 2000,
  };

  const amount = feeAmounts[registration.registrationType] || 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6">
            ← Back to Home
          </Link>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <CardTitle>Registration Submitted Successfully</CardTitle>
                  <CardDescription>
                    Your registration has been received and is pending verification
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Registration Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Registration Number:</span>
                    <span className="font-medium">{registration.registrationNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
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
                    <span className="text-gray-600">Registration Fee:</span>
                    <span className="font-semibold text-lg">₹{amount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-900 mb-2">Next Steps</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                  <li>Complete the payment using the link below</li>
                  <li>Your document will be reviewed by our team</li>
                  <li>You will receive confirmation once verified</li>
                  <li>Bring your registration confirmation to the event</li>
                </ol>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Payment Information</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Click the button below to proceed to the secure payment gateway. You will be redirected to Razorpay to complete your payment.
                </p>
                <Button className="w-full" size="lg" asChild>
                  <a
                    href="https://rzp.io/l/demo"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2"
                  >
                    Pay ₹{amount.toLocaleString()}
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  After payment, return to this page to check your status
                </p>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-2">Check Payment Status</h3>
                <p className="text-sm text-gray-600 mb-4">
                  After completing payment, click below to verify your payment status.
                </p>
                <Link href={`/register/confirm/${registration.id}`}>
                  <Button variant="outline" className="w-full">
                    Check Payment Status
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
