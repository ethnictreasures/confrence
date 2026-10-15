import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth, isAdminRole } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CONFERENCE, REGISTRATION_PRICING } from '@/config/conference';
import { ArrowLeft } from 'lucide-react';

const inr = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN')}`;

export default async function AdminSettingsPage() {
  const session = await auth();
  if (!session || !isAdminRole(session.user.role)) redirect('/admin/login');

  const linksConfigured = Boolean(
    process.env.STUDENT_RAZORPAY_PAYMENT_LINK_ID &&
    process.env.STUDENT_RAZORPAY_PAYMENT_LINK_URL &&
    process.env.PROFESSIONAL_RAZORPAY_PAYMENT_LINK_ID &&
    process.env.PROFESSIONAL_RAZORPAY_PAYMENT_LINK_URL
  );

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div><p className="text-sm text-gray-600">Conference administration</p><h1 className="text-2xl font-bold text-gray-900">Configuration</h1></div>
          <Link href="/admin/dashboard"><Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" />Dashboard</Button></Link>
        </div>
      </header>
      <div className="container mx-auto grid max-w-5xl gap-6 px-4 py-8 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Conference</CardTitle><CardDescription>Public event details configured in application settings.</CardDescription></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p><span className="font-medium">Organizer:</span> {CONFERENCE.organizer}</p>
            <p><span className="font-medium">Initiative:</span> {CONFERENCE.initiative}</p>
            <p><span className="font-medium">Programme:</span> {CONFERENCE.programme}</p>
            <p><span className="font-medium">Title:</span> {CONFERENCE.title}</p>
            <p><span className="font-medium">Dates:</span> {CONFERENCE.dates}</p>
            <p><span className="font-medium">Format:</span> Virtual</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Registration pricing</CardTitle><CardDescription>Authoritative server-side amounts. Confirm GST treatment with the organizer’s accountant.</CardDescription></CardHeader>
          <CardContent className="space-y-4 text-sm">
            {Object.entries(REGISTRATION_PRICING).map(([type, pricing]) => (
              <div key={type} className="border-b border-gray-100 pb-3 last:border-0">
                <p className="font-semibold">{type === 'student' ? 'Student' : 'Industry Professional'}</p>
                <p className="mt-1 text-gray-600">Base {inr(pricing.baseFeePaise)} · GST ({pricing.gstRate}%) {inr(pricing.gstAmountPaise)} · Total {inr(pricing.totalAmountPaise)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader><CardTitle>Razorpay Payment Links</CardTitle><CardDescription>Link IDs and URLs are server-only environment variables and are never displayed here.</CardDescription></CardHeader>
          <CardContent>
            <p role="status" className={linksConfigured ? 'text-sm text-green-800' : 'text-sm text-amber-800'}>
              {linksConfigured ? 'Both category link configurations are present. Each link is fetched and validated against its configured amount before use.' : 'Payment links are not fully configured. Payments remain unavailable until both category link IDs and URLs are set.'}
            </p>
            <p className="mt-3 text-xs text-gray-500">Set STUDENT_RAZORPAY_PAYMENT_LINK_ID/URL and PROFESSIONAL_RAZORPAY_PAYMENT_LINK_ID/URL in the server environment.</p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
