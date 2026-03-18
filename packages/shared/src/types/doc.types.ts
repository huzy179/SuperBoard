import type { ID } from './common.types';

export interface Doc {
  id: ID;
  workspaceId: ID;
  ownerId: ID;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}
