import type { ReactNode } from 'react';
import Link from 'next/link';
import type { AuthUserDTO } from '@superboard/shared';
import type { NavItem } from '@/lib/navigation';
import { isNavItemActive } from '@/lib/navigation';
import { AppBrand } from './app-brand';

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
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
          <AppBrand subtitle="Workspace" />

          <div className="flex items-center gap-2.5">
            <div className="hidden text-right sm:block">
              <p className="text-[11px] font-medium tracking-[0.06em] text-slate-500 uppercase">
                Signed in as
              </p>
              <p className="mt-1 text-sm font-medium leading-none text-slate-900">
                {user.fullName}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">{user.email}</p>
            </div>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-[11px] font-semibold text-brand-700">
              {userInitials || 'SB'}
            </span>
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold tracking-[0.04em] text-slate-700 uppercase transition-colors hover:bg-slate-50"
            >
              <span>Logout</span>
            </button>
          </div>
        </div>

        <div className="border-t border-surface-border">
          <div className="mx-auto flex w-full max-w-7xl items-center gap-3 overflow-x-auto px-4 py-2 sm:px-6 lg:px-8">
            <p className="hidden shrink-0 text-[10px] font-semibold tracking-widest text-slate-500 uppercase sm:block">
              Modules
            </p>
            <nav className="flex items-center gap-1 rounded-md border border-surface-border bg-slate-50 p-0.5">
              {navItems.map((item) => {
                const isActive = isNavItemActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-sm px-2.5 py-1 text-xs font-semibold tracking-[0.04em] whitespace-nowrap uppercase transition-colors ${
                      isActive
                        ? 'bg-white text-slate-900 ring-1 ring-slate-300'
                        : 'text-slate-600 hover:bg-white hover:text-slate-900'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>

      <footer className="border-t border-surface-border bg-surface-card">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-2.5 px-4 py-2.5 text-xs sm:px-6 lg:px-8">
          <p className="font-medium tracking-[0.06em] text-slate-600 uppercase">
            SuperBoard Platform
          </p>
          <div className="flex items-center gap-2 text-slate-500">
            <span>© {new Date().getFullYear()} SuperBoard</span>
            <span aria-hidden className="h-1 w-1 rounded-full bg-slate-400" />
            <span>Internal use only</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
