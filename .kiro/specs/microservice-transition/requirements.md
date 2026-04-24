# Requirements Document

## Introduction

SuperBoard hiện là một NestJS monorepo (Turborepo) với core API lớn, AI service (FastAPI/gRPC), collaboration service (WebSocket), notification service (BullMQ), và frontend Next.js. Hệ thống đang có các vấn đề về duplicate code, thiếu chuẩn hóa contract, và coupling cao giữa các domain.

Mục tiêu của feature này là chuyển đổi SuperBoard từ monolith sang kiến trúc microservice theo từng bước, giữ nguyên monorepo nhưng tách runtime độc lập theo service. Quá trình gồm 7 pha (Pha -1 đến Pha 6), được tổ chức thành 5 Epic (A–E) với 14 issue cụ thể.

Chiến lược: giảm nợ kỹ thuật trước → chuẩn hóa nền tảng → cố định contract → tách runtime từng service → event-driven hóa luồng chéo.

---

## Glossary

- **Core_API**: NestJS service chính chứa Auth, Workspace, Project, Task, Workflow, Permission, Audit Log.
- **AI_Service**: FastAPI service xử lý summarize, briefing, embedding, semantic search, suggest labels/priority.
- **Collaboration_Service**: NestJS WebSocket service xử lý presence, typing indicator, chat realtime, doc sync.
- **Notification_Service**: NestJS worker xử lý in-app notification, email, digest, reminder qua BullMQ.
- **Search_Service**: Service xử lý search indexing và analytics pipeline (tách sau cùng).
- **Automation_Service**: Service xử lý rule engine và job automation (tách sau cùng).
- **Contract_Package**: Package `@superboard/shared` chứa DTO, event schema, protobuf definitions được versioned.
- **ApiResponse**: Response envelope chuẩn `{ data, error, meta }` áp dụng cho toàn bộ HTTP endpoints.
- **Correlation_ID**: UUID được inject vào mỗi request và propagate xuyên suốt HTTP/gRPC/queue để trace end-to-end.
- **Event_Bus**: Kênh async (BullMQ/Redis pub-sub) để phát và consume domain events giữa các service.
- **DLQ**: Dead-letter queue — hàng đợi chứa các job/event thất bại sau khi hết retry.
- **Circuit_Breaker**: Pattern ngắt mạch tự động khi downstream service lỗi liên tục, tránh cascade failure.
- **Boundary_Rule**: Lint rule chặn import chéo sai tầng giữa các module trong monorepo.
- **Health_Check**: Endpoint `/health` (liveness) và `/ready` (readiness) của mỗi service.
- **Idempotency_Key**: Key duy nhất đính kèm request/event để đảm bảo xử lý không trùng lặp.
- **Event_Taxonomy**: Danh sách chuẩn hóa các domain event với versioned payload schema.
- **gRPC**: Giao thức RPC dùng cho giao tiếp sync giữa Core_API và AI_Service.
- **BullMQ**: Thư viện queue dựa trên Redis, dùng cho async job processing.

---

## Requirements

### Requirement 1: Audit và đo baseline duplicate code (Epic A – Issue A1)

**User Story:** As a backend developer, I want a baseline report of duplicate code hotspots, so that I can prioritize refactoring efforts before splitting services.

#### Acceptance Criteria

1. THE Core_API SHALL produce a duplicate code baseline report covering at least the following groups: validation logic, mapper/transformer, response shaping, and error handling.
2. THE baseline report SHALL list the top 20 duplication hotspots, each with file location, estimated impact level (high/medium/low), and a suggested consolidation direction.
3. WHEN the baseline report is generated, THE Core_API SHALL store it as a versioned artifact accessible to all team members.

---

### Requirement 2: Chuẩn hóa response envelope (Epic A – Issue A2)

**User Story:** As a frontend developer, I want all API responses to follow a consistent envelope format, so that I can write generic error handling and data extraction logic.

#### Acceptance Criteria

1. THE Core_API SHALL wrap all HTTP responses in the ApiResponse envelope with fields: `data`, `error`, and `meta`.
2. WHEN a request succeeds, THE Core_API SHALL return `{ data: <payload>, error: null }`.
3. WHEN a request fails, THE Core_API SHALL return `{ data: null, error: { code, message, details } }`.
4. THE Core_API SHALL apply the ApiResponse envelope to 100% of endpoints modified or created after this requirement is implemented.
5. THE Core_API SHALL provide a written response contract guideline in the project documentation.

