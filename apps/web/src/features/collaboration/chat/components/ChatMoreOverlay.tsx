'use client';

import { AppOverlay } from '@/components/ui/app-overlay';
import { AppButton } from '@/components/ui/app-button';
import { Link2, LogOut, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { FormField, FormInput } from '@/components/ui/form-controls';
import { useMemo, useState } from 'react';
import { useLeaveChannel, useUpdateChannel } from '@/features/collaboration/chat/hooks/use-chat';
import { useRouter } from 'next/navigation';

export function ChatMoreOverlay({
  isOpen,
  onClose,
  channelId,
  workspaceId,
  channelName,
}: {
  isOpen: boolean;
  onClose: () => void;
  channelId: string;
  workspaceId: string;
  channelName: string;
}) {
  const router = useRouter();
  const isDm = channelName.startsWith('dm:');
  const channelLink =
    typeof window !== 'undefined' ? `${window.location.origin}/chat/${channelId}` : '';

  const updateChannelMutation = useUpdateChannel(workspaceId, channelId);
  const leaveChannelMutation = useLeaveChannel(workspaceId, channelId);

  const [name, setName] = useState(() => channelName);
  const [confirmLeave, setConfirmLeave] = useState(() => '');

  const nameError = useMemo(() => {
    if (isDm) return null;
    const trimmed = name.trim();
    if (!trimmed) return 'Tên kênh không được để trống';
    if (trimmed.length < 2) return 'Tên kênh quá ngắn';
    if (trimmed.length > 60) return 'Tên kênh quá dài';
    return null;
  }, [isDm, name]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(channelLink);
      toast.success('Đã copy link kênh');
      onClose();
    } catch {
      toast.error('Không thể copy link');
    }
  };

  const handleRename = () => {
    if (isDm) return;
    const trimmed = name.trim();
    if (nameError) return;

    updateChannelMutation.mutate(
      { name: trimmed },
      {
        onSuccess: () => {
          toast.success('Đã cập nhật tên kênh');
          onClose();
        },
        onError: (e) =>
          toast.error(
            String((e as { message?: string } | undefined)?.message || 'Không thể cập nhật kênh'),
          ),
      },
    );
  };

  const handleLeave = () => {
    leaveChannelMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success('Đã rời kênh');
        onClose();
        router.push('/chat');
      },
      onError: (e) =>
        toast.error(
          String((e as { message?: string } | undefined)?.message || 'Không thể rời kênh'),
        ),
    });
  };

  return (
    <AppOverlay
      isOpen={isOpen}
      onClose={onClose}
      title="Tuỳ chọn"
      subtitle="Các thao tác nhanh cho kênh hiện tại."
      variant="modal"
      maxWidth="lg"
    >
      <div className="space-y-4">
        <section className="rounded-lg border border-surface-border/60 bg-surface-bg p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-[color:var(--color-ink)]">Link kênh</div>
              <div className="mt-0.5 text-xs text-[color:var(--color-muted)]">
                Chia sẻ nhanh trong nội bộ workspace.
              </div>
            </div>
            <AppButton
              variant="secondary"
              size="sm"
              onClick={handleCopyLink}
              leftIcon={<Link2 size={14} />}
            >
              Copy
            </AppButton>
          </div>

          <div className="mt-3 rounded-md border border-surface-border bg-white px-3 py-2">
            <div
              className="select-all truncate font-mono text-[12px] text-[color:var(--color-ink)]"
              title={channelLink}
            >
              {channelLink}
            </div>
          </div>
        </section>

        {!isDm ? (
          <section className="rounded-lg border border-surface-border/60 bg-surface-bg p-4">
            <div className="text-sm font-semibold text-[color:var(--color-ink)]">Quản lý kênh</div>
            <div className="mt-3 space-y-3">
              <FormField label="Đổi tên kênh" error={nameError}>
                <div className="flex items-center gap-2">
                  <FormInput
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    data-testid="channel-rename-input"
                  />
                  <AppButton
                    variant="secondary"
                    size="sm"
                    onClick={handleRename}
                    isLoading={updateChannelMutation.isPending}
                    disabled={!!nameError || name.trim() === channelName}
                    leftIcon={<Pencil size={14} />}
                    data-testid="channel-rename-save"
                  >
                    Lưu
                  </AppButton>
                </div>
              </FormField>

              <div className="rounded-md border border-rose-200 bg-rose-50 p-3">
                <div className="text-xs font-bold uppercase tracking-wider text-rose-700">
                  Rời kênh
                </div>
                <div className="mt-1 text-xs text-rose-800/80">
                  Nhập <span className="font-bold">leave</span> để xác nhận.
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <FormInput
                    value={confirmLeave}
                    onChange={(e) => setConfirmLeave(e.target.value)}
                    placeholder="leave"
                    className="bg-white"
                    data-testid="channel-leave-confirm"
                  />
                  <AppButton
                    variant="danger"
                    size="sm"
                    onClick={handleLeave}
                    isLoading={leaveChannelMutation.isPending}
                    disabled={confirmLeave.trim().toLowerCase() !== 'leave'}
                    leftIcon={<LogOut size={14} />}
                    data-testid="channel-leave-submit"
                  >
                    Rời
                  </AppButton>
                </div>
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </AppOverlay>
  );
}
