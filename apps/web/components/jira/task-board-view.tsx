'use client';

import type { ProjectTaskItemDTO } from '@superboard/shared';
import {
  TaskTypeIcon,
  PriorityBadge,
  StoryPointsBadge,
  AssigneeAvatar,
  LabelDots,
  TaskIdBadge,
} from '@/components/jira/task-badges';
import { BOARD_COLUMNS, COLUMN_BORDER } from '@/lib/constants/task';
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
  toggleTaskSelection: (taskId: string) => void;
  isUpdatePending: boolean;
  updatingTaskId: string | undefined;
  onAddTask: (status: ProjectTaskItemDTO['status']) => void;
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
  toggleTaskSelection,
  isUpdatePending,
  updatingTaskId,
  onAddTask,
}: TaskBoardViewProps) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-3">
      {BOARD_COLUMNS.map((column) => {
        const tasks = boardData.get(column.key) ?? [];
        const isDragOver = dragOverColumn === column.key;
        return (
          <div
            key={column.key}
            className={`w-80 shrink-0 rounded-xl border border-t-2 bg-slate-50 ${COLUMN_BORDER[column.key] ?? ''} ${
              isDragOver
                ? 'border-dashed border-brand-400 bg-brand-50/30 animate-pulse'
                : 'border-slate-200'
            }`}
            onDragOver={(e) => {
              onDragOver(e);
              if (!isDragDropLocked) {
                setDragOverColumn(column.key);
              }
            }}
            onDragLeave={() => setDragOverColumn(null)}
            onDrop={(event) => onDrop(event, column.key)}
          >
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-3 py-2.5">
              <p className="text-xs font-bold tracking-wider text-slate-600 uppercase">
                {column.label}
              </p>
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
                    onClick={() => onOpenEdit(task)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onOpenEdit(task);
                      }
                    }}
                    className={`group relative rounded-lg border border-slate-200 bg-white p-3.5 shadow-xs border-l-2 transition ${
                      task.priority === 'urgent'
                        ? 'border-l-red-500'
                        : task.priority === 'high'
                          ? 'border-l-orange-500'
                          : task.priority === 'medium'
                            ? 'border-l-blue-400'
                            : 'border-l-slate-300'
                    } ${
                      isUpdatePending && updatingTaskId === task.id
                        ? 'opacity-60'
                        : isDragDropLocked
                          ? 'cursor-not-allowed opacity-80'
                          : 'cursor-pointer hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md'
                    } ${selectedTaskIds.has(task.id) ? 'ring-1 ring-brand-300' : ''}
                  `}
                  >
                    <div className="mb-1 flex justify-end">
                      <input
                        type="checkbox"
                        checked={selectedTaskIds.has(task.id)}
                        onChange={() => toggleTaskSelection(task.id)}
                        onClick={(event) => event.stopPropagation()}
                        aria-label={`Chọn task ${task.title}`}
                        className="h-3.5 w-3.5 rounded border-slate-300 text-brand-600"
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
                    <p className="text-[13px] font-medium text-slate-900 group-hover:text-brand-700">
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
