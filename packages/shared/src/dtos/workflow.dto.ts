import type { ApiResponse } from '../types/common.types';

export interface ArchiveWorkspaceRequestDTO {
  workspaceId: string;
}

export interface RestoreWorkspaceRequestDTO {
  workspaceId: string;
}

export interface ArchiveProjectRequestDTO {
  projectId: string;
}

export interface RestoreProjectRequestDTO {
  projectId: string;
}

export interface ArchiveTaskRequestDTO {
  taskId: string;
}

export interface RestoreTaskRequestDTO {
  taskId: string;
}

export interface WorkflowListFilterRequestDTO {
  showArchived?: boolean;
}

export interface LifecycleOperationResultDTO {
  archived: boolean;
}

export type ArchiveWorkspaceResponseDTO = ApiResponse<LifecycleOperationResultDTO>;
export type RestoreWorkspaceResponseDTO = ApiResponse<LifecycleOperationResultDTO>;

export type ArchiveProjectResponseDTO = ApiResponse<LifecycleOperationResultDTO>;
export type RestoreProjectResponseDTO = ApiResponse<LifecycleOperationResultDTO>;

export type ArchiveTaskResponseDTO = ApiResponse<LifecycleOperationResultDTO>;
export type RestoreTaskResponseDTO = ApiResponse<LifecycleOperationResultDTO>;

/**
 * Status Categories map to canonical workflow stages
 */
export type WorkflowStatusCategory = 'todo' | 'in_progress' | 'in_review' | 'done' | 'blocked';

export interface WorkflowStatusDTO {
  id: string;
  key: string;
  name: string;
  category: WorkflowStatusCategory;
  position: number;
  isSystem: boolean;
}

export interface WorkflowTransitionDTO {
  fromStatusId: string;
  toStatusId: string;
}

export interface CreateWorkflowStatusRequestDTO {
  key: string;
  name: string;
  category: WorkflowStatusCategory;
  position?: number;
}

export interface UpdateWorkflowStatusRequestDTO {
  name?: string;
  category?: WorkflowStatusCategory;
  position?: number;
}

export interface WorkflowStatusTemplateDTO {
  statuses: WorkflowStatusDTO[];
  transitions: WorkflowTransitionDTO[];
}

export interface UpdateTransitionsRequestDTO {
  transitions: WorkflowTransitionDTO[];
}

export interface DeleteStatusRequestDTO {
  migrateToId: string;
}
