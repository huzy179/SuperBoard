import type { ReactNode } from 'react';
import Link from 'next/link';
import type { AuthUserDTO } from '@superboard/shared';
import type { NavItem } from '@/lib/navigation';
import { isNavItemActive } from '@/lib/navigation';

type PrivateShellProps = {
  children: ReactNode;
  user: AuthUserDTO;
  navItems: NavItem[];
  pathname: string;
  onLogout: () => void;
};

export function PrivateShell({ children, user, navItems, pathname, onLogout }: PrivateShellProps) {
  const userInitials = user.fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <div className="flex min-h-screen flex-col bg-surface-bg">
      <header className="sticky top-0 z-20 border-b border-surface-border bg-surface-card/95 backdrop-blur">
        <div className="border-b border-surface-border bg-brand-700 text-white">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-white/20 text-sm font-bold">
                SB
              </span>
              <div>
                <p className="text-sm font-semibold tracking-wide">SuperBoard</p>
                <p className="text-[11px] text-white/80">Jira Workspace</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium leading-none">{user.fullName}</p>
                <p className="mt-1 text-[11px] text-white/80">{user.email}</p>
              </div>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-xs font-semibold">
                {userInitials || 'SB'}
              </span>
            </div>
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = isNavItemActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-200'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            <span>Logout</span>
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">{children}</main>

      <footer className="border-t border-surface-border bg-surface-card">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 text-xs sm:px-6 lg:px-8">
          <p className="font-medium text-slate-600">SuperBoard Jira · Team managed</p>
          <div className="flex items-center gap-3 text-slate-500">
            <span>Updated just now</span>
            <span className="h-1 w-1 rounded-full bg-slate-400" />
            <span>API status: Online</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
