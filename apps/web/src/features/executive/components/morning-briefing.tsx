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
      const res = await fetch(`/api/v1/executive/daily-briefing?workspaceId=${workspaceId}`);
      const body = await res.json();
      if (res.ok) setData(body.data);
    } catch {
      toast.error('Không thể tải báo cáo buổi sáng');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-3xl">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 animate-pulse">
            <Sunrise size={32} />
          </div>
          <span className="text-[10px] font-black text-brand-400 uppercase tracking-[0.5em] animate-pulse">
            Đang tải dữ liệu...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-10 bg-slate-950/60 backdrop-blur-3xl animate-in fade-in duration-700 overflow-y-auto scrollbar-hide">
      <div className="w-full max-w-4xl bg-slate-950/80 backdrop-blur-3xl rounded-[3rem] shadow-glass border border-white/5 p-16 relative my-10 animate-in zoom-in-95 slide-in-from-bottom-10 duration-1000">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-10 right-10 p-4 rounded-full bg-white/5 text-white/30 hover:text-white hover:bg-white/10 transition-all hover:rotate-90 duration-500"
        >
          <X size={24} />
        </button>

        {/* Narrative Header */}
        <div className="flex flex-col items-center text-center mb-16">
          <div className="flex items-center gap-4 mb-8">
            <span className="h-px w-10 bg-white/10" />
            <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center">
              <Sunrise size={24} />
            </div>
            <span className="h-px w-10 bg-white/10" />
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter leading-[0.9] uppercase italic mb-4">
            Báo cáo buổi sáng
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

        <div className="space-y-16">
          {/* Tình trạng hoạt động */}
          <div className="relative p-12 rounded-[2.5rem] bg-white/[0.02] border border-white/5 overflow-hidden group hover:border-brand-500/20 transition-all duration-700">
            <div className="absolute top-0 right-0 p-8 text-white/5 group-hover:text-white/10 transition-colors">
              <Wind size={60} strokeWidth={1} />
            </div>

            <h3 className="text-[11px] font-black text-brand-400 uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
              <Activity size={14} className="animate-pulse" />
              Tình trạng hoạt động
            </h3>

            <p className="text-2xl font-black text-white/80 leading-snug italic tracking-tighter">
              "{data?.pulse}"
            </p>

            <div className="mt-8 flex items-center gap-2">
              <div className="px-3 py-1 bg-white/[0.02] rounded-lg border border-white/5 text-[9px] font-black text-white/40 uppercase tracking-widest">
                Ổn định
              </div>
              <div className="px-3 py-1 bg-white/[0.02] rounded-lg border border-white/5 text-[9px] font-black text-brand-400 uppercase tracking-widest italic">
                Hợp tác tốt
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Command Intent */}
            <div className="space-y-8">
              <h3 className="text-[11px] font-black text-white/40 uppercase tracking-[0.4em] px-2 flex items-center gap-3">
                <Target size={14} className="text-brand-400" />
                Mục tiêu chính
              </h3>

              <div className="space-y-4">
                {data?.commandIntent.map((intent, i) => (
                  <div
                    key={i}
                    className="flex gap-6 p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 group hover:border-brand-500/20 transition-all cursor-default"
                  >
                    <div className="text-2xl font-black text-brand-500/20 italic opacity-50 group-hover:opacity-80 transition-opacity">
                      0{i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-black text-white uppercase italic tracking-tighter group-hover:text-brand-400 transition-colors">
                        {intent}
                      </p>
                      <div className="mt-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">
                          Công việc quan trọng
                        </span>
                        <ArrowRight size={12} className="text-brand-500/50" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hoạt động gần đây */}
            <div className="space-y-8">
              <h3 className="text-[11px] font-black text-white/40 uppercase tracking-[0.4em] px-2 flex items-center gap-3">
                <Brain size={14} className="text-brand-400" />
                Nổi bật
              </h3>

              <div className="flex flex-col h-full bg-white/[0.02] rounded-[2.5rem] p-10 text-white relative overflow-hidden group border border-white/5 shadow-glass">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Zap size={100} strokeWidth={1} />
                </div>

                <div className="relative z-10 space-y-6">
                  {data?.highlights.map((h, i) => (
                    <div key={i} className="flex gap-4 items-start">
                      <div className="mt-1 w-4 h-4 rounded-full border border-white/20 flex items-center justify-center text-white/40">
                        <CheckCircle2 size={10} />
                      </div>
                      <p className="text-[13px] font-medium text-white/80 leading-relaxed italic">
                        {h}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-auto pt-10 flex items-center justify-between relative z-10 opacity-30">
                  <span className="text-[9px] font-black uppercase tracking-widest">
                    Trạng thái hệ thống
                  </span>
                  <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">
                    HOẠT ĐỘNG TỐT
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
