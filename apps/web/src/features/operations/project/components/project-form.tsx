'use client';

import { useEffect } from 'react';
import { z } from 'zod';
import { Edit3, Palette, X, Check, Files } from 'lucide-react';
import { useAppForm } from '@/lib/hooks/use-app-form';
import { FormField, FormInput, FormTextArea } from '@/components/ui/form-controls';
import { AppButton } from '@/components/ui/app-button';

const projectSchema = z.object({
  name: z.string().min(1, 'Tên dự án không được để trống'),
  description: z.string(),
  icon: z.string(),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Màu sắc không hợp lệ'),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

type ProjectFormProps = {
  mode: 'create' | 'edit';

  initialValues?: Partial<ProjectFormValues>;
  isPending: boolean;
  onCancel: () => void;
  onSubmit: (values: ProjectFormValues) => Promise<void>;
};

export function ProjectForm({
  mode,
  initialValues,
  isPending,
  onCancel,
  onSubmit,
}: ProjectFormProps) {
  const isCreate = mode === 'create';

  const form = useAppForm({
    schema: projectSchema,
    defaultValues: {
      name: initialValues?.name || '',
      description: initialValues?.description || '',
      icon: initialValues?.icon || '🚀',
      color: initialValues?.color || '#6366f1',
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = form;
  const color = watch('color');
  const icon = watch('icon');

  // Sync initial values if they change (for edit mode)
  useEffect(() => {
    if (initialValues) {
      form.reset({
        name: initialValues.name || '',
        description: initialValues.description || '',
        icon: initialValues.icon || '🚀',
        color: initialValues.color || '#6366f1',
      });
    }
  }, [initialValues, form]);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="relative mb-10 rounded-xl border border-surface-border bg-surface-card p-8 shadow-luxe overflow-hidden"
    >
      <div
        className="absolute -right-24 -top-24 h-64 w-64 rounded-full pointer-events-none opacity-[0.06]"
        style={{ backgroundColor: color }}
        aria-hidden
      />

      <div className="relative z-10 flex flex-col gap-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-[color:var(--color-ink)] tracking-tight">
              {isCreate ? 'Tạo dự án mới' : 'Cập nhật dự án'}
            </h2>
            <p className="text-sm text-[color:var(--color-muted)] mt-1 leading-relaxed">
              {isCreate
                ? 'Thiết lập thông số cho dự án của bạn.'
                : 'Điều chỉnh cấu hình mạng lưới dự án.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-2.5 rounded-md bg-black/[0.02] border border-surface-border text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)] hover:bg-black/[0.04] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Project name — full width */}
          <div className="md:col-span-2">
            <FormField label="Tên dự án" error={errors.name?.message as string} required>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--color-faint)]">
                  <Edit3 size={16} />
                </div>
                <FormInput
                  {...register('name')}
                  placeholder={isCreate ? 'VD: Neural OS, Global Operations...' : undefined}
                  className="pl-12 h-14 text-base"
                  error={!!errors.name}
                />
              </div>
            </FormField>
          </div>

          {/* Icon */}
          <FormField label="Biểu tượng (Emoji)" error={errors.icon?.message as string}>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xl pointer-events-none">
                {icon || '🚀'}
              </div>
              <FormInput
                {...register('icon')}
                placeholder="🚀"
                className="pl-12 h-14"
                error={!!errors.icon}
              />
            </div>
          </FormField>

          {/* Color */}
          <FormField label="Màu sắc đại diện" error={errors.color?.message as string}>
            <div className="flex items-center gap-3">
              <div
                className="h-10 w-10 rounded-lg border border-surface-border bg-black/[0.02]"
                style={{ backgroundColor: color }}
                aria-hidden
              />
              <FormInput
                {...register('color')}
                placeholder="#0075de"
                className="h-14 font-mono"
                error={!!errors.color}
              />
              <div className="relative h-14 w-14 overflow-hidden rounded-lg border border-surface-border bg-black/[0.02]">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setValue('color', e.target.value)}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  aria-label="Pick color"
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-[color:var(--color-muted)]">
                  <Palette size={16} />
                </div>
              </div>
            </div>
          </FormField>

          {/* Description — full width */}
          <div className="md:col-span-2">
            <FormField label="Mô tả chiến lược" error={errors.description?.message as string}>
              <div className="relative">
                <div className="absolute left-4 top-4 text-[color:var(--color-faint)]">
                  <Files size={16} />
                </div>
                <FormTextArea
                  {...register('description')}
                  rows={4}
                  placeholder={
                    isCreate ? 'Mục tiêu và phạm vi hoạt động của node này...' : undefined
                  }
                  className="pl-12"
                  error={!!errors.description}
                />
              </div>
            </FormField>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-surface-border">
          <AppButton variant="ghost" onClick={onCancel}>
            Hủy bỏ
          </AppButton>
          <AppButton
            type="submit"
            variant="primary"
            isLoading={isPending}
            leftIcon={<Check size={14} />}
          >
            {isCreate ? 'Initialize Node' : 'Save Protocols'}
          </AppButton>
        </div>
      </div>
    </form>
  );
}
