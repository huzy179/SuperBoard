# Design Document: RabbitMQ Event Bus

## Overview

SuperBoard hiện dùng BullMQ/Redis pub-sub làm Event Bus cho domain events. Giải pháp này thiếu native fan-out, không có exchange routing, và khó scale consumer độc lập. Feature này thêm RabbitMQ làm Event Bus chuyên dụng cho domain events, chạy song song với BullMQ (BullMQ giữ nguyên cho notification job queue).

**Mục tiêu:**

- Thay thế phần pub/sub của BullMQ bằng RabbitMQ Topic Exchange với per-service queues
- Hỗ trợ fan-out thực sự: một event → nhiều consumer queues độc lập
- Backward compatibility qua feature flag `ENABLE_RABBITMQ_EVENT_BUS`
- Observability đầy đủ: Prometheus metrics cho publish/consume latency, DLQ depth

**Phạm vi thay đổi:**

- `apps/api`: `RabbitMQEventBusService` thay thế BullMQ publish path
- `apps/ai-service`: AMQP consumer (aio-pika) thay thế Redis polling
- `apps/notification`: AMQP consumer thêm vào, BullMQ job processor giữ nguyên
- `apps/search`: AMQP consumer mới
- `apps/automation`: AMQP consumer mới
- `packages/shared`: `RabbitMQDomainEvent` interface, routing key catalog
- Infrastructure: RabbitMQ thêm vào Docker Compose

---

## Architecture

### Topology tổng thể

```mermaid
graph TB
    subgraph Publisher["Core API (Publisher)"]
        EBS[RabbitMQEventBusService]
        FF{ENABLE_RABBITMQ\n_EVENT_BUS}
        BULLMQ_PUB[BullMQ EventBusService\n(fallback)]
    end

    subgraph RabbitMQ["RabbitMQ Broker (vhost: superboard)"]
        TE[Topic Exchange\nsuperboard.domain.events]
        DLX[Dead Letter Exchange\nsuperboard.domain.events.dlx]
        Q_AI[ai.domain.events]
        Q_NOTIF[notification.domain.events]
        Q_SEARCH[search.domain.events]
        Q_AUTO[automation.domain.events]
        DLQ_AI[ai.domain.events.dlq]
        DLQ_NOTIF[notification.domain.events.dlq]
        DLQ_SEARCH[search.domain.events.dlq]
        DLQ_AUTO[automation.domain.events.dlq]
    end

    subgraph Consumers
        AI[AI Service\naio-pika consumer]
        NOTIF[Notification Service\nNestJS AMQP consumer]
        SEARCH[Search Service\nNestJS AMQP consumer]
        AUTO[Automation Service\nNestJS AMQP consumer]
        BULLMQ_WORKER[BullMQ Notification\nJob Processor]
    end

    FF -->|true| EBS
    FF -->|false| BULLMQ_PUB
    EBS -->|publish routing_key=event.type| TE
    TE -->|binding: task.*, doc.*| Q_AI
    TE -->|binding: #| Q_NOTIF
    TE -->|binding: task.*, doc.*, project.*| Q_SEARCH
    TE -->|binding: task.*, project.*| Q_AUTO
    Q_AI -->|NACK requeue=false| DLX
    Q_NOTIF -->|NACK requeue=false| DLX
    Q_SEARCH -->|NACK requeue=false| DLX
    Q_AUTO -->|NACK requeue=false| DLX
    DLX --> DLQ_AI
    DLX --> DLQ_NOTIF
    DLX --> DLQ_SEARCH
    DLX --> DLQ_AUTO
    Q_AI --> AI
    Q_NOTIF --> NOTIF
    Q_SEARCH --> SEARCH
    Q_AUTO --> AUTO
    NOTIF -->|enqueue job\njobId=idempotencyKey| BULLMQ_WORKER
```

### Luồng publish với feature flag

