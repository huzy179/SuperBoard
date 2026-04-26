# Implementation Plan: RabbitMQ Event Bus

## Overview

Thêm RabbitMQ làm Event Bus chuyên dụng cho domain events trong SuperBoard, chạy song song với BullMQ. Triển khai theo thứ tự: contract package → infrastructure → Core API publisher → consumer services → observability → backward compatibility.

## Tasks

- [x] 1. Contract Package — RabbitMQ Event Schema (`@superboard/shared`)
  - Tạo file `packages/shared/src/events/rabbitmq.event.ts`
  - Định nghĩa interface `RabbitMQDomainEvent<T>` extends `DomainEvent<T>` với fields `routingKey` và `exchange`
  - Export constants: `RABBITMQ_EXCHANGES`, `RABBITMQ_QUEUES`, `RABBITMQ_DLQ_NAMES`
  - Export `VALID_ROUTING_KEYS` tuple và type `ValidRoutingKey` (12 routing keys từ Event Taxonomy v1)
  - Re-export từ `packages/shared/src/index.ts`
  - _Requirements: 11.1, 11.2, 11.3_

  - [x] 1.1 Write property test for routing key format (P15)
    - **Property 15: Routing Keys Follow `{domain}.{action}` Format**
    - Dùng fast-check: verify tất cả `VALID_ROUTING_KEYS` match regex `^[a-z]+\.[a-z_]+$`
    - **Validates: Requirements 11.2, 11.3**

  - [x] 1.2 Write property test for queue naming convention (P5)
    - **Property 5: Consumer Queue Names Follow Naming Convention**
    - Dùng fast-check: generate service names `{ai, notification, search, automation}`, verify `RABBITMQ_QUEUES[s] === "{s}.domain.events"` và `RABBITMQ_DLQ_NAMES[s] === "{s}.domain.events.dlq"`
    - **Validates: Requirements 2.3, 8.2**

- [x] 2. Infrastructure — RabbitMQ Docker Compose
  - Thêm service `rabbitmq` vào `docker-compose.yml` với image `rabbitmq:3.13-management-alpine`
  - Cấu hình ports `5672:5672` và `15672:15672`
  - Cấu hình environment variables: `RABBITMQ_DEFAULT_USER`, `RABBITMQ_DEFAULT_PASS`, `RABBITMQ_DEFAULT_VHOST=superboard`
  - Thêm named volume `rabbitmq_data` mount tại `/var/lib/rabbitmq`
  - Thêm healthcheck dùng `rabbitmq-diagnostics ping`
  - Cập nhật `.env.example` root với `RABBITMQ_USER` và `RABBITMQ_PASS`
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.6_

- [x] 3. Core API — RabbitMQ Event Bus Service
  - [x] 3.1 Cài đặt dependency `amqplib` và `@types/amqplib` vào `apps/api`
    - Thêm vào `package.json` của `apps/api`
    - _Requirements: 3.1_

  - [x] 3.2 Implement `RabbitMQEventBusService`
    - Tạo file `apps/api/src/common/event-bus/rabbitmq-event-bus.service.ts`
    - Implement `OnModuleInit` / `OnModuleDestroy` lifecycle hooks
    - Method `connect()`: kết nối AMQP từ env var `RABBITMQ_URL`, tạo `ConfirmChannel`
    - Method `declareTopology()`: `assertExchange` cho `superboard.domain.events` (topic, durable) và `superboard.domain.events.dlx` (topic, durable)
    - Method `publish(event: DomainEvent)`: set routing key = `event.eventType`, `deliveryMode: 2`, `messageId: event.idempotencyKey`, `correlationId: event.correlationId`, header `x-event-version`, `x-producer`
    - Retry với exponential backoff: base `RABBITMQ_PUBLISH_BACKOFF_BASE_MS` (default 1000ms), multiplier 2x, jitter, max `RABBITMQ_PUBLISH_MAX_RETRIES` (default 3)
    - Khi exhausted: log error với `correlationId` + payload, resolve (không throw)
    - Connection recovery: reconnect với exponential backoff khi connection drop
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.8_

  - [x] 3.3 Write property test for routing key equals event type (P1)
    - **Property 1: Routing Key Equals Event Type**
    - Dùng fast-check: generate random `DomainEvent`, mock `ConfirmChannel`, verify routing key passed to `channel.publish()` === `event.eventType`
    - **Validates: Requirements 3.2**

  - [x] 3.4 Write property test for persistent AMQP properties (P2)
    - **Property 2: Published Messages Are Persistent With Correct AMQP Properties**
    - Dùng fast-check: generate random events, verify `deliveryMode: 2`, `messageId === event.idempotencyKey`, `correlationId === event.correlationId`
    - **Validates: Requirements 3.3, 3.4**

  - [x] 3.5 Write property test for exponential backoff (P3)
    - **Property 3: Publish Retry Uses Exponential Backoff**
    - Dùng fast-check: generate failure counts 1–(maxRetries-1), mock channel để throw N lần, verify mỗi delay ≥ 2× delay trước
    - **Validates: Requirements 3.5**

  - [x] 3.6 Write property test for no unhandled exception on exhaustion (P4)
    - **Property 4: Publish Failure Does Not Propagate as Unhandled Exception**
    - Dùng fast-check: generate events với always-failing channel mock, verify `publish()` resolves (không rejects), verify log entry chứa `correlationId`
    - **Validates: Requirements 3.6**

