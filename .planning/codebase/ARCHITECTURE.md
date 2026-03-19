# Architecture

**Analysis Date:** 2026-03-19

## Pattern Overview

**Overall:** Multi-app monorepo with layered service boundaries (UI app, API app, AI app, shared package)

**Key Characteristics:**

- Turborepo workspace orchestrates app-level builds and dev processes from `package.json` and `turbo.json`.
- API uses modular NestJS (`controller -> service -> Prisma`) under `apps/api/src/modules/*`.
- Web uses Next.js App Router with route groups (`apps/web/app/(public)` and `apps/web/app/(private)`) and client-side service layer in `apps/web/lib/services/*`.

## Layers

**Monorepo Orchestration Layer:**

- Purpose: Run, build, lint, and typecheck all workspaces.
- Location: `package.json`, `turbo.json`, `apps/*`, `packages/*`
- Contains: Workspace definitions, turbo task graph, root scripts.
- Depends on: npm workspaces + Turborepo.
- Used by: All app/package workflows.

**Shared Contract Layer:**

- Purpose: Provide shared DTO/types/contracts for API and Web.
- Location: `packages/shared/src/index.ts`, `packages/shared/src/dtos/*`, `packages/shared/src/types/*`
- Contains: DTOs (`auth.dto.ts`, `project.dto.ts`, `health.dto.ts`), types, schemas.
- Depends on: TypeScript package build.
- Used by: `apps/api/src/**/*` and `apps/web/**/*` via `@superboard/shared` imports.

**API Application Layer (NestJS):**

- Purpose: Expose authenticated REST APIs and health endpoints.
- Location: `apps/api/src/main.ts`, `apps/api/src/app.module.ts`, `apps/api/src/modules/*`
- Contains: Controllers, services, guards, filters, infra services (Prisma/Redis/Queue).
- Depends on: Prisma (`apps/api/prisma/schema.prisma`), Redis/BullMQ, JWT config.
- Used by: Web frontend (`apps/web/lib/api/endpoints.ts`) and health scripts.

**Web Application Layer (Next.js):**

- Purpose: Render public/private UI and call backend APIs.
- Location: `apps/web/app/*`, `apps/web/components/*`, `apps/web/hooks/*`, `apps/web/lib/*`
- Contains: Route groups, guard components, API client, domain service wrappers.
- Depends on: Next.js app router + browser localStorage token strategy in `apps/web/lib/auth-storage.ts`.
- Used by: End users via browser.

**AI Service Layer (FastAPI + gRPC placeholder):**

- Purpose: AI-side service entry and future RPC boundary.
- Location: `apps/ai-service/main.py`, `apps/ai-service/grpc_server.py`, `apps/ai-service/services/*`
- Contains: HTTP health endpoint and simple service functions (`summarize.py`, `chatbot.py`, `semantic_search.py`).
- Depends on: Python runtime and AI service requirements.
- Used by: Internal service-to-service integration (planned/incremental).

## Data Flow

**Auth + Protected API flow:**

1. UI login page in `apps/web/app/(public)/login/page.tsx` calls `login()` from `apps/web/lib/services/auth-service.ts`.
2. `apps/web/lib/api-client.ts` sends request to `apps/api/src/modules/auth/auth.controller.ts` (`POST /api/v1/auth/login`).
3. `apps/api/src/modules/auth/auth.service.ts` verifies credentials with Prisma via `apps/api/src/prisma/prisma.service.ts`, then signs JWT.
4. UI stores access token in `apps/web/lib/auth-storage.ts`; private routes use `apps/web/components/guards/private-route-guard.tsx` + `apps/web/hooks/use-auth-session.ts` to fetch `GET /api/v1/auth/me`.
5. API global `BearerAuthGuard` (`apps/api/src/common/guards/bearer-auth.guard.ts`) validates token and injects user for protected controllers.

**Project/Task CRUD flow:**

