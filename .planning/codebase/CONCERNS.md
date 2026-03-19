# Codebase Concerns

**Analysis Date:** 2026-03-19

## Tech Debt

**Project domain service is oversized and mixes many responsibilities:**

- Issue: `ProjectService` handles project CRUD, task CRUD, assignee validation, DTO shaping, and soft-delete policy in one class.
- Files: `apps/api/src/modules/project/project.service.ts`, `apps/api/src/modules/project/project.controller.ts`
- Impact: Changes in one flow can regress other flows; onboarding and review cost stay high because one file is a hotspot.
- Fix approach: Split by capability (`project-read`, `project-write`, `task-write`) and move DTO mapping into dedicated mappers.

**Environment contract is stricter than runtime usage:**

- Issue: `ELASTICSEARCH_URL` and `REDIS_URL` are required in env validation even when corresponding features are not always active.
- Files: `apps/api/src/config/env.ts`, `apps/api/src/common/redis.service.ts`, `apps/api/src/common/queue.service.ts`
- Impact: Non-search/non-queue deployments can fail at startup due to unrelated env requirements.
- Fix approach: Make env vars conditional on `ENABLE_REDIS`/`ENABLE_QUEUE` and feature flags.

**Placeholder AI stack in production path:**

- Issue: AI service endpoints and gRPC server are stubs (`echo`, passthrough, string slice).
- Files: `apps/ai-service/grpc_server.py`, `apps/ai-service/services/chatbot.py`, `apps/ai-service/services/semantic_search.py`, `apps/ai-service/services/summarize.py`
- Impact: Product behavior appears integrated but delivers non-production results.
- Fix approach: Add integration contract tests and mark placeholder code paths explicitly behind feature flags.

## Known Bugs

**Token lifetime config is ignored:**

- Symptoms: Access tokens are always issued with `1d` even if env requests a different expiry.
- Files: `apps/api/src/modules/auth/auth.service.ts`, `apps/api/src/config/env.ts`
- Trigger: Set `JWT_EXPIRES_IN` in environment and authenticate.
- Workaround: None in runtime; code change required to pass config into `jwt.sign` options.

**Date-only due date may shift by timezone:**

- Symptoms: Task due date can appear one day earlier/later depending on client timezone.
- Files: `apps/api/src/modules/project/project.controller.ts`, `apps/web/app/(private)/jira/projects/[projectId]/page.tsx`
- Trigger: Submit `YYYY-MM-DD` from browser date input and render in different timezone context.
- Workaround: Use UTC date normalization before persistence and display.

## Security Considerations

**Access token stored in `localStorage`:**

- Risk: Any XSS in web app can exfiltrate long-lived bearer token.
- Files: `apps/web/lib/auth-storage.ts`, `apps/web/lib/api-client.ts`
- Current mitigation: Bearer auth plus backend guard.
- Recommendations: Move to `HttpOnly` secure cookie sessions or short-lived token + refresh token rotation.

**No explicit auth rate limiting on login path:**

- Risk: Credential stuffing and brute-force attempts can target `POST /auth/login`.
- Files: `apps/api/src/modules/auth/auth.controller.ts`, `apps/api/src/main.ts`
- Current mitigation: Credential check and unauthorized response.
- Recommendations: Add IP/user-based throttling and login attempt telemetry.

## Performance Bottlenecks

**Global no-store fetch policy disables beneficial caching:**

- Problem: Every request from web forces network roundtrip (`cache: 'no-store'`).
- Files: `apps/web/lib/api-client.ts`
- Cause: Single default request strategy for all endpoints.
- Improvement path: Keep no-store only for mutable/auth-sensitive endpoints; enable cache/revalidation for stable reads.

**Large client page with many local states and handlers:**

- Problem: `project detail` page is very large and tightly coupled to UI actions.
- Files: `apps/web/app/(private)/jira/projects/[projectId]/page.tsx`
- Cause: Fetch, board/list logic, form state, edit modal state, drag-drop, and optimistic updates are combined.
- Improvement path: Split into feature hooks/components and memoized subtrees per concern.

## Fragile Areas

**Multi-step writes without transaction boundaries:**

- Files: `apps/api/src/modules/project/project.service.ts`
- Why fragile: Existence checks and updates happen in separate queries; concurrent updates/deletes can interleave.
- Safe modification: Wrap critical check+write sequences in Prisma `$transaction` and enforce optimistic checks.
- Test coverage: No automated tests detected for these flows.

**Queue/Redis parsing relies on permissive URL coercion:**

- Files: `apps/api/src/common/queue.service.ts`, `apps/api/src/common/redis.service.ts`
- Why fragile: URL path-to-db conversion may produce invalid values and fail only at runtime.
- Safe modification: Validate parsed connection fields before queue/client initialization.
- Test coverage: No targeted infra parsing tests detected.

## Scaling Limits

**Task retrieval is full-list per project request:**

- Current capacity: Not measured in code; current API fetches all non-deleted tasks for a project detail request.
- Limit: Large projects will increase response size and client render cost.
- Scaling path: Add pagination/filtering and incremental loading for board/list views.

## Dependencies at Risk

**Framework major versions increase upgrade risk surface:**

- Risk: `next@16` + `react@19` + `nestjs@11` + `prisma@7` can introduce API and ecosystem churn.
- Impact: Build/runtime regressions are harder to isolate when multiple major stacks evolve together.
- Migration plan: Pin known-good versions per milestone and add compatibility smoke tests in CI.

## Missing Critical Features

**Planned backend modules are empty:**

- Problem: Domain areas exist as directories but have no implementation.
- Blocks: Workspace, task, notification, and upload capabilities are not available from API modules.
- Files: `apps/api/src/modules/workspace/`, `apps/api/src/modules/task/`, `apps/api/src/modules/notification/`, `apps/api/src/modules/upload/`

**Automated test suite absent:**

- Problem: No `*.test.*`/`*.spec.*` files detected in workspace.
- Blocks: Safe refactoring, regression prevention, and confidence in auth/project flows.

## Test Coverage Gaps

**Authentication and authorization flow untested:**

- What's not tested: Login failure/success, token verification edge cases, guard behavior on protected routes.
- Files: `apps/api/src/modules/auth/auth.controller.ts`, `apps/api/src/modules/auth/auth.service.ts`, `apps/api/src/common/guards/bearer-auth.guard.ts`
- Risk: Auth regressions can ship unnoticed and break all private routes.
- Priority: High

**Project/task mutation flow untested:**

- What's not tested: Create/update/delete task, status transitions, soft-delete behavior, assignee validation.
- Files: `apps/api/src/modules/project/project.service.ts`, `apps/api/src/modules/project/project.controller.ts`
- Risk: Data integrity bugs and race-condition defects can escape to production.
- Priority: High

---

_Concerns audit: 2026-03-19_
