'use client';

import { FormEvent, type Dispatch, type SetStateAction } from 'react';
import type { ProjectTaskItemDTO, ProjectMemberDTO, TaskTypeDTO } from '@superboard/shared';
import { TaskTypeIcon } from '@/components/jira/task-badges';
import { TaskCommentSection } from '@/components/jira/task-comment-section';
import { formatDate } from '@/lib/format-date';
import {
  BOARD_COLUMNS,
  PRIORITY_OPTIONS,
  TASK_TYPE_OPTIONS,
  TASK_TYPE_ICONS,
  type TaskPriority,
} from '@/lib/constants/task';

interface TaskEditSlideOverProps {
  editingTask: ProjectTaskItemDTO;
  projectKey: string | null;
  projectId: string;
  currentUserId: string;
  members: ProjectMemberDTO[];

  // States
  editTitle: string;
  setEditTitle: (val: string) => void;
  editDescription: string;
  setEditDescription: (val: string) => void;
  editType: TaskTypeDTO;
  setEditType: Dispatch<SetStateAction<TaskTypeDTO>>;
  editStatus: ProjectTaskItemDTO['status'];
  setEditStatus: (val: ProjectTaskItemDTO['status']) => void;
  editPriority: TaskPriority;
  setEditPriority: (val: TaskPriority) => void;
  editStoryPoints: string;
  setEditStoryPoints: (val: string) => void;
  editDueDate: string;
  setEditDueDate: (val: string) => void;
  editAssigneeId: string;
  setEditAssigneeId: (val: string) => void;

  // Subtasks
  editingTaskSubtasks: ProjectTaskItemDTO[];
  subtaskTitle: string;
  setSubtaskTitle: (val: string) => void;
  subtaskError: string | null;
  subtaskPendingTaskId: string | null;
  handleCreateSubtask: (e: FormEvent) => void;
  handleToggleSubtaskDone: (subtask: ProjectTaskItemDTO) => void;
  handleDeleteSubtask: (id: string) => void;
  editingParentTask: ProjectTaskItemDTO | null;

  // Actions
  onClose: () => void;
  onSave: (e: FormEvent<HTMLFormElement>) => Promise<void>;
  onDelete: () => void;
  isSaving: boolean;
  isDeleting: boolean;
  taskUpdateError: string | null;

  // D&D and logic
  handleOpenEdit: (task: ProjectTaskItemDTO) => void;
  dialogRef: React.RefObject<HTMLDivElement | null>;
  handleDialogKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
}

