'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Calendar,
  Minus,
  Monitor,
  Play,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { TwinPulseVisualizer } from './twin-pulse-visualizer';
import {
  getExecutiveProjectBriefing,
  simulateExecutiveProject,
} from '@/features/intelligence/executive/api/executive-service';

interface ForecastData {
  projectId: string;
  velocityPerDay: number;
  atRiskCount: number;
  predictions: {
    taskId: string;
    title: string;
    status: string;
    estimatedCompletionDate: string;
    isAtRisk: boolean;
    confidence: number;
  }[];
}

export function ProjectDigitalTwin({ projectId }: { projectId: string }) {
  const [baselineData, setBaselineData] = useState<{
    healthScore: number;
    executiveBrief: string;
    forecast: ForecastData;
  } | null>(null);
  const [simulatedForecast, setSimulatedForecast] = useState<ForecastData | null>(null);
  const [velocityBoost, setVelocityBoost] = useState(0); // 0% -> 100%
  const [isLoading, setIsLoading] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);

  const fetchBaseline = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getExecutiveProjectBriefing(projectId);
      setBaselineData(data);
      setSimulatedForecast(data.forecast);
    } catch {
      toast.error('Không thể tải Digital Twin');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    Promise.resolve().then(() => fetchBaseline());
  }, [fetchBaseline]);

  const handleSimulate = async () => {
    if (!baselineData) return;
    setIsSimulating(true);
    try {
      const body = await simulateExecutiveProject(projectId, {
        velocityBoost: velocityBoost / 100,
      });
      setSimulatedForecast(body.forecast);
      toast.success('Đã cập nhật mô phỏng');
    } catch {
      toast.error('Mô phỏng thất bại');
    } finally {
      setIsSimulating(false);
    }
  };

  if (isLoading || !baselineData) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4 animate-pulse">
        <Monitor size={56} className="text-[color:var(--color-faint)]" />
        <span className="text-sm font-medium text-[color:var(--color-muted)]">
          Đang tải mô phỏng…
        </span>
      </div>
    );
  }

  const currentForecast = simulatedForecast ?? baselineData.forecast;
  const lastPrediction = currentForecast.predictions[currentForecast.predictions.length - 1];
  const projectEnd = new Date(lastPrediction?.estimatedCompletionDate ?? new Date().toISOString());

  return (
    <section className="flex flex-col gap-8 p-8 bg-surface-bg min-h-screen font-sans text-[color:var(--color-ink)]">
      <header className="flex items-start justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-700">
            <Activity size={22} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
              Project digital twin
            </h1>
            <p className="mt-1 text-sm text-[color:var(--color-muted)]">
              Mô phỏng dự đoán tiến độ và rủi ro (tối giản hiệu ứng theo DESIGN.md).
            </p>
          </div>
        </div>

        <button type="button" onClick={fetchBaseline} className="btn btn-secondary px-3">
          <RefreshCw size={16} />
          Làm mới
        </button>
      </header>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-5 space-y-6">
          <div className="rounded-card border border-surface-border bg-surface-card shadow-luxe p-6 space-y-6">
            <TwinPulseVisualizer
              data={{
                healthScore: baselineData.healthScore,
                velocity: currentForecast.velocityPerDay,
                atRiskCount: currentForecast.atRiskCount,
              }}
            />

            <div className="pt-4 border-t border-surface-border space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[color:var(--color-muted)]">
                  Velocity boost
                </span>
                <span className="text-lg font-semibold tabular-nums">+{velocityBoost}%</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="btn btn-secondary px-3"
                  onClick={() => setVelocityBoost((v) => Math.max(0, v - 10))}
                  aria-label="Decrease velocity boost"
                >
                  <Minus size={16} />
                </button>

                <div className="flex-1 h-2 bg-black/[0.06] rounded-full overflow-hidden">
                  <div className="h-full bg-brand-500" style={{ width: `${velocityBoost}%` }} />
                </div>

                <button
                  type="button"
                  className="btn btn-secondary px-3"
                  onClick={() => setVelocityBoost((v) => Math.min(100, v + 10))}
                  aria-label="Increase velocity boost"
                >
                  <Plus size={16} />
                </button>
              </div>

              <button
                type="button"
                onClick={handleSimulate}
                disabled={isSimulating}
                className="btn btn-primary w-full"
              >
                <Play size={16} />
                {isSimulating ? 'Đang mô phỏng…' : 'Chạy mô phỏng'}
              </button>
            </div>
          </div>

          {baselineData.executiveBrief ? (
            <div className="rounded-card border border-surface-border bg-surface-card shadow-glass p-6">
              <div className="text-sm font-semibold text-[color:var(--color-ink)]">
                Executive brief
              </div>
              <p className="mt-2 text-sm text-[color:var(--color-muted)] leading-relaxed">
                {baselineData.executiveBrief}
              </p>
            </div>
          ) : null}
        </div>

        <div className="col-span-12 lg:col-span-7 space-y-6 flex flex-col">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-card bg-emerald-50 border border-emerald-200 shadow-glass space-y-1">
              <div className="flex items-center gap-2 text-emerald-800">
                <Calendar size={16} />
                <span className="text-sm font-semibold">Ngày dự kiến</span>
              </div>
              <div className="text-xl font-semibold tabular-nums text-[color:var(--color-ink)]">
                {projectEnd.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </div>
              <div className="text-sm text-emerald-900/70">Mốc hoàn thành dự kiến</div>
            </div>

            <div className="p-5 rounded-card bg-rose-50 border border-rose-200 shadow-glass space-y-1">
              <div className="flex items-center gap-2 text-rose-800">
                <AlertTriangle size={16} />
                <span className="text-sm font-semibold">Nhiệm vụ rủi ro</span>
              </div>
              <div className="text-xl font-semibold tabular-nums text-[color:var(--color-ink)]">
                {currentForecast.atRiskCount}
              </div>
              <div className="text-sm text-rose-900/70">Cần theo dõi sát</div>
            </div>
          </div>

          <div className="flex-1 rounded-card bg-surface-card border border-surface-border shadow-luxe p-6 overflow-hidden flex flex-col">
            <h3 className="text-base font-semibold text-[color:var(--color-ink)]">
              Dự đoán nhiệm vụ
            </h3>
            <p className="mt-1 text-sm text-[color:var(--color-muted)]">
              Danh sách dự đoán theo thứ tự hoàn thành.
            </p>

            <div className="mt-4 flex-1 overflow-auto scrollbar-hide space-y-3">
              {currentForecast.predictions.map((p, i) => (
                <div
                  key={p.taskId}
                  className={`p-4 rounded-xl border transition-colors flex items-start justify-between gap-4 ${
                    p.isAtRisk
                      ? 'bg-rose-50 border-rose-200'
                      : 'bg-surface-card border-surface-border hover:bg-black/[0.02]'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`mt-0.5 w-9 h-9 rounded-lg flex items-center justify-center font-semibold text-sm shrink-0 border ${
                        p.isAtRisk
                          ? 'bg-rose-100 text-rose-800 border-rose-200'
                          : 'bg-black/[0.02] text-[color:var(--color-muted)] border-surface-border'
                      }`}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-[color:var(--color-ink)] truncate">
                        {p.title}
                      </div>
                      <div className="mt-1 text-xs text-[color:var(--color-muted)] tabular-nums">
                        Ref: {p.taskId.slice(0, 8)} · Confidence: {Math.round(p.confidence * 100)}%
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div
                      className={`text-sm font-semibold tabular-nums ${
                        p.isAtRisk ? 'text-rose-800' : 'text-emerald-800'
                      }`}
                    >
                      {new Date(p.estimatedCompletionDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                    <div className="mt-1 text-xs text-[color:var(--color-muted)]">Dự kiến</div>
                  </div>
                </div>
              ))}

              {currentForecast.predictions.length === 0 ? (
                <div className="rounded-lg border border-surface-border bg-black/[0.02] p-6 text-sm text-[color:var(--color-muted)]">
                  Chưa có dự đoán.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
