# Implementation Plan: Microservice Transition

## Overview

Kế hoạch triển khai chuyển đổi SuperBoard từ monolith sang kiến trúc microservice theo 5 Epic (A → E), tương ứng 7 pha. Mỗi Epic xây dựng nền tảng cho Epic tiếp theo — không tách runtime trước khi chuẩn hóa contract, không event-driven trước khi tách service.

Tech stack: NestJS v11, Prisma v7, PostgreSQL, Redis/BullMQ, gRPC, FastAPI, Docker, Turborepo, TypeScript.

---

## Tasks

<!-- ============================================================ -->
<!-- EPIC A — Ổn định Maintainability (Pha -1)                   -->
<!-- ============================================================ -->

- [x] 1. Epic A — Ổn định Maintainability (Pha -1)
  - [x] 1.1 Tích hợp jscpd và tạo duplicate code baseline report
    - Cài `jscpd` vào `apps/api` devDependencies
    - Thêm script `"dup:report": "jscpd src --reporters json --output reports/dup"` vào `apps/api/package.json`
    - Tạo file `apps/api/reports/dup/.gitkeep` và thêm `apps/api/reports/dup/*.json` vào `.gitignore`
    - Chạy scan và tạo file `docs/tech-debt/dup-baseline-v1.json` với top 20 hotspot, mỗi entry có: `rank`, `group` (validation/mapper/response/error-handling), `files`, `duplicateLines`, `impact`, `consolidationDirection`
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 1.2 Viết unit test xác nhận baseline report schema
    - Kiểm tra file JSON output có đúng shape: array of hotspot objects với required fields
    - _Requirements: 1.2_

  - [x] 1.3 Chuẩn hóa `ApiResponse` envelope trong `@superboard/shared`
    - Cập nhật `packages/shared/src/types/api-response.ts` để đảm bảo interface có đủ fields: `success`, `data`, `error`, `meta`
    - Đảm bảo `error` field có shape `{ code: string; message: string; details?: unknown }`
    - Đảm bảo `meta` field có `timestamp`, `correlationId?`, `trace?`
    - Cập nhật helper `apiSuccess()` và tạo helper `apiError()` nếu chưa có
    - Export tất cả từ `packages/shared/src/index.ts`
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 1.4 Viết property test cho ApiResponse envelope invariant
    - **Property 1: ApiResponse Envelope Invariant**
    - Với mọi HTTP response từ Core API (success hoặc failure), body phải luôn có đúng 4 fields: `success`, `data`, `error`, `meta`. Khi success: `error === null`, `data !== null`. Khi failure: `data === null`, `error.code` và `error.message` phải có giá trị.
    - **Validates: Requirements 2.1, 2.2, 2.3**

  - [x] 1.5 Áp dụng `ApiResponse` envelope cho toàn bộ controllers trong Core API
    - Audit tất cả controllers trong `apps/api/src/modules/` để tìm endpoint chưa dùng `apiSuccess()`
    - Cập nhật `apps/api/src/common/filters/http-exception.filter.ts` để trả về `apiError()` shape chuẩn
    - Đảm bảo 100% endpoint trả về đúng envelope
    - Tạo file `docs/api-response-contract.md` mô tả response contract guideline
    - _Requirements: 2.4, 2.5_

  - [x] 1.6 Tạo Error Code Catalog v1 trong `@superboard/shared`
    - Tạo file `packages/shared/src/errors/error-codes.ts` với `ErrorCodes` const object
    - Định nghĩa error codes cho 4 domain: `AUTH_*`, `WORKSPACE_*`, `PROJECT_*`, `TASK_*`
    - Thêm generic codes: `VALIDATION_FAILED`, `INTERNAL_ERROR`, `RATE_LIMIT_EXCEEDED`
    - Cập nhật `HttpExceptionFilter` trong `apps/api/src/common/filters/http-exception.filter.ts` để map exception class → `ErrorCodes` entry
    - Export `ErrorCodes` từ `packages/shared/src/index.ts`
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 1.7 Viết property test cho exception-to-error-code mapping
    - **Property 2: Exception-to-Domain-Error-Code Mapping**
    - Với mọi exception được throw trong request handler, `error.code` trong response phải là một entry hợp lệ trong `ErrorCodes` catalog — không phải raw HTTP status string.
    - **Validates: Requirements 3.2**

  - [x] 1.8 Publish Error Code Catalog v1 vào documentation
    - Tạo file `docs/error-code-catalog-v1.md` liệt kê toàn bộ error codes theo domain
    - Thêm mô tả ngắn và HTTP status tương ứng cho mỗi code
    - _Requirements: 3.4_

  - [x] 1.9 Cài đặt ESLint boundary rules chống import chéo sai tầng
    - Cài `eslint-plugin-boundaries` vào root devDependencies
    - Cấu hình 3 rule trong `.eslintrc` hoặc `eslint.config.js`:
      1. Chặn module A import service/repository của module B (cross-domain service import)
      2. Chặn controller import repository trực tiếp (bypass service layer)
      3. Chặn `packages/shared` import từ `apps/*`
    - Tạo file `docs/boundary-rules.md` giải thích từng category vi phạm và cách fix
    - _Requirements: 4.1, 4.3_

  - [x] 1.10 Viết unit test xác nhận boundary rules hoạt động
    - Tạo fixture files vi phạm từng rule và kiểm tra ESLint báo lỗi đúng
    - _Requirements: 4.1_

