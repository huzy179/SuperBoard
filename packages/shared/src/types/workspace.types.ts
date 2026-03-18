import type { ID } from './common.types';

export interface Workspace {
  id: ID;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}
