'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function AttendancePanel({
  hasRecord,
  checkedOut,
}: {
  hasRecord: boolean;
  checkedOut: boolean;
}) {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);

  async function act(action: 'CHECK_IN' | 'CHECK_OUT') {
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const body = await response.json();
      setFailed(!response.ok);
      setMessage(
        response.ok
          ? action === 'CHECK_IN'
            ? `Checked in at ${new Date(body.data.checkIn).toLocaleTimeString()}.`
            : `Checked out at ${new Date(body.data.checkOut).toLocaleTimeString()}. ${body.data.hours} hours recorded.`
          : body.error?.message ?? 'Action could not be completed',
      );
      if (response.ok) router.refresh();
    } catch {
      setFailed(true);
      setMessage('The server could not be reached.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          className="btn-primary"
          disabled={busy || hasRecord}
          onClick={() => act('CHECK_IN')}
          type="button"
        >
          Check in
        </button>
        <button
          className="btn-secondary"
          disabled={busy || !hasRecord || checkedOut}
          onClick={() => act('CHECK_OUT')}
          type="button"
        >
          Check out
        </button>
        <span className="text-xs text-slate-500">
          {checkedOut ? 'Today is complete.' : hasRecord ? 'You are checked in.' : 'You have not checked in yet today.'}
        </span>
      </div>
      {message && (
        <p
          className={`mt-3 rounded-md border px-3 py-2 text-sm ${
            failed ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}
          role="status"
        >
          {message}
        </p>
      )}
    </div>
  );
}
