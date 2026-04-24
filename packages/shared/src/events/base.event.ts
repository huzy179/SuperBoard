export interface DomainEvent<T = unknown> {
  eventId: string; // ULID
  eventType: string; // e.g. "task.created"
  eventVersion: string; // "1.0"
  producer: string; // "core-api"
  correlationId: string;
  idempotencyKey: string;
  occurredAt: string; // ISO8601
  payload: T;
}
