import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

export default async function AdminSettingsPage() {
  const session = await auth();

  if (!session) {
    redirect('/admin/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-200 bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                <p className="text-sm text-gray-600">Configure conference settings</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Conference Information</CardTitle>
              <CardDescription>
                Update conference details and public information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="conferenceName">Conference Name</Label>
                <Input id="conferenceName" defaultValue="Tech Conference 2025" />
              </div>
              <div>
                <Label htmlFor="conferenceSubtitle">Subtitle</Label>
                <Input id="conferenceSubtitle" defaultValue="Innovation, Learning, and Networking" />
              </div>
              <div>
                <Label htmlFor="conferenceDate">Date</Label>
                <Input id="conferenceDate" defaultValue="March 15-17, 2025" />
              </div>
              <div>
                <Label htmlFor="conferenceVenue">Venue</Label>
                <Input id="conferenceVenue" defaultValue="Convention Center, Bangalore" />
              </div>
              <div>
                <Label htmlFor="conferenceDescription">Description</Label>
                <textarea
                  id="conferenceDescription"
                  className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 min-h-[100px]"
                  defaultValue="Join us for three days of inspiring talks, workshops, and networking opportunities with industry leaders and innovators from around the world."
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Registration Fees</CardTitle>
              <CardDescription>
                Set registration fees for each category
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="studentFee">Student Fee (₹)</Label>
                <Input id="studentFee" type="number" defaultValue="1500" />
              </div>
              <div>
                <Label htmlFor="industryFee">Industry Professional Fee (₹)</Label>
                <Input id="industryFee" type="number" defaultValue="3000" />
              </div>
              <div>
                <Label htmlFor="otherFee">Other Participant Fee (₹)</Label>
                <Input id="otherFee" type="number" defaultValue="2000" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Links</CardTitle>
              <CardDescription>
                Configure Razorpay Payment Links for each category
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="studentPaymentLink">Student Payment Link ID</Label>
                <Input id="studentPaymentLink" placeholder="Enter Razorpay Payment Link ID" />
              </div>
              <div>
                <Label htmlFor="industryPaymentLink">Industry Payment Link ID</Label>
                <Input id="industryPaymentLink" placeholder="Enter Razorpay Payment Link ID" />
              </div>
              <div>
                <Label htmlFor="otherPaymentLink">Other Payment Link ID</Label>
                <Input id="otherPaymentLink" placeholder="Enter Razorpay Payment Link ID" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Document Settings</CardTitle>
              <CardDescription>
                Configure document upload requirements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="documentSizeLimit">File Size Limit (MB)</Label>
                <Input id="documentSizeLimit" type="number" defaultValue="5" min="1" max="20" />
              </div>
              <div>
                <Label htmlFor="allowedFileTypes">Allowed File Types</Label>
                <Input
                  id="allowedFileTypes"
                  defaultValue="image/jpeg, image/png, application/pdf"
                  placeholder="Comma-separated MIME types"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Registration Status</CardTitle>
              <CardDescription>
                Control registration availability
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Registration Open</Label>
                  <p className="text-sm text-gray-600">
                    Allow new registrations to be submitted
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Closed</span>
                  <div className="w-12 h-6 bg-blue-600 rounded-full relative cursor-pointer">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                  </div>
                  <span className="text-sm text-gray-600">Open</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button variant="outline">Cancel</Button>
            <Button>
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
