# Requirements Document

## Introduction

SuperBoard hiện dùng BullMQ/Redis pub-sub làm Event Bus cho domain events (task, doc, project, message, user) giữa Core API và các downstream service (AI Service, Notification Service, Search Service, Automation Service). BullMQ pub-sub không phải là giải pháp tối ưu cho pub/sub nhiều consumer vì thiếu native fan-out, thiếu exchange routing, và khó scale consumer độc lập.

Feature này thêm RabbitMQ làm Event Bus chuyên dụng cho domain events, thay thế phần pub/sub của BullMQ. BullMQ vẫn được giữ nguyên cho notification job queue (async job processing). Sau khi hoàn thành, luồng domain events sẽ đi qua RabbitMQ exchanges/queues thay vì Redis list, trong khi notification jobs vẫn đi qua BullMQ như hiện tại.

**Phạm vi thay đổi:**

- Core API: thay `EventBusService` (BullMQ) bằng `RabbitMQEventBusService` (AMQP)
- AI Service: thay Python Redis consumer bằng AMQP consumer (aio-pika)
- Notification Service: thêm AMQP consumer cho domain events (giữ BullMQ cho job queue)
- Search Service, Automation Service: thêm AMQP consumer cho domain events
- Infrastructure: thêm RabbitMQ vào Docker Compose

---

## Glossary

- **RabbitMQ_Event_Bus**: RabbitMQ broker đóng vai trò Event Bus cho domain events trong SuperBoard.
- **Core_API**: NestJS service chính, publisher của tất cả domain events.
- **AI_Service**: FastAPI service, consumer domain events để trigger enrichment.
- **Notification_Service**: NestJS worker, consumer domain events VÀ processor BullMQ notification jobs.
- **Search_Service**: Service xử lý search indexing, consumer domain events.
- **Automation_Service**: Service xử lý rule engine, consumer domain events.
- **Domain_Event**: Sự kiện bất biến mô tả state change trong hệ thống (task.created, doc.updated, v.v.).
- **Exchange**: RabbitMQ routing component nhận messages từ publisher và route đến queues theo binding rules.
- **Topic_Exchange**: Exchange type dùng routing key pattern matching (e.g. `task.*`, `#`).
- **Binding**: Liên kết giữa Exchange và Queue với routing key pattern.
- **Consumer_Queue**: Queue riêng của mỗi service consumer, nhận events từ Exchange qua Binding.
- **Dead_Letter_Exchange**: Exchange đặc biệt nhận messages bị reject hoặc expired, route đến DLQ.
- **DLQ**: Dead-letter queue — queue chứa events thất bại sau khi hết retry.
- **BullMQ**: Thư viện queue dựa trên Redis, giữ nguyên cho notification job queue.
- **AMQP**: Advanced Message Queuing Protocol — giao thức RabbitMQ sử dụng.
- **Idempotency_Key**: Key duy nhất đính kèm mỗi event để consumer dedup xử lý trùng lặp.
- **Correlation_ID**: UUID propagate xuyên suốt request lifecycle để trace end-to-end.
- **Event_Taxonomy**: Danh sách chuẩn hóa các domain event với versioned payload schema (đã định nghĩa trong microservice-transition spec).
- **Prefetch_Count**: Số lượng messages tối đa RabbitMQ gửi cho một consumer trước khi nhận ACK.
- **Management_UI**: RabbitMQ Management Plugin web interface tại port 15672.

---

## Requirements

### Requirement 1: RabbitMQ Infrastructure Setup

**User Story:** As a platform engineer, I want RabbitMQ to be provisioned as part of the SuperBoard infrastructure, so that services can connect to a reliable message broker for domain events.

#### Acceptance Criteria

