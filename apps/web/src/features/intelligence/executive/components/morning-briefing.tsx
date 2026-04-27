'use client';

import { useState, useEffect } from 'react';
import {
  Sunrise,
  Target,
  Activity,
  Brain,
  ArrowRight,
  X,
  Zap,
  CheckCircle2,
  Wind,
} from 'lucide-react';
import { toast } from 'sonner';
import { getDailyBriefing } from '../api/executive-service';

interface BriefingData {
  pulse: string;
  commandIntent: string[];
  highlights: string[];
}

export function MorningBriefing({
  workspaceId,
  onClose,
}: {
  workspaceId: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<BriefingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBriefing();
  }, [workspaceId]);

  const fetchBriefing = async () => {
    setIsLoading(true);
    try {
      setData(await getDailyBriefing(workspaceId));
    } catch {
      toast.error('Không thể tải báo cáo buổi sáng');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-3xl">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-sm bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 animate-pulse">
            <Sunrise size={24} />
          </div>
          <span className="text-[9px] font-bold text-brand-400 uppercase tracking-widest animate-pulse">
            Syncing_Intelligence...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-[var(--space-10)] bg-slate-950/80 backdrop-blur-3xl animate-in fade-in duration-500 overflow-y-auto scrollbar-hide">
      <div className="w-full max-w-3xl bg-slate-950/90 backdrop-blur-3xl rounded-md shadow-inner border border-white/10 p-[var(--space-12)] relative my-10 animate-in slide-in-from-bottom-4 duration-700">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-10 right-10 p-4 rounded-full bg-white/5 text-white/30 hover:text-white hover:bg-white/10 transition-all hover:rotate-90 duration-500"
        >
          <X size={24} />
        </button>

        <div className="flex flex-col items-center text-center mb-[var(--space-12)]">
          <div className="flex items-center gap-4 mb-[var(--space-6)]">
            <span className="h-px w-8 bg-white/10" />
            <div className="w-10 h-10 rounded-sm bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center">
              <Sunrise size={20} />
            </div>
            <span className="h-px w-8 bg-white/10" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase mb-4">
            Daily_Briefing
          </h1>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.5em]">
              {new Date().toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>

        <div className="space-y-[var(--space-12)]">
          {/* Tình trạng hoạt động */}
          <div className="relative p-[var(--space-10)] rounded-md bg-white/[0.01] border border-white/5 overflow-hidden group hover:border-brand-500/20 transition-all duration-500 shadow-inner">
            <div className="absolute top-0 right-0 p-8 text-white/5 group-hover:text-white/10 transition-colors">
              <Wind size={60} strokeWidth={1} />
            </div>

            <h3 className="text-[9px] font-bold text-brand-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Activity size={12} className="animate-pulse" />
              Operational_Status
            </h3>

            <p className="text-xl font-bold text-white/80 leading-snug tracking-tight">
              "{data?.pulse}"
            </p>

            <div className="mt-6 flex items-center gap-2">
              <div className="px-[var(--space-3)] py-1 bg-white/[0.02] rounded-xs border border-white/5 text-[8px] font-bold text-white/30 uppercase tracking-widest">
                Stable
              </div>
              <div className="px-[var(--space-3)] py-1 bg-white/[0.02] rounded-xs border border-white/5 text-[8px] font-bold text-brand-400 uppercase tracking-widest">
                Synergy_High
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--space-10)]">
            {/* Command Intent */}
            <div className="space-y-[var(--space-6)]">
              <h3 className="text-[9px] font-bold text-white/30 uppercase tracking-widest px-1 flex items-center gap-2">
                <Target size={12} className="text-brand-400" />
                Strategic_Goals
              </h3>

              <div className="space-y-3">
                {data?.commandIntent.map((intent, i) => (
                  <div
                    key={i}
                    className="flex gap-4 p-[var(--space-4)] rounded-sm bg-white/[0.01] border border-white/5 group hover:border-brand-500/20 transition-all cursor-default"
                  >
                    <div className="text-lg font-black text-brand-500/10 tabular-nums opacity-50 group-hover:opacity-100 transition-opacity">
                      0{i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-[11px] font-bold text-white/80 uppercase tracking-tight group-hover:text-white transition-colors">
                        {intent}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hoạt động gần đây */}
            <div className="space-y-[var(--space-6)]">
              <h3 className="text-[9px] font-bold text-white/30 uppercase tracking-widest px-1 flex items-center gap-2">
                <Brain size={12} className="text-brand-400" />
                Key_Highlights
              </h3>

              <div className="flex flex-col h-full bg-white/[0.01] rounded-md p-[var(--space-8)] text-white relative overflow-hidden group border border-white/5 shadow-inner">
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 Transition-opacity">
                  <Zap size={80} strokeWidth={1} />
                </div>

                <div className="relative z-10 space-y-4">
                  {data?.highlights.map((h, i) => (
                    <div key={i} className="flex gap-3 items-start">
                      <div className="mt-1 w-3 h-3 rounded-full border border-white/10 flex items-center justify-center text-white/20">
                        <CheckCircle2 size={8} />
                      </div>
                      <p className="text-[11px] font-medium text-white/60 leading-relaxed">{h}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-auto pt-8 flex items-center justify-between relative z-10 opacity-20">
                  <span className="text-[8px] font-bold uppercase tracking-widest">
                    System_Integrity
                  </span>
                  <span className="text-[8px] font-bold uppercase tracking-widest text-brand-400">
                    Active_Sync
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Call to action */}
          <div className="pt-10 flex flex-col items-center gap-6">
            <button
              onClick={onClose}
              className="group flex items-center gap-4 text-[11px] font-black text-white/40 hover:text-brand-400 uppercase tracking-[0.4em] transition-all"
            >
              Đã hiểu
              <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