- [x] 4. Core API — EventBusModule và Feature Flag
  - [x] 4.1 Cập nhật `EventBusModule`
    - Sửa `apps/api/src/common/event-bus/event-bus.module.ts`
    - Thêm `RabbitMQEventBusService` vào providers
    - Thêm factory provider `EVENT_BUS`: inject `ConfigService`, `RabbitMQEventBusService`, `EventBusService`; return RabbitMQ service nếu `ENABLE_RABBITMQ_EVENT_BUS === 'true'`, ngược lại return BullMQ service
    - Export `EVENT_BUS` token, `EventBusService`, `RabbitMQEventBusService`
    - _Requirements: 3.7, 10.1, 10.2_

  - [x] 4.2 Write property test for feature flag routing (P11)
    - **Property 11: Feature Flag Routes to Correct Publisher**
    - Dùng fast-check: generate events với flag=true/false, verify khi true chỉ RabbitMQ được gọi, khi false chỉ BullMQ được gọi
    - **Validates: Requirements 10.1, 10.2**

  - [x] 4.3 Write property test for BullMQ notification queue independence (P12)
    - **Property 12: BullMQ Notification Queue Is Independent of Feature Flag**
    - Dùng fast-check: generate flag values, verify `NotificationWorkerService` xử lý jobs bình thường bất kể flag
    - **Validates: Requirements 10.3, 5.2**

- [x] 5. Core API — Topology Declaration cho Consumer Queues
  - [x] 5.1 Implement topology helper cho tất cả consumer queues
    - Tạo `apps/api/src/common/event-bus/rabbitmq-topology.ts`
    - Hàm `declareConsumerTopology(channel)`: declare 4 consumer queues với `durable: true`, `x-dead-letter-exchange: superboard.domain.events.dlx`
    - Declare 4 DLQs với `x-message-ttl: 604800000` (7 ngày)
    - Bind mỗi queue vào exchange với đúng routing key patterns (theo bảng topology trong design)
    - Bind mỗi DLQ vào DLX với routing key `{service}.domain.events`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 8.1, 8.2, 8.6_

  - [x] 5.2 Write property test for DLX in all queue args (P6)
    - **Property 6: All Consumer Queues Declare Dead Letter Exchange**
    - Dùng fast-check: mock channel, verify mọi `assertQueue` call đều có `arguments['x-dead-letter-exchange'] === 'superboard.domain.events.dlx'`
    - **Validates: Requirements 2.5**

  - [x] 5.3 Write property test for idempotent topology (P7)
    - **Property 7: Topology Declaration Is Idempotent**
    - Dùng fast-check: generate N ∈ [1,10], gọi topology setup N lần với mock channel, verify không có error và `assertExchange`/`assertQueue` được gọi với cùng args mỗi lần
    - **Validates: Requirements 2.6**

- [x] 6. Core API — Health Check và Observability
  - [x] 6.1 Implement `RabbitMQHealthIndicator`
    - Tạo `apps/api/src/health/rabbitmq.health.ts`
    - Extend `HealthIndicator` từ `@nestjs/terminus`
    - Method `isHealthy(key)`: ping RabbitMQ connection; return unhealthy nếu `ENABLE_RABBITMQ_EVENT_BUS=true` và connection down
    - Tích hợp vào readiness endpoint `/ready` để trả HTTP 503 khi unhealthy
    - _Requirements: 1.5_

  - [x] 6.2 Implement publish metrics
    - Thêm Prometheus counter `rabbitmq_publish_total` với labels `event_type`, `status` (`success`/`failure`)
    - Thêm Prometheus histogram `rabbitmq_publish_duration_seconds` với label `event_type`
    - Emit metrics trong `RabbitMQEventBusService.publish()` sau mỗi attempt
    - _Requirements: 9.1, 9.2_

  - [x] 6.3 Write property test for publish metrics (P13)
    - **Property 13: Publish Metrics Are Emitted for Every Attempt**
    - Dùng fast-check: generate events với success/failure outcomes, verify `rabbitmq_publish_total` được increment với đúng labels, `rabbitmq_publish_duration_seconds` được observed
    - **Validates: Requirements 9.1, 9.2**

  - [x] 6.4 Cập nhật `.env.example` của Core API
    - Thêm `ENABLE_RABBITMQ_EVENT_BUS=false`, `RABBITMQ_URL`, `RABBITMQ_PUBLISH_MAX_RETRIES`, `RABBITMQ_PUBLISH_BACKOFF_BASE_MS`
    - _Requirements: 3.8, 10.5_

