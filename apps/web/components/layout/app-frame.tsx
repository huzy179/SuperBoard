import type { ReactNode } from 'react';

type AppFrameProps = {
  header: ReactNode;
  footer: ReactNode;
  children: ReactNode;
  contentClassName?: string;
};

export function AppFrame({ header, footer, children, contentClassName }: AppFrameProps) {
  return (
    <div className="flex min-h-screen flex-col bg-linear-to-br from-surface-bg via-white to-surface-bg">
      {header}
      <main className={contentClassName ?? 'flex-1'}>{children}</main>
      {footer}
    </div>
  );
}
