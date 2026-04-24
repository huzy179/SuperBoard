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
  }, [initialValues]);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="relative mb-10 rounded-xl border border-white/8 bg-white/[0.02] p-10 shadow-inner backdrop-blur-3xl overflow-hidden animate-in fade-in slide-in-from-top-6 duration-500"
    >
      {/* Color aura */}
      <div
        className="absolute -right-20 -top-20 w-72 h-72 rounded-full blur-[100px] pointer-events-none opacity-15 transition-opacity duration-1000"
        style={{ backgroundColor: color }}
      />

      <div className="relative z-10 flex flex-col gap-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight text-glow">
              {isCreate ? 'Khởi tạo Node mới' : 'Cập nhật Operational Node'}
            </h2>
            <p className="text-[11px] text-white/30 mt-1 uppercase tracking-widest font-bold">
              {isCreate
                ? 'Thiết lập thông số cho dự án của bạn.'
                : 'Điều chỉnh cấu hình mạng lưới dự án.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-3 rounded-lg bg-white/[0.03] border border-white/8 text-white/20 hover:text-white hover:bg-white/[0.08] transition-all"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Project name — full width */}
          <div className="md:col-span-2">
            <FormField label="Tên dự án" error={errors.name?.message as string} required>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20">
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
            <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] p-2 pl-4 shadow-inner focus-within:border-brand-500/40 transition-all">
              <div
                className="h-9 w-9 rounded-xl flex-shrink-0 shadow-glow-sm"
                style={{ backgroundColor: color }}
              />
              <input
                {...register('color')}
                placeholder="#6366F1"
                className="flex-1 bg-transparent border-none text-sm font-mono font-black text-white placeholder:text-white/20 focus:ring-0 focus:outline-none uppercase"
              />
              <div className="relative h-10 w-10 overflow-hidden rounded-xl border border-white/10">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setValue('color', e.target.value)}
                  className="absolute -inset-2 h-16 w-16 cursor-pointer bg-transparent border-none opacity-0 z-10"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors pointer-events-none">
                  <Palette size={14} className="text-white/30" />
                </div>
              </div>
            </div>
          </FormField>

          {/* Description — full width */}
          <div className="md:col-span-2">
            <FormField label="Mô tả chiến lược" error={errors.description?.message as string}>
              <div className="relative">
                <div className="absolute left-4 top-4 text-white/20">
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
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-white/5">
          <AppButton variant="ghost" onClick={onCancel}>
            Hủy bỏ
          </AppButton>
          <AppButton
            type="submit"
            variant="white"
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
