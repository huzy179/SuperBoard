'use client';

import { FormEvent, type Dispatch, type SetStateAction, useState } from 'react';
import {
  Sparkles,
  Brain,
  Wand2,
  X,
  Archive,
  History,
  CheckCircle2,
  ChevronDown,
  ListTree,
} from 'lucide-react';
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
import {
  useSummarizeTask,
  useAiDecompose,
  useAiRefine,
} from '@/features/jira/hooks/use-task-mutations';
import { toast } from 'sonner';

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
  const [showAiMenu, setShowAiMenu] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

  const summarizeMutation = useSummarizeTask();
  const decomposeMutation = useAiDecompose();
  const refineMutation = useAiRefine();

  const handleAiDecompose = async () => {
    try {
      setShowAiMenu(false);
      const result = await decomposeMutation.mutateAsync(editingTask.id);
      // For now, we show a success toast and the user can see suggested subtasks
      // In a real elite app, we would show a "Neural Spread" of suggested cards
      toast.info(`AI suggests ${result.subtasks.length} subtasks. Please add them as needed.`);
      // We could also populate the subtask input with the first one
      if (result.subtasks.length > 0) setSubtaskTitle(result.subtasks[0]);
    } catch {
      toast.error('AI Decomposition failed.');
    }
  };

  const handleAiRefine = async () => {
    try {
      setShowAiMenu(false);
      const result = await refineMutation.mutateAsync(editingTask.id);
      setEditDescription(result.description);
      if (result.storyPoints) setEditStoryPoints(result.storyPoints.toString());
      toast.success('Description & Story Points refined by AI.');
    } catch {
      toast.error('AI Refinement failed.');
    }
  };

  const isAiThinking =
    summarizeMutation.isPending || decomposeMutation.isPending || refineMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-md">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-detail-title"
        tabIndex={-1}
        onKeyDown={handleDialogKeyDown}
        className="h-full w-full max-w-2xl animate-in slide-in-from-right duration-500 border-l border-white/10 bg-slate-950/90 shadow-glass backdrop-blur-3xl outline-none overflow-hidden flex flex-col font-sans"
      >
        {/* Rim Lighting Effect */}
        <div className="absolute inset-y-0 left-0 w-px bg-linear-to-b from-transparent via-brand-500/50 to-transparent" />

        {/* Background Aura */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-brand-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex h-full flex-col">
          {/* Header */}
          <header className="flex items-center justify-between border-b border-white/5 px-8 py-6 bg-white/5">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-slate-900 rounded-2xl border border-white/5 shadow-luxe">
                <TaskTypeIcon type={editingTask.type ?? 'task'} />
              </div>
              <div>
                {projectKey && editingTask.number && (
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
                    {projectKey}-{editingTask.number}
                  </span>
                )}
                <h2
                  id="task-detail-title"
                  className="text-xl font-black text-white tracking-tight uppercase leading-none mt-1"
                >
                  Task Protocol
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowAiMenu(!showAiMenu)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    isAiThinking
                      ? 'bg-brand-500 text-white animate-pulse'
                      : 'bg-white/5 text-brand-400 border border-brand-500/30 hover:bg-brand-500/10'
                  }`}
                >
                  <Sparkles size={14} className={isAiThinking ? 'animate-spin' : ''} />
                  <span>Intelligence Hub</span>
                  <ChevronDown
                    size={12}
                    className={`transition-transform ${showAiMenu ? 'rotate-180' : ''}`}
                  />
                </button>

                {showAiMenu && (
                  <div className="absolute right-0 mt-3 w-64 bg-slate-900/95 border border-white/10 rounded-2xl shadow-glass backdrop-blur-3xl overflow-hidden py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                    <button
                      onClick={handleAiDecompose}
                      className="w-full px-5 py-3 flex items-center gap-3 text-white/70 hover:text-white hover:bg-white/5 transition-colors text-left group"
                    >
                      <ListTree
                        size={16}
                        className="text-brand-400 group-hover:scale-110 transition-transform"
                      />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold">Decompose Subtasks</span>
                        <span className="text-[9px] text-white/30 font-medium">
                          AI generated project breakdown
                        </span>
                      </div>
                    </button>
                    <button
                      onClick={handleAiRefine}
                      className="w-full px-5 py-3 flex items-center gap-3 text-white/70 hover:text-white hover:bg-white/5 transition-colors text-left group"
                    >
                      <Brain
                        size={16}
                        className="text-indigo-400 group-hover:scale-110 transition-transform"
                      />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold">Refine Intelligence</span>
                        <span className="text-[9px] text-white/30 font-medium">
                          Improve clarity & predict points
                        </span>
                      </div>
                    </button>
                    <div className="border-t border-white/5 my-1" />
                    <button
                      onClick={async () => {
                        setShowAiMenu(false);
                        const res = await summarizeMutation.mutateAsync(editingTask.id);
                        setAiAnalysis(res.summary);
                      }}
                      className="w-full px-5 py-3 flex items-center gap-3 text-white/70 hover:text-white hover:bg-white/5 transition-colors text-left group"
                    >
                      <Wand2
                        size={16}
                        className="text-purple-400 group-hover:scale-110 transition-transform"
                      />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold">Analytical Summary</span>
                        <span className="text-[9px] text-white/30 font-medium">
                          Get a high-level executive briefing
                        </span>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-2.5 text-white/40 hover:text-white hover:bg-white/5 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>
          </header>

          <form
            id="task-edit-form"
            onSubmit={onSave}
            className="flex-1 overflow-y-auto elite-scrollbar custom-scrollbar"
          >
            <div className="p-8 space-y-10">
              {/* Intelligence Display */}
              {aiAnalysis && (
                <div className="relative group overflow-hidden rounded-3xl border border-brand-500/20 bg-brand-500/5 p-6 animate-in slide-in-from-top-4 duration-500">
                  <div className="absolute top-0 right-0 p-4">
                    <button
                      onClick={() => setAiAnalysis(null)}
                      className="text-white/20 hover:text-white transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-brand-500/10 rounded-2xl text-brand-400">
                      <Sparkles size={20} className="animate-pulse" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-400">
                        Executive Briefing
                      </h4>
                      <p className="text-sm text-white/80 leading-relaxed font-medium italic">
                        "{aiAnalysis}"
                      </p>
                    </div>
                  </div>
                  {/* Progress Visual */}
                  <div className="absolute bottom-0 left-0 h-1 bg-brand-500/20 w-full" />
                </div>
              )}

              <section className="space-y-12">
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

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="h-1 w-4 bg-brand-500 rounded-full" />
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">
                      Operational Description
                    </label>
                  </div>
                  <div className="relative group">
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={6}
                      className="w-full rounded-[2rem] border border-white/5 bg-white/5 px-6 py-5 text-sm text-white focus:border-brand-500/50 focus:ring-4 focus:ring-brand-500/10 transition-all placeholder:text-white/20 elite-scrollbar"
                      placeholder="Input core mission objectives..."
                    />
                    <div className="absolute bottom-4 right-4 text-[10px] font-bold text-white/10 uppercase tracking-widest group-hover:text-white/30 transition-colors">
                      Encrypted Workspace
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
              </section>

              <div className="border-t border-white/5 pt-8">
                <TaskCommentSection
                  projectId={projectId}
                  taskId={editingTask.id}
                  currentUserId={currentUserId}
                />
              </div>

              <div className="flex flex-wrap items-center gap-6 text-[10px] font-black uppercase tracking-widest text-white/20">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full">
                  <History size={12} />
                  <span>Created {formatDate(editingTask.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full">
                  <CheckCircle2 size={12} />
                  <span>Modified {formatDate(editingTask.updatedAt)}</span>
                </div>
              </div>
            </div>

            {taskUpdateError && (
              <div className="px-8 pb-8">
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-500 text-xs font-bold animate-pulse">
                  {taskUpdateError}
                </div>
              </div>
            )}
          </form>

          {/* Footer Actions */}
          <footer className="flex items-center justify-between border-t border-white/5 bg-white/5 px-8 py-6 backdrop-blur-xl">
            {editingTask.deletedAt ? (
              <button
                type="button"
                onClick={onRestore}
                disabled={isRestoring}
                className="group relative px-6 py-3 bg-emerald-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-50 overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform" />
                <span className="relative z-10 flex items-center gap-2">
                  <Archive size={14} /> Restore Manifest
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onDelete}
                disabled={isDeleting}
                className="group px-6 py-3 bg-slate-900 border border-rose-500/30 text-rose-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all disabled:opacity-50 flex items-center gap-2"
              >
                <Archive size={14} />
                <span>Archive Protocol</span>
              </button>
            )}

            <div className="flex gap-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border border-white/10 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-white/5 transition-all"
              >
                Abort
              </button>
              <button
                type="submit"
                form="task-edit-form"
                disabled={isSaving}
                className="group relative px-8 py-3 bg-white text-slate-950 rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-50 overflow-hidden shadow-luxe"
              >
                <div className="absolute inset-0 bg-brand-500 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <span className="relative z-10 group-hover:text-white transition-colors">
                  {isSaving ? 'Synchronizing...' : 'Save Manifest'}
                </span>
              </button>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
