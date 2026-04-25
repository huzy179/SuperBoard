# @superboard/shared Changelog

## v1.1.0 — Event Taxonomy v1

### Added

**Event Type Constants & Typed Events**

- `task.events.ts` — Added `TASK_CREATED`, `TASK_UPDATED`, `TASK_STATUS_CHANGED` string constants; `TASK_EVENT_VERSION`, `TASK_EVENT_PRODUCER` metadata; typed `TaskCreatedEvent`, `TaskUpdatedEvent`, `TaskStatusChangedEvent`
- `doc.events.ts` — Added `DOC_UPDATED`, `DOC_VERSION_CREATED` string constants; `DOC_EVENT_VERSION`, `DOC_EVENT_PRODUCER` metadata; typed `DocUpdatedEvent`, `DocVersionCreatedEvent`
- `message.events.ts` — Added `MESSAGE_SENT`, `MESSAGE_REACTION_ADDED` string constants; `MESSAGE_EVENT_VERSION`, `MESSAGE_EVENT_PRODUCER` metadata; typed `MessageSentEvent`, `MessageReactionAddedEvent`
- `project.events.ts` — Added `PROJECT_UPDATED` string constant; `PROJECT_EVENT_VERSION`, `PROJECT_EVENT_PRODUCER` metadata; typed `ProjectUpdatedEvent`
- `user.events.ts` — Added `USER_INVITED`, `USER_MEMBER_JOINED` string constants; `USER_EVENT_VERSION`, `USER_EVENT_PRODUCER` metadata; typed `UserInvitedEvent`, `UserMemberJoinedEvent`

**Event Catalog (v1)**

| Event Type               | Producer | Consumers                |
| ------------------------ | -------- | ------------------------ |
| `task.created`           | core-api | AI, Notification, Search |
| `task.updated`           | core-api | AI, Notification, Search |
| `task.status_changed`    | core-api | AI, Notification         |
| `doc.updated`            | core-api | AI, Search               |
| `doc.version_created`    | core-api | AI                       |
| `message.sent`           | core-api | Notification             |
| `message.reaction_added` | core-api | Notification             |
| `project.updated`        | core-api | AI, Notification, Search |
| `user.invited`           | core-api | Notification             |
| `user.member_joined`     | core-api | Notification             |

### Fixed

- Removed duplicate re-exports in `src/events/index.ts`

---

## v1.0.0 — Contract Package

### Added

**Domain Event Contracts (`src/events/`)**

- `base.event.ts` — `DomainEvent<T>` base interface with `eventId`, `eventType`, `eventVersion`, `producer`, `correlationId`, `idempotencyKey`, `occurredAt`, `payload`
- `task.events.ts` — `TaskCreatedPayload`, `TaskUpdatedPayload`, `TaskStatusChangedPayload`
- `doc.events.ts` — `DocUpdatedPayload`, `DocVersionCreatedPayload`
- `project.events.ts` — `ProjectUpdatedPayload`
- `message.events.ts` — `MessageSentPayload`, `MessageReactionAddedPayload`
- `user.events.ts` — `UserInvitedPayload`, `UserMemberJoinedPayload`

**DTOs (`src/dtos/`)**

- `notification-job.dto.ts` — `NotificationJobDTO` for BullMQ notification queue jobs
- `health.dto.ts` — `HealthDataDTO`, `DependencyHealthDTO` for service health checks

**Error Codes (`src/errors/`)**

- `error-codes.ts` — `ErrorCodes` catalog covering AUTH, WORKSPACE, PROJECT, TASK, and Generic domains

**Types (`src/types/`)**

- `api-response.ts` — `ApiResponse<T>` envelope interface, `apiSuccess()`, `apiError()` helpers
- `correlation.ts` — `CorrelationContext` interface for request tracing

**Protobuf Definitions (`src/proto/`)**

- `ai_service.proto` — AI Service gRPC contract (copied from `apps/ai-service/proto/`)

### Notes

- All event types are exported from `src/events/index.ts` alongside existing WebSocket event types
- Versioning follows semantic versioning: breaking changes → major bump, additive changes → minor bump
