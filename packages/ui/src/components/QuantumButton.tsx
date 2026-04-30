'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';
import type { ReactNode } from 'react';

interface QuantumButtonProps extends HTMLMotionProps<'button'> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
}

export function QuantumButton({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  ...props
}: QuantumButtonProps) {
  const baseClasses =
    'inline-flex items-center justify-center gap-2 rounded-button text-sm font-medium transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-focus)]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-bg disabled:opacity-50 disabled:pointer-events-none';

  const variants = {
    primary: 'bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700',
    secondary:
      'bg-black/[0.05] text-[color:var(--color-ink)] border border-surface-border hover:bg-black/[0.07] active:bg-black/[0.09]',
    ghost:
      'bg-transparent text-[color:var(--color-ink)] hover:bg-black/[0.04] active:bg-black/[0.06]',
    danger:
      'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-600 hover:text-white hover:border-rose-600 active:bg-rose-700',
  };

  const sizes = {
    sm: 'px-[var(--space-3)] py-[var(--space-2)] text-xs',
    md: 'px-[var(--space-4)] py-[var(--space-2)]',
    lg: 'px-[var(--space-6)] py-[var(--space-3)] text-base',
    icon: 'h-9 w-9',
  };

  return (
    <motion.button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className} ${
        loading ? 'cursor-wait' : ''
      }`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && (
        <div className="h-4 w-4 border-2 border-current/25 border-t-current rounded-full animate-spin shrink-0" />
      )}
      <span className="flex items-center gap-2">{children}</span>
    </motion.button>
  );
}
