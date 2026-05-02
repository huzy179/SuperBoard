'use client';

import { useParams } from 'next/navigation';
import { useWorkspaces } from '@/features/system/workspace/hooks/use-workspaces';
import { useWorkspaceMembers } from '@/features/system/workspace/hooks/use-workspace';
import { SectionSkeleton, FullPageError } from '@/components/ui/page-states';
import { DmChatShell } from '@/features/collaboration/chat/components/DmChatShell';

export default function DmPage() {
  const params = useParams<{ userId: string }>();
  const otherUserId = params.userId;

  const { data: workspaces, isLoading: workspacesLoading } = useWorkspaces();
  const activeWorkspace = workspaces?.[0];
  const { data: members, isLoading: membersLoading } = useWorkspaceMembers(activeWorkspace?.id);

  if (workspacesLoading || membersLoading) return <SectionSkeleton rows={15} />;

  if (!activeWorkspace) {
    return (
      <FullPageError
        title="Không có workspace"
        message="Vui lòng chọn workspace trước khi sử dụng chat."
        actionLabel="Về Dashboard"
        onAction={() => (window.location.href = '/dashboard')}
      />
    );
  }

  const otherMember = members?.find((m) => m.userId === otherUserId);
  if (!otherMember) {
    return (
      <FullPageError
        title="Không tìm thấy người dùng"
        message="Người dùng không thuộc workspace hoặc đã bị xoá."
        actionLabel="Về Chat"
        onAction={() => (window.location.href = '/chat')}
      />
    );
  }

  return (
    <DmChatShell
      workspaceId={activeWorkspace.id}
      otherUserId={otherUserId}
      otherUserName={otherMember.fullName}
    />
  );
}
