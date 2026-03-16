export type UserRole = 'owner' | 'admin' | 'member' | 'viewer';

export type ID = string;

export interface User {
  id: ID;
  email: string;
  fullName: string;
  role: UserRole;
  workspaceId: ID;
  createdAt: string;
  updatedAt: string;
}

export interface Workspace {
  id: ID;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: ID;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done' | 'cancelled';
  assigneeId?: ID;
  projectId: ID;
  workspaceId: ID;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: ID;
  channelId: ID;
  senderId: ID;
  content: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Doc {
  id: ID;
  workspaceId: ID;
  ownerId: ID;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiMeta {
  requestId?: string;
  timestamp: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta: ApiMeta;
}
