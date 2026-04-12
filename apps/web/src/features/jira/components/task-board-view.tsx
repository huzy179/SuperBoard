import { useMemo } from 'react';
import { toast } from 'sonner';
import type { ProjectTaskItemDTO, WorkflowStatusTemplateDTO } from '@superboard/shared';
import {
  TaskTypeIcon,
  PriorityBadge,
  StoryPointsBadge,
  AssigneeAvatar,
  LabelDots,
  TaskIdBadge,
} from '@/features/jira/components/task-badges';
import { COLUMN_BORDER } from '@/lib/constants/task';
import { formatDate } from '@/lib/format-date';
import { isTaskOverdue } from '@/lib/helpers/task-view';

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
  onSelectTask: (taskId: string, event: React.MouseEvent | React.KeyboardEvent) => void;
  isUpdatePending: boolean;
  updatingTaskId: string | undefined;
  onAddTask: (status: ProjectTaskItemDTO['status']) => void;
  columns: Array<{ key: string; label: string }>;
  workflow?: WorkflowStatusTemplateDTO | undefined;
  draggedTaskId: string | null;
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
}: TaskBoardViewProps) {
  const getCategoryColor = (category: string | undefined) => {
    switch (category) {
      case 'todo':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'in_progress':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'in_review':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'done':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'blocked':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'cancelled':
        return 'bg-slate-100 text-slate-500 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const getCategoryIndicator = (category: string | undefined) => {
    switch (category) {
      case 'todo':
        return '●';
      case 'in_progress':
        return '○';
      case 'in_review':
        return '◔';
      case 'done':
        return '✔';
      case 'blocked':
        return '✘';
      case 'cancelled':
        return '◌';
      default:
        return '●';
    }
  };

  const draggedTask = useMemo(() => {
    if (!draggedTaskId) return null;
    for (const tasks of boardData.values()) {
      const found = tasks.find((t) => t.id === draggedTaskId);
      if (found) return found;
    }
    return null;
  }, [draggedTaskId, boardData]);

  const getAllowedTargetStatuses = (fromStatus: string) => {
    if (!workflow) return new Set<string>();
    const allowed = new Set<string>();
    workflow.transitions.forEach((t) => {
      if (t.fromStatusId === fromStatus) {
        const toStatus = workflow.statuses.find((s) => s.id === t.toStatusId);
        if (toStatus) allowed.add(toStatus.key);
      }
    });
    return allowed;
  };

  const allowedStatuses = useMemo(() => {
    if (!draggedTask) return new Set<string>();
    // Find the status ID of the current task
    const currentStatus = workflow?.statuses.find((s) => s.key === draggedTask.status);
    if (!currentStatus) return new Set<string>();
    return getAllowedTargetStatuses(currentStatus.id);
  }, [draggedTask, workflow]);
  return (
    <div className="flex gap-4 overflow-x-auto pb-3">
      {columns.map((column) => {
        const tasks = boardData.get(column.key) ?? [];
        const isDragOver = dragOverColumn === column.key;
        const isAllowedTarget =
          !draggedTaskId || allowedStatuses.has(column.key) || draggedTask?.status === column.key;
        const isBlocked = draggedTaskId && !isAllowedTarget;
        const statusInfo = workflow?.statuses.find((s) => s.key === column.key);
        const categoryStyles = getCategoryColor(statusInfo?.category);
        const indicator = getCategoryIndicator(statusInfo?.category);

        return (
          <div
            key={column.key}
            className={`w-80 shrink-0 rounded-2xl border-t-4 bg-slate-50/50 transition-all duration-300 flex flex-col max-h-full ${
              COLUMN_BORDER[column.key] ?? 'border-t-slate-400'
            } ${
              isDragOver
                ? isAllowedTarget
                  ? 'border-emerald-500 bg-emerald-50/50 ring-4 ring-emerald-500/10 scale-[1.01]'
                  : 'border-rose-500 bg-rose-50/50 opacity-70 cursor-no-drop'
                : isBlocked
                  ? 'opacity-40 grayscale-[0.5]'
                  : 'border-transparent border-b border-x border-slate-200/60'
            }`}
            onDragOver={(e) => {
              onDragOver(e);
              if (!isDragDropLocked) {
                setDragOverColumn(column.key);
              }
            }}
            onDragLeave={() => setDragOverColumn(null)}
            onDrop={(event) => {
              if (isAllowedTarget) {
                onDrop(event, column.key);
              } else {
                event.preventDefault();
                toast.error('Giai đoạn này bị chặn bởi quy trình dự án');
              }
            }}
          >
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-3 py-2.5">
              <div className="flex items-center gap-2">
                <div
                  className={`flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${categoryStyles}`}
                >
                  <span>{indicator}</span>
                  <span>{column.label}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-200 px-1.5 text-[11px] font-bold text-slate-700">
                  {tasks.length}
                </span>
                <button
                  type="button"
                  className="rounded px-1 text-xs leading-none text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                  aria-label={`Tùy chọn cột ${column.label}`}
                >
                  ...
                </button>
              </div>
            </div>
            <div className="space-y-2.5 p-2.5">
              {tasks.length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-200 px-3 py-5 text-center text-xs text-slate-500">
                  Không có task
                </p>
              ) : (
                tasks.map((task) => (
                  <article
                    key={task.id}
                    tabIndex={0}
                    role="button"
                    aria-label={task.title}
                    draggable={!isUpdatePending && !isDragDropLocked}
                    onDragStart={(event) => onDragStart(event, task.id)}
                    onDragOver={(event) => {
                      onDragOver(event);
                      event.stopPropagation();
                    }}
                    onDrop={(event) => onDropByPosition(event, column.key, task.id)}
                    onClick={(e) => {
                      if (e.metaKey || e.ctrlKey || e.shiftKey) {
                        onSelectTask(task.id, e);
                      } else {
                        onOpenEdit(task);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onOpenEdit(task);
                      }
                    }}
                    className={`group relative rounded-xl border-2 bg-white p-4 shadow-sm transition-all duration-300 ${
                      task.priority === 'urgent'
                        ? 'border-l-red-500'
                        : task.priority === 'high'
                          ? 'border-l-orange-500'
                          : task.priority === 'medium'
                            ? 'border-l-blue-400'
                            : 'border-l-slate-200'
                    } ${
                      isUpdatePending && updatingTaskId === task.id
                        ? 'opacity-60 scale-95'
                        : isDragDropLocked
                          ? 'cursor-not-allowed opacity-80'
                          : 'cursor-pointer hover:border-brand-500 hover:shadow-xl hover:-translate-y-1'
                    } ${
                      selectedTaskIds.has(task.id)
                        ? 'border-brand-500 ring-4 ring-brand-500/10 shadow-lg translate-y-[-2px] bg-brand-50/30'
                        : 'border-slate-100'
                    } ${task.deletedAt ? 'bg-slate-50 opacity-60 grayscale' : ''}
                  `}
                  >
                    <div
                      className={`absolute top-2 right-2 transition-opacity duration-200 ${selectedTaskIds.has(task.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedTaskIds.has(task.id)}
                        onChange={(e) => onSelectTask(task.id, e)}
                        onClick={(event) => event.stopPropagation()}
                        aria-label={`Chọn task ${task.title}`}
                        className="h-4 w-4 rounded-md border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer shadow-sm"
                      />
                    </div>
                    {/* Top: type icon + task ID + story points */}
                    <div className="mb-1.5 flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5">
                        <TaskTypeIcon type={task.type ?? 'task'} />
                        <TaskIdBadge projectKey={projectKey} number={task.number} />
                      </div>
                      {task.storyPoints ? <StoryPointsBadge points={task.storyPoints} /> : null}
                    </div>
                    {/* Title */}
                    <p
                      className={`text-[13px] font-medium transition-colors ${
                        task.deletedAt
                          ? 'text-slate-400 line-through'
                          : 'text-slate-900 group-hover:text-brand-700'
                      }`}
                    >
                      {task.title}
                    </p>
                    {/* Labels */}
                    {task.labels && task.labels.length > 0 ? (
                      <div className="mt-1.5">
                        <LabelDots labels={task.labels} />
                      </div>
                    ) : null}
                    {/* Bottom: priority + due date + assignee */}
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <PriorityBadge priority={task.priority} />
                        {task.dueDate ? (
                          <span
                            className={`text-[11px] ${isTaskOverdue(task.dueDate) && task.status !== 'done' ? 'font-semibold text-red-600' : 'text-slate-500'}`}
                          >
                            {formatDate(task.dueDate)}
                          </span>
                        ) : null}
                      </div>
                      {task.assigneeName ? (
                        <AssigneeAvatar name={task.assigneeName} color={task.assigneeAvatarColor} />
                      ) : null}
                    </div>
                  </article>
                ))
              )}
            </div>
            {/* Quick add button */}
            <button
              type="button"
              onClick={() => onAddTask(column.key)}
              className="w-full border-t border-slate-200 px-3 py-2.5 text-left text-xs font-medium text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              + Thêm task
            </button>
          </div>
        );
      })}
    </div>
  );
}
