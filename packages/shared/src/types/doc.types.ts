import type { ID } from './common.types';

export interface Doc {
  id: ID;
  workspaceId: ID;
  title: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content: any; // TipTap JSON
  isPublic?: boolean;
  shareToken?: string | null;
  parentDocId: ID | null;
  createdById: ID;
  creator?: {
    id: ID;
    fullName: string;
    avatarUrl?: string | null;
  };
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  children?: Doc[];
}

export interface DocVersion {
  id: ID;
  docId: ID;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content: any;
  savedAt: string;
}
