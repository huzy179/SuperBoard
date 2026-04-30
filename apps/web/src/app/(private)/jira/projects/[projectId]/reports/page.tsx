'use client';

import { useParams } from 'next/navigation';
import { useProjectReport } from '@/features/operations/reports/hooks/use-report';
import { reportService } from '@/features/operations/reports/api/report-service';
import {
  ReportChartShell,
  REPORT_AXIS_TICK,
  REPORT_GRID_PROPS,
  REPORT_LEGEND_STYLE,
  REPORT_TOOLTIP_ITEM_STYLE,
  REPORT_TOOLTIP_STYLE,
} from '@/features/operations/reports/components/report-chart-shell';
import {
  DownloadIcon,
  BarChart3Icon,
  TrendingUpIcon,
  UsersIcon,
  ClockIcon,
  AlertTriangleIcon,
  UserPlusIcon,
  ActivityIcon,
  ChevronDownIcon,
  Sparkles,
  Zap,
  Target,
  ShieldCheck,
  Cpu,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { useState } from 'react';

export default function ProjectReportsPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const { data, isLoading } = useProjectReport(projectId);
  const [isExportOpen, setIsExportOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col gap-8 bg-surface-bg p-10">
        <div className="flex justify-between items-center mb-4">
          <div className="space-y-3">
            <div className="h-4 w-32 rounded-full bg-black/[0.06]" />
            <div className="h-10 w-64 rounded-lg bg-black/[0.08]" />
          </div>
          <div className="h-10 w-36 rounded-lg bg-black/[0.06]" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 rounded-xl border border-surface-border bg-surface-card" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="h-96 rounded-xl border border-surface-border bg-surface-card" />
          <div className="h-96 rounded-xl border border-surface-border bg-surface-card" />
        </div>
      </div>
    );
  }

  const report = data?.data;
  if (!report) return null;

  const STATUS_COLORS: Record<string, string> = {
    todo: '#64748b',
    in_progress: '#3b82f6',
    in_review: '#a855f7',
    done: '#10b981',
    backlog: '#475569',
  };

  const getStatusColor = (status: string) => STATUS_COLORS[status.toLowerCase()] || '#94a3b8';

  return (
    <div className="relative min-h-screen bg-surface-bg overflow-x-hidden pt-8 pb-16 px-6 md:px-10 font-sans">
      <div className="relative z-10 mx-auto w-full max-w-[1400px] space-y-10">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-1 w-6 bg-brand-500 rounded-full" />
              <span className="text-sm font-medium text-[color:var(--color-muted)]">
                Báo cáo dự án
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-semibold text-[color:var(--color-ink)] tracking-tight leading-tight">
              Tổng quan tiến độ & hiệu suất
            </h1>
            <p className="text-sm text-[color:var(--color-muted)] max-w-2xl leading-relaxed">
              Theo dõi hoàn thành, tốc độ, cycle time và các cảnh báo sức khỏe của dự án.
            </p>
          </div>

          <div className="relative">
            <button
              onClick={() => setIsExportOpen(!isExportOpen)}
              className="group inline-flex items-center gap-2 rounded-md border border-surface-border bg-surface-card px-4 py-2.5 text-sm font-medium text-[color:var(--color-ink)] transition-colors hover:bg-black/[0.03]"
            >
              <DownloadIcon className="w-4 h-4 text-brand-600" />
              Xuất dữ liệu
              <ChevronDownIcon
                className={`w-4 h-4 text-[color:var(--color-faint)] transition-transform ${isExportOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {isExportOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-lg border border-surface-border bg-surface-card shadow-luxe p-1 z-50">
                <button
                  onClick={() => {
                    reportService.exportTasksCsv(projectId);
                    setIsExportOpen(false);
                  }}
                  className="w-full rounded-md text-left px-3 py-2 text-sm font-medium text-[color:var(--color-ink)] hover:bg-black/[0.03] flex items-center gap-2 transition-colors"
                >
                  <Cpu className="w-4 h-4 text-brand-600" />
                  CSV (.csv)
                </button>
                <div className="h-px bg-surface-border mx-1" />
                <button
                  onClick={() => {
                    reportService.exportTasksJson(projectId);
                    setIsExportOpen(false);
                  }}
                  className="w-full rounded-md text-left px-3 py-2 text-sm font-medium text-[color:var(--color-ink)] hover:bg-black/[0.03] flex items-center gap-2 transition-colors"
                >
                  <Zap className="w-4 h-4 text-indigo-600" />
                  JSON (.json)
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Intelligence Pulse Briefing */}
        <section className="rounded-xl border border-surface-border bg-surface-card p-6 shadow-sm">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-md border border-surface-border bg-brand-50 text-brand-700">
                <Sparkles size={18} />
              </div>
              <div className="space-y-1">
                <h2 className="text-sm font-semibold text-[color:var(--color-ink)]">
                  Nhận định nhanh
                </h2>
                <p className="text-sm text-[color:var(--color-muted)] leading-relaxed max-w-2xl">
                  Tỷ lệ hoàn thành hiện tại khoảng {Math.round(report.metrics.completionRate)}%. Có{' '}
                  {report.health.overdueCount} công việc quá hạn và {report.health.staleCount} công
                  việc bị “stale”.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800">
                <ShieldCheck size={14} className="text-emerald-600" />
                Tình trạng: ổn
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-surface-border bg-black/[0.02] px-3 py-1.5 text-xs font-medium text-[color:var(--color-muted)]">
                <Target size={14} className="text-brand-600" />
                Ưu tiên: giảm tồn đọng
              </span>
            </div>
          </div>
        </section>

        {/* Primary Vector Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            label="Neural Velocity"
            value={`${Math.round(report.velocity.reduce((sum, v) => sum + v.points, 0) / (report.velocity.length || 1))} SP`}
            subText="rolling average (6 months)"
            icon={<TrendingUpIcon className="w-5 h-5 text-emerald-400" />}
          />
          <StatCard
            label="Completion Vector"
            value={`${Math.round(report.metrics.completionRate)}%`}
            subText={`${report.metrics.completedStoryPoints} / ${report.metrics.totalStoryPoints} manifest points`}
            icon={<BarChart3Icon className="w-5 h-5 text-indigo-400" />}
          />
          <StatCard
            label="Mean Cycle Matrix"
            value={`${report.metrics.avgCycleTimeDays.toFixed(1)} Days`}
            subText="In Progress → Done latency"
            icon={<ClockIcon className="w-5 h-5 text-amber-500" />}
          />
          <StatCard
            label="Active Operatives"
            value={report.metrics.activeTaskCount.toString()}
            subText="Concurrent mission protocols"
            icon={<UsersIcon className="w-5 h-5 text-brand-400" />}
          />
        </div>

        {/* Critical Health Diagnostics */}
        <section className="space-y-6">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-semibold text-[color:var(--color-ink)] flex items-center gap-2">
              <ActivityIcon className="w-4 h-4 text-[color:var(--color-muted)]" />
              Cảnh báo
            </h2>
            <div className="h-px flex-1 bg-surface-border" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <HealthCard
              label="Overdue Protocols"
              value={report.health.overdueCount}
              color="rose"
              icon={<AlertTriangleIcon />}
            />
            <HealthCard
              label="Unassigned Missions"
              value={report.health.unassignedCount}
              color="amber"
              icon={<UserPlusIcon />}
            />
            <HealthCard
              label="Stale Intelligence"
              value={report.health.staleCount}
              color="slate"
              icon={<ClockIcon />}
            />
          </div>
        </section>

        {/* Neural Visualizations Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Burndown Matrix */}
          <ReportChartShell
            title="Burndown Trajectory"
            description="Tracking daily Story Point depletion matrix (14D Window)"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={report.burndown}>
                <defs>
                  <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="6 6" {...REPORT_GRID_PROPS} />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={REPORT_AXIS_TICK}
                  dy={10}
                />
                <YAxis axisLine={false} tickLine={false} tick={REPORT_AXIS_TICK} />
                <Tooltip
                  contentStyle={REPORT_TOOLTIP_STYLE}
                  itemStyle={REPORT_TOOLTIP_ITEM_STYLE}
                />
                <Legend iconType="circle" wrapperStyle={REPORT_LEGEND_STYLE} />
                <Line
                  type="monotone"
                  dataKey="remainingPoints"
                  name="Operational Reality"
                  stroke="url(#lineGradient)"
                  strokeWidth={5}
                  dot={{ r: 5, fill: '#3b82f6', strokeWidth: 0 }}
                  activeDot={{ r: 8, strokeWidth: 0, fill: '#fff' }}
                />
                <Line
                  type="monotone"
                  dataKey="idealPoints"
                  name="Perfect Trajectory"
                  stroke="rgba(0,0,0,0.12)"
                  strokeDasharray="8 8"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </ReportChartShell>

          {/* Cumulative Flow Field */}
          <ReportChartShell
            title="Cumulative Flow Field (CFD)"
            description="Temporal work-state distribution and bottleneck detection"
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={report.cumulativeFlow}>
                <CartesianGrid strokeDasharray="3 3" {...REPORT_GRID_PROPS} />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={REPORT_AXIS_TICK}
                  dy={10}
                />
                <YAxis axisLine={false} tickLine={false} tick={REPORT_AXIS_TICK} />
                <Tooltip contentStyle={REPORT_TOOLTIP_STYLE} />
                <Legend iconType="square" wrapperStyle={REPORT_LEGEND_STYLE} />
                {Object.keys(report.cumulativeFlow[0] || {})
                  .filter((k) => k !== 'date')
                  .map((status) => (
                    <Area
                      key={status}
                      type="monotone"
                      dataKey={status}
                      stackId="1"
                      stroke={getStatusColor(status)}
                      fill={getStatusColor(status)}
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                  ))}
              </AreaChart>
            </ResponsiveContainer>
          </ReportChartShell>

          {/* Team Velocity Matrix */}
          <ReportChartShell
            title="Team Flow Velocity"
            description="Monthly throughput across core operational cycles"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={report.velocity}>
                <CartesianGrid strokeDasharray="3 3" {...REPORT_GRID_PROPS} />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={REPORT_AXIS_TICK}
                  dy={10}
                />
                <YAxis axisLine={false} tickLine={false} tick={REPORT_AXIS_TICK} />
                <Tooltip
                  cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                  contentStyle={REPORT_TOOLTIP_STYLE}
                />
                <Bar dataKey="points" name="Throughput" radius={[12, 12, 0, 0]}>
                  {report.velocity.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index === report.velocity.length - 1 ? '#0075de' : '#cbd5e1'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ReportChartShell>

          {/* Neural Distribution Matrix */}
          <ReportChartShell
            title="Current State Matrix"
            description="Process step distribution and resource allocation"
          >
            <div className="space-y-6 flex-1 flex flex-col justify-center">
              {report.distribution.map((d, i) => {
                const totalTasks = report.distribution.reduce((sum, item) => sum + item.count, 0);
                const percent = (d.count / (totalTasks || 1)) * 100;
                const statusColor = getStatusColor(d.status);

                return (
                  <div key={i} className="space-y-2 group">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{
                            backgroundColor: statusColor,
                          }}
                        />
                        <span className="text-xs font-medium text-[color:var(--color-ink)]">
                          {d.status}
                        </span>
                      </div>
                      <span className="text-xs font-medium text-[color:var(--color-muted)]">
                        {d.count} • {Math.round(percent)}%
                      </span>
                    </div>
                    <div className="w-full bg-black/[0.06] h-2 rounded-full overflow-hidden border border-surface-border">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${percent}%`,
                          backgroundColor: statusColor,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </ReportChartShell>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  subText,
  icon,
}: {
  label: string;
  value: string;
  subText: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-surface-border bg-surface-card p-6 shadow-sm transition-colors hover:bg-[color:var(--color-surface-alt)]/40">
      <div className="flex items-start gap-4">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-surface-border bg-surface-bg">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-xs font-medium text-[color:var(--color-muted)]">{label}</div>
          <div className="mt-2 text-2xl font-semibold text-[color:var(--color-ink)] tracking-tight">
            {value}
          </div>
          <div className="mt-1 text-xs text-[color:var(--color-muted)] leading-relaxed">
            {subText}
          </div>
        </div>
      </div>
    </div>
  );
}

function HealthCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: 'rose' | 'amber' | 'slate';
  icon: React.ReactNode;
}) {
  const variants = {
    rose: 'bg-rose-50 border-rose-200 text-rose-800',
    amber: 'bg-amber-50 border-amber-200 text-amber-900',
    slate: 'bg-surface-card border-surface-border text-[color:var(--color-ink)]',
  };

  return (
    <div className={`p-6 rounded-xl border flex items-center gap-4 shadow-sm ${variants[color]}`}>
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-surface-border bg-white">
        {icon}
      </div>
      <div>
        <div className="text-2xl font-semibold tracking-tight leading-none">{value}</div>
        <div className="mt-1 text-xs font-medium opacity-80">{label}</div>
      </div>
    </div>
  );
}
