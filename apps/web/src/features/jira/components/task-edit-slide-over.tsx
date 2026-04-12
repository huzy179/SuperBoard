'use client';

import { FormEvent, type Dispatch, type SetStateAction } from 'react';
import type {
  ProjectTaskItemDTO,
  ProjectMemberDTO,
  TaskTypeDTO,
  WorkflowStatusTemplateDTO,
} from '@superboard/shared';
import { TaskTypeIcon } from '@/features/jira/components/task-badges';
import { TaskCommentSection } from '@/features/jira/components/task-comment-section';
import { formatDate } from '@/lib/format-date';
import { type TaskPriority } from '@/lib/constants/task';
import { TaskSubtaskManager } from '@/features/jira/components/task-subtask-manager';
import { TaskPropertiesForm } from '@/features/jira/components/task-properties-form';
import { TaskAttachmentManager } from '@/features/jira/components/task-attachment-manager';
import { useSummarizeTask } from '@/features/jira/hooks/use-task-mutations';
import { useState } from 'react';

interface TaskEditSlideOverProps {
  editingTask: ProjectTaskItemDTO;
  projectKey: string | null;
  projectId: string;
  currentUserId: string;
  members: ProjectMemberDTO[];
  workflow?: WorkflowStatusTemplateDTO | undefined;

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
  onRestore: () => void;
  isSaving: boolean;
  isDeleting: boolean;
  isRestoring: boolean;
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
  onRestore,
  isSaving,
  isDeleting,
  isRestoring,
  taskUpdateError,
  handleOpenEdit,
  dialogRef,
  handleDialogKeyDown,
  workflow,
}: TaskEditSlideOverProps) {
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const summarizeMutation = useSummarizeTask();

  const handleSummarize = async () => {
    try {
      const result = await summarizeMutation.mutateAsync(editingTask.id);
      setAiSummary(result.summary);
    } catch (err) {
      console.error('Failed to summarize task:', err);
    }
  };
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
                  workflow={workflow}
                  initialStatus={editingTask.status}
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

                <TaskAttachmentManager
                  projectId={projectId}
                  taskId={editingTask.id}
                  attachments={editingTask.attachments || []}
                />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-slate-700">Mô tả</label>
                    <button
                      type="button"
                      onClick={handleSummarize}
                      disabled={summarizeMutation.isPending}
                      className="flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 transition-all hover:bg-indigo-100 active:scale-95 disabled:opacity-50"
                    >
                      {summarizeMutation.isPending ? (
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-indigo-700 border-t-transparent" />
                      ) : (
                        <span>✨</span>
                      )}
                      AI SUMMARY
                    </button>
                  </div>

                  {aiSummary && (
                    <div className="relative overflow-hidden rounded-xl border border-indigo-100 bg-linear-to-br from-indigo-50/50 to-purple-50/50 p-4 shadow-xs animate-in fade-in zoom-in duration-300">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">
                          AI Generated Summary
                        </span>
                        <button
                          onClick={() => setAiSummary(null)}
                          className="text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                      <p className="text-xs leading-relaxed text-slate-700 italic">"{aiSummary}"</p>
                      <div className="absolute -right-4 -top-4 h-12 w-12 rounded-full bg-indigo-500/5 blur-xl" />
                    </div>
                  )}

                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={5}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-brand-500"
                    placeholder="Thêm mô tả chi tiết..."
                  />
                </div>

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
            {editingTask.deletedAt ? (
              <button
                type="button"
                onClick={onRestore}
                disabled={isRestoring}
                className="rounded-lg border border-brand-200 bg-white px-4 py-2 text-sm font-medium text-brand-600 transition-colors hover:bg-brand-50 disabled:opacity-50"
              >
                {isRestoring ? 'Đang khôi phục...' : 'Khôi phục task'}
              </button>
            ) : (
              <button
                type="button"
                onClick={onDelete}
                disabled={isDeleting}
                className="rounded-lg border border-rose-200 bg-white px-4 py-2 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-50"
              >
                {isDeleting ? 'Đang lưu trữ...' : 'Lưu trữ task'}
              </button>
            )}
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
