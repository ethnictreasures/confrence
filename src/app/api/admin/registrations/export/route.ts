import { NextRequest, NextResponse } from 'next/server';
import { and, desc, eq, gte, like, lte, or } from 'drizzle-orm';
import { auth, isAdminRole } from '@/lib/auth';
import { db } from '@/db';
import { registrations } from '@/db/schema';

const paymentStatuses = ['pending', 'paid', 'partially_paid', 'failed', 'expired', 'cancelled', 'partially_refunded', 'refunded', 'requires_reconciliation'] as const;
const verificationStatuses = ['pending', 'approved', 'rejected', 'additional_info_required'] as const;
const registrationTypes = ['student', 'industry_professional', 'other'] as const;

function csvCell(value: string | number | null | undefined): string {
  const text = String(value ?? '');
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session || !isAdminRole(session.user.role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const params = request.nextUrl.searchParams;
  const conditions = [];
  const search = params.get('search');
  const type = params.get('type');
  const paymentStatus = params.get('paymentStatus');
  const verificationStatus = params.get('verificationStatus');
  const dateFrom = params.get('dateFrom');
  const dateTo = params.get('dateTo');

  if (search) conditions.push(or(
    like(registrations.fullName, `%${search}%`),
    like(registrations.email, `%${search}%`),
    like(registrations.phone, `%${search}%`),
    like(registrations.registrationNumber, `%${search}%`),
  ));
  if (type && registrationTypes.includes(type as (typeof registrationTypes)[number])) conditions.push(eq(registrations.registrationType, type as (typeof registrationTypes)[number]));
  if (paymentStatus && paymentStatuses.includes(paymentStatus as (typeof paymentStatuses)[number])) conditions.push(eq(registrations.paymentStatus, paymentStatus as (typeof paymentStatuses)[number]));
  if (verificationStatus && verificationStatuses.includes(verificationStatus as (typeof verificationStatuses)[number])) conditions.push(eq(registrations.verificationStatus, verificationStatus as (typeof verificationStatuses)[number]));
  if (dateFrom && /^\d{4}-\d{2}-\d{2}$/.test(dateFrom)) conditions.push(gte(registrations.createdAt, new Date(`${dateFrom}T00:00:00.000Z`)));
  if (dateTo && /^\d{4}-\d{2}-\d{2}$/.test(dateTo)) conditions.push(lte(registrations.createdAt, new Date(`${dateTo}T23:59:59.999Z`)));

  const rows = await db.select().from(registrations)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(registrations.createdAt))
    .limit(10000);

  const headers = ['registration_number', 'category', 'name', 'email', 'phone', 'college_or_company', 'created_at', 'verification_status', 'payment_status', 'base_fee_paise', 'gst_rate', 'gst_amount_paise', 'total_amount_paise', 'razorpay_payment_id'];
  const lines = rows.map((row) => [
    row.registrationNumber,
    row.registrationType,
    row.fullName,
    row.email,
    row.phone,
    row.collegeName ?? row.companyName ?? row.organizationName,
    row.createdAt?.toISOString(),
    row.verificationStatus,
    row.paymentStatus,
    row.baseFeePaise,
    row.gstRate,
    row.gstAmountPaise,
    row.totalAmountPaise,
    row.razorpayPaymentId,
  ].map(csvCell).join(','));

  return new NextResponse([headers.join(','), ...lines].join('\r\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="conference-registrations.csv"',
      'Cache-Control': 'no-store, private',
    },
  });
}