- [-] 7. Checkpoint — Core API
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. AI Service — AMQP Consumer (Python/aio-pika)
  - [~] 8.1 Cài đặt dependency `aio-pika` vào `apps/ai-service`
    - Thêm `aio-pika` vào `apps/ai-service/requirements.txt`
    - _Requirements: 4.1_

  - [~] 8.2 Implement `AMQPEventConsumer`
    - Tạo `apps/ai-service/amqp_consumer.py`
    - Class `AMQPEventConsumer` với constants: `QUEUE_NAME = "ai.domain.events"`, `EXCHANGE_NAME = "superboard.domain.events"`, `BINDING_KEYS = ["task.created", "task.updated", "doc.updated"]`, `PREFETCH_COUNT = 10`
    - Method `start()`: dùng `aio_pika.connect_robust()` với URL từ env var `AMQP_URL`
    - Declare exchange (topic, durable), declare queue (durable, `x-dead-letter-exchange`), bind với BINDING_KEYS
    - Set QoS prefetch = `AMQP_PREFETCH_COUNT` (env var, default 10)
    - Method `_on_message()`: parse JSON, extract `correlationId`, gọi `process_event()`, dùng `message.process(requeue=False)` context manager (auto ACK on success, NACK on exception)
    - Include `correlationId` trong tất cả log entries
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [~] 8.3 Tích hợp `AMQPEventConsumer` vào `main.py`
    - Thay thế Redis-polling `EventConsumer` bằng `AMQPEventConsumer` trong startup sequence
    - _Requirements: 4.1_

  - [~] 8.4 Implement consume metrics cho AI Service
    - Thêm Prometheus counter `rabbitmq_consume_total` với labels `service="ai"`, `event_type`, `status`
    - Emit trong `_on_message()` sau khi xử lý
    - _Requirements: 9.3_

  - [~] 8.5 Write property test for ACK iff success (P8) — Python/Hypothesis
    - **Property 8: ACK Sent If and Only If Processing Succeeds**
    - Dùng Hypothesis: generate events với random success/failure handlers, verify ACK khi success, NACK(requeue=False) khi failure
    - **Validates: Requirements 4.3, 4.4**

  - [~] 8.6 Cập nhật `.env.example` của AI Service
    - Thêm `AMQP_URL`, `AMQP_PREFETCH_COUNT`
    - _Requirements: 10.5_

- [ ] 9. Notification Service — AMQP Consumer (NestJS)
  - [~] 9.1 Cài đặt dependency `amqplib` và `@types/amqplib` vào `apps/notification`
    - _Requirements: 5.1_

  - [~] 9.2 Implement `AmqpEventConsumerService`
    - Tạo `apps/notification/src/worker/amqp-event-consumer.service.ts`
    - Implement `OnModuleInit` / `OnModuleDestroy`
    - Method `connect()` và `declareAndBind()`: declare queue `notification.domain.events` (durable, `x-dead-letter-exchange`), bind với routing key `#`
    - Set prefetch = `RABBITMQ_PREFETCH_COUNT` (env var, default 10)
    - Method `handleMessage()`: parse event, map sang `NotificationJobDTO`, enqueue vào BullMQ với `jobId: event.idempotencyKey`
    - ACK chỉ sau khi BullMQ enqueue thành công; NACK(false, false) nếu enqueue thất bại
    - Reconnect với exponential backoff khi AMQP connection lost; BullMQ job processing không bị ảnh hưởng
    - _Requirements: 5.1, 5.3, 5.4, 5.5, 5.6, 5.7_

  - [~] 9.3 Đăng ký `AmqpEventConsumerService` vào Notification module
    - Thêm vào providers của module, không sửa `NotificationWorkerService` hay BullMQ processor
    - _Requirements: 5.2_

  - [~] 9.4 Implement consume metrics cho Notification Service
    - Thêm counter `rabbitmq_consume_total` với labels `service="notification"`, `event_type`, `status`
    - _Requirements: 9.3_

  - [~] 9.5 Write property test for notification jobId = idempotencyKey (P9)
    - **Property 9: Notification Service Uses Event Idempotency Key as BullMQ Job ID**
    - Dùng fast-check: generate random events, mock BullMQ queue, verify `jobId === event.idempotencyKey`
    - **Validates: Requirements 5.5**

  - [~] 9.6 Write property test for notification mapping completeness (P10)
    - **Property 10: Notification Event-to-Job Mapping Completeness**
    - Dùng fast-check: generate supported event types, verify ít nhất một `NotificationJobDTO` được enqueue với `correlationId` matching
    - **Validates: Requirements 5.3**

  - [~] 9.7 Write property test for ACK iff success — Notification Service (P8)
    - **Property 8: ACK Sent If and Only If Processing Succeeds**
    - Dùng fast-check: generate events với BullMQ enqueue success/failure, verify ACK/NACK behavior
    - **Validates: Requirements 5.4**

  - [~] 9.8 Cập nhật `.env.example` của Notification Service
    - Thêm `RABBITMQ_URL`, `RABBITMQ_PREFETCH_COUNT`
    - _Requirements: 10.5_

