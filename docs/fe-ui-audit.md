# FE UI Audit (2026-04-30)

Targets: `apps/web/src`, `packages/ui/src`

## Totals

- Terminal/dark text: **38**
- Terminal/dark backgrounds: **1**
- White borders: **4**
- Glow shadows: **0**
- Attention animations: **6**
- Aggressive uppercase UI: **2**
- Dense tracking (terminal style): **0**
- Backdrop blur: **0**

## Top Files (by total hits)

| File                                                                                | Total | Breakdown                               |
| ----------------------------------------------------------------------------------- | ----: | --------------------------------------- |
| `apps/web/src/app/globals.css`                                                      |     9 | dark_text:6, dark_bg:1, white_borders:2 |
| `apps/web/src/app/(private)/chat/layout.tsx`                                        |     5 | dark_text:4, upper:1                    |
| `apps/web/src/app/(private)/docs/[docId]/versions/page.tsx`                         |     3 | dark_text:3                             |
| `apps/web/src/features/intelligence/ai/components/project-copilot.tsx`              |     3 | dark_text:3                             |
| `apps/web/src/features/system/user/components/AvatarUpload.tsx`                     |     3 | dark_text:1, white_borders:1, upper:1   |
| `apps/web/src/app/(private)/settings/page.tsx`                                      |     2 | dark_text:2                             |
| `packages/ui/src/components/QuantumButton.tsx`                                      |     2 | dark_text:2                             |
| `apps/web/src/app/(public)/invitation/[token]/page.tsx`                             |     1 | white_borders:1                         |
| `apps/web/src/app/(public)/share/[docId]/page.tsx`                                  |     1 | dark_text:1                             |
| `apps/web/src/app/not-found.tsx`                                                    |     1 | dark_text:1                             |
| `apps/web/src/features/collaboration/chat/components/MessageInput.tsx`              |     1 | dark_text:1                             |
| `apps/web/src/features/collaboration/chat/components/MessageList.tsx`               |     1 | dark_text:1                             |
| `apps/web/src/features/collaboration/docs/components/RichTextEditor.tsx`            |     1 | pulse:1                                 |
| `apps/web/src/features/operations/dashboard/components/dashboard-skeleton.tsx`      |     1 | pulse:1                                 |
| `apps/web/src/features/operations/project/components/MissionArchitectTerminal.tsx`  |     1 | dark_text:1                             |
| `apps/web/src/features/operations/project/components/ProjectSkeleton.tsx`           |     1 | pulse:1                                 |
| `apps/web/src/features/operations/project/components/project-digital-twin.tsx`      |     1 | pulse:1                                 |
| `apps/web/src/features/operations/project/components/quick-search-dialog.tsx`       |     1 | dark_text:1                             |
| `apps/web/src/features/operations/task/components/task-attachment-manager.tsx`      |     1 | dark_text:1                             |
| `apps/web/src/features/operations/task/components/task-badges.tsx`                  |     1 | dark_text:1                             |
| `apps/web/src/features/operations/task/components/task-bulk-action-bar.tsx`         |     1 | dark_text:1                             |
| `apps/web/src/features/operations/task/components/task-comment-section.tsx`         |     1 | dark_text:1                             |
| `apps/web/src/features/operations/task/components/task-create-form.tsx`             |     1 | dark_text:1                             |
| `apps/web/src/features/operations/task/components/task-edit-slide-over.tsx`         |     1 | dark_text:1                             |
| `apps/web/src/features/specialized/automation/components/ExecutiveDirective.tsx`    |     1 | pulse:1                                 |
| `apps/web/src/features/specialized/automation/components/SymbiosisConsole.tsx`      |     1 | pulse:1                                 |
| `apps/web/src/features/specialized/talent/components/smart-assignee-suggestion.tsx` |     1 | dark_text:1                             |
| `apps/web/src/features/system/notifications/components/notification-bell.tsx`       |     1 | dark_text:1                             |
| `apps/web/src/features/system/search/components/CommandPalette.tsx`                 |     1 | dark_text:1                             |
| `apps/web/src/features/system/search/components/SearchModal.tsx`                    |     1 | dark_text:1                             |
| `apps/web/src/features/system/workspace/components/WorkspaceSwitcher.tsx`           |     1 | dark_text:1                             |

## Next Actions

- Prioritize refactor of the top 10 files/pages (P0) to remove terminal/dark classes and attention animations.
- Consolidate primitives: move app usage to `@superboard/ui` components and reduce duplicated styling in `apps/web`.
- Add guardrails (lint rule / script) after P0 pages are cleaned so CI can enforce the new baseline.
