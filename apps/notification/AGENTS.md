# Notification Service Rules

## Scope

Applies to `apps/notification`.

## Service Design

- Follow NestJS module/service layering; keep transport/queue handlers thin.
- Notification event payloads must use `@superboard/shared` when crossing service boundaries.
- Reuse queue, health, metrics, bootstrap, config, and error helpers from `@superboard/backend-shared`.
- Keep delivery behavior retry-safe and avoid duplicating side effects.

## Validation

- Use `npm --workspace @superboard/notification run lint`.
- Use `npm --workspace @superboard/notification run typecheck`.
- Use `npm --workspace @superboard/notification run test`.
- Use `npm --workspace @superboard/notification run test:integration` only when infra prerequisites are available.
