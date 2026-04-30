'use client';

import { useEffect, useMemo, useState } from 'react';
import { Activity, Clock, Cpu, Eye, ShieldAlert, Telescope, TrendingUp, Zap } from 'lucide-react';
import { QuantumModal } from '@superboard/ui';
import { AppButton } from '@/components/ui/app-button';
import { StrategicSandbox } from './StrategicSandbox';
import { ExecutiveDirective } from '@/features/specialized/automation/components/ExecutiveDirective';
import { getProjectBriefing, getProjectForecast } from '../api/project-service';

interface BriefingData {
  missionName: string;
  sitrep: string;
  metrics: {
    velocity: number;
    collisions: number;
    pulses: number;
  };
  latestIntensity: number;
}

interface ForecastData {
  prediction: string;
  confidence: number;
  metrics: {
    completionDays: number;
    driftIndex: number;
    stability: number;
  };
  trajectory: 'POSITIVE' | 'NEUTRAL' | 'CRITICAL';
}

export function MissionCommandBriefing({
  projectId,
  workspaceId,
  isOpen,
  onClose,
}: {
  projectId: string;
  workspaceId: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [data, setData] = useState<BriefingData | null>(null);
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [simulatedForecast, setSimulatedForecast] = useState<ForecastData | null>(null);
  const [showSandbox, setShowSandbox] = useState(false);
  const [tab, setTab] = useState<'sitrep' | 'executive'>('sitrep');
  const [generatedAt, setGeneratedAt] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;

    setGeneratedAt(new Date().toLocaleTimeString());
    getProjectBriefing(projectId).then((res) => setData(res));
    getProjectForecast(projectId).then((res) => setForecast(res));
  }, [isOpen, projectId]);

  useEffect(() => {
    if (!isOpen) {
      setData(null);
      setForecast(null);
      setSimulatedForecast(null);
      setShowSandbox(false);
      setTab('sitrep');
      setGeneratedAt('');
    }
  }, [isOpen]);

  const activeForecast = simulatedForecast ?? forecast;

  const trajectoryLabel = useMemo(() => {
    if (!activeForecast) return null;
    if (activeForecast.trajectory === 'CRITICAL')
      return { text: 'Critical', cls: 'bg-rose-50 border-rose-200 text-rose-700' };
    if (activeForecast.trajectory === 'POSITIVE')
      return { text: 'Positive', cls: 'bg-emerald-50 border-emerald-200 text-emerald-700' };
    return {
      text: 'Neutral',
      cls: 'bg-black/[0.02] border-surface-border text-[color:var(--color-muted)]',
    };
  }, [activeForecast]);

  if (!isOpen) return null;

  return (
    <>
      <QuantumModal isOpen={isOpen} onClose={onClose} title="Project briefing" size="xl">
        <div className="space-y-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <p className="text-sm text-[color:var(--color-muted)]">Briefing</p>
              <h2 className="text-2xl font-semibold text-[color:var(--color-ink)] tracking-tight">
                {data?.missionName || '—'}
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-surface-border bg-black/[0.02] px-3 py-1.5 text-xs text-[color:var(--color-muted)]">
                <Clock size={12} />
                <span>Generated {generatedAt || '—'}</span>
              </div>
              <AppButton
                type="button"
                variant="secondary"
                size="md"
                leftIcon={<Telescope size={16} />}
                onClick={() => setShowSandbox(true)}
              >
                Sandbox
              </AppButton>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <MetricCard
              icon={<TrendingUp size={16} />}
              label="Velocity"
              value={data?.metrics.velocity ?? 0}
              sub="Units / cycle"
            />
            <MetricCard
              icon={<ShieldAlert size={16} />}
              label="Collisions"
              value={data?.metrics.collisions ?? 0}
              sub="Potential conflicts"
              tone={(data?.metrics.collisions ?? 0) > 0 ? 'danger' : 'neutral'}
            />
            <MetricCard
              icon={<Activity size={16} />}
              label="Pulses"
              value={data?.metrics.pulses ?? 0}
              sub="Events"
            />
          </div>

          {activeForecast ? (
            <section className="rounded-xl border border-surface-border bg-[color:var(--color-surface-alt)]/40 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--color-ink)]">
                  <Eye size={16} className="text-brand-500" />
                  Forecast
                </div>
                {trajectoryLabel ? (
                  <span
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold tracking-[0.125px] ${trajectoryLabel.cls}`}
                  >
                    {trajectoryLabel.text}
                  </span>
                ) : null}
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                <ForecastStat
                  label="Confidence"
                  value={`${Math.round(activeForecast.confidence * 100)}%`}
                  icon={<Cpu size={14} />}
                />
                <ForecastStat
                  label="Est. window"
                  value={`${activeForecast.metrics.completionDays} days`}
                  icon={<Clock size={14} />}
                />
                <ForecastStat
                  label="Drift index"
                  value={activeForecast.metrics.driftIndex.toFixed(2)}
                  icon={<Zap size={14} />}
                  tone={activeForecast.metrics.driftIndex > 0.5 ? 'danger' : 'neutral'}
                />
              </div>

              <p className="mt-4 text-sm text-[color:var(--color-muted)] leading-relaxed">
                {activeForecast.prediction}
              </p>
            </section>
          ) : null}

          <div className="inline-flex items-center gap-1 rounded-lg border border-surface-border bg-black/[0.02] p-1">
            <button
              type="button"
              onClick={() => setTab('sitrep')}
              className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                tab === 'sitrep'
                  ? 'bg-surface-card border border-surface-border text-[color:var(--color-ink)] shadow-sm'
                  : 'text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)] hover:bg-black/[0.03]'
              }`}
            >
              Sitrep
            </button>
            <button
              type="button"
              onClick={() => setTab('executive')}
              className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                tab === 'executive'
                  ? 'bg-surface-card border border-surface-border text-[color:var(--color-ink)] shadow-sm'
                  : 'text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)] hover:bg-black/[0.03]'
              }`}
            >
              Executive
            </button>
          </div>

          {tab === 'sitrep' ? (
            <section className="rounded-xl border border-surface-border bg-surface-card p-5 shadow-inner">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--color-ink)]">
                  <Zap size={16} className="text-brand-500" />
                  Sitrep
                </div>
              </div>
              <p className="mt-3 text-sm text-[color:var(--color-ink)] leading-relaxed whitespace-pre-wrap">
                {data?.sitrep || 'Đang tải nội dung...'}
              </p>
            </section>
          ) : (
            <section className="rounded-xl border border-surface-border bg-surface-card shadow-inner overflow-hidden">
              <div className="px-5 py-4 border-b border-surface-border flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--color-ink)]">
                  <ShieldAlert size={16} className="text-brand-500" />
                  Executive directive
                </div>
              </div>
              <ExecutiveDirective workspaceId={workspaceId} />
            </section>
          )}
        </div>
      </QuantumModal>

      <QuantumModal
        isOpen={showSandbox}
        onClose={() => setShowSandbox(false)}
        title="Strategic Sandbox"
        size="lg"
      >
        <div className="h-[70vh] overflow-hidden">
          <StrategicSandbox
            projectId={projectId}
            onClose={() => setShowSandbox(false)}
            onResultUpdate={(result) => setSimulatedForecast(result)}
          />
        </div>
      </QuantumModal>
    </>
  );
}

function MetricCard({
  icon,
  label,
  value,
  sub,
  tone = 'neutral',
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  sub: string;
  tone?: 'neutral' | 'danger';
}) {
  const toneCls =
    tone === 'danger'
      ? 'bg-rose-50 border-rose-200 text-rose-700'
      : 'bg-black/[0.02] border-surface-border text-[color:var(--color-ink)]';

  return (
    <div className={`rounded-xl border p-4 ${toneCls}`}>
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">{label}</div>
        <div className="text-[color:var(--color-muted)]">{icon}</div>
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
      <div className="mt-1 text-xs text-[color:var(--color-muted)]">{sub}</div>
    </div>
  );
}

function ForecastStat({
  label,
  value,
  icon,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone?: 'neutral' | 'danger';
}) {
  const valueCls = tone === 'danger' ? 'text-rose-700' : 'text-[color:var(--color-ink)]';
  return (
    <div className="rounded-lg border border-surface-border bg-surface-card p-4">
      <div className="flex items-center justify-between text-xs text-[color:var(--color-muted)]">
        <span>{label}</span>
        <span className="text-[color:var(--color-faint)]">{icon}</span>
      </div>
      <div className={`mt-2 text-lg font-semibold tracking-tight ${valueCls}`}>{value}</div>
    </div>
  );
}
