'use client';

import Link from 'next/link';
import { FullPageError, FullPageLoader } from '@/components/ui/page-states';
import { AssigneeAvatar } from '@/components/ui/task-badges';
import { useDashboardStats } from '@/hooks/use-dashboard';
import { formatRelativeTime } from '@/lib/format-date';
import { STATUS_LABELS, STATUS_COLORS, EVENT_LABELS } from '@/lib/constants/task';

const EVENT_ICONS: Record<string, string> = {
  created: '➕',
  updated: '✏️',
  status_changed: '🔄',
  assignee_changed: '👤',
  comment_added: '💬',
};

export default function DashboardPage() {
  const { data: stats, isLoading, isError, error } = useDashboardStats();
  const taskTypeLabelMap: Record<string, string> = {
    task: 'Task',
    bug: 'Bug',
    story: 'Story',
    epic: 'Epic',
  };

  if (isLoading) return <FullPageLoader label="Đang tải dashboard..." />;
  if (isError || !stats) {
    return (
      <FullPageError
        title="Không thể tải dashboard"
        message={error?.message ?? 'Lỗi không xác định'}
        actionLabel="Thử lại"
        onAction={() => window.location.reload()}
      />
    );
  }

  const totalTasks = stats.tasksByStatus.reduce((s, i) => s + i.count, 0);
  const doneTasks = stats.tasksByStatus.find((i) => i.status === 'done')?.count ?? 0;
  const inProgressTasks = stats.tasksByStatus.find((i) => i.status === 'in_progress')?.count ?? 0;
  const maxStatusCount = Math.max(...stats.tasksByStatus.map((i) => i.count), 1);
  const maxTypeCount = Math.max(...stats.tasksByType.map((i) => i.count), 1);
  const maxAssigneeCount = Math.max(...stats.tasksByAssignee.map((i) => i.count), 1);

  return (
    <section className="animate-fade-in">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Dashboard</h1>

      {/* Stat cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Tổng tasks"
          value={totalTasks}
          color="bg-brand-50 text-brand-700"
          icon="📋"
          delay={0}
        />
        <StatCard
          label="Hoàn thành"
          value={doneTasks}
          color="bg-emerald-50 text-emerald-700"
          icon="✅"
          delay={1}
        />
        <StatCard
          label="Đang làm"
          value={inProgressTasks}
          color="bg-blue-50 text-blue-700"
          icon="🔧"
          delay={2}
        />
        <StatCard
          label="Quá hạn"
          value={stats.overdueTasks}
          color="bg-red-50 text-red-700"
          icon="⏰"
          delay={3}
        />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Tasks by status */}
        <div className="rounded-xl border border-surface-border bg-surface-card p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Tasks theo trạng thái</h2>
          <div className="space-y-3">
            {stats.tasksByStatus.map((item) => (
              <div key={item.status}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-slate-600">
                    {STATUS_LABELS[item.status] ?? item.status}
                  </span>
                  <span className="font-semibold text-slate-900">{item.count}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${STATUS_COLORS[item.status] ?? 'bg-slate-400'}`}
                    style={{ width: `${(item.count / maxStatusCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tasks by project */}
        <div className="rounded-xl border border-surface-border bg-surface-card p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Tasks theo dự án</h2>
          <div className="space-y-3">
            {stats.tasksByProject.map((p) => (
              <div key={p.projectId}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <Link
                    href={`/jira/projects/${p.projectId}`}
                    className="font-medium text-brand-700 hover:underline"
                  >
                    {p.projectKey ? `[${p.projectKey}] ` : ''}
                    {p.projectName}
                  </Link>
                  <span className="text-slate-600">
                    {p.done}/{p.total}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-emerald-500 transition-all duration-500"
                    style={{ width: p.total > 0 ? `${(p.done / p.total) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Workload by member */}
        <div className="rounded-xl border border-surface-border bg-surface-card p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Workload theo thành viên</h2>
          {stats.tasksByAssignee.length === 0 ? (
            <p className="text-xs text-slate-500">Chưa có task được gán</p>
          ) : (
            <div className="space-y-3">
              {stats.tasksByAssignee.map((a) => (
                <div key={a.assigneeId} className="flex items-center gap-2">
                  <AssigneeAvatar name={a.assigneeName} color={a.avatarColor} />
                  <div className="min-w-0 flex-1">
                    <div className="mb-0.5 flex items-center justify-between text-xs">
                      <span className="truncate text-slate-700">{a.assigneeName}</span>
                      <span className="font-semibold text-slate-900">{a.count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100">
                      <div
                        className="h-1.5 rounded-full bg-brand-500 transition-all duration-500"
                        style={{ width: `${(a.count / maxAssigneeCount) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tasks by type */}
        <div className="rounded-xl border border-surface-border bg-surface-card p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Tasks theo loại</h2>
          {stats.tasksByType.length === 0 ? (
            <p className="text-xs text-slate-500">Chưa có dữ liệu loại task</p>
          ) : (
            <div className="space-y-3">
              {stats.tasksByType.map((item) => (
                <div key={item.type}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-slate-600">
                      {taskTypeLabelMap[item.type] ?? item.type}
                    </span>
                    <span className="font-semibold text-slate-900">{item.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-violet-500 transition-all duration-500"
                      style={{ width: `${(item.count / maxTypeCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div className="rounded-xl border border-surface-border bg-surface-card p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Hoạt động gần đây</h2>
          {stats.recentActivity.length === 0 ? (
            <p className="text-xs text-slate-500">Chưa có hoạt động</p>
          ) : (
            <div className="space-y-2">
              {stats.recentActivity.map((e) => (
                <div
                  key={e.id}
                  className="flex items-start gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-slate-50"
                >
                  <span className="mt-0.5 text-sm">{EVENT_ICONS[e.type] ?? '📝'}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                        {EVENT_LABELS[e.type] ?? e.type}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-slate-700">{e.taskTitle}</p>
                    <p className="text-[11px] text-slate-500">
                      {e.actorName ?? 'Hệ thống'} · {formatRelativeTime(e.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function StatCard({
  label,
  value,
  color,
  icon,
  delay,
}: {
  label: string;
  value: number;
  color: string;
  icon: string;
  delay: number;
}) {
  return (
    <div
      className={`animate-slide-up rounded-xl border border-surface-border p-4 ${color}`}
      style={{ animationDelay: `${delay * 75}ms`, animationFillMode: 'both' }}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium opacity-80">{label}</p>
        <span className="text-lg">{icon}</span>
      </div>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}
