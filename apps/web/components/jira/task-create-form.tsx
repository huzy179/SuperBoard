import type { FormEventHandler } from 'react';
import type { ProjectMemberDTO, ProjectTaskItemDTO, TaskTypeDTO } from '@superboard/shared';
import {
  BOARD_COLUMNS,
  PRIORITY_OPTIONS,
  TASK_TYPE_OPTIONS,
  type TaskPriority,
} from '@/lib/constants/task';

type TaskCreateFormProps = {
  members: ProjectMemberDTO[];
  taskTitle: string;
  taskDescription: string;
  taskStatus: ProjectTaskItemDTO['status'];
  taskPriority: TaskPriority;
  taskType: TaskTypeDTO;
  taskDueDate: string;
  taskAssigneeId: string;
  createTaskError: string | null;
  createTaskPending: boolean;
  onTaskTitleChange: (value: string) => void;
  onTaskDescriptionChange: (value: string) => void;
  onTaskStatusChange: (value: ProjectTaskItemDTO['status']) => void;
  onTaskPriorityChange: (value: TaskPriority) => void;
  onTaskTypeChange: (value: TaskTypeDTO) => void;
  onTaskDueDateChange: (value: string) => void;
  onTaskAssigneeIdChange: (value: string) => void;
  onCancel: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
};

export function TaskCreateForm({
  members,
  taskTitle,
  taskDescription,
  taskStatus,
  taskPriority,
  taskType,
  taskDueDate,
  taskAssigneeId,
  createTaskError,
  createTaskPending,
  onTaskTitleChange,
  onTaskDescriptionChange,
  onTaskStatusChange,
  onTaskPriorityChange,
  onTaskTypeChange,
  onTaskDueDateChange,
  onTaskAssigneeIdChange,
  onCancel,
  onSubmit,
}: TaskCreateFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="mb-6 rounded-xl border border-surface-border bg-surface-card p-5 shadow-sm"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
          Tiêu đề task
          <input
            type="text"
            value={taskTitle}
            onChange={(event) => onTaskTitleChange(event.target.value)}
            placeholder="Ví dụ: Thiết kế flow login mới"
            className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            required
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Trạng thái
          <select
            value={taskStatus}
            onChange={(event) =>
              onTaskStatusChange(event.target.value as ProjectTaskItemDTO['status'])
            }
            className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
          >
            {BOARD_COLUMNS.map((column) => (
              <option key={column.key} value={column.key}>
                {column.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Độ ưu tiên
          <select
            value={taskPriority}
            onChange={(event) => onTaskPriorityChange(event.target.value as TaskPriority)}
            className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
          >
            {PRIORITY_OPTIONS.map((priority) => (
              <option key={priority.key} value={priority.key}>
                {priority.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Loại task
          <select
            value={taskType}
            onChange={(event) => onTaskTypeChange(event.target.value as TaskTypeDTO)}
            className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
          >
            {TASK_TYPE_OPTIONS.map((taskOption) => (
              <option key={taskOption.key} value={taskOption.key}>
                {taskOption.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Hạn hoàn thành
          <input
            type="date"
            value={taskDueDate}
            onChange={(event) => onTaskDueDateChange(event.target.value)}
            className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Người thực hiện
          <select
            value={taskAssigneeId}
            onChange={(event) => onTaskAssigneeIdChange(event.target.value)}
            className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
          >
            <option value="">-- Chưa gán --</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.fullName}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
          Mô tả
          <textarea
            value={taskDescription}
            onChange={(event) => onTaskDescriptionChange(event.target.value)}
            rows={3}
            placeholder="Chi tiết ngắn cho task"
            className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
          />
        </label>
      </div>
      {createTaskError ? <p className="mt-3 text-sm text-rose-600">{createTaskError}</p> : null}
      <div className="mt-4 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
        >
          Huỷ
        </button>
        <button
          type="submit"
          disabled={createTaskPending}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {createTaskPending ? 'Đang tạo...' : 'Tạo task'}
        </button>
      </div>
    </form>
  );
}
