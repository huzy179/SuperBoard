import type { ID } from './common.types';

export interface Message {
  id: ID;
  channelId: ID;
  senderId: ID;
  content: string;
  createdAt: string;
  updatedAt?: string;
}
