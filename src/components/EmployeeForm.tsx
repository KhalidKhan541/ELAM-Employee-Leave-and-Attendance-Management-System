'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function EmployeeForm({ departments }: { departments: { id: string; name: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [departmentId, setDepartmentId] = useState(departments[0]?.id ?? '');
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().slice(0, 10));
  const [role, setRole] = useState('EMPLOYEE');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, departmentId, joiningDate, role, active: true }),
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body.error?.message ?? 'Could not add employee');
        return;
      }
      setSuccess(`${body.data.fullName} added. Initial password: Password123!`);
      setFullName('');
      setEmail('');
      router.refresh();
    } catch {
      setError('The server could not be reached.');
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return <button className="btn-primary" onClick={() => setOpen(true)} type="button">Add employee</button>;
  }

  return (
    <form onSubmit={submit} className="card mb-6 grid gap-4 p-5 sm:grid-cols-2">
      <div>
        <label className="label" htmlFor="fullName">Full name</label>
        <input className="input" id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
      </div>
      <div>
        <label className="label" htmlFor="email">Work email</label>
        <input className="input" id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div>
        <label className="label" htmlFor="department">Department</label>
        <select className="input" id="department" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} required>
          {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="joiningDate">Joining date</label>
        <input className="input" id="joiningDate" type="date" value={joiningDate} onChange={(e) => setJoiningDate(e.target.value)} required />
      </div>
      <div>
        <label className="label" htmlFor="role">Role</label>
        <select className="input" id="role" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="EMPLOYEE">Employee</option>
          <option value="MANAGER">Manager</option>
          <option value="HR">HR</option>
        </select>
      </div>
      <div className="flex items-end gap-2">
        <button className="btn-primary" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
        <button className="btn-secondary" type="button" onClick={() => setOpen(false)}>Close</button>
      </div>
      {error && <p className="error-text sm:col-span-2">{error}</p>}
      {success && <p className="text-sm text-emerald-700 sm:col-span-2">{success}</p>}
    </form>
  );
}
