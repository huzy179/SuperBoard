'use client';

import { useMemo, useState } from 'react';
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import {
  AlertCircle,
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock,
  HelpCircle,
  XCircle,
} from 'lucide-react';
import type {
  ProjectTaskItemDTO,
  WorkflowStatusDTO,
  WorkflowStatusTemplateDTO,
} from '@superboard/shared';

interface CalendarCell {
  date: Date;
  inMonth: boolean;
  key: string;
}

interface TaskCalendarViewProps {
  calendarMonthLabel: string;
  calendarCells: CalendarCell[];
  dueTasksByDate: Map<string, ProjectTaskItemDTO[]>;
  tasksWithoutDueDate: ProjectTaskItemDTO[];
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onOpenEdit: (task: ProjectTaskItemDTO) => void;
  onDropTask: (taskId: string, newDate: string) => void;
  workflow?: WorkflowStatusTemplateDTO | undefined;
}

type ViewMode = 'month' | 'week';

function getCategoryColor(category: string | undefined) {
  switch (category) {
    case 'todo':
      return 'text-slate-400';
    case 'in_progress':
      return 'text-brand-500';
    case 'in_review':
      return 'text-indigo-500';
    case 'done':
      return 'text-emerald-500';
    case 'blocked':
      return 'text-rose-500';
    case 'cancelled':
      return 'text-[color:var(--color-faint)]';
    default:
      return 'text-slate-400';
  }
}

function getCategoryIcon(category: string | undefined, size = 12) {
  switch (category) {
    case 'todo':
      return <Circle size={size} />;
    case 'in_progress':
      return <Clock size={size} />;
    case 'in_review':
      return <Activity size={size} />;
    case 'done':
      return <CheckCircle2 size={size} />;
    case 'blocked':
      return <AlertCircle size={size} />;
    case 'cancelled':
      return <XCircle size={size} />;
    default:
      return <HelpCircle size={size} />;
  }
}

function Activity({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}

function DraggableTaskChip({
  task,
  statusInfo,
  onClick,
}: {
  task: ProjectTaskItemDTO;
  statusInfo?: WorkflowStatusDTO | { name?: string; category?: string } | undefined;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  });

  const colorClass = getCategoryColor(statusInfo?.category);

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={onClick}
      {...listeners}
      {...attributes}
      className={`group w-full cursor-grab rounded-md border border-surface-border bg-surface-bg px-3 py-2 text-left transition-colors hover:bg-black/[0.03] ${
        isDragging ? 'opacity-0' : ''
      }`}
      title={`${task.title} - ${statusInfo?.name ?? task.status}`}
    >
      <div className="flex items-center gap-2">
        <span className={`shrink-0 ${colorClass} opacity-80`} aria-hidden>
          {getCategoryIcon(statusInfo?.category, 12)}
        </span>
        <span className="line-clamp-1 text-xs font-medium text-[color:var(--color-ink)]">
          {task.title}
        </span>
      </div>
    </button>
  );
}

