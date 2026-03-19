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
