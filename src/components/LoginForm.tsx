'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Demo = { label: string; email: string };

const demos: Demo[] = [
  { label: 'HR', email: 'hr@elams.test' },
  { label: 'Manager', email: 'manager@elams.test' },
  { label: 'Employee', email: 'employee@elams.test' },
];

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('employee@elams.test');
  const [password, setPassword] = useState('Password123!');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body.error?.message ?? 'Unable to sign in');
        return;
      }
      router.replace('/dashboard');
      router.refresh();
    } catch {
      setError('The server could not be reached. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label className="label" htmlFor="email">Work email</label>
        <input
          id="email"
          className="input"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="username"
          required
        />
      </div>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <input
          id="password"
          className="input"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
        />
      </div>

      {error && (
        <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">
          {error}
        </p>
      )}

      <button className="btn-primary w-full" type="submit" disabled={busy}>
        {busy ? 'Signing in…' : 'Sign in'}
      </button>

      <div className="border-t border-slate-200 pt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Demo accounts</p>
        <div className="flex flex-wrap gap-2">
          {demos.map((demo) => (
            <button
              key={demo.email}
              type="button"
              className="rounded border border-slate-200 px-2.5 py-1 text-xs text-slate-600 hover:border-accent-500 hover:text-accent-700"
              onClick={() => {
                setEmail(demo.email);
                setPassword('Password123!');
                setError('');
              }}
            >
              {demo.label}
            </button>
          ))}
        </div>
      </div>
    </form>
  );
}
