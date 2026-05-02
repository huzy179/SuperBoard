'use client';

import { useMemo, useState } from 'react';
import { AppOverlay } from '@/components/ui/app-overlay';
import { AppButton } from '@/components/ui/app-button';
import { FormField, FormInput, FormSelect, FormTextArea } from '@/components/ui/form-controls';
import { useCreateChannel } from '@/features/collaboration/chat/hooks/use-chat';
import { useRouter } from 'next/navigation';

export function CreateChannelOverlay({
  isOpen,
  onClose,
  workspaceId,
  defaultType = 'PUBLIC',
  prefillName,
  prefillDescription,
}: {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string | undefined;
  defaultType?: 'PUBLIC' | 'PRIVATE';
  prefillName?: string;
  prefillDescription?: string;
}) {
  const router = useRouter();
  const createChannelMutation = useCreateChannel(workspaceId);

  const [name, setName] = useState(() => prefillName || '');
  const [description, setDescription] = useState(() => prefillDescription || '');
  const [type, setType] = useState<'PUBLIC' | 'PRIVATE'>(() => defaultType);

  const nameError = useMemo(() => {
    if (!name.trim()) return 'Tên kênh là bắt buộc';
    if (name.trim().length < 2) return 'Tên kênh quá ngắn';
    return null;
  }, [name]);

  const canSubmit = !!workspaceId && !nameError && !createChannelMutation.isPending;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const payload: { name: string; type: 'PUBLIC' | 'PRIVATE'; description?: string } = {
      name: name.trim(),
      type,
    };
    const trimmedDescription = description.trim();
    if (trimmedDescription) payload.description = trimmedDescription;
    createChannelMutation.mutate(payload, {
      onSuccess: (channel) => {
        onClose();
        router.push(`/chat/${channel.id}`);
      },
    });
  };

  return (
    <AppOverlay
      isOpen={isOpen}
      onClose={onClose}
      title="Tạo kênh mới"
      subtitle="Tạo kênh để trao đổi nhanh như Slack. Kênh riêng tư chỉ hiển thị với người được mời (backend cần hỗ trợ quyền)."
      variant="modal"
      maxWidth="lg"
      footer={
        <div className="flex items-center justify-end gap-2">
          <AppButton variant="ghost" onClick={onClose}>
            Hủy
          </AppButton>
          <AppButton
            variant="primary"
            onClick={handleSubmit}
            isLoading={createChannelMutation.isPending}
            disabled={!canSubmit}
            data-testid="create-channel-submit"
          >
            Tạo kênh
          </AppButton>
        </div>
      }
    >
      <div className="space-y-4">
        <FormField label="Tên kênh" error={nameError} required>
          <FormInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="vd: general, dev, product…"
            autoFocus
            data-testid="create-channel-name"
          />
        </FormField>

        <FormField label="Mô tả (tuỳ chọn)">
          <FormTextArea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Mục đích kênh…"
            rows={3}
          />
        </FormField>

        <FormField label="Loại kênh">
          <FormSelect
            value={type}
            onChange={(e) => setType(e.target.value as 'PUBLIC' | 'PRIVATE')}
            data-testid="create-channel-type"
          >
            <option value="PUBLIC">Công khai</option>
            <option value="PRIVATE">Riêng tư</option>
          </FormSelect>
        </FormField>

        {createChannelMutation.error ? (
          <div className="rounded-sm border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
            {String(
              (createChannelMutation.error as { message?: string } | undefined)?.message ||
                'Không thể tạo kênh. Vui lòng thử lại.',
            )}
          </div>
        ) : null}
      </div>
    </AppOverlay>
  );
}
