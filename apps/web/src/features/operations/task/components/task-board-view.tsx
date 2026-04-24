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
} from '@/features/operations/task/components/task-badges';
import { formatDate } from '@/lib/format-date';
import { isTaskOverdue } from '@/features/operations/task/utils/task-view';
import { QuantumCard } from '@superboard/ui';

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
      ease: [0.175, 0.885, 0.32, 1.275] as any, // eslint-disable-line @typescript-eslint/no-explicit-any
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
      className="flex gap-var(--space-6) overflow-x-auto pb-var(--space-8) pt-var(--space-4) elite-scrollbar"
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
            className={`min-w-[20rem] shrink-0 rounded-md border bg-white/[0.01] backdrop-blur-xl transition-all duration-300 flex flex-col max-h-[78vh] relative group/column ${
              isDragOver
                ? isAllowedTarget
                  ? 'border-brand-500/40 bg-brand-500/[0.03] shadow-glow-brand/5 scale-[1.01] z-20'
                  : 'border-rose-500/40 bg-rose-500/[0.05] opacity-80 cursor-no-drop'
                : isBlocked
                  ? 'opacity-20 grayscale border-white/5'
                  : 'border-white/5 shadow-glass'
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
                className="absolute inset-0 bg-brand-500/5 pointer-events-none rounded-lg blur-2xl"
              />
            )}

            {/* Column Header */}
            <div className="flex items-center justify-between px-var(--space-5) py-var(--space-3) border-b border-white/5 relative z-10 bg-white/[0.01] rounded-t-md">
              <div className="flex flex-col gap-0.5">
                <span
                  className={`text-[7px] font-black uppercase tracking-[0.4em] transition-colors duration-500 ${isDragOver ? 'text-brand-400' : 'text-white/10'}`}
                >
                  {theme.label}
                </span>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-1 h-1 rounded-full animate-pulse ${theme.bg.replace('/10', '')} shadow-[0_0_8px_currentColor]`}
                    style={{ color: theme.color.replace('text-', '') }}
                  />
                  <h3
                    className={`text-sm font-black uppercase tracking-tight transition-colors duration-500 ${isDragOver ? 'text-white' : 'text-white/70'}`}
                  >
                    {column.label}
                  </h3>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="tabular-nums inline-flex h-5 min-w-7 items-center justify-center rounded-xs bg-white/5 px-2 text-[8px] font-bold font-mono text-white/30 border border-white/5">
                  {tasks.length.toString().padStart(2, '0')}
                </span>
              </div>
            </div>

            {/* Task List Container */}
            <div className="flex-1 overflow-y-auto space-y-var(--space-3) p-var(--space-4) min-h-[200px] elite-scrollbar relative z-10">
              <AnimatePresence mode="popLayout">
                {tasks.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-16 rounded-md border border-dashed border-white/5 bg-white/[0.01] group/empty"
                  >
                    <div className="w-12 h-12 rounded-sm bg-white/[0.02] border border-white/5 flex items-center justify-center mb-4 group-hover/empty:bg-white/[0.04] transition-all duration-500">
                      <span className="text-white/5 text-xl font-black">∅</span>
                    </div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/10">
                      Empty Node
                    </p>
                  </motion.div>
                ) : (
                  tasks.map((task) => (
                    <motion.div
                      key={task.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ type: 'spring', damping: 25, stiffness: 150 }}
                    >
                      <QuantumCard
                        hoverEffect={true}
                        glowColor={
                          task.priority === 'urgent'
                            ? 'rose'
                            : task.priority === 'high'
                              ? 'brand'
                              : 'none'
                        }
                        className={`${
                          isUpdatePending && updatingTaskId === task.id
                            ? 'opacity-50 grayscale'
                            : isDragDropLocked
                              ? 'cursor-not-allowed opacity-80'
                              : 'cursor-grab active:cursor-grabbing'
                        } ${
                          selectedTaskIds.has(task.id)
                            ? 'ring-1 ring-brand-500/30 bg-brand-500/5'
                            : ''
                        } ${task.deletedAt ? 'opacity-20 grayscale' : ''}`}
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
                          className="p-var(--space-4) space-y-var(--space-4)"
                        >
                          {/* Top Protocols */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 flex items-center justify-center rounded-xs bg-white/[0.03] border border-white/5">
                                <TaskTypeIcon type={task.type ?? 'task'} />
                              </div>
                              <TaskIdBadge projectKey={projectKey} number={task.number} />
                            </div>
                            {task.storyPoints ? (
                              <StoryPointsBadge points={task.storyPoints} />
                            ) : null}
                          </div>

                          {/* Mission Title */}
                          <div className="space-y-1">
                            {atRiskTaskIds?.has(task.id) && (
                              <div className="flex items-center gap-1.5 mb-1">
                                <div className="w-1 h-1 rounded-full bg-amber-500 animate-pulse shadow-[0_0_5px_rgba(245,158,11,0.5)]" />
                                <span className="text-[8px] font-black text-amber-500/80 uppercase tracking-widest">
                                  At Risk
                                </span>
                              </div>
                            )}
                            <h4
                              className={`text-sm font-bold tracking-tight leading-snug transition-colors ${
                                task.deletedAt
                                  ? 'text-white/10 line-through'
                                  : 'text-white/80 group-hover:text-white'
                              }`}
                            >
                              {task.title}
                            </h4>
                          </div>

                          {/* Labels Track */}
                          {task.labels && task.labels.length > 0 ? (
                            <div className="pt-0.5">
                              <LabelDots labels={task.labels} />
                            </div>
                          ) : null}

                          {/* Tactical Metadata Footer */}
                          <div className="flex items-center justify-between pt-var(--space-3) border-t border-white/5">
                            <div className="flex items-center gap-3">
                              <PriorityBadge priority={task.priority} />
                              {task.dueDate ? (
                                <div className="flex items-center gap-1.5 px-1.5 py-0.5 bg-white/[0.02] rounded-xs border border-white/5">
                                  <div
                                    className={`h-1 w-1 rounded-full ${isTaskOverdue(task.dueDate) && task.status !== 'done' ? 'bg-rose-500 animate-pulse' : 'bg-white/10'}`}
                                  />
                                  <span
                                    className={`text-[8px] font-bold tracking-widest uppercase ${isTaskOverdue(task.dueDate) && task.status !== 'done' ? 'text-rose-400' : 'text-white/20'}`}
                                  >
                                    {formatDate(task.dueDate).toUpperCase()}
                                  </span>
                                </div>
                              ) : null}
                            </div>
                            {task.assigneeName ? (
                              <div className="ring-2 ring-slate-950 rounded-full scale-90">
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
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>

            {/* Signal Input Footer */}
            <div className="px-var(--space-4) pb-var(--space-4) relative z-10">
              <button
                type="button"
                onClick={() => onAddTask(column.key)}
                className="group w-full flex items-center justify-center gap-3 rounded-xs border border-dashed border-white/5 py-2.5 text-[9px] font-bold uppercase tracking-[0.2em] text-white/10 transition-all hover:border-brand-500/20 hover:bg-brand-500/5 hover:text-brand-400 group/add"
              >
                <div className="w-4 h-4 flex items-center justify-center rounded-xs bg-white/5 border border-white/5 group-hover/add:bg-brand-500 group-hover/add:text-slate-950 transition-all">
                  <span className="text-xs font-bold translate-y-[-0.5px]">+</span>
                </div>
                <span>Inject Signal</span>
              </button>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
