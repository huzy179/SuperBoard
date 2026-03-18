import type { ApiResponse } from '../types/common.types';

export interface DependencyHealthDTO {
  status: 'up' | 'down';
  details?: Record<string, unknown>;
  error?: string;
}

export interface HealthDataDTO {
  status: 'ok' | 'degraded';
  dependencies: {
    db: DependencyHealthDTO;
    redis: DependencyHealthDTO;
    queue: DependencyHealthDTO;
  };
}

export type HealthResponseDTO = ApiResponse<HealthDataDTO>;