---

### Requirement 3: Chuẩn hóa error code theo domain (Epic A – Issue A3)

**User Story:** As a backend developer, I want a standardized error code system per domain, so that clients can handle errors programmatically without parsing error messages.

#### Acceptance Criteria

1. THE Core_API SHALL define a versioned error code catalog covering at minimum the domains: auth, workspace, project, and task.
2. WHEN an exception is thrown, THE Core_API SHALL map it to a domain error code at the global exception filter layer.
3. THE Core_API SHALL return error responses conforming to the ApiResponse error envelope defined in Requirement 2.
4. THE error code catalog SHALL be published as version 1 and stored in the project documentation.

---

### Requirement 4: Boundary rules chống import chéo sai tầng (Epic A – Issue A4)

**User Story:** As a platform engineer, I want automated lint rules that prevent invalid cross-module imports, so that architectural boundaries are enforced without manual code review.

#### Acceptance Criteria

1. THE Core_API SHALL enforce lint-based Boundary_Rules that block at minimum 3 categories of invalid cross-module import patterns.
2. WHEN a pull request contains a Boundary_Rule violation, THE CI_Pipeline SHALL fail the build and block the merge.
3. THE Core_API SHALL provide developer documentation explaining how to resolve each category of Boundary_Rule violation.

---

### Requirement 5: Chuẩn hóa service config và health checks (Epic B – Issue B1)

**User Story:** As a platform engineer, I want each service to have its own environment config and health check endpoints, so that services can be deployed and monitored independently.

#### Acceptance Criteria

1. THE Core_API SHALL expose a `/health` liveness endpoint and a `/ready` readiness endpoint.
2. THE AI_Service SHALL expose a `/health` liveness endpoint and a `/ready` readiness endpoint.
3. THE Collaboration_Service SHALL expose a `/health` liveness endpoint and a `/ready` readiness endpoint.
4. WHEN a service is not ready to accept traffic, THE service's `/ready` endpoint SHALL return HTTP 503.
5. THE Core_API SHALL load configuration exclusively from environment variables, with no hardcoded values for ports, database URLs, or external service addresses.
6. THE AI_Service SHALL load configuration exclusively from environment variables.
7. THE Collaboration_Service SHALL load configuration exclusively from environment variables.
8. THE Core_API SHALL provide an operational checklist documenting required environment variables and expected health check responses for local and staging environments.

---

### Requirement 6: Chuẩn hóa Correlation ID xuyên service (Epic B – Issue B2)

**User Story:** As a platform engineer, I want every request to carry a correlation ID that propagates across all services, so that I can trace a full request lifecycle across service boundaries.

#### Acceptance Criteria

1. WHEN an HTTP request arrives without a `X-Correlation-ID` header, THE Core_API SHALL generate a new UUID and attach it as the Correlation_ID for that request.
2. WHEN an HTTP request arrives with a `X-Correlation-ID` header, THE Core_API SHALL use the provided value as the Correlation_ID.
3. THE Core_API SHALL propagate the Correlation_ID in all outbound HTTP calls, gRPC calls, and queue messages to downstream services.
4. THE AI_Service SHALL include the Correlation_ID in all log entries related to a request.
5. THE Collaboration_Service SHALL include the Correlation_ID in all log entries related to a request.
6. THE Notification_Service SHALL include the Correlation_ID in all log entries related to a job.
7. WHEN a developer queries logs by Correlation_ID, THE logging system SHALL return all log entries from at least 2 services for a single request trace.

---

### Requirement 7: Contract package cho DTO, Event Schema, Protobuf (Epic B – Issue B3)

**User Story:** As a backend developer, I want all inter-service contracts to be defined in a single versioned package, so that contract drift between services is prevented.

#### Acceptance Criteria

1. THE Contract_Package SHALL contain all shared DTOs, event payload schemas, and protobuf definitions used for inter-service communication.
2. THE Core_API SHALL import inter-service contracts exclusively from the Contract_Package, with no local copies of shared types.
3. THE AI_Service SHALL import inter-service contracts exclusively from the Contract_Package.
4. THE Notification_Service SHALL import inter-service contracts exclusively from the Contract_Package.
5. THE Contract_Package SHALL maintain a changelog documenting breaking and non-breaking changes per version.
6. WHEN a contract schema is updated, THE Contract_Package version SHALL be incremented according to semantic versioning rules.

