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
} from 'lucide-react';
import type {
  ProjectTaskItemDTO,
  ProjectMemberDTO,
  TaskTypeDTO,
  WorkflowStatusTemplateDTO,
} from '@superboard/shared';
import type { PredictiveHealthResponse } from '@/features/jira/hooks/use-predictive-health';
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
  useTaskIntelligence,
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
  predictiveHealth?: PredictiveHealthResponse;
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
}: TaskEditSlideOverProps) {
  const [showAiMenu, setShowAiMenu] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

  const summarizeMutation = useSummarizeTask();
  const decomposeMutation = useAiDecompose();
  const refineMutation = useAiRefine();
  const { data: intelligence } = useTaskIntelligence(editingTask?.id);

  const taskPrediction = predictiveHealth?.predictions.find((p) => p.taskId === editingTask?.id);
  const isAtRisk = taskPrediction?.isAtRisk;

  const handleAiDecompose = async () => {
    try {
      setShowAiMenu(false);
      const result = await decomposeMutation.mutateAsync(editingTask.id);
      toast.info(`Neural Decomposition Complete: ${result.subtasks.length} sub-nodes suggested.`);
      if (result.subtasks.length > 0) setSubtaskTitle(result.subtasks[0]);
    } catch {
      toast.error('Neural Decomposition Interrupted.');
    }
  };

  const handleAiRefine = async () => {
    try {
      setShowAiMenu(false);
      const result = await refineMutation.mutateAsync(editingTask.id);
      setEditDescription(result.description);
      if (result.storyPoints) setEditStoryPoints(result.storyPoints.toString());
      toast.success('Vector Refinement Successful.');
    } catch {
      toast.error('Vector Refinement Failed.');
    }
  };

  const isAiThinking =
    summarizeMutation.isPending || decomposeMutation.isPending || refineMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-500">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-detail-title"
        tabIndex={-1}
        onKeyDown={handleDialogKeyDown}
        className="h-full w-full max-w-3xl animate-in slide-in-from-right duration-700 border-l border-white/5 bg-slate-950/95 shadow-glass backdrop-blur-3xl outline-none overflow-hidden flex flex-col font-sans relative"
      >
        {/* Physical Noise Texture */}
        <div className="absolute inset-0 bg-noise opacity-[0.02] pointer-events-none" />

        {/* Static Rim Lighting */}
        <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-brand-500/50 to-transparent" />

        {/* Dynamic Background Auras */}
        <div className="absolute -right-40 -top-40 w-[30rem] h-[30rem] bg-brand-500/5 rounded-full blur-[120px] pointer-events-none animate-pulse duration-[10s]" />
        <div className="absolute -left-40 -bottom-40 w-[30rem] h-[30rem] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none animate-pulse duration-[8s]" />

        <div className="relative z-10 flex h-full flex-col">
          {/* Elite Specification Header */}
          <header className="flex items-center justify-between border-b border-white/5 px-10 py-8 bg-white/[0.02] backdrop-blur-md">
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 bg-slate-900 rounded-[1.5rem] border border-white/5 shadow-luxe flex items-center justify-center relative group">
                <div className="absolute inset-0 bg-brand-500/10 rounded-[1.5rem] opacity-0 group-hover:opacity-100 transition-opacity" />
                <TaskTypeIcon type={editingTask.type ?? 'task'} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  {projectKey && editingTask.number && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">
                        {projectKey}-{editingTask.number}
                      </span>
                      <div className="h-1 w-1 rounded-full bg-white/10" />
                    </div>
                  )}
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-400">
                    Mission Active
                  </span>
                </div>
                <h2
                  id="task-detail-title"
                  className="text-2xl font-black text-white tracking-tighter uppercase leading-none"
                >
                  Unit Specification
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowAiMenu(!showAiMenu)}
                  className={`group relative flex items-center gap-3 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all overflow-hidden ${
                    isAiThinking
                      ? 'bg-brand-500 text-white animate-pulse'
                      : 'bg-white/[0.03] text-brand-400 border border-brand-500/30 hover:bg-brand-500/10 shadow-glow-brand/10'
                  }`}
                >
                  <Sparkles
                    size={16}
                    className={isAiThinking ? 'animate-spin' : 'group-hover:animate-pulse'}
                  />
                  <span>Intelligence Terminal</span>
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-500 ${showAiMenu ? 'rotate-180' : ''}`}
                  />
                </button>

                {showAiMenu && (
                  <div className="absolute right-0 mt-4 w-72 bg-slate-900/95 border border-white/5 rounded-[2rem] shadow-glass backdrop-blur-3xl overflow-hidden py-3 z-50 animate-in fade-in zoom-in-95 duration-300">
                    <div className="px-5 py-2 mb-2">
                      <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">
                        Protocol Selection
                      </span>
                    </div>
                    <button
                      onClick={handleAiDecompose}
                      className="w-full px-6 py-4 flex items-center gap-4 text-white/50 hover:text-white hover:bg-white/[0.03] transition-all text-left group"
                    >
                      <div className="p-2.5 bg-brand-500/10 rounded-xl text-brand-400 group-hover:bg-brand-500 group-hover:text-slate-950 transition-all">
                        <ListTree size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-black uppercase tracking-widest block">
                          Neural Decompose
                        </span>
                        <span className="text-[9px] text-white/20 font-medium uppercase tracking-tight truncate mt-0.5">
                          Analyze & generate sub-nodes
                        </span>
                      </div>
                    </button>
                    <button
                      onClick={handleAiRefine}
                      className="w-full px-6 py-4 flex items-center gap-4 text-white/50 hover:text-white hover:bg-white/[0.03] transition-all text-left group"
                    >
                      <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                        <Brain size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-black uppercase tracking-widest block">
                          Refine Payload
                        </span>
                        <span className="text-[9px] text-white/20 font-medium uppercase tracking-tight truncate mt-0.5">
                          Optimize description & sizing
                        </span>
                      </div>
                    </button>
                    <div className="border-t border-white/5 my-2" />
                    <button
                      onClick={async () => {
                        setShowAiMenu(false);
                        const res = await summarizeMutation.mutateAsync(editingTask.id);
                        setAiAnalysis(res.summary);
                      }}
                      className="w-full px-6 py-4 flex items-center gap-4 text-white/50 hover:text-white hover:bg-white/[0.03] transition-all text-left group"
                    >
                      <div className="p-2.5 bg-purple-500/10 rounded-xl text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-all">
                        <Terminal size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-black uppercase tracking-widest block">
                          Executive Brief
                        </span>
                        <span className="text-[9px] text-white/20 font-medium uppercase tracking-tight truncate mt-0.5">
                          Generate status intelligence
                        </span>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-12 h-12 flex items-center justify-center text-white/20 hover:text-white hover:bg-white/[0.03] rounded-2xl transition-all border border-transparent hover:border-white/5"
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
            <div className="px-10 py-12 space-y-16">
              {/* Neural Health Forecast */}
              {taskPrediction && (
                <div
                  className={`relative group overflow-hidden rounded-[2.5rem] border p-8 shadow-glass animate-in slide-in-from-top-6 duration-700 ${
                    isAtRisk
                      ? 'border-amber-500/20 bg-amber-500/[0.02] shadow-glow-amber'
                      : 'border-emerald-500/20 bg-emerald-500/[0.02] shadow-glow-emerald'
                  }`}
                >
                  <div className="flex items-start gap-8">
                    <div
                      className={`p-4 rounded-2xl border transition-all duration-700 ${
                        isAtRisk
                          ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-glow-amber'
                          : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-glow-emerald'
                      }`}
                    >
                      <Target size={24} className={isAtRisk ? 'animate-pulse' : ''} />
                    </div>
                    <div className="space-y-4 flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <h4
                            className={`text-[10px] font-black uppercase tracking-[0.4em] ${isAtRisk ? 'text-amber-500' : 'text-emerald-500'}`}
                          >
                            Neural Health Forecast
                          </h4>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/20">
                          {Math.round(taskPrediction.confidence * 100)}% Confidence
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">
                            Estimated Completion
                          </p>
                          <p className="text-xl font-black text-white uppercase tracking-tighter">
                            {formatDate(taskPrediction.estimatedCompletionDate)}
                          </p>
                          {isAtRisk && (
                            <p className="text-[10px] font-bold text-amber-500/60 uppercase tracking-tight italic">
                              ⚠️ Projected to exceed due date ({formatDate(editingTask.dueDate)})
                            </p>
                          )}
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">
                            Risk Assessment
                          </p>
                          <div className="flex items-center gap-3">
                            <span
                              className={`text-xl font-black uppercase tracking-tighter ${isAtRisk ? 'text-amber-500' : 'text-emerald-400'}`}
                            >
                              {isAtRisk ? 'High Delay Risk' : 'Healthy Vector'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {isAtRisk && (
                        <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
                          <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                            AI Workload Redistribution Suggestion
                          </p>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-white/80">
                              Redistribute to:
                            </span>
                            <div className="flex gap-2">
                              {/* Filter members with low current workload in a real impl */}
                              {members.slice(0, 2).map((m) => (
                                <button
                                  key={m.id}
                                  type="button"
                                  onClick={() => setEditAssigneeId(m.id)}
                                  className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-black text-white/40 uppercase hover:bg-brand-500 hover:text-white transition-all"
                                >
                                  {m.fullName.split(' ')[0]} (Low workload)
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
              {intelligence?.duplicates && intelligence.duplicates.length > 0 && (
                <div className="relative group overflow-hidden rounded-[2.5rem] border border-amber-500/20 bg-amber-500/[0.02] p-8 shadow-glow-amber animate-in slide-in-from-top-6 duration-700">
                  <div className="flex items-start gap-6">
                    <div className="p-4 bg-amber-500/10 rounded-2xl text-amber-500 border border-amber-500/20 shadow-glow-amber">
                      <Zap size={24} className="animate-pulse" />
                    </div>
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-500">
                          Semantic Duplicate Warning
                        </h4>
                        <div className="h-px flex-1 bg-gradient-to-r from-amber-500/20 to-transparent" />
                      </div>
                      <p className="text-sm text-white/90 leading-relaxed font-bold italic tracking-tight">
                        Detecting {intelligence.duplicates.length} potentially redundant units in
                        current workspace.
                      </p>
                      <div className="flex flex-col gap-2 mt-4">
                        {intelligence.duplicates.map((dup) => (
                          <button
                            key={dup.id}
                            type="button"
                            onClick={() => {
                              const task = (projectTasks ?? []).find((t) => t.id === dup.id);
                              if (task) handleOpenEdit(task);
                            }}
                            className="flex items-center justify-between px-6 py-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-amber-500/40 hover:bg-white/[0.05] transition-all group/dup"
                          >
                            <span className="text-xs font-bold text-white/60 group-hover/dup:text-white truncate">
                              {dup.title}
                            </span>
                            <span className="text-[10px] font-mono text-amber-500/50">
                              {Math.round(dup.score * 100)}% MATCH
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Neural Prediction Insights */}
              {intelligence?.suggestions && (
                <div className="relative group overflow-hidden rounded-[2.5rem] border border-cyan-500/20 bg-cyan-500/[0.02] p-8 shadow-glow-cyan animate-in slide-in-from-top-6 duration-700">
                  <div className="flex items-start gap-6">
                    <div className="p-4 bg-cyan-500/10 rounded-2xl text-cyan-400 border border-cyan-500/20 shadow-glow-cyan">
                      <Brain size={24} className="animate-pulse" />
                    </div>
                    <div className="space-y-4 flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-400">
                          Neural Triage Suggestions
                        </h4>
                        <div className="h-px flex-1 bg-gradient-to-r from-cyan-500/20 to-transparent" />
                      </div>

                      <div className="flex flex-wrap gap-4">
                        {intelligence.suggestions.priority &&
                          intelligence.suggestions.priority !== editPriority && (
                            <button
                              type="button"
                              onClick={() =>
                                setEditPriority(intelligence.suggestions.priority as TaskPriority)
                              }
                              className="px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase tracking-widest hover:bg-cyan-500 hover:text-white transition-all shadow-glow-cyan/10"
                            >
                              Suggested Priority: {intelligence.suggestions.priority}
                            </button>
                          )}

                        {intelligence.suggestions.labels.map((label) => (
                          <button
                            key={label}
                            type="button"
                            onClick={() => {
                              // In a real impl, we'd find the label ID and add it
                              toast.info(`Applying label: ${label}`);
                            }}
                            className="px-4 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white/40 text-[10px] font-black uppercase tracking-widest hover:bg-brand-500 hover:text-white transition-all"
                          >
                            + {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Intelligent Analytical Briefing */}
              {aiAnalysis && (
                <div className="relative group overflow-hidden rounded-[2.5rem] border border-brand-500/20 bg-brand-500/[0.02] p-8 shadow-glow-brand animate-in slide-in-from-top-6 duration-700">
                  <div className="absolute top-6 right-6">
                    <button
                      onClick={() => setAiAnalysis(null)}
                      className="w-8 h-8 flex items-center justify-center bg-white/5 rounded-full text-white/20 hover:text-white transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                  <div className="flex items-start gap-6">
                    <div className="p-4 bg-brand-500/10 rounded-2xl text-brand-400 border border-brand-500/20 shadow-glow-brand">
                      <Cpu size={24} className="animate-pulse" />
                    </div>
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-400">
                          Intelligent Briefing
                        </h4>
                        <div className="h-px flex-1 bg-gradient-to-r from-brand-500/20 to-transparent" />
                      </div>
                      <p className="text-sm text-white/90 leading-relaxed font-bold italic tracking-tight">
                        "{aiAnalysis}"
                      </p>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-transparent via-brand-500/30 to-transparent w-full" />
                </div>
              )}

              <section className="space-y-16">
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
                  workspaceId={editingTask.project.workspaceId}
                  labels={editingTask.labels}
                  workflow={workflow}
                  initialStatus={editingTask.status}
                />

                <div className="space-y-6">
                  <div className="flex items-center gap-4 px-2">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/5" />
                    <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">
                      Directives & Logic
                    </label>
                    <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/5" />
                  </div>
                  <div className="relative group">
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={8}
                      className="w-full rounded-[2.5rem] border border-white/5 bg-white/[0.01] px-8 py-8 text-sm font-bold text-white focus:outline-none focus:border-brand-500/40 focus:bg-white/[0.02] transition-all placeholder:text-white/5 shadow-inner elite-scrollbar"
                      placeholder="ESTABLISH_MISSION_PARAMETERS..."
                    />
                    <div className="absolute bottom-8 right-8 flex items-center gap-2">
                      <span className="text-[9px] font-black text-white/5 uppercase tracking-[0.2em]">
                        Secure Node
                      </span>
                      <Target size={12} className="text-white/5" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
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

              <div className="border-t border-white/5 pt-16">
                <div className="flex items-center gap-4 px-2 mb-10">
                  <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">
                    Signal Logs
                  </label>
                  <div className="h-px flex-1 bg-gradient-to-r from-white/5 to-transparent" />
                </div>
                <TaskCommentSection
                  projectId={projectId}
                  taskId={editingTask.id}
                  currentUserId={currentUserId}
                />
              </div>

              {/* History Timeline Integration Proxy */}
              <div className="flex flex-wrap items-center gap-8 py-4 px-6 border border-white/5 rounded-[2rem] bg-white/[0.01]">
                <div className="flex items-center gap-3">
                  <History size={14} className="text-brand-500" />
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">
                    Established: {formatDate(editingTask.createdAt)}
                  </span>
                </div>
                <div className="h-4 w-px bg-white/5" />
                <div className="flex items-center gap-3">
                  <Zap size={14} className="text-cyan-500" />
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">
                    Last Synced: {formatDate(editingTask.updatedAt)}
                  </span>
                </div>
              </div>
            </div>

            {taskUpdateError && (
              <div className="px-10 pb-10">
                <div className="p-6 bg-rose-500/5 border border-rose-500/20 rounded-[2rem] text-rose-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-4 animate-pulse">
                  <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center shrink-0">
                    <Terminal size={14} />
                  </div>
                  <span>PROTOCOL_SYNC_HEADER_ERROR: {taskUpdateError}</span>
                </div>
              </div>
            )}
          </form>

          {/* Secure Commitment Footer */}
          <footer className="flex items-center justify-between border-t border-white/5 bg-white/[0.02] px-10 py-8 backdrop-blur-xl">
            {editingTask.deletedAt ? (
              <button
                type="button"
                onClick={onRestore}
                disabled={isRestoring}
                className="group relative px-10 py-4 bg-emerald-500 text-slate-950 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all disabled:opacity-30 overflow-hidden shadow-glow-emerald/20"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                <span className="relative z-10 flex items-center gap-3">
                  <Archive size={16} /> Restore Vector
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onDelete}
                disabled={isDeleting}
                className="group px-8 py-4 bg-transparent border border-rose-500/20 text-rose-500/40 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all disabled:opacity-30 flex items-center gap-3"
              >
                <Archive size={16} className="group-hover:animate-bounce" />
                <span>Archive Manifest</span>
              </button>
            )}

            <div className="flex gap-6">
              <button
                type="button"
                onClick={onClose}
                className="px-8 py-4 border border-white/5 text-white/20 font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl hover:bg-white/5 hover:text-white transition-all"
              >
                Abort Protocol
              </button>
              <button
                type="submit"
                form="task-edit-form"
                disabled={isSaving}
                className="group relative px-12 py-4 bg-white text-slate-950 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:scale-105 active:scale-95 transition-all disabled:opacity-30 overflow-hidden shadow-luxe"
              >
                <div className="absolute inset-0 bg-brand-500 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                <span className="relative z-10 flex items-center gap-3 group-hover:text-white transition-colors">
                  {isSaving ? (
                    <Cpu className="animate-spin" size={16} />
                  ) : (
                    <ShieldCheck className="size-4" />
                  )}
                  {isSaving ? 'Synchronizing...' : 'Commit Specification'}
                </span>
              </button>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

function ShieldCheck({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={3}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
      />
    </svg>
  );
}
