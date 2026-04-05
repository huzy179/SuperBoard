import type { ProjectItemDTO, ProjectTaskItemDTO } from './project.dto';

export interface SearchResponseDTO {
  tasks: ProjectTaskItemDTO[];
  projects: ProjectItemDTO[];
}
