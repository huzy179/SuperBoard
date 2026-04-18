## Context

SuperBoard is a NestJS + Next.js monorepo with PostgreSQL/Prisma backend and React Query frontend. The `ui-ux-consistency` change (18/18 tasks, 2026-04-15) completed dark glass theming and Vietnamese localization. This change addresses the stability and quality debt that was identified but deferred during that cycle.

**Current state problems:**

```
API Layer
├── LoggingInterceptor       → broken: returns `next.handle() as any`
├── HttpExceptionFilter     → `$meta as any` type violation
├── ProjectService          → God Object (1,356 lines), O(n) aggregation
├── getDashboardStats       → loads ALL tasks into memory, no pagination
├── getProjectByIdForWorkspace → returns ALL tasks, no pagination
├── bulkOperateTasksForProject → N sequential DB queries for N tasks
└── No role enforcement     → viewer can call admin endpoints

Web Layer
├── useAuthSession          → API call on every mount (no React Query cache)
├── QueryProvider           → only in (private)/layout, not at root
├── DashboardModule         → `[key: string]: any` interface
├── NeuralWorkspaceDigest   → no loading skeleton
├── Heavy components        → eager-loaded (TipTap, AI panels)
└── No ErrorBoundary       → AI crash kills entire page

Shared
├── TaskStatusDTO           → `string` allows any value
└── CumulativeFlowPointDTO  → index signature loses type safety
```

**Constraints:**

- Incremental fixes only — no rewrites, no architectural changes
- New dependencies case-by-case (no tRPC, no GraphQL migration)
- Follow existing patterns (Prisma, React Query, NestJS guards)
- Must pass `npm run type-check && npm run lint && npm run build`

## Goals / Non-Goals

**Goals:**

- Fix all CRITICAL issues (broken interceptor, memory-leaking queries, missing authorization)
- Eliminate all `as any` casts in application code
- Add pagination to all list endpoints that could scale beyond 100 items
- Add loading states and error boundaries to all async feature sections
- Reduce initial bundle size by lazy-loading heavy components

**Non-Goals:**

- Split `ProjectService` into multiple services (out of scope — requires full restructure)
- Replace `BroadcastChannel` + WebSocket with a different sync mechanism
- Add rate limiting beyond existing Redis-based guard
- Migration to tRPC, GraphQL, or any new RPC layer
- Full WebSocket reconnection strategy redesign
- Rewrite authentication system

## Decisions

### D1: Dashboard stats aggregation — GROUP BY at DB vs. in-memory JS

**Decision**: Use Prisma `groupBy` at the database level instead of `findMany` + JS aggregation.

**Rationale**: `findMany` + JS loop is O(n) in memory and transfers n rows over the wire. `groupBy` reduces this to O(k) where k = number of unique values (typically 5-10 statuses). For 10,000 tasks, this is ~10 rows instead of 10,000 rows.

**Alternatives considered**:

- Cursor-based pagination for task list → applied separately (not mutually exclusive with groupBy)
- Redis caching the aggregated stats → considered but adds cache invalidation complexity for a 5-min TTL use case; Prisma `groupBy` is faster to implement and always consistent

**Implementation**:

```typescript
// Replace: prisma.task.findMany({ where: { projectId } }) + JS loop
// With:
const [statusCounts, priorityCounts, typeCounts] = await Promise.all([
  prisma.task.groupBy({
    by: ['status'],
    where: { projectId, deletedAt: null },
    _count: { id: true },
  }),
  prisma.task.groupBy({
    by: ['priority'],
    where: { projectId, deletedAt: null },
    _count: { id: true },
  }),
  prisma.task.groupBy({
    by: ['type'],
    where: { projectId, deletedAt: null },
    _count: { id: true },
  }),
]);
```

### D2: Pagination strategy — offset vs. cursor

**Decision**: Use offset pagination (`take` + `skip`) for task lists in this change. Cursor pagination can be added as a follow-up if needed.

**Rationale**: Offset pagination is simpler to implement and fits the current API shape. Cursor pagination requires stable ordering and more complex frontend logic (send last seen ID). The main goal is eliminating unbounded `findMany` — offset achieves that. Cursor is a future optimization for very large lists.

### D3: Logging — use existing `Logger` vs. custom interceptor

**Decision**: Use the existing `Logger` service from `common/logger` inside `LoggingInterceptor`.

