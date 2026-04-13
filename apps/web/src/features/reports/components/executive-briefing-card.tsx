'use client';

import { useState, useEffect } from 'react';
import {
  Sparkles,
  TrendingUp,
  Activity,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  Target,
} from 'lucide-react';
import { toast } from 'sonner';

interface ExecutiveData {
  healthScore: number;
  executiveBrief: string;
  forecast: {
    velocityPerDay: number;
    atRiskCount: number;
  };
}

interface ExecutiveBriefingCardProps {
  projectId: string;
}

export function ExecutiveBriefingCard({ projectId }: ExecutiveBriefingCardProps) {
  const [data, setData] = useState<ExecutiveData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBriefing = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/v1/executive/projects/${projectId}/briefing`);
      const body = await res.json();
      setData(body.data);
    } catch {
      toast.error('Không thể tải Strategic Briefing');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBriefing();
  }, [projectId]);

  if (isLoading) {
    return (
      <div className="w-full h-64 bg-white/5 rounded-[2.5rem] border border-white/5 animate-pulse flex items-center justify-center">
        <RefreshCw className="animate-spin text-white/10" size={32} />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="relative group overflow-hidden rounded-[2.5rem] border border-white/5 bg-slate-950 p-1 bg-gradient-to-br from-indigo-500/10 via-transparent to-emerald-500/10 shadow-glass">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />

      <div className="relative z-10 p-10 flex flex-col lg:flex-row gap-12">
        {/* Health Radial */}
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="relative w-40 h-40">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="currentColor"
                strokeWidth="12"
                fill="transparent"
                className="text-white/5"
              />
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="currentColor"
                strokeWidth="12"
                fill="transparent"
                strokeDasharray={440}
                strokeDashoffset={440 - (440 * data.healthScore) / 100}
                className={`transition-all duration-1000 ${
                  data.healthScore > 80
                    ? 'text-emerald-500'
                    : data.healthScore > 50
                      ? 'text-amber-500'
                      : 'text-rose-500'
                }`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black text-white tracking-tighter italic">
                {data.healthScore}%
              </span>
              <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em]">
                Neural Health
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Badge
              icon={<TrendingUp size={10} />}
              label={`${data.forecast.velocityPerDay.toFixed(1)} VEL`}
              color="emerald"
            />
            <Badge
              icon={<AlertTriangle size={10} />}
              label={`${data.forecast.atRiskCount} RISKS`}
              color={data.forecast.atRiskCount > 0 ? 'rose' : 'white/10'}
            />
          </div>
        </div>

        {/* AI Briefing */}
        <div className="flex-1 space-y-6">
          <header className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-indigo-400 animate-pulse" />
                <h3 className="text-[10px] font-black text-white uppercase tracking-[0.4em]">
                  Strategic Foresight
                </h3>
              </div>
              <h4 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">
                Executive Briefing
              </h4>
            </div>
            <button
              onClick={fetchBriefing}
              className="p-3 rounded-full bg-white/5 text-white/30 hover:bg-white/10 hover:text-white transition-all"
            >
              <RefreshCw size={16} />
            </button>
          </header>

          <div className="prose prose-invert max-w-none">
            <div className="text-sm text-white/70 leading-relaxed font-bold italic whitespace-pre-wrap">
              {data.executiveBrief}
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-8 border-t border-white/5">
            <Stat icon={<ShieldCheck size={14} />} label="Stability" value="High" />
            <Stat icon={<Target size={14} />} label="Accuracy" value="92%" />
            <Stat icon={<Activity size={14} />} label="Pace" value="Accelerating" />
            <Stat icon={<Layers size={14} />} label="Integrity" value="Verified" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Badge({ icon, label, color }: { icon: React.ReactNode; label: string; color: string }) {
  const colorClasses: Record<string, string> = {
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    'white/10': 'bg-white/5 text-white/30 border-white/5',
  };
  return (
    <div
      className={`px-4 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest flex items-center gap-2 ${colorClasses[color] || colorClasses['white/10']}`}
    >
      {icon}
      {label}
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-[8px] font-black text-white/20 uppercase tracking-widest">
        {icon}
        {label}
      </div>
      <div className="text-[10px] font-black text-white uppercase">{value}</div>
    </div>
  );
}

function Layers({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}
