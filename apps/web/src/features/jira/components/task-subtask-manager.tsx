'use client';

import type { ProjectTaskItemDTO } from '@superboard/shared';
import { ListTree, Plus, Trash2, ArrowUpRight, CheckCircle2 } from 'lucide-react';

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
  if (editingTask.parentTaskId) {
    return (
      <div className="rounded-[2rem] border border-white/5 bg-white/5 p-6 space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-1 w-3 bg-brand-500 rounded-full" />
          <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">
            Parent Protocol
          </p>
        </div>
        <div
          className="flex items-center justify-between p-4 bg-slate-900/50 rounded-2xl border border-white/5 group hover:border-brand-500/30 transition-all cursor-pointer"
          onClick={() => parentTask && onOpenEdit(parentTask)}
        >
          <p className="text-sm font-bold text-white group-hover:text-brand-400 transition-colors">
            {parentTask?.title ?? 'Parent manifest archived or unavailable'}
          </p>
          <ArrowUpRight
            size={16}
            className="text-white/20 group-hover:text-brand-400 transition-all"
          />
        </div>
      </div>
    );
  }

  const progress = editingTask.subtaskProgress?.percent ?? 0;

  return (
    <div className="space-y-6 rounded-[2.5rem] border border-white/5 bg-white/5 p-8 backdrop-blur-3xl">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ListTree size={14} className="text-brand-400" />
            <p className="text-[10px] font-black text-white uppercase tracking-[0.3em]">
              Neural Sub-Nodes
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-white tracking-tighter">
              {editingTask.subtaskProgress?.done ?? 0}/{editingTask.subtaskProgress?.total ?? 0}
            </span>
            <span className="text-[10px] font-black text-white/20">MANIFESTS SYNCED</span>
          </div>
        </div>

        {/* Progress Circular visual proxy or bar */}
        <div className="relative h-14 w-14 flex items-center justify-center">
          <svg className="h-full w-full -rotate-90">
            <circle
              cx="28"
              cy="28"
              r="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="text-white/5"
            />
            <circle
              cx="28"
              cy="28"
              r="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeDasharray={150}
              strokeDashoffset={150 - (150 * progress) / 100}
              strokeLinecap="round"
              className="text-brand-500 transition-all duration-1000"
            />
          </svg>
          <span className="absolute text-[10px] font-black text-white">{progress}%</span>
        </div>
      </div>

      <div className="space-y-3">
        {subtasks.length === 0 ? (
          <div className="py-8 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-3xl opacity-40">
            <ListTree size={32} className="mb-2" />
            <p className="text-[10px] font-black uppercase tracking-widest">Awaiting Objectives</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {subtasks.map((subtask) => (
              <div
                key={subtask.id}
                className={`group flex items-center gap-4 rounded-2xl border border-white/5 bg-slate-950/50 p-4 hover:border-brand-500/30 transition-all ${subtask.status === 'done' ? 'opacity-50' : ''}`}
              >
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={subtask.status === 'done'}
                    onChange={() => onToggleSubtaskDone(subtask)}
                    disabled={subtaskPendingTaskId === subtask.id}
                    className="peer h-6 w-6 rounded-lg border-2 border-white/10 bg-transparent text-brand-500 focus:ring-offset-0 focus:ring-0 checked:bg-brand-500 transition-all appearance-none cursor-pointer"
                  />
                  <CheckCircle2
                    size={14}
                    className="absolute inset-0 m-auto text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none"
                  />
                </div>

                <div className="flex-1">
                  <button
                    type="button"
                    onClick={() => onOpenEdit(subtask)}
                    className={`text-sm font-bold block text-left transition-all ${subtask.status === 'done' ? 'text-white/40 line-through' : 'text-white hover:text-brand-400'}`}
                  >
                    {subtask.title}
                  </button>
                  <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">
                    Protocol Active
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onDeleteSubtask(subtask.id)}
                  disabled={subtaskPendingTaskId === subtask.id}
                  className="opacity-0 group-hover:opacity-100 p-2 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-all disabled:opacity-50"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3 pt-4 border-t border-white/5">
        <label className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">
          Initialize New Sub-Node
        </label>
        <div className="flex gap-3">
          <input
            type="text"
            value={subtaskTitle}
            onChange={(event) =>
              setEditTitle
                ? setSubtaskTitle(event.target.value)
                : setSubtaskTitle(event.target.value)
            }
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onCreateSubtask();
              }
            }}
            placeholder="Declare objective..."
            className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all placeholder:text-white/20"
          />
          <button
            type="button"
            onClick={onCreateSubtask}
            disabled={subtaskPendingTaskId === editingTask.id || !subtaskTitle.trim()}
            className="p-3 bg-brand-500 text-white rounded-2xl shadow-luxe hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center"
          >
            <Plus size={20} />
          </button>
        </div>
        {subtaskError && (
          <p className="text-[10px] font-bold text-rose-500 animate-pulse">{subtaskError}</p>
        )}
      </div>
    </div>
  );
}
