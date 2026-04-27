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
        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 group-focus-within:text-brand-400 transition-colors pl-1">
          {label}
        </label>
      )}

      <div className="relative overflow-hidden rounded-md border border-white/5 group-focus-within:border-brand-500/30 transition-all duration-300">
        {/* Rim Lighting Effect */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* Inner Glow */}
        <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-brand-500/20 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity" />

        <div className="relative flex items-center bg-white/[0.01] backdrop-blur-xl transition-all group-focus-within:bg-white/[0.03] shadow-inner">
          {icon && (
            <div className="pl-[var(--space-4)] text-white/20 group-focus-within:text-brand-400 transition-colors">
              {icon}
            </div>
          )}

          <input
            {...props}
            className="w-full bg-transparent px-[var(--space-4)] py-[var(--space-3)] text-sm text-white placeholder:text-white/10 outline-none transition-all font-bold tracking-tight"
          />
        </div>

        {/* Selection Beam Animation */}
        <div className="absolute bottom-0 left-0 w-full h-[1px] overflow-hidden">
          <motion.div
            className="w-1/3 h-full bg-brand-500"
            animate={{
              x: ['-100%', '300%'],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        </div>
      </div>

      {error && (
        <motion.span
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[10px] font-bold text-rose-500 pl-1 tracking-tight"
        >
          {error}
        </motion.span>
      )}
    </div>
  );
}
