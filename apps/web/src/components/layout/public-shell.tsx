import type { ReactNode } from 'react';
import { AppBrand } from './app-brand';

type PublicShellProps = {
  children: ReactNode;
};

export function PublicShell({ children }: PublicShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-surface-bg">
      <header className="border-b border-surface-border bg-surface-card/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
          <AppBrand subtitle="Access Portal" />
          <p className="hidden text-[10px] font-semibold tracking-widest text-slate-500 uppercase sm:block">
            Enterprise Access
          </p>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-surface-border bg-surface-card">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-2.5 px-4 py-2.5 text-xs sm:px-6 lg:px-8">
          <p className="font-medium tracking-[0.06em] text-slate-600 uppercase">
            SuperBoard Platform
          </p>
          <div className="flex items-center gap-2 text-slate-500">
            <span>© {new Date().getFullYear()} SuperBoard</span>
            <span aria-hidden className="h-1 w-1 rounded-full bg-slate-400" />
            <span>Identity gateway</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
