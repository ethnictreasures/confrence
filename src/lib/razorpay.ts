
import crypto from 'crypto';
import { z } from 'zod';
import { REGISTRATION_PRICING, type NewRegistrationType } from '@/config/conference';

const razorpayOrderSchema = z.object({
  id: z.string(),
  amount: z.number().int().positive(),
  currency: z.string(),
  status: z.string(),
  receipt: z.string().nullable().optional(),
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

export type VerifiedRazorpayPayment = z.infer<
  typeof razorpayPaymentSchema
>;

export type RazorpayOrder = z.infer<typeof razorpayOrderSchema>;

export interface CreateRazorpayOrderInput {
  registrationId: string;
  registrationNumber: string;
  registrationType: NewRegistrationType;
}

function getRazorpayCredentials() {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();

  if (!keyId || !keySecret) {
    throw new Error('Razorpay API credentials are not configured.');
  }

  return {
    keyId,
    authorization:
      'Basic ' +
      Buffer.from(`${keyId}:${keySecret}`).toString('base64'),
  };
}

/**
 * Creates a Razorpay Order for a registration.
 *
 * Call this only from a server-side API route after loading the
 * registration from your database and confirming its payment is pending.
 *
 * Important: persist the returned order ID against the registration.
 */
export async function createRazorpayOrder(
  input: CreateRazorpayOrderInput
): Promise<RazorpayOrder> {
  const { authorization } = getRazorpayCredentials();

  // Always calculate the amount from server-side pricing configuration.
  const pricing = REGISTRATION_PRICING[input.registrationType];
  const amount = pricing.totalAmountPaise;

  if (!Number.isSafeInteger(amount) || amount <= 0) {
    throw new Error('Invalid registration payment amount.');
  }

  const response = await fetch(
    'https://api.razorpay.com/v1/orders',
    {
      method: 'POST',
      headers: {
        Authorization: authorization,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        currency: 'INR',
        receipt: input.registrationNumber,
        notes: {
          registration_id: input.registrationId,
          registration_number: input.registrationNumber,
          registration_type: input.registrationType,
        },
      }),
      cache: 'no-store',
    }
  );

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');

    console.error('[Razorpay] Order creation failed:', {
      status: response.status,
      response: errorBody.slice(0, 500),
    });

    throw new Error('Unable to create Razorpay order.');
  }

  const parsed = razorpayOrderSchema.safeParse(await response.json());

  if (!parsed.success) {
    throw new Error('Razorpay returned an invalid order response.');
  }

  const order = parsed.data;

  if (
    order.amount !== amount ||
    order.currency !== 'INR' ||
    order.status !== 'created'
  ) {
    throw new Error('Razorpay order validation failed.');
  }

  return order;
}

/**
 * Fetches an order directly from Razorpay.
 */
export async function fetchRazorpayOrder(
  orderId: string
): Promise<RazorpayOrder | null> {
  const { authorization } = getRazorpayCredentials();

  const response = await fetch(
    `https://api.razorpay.com/v1/orders/${encodeURIComponent(orderId)}`,
    {
      headers: { Authorization: authorization },
      cache: 'no-store',
    }
  );

  if (!response.ok) return null;

  const parsed = razorpayOrderSchema.safeParse(await response.json());

  return parsed.success && parsed.data.id === orderId
    ? parsed.data
    : null;
}

/**
 * Fetches an individual payment directly from Razorpay.
 */
export async function fetchRazorpayPayment(
  paymentId: string
): Promise<VerifiedRazorpayPayment | null> {
  const { authorization } = getRazorpayCredentials();

  const response = await fetch(
    `https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`,
    {
      headers: { Authorization: authorization },
      cache: 'no-store',
    }
  );

  if (!response.ok) return null;

  let data: unknown;

  try {
    data = await response.json();
  } catch {
    return null;
  }

  const parsed = razorpayPaymentSchema.safeParse(data);

  return parsed.success && parsed.data.id === paymentId
    ? parsed.data
    : null;
}

/**
 * Verifies the signature returned by Razorpay Checkout.
 *
 * The order ID must be the server-created order ID stored for this
 * registration. Never accept an arbitrary order ID supplied by a client.
 */
export function verifyCheckoutSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;

  if (!secret || !orderId || !paymentId || !signature) {
    return false;
  }

  if (!/^[a-f\d]{64}$/i.test(signature)) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  const expected = Buffer.from(expectedSignature, 'hex');
  const supplied = Buffer.from(signature, 'hex');

  return (
    expected.length === supplied.length &&
    crypto.timingSafeEqual(expected, supplied)
  );
}

/**
 * Verifies a Razorpay webhook using the raw request body.
 * Do not parse and re-serialize the body before verifying its signature.
 */
export function verifyWebhookSignature(
  webhookBody: string,
  signature: string,
  secret: string | undefined = process.env.RAZORPAY_WEBHOOK_SECRET
): boolean {
  if (!secret || !/^[a-f\d]{64}$/i.test(signature)) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(webhookBody)
    .digest('hex');

  const expected = Buffer.from(expectedSignature, 'hex');
  const supplied = Buffer.from(signature, 'hex');

  return (
    expected.length === supplied.length &&
    crypto.timingSafeEqual(expected, supplied)
  );
}
