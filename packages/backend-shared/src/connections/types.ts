/**
 * Connection management type definitions
 */

export * from '../types';

export interface ConnectionPool<T> {
  getConnection(): Promise<T>;
  releaseConnection(connection: T): Promise<void>;
  closeAll(): Promise<void>;
  healthCheck(): Promise<boolean>;
}

export interface PoolMetrics {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  waitingClients: number;
}
