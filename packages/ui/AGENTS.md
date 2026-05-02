# UI Package Rules

## Scope

Applies to `packages/ui`.

## Components

- Keep components app-agnostic; do not import from `apps/web`.
- Pass app-specific behavior through props.
- Preserve accessibility, keyboard support, focus states, and theme compatibility.
- Keep React and React DOM as peer dependencies.
- Avoid hard-coded product-specific copy or route assumptions.

## Validation

- Use `npm --workspace @superboard/ui run lint`.
- Use `npm --workspace @superboard/ui run type-check`.
