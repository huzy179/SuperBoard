# Search Service Rules

## Scope

Applies to `apps/search`.

## Service Design

- Follow NestJS module/service layering; keep queue handlers thin.
- Search/indexing payloads that cross services must use `@superboard/shared` contracts.
- Reuse queue, health, metrics, bootstrap, config, and error helpers from `@superboard/backend-shared`.
- Keep indexing operations idempotent and safe to replay.

## Validation

- Use `npm --workspace @superboard/search run lint`.
- Use `npm --workspace @superboard/search run typecheck`.
- Use `npm --workspace @superboard/search run test`.
