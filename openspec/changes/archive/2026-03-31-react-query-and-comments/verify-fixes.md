## [2026-03-20] Round 1 (from spx-apply auto-verify)

### spx-verifier

- Fixed: Deleted dead `apps/web/lib/query-client.ts` singleton (never imported, conflicting with QueryProvider's inline QueryClient)
- Fixed: Removed all `/* PLACEHOLDER_* */` comments from `apps/web/app/(private)/jira/projects/[projectId]/page.tsx` (12 occurrences) and `apps/api/src/modules/project/comment.service.ts` (2 occurrences)

### spx-arch-verifier

- Fixed: Deleted dead `apps/web/lib/query-client.ts` (latent SSR cache-bleed risk)
- Fixed: Deleted stale `apps/web/hooks/use-project-list.ts` (replaced by `use-projects.ts`)
- Fixed: Replaced fragile DOM traversal form submit with `<button type="submit" form="task-edit-form">` pattern

### spx-uiux-verifier

- Fixed: Added `role="dialog"`, `aria-modal="true"`, `aria-labelledby="task-detail-title"` to task detail panel
- Fixed: Added `id="task-detail-title"` to panel heading
- Fixed: Added `type="button"` and `aria-label="Close task detail"` to close button
- Fixed: Added `aria-label="Edit comment"` to edit comment textarea
- Fixed: Replaced fragile DOM traversal submit button with `form="task-edit-form"` attribute

### Skipped (user decision / out of scope)

- Global `outline-none` in `globals.css` — pre-existing issue across entire app, not introduced by this change
- `prefers-reduced-motion` guard — pre-existing animation pattern, not introduced by this change
- Task card keyboard activation (`tabIndex`, `role="button"`) — pre-existing pattern, not introduced by this change
- Background scroll lock when panel open — pre-existing behavior
- Project CRUD mutations on jira/page.tsx not migrated to useMutation — explicitly out of scope per proposal
- Query key constants centralization — nice-to-have, not a correctness issue

## [2026-03-21] Round 2 (from spx-verify → spx-apply fix)

### spx-verifier

- Fixed: Changed `deleteComment` service return type from `Promise<void>` to `Promise<{ deleted: boolean }>`, controller now uses service return value
- Fixed: Added `setEditStatus('todo')` to `handleCloseEdit` to prevent latent state leak

### spx-uiux-verifier

- Fixed: Added focus management — store trigger element ref on open, restore focus on close
- Fixed: Added focus trap inside task detail dialog (Tab/Shift+Tab cycling, Escape to close)
- Fixed: Added `aria-label="New comment"` to add-comment textarea
- Fixed: Added contextual `aria-label` to Edit/Delete comment buttons (`Edit comment by {authorName}`, `Delete comment by {authorName}`)
- Fixed: Added `role="alert"` to `deleteError`, `createError`, `editError`, and `taskUpdateError` elements

## [2026-03-21] Round 3 (from spx-verify → spx-apply fix)

### spx-uiux-verifier

- Fixed: Replaced global `outline-none` with `outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1` on input/button/textarea/select in `globals.css`
- Fixed: Added `tabIndex={0}`, `role="button"`, `aria-label={task.title}`, and `onKeyDown` (Enter/Space) to board view `<article>` task cards
- Fixed: Added `tabIndex={0}`, `role="button"`, `aria-label={task.title}`, and `onKeyDown` (Enter/Space) to list view `<tr>` task rows
- Fixed: Added `role="alert"` to inner `taskUpdateError` `<p>` inside dialog form
- Fixed: Removed dead outer `taskUpdateError` render (hidden behind modal overlay)
- Fixed: Added `role="alert"` to `createError` inline error in create-project form on `jira/page.tsx`

### spx-arch-verifier

- Fixed: Split shared `createError` state into `createError`, `editError`, `archiveError` on `jira/page.tsx` — each operation now owns its own error state
- Fixed: Added `role="alert"` to `editError` and `archiveError` banner renders on `jira/page.tsx`
- Fixed: Extracted duplicated `formatDate` into shared `apps/web/lib/format-date.ts`, imported in both `jira/page.tsx` and `[projectId]/page.tsx`

### Skipped (user decision / out of scope)

- `prefers-reduced-motion` guard — pre-existing animation pattern, not introduced by this change
- Background scroll lock when panel open — pre-existing behavior
- Project CRUD mutations on jira/page.tsx not migrated to useMutation — explicitly out of scope per proposal
- Query key constants centralization — nice-to-have, not a correctness issue
