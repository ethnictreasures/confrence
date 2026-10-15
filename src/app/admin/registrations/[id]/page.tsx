import { redirect } from 'next/navigation';
import { auth, isAdminRole } from '@/lib/auth';
import { db } from '@/db';
import { registrations, auditLogs } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Download, CheckCircle, XCircle, Clock, FileText } from 'lucide-react';
import Link from 'next/link';

async function getRegistration(id: string) {
  const [registration] = await db
    .select()
    .from(registrations)
    .where(eq(registrations.id, id))
    .limit(1);

  return registration;
}

async function getAuditLogs(registrationId: string) {
  return db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.registrationId, registrationId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(20);
}

export default async function RegistrationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();

  if (!session || !isAdminRole(session.user.role)) {
    redirect('/admin/login');
  }

  const registration = await getRegistration(params.id);
  const auditLogs = await getAuditLogs(params.id);

  if (!registration) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Registration Not Found</h1>
          <Link href="/admin/registrations">
            <Button>Back to Registrations</Button>
          </Link>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string, badgeType: 'payment' | 'verification') => {
    const badges = {
      payment: {
        paid: 'bg-green-100 text-green-800',
        pending: 'bg-yellow-100 text-yellow-800',
        failed: 'bg-red-100 text-red-800',
        expired: 'bg-gray-100 text-gray-800',
        refunded: 'bg-blue-100 text-blue-800',
      },
      verification: {
        approved: 'bg-green-100 text-green-800',
        pending: 'bg-yellow-100 text-yellow-800',
        rejected: 'bg-red-100 text-red-800',
        additional_info_required: 'bg-orange-100 text-orange-800',
      },
    };

    return badges[badgeType][status as keyof typeof badges[typeof badgeType]] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-200 bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/registrations">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {registration.registrationNumber}
                </h1>
                <p className="text-sm text-gray-600">{registration.fullName}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(
                  registration.verificationStatus,
                  'verification'
                )}`}
              >
                {registration.verificationStatus.replace('_', ' ')}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(
                  registration.paymentStatus,
                  'payment'
                )}`}
              >
                {registration.paymentStatus}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Participant Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-600">Full Name</Label>
                    <p className="font-medium">{registration.fullName}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Email</Label>
                    <p className="font-medium">{registration.email}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Phone</Label>
                    <p className="font-medium">{registration.phone}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Registration Type</Label>
                    <p className="font-medium capitalize">
                      {registration.registrationType.replace('_', ' ')}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Country</Label>
                    <p className="font-medium">{registration.country}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">State</Label>
                    <p className="font-medium">{registration.state}</p>
                  </div>
                </div>

                {registration.registrationType === 'student' && (
                  <div className="border-t pt-4 mt-4">
                    <h3 className="font-semibold mb-3 text-gray-900">Academic Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm text-gray-600">College/University</Label>
                        <p className="font-medium">{registration.collegeName}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-600">Degree Program</Label>
                        <p className="font-medium">{registration.degreeProgram}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-600">Department</Label>
                        <p className="font-medium">{registration.department}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-600">Current Year</Label>
                        <p className="font-medium">{registration.currentYear}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-600">Expected Graduation</Label>
                        <p className="font-medium">{registration.expectedGraduationYear}</p>
                      </div>
                    </div>
                  </div>
                )}

                {registration.registrationType === 'industry_professional' && (
                  <div className="border-t pt-4 mt-4">
                    <h3 className="font-semibold mb-3 text-gray-900">Professional Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm text-gray-600">Job Title</Label>
                        <p className="font-medium">{registration.jobTitle}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-600">Company</Label>
                        <p className="font-medium">{registration.companyName}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-600">Industry Type</Label>
                        <p className="font-medium">{registration.industryType}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-600">Department</Label>
                        <p className="font-medium">{registration.department}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-600">Years of Experience</Label>
                        <p className="font-medium">{registration.yearsOfExperience}</p>
                      </div>
                    </div>
                  </div>
                )}

                {registration.registrationType === 'other' && (
                  <div className="border-t pt-4 mt-4">
                    <h3 className="font-semibold mb-3 text-gray-900">Participant Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm text-gray-600">Category</Label>
                        <p className="font-medium">{registration.participantCategory}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-600">Occupation</Label>
                        <p className="font-medium">{registration.occupation}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-600">Organization</Label>
                        <p className="font-medium">{registration.organizationName || '-'}</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Label className="text-sm text-gray-600">Purpose of Attending</Label>
                      <p className="font-medium">{registration.purposeOfAttending}</p>
                    </div>
                  </div>
                )}

                {registration.additionalInfo && (
                  <div className="border-t pt-4 mt-4">
                    <Label className="text-sm text-gray-600">Additional Information</Label>
                    <p className="font-medium">{registration.additionalInfo}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Document</CardTitle>
              </CardHeader>
              <CardContent>
                {registration.documentObjectKey ? (
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-8 h-8 text-gray-400" />
                      <div>
                        <p className="font-medium">{registration.documentOriginalName}</p>
                        <p className="text-sm text-gray-600">
                          {registration.documentMimeType} • {registration.documentSize ? (registration.documentSize / 1024).toFixed(2) : '0'} KB
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                ) : (
                  <p className="text-gray-500">No document uploaded</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-sm text-gray-600">Amount</Label>
                  <p className="font-semibold text-lg">
                    {registration.paymentAmount
                      ? `₹${Number(registration.paymentAmount).toLocaleString()}`
                      : '-'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Payment Status</Label>
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                      registration.paymentStatus,
                      'payment'
                    )}`}
                  >
                    {registration.paymentStatus}
                  </span>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Payment ID</Label>
                  <p className="font-medium">{registration.razorpayPaymentId || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Payment Link ID</Label>
                  <p className="font-medium">{registration.paymentLinkId || '-'}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Verification Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" variant="default">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </Button>
                <Button className="w-full" variant="destructive">
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
                <Button className="w-full" variant="outline">
                  <Clock className="w-4 h-4 mr-2" />
                  Request Additional Info
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Registration Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <Label className="text-gray-600">Registration Number</Label>
                  <p className="font-medium">{registration.registrationNumber}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Registered On</Label>
                  <p className="font-medium">
                    {registration.createdAt ? new Date(registration.createdAt).toLocaleString() : '-'}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-600">Last Updated</Label>
                  <p className="font-medium">
                    {registration.updatedAt ? new Date(registration.updatedAt).toLocaleString() : '-'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Audit History</CardTitle>
              </CardHeader>
              <CardContent>
                {auditLogs.length > 0 ? (
                  <div className="space-y-3">
                    {auditLogs.map((log) => (
                      <div key={log.id} className="text-sm border-b pb-2 last:border-0">
                        <p className="font-medium">{log.action}</p>
                        <p className="text-gray-600 text-xs">
                          {log.createdAt ? new Date(log.createdAt).toLocaleString() : '-'}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No audit history</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
