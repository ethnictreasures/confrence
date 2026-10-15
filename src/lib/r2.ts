import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';


function getR2Client() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    throw new Error('R2 environment variables are not set');
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    forcePathStyle: true,
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
    credentials: {
      accessKeyId,
      secretAccessKey,
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
  contentLength: number,
  expiresIn: number = 900
): Promise<string> {
  if (
    !Number.isInteger(contentLength) ||
    contentLength <= 0 ||
    contentLength > 5 * 1024 * 1024
  ) {
    throw new Error('Invalid upload size');
  }

  const r2Client = getR2Client();
  const bucketName = getBucketName();

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: objectKey,
    ContentType: contentType,
  });

  return getSignedUrl(r2Client, command, { expiresIn });
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

export async function validateUploadedDocument(
  objectKey: string,
  contentType: string,
  size: number
): Promise<boolean> {
  if (!/^[0-9a-f-]{36}$/i.test(objectKey)) return false;
  const r2Client = getR2Client();
  const bucket = getBucketName();
  const head = await r2Client.send(new HeadObjectCommand({ Bucket: bucket, Key: objectKey }));
  if (head.ContentLength !== size || head.ContentType !== contentType || !head.ContentLength) return false;

  const object = await r2Client.send(new GetObjectCommand({ Bucket: bucket, Key: objectKey, Range: 'bytes=0-7' }));
  const body = await object.Body?.transformToByteArray();
  if (!body) return false;

  if (contentType === 'image/jpeg') return body[0] === 0xff && body[1] === 0xd8 && body[2] === 0xff;
  if (contentType === 'image/png') return body.length >= 8 && body.slice(0, 8).join(',') === '137,80,78,71,13,10,26,10';
  if (contentType === 'application/pdf') return new TextDecoder().decode(body.slice(0, 5)) === '%PDF-';
  return false;
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
