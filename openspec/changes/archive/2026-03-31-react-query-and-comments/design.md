## Context

The SuperBoard web app (`apps/web`) currently manages all server state with raw `useState` + `useEffect` + manual `fetch` calls. The project detail page alone has ~20 `useState` declarations, a `reloadSeed` counter to trigger refetches, and hand-rolled optimistic updates. `@tanstack/react-query` v5 is already installed but not configured.

The Comment model exists in Prisma schema (`taskId`, `authorId`, `content`, `deletedAt`, indexes on `[taskId, createdAt]` and `[authorId]`) but has no API endpoints, shared DTOs, or UI.

Existing patterns to follow:

- BE: NestJS controllers under `apps/api/src/modules/`, services use PrismaService, all responses wrapped in `apiSuccess()` returning `ApiResponse<T>` envelope
- FE: Service functions in `apps/web/lib/services/`, API client in `apps/web/lib/api-client.ts` with `apiGet`/`apiPost`/`apiRequest` helpers that unwrap the envelope
- Shared: DTOs in `packages/shared/src/dtos/`, exported via barrel `index.ts`
- Auth: `@CurrentUser()` decorator provides `AuthUserDTO` with `defaultWorkspaceId`
- Soft-delete: `deletedAt` field, filter `deletedAt: null` in queries

## Goals / Non-Goals

**Goals:**

- Setup React Query provider and defaults so all future features use it from day one
- Refactor project list and project detail pages to use `useQuery`/`useMutation`, eliminating manual state management
- Implement task comment CRUD (BE + FE) using React Query from the start
- Maintain existing UX behavior (optimistic drag-drop, inline errors)

**Non-Goals:**

- Refactoring auth/login pages to React Query (out of scope)
- Comment mentions (@user), markdown rendering, or rich text
- Comment pagination (load all comments at once for now)
- Polymorphic comments (message/doc comments — future work)
- Task history/TaskEvent integration when comments are added
- Tests (ship first, test later)

## Decisions

### D1: React Query defaults

**Choice**: `staleTime: 30_000` (30s), `gcTime: 300_000` (5min), `retry: 1`, `refetchOnWindowFocus: true`

**Rationale**: 30s staleTime prevents redundant refetches during normal navigation while keeping data reasonably fresh. Single retry handles transient network errors without annoying delays. Window focus refetch catches updates made in other tabs.

**Alternative considered**: `staleTime: 0` (always refetch) — too aggressive for a project management app where data doesn't change every second.

### D2: Query key structure

**Choice**: Hierarchical array keys following the resource path:

- `['projects']` — project list
- `['projects', projectId]` — project detail (includes tasks)
- `['projects', projectId, 'tasks', taskId, 'comments']` — task comments

**Rationale**: Enables targeted invalidation. Invalidating `['projects', projectId]` refreshes project detail + tasks without touching the project list. Invalidating `['projects']` refreshes everything.

### D3: Comment endpoints nested under ProjectController

**Choice**: Add comment routes to existing `ProjectController` at `/projects/:projectId/tasks/:taskId/comments` rather than creating a separate CommentModule.

**Rationale**: Comments are tightly coupled to tasks within projects. The workspace authorization check (`defaultWorkspaceId` → project ownership) already exists in ProjectController. A separate module would duplicate this auth chain. Comment logic goes into `ProjectService` (or a dedicated `CommentService` injected into ProjectModule if the file gets too large).

**Alternative considered**: Separate `CommentModule` with its own controller — adds unnecessary indirection for 4 simple CRUD endpoints.

### D4: Author-only edit/delete enforcement

**Choice**: BE checks `comment.authorId === currentUser.id` before allowing PATCH/DELETE. Returns 403 Forbidden if mismatch.

**Rationale**: Simplest authorization model. No need for workspace admin override at this stage.

### D5: Optimistic updates for task mutations

**Choice**: Use `useMutation` with `onMutate` for optimistic cache updates on task status changes (drag-drop). Roll back via `onError` using the snapshot from `onMutate`. For task create/delete, invalidate queries instead of optimistic update.

**Rationale**: Status drag-drop needs instant visual feedback (optimistic). Create/delete are less latency-sensitive and simpler to handle with invalidation.

### D6: Comment service placement

**Choice**: Create a separate `CommentService` class in `apps/api/src/modules/project/comment.service.ts`, registered in `ProjectModule`. Controller routes stay in `ProjectController`.

**Rationale**: `ProjectService` is already ~500 lines. Adding comment CRUD would push it past maintainable size. Separate service, same module.

## Risks / Trade-offs

- **[Risk] Large refactor of project detail page** → Mitigated by keeping the same visual UI and only changing data-fetching internals. No new UI components except comment section.
- **[Risk] Loading all comments at once** → Acceptable for MVP. Tasks rarely have >50 comments. Add cursor pagination later if needed.
- **[Risk] No tests** → Accepted trade-off for shipping speed. Comment CRUD is straightforward. Will add tests when stabilizing Jira core.
- **[Risk] Comment soft-delete without "deleted" placeholder** → Comments simply disappear from UI. If a thread references a deleted comment, context may be lost. Acceptable for now since there are no threaded replies.
