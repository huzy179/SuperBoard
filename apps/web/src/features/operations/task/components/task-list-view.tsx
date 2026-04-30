'use client';

import type { ProjectTaskItemDTO, WorkflowStatusTemplateDTO } from '@superboard/shared';
import { ChevronDown } from 'lucide-react';
import { formatDate } from '@/lib/format-date';
import {
  AssigneeAvatar,
  LabelDots,
  PriorityBadge,
  TaskIdBadge,
  TaskTypeIcon,
} from '@/features/operations/task/components/task-badges';

interface TaskListViewProps {
  visibleTasks: ProjectTaskItemDTO[];
  projectKey: string | null;
  selectedTaskIds: Set<string>;
  selectedVisibleCount: number;
  onSelectTask: (
    taskId: string,
    event: React.MouseEvent | React.KeyboardEvent | React.ChangeEvent,
  ) => void;
  toggleSelectAllVisible: () => void;
  onOpenEdit: (task: ProjectTaskItemDTO) => void;
  onUpdateTaskStatus: (taskId: string, status: ProjectTaskItemDTO['status']) => void;
  isUpdatePending: boolean;
  isDragDropLocked: boolean;
  statusSelectLockReason?: string | undefined;
  workflow?: WorkflowStatusTemplateDTO | undefined;
}

export function TaskListView({
  visibleTasks,
  projectKey,
  selectedTaskIds,
  selectedVisibleCount,
  onSelectTask,
  toggleSelectAllVisible,
  onOpenEdit,
  onUpdateTaskStatus,
  isUpdatePending,
  isDragDropLocked,
  statusSelectLockReason,
  workflow,
}: TaskListViewProps) {
  const getStatusOptionsForTask = (currentStatus: string) => {
    if (!workflow) {
      return [
        { key: 'todo', label: 'Cần làm' },
        { key: 'in_progress', label: 'Đang làm' },
        { key: 'in_review', label: 'Đang review' },
        { key: 'done', label: 'Hoàn thành' },
        { key: 'cancelled', label: 'Đã huỷ' },
      ];
    }

    const currentStatusObj = workflow.statuses.find((s) => s.key === currentStatus);
    if (!currentStatusObj) return workflow.statuses.map((s) => ({ key: s.key, label: s.name }));

    const allowedToStatusIds = new Set(
      workflow.transitions
        .filter((t) => t.fromStatusId === currentStatusObj.id)
        .map((t) => t.toStatusId),
    );

    return workflow.statuses
      .filter((s) => s.key === currentStatus || allowedToStatusIds.has(s.id))
      .map((s) => ({ key: s.key, label: s.name }));
  };

  return (
    <div className="overflow-hidden rounded-lg border border-surface-border bg-surface-card shadow-luxe">
      <table className="min-w-full border-collapse text-sm tabular-nums">
        <thead className="bg-[color:var(--color-surface-alt)]/45 border-b border-surface-border">
          <tr>
            <th className="px-[var(--space-6)] py-[var(--space-4)] text-left w-16">
              <div className="flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={visibleTasks.length > 0 && selectedVisibleCount === visibleTasks.length}
                  onChange={toggleSelectAllVisible}
                  aria-label="Chọn tất cả task"
                  className="h-4 w-4 rounded-sm border-surface-border text-brand-500 cursor-pointer"
                />
              </div>
            </th>
            <th className="px-[var(--space-4)] py-[var(--space-4)] text-left text-xs font-semibold text-[color:var(--color-muted)]">
              Task
            </th>
            <th className="px-[var(--space-4)] py-[var(--space-4)] text-left text-xs font-semibold text-[color:var(--color-muted)]">
              Status
            </th>
            <th className="px-[var(--space-4)] py-[var(--space-4)] text-left text-xs font-semibold text-[color:var(--color-muted)]">
              Priority
            </th>
            <th className="px-[var(--space-4)] py-[var(--space-4)] text-left text-xs font-semibold text-[color:var(--color-muted)]">
              Assignee
            </th>
            <th className="px-[var(--space-6)] py-[var(--space-4)] text-right text-xs font-semibold text-[color:var(--color-muted)]">
              Updated
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-surface-border">
          {visibleTasks.map((task) => {
            const isSelected = selectedTaskIds.has(task.id);
            return (
              <tr
                key={task.id}
                onClick={(e) => {
                  if (e.metaKey || e.ctrlKey || e.shiftKey) onSelectTask(task.id, e);
                  else onOpenEdit(task);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (e.metaKey || e.ctrlKey || e.shiftKey) onSelectTask(task.id, e);
                    else onOpenEdit(task);
                  }
                }}
                role="button"
                tabIndex={0}
                className={`group cursor-pointer transition-colors ${
                  isSelected ? 'bg-brand-50' : 'hover:bg-black/[0.02]'
                }`}
              >
                <td className="px-[var(--space-6)] py-[var(--space-4)] w-16">
                  <div className="flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(event) => onSelectTask(task.id, event)}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Chọn task ${task.title}`}
                      className="h-4 w-4 rounded-sm border-surface-border text-brand-500 cursor-pointer"
                    />
                  </div>
                </td>

                <td className="px-[var(--space-4)] py-[var(--space-4)]">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 w-8 h-8 rounded-sm bg-black/[0.03] border border-surface-border flex items-center justify-center">
                      <TaskTypeIcon type={task.type ?? 'task'} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <TaskIdBadge projectKey={projectKey} number={task.number} />
                        <p className="truncate text-sm font-semibold text-[color:var(--color-ink)]">
                          {task.title}
                        </p>
                      </div>
                      {task.labels && task.labels.length > 0 ? (
                        <div className="mt-1">
                          <LabelDots labels={task.labels} />
                        </div>
                      ) : null}
                    </div>
                  </div>
                </td>

                <td className="px-[var(--space-4)] py-[var(--space-4)]">
                  <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={task.status}
                      disabled={isUpdatePending || isDragDropLocked}
                      onChange={(event) => {
                        onUpdateTaskStatus(
                          task.id,
                          event.target.value as unknown as ProjectTaskItemDTO['status'],
                        );
                      }}
                      className="appearance-none rounded-sm border border-surface-border bg-surface-bg pl-3 pr-9 py-2 text-xs font-semibold text-[color:var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-40"
                      title={statusSelectLockReason}
                    >
                      {getStatusOptionsForTask(task.status).map((opt) => (
                        <option key={opt.key} value={opt.key}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[color:var(--color-faint)]">
                      <ChevronDown size={14} />
                    </div>
                  </div>
                </td>

                <td className="px-[var(--space-4)] py-[var(--space-4)]">
                  <PriorityBadge priority={task.priority} />
                </td>

                <td className="px-[var(--space-4)] py-[var(--space-4)]">
                  {task.assigneeName ? (
                    <div className="flex items-center gap-3">
                      <div className="ring-1 ring-surface-border rounded-full p-0.5">
                        <AssigneeAvatar
                          name={task.assigneeName}
                          color={task.assigneeAvatarColor}
                          size="md"
                        />
                      </div>
                      <span className="text-sm text-[color:var(--color-ink)] truncate">
                        {task.assigneeName}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-[color:var(--color-faint)]">—</span>
                  )}
                </td>

                <td className="px-[var(--space-6)] py-[var(--space-4)] text-right">
                  <span className="text-sm text-[color:var(--color-muted)]">
                    {formatDate(task.updatedAt)}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
