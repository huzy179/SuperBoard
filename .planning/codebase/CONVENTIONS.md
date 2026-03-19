# Coding Conventions

**Analysis Date:** 2026-03-19

## Naming Patterns

**Files:**

- Use `kebab-case` for TypeScript source files in API and web: `apps/api/src/modules/project/project.service.ts`, `apps/web/hooks/use-project-list.ts`, `apps/web/lib/api-client.ts`.
- Use grouped route directories for Next.js App Router with segment modifiers: `apps/web/app/(private)/jira/page.tsx`, `apps/web/app/(public)/login/page.tsx`.
- Use dotted migration folder names with timestamp prefix in Prisma: `apps/api/prisma/migrations/20260318182934_add_global_soft_delete_columns/`.

**Functions:**

- Use `camelCase` for functions/methods and handlers: `validateEnv`, `getProjectsByWorkspace`, `handleCreateProject`, `apiRequest`.
- Prefix React hooks with `use`: `apps/web/hooks/use-project-list.ts`, `apps/web/hooks/use-auth-session.ts`.
- Use verb-first async service methods in API and web service wrappers: `createProject`, `updateTaskForProject`, `deleteProjectTask`.

**Variables:**

- Use `camelCase` for local variables and parameters (`normalizedName`, `defaultWorkspaceId`, `createLoading`).
- Use UPPER_SNAKE_CASE for constants and env names (`DEFAULT_API_BASE_URL`, `DATABASE_URL`, `JWT_SECRET`).

**Types:**

- Use `PascalCase` for interfaces, classes, and DTO aliases (`ProjectService`, `ApiClientError`, `CreateProjectRequestDTO`, `ProjectItemDTO`).
- Use `DTO` suffix consistently for transport contracts in shared package: `packages/shared/src/dtos/project.dto.ts`, `packages/shared/src/dtos/auth.dto.ts`.

## Code Style

**Formatting:**

- Tool: Prettier from root config `/.prettierrc.json`.
- Key settings: `singleQuote: true`, `semi: true`, `trailingComma: all`, `printWidth: 100`, `tabWidth: 2`.

**Linting:**

- Tool: ESLint flat config at `/eslint.config.mjs` with `@eslint/js` and `@typescript-eslint`.
- TS lint rules inherit `@typescript-eslint` recommended rules and disable `no-undef` for TS files.
- Ignore patterns include build outputs and generated files (`**/dist/**`, `**/.next/**`, `apps/web/next-env.d.ts`).

## Import Organization

**Order:**

1. External runtime and framework imports (`@nestjs/common`, `react`, `next/link`, `zod`).
2. Shared package types/contracts (`@superboard/shared`, `@prisma/client`).
3. Internal project imports (aliases like `@/lib/...` or relative `../../prisma/...`).

**Path Aliases:**

- Web alias `@/*` configured in `apps/web/tsconfig.json` and used in `apps/web/lib/services/project-service.ts`.
- API uses mostly relative imports plus workspace package imports (`@superboard/shared`) in files like `apps/api/src/modules/project/project.controller.ts`.

## Error Handling

**Patterns:**

- API throws Nest exceptions for domain validation and auth checks (`BadRequestException`, `UnauthorizedException`, `NotFoundException`) in `apps/api/src/modules/project/project.controller.ts` and `apps/api/src/modules/auth/auth.service.ts`.
- Global exception mapping is centralized via `HttpExceptionFilter` in `apps/api/src/common/filters/http-exception.filter.ts`.
- API response envelope is standardized with `apiSuccess` helper in `apps/api/src/common/api-response.ts`.
- Web request layer throws typed `ApiClientError` in `apps/web/lib/api-client.ts`; UI catches and maps to user-facing messages in `apps/web/hooks/use-project-list.ts` and `apps/web/app/(private)/jira/page.tsx`.

## Logging

**Framework:**

- API uses `pino` logger in `apps/api/src/common/logger.ts`.

**Patterns:**

- Prefer structured logs with message keys (`logger.info({ port }, 'api.started')`) in `apps/api/src/main.ts`.
- Add request correlation context through middleware and logger mixin (`apps/api/src/common/request-context.middleware.ts`, `apps/api/src/common/request-context.ts`, `apps/api/src/common/logger.ts`).
- Web currently relies on UI error states rather than explicit logging abstractions in app code under `apps/web/app/` and `apps/web/hooks/`.

## Comments

**When to Comment:**

- Minimal inline comments in TypeScript source; intent is expressed via descriptive naming and DTO types.
- Operational documentation lives in markdown files (`README.md`, `docker/README.md`, `worklog/PROJECT_STRUCTURE.md`).

**JSDoc/TSDoc:**

- Not detected in current API/web source (`apps/api/src/**`, `apps/web/**`).

## Function Design

**Size:**

- Controllers and pages can be large and orchestration-heavy (`apps/api/src/modules/project/project.controller.ts`, `apps/web/app/(private)/jira/page.tsx`).
- Service and utility functions remain focused and single-purpose (`apiGet`, `apiPost`, `toAuthUser`, `validateEnv`).

**Parameters:**

- API methods accept explicit typed DTOs or typed input objects for multi-arg cases (`updateProjectForWorkspace(input: {...})`).
- Web service wrappers pass DTO payloads directly to the API client (`createProject(payload)`, `updateProjectTask(projectId, taskId, payload)`).

**Return Values:**

- API controllers return response DTO wrappers from shared contracts (`ProjectsResponseDTO`, `UpdateTaskResponseDTO`).
- API services return DTO-friendly plain objects with normalized dates (`toISOString()` in `apps/api/src/modules/project/project.service.ts`).

## Module Design

**Exports:**

- Use barrel exports in shared package (`packages/shared/src/index.ts`, `packages/shared/src/dtos/index.ts`).
- Feature modules in NestJS expose providers selectively via `exports` array (`apps/api/src/modules/project/project.module.ts`).

**Barrel Files:**

- Present in shared package; limited use in app layers where direct file imports are preferred.

---

_Convention analysis: 2026-03-19_
