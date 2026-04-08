import { io, Socket } from 'socket.io-client';
import { getAccessToken } from '../auth-storage';
import type { Message } from '@superboard/shared';

export type ChatSocketEvents = {
  'message:sent': (message: Message) => void;
  'chat:typing': (data: { channelId: string; userId: string; isTyping: boolean }) => void;
};

export type ChatSocketEmitEvents = {
  'channel:join': (payload: { channelId: string }) => void;
  'channel:leave': (payload: { channelId: string }) => void;
  'chat:typing': (payload: { channelId: string; userId: string; isTyping: boolean }) => void;
};

class ChatSocketManager {
  private socket: Socket<ChatSocketEvents, ChatSocketEmitEvents> | null = null;
  private currentChannelId: string | null = null;

  connect() {
    if (this.socket?.connected) return;

    const token = getAccessToken();
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

    this.socket = io(`${baseUrl}/chat`, {
      auth: { token },
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('Chat socket connected');
      if (this.currentChannelId) {
        this.joinChannel(this.currentChannelId);
      }
    });

    this.socket.on('disconnect', () => {
      console.log('Chat socket disconnected');
    });
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }

  joinChannel(channelId: string) {
    if (this.currentChannelId && this.currentChannelId !== channelId) {
      this.leaveChannel(this.currentChannelId);
    }
    this.currentChannelId = channelId;
    this.socket?.emit('channel:join', { channelId });
  }

  leaveChannel(channelId: string) {
    this.socket?.emit('channel:leave', { channelId });
    if (this.currentChannelId === channelId) {
      this.currentChannelId = null;
    }
  }

  sendTyping(channelId: string, userId: string, isTyping: boolean) {
    this.socket?.emit('chat:typing', { channelId, userId, isTyping });
  }

  onMessage(handler: (message: Message) => void) {
    this.socket?.on('message:sent', handler);
    return () => this.socket?.off('message:sent', handler);
  }

  onTyping(handler: (data: { channelId: string; userId: string; isTyping: boolean }) => void) {
    this.socket?.on('chat:typing', handler);
    return () => this.socket?.off('chat:typing', handler);
  }
}

export const chatSocket = new ChatSocketManager();
