'use client';

import { useEffect, useState } from 'react';
import {
  Activity,
  AlertCircle,
  BrainCircuit,
  Folders,
  LayoutDashboard,
  RefreshCcw,
  ShieldCheck,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { AdaptiveWidget } from '@/features/operations/dashboard/components/adaptive-widget';
import { FullPageError } from '@/components/ui/page-states';
import { useDashboardStats } from '@/features/operations/dashboard/hooks';
import { STATUS_LABELS } from '@/lib/constants/task';
import type { DashboardStatsDTO } from '@superboard/shared';

import { StatCard } from '@/features/operations/dashboard/components/stat-card';
import { DonutDistributionChart } from '@/features/operations/dashboard/components/distribution-chart';
import { DashboardSkeleton } from '@/features/operations/dashboard/components/dashboard-skeleton';
import { getAdaptiveLayout } from '@/features/intelligence/executive/api/executive-service';

const CHART_COLOR_CLASSES = [
  'text-brand-500',
  'text-indigo-500',
  'text-emerald-500',
  'text-rose-500',
  'text-amber-500',
  'text-sky-500',
  'text-violet-500',
];

const EMPTY_DASHBOARD_STATS: DashboardStatsDTO = {
  tasksByStatus: [],
  tasksByPriority: [],
  tasksByType: [],
  tasksByAssignee: [],
  tasksByProject: [],
  overdueTasks: 0,
  recentActivity: [],
};

type DashboardModuleId = 'STATS' | 'MATRIX' | 'EFFICIENCY' | 'SIGNALS' | 'VECTORS';

interface DashboardModule {
  id: DashboardModuleId;
  order: number;
  focus: boolean;
}

const VALID_DASHBOARD_MODULE_IDS: DashboardModuleId[] = [
  'STATS',
  'MATRIX',
  'EFFICIENCY',
  'SIGNALS',
  'VECTORS',
];

const DEFAULT_DASHBOARD_LAYOUT: DashboardModule[] = [
  { id: 'STATS', order: 0, focus: false },
  { id: 'MATRIX', order: 1, focus: false },
  { id: 'EFFICIENCY', order: 2, focus: false },
  { id: 'SIGNALS', order: 3, focus: false },
  { id: 'VECTORS', order: 4, focus: false },
];

function isDashboardModuleId(value: unknown): value is DashboardModuleId {
  return (
    typeof value === 'string' && VALID_DASHBOARD_MODULE_IDS.includes(value as DashboardModuleId)
  );
}

function parseAdaptiveLayout(payload: unknown): DashboardModule[] {
  if (!Array.isArray(payload)) {
    throw new TypeError('adaptiveLayout.data must be an array');
  }

  return payload.map((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new TypeError(`adaptiveLayout.data[${index}] must be an object`);
    }

    const candidate = item as { id?: unknown; order?: unknown; focus?: unknown };

    if (!isDashboardModuleId(candidate.id)) {
      throw new TypeError(`adaptiveLayout.data[${index}].id has unknown type`);
    }

    if (typeof candidate.order !== 'number') {
      throw new TypeError(`adaptiveLayout.data[${index}].order must be a number`);
    }

    if (typeof candidate.focus !== 'boolean') {
      throw new TypeError(`adaptiveLayout.data[${index}].focus must be a boolean`);
    }

    return {
      id: candidate.id,
      order: candidate.order,
      focus: candidate.focus,
    };
  });
}

