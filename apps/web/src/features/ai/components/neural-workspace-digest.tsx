'use client';

import { useState, useEffect } from 'react';
import {
  Brain,
  Activity,
  Zap,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';

interface NeuralWorkspaceDigestProps {
  workspaceId: string;
}

export function NeuralWorkspaceDigest({ workspaceId }: NeuralWorkspaceDigestProps) {
  const [digest, setDigest] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDigest = async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const res = await fetch(`/api/v1/ai/workspace/${workspaceId}/digest`);
      const data = await res.json();
      setDigest(data.data.digest);
    } catch {
      toast.error('Không thể đồng bộ Intelligence');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDigest();
  }, [workspaceId]);

  if (isLoading) {
    return (
      <div className="w-full p-8 border border-white/5 bg-white/5 rounded-[3rem] backdrop-blur-3xl animate-pulse">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-10 h-10 rounded-full bg-white/10" />
          <div className="flex-1 space-y-2">
            <div className="h-2 w-32 bg-white/10 rounded" />
            <div className="h-3 w-48 bg-white/10 rounded" />
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-4 w-full bg-white/5 rounded" />
          <div className="h-4 w-[90%] bg-white/5 rounded" />
          <div className="h-4 w-[80%] bg-white/5 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="group relative w-full p-1 bg-gradient-to-br from-brand-500/20 via-white/5 to-indigo-500/20 rounded-[3rem] shadow-glass overflow-hidden transition-all hover:shadow-glow-brand duration-500">
      <div className="relative border border-white/5 bg-slate-950/80 backdrop-blur-3xl rounded-[2.9rem] p-8 overflow-hidden">
        {/* Background Accents */}
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-20 transition-opacity">
          <Brain size={120} weight="thin" />
        </div>

        <div className="flex flex-col md:flex-row gap-10">
          {/* Left Column: Visual Metrics */}
          <div className="w-full md:w-64 space-y-8 border-b md:border-b-0 md:border-r border-white/5 pb-8 md:pb-0 md:pr-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
                <Sparkles size={24} className="animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-widest">
                  Neural Digest
                </h3>
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">
                  Workspace Synthesis
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5 transition-all hover:bg-white/10">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">
                    Workspace Momentum
                  </span>
                  <TrendingUp size={12} className="text-emerald-400" />
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-black text-white tracking-tighter">94%</span>
                  <span className="text-[10px] font-bold text-emerald-400 mb-1">+2.4%</span>
                </div>
              </div>

              <div className="p-4 bg-white/5 rounded-2xl border border-white/5 transition-all hover:bg-white/10">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] font-black text-rose-400/40 uppercase tracking-[0.2em]">
                    Cross-Node Risks
                  </span>
                  <AlertTriangle size={12} className="text-rose-400" />
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-black text-white tracking-tighter">03</span>
                  <span className="text-[10px] font-bold text-rose-400 mb-1">Critical</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => fetchDigest(true)}
              disabled={isRefreshing}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-white/5 border border-white/5 text-[9px] font-black text-white/40 uppercase tracking-widest hover:text-white hover:bg-white/10 transition-all active:scale-95"
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
              {isRefreshing ? 'Synchronizing Context...' : 'Sync Global Intelligence'}
            </button>
          </div>

          {/* Right Column: AI Synthesis */}
          <div className="flex-1 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-1 w-6 bg-brand-500 rounded-full" />
                <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">
                  AI Executive Briefing
                </span>
              </div>
              <div className="flex items-center gap-2 text-[9px] font-black text-white/20 uppercase tracking-widest">
                <Clock size={10} />
                Generated {new Date().toLocaleTimeString()}
              </div>
            </div>

            <div className="prose prose-invert prose-sm max-w-none">
              <p className="text-lg leading-relaxed text-white/70 font-medium italic">
                "{digest || 'Analyzing operational data across mission nodes...'}"
              </p>
            </div>

            <div className="pt-6 border-t border-white/5 flex flex-wrap gap-3">
              <div className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
                <Zap size={10} className="text-indigo-400" />
                <span className="text-[8px] font-black text-indigo-300 uppercase tracking-[0.1em]">
                  Multi-Project Sync Active
                </span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                <Activity size={10} className="text-emerald-400" />
                <span className="text-[8px] font-black text-emerald-300 uppercase tracking-[0.1em]">
                  Velocity Normalized
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
