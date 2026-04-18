import { useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import type { ProjectTaskItemDTO, WorkflowStatusTemplateDTO } from '@superboard/shared';
import {
  TaskTypeIcon,
  PriorityBadge,
  StoryPointsBadge,
  AssigneeAvatar,
  LabelDots,
  TaskIdBadge,
} from '@/features/jira/components/task-badges';
import { formatDate } from '@/lib/format-date';
import { isTaskOverdue } from '@/lib/helpers/task-view';
import { QuantumCard } from '@/components/ui/quantum/QuantumCard';

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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const columnVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.175, 0.885, 0.32, 1.275],
    },
  },
};

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
  const getCategoryTheme = (category: string | undefined) => {
    switch (category) {
      case 'todo':
        return {
          label: 'STABLE_VOID',
          color: 'text-slate-400',
          bg: 'bg-slate-400/10',
          border: 'border-slate-400/20',
          glow: 'shadow-glow-slate/10',
          indicator: '●',
        };
      case 'in_progress':
        return {
          label: 'ACTIVE_PULSE',
          color: 'text-brand-400',
          bg: 'bg-brand-400/10',
          border: 'border-brand-400/20',
          glow: 'shadow-glow-brand/20',
          indicator: '○',
        };
      case 'in_review':
        return {
          label: 'RECON_ANALYSIS',
          color: 'text-indigo-400',
          bg: 'bg-indigo-400/10',
          border: 'border-indigo-400/20',
          glow: 'shadow-glow-indigo/10',
          indicator: '◔',
        };
      case 'done':
        return {
          label: 'MISSION_COMPLETE',
          color: 'text-emerald-400',
          bg: 'bg-emerald-400/10',
          border: 'border-emerald-400/20',
          glow: 'shadow-glow-emerald/20',
          indicator: '✔',
        };
      case 'blocked':
        return {
          label: 'SYSTEM_STALL',
          color: 'text-rose-400',
          bg: 'bg-rose-400/10',
          border: 'border-rose-400/20',
          glow: 'shadow-glow-rose/10',
          indicator: '✘',
        };
      case 'cancelled':
        return {
          label: 'VOID_NULL',
          color: 'text-white/20',
          bg: 'bg-white/5',
          border: 'border-white/10',
          glow: 'none',
          indicator: '◌',
        };
      default:
        return {
          label: 'UNKNOWN_SIGNAL',
          color: 'text-slate-400',
          bg: 'bg-slate-400/10',
          border: 'border-slate-400/20',
          glow: 'none',
          indicator: '●',
        };
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
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex gap-8 overflow-x-auto pb-12 pt-4 elite-scrollbar"
    >
      {columns.map((column) => {
        const tasks = boardData.get(column.key) ?? [];
        const isDragOver = dragOverColumn === column.key;
        const isAllowedTarget =
          !draggedTaskId || allowedStatuses.has(column.key) || draggedTask?.status === column.key;
        const isBlocked = draggedTaskId && !isAllowedTarget;
        const statusInfo = workflow?.statuses.find((s) => s.key === column.key);
        const theme = getCategoryTheme(statusInfo?.category);

        return (
          <motion.div
            key={column.key}
            layout
            variants={columnVariants}
            className={`min-w-[24rem] shrink-0 rounded-[3rem] border bg-white/[0.01] backdrop-blur-[40px] transition-all duration-700 flex flex-col max-h-[75vh] relative group/column ${
              isDragOver
                ? isAllowedTarget
                  ? 'border-brand-500 bg-brand-500/[0.03] shadow-glow-brand/10 scale-[1.02] z-20'
                  : 'border-rose-500 bg-rose-500/10 opacity-70 cursor-no-drop'
                : isBlocked
                  ? 'opacity-30 grayscale border-white/5'
                  : 'border-white/5 shadow-luxe'
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
                toast.error('Mission trajectory blocked by protocol');
              }
            }}
          >
            {/* Atmospheric Background Glow */}
            {isDragOver && isAllowedTarget && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-brand-500/5 pointer-events-none rounded-[3rem] blur-3xl"
              />
            )}

            {/* Column Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-white/5 relative z-10 bg-white/[0.02] rounded-t-[3rem]">
              <div className="flex flex-col gap-1.5">
                <span
                  className={`text-[9px] font-black uppercase tracking-[0.4em] italic leading-none transition-colors duration-500 ${isDragOver ? 'text-brand-400' : 'text-white/20'}`}
                >
                  {theme.label}
                </span>
                <div className="flex items-center gap-3">
                  <span className={`text-xs animate-pulse ${theme.color}`}>{theme.indicator}</span>
                  <h3
                    className={`text-base font-black uppercase tracking-tighter italic transition-colors duration-500 ${isDragOver ? 'text-white' : 'text-white/80'}`}
                  >
                    {column.label}
                  </h3>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-2 w-2 rounded-full bg-white/5" />
                <span className="tabular-nums inline-flex h-8 min-w-10 items-center justify-center rounded-2xl bg-white/5 px-2.5 text-[10px] font-black font-mono text-white/40 border border-white/5 shadow-inner">
                  {tasks.length.toString().padStart(2, '0')}
                </span>
              </div>
            </div>

            {/* Task List Container */}
            <div className="flex-1 overflow-y-auto space-y-5 p-6 min-h-[200px] elite-scrollbar relative z-10">
              <AnimatePresence mode="popLayout">
                {tasks.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-24 rounded-[2.5rem] border-2 border-dashed border-white/5 bg-slate-950/20 group/empty"
                  >
                    <div className="w-16 h-16 rounded-[1.5rem] bg-white/[0.02] border border-white/5 flex items-center justify-center mb-6 group-hover/empty:scale-110 group-hover/empty:rotate-12 transition-all duration-700">
                      <span className="text-white/5 text-3xl font-black grayscale">∅</span>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/10 italic">
                      No Signal Packets
                    </p>
                  </motion.div>
                ) : (
                  tasks.map((task) => (
                    <motion.div
                      key={task.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ type: 'spring', damping: 25, stiffness: 120 }}
                    >
                      <QuantumCard
                        hoverEffect={true}
                        glowIntensity={isSelected ? 0.3 : 0.1}
                        glowColor={
                          task.priority === 'urgent'
                            ? 'rose'
                            : task.priority === 'high'
                              ? 'brand'
                              : 'none'
                        }
                        className={`${
                          isUpdatePending && updatingTaskId === task.id
                            ? 'opacity-60 grayscale scale-95'
                            : isDragDropLocked
                              ? 'cursor-not-allowed opacity-80'
                              : 'cursor-grab active:cursor-grabbing'
                        } ${
                          selectedTaskIds.has(task.id)
                            ? 'ring-2 ring-brand-500/40 bg-brand-500/5 shadow-glow-brand/10'
                            : ''
                        } ${task.deletedAt ? 'opacity-30 grayscale' : ''}`}
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
                            if (e.metaKey || e.ctrlKey || e.shiftKey) {
                              onSelectTask(task.id, e);
                            } else {
                              onOpenEdit(task);
                            }
                          }}
                          className="p-6 space-y-5"
                        >
                          {/* Top Protocols */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/[0.03] border border-white/5 shadow-inner">
                                <TaskTypeIcon type={task.type ?? 'task'} />
                              </div>
                              <TaskIdBadge projectKey={projectKey} number={task.number} />
                            </div>
                            {task.storyPoints ? (
                              <StoryPointsBadge points={task.storyPoints} />
                            ) : null}
                          </div>

                          {/* Mission Title */}
                          <div className="space-y-2">
                            {atRiskTaskIds?.has(task.id) && (
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shadow-glow-amber" />
                                <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest italic">
                                  MISSION_AT_RISK
                                </span>
                              </div>
                            )}
                            <h4
                              className={`text-base font-black tracking-tighter leading-tight transition-colors italic uppercase ${
                                task.deletedAt
                                  ? 'text-white/10 line-through'
                                  : 'text-white/90 group-hover:text-white'
                              }`}
                            >
                              {task.title}
                            </h4>
                          </div>

                          {/* Labels Track */}
                          {task.labels && task.labels.length > 0 ? (
                            <div className="pt-1">
                              <LabelDots labels={task.labels} />
                            </div>
                          ) : null}

                          {/* Tactical Metadata Footer */}
                          <div className="flex items-center justify-between pt-5 border-t border-white/5">
                            <div className="flex items-center gap-4">
                              <PriorityBadge priority={task.priority} />
                              {task.dueDate ? (
                                <div className="flex items-center gap-2.5 px-3 py-1 bg-white/[0.02] rounded-lg border border-white/5">
                                  <div
                                    className={`h-1.5 w-1.5 rounded-full ${isTaskOverdue(task.dueDate) && task.status !== 'done' ? 'bg-rose-500 animate-pulse shadow-glow-rose' : 'bg-white/10'}`}
                                  />
                                  <span
                                    className={`text-[9px] font-black tracking-widest uppercase italic ${isTaskOverdue(task.dueDate) && task.status !== 'done' ? 'text-rose-400' : 'text-white/20'}`}
                                  >
                                    {formatDate(task.dueDate).toUpperCase()}
                                  </span>
                                </div>
                              ) : null}
                            </div>
                            {task.assigneeName ? (
                              <div className="ring-4 ring-slate-950/80 rounded-full scale-110 shadow-luxe">
                                <AssigneeAvatar
                                  name={task.assigneeName}
                                  color={task.assigneeAvatarColor}
                                  size={28}
                                />
                              </div>
                            ) : null}
                          </div>
                        </article>
                      </QuantumCard>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>

            {/* Signal Input Footer */}
            <div className="px-6 pb-6 relative z-10">
              <button
                type="button"
                onClick={() => onAddTask(column.key)}
                className="group w-full flex items-center justify-center gap-4 rounded-2xl border border-dashed border-white/10 py-4 text-[10px] font-black uppercase tracking-[0.4em] text-white/10 transition-all hover:border-brand-500/40 hover:bg-brand-500/5 hover:text-brand-400 shadow-inner group/add"
              >
                <div className="w-5 h-5 flex items-center justify-center rounded-lg bg-white/5 border border-white/5 group-hover/add:bg-brand-500 group-hover/add:text-white transition-all">
                  <span className="text-sm font-bold translate-y-[-1px] group-hover/add:rotate-90 transition-transform">
                    +
                  </span>
                </div>
                <span className="italic">INJECT_TASK_SIGNAL</span>
              </button>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
