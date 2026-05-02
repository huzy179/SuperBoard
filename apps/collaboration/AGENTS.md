# Realtime Collaboration App Rules

## Scope

Applies to `apps/collaboration`.

## Service Design

- Follow NestJS module/service layering for Socket.io realtime behavior.
- Keep gateway/socket handlers thin; move orchestration and state rules into services.
- Realtime event payloads crossing services must use `@superboard/shared` contracts.
- Reuse Redis, health, bootstrap, config, and error helpers from `@superboard/backend-shared` when available.

## Validation

- Use `npm --workspace @superboard/collaboration run lint`.
- Use `npm --workspace @superboard/collaboration run typecheck`.
- Use `npm --workspace @superboard/collaboration run test`.
