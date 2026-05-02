# TypeScript Config Package Rules

## Scope

Applies to `packages/config-ts`.

## Config

- This package owns shared compiler baselines.
- Do not loosen `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, module resolution, or casing rules to solve app-local issues.
- Keep `nextjs.json` aligned with Next/Bundler behavior and `node.json` aligned with NodeNext backend packages.
- Config changes affect many workspaces; validate broadly.

## Validation

- Run root `npm run typecheck` after changes.
- Run targeted workspace typechecks if the root command exposes unrelated failures.
