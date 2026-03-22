'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { FullPageError } from '@/components/ui/page-states';
import { AssigneeAvatar } from '@/components/ui/task-badges';
import { useDashboardStats } from '@/hooks/use-dashboard';
import { EVENT_LABELS, PRIORITY_LABELS, STATUS_LABELS } from '@/lib/constants/task';
import { formatRelativeTime } from '@/lib/format-date';

const EVENT_ICONS: Record<string, string> = {
  created: '➕',
  updated: '✏️',
  status_changed: '🔄',
  assignee_changed: '👤',
  comment_added: '💬',
};

const CHART_COLOR_CLASSES = [
  'text-brand-600',
  'text-blue-500',
  'text-amber-500',
  'text-emerald-500',
  'text-violet-500',
  'text-rose-500',
  'text-slate-500',
];

const EMPTY_DASHBOARD_STATS = {
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

  const taskTypeLabelMap: Record<string, string> = {
    task: 'Task',
    bug: 'Bug',
    story: 'Story',
    epic: 'Epic',
  };

  const totalTasks = safeStats.tasksByStatus.reduce((sum, item) => sum + item.count, 0);
  const doneTasks = safeStats.tasksByStatus.find((item) => item.status === 'done')?.count ?? 0;
  const inProgressTasks =
    safeStats.tasksByStatus.find((item) => item.status === 'in_progress')?.count ?? 0;
  const maxTypeCount = Math.max(...safeStats.tasksByType.map((item) => item.count), 1);
  const maxAssigneeCount = Math.max(...safeStats.tasksByAssignee.map((item) => item.count), 1);

  const completionRatio = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const overdueRatio = totalTasks > 0 ? Math.round((safeStats.overdueTasks / totalTasks) * 100) : 0;
  const totalPriorityTasks = safeStats.tasksByPriority.reduce((sum, item) => sum + item.count, 0);
  const totalTypeTasks = safeStats.tasksByType.reduce((sum, item) => sum + item.count, 0);

  const statusChartData = safeStats.tasksByStatus.map((item, index) => ({
    key: item.status,
    label: STATUS_LABELS[item.status] ?? item.status,
    value: item.count,
    colorClass: CHART_COLOR_CLASSES[index % CHART_COLOR_CLASSES.length] ?? 'text-slate-500',
  }));

  const priorityChartData = safeStats.tasksByPriority.map((item, index) => ({
    key: item.priority,
    label: PRIORITY_LABELS[item.priority] ?? item.priority,
    value: item.count,
    colorClass: CHART_COLOR_CLASSES[index % CHART_COLOR_CLASSES.length] ?? 'text-slate-500',
  }));

  const typeChartData = safeStats.tasksByType.map((item, index) => ({
    key: item.type,
    label: taskTypeLabelMap[item.type] ?? item.type,
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
      .sort((a, b) => {
        if (a.completionRate === b.completionRate) {
          return b.remainingTasks - a.remainingTasks;
        }
        return a.completionRate - b.completionRate;
      })
      .slice(0, 5);
  }, [safeStats.tasksByProject]);

  const activityTypeOptions = useMemo(() => {
    const uniqueTypes = new Set(safeStats.recentActivity.map((item) => item.type));
    return ['all', ...uniqueTypes] as string[];
  }, [safeStats.recentActivity]);

  const filteredRecentActivity = useMemo(() => {
    const normalizedQuery = activitySearchQuery.trim().toLowerCase();

    return safeStats.recentActivity.filter((event) => {
      if (activityTypeFilter !== 'all' && event.type !== activityTypeFilter) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const actorName = event.actorName?.toLowerCase() ?? '';
      return (
        event.taskTitle.toLowerCase().includes(normalizedQuery) ||
        actorName.includes(normalizedQuery)
      );
    });
  }, [activitySearchQuery, activityTypeFilter, safeStats.recentActivity]);

  if (isLoading) return <DashboardSkeleton />;

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

  return (
    <section className="animate-fade-in">
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>

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
          value={safeStats.overdueTasks}
          color="bg-red-50 text-red-700"
          icon="⏰"
          delay={3}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-surface-card p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Tasks theo trạng thái</h2>
          <DonutDistributionChart
            items={statusChartData}
            emptyMessage="Chưa có dữ liệu trạng thái"
          />
        </div>

        <div className="rounded-xl bg-surface-card p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Tasks theo dự án</h2>
          <div className="space-y-3">
            {safeStats.tasksByProject.map((project) => (
              <div key={project.projectId}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <Link
                    href={`/jira/projects/${project.projectId}`}
                    className="font-medium text-brand-700 hover:underline"
                  >
                    {project.projectKey ? `[${project.projectKey}] ` : ''}
                    {project.projectName}
                  </Link>
                  <span className="text-slate-600">
                    {project.done}/{project.total}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-emerald-500 transition-all duration-500"
                    style={{
                      width: project.total > 0 ? `${(project.done / project.total) * 100}%` : '0%',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          className="rounded-xl bg-amber-50/40 p-5"
          style={{
            boxShadow: '0 1px 3px oklch(0.3 0.01 255 / 0.06), 0 0 0 1px oklch(0.8 0.06 75 / 0.3)',
          }}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Dự án cần chú ý</h2>
            <span className="rounded bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
              Top {projectsNeedingAttention.length}
            </span>
          </div>

          {projectsNeedingAttention.length === 0 ? (
            <p className="text-xs text-slate-500">Mọi dự án đang ổn, chưa có project cần ưu tiên</p>
          ) : (
            <div className="space-y-3">
              {projectsNeedingAttention.map((project) => (
                <div
                  key={project.projectId}
                  className="rounded-lg border border-amber-100 bg-white p-3"
                >
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <Link
                      href={`/jira/projects/${project.projectId}`}
                      className="font-medium text-amber-700 hover:underline"
                    >
                      {project.projectKey ? `[${project.projectKey}] ` : ''}
                      {project.projectName}
                    </Link>
                    <span className="font-semibold text-slate-700">
                      Còn {project.remainingTasks}/{project.total}
                    </span>
                  </div>

                  <div className="h-2 rounded-full bg-amber-100">
                    <div
                      className="h-2 rounded-full bg-amber-500 transition-all duration-500"
                      style={{ width: `${project.completionRate * 100}%` }}
                    />
                  </div>

                  <p className="mt-1 text-[11px] text-slate-500">
                    Hoàn thành {Math.round(project.completionRate * 100)}%
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <Link
                      href={`/jira/projects/${project.projectId}?view=list&statuses=todo,in_progress`}
                      className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-700 hover:bg-amber-100"
                    >
                      Xem task chưa xong
                    </Link>
                    <Link
                      href={`/jira/projects/${project.projectId}?view=board`}
                      className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
                    >
                      Mở board
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl bg-surface-card p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Workload theo thành viên</h2>
          {safeStats.tasksByAssignee.length === 0 ? (
            <p className="text-xs text-slate-500">Chưa có task được gán</p>
          ) : (
            <div className="space-y-3">
              {safeStats.tasksByAssignee.map((item) => (
                <div key={item.assigneeId} className="flex items-center gap-2">
                  <AssigneeAvatar name={item.assigneeName} color={item.avatarColor} />
                  <div className="min-w-0 flex-1">
                    <div className="mb-0.5 flex items-center justify-between text-xs">
                      <span className="truncate text-slate-700">{item.assigneeName}</span>
                      <span className="font-semibold text-slate-900">{item.count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100">
                      <div
                        className="h-1.5 rounded-full bg-brand-500 transition-all duration-500"
                        style={{ width: `${(item.count / maxAssigneeCount) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl bg-surface-card p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Tasks theo loại</h2>
          {typeChartData.length === 0 ? (
            <p className="text-xs text-slate-500">Chưa có dữ liệu loại task</p>
          ) : (
            <div>
              <div className="flex h-40 items-end gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 pb-3 pt-4">
                {typeChartData.map((item) => (
                  <div key={item.key} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                    <span className="text-[10px] font-semibold text-slate-700">{item.value}</span>
                    <div className="flex h-24 w-full items-end justify-center">
                      <div
                        title={`${item.label}: ${item.value} task (${Math.round((item.value / Math.max(totalTypeTasks, 1)) * 100)}%)`}
                        className={`w-6 rounded-t-md transition-all duration-500 ${item.colorClass.replace('text-', 'bg-')}`}
                        style={{
                          height: `${Math.max((item.value / maxTypeCount) * 100, item.value > 0 ? 8 : 0)}%`,
                        }}
                      />
                    </div>
                    <span className="truncate text-[10px] text-slate-600" title={item.label}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-xl bg-surface-card p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Tasks theo độ ưu tiên</h2>
          {priorityChartData.length === 0 ? (
            <p className="text-xs text-slate-500">Chưa có dữ liệu độ ưu tiên</p>
          ) : (
            <div className="space-y-4">
              <div className="flex h-3 overflow-hidden rounded-full bg-slate-100">
                {priorityChartData.map((item) => (
                  <div
                    key={item.key}
                    title={`${item.label}: ${item.value} task (${Math.round((item.value / Math.max(totalPriorityTasks, 1)) * 100)}%)`}
                    className={`h-full transition-all duration-500 ${item.colorClass.replace('text-', 'bg-')}`}
                    style={{ width: `${(item.value / Math.max(totalTasks, 1)) * 100}%` }}
                  />
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2">
                {priorityChartData.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between rounded-md bg-slate-50 px-2 py-1.5"
                  >
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-700">
                      <span
                        className={`h-2 w-2 rounded-full ${item.colorClass.replace('text-', 'bg-')}`}
                      />
                      {item.label}
                    </span>
                    <span className="text-xs font-semibold text-slate-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-xl bg-surface-card p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Tổng quan hoàn thành</h2>
          <div className="space-y-3">
            <div>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-slate-600">Tỷ lệ hoàn thành</span>
                <span className="font-semibold text-emerald-700">{completionRatio}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${completionRatio}%` }}
                />
              </div>
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-slate-600">Tỷ lệ quá hạn</span>
                <span className="font-semibold text-rose-700">{overdueRatio}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full bg-rose-500 transition-all duration-500"
                  style={{ width: `${overdueRatio}%` }}
                />
              </div>
            </div>

            <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
              Hoàn thành {doneTasks}/{totalTasks} task · Quá hạn {safeStats.overdueTasks}
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-surface-card p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-900">Hoạt động gần đây</h2>
            <button
              type="button"
              onClick={() => {
                setActivityTypeFilter('all');
                setActivitySearchQuery('');
              }}
              className="rounded-md px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-100"
            >
              Đặt lại
            </button>
          </div>

          <div className="mb-3 flex flex-wrap items-center gap-2">
            <select
              value={activityTypeFilter}
              onChange={(event) => setActivityTypeFilter(event.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700"
              aria-label="Lọc hoạt động theo loại"
            >
              {activityTypeOptions.map((type) => (
                <option key={type} value={type}>
                  {type === 'all' ? 'Tất cả loại' : (EVENT_LABELS[type] ?? type)}
                </option>
              ))}
            </select>

            <input
              type="text"
              value={activitySearchQuery}
              onChange={(event) => setActivitySearchQuery(event.target.value)}
              placeholder="Tìm theo task/actor..."
              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700 sm:w-56"
              aria-label="Tìm kiếm hoạt động gần đây"
            />

            <span className="text-[11px] text-slate-500">
              {filteredRecentActivity.length}/{safeStats.recentActivity.length}
            </span>
          </div>

          {safeStats.recentActivity.length === 0 ? (
            <p className="text-xs text-slate-500">Chưa có hoạt động</p>
          ) : filteredRecentActivity.length === 0 ? (
            <p className="text-xs text-slate-500">Không có hoạt động khớp bộ lọc</p>
          ) : (
            <div className="space-y-2">
              {filteredRecentActivity.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-2 rounded-lg px-2.5 py-2 transition-all hover:bg-slate-50/80"
                >
                  <span className="mt-0.5 text-sm">{EVENT_ICONS[event.type] ?? '📝'}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                        {EVENT_LABELS[event.type] ?? event.type}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-slate-700">{event.taskTitle}</p>
                    <p className="text-[11px] text-slate-500">
                      {event.actorName ?? 'Hệ thống'} · {formatRelativeTime(event.createdAt)}
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

function DashboardSkeleton() {
  return (
    <section className="animate-fade-in">
      <div className="mb-6 h-8 w-36 animate-pulse rounded bg-slate-200" />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="rounded-xl bg-surface-card p-4"
            style={{ boxShadow: 'var(--shadow-card)' }}
          >
            <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
            <div className="mt-3 h-7 w-16 animate-pulse rounded bg-slate-200" />
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 8 }, (_, blockIndex) => (
          <div
            key={blockIndex}
            className="rounded-xl bg-surface-card p-5"
            style={{ boxShadow: 'var(--shadow-card)' }}
          >
            <div className="mb-4 h-4 w-40 animate-pulse rounded bg-slate-200" />
            <div className="space-y-3">
              {Array.from({ length: 4 }, (_, rowIndex) => (
                <div key={rowIndex}>
                  <div className="mb-1 h-3 w-full animate-pulse rounded bg-slate-200" />
                  <div className="h-2 w-full animate-pulse rounded-full bg-slate-200" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function DonutDistributionChart({
  items,
  emptyMessage,
}: {
  items: Array<{ key: string; label: string; value: number; colorClass: string }>;
  emptyMessage: string;
}) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const radius = 36;
  const circumference = 2 * Math.PI * radius;

  if (items.length === 0 || total === 0) {
    return <p className="text-xs text-slate-500">{emptyMessage}</p>;
  }

  let currentOffset = 0;

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="relative h-28 w-28">
        <svg viewBox="0 0 100 100" className="h-28 w-28 -rotate-90">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            className="text-slate-200"
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
                className={item.colorClass}
                strokeDasharray={`${segmentLength} ${circumference}`}
                strokeDashoffset={dashOffset}
              >
                <title>
                  {`${item.label}: ${item.value} task (${Math.round((item.value / total) * 100)}%)`}
                </title>
              </circle>
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="tabular-nums text-lg font-bold text-slate-900">{total}</span>
          <span className="text-[10px] text-slate-500">tasks</span>
        </div>
      </div>

      <div className="min-w-45 flex-1 space-y-1.5">
        {items.map((item) => {
          const percent = Math.round((item.value / total) * 100);
          return (
            <div key={item.key} className="flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1.5 text-slate-700">
                <span
                  className={`h-2 w-2 rounded-full ${item.colorClass.replace('text-', 'bg-')}`}
                />
                {item.label}
              </span>
              <span className="font-semibold text-slate-900">
                {item.value} · {percent}%
              </span>
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
      className={`animate-slide-up relative overflow-hidden rounded-xl p-4 ${color} transition-all hover:-translate-y-px`}
      style={{
        animationDelay: `${delay * 75}ms`,
        animationFillMode: 'both',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div
        className="pointer-events-none absolute -right-3 -top-3 h-16 w-16 rounded-full opacity-[0.15] blur-xl"
        style={{ background: 'currentColor' }}
      />
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium opacity-70">{label}</p>
        <span className="text-lg">{icon}</span>
      </div>
      <p className="tabular-nums mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}
