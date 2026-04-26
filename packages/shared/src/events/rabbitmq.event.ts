import type { DomainEvent } from './base.event';

/**
 * RabbitMQ-specific domain event interface extending the base DomainEvent
 * with AMQP-specific metadata fields for routing and exchange information.
 */
export interface RabbitMQDomainEvent<T = unknown> extends DomainEvent<T> {
  /** AMQP routing key, format: {domain}.{action} e.g. "task.created" */
  routingKey: string;
  /** Target exchange name */
  exchange: string;
}

/** Canonical exchange names */
export const RABBITMQ_EXCHANGES = {
  DOMAIN_EVENTS: 'superboard.domain.events',
  DEAD_LETTER: 'superboard.domain.events.dlx',
} as const;

/** Per-service queue names */
export const RABBITMQ_QUEUES = {
  AI: 'ai.domain.events',
  NOTIFICATION: 'notification.domain.events',
  SEARCH: 'search.domain.events',
  AUTOMATION: 'automation.domain.events',
} as const;

/** Per-service DLQ names */
export const RABBITMQ_DLQ_NAMES = {
  AI: 'ai.domain.events.dlq',
  NOTIFICATION: 'notification.domain.events.dlq',
  SEARCH: 'search.domain.events.dlq',
  AUTOMATION: 'automation.domain.events.dlq',
} as const;

/** Valid routing keys — Event Taxonomy v1 */
export const VALID_ROUTING_KEYS = [
  'task.created',
  'task.updated',
  'task.status_changed',
  'task.deleted',
  'doc.updated',
  'doc.version_created',
  'message.sent',
  'message.reaction_added',
  'project.updated',
  'project.archived',
  'user.invited',
  'user.member_joined',
] as const;

export type ValidRoutingKey = (typeof VALID_ROUTING_KEYS)[number];