- [x] 2. Checkpoint A — Đảm bảo Epic A hoàn chỉnh
  - Chạy `turbo lint` và `turbo typecheck` — không có lỗi mới
  - Kiểm tra `docs/tech-debt/dup-baseline-v1.json` tồn tại và có ít nhất 10 entries
  - Kiểm tra `packages/shared/src/errors/error-codes.ts` export đúng
  - Đảm bảo tất cả tests pass, hỏi user nếu có vấn đề.

<!-- ============================================================ -->
<!-- EPIC B — Microservice-Ready Foundation (Pha 0 + 1)          -->
<!-- ============================================================ -->

- [ ] 3. Epic B — Microservice-Ready Foundation (Pha 0 + 1)
  - [x] 3.1 Implement Health Check endpoints cho Core API
    - Cài `@nestjs/terminus` vào `apps/api`
    - Tạo `apps/api/src/modules/health/health.module.ts` và `health.controller.ts`
    - Implement `GET /health` (liveness): trả `200 { status: "ok", service: "core-api", version, uptime }`
    - Implement `GET /ready` (readiness): kiểm tra PostgreSQL (`SELECT 1`), Redis (`PING`), BullMQ queue connection
    - Trả `503` với body `{ status: "not_ready", dependencies: [...] }` khi bất kỳ dependency nào unhealthy
    - Dùng `HealthDataDTO` và `DependencyHealthDTO` từ `packages/shared/src/dtos/health.dto.ts`
    - _Requirements: 5.1, 5.4, 5.5_

  - [x] 3.2 Implement Health Check endpoints cho AI Service
    - Thêm `GET /health` và `GET /ready` vào `apps/ai-service/main.py` (FastAPI)
    - `/ready` kiểm tra gRPC server listening và model loaded
    - Load tất cả config từ environment variables (không hardcode port, host)
    - _Requirements: 5.2, 5.4, 5.6_

  - [x] 3.3 Implement Health Check endpoints cho Collaboration Service
    - Tạo `apps/collaboration/` NestJS app nếu chưa có, hoặc thêm health module vào service hiện tại
    - Implement `GET /health` và `GET /ready` (kiểm tra Redis pub/sub connection)
    - Load config từ environment variables
    - _Requirements: 5.3, 5.4, 5.7_

  - [x] 3.4 Tạo operational checklist cho health checks
    - Tạo file `docs/ops-checklist.md` liệt kê required env vars và expected health check responses cho local và staging
    - _Requirements: 5.8_

  - [x] 3.5 Viết integration test cho health check endpoints
    - Test `/health` trả 200 khi service running
    - Test `/ready` trả 503 khi database không kết nối được
    - _Requirements: 5.1, 5.4_

  - [x] 3.6 Implement Correlation ID middleware cho Core API
    - Tạo `apps/api/src/common/middleware/correlation-id.middleware.ts`
    - Nếu request có header `X-Correlation-ID` → dùng giá trị đó; nếu không → generate UUID v4
    - Lưu vào `AsyncLocalStorage` để propagate downstream
    - Set response header `X-Correlation-ID`
    - Đăng ký middleware trong `AppModule` cho tất cả routes
    - _Requirements: 6.1, 6.2_

  - [x] 3.7 Viết property test cho Correlation ID round-trip
    - **Property 3: Correlation ID Round-Trip**
    - Với mọi HTTP request đến Core API (có hoặc không có `X-Correlation-ID` header), response phải luôn có header `X-Correlation-ID`. Nếu request cung cấp ID → response echo lại đúng giá trị. Nếu không cung cấp → response chứa UUID v4 mới hợp lệ.
    - **Validates: Requirements 6.1, 6.2**

  - [x] 3.8 Propagate Correlation ID sang downstream services
    - Cập nhật gRPC client trong `apps/api/src/modules/ai/` để attach `correlation-id` vào gRPC metadata
    - Cập nhật BullMQ job enqueue để include `correlationId` trong job data
    - Cập nhật Pino logger config để include `correlationId` field trong mọi log entry
    - _Requirements: 6.3_

  - [x] 3.9 Viết property test cho Correlation ID propagation to downstream
    - **Property 4: Correlation ID Propagation to Downstream**
    - Với mọi HTTP request có correlation ID mà trigger outbound calls (gRPC tới AI Service, BullMQ job enqueue), tất cả downstream calls phải carry cùng correlation ID — gRPC metadata `correlation-id` và BullMQ job data field `correlationId`.
    - **Validates: Requirements 6.3, 6.4, 6.5, 6.6**

  - [x] 3.10 Implement Correlation ID logging trong AI Service và Notification Service
    - Cập nhật `apps/ai-service/` để extract `correlation-id` từ gRPC metadata và include trong mọi log entry
    - Cập nhật Notification worker để extract `correlationId` từ job data và include trong mọi log entry
    - _Requirements: 6.4, 6.5, 6.6_

  - [x] 3.11 Mở rộng `@superboard/shared` thành Contract Package đầy đủ
    - Tạo `packages/shared/src/events/` directory với các files:
      - `task.events.ts`: `TaskCreatedPayload`, `TaskUpdatedPayload`, `TaskStatusChangedPayload`
      - `doc.events.ts`: `DocUpdatedPayload`, `DocVersionCreatedPayload`
      - `project.events.ts`: `ProjectUpdatedPayload`
      - `message.events.ts`: `MessageSentPayload`, `MessageReactionAddedPayload`
      - `user.events.ts`: `UserInvitedPayload`, `UserMemberJoinedPayload`
    - Tạo `packages/shared/src/events/base.event.ts` với `DomainEvent<T>` interface
    - Tạo `packages/shared/src/dtos/notification-job.dto.ts` với `NotificationJobDTO`
    - Tạo `packages/shared/src/dtos/health.dto.ts` với `HealthDataDTO`, `DependencyHealthDTO`
    - Tạo `packages/shared/src/types/correlation.ts` với `CorrelationContext`
    - Symlink hoặc copy `apps/ai-service/proto/ai_service.proto` vào `packages/shared/src/proto/`
    - Tạo `packages/shared/CHANGELOG.md` với entry v1.0.0
    - Export tất cả từ `packages/shared/src/index.ts`
    - _Requirements: 7.1, 7.5_

  - [x] 3.12 Migrate Core API để import contracts từ Contract Package
    - Tìm và thay thế tất cả local copies của shared types trong `apps/api/src/` bằng imports từ `@superboard/shared`
    - Đảm bảo không còn local copies của DTO/event schema dùng cho inter-service communication
    - _Requirements: 7.2_

  - [x] 3.13 Migrate AI Service và Notification Service sang Contract Package
    - Cập nhật `apps/ai-service/` để import contracts từ `@superboard/shared` (hoặc generated Python types từ proto)
    - Cập nhật Notification worker để import `NotificationJobDTO` từ `@superboard/shared`
    - _Requirements: 7.3, 7.4_

  - [x] 3.14 Viết unit test xác nhận Contract Package exports đúng
    - Kiểm tra tất cả event payload types, DTO types, và base event interface được export
    - _Requirements: 7.1_

