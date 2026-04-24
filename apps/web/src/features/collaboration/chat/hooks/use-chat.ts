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
} from '@/features/collaboration/chat/api/chat-service';
import { chatSocket } from '@/lib/realtime/chat-socket';

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
        setRealtimeMessages((prev) => [message, ...prev]);
      }
    });

    const unsubUpdate = chatSocket.onMessageUpdated((message: Message) => {
      if (message.channelId === channelId) {
        setRealtimeMessages((prev) => prev.map((m) => (m.id === message.id ? message : m)));
        // Also update react-query cache
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
  // Merge and deduplicate (realtime messages take precedence)
  const allMessages = [...realtimeMessages];
  allPagesMessages.forEach((m) => {
    if (!allMessages.find((rm) => rm.id === m.id)) {
      allMessages.push(m);
    }
  });

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
    resource: 'Kênh',
    action: 'sync',
    invalidateKeys: [['channels']],
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
