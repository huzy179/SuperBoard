# FE UI Audit (2026-04-30)

Targets: `apps/web/src`, `packages/ui/src`

## Totals

- Terminal/dark text: **951**
- Terminal/dark backgrounds: **101**
- White borders: **453**
- Glow shadows: **165**
- Attention animations: **142**
- Aggressive uppercase UI: **662**
- Dense tracking (terminal style): **202**
- Backdrop blur: **101**

## Top Files (by total hits)

| File                                                                                | Total | Breakdown                                                                                                 |
| ----------------------------------------------------------------------------------- | ----: | --------------------------------------------------------------------------------------------------------- |
| `apps/web/src/features/operations/workflow/components/WorkflowEditor.tsx`           |   105 | dark_text:30, dark_bg:2, white_borders:19, glow:11, pulse:3, upper:24, tracking_dense:14, backdrop_blur:2 |
| `apps/web/src/features/collaboration/docs/components/RichTextEditor.tsx`            |    80 | dark_text:25, dark_bg:5, white_borders:17, glow:1, pulse:2, upper:19, tracking_dense:7, backdrop_blur:4   |
| `apps/web/src/features/operations/task/components/task-filter-bar.tsx`              |    80 | dark_text:27, dark_bg:10, white_borders:12, glow:7, pulse:3, upper:12, tracking_dense:8, backdrop_blur:1  |
| `apps/web/src/features/operations/task/components/task-comment-section.tsx`         |    79 | dark_text:22, dark_bg:2, white_borders:14, glow:3, pulse:7, upper:17, tracking_dense:11, backdrop_blur:3  |
| `apps/web/src/features/specialized/automation/components/AIAutomationDialog.tsx`    |    69 | dark_text:22, dark_bg:2, white_borders:7, glow:6, pulse:7, upper:17, tracking_dense:6, backdrop_blur:2    |
| `apps/web/src/features/system/search/components/CommandPalette.tsx`                 |    69 | dark_text:21, dark_bg:5, white_borders:10, glow:8, pulse:5, upper:13, tracking_dense:5, backdrop_blur:2   |
| `apps/web/src/features/operations/task/components/task-calendar-view.tsx`           |    66 | dark_text:22, dark_bg:1, white_borders:14, glow:4, pulse:4, upper:13, tracking_dense:4, backdrop_blur:4   |
| `apps/web/src/features/specialized/automation/components/automation-slide-over.tsx` |    65 | dark_text:23, dark_bg:2, white_borders:10, glow:5, pulse:2, upper:17, tracking_dense:5, backdrop_blur:1   |
| `apps/web/src/app/(private)/jira/projects/[projectId]/reports/page.tsx`             |    61 | dark_text:19, dark_bg:3, white_borders:11, glow:5, pulse:2, upper:15, tracking_dense:4, backdrop_blur:2   |
| `apps/web/src/app/(private)/docs/[docId]/page.tsx`                                  |    57 | dark_text:23, dark_bg:4, white_borders:4, glow:4, pulse:3, upper:12, tracking_dense:5, backdrop_blur:2    |
| `apps/web/src/features/operations/project/components/project-digital-twin.tsx`      |    57 | dark_text:21, dark_bg:1, white_borders:6, glow:4, pulse:2, upper:17, tracking_dense:5, backdrop_blur:1    |
| `apps/web/src/features/operations/task/components/task-subtask-manager.tsx`         |    57 | dark_text:18, dark_bg:1, white_borders:9, glow:3, pulse:3, upper:12, tracking_dense:9, backdrop_blur:2    |
| `apps/web/src/features/system/workspace/components/WorkspaceMemberSettings.tsx`     |    53 | dark_text:21, dark_bg:4, white_borders:10, upper:18                                                       |
| `apps/web/src/features/operations/project/components/MissionTimeline.tsx`           |    51 | dark_text:15, white_borders:10, glow:6, pulse:1, upper:11, tracking_dense:6, backdrop_blur:2              |
| `apps/web/src/features/collaboration/qa/components/neural-qa-dashboard.tsx`         |    50 | dark_text:17, dark_bg:1, white_borders:6, glow:3, pulse:2, upper:16, tracking_dense:4, backdrop_blur:1    |
| `apps/web/src/features/intelligence/ai/components/ai-planner-modal.tsx`             |    50 | dark_text:25, dark_bg:1, white_borders:7, glow:1, pulse:2, upper:12, tracking_dense:1, backdrop_blur:1    |
| `apps/web/src/features/intelligence/knowledge/components/VectorAtlas.tsx`           |    50 | dark_text:14, dark_bg:1, white_borders:10, glow:3, pulse:1, upper:14, tracking_dense:3, backdrop_blur:4   |
| `apps/web/src/features/specialized/automation/components/workspace-health.tsx`      |    50 | dark_text:20, white_borders:6, glow:2, pulse:2, upper:14, tracking_dense:6                                |
| `apps/web/src/features/operations/project/components/MissionArchitectTerminal.tsx`  |    49 | dark_text:22, dark_bg:2, white_borders:5, glow:1, pulse:1, upper:14, tracking_dense:3, backdrop_blur:1    |
| `apps/web/src/features/operations/task/components/task-list-view.tsx`               |    47 | dark_text:17, dark_bg:1, white_borders:7, glow:1, pulse:1, upper:12, tracking_dense:7, backdrop_blur:1    |
| `apps/web/src/features/intelligence/executive/components/morning-briefing.tsx`      |    46 | dark_text:16, dark_bg:3, white_borders:7, pulse:3, upper:12, tracking_dense:2, backdrop_blur:3            |
| `apps/web/src/features/intelligence/executive/components/memoir-gallery.tsx`        |    45 | dark_text:17, dark_bg:3, white_borders:8, upper:12, tracking_dense:2, backdrop_blur:3                     |
| `apps/web/src/features/operations/task/components/task-bulk-action-bar.tsx`         |    45 | dark_text:14, dark_bg:1, white_borders:6, glow:7, pulse:5, upper:7, tracking_dense:4, backdrop_blur:1     |
| `apps/web/src/features/operations/task/components/task-board-view.tsx`              |    43 | dark_text:12, white_borders:12, glow:6, pulse:3, upper:6, tracking_dense:3, backdrop_blur:1               |
| `apps/web/src/features/operations/project/components/quick-search-dialog.tsx`       |    42 | dark_text:15, dark_bg:1, white_borders:9, pulse:1, upper:8, tracking_dense:6, backdrop_blur:2             |
| `apps/web/src/features/specialized/automation/components/AutomationList.tsx`        |    42 | dark_text:16, white_borders:7, glow:3, pulse:4, upper:10, tracking_dense:2                                |
| `apps/web/src/features/specialized/automation/components/connect-hub.tsx`           |    42 | dark_text:18, white_borders:8, glow:1, pulse:1, upper:12, tracking_dense:2                                |
| `apps/web/src/features/collaboration/docs/components/DocVersionSidebar.tsx`         |    41 | dark_text:16, dark_bg:1, white_borders:6, glow:1, pulse:2, upper:10, tracking_dense:4, backdrop_blur:1    |
| `apps/web/src/features/operations/task/components/task-attachment-manager.tsx`      |    41 | dark_text:14, dark_bg:2, white_borders:6, glow:2, pulse:1, upper:8, tracking_dense:7, backdrop_blur:1     |
| `apps/web/src/features/intelligence/ai/components/project-copilot.tsx`              |    40 | dark_text:18, white_borders:7, glow:4, pulse:1, upper:7, tracking_dense:2, backdrop_blur:1                |
| `apps/web/src/features/specialized/automation/components/agent-activity-log.tsx`    |    39 | dark_text:16, white_borders:8, glow:2, upper:12, tracking_dense:1                                         |
| `apps/web/src/features/collaboration/chat/components/MessageToTaskDialog.tsx`       |    38 | dark_text:13, dark_bg:5, white_borders:5, glow:1, pulse:1, upper:9, tracking_dense:2, backdrop_blur:2     |
| `apps/web/src/features/collaboration/qa/components/test-generator-modal.tsx`        |    38 | dark_text:14, dark_bg:1, white_borders:6, glow:3, pulse:2, upper:8, tracking_dense:3, backdrop_blur:1     |
| `apps/web/src/features/specialized/automation/components/SymbiosisConsole.tsx`      |    38 | dark_text:13, white_borders:5, glow:2, pulse:1, upper:12, tracking_dense:4, backdrop_blur:1               |
| `apps/web/src/features/intelligence/knowledge/components/ConflictResolver.tsx`      |    37 | dark_text:13, white_borders:5, glow:3, pulse:2, upper:11, tracking_dense:2, backdrop_blur:1               |
| `apps/web/src/features/collaboration/chat/components/DirectTransmissionHub.tsx`     |    36 | dark_text:11, dark_bg:3, white_borders:7, glow:1, pulse:3, upper:6, tracking_dense:1, backdrop_blur:4     |
| `apps/web/src/features/collaboration/chat/components/ThreadPanel.tsx`               |    36 | dark_text:11, dark_bg:2, white_borders:6, glow:1, pulse:2, upper:12, tracking_dense:1, backdrop_blur:1    |
| `apps/web/src/features/collaboration/chat/components/ChannelSidebar.tsx`            |    35 | dark_text:13, dark_bg:3, white_borders:7, glow:2, pulse:3, upper:7                                        |
| `apps/web/src/features/collaboration/chat/components/MessageList.tsx`               |    35 | dark_text:14, dark_bg:1, white_borders:6, glow:3, pulse:3, upper:7, backdrop_blur:1                       |
| `apps/web/src/app/(private)/jira/projects/[projectId]/automation/page.tsx`          |    33 | dark_text:9, dark_bg:1, white_borders:4, pulse:4, upper:8, tracking_dense:5, backdrop_blur:2              |

## Next Actions

- Prioritize refactor of the top 10 files/pages (P0) to remove terminal/dark classes and attention animations.
- Consolidate primitives: move app usage to `@superboard/ui` components and reduce duplicated styling in `apps/web`.
- Add guardrails (lint rule / script) after P0 pages are cleaned so CI can enforce the new baseline.