**Rationale**: The interceptor is already imported and wired in the NestJS bootstrap. The current implementation is broken (`return next.handle() as any`). Fixing it properly using the existing logger avoids introducing a new logging utility.

**Implementation**: `Logger` is injected with `@Inject(APP_LOGGER)` or `@SkipSelf()`. The interceptor wraps `next.handle()` in a `tap()` operator to log after response is sent.

### D4: RolesGuard — use existing workspace scope vs. new guard

**Decision**: Build on the existing workspace scope helper (`verifyWorkspaceAdminOrOwner`) and NestJS `SetMetadata` pattern already used elsewhere.

**Rationale**: The workspace membership check is already centralized in `workspace-member.helper.ts`. The `RolesGuard` should delegate to this rather than duplicating the logic.

**Implementation**:

```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = getMetadata('roles', context.getHandler());
    if (!requiredRoles?.length) return true;
    const request = context.switchToHttp().getRequest();
    const { user, workspaceId } = request;
    return this.workspaceHelper.verifyWorkspaceAdminOrOwner(workspaceId, user.id);
  }
}
```

### D5: Type safety — extend types vs. cast

**Decision**: For `ApiResponse.meta` — extend the type definition to include `trace`. For `DashboardModule` — use discriminated union. Do NOT use `as` casts to suppress errors.

**Rationale**: The project has `exactOptionalPropertyTypes: true` and ESLint strict no-any. Adding a field to a type is the correct fix, not casting.

### D6: QueryProvider root placement

**Decision**: Add `QueryProvider` to `app/layout.tsx` (root). Keep it in `(private)/layout.tsx` as well (will not double-render due to React context singleton).

**Rationale**: Moving it to root ensures public routes also have React Query. Keeping it in private layout is harmless — React contexts are singletons, so there is no duplication.

## Risks / Trade-offs

[Risk] `groupBy` in Prisma may not support all aggregation scenarios (e.g., assignee distribution)
→ **Mitigation**: If `groupBy` can't produce the exact dashboard shape, fall back to a raw SQL query via `$queryRaw`. This is a last resort; try `groupBy` first.

[Risk] Adding `@Roles('ADMIN', 'OWNER')` to existing endpoints could break existing API consumers (e.g., scripts, integrations)
→ **Mitigation**: This is a security fix that should have been there from the start. If internal scripts need elevated access, they should use a service account with the correct role. No deprecation period — fix and communicate.

[Risk] Lazy-loading `RichTextEditor` with `ssr: false` may cause hydration mismatch
→ **Mitigation**: The `ssr: false` flag prevents server-side rendering entirely. Use a `loading` fallback that matches the expected client-side shape to avoid layout shift.

[Risk] Moving `QueryProvider` to root may cause issues with existing SSR pages
→ **Mitigation**: React Query v5 handles SSR correctly. `QueryProvider` at root is the recommended pattern. If hydration issues arise, add `initialDehydratedState` serialization — but this is unlikely for an app that already uses React Query in the private layout.

[Risk] Adding Prisma indexes on large existing tables could lock them during `CREATE INDEX`
→ **Mitigation**: Use `CREATE INDEX CONCURRENTLY` in the migration. Prisma migrate supports this via `npx prisma migrate dev`. For production, use `prisma migrate deploy` which applies migrations.

## Migration Plan

1. **Phase 0**: No migrations. Pure code fixes.
2. **Phase 1**: Run `npx prisma migrate dev --name add-performance-indexes`. Apply + seed. Dev environment: `prisma migrate reset --force` is acceptable for schema changes.
3. **Phase 3**: No migration. Decorator + guard additions only.
4. **All phases**: Each task is independent. No cross-task migrations.

**Rollback**: Each task is a targeted edit. Rollback = `git checkout <file>`. No destructive operations.

## Open Questions

1. **Should `getDashboardStats` also cache in Redis?** Currently it uses a 5-min in-memory TTL via a custom cache helper. Converting to Redis would allow cross-instance cache sharing. Decided: skip for this change — the current TTL cache is sufficient.

2. **Should `bulkOperateTasksForProject` use a transaction?** Yes — the existing implementation should already be in a `prisma.$transaction`. Verify this and add if missing. All bulk mutations should be atomic.

3. **Should the `QueryProvider` root change also add `initialDehydratedState`?** Not needed for now. The app doesn't use SSR data fetching patterns that would require dehydration. Revisit if Next.js App Router server components need React Query data.