1. THE RabbitMQ_Event_Bus SHALL be added to the Docker Compose configuration with a named volume for data persistence.
2. THE RabbitMQ_Event_Bus SHALL expose AMQP port 5672 for service connections and Management_UI port 15672 for operator access.
3. WHEN the RabbitMQ_Event_Bus container starts, THE RabbitMQ_Event_Bus SHALL initialize with a dedicated virtual host named `superboard`.
4. THE RabbitMQ_Event_Bus SHALL be configured with a default user whose credentials are loaded from environment variables, with no hardcoded credentials in configuration files.
5. WHEN the RabbitMQ_Event_Bus is unavailable, THE Core_API readiness endpoint SHALL return HTTP 503 indicating RabbitMQ as an unhealthy dependency.
6. THE RabbitMQ_Event_Bus SHALL have the Management Plugin enabled to allow operator inspection of exchanges, queues, and message rates.

---

### Requirement 2: Exchange và Queue Topology

**User Story:** As a backend developer, I want a well-defined RabbitMQ topology with exchanges and per-service queues, so that domain events are routed correctly to each consumer without coupling producers to consumers.

#### Acceptance Criteria

1. THE Core_API SHALL declare a Topic_Exchange named `superboard.domain.events` with `durable: true` on startup.
2. THE Core_API SHALL declare a Dead_Letter_Exchange named `superboard.domain.events.dlx` with `durable: true` on startup.
3. EACH consumer service (AI_Service, Notification_Service, Search_Service, Automation_Service) SHALL declare its own durable Consumer_Queue with a name following the pattern `{service}.domain.events` (e.g. `ai.domain.events`).
4. EACH Consumer_Queue SHALL be bound to the `superboard.domain.events` exchange with a routing key pattern that matches the event types the service needs to consume.
5. EACH Consumer_Queue SHALL be configured with `x-dead-letter-exchange` pointing to `superboard.domain.events.dlx` so that rejected or expired messages are routed to the DLQ.
6. THE topology (exchanges, queues, bindings) SHALL be declared idempotently on service startup, so that restarting a service does not cause errors if the topology already exists.

---

### Requirement 3: Core API — Domain Event Publisher

**User Story:** As a backend developer, I want the Core API to publish domain events to RabbitMQ instead of BullMQ pub-sub, so that downstream services receive events via a dedicated message broker with proper routing.

#### Acceptance Criteria

1. THE Core_API SHALL replace the BullMQ-based `EventBusService` publish path with an AMQP publisher that sends events to the `superboard.domain.events` Topic_Exchange.
2. WHEN publishing a domain event, THE Core_API SHALL set the AMQP routing key to the event type (e.g. `task.created`, `doc.updated`).
3. WHEN publishing a domain event, THE Core_API SHALL set the message as `persistent: true` (delivery mode 2) to survive RabbitMQ restarts.
4. WHEN publishing a domain event, THE Core_API SHALL include the `Idempotency_Key` as the AMQP `messageId` property and the `Correlation_ID` as the `correlationId` property.
5. WHEN a publish attempt fails due to a transient AMQP error, THE Core_API SHALL retry the publish with exponential backoff up to a configurable maximum number of attempts before logging the failure.
6. WHEN all publish retries are exhausted, THE Core_API SHALL log the failure with the `Correlation_ID` and full event payload for manual recovery, and SHALL NOT throw an unhandled exception to the caller.
7. THE Core_API SHALL NOT use BullMQ for domain event publishing after this requirement is implemented. BullMQ usage SHALL be limited to notification job enqueue only.
8. THE Core_API SHALL load RabbitMQ connection parameters (URL, virtual host, credentials) exclusively from environment variables.

---

### Requirement 4: AI Service — AMQP Event Consumer

**User Story:** As a backend developer, I want the AI Service to consume domain events from RabbitMQ instead of polling Redis/BullMQ, so that event delivery is push-based and the AI Service can scale independently.

#### Acceptance Criteria

