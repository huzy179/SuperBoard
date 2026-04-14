'use client';

import { useParams } from 'next/navigation';
import { useProjectReport } from '@/features/jira/hooks/use-report';
import { reportService } from '@/features/jira/api/report-service';
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
      <div className="flex flex-col gap-8 p-10 animate-pulse bg-slate-950 min-h-screen">
        <div className="flex justify-between items-center mb-4">
          <div className="space-y-3">
            <div className="h-4 w-32 bg-white/5 rounded-full" />
            <div className="h-10 w-64 bg-white/10 rounded-2xl" />
          </div>
          <div className="h-12 w-40 bg-white/5 rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-white/5 rounded-[2rem] border border-white/5" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="h-96 bg-white/5 rounded-[3rem] border border-white/5" />
          <div className="h-96 bg-white/5 rounded-[3rem] border border-white/5" />
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
    <div className="relative min-h-screen bg-slate-950 overflow-x-hidden pt-10 pb-24 px-8 md:px-12 font-sans">
      {/* Mesh Gradients Backgrounds */}
      <div className="fixed -top-40 -right-40 w-[600px] h-[600px] bg-brand-500/10 rounded-full blur-[140px] pointer-events-none opacity-50" />
      <div className="fixed -bottom-40 -left-10 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none opacity-40" />

      <div className="relative z-10 max-w-7xl mx-auto space-y-12">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-1 w-6 bg-brand-500 rounded-full shadow-glow-brand" />
              <span className="text-[10px] font-black text-brand-400 uppercase tracking-[0.4em]">
                Operational Analytics
              </span>
            </div>
            <h1 className="text-5xl font-black text-white tracking-tighter uppercase leading-none">
              Mission Intelligence
            </h1>
            <p className="text-sm font-medium text-white/40 tracking-wide max-w-lg">
              High-fidelity performance metrics, velocity vectors, and project health diagnostics.
            </p>
          </div>

          <div className="relative">
            <button
              onClick={() => setIsExportOpen(!isExportOpen)}
              className="group flex items-center gap-3 bg-white/5 border border-white/10 text-white px-6 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest hover:bg-white/10 hover:border-brand-500/30 transition-all shadow-glass"
            >
              <DownloadIcon className="w-4 h-4 text-brand-400" />
              Manifest Deployment
              <ChevronDownIcon
                className={`w-3 h-3 text-white/20 transition-transform ${isExportOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {isExportOpen && (
              <div className="absolute right-0 mt-3 w-64 bg-slate-900 shadow-glass border border-white/10 rounded-3xl overflow-hidden py-2 z-50 animate-in fade-in zoom-in-95 duration-300 backdrop-blur-3xl">
                <button
                  onClick={() => {
                    reportService.exportTasksCsv(projectId);
                    setIsExportOpen(false);
                  }}
                  className="w-full text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/5 flex items-center gap-3 transition-colors"
                >
                  <Cpu className="w-4 h-4 text-brand-400" />
                  Satellite CSV (.csv)
                </button>
                <div className="h-px bg-white/5 mx-6" />
                <button
                  onClick={() => {
                    reportService.exportTasksJson(projectId);
                    setIsExportOpen(false);
                  }}
                  className="w-full text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/5 flex items-center gap-3 transition-colors"
                >
                  <Zap className="w-4 h-4 text-indigo-400" />
                  Core JSON (.json)
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Intelligence Pulse Briefing */}
        <section className="relative group overflow-hidden rounded-[3rem] border border-brand-500/20 bg-brand-500/5 p-10 animate-in slide-in-from-top-6 duration-700">
          {/* Glow Line */}
          <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-brand-500/50 to-transparent" />

          <div className="flex flex-col md:flex-row gap-10 items-start md:items-center">
            <div className="p-6 bg-brand-500/10 rounded-[2rem] border border-brand-500/20">
              <Sparkles size={32} className="text-brand-400 animate-pulse" />
            </div>
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-3">
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-400">
                  Mission Intelligence Pulse
                </h2>
                <div className="px-2 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                  <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">
                    System Online
                  </span>
                </div>
              </div>
              <p className="text-xl font-bold text-white tracking-tight leading-relaxed italic">
                "Phase completion vectors are tracking at{' '}
                {Math.round(report.metrics.completionRate)}%. Operational friction detected in{' '}
                {report.health.overdueCount} overdue protocols. Recommend high-priority allocation
                to stale nodes."
              </p>
              <div className="flex gap-6 pt-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={14} className="text-emerald-400" />
                  <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">
                    Health Level: Optimal
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Target size={14} className="text-indigo-400" />
                  <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">
                    Strategy: Velocity Acceleration
                  </span>
                </div>
              </div>
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
            <h2 className="text-[10px] font-black text-white uppercase tracking-[0.5em] flex items-center gap-3">
              <ActivityIcon className="w-4 h-4 text-brand-400" />
              Health Diagnostics
            </h2>
            <div className="h-px flex-1 bg-white/5" />
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
          <ChartShell
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
                <CartesianGrid
                  strokeDasharray="6 6"
                  vertical={false}
                  stroke="rgba(255,255,255,0.03)"
                />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)', fontWeight: 900 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)', fontWeight: 900 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    borderRadius: '24px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.5)',
                    backdropFilter: 'blur(16px)',
                    padding: '16px',
                  }}
                  itemStyle={{
                    fontSize: '10px',
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                  }}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{
                    fontSize: '9px',
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    letterSpacing: '0.2em',
                    paddingTop: '30px',
                  }}
                />
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
                  stroke="rgba(255,255,255,0.1)"
                  strokeDasharray="8 8"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartShell>

          {/* Cumulative Flow Field */}
          <ChartShell
            title="Cumulative Flow Field (CFD)"
            description="Temporal work-state distribution and bottleneck detection"
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={report.cumulativeFlow}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="rgba(255,255,255,0.03)"
                />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)', fontWeight: 900 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)', fontWeight: 900 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    borderRadius: '24px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(16px)',
                  }}
                />
                <Legend
                  iconType="square"
                  wrapperStyle={{
                    fontSize: '9px',
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    letterSpacing: '0.2em',
                    paddingTop: '30px',
                  }}
                />
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
          </ChartShell>

          {/* Team Velocity Matrix */}
          <ChartShell
            title="Team Flow Velocity"
            description="Monthly throughput across core operational cycles"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={report.velocity}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="rgba(255,255,255,0.03)"
                />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)', fontWeight: 900 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)', fontWeight: 900 }}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    borderRadius: '24px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(16px)',
                  }}
                />
                <Bar dataKey="points" name="Throughput" radius={[12, 12, 0, 0]}>
                  {report.velocity.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index === report.velocity.length - 1 ? '#3b82f6' : '#1e293b'}
                      className="transition-all duration-700"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartShell>

          {/* Neural Distribution Matrix */}
          <ChartShell
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
                          className="w-2 h-2 rounded-full shadow-glow"
                          style={{
                            backgroundColor: statusColor,
                            boxShadow: `0 0 10px ${statusColor}`,
                          }}
                        />
                        <span className="text-[10px] font-black text-white/60 uppercase tracking-widest group-hover:text-white transition-colors">
                          {d.status}
                        </span>
                      </div>
                      <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">
                        {d.count} Units // {Math.round(percent)}%
                      </span>
                    </div>
                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/5">
                      <div
                        className="h-full rounded-full transition-all duration-1000 shadow-glow"
                        style={{
                          width: `${percent}%`,
                          backgroundColor: statusColor,
                          boxShadow: `0 0 15px ${statusColor}40`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </ChartShell>
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
    <div className="group relative bg-white/5 p-8 rounded-[2.5rem] border border-white/5 shadow-glass backdrop-blur-3xl overflow-hidden transition-all hover:scale-[1.02] hover:bg-white/[0.07] hover:border-white/10">
      <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />
      <div className="relative z-10 flex flex-col h-full justify-between">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-slate-900 rounded-2xl border border-white/5 shadow-luxe group-hover:border-brand-500/30 transition-all">
            {icon}
          </div>
          <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">
            {label}
          </span>
        </div>
        <div>
          <div className="text-4xl font-black text-white tracking-tighter leading-none mb-2">
            {value}
          </div>
          <div className="text-[9px] font-bold text-white/20 uppercase tracking-widest leading-relaxed">
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
    rose: 'text-rose-400 bg-rose-500/10 border-rose-500/20 shadow-glow-rose',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20 shadow-glow-amber',
    slate: 'text-white/40 bg-white/5 border-white/5 shadow-none',
  };

  return (
    <div
      className={`p-8 rounded-[2rem] border transition-all hover:scale-[1.02] flex items-center gap-6 ${variants[color]}`}
    >
      <div className="p-4 bg-slate-950/80 rounded-2xl border border-white/5">{icon}</div>
      <div>
        <div className="text-3xl font-black tracking-tighter leading-none">{value}</div>
        <div className="text-[9px] font-black uppercase tracking-widest mt-1 opacity-60">
          {label}
        </div>
      </div>
    </div>
  );
}

function ChartShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col bg-white/5 p-10 rounded-[3.5rem] border border-white/5 shadow-glass backdrop-blur-3xl group hover:border-white/10 transition-all min-h-[500px]">
      <div className="mb-10 space-y-2">
        <h3 className="text-xl font-black text-white tracking-tight uppercase leading-none">
          {title}
        </h3>
        <p className="text-[10px] font-bold text-white/20 tracking-wider uppercase leading-none">
          {description}
        </p>
      </div>
      <div className="flex-1 min-h-[300px]">{children}</div>
    </div>
  );
}
