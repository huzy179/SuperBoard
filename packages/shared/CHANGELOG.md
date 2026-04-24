# @superboard/shared Changelog

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
