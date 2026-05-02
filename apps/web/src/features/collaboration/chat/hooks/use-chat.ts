import { useQuery, useInfiniteQuery } from '@tanstack/react-query';

import { useAppMutation } from '@/lib/hooks/use-app-mutation';
import { useEffect, useState } from 'react';
import type { Channel, Message } from '@superboard/shared';
import {
  getWorkspaceChannels,
  getChannelMessages,
  sendMessage,
  joinChannel,
  getThreadMessages,
  summarizeThread,
  createChannel,
  getOrCreateDm,
  findDm,
  getChannelMembers,
  updateChannel as updateChannelApi,
  leaveChannel as leaveChannelApi,
  addChannelMember as addChannelMemberApi,
} from '@/features/collaboration/chat/api/chat-service';
import { chatSocket } from '@/lib/realtime/chat-socket';
import type { WorkspaceMemberItemDTO } from '@superboard/shared';

export function useChannels(workspaceId: string | undefined) {
  return useQuery<Channel[]>({
    queryKey: ['channels', workspaceId],
    queryFn: () => getWorkspaceChannels(workspaceId!),
    enabled: !!workspaceId,
  });
}

export function useMessages(channelId: string | undefined) {
  const [realtimeMessages, setRealtimeMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<
    Record<string, { userId: string; isTyping: boolean }>
  >({});

  const query = useInfiniteQuery({
    queryKey: ['messages', channelId],
    queryFn: ({ pageParam }) => getChannelMessages(channelId!, pageParam as string),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
    enabled: !!channelId,
  });

  useEffect(() => {
    if (!channelId) return;

    chatSocket.connect();
    chatSocket.joinChannel(channelId);

    const unsubMsg = chatSocket.onMessage((message: Message) => {
      if (message.channelId === channelId) {
        setRealtimeMessages((prev) => upsertMessage(prev, message));
      }
    });

    const unsubUpdate = chatSocket.onMessageUpdated((message: Message) => {
      if (message.channelId === channelId) {
        setRealtimeMessages((prev) => upsertMessage(prev, message));
      }
    });

    const unsubDelete = chatSocket.onMessageDeleted(({ messageId }) => {
      setRealtimeMessages((prev) => prev.filter((m) => m.id !== messageId));
    });

    const unsubTyping = chatSocket.onTyping((data) => {
      if (data.channelId === channelId) {
        setTypingUsers((prev) => ({
          ...prev,
          [data.userId]: { userId: data.userId, isTyping: data.isTyping },
        }));
      }
    });

    return () => {
      unsubMsg();
      unsubUpdate();
      unsubDelete();
      unsubTyping();
      chatSocket.leaveChannel(channelId);
      setRealtimeMessages([]);
      setTypingUsers({});
    };
  }, [channelId]);

  const allPagesMessages = query.data?.pages.flatMap((page) => page.items) || [];
  const allMessages = mergeAndSortMessages(allPagesMessages, realtimeMessages);

  return {
    ...query,
    messages: allMessages,
    typingUsers: Object.values(typingUsers).filter((u) => u.isTyping),
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
  };
}

export function useSendMessage(channelId: string | undefined) {
  return useAppMutation({
    mutationFn: ({ content, parentId }: { content: string; parentId?: string }) =>
      sendMessage(channelId!, content, parentId),
    invalidateKeys: [['messages', channelId]],
  });
}

export function useJoinChannel() {
  return useAppMutation({
    mutationFn: (channelId: string) => joinChannel(channelId),
    // Joining happens implicitly on navigation; keep it silent to avoid noisy toasts.
    notifyOnSuccess: false,
    notifyOnError: false,
    invalidateKeys: [['channels']],
  });
}

export function useCreateChannel(workspaceId: string | undefined) {
  return useAppMutation({
    mutationFn: (input: { name: string; description?: string; type: 'PUBLIC' | 'PRIVATE' }) =>
      createChannel(workspaceId!, input),
    resource: 'Kênh',
    action: 'create',
    invalidateKeys: [['channels', workspaceId]],
  });
}

export function useGetOrCreateDm(workspaceId: string | undefined) {
  return useAppMutation({
    mutationFn: (otherUserId: string) => getOrCreateDm(workspaceId!, otherUserId),
    resource: 'Cuộc trò chuyện',
    action: 'create',
    invalidateKeys: [['channels', workspaceId]],
  });
}

export function useFindDm(workspaceId: string | undefined, otherUserId: string | undefined) {
  return useQuery<Channel | null>({
    queryKey: ['dm', workspaceId, otherUserId],
    queryFn: () => findDm(workspaceId!, otherUserId!),
    enabled: !!workspaceId && !!otherUserId,
  });
}

export function useChannelMembers(channelId: string | undefined) {
  return useQuery<WorkspaceMemberItemDTO[]>({
    queryKey: ['channel-members', channelId],
    queryFn: () => getChannelMembers(channelId!),
    enabled: !!channelId,
  });
}

export function useAddChannelMember(
  workspaceId: string | undefined,
  channelId: string | undefined,
) {
  return useAppMutation({
    mutationFn: (userId: string) => addChannelMemberApi(channelId!, userId),
    resource: 'Thành viên',
    action: 'create',
    invalidateKeys: [
      ['channel-members', channelId],
      ['channels', workspaceId],
    ],
  });
}

export function useUpdateChannel(workspaceId: string | undefined, channelId: string | undefined) {
  return useAppMutation({
    mutationFn: (input: { name?: string; description?: string }) =>
      updateChannelApi(channelId!, input),
    resource: 'Kênh',
    action: 'update',
    invalidateKeys: [['channels', workspaceId]],
  });
}

export function useLeaveChannel(workspaceId: string | undefined, channelId: string | undefined) {
  return useAppMutation({
    mutationFn: () => leaveChannelApi(channelId!),
    resource: 'Kênh',
    action: 'sync',
    invalidateKeys: [['channels', workspaceId]],
  });
}

export function useThreadMessages(messageId: string | undefined) {
  return useQuery<Message[]>({
    queryKey: ['messages', 'thread', messageId],
    queryFn: () => getThreadMessages(messageId!),
    enabled: !!messageId,
  });
}

export function useSummarizeThread() {
  return useAppMutation({
    mutationFn: (messageId: string) => summarizeThread(messageId),
    resource: 'Luồng chat',
    action: 'sync',
  });
}

function upsertMessage(messages: Message[], message: Message) {
  const existingIndex = messages.findIndex((m) => m.id === message.id);
  if (existingIndex === -1) return [...messages, message];
  const next = [...messages];
  next[existingIndex] = message;
  return next;
}

function mergeAndSortMessages(pageMessages: Message[], realtime: Message[]) {
  const byId = new Map<string, Message>();
  for (const m of pageMessages) byId.set(m.id, m);
  for (const m of realtime) byId.set(m.id, m);

  const merged = Array.from(byId.values());
  merged.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  return merged;
}
