# AI Service Rules

## Scope

Applies to `apps/ai-service`.

## Python Service

- Treat this as a Python/FastAPI service, not a TypeScript workspace.
- Keep service contracts aligned with callers and any proto/API definitions.
- Do not introduce TypeScript lint/config patterns in Python files.
- Prefer typed Python interfaces and explicit validation at API boundaries.

## Validation

- Use `npm --workspace @superboard/ai-service run test:integration` when dependencies and service prerequisites are available.
- Use targeted `python -m pytest` commands for local Python tests when appropriate.
