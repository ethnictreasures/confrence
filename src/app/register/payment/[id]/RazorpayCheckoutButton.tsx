
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (
        event: string,
        callback: (response: {
          error?: { description?: string };
        }) => void
      ) => void;
    };
  }
}

interface Props {
  registrationId: string;
  amountPaise: number;
  fullName: string;
  email: string;
  phone: string | null;
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;

    script.onload = () => resolve(!!window.Razorpay);
    script.onerror = () => resolve(false);

    document.body.appendChild(script);
  });
}

export default function RazorpayCheckoutButton({
  registrationId,
  amountPaise,
  fullName,
  email,
  phone,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function startPayment() {
    if (loading) return;

    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (
      typeof registrationId !== 'string' ||
      !uuidPattern.test(registrationId)
    ) {
      setMessage(
        'Invalid registration ID. Please reload the payment page.'
      );
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded || !window.Razorpay) {
        throw new Error(
          'Unable to load Razorpay Checkout. Please try again.'
        );
      }

      const orderResponse = await fetch(
        `/api/registrations/${encodeURIComponent(registrationId)}/create-order`,
        { method: 'POST' }
      );

      const orderData = await orderResponse.json();

      if (!orderResponse.ok) {
        throw new Error(
          orderData.message || 'Unable to create payment order.'
        );
      }

      const { orderId, amount, currency, keyId } = orderData;

      if (
        !orderId ||
        !keyId ||
        amount !== amountPaise ||
        currency !== 'INR'
      ) {
        throw new Error(
          'Payment order details do not match this registration.'
        );
      }

      const checkout = new window.Razorpay({
        key: keyId,
        order_id: orderId,
        amount,
        currency,
        name: 'JUST POLYMER SOLUTIONS',
        description: 'Conference Registration',
        prefill: {
          name: fullName,
          email,
          ...(phone ? { contact: phone } : {}),
        },
        notes: {
          registration_id: registrationId,
        },
        theme: {
          color: '#1d4ed8',
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            setMessage(
              'Checkout was closed. You can try again when ready.'
            );
          },
        },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const verifyResponse = await fetch(
              `/api/registrations/${encodeURIComponent(registrationId)}/verify-payment`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  razorpay_payment_id:
                    response.razorpay_payment_id,
                  razorpay_order_id:
                    response.razorpay_order_id,
                  razorpay_signature:
                    response.razorpay_signature,
                }),
              }
            );

            const verifyData = await verifyResponse.json();

            if (!verifyResponse.ok || verifyData.verified !== true) {
              throw new Error(
                verifyData.message ||
                  'Payment verification is pending. Please check your payment status before retrying.'
              );
            }

            router.push(
              `/register/confirmation/${encodeURIComponent(registrationId)}`
            );
            router.refresh();
          } catch (error) {
            setMessage(
              error instanceof Error
                ? error.message
                : 'Could not verify the payment. Please check your payment status.'
            );
            setLoading(false);
          }
        },
      });

      checkout.on('payment.failed', (response) => {
        setMessage(
          response.error?.description ||
            'Payment failed. Please try again.'
        );
        setLoading(false);
      });

      checkout.open();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Something went wrong. Please try again.'
      );
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <Button
        type="button"
        onClick={startPayment}
        disabled={loading}
        className="w-full"
      >
        {loading ? 'Processing...' : 'Pay Now'}
      </Button>

      {message && (
        <p role="alert" className="text-sm text-red-600">
          {message}
        </p>
      )}
    </div>
  );
}