```mermaid
sequenceDiagram
    participant Service as Core API Service
    participant EBM as EventBusModule
    participant RMQEBS as RabbitMQEventBusService
    participant BullEBS as BullMQ EventBusService
    participant RMQ as RabbitMQ Exchange

    Service->>EBM: publish(domainEvent)
    alt ENABLE_RABBITMQ_EVENT_BUS=true
        EBM->>RMQEBS: publish(domainEvent)
        RMQEBS->>RMQ: channel.publish(exchange, routingKey, payload, {persistent, messageId, correlationId})
        RMQ-->>RMQEBS: confirm
        RMQEBS-->>Service: void
    else ENABLE_RABBITMQ_EVENT_BUS=false
        EBM->>BullEBS: publish(domainEvent)
        BullEBS-->>Service: void (existing behavior)
    end
```

### Luồng consume với ACK/NACK

```mermaid
sequenceDiagram
    participant RMQ as RabbitMQ Queue
    participant Consumer as AMQP Consumer
    participant Handler as Event Handler
    participant DLX as Dead Letter Exchange

    RMQ->>Consumer: deliver(message) [prefetch=10]
    Consumer->>Handler: processEvent(event)
    alt Processing succeeds
        Handler-->>Consumer: success
        Consumer->>RMQ: channel.ack(message)
    else Processing fails (after retries)
        Handler-->>Consumer: throw Error
        Consumer->>RMQ: channel.nack(message, false, false)
        RMQ->>DLX: route to DLQ via x-dead-letter-exchange
    end
```

---

## Components and Interfaces

### 1. Contract Package — `@superboard/shared`

#### `RabbitMQDomainEvent` interface

```typescript
// packages/shared/src/events/rabbitmq.event.ts
import type { DomainEvent } from './base.event';

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
```

### 2. Core API — `RabbitMQEventBusService`

```typescript
// apps/api/src/common/event-bus/rabbitmq-event-bus.service.ts
@Injectable()
export class RabbitMQEventBusService implements OnModuleInit, OnModuleDestroy {
  private connection: amqplib.Connection | null = null;
  private channel: amqplib.ConfirmChannel | null = null;

  async onModuleInit(): Promise<void> {
    await this.connect();
    await this.declareTopology();
  }

  /** Declare exchanges idempotently (assertExchange is idempotent by AMQP spec) */
  private async declareTopology(): Promise<void> {
    await this.channel!.assertExchange(RABBITMQ_EXCHANGES.DOMAIN_EVENTS, 'topic', {
      durable: true,
    });
    await this.channel!.assertExchange(RABBITMQ_EXCHANGES.DEAD_LETTER, 'topic', { durable: true });
  }

  async publish(event: DomainEvent): Promise<void> {
    // Retry with exponential backoff
    // On exhaustion: log with correlationId, do NOT throw
  }
}
```

**Retry policy:** Exponential backoff, base 1s, multiplier 2x, configurable max attempts (`RABBITMQ_PUBLISH_MAX_RETRIES`, default 3). Jitter thêm vào để tránh thundering herd.

**Publisher confirms:** Dùng `ConfirmChannel` để đảm bảo broker đã nhận message trước khi resolve.

**Connection recovery:** Reconnect với exponential backoff khi connection bị drop. Channel được recreate sau mỗi reconnect.

### 3. Core API — `EventBusModule` (updated)

```typescript
// apps/api/src/common/event-bus/event-bus.module.ts
@Global()
@Module({
  providers: [
    EventBusService, // BullMQ (giữ nguyên)
    RabbitMQEventBusService, // AMQP (mới)
    {
      provide: 'EVENT_BUS',
      useFactory: (config, rmq, bullmq) =>
        config.get('ENABLE_RABBITMQ_EVENT_BUS') === 'true' ? rmq : bullmq,
      inject: [ConfigService, RabbitMQEventBusService, EventBusService],
    },
  ],
  exports: ['EVENT_BUS', EventBusService, RabbitMQEventBusService],
})
export class EventBusModule {}
```

### 4. AI Service — AMQP Consumer (Python/aio-pika)

