import type { Project } from '../types/project.types';
import type { ApiResponse } from '../types/common.types';

export type ProjectItemDTO = Pick<
  Project,
  'id' | 'name' | 'description' | 'color' | 'icon' | 'createdAt' | 'updatedAt'
> & {
  taskCount: number;
  doneTaskCount: number;
};

export type ProjectsResponseDTO = ApiResponse<ProjectItemDTO[]>;

export type TaskPriorityDTO = 'low' | 'medium' | 'high' | 'urgent';

export interface ProjectTaskItemDTO {
  id: string;
  title: string;
  description?: string | null;
  status: 'todo' | 'in_progress' | 'in_review' | 'done' | 'cancelled';
  priority: TaskPriorityDTO;
  dueDate?: string | null;
  assigneeId?: string | null;
  assigneeName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectDetailDTO extends ProjectItemDTO {
  tasks: ProjectTaskItemDTO[];
}

export type ProjectDetailResponseDTO = ApiResponse<ProjectDetailDTO>;

export interface CreateTaskRequestDTO {
  title: string;
  description?: string;
  status?: 'todo' | 'in_progress' | 'in_review' | 'done' | 'cancelled';
  priority?: TaskPriorityDTO;
  dueDate?: string | null;
  assigneeId?: string | null;
}

export type CreateTaskResponseDTO = ApiResponse<ProjectTaskItemDTO>;

export interface UpdateTaskStatusRequestDTO {
  status: 'todo' | 'in_progress' | 'in_review' | 'done' | 'cancelled';
}

export type UpdateTaskStatusResponseDTO = ApiResponse<ProjectTaskItemDTO>;

export interface UpdateTaskRequestDTO {
  title?: string;
  description?: string;
  status?: 'todo' | 'in_progress' | 'in_review' | 'done' | 'cancelled';
  priority?: TaskPriorityDTO;
  dueDate?: string | null;
  assigneeId?: string | null;
}

export type UpdateTaskResponseDTO = ApiResponse<ProjectTaskItemDTO>;

export type DeleteTaskResponseDTO = ApiResponse<{ deleted: boolean }>;

export interface CreateProjectRequestDTO {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}

export type CreateProjectResponseDTO = ApiResponse<ProjectItemDTO>;

export interface UpdateProjectRequestDTO {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
}

export type UpdateProjectResponseDTO = ApiResponse<ProjectItemDTO>;

export type DeleteProjectResponseDTO = ApiResponse<{ deleted: boolean }>;

export type ArchiveProjectResponseDTO = ApiResponse<{ archived: boolean }>;

export type RestoreProjectResponseDTO = ApiResponse<{ archived: boolean }>;

export type ArchiveTaskResponseDTO = ApiResponse<{ archived: boolean }>;

export type RestoreTaskResponseDTO = ApiResponse<{ archived: boolean }>;

// Comment DTOs

export interface CommentItemDTO {
  id: string;
  taskId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentRequestDTO {
  content: string;
}

export interface UpdateCommentRequestDTO {
  content: string;
}

export type CommentListResponseDTO = ApiResponse<CommentItemDTO[]>;

export type CreateCommentResponseDTO = ApiResponse<CommentItemDTO>;

export type UpdateCommentResponseDTO = ApiResponse<CommentItemDTO>;

export type DeleteCommentResponseDTO = ApiResponse<{ deleted: boolean }>;
