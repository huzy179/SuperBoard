'use client';

import type { ProjectTaskItemDTO, WorkflowStatusTemplateDTO } from '@superboard/shared';
import {
  TaskTypeIcon,
  PriorityBadge,
  AssigneeAvatar,
  LabelDots,
  TaskIdBadge,
} from '@/features/jira/components/task-badges';
import { formatDate } from '@/lib/format-date';

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
    <div className="overflow-hidden rounded-[3rem] border border-white/5 bg-white/[0.01] backdrop-blur-[40px] shadow-luxe animate-in fade-in slide-in-from-bottom-8 duration-1000 relative group">
      {/* Internal Rim Lighting */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <table className="min-w-full border-collapse text-sm tabular-nums relative z-10">
        <thead>
          <tr className="bg-white/[0.02] border-b border-white/5">
            <th className="px-10 py-8 text-left w-20">
              <div className="relative flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={visibleTasks.length > 0 && selectedVisibleCount === visibleTasks.length}
                  onChange={toggleSelectAllVisible}
                  className="h-5 w-5 rounded-lg border-white/10 bg-white/5 text-brand-500 focus:ring-brand-500/50 shadow-inner cursor-pointer transition-all"
                />
              </div>
            </th>
            <th className="px-8 py-8 text-left text-[11px] font-black tracking-[0.5em] text-white/20 uppercase italic">
              OPERATIONAL_TASK
            </th>
            <th className="px-8 py-8 text-left text-[11px] font-black tracking-[0.5em] text-white/20 uppercase italic">
              FREQUENCY_HUB
            </th>
            <th className="px-8 py-8 text-left text-[11px] font-black tracking-[0.5em] text-white/20 uppercase italic">
              PRIORITY_RANK
            </th>
            <th className="px-8 py-8 text-left text-[11px] font-black tracking-[0.5em] text-white/20 uppercase italic">
              OPERATOR_ID
            </th>
            <th className="px-10 py-8 text-left text-[11px] font-black tracking-[0.5em] text-white/20 uppercase italic">
              SYSTEM_SYNC
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.03]">
          {visibleTasks.map((task) => {
            const isSelected = selectedTaskIds.has(task.id);
            return (
              <tr
                key={task.id}
                onClick={(e) => {
                  if (e.metaKey || e.ctrlKey || e.shiftKey) {
                    onSelectTask(task.id, e);
                  } else {
                    onOpenEdit(task);
                  }
                }}
                className={`group cursor-pointer transition-all duration-500 hover:bg-white/[0.04] relative ${
                  isSelected ? 'bg-brand-500/[0.03]' : ''
                } ${task.deletedAt ? 'opacity-20 grayscale pointer-events-none' : ''}`}
              >
                <td className="px-10 py-6" onClick={(event) => event.stopPropagation()}>
                  <div className="relative flex items-center justify-center">
                    {isSelected && (
                      <motion.div
                        layoutId={`selected-row-${task.id}`}
                        className="absolute -left-10 w-1.5 h-12 bg-brand-500 shadow-glow-brand rounded-r-lg"
                      />
                    )}
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => onSelectTask(task.id, e)}
                      className={`h-5 w-5 rounded-lg border-white/10 bg-white/5 text-brand-500 transition-all ${isSelected ? 'opacity-100' : 'opacity-20 group-hover:opacity-100'}`}
                    />
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-2xl bg-white/[0.03] flex items-center justify-center border border-white/5 shadow-inner transition-all duration-700 group-hover:scale-110 group-hover:shadow-glow-brand/10">
                      <TaskTypeIcon type={task.type ?? 'task'} />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-4">
                        <TaskIdBadge projectKey={projectKey} number={task.number} />
                        <p
                          className={`text-sm font-black tracking-tight uppercase italic transition-colors duration-500 ${
                            isSelected ? 'text-white' : 'text-white/70 group-hover:text-white'
                          }`}
                        >
                          {task.title}
                        </p>
                      </div>
                      {task.labels && task.labels.length > 0 && (
                        <div className="opacity-40 group-hover:opacity-100 transition-opacity duration-700">
                          <LabelDots labels={task.labels} />
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
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
                      className="appearance-none rounded-2xl border border-white/5 bg-white/[0.02] pl-6 pr-12 py-3.5 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 focus:bg-white/[0.05] focus:text-white outline-none transition-all cursor-pointer shadow-inner italic"
                    >
                      {getStatusOptionsForTask(task.status).map((opt) => (
                        <option key={opt.key} value={opt.key} className="bg-slate-950 italic">
                          {opt.label.toUpperCase()}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-white/10">
                      <ChevronDown size={14} />
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <PriorityBadge priority={task.priority} />
                </td>
                <td className="px-8 py-6">
                  {task.assigneeName ? (
                    <div className="flex items-center gap-5 group/assignee">
                      <div className="ring-2 ring-white/5 rounded-full p-0.5 transition-all group-hover/assignee:ring-brand-500/30 shadow-luxe">
                        <AssigneeAvatar
                          name={task.assigneeName}
                          color={task.assigneeAvatarColor}
                          size={32}
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-black text-white/60 uppercase tracking-tight italic group-hover/assignee:text-white transition-colors">
                          {task.assigneeName}
                        </span>
                        <span className="text-[8px] font-bold text-white/10 uppercase tracking-widest">
                          RANK_CERTIFIED
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-white/5 animate-ping" />
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/5 italic">
                        VOID_OPERATOR
                      </span>
                    </div>
                  )}
                </td>
                <td className="px-10 py-6">
                  <div className="flex flex-col gap-1 text-right">
                    <span className="text-xs font-black text-white/40 uppercase font-mono tracking-tighter group-hover:text-brand-400 transition-colors italic">
                      {formatDate(task.updatedAt).toUpperCase()}
                    </span>
                    <span className="text-[8px] font-bold text-white/5 uppercase tracking-[0.4em]">
                      PULSE_LAST_SEEN
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
