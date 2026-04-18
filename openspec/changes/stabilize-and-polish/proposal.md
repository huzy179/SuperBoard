## Why

The SuperBoard codebase has accumulated critical stability and quality debt that puts production readiness at risk:

1. **Broken infrastructure**: `LoggingInterceptor` returns `next.handle() as any`, producing zero log output — debugging production issues is impossible.
2. **Performance at scale**: `getDashboardStats` and `getProjectByIdForWorkspace` load entire task tables into memory and aggregate in JS. Works fine for 50 tasks; silently degrades or crashes at 10,000+.
3. **Security gap**: No role-based authorization enforcement — workspace "viewer" role can call "admin-only" endpoints (bulk transition, workflow mutation).
4. **Type safety holes**: `DashboardModule` interface uses `[key: string]: any`, `TaskStatusDTO = string`, `$meta as any` in exception filters — TypeScript's safety guarantees are broken at critical boundaries.
5. **UI polish gaps**: Missing loading states for AI panels, no error boundaries for feature sections, heavy components loaded eagerly.

All of these are incremental fixes with clear scope — no rewrites, no architectural changes.

## What Changes

### Phase 0 — Quick Wins (2 tasks)

- **Fix `LoggingInterceptor`**: Implement proper request logging (method, URL, userId, duration, statusCode) using existing `Logger` from `common/logger`.
- **Fix `useAuthSession`**: Convert redundant `useEffect` API call to React Query `useQuery` with 5-minute `staleTime`. Opening 3 pages = 1 API call, not 3.

### Phase 1 — Critical Performance (4 tasks)

- **Fix `getDashboardStats`**: Replace `findMany` + JS aggregation with `GROUP BY` queries at the DB level. Add pagination (`take: 50`) for task list. Result: dashboard with 10,000 tasks loads in <500ms.
- **Add missing DB indexes**: `TaskEvent.actorId`, `SignalLog.integrationId`, `Task.projectId+deletedAt+createdAt`, `Doc.createdById`, `AuditLog.actorId`. Create migration `add-performance-indexes`.
- **Paginate `getProjectByIdForWorkspace`**: Add `take: 50` + `cursor` support. Parallelize independent queries with `Promise.all`.
- **Parallelize `bulkOperateTasksForProject`**: Batch status lookup into 1 query (not N sequential). Use `Map<id, status>` for O(1) in-memory validation.

### Phase 2 — Type Safety Cleanup (4 tasks)

- **Fix `$meta as any` in `HttpExceptionFilter`**: Extend `ApiResponse.meta` type to include `trace` field. Remove `as any` cast.
- **Fix `DashboardModule` interface**: Replace `[key: string]: any` with a discriminated union of specific module types (`ChartModule | StatModule | ListModule`). Validate at parse time.
- **Fix `TaskStatusDTO`**: Change from `string` to a union literal type `TaskStatusCategory = 'todo' | 'in_progress' | 'review' | 'done' | 'blocked'`.
- **Clean remaining `any` types**: `DocTOC.tsx` TipTap JSON → `TipTapNode[]`, `http-exception.filter.ts` request/response → typed.

### Phase 3 — Authorization Baseline (2 tasks)

- **Create `RolesGuard`**: New guard using `@Roles()` decorator + `SetMetadata`. Check user role in workspace membership. Register globally alongside `BearerAuthGuard`.
- **Protect admin endpoints**: Add `@Roles('ADMIN', 'OWNER')` to bulk transition, delete project, and workflow mutation endpoints. Viewer role receives 403 Forbidden.

### Phase 4 — UI/UX Polish (5 tasks)

- **Add `ErrorBoundary`**: Wrap `NeuralWorkspaceDigest`, `DashboardModule`, and `TaskBoardView` in `react-error-boundary` with `FullPageError` fallback. AI failure doesn't crash the page.
- **Add loading state for `NeuralWorkspaceDigest`**: Show `DigestSkeleton` (dark glass pulse animation) while fetching workspace digest. Other AI panels already have skeletons from `ui-ux-consistency`.
- **Lazy-load heavy components**: Use `next/dynamic` with `ssr: false` for `RichTextEditor` (TipTap), `AgentActivityLog`, `WorkspaceHealth`, `SymbiosisConsole`. Reduce initial bundle size.
- **Lift `QueryProvider` to root**: Move from `(private)/layout.tsx` to `app/layout.tsx`. All routes (public + private) get React Query. Removes the orphaned non-React-Query fetch in `PrivateShell`.
- **Cache `PrivateShell` navigation-focus fetch**: Convert raw `useEffect`+`fetch` to React Query `useQuery` with 5-min `staleTime`. Navigate between pages without re-fetching.

## Capabilities

### New Capabilities

- `error-boundary-feature`: React error boundary wrapping for AI/board feature sections. Ensures component failure is isolated and recoverable.
- `role-based-authorization`: NestJS guard + decorator for endpoint-level role enforcement in workspace context.

### Modified Capabilities

- (none — all changes are implementation-level, no spec-level requirement changes)

## Impact

| Area                                                              | Impact                                                          |
| ----------------------------------------------------------------- | --------------------------------------------------------------- |
| `apps/api/src/common/interceptors/logging.interceptor.ts`         | Fix broken logging implementation                               |
| `apps/api/src/common/filters/http-exception.filter.ts`            | Remove `as any`, fix type safety                                |
| `apps/api/src/modules/project/project.service.ts`                 | 4 tasks: stats aggregation, pagination, parallelization, cursor |
| `apps/api/prisma/schema.prisma`                                   | Add 5 indexes, run migration `add-performance-indexes`          |
| `apps/api/src/common/guards/`                                     | New `roles.guard.ts`, `@Roles()` decorator                      |
| `apps/api/src/modules/project/project.controller.ts`              | Add `@Roles()` to admin endpoints                               |
| `apps/web/src/features/auth/hooks/use-auth-session.ts`            | React Query pattern                                             |
| `apps/web/src/app/layout.tsx`                                     | Add `QueryProvider` at root                                     |
| `apps/web/src/components/layout/private-shell.tsx`                | React Query for navigation-focus                                |
| `apps/web/src/app/(private)/jira/page.tsx`                        | Add `ErrorBoundary` wrappers                                    |
| `apps/web/src/app/(private)/dashboard/page.tsx`                   | Fix `DashboardModule` type, lazy-load widgets                   |
| `apps/web/src/features/ai/components/neural-workspace-digest.tsx` | Add loading skeleton                                            |
| `packages/shared/src/dtos/project.dto.ts`                         | Fix `TaskStatusDTO`, `CumulativeFlowPointDTO`                   |