export function TaskEditSlideOver({
  editingTask,
  projectKey,
  projectId,
  currentUserId,
  members,
  editTitle,
  setEditTitle,
  editDescription,
  setEditDescription,
  editType,
  setEditType,
  editStatus,
  setEditStatus,
  editPriority,
  setEditPriority,
  editStoryPoints,
  setEditStoryPoints,
  editDueDate,
  setEditDueDate,
  editAssigneeId,
  setEditAssigneeId,
  editingTaskSubtasks,
  subtaskTitle,
  setSubtaskTitle,
  subtaskError,
  subtaskPendingTaskId,
  handleCreateSubtask,
  handleToggleSubtaskDone,
  handleDeleteSubtask,
  editingParentTask,
  onClose,
  onSave,
  onDelete,
  isSaving,
  isDeleting,
  taskUpdateError,
  handleOpenEdit,
  dialogRef,
  handleDialogKeyDown,
}: TaskEditSlideOverProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/20 backdrop-blur-sm">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-detail-title"
        tabIndex={-1}
        onKeyDown={handleDialogKeyDown}
        className="h-full w-full max-w-lg animate-in slide-in-from-right border-l border-slate-200 bg-white shadow-2xl outline-none"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <div className="flex items-center gap-3">
              <TaskTypeIcon type={editingTask.type ?? 'task'} />
              {projectKey && editingTask.number ? (
                <span className="font-mono text-sm font-semibold text-slate-500">
                  {projectKey}-{editingTask.number}
                </span>
              ) : null}
              <h2 id="task-detail-title" className="text-lg font-bold text-slate-900">
                Chi tiết task
              </h2>
            </div>
            <button
              type="button"
              aria-label="Đóng chi tiết task"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            >
              ✕
            </button>
          </div>

          <form id="task-edit-form" onSubmit={onSave} className="flex-1 overflow-y-auto">
            <div className="p-6">
              <div className="space-y-5">
                <label className="block text-sm font-medium text-slate-700">
                  Tiêu đề
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-brand-500"
                    required
                  />
                </label>

                <div>
                  <p className="text-sm font-medium text-slate-700 mb-2">Loại task</p>
                  <div className="flex gap-1">
                    {TASK_TYPE_OPTIONS.map((t) => (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => setEditType(t.key)}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                          editType === t.key
                            ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-300'
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span className="text-sm">{TASK_TYPE_ICONS[t.key].icon}</span>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <label className="block text-sm font-medium text-slate-700">
                    Trạng thái
                    <select
                      value={editStatus}
                      onChange={(e) =>
                        setEditStatus(e.target.value as ProjectTaskItemDTO['status'])
                      }
                      className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-brand-500"
                    >
                      {BOARD_COLUMNS.map((col) => (
                        <option key={col.key} value={col.key}>
                          {col.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    Độ ưu tiên
                    <select
                      value={editPriority}
                      onChange={(e) => setEditPriority(e.target.value as TaskPriority)}
                      className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-brand-500"
                    >
                      {PRIORITY_OPTIONS.map((priority) => (
                        <option key={priority.key} value={priority.key}>
                          {priority.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <label className="block text-sm font-medium text-slate-700">
                    Story Points
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={editStoryPoints}
                      onChange={(e) => setEditStoryPoints(e.target.value)}
                      placeholder="—"
                      className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-brand-500"
                    />
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    Hạn hoàn thành
                    <input
                      type="date"
                      value={editDueDate}
                      onChange={(e) => setEditDueDate(e.target.value)}
                      className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-brand-500"
                    />
                  </label>
                </div>

                <label className="block text-sm font-medium text-slate-700">
                  Người thực hiện
                  <select
                    value={editAssigneeId}
                    onChange={(e) => setEditAssigneeId(e.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-brand-500"
                  >
                    <option value="">-- Chưa gán --</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.fullName}
                      </option>
                    ))}
                  </select>
                </label>

                {editingTask.labels && editingTask.labels.length > 0 ? (
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">Nhãn</p>
                    {/* Assuming LabelDots is extracted too or keep here */}
                    <div className="flex gap-1 flex-wrap">
                      {editingTask.labels.map((label) => (
                        <span
                          key={label.id}
                          className="inline-flex h-2 w-2 rounded-full bg-slate-300"
                          title={label.name}
                        />
                      ))}
                    </div>
                  </div>
                ) : null}

                {editingTask.parentTaskId ? (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-semibold text-slate-500 uppercase">Task cha</p>
                    <p className="mt-1 text-sm font-medium text-slate-800">
                      {editingParentTask?.title ?? 'Task cha đã bị xoá hoặc không tồn tại'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-800">Subtasks</p>
                      <span className="text-xs text-slate-600">
                        {editingTask.subtaskProgress?.done ?? 0}/
                        {editingTask.subtaskProgress?.total ?? 0} hoàn thành (
                        {editingTask.subtaskProgress?.percent ?? 0}%)
                      </span>
                    </div>

                    {editingTaskSubtasks.length === 0 ? (
                      <p className="text-xs text-slate-500">Chưa có subtask</p>
                    ) : (
                      <div className="space-y-2">
                        {editingTaskSubtasks.map((subtask) => (
                          <div
                            key={subtask.id}
                            className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 py-2"
                          >
                            <input
                              type="checkbox"
                              checked={subtask.status === 'done'}
                              onChange={() => {
                                handleToggleSubtaskDone(subtask);
                              }}
                              disabled={subtaskPendingTaskId === subtask.id}
                              className="h-4 w-4 rounded border-slate-300 text-brand-600"
                            />
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(subtask)}
                              className={`flex-1 text-left text-sm ${subtask.status === 'done' ? 'text-slate-400 line-through' : 'text-slate-800 hover:text-brand-700'}`}
                            >
                              {subtask.title}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                handleDeleteSubtask(subtask.id);
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
                            handleCreateSubtask(e);
                          }
                        }}
                        placeholder="Thêm subtask mới..."
                        className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-brand-500"
                      />
                      <button
                        type="button"
                        onClick={handleCreateSubtask}
                        disabled={subtaskPendingTaskId === editingTask.id}
                        className="rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
                      >
                        {subtaskPendingTaskId === editingTask.id ? 'Đang thêm...' : 'Thêm'}
                      </button>
                    </div>

                    {subtaskError ? <p className="text-xs text-rose-600">{subtaskError}</p> : null}
                  </div>
                )}

                <label className="block text-sm font-medium text-slate-700">
                  Mô tả
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={5}
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-brand-500"
                    placeholder="Thêm mô tả chi tiết..."
                  />
                </label>

                <div className="text-[11px] text-slate-500">
                  <p>Tạo lúc: {formatDate(editingTask.createdAt)}</p>
                  <p>Cập nhật: {formatDate(editingTask.updatedAt)}</p>
                </div>
              </div>

              {taskUpdateError ? (
                <p role="alert" className="mt-4 text-sm text-rose-600">
                  {taskUpdateError}
                </p>
              ) : null}
            </div>

            <TaskCommentSection
              projectId={projectId}
              taskId={editingTask.id}
              currentUserId={currentUserId}
            />
          </form>

          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
            <button
              type="button"
              onClick={onDelete}
              disabled={isDeleting}
              className="rounded-lg border border-rose-200 bg-white px-4 py-2 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-50"
            >
              {isDeleting ? 'Đang xoá...' : 'Xoá task'}
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                Huỷ
              </button>
              <button
                type="submit"
                form="task-edit-form"
                disabled={isSaving}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
              >
                {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
