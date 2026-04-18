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
    'relative inline-flex items-center justify-center gap-2 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all duration-500 overflow-hidden outline-none focus:ring-2 focus:ring-brand-500/50';

  const variants = {
    primary:
      'bg-white text-slate-950 shadow-glow-white hover:scale-[1.02] hover:shadow-glow-brand active:scale-[0.98]',
    secondary:
      'bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:text-white hover:border-white/20',
    ghost: 'bg-transparent text-white/40 hover:text-white hover:bg-white/5',
    danger:
      'bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-500/20 hover:text-rose-400',
  };

  const sizes = {
    sm: 'px-4 py-2',
    md: 'px-6 py-3.5',
    lg: 'px-8 py-5 text-[11px]',
    icon: 'p-3',
  };

  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
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
