# Architecture Map

## Workspaces

- `apps/web`: Next.js App Router frontend, React 19, TanStack Query, feature-based source tree.
- `apps/api`: main NestJS API, Prisma/PostgreSQL, domain modules under `src/modules`.
- `apps/automation`: NestJS worker/service for automation rules.
- `apps/notification`: NestJS notification worker/service with queues and delivery integrations.
- `apps/search`: NestJS search worker/service.
- `apps/collaboration`: NestJS Socket.io realtime engine.
- `apps/collab-service`: Hocuspocus/Yjs collaboration service, strict standalone TS.
- `apps/ai-service`: Python FastAPI AI/search/summarization service.
- `packages/shared`: app-agnostic DTOs, schemas, events, proto, and public contracts.
- `packages/backend-shared`: reusable backend infrastructure for Nest/microservices.
- `packages/ui`: shared React UI primitives/components.
- `packages/config-ts` and `packages/config-eslint`: central config packages.

## Boundary Rules

- App code may depend on packages; packages must not depend on apps.
- `packages/shared` is the contract source between frontend and backend; update it before duplicating cross-app types.
- Cross-domain backend calls should go through public module APIs, dependency injection, or events, not direct service/repository imports across module folders.
- Frontend feature code should stay within its feature slice unless extracting reusable UI to `src/components` or `packages/ui`.
- Shared infrastructure belongs in `packages/backend-shared` only when at least two backend services need it.

## Placement Decision

- New API route or database-backed domain behavior: `apps/api/src/modules/<domain>`.
- Background job behavior: owning worker app (`automation`, `notification`, `search`) plus shared event contract if needed.
- Browser UI, route, hook, client state: `apps/web/src`.
- Reusable design primitive: `packages/ui/src` only if it is app-agnostic.
- Cross-service DTO/schema/event type: `packages/shared/src`.
- Nest bootstrap, health, metrics, AMQP, config helpers: `packages/backend-shared/src`.
