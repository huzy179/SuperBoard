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
    'relative inline-flex items-center justify-center gap-2 rounded-md font-bold uppercase tracking-[0.2em] text-[10px] transition-all duration-300 overflow-hidden outline-none focus:ring-1 focus:ring-brand-500/50 border shadow-inner';

  const variants = {
    primary:
      'bg-white text-slate-950 border-white hover:bg-brand-500 hover:text-white hover:border-brand-500 active:scale-95 transition-all',
    secondary:
      'bg-white/[0.03] border-white/10 text-white/60 hover:bg-white/[0.08] hover:text-white hover:border-white/20 active:scale-95',
    ghost:
      'bg-transparent border-transparent text-white/30 hover:text-white hover:bg-white/5 active:scale-95',
    danger:
      'bg-rose-500/10 border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white hover:border-rose-500 active:scale-95',
  };

  const sizes = {
    sm: 'px-[var(--space-4)] py-[var(--space-2)]',
    md: 'px-[var(--space-6)] py-[var(--space-3)]',
    lg: 'px-[var(--space-10)] py-[var(--space-4)] text-[11px]',
    icon: 'p-[var(--space-3)]',
  };

  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className} ${loading ? 'opacity-70 cursor-wait' : ''}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {/* Background Orbs (Micro-animations) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{
            x: [0, 20, 0],
            y: [0, -10, 0],
            opacity: [0, 0.2, 0],
          }}
          transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
          className="absolute -top-4 -left-4 w-12 h-12 bg-brand-500 rounded-full blur-xl"
        />
        <motion.div
          animate={{
            x: [0, -20, 0],
            y: [0, 10, 0],
            opacity: [0, 0.1, 0],
          }}
          transition={{ duration: 7, repeat: Infinity, ease: 'linear', delay: 1 }}
          className="absolute -bottom-4 -right-4 w-16 h-16 bg-indigo-500 rounded-full blur-xl"
        />
      </div>

      {loading && (
        <div className="h-4 w-4 border-2 border-slate-950/20 border-t-slate-950 rounded-full animate-spin shrink-0" />
      )}
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </motion.button>
  );
}
