'use client';

import { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import type { ProjectTaskItemDTO, WorkflowStatusTemplateDTO } from '@superboard/shared';

interface CalendarCell {
  key: string;
  date: Date;
  inMonth: boolean;
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

// --- Draggable Task Chip ---
function DraggableTaskChip({
  task,
  statusInfo,
  colorClass,
  indicator,
  onClick,
}: {
  task: ProjectTaskItemDTO;
  statusInfo?: { name?: string; category?: string };
  colorClass: string;
  indicator: string;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  });

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={onClick}
      {...listeners}
      {...attributes}
      className={`group w-full cursor-grab rounded-md border border-white/5 bg-white/[0.03] px-2 py-1.5 text-left text-xs text-white transition-all hover:border-brand-500/30 hover:bg-brand-500/10 ${isDragging ? 'opacity-40' : ''}`}
      title={`${task.title} - ${statusInfo?.name ?? task.status}`}
    >
      <div className="flex items-center gap-1">
        <span className={`text-[10px] leading-none ${colorClass}`}>{indicator}</span>
        <span className="line-clamp-1">{task.title}</span>
      </div>
    </button>
  );
}

// --- Droppable Day Cell ---
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

  const getCategoryColor = (category: string | undefined) => {
    switch (category) {
      case 'todo':
        return 'text-slate-400';
      case 'in_progress':
        return 'text-blue-400';
      case 'in_review':
        return 'text-indigo-400';
      case 'done':
        return 'text-emerald-400';
      case 'blocked':
        return 'text-rose-400';
      case 'cancelled':
        return 'text-white/30';
      default:
        return 'text-slate-400';
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

  // When dragging, show the task in the target cell if it's the task being dragged
  const visibleTasks = dayTasks.filter((t) => t.id !== draggedTaskId);

  return (
    <div
      ref={setNodeRef}
      className={`min-h-32 rounded-xl border p-2.5 transition-colors ${
        isOver
          ? 'border-brand-500/50 bg-brand-500/5'
          : cell.inMonth
            ? 'border-white/5 bg-white/[0.02]'
            : 'border-white/5 bg-white/[0.01]'
      }`}
    >
      <p className={`mb-1 text-xs font-semibold ${cell.inMonth ? 'text-white' : 'text-white/20'}`}>
        {cell.date.getDate()}
      </p>
      <div className="space-y-1">
        {visibleTasks.slice(0, 3).map((task) => {
          const statusInfo = workflow?.statuses.find((s) => s.key === task.status);
          const indicator = getCategoryIndicator(statusInfo?.category);
          const colorClass = getCategoryColor(statusInfo?.category);

          return (
            <DraggableTaskChip
              key={task.id}
              task={task}
              statusInfo={statusInfo}
              colorClass={colorClass}
              indicator={indicator}
              onClick={() => onOpenEdit(task)}
            />
          );
        })}
        {visibleTasks.length > 3 ? (
          <p className="text-[11px] text-white/30">+{visibleTasks.length - 3} task</p>
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
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
  );

  // In week mode, show only the first 7 cells
  const displayCells = viewMode === 'week' ? calendarCells.slice(0, 7) : calendarCells;

  const getCategoryColor = (category: string | undefined) => {
    switch (category) {
      case 'todo':
        return 'text-slate-400';
      case 'in_progress':
        return 'text-blue-400';
      case 'in_review':
        return 'text-indigo-400';
      case 'done':
        return 'text-emerald-400';
      case 'blocked':
        return 'text-rose-400';
      case 'cancelled':
        return 'text-white/30';
      default:
        return 'text-slate-400';
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

    const originalDateKey = `${task.dueDate?.getFullYear()}-${String(task.dueDate?.getMonth() + 1).padStart(2, '0')}-${String(task.dueDate?.getDate()).padStart(2, '0')}`;
    if (originalDateKey === overData.date) return; // no-op

    onDropTask(taskId, overData.date);
  };

  return (
    <div className="space-y-3">
      {/* Header nav bar */}
      <div className="flex items-center justify-between rounded-[1.5rem] border border-white/5 bg-slate-950/80 px-4 py-2.5 backdrop-blur-3xl shadow-glass">
        <button
          type="button"
          onClick={onPrevMonth}
          className="rounded-lg border border-white/5 bg-white/[0.03] px-3 py-1.5 text-sm font-medium text-white/60 hover:bg-white/[0.06] hover:text-white"
        >
          ← {viewMode === 'week' ? 'Tuần trước' : 'Tháng trước'}
        </button>

        {/* View mode toggle */}
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-white capitalize">{calendarMonthLabel}</p>
          <div className="flex rounded-lg border border-white/5 bg-white/[0.03] p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                viewMode === 'month'
                  ? 'bg-brand-500/20 text-brand-400'
                  : 'text-white/40 hover:text-white'
              }`}
            >
              Tháng
            </button>
            <button
              type="button"
              onClick={() => setViewMode('week')}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                viewMode === 'week'
                  ? 'bg-brand-500/20 text-brand-400'
                  : 'text-white/40 hover:text-white'
              }`}
            >
              Tuần
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={onNextMonth}
          className="rounded-lg border border-white/5 bg-white/[0.03] px-3 py-1.5 text-sm font-medium text-white/60 hover:bg-white/[0.06] hover:text-white"
        >
          {viewMode === 'week' ? 'Tuần sau' : 'Tháng sau'} →
        </button>
      </div>

      {/* Day header labels */}
      <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-semibold tracking-widest text-white/40 uppercase">
        {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day) => (
          <div key={day} className="py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid with DnD context */}
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-7 gap-2">
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

        <DragOverlay>
          {/* Render dragged task as overlay */}
          {draggedTaskId
            ? (() => {
                for (const tasks of dueTasksByDate.values()) {
                  const found = tasks.find((t) => t.id === draggedTaskId);
                  if (found) {
                    const statusInfo = workflow?.statuses.find((s) => s.key === found.status);
                    const indicator = getCategoryIndicator(statusInfo?.category);
                    const colorClass = getCategoryColor(statusInfo?.category);
                    return (
                      <div className="w-full cursor-grabbing rounded-md border border-brand-500/50 bg-brand-500/10 px-2 py-1.5 text-xs text-white shadow-glass">
                        <div className="flex items-center gap-1">
                          <span className={`text-[10px] leading-none ${colorClass}`}>
                            {indicator}
                          </span>
                          <span className="line-clamp-1">{found.title}</span>
                        </div>
                      </div>
                    );
                  }
                }
                return null;
              })()
            : null}
        </DragOverlay>
      </DndContext>

      {/* Tasks without due date */}
      {tasksWithoutDueDate.length > 0 ? (
        <div className="rounded-[1.5rem] border border-white/5 bg-slate-950/80 p-4 backdrop-blur-3xl shadow-glass">
          <p className="mb-2 text-sm font-semibold text-white">Task chưa có hạn hoàn thành</p>
          <div className="flex flex-wrap gap-2">
            {tasksWithoutDueDate.map((task) => {
              const statusInfo = workflow?.statuses.find((s) => s.key === task.status);
              const indicator = getCategoryIndicator(statusInfo?.category);
              const colorClass = getCategoryColor(statusInfo?.category);

              return (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => onOpenEdit(task)}
                  className="flex items-center gap-1.5 rounded-md border border-white/5 bg-white/[0.03] px-2 py-1 text-xs text-white transition-colors hover:border-brand-500/30 hover:bg-brand-500/10"
                >
                  <span className={`text-[10px] ${colorClass}`}>{indicator}</span>
                  {task.title}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
