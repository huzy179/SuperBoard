'use client';

import { FormEvent, type Dispatch, type SetStateAction } from 'react';
import type { ProjectTaskItemDTO, ProjectMemberDTO, TaskTypeDTO } from '@superboard/shared';
import { TaskTypeIcon } from '@/components/jira/task-badges';
import { TaskCommentSection } from '@/components/jira/task-comment-section';
import { formatDate } from '@/lib/format-date';
import { type TaskPriority } from '@/lib/constants/task';
import { TaskSubtaskManager } from '@/components/jira/task-subtask-manager';
import { TaskPropertiesForm } from '@/components/jira/task-properties-form';

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
              <div className="space-y-6">
                <TaskPropertiesForm
                  editTitle={editTitle}
                  setEditTitle={setEditTitle}
                  editType={editType}
                  setEditType={setEditType}
                  editStatus={editStatus}
                  setEditStatus={setEditStatus}
                  editPriority={editPriority}
                  setEditPriority={setEditPriority}
                  editStoryPoints={editStoryPoints}
                  setEditStoryPoints={setEditStoryPoints}
                  editDueDate={editDueDate}
                  setEditDueDate={setEditDueDate}
                  editAssigneeId={editAssigneeId}
                  setEditAssigneeId={setEditAssigneeId}
                  members={members}
                  labels={editingTask.labels}
                />

                <TaskSubtaskManager
                  editingTask={editingTask}
                  subtasks={editingTaskSubtasks}
                  subtaskTitle={subtaskTitle}
                  setSubtaskTitle={setSubtaskTitle}
                  subtaskError={subtaskError}
                  subtaskPendingTaskId={subtaskPendingTaskId}
                  onCreateSubtask={handleCreateSubtask as () => void}
                  onToggleSubtaskDone={handleToggleSubtaskDone}
                  onDeleteSubtask={handleDeleteSubtask}
                  onOpenEdit={handleOpenEdit}
                  parentTask={editingParentTask}
                />

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
