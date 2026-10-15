import crypto from 'crypto';
import { z } from 'zod';
import { REGISTRATION_PRICING, type NewRegistrationType } from '@/config/conference';

const paymentLinkSchema = z.object({
  id: z.string(),
  short_url: z.string().url(),
  status: z.string(),
  amount: z.number().int(),
  currency: z.string(),
  accept_partial: z.boolean(),
});

const razorpayPaymentSchema = z.object({
  id: z.string(),
  amount: z.number().int().nonnegative(),
  currency: z.string(),
  status: z.string(),
  captured: z.boolean(),
  email: z.string().nullable().optional(),
  contact: z.string().nullable().optional(),
  order_id: z.string().nullable().optional(),
});

export type VerifiedRazorpayPayment = z.infer<typeof razorpayPaymentSchema>;

const paymentLinkConfiguration = {
  student: {
    id: 'STUDENT_RAZORPAY_PAYMENT_LINK_ID',
    url: 'STUDENT_RAZORPAY_PAYMENT_LINK_URL',
  },
  industry_professional: {
    id: 'PROFESSIONAL_RAZORPAY_PAYMENT_LINK_ID',
    url: 'PROFESSIONAL_RAZORPAY_PAYMENT_LINK_URL',
  },
} satisfies Record<NewRegistrationType, { id: string; url: string }>;

export function configuredPaymentLinkId(type: NewRegistrationType): string | null {
  const { id } = paymentLinkConfiguration[type];
  return process.env[id] || null;
}

export async function getVerifiedPaymentLink(type: NewRegistrationType): Promise<string | null> {
  const { id: idVariable, url: urlVariable } = paymentLinkConfiguration[type];
  const paymentLinkId = process.env[idVariable];
  const configuredUrl = process.env[urlVariable];
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!paymentLinkId || !configuredUrl || !keyId || !keySecret) return null;

  const credentials = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
  const response = await fetch(`https://api.razorpay.com/v1/payment_links/${encodeURIComponent(paymentLinkId)}`, {
    headers: { Authorization: `Basic ${credentials}` },
    cache: 'no-store',
  });
  if (!response.ok) return null;

  const paymentLink = paymentLinkSchema.safeParse(await response.json());
  if (!paymentLink.success) return null;

  const expectedAmount = REGISTRATION_PRICING[type].totalAmountPaise;
  const blockedStatuses = new Set(['expired', 'cancelled']);
  if (
    paymentLink.data.id !== paymentLinkId ||
    paymentLink.data.short_url !== configuredUrl ||
    paymentLink.data.amount !== expectedAmount ||
    paymentLink.data.currency !== 'INR' ||
    paymentLink.data.accept_partial ||
    blockedStatuses.has(paymentLink.data.status)
  ) return null;

  return paymentLink.data.short_url;
}

export async function fetchRazorpayPayment(paymentId: string): Promise<VerifiedRazorpayPayment | null> {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return null;

  const credentials = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
  const response = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Basic ${credentials}` },
    cache: 'no-store',
  });
  if (!response.ok) return null;

  const payment = razorpayPaymentSchema.safeParse(await response.json());
  return payment.success && payment.data.id === paymentId ? payment.data : null;
}

export function verifyWebhookSignature(
  webhookBody: string,
  signature: string,
  secret: string | undefined = process.env.RAZORPAY_WEBHOOK_SECRET
): boolean {
  if (!secret || !/^[a-f\d]{64}$/i.test(signature)) return false;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(webhookBody)
    .digest('hex');

  const expected = Buffer.from(expectedSignature, 'hex');
  const supplied = Buffer.from(signature, 'hex');
  return expected.length === supplied.length && crypto.timingSafeEqual(expected, supplied);
}