export default function DashboardPage() {
  const { data: stats, isLoading, isError, error } = useDashboardStats();
  const [adaptiveLayout, setAdaptiveLayout] = useState<DashboardModule[]>(DEFAULT_DASHBOARD_LAYOUT);

  useEffect(() => {
    getAdaptiveLayout()
      .then((data) => setAdaptiveLayout(parseAdaptiveLayout(data)))
      .catch(() => {});
  }, []);

  const safeStats = stats ?? EMPTY_DASHBOARD_STATS;
  const totalTasks = safeStats.tasksByStatus.reduce((sum, item) => sum + item.count, 0);
  const doneTasks = safeStats.tasksByStatus.find((item) => item.status === 'done')?.count ?? 0;
  const inProgressTasks =
    safeStats.tasksByStatus.find((item) => item.status === 'in_progress')?.count ?? 0;

  const completionRatio = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const overdueRatio = totalTasks > 0 ? Math.round((safeStats.overdueTasks / totalTasks) * 100) : 0;

  const statusChartData = safeStats.tasksByStatus.map((item, index) => ({
    key: item.status,
    label: STATUS_LABELS[item.status] ?? item.status,
    value: item.count,
    colorClass: CHART_COLOR_CLASSES[index % CHART_COLOR_CLASSES.length] ?? 'text-slate-500',
  }));

  if (isLoading) return <DashboardSkeleton />;

  if (isError || !stats) {
    return (
      <FullPageError
        title="Không thể tải dữ liệu tổng quan"
        message={error?.message ?? 'Đã xảy ra lỗi khi tải dashboard'}
        actionLabel="Thử lại"
        onAction={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="space-y-10">
      {/* Strategic Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-50 rounded-lg border border-brand-500/15">
              <LayoutDashboard className="h-5 w-5 text-brand-500" />
            </div>
            <span className="text-sm font-medium text-[color:var(--color-muted)]">Tổng quan</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-[color:var(--color-ink)] leading-tight">
            Strategic <span className="text-brand-500">Dashboard</span>
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-xs text-[color:var(--color-muted)]">System status</span>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="text-xs font-medium text-emerald-700">Sync active</span>
            </div>
          </div>
          <div className="h-10 w-px bg-surface-border hidden md:block" />
          <button
            onClick={() => window.location.reload()}
            className="p-3 bg-black/[0.02] border border-surface-border rounded-lg text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)] hover:bg-black/[0.04] transition-colors"
          >
            <RefreshCcw className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Liquid Operational Matrix */}
      <div className="flex flex-col gap-10">
        {[...adaptiveLayout]
          .sort((a, b) => a.order - b.order)
          .map((module) => {
            if (module.id === 'STATS')
              return (
                <div key="STATS" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard
                    label="Tổng công việc"
                    value={totalTasks}
                    icon={<Folders className="h-5 w-5" />}
                    color="brand"
                    trend={`${completionRatio}% hoàn thành`}
                    delay={0}
                  />
                  <StatCard
                    label="Đã hoàn thành"
                    value={doneTasks}
                    icon={<ShieldCheck className="h-5 w-5" />}
                    color="emerald"
                    trend="Tiến độ tốt"
                    delay={1}
                  />
                  <StatCard
                    label="Đang thực hiện"
                    value={inProgressTasks}
                    icon={<Zap className="h-5 w-5" />}
                    color="blue"
                    trend="Đang xử lý"
                    delay={2}
                  />
                  <StatCard
                    label="Quá hạn"
                    value={safeStats.overdueTasks}
                    icon={<AlertCircle className="h-5 w-5" />}
                    color="rose"
                    trend={`${overdueRatio}% cần chú ý`}
                    delay={3}
                  />
                </div>
              );

            if (module.id === 'MATRIX' || module.id === 'EFFICIENCY') {
              return (
                <div key="DISTRIBUTION" className="grid gap-8 lg:grid-cols-2">
                  <AdaptiveWidget order={module.order} focus={module.focus}>
                    <div className="rounded-xl border border-surface-border bg-surface-card p-8 shadow-luxe h-full">
                      <div className="flex items-center gap-3 mb-8">
                        <BrainCircuit className="h-4 w-4 text-brand-500" />
                        <h2 className="text-sm font-semibold text-[color:var(--color-muted)]">
                          Distribution
                        </h2>
                      </div>
                      <DonutDistributionChart
                        items={statusChartData}
                        total={totalTasks}
                        emptyMessage="EMPTY_DATA_SET"
                      />
                    </div>
                  </AdaptiveWidget>
                  <AdaptiveWidget
                    order={module.order + 1}
                    focus={module.id === 'EFFICIENCY' ? module.focus : false}
                  >
                    <div className="rounded-xl border border-surface-border bg-surface-card p-8 shadow-luxe h-full space-y-10">
                      <div className="flex items-center gap-3">
                        <TrendingUp className="h-4 w-4 text-emerald-600" />
                        <h2 className="text-sm font-semibold text-[color:var(--color-muted)]">
                          Efficiency
                        </h2>
                      </div>
                      <div className="space-y-8">
                        <div className="space-y-3">
                          <div className="flex justify-between items-end px-2">
                            <span className="text-xs font-medium text-[color:var(--color-muted)]">
                              Hoàn thành
                            </span>
                            <span className="text-2xl font-semibold text-emerald-700">
                              {completionRatio}%
                            </span>
                          </div>
                          <div className="h-2 w-full bg-black/[0.06] rounded-full border border-surface-border overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${completionRatio}%` }}
                            />
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between items-end px-2">
                            <span className="text-xs font-medium text-[color:var(--color-muted)]">
                              Quá hạn
                            </span>
                            <span className="text-2xl font-semibold text-rose-700">
                              {overdueRatio}%
                            </span>
                          </div>
                          <div className="h-2 w-full bg-black/[0.06] rounded-full border border-surface-border overflow-hidden">
                            <div
                              className="h-full bg-rose-500 rounded-full"
                              style={{ width: `${overdueRatio}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </AdaptiveWidget>
                </div>
              );
            }

            if (module.id === 'SIGNALS')
              return (
                <AdaptiveWidget key="SIGNALS" order={module.order} focus={module.focus}>
                  <div className="rounded-xl border border-surface-border bg-surface-card p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                      <Activity className="h-4 w-4 text-[color:var(--color-muted)]" />
                      <h2 className="text-sm font-semibold text-[color:var(--color-muted)]">
                        Signals
                      </h2>
                    </div>
                    <p className="text-sm text-[color:var(--color-muted)] text-center py-10">
                      Tính năng signals đang được hoàn thiện.
                    </p>
                  </div>
                </AdaptiveWidget>
              );

            if (module.id === 'VECTORS')
              return (
                <AdaptiveWidget key="VECTORS" order={module.order} focus={module.focus}>
                  <div className="rounded-xl border border-surface-border bg-surface-card p-8 shadow-sm h-full">
                    <div className="flex items-center gap-3 mb-6">
                      <AlertCircle className="h-4 w-4 text-rose-600" />
                      <h2 className="text-sm font-semibold text-[color:var(--color-muted)]">
                        Vectors
                      </h2>
                    </div>
                    <p className="text-sm text-[color:var(--color-muted)] text-center py-6">
                      Tính năng vectors đang được hoàn thiện.
                    </p>
                  </div>
                </AdaptiveWidget>
              );

            return null;
          })}
      </div>
    </div>
  );
}
