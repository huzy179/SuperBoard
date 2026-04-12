'use client';

import { useParams } from 'next/navigation';
import { useChannels } from '@/features/chat/hooks/use-chat';
import { useWorkspaces } from '@/features/workspace/hooks/use-workspaces';
import { ChatShell } from '@/features/chat/components/ChatShell';
import { SectionSkeleton, FullPageError } from '@/components/ui/page-states';

export default function ChannelPage() {
  const params = useParams<{ channelId: string }>();
  const { data: workspaces, isLoading: workspacesLoading } = useWorkspaces();
  const activeWorkspace = workspaces?.[0]; // Defaulting to first for now
  const {
    data: channels,
    isLoading: channelsLoading,
    isError,
    error,
  } = useChannels(activeWorkspace?.id);

  if (workspacesLoading || channelsLoading) {
    return <SectionSkeleton rows={15} />;
  }

  if (isError) {
    return (
      <FullPageError
        title="Lỗi tải kênh"
        message={error?.message || 'Không thể tải thông tin kênh'}
        actionLabel="Thử lại"
        onAction={() => window.location.reload()}
      />
    );
  }

  const currentChannel = channels?.find((c) => c.id === params.channelId);

  if (!currentChannel) {
    return (
      <FullPageError
        title="Kênh không tồn tại"
        message="Vui lòng chọn một kênh khác từ danh sách."
        actionLabel="Về Chat chính"
        onAction={() => (window.location.href = '/chat')}
      />
    );
  }

  return <ChatShell channel={currentChannel} />;
}