- [-] 4. Checkpoint B — Đảm bảo Epic B hoàn chỉnh
  - Kiểm tra `/health` và `/ready` hoạt động cho Core API, AI Service, Collaboration Service
  - Verify correlation ID được propagate qua ít nhất 2 services trong log
  - Kiểm tra `packages/shared/src/events/` có đủ 5 domain event files
  - Đảm bảo tất cả tests pass, hỏi user nếu có vấn đề.

<!-- ============================================================ -->
<!-- EPIC C — Tách Runtime Services (Pha 2–4)                    -->
<!-- ============================================================ -->

- [ ] 5. Epic C — Tách Runtime Services (Pha 2–4)
  - [ ] 5.1 Tạo AI Client config với timeout, retry, circuit breaker
    - Tạo `apps/api/src/modules/ai/ai-client.config.ts` với `AI_CLIENT_CONFIG` object
    - Config timeout từ env `AI_GRPC_TIMEOUT_MS` (default 10000ms)
    - Config retry: `maxAttempts` từ `AI_RETRY_MAX` (default 3), exponential backoff với `initialDelayMs: 500`, `backoffMultiplier: 2`, retryable errors: `UNAVAILABLE`, `DEADLINE_EXCEEDED`
    - Config circuit breaker: `failureThreshold` từ `AI_CB_THRESHOLD` (default 5), `successThreshold: 2`, `timeout: 30000`
    - Config fallbacks per use case: `summarize`, `briefing`, `suggestLabels`, `embeddings`
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [ ] 5.2 Implement timeout enforcement cho gRPC calls tới AI Service
    - Cập nhật gRPC client trong `apps/api/src/modules/ai/` để apply deadline từ `AI_CLIENT_CONFIG.timeout`
    - Đảm bảo mọi gRPC call đều có deadline — không call nào wait indefinitely
    - _Requirements: 8.1_

  - [ ] 5.3 Viết property test cho AI Service timeout enforcement
    - **Property 5: AI Service Timeout Enforcement**
    - Với mọi gRPC call tới AI Service mà response time vượt quá configured timeout (default 10s), Core API phải terminate call và trả timeout error — không bao giờ wait indefinitely.
    - **Validates: Requirements 8.1**

  - [ ] 5.4 Implement retry với exponential backoff cho AI Service calls
    - Implement retry logic trong AI gRPC client wrapper
    - Delay giữa retry N và N+1 phải lớn hơn delay giữa N-1 và N (exponential)
    - Tổng số retry không vượt quá `maxAttempts`
    - Chỉ retry với transient errors (`UNAVAILABLE`, `DEADLINE_EXCEEDED`)
    - _Requirements: 8.2_

  - [ ] 5.5 Viết property test cho AI Service retry với exponential backoff
    - **Property 6: AI Service Retry with Exponential Backoff**
    - Với mọi transient AI Service error, Core API phải retry. Delay giữa retry N và N+1 phải lớn hơn delay giữa N-1 và N. Tổng retry không vượt quá configured maximum.
    - **Validates: Requirements 8.2**

  - [ ] 5.6 Implement fallback responses khi AI Service exhausted retries
    - Implement fallback handler trong AI client: khi hết retry → trả predefined fallback per use case
    - `summarize` → `{ summary: null, fallback: true }`
    - `briefing` → `{ briefing: null, fallback: true }`
    - `suggestLabels` → `{ labels: [], fallback: true }`
    - `embeddings` → `{ embedding: [], fallback: true }`
    - Không throw unhandled exception hoặc trả 500
    - _Requirements: 8.3_

  - [ ] 5.7 Viết property test cho AI Service fallback on exhausted retries
    - **Property 7: AI Service Fallback on Exhausted Retries**
    - Với mọi AI use case (summarize, briefing, suggestLabels, embeddings), khi AI Service unavailable sau khi hết retries, Core API phải trả predefined fallback response — không bao giờ là unhandled exception hoặc 500 error.
    - **Validates: Requirements 8.3**

  - [ ] 5.8 Implement Circuit Breaker cho AI Service calls
    - Implement circuit breaker pattern (dùng `opossum` hoặc custom implementation)
    - Circuit opens sau `failureThreshold` consecutive failures
    - Khi circuit open: fail fast, không gọi gRPC mới
    - Sau `timeout` ms: chuyển sang half-open state để thử lại
    - _Requirements: 8.4_

  - [ ] 5.9 Viết property test cho Circuit Breaker opens after threshold
    - **Property 8: Circuit Breaker Opens After Threshold**
    - Với mọi sequence consecutive AI Service failures đạt configured threshold, subsequent AI calls phải fail fast (circuit open) mà không tạo gRPC call mới tới AI Service, cho đến khi circuit chuyển sang half-open.
    - **Validates: Requirements 8.4**

  - [ ] 5.10 Implement telemetry metrics cho AI Service calls
    - Tích hợp Prometheus metrics (dùng `prom-client`)
    - Emit `ai_grpc_requests_total{method, status}`
    - Emit `ai_grpc_duration_seconds{method, quantile}` — p50, p95, p99
    - Emit `ai_circuit_breaker_state{state: open|closed|half_open}`
    - Expose `/metrics` endpoint trên Core API
    - _Requirements: 8.5, 8.6_

  - [ ] 5.11 Tạo Collaboration Service app (`apps/collaboration/`)
    - Scaffold NestJS app tại `apps/collaboration/` với Socket.IO adapter
    - Cấu hình Turborepo để build `apps/collaboration/` độc lập
    - Tạo `apps/collaboration/Dockerfile`
    - Load tất cả config từ environment variables
    - _Requirements: 9.1, 5.7_

  - [ ] 5.12 Implement WebSocket gateway trong Collaboration Service
    - Tạo `CollaborationGateway` với Socket.IO
    - Implement channels: `project:{projectId}`, `doc:{docId}`, `chat:{channelId}`
    - Implement events: join/leave channel, typing indicator, presence update, document sync
    - Dùng Redis pub/sub (ioredis adapter) để fan-out events tới connected clients
    - _Requirements: 9.1, 9.4_

  - [ ] 5.13 Implement JWT auth handshake cho Collaboration Service
    - Khi WebSocket client connect, Collaboration Service gọi `POST /api/v1/auth/verify-token` trên Core API
    - Nếu token invalid → reject connection
    - Nếu valid → accept connection với `{ userId, workspaceId }` context
    - _Requirements: 9.3_

  - [ ] 5.14 Implement presence SLA ≤ 500ms trong Collaboration Service
    - Khi user join/leave project channel → update presence state trong Redis (TTL-based)
    - Broadcast presence change tới tất cả subscribers của channel trong vòng 500ms
    - _Requirements: 9.5_

  - [ ] 5.15 Remove WebSocket gateway khỏi Core API
    - Xóa hoặc disable WebSocket gateway code trong `apps/api/src/`
    - Đảm bảo Core API không còn xử lý WebSocket connections
    - _Requirements: 9.2_

  - [ ] 5.16 Viết integration tests cho Collaboration Service
    - Test join/leave channel
    - Test typing indicator broadcast
    - Test presence update
    - Test document sync event delivery
    - _Requirements: 9.6_

  - [ ] 5.17 Implement Notification Service async worker
    - Tạo `apps/notification/` NestJS app (hoặc standalone worker) với BullMQ processor
    - Implement processors cho 4 channels: `in-app`, `email`, `digest`, `reminder`
    - Queue name: `"notifications"`
    - Load config từ environment variables
    - _Requirements: 10.2_

  - [ ] 5.18 Implement retry với exponential backoff và DLQ cho Notification Service
    - Cấu hình BullMQ job retry: exponential backoff, max attempts từ env `NOTIF_RETRY_MAX` (default 5)
    - Sau khi hết retry → move job tới DLQ queue `"notifications:failed"`
    - _Requirements: 10.3_

  - [ ] 5.19 Implement Idempotency Key cho Notification jobs
    - Mỗi notification job có `id` field (ULID) làm idempotency key
    - Trước khi process job: check Redis SET NX với key `notif:processed:{id}`
    - Nếu key đã tồn tại → skip (đã xử lý), không gửi lại
    - _Requirements: 10.4_

  - [ ] 5.20 Viết property test cho Notification idempotency
    - **Property 10: Notification Idempotency**
    - Với mọi notification job được replay với cùng idempotency key (simulate retry/duplicate delivery), notification phải được deliver đúng một lần — không zero lần, không nhiều hơn một lần.
    - **Validates: Requirements 10.4**

  - [ ] 5.21 Cập nhật Core API để chỉ enqueue notification jobs
    - Thay thế tất cả notification delivery logic trong `apps/api/src/` bằng BullMQ enqueue call
    - Core API enqueue job và return ngay — không wait delivery confirmation
    - _Requirements: 10.1, 10.5_

  - [ ] 5.22 Viết property test cho Notification enqueue is non-blocking
    - **Property 9: Notification Enqueue is Non-Blocking**
    - Với mọi Core API action trigger notification, Core API response time không được correlated với notification worker processing time. Core API phải return ngay sau khi enqueue job.
    - **Validates: Requirements 10.1**

  - [ ] 5.23 Expose metrics cho Notification Service
    - Emit metrics: queue backlog size, job success rate, failed job count per notification channel
    - Expose qua `/metrics` endpoint hoặc BullMQ dashboard
    - _Requirements: 10.6_

