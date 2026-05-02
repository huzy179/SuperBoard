# SuperBoard Coding Rules

## Scope

These rules apply to the entire repository. More specific `AGENTS.md` files under `apps/*` and `packages/*` override or extend this file.

## Project Baseline

- Treat this repo as an npm workspace/Turborepo monorepo with `apps/*` and `packages/*`.
- Use Node `>=20.11.0`, npm workspace commands, TypeScript 5.8, ESLint 9 flat config, and Prettier 3.
- Prefer focused workspace checks before root checks.
- Do not edit generated/build output: `dist`, `.next`, `.turbo`, `coverage`, generated `.d.ts`, or `node_modules`.

## TypeScript and Lint

- Do not weaken `tsconfig` or ESLint rules to hide errors.
- Do not introduce `any` unless an existing scoped rule explicitly permits it; prefer `unknown`, Zod validation, generics, or explicit interfaces.
- Remove unused variables or prefix intentionally unused args/vars with `_`.
- Use `import type` for type-only imports when it prevents runtime dependencies or cycles.
- Keep path casing exact and avoid deep imports from package internals unless exported.
- Do not add file-wide lint disables; use the smallest local exception only with a clear reason.

## Boundaries

- Apps may import packages; packages must not import from `apps/*`.
- Cross-app contracts belong in `packages/shared`.
- Reusable backend infrastructure belongs in `packages/backend-shared`.
- Reusable app-agnostic UI primitives belong in `packages/ui`.
- Add new dependencies to the owning workspace `package.json`; do not rely on transitive dependencies.

## Validation

- Run the changed workspace `lint` and `typecheck` scripts when available.
- Run builds for changes to package exports, app bootstrap, Next routes, Nest modules, Prisma, or shared config.
- Run targeted tests for changed behavior; mention skipped integration checks when infra is required.
