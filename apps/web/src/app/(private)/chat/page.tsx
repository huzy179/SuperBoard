'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkspaces } from '@/features/system/workspace/hooks/use-workspaces';
import { useChannels } from '@/features/collaboration/chat/hooks/use-chat';
import { SectionSkeleton } from '@/components/ui/page-states';

export default function ChatHomePage() {
  const router = useRouter();
  const { data: workspaces, isLoading: workspacesLoading } = useWorkspaces();
  const activeWorkspace = workspaces?.[0];
  const { data: channels, isLoading: channelsLoading } = useChannels(activeWorkspace?.id);

  useEffect(() => {
    if (channels && channels.length > 0) {
      const firstChannel = channels[0];
      if (firstChannel) {
        router.replace(`/chat/${firstChannel.id}`);
      }
    }
  }, [channels, router]);

  if (workspacesLoading || channelsLoading) {
    return <SectionSkeleton rows={10} />;
  }

  if (!channels || channels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-surface-bg">
        <div className="w-16 h-16 mb-4 rounded-full bg-brand-50 border border-brand-200 flex items-center justify-center">
          <span className="text-2xl text-brand-700">💬</span>
        </div>
        <h3 className="text-lg font-semibold text-[color:var(--color-ink)]">
          Chào mừng đến với Trò chuyện
        </h3>
        <p className="mt-2 text-[color:var(--color-muted)] max-w-sm leading-relaxed">
          Hãy tạo một kênh mới để bắt đầu thảo luận với nhóm của bạn.
        </p>
        <button type="button" className="mt-6 btn btn-primary">
          + Tạo kênh đầu tiên
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full items-center justify-center p-8 bg-surface-bg">
      <div className="flex flex-col items-center">
        <div className="mb-4 text-4xl opacity-80">🚀</div>
        <p className="text-[color:var(--color-muted)] font-medium">
          Đang chuyển đến kênh thảo luận…
        </p>
      </div>
    </div>
  );
}
