import type { ID } from './common.types';

export interface Project {
  id: ID;
  name: string;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
  key?: string | null;
  isArchived: boolean;
  workspaceId: ID;
  createdAt: string;
  updatedAt: string;
}
