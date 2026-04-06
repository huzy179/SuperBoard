import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import type { Channel, Message } from '@superboard/shared';
import {
  getWorkspaceChannels,
  getChannelMessages,
  sendMessage,
  joinChannel,
} from '@/lib/services/chat-service';
import { chatSocket } from '@/lib/realtime/chat-socket';
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

  const query = useQuery({
    queryKey: ['messages', channelId],
    queryFn: () => getChannelMessages(channelId!),
    enabled: !!channelId,
  });

  useEffect(() => {
    if (!channelId) return;

    chatSocket.connect();
    chatSocket.joinChannel(channelId);

    const unsubscribe = chatSocket.onMessage((message) => {
      if (message.channelId === channelId) {
        setRealtimeMessages((prev) => [message, ...prev]);
      }
    });

    return () => {
      unsubscribe();
      chatSocket.leaveChannel(channelId);
      setRealtimeMessages([]);
    };
  }, [channelId]);

  const allMessages = [...realtimeMessages, ...(query.data?.items || [])];

  return {
    ...query,
    messages: allMessages,
    nextCursor: query.data?.nextCursor,
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