```python
# apps/ai-service/amqp_consumer.py
class AMQPEventConsumer:
    QUEUE_NAME = "ai.domain.events"
    EXCHANGE_NAME = "superboard.domain.events"
    EXCHANGE_TYPE = "topic"
    BINDING_KEYS = ["task.created", "task.updated", "doc.updated"]
    PREFETCH_COUNT = 10

    async def start(self) -> None:
        self._connection = await aio_pika.connect_robust(
            self._amqp_url,
            reconnect_interval=5,  # exponential backoff handled by aio_pika
        )
        channel = await self._connection.channel()
        await channel.set_qos(prefetch_count=self.PREFETCH_COUNT)

        exchange = await channel.declare_exchange(
            self.EXCHANGE_NAME, aio_pika.ExchangeType.TOPIC, durable=True
        )
        queue = await channel.declare_queue(
            self.QUEUE_NAME,
            durable=True,
            arguments={"x-dead-letter-exchange": "superboard.domain.events.dlx"},
        )
        for key in self.BINDING_KEYS:
            await queue.bind(exchange, routing_key=key)

        await queue.consume(self._on_message)

    async def _on_message(self, message: aio_pika.IncomingMessage) -> None:
        async with message.process(requeue=False):  # NACK with requeue=False on exception
            event = json.loads(message.body)
            correlation_id = event.get("correlationId", "unknown")
            await self.process_event(event, correlation_id)
            # ACK is sent automatically by context manager on success
```

**aio-pika `connect_robust`** tự động reconnect với exponential backoff khi connection bị drop — không cần implement thủ công.

### 5. Notification Service — AMQP Consumer (NestJS)

```typescript
// apps/notification/src/worker/amqp-event-consumer.service.ts
@Injectable()
export class AmqpEventConsumerService implements OnModuleInit, OnModuleDestroy {
  private connection: amqplib.Connection | null = null;
  private channel: amqplib.Channel | null = null;

  async onModuleInit(): Promise<void> {
    await this.connect();
    await this.declareAndBind();
    await this.channel!.prefetch(10);
    await this.channel!.consume(RABBITMQ_QUEUES.NOTIFICATION, this.handleMessage.bind(this));
  }

  private async handleMessage(msg: amqplib.Message | null): Promise<void> {
    if (!msg) return;
    const event: DomainEvent = JSON.parse(msg.content.toString());
    try {
      const job = this.mapEventToNotificationJob(event);
      await this.notifQueue.add(job.type, job, {
        jobId: event.idempotencyKey, // dedup key
      });
      this.channel!.ack(msg); // ACK only after successful enqueue
    } catch (err) {
      this.channel!.nack(msg, false, false); // NACK → DLQ
    }
  }
}
```

**Quan trọng:** BullMQ `NotificationWorkerService` và `EventConsumerService` (BullMQ-based) giữ nguyên. `AmqpEventConsumerService` là service mới, chạy song song. Khi `ENABLE_RABBITMQ_EVENT_BUS=true`, `EventConsumerService` (BullMQ) sẽ không nhận events mới vì Core API không publish vào BullMQ domain-events queue nữa.

### 6. Search Service — AMQP Consumer (NestJS)

```typescript
// apps/search/src/amqp/amqp-event-consumer.service.ts
// Binding keys: task.created, task.updated, task.status_changed, doc.updated, project.updated
// Prefetch: 10, ACK after index update, NACK(requeue=false) on failure
```

### 7. Automation Service — AMQP Consumer (NestJS)

```typescript
// apps/automation/src/amqp/amqp-event-consumer.service.ts
// Binding keys: task.created, task.updated, task.status_changed, project.updated
// Prefetch: 10, ACK after rule evaluation, NACK(requeue=false) on failure
```

### 8. Health Check — Core API

```typescript
// apps/api/src/health/rabbitmq.health.ts
@Injectable()
export class RabbitMQHealthIndicator extends HealthIndicator {
  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    // Ping RabbitMQ connection
    // Return unhealthy if ENABLE_RABBITMQ_EVENT_BUS=true and connection is down
  }
}
```

Readiness endpoint `/ready` trả về HTTP 503 khi RabbitMQ unavailable và feature flag đang bật.

---

## Data Models

### Queue Topology Configuration

| Queue                        | Exchange                   | Binding Keys                                  | DLQ                              |
| ---------------------------- | -------------------------- | --------------------------------------------- | -------------------------------- |
| `ai.domain.events`           | `superboard.domain.events` | `task.created`, `task.updated`, `doc.updated` | `ai.domain.events.dlq`           |
| `notification.domain.events` | `superboard.domain.events` | `#` (all events)                              | `notification.domain.events.dlq` |
| `search.domain.events`       | `superboard.domain.events` | `task.*`, `doc.updated`, `project.updated`    | `search.domain.events.dlq`       |
| `automation.domain.events`   | `superboard.domain.events` | `task.*`, `project.updated`                   | `automation.domain.events.dlq`   |

