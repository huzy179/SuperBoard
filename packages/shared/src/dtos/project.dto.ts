import type { Project } from '../types/project.types';
import type { ApiResponse } from '../types/common.types';

export type ProjectItemDTO = Pick<
  Project,
  'id' | 'name' | 'description' | 'color' | 'icon' | 'createdAt' | 'updatedAt'
>;

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
