import type { HealthIndicator, HealthStatus } from '@superboard/backend-shared/health';
import { QueueService } from '../../../common/queue.service';

export class QueueHealthIndicator implements HealthIndicator {
  name: string;

  constructor(
    name: string,
    private readonly queue: QueueService,
  ) {
    this.name = name;
  }

  async check(): Promise<HealthStatus> {
    const start = Date.now();
    try {
      const details = await this.queue.isHealthy();
      const enabled = this.queue.isEnabled();
      return {
        status: 'healthy',
        latencyMs: Date.now() - start,
        metadata: enabled ? details : { enabled: false, ...details },
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
