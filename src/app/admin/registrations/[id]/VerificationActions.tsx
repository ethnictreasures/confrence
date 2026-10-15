'use client';

import { useState } from 'react';

const actions = [
  { status: 'approved', label: 'Approve document' },
  { status: 'rejected', label: 'Reject document' },
  { status: 'additional_info_required', label: 'Request more information' },
] as const;

export default function VerificationActions({ registrationId, currentStatus }: { registrationId: string; currentStatus: string }) {
  const [reason, setReason] = useState('');
  const [status, setStatus] = useState(currentStatus);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function update(nextStatus: (typeof actions)[number]['status']) {
    if (reason.trim().length < 5) {
      setMessage('Enter a review note of at least 5 characters.');
      return;
    }
    setIsSubmitting(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/registrations/${registrationId}/verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus, reason }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? 'Could not update verification.');
      setStatus(nextStatus);
      setMessage('Verification status and audit history updated. Refresh to see the new status.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not update verification.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">Current: <span className="font-medium capitalize">{status.replaceAll('_', ' ')}</span></p>
      <label className="block text-sm font-medium" htmlFor={`verification-reason-${registrationId}`}>Review note</label>
      <textarea id={`verification-reason-${registrationId}`} value={reason} onChange={(event) => setReason(event.target.value)} maxLength={1000} className="min-h-20 w-full rounded border border-gray-300 px-3 py-2 text-sm" placeholder="Record the reason for this review decision." />
      <div className="grid gap-2">
        {actions.map((action) => (
          <button key={action.status} type="button" onClick={() => void update(action.status)} disabled={isSubmitting} className="w-full rounded border border-gray-300 px-3 py-2 text-left text-sm font-medium hover:bg-gray-50 disabled:opacity-50">
            {action.label}
          </button>
        ))}
      </div>
      {message && <p role="status" className="text-sm text-gray-700">{message}</p>}
    </div>
  );
}
