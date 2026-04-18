# Implementation Tasks

## Phase 0 — Quick Wins

- [ ] 0.1 Fix `LoggingInterceptor` to log requests properly

  **File:** `apps/api/src/common/interceptors/logging.interceptor.ts`

  Changes:
  - Replace `return next.handle() as any` with a proper interceptor that:
    - Extracts `method`, `url`, `userId` (from `request.user?.id`), and `duration` from the observable
    - Uses the existing `Logger` from `common/logger` (inject with `@Inject(APP_LOGGER)` or resolve via `app.get()`)
    - Wraps `next.handle()` with `tap()` operator to log after response is sent
    - Logs structured output: `{ method, url, userId, durationMs, statusCode }`
  - Remove all `as any` casts from this file
  - Remove `@ts-expect-error` and `eslint-disable` comments

  ← (verify: `npm run lint` passes; interceptor logs request metadata on every call; no `any` types remain)

- [ ] 0.2 Convert `useAuthSession` to React Query pattern

  **File:** `apps/web/src/features/auth/hooks/use-auth-session.ts`

  Changes:
  - Import `useQuery` from `@tanstack/react-query`
  - Replace the `useEffect` + direct API call with:
    ```typescript
    const queryKey = ['currentUser'];
    const { data: user, isLoading } = useQuery({
      queryKey,
      queryFn: () => getCurrentUser().then((r) => r.data),
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000,
      enabled: !!authToken,
      retry: 1,
    });
    ```
  - Extract auth token from the same `getAuthToken()` call used in the original `useEffect`
  - Keep the `router.push('/login')` navigation on `!user && !isLoading` (user is null after auth token expired)

  ← (verify: navigating between 3 private pages triggers exactly 1 network call to `/api/v1/auth/me`; page 2 and 3 use React Query cache)

---

## Phase 1 — Critical Performance

- [ ] 1.1 Replace `getDashboardStats` JS aggregation with Prisma `groupBy`

  **File:** `apps/api/src/modules/project/project.service.ts`

  Changes:
  - Locate the `getDashboardStats` method (around line 974–1123)
  - Remove the `findMany` call that fetches ALL tasks for the project
  - Add three `groupBy` queries (run in `Promise.all`):
    ```typescript
    const [statusCounts, priorityCounts, typeCounts] = await Promise.all([
      this.prisma.task.groupBy({
        by: ['status'],
        where: { projectId, deletedAt: null },
        _count: { id: true },
      }),
      this.prisma.task.groupBy({
        by: ['priority'],
        where: { projectId, deletedAt: null },
        _count: { id: true },
      }),
      this.prisma.task.groupBy({
        by: ['type'],
        where: { projectId, deletedAt: null },
        _count: { id: true },
      }),
    ]);
    ```
  - Remove the JS `for...of` loop that builds counts maps in memory
  - Map `groupBy` results to the existing response shape (transform `_count.id` to count numbers)
  - Keep the task-list-for-widget portion as a paginated query: `take: 50, orderBy: { createdAt: 'desc' }`

  ← (verify: dashboard with 10,000 tasks loads in <500ms; `EXPLAIN` shows index scan on task table; task list shows only 50 tasks)

- [ ] 1.2 Add missing database indexes for performance

  **File:** `apps/api/prisma/schema.prisma`

  Changes — add the following `@@index` blocks to each model:

  ```prisma
  model TaskEvent {
    // existing fields...
    @@index([actorId, createdAt])
  }

  model SignalLog {
    // existing fields...
    @@index([integrationId, createdAt])
  }

  model Task {
    // existing fields and indexes...
    @@index([projectId, deletedAt, createdAt])
  }

  model Doc {
    // existing fields...
    @@index([createdById, createdAt])
  }

  model AuditLog {
    // existing fields...
    @@index([actorId, createdAt])
  }
  ```

  Then run:

  ```bash
  npx prisma migrate dev --name add-performance-indexes
  npm run db:seed --workspace @superboard/api
  ```

  ← (verify: `npx prisma migrate status` shows migration applied; `EXPLAIN ANALYZE` on dashboard query uses index scan; no sequential scans)

