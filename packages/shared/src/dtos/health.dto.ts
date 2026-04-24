import type { ApiResponse } from '../types/api-response';

export interface DependencyHealthDTO {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  latencyMs?: number;
  error?: string;
}

export interface HealthDataDTO {
  status: 'ok' | 'degraded' | 'not_ready';
  service: string;
  version: string;
  uptime: number;
  dependencies: DependencyHealthDTO[];
}

// Legacy shape kept for backward compatibility
export interface LegacyDependencyHealthDTO {
  status: 'up' | 'down';
  details?: Record<string, unknown>;
  error?: string;
}

export interface LegacyHealthDataDTO {
  status: 'ok' | 'degraded';
  dependencies: {
    db: LegacyDependencyHealthDTO;
    redis: LegacyDependencyHealthDTO;
    queue: LegacyDependencyHealthDTO;
  };
}

export type HealthResponseDTO = ApiResponse<LegacyHealthDataDTO>;
