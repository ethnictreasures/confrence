import { NextRequest, NextResponse } from 'next/server';
import { generatePresignedUploadUrl } from '@/lib/r2';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { objectKey, contentType } = body;

    if (!objectKey || !contentType) {
      return NextResponse.json(
        { error: 'objectKey and contentType are required' },
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

    const uploadUrl = await generatePresignedUploadUrl(objectKey, contentType);

    return NextResponse.json({ uploadUrl });
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}
