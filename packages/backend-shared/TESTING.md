# Testing conventions

This package uses Jest for TypeScript and `pytest` for Python.

## TypeScript

- Place tests under `src/**/__tests__/**`.
- Use `.test.ts` suffix for test files.
- Manual scripts should live outside `__tests__` (example: `src/config/manual/`).

Run:

- `npm --workspace @superboard/backend-shared test`

## Python

- Place tests under `python/tests/` (or alongside modules if needed).
- Use `pytest` + `hypothesis` for property-style tests.

Run:

- `npm --workspace @superboard/backend-shared run test:python`