### AMQP Message Properties Mapping

| DomainEvent field | AMQP property                   | Notes                        |
| ----------------- | ------------------------------- | ---------------------------- |
| `idempotencyKey`  | `messageId`                     | Dedup key                    |
| `correlationId`   | `correlationId`                 | Trace propagation            |
| `eventType`       | routing key                     | e.g. `task.created`          |
| `eventVersion`    | header `x-event-version`        | Schema versioning            |
| `producer`        | header `x-producer`             | Source service               |
| —                 | `deliveryMode: 2`               | Persistent (survive restart) |
| —                 | `contentType: application/json` | Encoding                     |
| —                 | `timestamp`                     | Unix epoch of publish time   |

### Environment Variables

```bash
# Core API (.env.example additions)
ENABLE_RABBITMQ_EVENT_BUS=false
RABBITMQ_URL=amqp://superboard:password@localhost:5672/superboard
RABBITMQ_PUBLISH_MAX_RETRIES=3
RABBITMQ_PUBLISH_BACKOFF_BASE_MS=1000

# AI Service (.env.example additions)
AMQP_URL=amqp://superboard:password@localhost:5672/superboard
AMQP_PREFETCH_COUNT=10

# Notification/Search/Automation (.env.example additions)
RABBITMQ_URL=amqp://superboard:password@localhost:5672/superboard
RABBITMQ_PREFETCH_COUNT=10
```

### Docker Compose additions

```yaml
rabbitmq:
  image: rabbitmq:3.13-management-alpine
  container_name: superboard-rabbitmq
  ports:
    - '5672:5672'
    - '15672:15672'
  environment:
    RABBITMQ_DEFAULT_USER: ${RABBITMQ_USER}
    RABBITMQ_DEFAULT_PASS: ${RABBITMQ_PASS}
    RABBITMQ_DEFAULT_VHOST: superboard
  volumes:
    - rabbitmq_data:/var/lib/rabbitmq
  healthcheck:
    test: ['CMD', 'rabbitmq-diagnostics', 'ping']
    interval: 10s
    timeout: 5s
    retries: 5

volumes:
  rabbitmq_data:
```

---

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Routing Key Equals Event Type

_For any_ `DomainEvent` published by the Core API via `RabbitMQEventBusService`, the AMQP routing key used in `channel.publish()` SHALL equal `event.eventType`.

**Validates: Requirements 3.2**

---

### Property 2: Published Messages Are Persistent With Correct AMQP Properties

_For any_ `DomainEvent` published, the AMQP message options SHALL include `deliveryMode: 2` (persistent), `messageId` equal to `event.idempotencyKey`, and `correlationId` equal to `event.correlationId`.

**Validates: Requirements 3.3, 3.4**

---

### Property 3: Publish Retry Uses Exponential Backoff

_For any_ sequence of transient AMQP publish failures where the number of failures is less than the configured maximum retries, the delay between consecutive retry attempts SHALL be strictly increasing (each delay ≥ 2× the previous delay).

**Validates: Requirements 3.5**

---

### Property 4: Publish Failure Does Not Propagate as Unhandled Exception

_For any_ `DomainEvent` where all publish retries are exhausted, the `publish()` method SHALL resolve (not reject), and a structured error log entry containing the `correlationId` and event payload SHALL be emitted.

**Validates: Requirements 3.6**

---

### Property 5: Consumer Queue Names Follow Naming Convention

_For any_ service name `s` in `{ai, notification, search, automation}`, the declared consumer queue name SHALL equal `{s}.domain.events` and the corresponding DLQ name SHALL equal `{s}.domain.events.dlq`.

**Validates: Requirements 2.3, 8.2**

---

### Property 6: All Consumer Queues Declare Dead Letter Exchange

_For any_ consumer queue declared by any service, the queue arguments SHALL include `x-dead-letter-exchange` set to `superboard.domain.events.dlx`.

**Validates: Requirements 2.5**

---

