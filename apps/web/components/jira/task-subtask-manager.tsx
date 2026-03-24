'use client';

import { FormEvent } from 'react';
import type { ProjectTaskItemDTO } from '@superboard/shared';

interface TaskSubtaskManagerProps {
  editingTask: ProjectTaskItemDTO;
  subtasks: ProjectTaskItemDTO[];
  subtaskTitle: string;
  setSubtaskTitle: (val: string) => void;
  subtaskError: string | null;
  subtaskPendingTaskId: string | null;
  onCreateSubtask: (e: FormEvent) => void;
  onToggleSubtaskDone: (subtask: ProjectTaskItemDTO) => void;
  onDeleteSubtask: (id: string) => void;
  onOpenEdit: (task: ProjectTaskItemDTO) => void;
  parentTask: ProjectTaskItemDTO | null;
}

export function TaskSubtaskManager({
  editingTask,
  subtasks,
  subtaskTitle,
  setSubtaskTitle,
  subtaskError,
  subtaskPendingTaskId,
  onCreateSubtask,
  onToggleSubtaskDone,
  onDeleteSubtask,
  onOpenEdit,
  parentTask,
}: TaskSubtaskManagerProps) {
  if (editingTask.parentTaskId) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
        <p className="text-xs font-semibold text-slate-500 uppercase">Task cha</p>
        <p className="mt-1 text-sm font-medium text-slate-800">
          {parentTask?.title ?? 'Task cha đã bị xoá hoặc không tồn tại'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-800">Subtasks</p>
        <span className="text-xs text-slate-600">
          {editingTask.subtaskProgress?.done ?? 0}/{editingTask.subtaskProgress?.total ?? 0} hoàn
          thành ({editingTask.subtaskProgress?.percent ?? 0}%)
        </span>
      </div>

      {subtasks.length === 0 ? (
        <p className="text-xs text-slate-500">Chưa có subtask</p>
      ) : (
        <div className="space-y-2">
          {subtasks.map((subtask) => (
            <div
              key={subtask.id}
              className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 py-2"
            >
              <input
                type="checkbox"
                checked={subtask.status === 'done'}
                onChange={() => {
                  onToggleSubtaskDone(subtask);
                }}
                disabled={subtaskPendingTaskId === subtask.id}
                className="h-4 w-4 rounded border-slate-300 text-brand-600"
              />
              <button
                type="button"
                onClick={() => onOpenEdit(subtask)}
                className={`flex-1 text-left text-sm ${subtask.status === 'done' ? 'text-slate-400 line-through' : 'text-slate-800 hover:text-brand-700'}`}
              >
                {subtask.title}
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteSubtask(subtask.id);
                }}
                disabled={subtaskPendingTaskId === subtask.id}
                className="rounded px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-50"
              >
                Xoá
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={subtaskTitle}
          onChange={(event) => setSubtaskTitle(event.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onCreateSubtask(e);
            }
          }}
          placeholder="Thêm subtask mới..."
          className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-brand-500"
        />
        <button
          type="button"
          onClick={onCreateSubtask}
          disabled={subtaskPendingTaskId === editingTask.id}
          className="rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {subtaskPendingTaskId === editingTask.id ? 'Đang thêm...' : 'Thêm'}
        </button>
      </div>

      {subtaskError ? <p className="text-xs text-rose-600">{subtaskError}</p> : null}
    </div>
  );
}
