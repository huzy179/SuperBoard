/**
 * AMQP Event Consumer Module for Automation Service
 *
 * Provides the AMQP event consumer service for consuming domain events from RabbitMQ.
 */
import { Module } from '@nestjs/common';
import { MetricsService } from '@superboard/backend-shared/metrics';
import { AutomationAmqpConsumerService } from './automation-amqp-consumer.service';

@Module({
  providers: [MetricsService, AutomationAmqpConsumerService],
  exports: [AutomationAmqpConsumerService],
})
export class AmqpEventConsumerModule {}