- [ ] 6. Checkpoint C — Đảm bảo Epic C hoàn chỉnh
  - Kiểm tra AI Service calls có timeout, retry, circuit breaker hoạt động
  - Kiểm tra Collaboration Service chạy độc lập, Core API không còn WebSocket gateway
  - Kiểm tra Notification Service enqueue/process flow hoạt động
  - Đảm bảo tất cả tests pass, hỏi user nếu có vấn đề.

<!-- ============================================================ -->
<!-- EPIC D — Event-Driven Architecture (Pha 5)                  -->
<!-- ============================================================ -->

- [ ] 7. Epic D — Event-Driven Architecture (Pha 5)
  - [ ] 7.1 Tạo Event Taxonomy v1 trong Contract Package
    - Đảm bảo `packages/shared/src/events/base.event.ts` có `DomainEvent<T>` interface với fields: `eventId` (ULID), `eventType`, `eventVersion`, `producer`, `correlationId`, `idempotencyKey`, `occurredAt` (ISO8601), `payload`
    - Hoàn thiện tất cả event payload types trong `packages/shared/src/events/`:
      - `task.events.ts`: `task.created`, `task.updated`, `task.status_changed`
      - `doc.events.ts`: `doc.updated`, `doc.version_created`
      - `message.events.ts`: `message.sent`, `message.reaction_added`
      - `project.events.ts`: `project.updated`
      - `user.events.ts`: `user.invited`, `user.member_joined`
    - Mỗi event type có: event type string, version, producer service, payload fields, metadata fields
    - Cập nhật `packages/shared/CHANGELOG.md` với Event Taxonomy v1 entry
    - _Requirements: 11.1, 11.2, 11.3_

  - [ ] 7.2 Viết property test cho Domain Event Schema Conformance
    - **Property 11: Domain Event Schema Conformance**
    - Với mọi domain event được emit bởi Core API, event object phải conform với `DomainEvent` base schema: có non-empty `eventId`, `eventType`, `eventVersion`, `producer`, `correlationId`, `idempotencyKey`, `occurredAt`, và `payload` fields.
    - **Validates: Requirements 11.1, 11.2**

  - [ ] 7.3 Tạo EventBus service trong Core API
    - Tạo `apps/api/src/common/event-bus/event-bus.service.ts`
    - Implement `publish(event: DomainEvent)` method dùng BullMQ hoặc Redis pub/sub
    - Implement retry policy cho event publishing: transient failures không dẫn đến lost events
    - Khi publish fail sau tất cả retries: log failure với `correlationId` và event payload
    - _Requirements: 12.3, 12.5_

  - [ ] 7.4 Implement domain event producers trong Task domain
    - Cập nhật `TaskService` để emit events sau state changes:
      - `task.created` sau khi tạo task thành công
      - `task.updated` sau khi update task
      - `task.status_changed` sau khi thay đổi status
    - Mỗi event có `idempotencyKey = task-{eventType}-{taskId}-{transactionId}`
    - Đảm bảo không emit duplicate events trong cùng transaction boundary
    - _Requirements: 12.1, 12.2, 12.4_

  - [ ] 7.5 Implement domain event producers trong Document và Project domains
    - Cập nhật Document service để emit `doc.updated`, `doc.version_created`
    - Cập nhật Project service để emit `project.updated`
    - Áp dụng cùng idempotency key pattern
    - _Requirements: 12.1, 12.2, 12.4_

  - [ ] 7.6 Viết property test cho No Duplicate Events Per Transaction
    - **Property 12: No Duplicate Events Per Transaction**
    - Với mọi single state-change operation (ví dụ: một task status update), Core API phải emit đúng một domain event với unique `idempotencyKey`. Replay cùng operation với cùng transaction context không được produce event thứ hai với cùng idempotency key.
    - **Validates: Requirements 12.4**

  - [ ] 7.7 Implement AI Service event consumer
    - Tạo event consumer trong `apps/ai-service/` để subscribe tới Event Bus
    - Consume events: `task.created`, `task.updated`, `doc.updated`
    - Trigger enrichment actions (summarize, score, suggest) async — không cần synchronous call từ Core API
    - Implement retry với exponential backoff khi consumer fail
    - Sau khi hết retries → move event tới DLQ
    - _Requirements: 13.1, 13.3_

  - [ ] 7.8 Implement Notification Service event consumer
    - Tạo event consumer trong Notification Service để subscribe tới Event Bus
    - Consume tất cả events trong Event Taxonomy catalog
    - Map event → notification job và enqueue vào BullMQ
    - Implement retry và DLQ handling
    - _Requirements: 13.2, 13.3_

  - [ ] 7.9 Viết property test cho Failed Events Route to DLQ After Max Retries
    - **Property 13: Failed Events Route to DLQ After Max Retries**
    - Với mọi domain event mà consumer (AI hoặc Notification) consistently fail processing, sau khi hết configured maximum retry attempts, event phải xuất hiện trong Dead-Letter Queue — không bao giờ bị silently dropped.
    - **Validates: Requirements 13.3**

  - [ ] 7.10 Expose consumer metrics cho AI và Notification consumers
    - Emit metrics cho mỗi consumer: events processed, success rate, DLQ depth
    - _Requirements: 13.4_

  - [ ] 7.11 Scaffold Search Service và Automation Service (Pha 6 foundation)
    - Tạo `apps/search/` NestJS app với event consumer subscribing tới Event Bus
    - Consumer nhận domain events và update search index (mock implementation)
    - Tạo `apps/automation/` NestJS app với event consumer cho automation rules (mock implementation)
    - Đảm bảo Core API không chứa search indexing hoặc automation rule execution logic
    - _Requirements: 17.1, 17.2, 17.4_

  - [ ] 7.12 Viết property test cho Core API Resilience khi downstream unavailable
    - **Property 14: Core API Resilience When Downstream Services Are Unavailable**
    - Với mọi Core API request không cần Search hoặc Automation Service data, khi Search Service hoặc Automation Service unavailable, Core API phải trả successful response — không bao giờ propagate downstream unavailability thành Core API failure.
    - **Validates: Requirements 17.3**