---

### Requirement 8: Harden AI Service integration (Epic C – Issue C1)

**User Story:** As a backend developer, I want the AI service integration to have explicit timeout, retry, and fallback policies, so that AI failures do not degrade the core user experience.

#### Acceptance Criteria

1. THE Core_API SHALL apply a configurable timeout to every outbound gRPC call to the AI_Service, with a default of no more than 10 seconds.
2. WHEN an AI_Service call times out or returns a transient error, THE Core_API SHALL retry the call with exponential backoff up to a configurable maximum number of attempts.
3. WHEN the AI_Service is unavailable after all retries, THE Core_API SHALL apply a defined fallback response per use case (summarize, briefing, suggest labels, embeddings) rather than returning an unhandled error.
4. THE Core_API SHALL implement a Circuit_Breaker for AI_Service calls that opens after a configurable threshold of consecutive failures.
5. THE Core_API SHALL emit telemetry metrics for AI_Service calls including: request count, latency percentiles (p50, p95, p99), and error rate.
6. WHEN AI_Service telemetry is collected, THE monitoring system SHALL make it available on a dashboard scoped to AI endpoints.

---

### Requirement 9: Tách Collaboration Service khỏi Core API (Epic C – Issue C2)

**User Story:** As a platform engineer, I want the realtime collaboration features to run in a separate service, so that WebSocket load does not affect Core API performance.

#### Acceptance Criteria

1. THE Collaboration_Service SHALL handle all WebSocket connections for chat, project events, presence, typing indicators, and document synchronization.
2. THE Core_API SHALL NOT process WebSocket gateway connections after the Collaboration_Service is deployed.
3. WHEN a WebSocket client connects to the Collaboration_Service, THE Collaboration_Service SHALL validate the client's JWT token against the Core_API auth endpoint before accepting the connection.
4. THE Collaboration_Service SHALL use Redis pub/sub or an equivalent Event_Bus to fan out events to connected clients.
5. WHEN a user joins or leaves a project channel, THE Collaboration_Service SHALL update presence state and broadcast the change to all subscribers of that channel within 500ms.
6. THE Collaboration_Service SHALL pass integration tests covering: join/leave channel, typing indicator broadcast, presence update, and document sync event delivery.

---

### Requirement 10: Tách Notification Service thành async worker (Epic C – Issue C3)

**User Story:** As a backend developer, I want all notification delivery to happen asynchronously outside the request path, so that notification failures do not affect core transaction performance.

#### Acceptance Criteria

1. THE Core_API SHALL enqueue a notification job to the BullMQ queue and return to the caller without waiting for delivery confirmation.
2. THE Notification_Service SHALL process notification jobs from the BullMQ queue for the following channels: in-app notification, email, digest, and reminder.
3. WHEN a notification job fails, THE Notification_Service SHALL retry the job with exponential backoff up to a configurable maximum number of attempts before moving it to the DLQ.
4. THE Notification_Service SHALL use an Idempotency_Key per job to prevent duplicate notification delivery on retry.
5. THE Core_API SHALL NOT contain notification delivery logic (email sending, in-app write) after the Notification_Service is deployed.
6. THE monitoring system SHALL expose metrics for: queue backlog size, job success rate, and failed job count per notification channel.

---

### Requirement 11: Event Taxonomy v1 (Epic D – Issue D1)

**User Story:** As a backend developer, I want a standardized event catalog for all domain events, so that producers and consumers share a common schema without ad-hoc coupling.

#### Acceptance Criteria

1. THE Event_Taxonomy SHALL define versioned event schemas for at minimum the following domains: task (created, updated, status changed), document (updated, version created), message (sent, reaction added), project (updated), and user (invited, member joined).
2. EACH event schema in the Event_Taxonomy SHALL include: event type, version, producer service, payload fields, and metadata fields (Correlation_ID, timestamp, idempotency key).
3. THE Event_Taxonomy SHALL be published as version 1 in the Contract_Package.
4. WHEN a new event type is introduced, THE Contract_Package version SHALL be incremented and the Event_Taxonomy changelog SHALL be updated.

