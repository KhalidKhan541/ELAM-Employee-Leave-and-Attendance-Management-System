'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface Item {
  href: string;
  label: string;
  roles: string[];
  mark?: string;
}

const items: Item[] = [
  { href: '/dashboard', label: 'Overview', roles: ['EMPLOYEE', 'MANAGER', 'HR'], mark: '01' },
  { href: '/attendance', label: 'Attendance', roles: ['EMPLOYEE', 'MANAGER', 'HR'], mark: '02' },
  { href: '/leave', label: 'My leave', roles: ['EMPLOYEE', 'MANAGER', 'HR'], mark: '03' },
  { href: '/approvals', label: 'Approvals', roles: ['MANAGER', 'HR'], mark: '04' },
  { href: '/payroll', label: 'Payroll', roles: ['MANAGER', 'HR'], mark: '05' },
  { href: '/reports', label: 'HR reports', roles: ['MANAGER', 'HR'], mark: '06' },
  { href: '/employees', label: 'Employees', roles: ['HR'], mark: '07' },
];

export function SideNav({ role }: { role: string }) {
  const pathname = usePathname();

  return (
    <nav className="flex h-full flex-col" aria-label="Main navigation">
      <div className="flex items-center px-5 py-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="ELAM — Employee Leave & Attendance Management" className="w-full max-w-[212px]" />
      </div>

      <div className="px-3">
        <p className="px-3 pb-2 pt-4 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
          Workspace
        </p>
        <ul className="space-y-0.5">
          {items
            .filter((item) => item.roles.includes(role))
            .map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`group flex items-center gap-3 rounded-md border-l-2 px-3 py-2 text-sm transition-colors ${
                      active
                        ? 'border-accent-600 bg-accent-50 font-semibold text-accent-700'
                        : 'border-transparent text-slate-600 hover:bg-slate-100 hover:text-ink'
                    }`}
                  >
                    <span className={`text-[10px] font-semibold tabular-nums ${active ? 'text-accent-600' : 'text-slate-400'}`}>
                      {item.mark}
                    </span>
                    {item.label}
                  </Link>
                </li>
              );
            })}
        </ul>
      </div>

      <div className="mt-auto border-t border-slate-200 px-6 py-4 text-[11px] leading-relaxed text-slate-400">
        Internal use only
        <br />
        Semester project · v1.2
      </div>
    </nav>
  );
}