function DroppableDayCell({
  cell,
  dayTasks,
  workflow,
  onOpenEdit,
  draggedTaskId,
}: {
  cell: CalendarCell;
  dayTasks: ProjectTaskItemDTO[];
  workflow?: WorkflowStatusTemplateDTO | undefined;
  onOpenEdit: (task: ProjectTaskItemDTO) => void;
  draggedTaskId: string | null;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: cell.key,
    data: { date: cell.key },
  });

  const visibleTasks = dayTasks.filter((t) => t.id !== draggedTaskId);
  const isToday = new Date().toDateString() === cell.date.toDateString();

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[10rem] rounded-lg border p-[var(--space-4)] transition-colors ${
        isOver
          ? 'border-brand-500/35 bg-brand-50'
          : cell.inMonth
            ? 'border-surface-border bg-surface-bg hover:bg-black/[0.02]'
            : 'border-surface-border bg-surface-bg opacity-50'
      }`}
    >
      <div className="flex items-center justify-between mb-[var(--space-4)]">
        <div className="flex items-center gap-2">
          <p
            className={`text-xs font-semibold ${
              isToday
                ? 'text-brand-700'
                : cell.inMonth
                  ? 'text-[color:var(--color-muted)]'
                  : 'text-[color:var(--color-faint)]'
            }`}
          >
            {cell.date.getDate().toString().padStart(2, '0')}
          </p>
          {isToday ? <span className="h-1.5 w-1.5 rounded-full bg-brand-500" aria-hidden /> : null}
        </div>
      </div>

      <div className="space-y-2">
        {visibleTasks.slice(0, 3).map((task) => {
          const statusInfo = workflow?.statuses.find((s) => s.key === task.status);
          return (
            <DraggableTaskChip
              key={task.id}
              task={task}
              statusInfo={statusInfo}
              onClick={() => onOpenEdit(task)}
            />
          );
        })}

        {visibleTasks.length > 3 ? (
          <div className="px-3 py-1 rounded-sm bg-black/[0.03] border border-surface-border">
            <p className="text-[11px] font-medium text-[color:var(--color-muted)]">
              +{visibleTasks.length - 3} more
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function TaskCalendarView({
  calendarMonthLabel,
  calendarCells,
  dueTasksByDate,
  tasksWithoutDueDate,
  onPrevMonth,
  onNextMonth,
  onOpenEdit,
  onDropTask,
  workflow,
}: TaskCalendarViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const displayCells = useMemo(
    () => (viewMode === 'week' ? calendarCells.slice(0, 7) : calendarCells),
    [viewMode, calendarCells],
  );

  const draggedTask = useMemo(() => {
    if (!draggedTaskId) return null;
    for (const tasks of dueTasksByDate.values()) {
      const found = tasks.find((t) => t.id === draggedTaskId);
      if (found) return found;
    }
    return null;
  }, [draggedTaskId, dueTasksByDate]);

  const handleDragStart = (event: DragStartEvent) => {
    setDraggedTaskId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggedTaskId(null);
    if (!over) return;

    const taskId = active.id as string;
    const overData = over.data.current as { date: string } | undefined;
    if (!overData?.date) return;

    const task = active.data.current?.task as ProjectTaskItemDTO | undefined;
    if (!task) return;

    const d = task.dueDate ? new Date(task.dueDate) : null;
    const originalDateKey = d
      ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      : '';
    if (originalDateKey === overData.date) return;

    onDropTask(taskId, overData.date);
  };

  const overlayStatus = draggedTask
    ? workflow?.statuses.find((s) => s.key === draggedTask.status)
    : undefined;

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between rounded-lg border border-surface-border bg-surface-card px-[var(--space-6)] py-[var(--space-4)] shadow-luxe">
        <button
          type="button"
          onClick={onPrevMonth}
          className="flex items-center gap-2 rounded-sm border border-surface-border bg-surface-bg px-3 py-2 text-sm font-semibold text-[color:var(--color-ink)] hover:bg-black/[0.03] transition-colors"
        >
          <ChevronLeft size={14} />
          <span className="hidden sm:inline">Prev</span>
        </button>

        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-brand-500" aria-hidden />
            <p className="text-base font-semibold text-[color:var(--color-ink)]">
              {calendarMonthLabel}
            </p>
          </div>
          <div className="flex rounded-full border border-surface-border bg-surface-bg p-1">
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                viewMode === 'month'
                  ? 'bg-brand-50 border border-brand-500/25 text-brand-700'
                  : 'text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)] hover:bg-black/[0.03]'
              }`}
            >
              Month
            </button>
            <button
              type="button"
              onClick={() => setViewMode('week')}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                viewMode === 'week'
                  ? 'bg-brand-50 border border-brand-500/25 text-brand-700'
                  : 'text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)] hover:bg-black/[0.03]'
              }`}
            >
              Week
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={onNextMonth}
          className="flex items-center gap-2 rounded-sm border border-surface-border bg-surface-bg px-3 py-2 text-sm font-semibold text-[color:var(--color-ink)] hover:bg-black/[0.03] transition-colors"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight size={14} />
        </button>
      </div>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-7 gap-5">
          {displayCells.map((cell) => {
            const dayTasks = dueTasksByDate.get(cell.key) ?? [];
            return (
              <DroppableDayCell
                key={cell.key}
                cell={cell}
                dayTasks={dayTasks}
                workflow={workflow}
                onOpenEdit={onOpenEdit}
                draggedTaskId={draggedTaskId}
              />
            );
          })}
        </div>

        <DragOverlay dropAnimation={null}>
          {draggedTask ? (
            <div className="w-[260px] rounded-md border border-brand-500/25 bg-brand-50 px-3 py-2 shadow-luxe">
              <div className="flex items-center gap-2">
                <span
                  className={`${getCategoryColor(overlayStatus?.category)} opacity-90`}
                  aria-hidden
                >
                  {getCategoryIcon(overlayStatus?.category, 14)}
                </span>
                <span className="line-clamp-1 text-sm font-semibold text-[color:var(--color-ink)]">
                  {draggedTask.title}
                </span>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {tasksWithoutDueDate.length > 0 ? (
        <section className="rounded-lg border border-surface-border bg-surface-card shadow-luxe p-[var(--space-6)]">
          <div className="flex items-center gap-4 mb-[var(--space-6)]">
            <div className="w-10 h-10 rounded-sm bg-brand-50 flex items-center justify-center border border-brand-500/15">
              <CalendarIcon size={16} className="text-brand-500" />
            </div>
            <div className="flex flex-col">
              <p className="text-sm font-semibold text-[color:var(--color-ink)]">Unscheduled</p>
              <span className="text-xs text-[color:var(--color-muted)]">
                Tasks chưa có due date
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {tasksWithoutDueDate.map((task) => {
              const statusInfo = workflow?.statuses.find((s) => s.key === task.status);
              return (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => onOpenEdit(task)}
                  className="flex items-center gap-2 rounded-sm border border-surface-border bg-surface-bg px-3 py-2 text-sm font-medium text-[color:var(--color-ink)] hover:bg-black/[0.03] transition-colors"
                >
                  <span
                    className={`${getCategoryColor(statusInfo?.category)} opacity-80`}
                    aria-hidden
                  >
                    {getCategoryIcon(statusInfo?.category, 12)}
                  </span>
                  <span className="line-clamp-1">{task.title}</span>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}