1. THE AI_Service SHALL replace the Redis-polling `EventConsumer` with an AMQP consumer that subscribes to the `ai.domain.events` queue.
2. THE AI_Service SHALL consume at minimum the following event types: `task.created`, `task.updated`, `doc.updated`.
3. WHEN an event is received, THE AI_Service SHALL send a manual ACK to RabbitMQ only after the event has been successfully processed.
4. WHEN event processing fails, THE AI_Service SHALL send a NACK with `requeue: false` to route the event to the Dead_Letter_Exchange after exhausting retries.
5. THE AI_Service SHALL configure a Prefetch_Count of no more than 10 to prevent a single consumer instance from monopolizing the queue.
6. THE AI_Service SHALL include the `Correlation_ID` from the event payload in all log entries related to that event.
7. WHEN the AMQP connection is lost, THE AI_Service SHALL attempt to reconnect with exponential backoff and resume consuming without requiring a full service restart.

---

### Requirement 5: Notification Service — AMQP Event Consumer

**User Story:** As a backend developer, I want the Notification Service to consume domain events from RabbitMQ for event-triggered notifications, while continuing to process notification jobs from BullMQ, so that both event-driven and job-based notification flows work independently.

#### Acceptance Criteria

1. THE Notification_Service SHALL add an AMQP consumer that subscribes to the `notification.domain.events` queue for domain event-triggered notifications.
2. THE Notification_Service SHALL continue to process notification jobs from the BullMQ queue without modification.
3. WHEN a domain event is received via AMQP, THE Notification_Service SHALL map the event to a notification job and enqueue it to BullMQ for delivery processing.
4. WHEN a domain event is received via AMQP, THE Notification_Service SHALL send a manual ACK only after the notification job has been successfully enqueued to BullMQ.
5. THE Notification_Service SHALL use the event's `Idempotency_Key` as the BullMQ job ID to prevent duplicate notification delivery when the same event is redelivered.
6. WHEN the AMQP connection is lost, THE Notification_Service SHALL continue to process existing BullMQ jobs without interruption.
7. THE Notification_Service SHALL configure a Prefetch_Count of no more than 10 for the AMQP consumer.

---

### Requirement 6: Search Service — AMQP Event Consumer

**User Story:** As a backend developer, I want the Search Service to consume domain events from RabbitMQ to update the search index, so that search data stays in sync with domain state changes without polling or synchronous coupling.

#### Acceptance Criteria

1. THE Search_Service SHALL declare and subscribe to the `search.domain.events` queue bound to the `superboard.domain.events` exchange.
2. THE Search_Service SHALL consume at minimum the following event types: `task.created`, `task.updated`, `task.status_changed`, `doc.updated`, `project.updated`.
3. WHEN a domain event is received, THE Search_Service SHALL update the search index and send a manual ACK only after the index update succeeds.
4. WHEN index update fails, THE Search_Service SHALL NACK the event with `requeue: false` to route it to the Dead_Letter_Exchange.
5. WHEN the Search_Service is unavailable, THE Core_API SHALL continue to publish domain events to RabbitMQ without degradation.

---

### Requirement 7: Automation Service — AMQP Event Consumer

**User Story:** As a backend developer, I want the Automation Service to consume domain events from RabbitMQ to trigger automation rules, so that rule execution is decoupled from the Core API request path.

#### Acceptance Criteria

1. THE Automation_Service SHALL declare and subscribe to the `automation.domain.events` queue bound to the `superboard.domain.events` exchange.
2. THE Automation_Service SHALL consume at minimum the following event types: `task.created`, `task.updated`, `task.status_changed`, `project.updated`.
3. WHEN a domain event is received, THE Automation_Service SHALL evaluate applicable automation rules and send a manual ACK only after rule evaluation completes.
4. WHEN rule evaluation fails, THE Automation_Service SHALL NACK the event with `requeue: false` to route it to the Dead_Letter_Exchange.
5. WHEN the Automation_Service is unavailable, THE Core_API SHALL continue to publish domain events to RabbitMQ without degradation.

---

### Requirement 8: Dead Letter Queue và Error Handling

**User Story:** As a platform engineer, I want failed domain events to be captured in a dead-letter queue with full context, so that no events are silently lost and operators can inspect and replay failures.

