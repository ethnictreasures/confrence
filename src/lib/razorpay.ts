import crypto from 'crypto';
import { z } from 'zod';

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || '';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || '';

export interface PaymentLinkData {
  amount: number;
  currency: string;
  description: string;
  customer?: {
    name: string;
    email: string;
    phone?: string;
  };
  notes?: Record<string, string>;
}

const paymentLinkResponseSchema = z.object({
  id: z.string(),
  short_url: z.string().url(),
  status: z.string(),
});

export type PaymentLinkResponse = z.infer<typeof paymentLinkResponseSchema>;

export async function createPaymentLink(data: PaymentLinkData): Promise<PaymentLinkResponse> {
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay credentials not configured');
  }
  const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');

  const response = await fetch('https://api.razorpay.com/v1/payment_links', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${auth}`,
    },
    body: JSON.stringify({
      amount: data.amount * 100, // Razorpay expects amount in paise
      currency: data.currency,
      description: data.description,
      customer: data.customer,
      notes: data.notes,
      accept_partial: false,
      expire_by: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days expiry
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create payment link: ${error}`);
  }

  return paymentLinkResponseSchema.parse(await response.json());
}

export function verifyWebhookSignature(
  webhookBody: string,
  signature: string,
  secret: string = RAZORPAY_WEBHOOK_SECRET
): boolean {
  if (!secret) {
    throw new Error('Razorpay webhook secret not configured');
  }
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(webhookBody)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(signature)
  );
}

export function getPaymentLinkUrl(linkId: string): string {
  return `https://rzp.io/i/${linkId}`;
}