- [ ] 1.3 Add pagination to `getProjectByIdForWorkspace` task list

  **File:** `apps/api/src/modules/project/project.service.ts`

  Changes:
  - Add `cursor?: string` and `take?: number` parameters to the method (default `take: 50`)
  - Replace the unbounded `tasks` findMany with paginated version:
    ```typescript
    tasks: {
      where: { projectId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 50,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    }
    ```
  - Parallelize the two independent queries at the start of the method:
    ```typescript
    const [project, workspaceMembers] = await Promise.all([
      this.prisma.project.findFirst({ where }),
      this.workspaceService.findMembersByWorkspace(workspaceId),
    ]);
    ```

  ← (verify: project with 10,000 tasks returns first 50 immediately; response time <100ms; next page loads with cursor)

- [ ] 1.4 Parallelize `bulkOperateTasksForProject` status lookups

  **File:** `apps/api/src/modules/project/project.service.ts`

  Changes:
  - Locate the loop around line 554 that calls `findFirst` for each task
  - Before the loop, add a batch query:
    ```typescript
    const statusIds = tasks.map((t) => t.statusId);
    const statuses = await this.prisma.taskStatus.findMany({
      where: { id: { in: [...new Set(statusIds)] } },
    });
    const statusMap = new Map(statuses.map((s) => [s.id, s]));
    ```
  - Replace each sequential `findFirst` in the loop with `statusMap.get(task.statusId)`
  - Ensure the bulk operation is wrapped in `prisma.$transaction()` (add if missing)

  ← (verify: bulk transitioning 100 tasks executes exactly 3 DB queries (status fetch, task update, events insert) — not 100+ queries)

---

## Phase 2 — Type Safety Cleanup

- [ ] 2.1 Fix `$meta as any` in `HttpExceptionFilter`

  **File:** `apps/api/src/common/filters/http-exception.filter.ts`

  Changes:
  - Locate the `ApiResponse` type definition in `packages/shared/src/types/common.types.ts`
  - Check if `meta.trace` is already defined; if not, extend the type:
    ```typescript
    type ApiResponseMeta = {
      timestamp: string;
      correlationId?: string;
      trace?: string;
    };
    ```
  - Replace `as any` cast with the correctly typed object
  - Remove `as any` from the variable declaration — type should match directly

  ← (verify: no `as any` in http-exception.filter.ts; TypeScript strict compiles without errors)

- [ ] 2.2 Fix `DashboardModule` `[key: string]: any` with discriminated union

  **File:** `apps/web/src/app/(private)/dashboard/page.tsx`

  Changes:
  - Replace the untyped interface with:
    ```typescript
    type ChartModule = {
      id: string;
      type: 'donut' | 'bar' | 'line';
      config: { title: string; data: unknown };
    };
    type StatModule = {
      id: string;
      type: 'stat';
      config: { label: string; value: number; trend?: number };
    };
    type ListModule = {
      id: string;
      type: 'list';
      config: { title: string; items: string[] };
    };
    type DashboardModule = ChartModule | StatModule | ListModule;
    ```
  - Add type guard at parse time: validate `type` field is one of the known values; throw `TypeError` with specific message if unknown type
  - Remove the `[key: string]: any` index signature completely

  ← (verify: parsing invalid AI layout JSON throws a TypeError with the field name; TypeScript validates the union type)

- [ ] 2.3 Fix `TaskStatusDTO` from `string` to union literal type

  **File:** `packages/shared/src/dtos/project.dto.ts`

  Changes:
  - Find `TaskStatusDTO` (around line 27)
  - Replace `export type TaskStatusDTO = string` with:
    ```typescript
    export type TaskStatusCategory = 'todo' | 'in_progress' | 'review' | 'done' | 'blocked';
    export type TaskStatusDTO = TaskStatusCategory;
    ```
  - Search all usages of `TaskStatusDTO` in `apps/web` and `apps/api` to verify they pass valid literals

  ← (verify: TypeScript errors on any code that passes a non-literal string to a function expecting `TaskStatusDTO`)

