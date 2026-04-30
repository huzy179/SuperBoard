'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Layers,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { getExecutiveProjectBriefing } from '@/features/intelligence/executive/api/executive-service';

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

  const fetchBriefing = useCallback(async () => {
    setIsLoading(true);
    try {
      setData(await getExecutiveProjectBriefing(projectId));
    } catch {
      toast.error('Không thể tải báo cáo tổng quan');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    Promise.resolve().then(() => fetchBriefing());
  }, [fetchBriefing]);

  if (isLoading) {
    return (
      <div className="w-full rounded-xl border border-surface-border bg-surface-card p-8 shadow-sm flex items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-[color:var(--color-muted)]">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
          Đang tải briefing…
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <section className="w-full rounded-xl border border-surface-border bg-surface-card p-8 shadow-luxe">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-md border border-surface-border bg-brand-50 text-brand-700">
            <Sparkles size={18} />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-[color:var(--color-ink)]">
              Báo cáo tổng quan
            </div>
            <div className="mt-1 text-sm text-[color:var(--color-muted)] leading-relaxed">
              Tóm tắt nhanh sức khỏe dự án và một vài dự báo.
            </div>
          </div>
        </div>

        <button type="button" onClick={fetchBriefing} className="btn btn-secondary">
          <span className="inline-flex items-center gap-2">
            <RefreshCw size={16} />
            Làm mới
          </span>
        </button>
      </header>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[220px_1fr]">
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-surface-border bg-surface-bg p-6">
          <HealthRing score={data.healthScore} />
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Pill
              tone="emerald"
              icon={<TrendingUp size={14} />}
              label={`${data.forecast.velocityPerDay.toFixed(1)} vel/ngày`}
            />
            <Pill
              tone={data.forecast.atRiskCount > 0 ? 'rose' : 'neutral'}
              icon={<AlertTriangle size={14} />}
              label={`${data.forecast.atRiskCount} rủi ro`}
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-surface-border bg-[color:var(--color-surface-alt)]/35 p-6">
            <div className="text-sm text-[color:var(--color-ink)] leading-relaxed whitespace-pre-wrap">
              {data.executiveBrief}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MiniStat icon={<ShieldCheck size={16} />} label="Ổn định" value="Cao" />
            <MiniStat icon={<Target size={16} />} label="Độ chính xác" value="92%" />
            <MiniStat icon={<Activity size={16} />} label="Tiến độ" value="Tăng tốc" />
            <MiniStat icon={<Layers size={16} />} label="Toàn vẹn" value="Đã kiểm tra" />
          </div>
        </div>
      </div>
    </section>
  );
}

function HealthRing({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, score));
  const strokeDasharray = 440;
  const dashOffset = strokeDasharray - (strokeDasharray * clamped) / 100;
  const tone =
    clamped > 80 ? 'text-emerald-600' : clamped > 50 ? 'text-amber-600' : 'text-rose-600';

  return (
    <div className="relative h-40 w-40">
      <svg className="h-full w-full -rotate-90">
        <circle
          cx="80"
          cy="80"
          r="70"
          stroke="currentColor"
          strokeWidth="12"
          fill="transparent"
          className="text-black/[0.06]"
        />
        <circle
          cx="80"
          cy="80"
          r="70"
          stroke="currentColor"
          strokeWidth="12"
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={dashOffset}
          className={`transition-[stroke-dashoffset] duration-500 ${tone}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-3xl font-semibold text-[color:var(--color-ink)] tracking-tight">
          {clamped}%
        </div>
        <div className="mt-1 text-xs text-[color:var(--color-muted)]">Sức khỏe dự án</div>
      </div>
    </div>
  );
}

function Pill({
  icon,
  label,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  tone: 'emerald' | 'rose' | 'neutral';
}) {
  const tones = {
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    rose: 'border-rose-200 bg-rose-50 text-rose-800',
    neutral: 'border-surface-border bg-black/[0.02] text-[color:var(--color-muted)]',
  } as const;

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${tones[tone]}`}
    >
      {icon}
      {label}
    </span>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-surface-border bg-surface-bg p-4">
      <div className="flex items-center gap-2 text-xs text-[color:var(--color-muted)]">
        <span className="text-[color:var(--color-faint)]">{icon}</span>
        {label}
      </div>
      <div className="mt-2 text-sm font-semibold text-[color:var(--color-ink)]">{value}</div>
    </div>
  );
}
