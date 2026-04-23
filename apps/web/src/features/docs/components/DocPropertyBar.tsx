'use client';

import { Shield, Eye, Zap, Lock, Globe } from 'lucide-react';

interface DocPropertyBarProps {
  classification: 'TOP_SECRET' | 'INTERNAL' | 'PUBLIC';
  status: 'DRAFT' | 'REVIEW' | 'ACTIVE';
  ownerName: string;
}

export function DocPropertyBar({ classification, status, ownerName }: DocPropertyBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-6 py-8 border-y border-white/5 mb-12">
      {/* Classification Node */}
      <div className="flex items-center gap-3 group">
        <div
          className={`p-2 rounded-xl border ${
            classification === 'TOP_SECRET'
              ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 shadow-glow-rose/5'
              : classification === 'INTERNAL'
                ? 'bg-brand-500/10 border-brand-500/20 text-brand-400'
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
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
          <div className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-0.5">
            Classification
          </div>
          <div
            className={`text-[11px] font-black uppercase tracking-[0.2em] italic ${
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
        <div className="p-2 bg-white/5 border border-white/10 rounded-xl text-white/40">
          <Zap size={14} />
        </div>
        <div>
          <div className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-0.5">
            Op Status
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black text-white/80 uppercase tracking-[0.2em] italic">
              {status}
            </span>
            <div className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-pulse shadow-glow-brand" />
          </div>
        </div>
      </div>

      <div className="w-px h-8 bg-white/5" />

      {/* Asset Ownership */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="h-10 w-10 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center text-white/40 font-black text-xs">
            {ownerName.charAt(0)}
          </div>
          <div className="absolute -bottom-1 -right-1 h-3.5 w-3.5 bg-slate-950 rounded-full border-2 border-slate-950 flex items-center justify-center">
            <div className="h-full w-full bg-emerald-500 rounded-full" />
          </div>
        </div>
        <div>
          <div className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-0.5">
            Asset Owner
          </div>
          <div className="text-[11px] font-black text-white/60 uppercase tracking-wider">
            {ownerName}
          </div>
        </div>
      </div>

      <div className="flex-1" />

      {/* Access Log Fragment */}
      <div className="flex items-center gap-4 px-6 py-2.5 bg-white/[0.02] border border-white/5 rounded-lg">
        <div className="flex -space-x-2">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-6 w-6 rounded-lg border-2 border-slate-950 bg-slate-800 flex items-center justify-center text-[8px] font-black text-white/20"
            >
              U{i}
            </div>
          ))}
        </div>
        <div className="h-3 w-px bg-white/5" />
        <div className="flex items-center gap-2">
          <Eye size={12} className="text-white/20" />
          <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">
            14 Active Uplinks
          </span>
        </div>
      </div>
    </div>
  );
}