### Property 7: Topology Declaration Is Idempotent

_For any_ number of times N ≥ 1 that the topology setup (assertExchange, assertQueue, bindQueue) is called, the resulting broker state SHALL be identical to calling it exactly once — no errors, no duplicate exchanges or queues.

**Validates: Requirements 2.6**

---

### Property 8: ACK Sent If and Only If Processing Succeeds

_For any_ AMQP message delivered to a consumer, the consumer SHALL send `channel.ack()` if and only if the event handler completes without throwing. If the handler throws, the consumer SHALL send `channel.nack(msg, false, false)` instead.

**Validates: Requirements 4.3, 4.4, 5.4, 6.3, 6.4, 7.3, 7.4**

---

### Property 9: Notification Service Uses Event Idempotency Key as BullMQ Job ID

_For any_ domain event received by the Notification Service AMQP consumer, the BullMQ job enqueued for that event SHALL have `jobId` equal to `event.idempotencyKey`.

**Validates: Requirements 5.5**

---

### Property 10: Notification Event-to-Job Mapping Completeness

_For any_ domain event of a supported type received by the Notification Service, at least one `NotificationJobDTO` SHALL be enqueued to BullMQ with `correlationId` matching the event's `correlationId`.

**Validates: Requirements 5.3**

---

### Property 11: Feature Flag Routes to Correct Publisher

_For any_ `DomainEvent` published when `ENABLE_RABBITMQ_EVENT_BUS=true`, the event SHALL be sent to RabbitMQ and NOT to the BullMQ `domain-events` queue. When `ENABLE_RABBITMQ_EVENT_BUS=false`, the event SHALL be sent to BullMQ and NOT to RabbitMQ.

**Validates: Requirements 10.1, 10.2**

---

### Property 12: BullMQ Notification Queue Is Independent of Feature Flag

_For any_ value of `ENABLE_RABBITMQ_EVENT_BUS`, notification jobs enqueued to the BullMQ `notifications` queue SHALL be processable by the `NotificationWorkerService` without modification.

**Validates: Requirements 10.3, 5.2**

---

### Property 13: Publish Metrics Are Emitted for Every Attempt

_For any_ publish attempt (success or failure), the counter `rabbitmq_publish_total` SHALL be incremented with labels `event_type=event.eventType` and `status` equal to `"success"` or `"failure"`. The histogram `rabbitmq_publish_duration_seconds` SHALL be observed with label `event_type=event.eventType`.

**Validates: Requirements 9.1, 9.2**

---

### Property 14: Consume Metrics Are Emitted for Every Event

_For any_ event consumed by any service, the counter `rabbitmq_consume_total` SHALL be incremented with labels `service`, `event_type`, and `status` equal to `"success"`, `"failure"`, or `"dlq"`.

**Validates: Requirements 9.3**

---

### Property 15: Routing Keys Follow `{domain}.{action}` Format

_For any_ routing key in the `VALID_ROUTING_KEYS` catalog defined in `@superboard/shared`, the key SHALL match the pattern `^[a-z]+\.[a-z_]+$` (lowercase domain, dot separator, lowercase action with optional underscores).

**Validates: Requirements 11.2, 11.3**

---

## Error Handling

### Publisher Error Handling (Core API)

| Scenario                                                | Behavior                                                                  |
| ------------------------------------------------------- | ------------------------------------------------------------------------- |
| Transient AMQP error (connection reset, channel closed) | Retry with exponential backoff (base 1s, max configurable)                |
| All retries exhausted                                   | Log error with `correlationId` + full payload, resolve (no throw)         |
| RabbitMQ unavailable at startup                         | Log warning, service starts in degraded mode; readiness probe returns 503 |
| Publisher confirm timeout                               | Treat as transient error, retry                                           |

### Consumer Error Handling (All Services)

| Scenario                                    | Behavior                                                                               |
| ------------------------------------------- | -------------------------------------------------------------------------------------- |
| Event processing throws                     | NACK with `requeue=false` → message routes to DLQ via DLX                              |
| AMQP connection lost                        | Reconnect with exponential backoff (aio-pika `connect_robust` / NestJS reconnect loop) |
| Malformed JSON payload                      | Log error with raw message bytes, NACK with `requeue=false`                            |
| Unsupported event type                      | Log debug, ACK (discard gracefully — not an error)                                     |
| BullMQ enqueue fails (Notification Service) | NACK with `requeue=false` → DLQ                                                        |