- [ ] 8. Checkpoint D — Đảm bảo Epic D hoàn chỉnh
  - Kiểm tra events được emit từ Task, Document, Project domains
  - Kiểm tra AI Service và Notification Service consume events từ Event Bus
  - Kiểm tra DLQ nhận events sau khi hết retries
  - Đảm bảo tất cả tests pass, hỏi user nếu có vấn đề.

<!-- ============================================================ -->
<!-- EPIC E — Quality Gates (Liên tục)                           -->
<!-- ============================================================ -->

- [ ] 9. Epic E — Quality Gates (Liên tục)
  - [ ] 9.1 Tạo GitHub Actions PR quality gate workflow
    - Tạo `.github/workflows/pr-check.yml`
    - Jobs: `lint`, `typecheck`, `test` — chỉ chạy cho affected apps (`turbo --filter=[HEAD^1]`)
    - Timeout: 10 phút cho toàn bộ workflow
    - _Requirements: 14.1, 14.4_

  - [ ] 9.2 Cấu hình branch protection rules
    - Require status checks: `lint`, `typecheck`, `test` phải pass trước khi merge
    - Block merge khi bất kỳ check nào fail
    - Tạo file `docs/branch-protection-setup.md` hướng dẫn cấu hình
    - _Requirements: 14.3_

  - [ ] 9.3 Viết unit test template cho module changes
    - Tạo test template/example để đảm bảo mỗi module bị thay đổi có ít nhất 1 unit test
    - _Requirements: 14.2_

  - [ ] 9.4 Tạo contract integration gate workflow
    - Tạo `.github/workflows/contract-check.yml`
    - Trigger khi PR thay đổi files trong `packages/shared/src/events/` hoặc `packages/shared/src/dtos/`
    - Chạy integration tests cho tất cả dependent services: `turbo test:integration --filter=@superboard/api`, `--filter=@superboard/notification`, `--filter=@superboard/ai-service`
    - Fail và block merge nếu bất kỳ integration test nào fail
    - _Requirements: 15.1, 15.2_

  - [ ] 9.5 Viết 3 contract-breaking change test cases bắt buộc
    - Test case 1: Missing required field trong event payload → consumer reject (schema validation fail)
    - Test case 2: Type mismatch trong DTO field → API validation fail (class-validator reject)
    - Test case 3: Removed field từ contract → dependent service test fail (TypeScript compile error hoặc runtime assertion)
    - Đặt tests trong `packages/shared/src/__tests__/contract-breaking.spec.ts`
    - _Requirements: 15.3_

  - [ ] 9.6 Tạo weekly tech debt review template và automation
    - Tạo `docs/tech-debt/template.md` với sections: duplicate code ratio, flaky test count, queue failure rate, lint/type error count per app
    - Tạo script `scripts/tech-debt-report.ts` để tự động collect metrics từ jscpd, CI history, BullMQ stats
    - Output: `docs/tech-debt/YYYY-WW.md` với current metrics + updated backlog priorities
    - _Requirements: 16.1, 16.2, 16.3_

- [ ] 10. Final Checkpoint — Đảm bảo toàn bộ workflow hoàn chỉnh
  - Chạy `turbo lint && turbo typecheck && turbo test` — tất cả pass
  - Kiểm tra GitHub Actions workflows tồn tại và cấu hình đúng
  - Kiểm tra contract integration gate trigger đúng khi `packages/shared` thay đổi
  - Kiểm tra 3 contract-breaking test cases pass
  - Đảm bảo tất cả tests pass, hỏi user nếu có vấn đề.

---

## Notes

- Tasks đánh dấu `*` là optional — có thể skip để MVP nhanh hơn, nhưng nên implement để đảm bảo correctness properties
- Mỗi task reference requirements cụ thể để traceability
- Thứ tự Epic A → B → C → D → E là bắt buộc — Epic sau phụ thuộc vào nền tảng của Epic trước
- Property tests validate universal correctness properties được định nghĩa trong design document
- Unit tests validate specific examples và edge cases
- Checkpoints đảm bảo incremental validation sau mỗi Epic