- [ ] 10. Search Service — AMQP Consumer (NestJS)
  - [~] 10.1 Implement `AmqpEventConsumerService` cho Search Service
    - Tạo `apps/search/src/amqp/amqp-event-consumer.service.ts`
    - Queue: `search.domain.events`, binding keys: `task.*`, `doc.updated`, `project.updated`
    - Prefetch = 10, ACK sau khi index update thành công, NACK(false, false) nếu thất bại
    - Reconnect với exponential backoff khi connection lost
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [~] 10.2 Implement consume metrics cho Search Service
    - Thêm counter `rabbitmq_consume_total` với labels `service="search"`, `event_type`, `status`
    - _Requirements: 9.3_

  - [~] 10.3 Write property test for ACK iff success — Search Service (P8)
    - **Property 8: ACK Sent If and Only If Processing Succeeds**
    - Dùng fast-check: generate events với index update success/failure, verify ACK/NACK behavior
    - **Validates: Requirements 6.3, 6.4**

  - [~] 10.4 Cập nhật `.env.example` của Search Service
    - Thêm `RABBITMQ_URL`, `RABBITMQ_PREFETCH_COUNT`
    - _Requirements: 10.5_

- [ ] 11. Automation Service — AMQP Consumer (NestJS)
  - [~] 11.1 Implement `AmqpEventConsumerService` cho Automation Service
    - Tạo `apps/automation/src/amqp/amqp-event-consumer.service.ts`
    - Queue: `automation.domain.events`, binding keys: `task.*`, `project.updated`
    - Prefetch = 10, ACK sau khi rule evaluation thành công, NACK(false, false) nếu thất bại
    - Reconnect với exponential backoff khi connection lost
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [~] 11.2 Implement consume metrics cho Automation Service
    - Thêm counter `rabbitmq_consume_total` với labels `service="automation"`, `event_type`, `status`
    - _Requirements: 9.3_

  - [~] 11.3 Write property test for ACK iff success — Automation Service (P8)
    - **Property 8: ACK Sent If and Only If Processing Succeeds**
    - Dùng fast-check: generate events với rule evaluation success/failure, verify ACK/NACK behavior
    - **Validates: Requirements 7.3, 7.4**

  - [~] 11.4 Write property test for consume metrics (P14)
    - **Property 14: Consume Metrics Are Emitted for Every Event**
    - Dùng fast-check: generate events với success/failure/dlq outcomes, verify `rabbitmq_consume_total` increment với đúng labels `service`, `event_type`, `status`
    - **Validates: Requirements 9.3**

  - [~] 11.5 Cập nhật `.env.example` của Automation Service
    - Thêm `RABBITMQ_URL`, `RABBITMQ_PREFETCH_COUNT`
    - _Requirements: 10.5_

- [~] 12. Checkpoint — Consumer Services
  - Ensure all tests pass, ask the user if questions arise.

- [~] 13. Contract Package — Versioning và Changelog
  - Cập nhật `packages/shared/package.json`: bump version theo semver (minor version increment)
  - Tạo hoặc cập nhật `packages/shared/CHANGELOG.md`: ghi nhận addition của RabbitMQ event schema là non-breaking additive change
  - _Requirements: 11.4, 11.5_

- [~] 14. Final Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks đánh dấu `*` là optional và có thể bỏ qua để triển khai MVP nhanh hơn
- Mỗi task tham chiếu requirements cụ thể để đảm bảo traceability
- Property tests dùng fast-check (TypeScript) và Hypothesis (Python), tối thiểu 100 iterations mỗi test
- Tag format cho property tests: `// Feature: rabbitmq-event-bus, Property {N}: {property_text}`
- BullMQ notification job queue KHÔNG bị thay đổi — chỉ thêm AMQP consumer song song
- Feature flag `ENABLE_RABBITMQ_EVENT_BUS` cho phép rollback an toàn không cần downtime
