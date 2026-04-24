'use client';

import { Shield, Eye, Zap, Lock, Globe } from 'lucide-react';

interface DocPropertyBarProps {
  classification: 'TOP_SECRET' | 'INTERNAL' | 'PUBLIC';
  status: 'DRAFT' | 'REVIEW' | 'ACTIVE';
  ownerName: string;
}

export function DocPropertyBar({ classification, status, ownerName }: DocPropertyBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-var(--space-6) py-var(--space-6) border-y border-white/10 mb-var(--space-12)">
      {/* Classification Node */}
      <div className="flex items-center gap-3 group">
        <div
          className={`p-1.5 rounded-sm border ${
            classification === 'TOP_SECRET'
              ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 shadow-inner'
              : classification === 'INTERNAL'
                ? 'bg-brand-500/10 border-brand-500/20 text-brand-400 shadow-inner'
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-inner'
          }`}
        >
          {classification === 'TOP_SECRET' ? (
            <Lock size={14} />
          ) : classification === 'INTERNAL' ? (
            <Shield size={14} />
          ) : (
            <Globe size={14} />
          )}
        </div>
        <div>
          <div className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-0.5">
            CLASSIFICATION
          </div>
          <div
            className={`text-[10px] font-bold uppercase tracking-widest ${
              classification === 'TOP_SECRET'
                ? 'text-rose-400/80'
                : classification === 'INTERNAL'
                  ? 'text-brand-400/80'
                  : 'text-emerald-400/80'
            }`}
          >
            {classification.replace('_', ' ')}
          </div>
        </div>
      </div>

      <div className="w-px h-8 bg-white/5" />

      {/* Operational Status */}
      <div className="flex items-center gap-3">
        <div className="p-1.5 bg-white/5 border border-white/10 rounded-sm text-white/20">
          <Zap size={14} />
        </div>
        <div>
          <div className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-0.5">
            STATUS
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest">
              {status}
            </span>
            <div className="h-1 w-1 rounded-full bg-brand-500 animate-pulse shadow-glow-brand" />
          </div>
        </div>
      </div>

      <div className="w-px h-8 bg-white/5" />

      {/* Asset Ownership */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="h-8 w-8 rounded-sm bg-slate-900 border border-white/10 flex items-center justify-center text-white/20 font-black text-[10px]">
            {ownerName.charAt(0)}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 bg-slate-950 rounded-full border-2 border-slate-950 flex items-center justify-center">
            <div className="h-full w-full bg-emerald-500 rounded-full" />
          </div>
        </div>
        <div>
          <div className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-0.5">
            OWNER
          </div>
          <div className="text-[10px] font-bold text-white/60 uppercase tracking-tight">
            {ownerName}
          </div>
        </div>
      </div>

      <div className="flex-1" />

      {/* Access Log Fragment */}
      <div className="flex items-center gap-3 px-4 py-1.5 bg-white/[0.01] border border-white/5 rounded-sm">
        <div className="flex -space-x-1.5">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-5 w-5 rounded-full border border-slate-950 bg-slate-800 flex items-center justify-center text-[7px] font-bold text-white/20"
            >
              U{i}
            </div>
          ))}
        </div>
        <div className="h-2 w-px bg-white/10" />
        <div className="flex items-center gap-2">
          <Eye size={10} className="text-white/20" />
          <span className="text-[8px] font-bold text-white/10 uppercase tracking-widest">
            14_Uplinks
          </span>
        </div>
      </div>
    </div>
  );
}
