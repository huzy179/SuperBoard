# Shared Contract Package Rules

## Scope

Applies to `packages/shared`.

## Contracts

- Keep this package app-agnostic. Never import from `apps/*`.
- Put cross-app DTOs, Zod schemas, events, proto contracts, public errors, and shared types here.
- Keep runtime dependencies browser-safe unless a file is explicitly backend-only and exported that way.
- Update public exports and contract tests when adding or changing contract surface.

## Validation

- Use `npm --workspace @superboard/shared run lint`.
- Use `npm --workspace @superboard/shared run typecheck`.
- Use `npm --workspace @superboard/shared run build`.
- Use `npm --workspace @superboard/shared run test` for contract/export changes.
