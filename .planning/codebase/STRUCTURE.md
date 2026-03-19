# Codebase Structure

**Analysis Date:** 2026-03-19

## Directory Layout

```text
SuperBoard/
├── apps/                   # Deployable applications (web, api, ai-service)
│   ├── web/                # Next.js frontend (App Router)
│   ├── api/                # NestJS backend API + Prisma
│   └── ai-service/         # Python AI/gRPC service
├── packages/               # Shared internal packages
│   ├── shared/             # Shared DTOs/types/schemas/events
│   ├── config-ts/          # Shared tsconfig presets
│   ├── config-eslint/      # Shared ESLint config
│   └── ui/                 # Shared UI package scaffold
├── docker/                 # Dockerfiles + compose + infra bootstrap SQL
├── scripts/                # Repository-level setup/health/db scripts
├── worklog/                # Planning and delivery logs
└── .planning/codebase/     # Generated codebase mapping documents
```

## Directory Purposes

**`apps/web`:**

- Purpose: User-facing frontend with public/private route separation.
- Contains: `app` route tree, presentational `components`, async `hooks`, and API adapters in `lib`.
- Key files: `apps/web/app/layout.tsx`, `apps/web/app/(private)/layout.tsx`, `apps/web/lib/api-client.ts`.

**`apps/api`:**

- Purpose: REST API and business logic.
- Contains: Nest bootstrap/module graph in `src`, Prisma schema/migrations in `prisma`.
- Key files: `apps/api/src/main.ts`, `apps/api/src/app.module.ts`, `apps/api/prisma/schema.prisma`.

**`apps/ai-service`:**

- Purpose: AI HTTP and gRPC service boundary.
- Contains: `main.py`, `grpc_server.py`, AI helpers in `services`, proto definitions in `proto`.
- Key files: `apps/ai-service/main.py`, `apps/ai-service/grpc_server.py`, `apps/ai-service/proto/ai_service.proto`.

**`packages/shared`:**

- Purpose: Cross-app compile-time contracts.
- Contains: DTOs, types, schemas, event definitions.
- Key files: `packages/shared/src/index.ts`, `packages/shared/src/dtos/index.ts`, `packages/shared/src/types/index.ts`.

**`docker`:**

- Purpose: Local infrastructure and containerized app runtime.
- Contains: `docker-compose.yml`, service Dockerfiles, Postgres init scripts.
- Key files: `docker/docker-compose.yml`, `docker/Dockerfile.api`, `docker/Dockerfile.web`.

## Key File Locations

**Entry Points:**

- `apps/api/src/main.ts`: API process bootstrap and middleware/filter registration.
- `apps/web/app/layout.tsx`: Web global layout root.
- `apps/web/app/page.tsx`: Root route redirect to login.
- `apps/ai-service/main.py`: FastAPI app entry.
- `apps/ai-service/grpc_server.py`: gRPC server startup stub.

**Configuration:**

- `package.json`: Workspace scripts and monorepo-level orchestration commands.
- `turbo.json`: Build/dev task pipeline.
- `apps/api/src/config/env.ts`: API environment variable schema validation.
- `apps/web/tsconfig.json`: Web path aliases (`@/*`, `@/lib/*`, etc.).

**Core Logic:**

- `apps/api/src/modules/auth/*`: Login/token/user identity flow.
- `apps/api/src/modules/project/*`: Project/task CRUD logic.
- `apps/web/lib/services/*`: Frontend domain API adapters.
- `apps/web/app/(private)/jira/*`: Project and task UI workflows.

**Testing:**

- Repository has no established `*.test.*` / `*.spec.*` tree detected in `apps/*` as of this scan.

## Naming Conventions

**Files:**

- API/Nest files use kebab-case by role: `auth.controller.ts`, `project.service.ts`, `bearer-auth.guard.ts`.
- Web route files follow Next App Router conventions: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`.
- Shared package files use domain suffixes: `*.dto.ts`, `*.types.ts`.

**Directories:**

- Backend domains grouped under `apps/api/src/modules/<domain>/` (e.g., `auth`, `project`).
- Frontend segmented by concerns: `apps/web/components/*`, `apps/web/hooks/*`, `apps/web/lib/*`.
- Route groups use parenthesized directories in Next app tree: `apps/web/app/(public)`, `apps/web/app/(private)`.

## Where to Add New Code

**New API feature:**

- Primary code: `apps/api/src/modules/<feature>/` with `<feature>.module.ts`, `<feature>.controller.ts`, `<feature>.service.ts`.
- Shared DTO contracts: `packages/shared/src/dtos/<feature>.dto.ts` then export from `packages/shared/src/dtos/index.ts`.
- Database schema/migrations: `apps/api/prisma/schema.prisma` and `apps/api/prisma/migrations/*`.

**New Web feature route:**

- Route UI: `apps/web/app/(private)/<feature>/page.tsx` (or `(public)` if unauthenticated).
- Data calls: `apps/web/lib/services/<feature>-service.ts` + endpoint constants in `apps/web/lib/api/endpoints.ts`.
- Reusable UI shell/sections: `apps/web/components/<area>/`.

**Utilities:**

- API cross-cutting helpers: `apps/api/src/common/*`.
- Web shared browser/runtime helpers: `apps/web/lib/*`.
- Cross-app type-safe contracts: `packages/shared/src/*`.

## Special Directories

**`.planning/codebase`:**

- Purpose: Generated mapping docs used by GSD planner/executor.
- Generated: Yes.
- Committed: Intended to be committed for workflow context.

**`apps/web/.next` and `apps/api/dist`:**

- Purpose: Build/runtime artifacts.
- Generated: Yes.
- Committed: No (derived outputs).

**`.turbo` (root and workspace-level):**

- Purpose: Turborepo task cache.
- Generated: Yes.
- Committed: No.

---

_Structure analysis: 2026-03-19_
