import type { ID } from './common.types';

export type ChannelType = 'PUBLIC' | 'PRIVATE';

export interface Channel {
  id: ID;
  workspaceId: ID;
  name: string;
  description?: string | null;
  type: ChannelType;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: ID;
  channelId: ID;
  authorId: ID;
  author?: {
    id: ID;
    fullName: string;
    avatarUrl?: string | null;
  };
  content: string;
  parentId?: string | null;
  editedAt?: string | null;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChannelMember {
  id: ID;
  channelId: ID;
  userId: ID;
  lastReadAt: string;
  joinedAt: string;
}