1. Screens in `apps/web/app/(private)/jira/page.tsx` and `apps/web/app/(private)/jira/projects/[projectId]/page.tsx` call functions in `apps/web/lib/services/project-service.ts`.
2. Service functions hit endpoints declared in `apps/web/lib/api/endpoints.ts`.
3. `apps/api/src/modules/project/project.controller.ts` validates request payloads and auth context.
4. `apps/api/src/modules/project/project.service.ts` executes Prisma queries against schema in `apps/api/prisma/schema.prisma`.
5. Responses return through `apiSuccess` helper in `apps/api/src/common/api-response.ts`; errors are normalized by `apps/api/src/common/filters/http-exception.filter.ts`.

**Request observability flow (API):**

1. `apps/api/src/main.ts` installs `requestContextMiddleware`.
2. `apps/api/src/common/request-context.middleware.ts` creates/propagates `x-correlation-id` and wraps request with AsyncLocalStorage from `apps/api/src/common/request-context.ts`.
3. `apps/api/src/common/logger.ts` enriches logs with `correlationId` via pino mixin.

**State Management:**

- Web uses local component state (`useState/useEffect/useMemo`) in route components and hooks.
- Session state is token-based (browser localStorage + API `/auth/me` verification), no global state library in current structure.

## Key Abstractions

**Module-driven API domain abstraction:**

- Purpose: Encapsulate each backend domain into module/controller/service units.
- Examples: `apps/api/src/modules/auth/auth.module.ts`, `apps/api/src/modules/project/project.module.ts`
- Pattern: NestJS dependency injection with services as domain logic boundary.

**Transport contract abstraction:**

- Purpose: Keep request/response contracts synchronized between frontend and backend.
- Examples: `packages/shared/src/dtos/auth.dto.ts`, `packages/shared/src/dtos/project.dto.ts`
- Pattern: Shared DTO package imported from both apps via `@superboard/shared`.

**Frontend data-access abstraction:**

- Purpose: Hide fetch/auth/error details from page components.
- Examples: `apps/web/lib/api-client.ts`, `apps/web/lib/services/auth-service.ts`, `apps/web/lib/services/project-service.ts`
- Pattern: Generic API client + per-domain service wrappers.

## Entry Points

**API Bootstrap:**

- Location: `apps/api/src/main.ts`
- Triggers: `npm run dev` / `npx nest start --watch` in `apps/api/package.json`
- Responsibilities: Create Nest app, register middleware/filter, CORS, global route prefix `api/v1`.

**API Root Module:**

- Location: `apps/api/src/app.module.ts`
- Triggers: Loaded by Nest bootstrap.
- Responsibilities: Wire `AuthModule`, `ProjectModule`, global guard, infra providers.

**Web Root Layout:**

- Location: `apps/web/app/layout.tsx`
- Triggers: Next.js App Router runtime.
- Responsibilities: Global HTML/body wrapper and global styles.

**Web Route Group Layouts:**

- Location: `apps/web/app/(public)/layout.tsx`, `apps/web/app/(private)/layout.tsx`
- Triggers: Navigation into public/private route segments.
- Responsibilities: Public shell vs protected shell with auth guard.

**AI HTTP Entry:**

- Location: `apps/ai-service/main.py`
- Triggers: Python app startup.
- Responsibilities: Serve FastAPI app and health endpoint.

**AI gRPC Entry (placeholder):**

- Location: `apps/ai-service/grpc_server.py`
- Triggers: Direct Python execution.
- Responsibilities: Start gRPC server stub.

## Error Handling

**Strategy:** Standardized API error envelope + frontend service-layer exceptions

**Patterns:**

- API catches and normalizes all exceptions in `apps/api/src/common/filters/http-exception.filter.ts`.
- Frontend throws/handles `ApiClientError` in `apps/web/lib/api-client.ts`, then surfaces message at page/hook level.

## Cross-Cutting Concerns

**Logging:** `apps/api/src/common/logger.ts` (pino) + request timing in `apps/api/src/common/request-context.middleware.ts`.

**Validation:** Runtime env validation in `apps/api/src/config/env.ts`; request-level validation is mostly controller-level manual checks in `apps/api/src/modules/*/*.controller.ts`.

**Authentication:** Global bearer guard in `apps/api/src/common/guards/bearer-auth.guard.ts` with route opt-out via `@Public()` decorator in `apps/api/src/common/decorators/public.decorator.ts`.

---

_Architecture analysis: 2026-03-19_
