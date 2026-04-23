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
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  XCircle,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from 'lucide-react';
import type {
  ProjectTaskItemDTO,
  WorkflowStatusTemplateDTO,
  WorkflowStatusDTO,
} from '@superboard/shared';

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

function getCategoryColor(category: string | undefined) {
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
}

function getCategoryIcon(category: string | undefined, size = 10) {
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

// --- Draggable Task Chip ---
function DraggableTaskChip({
  task,
  statusInfo,
  colorClass,
  onClick,
}: {
  task: ProjectTaskItemDTO;
  statusInfo?: WorkflowStatusDTO | { name?: string; category?: string } | undefined;
  colorClass: string;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  });

  return (
    <motion.button
      ref={setNodeRef}
      type="button"
      onClick={onClick}
      {...listeners}
      {...attributes}
      whileHover={{ scale: 1.02, x: 2 }}
      whileTap={{ scale: 0.98 }}
      className={`group w-full cursor-grab rounded-sm border border-white/5 bg-white/[0.03] px-var(--space-3) py-var(--space-2) text-left transition-all hover:bg-white/[0.08] hover:border-white/20 shadow-inner ${isDragging ? 'opacity-0' : ''}`}
      title={`${task.title} - ${statusInfo?.name ?? task.status}`}
    >
      <div className="flex items-center gap-2">
        <div
          className={`shrink-0 ${colorClass} opacity-40 group-hover:opacity-100 transition-opacity`}
        >
          {getCategoryIcon(statusInfo?.category, 12)}
        </div>
        <span className="line-clamp-1 text-[10px] font-bold uppercase tracking-tight text-white/60 group-hover:text-white transition-colors">
          {task.title}
        </span>
      </div>
    </motion.button>
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

  const visibleTasks = dayTasks.filter((t) => t.id !== draggedTaskId);
  const isToday = new Date().toDateString() === cell.date.toDateString();

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[10rem] rounded-md border p-var(--space-4) transition-all duration-300 relative overflow-hidden group/cell ${
        isOver
          ? 'border-brand-500/50 bg-brand-500/[0.03] shadow-glow-brand/5 scale-[1.02] z-30'
          : cell.inMonth
            ? 'border-white/5 bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/10'
            : 'border-white/5 bg-white/[0.005] opacity-20 grayscale'
      }`}
    >
      {/* Background Pulse for Over state */}
      <AnimatePresence>
        {isOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-brand-500/5 pointer-events-none rounded-md blur-2xl animate-pulse"
          />
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between mb-var(--space-4) relative z-10">
        <p
          className={`text-[10px] font-black uppercase tracking-[0.2em] ${
            isToday ? 'text-brand-400' : cell.inMonth ? 'text-white/20' : 'text-white/5'
          }`}
        >
          {cell.date.getDate().toString().padStart(2, '0')}
        </p>
        {isToday && (
          <div className="h-1 w-1 rounded-full bg-brand-500 shadow-glow-brand animate-pulse" />
        )}
      </div>

      <div className="space-y-2 relative z-10">
        <AnimatePresence>
          {visibleTasks.slice(0, 3).map((task) => {
            const statusInfo = workflow?.statuses.find((s) => s.key === task.status);
            const colorClass = getCategoryColor(statusInfo?.category);

            return (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <DraggableTaskChip
                  task={task}
                  statusInfo={statusInfo}
                  colorClass={colorClass}
                  onClick={() => onOpenEdit(task)}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>

        {visibleTasks.length > 3 ? (
          <div className="px-var(--space-3) py-var(--space-1) rounded-xs bg-white/5 border border-white/5 transition-all hover:bg-brand-500/10 hover:border-brand-500/20 group/more">
            <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest group-hover/more:text-brand-400 transition-colors">
              +{visibleTasks.length - 3} Packets
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
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
  );

  const displayCells = viewMode === 'week' ? calendarCells.slice(0, 7) : calendarCells;

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

  return (
    <div className="space-y-10">
      {/* Header nav bar */}
      <div className="flex items-center justify-between rounded-md border border-white/10 bg-white/[0.01] px-var(--space-6) py-var(--space-4) backdrop-blur-2xl shadow-inner relative overflow-hidden group">
        <div className="absolute inset-0 bg-brand-500/[0.01] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

        <button
          type="button"
          onClick={onPrevMonth}
          className="flex items-center gap-3 rounded-sm border border-white/5 bg-white/[0.02] px-var(--space-4) py-var(--space-2) text-[10px] font-bold uppercase tracking-widest text-white/30 hover:bg-white/10 hover:text-white transition-all active:scale-95"
        >
          <ChevronLeft size={14} />
          <span className="hidden sm:inline">Past_Cycle</span>
        </button>

        {/* View mode toggle */}
        <div className="flex flex-col items-center gap-2 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-brand-500 animate-pulse shadow-glow-brand" />
            <p className="text-base font-black text-white uppercase tracking-[0.4em] pl-1">
              {calendarMonthLabel}
            </p>
          </div>
          <div className="flex rounded-sm border border-white/5 bg-slate-950/40 p-1 backdrop-blur-xl">
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`rounded-xs px-6 py-1.5 text-[9px] font-bold uppercase tracking-widest transition-all ${
                viewMode === 'month'
                  ? 'bg-white text-slate-950 shadow-inner scale-105'
                  : 'text-white/20 hover:text-white'
              }`}
            >
              Month
            </button>
            <button
              type="button"
              onClick={() => setViewMode('week')}
              className={`rounded-xs px-6 py-1.5 text-[9px] font-bold uppercase tracking-widest transition-all ${
                viewMode === 'week'
                  ? 'bg-white text-slate-950 shadow-inner scale-105'
                  : 'text-white/20 hover:text-white'
              }`}
            >
              Week
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={onNextMonth}
          className="flex items-center gap-3 rounded-sm border border-white/5 bg-white/[0.02] px-var(--space-4) py-var(--space-2) text-[10px] font-bold uppercase tracking-widest text-white/30 hover:bg-white/10 hover:text-white transition-all active:scale-95"
        >
          <span className="hidden sm:inline">Future_Cycle</span>
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Day header labels */}
      <div className="grid grid-cols-7 gap-5 text-center text-[11px] font-black tracking-[0.6em] text-white/20 uppercase italic border-b border-white/5 pb-8">
        {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      {/* Calendar grid with DnD context */}
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-7 gap-5 relative group/grid">
          {/* Subtle Grid Pattern Overlay */}
          <div className="absolute inset-x-0 -inset-y-5 bg-[radial-gradient(circle_at_center,_white/0.005_1px,_transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-40" />

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
          {draggedTaskId
            ? (() => {
                let found: ProjectTaskItemDTO | undefined;
                for (const tasks of dueTasksByDate.values()) {
                  found = tasks.find((t) => t.id === draggedTaskId);
                  if (found) break;
                }

                if (found) {
                  const statusInfo = workflow?.statuses.find((s) => s.key === found!.status);
                  const colorClass = getCategoryColor(statusInfo?.category);
                  return (
                    <motion.div
                      initial={{ scale: 1, rotate: 0 }}
                      animate={{ scale: 1.05, rotate: 1 }}
                      className="w-full cursor-grabbing rounded-md border border-brand-500/50 bg-brand-500/10 px-var(--space-4) py-var(--space-3) shadow-glow-brand/20 backdrop-blur-2xl overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-brand-500/5 animate-pulse" />
                      <div className="flex items-center gap-3 relative z-10">
                        <div className={`shrink-0 ${colorClass}`}>
                          {getCategoryIcon(statusInfo?.category, 14)}
                        </div>
                        <span className="line-clamp-1 text-[10px] font-bold uppercase tracking-widest text-white">
                          {found.title}
                        </span>
                      </div>
                    </motion.div>
                  );
                }
                return null;
              })()
            : null}
        </DragOverlay>
      </DndContext>

      {/* Tasks without due date */}
      {tasksWithoutDueDate.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-md border border-white/5 bg-white/[0.01] p-var(--space-6) backdrop-blur-2xl shadow-inner group/unscheduled relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-brand-500/[0.005] opacity-0 group-hover/unscheduled:opacity-100 transition-opacity pointer-events-none" />
          <div className="flex items-center gap-4 mb-var(--space-6)">
            <div className="w-10 h-10 rounded-sm bg-white/[0.03] flex items-center justify-center border border-white/5 shadow-inner">
              <CalendarIcon size={16} className="text-white/20" />
            </div>
            <div className="flex flex-col">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
                Unscheduled_Protocols
              </p>
              <span className="text-[7px] font-bold text-white/10 uppercase tracking-widest">
                Waiting_For_Allocation
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            {tasksWithoutDueDate.map((task) => {
              const statusInfo = workflow?.statuses.find((s) => s.key === task.status);
              const colorClass = getCategoryColor(statusInfo?.category);

              return (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => onOpenEdit(task)}
                  className="flex items-center gap-3 rounded-sm border border-white/5 bg-white/[0.03] px-var(--space-4) py-var(--space-3) transition-all hover:bg-white/10 hover:border-brand-500/20 hover:scale-[1.02] active:scale-98 group/packet"
                >
                  <div
                    className={`${colorClass} opacity-30 group-hover/packet:opacity-100 transition-opacity`}
                  >
                    {getCategoryIcon(statusInfo?.category, 12)}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-tight text-white/60 group-hover/packet:text-white transition-colors">
                    {task.title}
                  </span>
                </button>
              );
            })}
          </div>
        </motion.div>
      ) : null}
    </div>
  );
}
