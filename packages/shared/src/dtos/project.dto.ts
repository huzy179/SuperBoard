import type { Project } from '../types/project.types';
import type { ApiResponse } from '../types/common.types';

export type ProjectItemDTO = Pick<
  Project,
  'id' | 'name' | 'description' | 'color' | 'icon' | 'createdAt' | 'updatedAt'
>;

export type ProjectsResponseDTO = ApiResponse<ProjectItemDTO[]>;

export interface CreateProjectRequestDTO {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}

export type CreateProjectResponseDTO = ApiResponse<ProjectItemDTO>;
