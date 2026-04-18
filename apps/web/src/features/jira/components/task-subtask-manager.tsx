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
      <div className="rounded-[3rem] border border-white/5 bg-white/[0.01] p-10 space-y-10 backdrop-blur-[40px] shadow-inner relative overflow-hidden group/parent">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/30 to-transparent opacity-0 group-hover/parent:opacity-100 transition-opacity" />
        <div className="flex items-center gap-6">
          <div className="h-1 w-8 bg-brand-500 rounded-full shadow-glow-brand animate-pulse" />
          <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.6em] italic">
            Parent Vector Origin
          </p>
        </div>
        <div
          className="flex items-center justify-between p-10 bg-white/[0.02] rounded-[2.5rem] border border-white/5 group hover:border-brand-500/30 transition-all cursor-pointer shadow-luxe overflow-hidden relative"
          onClick={() => parentTask && onOpenEdit(parentTask)}
        >
          <div className="absolute inset-0 bg-brand-500/[0.01] opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center gap-8 relative z-10">
            <div className="w-16 h-16 bg-slate-950 rounded-2xl flex items-center justify-center border border-white/5 group-hover:scale-110 group-hover:rotate-6 transition-all shadow-inner">
              <ArrowUpRight size={24} className="text-brand-400" />
            </div>
            <div className="space-y-1.5">
              <p className="text-lg font-black text-white group-hover:text-brand-400 transition-colors uppercase tracking-tight italic">
                {parentTask?.title ?? 'PARENT_ARCHIVED_OR_UNAVAILABLE'}
              </p>
              <span className="text-[9px] font-black text-white/10 uppercase tracking-[0.4em]">
                Master Protocol Reference
              </span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white/5 opacity-0 group-hover:opacity-100 transition-all group-hover:scale-110">
            <ArrowUpRight size={20} className="text-white/40" />
          </div>
        </div>
      </div>
    );
  }

  const progress = editingTask.subtaskProgress?.percent ?? 0;

  return (
    <div className="space-y-12 rounded-[3.5rem] border border-white/5 bg-white/[0.01] p-10 backdrop-blur-[60px] relative overflow-hidden group shadow-luxe">
      <div className="absolute inset-0 bg-brand-500/[0.01] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      <div className="flex items-center justify-between relative z-10">
        <div className="space-y-3">
          <div className="flex items-center gap-5">
            <Cpu size={16} className="text-brand-500 animate-pulse" />
            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.6em] italic">
              Neural Sub-Nodes
            </p>
          </div>
          <div className="flex items-center gap-5">
            <span className="text-5xl font-black text-white tracking-tighter italic">
              {editingTask.subtaskProgress?.done ?? 0}/{editingTask.subtaskProgress?.total ?? 0}
            </span>
            <div className="flex flex-col gap-0.5 pt-2">
              <span className="text-[9px] font-black text-brand-500/40 tracking-[0.4em] uppercase">
                SYNC_ACTIVE
              </span>
              <span className="text-[8px] font-bold text-white/5 uppercase tracking-[0.2em]">
                WAITING_CALLBACK
              </span>
            </div>
          </div>
        </div>

        <div className="relative h-28 w-28 flex items-center justify-center group/progress">
          <div className="absolute inset-0 bg-brand-500/5 blur-2xl rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity duration-1000" />
          <svg className="h-full w-full -rotate-90 relative z-10">
            <circle
              cx="56"
              cy="56"
              r="48"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="text-white/5"
            />
            <circle
              cx="56"
              cy="56"
              r="48"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              strokeDasharray={301}
              strokeDashoffset={301 - (301 * progress) / 100}
              strokeLinecap="round"
              className="text-brand-500 transition-all duration-1000 shadow-glow-brand"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center leading-none z-20">
            <span className="text-lg font-black text-white tracking-tighter italic">
              {progress}%
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-6 relative z-10">
        {subtasks.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[3rem] bg-white/[0.005] group/empty relative overflow-hidden">
            <div className="absolute inset-0 bg-brand-500/[0.01] opacity-0 group-hover/empty:opacity-100 transition-opacity" />
            <Zap
              size={48}
              className="mb-6 text-white/10 group-hover/empty:text-brand-500 transition-all duration-700 group-hover/empty:scale-125"
            />
            <p className="text-[11px] font-black uppercase tracking-[0.6em] text-white/10 italic">
              Awaiting Decomposition
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {subtasks.map((subtask) => (
              <div
                key={subtask.id}
                className={`group/node flex items-center gap-8 rounded-[2rem] border border-white/5 bg-white/[0.01] p-6 hover:bg-white/[0.03] hover:border-brand-500/20 transition-all shadow-inner relative overflow-hidden ${subtask.status === 'done' ? 'opacity-30' : ''}`}
              >
                <div className="relative z-10">
                  <input
                    type="checkbox"
                    checked={subtask.status === 'done'}
                    onChange={() => onToggleSubtaskDone(subtask)}
                    disabled={subtaskPendingTaskId === subtask.id}
                    className="peer h-10 w-10 rounded-2xl border-2 border-white/5 bg-transparent text-brand-500 focus:ring-offset-0 focus:ring-0 checked:bg-brand-500/10 checked:border-brand-500/40 transition-all appearance-none cursor-pointer hover:border-brand-500/20 shadow-inner"
                  />
                  <CheckCircle2
                    size={22}
                    className="absolute inset-0 m-auto text-brand-400 opacity-0 peer-checked:opacity-100 transition-all scale-50 peer-checked:scale-100 pointer-events-none"
                  />
                  {subtaskPendingTaskId === subtask.id && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 relative z-10">
                  <button
                    type="button"
                    onClick={() => onOpenEdit(subtask)}
                    className={`text-base font-black block text-left transition-all truncate uppercase tracking-tight italic ${subtask.status === 'done' ? 'text-white/20 line-through' : 'text-white/70 hover:text-brand-400'}`}
                  >
                    {subtask.title}
                  </button>
                  <div className="flex items-center gap-3 mt-1.5">
                    <div className="h-1 w-1 rounded-full bg-brand-500 shadow-glow-brand" />
                    <span className="text-[9px] font-black text-white/10 uppercase tracking-[0.4em] block">
                      SPEC_NODE_ACTIVE
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onDeleteSubtask(subtask.id)}
                  disabled={subtaskPendingTaskId === subtask.id}
                  className="opacity-0 group-hover/node:opacity-100 p-4 rounded-2xl text-rose-500/30 hover:text-white hover:bg-rose-500 transition-all disabled:opacity-30 relative z-10"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-6 pt-10 border-t border-white/5 relative z-10">
        <label className="text-[10px] font-black text-white/10 uppercase tracking-[0.6em] pl-6 italic">
          Initialize Sub-Node
        </label>
        <div className="flex gap-5">
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
            className="flex-1 rounded-[2rem] border border-white/5 bg-white/[0.01] px-10 py-6 text-sm font-black text-white/70 focus:outline-none focus:border-brand-500/30 focus:bg-white/[0.03] transition-all placeholder:text-white/5 shadow-inner uppercase italic tracking-tight"
          />
          <button
            type="button"
            onClick={onCreateSubtask}
            disabled={subtaskPendingTaskId === editingTask.id || !subtaskTitle.trim()}
            className="w-16 h-16 bg-white text-slate-950 rounded-[1.5rem] shadow-luxe hover:scale-105 active:scale-95 transition-all disabled:opacity-10 flex items-center justify-center group/add"
          >
            <Plus
              size={32}
              className="group-hover/add:rotate-90 transition-transform duration-700"
            />
          </button>
        </div>
        {subtaskError && (
          <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.4em] animate-pulse px-6 italic">
            {subtaskError}
          </p>
        )}
      </div>
    </div>
  );
}
