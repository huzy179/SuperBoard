'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkspaces } from '@/features/workspace/hooks/use-workspaces';
import { useChannels } from '@/features/chat/hooks/use-chat';
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
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-slate-50/20">
        <div className="w-16 h-16 mb-4 rounded-full bg-brand-100 flex items-center justify-center">
          <span className="text-2xl text-brand-600">💬</span>
        </div>
        <h3 className="text-lg font-bold text-slate-800">Chào mừng đến với Trò chuyện!</h3>
        <p className="mt-2 text-slate-500 max-w-sm">
          Hãy tạo một kênh mới để bắt đầu thảo luận với nhóm của bạn.
        </p>
        <button className="mt-6 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors shadow-sm">
          + Tạo kênh đầu tiên
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full items-center justify-center p-8 bg-slate-50/20">
      <div className="flex flex-col items-center">
        <div className="animate-bounce mb-4 text-4xl">🚀</div>
        <p className="text-slate-500 font-medium">Đang chuyển đến kênh thảo luận...</p>
      </div>
    </div>
  );
}
