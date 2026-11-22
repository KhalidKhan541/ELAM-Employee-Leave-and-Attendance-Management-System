'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function CancelButton({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function cancel() {
    setBusy(true);
    setError('');
    try {
      const response = await fetch(`/api/leave/${requestId}/cancel`, { method: 'POST' });
      const body = await response.json();
      if (!response.ok) {
        setError(body.error?.message ?? 'Could not cancel request');
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
    <div className="text-right">
      <button className="btn-quiet text-xs" disabled={busy} onClick={cancel} type="button">
        {busy ? 'Cancelling…' : 'Cancel request'}
      </button>
      {error && <div className="text-xs text-rose-600">{error}</div>}
    </div>
  );
}
