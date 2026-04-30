'use client';

import { useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import type { ProjectTaskItemDTO, WorkflowStatusTemplateDTO } from '@superboard/shared';
import { QuantumCard } from '@superboard/ui';
import {
  AssigneeAvatar,
  LabelDots,
  PriorityBadge,
  StoryPointsBadge,
  TaskIdBadge,
  TaskTypeIcon,
} from '@/features/operations/task/components/task-badges';
import { formatDate } from '@/lib/format-date';
import { isTaskOverdue } from '@/features/operations/task/utils/task-view';

interface TaskBoardViewProps {
  boardData: Map<string, ProjectTaskItemDTO[]>;
  projectKey: string | null;
  isDragDropLocked: boolean;
  dragOverColumn: string | null;
  setDragOverColumn: (column: string | null) => void;
  onDragStart: (event: React.DragEvent<HTMLElement>, taskId: string) => void;
  onDragOver: (event: React.DragEvent<HTMLElement>) => void;
  onDrop: (event: React.DragEvent<HTMLElement>, status: ProjectTaskItemDTO['status']) => void;
  onDropByPosition: (
    event: React.DragEvent<HTMLElement>,
    status: ProjectTaskItemDTO['status'],
    targetTaskId?: string,
  ) => void;
  onOpenEdit: (task: ProjectTaskItemDTO) => void;
  selectedTaskIds: Set<string>;
  onSelectTask: (
    taskId: string,
    event: React.MouseEvent | React.KeyboardEvent | React.ChangeEvent,
  ) => void;
  isUpdatePending: boolean;
  updatingTaskId: string | undefined;
  onAddTask: (status: ProjectTaskItemDTO['status']) => void;
  columns: Array<{ key: string; label: string }>;
  workflow?: WorkflowStatusTemplateDTO | undefined;
  draggedTaskId: string | null;
  atRiskTaskIds?: Set<string>;
}

function getCategoryTheme(category: string | undefined) {
  switch (category) {
    case 'todo':
      return { dot: 'bg-slate-400', badge: 'bg-slate-100 text-slate-700 border-slate-200' };
    case 'in_progress':
      return { dot: 'bg-brand-500', badge: 'bg-brand-50 text-brand-700 border-brand-500/20' };
    case 'in_review':
      return { dot: 'bg-indigo-500', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
    case 'done':
      return { dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'blocked':
      return { dot: 'bg-rose-500', badge: 'bg-rose-50 text-rose-700 border-rose-200' };
    default:
      return { dot: 'bg-slate-400', badge: 'bg-slate-100 text-slate-700 border-slate-200' };
  }
}

export function TaskBoardView({
  boardData,
  projectKey,
  isDragDropLocked,
  dragOverColumn,
  setDragOverColumn,
  onDragStart,
  onDragOver,
  onDrop,
  onDropByPosition,
  onOpenEdit,
  selectedTaskIds,
  onSelectTask,
  isUpdatePending,
  updatingTaskId,
  onAddTask,
  columns,
  workflow,
  draggedTaskId,
  atRiskTaskIds,
}: TaskBoardViewProps) {
  const draggedTask = useMemo(() => {
    if (!draggedTaskId) return null;
    for (const tasks of boardData.values()) {
      const found = tasks.find((t) => t.id === draggedTaskId);
      if (found) return found;
    }
    return null;
  }, [draggedTaskId, boardData]);

  const getAllowedTargetStatuses = useCallback(
    (fromStatus: string) => {
      if (!workflow) return new Set<string>();
      const allowed = new Set<string>();
      workflow.transitions.forEach((t) => {
        if (t.fromStatusId === fromStatus) {
          const toStatus = workflow.statuses.find((s) => s.id === t.toStatusId);
          if (toStatus) allowed.add(toStatus.key);
        }
      });
      return allowed;
    },
    [workflow],
  );

  const allowedStatuses = useMemo(() => {
    if (!draggedTask) return new Set<string>();
    const currentStatus = workflow?.statuses.find((s) => s.key === draggedTask.status);
    if (!currentStatus) return new Set<string>();
    return getAllowedTargetStatuses(currentStatus.id);
  }, [draggedTask, workflow, getAllowedTargetStatuses]);

  return (
    <div className="flex gap-[var(--space-6)] overflow-x-auto pb-[var(--space-8)] pt-[var(--space-4)] elite-scrollbar">
      {columns.map((column) => {
        const tasks = boardData.get(column.key) ?? [];
        const isDragOver = dragOverColumn === column.key;

        const isAllowedTarget =
          !draggedTaskId || allowedStatuses.has(column.key) || draggedTask?.status === column.key;
        const isBlocked = draggedTaskId && !isAllowedTarget;

        const statusInfo = workflow?.statuses.find((s) => s.key === column.key);
        const theme = getCategoryTheme(statusInfo?.category);

        return (
          <div
            key={column.key}
            className={`min-w-[20rem] shrink-0 rounded-lg border flex flex-col max-h-[78vh] ${
              isDragOver
                ? isAllowedTarget
                  ? 'border-brand-500/35 bg-brand-500/[0.03]'
                  : 'border-rose-500/35 bg-rose-500/[0.03]'
                : isBlocked
                  ? 'border-surface-border opacity-40'
                  : 'border-surface-border bg-[color:var(--color-surface-alt)]/35'
            }`}
            onDragOver={(e) => {
              onDragOver(e);
              if (!isDragDropLocked) setDragOverColumn(column.key);
            }}
            onDragLeave={() => setDragOverColumn(null)}
            onDrop={(event) => {
              if (isAllowedTarget) {
                onDrop(event, column.key);
              } else {
                event.preventDefault();
                toast.error('Không thể kéo task sang cột này theo workflow.');
              }
            }}
          >
            <div className="flex items-center justify-between px-[var(--space-5)] py-[var(--space-3)] border-b border-surface-border bg-surface-card rounded-t-lg">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`h-2 w-2 rounded-full ${theme.dot}`} aria-hidden />
                <h3 className="truncate text-sm font-semibold text-[color:var(--color-ink)]">
                  {column.label}
                </h3>
                {statusInfo?.category ? (
                  <span
                    className={`shrink-0 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${theme.badge}`}
                  >
                    {statusInfo.category.replaceAll('_', ' ')}
                  </span>
                ) : null}
              </div>
              <span className="tabular-nums inline-flex h-6 min-w-6 items-center justify-center rounded-sm bg-black/[0.03] px-2 text-xs font-semibold text-[color:var(--color-muted)] border border-surface-border">
                {tasks.length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-[var(--space-3)] p-[var(--space-4)] min-h-[200px] elite-scrollbar">
              {tasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 rounded-lg border border-dashed border-surface-border bg-surface-bg">
                  <p className="text-xs font-medium text-[color:var(--color-muted)]">Trống</p>
                </div>
              ) : (
                tasks.map((task) => (
                  <QuantumCard
                    key={task.id}
                    hoverEffect
                    glowColor={
                      task.priority === 'urgent'
                        ? 'rose'
                        : task.priority === 'high'
                          ? 'brand'
                          : 'none'
                    }
                    className={`${
                      isUpdatePending && updatingTaskId === task.id
                        ? 'opacity-60 grayscale'
                        : isDragDropLocked
                          ? 'cursor-not-allowed'
                          : 'cursor-grab active:cursor-grabbing'
                    } ${selectedTaskIds.has(task.id) ? 'ring-1 ring-brand-500/25' : ''} ${
                      task.deletedAt ? 'opacity-50' : ''
                    }`}
                  >
                    <article
                      draggable={!isUpdatePending && !isDragDropLocked}
                      onDragStart={(event) => onDragStart(event, task.id)}
                      onDragOver={(event) => {
                        onDragOver(event);
                        event.stopPropagation();
                      }}
                      onDrop={(event) => onDropByPosition(event, column.key, task.id)}
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
                      aria-label={`Task: ${task.title}`}
                      className="p-[var(--space-4)] space-y-[var(--space-4)]"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 flex items-center justify-center rounded-sm bg-black/[0.03] border border-surface-border">
                            <TaskTypeIcon type={task.type ?? 'task'} />
                          </div>
                          <TaskIdBadge projectKey={projectKey} number={task.number} />
                        </div>
                        {task.storyPoints ? <StoryPointsBadge points={task.storyPoints} /> : null}
                      </div>

                      <div className="space-y-1">
                        {atRiskTaskIds?.has(task.id) ? (
                          <div className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden />
                            <span className="text-[11px] font-semibold text-amber-700">
                              At risk
                            </span>
                          </div>
                        ) : null}
                        <h4
                          className={`text-sm font-semibold leading-snug ${
                            task.deletedAt
                              ? 'text-[color:var(--color-faint)] line-through'
                              : 'text-[color:var(--color-ink)]'
                          }`}
                        >
                          {task.title}
                        </h4>
                      </div>

                      {task.labels && task.labels.length > 0 ? (
                        <LabelDots labels={task.labels} />
                      ) : null}

                      <div className="flex items-center justify-between pt-[var(--space-3)] border-t border-surface-border">
                        <div className="flex items-center gap-3">
                          <PriorityBadge priority={task.priority} />
                          {task.dueDate ? (
                            <div
                              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm border text-[11px] font-medium ${
                                isTaskOverdue(task.dueDate) && task.status !== 'done'
                                  ? 'bg-rose-50 border-rose-200 text-rose-700'
                                  : 'bg-black/[0.03] border-surface-border text-[color:var(--color-muted)]'
                              }`}
                              title={task.dueDate}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  isTaskOverdue(task.dueDate) && task.status !== 'done'
                                    ? 'bg-rose-500'
                                    : 'bg-[color:var(--color-faint)]'
                                }`}
                                aria-hidden
                              />
                              <span>{formatDate(task.dueDate)}</span>
                            </div>
                          ) : null}
                        </div>
                        {task.assigneeName ? (
                          <div className="ring-2 ring-surface-border rounded-full">
                            <AssigneeAvatar
                              name={task.assigneeName}
                              color={task.assigneeAvatarColor}
                              size="xs"
                            />
                          </div>
                        ) : null}
                      </div>
                    </article>
                  </QuantumCard>
                ))
              )}
            </div>

            <div className="px-[var(--space-4)] pb-[var(--space-4)]">
              <button
                type="button"
                onClick={() => onAddTask(column.key)}
                className="w-full rounded-md border border-dashed border-surface-border bg-surface-bg px-3 py-2 text-xs font-semibold text-[color:var(--color-muted)] hover:bg-black/[0.03] hover:text-[color:var(--color-ink)] transition-colors"
              >
                + New task
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
