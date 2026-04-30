'use client';

import type { ReactNode } from 'react';

interface QuantumCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: 'brand' | 'indigo' | 'emerald' | 'rose' | 'none';
  hoverEffect?: boolean;
}

export function QuantumCard({
  children,
  className = '',
  glowColor = 'none',
  hoverEffect = true,
}: QuantumCardProps) {
  const glows = {
    brand: 'ring-1 ring-brand-500/20',
    indigo: 'ring-1 ring-indigo-500/15',
    emerald: 'ring-1 ring-emerald-500/15',
    rose: 'ring-1 ring-rose-500/15',
    none: '',
  };

  return (
    <div
      className={`group relative rounded-card border border-surface-border bg-surface-card shadow-luxe transition-shadow duration-150 ${
        hoverEffect ? 'hover:shadow-glass' : ''
      } ${glows[glowColor]} ${className}`}
    >
      {children}
    </div>
  );
}

export function QuantumCardHeader({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between p-[var(--space-6)] pb-[var(--space-3)]">
      <div className="space-y-1">
        <div className="flex items-center gap-[var(--space-2)]">
          {icon && <div className="text-brand-500">{icon}</div>}
          <h3 className="text-sm font-semibold text-[color:var(--color-muted)]">{title}</h3>
        </div>
        {subtitle && (
          <p className="text-lg font-semibold text-[color:var(--color-ink)] leading-tight">
            {subtitle}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}

export function QuantumCardContent({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`p-[var(--space-6)] pt-[var(--space-2)] ${className}`}>{children}</div>;
}
