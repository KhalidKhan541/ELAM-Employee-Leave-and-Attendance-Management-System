import { LoginForm } from '@/components/LoginForm';

export const metadata = { title: 'Sign in' };

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-white lg:grid lg:grid-cols-[1fr_520px]">
      <section className="relative hidden overflow-hidden border-r border-slate-200 bg-canvas px-12 py-14 lg:flex lg:flex-col">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #e2e8f0 1px, transparent 1px), linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="ELAM — Employee Leave & Attendance Management"
            className="w-[360px] max-w-full"
          />
        </div>

        <div className="relative mt-auto max-w-lg pb-10">
          <div className="mb-5 h-1 w-14 bg-accent-600" />
          <h1 className="text-4xl font-semibold leading-tight tracking-tight text-ink">
            Attendance and leave, finally in one place.
          </h1>
          <p className="mt-5 text-base leading-relaxed text-slate-600">
            Record daily attendance, request leave with a clear balance, and follow approvals —
            without chasing spreadsheets or guessing who signed off.
          </p>
          <ul className="mt-8 grid grid-cols-2 gap-x-8 gap-y-3 text-sm text-slate-600">
            <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-accent-600" />Daily check-in / out</li>
            <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-accent-600" />Live leave balances</li>
            <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-accent-600" />Two-step approvals</li>
            <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-accent-600" />Payroll summary</li>
          </ul>
        </div>
        <p className="relative text-xs text-slate-400">Internal HR system · Semester project</p>
      </section>

      <section className="flex items-center justify-center px-6 py-12 sm:px-12">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <div className="mb-2 h-1 w-10 bg-accent-600 lg:hidden" />
            <h2 className="text-2xl font-semibold tracking-tight text-ink">Welcome back</h2>
            <p className="mt-1 text-sm text-slate-500">Sign in with your work account to continue.</p>
          </div>
          <LoginForm />
        </div>
      </section>
    </div>
  );
}
