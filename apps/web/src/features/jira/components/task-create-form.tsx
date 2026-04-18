'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { Mic, MicOff } from 'lucide-react';
import type {
  ProjectMemberDTO,
  ProjectTaskItemDTO,
  TaskTypeDTO,
  CreateTaskRequestDTO,
  WorkflowStatusTemplateDTO,
} from '@superboard/shared';
import {
  BOARD_COLUMNS,
  PRIORITY_OPTIONS,
  TASK_TYPE_OPTIONS,
  type TaskPriority,
} from '@/lib/constants/task';
import { toast } from 'sonner';

type TaskCreateFormProps = {
  initialStatus?: ProjectTaskItemDTO['status'] | undefined;
  members: ProjectMemberDTO[];
  isPending: boolean;
  onCreate: (data: CreateTaskRequestDTO) => Promise<void>;
  onSuccess: () => void;
  onCancel: () => void;
  workflow?: WorkflowStatusTemplateDTO | undefined;
};

export function TaskCreateForm({
  initialStatus,
  members,
  isPending,
  onCreate,
  onSuccess,
  onCancel,
  workflow,
}: TaskCreateFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ProjectTaskItemDTO['status']>(
    initialStatus || workflow?.statuses?.[0]?.key || 'todo',
  );
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [type, setType] = useState<TaskTypeDTO>('task');
  const [dueDate, setDueDate] = useState<string>('');
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);

  const toggleListening = () => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as unknown as { SpeechRecognition: any }).SpeechRecognition ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as unknown as { webkitSpeechRecognition: any }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error('Trình duyệt không hỗ trợ nhận diện giọng nói');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'vi-VN';
    recognition.continuous = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: {
      results: {
        [key: number]: {
          [key: number]: { transcript: string };
        };
      };
    }) => {
      const transcript = event.results?.[0]?.[0]?.transcript;
      if (transcript) {
        setTitle((prev) => (prev ? `${prev} ${transcript}` : transcript));
      }
    };

    recognition.start();
  };

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const normalizedTitle = title.trim();
    if (!normalizedTitle) {
      setError('Tiêu đề task không được để trống');
      return;
    }

    setError(null);
    try {
      await onCreate({
        title: normalizedTitle,
        description: description.trim(),
        status,
        priority,
        type,
        dueDate: dueDate || null,
        assigneeId: assigneeId || null,
      });
      onSuccess();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Không thể tạo task');
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="relative mb-8 rounded-[3rem] border border-white/10 bg-white/[0.01] p-10 shadow-luxe backdrop-blur-3xl overflow-hidden group animate-in fade-in slide-in-from-top-4 duration-700"
    >
      {/* Decorative background pulse */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand-500/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-brand-500/10 transition-all duration-1000" />

      <div className="relative z-10 mb-10 flex items-center justify-between border-b border-white/5 pb-8">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-brand-500/10 rounded-xl border border-brand-500/20 shadow-glow-brand/10">
            <Cpu size={18} className="text-brand-400 animate-pulse" />
          </div>
          <div>
            <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-white">
              Neural Initializer
            </h3>
            <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mt-1">
              Enciphering new strategic unit
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {isListening && (
            <div className="flex items-center gap-2 px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-full animate-pulse">
              <div className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
              <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest">
                AURAL_LINK_ACTIVE
              </span>
            </div>
          )}
          <span className="text-[9px] font-black text-white/10 uppercase tracking-[0.2em]">
            0X_SEQ_ALPHA_9
          </span>
        </div>
      </div>

      <div className="relative z-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        <div className="sm:col-span-2 lg:col-span-3">
          <label className="block text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-4 ml-2">
            Unit Designation
          </label>
          <div className="relative group/input">
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="VÍ DỤ: KIỂM TOÁN GIAO DIỆN HỆ THỐNG..."
              className="w-full rounded-[1.5rem] border border-white/5 bg-slate-950/50 px-8 py-5 text-base font-black text-white placeholder:text-white/5 focus:border-brand-500/40 focus:ring-0 transition-all shadow-inner tracking-tight uppercase"
              required
            />
            <button
              type="button"
              onClick={toggleListening}
              className={`absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-xl transition-all ${
                isListening
                  ? 'bg-rose-500 text-slate-950 shadow-glow-red'
                  : 'bg-white/5 text-white/20 hover:text-brand-400 hover:bg-white/10 border border-white/5'
              }`}
            >
              {isListening ? <Mic size={18} /> : <MicOff size={18} />}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <label className="block text-[10px] font-black text-white/40 uppercase tracking-[0.3em] ml-2">
            Logic State
          </label>
          <div className="relative">
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="w-full appearance-none rounded-2xl border border-white/5 bg-slate-950/50 px-6 py-4 text-xs font-black text-white/80 focus:border-brand-500/40 focus:ring-0 transition-all shadow-inner uppercase tracking-widest"
            >
              {workflow?.statuses
                ? workflow.statuses.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.name.toUpperCase()}
                    </option>
                  ))
                : BOARD_COLUMNS.map((column) => (
                    <option key={column.key} value={column.key}>
                      {column.label.toUpperCase()}
                    </option>
                  ))}
            </select>
            <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/20">
              <Zap size={14} />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <label className="block text-[10px] font-black text-white/40 uppercase tracking-[0.3em] ml-2">
            Priority Vector
          </label>
          <div className="relative">
            <select
              value={priority}
              onChange={(event) => setPriority(event.target.value as TaskPriority)}
              className="w-full appearance-none rounded-2xl border border-white/5 bg-slate-950/50 px-6 py-4 text-xs font-black text-white/80 focus:border-brand-500/40 focus:ring-0 transition-all shadow-inner uppercase tracking-widest"
            >
              {PRIORITY_OPTIONS.map((priorityOpt) => (
                <option key={priorityOpt.key} value={priorityOpt.key}>
                  {priorityOpt.label.toUpperCase()}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/20">
              <Activity size={14} />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <label className="block text-[10px] font-black text-white/40 uppercase tracking-[0.3em] ml-2">
            Type Designation
          </label>
          <div className="relative">
            <select
              value={type}
              onChange={(event) => setType(event.target.value as TaskTypeDTO)}
              className="w-full appearance-none rounded-2xl border border-white/5 bg-slate-950/50 px-6 py-4 text-xs font-black text-white/80 focus:border-brand-500/40 focus:ring-0 transition-all shadow-inner uppercase tracking-widest"
            >
              {TASK_TYPE_OPTIONS.map((taskOption) => (
                <option key={taskOption.key} value={taskOption.key}>
                  {taskOption.label.toUpperCase()}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/20">
              <Cpu size={14} />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <label className="block text-[10px] font-black text-white/40 uppercase tracking-[0.3em] ml-2">
            Temporal Deadline
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
            className="w-full rounded-2xl border border-white/5 bg-slate-950/50 px-6 py-4 text-xs font-black text-white/80 focus:border-brand-500/40 focus:ring-0 transition-all shadow-inner uppercase tracking-widest dark-date-picker"
          />
        </div>

        <div className="space-y-4">
          <label className="block text-[10px] font-black text-white/40 uppercase tracking-[0.3em] ml-2">
            Assigned Operator
          </label>
          <div className="relative">
            <select
              value={assigneeId}
              onChange={(event) => setAssigneeId(event.target.value)}
              className="w-full appearance-none rounded-2xl border border-white/5 bg-slate-950/50 px-6 py-4 text-xs font-black text-white/80 focus:border-brand-500/40 focus:ring-0 transition-all shadow-inner uppercase tracking-widest"
            >
              <option value="">-- UNASSIGNED --</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.fullName.toUpperCase()}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/20">
              <ShieldAlert size={14} />
            </div>
          </div>
        </div>

        <div className="sm:col-span-2 lg:col-span-3 space-y-4">
          <label className="block text-[10px] font-black text-white/40 uppercase tracking-[0.3em] ml-2">
            Mission Briefing
          </label>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={4}
            placeholder="ADDITIONAL STRATEGIC CONTEXT..."
            className="w-full rounded-[2rem] border border-white/5 bg-slate-950/50 px-8 py-6 text-sm font-bold text-white/80 placeholder:text-white/5 focus:border-brand-500/40 focus:ring-0 transition-all shadow-inner resize-none leading-relaxed italic"
          />
        </div>
      </div>

      {error ? (
        <p className="mt-8 px-4 text-[10px] font-black uppercase tracking-widest text-rose-500 animate-pulse">
          [CRITICAL_FAULT]: {error}
        </p>
      ) : null}

      <div className="relative z-10 mt-12 flex items-center justify-end gap-6 pt-10 border-t border-white/5">
        <button
          type="button"
          onClick={onCancel}
          className="px-10 py-4 text-[10px] font-black uppercase tracking-[0.4em] text-white/20 hover:text-white transition-all bg-white/5 hover:bg-white/10 rounded-2xl"
        >
          Abort
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="relative px-12 py-4 bg-brand-500 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] text-white shadow-glow-brand/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-30 group/btn overflow-hidden"
        >
          <div className="absolute inset-x-0 top-0 h-px bg-white/40" />
          {isPending ? 'Propagating...' : 'Initialize Unit'}
        </button>
      </div>
    </form>
  );
}
