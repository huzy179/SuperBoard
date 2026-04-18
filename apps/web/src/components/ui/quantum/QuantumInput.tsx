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

      <div className="relative overflow-hidden rounded-2xl">
        {/* Rim Lighting Effect */}
        <div className="absolute inset-0 rounded-2xl border border-white/5 group-focus-within:border-brand-500/50 transition-colors pointer-events-none z-10" />

        {/* Inner Glow */}
        <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-brand-500/50 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity blur-[1px]" />

        <div className="relative flex items-center bg-slate-950/40 backdrop-blur-xl transition-all group-focus-within:bg-slate-950/60 shadow-glass">
          {icon && (
            <div className="pl-4 text-white/20 group-focus-within:text-brand-400 transition-colors">
              {icon}
            </div>
          )}

          <input
            {...props}
            className="w-full bg-transparent px-5 py-4 text-sm text-white placeholder:text-white/10 outline-none transition-all font-medium"
          />
        </div>

        {/* Focus Pulse Animation */}
        <motion.div
          className="absolute inset-0 bg-brand-500/5 opacity-0 pointer-events-none"
          animate={{
            opacity: [0, 0.05, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
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
