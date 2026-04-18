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
      className="group relative animate-in slide-in-from-bottom-8 duration-700"
      style={{ animationDelay: `${delay * 100}ms`, animationFillMode: 'both' }}
    >
      <div
        className={`absolute inset-x-8 -bottom-4 h-8 ${glowMap[color]} blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700`}
      />
      <div
        className={`relative h-full rounded-[2.5rem] border border-white/5 bg-white/[0.01] p-8 backdrop-blur-3xl transition-all duration-500 hover:bg-white/[0.03] hover:-translate-y-2 hover:border-white/10 shadow-inner overflow-hidden`}
      >
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-100" />
        <div className="flex items-start justify-between relative z-10 mb-8">
          <div
            className={`p-4 rounded-2xl border ${colorMap[color]} transition-transform duration-700 group-hover:scale-110 group-hover:rotate-6`}
          >
            {icon}
          </div>
          <div className="text-right">
            <span className="block text-[8px] font-black uppercase tracking-[0.3em] text-white/20 mb-1">
              Telemetry
            </span>
            <span
              className={`text-[10px] font-black uppercase tracking-widest ${color === 'rose' ? 'text-rose-500 animate-pulse' : 'text-white/40'}`}
            >
              {trend}
            </span>
          </div>
        </div>
        <div className="relative z-10">
          <p
            className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-2 pl-1"
            title="Strategic Protocol"
          >
            {label}
          </p>
          <p className="text-5xl font-black text-white tracking-tighter tabular-nums leading-none">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}
