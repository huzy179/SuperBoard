'use client';

import type { ReactNode } from 'react';

interface QuantumBadgeProps {
  children: ReactNode;
  variant?: 'brand' | 'indigo' | 'emerald' | 'rose' | 'amber' | 'ghost';
  dot?: boolean;
}

export function QuantumBadge({ children, variant = 'brand', dot = false }: QuantumBadgeProps) {
  const variants = {
    brand: 'border-brand-500/20 bg-brand-50 text-[color:var(--color-focus)]',
    indigo: 'border-indigo-500/20 bg-indigo-500/10 text-indigo-700',
    emerald: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700',
    rose: 'border-rose-500/20 bg-rose-500/10 text-rose-700',
    amber: 'border-amber-500/20 bg-amber-500/10 text-amber-700',
    ghost: 'border-surface-border bg-black/[0.02] text-[color:var(--color-muted)]',
  };

  const dots = {
    brand: 'bg-brand-500',
    indigo: 'bg-indigo-400',
    emerald: 'bg-emerald-400',
    rose: 'bg-rose-400',
    amber: 'bg-amber-400',
    ghost: 'bg-black/15',
  };

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-[var(--space-2)] py-[var(--space-1)] text-xs font-semibold tracking-[0.125px] ${variants[variant]}`}
    >
      {dot && <div className={`h-1.5 w-1.5 rounded-full ${dots[variant]}`} />}
      <span className="leading-none">{children}</span>
    </div>
  );
}
