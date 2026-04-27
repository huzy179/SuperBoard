/**
 * Bootstrap type definitions
 */

export * from '../types';

export interface ServiceInfo {
  name: string;
  version: string;
  description?: string;
}

export interface MiddlewareConfig {
  cors?: boolean;
  helmet?: boolean;
  compression?: boolean;
  requestLogging?: boolean;
  correlationId?: boolean;
}

export interface ShutdownHook {
  name: string;
  priority: number; // Lower numbers execute first
  execute(): Promise<void>;
}
