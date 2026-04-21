'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
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
      setError('Tiêu đề công việc không được để trống');
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
      setError(caughtError instanceof Error ? caughtError.message : 'Không thể tạo công việc');
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="relative mb-8 rounded-[2rem] border border-white/8 bg-white/[0.02] p-8 shadow-inner backdrop-blur-xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500"
    >
      {/* Decorative glow */}
      <div className="absolute -top-20 -right-20 w-56 h-56 bg-brand-500/5 rounded-full blur-[80px] pointer-events-none" />

      {/* Form header */}
      <div className="relative z-10 flex items-center justify-between mb-8 pb-6 border-b border-white/5">
        <div>
          <h3 className="text-sm font-black text-white tracking-tight">Tạo công việc mới</h3>
          <p className="text-[11px] text-white/30 mt-0.5">Điền thông tin và bấm Tạo để lưu</p>
        </div>
        {isListening && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-full animate-pulse">
            <div className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
            <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">
              Đang nghe...
            </span>
          </div>
        )}
      </div>

      {/* Fields */}
      <div className="relative z-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* Title — full width */}
        <div className="sm:col-span-2 lg:col-span-3">
          <label className="form-label">Tiêu đề công việc</label>
          <div className="relative">
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Nhập tiêu đề công việc..."
              className="form-input pr-14"
              required
            />
            <button
              type="button"
              onClick={toggleListening}
              title={isListening ? 'Dừng nghe' : 'Nhận diện giọng nói'}
              className={`absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-xl transition-all ${
                isListening
                  ? 'bg-rose-500 text-white shadow-[0_4px_16px_-4px_rgba(239,68,68,0.5)]'
                  : 'bg-white/5 text-white/30 hover:text-brand-400 hover:bg-white/10'
              }`}
            >
              {isListening ? <Mic size={16} /> : <MicOff size={16} />}
            </button>
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="form-label">Trạng thái</label>
          <div className="relative">
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="form-select"
            >
              {workflow?.statuses
                ? workflow.statuses.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.name}
                    </option>
                  ))
                : BOARD_COLUMNS.map((column) => (
                    <option key={column.key} value={column.key}>
                      {column.label}
                    </option>
                  ))}
            </select>
          </div>
        </div>

        {/* Priority */}
        <div>
          <label className="form-label">Độ ưu tiên</label>
          <select
            value={priority}
            onChange={(event) => setPriority(event.target.value as TaskPriority)}
            className="form-select"
          >
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {/* Type */}
        <div>
          <label className="form-label">Loại công việc</label>
          <select
            value={type}
            onChange={(event) => setType(event.target.value as TaskTypeDTO)}
            className="form-select"
          >
            {TASK_TYPE_OPTIONS.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Due date */}
        <div>
          <label className="form-label">Hạn hoàn thành</label>
          <input
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
            className="form-input dark-date-picker"
          />
        </div>

        {/* Assignee */}
        <div>
          <label className="form-label">Người thực hiện</label>
          <select
            value={assigneeId}
            onChange={(event) => setAssigneeId(event.target.value)}
            className="form-select"
          >
            <option value="">-- Chưa giao --</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.fullName}
              </option>
            ))}
          </select>
        </div>

        {/* Description — full width */}
        <div className="sm:col-span-2 lg:col-span-3">
          <label className="form-label">Mô tả</label>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={4}
            placeholder="Thêm mô tả chi tiết về công việc..."
            className="form-textarea"
          />
        </div>
      </div>

      {/* Error */}
      {error && <p className="mt-4 form-error">{error}</p>}

      {/* Actions */}
      <div className="relative z-10 mt-8 flex items-center justify-end gap-3 pt-6 border-t border-white/5">
        <button type="button" onClick={onCancel} className="btn-ghost">
          Hủy
        </button>
        <button type="submit" disabled={isPending} className="btn-primary">
          {isPending ? <Loader2 className="btn-spinner" /> : null}
          {isPending ? 'Đang tạo...' : 'Tạo công việc'}
        </button>
      </div>
    </form>
  );
}
