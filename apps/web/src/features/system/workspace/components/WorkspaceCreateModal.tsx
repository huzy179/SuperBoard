'use client';

import { z } from 'zod';
import { useCreateWorkspace } from '@/features/system/workspace/hooks/use-workspace-mutations';
import { useAppForm } from '@/lib/hooks/use-app-form';
import { FormField, FormInput } from '@/components/ui/form-controls';

const workspaceSchema = z.object({
  name: z.string().min(1, 'Tên Workspace không được để trống'),
  slug: z
    .string()
    .min(3, 'Slug phải có ít nhất 3 ký tự')
    .regex(/^[a-z0-9-]+$/, 'Slug chỉ được chứa chữ thường, số và dấu gạch ngang')
    .optional()
    .or(z.literal('')),
});

type WorkspaceFormValues = z.infer<typeof workspaceSchema>;

interface WorkspaceCreateModalProps {
  onClose: () => void;
  onSuccess?: (workspaceId: string) => void;
}

import { AppOverlay } from '@/components/ui/app-overlay';

import { AppButton } from '@/components/ui/app-button';
import { Globe } from 'lucide-react';

export function WorkspaceCreateModal({ onClose, onSuccess }: WorkspaceCreateModalProps) {
  const createMutation = useCreateWorkspace();

  const form = useAppForm({
    schema: workspaceSchema,
    defaultValues: {
      name: '',
      slug: '',
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  const onSubmit = async (values: WorkspaceFormValues) => {
    try {
      const result = await createMutation.mutateAsync({
        name: values.name.trim(),
        ...(values.slug?.trim() ? { slug: values.slug.trim() } : {}),
      });
      onSuccess?.(result.id);
      onClose();
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <AppOverlay
      isOpen={true}
      onClose={onClose}
      variant="modal"
      maxWidth="xl"
      title="Tạo Workspace mới"
      subtitle="Không gian làm việc chung cho team của bạn."
      footer={
        <div className="flex gap-3">
          <AppButton variant="ghost" onClick={onClose} className="flex-1">
            Hủy bỏ
          </AppButton>
          <AppButton
            form="ws-create-form"
            type="submit"
            variant="primary"
            isLoading={createMutation.isPending}
            leftIcon={<Globe size={14} />}
            className="flex-[2]"
            id="e2e-ws-submit-button"
          >
            Tạo Workspace
          </AppButton>
        </div>
      }
    >
      <form id="ws-create-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <FormField label="Tên Workspace" error={errors.name?.message} required>
          <FormInput
            {...register('name')}
            placeholder="VD: TechViet Solutions"
            autoFocus
            error={!!errors.name}
          />
        </FormField>

        <FormField label="Slug (tuỳ chọn)" error={errors.slug?.message}>
          <div className="flex items-center rounded-md border border-surface-border bg-surface-bg overflow-hidden focus-within:border-brand-500/40 transition-colors shadow-sm h-12">
            <span className="px-3 text-[11px] font-mono select-none border-r border-surface-border h-full flex items-center text-[color:var(--color-muted)] bg-black/[0.02]">
              workspace/
            </span>
            <input
              {...register('slug')}
              placeholder="alpha-sector-01"
              className="flex-1 bg-transparent px-3 py-2 text-sm font-medium text-[color:var(--color-ink)] placeholder:text-[color:var(--color-faint)] focus:outline-none"
              onChange={(e) => {
                const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                form.setValue('slug', value);
              }}
            />
          </div>
        </FormField>
      </form>
    </AppOverlay>
  );
}
