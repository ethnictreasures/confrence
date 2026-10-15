import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { auth, isAdminRole } from '@/lib/auth';
import { db } from '@/db';
import { auditLogs, registrations } from '@/db/schema';

const verificationUpdateSchema = z.object({
  status: z.enum(['approved', 'rejected', 'additional_info_required']),
  reason: z.string().trim().min(5).max(1000),
});

export async function POST(request: NextRequest, context: RouteContext<'/api/admin/registrations/[id]/verification'>) {
  const session = await auth();
  if (!session || !isAdminRole(session.user.role) || !session.user.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = verificationUpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'A valid status and review note are required.' }, { status: 400 });

  const { id } = await context.params;
  const [registration] = await db.select().from(registrations).where(eq(registrations.id, id)).limit(1);
  if (!registration) return NextResponse.json({ error: 'Registration not found' }, { status: 404 });

  await db.transaction(async (tx) => {
    await tx.update(registrations).set({ verificationStatus: parsed.data.status, updatedAt: new Date() }).where(eq(registrations.id, id));
    await tx.insert(auditLogs).values({
      adminId: session.user.id,
      registrationId: id,
      action: `document_${parsed.data.status}`,
      entityType: 'registration',
      entityId: id,
      oldValues: { verificationStatus: registration.verificationStatus },
      newValues: { verificationStatus: parsed.data.status },
      reason: parsed.data.reason,
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
      userAgent: request.headers.get('user-agent'),
    });
  });

  return NextResponse.json({ status: parsed.data.status });
}
