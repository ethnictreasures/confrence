import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { auth, isAdminRole } from '@/lib/auth';
import { db } from '@/db';
import { registrations } from '@/db/schema';
import { generatePresignedDownloadUrl } from '@/lib/r2';

export async function GET(_request: NextRequest, context: RouteContext<'/api/admin/registrations/[id]/document'>) {
  const session = await auth();
  if (!session || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  const [registration] = await db.select({ objectKey: registrations.documentObjectKey })
    .from(registrations).where(eq(registrations.id, id)).limit(1);
  if (!registration?.objectKey) return NextResponse.json({ error: 'Document not found' }, { status: 404 });

  const downloadUrl = await generatePresignedDownloadUrl(registration.objectKey, 60);
  return NextResponse.redirect(downloadUrl, { headers: { 'Cache-Control': 'no-store, private' } });
}
