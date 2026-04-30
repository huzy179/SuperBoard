'use client';

import { FormEvent, type Dispatch, type SetStateAction, useState } from 'react';
import {
  Sparkles,
  Brain,
  X,
  Archive,
  History,
  ChevronDown,
  ListTree,
  Target,
  Terminal,
  Cpu,
  Zap,
  FileText,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import type {
  ProjectTaskItemDTO,
  ProjectMemberDTO,
  TaskTypeDTO,
  WorkflowStatusTemplateDTO,
} from '@superboard/shared';
import type { PredictiveHealthResponse } from '@/features/operations/project/hooks/use-predictive-health';
import { TaskTypeIcon } from './task-badges';
import { TaskCommentSection } from './task-comment-section';
import { formatDate } from '@/lib/format-date';
import { type TaskPriority } from '@/lib/constants/task';
import { TaskSubtaskManager } from './task-subtask-manager';
import { TaskPropertiesForm } from './task-properties-form';
import { TaskAttachmentManager } from './task-attachment-manager';
import {
  useSummarizeTask,
  useAiDecompose,
  useAiRefine,
  useTaskIntelligence,
} from '@/features/operations/task/hooks/use-task-mutations';
import { useRelatedDocs } from '@/features/system/search/hooks/use-related-docs';
import { toast } from 'sonner';
import Link from 'next/link';
import { FormField, FormTextArea } from '@/components/ui/form-controls';
import { AppButton } from '@/components/ui/app-button';

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
  predictiveHealth?: PredictiveHealthResponse | undefined;
  workspaceId: string;
  tasks?: ProjectTaskItemDTO[];
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
  predictiveHealth,
  workspaceId,
  tasks = [],
}: TaskEditSlideOverProps) {
  const [showAiMenu, setShowAiMenu] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

  const summarizeMutation = useSummarizeTask();
  const decomposeMutation = useAiDecompose();
  const refineMutation = useAiRefine();
  const { data: intelligence } = useTaskIntelligence(editingTask?.id);
  const { data: relatedDocs } = useRelatedDocs(
    editingTask?.number ?? undefined,
    editingTask?.title,
  );

  const taskPrediction = predictiveHealth?.predictions.find((p) => p.taskId === editingTask?.id);
  const isAtRisk = taskPrediction?.isAtRisk;

  const handleAiDecompose = async () => {
    try {
      setShowAiMenu(false);
      const result = await decomposeMutation.mutateAsync(editingTask.id);
      toast.info(`Đã phân tách: ${result.subtasks.length} công việc con được gợi ý.`);
      if (result.subtasks.length > 0 && result.subtasks[0]) setSubtaskTitle(result.subtasks[0]);
    } catch {
      toast.error('Phân tách thất bại.');
    }
  };

  const handleAiRefine = async () => {
    try {
      setShowAiMenu(false);
      const result = await refineMutation.mutateAsync(editingTask.id);
      setEditDescription(result.description);
      if (result.storyPoints) setEditStoryPoints(result.storyPoints.toString());
      toast.success('Đã tối ưu nội dung.');
    } catch {
      toast.error('Tối ưu thất bại.');
    }
  };

  const isAiThinking =
    summarizeMutation.isPending || decomposeMutation.isPending || refineMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/20 backdrop-blur-sm">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-detail-title"
        tabIndex={-1}
        onKeyDown={handleDialogKeyDown}
        className="h-full w-full max-w-3xl border-l border-surface-border bg-surface-card shadow-glass outline-none overflow-hidden flex flex-col font-sans relative"
      >
        <div className="relative z-10 flex h-full flex-col">
          {/* Elite Specification Header */}
          <header className="flex items-center justify-between border-b border-surface-border px-[var(--space-8)] py-[var(--space-6)] bg-surface-card">
            <div className="flex items-center gap-[var(--space-6)]">
              <div className="w-12 h-12 bg-black/[0.02] rounded-lg border border-surface-border shadow-luxe flex items-center justify-center">
                <div className="scale-110 text-brand-500">
                  <TaskTypeIcon type={editingTask.type ?? 'task'} />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  {projectKey && editingTask.number && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-[color:var(--color-muted)]">
                        {projectKey}-{editingTask.number}
                      </span>
                      <div className="h-1 w-1 rounded-full bg-black/10" />
                    </div>
                  )}
                  <span className="text-xs font-medium text-brand-500">Task</span>
                </div>
                <h2
                  id="task-detail-title"
                  className="text-xl font-semibold text-[color:var(--color-ink)] tracking-tight leading-tight"
                >
                  Task details
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowAiMenu(!showAiMenu)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-button text-sm font-medium transition-colors border ${
                    isAiThinking
                      ? 'bg-brand-500 text-white border-brand-500'
                      : 'bg-black/[0.04] text-[color:var(--color-ink)] border-surface-border hover:bg-black/[0.06]'
                  }`}
                >
                  <Sparkles size={14} className={isAiThinking ? '' : 'text-brand-500'} />
                  <span>AI tools</span>
                  <ChevronDown
                    size={12}
                    className={`transition-transform duration-500 ${showAiMenu ? 'rotate-180' : ''}`}
                  />
                </button>

                {showAiMenu && (
                  <div className="absolute right-0 mt-3 w-80 bg-surface-card border border-surface-border rounded-xl shadow-glass overflow-hidden p-2 z-50">
                    <div className="px-[var(--space-4)] py-[var(--space-3)] border-b border-surface-border mb-2">
                      <span className="text-xs font-semibold text-[color:var(--color-muted)]">
                        Chọn chức năng
                      </span>
                    </div>
                    <div className="space-y-1">
                      <button
                        onClick={handleAiDecompose}
                        className="w-full px-[var(--space-4)] py-[var(--space-3)] flex items-center gap-4 text-[color:var(--color-ink)] hover:bg-black/[0.03] rounded-lg transition-colors text-left"
                      >
                        <div className="p-2.5 bg-brand-50 rounded-lg text-brand-500 border border-brand-500/15">
                          <ListTree size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium block">Phân tách thông minh</span>
                          <span className="text-xs text-[color:var(--color-muted)] truncate mt-0.5 block">
                            AI tự động chia nhỏ công việc
                          </span>
                        </div>
                      </button>
                      <button
                        onClick={handleAiRefine}
                        className="w-full px-[var(--space-4)] py-[var(--space-3)] flex items-center gap-4 text-[color:var(--color-ink)] hover:bg-black/[0.03] rounded-lg transition-colors text-left"
                      >
                        <div className="p-2.5 bg-indigo-500/10 rounded-lg text-indigo-700 border border-indigo-500/15">
                          <Brain size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium block">Tối ưu nội dung</span>
                          <span className="text-xs text-[color:var(--color-muted)] truncate mt-0.5 block">
                            AI cải thiện mô tả & story points
                          </span>
                        </div>
                      </button>
                      <button
                        onClick={async () => {
                          setShowAiMenu(false);
                          const res = await summarizeMutation.mutateAsync(editingTask.id);
                          setAiAnalysis(res.summary);
                        }}
                        className="w-full px-[var(--space-4)] py-[var(--space-3)] flex items-center gap-4 text-[color:var(--color-ink)] hover:bg-black/[0.03] rounded-lg transition-colors text-left"
                      >
                        <div className="p-2.5 bg-purple-500/10 rounded-lg text-purple-700 border border-purple-500/15">
                          <Terminal size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium block">Tóm tắt</span>
                          <span className="text-xs text-[color:var(--color-muted)] truncate mt-0.5 block">
                            AI phân tích & tóm tắt công việc
                          </span>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-12 h-12 flex items-center justify-center text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)] hover:bg-black/[0.04] rounded-lg transition-colors border border-transparent"
              >
                <X size={24} />
              </button>
            </div>
          </header>

          <form
            id="task-edit-form"
            onSubmit={onSave}
            className="flex-1 overflow-y-auto elite-scrollbar custom-scrollbar bg-[color:var(--color-surface-alt)]/35"
          >
            <div className="px-10 py-16 space-y-20">
              {/* Dự đoán tiến độ */}
              {taskPrediction && (
                <div
                  className={`relative overflow-hidden rounded-xl border p-[var(--space-6)] shadow-luxe ${
                    isAtRisk
                      ? 'border-amber-500/20 bg-amber-50'
                      : 'border-emerald-500/20 bg-emerald-50'
                  }`}
                >
                  <div className="flex items-start gap-[var(--space-6)]">
                    <div
                      className={`p-[var(--space-3)] rounded-lg border shadow-inner ${
                        isAtRisk
                          ? 'bg-amber-100 text-amber-700 border-amber-200'
                          : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      <Target size={24} />
                    </div>
                    <div className="space-y-4 flex-1 pt-0.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <h4
                            className={`text-sm font-semibold ${isAtRisk ? 'text-amber-800' : 'text-emerald-800'}`}
                          >
                            Dự báo tiến độ
                          </h4>
                          <div
                            className={`h-1.5 w-1.5 rounded-full ${isAtRisk ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          />
                        </div>
                        <span className="text-xs font-medium text-[color:var(--color-muted)]">
                          Confidence: {Math.round(taskPrediction.confidence * 100)}%
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--space-6)]">
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-[color:var(--color-muted)]">
                            Estimated Completion
                          </p>
                          <p className="text-lg font-semibold text-[color:var(--color-ink)] tracking-tight">
                            {formatDate(taskPrediction.estimatedCompletionDate)}
                          </p>
                          {isAtRisk && (
                            <p className="text-xs font-medium text-amber-700 flex items-center gap-1.5 mt-1.5">
                              <Zap size={10} /> Mission Delay Risk
                            </p>
                          )}
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-[color:var(--color-muted)]">
                            Risk Status
                          </p>
                          <div className="flex items-center gap-3">
                            <span
                              className={`text-lg font-semibold tracking-tight ${isAtRisk ? 'text-amber-800' : 'text-emerald-800'}`}
                            >
                              {isAtRisk ? 'High Risk' : 'Normal'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {isAtRisk && (
                        <div className="mt-6 pt-6 border-t border-surface-border space-y-4 bg-white/70 -mx-[var(--space-6)] px-[var(--space-6)] rounded-b-xl">
                          <p className="text-xs font-semibold text-[color:var(--color-muted)]">
                            Recommended Redirection
                          </p>
                          <div className="flex items-center gap-4">
                            <span className="text-xs font-medium text-[color:var(--color-muted)]">
                              Reassign to:
                            </span>
                            <div className="flex gap-2">
                              {members.slice(0, 2).map((m) => (
                                <button
                                  key={m.id}
                                  type="button"
                                  onClick={() => setEditAssigneeId(m.id)}
                                  className="px-3 py-1.5 rounded-full bg-black/[0.03] border border-surface-border text-xs font-medium text-[color:var(--color-ink)] hover:bg-black/[0.05] transition-colors"
                                >
                                  {m.fullName.split(' ')[0]}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Proactive Intelligence Alerts */}
              {intelligence === undefined ? (
                <div className="rounded-xl bg-black/[0.02] border border-surface-border p-[var(--space-6)] h-32" />
              ) : intelligence.duplicates && intelligence.duplicates.length > 0 ? (
                <div className="relative overflow-hidden rounded-xl border border-amber-500/20 bg-amber-50 p-[var(--space-6)] shadow-luxe">
                  <div className="flex items-start gap-[var(--space-6)]">
                    <div className="p-[var(--space-3)] bg-amber-100 rounded-lg text-amber-700 border border-amber-200 shadow-inner">
                      <Zap size={24} />
                    </div>
                    <div className="space-y-3 flex-1 pt-0.5">
                      <h4 className="text-sm font-semibold text-amber-800">Possible duplicates</h4>
                      <p className="text-sm text-[color:var(--color-muted)] leading-relaxed">
                        Found {intelligence.duplicates.length} potential duplicate tasks in
                        workspace.
                      </p>
                      <div className="flex flex-col gap-2 mt-4">
                        {intelligence.duplicates.map((dup) => (
                          <button
                            key={dup.id}
                            type="button"
                            onClick={() => {
                              const task = tasks.find((t) => t.id === dup.id);
                              if (task) handleOpenEdit(task);
                            }}
                            className="flex items-center justify-between px-[var(--space-4)] py-[var(--space-3)] rounded-lg bg-white border border-amber-200 hover:bg-amber-100/40 transition-colors"
                          >
                            <span className="text-sm font-medium text-[color:var(--color-ink)] truncate">
                              {dup.title}
                            </span>
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-medium text-amber-800">
                                {Math.round(dup.score * 100)}%
                              </span>
                              <ChevronDown size={12} className="-rotate-90 text-amber-700/60" />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Neural Prediction Insights */}
              {intelligence === undefined ? (
                <div className="rounded-xl bg-black/[0.02] border border-surface-border p-[var(--space-6)] h-32" />
              ) : intelligence.suggestions ? (
                <div className="relative overflow-hidden rounded-xl border border-surface-border bg-surface-card p-[var(--space-6)] shadow-luxe">
                  <div className="flex items-start gap-[var(--space-6)]">
                    <div className="p-[var(--space-3)] bg-sky-50 rounded-lg text-sky-700 border border-sky-200 shadow-inner">
                      <Brain size={24} />
                    </div>
                    <div className="space-y-4 flex-1 pt-0.5">
                      <div className="flex items-center gap-4">
                        <h4 className="text-sm font-semibold text-[color:var(--color-ink)]">
                          Neural Suggestions
                        </h4>
                        <div className="h-px flex-1 bg-surface-border" />
                      </div>

                      <div className="flex flex-wrap gap-3">
                        {intelligence.suggestions.priority &&
                          intelligence.suggestions.priority !== editPriority && (
                            <button
                              type="button"
                              onClick={() =>
                                setEditPriority(intelligence.suggestions.priority as TaskPriority)
                              }
                              className="px-[var(--space-4)] py-[var(--space-2)] rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-xs font-medium hover:bg-sky-100 transition-colors"
                            >
                              Set priority: {intelligence.suggestions.priority}
                            </button>
                          )}

                        {intelligence.suggestions.labels.map((label) => (
                          <button
                            key={label}
                            type="button"
                            onClick={() => {
                              toast.info(`Applying classification: ${label}`);
                            }}
                            className="px-[var(--space-4)] py-[var(--space-2)] rounded-full bg-black/[0.03] border border-surface-border text-[color:var(--color-muted)] text-xs font-medium hover:bg-black/[0.05] hover:text-[color:var(--color-ink)] transition-colors"
                          >
                            + {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Intelligent Analytical Briefing */}
              {aiAnalysis ? (
                <div className="relative overflow-hidden rounded-xl border border-brand-500/15 bg-brand-50 p-[var(--space-6)] shadow-luxe">
                  <div className="absolute top-6 right-6">
                    <button
                      onClick={() => setAiAnalysis(null)}
                      className="w-8 h-8 flex items-center justify-center bg-white rounded-lg text-[color:var(--color-muted)] hover:text-rose-700 transition-colors border border-surface-border"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className="flex items-start gap-[var(--space-6)]">
                    <div className="p-[var(--space-3)] bg-white rounded-lg text-brand-500 border border-brand-500/15 shadow-inner">
                      <Cpu size={24} />
                    </div>
                    <div className="space-y-3 flex-1 pt-0.5">
                      <div className="flex items-center gap-4">
                        <h4 className="text-xs font-semibold tracking-tight text-brand-700">
                          Phân tích AI
                        </h4>
                        <div className="h-px flex-1 bg-brand-500/15" />
                      </div>
                      <p className="text-sm text-[color:var(--color-ink)] leading-relaxed">
                        {aiAnalysis}
                      </p>
                    </div>
                  </div>
                </div>
              ) : summarizeMutation.isPending ? (
                <div className="rounded-xl bg-black/[0.02] border border-surface-border p-[var(--space-6)] h-24" />
              ) : null}

              <section className="space-y-24">
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
                  taskId={editingTask.id}
                  workspaceId={workspaceId}
                  labels={editingTask.labels}
                  workflow={workflow}
                  initialStatus={editingTask.status}
                />

                <div className="space-y-10">
                  <FormField label="Mô tả chi tiết">
                    <div className="relative group">
                      <FormTextArea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        rows={12}
                        className="py-6 h-auto min-h-[15rem]"
                        placeholder="Mô tả chi tiết về công việc này..."
                      />
                      <div className="absolute bottom-6 right-6 flex items-center gap-2 text-[color:var(--color-faint)]">
                        <ShieldCheck size={12} className="text-brand-500" />
                      </div>
                    </div>
                  </FormField>
                </div>

                <div className="grid grid-cols-1 gap-12 xl:grid-cols-2">
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
                </div>

                {/* Related Documentation Section */}
                {relatedDocs && relatedDocs.length > 0 && (
                  <div className="space-y-10 group/know">
                    <div className="flex items-center gap-6 px-4">
                      <div className="h-px w-12 bg-emerald-500/20" />
                      <label className="text-sm font-semibold text-[color:var(--color-ink)]">
                        Tài liệu liên quan
                      </label>
                      <div className="h-px flex-1 bg-surface-border" />
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {relatedDocs.map((doc) => (
                        <Link
                          key={doc.id}
                          href={`/docs/${doc.id}`}
                          className="flex items-center justify-between p-6 bg-surface-card border border-surface-border rounded-xl hover:bg-black/[0.02] transition-colors group/doc"
                        >
                          <div className="flex items-center gap-5">
                            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-700 border border-emerald-500/15">
                              <FileText size={20} />
                            </div>
                            <div>
                              <h5 className="text-sm font-semibold text-[color:var(--color-ink)]">
                                {doc.title}
                              </h5>
                              <p className="text-xs text-[color:var(--color-muted)] mt-1">
                                Cập nhật {formatDate(doc.updatedAt)}
                              </p>
                            </div>
                          </div>
                          <ExternalLink
                            size={16}
                            className="text-[color:var(--color-faint)] group-hover/doc:text-emerald-700 transition-colors"
                          />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              <div className="border-t border-surface-border pt-12 bg-[color:var(--color-surface-alt)]/35 -mx-[var(--space-8)] px-[var(--space-8)] rounded-t-lg">
                <div className="flex items-center gap-6 px-4 mb-10">
                  <label className="text-sm font-semibold text-[color:var(--color-ink)]">
                    Bình luận
                  </label>
                  <div className="h-px flex-1 bg-surface-border" />
                </div>
                <TaskCommentSection
                  projectId={projectId}
                  taskId={editingTask.id}
                  currentUserId={currentUserId}
                />
              </div>

              {/* History Timeline Integration Proxy */}
              <div className="flex flex-wrap items-center gap-[var(--space-8)] py-[var(--space-4)] px-[var(--space-6)] border border-surface-border rounded-xl bg-surface-card shadow-inner">
                <div className="flex items-center gap-3 group/hist">
                  <History size={14} className="text-brand-500/70" />
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-[color:var(--color-muted)]">
                      Created
                    </span>
                    <span className="text-xs text-[color:var(--color-faint)] mt-0.5">
                      {formatDate(editingTask.createdAt)}
                    </span>
                  </div>
                </div>
                <div className="h-6 w-px bg-surface-border" />
                <div className="flex items-center gap-3 group/hist">
                  <Zap size={14} className="text-sky-600" />
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-[color:var(--color-muted)]">
                      Last update
                    </span>
                    <span className="text-xs text-[color:var(--color-faint)] mt-0.5">
                      {formatDate(editingTask.updatedAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {taskUpdateError && (
              <div className="px-10 pb-16">
                <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm font-medium flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center shrink-0 border border-rose-200">
                    <Terminal size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">Lỗi khi lưu thay đổi</p>
                    <p className="mt-1 text-sm">{taskUpdateError}</p>
                  </div>
                </div>
              </div>
            )}
          </form>

          {/* Secure Commitment Footer */}
          <footer className="flex items-center justify-between border-t border-surface-border bg-surface-card px-[var(--space-8)] py-[var(--space-6)]">
            {editingTask.deletedAt ? (
              <AppButton
                type="button"
                onClick={onRestore}
                disabled={isRestoring}
                isLoading={isRestoring}
                variant="primary"
                leftIcon={<Archive size={14} />}
              >
                Khôi phục
              </AppButton>
            ) : (
              <AppButton
                type="button"
                onClick={onDelete}
                disabled={isDeleting}
                isLoading={isDeleting}
                variant="danger"
                leftIcon={<Archive size={14} />}
              >
                Xóa
              </AppButton>
            )}

            <div className="flex gap-[var(--space-4)]">
              <AppButton type="button" onClick={onClose} variant="ghost">
                Hủy bỏ
              </AppButton>
              <AppButton
                type="submit"
                form="task-edit-form"
                disabled={isSaving}
                isLoading={isSaving}
                variant="primary"
                leftIcon={<ShieldCheck size={14} />}
              >
                Lưu
              </AppButton>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
