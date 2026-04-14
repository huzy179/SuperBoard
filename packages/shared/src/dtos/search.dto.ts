import type { ApiResponse } from '../types/common.types';

export interface NeuralNodeDTO {
  id: string;
  label: string;
  type: 'task' | 'doc' | 'project';
  category?: string;
  priority?: string;
  status?: string;
}

export interface NeuralEdgeDTO {
  source: string;
  target: string;
  score: number;
  type: 'semantic_similarity' | 'parent_child' | 'reference';
}

export interface NeuralGraphDTO {
  nodes: NeuralNodeDTO[];
  links: NeuralEdgeDTO[];
}

export type NeuralGraphResponseDTO = ApiResponse<NeuralGraphDTO>;

export interface SearchSyncStatusDTO {
  isFullySynced: boolean;
  totalItems: number;
  syncedItems: number;
}

export type SearchSyncStatusResponseDTO = ApiResponse<SearchSyncStatusDTO>;

import type { ProjectItemDTO, ProjectTaskItemDTO } from './project.dto';
import type { DocItemDTO } from './doc.dto';

export interface SearchResponseDTO {
  tasks?: ProjectTaskItemDTO[];
  projects?: ProjectItemDTO[];
  docs?: DocItemDTO[];
  neuralGraph?: NeuralGraphDTO;
}
