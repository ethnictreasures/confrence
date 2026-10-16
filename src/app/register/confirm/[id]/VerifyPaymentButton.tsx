
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export default function VerifyPaymentButton({
  registrationId,
}: {
  registrationId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function verifyPayment() {
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(
        `/api/registrations/${registrationId}/verify-payment`,
        { method: 'POST' },
      );

      const result = await response.json();

      setMessage(
        result.message ??
          result.error ??
          'Unable to verify payment at this time.',
      );

      if (response.ok && result.verified) {
        router.refresh();
      }
    } catch {
      setMessage('Unable to contact the payment verification service.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={verifyPayment}
        disabled={loading}
      >
        <RefreshCw
          className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`}
        />
        {loading ? 'Verifying with Razorpay…' : 'Check Payment Status'}
      </Button>

      {message && (
        <p role="status" className="text-sm text-gray-700">
          {message}
        </p>
      )}
    </div>
  );
}