### Dead Letter Queue Strategy

DLQ messages retain all original AMQP properties (`messageId`, `correlationId`, headers, body). Operators can inspect via Management UI at port 15672. Manual replay: re-publish from DLQ to main exchange with corrected routing key.

DLQ message TTL: 7 days (`x-message-ttl: 604800000` ms).

---

## Testing Strategy

### Unit Tests

- `RabbitMQEventBusService.publish()`: mock `amqplib.ConfirmChannel`, verify routing key = eventType, deliveryMode = 2, messageId = idempotencyKey, correlationId propagation
- `RabbitMQEventBusService` retry logic: mock channel to throw N times, verify exponential delays and no-throw on exhaustion
- `AmqpEventConsumerService.handleMessage()` (Notification): mock BullMQ queue, verify jobId = idempotencyKey, ACK on success, NACK on failure
- Topology declaration: verify assertExchange/assertQueue called with correct args including `x-dead-letter-exchange`
- Feature flag routing: verify correct service is invoked based on `ENABLE_RABBITMQ_EVENT_BUS`
- Routing key catalog: verify all VALID*ROUTING_KEYS match `^[a-z]+\.[a-z*]+$`

### Property-Based Tests

Property-based testing dùng **fast-check** (TypeScript) và **Hypothesis** (Python).

Mỗi property test chạy tối thiểu **100 iterations**.

Tag format: `// Feature: rabbitmq-event-bus, Property {N}: {property_text}`

| Property                                 | Test                                                          | Library    |
| ---------------------------------------- | ------------------------------------------------------------- | ---------- |
| P1: Routing key = event type             | Generate random `DomainEvent`, verify routing key             | fast-check |
| P2: Persistent + correct AMQP props      | Generate random events, verify all AMQP options               | fast-check |
| P3: Exponential backoff                  | Generate random failure counts (1–max), verify delay sequence | fast-check |
| P4: No unhandled exception on exhaustion | Generate events with always-failing channel mock              | fast-check |
| P5: Queue naming convention              | Generate service names, verify queue/DLQ names                | fast-check |
| P6: DLX in all queue args                | Generate queue declarations, verify x-dead-letter-exchange    | fast-check |
| P7: Idempotent topology                  | Generate N ∈ [1,10] calls, verify no errors and same state    | fast-check |
| P8: ACK iff success                      | Generate events with random success/failure handlers          | fast-check |
| P9: Notification jobId = idempotencyKey  | Generate random events, verify BullMQ jobId                   | fast-check |
| P10: Notification mapping completeness   | Generate supported event types, verify job enqueued           | fast-check |
| P11: Feature flag routing                | Generate events with flag=true/false, verify publisher used   | fast-check |
| P12: BullMQ independence                 | Generate flag values, verify notification worker unaffected   | fast-check |
| P13: Publish metrics emitted             | Generate events, verify counter/histogram labels              | fast-check |
| P14: Consume metrics emitted             | Generate events with success/failure/dlq outcomes             | fast-check |
| P15: Routing key format                  | Verify all VALID_ROUTING_KEYS match regex                     | fast-check |

### Integration Tests

- RabbitMQ topology declared correctly on service startup (real RabbitMQ via testcontainers)
- End-to-end: Core API publishes → AI Service consumer receives and ACKs
- DLQ routing: consumer NACKs → message appears in DLQ with original properties
- Health check: `/ready` returns 503 when RabbitMQ is down and flag is enabled
- Notification Service: AMQP event received → BullMQ job enqueued with correct jobId
- Feature flag: `ENABLE_RABBITMQ_EVENT_BUS=false` → BullMQ receives events, RabbitMQ does not

### Smoke Tests

- Docker Compose: RabbitMQ container starts with named volume, ports 5672/15672 exposed
- Management UI accessible at port 15672
- Virtual host `superboard` exists
- No hardcoded credentials in config files
- All `.env.example` files contain `RABBITMQ_URL` / `AMQP_URL` variables
- DLQ message TTL configured to 7 days
