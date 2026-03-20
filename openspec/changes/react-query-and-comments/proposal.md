## Why

The project detail page (`/jira/projects/[projectId]`) manages ~20 useState calls for data fetching, loading states, error handling, and optimistic updates. This makes the code fragile and hard to extend. Adding the comment system (next feature) on top of this manual state management would compound the complexity. By migrating to React Query first, we establish a clean data-fetching foundation, then build comments on top of it with proper cache management from day one.

Task comments are the next Jira-core feature needed — the Comment schema already exists in Prisma but has no API endpoints or UI. Users need to discuss tasks directly within the task detail panel.

## What Changes

- Setup React Query (QueryClientProvider, QueryClient config, devtools) in the web app layout
- Refactor project list page to use `useQuery` instead of manual `useEffect` + `useState`
- Refactor project detail page to use `useQuery` for data fetching and `useMutation` for create/update/delete task operations, including optimistic updates for drag-drop status changes
- Remove the `reloadSeed` counter pattern and manual loading/error state management
- Add Comment shared DTOs in `packages/shared` (CommentItemDTO, CreateCommentRequestDTO, UpdateCommentRequestDTO, response types)
- Add Comment API endpoints nested under projects/tasks: GET (list), POST (create), PATCH (update), DELETE (soft-delete)
- Add Comment section in the task detail panel with inline form, edit/delete (author-only), and error display
- Add FE API endpoints and service functions for comments using React Query hooks

## Capabilities

### New Capabilities

- `react-query-setup`: QueryClientProvider configuration, QueryClient defaults (staleTime, retry, gcTime), React Query Devtools integration
- `react-query-project-hooks`: Custom hooks wrapping project list and project detail queries, plus task mutation hooks with optimistic updates
- `task-comments-api`: Backend CRUD endpoints for task comments (list all, create, update, soft-delete) with author-only edit/delete authorization
- `task-comments-ui`: Comment section in task detail panel — comment list, create form, inline edit, delete with confirmation, loading/empty/error states

### Modified Capabilities

## Impact

- `apps/web/app/(private)/layout.tsx` — wrap with QueryClientProvider
- `apps/web/app/(private)/jira/page.tsx` — refactor to useQuery
- `apps/web/app/(private)/jira/projects/[projectId]/page.tsx` — major refactor to useQuery/useMutation, add comment section
- `apps/web/lib/services/project-service.ts` — kept as-is (query functions), add comment service
- `apps/web/lib/api/endpoints.ts` — add comment endpoints
- `packages/shared/src/dtos/project.dto.ts` — add comment DTOs
- `packages/shared/src/dtos/index.ts` — export comment DTOs
- `apps/api/src/modules/project/project.controller.ts` — add comment endpoints
- `apps/api/src/modules/project/project.service.ts` — add comment CRUD methods
- `apps/api/src/app.module.ts` — no change needed (comments live in ProjectModule)
- No new dependencies needed (`@tanstack/react-query` already installed)
- No database migration needed (Comment model already exists in schema)
