'use client';

import { motion } from 'framer-motion';
import type { InputHTMLAttributes } from 'react';

interface QuantumInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export function QuantumInput({ label, error, icon, className = '', ...props }: QuantumInputProps) {
  return (
    <div className={`flex flex-col gap-2 w-full group ${className}`}>
      {label && (
        <label className="text-xs font-medium text-[color:var(--color-muted)] group-focus-within:text-[color:var(--color-ink)] transition-colors">
          {label}
        </label>
      )}

      <div className="relative overflow-hidden rounded-sm border border-surface-border bg-surface-card transition-colors duration-150 group-focus-within:border-brand-500/60 group-focus-within:ring-2 group-focus-within:ring-[color:var(--color-focus)]/20">
        <div className="flex items-center">
          {icon && (
            <div className="pl-[var(--space-3)] text-[color:var(--color-muted)]">{icon}</div>
          )}

          <input
            {...props}
            className="w-full bg-transparent px-[var(--space-3)] py-[var(--space-2)] text-sm text-[color:var(--color-ink)] placeholder:text-[color:var(--color-faint)] outline-none"
          />
        </div>
      </div>

      {error && (
        <motion.span
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs font-medium text-rose-700"
        >
          {error}
        </motion.span>
      )}
    </div>
  );
}