- [ ] 2.4 Clean remaining `any` types in web layer

  **Files and changes:**

  | File                                             | Line   | Change                                                                                                   |
  | ------------------------------------------------ | ------ | -------------------------------------------------------------------------------------------------------- |
  | `features/docs/components/DocTOC.tsx`            | 12, 22 | Define `TipTapNode` type interface matching TipTap JSON structure; use `TipTapNode[]` instead of `any[]` |
  | `features/docs/components/DocVersionSidebar.tsx` | 12     | Type `content: any` parameter as `TipTapContent` (create matching interface or use TipTap's types)       |
  | `common/filters/http-exception.filter.ts`        | 22-25  | Type `request` as `FastifyRequest` and `response` as `FastifyReply` (from `@fastify/request` types)      |

  Note: `task-create-form.tsx` line 57 (`SpeechRecognition: any`) is justified — skip it.

  ← (verify: `npm run lint` passes with no `any` type errors except justified exceptions; `npm run type-check` succeeds)

---

## Phase 3 — Authorization Baseline

- [ ] 3.1 Create `RolesGuard` with `@Roles()` decorator

  **File:** `apps/api/src/common/guards/roles.guard.ts`

  Changes:

  ```typescript
  import { SetMetadata } from '@nestjs/common';

  export const ROLES_KEY = 'roles';
  export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

  @Injectable()
  export class RolesGuard implements CanActivate {
    constructor(private readonly workspaceHelper: WorkspaceMemberHelper) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const requiredRoles = Reflect.getMetadata(ROLES_KEY, context.getHandler());
      if (!requiredRoles?.length) return true;

      const request = context.switchToHttp().getRequest();
      const { user, workspaceId } = request;
      if (!user?.id || !workspaceId) return false;

      const isAdminOrOwner = await this.workspaceHelper.verifyWorkspaceAdminOrOwner(
        workspaceId,
        user.id,
      );
      return isAdminOrOwner;
    }
  }
  ```

  Also register it globally in `app.module.ts`:

  ```typescript
  {
    provide: APP_GUARD,
    useClass: RolesGuard,
  },
  ```

  (Place after `BearerAuthGuard` registration so auth runs first.)

  ← (verify: `BearerAuthGuard` rejects unauthenticated requests to `@Roles()` endpoints before `RolesGuard` runs; workspace member with `VIEWER` role gets 403; workspace member with `ADMIN` role passes)

- [ ] 3.2 Add `@Roles()` protection to admin endpoints

  **Files:**
  - `apps/api/src/modules/project/project.controller.ts`
  - `apps/api/src/modules/automation/automation.controller.ts`
  - `apps/api/src/modules/workspace/workspace.controller.ts`

  Changes — add `@Roles('ADMIN', 'OWNER')` to each endpoint:

  ```typescript
  // project.controller.ts
  @Post(':projectKey/tasks/bulk-transition')
  @RequireWorkspace()
  @Roles('ADMIN', 'OWNER')
  async bulkTransition(...) {}

  @Delete(':projectKey')
  @RequireWorkspace()
  @Roles('ADMIN', 'OWNER')
  async deleteProject(...) {}

  @Patch(':projectKey/workflow')
  @RequireWorkspace()
  @Roles('ADMIN', 'OWNER')
  async updateWorkflow(...) {}
  ```

  ```typescript
  // automation.controller.ts
  @Post('rules')
  @RequireWorkspace()
  @Roles('ADMIN', 'OWNER')
  async createRule(...) {}

  @Delete('rules/:id')
  @RequireWorkspace()
  @Roles('ADMIN', 'OWNER')
  async deleteRule(...) {}
  ```

  ```typescript
  // workspace.controller.ts
  @Delete(':id/members/:userId')
  @RequireWorkspace()
  @Roles('ADMIN', 'OWNER')
  async removeMember(...) {}
  ```

  ← (verify: API call with `VIEWER` role → HTTP 403; same call with `ADMIN` role → HTTP 200; `BearerAuthGuard` runs before `RolesGuard`)

---

## Phase 4 — UI/UX Polish

- [ ] 4.1 Add `ErrorBoundary` for feature sections in Jira page

  **File:** `apps/web/src/app/(private)/jira/page.tsx`

  Changes:
  - Import: `import { ErrorBoundary } from 'react-error-boundary'` and `import { FullPageError } from '@/components/ui/page-states/FullPageError'`
  - Wrap `NeuralWorkspaceDigest` in `<ErrorBoundary FallbackComponent={FullPageError}>`
  - Wrap `TaskBoardView` in `<ErrorBoundary FallbackComponent={SectionError}>`
  - Import `SectionError` from existing components or inline a section-scoped error component

  ← (verify: throwing an error inside `NeuralWorkspaceDigest` renders `FullPageError` with retry button; rest of Jira page (project grid, filter bar) remains interactive)

- [ ] 4.2 Add loading skeleton for `NeuralWorkspaceDigest`

  **File:** `apps/web/src/features/ai/components/neural-workspace-digest.tsx`

  Changes:
  - Add `DigestSkeleton` component:
    ```tsx
    function DigestSkeleton() {
      return (
        <div className="animate-pulse dark-glass-panel rounded-[2rem] p-6 space-y-4">
          <div className="h-6 bg-white/[0.05] rounded-xl w-1/3" />
          <div className="space-y-2">
            <div className="h-4 bg-white/[0.03] rounded-lg w-full" />
            <div className="h-4 bg-white/[0.03] rounded-lg w-4/5" />
            <div className="h-4 bg-white/[0.03] rounded-lg w-2/3" />
          </div>
        </div>
      );
    }
    ```
  - Conditionally render: `{ isLoading ? <DigestSkeleton /> : <DigestContent /> }`

  ← (verify: on page load, skeleton renders immediately (no flash of blank space); dark glass pulse animation is visible; content replaces skeleton when data arrives)

- [ ] 4.3 Lazy-load heavy components with `next/dynamic`

  **Files:**

  | File                                                  | Component to lazy-load                        |
  | ----------------------------------------------------- | --------------------------------------------- |
  | `app/(private)/docs/page.tsx`                         | `RichTextEditor`                              |
  | `app/(private)/jira/page.tsx`                         | `AgentActivityLog`, `WorkspaceHealth`         |
  | `features/automation/components/SymbiosisConsole.tsx` | `SymbiosisConsole` (if imported on page load) |

  Changes — for each file:

  ```typescript
  const RichTextEditor = dynamic(
    () => import('@/features/docs/components/RichTextEditor').then(m => m.RichTextEditor),
    {
      loading: () => <div className="h-96 animate-pulse dark-glass-panel rounded-[2rem]" />,
      ssr: false,
    }
  );
  ```

  ← (verify: initial page load JavaScript bundle size decreases; heavy components load on demand; no hydration mismatch)

- [ ] 4.4 Lift `QueryProvider` to root layout

  **File:** `apps/web/src/app/layout.tsx`

  Changes:
  - Add `import { QueryProvider } from '@/components/providers/QueryProvider'` at the top
  - Wrap `{children}` inside `<QueryProvider>{children}</QueryProvider>`

  ← (verify: public routes (`/login`, `/invite`) can use `useQuery` and `useMutation` without errors; React Query DevTools still load correctly in development)

- [ ] 4.5 Cache `PrivateShell` navigation-focus fetch in React Query

  **File:** `apps/web/src/components/layout/private-shell.tsx`

  Changes:
  - Import `useQuery` from `@tanstack/react-query`
  - Remove the `useEffect` + raw `fetch` pattern
  - Replace with:
    ```typescript
    const { data: navFocus } = useQuery({
      queryKey: ['navigation-focus'],
      queryFn: () => fetch('/api/v1/executive/navigation-focus').then((r) => r.json()),
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: false,
    });
    ```

  ← (verify: navigating from dashboard → jira → docs → dashboard triggers exactly 1 fetch to `/api/v1/executive/navigation-focus`; subsequent navigations use React Query cache)

---

## Phase 5 — Verification

- [ ] 5.1 Run type-check, lint, and build

  Run in workspace root:

  ```bash
  npm run type-check && npm run lint && npm run build
  ```

  Confirm:
  - No TypeScript errors
  - No ESLint errors (except justified `SpeechRecognition: any` in `task-create-form.tsx`)
  - Build succeeds with no errors

  ← (verify: `npm run type-check` exits 0; `npm run lint` exits 0; `npm run build` exits 0)
