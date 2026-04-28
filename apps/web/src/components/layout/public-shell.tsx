import type { ReactNode } from 'react';
import { AppBrand } from './app-brand';

type PublicShellProps = {
  children: ReactNode;
};

export function PublicShell({ children }: PublicShellProps) {
  return (
    <div className="relative min-h-screen flex flex-col bg-surface-bg overflow-hidden font-sans text-[color:var(--color-ink)]">
      <header className="relative z-10 border-b border-surface-border bg-surface-bg">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-8 py-5">
          <AppBrand subtitle="Workspace" variant="light" />
          <p className="text-xs font-medium text-[color:var(--color-muted)]">Secure access</p>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center p-8 bg-[color:var(--color-surface-alt)]/40">
        {children}
      </main>

      <footer className="relative z-10 border-t border-surface-border bg-surface-bg">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-2.5 px-8 py-5 text-xs font-medium text-[color:var(--color-muted)]">
          <p>SuperBoard</p>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}
