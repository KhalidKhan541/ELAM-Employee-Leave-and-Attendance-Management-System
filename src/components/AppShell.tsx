import type { ReactNode } from 'react';
import type { SessionPayload } from '@/lib/auth';
import { LogoutButton } from './LogoutButton';
import { SideNav } from './SideNav';

export function AppShell({
  session,
  title,
  subtitle,
  children,
}: {
  session: SessionPayload;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="no-print hidden border-r border-slate-200 bg-white lg:block">
        <div className="sticky top-0 h-screen">
          <SideNav role={session.role} />
        </div>
      </aside>

      <div className="min-w-0">
        <header className="no-print sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur-none">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
            <div className="lg:hidden text-sm font-semibold text-accent-700">ELAM</div>
            <div className="hidden lg:block">
              <h1 className="text-base font-semibold tracking-tight text-ink">{title}</h1>
              {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm font-medium text-ink">{session.name}</div>
                <div className="text-[11px] text-slate-500">{session.role}</div>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                {session.name
                  .split(' ')
                  .map((part) => part[0])
                  .slice(0, 2)
                  .join('')}
              </div>
              <LogoutButton />
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-5 py-7 sm:px-8">
          <div className="mb-6 lg:hidden">
            <h1 className="text-xl font-semibold tracking-tight text-ink">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
