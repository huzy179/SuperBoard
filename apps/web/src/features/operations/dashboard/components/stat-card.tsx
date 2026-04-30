'use client';

import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: number;
  icon: ReactNode;
  color: 'brand' | 'emerald' | 'blue' | 'rose';
  trend: string;
  delay: number;
}

export function StatCard({ label, value, icon, color, trend, delay }: StatCardProps) {
  void delay;

  const colorMap = {
    brand: 'border-brand-200 bg-brand-50 text-brand-700',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    blue: 'border-sky-200 bg-sky-50 text-sky-700',
    rose: 'border-rose-200 bg-rose-50 text-rose-700',
  } as const;

  return (
    <div className="rounded-xl border border-surface-border bg-surface-card p-6 shadow-sm transition-colors hover:bg-[color:var(--color-surface-alt)]/40">
      <div className="flex items-start justify-between gap-4">
        <div
          className={`inline-flex h-10 w-10 items-center justify-center rounded-md border ${colorMap[color]}`}
        >
          {icon}
        </div>
        <div className="text-right">
          <div className="text-xs font-medium text-[color:var(--color-muted)]">{trend}</div>
        </div>
      </div>

      <div className="mt-5">
        <div className="text-sm font-medium text-[color:var(--color-muted)]">{label}</div>
        <div className="mt-1 text-3xl font-semibold text-[color:var(--color-ink)] tabular-nums tracking-tight leading-none">
          {value}
        </div>
      </div>
    </div>
  );
}
