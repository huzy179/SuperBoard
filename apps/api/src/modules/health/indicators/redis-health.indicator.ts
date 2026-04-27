import type { HealthIndicator, HealthStatus } from '@superboard/backend-shared/health';
import { RedisService } from '../../../common/redis.service';

export class ApiRedisHealthIndicator implements HealthIndicator {
  name: string;

  constructor(
    name: string,
    private readonly redis: RedisService,
  ) {
    this.name = name;
  }

  async check(): Promise<HealthStatus> {
    const start = Date.now();
    try {
      const pong = await this.redis.ping();
      const isHealthy = pong === 'PONG' || pong === 'DISABLED';
      return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        latencyMs: Date.now() - start,
        error: isHealthy ? undefined : `Unexpected ping result: ${pong}`,
        metadata: pong === 'DISABLED' ? { enabled: false } : undefined,
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
