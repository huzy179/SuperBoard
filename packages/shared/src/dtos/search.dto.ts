import type { ProjectItemDTO, ProjectTaskItemDTO } from './project.dto';
import type { DocItemDTO } from './doc.dto';

export interface SearchResponseDTO {
  tasks: ProjectTaskItemDTO[];
  projects: ProjectItemDTO[];
  docs: DocItemDTO[];
}
