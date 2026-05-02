# Backend Shared Package Rules

## Scope

Applies to `packages/backend-shared`.

## Infrastructure

- Put reusable backend infrastructure here: AMQP, health, config, events, metrics, bootstrap, connections, errors, testing utilities, and backend-only types.
- Do not import from app modules.
- Add or update `package.json` subpath exports when adding public modules.
- Keep the stricter lint posture: no non-null assertions, prefer optional chaining/nullish coalescing, and explicit function return types where practical.

## Validation

- Use `npm --workspace @superboard/backend-shared run lint`.
- Use `npm --workspace @superboard/backend-shared run typecheck`.
- Use `npm --workspace @superboard/backend-shared run build`.
- Use package tests when behavior changes.