#### Acceptance Criteria

1. THE RabbitMQ_Event_Bus SHALL route rejected messages from all Consumer_Queues to the `superboard.domain.events.dlx` Dead_Letter_Exchange.
2. EACH Consumer_Queue SHALL have a corresponding DLQ named `{service}.domain.events.dlq` (e.g. `ai.domain.events.dlq`) bound to the Dead_Letter_Exchange.
3. WHEN a message is moved to a DLQ, THE message SHALL retain its original headers, `messageId`, `correlationId`, and payload for operator inspection.
4. THE monitoring system SHALL expose a metric for DLQ depth per service queue, updated at least every 60 seconds.
5. WHEN a DLQ depth exceeds a configurable threshold, THE monitoring system SHALL emit an alert.
6. THE RabbitMQ_Event_Bus SHALL retain DLQ messages for at least 7 days before expiry.

---

### Requirement 9: Observability và Monitoring

**User Story:** As a platform engineer, I want metrics and logs for RabbitMQ event flows, so that I can monitor throughput, detect failures, and trace events across service boundaries.

#### Acceptance Criteria

1. THE Core_API SHALL emit a metric `rabbitmq_publish_total{event_type, status}` for each publish attempt, where `status` is `success` or `failure`.
2. THE Core_API SHALL emit a metric `rabbitmq_publish_duration_seconds{event_type}` measuring publish latency.
3. EACH consumer service SHALL emit a metric `rabbitmq_consume_total{service, event_type, status}` for each event processed, where `status` is `success`, `failure`, or `dlq`.
4. WHEN an event is published or consumed, THE service SHALL include the `Correlation_ID` in the log entry at INFO level.
5. THE Management_UI SHALL be accessible to operators for real-time inspection of queue depths, message rates, and consumer counts.
6. THE monitoring system SHALL expose a dashboard showing: publish rate per event type, consume rate per service, DLQ depth per service, and AMQP connection status.

---

### Requirement 10: Backward Compatibility và Migration

**User Story:** As a platform engineer, I want the migration from BullMQ pub-sub to RabbitMQ to be safe and reversible, so that the system can fall back if issues arise during rollout.

#### Acceptance Criteria

1. THE Core_API SHALL support a feature flag `ENABLE_RABBITMQ_EVENT_BUS` that, when set to `false`, falls back to the existing BullMQ-based event publishing.
2. WHEN `ENABLE_RABBITMQ_EVENT_BUS` is `false`, THE Core_API SHALL behave identically to the current BullMQ pub-sub implementation.
3. THE BullMQ notification job queue SHALL remain fully operational regardless of the value of `ENABLE_RABBITMQ_EVENT_BUS`.
4. THE migration SHALL be completable without downtime by enabling `ENABLE_RABBITMQ_EVENT_BUS` on a running system.
5. THE `.env.example` files for all affected services SHALL be updated to document the new RabbitMQ environment variables alongside existing variables.

---

### Requirement 11: Contract Package — RabbitMQ Event Schema

**User Story:** As a backend developer, I want the RabbitMQ event message format to be defined in the shared contract package, so that all publishers and consumers share a consistent schema.

#### Acceptance Criteria

1. THE Contract_Package (`@superboard/shared`) SHALL define a `RabbitMQDomainEvent` interface extending the existing `DomainEvent` interface with AMQP-specific metadata fields: `routingKey` and `exchange`.
2. THE Contract_Package SHALL define the canonical routing key format as `{domain}.{action}` (e.g. `task.created`, `doc.updated`).
3. THE Contract_Package SHALL define the list of valid routing keys for the `superboard.domain.events` exchange, covering at minimum all event types in the Event_Taxonomy v1.
4. WHEN the routing key list is updated, THE Contract_Package version SHALL be incremented according to semantic versioning rules.
5. THE Contract_Package CHANGELOG SHALL document the addition of RabbitMQ event schema as a non-breaking additive change.
