import { NextRequest, NextResponse } from 'next/server';
import { generateObjectKey, generatePresignedUploadUrl } from '@/lib/r2';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contentType, size } = body as { contentType?: unknown; size?: unknown };

    if (typeof contentType !== 'string' || typeof size !== 'number' || !Number.isInteger(size) || size <= 0 || size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'A valid content type and file size up to 5MB are required' },
        { status: 400 }
      );
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(contentType)) {
      return NextResponse.json(
        { error: 'Invalid file type' },
        { status: 400 }
      );
    }

    const objectKey = generateObjectKey();
    const uploadUrl = await generatePresignedUploadUrl(objectKey, contentType, size);

    return NextResponse.json({ uploadUrl, objectKey });
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}
