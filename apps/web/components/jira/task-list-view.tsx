'use client';

import type { ProjectTaskItemDTO, WorkflowStatusTemplateDTO } from '@superboard/shared';
import {
  TaskTypeIcon,
  PriorityBadge,
  AssigneeAvatar,
  LabelDots,
  TaskIdBadge,
} from '@/components/jira/task-badges';
import { formatDate } from '@/lib/format-date';

interface TaskListViewProps {
  visibleTasks: ProjectTaskItemDTO[];
  projectKey: string | null;
  selectedTaskIds: Set<string>;
  selectedVisibleCount: number;
  toggleTaskSelection: (taskId: string) => void;
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
  toggleTaskSelection,
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
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left">
              <input
                type="checkbox"
                checked={visibleTasks.length > 0 && selectedVisibleCount === visibleTasks.length}
                onChange={toggleSelectAllVisible}
                aria-label="Chọn tất cả task đang hiển thị"
                className="h-3.5 w-3.5 rounded border-slate-300 text-brand-600"
              />
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-700 uppercase">
              Task
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-700 uppercase">
              Trạng thái
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-700 uppercase">
              Độ ưu tiên
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-700 uppercase">
              Người thực hiện
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-700 uppercase">
              Cập nhật
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {visibleTasks.map((task) => (
            <tr
              key={task.id}
              tabIndex={0}
              role="button"
              aria-label={task.title}
              onClick={() => onOpenEdit(task)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onOpenEdit(task);
                }
              }}
              className={`cursor-pointer transition-colors hover:bg-brand-50/50 even:bg-slate-50/50 ${
                selectedTaskIds.has(task.id) ? 'bg-brand-50/40' : ''
              } ${task.deletedAt ? 'bg-slate-50/80 grayscale opacity-60' : ''}`}
            >
              <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={selectedTaskIds.has(task.id)}
                  onChange={() => toggleTaskSelection(task.id)}
                  aria-label={`Chọn task ${task.title}`}
                  className="h-3.5 w-3.5 rounded border-slate-300 text-brand-600"
                />
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <TaskTypeIcon type={task.type ?? 'task'} />
                  <TaskIdBadge projectKey={projectKey} number={task.number} />
                </div>
                <p
                  className={`mt-0.5 font-medium ${
                    task.deletedAt ? 'text-slate-400 line-through' : 'text-slate-900'
                  }`}
                >
                  {task.title}
                </p>
                {task.labels && task.labels.length > 0 ? (
                  <div className="mt-1">
                    <LabelDots labels={task.labels} />
                  </div>
                ) : null}
              </td>
              <td className="px-4 py-3">
                <select
                  value={task.status}
                  disabled={isUpdatePending || isDragDropLocked}
                  title={statusSelectLockReason}
                  onChange={(event) => {
                    onUpdateTaskStatus(task.id, event.target.value as ProjectTaskItemDTO['status']);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 disabled:cursor-not-allowed disabled:bg-slate-100"
                >
                  {getStatusOptionsForTask(task.status).map((opt) => (
                    <option key={opt.key} value={opt.key}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-4 py-3">
                <PriorityBadge priority={task.priority} />
              </td>
              <td className="px-4 py-3">
                {task.assigneeName ? (
                  <div className="flex items-center gap-1.5">
                    <AssigneeAvatar name={task.assigneeName} color={task.assigneeAvatarColor} />
                    <span className="text-xs text-slate-600">{task.assigneeName}</span>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400">Chưa gán</span>
                )}
              </td>
              <td className="px-4 py-3 text-slate-600">{formatDate(task.updatedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