---

### Requirement 12: Core domain event producers (Epic D – Issue D2)

**User Story:** As a backend developer, I want the Core API to reliably emit domain events for key state changes, so that downstream services can react without synchronous coupling.

#### Acceptance Criteria

1. THE Core_API SHALL emit domain events for state changes in at minimum 3 domains: task, document, and project.
2. WHEN a domain event is emitted, THE Core_API SHALL include an Idempotency_Key to prevent duplicate event processing by consumers.
3. THE Core_API SHALL apply a retry policy for event publishing so that transient publish failures do not result in lost events.
4. THE Core_API SHALL NOT emit duplicate events for the same state change within a single transaction boundary.
5. WHEN event publishing fails after all retries, THE Core_API SHALL log the failure with the Correlation_ID and event payload for manual recovery.

---

### Requirement 13: AI và Notification event consumers (Epic D – Issue D3)

**User Story:** As a backend developer, I want the AI Service and Notification Service to consume domain events asynchronously, so that enrichment and notification flows are decoupled from the Core API request path.

#### Acceptance Criteria

1. THE AI_Service SHALL consume domain events from the Event_Bus and trigger enrichment actions (summarize, score, suggest) without requiring a synchronous call from the Core_API.
2. THE Notification_Service SHALL consume domain events from the Event_Bus and trigger notification delivery without requiring a synchronous call from the Core_API.
3. WHEN an event consumer fails to process an event, THE consumer SHALL retry with exponential backoff and move the event to the DLQ after exhausting retries.
4. THE monitoring system SHALL expose metrics for each consumer including: events processed, success rate, and DLQ depth.

---

### Requirement 14: PR quality gate bắt buộc (Epic E – Issue E1)

**User Story:** As a QA engineer, I want every pull request to pass mandatory quality checks before merging, so that code quality regressions are caught automatically.

#### Acceptance Criteria

1. THE CI_Pipeline SHALL run lint and typecheck for every affected application on each pull request.
2. WHEN a pull request modifies a module, THE CI_Pipeline SHALL require at least one unit test covering the changed module to pass.
3. THE repository branch protection SHALL block merging any pull request that fails lint, typecheck, or required unit tests.
4. THE CI_Pipeline SHALL complete lint and typecheck checks within 10 minutes of pull request creation.

---

### Requirement 15: Integration gate cho contract và event changes (Epic E – Issue E2)

**User Story:** As a QA engineer, I want contract and event schema changes to trigger integration tests automatically, so that breaking changes are caught before they reach production.

#### Acceptance Criteria

1. WHEN a pull request modifies the Contract_Package (DTO, event schema, or protobuf), THE CI_Pipeline SHALL run the integration test suite for all services that depend on the changed contract.
2. THE CI_Pipeline SHALL fail and block the merge if any integration test detects a schema mismatch or contract incompatibility.
3. THE CI_Pipeline SHALL include at minimum 3 automated test cases that detect and block known contract-breaking change patterns.

---

### Requirement 16: Weekly technical debt review (Epic E – Issue E3)

**User Story:** As a platform engineer, I want a recurring weekly review of technical debt metrics, so that the team can track progress and reprioritize the backlog continuously.

#### Acceptance Criteria

1. THE team SHALL conduct a weekly technical debt review covering: duplicate code hotspots, flaky tests, and queue failure rates.
2. WHEN the weekly review is completed, THE team SHALL produce a written record documenting current metric values and updated backlog priorities.
3. THE backlog SHALL be updated with current status and priority after each weekly review.

---

### Requirement 17: Tách Search, Analytics, Automation Service (Epic – Pha 6)

**User Story:** As a platform engineer, I want Search, Analytics, and Automation to run as independent services consuming domain events, so that compute-heavy background workloads do not affect Core API latency.

#### Acceptance Criteria

1. THE Search_Service SHALL consume domain events from the Event_Bus and update the search index without blocking the Core_API request path.
2. THE Automation_Service SHALL consume domain events from the Event_Bus and execute automation rules without blocking the Core_API request path.
3. WHEN the Search_Service or Automation_Service is unavailable, THE Core_API SHALL continue to serve requests without degradation.
4. THE Core_API SHALL NOT contain search indexing or automation rule execution logic after these services are deployed.
