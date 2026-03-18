import type { ReactNode } from 'react';
import { AppBrand } from './app-brand';

type PublicShellProps = {
  children: ReactNode;
};

export function PublicShell({ children }: PublicShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-linear-to-br from-surface-bg via-white to-surface-bg">
      <header className="border-b border-surface-border bg-surface-card">
        <div className="mx-auto flex w-full max-w-7xl items-center px-4 py-4 sm:px-6 lg:px-8">
          <AppBrand subtitle="Public Area" />
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-surface-border bg-surface-card">
        <div className="mx-auto w-full max-w-7xl px-4 py-3 text-xs text-slate-500 sm:px-6 lg:px-8">
          SuperBoard · MVP Base
        </div>
      </footer>
    </div>
  );
}
