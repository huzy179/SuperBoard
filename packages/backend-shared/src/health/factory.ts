import type {
  AMQPConfig,
  DatabaseConfig,
  DependencyConfig,
  HealthConfig,
  RedisConfig,
} from '../types';
import { AMQPConnectionManager } from '../amqp/connection-manager';
import { DatabasePoolManager } from '../connections/database-pool';
import { RedisPoolManager } from '../connections/redis-pool';
import { HealthCheckService, type HealthCheckServiceOptions } from './health-check.service';
import type { HealthIndicator } from './types';

class HttpHealthIndicator implements HealthIndicator {
  name: string;
  constructor(
    name: string,
    private readonly url: string,
    private readonly timeoutMs: number = 3000,
  ) {
    this.name = name;
  }

  async check() {
    const start = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await fetch(this.url, { signal: controller.signal });
      return {
        status: res.ok ? ('healthy' as const) : ('unhealthy' as const),
        latencyMs: Date.now() - start,
        error: res.ok ? undefined : `HTTP ${res.status}`,
      };
    } catch (error) {
      return {
        status: 'unhealthy' as const,
        latencyMs: Date.now() - start,
        error: error instanceof Error ? error.message : String(error),
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}

export interface HealthFactoryDeps {
  databasePool?: DatabasePoolManager;
  redisPool?: RedisPoolManager;
  amqpConnections?: AMQPConnectionManager;
  grpcChecks?: Record<string, () => Promise<void>>;
}

export function createHealthCheckServiceFromConfig(
  options: HealthCheckServiceOptions,
  healthConfig: HealthConfig,
  deps: HealthFactoryDeps = {},
): HealthCheckService {
  const svc = new HealthCheckService(options);
  registerIndicatorsFromConfig(svc, healthConfig, deps);
  return svc;
}

export function registerIndicatorsFromConfig(
  svc: HealthCheckService,
  healthConfig: HealthConfig,
  deps: HealthFactoryDeps = {},
): void {
  for (const dep of healthConfig.dependencies) {
    const indicator = createIndicator(dep, deps);
    if (indicator) svc.registerIndicator(indicator);
  }
}

function createIndicator(dep: DependencyConfig, deps: HealthFactoryDeps): HealthIndicator | null {
  switch (dep.type) {
    case 'database': {
      if (!deps.databasePool) return null;
      const cfg = dep.config as DatabaseConfig;
      return {
        name: dep.name,
        check: async () => {
          const start = Date.now();
          try {
            const pool = await deps.databasePool!.getPool(cfg);
            const client = await pool.connect();
            await client.query('SELECT 1');
            client.release();
            return { status: 'healthy' as const, latencyMs: Date.now() - start };
          } catch (error) {
            return {
              status: 'unhealthy' as const,
              latencyMs: Date.now() - start,
              error: error instanceof Error ? error.message : String(error),
            };
          }
        },
      };
    }
    case 'redis': {
      if (!deps.redisPool) return null;
      const cfg = dep.config as RedisConfig;
      return {
        name: dep.name,
        check: async () => {
          const start = Date.now();
          try {
            const client = await deps.redisPool!.getConnection(cfg);
            const pong = await client.ping();
            return {
              status: pong === 'PONG' ? ('healthy' as const) : ('unhealthy' as const),
              latencyMs: Date.now() - start,
              error: pong === 'PONG' ? undefined : `Unexpected ping: ${pong}`,
            };
          } catch (error) {
            return {
              status: 'unhealthy' as const,
              latencyMs: Date.now() - start,
              error: error instanceof Error ? error.message : String(error),
            };
          }
        },
      };
    }
    case 'rabbitmq': {
      if (!deps.amqpConnections) return null;
      const cfg = dep.config as AMQPConfig;
      return {
        name: dep.name,
        check: async () => {
          const start = Date.now();
          try {
            const conn = await deps.amqpConnections!.getConnection({
              ...cfg,
              maxReconnectAttempts: 1,
            });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const channel = await (conn as any).createChannel();
            await channel.close();
            return { status: 'healthy' as const, latencyMs: Date.now() - start };
          } catch (error) {
            return {
              status: 'unhealthy' as const,
              latencyMs: Date.now() - start,
              error: error instanceof Error ? error.message : String(error),
            };
          }
        },
      };
    }
    case 'grpc': {
      const fn = deps.grpcChecks?.[dep.name];
      if (!fn) return null;
      return {
        name: dep.name,
        check: async () => {
          const start = Date.now();
          try {
            await fn();
            return { status: 'healthy' as const, latencyMs: Date.now() - start };
          } catch (error) {
            return {
              status: 'unhealthy' as const,
              latencyMs: Date.now() - start,
              error: error instanceof Error ? error.message : String(error),
            };
          }
        },
      };
    }
    case 'http': {
      const cfg = dep.config as { url?: string };
      if (!cfg.url) return null;
      return new HttpHealthIndicator(dep.name, cfg.url, dep.timeout ?? 3000);
    }
    default:
      return null;
  }
}
