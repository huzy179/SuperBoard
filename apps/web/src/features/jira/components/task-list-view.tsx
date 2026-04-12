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
  onSelectTask: (taskId: string, event: React.MouseEvent | React.KeyboardEvent) => void;
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
    <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white/50 backdrop-blur-md shadow-2xl animate-in fade-in zoom-in-95 duration-500">
      <table className="min-w-full divide-y divide-slate-100 text-sm">
        <thead className="bg-slate-50/80">
          <tr>
            <th className="px-6 py-4 text-left">
              <input
                type="checkbox"
                checked={visibleTasks.length > 0 && selectedVisibleCount === visibleTasks.length}
                onChange={toggleSelectAllVisible}
                aria-label="Chọn tất cả task đang hiển thị"
                className="h-4 w-4 rounded-md border-slate-300 text-brand-600 focus:ring-brand-500 shadow-sm cursor-pointer"
              />
            </th>
            <th className="px-6 py-4 text-left text-[10px] font-black tracking-widest text-slate-400 uppercase">
              Công việc
            </th>
            <th className="px-6 py-4 text-left text-[10px] font-black tracking-widest text-slate-400 uppercase">
              Trạng thái
            </th>
            <th className="px-6 py-4 text-left text-[10px] font-black tracking-widest text-slate-400 uppercase">
              Ưu tiên
            </th>
            <th className="px-6 py-4 text-left text-[10px] font-black tracking-widest text-slate-400 uppercase">
              Người thực hiện
            </th>
            <th className="px-6 py-4 text-left text-[10px] font-black tracking-widest text-slate-400 uppercase">
              Cập nhật
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 bg-white/30">
          {visibleTasks.map((task) => {
            const isSelected = selectedTaskIds.has(task.id);
            return (
              <tr
                key={task.id}
                tabIndex={0}
                role="button"
                aria-label={task.title}
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
                className={`group cursor-pointer transition-all duration-300 hover:bg-white/80 ${
                  isSelected ? 'bg-brand-50/50 shadow-[inset_0_0_20px_rgba(37,99,235,0.05)]' : ''
                } ${task.deletedAt ? 'bg-slate-50/50 grayscale opacity-40' : ''}`}
              >
                <td className="px-6 py-4" onClick={(event) => event.stopPropagation()}>
                  <div
                    className={`transition-opacity duration-200 ${isSelected ? 'opacity-100' : 'opacity-20 group-hover:opacity-100'}`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => onSelectTask(task.id, e)}
                      aria-label={`Chọn task ${task.title}`}
                      className="h-4 w-4 rounded-md border-slate-300 text-brand-600 focus:ring-brand-500 shadow-sm cursor-pointer"
                    />
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 shadow-sm transition-transform group-hover:scale-110">
                      <TaskTypeIcon type={task.type ?? 'task'} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <TaskIdBadge projectKey={projectKey} number={task.number} />
                        <p
                          className={`font-bold transition-colors ${
                            task.deletedAt
                              ? 'text-slate-400 line-through'
                              : 'text-slate-900 group-hover:text-brand-700'
                          }`}
                        >
                          {task.title}
                        </p>
                      </div>
                      {task.labels && task.labels.length > 0 ? (
                        <div className="mt-1.5 overflow-hidden">
                          <LabelDots labels={task.labels} />
                        </div>
                      ) : null}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={task.status}
                      disabled={isUpdatePending || isDragDropLocked}
                      title={statusSelectLockReason}
                      onChange={(event) => {
                        onUpdateTaskStatus(
                          task.id,
                          event.target.value as unknown as ProjectTaskItemDTO['status'],
                        );
                      }}
                      className="appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-8 py-2 text-[11px] font-black uppercase tracking-widest text-slate-700 focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all disabled:opacity-50 outline-none cursor-pointer shadow-sm"
                    >
                      {getStatusOptionsForTask(task.status).map((opt) => (
                        <option key={opt.key} value={opt.key}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                      <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                        <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                      </svg>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <PriorityBadge priority={task.priority} />
                </td>
                <td className="px-6 py-4">
                  {task.assigneeName ? (
                    <div className="flex items-center gap-2.5 group/assignee">
                      <AssigneeAvatar name={task.assigneeName} color={task.assigneeAvatarColor} />
                      <span className="text-xs font-bold text-slate-600 transition-colors group-hover/assignee:text-slate-900 truncate max-w-[120px]">
                        {task.assigneeName}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                      Chưa gán
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-slate-600">
                      {formatDate(task.updatedAt)}
                    </span>
                    <span className="text-[9px] font-medium text-slate-400 uppercase tracking-tight">
                      Last Activity
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
