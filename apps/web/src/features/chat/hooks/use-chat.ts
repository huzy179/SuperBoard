import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import type { Channel, Message } from '@superboard/shared';
import {
  getWorkspaceChannels,
  getChannelMessages,
  sendMessage,
  joinChannel,
  summarizeThread,
} from '@/features/chat/api/chat-service';
import { chatSocket } from '@/lib/realtime/chat-socket';
import { apiGet } from '@/lib/api-client';
import { toast } from 'sonner';

export function useChannels(workspaceId: string | undefined) {
  return useQuery<Channel[]>({
    queryKey: ['channels', workspaceId],
    queryFn: () => getWorkspaceChannels(workspaceId!),
    enabled: !!workspaceId,
  });
}

export function useMessages(channelId: string | undefined) {
  const [realtimeMessages, setRealtimeMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<string, { userId: string; isTyping: boolean }>>({});

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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ content, parentId }: { content: string; parentId?: string }) =>
      sendMessage(channelId!, content, parentId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['messages', channelId] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Lỗi khi gửi tin nhắn');
    },
  });
}

export function useJoinChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (channelId: string) => joinChannel(channelId),
    onSuccess: () => {
      toast.success('Đã tham gia kênh');
      void queryClient.invalidateQueries({ queryKey: ['channels'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Lỗi khi tham gia kênh');
    },
  });
}
