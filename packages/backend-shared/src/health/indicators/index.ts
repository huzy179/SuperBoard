import type { AMQPConfig, DatabaseConfig, RedisConfig } from '../../types';
import { AMQPConnectionManager } from '../../amqp/connection-manager';
import { DatabasePoolManager } from '../../connections/database-pool';
import { RedisPoolManager } from '../../connections/redis-pool';
import type { HealthIndicator, HealthStatus } from '../types';

export class DatabaseHealthIndicator implements HealthIndicator {
  name: string;
  constructor(
    name: string,
    private readonly db: DatabasePoolManager,
    private readonly config: DatabaseConfig,
  ) {
    this.name = name;
  }

  async check(): Promise<HealthStatus> {
    const start = Date.now();
    try {
      const pool = await this.db.getPool(this.config);
      // pg Pool doesn't expose key; do a direct query to verify
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      return { status: 'healthy', latencyMs: Date.now() - start };
    } catch (error) {
      return {
        status: 'unhealthy',
        latencyMs: Date.now() - start,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

export class RedisHealthIndicator implements HealthIndicator {
  name: string;
  constructor(
    name: string,
    private readonly redis: RedisPoolManager,
    private readonly config: RedisConfig,
  ) {
    this.name = name;
  }

  async check(): Promise<HealthStatus> {
    const start = Date.now();
    try {
      const client = await this.redis.getConnection(this.config);
      const pong = await client.ping();
      return {
        status: pong === 'PONG' ? 'healthy' : 'unhealthy',
        latencyMs: Date.now() - start,
        error: pong === 'PONG' ? undefined : `Unexpected ping result: ${pong}`,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        latencyMs: Date.now() - start,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

export class RabbitMQHealthIndicator implements HealthIndicator {
  name: string;
  constructor(
    name: string,
    private readonly amqp: AMQPConnectionManager,
    private readonly config: AMQPConfig,
  ) {
    this.name = name;
  }

  async check(): Promise<HealthStatus> {
    const start = Date.now();
    try {
      const conn = await this.amqp.getConnection({ ...this.config, maxReconnectAttempts: 1 });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const channel = await (conn as any).createChannel();
      await channel.close();
      return { status: 'healthy', latencyMs: Date.now() - start };
    } catch (error) {
      return {
        status: 'unhealthy',
        latencyMs: Date.now() - start,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

export class GRPCHealthIndicator implements HealthIndicator {
  name: string;
  constructor(
    name: string,
    private readonly checkFn: () => Promise<void>,
  ) {
    this.name = name;
  }

  async check(): Promise<HealthStatus> {
    const start = Date.now();
    try {
      await this.checkFn();
      return { status: 'healthy', latencyMs: Date.now() - start };
    } catch (error) {
      return {
        status: 'unhealthy',
        latencyMs: Date.now() - start,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
