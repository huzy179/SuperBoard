import * as amqplib from 'amqplib';
import { RABBITMQ_EXCHANGES, RABBITMQ_QUEUES, RABBITMQ_DLQ_NAMES } from '@superboard/shared';

/**
 * Declare consumer topology for all services
 * Creates consumer queues, DLQs, and bindings according to the design specification
 */
export async function declareConsumerTopology(channel: amqplib.ConfirmChannel): Promise<void> {
  // Declare consumer queues with DLX configuration
  await channel.assertQueue(RABBITMQ_QUEUES.AI, {
    durable: true,
    arguments: {
      'x-dead-letter-exchange': RABBITMQ_EXCHANGES.DEAD_LETTER,
    },
  });

  await channel.assertQueue(RABBITMQ_QUEUES.NOTIFICATION, {
    durable: true,
    arguments: {
      'x-dead-letter-exchange': RABBITMQ_EXCHANGES.DEAD_LETTER,
    },
  });

  await channel.assertQueue(RABBITMQ_QUEUES.SEARCH, {
    durable: true,
    arguments: {
      'x-dead-letter-exchange': RABBITMQ_EXCHANGES.DEAD_LETTER,
    },
  });

  await channel.assertQueue(RABBITMQ_QUEUES.AUTOMATION, {
    durable: true,
    arguments: {
      'x-dead-letter-exchange': RABBITMQ_EXCHANGES.DEAD_LETTER,
    },
  });

  // Declare DLQs with 7-day TTL (604800000 ms)
  await channel.assertQueue(RABBITMQ_DLQ_NAMES.AI, {
    durable: true,
    arguments: {
      'x-message-ttl': 604800000, // 7 days
    },
  });

  await channel.assertQueue(RABBITMQ_DLQ_NAMES.NOTIFICATION, {
    durable: true,
    arguments: {
      'x-message-ttl': 604800000, // 7 days
    },
  });

  await channel.assertQueue(RABBITMQ_DLQ_NAMES.SEARCH, {
    durable: true,
    arguments: {
      'x-message-ttl': 604800000, // 7 days
    },
  });

  await channel.assertQueue(RABBITMQ_DLQ_NAMES.AUTOMATION, {
    durable: true,
    arguments: {
      'x-message-ttl': 604800000, // 7 days
    },
  });

  // Bind consumer queues to main exchange with routing key patterns
  // AI Service: task.created, task.updated, doc.updated
  await channel.bindQueue(RABBITMQ_QUEUES.AI, RABBITMQ_EXCHANGES.DOMAIN_EVENTS, 'task.created');
  await channel.bindQueue(RABBITMQ_QUEUES.AI, RABBITMQ_EXCHANGES.DOMAIN_EVENTS, 'task.updated');
  await channel.bindQueue(RABBITMQ_QUEUES.AI, RABBITMQ_EXCHANGES.DOMAIN_EVENTS, 'doc.updated');

  // Notification Service: all events (#)
  await channel.bindQueue(RABBITMQ_QUEUES.NOTIFICATION, RABBITMQ_EXCHANGES.DOMAIN_EVENTS, '#');

  // Search Service: task.*, doc.updated, project.updated
  await channel.bindQueue(RABBITMQ_QUEUES.SEARCH, RABBITMQ_EXCHANGES.DOMAIN_EVENTS, 'task.*');
  await channel.bindQueue(RABBITMQ_QUEUES.SEARCH, RABBITMQ_EXCHANGES.DOMAIN_EVENTS, 'doc.updated');
  await channel.bindQueue(
    RABBITMQ_QUEUES.SEARCH,
    RABBITMQ_EXCHANGES.DOMAIN_EVENTS,
    'project.updated',
  );

  // Automation Service: task.*, project.updated
  await channel.bindQueue(RABBITMQ_QUEUES.AUTOMATION, RABBITMQ_EXCHANGES.DOMAIN_EVENTS, 'task.*');
  await channel.bindQueue(
    RABBITMQ_QUEUES.AUTOMATION,
    RABBITMQ_EXCHANGES.DOMAIN_EVENTS,
    'project.updated',
  );

  // Bind DLQs to DLX with service-specific routing keys
  await channel.bindQueue(
    RABBITMQ_DLQ_NAMES.AI,
    RABBITMQ_EXCHANGES.DEAD_LETTER,
    'ai.domain.events',
  );
  await channel.bindQueue(
    RABBITMQ_DLQ_NAMES.NOTIFICATION,
    RABBITMQ_EXCHANGES.DEAD_LETTER,
    'notification.domain.events',
  );
  await channel.bindQueue(
    RABBITMQ_DLQ_NAMES.SEARCH,
    RABBITMQ_EXCHANGES.DEAD_LETTER,
    'search.domain.events',
  );
  await channel.bindQueue(
    RABBITMQ_DLQ_NAMES.AUTOMATION,
    RABBITMQ_EXCHANGES.DEAD_LETTER,
    'automation.domain.events',
  );
}
