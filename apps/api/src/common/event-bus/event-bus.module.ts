import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventBusService } from './event-bus.service';
import { RabbitMQEventBusService } from './rabbitmq-event-bus.service';
import { RabbitMQMetricsService } from './rabbitmq-metrics.service';

@Global()
@Module({
  providers: [
    EventBusService,
    RabbitMQEventBusService,
    RabbitMQMetricsService,
    {
      provide: 'EVENT_BUS',
      useFactory: (
        configService: ConfigService,
        rabbitMQEventBusService: RabbitMQEventBusService,
        eventBusService: EventBusService,
      ) => {
        const enableRabbitMQ = configService.get('ENABLE_RABBITMQ_EVENT_BUS') === 'true';
        return enableRabbitMQ ? rabbitMQEventBusService : eventBusService;
      },
      inject: [ConfigService, RabbitMQEventBusService, EventBusService],
    },
  ],
  exports: ['EVENT_BUS', EventBusService, RabbitMQEventBusService, RabbitMQMetricsService],
})
export class EventBusModule {}
