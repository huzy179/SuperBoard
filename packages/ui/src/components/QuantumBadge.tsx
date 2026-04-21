'use client';

import type { ReactNode } from 'react';

interface QuantumBadgeProps {
  children: ReactNode;
  variant?: 'brand' | 'indigo' | 'emerald' | 'rose' | 'amber' | 'ghost';
  dot?: boolean;
}

export function QuantumBadge({ children, variant = 'brand', dot = false }: QuantumBadgeProps) {
  const variants = {
    brand: 'border-brand-500/30 bg-brand-500/10 text-brand-400 shadow-glow-brand/5',
    indigo: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-400 shadow-glow-indigo/5',
    emerald: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-glow-emerald/5',
    rose: 'border-rose-500/30 bg-rose-500/10 text-rose-500 shadow-glow-rose/5',
    amber: 'border-amber-500/30 bg-amber-500/10 text-amber-500 shadow-glow-amber/5',
    ghost: 'border-white/5 bg-white/[0.03] text-white/40',
  };

  const dots = {
    brand: 'bg-brand-500 shadow-glow-brand',
    indigo: 'bg-indigo-500 shadow-glow-indigo',
    emerald: 'bg-emerald-500 shadow-glow-emerald',
    rose: 'bg-rose-500 shadow-glow-rose',
    amber: 'bg-amber-500 shadow-glow-amber',
    ghost: 'bg-white/20',
  };

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] backdrop-blur-xl ${variants[variant]}`}
    >
      {dot && <div className={`h-1.5 w-1.5 rounded-full ${dots[variant]} animate-pulse`} />}
      <span className="leading-none">{children}</span>
    </div>
  );
}
