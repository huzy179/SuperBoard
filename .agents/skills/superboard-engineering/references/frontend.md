# Frontend Rules

## Structure

- Routes live in `apps/web/src/app`; domain implementation lives in `apps/web/src/features`.
- Shared app-level helpers live in `apps/web/src/lib`; reusable layout/UI lives in `apps/web/src/components`.
- Import aliases are `@/*`, `@/features/*`, `@/components/*`, `@/lib/*`, and `@/stores/*`.
- Keep route files thin: compose feature components and route metadata; avoid embedding transport/business logic in pages.

## Data Fetching

- Do not add direct `fetch(` outside `apps/web/src/lib/api-client.ts`.
- Use `API_ENDPOINTS` as the path registry.
- Feature code should call `features/**/api/*-service.ts` or existing service abstractions.
- Use `queryKeys` from `apps/web/src/lib/query-keys.ts` for TanStack Query keys.
- Use standard hooks such as `useAppQuery` and `useAppMutation` when present.
- API client should not own toast policy; feature/UI layers own user-facing notification behavior.

## React and Next

- Preserve App Router conventions. Add `"use client"` only when the file uses client-only hooks, browser APIs, events, or state.
- Avoid making large route trees client components to solve one hook issue; isolate client islands.
- Keep server/client boundaries serializable.
- Avoid hydration-sensitive values during render; compute them in effects or on the server.

## UI Quality

- Prefer existing components from `packages/ui` and `apps/web/src/components/ui` before adding new one-off components.
- Keep styling token-driven and consistent with `docs/DESIGN_SYSTEM.md` and `apps/web/src/app/globals.css`.
- Avoid arbitrary spacing/radius/color unless there is a local pattern justifying it.
- Preserve accessibility: labels, focus states, keyboard paths, alt text, and sufficient contrast.

## Validation

- Targeted checks: `npm --workspace @superboard/web run lint`, `npm --workspace @superboard/web run typecheck`, `npm --workspace @superboard/web run test`.
- UI audit command: `npm --workspace @superboard/web run ui:audit`.
- Direct fetch check: `rg "fetch\\(" apps/web/src`.
