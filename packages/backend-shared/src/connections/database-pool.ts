/**
 * Database Pool Manager
 * Manages connection pooling for databases with health checking
 */

import { Pool, PoolClient } from 'pg';
import { DatabaseConfig } from '../types';

export class DatabasePoolManager {
  private pools = new Map<string, Pool>();
  private poolMetrics = new Map<string, { activeConnections: number; totalConnections: number }>();
  private healthCheckIntervals = new Map<string, NodeJS.Timeout>();

  /**
   * Get or create a database connection pool
   */
  async getPool(config: DatabaseConfig): Promise<Pool> {
    const poolKey = this.getPoolKey(config);

    // Return existing pool if available
    const existingPool = this.pools.get(poolKey);
    if (existingPool) {
      return existingPool;
    }

    // Create new pool
    const pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.username,
      password: config.password,
      ssl: config.ssl ?? false,
      connectionTimeoutMillis: config.connectionTimeoutMillis ?? 5000,
      idleTimeoutMillis: config.idleTimeoutMillis ?? 30000,
      max: config.max ?? 20,
    });

    // Setup error handling
    pool.on('error', (error) => {
      console.error(`Database pool error for ${poolKey}:`, error);
    });

    // Test the connection
    try {
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
    } catch (error) {
      await pool.end();
      throw new Error(
        `Failed to connect to database ${poolKey}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    this.pools.set(poolKey, pool);
    this.initializeMetrics(poolKey, config);
    this.setupHealthCheck(poolKey, config);

    return pool;
  }

  /**
   * Get a single connection from the pool
   */
  async getConnection(config: DatabaseConfig): Promise<PoolClient> {
    const pool = await this.getPool(config);
    return pool.connect();
  }

  /**
   * Release a connection back to the pool
   */
  async releaseConnection(client: PoolClient): Promise<void> {
    client.release();
  }

  /**
   * Close all managed pools
   */
  async closeAll(): Promise<void> {
    // Clear all health check intervals
    for (const interval of this.healthCheckIntervals.values()) {
      clearInterval(interval);
    }
    this.healthCheckIntervals.clear();

    // Close all pools
    const closePromises = Array.from(this.pools.values()).map((pool) => {
      return pool.end().catch(() => {
        // Ignore errors during close
      });
    });

    await Promise.all(closePromises);
    this.pools.clear();
    this.poolMetrics.clear();
  }

  /**
   * Check health of a specific database pool
   */
  async healthCheck(poolKey: string): Promise<boolean> {
    const pool = this.pools.get(poolKey);
    if (!pool) {
      return false;
    }

    let client: PoolClient | null = null;
    try {
      client = await pool.connect();
      await client.query('SELECT 1');
      return true;
    } catch {
      return false;
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  /**
   * Get pool metrics
   */
  getMetrics(poolKey: string): { activeConnections: number; totalConnections: number } | null {
    return this.poolMetrics.get(poolKey) ?? null;
  }

  /**
   * Get pool key for caching
   */
  private getPoolKey(config: DatabaseConfig): string {
    return `${config.host}:${config.port}/${config.database}`;
  }

  /**
   * Initialize metrics for a pool
   */
  private initializeMetrics(poolKey: string, config: DatabaseConfig): void {
    this.poolMetrics.set(poolKey, {
      activeConnections: 0,
      totalConnections: config.max ?? 20,
    });
  }

  /**
   * Setup periodic health checks for a pool
   */
  private setupHealthCheck(poolKey: string, _config: DatabaseConfig): void {
    // Clear existing health check if any
    const existingInterval = this.healthCheckIntervals.get(poolKey);
    if (existingInterval) {
      clearInterval(existingInterval);
    }

    // Setup new health check interval (every 30 seconds)
    const interval = setInterval(async () => {
      const isHealthy = await this.healthCheck(poolKey);
      if (!isHealthy) {
        const pool = this.pools.get(poolKey);
        if (pool) {
          await pool.end().catch(() => {
            // Ignore errors
          });
          this.pools.delete(poolKey);
        }
      }
    }, 30000);

    this.healthCheckIntervals.set(poolKey, interval);
  }
}
