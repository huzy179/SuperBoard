'use client';

import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: number;
  icon: ReactNode;
  color: 'brand' | 'emerald' | 'blue' | 'rose';
  trend: string;
  delay: number;
}

export function StatCard({ label, value, icon, color, trend, delay }: StatCardProps) {
  const colorMap = {
    brand: 'border-brand-500/20 text-brand-400 bg-brand-500/10 shadow-glow-brand/5',
    emerald: 'border-emerald-500/20 text-emerald-400 bg-emerald-500/10 shadow-glow-emerald/5',
    blue: 'border-blue-500/20 text-blue-400 bg-blue-500/10 shadow-glow-blue/5',
    rose: 'border-rose-500/20 text-rose-400 bg-rose-500/10 shadow-glow-rose/5',
  };

  const glowMap = {
    brand: 'bg-brand-500/5 shadow-glow-brand/20',
    emerald: 'bg-emerald-500/5 shadow-glow-emerald/20',
    blue: 'bg-blue-500/5 shadow-glow-blue/20',
    rose: 'bg-rose-500/5 shadow-glow-rose/20',
  };

  return (
    <div
      className="group relative animate-in slide-in-from-bottom-4 duration-500"
      style={{ animationDelay: `${delay * 100}ms`, animationFillMode: 'both' }}
    >
      <div
        className={`absolute inset-x-8 -bottom-2 h-4 ${glowMap[color]} blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
      />
      <div
        className={`relative h-full rounded-md border border-white/10 bg-white/[0.01] p-var(--space-6) backdrop-blur-2xl transition-all duration-300 hover:bg-white/[0.03] hover:-translate-y-1 hover:border-brand-500/20 shadow-inner overflow-hidden`}
      >
        <div className="absolute inset-0 opacity-[0.01] pointer-events-none bg-[url('data:image/svg+xml,%3Csvg%20viewBox%3D%220%200%20256%20256%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cfilter%20id%3D%22noiseFilter%22%3E%3CfeTurbulence%20type%3D%22fractalNoise%22%20baseFrequency%3D%220.8%22%20numOctaves%3D%224%22%20stitchTiles%3D%22stitch%22%2F%3E%3C%2Ffilter%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20filter%3D%22url(%23noiseFilter)%22%2F%3E%3C%2Fsvg%3E')]" />

        <div className="flex items-start justify-between relative z-10 mb-var(--space-8)">
          <div
            className={`p-var(--space-3) rounded-sm border ${colorMap[color]} transition-transform duration-500 group-hover:scale-105 group-hover:rotate-3`}
          >
            {icon}
          </div>
          <div className="text-right">
            <span className="block text-[8px] font-black uppercase tracking-[0.4em] text-white/10 mb-1">
              Telemetry
            </span>
            <span
              className={`text-[9px] font-bold uppercase tracking-widest ${color === 'rose' ? 'text-rose-500 animate-pulse' : 'text-white/30'}`}
            >
              {trend}
            </span>
          </div>
        </div>
        <div className="relative z-10">
          <p
            className="text-[9px] font-bold text-white/20 uppercase tracking-[0.4em] mb-1 pl-1"
            title="Strategic Protocol"
          >
            {label}
          </p>
          <p className="text-4xl font-black text-white tracking-tighter tabular-nums leading-none">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}
