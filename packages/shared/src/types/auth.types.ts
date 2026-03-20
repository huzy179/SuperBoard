import type { ID } from './common.types';

export type UserRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface User {
  id: ID;
  email: string;
  fullName: string;
  avatarColor?: string | null;
  defaultWorkspaceId?: ID | null;
  role?: UserRole;
  workspaceId?: ID;
  createdAt?: string;
  updatedAt?: string;
}
