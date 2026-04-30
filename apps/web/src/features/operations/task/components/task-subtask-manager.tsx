'use client';

import type { ProjectTaskItemDTO } from '@superboard/shared';
import { CheckCircle2, Plus, Trash2, ArrowUpRight, Loader2 } from 'lucide-react';

interface TaskSubtaskManagerProps {
  editingTask: ProjectTaskItemDTO;
  subtasks: ProjectTaskItemDTO[];
  subtaskTitle: string;
  setSubtaskTitle: (val: string) => void;
  subtaskError: string | null;
  subtaskPendingTaskId: string | null;
  onCreateSubtask: () => void;
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
  const done = editingTask.subtaskProgress?.done ?? 0;
  const total = editingTask.subtaskProgress?.total ?? subtasks.length;
  const percent =
    editingTask.subtaskProgress?.percent ?? (total > 0 ? Math.round((done / total) * 100) : 0);

  if (editingTask.parentTaskId) {
    return (
      <section className="rounded-xl border border-surface-border bg-surface-card p-6 shadow-glass space-y-3">
        <p className="text-sm font-semibold text-[color:var(--color-ink)]">Task này là subtask</p>
        <p className="text-sm text-[color:var(--color-muted)] leading-relaxed">
          Mở task cha để xem bối cảnh và điều hướng nhanh.
        </p>
        <button
          type="button"
          onClick={() => parentTask && onOpenEdit(parentTask)}
          disabled={!parentTask}
          className="btn btn-secondary w-full justify-between"
        >
          <span className="truncate">{parentTask?.title ?? 'Task cha không khả dụng'}</span>
          <ArrowUpRight size={16} />
        </button>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-surface-border bg-surface-card p-6 shadow-glass space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-[color:var(--color-ink)]">Subtasks</h3>
          <p className="mt-1 text-sm text-[color:var(--color-muted)]">
            {done}/{total} hoàn thành · {percent}%
          </p>
        </div>
        <div className="w-32">
          <div className="h-2 w-full rounded-full bg-black/[0.06] overflow-hidden">
            <div className="h-full bg-brand-500 rounded-full" style={{ width: `${percent}%` }} />
          </div>
        </div>
      </header>

      {subtasks.length === 0 ? (
        <div className="rounded-lg border border-surface-border bg-black/[0.02] p-6 text-sm text-[color:var(--color-muted)]">
          Chưa có subtask. Thêm một subtask để chia nhỏ công việc.
        </div>
      ) : (
        <div className="space-y-2">
          {subtasks.map((subtask) => {
            const pending = subtaskPendingTaskId === subtask.id;
            const isDone = subtask.status === 'done';
            return (
              <div
                key={subtask.id}
                className={`group flex items-center gap-3 rounded-lg border border-surface-border bg-surface-card px-3 py-2 hover:bg-black/[0.02] transition-colors ${
                  isDone ? 'opacity-70' : ''
                }`}
              >
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isDone}
                    onChange={() => onToggleSubtaskDone(subtask)}
                    disabled={pending}
                    className="h-4 w-4 rounded border-surface-border text-brand-500 focus:ring-2 focus:ring-[color:var(--color-focus)]/20"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => onOpenEdit(subtask)}
                  className={`flex-1 min-w-0 text-left text-sm font-medium truncate ${
                    isDone
                      ? 'text-[color:var(--color-muted)] line-through'
                      : 'text-[color:var(--color-ink)]'
                  }`}
                >
                  {subtask.title}
                </button>

                {pending ? (
                  <Loader2 size={16} className="animate-spin text-[color:var(--color-muted)]" />
                ) : isDone ? (
                  <CheckCircle2 size={16} className="text-emerald-700" />
                ) : null}

                <button
                  type="button"
                  onClick={() => onDeleteSubtask(subtask.id)}
                  disabled={pending}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-transparent text-rose-700 hover:bg-rose-50 hover:border-rose-200 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-40"
                  title="Xóa subtask"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="pt-4 border-t border-surface-border space-y-2">
        <label className="form-label">Thêm subtask</label>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={subtaskTitle}
            onChange={(event) => setSubtaskTitle(event.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onCreateSubtask();
              }
            }}
            placeholder="Nhập tiêu đề subtask…"
            className="form-input flex-1"
          />
          <button
            type="button"
            onClick={onCreateSubtask}
            disabled={subtaskPendingTaskId === editingTask.id || !subtaskTitle.trim()}
            className="btn btn-primary px-3"
          >
            <Plus size={16} />
            Thêm
          </button>
        </div>
        {subtaskError ? <div className="form-error">{subtaskError}</div> : null}
      </div>
    </section>
  );
}
