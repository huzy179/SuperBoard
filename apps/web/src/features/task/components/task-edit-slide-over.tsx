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
import type { PredictiveHealthResponse } from '@/features/project/hooks/use-predictive-health';
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
} from '@/features/task/hooks/use-task-mutations';
import { useRelatedDocs } from '@/features/search/hooks/use-related-docs';
import { toast } from 'sonner';
import Link from 'next/link';

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
          <header className="flex items-center justify-between border-b border-white/5 px-10 py-10 bg-white/[0.01] backdrop-blur-3xl shadow-inner">
            <div className="flex items-center gap-8">
              <div className="w-16 h-16 bg-slate-900 rounded-[2rem] border border-white/10 shadow-luxe flex items-center justify-center relative group overflow-hidden">
                <div className="absolute inset-0 bg-brand-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10 scale-125">
                  <TaskTypeIcon type={editingTask.type ?? 'task'} />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-4">
                  {projectKey && editingTask.number && (
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white/30">
                        {projectKey}-{editingTask.number}
                      </span>
                      <div className="h-1.5 w-1.5 rounded-full bg-white/10" />
                    </div>
                  )}
                  <span className="text-[10px] font-black uppercase tracking-[0.5em] text-brand-400">
                    Đang hoạt động
                  </span>
                </div>
                <h2
                  id="task-detail-title"
                  className="text-3xl font-black text-white tracking-tighter uppercase leading-none"
                >
                  Chi tiết công việc
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-5">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowAiMenu(!showAiMenu)}
                  className={`group relative flex items-center gap-4 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-500 overflow-hidden border shadow-inner ${
                    isAiThinking
                      ? 'bg-brand-500 text-slate-950 border-brand-500 animate-pulse'
                      : 'bg-white/[0.03] text-brand-400 border-white/10 hover:bg-white/[0.06] hover:border-brand-500/30'
                  }`}
                >
                  <Sparkles
                    size={18}
                    className={
                      isAiThinking
                        ? 'animate-spin'
                        : 'group-hover:animate-pulse group-hover:rotate-12 transition-transform'
                    }
                  />
                  <span>Công cụ AI</span>
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-700 ${showAiMenu ? 'rotate-180' : ''}`}
                  />
                </button>

                {showAiMenu && (
                  <div className="absolute right-0 mt-5 w-80 bg-slate-950/95 border border-white/10 rounded-[2.5rem] shadow-luxe backdrop-blur-3xl overflow-hidden p-2 z-50 animate-in fade-in zoom-in-95 duration-500">
                    <div className="px-6 py-4 border-b border-white/5 mb-2">
                      <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em]">
                        Chọn chức năng AI
                      </span>
                    </div>
                    <div className="space-y-1">
                      <button
                        onClick={handleAiDecompose}
                        className="w-full px-6 py-4.5 flex items-center gap-5 text-white/40 hover:text-white hover:bg-white/[0.03] rounded-2xl transition-all text-left group/opt"
                      >
                        <div className="p-3 bg-brand-500/10 rounded-xl text-brand-400 group-hover/opt:bg-brand-500 group-hover/opt:text-slate-950 transition-all shadow-inner">
                          <ListTree size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-black uppercase tracking-widest block">
                            Phân tách thông minh
                          </span>
                          <span className="text-[9px] text-white/20 font-medium uppercase tracking-widest truncate mt-1">
                            AI tự động chia nhỏ công việc
                          </span>
                        </div>
                      </button>
                      <button
                        onClick={handleAiRefine}
                        className="w-full px-6 py-4.5 flex items-center gap-5 text-white/40 hover:text-white hover:bg-white/[0.03] rounded-2xl transition-all text-left group/opt"
                      >
                        <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400 group-hover/opt:bg-indigo-500 group-hover/opt:text-white transition-all shadow-inner">
                          <Brain size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-black uppercase tracking-widest block">
                            Tối ưu nội dung
                          </span>
                          <span className="text-[9px] text-white/20 font-medium uppercase tracking-widest truncate mt-1">
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
                        className="w-full px-6 py-4.5 flex items-center gap-5 text-white/40 hover:text-white hover:bg-white/[0.03] rounded-2xl transition-all text-left group/opt"
                      >
                        <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400 group-hover/opt:bg-purple-500 group-hover/opt:text-white transition-all shadow-inner">
                          <Terminal size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-black uppercase tracking-widest block">
                            Tóm tắt thông minh
                          </span>
                          <span className="text-[9px] text-white/20 font-medium uppercase tracking-widest truncate mt-1">
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
                className="w-14 h-14 flex items-center justify-center text-white/10 hover:text-white hover:bg-white/[0.04] rounded-2xl transition-all border border-transparent hover:border-white/10 shadow-inner"
              >
                <X size={24} />
              </button>
            </div>
          </header>

          <form
            id="task-edit-form"
            onSubmit={onSave}
            className="flex-1 overflow-y-auto elite-scrollbar custom-scrollbar bg-slate-950/20"
          >
            <div className="px-10 py-16 space-y-20">
              {/* Dự đoán tiến độ */}
              {taskPrediction && (
                <div
                  className={`relative group overflow-hidden rounded-[3rem] border p-10 shadow-inner animate-in slide-in-from-top-10 duration-1000 backdrop-blur-3xl ${
                    isAtRisk
                      ? 'border-amber-500/10 bg-amber-500/[0.01] shadow-glow-amber/5'
                      : 'border-emerald-500/10 bg-emerald-500/[0.01] shadow-glow-emerald/5'
                  }`}
                >
                  <div className="flex items-start gap-10">
                    <div
                      className={`p-6 rounded-[2rem] border transition-all duration-1000 shadow-inner ${
                        isAtRisk
                          ? 'bg-amber-500/5 text-amber-500 border-amber-500/10'
                          : 'bg-emerald-500/5 text-emerald-500 border-emerald-500/10'
                      }`}
                    >
                      <Target
                        size={32}
                        className={isAtRisk ? 'animate-pulse' : 'animate-spin-slow'}
                      />
                    </div>
                    <div className="space-y-6 flex-1 pt-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <h4
                            className={`text-[11px] font-black uppercase tracking-[0.5em] ${isAtRisk ? 'text-amber-500' : 'text-emerald-500'}`}
                          >
                            Dự báo tiến độ
                          </h4>
                          <div
                            className={`h-1.5 w-1.5 rounded-full animate-pulse ${isAtRisk ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/10">
                          Độ tin cậy: {Math.round(taskPrediction.confidence * 100)}%
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-2">
                          <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">
                            Dự kiến hoàn thành
                          </p>
                          <p className="text-3xl font-black text-white tracking-tighter uppercase">
                            {formatDate(taskPrediction.estimatedCompletionDate)}
                          </p>
                          {isAtRisk && (
                            <p className="text-[10px] font-black text-amber-500/40 uppercase tracking-widest flex items-center gap-2 mt-2">
                              <Zap size={10} /> Nguy cơ trễ hạn
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">
                            Mức độ rủi ro
                          </p>
                          <div className="flex items-center gap-4">
                            <span
                              className={`text-3xl font-black uppercase tracking-tighter ${isAtRisk ? 'text-amber-500 decoration-amber-500/30 underline decoration-4 underline-offset-8' : 'text-emerald-400'}`}
                            >
                              {isAtRisk ? 'Có rủi ro' : 'Bình thường'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {isAtRisk && (
                        <div className="mt-8 pt-8 border-t border-white/5 space-y-5 bg-white/[0.01] -mx-10 px-10 rounded-b-[3rem]">
                          <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">
                            Đề xuất phân công lại cho
                          </p>
                          <div className="flex items-center gap-5">
                            <span className="text-[11px] font-bold text-white/60 uppercase tracking-widest">
                              GIAO CHO:
                            </span>
                            <div className="flex gap-3">
                              {members.slice(0, 2).map((m) => (
                                <button
                                  key={m.id}
                                  type="button"
                                  onClick={() => setEditAssigneeId(m.id)}
                                  className="px-5 py-2.5 rounded-xl bg-slate-950 border border-white/5 text-[10px] font-black text-white/30 uppercase tracking-widest hover:bg-brand-500 hover:text-slate-950 hover:border-brand-500 transition-all shadow-inner"
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
                <div className="animate-pulse rounded-[3rem] bg-white/[0.01] border border-white/5 p-10 h-32" />
              ) : intelligence.duplicates && intelligence.duplicates.length > 0 ? (
                <div className="relative group overflow-hidden rounded-[3rem] border border-amber-500/10 bg-amber-500/[0.01] p-10 shadow-inner animate-in slide-in-from-top-10 duration-1000">
                  <div className="flex items-start gap-10">
                    <div className="p-6 bg-amber-500/5 rounded-2xl text-amber-500 border border-amber-500/10 shadow-inner group-hover:scale-110 transition-transform">
                      <Zap size={32} className="animate-pulse" />
                      <h4 className="text-[11px] font-black uppercase tracking-[0.5em] text-amber-500">
                        Phát hiện công việc trùng lặp
                      </h4>
                      <div className="h-px flex-1 bg-gradient-to-r from-amber-500/20 to-transparent" />
                    </div>
                    <div className="space-y-4 flex-1">
                      <p className="text-base text-white/80 leading-relaxed font-bold tracking-tight">
                        Tìm thấy {intelligence.duplicates.length} công việc có thể trùng lặp trong
                        workspace.
                      </p>
                      <div className="flex flex-col gap-3 mt-6">
                        {intelligence.duplicates.map((dup) => (
                          <button
                            key={dup.id}
                            type="button"
                            onClick={() => {
                              const task = tasks.find((t) => t.id === dup.id);
                              if (task) handleOpenEdit(task);
                            }}
                            className="flex items-center justify-between px-8 py-5 rounded-[1.5rem] bg-white/[0.02] border border-white/5 hover:border-amber-500/30 hover:bg-white/[0.05] transition-all group/dup shadow-inner"
                          >
                            <span className="text-sm font-black text-white/40 group-hover/dup:text-white truncate uppercase tracking-tight">
                              {dup.title}
                            </span>
                            <div className="flex items-center gap-4">
                              <span className="text-[10px] font-black text-amber-500/30 tracking-widest">
                                {Math.round(dup.score * 100)}% SYNC
                              </span>
                              <ChevronDown
                                size={14}
                                className="-rotate-90 text-white/10 group-hover/dup:text-amber-500"
                              />
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
                <div className="animate-pulse rounded-[3rem] bg-white/[0.01] border border-white/5 p-10 h-32" />
              ) : intelligence.suggestions ? (
                <div className="relative group overflow-hidden rounded-[3rem] border border-cyan-500/10 bg-cyan-500/[0.01] p-10 shadow-inner animate-in slide-in-from-top-10 duration-1000">
                  <div className="flex items-start gap-10">
                    <div className="p-6 bg-cyan-500/5 rounded-2xl text-cyan-400 border border-cyan-500/10 shadow-inner group-hover:scale-110 transition-transform">
                      <Brain size={32} className="animate-pulse" />
                    </div>
                    <div className="space-y-6 flex-1">
                      <div className="flex items-center gap-4">
                        <h4 className="text-[11px] font-black uppercase tracking-[0.5em] text-cyan-400">
                          Gợi ý từ AI
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
                              className="px-6 py-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase tracking-[0.3em] hover:bg-cyan-500 hover:text-slate-950 transition-all shadow-glow-cyan/10"
                            >
                              Đặt ưu tiên: {intelligence.suggestions.priority}
                            </button>
                          )}

                        {intelligence.suggestions.labels.map((label) => (
                          <button
                            key={label}
                            type="button"
                            onClick={() => {
                              toast.info(`Applying classification: ${label}`);
                            }}
                            className="px-6 py-3 rounded-xl bg-white/[0.04] border border-white/5 text-white/30 text-[10px] font-black uppercase tracking-[0.3em] hover:bg-white/10 hover:text-white transition-all shadow-inner"
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
                <div className="relative group overflow-hidden rounded-[3rem] border border-brand-500/10 bg-brand-500/[0.01] p-10 shadow-inner animate-in slide-in-from-top-10 duration-1000">
                  <div className="absolute top-8 right-8">
                    <button
                      onClick={() => setAiAnalysis(null)}
                      className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-2xl text-white/20 hover:text-rose-500 transition-all border border-transparent hover:border-rose-500/20 shadow-inner"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="flex items-start gap-10">
                    <div className="p-6 bg-brand-500/5 rounded-2xl text-brand-400 border border-brand-500/10 shadow-inner group-hover:scale-110 transition-transform">
                      <Cpu size={32} className="animate-spin-slow" />
                    </div>
                    <div className="space-y-4 flex-1">
                      <div className="flex items-center gap-4">
                        <h4 className="text-[11px] font-black uppercase tracking-[0.5em] text-brand-400">
                          Phân tích AI
                        </h4>
                        <div className="h-px flex-1 bg-gradient-to-r from-brand-500/20 to-transparent" />
                      </div>
                      <p className="text-base text-white/90 leading-relaxed font-bold italic tracking-tight opacity-80 decoration-brand-500/20 underline decoration-2 underline-offset-4">
                        "{aiAnalysis}"
                      </p>
                    </div>
                  </div>
                </div>
              ) : summarizeMutation.isPending ? (
                <div className="animate-pulse rounded-[3rem] bg-white/[0.01] border border-white/5 p-10 h-32" />
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
                  <div className="flex items-center gap-6 px-4">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/5" />
                    <label className="text-[10px] font-black text-white/10 uppercase tracking-[0.5em]">
                      Mô tả chi tiết
                    </label>
                    <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/5" />
                  </div>
                  <div className="relative group">
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={10}
                      className="w-full rounded-[3rem] border border-white/5 bg-white/[0.01] px-10 py-10 text-base font-bold text-white/[0.7] focus:outline-none focus:border-brand-500/20 focus:bg-white/[0.02] transition-all placeholder:text-white/5 shadow-inner elite-scrollbar leading-relaxed"
                      placeholder="Mô tả chi tiết về công việc này..."
                    />
                    <div className="absolute bottom-10 right-10 flex items-center gap-3 opacity-20 group-hover:opacity-100 transition-opacity">
                      <span className="text-[9px] font-black text-white uppercase tracking-[0.4em]">
                        Đã lưu mã hóa
                      </span>
                      <ShieldCheck size={14} className="text-white" />
                    </div>
                  </div>
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
                      <label className="text-[10px] font-black text-emerald-400/60 uppercase tracking-[0.5em]">
                        Tài liệu liên quan
                      </label>
                      <div className="h-px flex-1 bg-gradient-to-r from-emerald-500/20 to-transparent" />
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {relatedDocs.map((doc) => (
                        <Link
                          key={doc.id}
                          href={`/docs/${doc.id}`}
                          className="flex items-center justify-between p-6 bg-emerald-500/[0.02] border border-emerald-500/10 rounded-[2rem] hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all group/doc"
                        >
                          <div className="flex items-center gap-5">
                            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 group-hover/doc:scale-110 transition-transform">
                              <FileText size={20} />
                            </div>
                            <div>
                              <h5 className="text-sm font-black text-white uppercase tracking-tight group-hover/doc:text-emerald-400 transition-colors">
                                {doc.title}
                              </h5>
                              <p className="text-[9px] text-white/20 uppercase tracking-[0.2em] mt-1">
                                Cập nhật {formatDate(doc.updatedAt)}
                              </p>
                            </div>
                          </div>
                          <ExternalLink
                            size={16}
                            className="text-white/10 group-hover/doc:text-emerald-400 transition-colors"
                          />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              <div className="border-t border-white/5 pt-20 bg-white/[0.01] -mx-10 px-10 rounded-t-[3rem]">
                <div className="flex items-center gap-6 px-4 mb-12">
                  <label className="text-[10px] font-black text-white/10 uppercase tracking-[0.5em]">
                    Bình luận & Phản hồi
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
              <div className="flex flex-wrap items-center gap-10 py-8 px-10 border border-white/5 rounded-[2.5rem] bg-white/[0.01] shadow-inner">
                <div className="flex items-center gap-4 group/hist">
                  <History
                    size={16}
                    className="text-brand-500 group-hover:rotate-12 transition-transform"
                  />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/80">
                      Ngày tạo
                    </span>
                    <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest mt-0.5">
                      {formatDate(editingTask.createdAt)}
                    </span>
                  </div>
                </div>
                <div className="h-8 w-px bg-white/5" />
                <div className="flex items-center gap-4 group/hist">
                  <Zap
                    size={16}
                    className="text-cyan-500 group-hover:scale-125 transition-transform"
                  />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/80">
                      Cập nhật lần cuối
                    </span>
                    <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest mt-0.5">
                      {formatDate(editingTask.updatedAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {taskUpdateError && (
              <div className="px-10 pb-16">
                <div className="p-8 bg-rose-500/5 border border-rose-500/20 rounded-[2.5rem] text-rose-500 text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-6 animate-pulse shadow-glow-rose/5">
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center shrink-0 border border-rose-500/20 shadow-inner">
                    <Terminal size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="opacity-60">Lỗi khi lưu thay đổi</p>
                    <p className="mt-1 font-bold tracking-tight">{taskUpdateError}</p>
                  </div>
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
                  <Archive size={16} /> Khôi phục
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
                <span>Xóa công việc</span>
              </button>
            )}

            <div className="flex gap-6">
              <button
                type="button"
                onClick={onClose}
                className="px-8 py-4 border border-white/5 text-white/20 font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl hover:bg-white/5 hover:text-white transition-all"
              >
                Hủy bỏ
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
                  {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </span>
              </button>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
