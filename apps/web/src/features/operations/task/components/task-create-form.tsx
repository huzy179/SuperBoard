/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { z } from 'zod';
import type {
  ProjectMemberDTO,
  ProjectTaskItemDTO,
  CreateTaskRequestDTO,
  WorkflowStatusTemplateDTO,
} from '@superboard/shared';
import { BOARD_COLUMNS, PRIORITY_OPTIONS, TASK_TYPE_OPTIONS } from '@/lib/constants/task';
import { toast } from 'sonner';
import { useAppForm } from '@/lib/hooks/use-app-form';
import { FormField, FormInput, FormTextArea, FormSelect } from '@/components/ui/form-controls';

const createTaskSchema = z.object({
  title: z.string().min(1, 'Tiêu đề không được để trống'),
  description: z.string().optional(),
  status: z.string(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  type: z.enum(['task', 'bug', 'story', 'epic']),
  dueDate: z.string().nullable().optional(),
  assigneeId: z.string().nullable().optional(),
});

type TaskCreateFormValues = z.infer<typeof createTaskSchema>;

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
  const [isListening, setIsListening] = useState(false);

  const form = useAppForm({
    schema: createTaskSchema,
    defaultValues: {
      title: '',
      description: '',
      status: initialStatus || workflow?.statuses?.[0]?.key || 'todo',
      priority: 'medium',
      type: 'task',
      dueDate: '',
      assigneeId: '',
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = form;

  const toggleListening = () => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

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
    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript;
      if (transcript) {
        const currentTitle = watch('title');
        setValue('title', currentTitle ? `${currentTitle} ${transcript}` : transcript);
      }
    };

    recognition.start();
  };

  const onSubmit = async (values: TaskCreateFormValues) => {
    try {
      await onCreate({
        ...values,
        title: values.title.trim(),
        description: values.description?.trim() || '',
        dueDate: values.dueDate || null,
        assigneeId: values.assigneeId || null,
      } as CreateTaskRequestDTO);
      onSuccess();
    } catch {
      // General error handling is handled by useAppMutation usually,
      // but here onCreate is passed as a prop.
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mb-8 rounded-lg border border-surface-border bg-surface-card shadow-luxe p-6"
    >
      {/* Form header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-surface-border">
        <div>
          <h3 className="text-base font-semibold text-[color:var(--color-ink)]">
            Tạo công việc mới
          </h3>
          <p className="text-sm text-[color:var(--color-muted)] mt-0.5">
            Điền thông tin và bấm Tạo để lưu
          </p>
        </div>
        {isListening && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 border border-rose-200 rounded-full">
            <div className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
            <span className="text-xs font-semibold text-rose-700">Đang nghe…</span>
          </div>
        )}
      </div>

      {/* Fields */}
      <div className="relative z-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Title — full width */}
        <div className="sm:col-span-2 lg:col-span-3">
          <FormField label="Tiêu đề công việc" error={errors.title?.message as string} required>
            <div className="relative">
              <FormInput
                {...register('title')}
                placeholder="Nhập tiêu đề công việc..."
                className="pr-14 h-12 text-sm"
                error={!!errors.title}
              />
              <button
                type="button"
                onClick={toggleListening}
                className={`absolute right-1.5 top-1/2 -translate-y-1/2 p-2 rounded-sm transition-colors ${
                  isListening
                    ? 'bg-rose-600 text-white'
                    : 'text-[color:var(--color-muted)] hover:text-brand-500 hover:bg-black/[0.04]'
                }`}
              >
                {isListening ? <Mic size={16} /> : <MicOff size={16} />}
              </button>
            </div>
          </FormField>
        </div>

        {/* Status */}
        <FormField label="Trạng thái" error={errors.status?.message as string}>
          <FormSelect {...register('status')} error={!!errors.status}>
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
          </FormSelect>
        </FormField>

        {/* Priority */}
        <FormField label="Độ ưu tiên" error={errors.priority?.message as string}>
          <FormSelect {...register('priority')} error={!!errors.priority}>
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </FormSelect>
        </FormField>

        {/* Type */}
        <FormField label="Loại công việc" error={errors.type?.message as string}>
          <FormSelect {...register('type')} error={!!errors.type}>
            {TASK_TYPE_OPTIONS.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
          </FormSelect>
        </FormField>

        {/* Due date */}
        <FormField label="Hạn hoàn thành" error={errors.dueDate?.message as string}>
          <FormInput
            type="date"
            {...register('dueDate')}
            className="dark-date-picker"
            error={!!errors.dueDate}
          />
        </FormField>

        {/* Assignee */}
        <FormField label="Người thực hiện" error={errors.assigneeId?.message as string}>
          <FormSelect {...register('assigneeId')} error={!!errors.assigneeId}>
            <option value="">-- Chưa giao --</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.fullName}
              </option>
            ))}
          </FormSelect>
        </FormField>

        {/* Description — full width */}
        <div className="sm:col-span-2 lg:col-span-3">
          <FormField label="Mô tả chi tiết" error={errors.description?.message as string}>
            <FormTextArea
              {...register('description')}
              rows={4}
              placeholder="Thêm mô tả chi tiết về công việc..."
              error={!!errors.description}
            />
          </FormField>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-8 flex items-center justify-end gap-3 pt-4 border-t border-surface-border">
        <button type="button" onClick={onCancel} className="btn-ghost px-6">
          Hủy
        </button>
        <button type="submit" disabled={isPending} className="btn-primary px-8">
          {isPending ? <Loader2 className="btn-spinner mr-2" /> : null}
          {isPending ? 'Đang tạo...' : 'Tạo công việc'}
        </button>
      </div>
    </form>
  );
}
