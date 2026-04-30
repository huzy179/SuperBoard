'use client';

import { ReactNode } from 'react';

interface AdaptiveWidgetProps {
  order: number;
  focus?: boolean;
  children: ReactNode;
  className?: string;
}

export function AdaptiveWidget({ order, focus, children, className }: AdaptiveWidgetProps) {
  return (
    <div
      className={[
        'relative h-full',
        focus ? 'z-10 ring-2 ring-[color:var(--color-focus)]/15 rounded-card' : '',
        className ?? '',
      ].join(' ')}
      style={{ transitionDelay: `${order * 50}ms` }}
    >
      {focus ? (
        <div className="absolute top-4 right-6 inline-flex items-center gap-2 rounded-full border border-surface-border bg-surface-card px-3 py-1 text-xs text-[color:var(--color-muted)] shadow-glass">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-500" aria-hidden />
          AI ưu tiên
        </div>
      ) : null}
      {children}
    </div>
  );
}
