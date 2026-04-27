/**
 * AMQP Event Consumer Module for Automation Service
 *
 * Provides the AMQP event consumer service for consuming domain events from RabbitMQ.
 */
import { Module } from '@nestjs/common';
import { AmqpEventConsumerService } from './amqp-event-consumer.service';

@Module({
  providers: [AmqpEventConsumerService],
  exports: [AmqpEventConsumerService],
})
export class AmqpEventConsumerModule {}
