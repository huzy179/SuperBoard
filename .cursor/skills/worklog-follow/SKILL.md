---
name: worklog-follow
description: Reads `worklog/todo.md`, `worklog/doing.md`, and `worklog/done.md` to continue pending tasks. Use when the user asks to “đọc worklog và làm tiếp task” and/or requests a UX smoke check (empty/loading/error/responsive). Validates behavior via code mapping and, if possible, runs headless smoke tests; then updates `worklog/SMOKE_TEST_CHECKLIST.md` and `worklog/doing.md`.
---

# Worklog Follow-Up (Smokes + P0/P1)

## When to Use

- User requests to “đọc lại worklog”, “làm tiếp task”, or “tiếp tục làm theo worklog”.
- User requests a smoke/UX validation for P0/P1 states: empty, loading, error, responsive breakpoints.

## Workflow

1. **Load worklog state**
   - Read: `worklog/doing.md`, `worklog/todo.md`, `worklog/done.md`.
   - If needed, read any referenced file under `worklog/` (e.g. `worklog/SMOKE_TEST_CHECKLIST.md`).

2. **Pick the next action**
   - Find the first relevant pending item in `worklog/doing.md` under the current sprint (P0 first).
   - If `doing.md` has no pending items, pick from `worklog/todo.md` (smallest, most blocking first).

3. **If smoke/UX is requested**
   - Open `worklog/SMOKE_TEST_CHECKLIST.md`.
   - Ensure expected UI texts match actual UI strings by tracing code for:
     - `/login`
     - `Jira Home` page
     - `Project Detail` page for empty state
     - invalid project route/page-level error handling
     - responsive view mode buttons (Board/List/Calendar)

4. **Try to run headless smoke (best-effort)**
   - If `scripts/smoke-playwright.mjs` exists, try: `node scripts/smoke-playwright.mjs`.
   - If headless browsing tools/browsers are unavailable or server startup fails:
     - mark smoke result as `SKIP` and explain the reason,
     - still update checklist expectations based on code-traced UI behavior.

5. **Implement only what is needed**
   - Fix UI mismatches (wrong text/label), missing buttons, or incorrect state rendering.
   - Keep changes minimal and focused on the failing checklist items.

6. **Update worklog artifacts**
   - Update relevant checkboxes in `worklog/SMOKE_TEST_CHECKLIST.md` (tick what is verified).
   - Update the matching item in `worklog/doing.md` (tick the completed status + short note).

7. **Verification**
   - Re-run the headless smoke if it was executed.
   - Run `ReadLints` for recently edited files.

## Output Format

- `Next task chosen:` (worklog section + what will be done)
- `Smoke/UX result:` `PASS` / `FAIL` / `SKIP` + brief reason/evidence summary
- `Checklist updates:` which items were ticked/modified
- `Code changes (if any):` brief mention of affected areas
