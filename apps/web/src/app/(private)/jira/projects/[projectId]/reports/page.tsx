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
      <div className="flex flex-col gap-6 p-8 animate-pulse">
        <div className="h-8 w-48 bg-slate-200 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-slate-100 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-slate-100 rounded-xl" />
          <div className="h-64 bg-slate-100 rounded-xl" />
        </div>
      </div>
    );
  }

  const report = data?.data;
  if (!report) return null;

  const STATUS_COLORS: Record<string, string> = {
    todo: '#94a3b8',
    in_progress: '#3b82f6',
    in_review: '#a855f7',
    done: '#22c55e',
    backlog: '#64748b',
  };

  const getStatusColor = (status: string) => STATUS_COLORS[status.toLowerCase()] || '#cbd5e1';

  return (
    <div className="flex flex-col gap-8 p-8 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Báo cáo dự án</h1>
          <p className="text-slate-500 mt-1">Phân tích hiệu suất, tiến độ và sức khỏe dự án</p>
        </div>
        <div className="relative">
          <button
            onClick={() => setIsExportOpen(!isExportOpen)}
            className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-brand-700 transition-colors shadow-sm"
          >
            <DownloadIcon className="w-4 h-4" />
            Xuất dữ liệu
            <ChevronDownIcon
              className={`w-4 h-4 transition-transform ${isExportOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {isExportOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
              <button
                onClick={() => {
                  reportService.exportTasksCsv(projectId);
                  setIsExportOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                Xuất file CSV (.csv)
              </button>
              <button
                onClick={() => {
                  reportService.exportTasksJson(projectId);
                  setIsExportOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                Xuất file JSON (.json)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Velocity TB"
          value={`${Math.round(report.velocity.reduce((sum, v) => sum + v.points, 0) / (report.velocity.length || 1))} SP`}
          subText="6 tháng gần nhất"
          icon={<TrendingUpIcon className="w-5 h-5 text-emerald-600" />}
        />
        <StatCard
          label="Tỷ lệ hoàn thành"
          value={`${Math.round(report.metrics.completionRate)}%`}
          subText={`${report.metrics.completedStoryPoints} / ${report.metrics.totalStoryPoints} SP`}
          icon={<BarChart3Icon className="w-5 h-5 text-indigo-600" />}
        />
        <StatCard
          label="Cycle Time TB"
          value={`${report.metrics.avgCycleTimeDays.toFixed(1)} ngày`}
          subText="In Progress → Done"
          icon={<ClockIcon className="w-5 h-5 text-amber-600" />}
        />
        <StatCard
          label="Task đang mở"
          value={report.metrics.activeTaskCount.toString()}
          subText="Trong sprint/project"
          icon={<UsersIcon className="w-5 h-5 text-blue-600" />}
        />
      </div>

      {/* Health Metrics */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <ActivityIcon className="w-5 h-5 text-brand-600" />
          Sức khỏe dự án
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-rose-50 border border-rose-100 p-5 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-white rounded-xl shadow-sm">
              <AlertTriangleIcon className="w-6 h-6 text-rose-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-rose-900">{report.health.overdueCount}</div>
              <div className="text-sm font-medium text-rose-700">Công việc quá hạn</div>
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-100 p-5 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-white rounded-xl shadow-sm">
              <UserPlusIcon className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-900">
                {report.health.unassignedCount}
              </div>
              <div className="text-sm font-medium text-amber-700">Chưa có người xử lý</div>
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-white rounded-xl shadow-sm">
              <ClockIcon className="w-6 h-6 text-slate-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{report.health.staleCount}</div>
              <div className="text-sm font-medium text-slate-700">Ít tương tác (&gt;7 ngày)</div>
            </div>
          </div>
        </div>
      </section>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Burndown Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-900">Biểu đồ Burndown</h3>
            <p className="text-sm text-slate-500">
              Theo dõi tiến độ Story Points (14 ngày gần nhất)
            </p>
          </div>
          <div className="h-72 w-full mt-auto">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={report.burndown}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                <Line
                  type="monotone"
                  dataKey="remainingPoints"
                  name="Thực tế"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="idealPoints"
                  name="Lý tưởng"
                  stroke="#94a3b8"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cumulative Flow Diagram */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-900">Biểu đồ Cumulative Flow (CFD)</h3>
            <p className="text-sm text-slate-500">Phân bổ trạng thái công việc theo thời gian</p>
          </div>
          <div className="h-72 w-full mt-auto">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={report.cumulativeFlow}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Legend iconType="square" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
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
                      fillOpacity={0.6}
                    />
                  ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Team Velocity Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-900">Năng suất Team (Team Velocity)</h3>
            <p className="text-sm text-slate-500">Số Story Points hoàn thành hàng tháng</p>
          </div>
          <div className="h-72 w-full mt-auto">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={report.velocity}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Bar dataKey="points" name="Story Points" radius={[6, 6, 0, 0]}>
                  {report.velocity.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index === report.velocity.length - 1 ? '#3b82f6' : '#94a3b8'}
                      fillOpacity={0.8}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution (New Version) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-900">Phân bổ trạng thái hiện tại</h3>
            <p className="text-sm text-slate-500">Tỉ lệ task theo từng bước quy trình</p>
          </div>
          <div className="space-y-5 mt-auto">
            {report.distribution.map((d, i) => {
              const totalTasks = report.distribution.reduce((sum, item) => sum + item.count, 0);
              const percent = (d.count / (totalTasks || 1)) * 100;
              return (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: getStatusColor(d.status) }}
                      />
                      <span className="font-semibold text-slate-700 capitalize">{d.status}</span>
                    </div>
                    <span className="text-slate-500 font-medium">
                      {d.count} tasks ({Math.round(percent)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${percent}%`,
                        backgroundColor: getStatusColor(d.status),
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
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
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm transform transition-all hover:scale-[1.02]">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-slate-50 rounded-lg">{icon}</div>
        <span className="text-sm font-medium text-slate-500">{label}</span>
      </div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      <div className="text-xs text-slate-400 mt-1">{subText}</div>
    </div>
  );
}
