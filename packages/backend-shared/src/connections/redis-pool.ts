/**
 * Redis Pool Manager
 * Manages connection pooling for Redis with health checking
 */

import Redis from 'ioredis';
import { RedisConfig } from '../types';

export class RedisPoolManager {
  private pools = new Map<string, Redis>();
  private poolMetrics = new Map<string, { activeConnections: number; totalConnections: number }>();
  private healthCheckIntervals = new Map<string, NodeJS.Timeout>();

  /**
   * Get or create a Redis connection pool
   */
  async getConnection(config: RedisConfig): Promise<Redis> {
    const poolKey = this.getPoolKey(config);

    // Return existing connection if available
    const existingRedis = this.pools.get(poolKey);
    if (existingRedis) {
      if (existingRedis.status === 'ready') {
        return existingRedis;
      }
      // Remove disconnected connection
      await existingRedis.quit().catch(() => {
        // Ignore errors
      });
      this.pools.delete(poolKey);
    }

    // Create new connection
    const redis = new Redis({
      host: config.host,
      port: config.port,
      password: config.password,
      db: config.db ?? 0,
      maxRetriesPerRequest: config.maxRetriesPerRequest ?? 3,
      enableReadyCheck: true,
      enableOfflineQueue: true,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    // Setup error handling
    redis.on('error', (error) => {
      console.error(`Redis connection error for ${poolKey}:`, error);
    });

    redis.on('close', () => {
      this.pools.delete(poolKey);
    });

    // Wait for connection to be ready
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Redis connection timeout for ${poolKey}`));
      }, 5000);

      redis.on('ready', () => {
        clearTimeout(timeout);
        resolve();
      });

      redis.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });

    this.pools.set(poolKey, redis);
    this.initializeMetrics(poolKey);
    this.setupHealthCheck(poolKey, config);

    return redis;
  }

  /**
   * Release a connection back to the pool
   */
  async releaseConnection(_redis: Redis): Promise<void> {
    // ioredis manages connections internally, no explicit release needed
    // Connection will be reused from the pool
  }

  /**
   * Close all managed connections
   */
  async closeAll(): Promise<void> {
    // Clear all health check intervals
    for (const interval of this.healthCheckIntervals.values()) {
      clearInterval(interval);
    }
    this.healthCheckIntervals.clear();

    // Close all connections
    const closePromises = Array.from(this.pools.values()).map((redis) => {
      return redis.quit().catch(() => {
        // Ignore errors during close
      });
    });

    await Promise.all(closePromises);
    this.pools.clear();
    this.poolMetrics.clear();
  }

  /**
   * Check health of a specific Redis connection
   */
  async healthCheck(poolKey: string): Promise<boolean> {
    const redis = this.pools.get(poolKey);
    if (redis?.status !== 'ready') {
      return false;
    }

    try {
      const result = await redis.ping();
      return result === 'PONG';
    } catch {
      return false;
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
  private getPoolKey(config: RedisConfig): string {
    return `${config.host}:${config.port}:${config.db ?? 0}`;
  }

  /**
   * Initialize metrics for a pool
   */
  private initializeMetrics(poolKey: string): void {
    this.poolMetrics.set(poolKey, {
      activeConnections: 1,
      totalConnections: 1,
    });
  }

  /**
   * Setup periodic health checks for a connection
   */
  private setupHealthCheck(poolKey: string, _config: RedisConfig): void {
    // Clear existing health check if any
    const existingInterval = this.healthCheckIntervals.get(poolKey);
    if (existingInterval) {
      clearInterval(existingInterval);
    }

    // Setup new health check interval (every 30 seconds)
    const interval = setInterval(async () => {
      const isHealthy = await this.healthCheck(poolKey);
      if (!isHealthy) {
        const redis = this.pools.get(poolKey);
        if (redis) {
          await redis.quit().catch(() => {
            // Ignore errors
          });
          this.pools.delete(poolKey);
        }
      }
    }, 30000);

    this.healthCheckIntervals.set(poolKey, interval);
  }
}
