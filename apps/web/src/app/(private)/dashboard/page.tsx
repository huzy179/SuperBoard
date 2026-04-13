'use client';

import { useEffect, useState } from 'react';
import {
  Activity,
  AlertCircle,
  BrainCircuit,
  Cpu,
  Folders,
  LayoutDashboard,
  RefreshCcw,
  ShieldCheck,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { AdaptiveWidget } from '@/components/dashboard/adaptive-widget';
import { FullPageError } from '@/components/ui/page-states';
import { useDashboardStats } from '@/features/dashboard/hooks';
import { STATUS_LABELS } from '@/lib/constants/task';
import type { DashboardStatsDTO } from '@superboard/shared';

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

export default function DashboardPage() {
  const { data: stats, isLoading, isError, error } = useDashboardStats();
  const [adaptiveLayout, setAdaptiveLayout] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    fetch('/api/v1/executive/adaptive-layout')
      .then((res) => res.json())
      .then((body) => setAdaptiveLayout(body.data))
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
    label: (STATUS_LABELS[item.status] ?? item.status).toUpperCase(),
    value: item.count,
    colorClass: CHART_COLOR_CLASSES[index % CHART_COLOR_CLASSES.length] ?? 'text-slate-500',
  }));

  if (isLoading) return <DashboardSkeleton />;

  if (isError || !stats) {
    return (
      <FullPageError
        title="DASHBOARD_SYSCALL_FAILED"
        message={error?.message ?? 'KERNEL_PANIC: UNEXPECTED_DASHBOARD_STATE'}
        actionLabel="RETRY_SYSCALL"
        onAction={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Strategic Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-500/10 rounded-xl border border-brand-500/20 shadow-glow-brand/10">
              <LayoutDashboard className="h-5 w-5 text-brand-400" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">
              Operational Sector
            </span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white uppercase leading-none">
            Strategic <span className="text-brand-500">Command</span>
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-black uppercase tracking-widest text-white/20">
              System Status
            </span>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-glow-emerald" />
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                Sync_Active
              </span>
            </div>
          </div>
          <div className="h-10 w-px bg-white/10 hidden md:block" />
          <button
            onClick={() => window.location.reload()}
            className="p-3 bg-white/[0.03] border border-white/10 rounded-2xl text-white/40 hover:text-white hover:border-white/20 hover:bg-white/[0.05] transition-all group"
          >
            <RefreshCcw className="h-5 w-5 group-hover:rotate-180 transition-transform duration-700" />
          </button>
        </div>
      </div>

      {/* Liquid Operational Matrix */}
      <div className="flex flex-col gap-10">
        {adaptiveLayout
          .sort((a, b) => a.order - b.order)
          .map((module) => {
            if (module.id === 'STATS')
              return (
                <div key="STATS" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard
                    label="Total Protocols"
                    value={totalTasks}
                    icon={<Folders className="h-5 w-5" />}
                    color="brand"
                    trend={`${completionRatio}% Done`}
                    delay={0}
                  />
                  <StatCard
                    label="Synchronized"
                    value={doneTasks}
                    icon={<ShieldCheck className="h-5 w-5" />}
                    color="emerald"
                    trend="Success State"
                    delay={1}
                  />
                  <StatCard
                    label="Active Processing"
                    value={inProgressTasks}
                    icon={<Zap className="h-5 w-5" />}
                    color="blue"
                    trend="Live Ops"
                    delay={2}
                  />
                  <StatCard
                    label="Stalled Units"
                    value={safeStats.overdueTasks}
                    icon={<AlertCircle className="h-5 w-5" />}
                    color="rose"
                    trend={`${overdueRatio}% Critical`}
                    delay={3}
                  />
                </div>
              );

            if (module.id === 'MATRIX' || module.id === 'EFFICIENCY') {
              return (
                <div key="DISTRIBUTION" className="grid gap-8 lg:grid-cols-2">
                  <AdaptiveWidget order={module.order} focus={module.focus}>
                    <div className="rounded-[2.5rem] border border-white/5 bg-white/[0.01] p-8 backdrop-blur-3xl h-full">
                      <div className="flex items-center gap-3 mb-8">
                        <BrainCircuit className="h-4 w-4 text-brand-400" />
                        <h2 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">
                          State Matrix Distribution
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
                    <div className="rounded-[2.5rem] border border-white/5 bg-white/[0.01] p-8 backdrop-blur-3xl h-full space-y-10">
                      <div className="flex items-center gap-3">
                        <TrendingUp className="h-4 w-4 text-emerald-400" />
                        <h2 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">
                          Objective Efficiency
                        </h2>
                      </div>
                      <div className="space-y-8">
                        <div className="space-y-3">
                          <div className="flex justify-between items-end px-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
                              Sync Completion
                            </span>
                            <span className="text-2xl font-black text-emerald-400">
                              {completionRatio}%
                            </span>
                          </div>
                          <div className="h-3 w-full bg-slate-950 rounded-full border border-white/5 p-0.5 shadow-inner">
                            <div
                              className="h-full bg-gradient-to-r from-brand-500 to-emerald-500 rounded-full shadow-glow-emerald/30 transition-all duration-1000"
                              style={{ width: `${completionRatio}%` }}
                            />
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between items-end px-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
                              Stalled Latency
                            </span>
                            <span className="text-2xl font-black text-rose-500">
                              {overdueRatio}%
                            </span>
                          </div>
                          <div className="h-3 w-full bg-slate-950 rounded-full border border-white/5 p-0.5 shadow-inner">
                            <div
                              className="h-full bg-gradient-to-r from-rose-600 to-rose-400 rounded-full shadow-glow-rose/30 transition-all duration-1000"
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
                  <div className="rounded-[2.5rem] border border-white/5 bg-white/[0.01] p-8 backdrop-blur-3xl">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 px-2">
                      <div className="flex items-center gap-3">
                        <Activity className="h-4 w-4 text-brand-400" />
                        <h2 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">
                          Active Signal Stream
                        </h2>
                      </div>
                    </div>
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-widest text-center py-10 italic">
                      Signals dynamically prioritized by AI Intelligence
                    </p>
                  </div>
                </AdaptiveWidget>
              );

            if (module.id === 'VECTORS')
              return (
                <AdaptiveWidget key="VECTORS" order={module.order} focus={module.focus}>
                  <div className="rounded-[2.5rem] border border-white/5 bg-rose-500/[0.01] p-8 backdrop-blur-3xl border-rose-500/10 h-full">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="h-4 w-4 text-rose-400" />
                        <h2 className="text-[10px] font-black text-rose-500/40 uppercase tracking-[0.3em]">
                          Critical Vectors
                        </h2>
                      </div>
                    </div>
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-widest text-center py-6 italic">
                      Threat vectors synthesized via Neural Simulation
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

function DonutDistributionChart({
  items,
  total,
  emptyMessage,
}: {
  items: Array<{ key: string; label: string; value: number; colorClass: string }>;
  total: number;
  emptyMessage: string;
}) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;

  if (items.length === 0 || total === 0) {
    return (
      <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[2rem] opacity-20">
        <Cpu size={32} className="mb-4" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em]">{emptyMessage}</p>
      </div>
    );
  }

  let currentOffset = 0;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 items-center">
      <div className="relative flex justify-center">
        <svg
          viewBox="0 0 100 100"
          className="h-48 w-48 -rotate-90 drop-shadow-[0_0_15px_rgba(255,255,255,0.05)]"
        >
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            className="text-white/[0.02]"
          />
          {items.map((item) => {
            const segmentLength = (item.value / total) * circumference;
            const dashOffset = -currentOffset;
            currentOffset += segmentLength;

            return (
              <circle
                key={item.key}
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${segmentLength} ${circumference}`}
                strokeDashoffset={dashOffset}
                className={`${item.colorClass} transition-all duration-1000 ease-out`}
                style={{
                  filter: `drop-shadow(0 0 8px currentColor)`,
                  strokeDashoffset: dashOffset,
                }}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-black text-white tracking-tighter leading-none">
            {total}
          </span>
          <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] mt-2">
            Active Nodes
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {items.map((item) => {
          const percent = Math.round((item.value / total) * 100);
          return (
            <div
              key={item.key}
              className="group/legend flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-white/10 transition-all"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`h-2 w-2 rounded-full shadow-glow-current transition-transform group-hover/legend:scale-150 ${item.colorClass.replace('text-', 'bg-')}`}
                />
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest group-hover/legend:text-white transition-colors">
                  {item.label}
                </span>
              </div>
              <div className="text-right">
                <span className="block text-sm font-black text-white tracking-tight">
                  {item.value} Units
                </span>
                <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">
                  {percent}% Weight
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
  trend,
  delay,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: 'brand' | 'emerald' | 'blue' | 'rose';
  trend: string;
  delay: number;
}) {
  const colorMap = {
    brand: 'border-brand-500/20 text-brand-400 bg-brand-500/10 shadow-glow-brand/5',
    emerald: 'border-emerald-500/20 text-emerald-400 bg-emerald-500/10 shadow-glow-emerald/5',
    blue: 'border-blue-500/20 text-blue-400 bg-blue-500/10 shadow-glow-blue/5',
    rose: 'border-rose-500/20 text-rose-400 bg-rose-500/10 shadow-glow-rose/5',
  };

  const glowMap = {
    brand: 'bg-brand-500/5 shadow-glow-brand/20',
    emerald: 'bg-emerald-500/5 shadow-glow-emerald/20',
    blue: 'bg-blue-500/5 shadow-glow-blue/20',
    rose: 'bg-rose-500/5 shadow-glow-rose/20',
  };

  return (
    <div
      className="group relative animate-in slide-in-from-bottom-8 duration-700"
      style={{ animationDelay: `${delay * 100}ms`, animationFillMode: 'both' }}
    >
      <div
        className={`absolute inset-x-8 -bottom-4 h-8 ${glowMap[color]} blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700`}
      />
      <div
        className={`relative h-full rounded-[2.5rem] border border-white/5 bg-white/[0.01] p-8 backdrop-blur-3xl transition-all duration-500 hover:bg-white/[0.03] hover:-translate-y-2 hover:border-white/10 shadow-inner overflow-hidden`}
      >
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-100" />
        <div className="flex items-start justify-between relative z-10 mb-8">
          <div
            className={`p-4 rounded-2xl border ${colorMap[color]} transition-transform duration-700 group-hover:scale-110 group-hover:rotate-6`}
          >
            {icon}
          </div>
          <div className="text-right">
            <span className="block text-[8px] font-black uppercase tracking-[0.3em] text-white/20 mb-1">
              Telemetry
            </span>
            <span
              className={`text-[10px] font-black uppercase tracking-widest ${color === 'rose' ? 'text-rose-500 animate-pulse' : 'text-white/40'}`}
            >
              {trend}
            </span>
          </div>
        </div>
        <div className="relative z-10">
          <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-2 pl-1">
            {label}
          </p>
          <p className="text-5xl font-black text-white tracking-tighter tabular-nums leading-none">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-10 animate-pulse">
      <div className="flex justify-between items-end">
        <div className="space-y-4">
          <div className="h-3 w-32 bg-white/5 rounded-full" />
          <div className="h-12 w-96 bg-white/5 rounded-2xl" />
        </div>
        <div className="h-10 w-10 bg-white/5 rounded-2xl" />
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-64 bg-white/5 border border-white/5 rounded-[2.5rem]" />
        ))}
      </div>
      <div className="h-96 bg-white/5 border border-white/5 rounded-[2.5rem]" />
    </div>
  );
}
