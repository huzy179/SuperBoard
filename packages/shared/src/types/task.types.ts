import type { ID } from './common.types';

export interface Task {
  id: ID;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'in_review' | 'done' | 'cancelled';
  assigneeId?: ID;
  projectId: ID;
  workspaceId: ID;
  createdAt: string;
  updatedAt: string;
}
