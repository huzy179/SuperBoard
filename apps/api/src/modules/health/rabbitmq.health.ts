import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { RabbitMQEventBusService } from '../../common/event-bus/rabbitmq-event-bus.service';

@Injectable()
export class RabbitMQHealthIndicator extends HealthIndicator {
  constructor(
    private readonly configService: ConfigService,
    private readonly rabbitMQEventBusService: RabbitMQEventBusService,
  ) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const isRabbitMQEnabled = this.configService.get('ENABLE_RABBITMQ_EVENT_BUS') === 'true';

    // If RabbitMQ is not enabled, consider it healthy (not required)
    if (!isRabbitMQEnabled) {
      return this.getStatus(key, true, { enabled: false, message: 'RabbitMQ is disabled' });
    }

    try {
      // Ping RabbitMQ connection by checking if we have an active connection
      const isConnected = await this.rabbitMQEventBusService.isConnected();

      if (isConnected) {
        return this.getStatus(key, true, { connected: true });
      } else {
        return this.getStatus(key, false, {
          connected: false,
          error: 'RabbitMQ connection is not available',
        });
      }
    } catch (error) {
      return this.getStatus(key, false, {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown RabbitMQ error',
      });
    }
  }
}
