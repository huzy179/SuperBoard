## 1. React Query Setup

- [x] 1.1 Create `apps/web/lib/query-client.ts` — export a `QueryClient` instance with defaults: `staleTime: 30_000`, `gcTime: 300_000`, `retry: 1`, `refetchOnWindowFocus: true`
- [x] 1.2 Create `apps/web/components/providers/query-provider.tsx` — `'use client'` component that wraps children with `QueryClientProvider` + React Query Devtools (dev only, lazy import)
- [x] 1.3 Update `apps/web/app/(private)/layout.tsx` — wrap children with `QueryProvider` ← (verify: provider only on private routes, devtools visible in dev, not in prod build)

## 2. React Query Project Hooks

- [x] 2.1 Create `apps/web/hooks/use-projects.ts` — `useProjects()` hook using `useQuery({ queryKey: ['projects'], queryFn: getProjects })`
- [x] 2.2 Create `apps/web/hooks/use-project-detail.ts` — `useProjectDetail(projectId)` hook using `useQuery({ queryKey: ['projects', projectId], queryFn: () => getProjectDetail(projectId) })`
- [x] 2.3 Create `apps/web/hooks/use-task-mutations.ts` — `useCreateTask`, `useUpdateTask`, `useUpdateTaskStatus` (with optimistic update), `useDeleteTask` mutation hooks. Each invalidates `['projects', projectId]` on success. `useUpdateTaskStatus` implements `onMutate` optimistic cache update + `onError` rollback.
- [x] 2.4 Refactor `apps/web/app/(private)/jira/page.tsx` — replace manual `useEffect`/`useState` fetch with `useProjects()` hook. Remove manual loading/error state variables.
- [x] 2.5 Refactor `apps/web/app/(private)/jira/projects/[projectId]/page.tsx` — replace manual `useEffect`/`useState`/`reloadSeed` with `useProjectDetail` + task mutation hooks. Remove `reloadSeed`, manual loading/error/updating states. Keep UI structure identical. ← (verify: no `reloadSeed`, no manual fetch `useEffect`, drag-drop optimistic update works, all CRUD operations use mutation hooks, typecheck + lint pass)

## 3. Comment Shared DTOs

- [x] 3.1 Add comment DTOs to `packages/shared/src/dtos/project.dto.ts` — `CommentItemDTO` (`id`, `taskId`, `authorId`, `authorName`, `content`, `createdAt`, `updatedAt`), `CreateCommentRequestDTO`, `UpdateCommentRequestDTO`, `CommentListResponseDTO`, `CreateCommentResponseDTO`, `UpdateCommentResponseDTO`, `DeleteCommentResponseDTO`
- [x] 3.2 Verify exports from `packages/shared/src/dtos/index.ts` (already re-exports `project.dto.ts` via wildcard) ← (verify: `CommentItemDTO` importable from `@superboard/shared`, typecheck pass)

## 4. Comment API (Backend)

- [x] 4.1 Create `apps/api/src/modules/project/comment.service.ts` — `CommentService` with methods: `getCommentsByTask`, `createComment`, `updateComment`, `deleteComment`. Each method verifies project→workspace ownership. `updateComment`/`deleteComment` check `authorId === currentUser.id` (403 if mismatch). Queries filter `deletedAt: null`. Include `author.fullName` as `authorName` in returned DTOs.
- [x] 4.2 Add comment routes to `apps/api/src/modules/project/project.controller.ts` — `GET .../comments`, `POST .../comments`, `PATCH .../comments/:commentId`, `DELETE .../comments/:commentId`. Wire to `CommentService`.
- [x] 4.3 Register `CommentService` in `apps/api/src/modules/project/project.module.ts` as a provider ← (verify: all 4 endpoints respond correctly — list returns [], create returns comment, update by author works, update by non-author returns 403, delete soft-deletes, typecheck + lint pass)

## 5. Comment Frontend Integration

- [x] 5.1 Add comment endpoints to `apps/web/lib/api/endpoints.ts` — `listComments(projectId, taskId)`, `createComment(projectId, taskId)`, `updateComment(projectId, taskId, commentId)`, `deleteComment(projectId, taskId, commentId)`
- [x] 5.2 Add comment service functions to `apps/web/lib/services/comment-service.ts` — `getTaskComments`, `createTaskComment`, `updateTaskComment`, `deleteTaskComment` using `apiGet`/`apiPost`/`apiRequest`
- [x] 5.3 Create `apps/web/hooks/use-task-comments.ts` — `useTaskComments(projectId, taskId)` query hook + `useCreateComment`, `useUpdateComment`, `useDeleteComment` mutation hooks. All mutations invalidate `['projects', projectId, 'tasks', taskId, 'comments']` on success.
- [x] 5.4 Add comment section to task detail panel in `apps/web/app/(private)/jira/projects/[projectId]/page.tsx` — below description field, render comment list (loading/empty/list states), add-comment form (textarea + submit button), edit inline (textarea + save/cancel), delete with `confirm()`. Show inline errors below form on failure. Edit/delete buttons visible only for current user's comments. ← (verify: comments load when task detail opens, create/edit/delete work, author-only edit/delete enforced in UI, inline errors display on failure, empty state shows "No comments yet", typecheck + lint pass)

## 6. Final Validation

- [x] 6.1 Run `npm run type-check` and `npm run lint` across the monorepo — fix any errors ← (verify: zero errors from both commands)
