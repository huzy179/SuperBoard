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
        hoverEffect ? { y: -2, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } } : {}
      }
      className={`group relative rounded-card border border-white/5 bg-white/[0.01] backdrop-blur-xl transition-all duration-300 ${hoverEffect ? 'hover:bg-white/[0.02] hover:border-white/10' : ''} ${glows[glowColor]} ${className}`}
    >
      {/* Internal Grain Texture */}
      <div className="absolute inset-0 opacity-[0.015] pointer-events-none mix-blend-overlay bg-[url('data:image/svg+xml,%3Csvg%20viewBox%3D%220%200%20256%20256%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cfilter%20id%3D%22noiseFilter%22%3E%3CfeTurbulence%20type%3D%22fractalNoise%22%20baseFrequency%3D%220.8%22%20numOctaves%3D%224%22%20stitchTiles%3D%22stitch%22%2F%3E%3C%2Ffilter%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20filter%3D%22url(%23noiseFilter)%22%2F%3E%3C%2Fsvg%3E')] rounded-card" />

      {/* Rim Light Effect */}
      <div className="absolute inset-0 rounded-card pointer-events-none border border-white/5 group-hover:border-white/10 transition-colors" />

      {/* Background Glow Orb */}
      {glowColor !== 'none' && (
        <div
          className={`absolute inset-x-8 -bottom-2 h-4 ${glowBase[glowColor]} blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
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
    <div className="flex items-start justify-between p-var(--space-6) pb-var(--space-3)">
      <div className="space-y-1">
        <div className="flex items-center gap-var(--space-2)">
          {icon && <div className="text-brand-400">{icon}</div>}
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">
            {title}
          </h3>
        </div>
        {subtitle && (
          <p className="text-lg font-black text-white uppercase tracking-tight leading-none">
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
  return <div className={`p-var(--space-6) pt-var(--space-2) ${className}`}>{children}</div>;
}
