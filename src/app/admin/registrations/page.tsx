import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { registrations } from '@/db/schema';
import { like, or, eq, and, desc } from 'drizzle-orm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Filter, Download } from 'lucide-react';
import Link from 'next/link';

async function getRegistrations(searchParams: { search?: string; status?: string; type?: string }) {
  const { search, status, type } = searchParams;

  const conditions = [];

  if (search) {
    conditions.push(
      or(
        like(registrations.fullName, `%${search}%`),
        like(registrations.email, `%${search}%`),
        like(registrations.phone, `%${search}%`),
        like(registrations.registrationNumber, `%${search}%`)
      )
    );
  }

  if (status) {
    if (status.startsWith('payment_')) {
      conditions.push(eq(registrations.paymentStatus, status.replace('payment_', '')));
    } else if (status.startsWith('verification_')) {
      conditions.push(eq(registrations.verificationStatus, status.replace('verification_', '')));
    }
  }

  if (type) {
    conditions.push(eq(registrations.registrationType, type));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const data = await db
    .select()
    .from(registrations)
    .where(whereClause)
    .orderBy(desc(registrations.createdAt))
    .limit(50);

  return data;
}

export default async function AdminRegistrationsPage({
  searchParams,
}: {
  searchParams: { search?: string; status?: string; type?: string };
}) {
  const session = await auth();

  if (!session) {
    redirect('/admin/login');
  }

  const registrations = await getRegistrations(searchParams);

  const getStatusBadge = (status: string, type: 'payment' | 'verification') => {
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

    return badges[type][status as keyof typeof badges[type]] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-200 bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Registrations</h1>
              <p className="text-sm text-gray-600">Manage and review registrations</p>
            </div>
            <div className="flex gap-4">
              <Link href="/admin/dashboard">
                <Button variant="outline">Back to Dashboard</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Registration List</CardTitle>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search by name, email, phone, or registration number..."
                    className="pl-10"
                    defaultValue={searchParams.search}
                  />
                </div>
              </div>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Reg #</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Name</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Email</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Organization</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Verification</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Payment</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map((registration) => (
                    <tr key={registration.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm font-medium">{registration.registrationNumber}</td>
                      <td className="py-3 px-4 text-sm">{registration.fullName}</td>
                      <td className="py-3 px-4 text-sm">{registration.email}</td>
                      <td className="py-3 px-4 text-sm capitalize">
                        {registration.registrationType.replace('_', ' ')}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {registration.collegeName || registration.companyName || '-'}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {new Date(registration.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                            registration.verificationStatus,
                            'verification'
                          )}`}
                        >
                          {registration.verificationStatus.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                            registration.paymentStatus,
                            'payment'
                          )}`}
                        >
                          {registration.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm font-medium">
                        {registration.paymentAmount
                          ? `₹${Number(registration.paymentAmount).toLocaleString()}`
                          : '-'}
                      </td>
                      <td className="py-3 px-4">
                        <Link href={`/admin/registrations/${registration.id}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {registrations.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  No registrations found
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
