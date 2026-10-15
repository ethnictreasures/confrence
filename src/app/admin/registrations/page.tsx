import { redirect } from 'next/navigation';
import { auth, isAdminRole } from '@/lib/auth';
import { db } from '@/db';
import { registrations } from '@/db/schema';
import { like, or, eq, and, desc, gte, lte } from 'drizzle-orm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Filter, Download } from 'lucide-react';
import Link from 'next/link';

type RegistrationFilters = {
  search?: string;
  type?: string;
  paymentStatus?: string;
  verificationStatus?: string;
  dateFrom?: string;
  dateTo?: string;
};

async function getRegistrations(searchParams: RegistrationFilters) {
  const { search, type, paymentStatus, verificationStatus, dateFrom, dateTo } = searchParams;

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

  const validPaymentStatuses = ['pending', 'paid', 'partially_paid', 'failed', 'expired', 'cancelled', 'partially_refunded', 'refunded', 'requires_reconciliation'] as const;
  if (paymentStatus && validPaymentStatuses.includes(paymentStatus as (typeof validPaymentStatuses)[number])) {
    conditions.push(eq(registrations.paymentStatus, paymentStatus as (typeof validPaymentStatuses)[number]));
  }

  const validVerificationStatuses = ['pending', 'approved', 'rejected', 'additional_info_required'] as const;
  if (verificationStatus && validVerificationStatuses.includes(verificationStatus as (typeof validVerificationStatuses)[number])) {
    conditions.push(eq(registrations.verificationStatus, verificationStatus as (typeof validVerificationStatuses)[number]));
  }

  const validRegistrationTypes = ['student', 'industry_professional', 'other'] as const;
  if (type && validRegistrationTypes.includes(type as (typeof validRegistrationTypes)[number])) {
    conditions.push(eq(registrations.registrationType, type as (typeof validRegistrationTypes)[number]));
  }

  if (dateFrom && /^\d{4}-\d{2}-\d{2}$/.test(dateFrom)) {
    conditions.push(gte(registrations.createdAt, new Date(`${dateFrom}T00:00:00.000Z`)));
  }
  if (dateTo && /^\d{4}-\d{2}-\d{2}$/.test(dateTo)) {
    conditions.push(lte(registrations.createdAt, new Date(`${dateTo}T23:59:59.999Z`)));
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
  searchParams: Promise<RegistrationFilters>;
}) {
  const session = await auth();

  if (!session || !isAdminRole(session.user.role)) {
    redirect('/admin/login');
  }

  const filters = await searchParams;
  const registrations = await getRegistrations(filters);
  const exportQuery = new URLSearchParams(
    Object.entries(filters).flatMap(([key, value]) => typeof value === 'string' && value ? [[key, value]] : [])
  ).toString();

  const getStatusBadge = (status: string, badgeType: 'payment' | 'verification') => {
    const badges = {
      payment: {
        paid: 'bg-green-100 text-green-800',
        pending: 'bg-yellow-100 text-yellow-800',
        partially_paid: 'bg-amber-100 text-amber-800',
        failed: 'bg-red-100 text-red-800',
        expired: 'bg-gray-100 text-gray-800',
        cancelled: 'bg-gray-100 text-gray-800',
        refunded: 'bg-blue-100 text-blue-800',
        partially_refunded: 'bg-blue-100 text-blue-800',
        requires_reconciliation: 'bg-orange-100 text-orange-800',
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
              <Button variant="outline" size="sm" asChild>
                <a href={`/api/admin/registrations/export${exportQuery ? `?${exportQuery}` : ''}`}>
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </a>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form method="get" className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
              <label className="relative lg:col-span-2">
                <span className="sr-only">Search registrations</span>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input name="search" placeholder="Name, email, phone, registration #" className="pl-10" defaultValue={filters.search} />
              </label>
              <label className="sr-only" htmlFor="filter-type">Category</label>
              <select id="filter-type" name="type" defaultValue={filters.type ?? ''} className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm">
                <option value="">All categories</option><option value="student">Student</option><option value="industry_professional">Industry Professional</option><option value="other">Historical Other</option>
              </select>
              <label className="sr-only" htmlFor="filter-payment">Payment status</label>
              <select id="filter-payment" name="paymentStatus" defaultValue={filters.paymentStatus ?? ''} className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm">
                <option value="">All payment statuses</option><option value="pending">Pending</option><option value="paid">Paid</option><option value="partially_paid">Partially Paid</option><option value="failed">Failed</option><option value="expired">Expired</option><option value="cancelled">Cancelled</option><option value="partially_refunded">Partially Refunded</option><option value="refunded">Refunded</option><option value="requires_reconciliation">Requires Reconciliation</option>
              </select>
              <label className="sr-only" htmlFor="filter-verification">Verification status</label>
              <select id="filter-verification" name="verificationStatus" defaultValue={filters.verificationStatus ?? ''} className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm">
                <option value="">All verification statuses</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="additional_info_required">Additional info required</option>
              </select>
              <label className="sr-only" htmlFor="filter-from">Registration date from</label>
              <Input id="filter-from" type="date" name="dateFrom" defaultValue={filters.dateFrom} aria-label="Registration date from" />
              <label className="sr-only" htmlFor="filter-to">Registration date to</label>
              <Input id="filter-to" type="date" name="dateTo" defaultValue={filters.dateTo} aria-label="Registration date to" />
              <Button type="submit" variant="outline" className="lg:col-span-6"><Filter className="mr-2 h-4 w-4" />Apply filters</Button>
            </form>

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
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Base fee</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">GST</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Total</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Payment reference</th>
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
                        {registration.collegeName || registration.companyName || registration.organizationName || '-'}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {registration.createdAt ? new Date(registration.createdAt).toLocaleDateString() : '-'}
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
                          {registration.paymentStatus.replaceAll('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm">{registration.baseFeePaise === null ? '-' : `₹${(registration.baseFeePaise / 100).toLocaleString('en-IN')}`}</td>
                      <td className="py-3 px-4 text-sm">{registration.gstAmountPaise === null ? '-' : `₹${(registration.gstAmountPaise / 100).toLocaleString('en-IN')}`}</td>
                      <td className="py-3 px-4 text-sm font-medium">{registration.totalAmountPaise === null ? (registration.paymentAmount ? `₹${Number(registration.paymentAmount).toLocaleString('en-IN')}` : '-') : `₹${(registration.totalAmountPaise / 100).toLocaleString('en-IN')}`}</td>
                      <td className="py-3 px-4 text-xs font-mono">{registration.razorpayPaymentId || '-'}</td>
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
