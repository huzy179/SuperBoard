# ESLint Config Package Rules

## Scope

Applies to `packages/config-eslint`.

## Config

- Keep ESLint 9 flat-config compatibility.
- Do not add broad disables that mask project errors.
- Prefer scoped rules and explicit ignores for generated files.
- Config changes affect many workspaces; validate broadly.

## Validation

- Run root `npm run lint` after changes.
- Run targeted workspace lint commands if the root command exposes unrelated failures.
