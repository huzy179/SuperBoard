# Web App Rules

## Scope

Applies to `apps/web`.

## Architecture

- Use Next.js App Router conventions. Routes live in `src/app`; implementation should live in `src/features`, `src/components`, or `src/lib`.
- Keep route files thin; put domain UI and logic in feature modules.
- Add `"use client"` only for files that need client-only hooks, browser APIs, event handlers, or state.
- Keep server/client boundaries serializable and avoid hydration-sensitive render values.

## Data Access

- Do not add direct `fetch(` outside `src/lib/api-client.ts`.
- Use `API_ENDPOINTS` as the endpoint registry.
- Feature code should call service files such as `features/**/api/*-service.ts`, not transport directly.
- Use centralized query keys from `src/lib/query-keys.ts` for TanStack Query.
- Keep toast/notification policy in UI or feature layers, not in the API client.

## UI

- Prefer existing components from `@superboard/ui`, `src/components/ui`, and local feature components before creating new primitives.
- Keep styling consistent with `src/app/globals.css`, `docs/DESIGN_SYSTEM.md`, and existing tokens.
- Avoid arbitrary colors, radii, spacing, and animation unless matching an established local pattern.
- Preserve labels, focus states, keyboard access, alt text, loading, empty, and error states.

## Validation

- Use `npm --workspace @superboard/web run lint`.
- Use `npm --workspace @superboard/web run typecheck`.
- Use `npm --workspace @superboard/web run test` for changed lib behavior.
- Check direct fetch violations with `rg "fetch\\(" apps/web/src`.
