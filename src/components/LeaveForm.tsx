'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface LeaveTypeOption {
  id: string;
  name: string;
  available: number;
}

export function LeaveForm({ types }: { types: LeaveTypeOption[] }) {
  const router = useRouter();
  const [leaveTypeId, setLeaveTypeId] = useState(types[0]?.id ?? '');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const selected = types.find((type) => type.id === leaveTypeId);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leaveTypeId, startDate, endDate, reason }),
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body.error?.message ?? 'Request could not be submitted');
        return;
      }
      router.push('/leave');
      router.refresh();
    } catch {
      setError('The server could not be reached.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card max-w-2xl space-y-5 p-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="leaveType">Leave type</label>
          <select
            id="leaveType"
            className="input"
            value={leaveTypeId}
            onChange={(event) => setLeaveTypeId(event.target.value)}
            required
          >
            {types.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name} — {type.available} day(s) available
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <div className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
            <span className="text-slate-500">Available balance: </span>
            <span className="font-semibold tabular-nums text-accent-700">{selected?.available ?? 0} day(s)</span>
          </div>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="startDate">Start date</label>
          <input id="startDate" className="input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
        </div>
        <div>
          <label className="label" htmlFor="endDate">End date</label>
          <input id="endDate" className="input" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="reason">Reason</label>
        <textarea
          id="reason"
          className="input min-h-[100px]"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Briefly describe the reason for this leave"
          required
        />
      </div>

      {error && (
        <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button className="btn-primary" type="submit" disabled={busy || types.length === 0}>
          {busy ? 'Submitting…' : 'Submit request'}
        </button>
        <span className="text-xs text-slate-500">Requests over 3 working days require HR approval.</span>
      </div>
    </form>
  );
}
