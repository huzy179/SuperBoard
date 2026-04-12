'use client';

import type { ProjectTaskItemDTO } from '@superboard/shared';
import { Plus, Trash2, ArrowUpRight, CheckCircle2, Cpu, Zap } from 'lucide-react';

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
      <div className="rounded-[2.5rem] border border-white/5 bg-white/[0.01] p-8 space-y-6 backdrop-blur-3xl">
        <div className="flex items-center gap-3">
          <div className="h-1.5 w-4 bg-brand-500 rounded-full shadow-glow-brand" />
          <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">
            Parent Vector Origin
          </p>
        </div>
        <div
          className="flex items-center justify-between p-6 bg-slate-950 rounded-2xl border border-white/5 group hover:border-brand-500/30 transition-all cursor-pointer shadow-inner"
          onClick={() => parentTask && onOpenEdit(parentTask)}
        >
          <div className="space-y-1">
            <p className="text-sm font-black text-white group-hover:text-brand-400 transition-colors uppercase tracking-tight">
              {parentTask?.title ?? 'PARENT_ARCHIVED_OR_UNAVAILABLE'}
            </p>
            <span className="text-[9px] font-black text-white/10 uppercase tracking-widest">
              Master Protocol Reference
            </span>
          </div>
          <ArrowUpRight
            size={18}
            className="text-white/10 group-hover:text-brand-400 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all"
          />
        </div>
      </div>
    );
  }

  const progress = editingTask.subtaskProgress?.percent ?? 0;

  return (
    <div className="space-y-8 rounded-[2.5rem] border border-white/5 bg-white/[0.01] p-8 backdrop-blur-3xl relative overflow-hidden group">
      <div className="absolute inset-0 bg-brand-500/[0.01] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      <div className="flex items-center justify-between relative z-10">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Cpu size={14} className="text-brand-400" />
            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">
              Neural Sub-Nodes
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-3xl font-black text-white tracking-tighter">
              {editingTask.subtaskProgress?.done ?? 0}/{editingTask.subtaskProgress?.total ?? 0}
            </span>
            <span className="text-[9px] font-black text-white/10 tracking-[0.2em] uppercase">
              Nodes Active
            </span>
          </div>
        </div>

        <div className="relative h-16 w-16 flex items-center justify-center">
          <svg className="h-full w-full -rotate-90">
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="text-white/5"
            />
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeDasharray={176}
              strokeDashoffset={176 - (176 * progress) / 100}
              strokeLinecap="round"
              className="text-brand-500 transition-all duration-1000 shadow-glow-brand"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center leading-none">
            <span className="text-[10px] font-black text-white">{progress}%</span>
          </div>
        </div>
      </div>

      <div className="space-y-4 relative z-10">
        {subtasks.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[2rem] opacity-20">
            <Zap size={32} className="mb-4" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em]">
              Awaiting Decomposition
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {subtasks.map((subtask) => (
              <div
                key={subtask.id}
                className={`group flex items-center gap-5 rounded-2xl border border-white/5 bg-slate-950/50 p-5 hover:border-brand-500/30 transition-all shadow-inner ${subtask.status === 'done' ? 'opacity-40' : ''}`}
              >
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={subtask.status === 'done'}
                    onChange={() => onToggleSubtaskDone(subtask)}
                    disabled={subtaskPendingTaskId === subtask.id}
                    className="peer h-7 w-7 rounded-xl border-2 border-white/10 bg-transparent text-brand-500 focus:ring-offset-0 focus:ring-0 checked:bg-brand-500/20 checked:border-brand-500/50 transition-all appearance-none cursor-pointer"
                  />
                  <CheckCircle2
                    size={16}
                    className="absolute inset-0 m-auto text-brand-400 opacity-0 peer-checked:opacity-100 transition-all scale-50 peer-checked:scale-100 pointer-events-none"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => onOpenEdit(subtask)}
                    className={`text-sm font-black block text-left transition-all truncate uppercase tracking-tight ${subtask.status === 'done' ? 'text-white/20 line-through' : 'text-white/80 hover:text-brand-400'}`}
                  >
                    {subtask.title}
                  </button>
                  <span className="text-[9px] font-black text-white/10 uppercase tracking-widest block mt-0.5">
                    Spec Node Active
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onDeleteSubtask(subtask.id)}
                  disabled={subtaskPendingTaskId === subtask.id}
                  className="opacity-0 group-hover:opacity-100 p-2.5 rounded-xl text-rose-500/40 hover:text-rose-500 hover:bg-rose-500/10 transition-all disabled:opacity-30"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4 pt-6 border-t border-white/5 relative z-10">
        <label className="text-[9px] font-black text-white/10 uppercase tracking-[0.4em] pl-2">
          Initialize Sub-Node
        </label>
        <div className="flex gap-4">
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
            placeholder="DECLARE_NEW_OBJECTIVE..."
            className="flex-1 rounded-2xl border border-white/5 bg-slate-950 px-6 py-4 text-sm font-bold text-white focus:outline-none focus:border-brand-500/40 transition-all placeholder:text-white/5 shadow-inner"
          />
          <button
            type="button"
            onClick={onCreateSubtask}
            disabled={subtaskPendingTaskId === editingTask.id || !subtaskTitle.trim()}
            className="w-14 h-14 bg-brand-500 text-slate-950 rounded-2xl shadow-luxe hover:scale-105 active:scale-95 transition-all disabled:opacity-30 flex items-center justify-center group"
          >
            <Plus size={24} className="group-hover:rotate-90 transition-transform duration-500" />
          </button>
        </div>
        {subtaskError && (
          <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest animate-pulse px-2">
            {subtaskError}
          </p>
        )}
      </div>
    </div>
  );
}
