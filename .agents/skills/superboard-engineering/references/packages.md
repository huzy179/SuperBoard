# Package Rules

## `packages/shared`

- Contains app-agnostic contracts: DTOs, Zod schemas, events, proto, error types, and exported public types.
- Must never import from `apps/*`.
- Update exports and contract tests when adding or changing public contracts.
- Keep runtime dependencies small and browser-safe when contracts are consumed by frontend.
- Validate with `npm --workspace @superboard/shared run lint`, `typecheck`, `build`, and `test` when relevant.

## `packages/backend-shared`

- Contains reusable backend infrastructure: AMQP, health, config, events, metrics, bootstrap, connections, errors, testing utilities, and shared backend types.
- Can depend on Nest/backend libraries; should not depend on app modules.
- Exports are explicit subpaths in `package.json`; add or update subpath exports when adding public modules.
- Stricter ESLint applies: no non-null assertion, prefer optional chaining/nullish coalescing, explicit function return type is warned.
- Validate with `npm --workspace @superboard/backend-shared run lint`, `typecheck`, `build`, and tests when feasible.

## `packages/ui`

- Contains app-agnostic React UI primitives.
- Do not import from `apps/web/src`; pass app-specific behavior through props.
- Keep components accessible and theme-compatible.
- Preserve peer dependencies for React/React DOM.
- Validate with `npm --workspace @superboard/ui run lint` and `npm --workspace @superboard/ui run type-check`.

## Config Packages

- `packages/config-ts` owns shared TS compiler baselines. Do not loosen strict config to solve app-local errors.
- `packages/config-eslint` is shared lint config surface. Keep flat-config compatibility.
- Config changes affect multiple workspaces; run at least root `npm run typecheck` or workspace checks covering dependents.
