'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  Activity,
  Clock,
  Users,
  Folders,
  AlertCircle,
  Zap,
  Search,
  RefreshCcw,
  LayoutDashboard,
  BrainCircuit,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  Cpu,
} from 'lucide-react';
import { FullPageError } from '@/components/ui/page-states';
import { AssigneeAvatar } from '@/features/jira/components/task-badges';
import { useDashboardStats } from '@/features/dashboard/hooks';
import { EVENT_ICONS, EVENT_LABELS, STATUS_LABELS } from '@/lib/constants/task';
import { formatRelativeTime } from '@/lib/format-date';
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
  const [activityTypeFilter, setActivityTypeFilter] = useState<'all' | string>('all');
  const [activitySearchQuery, setActivitySearchQuery] = useState('');
  const safeStats = stats ?? EMPTY_DASHBOARD_STATS;

  const totalTasks = safeStats.tasksByStatus.reduce((sum, item) => sum + item.count, 0);
  const doneTasks = safeStats.tasksByStatus.find((item) => item.status === 'done')?.count ?? 0;
  const inProgressTasks =
    safeStats.tasksByStatus.find((item) => item.status === 'in_progress')?.count ?? 0;
  const maxTypeCount = Math.max(...safeStats.tasksByType.map((item) => item.count), 1);
  const maxAssigneeCount = Math.max(...safeStats.tasksByAssignee.map((item) => item.count), 1);

  const completionRatio = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const overdueRatio = totalTasks > 0 ? Math.round((safeStats.overdueTasks / totalTasks) * 100) : 0;

  const statusChartData = safeStats.tasksByStatus.map((item, index) => ({
    key: item.status,
    label: (STATUS_LABELS[item.status] ?? item.status).toUpperCase(),
    value: item.count,
    colorClass: CHART_COLOR_CLASSES[index % CHART_COLOR_CLASSES.length] ?? 'text-slate-500',
  }));

  const projectsNeedingAttention = useMemo(() => {
    return [...safeStats.tasksByProject]
      .map((project) => {
        const completionRate = project.total > 0 ? project.done / project.total : 0;
        const remainingTasks = Math.max(project.total - project.done, 0);
        return {
          ...project,
          completionRate,
          remainingTasks,
        };
      })
      .filter((project) => project.total > 0 && project.remainingTasks > 0)
      .sort((a, b) => b.remainingTasks - a.remainingTasks)
      .slice(0, 4);
  }, [safeStats.tasksByProject]);

  const activityTypeOptions = useMemo(() => {
    const uniqueTypes = new Set(safeStats.recentActivity.map((item) => item.type));
    return ['all', ...Array.from(uniqueTypes)];
  }, [safeStats.recentActivity]);

  const filteredRecentActivity = useMemo(() => {
    const normalizedQuery = activitySearchQuery.trim().toLowerCase();
    return safeStats.recentActivity.filter((event) => {
      if (activityTypeFilter !== 'all' && event.type !== activityTypeFilter) return false;
      if (!normalizedQuery) return true;
      return (
        event.taskTitle.toLowerCase().includes(normalizedQuery) ||
        (event.actorName?.toLowerCase() ?? '').includes(normalizedQuery)
      );
    });
  }, [activitySearchQuery, activityTypeFilter, safeStats.recentActivity]);

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

      {/* Operational Metric Nodes */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Distribution Matrix */}
        <div className="lg:col-span-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Status Distribution */}
            <div className="rounded-[2.5rem] border border-white/5 bg-white/[0.01] p-8 backdrop-blur-3xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-brand-500/[0.01] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
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

            {/* Completion Intelligence */}
            <div className="rounded-[2.5rem] border border-white/5 bg-white/[0.01] p-8 backdrop-blur-3xl space-y-10">
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
                    <span className="text-2xl font-black text-emerald-400">{completionRatio}%</span>
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
                    <span className="text-2xl font-black text-rose-500">{overdueRatio}%</span>
                  </div>
                  <div className="h-3 w-full bg-slate-950 rounded-full border border-white/5 p-0.5 shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-rose-600 to-rose-400 rounded-full shadow-glow-rose/30 transition-all duration-1000"
                      style={{ width: `${overdueRatio}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col items-center">
                    <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">
                      Active_Units
                    </span>
                    <span className="text-xl font-black text-white">{totalTasks}</span>
                  </div>
                  <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col items-center">
                    <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">
                      Done_Units
                    </span>
                    <span className="text-xl font-black text-brand-400">{doneTasks}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Active Signal Stream */}
          <div className="rounded-[2.5rem] border border-white/5 bg-white/[0.01] p-8 backdrop-blur-3xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 px-2">
              <div className="flex items-center gap-3">
                <Activity className="h-4 w-4 text-brand-400" />
                <h2 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">
                  Active Signal Stream
                </h2>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-white/20" />
                  <input
                    type="text"
                    value={activitySearchQuery}
                    onChange={(e) => setActivitySearchQuery(e.target.value)}
                    placeholder="FILTER_SIGNALS..."
                    className="pl-9 pr-4 py-2 bg-slate-950 border border-white/10 rounded-xl text-[10px] font-black text-white uppercase tracking-widest focus:border-brand-500/40 transition-all placeholder:text-white/5 shadow-inner"
                  />
                </div>
                <select
                  value={activityTypeFilter}
                  onChange={(e) => setActivityTypeFilter(e.target.value)}
                  className="px-4 py-2 bg-slate-950 border border-white/10 rounded-xl text-[10px] font-black text-white uppercase tracking-widest focus:border-brand-500/40 transition-all appearance-none cursor-pointer shadow-inner pr-8"
                >
                  {activityTypeOptions.map((type) => (
                    <option key={type} value={type}>
                      {type === 'all' ? 'ALL_SIGNALS' : (EVENT_LABELS[type] ?? type).toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {filteredRecentActivity.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[2rem] opacity-20">
                <Clock size={32} className="mb-4" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em]">
                  Zero Signals Detected
                </p>
              </div>
            ) : (
              <div className="grid gap-2 relative before:absolute before:left-[2.25rem] before:top-4 before:bottom-4 before:w-px before:bg-white/5">
                {filteredRecentActivity.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-6 p-4 rounded-2xl hover:bg-white/[0.02] border border-transparent hover:border-white/5 transition-all group/item relative z-10"
                  >
                    <div className="w-10 h-10 shrink-0 flex items-center justify-center bg-slate-950 border border-white/5 rounded-xl text-lg shadow-inner group-hover/item:border-brand-500/30 transition-all group-hover/item:scale-110">
                      {EVENT_ICONS[event.type] ?? '📝'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-[9px] font-black uppercase tracking-widest text-brand-400/60 group-hover/item:text-brand-400 transition-colors">
                          {EVENT_LABELS[event.type] ?? event.type}
                        </span>
                        <div className="h-1 w-1 rounded-full bg-white/10" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-white/20 italic">
                          {formatRelativeTime(event.createdAt)}
                        </span>
                      </div>
                      <p className="truncate text-sm font-black text-white/80 group-hover/item:text-white transition-colors uppercase tracking-tight">
                        {event.taskTitle}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-white/10 uppercase tracking-widest group-hover/item:text-brand-400/20 transition-colors">
                        {event.actorName ?? 'SYSTEM_KERNEL'}
                      </span>
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-500/20 group-hover/item:bg-brand-500 shadow-glow-brand transition-all" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tactical Overview Panels */}
        <div className="lg:col-span-4 space-y-8">
          {/* Attention Vectors */}
          <div className="rounded-[2.5rem] border border-white/5 bg-rose-500/[0.01] p-8 backdrop-blur-3xl relative overflow-hidden group border-rose-500/10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/[0.02] blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-4 w-4 text-rose-400" />
                <h2 className="text-[10px] font-black text-rose-500/40 uppercase tracking-[0.3em]">
                  Critical Vectors
                </h2>
              </div>
              <span className="text-[9px] font-black text-rose-500 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20 shadow-glow-rose/10 uppercase tracking-widest">
                Priority_Attention
              </span>
            </div>

            {projectsNeedingAttention.length === 0 ? (
              <p className="text-[10px] font-black text-white/10 uppercase tracking-widest text-center py-6 italic">
                No immediate threats detected
              </p>
            ) : (
              <div className="space-y-4">
                {projectsNeedingAttention.map((project) => (
                  <div
                    key={project.projectId}
                    className="rounded-2xl bg-white/[0.01] border border-white/5 hover:border-rose-500/20 p-5 group/p transition-all shadow-inner"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <Link
                        href={`/jira/projects/${project.projectId}`}
                        className="text-xs font-black text-white/60 group-hover/p:text-rose-400 transition-colors uppercase tracking-widest truncate max-w-[150px]"
                      >
                        {project.projectName}
                      </Link>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-rose-500 underline decoration-rose-500/20 underline-offset-4">
                          {project.remainingTasks} Units
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-white/5 shadow-inner">
                      <div
                        className="h-full bg-rose-500 group-hover/p:shadow-glow-rose transition-all duration-700"
                        style={{ width: `${project.completionRate * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
                <Link
                  href="/jira"
                  className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-white/[0.03] border border-white/5 text-[10px] font-black text-white/20 uppercase tracking-[0.2em] hover:text-white hover:bg-white/[0.05] hover:border-white/10 transition-all"
                >
                  View All Tactical Zones <ChevronRight size={14} />
                </Link>
              </div>
            )}
          </div>

          {/* Operator Workload */}
          <div className="rounded-[2.5rem] border border-white/5 bg-white/[0.01] p-8 backdrop-blur-3xl">
            <div className="flex items-center gap-3 mb-8">
              <Users className="h-4 w-4 text-orange-400" />
              <h2 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">
                Operator Capacity
              </h2>
            </div>

            <div className="space-y-6">
              {safeStats.tasksByAssignee.length === 0 ? (
                <p className="text-[10px] font-black text-white/10 uppercase tracking-widest text-center py-6 italic">
                  No operators provisioned
                </p>
              ) : (
                safeStats.tasksByAssignee.slice(0, 6).map((item) => (
                  <div key={item.assigneeId} className="flex items-center gap-4 group/op">
                    <div className="relative">
                      <AssigneeAvatar name={item.assigneeName} color={item.avatarColor} />
                      <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-slate-950 rounded-full border-2 border-slate-950">
                        <div className="h-full w-full bg-emerald-500 rounded-full shadow-glow-emerald" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-black text-white uppercase tracking-tight truncate">
                          {item.assigneeName}
                        </span>
                        <span className="text-[10px] font-black text-brand-400">
                          {item.count} Nodes
                        </span>
                      </div>
                      <div className="h-1 w-full bg-slate-950 rounded-full border border-white/5">
                        <div
                          className="h-full bg-brand-500 group-hover/op:shadow-glow-brand transition-all duration-700"
                          style={{ width: `${(item.count / maxAssigneeCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Protocol Classification */}
          <div className="rounded-[2.5rem] border border-white/5 bg-white/[0.01] p-8 backdrop-blur-3xl">
            <div className="flex items-center gap-3 mb-8">
              <BarChart3 className="h-4 w-4 text-indigo-400" />
              <h2 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">
                Protocol Taxonomy
              </h2>
            </div>

            <div className="flex items-end justify-between gap-3 h-32 px-2">
              {safeStats.tasksByType.map((item, idx) => (
                <div key={item.type} className="flex-1 flex flex-col items-center group/bar">
                  <span className="text-[9px] font-black text-white/20 mb-2 opacity-0 group-hover/bar:opacity-100 transition-opacity">
                    {item.count}
                  </span>
                  <div className="w-full relative px-2 flex items-end justify-center h-20">
                    <div
                      className={`w-full rounded-t-lg transition-all duration-1000 group-hover/bar:shadow-glow-current ${CHART_COLOR_CLASSES[idx % CHART_COLOR_CLASSES.length].replace('text-', 'bg-')}`}
                      style={{ height: `${(item.value / maxTypeCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-[8px] font-black text-white/40 uppercase tracking-widest mt-3 transform transition-all group-hover/bar:text-brand-400">
                    {item.type.substring(0, 4)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
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
        {/* Physical noise texture proxy */}
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

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-8 space-y-8">
          <div className="grid grid-cols-2 gap-8">
            <div className="h-72 bg-white/5 border border-white/5 rounded-[2.5rem]" />
            <div className="h-72 bg-white/5 border border-white/5 rounded-[2.5rem]" />
          </div>
          <div className="h-96 bg-white/5 border border-white/5 rounded-[2.5rem]" />
        </div>
        <div className="lg:col-span-4 space-y-8">
          <div className="h-[400px] bg-white/5 border border-white/5 rounded-[2.5rem]" />
          <div className="h-[400px] bg-white/5 border border-white/5 rounded-[2.5rem]" />
        </div>
      </div>
    </div>
  );
}
