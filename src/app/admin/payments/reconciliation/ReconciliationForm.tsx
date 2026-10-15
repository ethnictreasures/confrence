'use client';

import { useState } from 'react';

interface Candidate {
  id: string;
  registrationNumber: string;
  fullName: string;
  email: string;
  phone: string;
}

export default function ReconciliationForm({ eventId, candidates }: { eventId: string; candidates: Candidate[] }) {
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(formData: FormData) {
    setIsSubmitting(true);
    setMessage(null);
    try {
      const response = await fetch('/api/admin/payments/reconcile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          registrationId: formData.get('registrationId'),
          reason: formData.get('reason'),
        }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? 'Reconciliation failed');
      setMessage('Payment reconciled and audit logged. Refresh this page to see the updated event list.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Reconciliation failed');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form action={submit} className="mt-4 space-y-3 border-t pt-4">
      <label className="block text-sm font-medium" htmlFor={`registration-${eventId}`}>Select the verified registration</label>
      <select id={`registration-${eventId}`} name="registrationId" required disabled={isSubmitting || candidates.length === 0} className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm">
        <option value="">Choose registration</option>
        {candidates.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.registrationNumber} · {candidate.fullName} · {candidate.email}</option>)}
      </select>
      <label className="block text-sm font-medium" htmlFor={`reason-${eventId}`}>Evidence reviewed and reconciliation reason</label>
      <textarea id={`reason-${eventId}`} name="reason" required minLength={10} maxLength={1000} disabled={isSubmitting} className="min-h-20 w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm" placeholder="Describe the evidence and why this payment belongs to this registration." />
      <button type="submit" disabled={isSubmitting || candidates.length === 0} className="rounded bg-[#173d2f] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
        {isSubmitting ? 'Verifying…' : 'Verify with Razorpay and reconcile'}
      </button>
      {candidates.length === 0 && <p className="text-sm text-amber-800">No pending registration matches this event’s verified payer and category. Resolve the mismatch outside this form before assigning it.</p>}
      {message && <p role="status" className="text-sm text-gray-700">{message}</p>}
    </form>
  );
}
