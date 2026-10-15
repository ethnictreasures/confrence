import { redirect } from 'next/navigation';
import { auth, isAdminRole } from '@/lib/auth';
import { db } from '@/db';
import { registrations, payments } from '@/db/schema';
import { eq, and, count, sql } from 'drizzle-orm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, GraduationCap, Briefcase, DollarSign, Clock, CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import Link from 'next/link';

async function getDashboardStats() {
  const [
    totalRegistrations,
    studentRegistrations,
    industryRegistrations,
    otherRegistrations,
    paidRegistrations,
    pendingPayments,
    failedPayments,
    pendingVerifications,
    approvedRegistrations,
    rejectedRegistrations,
    totalRevenue,
  ] = await Promise.all([
    db.select({ count: count() }).from(registrations),
    db.select({ count: count() }).from(registrations).where(eq(registrations.registrationType, 'student')),
    db.select({ count: count() }).from(registrations).where(eq(registrations.registrationType, 'industry_professional')),
    db.select({ count: count() }).from(registrations).where(eq(registrations.registrationType, 'other')),
    db.select({ count: count() }).from(registrations).where(eq(registrations.paymentStatus, 'paid')),
    db.select({ count: count() }).from(registrations).where(eq(registrations.paymentStatus, 'pending')),
    db.select({ count: count() }).from(registrations).where(eq(registrations.paymentStatus, 'failed')),
    db.select({ count: count() }).from(registrations).where(eq(registrations.verificationStatus, 'pending')),
    db.select({ count: count() }).from(registrations).where(eq(registrations.verificationStatus, 'approved')),
    db.select({ count: count() }).from(registrations).where(eq(registrations.verificationStatus, 'rejected')),
    db.select({ total: sql<number>`COALESCE(SUM(${registrations.paymentAmount}), 0)` }).from(registrations).where(eq(registrations.paymentStatus, 'paid')),
  ]);

  return {
    totalRegistrations: totalRegistrations[0]?.count || 0,
    studentRegistrations: studentRegistrations[0]?.count || 0,
    industryRegistrations: industryRegistrations[0]?.count || 0,
    otherRegistrations: otherRegistrations[0]?.count || 0,
    paidRegistrations: paidRegistrations[0]?.count || 0,
    pendingPayments: pendingPayments[0]?.count || 0,
    failedPayments: failedPayments[0]?.count || 0,
    pendingVerifications: pendingVerifications[0]?.count || 0,
    approvedRegistrations: approvedRegistrations[0]?.count || 0,
    rejectedRegistrations: rejectedRegistrations[0]?.count || 0,
    totalRevenue: totalRevenue[0]?.total || 0,
  };
}

export default async function AdminDashboard() {
  const session = await auth();

  if (!session || !isAdminRole(session.user.role)) {
    redirect('/admin/login');
  }

  const stats = await getDashboardStats();

  const statCards = [
    {
      title: 'Total Registrations',
      value: stats.totalRegistrations,
      icon: Users,
      color: 'blue',
    },
    {
      title: 'Student Registrations',
      value: stats.studentRegistrations,
      icon: GraduationCap,
      color: 'green',
    },
    {
      title: 'Industry Registrations',
      value: stats.industryRegistrations,
      icon: Briefcase,
      color: 'purple',
    },
    {
      title: 'Other Registrations',
      value: stats.otherRegistrations,
      icon: Users,
      color: 'orange',
    },
    {
      title: 'Paid Registrations',
      value: stats.paidRegistrations,
      icon: CheckCircle,
      color: 'green',
    },
    {
      title: 'Pending Payments',
      value: stats.pendingPayments,
      icon: Clock,
      color: 'yellow',
    },
    {
      title: 'Failed Payments',
      value: stats.failedPayments,
      icon: XCircle,
      color: 'red',
    },
    {
      title: 'Pending Verifications',
      value: stats.pendingVerifications,
      icon: Clock,
      color: 'yellow',
    },
    {
      title: 'Approved Registrations',
      value: stats.approvedRegistrations,
      icon: CheckCircle,
      color: 'green',
    },
    {
      title: 'Rejected Registrations',
      value: stats.rejectedRegistrations,
      icon: XCircle,
      color: 'red',
    },
    {
      title: 'Total Revenue',
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'green',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-200 bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-600">Welcome, {session.user.name}</p>
            </div>
            <div className="flex gap-4">
              <Link href="/admin/registrations">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  View Registrations
                </button>
              </Link>
              <Link href="/admin/settings">
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  Settings
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {statCards.map((card) => {
            const Icon = card.icon;
            const colorClasses = {
              blue: 'bg-blue-100 text-blue-600',
              green: 'bg-green-100 text-green-600',
              purple: 'bg-purple-100 text-purple-600',
              orange: 'bg-orange-100 text-orange-600',
              yellow: 'bg-yellow-100 text-yellow-600',
              red: 'bg-red-100 text-red-600',
            };

            return (
              <Card key={card.title}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {card.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${colorClasses[card.color as keyof typeof colorClasses]}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">{card.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">Recent registrations and payments will appear here.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/admin/registrations?verificationStatus=pending">
                <button className="w-full text-left px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors">
                  <div className="font-medium text-yellow-900">Review Pending Verifications</div>
                  <div className="text-sm text-yellow-700">{stats.pendingVerifications} pending</div>
                </button>
              </Link>
              <Link href="/admin/registrations?paymentStatus=pending">
                <button className="w-full text-left px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
                  <div className="font-medium text-blue-900">Check Pending Payments</div>
                  <div className="text-sm text-blue-700">{stats.pendingPayments} pending</div>
                </button>
              </Link>
              <Link href="/admin/registrations">
                <button className="w-full text-left px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="font-medium text-gray-900">View All Registrations</div>
                  <div className="text-sm text-gray-700">{stats.totalRegistrations} total</div>
                </button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
