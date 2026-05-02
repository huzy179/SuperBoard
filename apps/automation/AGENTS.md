# Automation Service Rules

## Scope

Applies to `apps/automation`.

## Service Design

- Follow NestJS module/service layering; keep controllers or handlers thin.
- Automation rule payloads that cross services must use `@superboard/shared` contracts.
- Reuse queue, health, metrics, bootstrap, and config helpers from `@superboard/backend-shared` instead of copying infrastructure.
- Keep long-running automation work idempotent and safe to retry.

## Validation

- Use `npm --workspace @superboard/automation run lint`.
- Use `npm --workspace @superboard/automation run typecheck`.
- Use `npm --workspace @superboard/automation run test`.
