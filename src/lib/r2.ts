import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';

function getR2Client() {
  if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY || !process.env.R2_BUCKET_NAME) {
    throw new Error('R2 environment variables are not set');
  }
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
}

function getBucketName() {
  if (!process.env.R2_BUCKET_NAME) {
    throw new Error('R2_BUCKET_NAME environment variable is not set');
  }
  return process.env.R2_BUCKET_NAME;
}

export async function generatePresignedUploadUrl(
  objectKey: string,
  contentType: string,
  expiresIn: number = 900
): Promise<string> {
  const r2Client = getR2Client();
  const BUCKET_NAME = getBucketName();
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: objectKey,
    ContentType: contentType,
  });

  return await getSignedUrl(r2Client, command, { expiresIn });
}

export async function generatePresignedDownloadUrl(
  objectKey: string,
  expiresIn: number = 900
): Promise<string> {
  const r2Client = getR2Client();
  const BUCKET_NAME = getBucketName();
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: objectKey,
  });

  return await getSignedUrl(r2Client, command, { expiresIn });
}

export function generateObjectKey(): string {
  return randomUUID();
}

export function validateFileMetadata(file: File): { valid: boolean; error?: string } {
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Only JPEG, PNG, and PDF files are allowed' };
  }

  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 5MB' };
  }

  return { valid: true };
}
