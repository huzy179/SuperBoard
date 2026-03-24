'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import type {
  ProjectMemberDTO,
  ProjectTaskItemDTO,
  TaskTypeDTO,
  CreateTaskRequestDTO,
} from '@superboard/shared';
import {
  BOARD_COLUMNS,
  PRIORITY_OPTIONS,
  TASK_TYPE_OPTIONS,
  type TaskPriority,
} from '@/lib/constants/task';

type TaskCreateFormProps = {
  initialStatus?: ProjectTaskItemDTO['status'] | undefined;
  members: ProjectMemberDTO[];
  isPending: boolean;
  onCreate: (data: CreateTaskRequestDTO) => Promise<void>;
  onSuccess: () => void;
  onCancel: () => void;
};

export function TaskCreateForm({
  initialStatus = 'todo',
  members,
  isPending,
  onCreate,
  onSuccess,
  onCancel,
}: TaskCreateFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ProjectTaskItemDTO['status']>(initialStatus);
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [type, setType] = useState<TaskTypeDTO>('task');
  const [dueDate, setDueDate] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const normalizedTitle = title.trim();
    if (!normalizedTitle) {
      setError('Tiêu đề task không được để trống');
      return;
    }

    setError(null);
    try {
      await onCreate({
        title: normalizedTitle,
        description: description.trim(),
        status,
        priority,
        type,
        dueDate: dueDate || null,
        assigneeId: assigneeId || null,
      });
      onSuccess();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Không thể tạo task');
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-xs"
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Tạo task mới</h3>
        <span className="text-xs text-slate-500">Điền thông tin cơ bản</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
          Tiêu đề task
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Ví dụ: Thiết kế flow login mới"
            className="mt-1.5 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-brand-500"
            required
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Trạng thái
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as ProjectTaskItemDTO['status'])}
            className="mt-1.5 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-brand-500"
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
            value={priority}
            onChange={(event) => setPriority(event.target.value as TaskPriority)}
            className="mt-1.5 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-brand-500"
          >
            {PRIORITY_OPTIONS.map((priorityOpt) => (
              <option key={priorityOpt.key} value={priorityOpt.key}>
                {priorityOpt.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Loại task
          <select
            value={type}
            onChange={(event) => setType(event.target.value as TaskTypeDTO)}
            className="mt-1.5 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-brand-500"
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
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
            className="mt-1.5 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-brand-500"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Người thực hiện
          <select
            value={assigneeId}
            onChange={(event) => setAssigneeId(event.target.value)}
            className="mt-1.5 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-brand-500"
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
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            placeholder="Chi tiết ngắn cho task"
            className="mt-1.5 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-brand-500"
          />
        </label>
      </div>
      {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
      <div className="mt-4 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          Huỷ
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isPending ? 'Đang tạo...' : 'Tạo task'}
        </button>
      </div>
    </form>
  );
}
