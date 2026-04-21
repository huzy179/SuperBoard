'use client';

import { motion } from 'framer-motion';
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
    brand: 'shadow-glow-brand/5',
    indigo: 'shadow-glow-indigo/5',
    emerald: 'shadow-glow-emerald/5',
    rose: 'shadow-glow-rose/5',
    none: '',
  };

  const glowBase = {
    brand: 'bg-brand-500/5 shadow-glow-brand/20',
    indigo: 'bg-indigo-500/5 shadow-glow-indigo/20',
    emerald: 'bg-emerald-500/5 shadow-glow-emerald/20',
    rose: 'bg-rose-500/5 shadow-glow-rose/20',
    none: '',
  };

  return (
    <motion.div
      whileHover={
        hoverEffect
          ? { y: -4, transition: { duration: 0.4, ease: [0.175, 0.885, 0.32, 1.275] } }
          : {}
      }
      className={`group relative rounded-[2.5rem] border border-white/5 bg-white/[0.01] backdrop-blur-3xl transition-all duration-500 ${hoverEffect ? 'hover:bg-white/[0.03] hover:border-white/10 hover:shadow-inner' : ''} ${glows[glowColor]} ${className}`}
    >
      {/* Internal Grain Texture */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      {/* Rim Light Effect */}
      <div className="absolute inset-0 rounded-[2.5rem] pointer-events-none border border-white/5 group-hover:border-white/10 transition-colors" />

      {/* Background Glow Orb */}
      {glowColor !== 'none' && (
        <div
          className={`absolute inset-x-12 -bottom-4 h-8 ${glowBase[glowColor]} blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700`}
        />
      )}

      <div className="relative z-10">{children}</div>
    </motion.div>
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
    <div className="flex items-start justify-between p-8 pb-4">
      <div className="space-y-1.5">
        <div className="flex items-center gap-2.5">
          {icon && <div className="text-brand-400">{icon}</div>}
          <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">
            {title}
          </h3>
        </div>
        {subtitle && (
          <p className="text-xl font-black text-white uppercase tracking-tight leading-none">
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
  return <div className={`p-8 pt-4 ${className}`}>{children}</div>;
}
