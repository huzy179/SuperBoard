import type { HealthIndicator, HealthStatus } from '@superboard/backend-shared/health';
import { ConfigService } from '@nestjs/config';
import { RabbitMQEventBusService } from '../../../common/event-bus/rabbitmq-event-bus.service';

export class ApiRabbitMQHealthIndicator implements HealthIndicator {
  name: string;

  constructor(
    name: string,
    private readonly config: ConfigService,
    private readonly rabbitmq: RabbitMQEventBusService,
  ) {
    this.name = name;
  }

  async check(): Promise<HealthStatus> {
    const start = Date.now();
    const enabled = this.config.get('ENABLE_RABBITMQ_EVENT_BUS') === 'true';
    if (!enabled) {
      return {
        status: 'healthy',
        latencyMs: Date.now() - start,
        metadata: { enabled: false, message: 'RabbitMQ is disabled' },
      };
    }

    try {
      const connected = await this.rabbitmq.isConnected();
      return {
        status: connected ? 'healthy' : 'unhealthy',
        latencyMs: Date.now() - start,
        error: connected ? undefined : 'RabbitMQ connection is not available',
        metadata: { connected },
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
