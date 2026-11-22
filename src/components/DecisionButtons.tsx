'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function DecisionButtons({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function decide(decision: 'APPROVE' | 'REJECT') {
    setBusy(true);
    setError('');
    try {
      const response = await fetch(`/api/leave/${requestId}/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, comment }),
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body.error?.message ?? 'Decision could not be saved');
        return;
      }
      router.refresh();
    } catch {
      setError('The server could not be reached.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <input
        className="w-44 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs focus:border-accent-600 focus:outline-none"
        placeholder="Comment (optional)"
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        aria-label="Decision comment"
      />
      <div className="flex gap-2">
        <button className="btn-primary px-3 py-1.5 text-xs" disabled={busy} onClick={() => decide('APPROVE')} type="button">
          Approve
        </button>
        <button className="btn-secondary px-3 py-1.5 text-xs" disabled={busy} onClick={() => decide('REJECT')} type="button">
          Reject
        </button>
      </div>
      {error && <span className="max-w-44 text-right text-xs text-rose-600">{error}</span>}
    </div>
  );
}
