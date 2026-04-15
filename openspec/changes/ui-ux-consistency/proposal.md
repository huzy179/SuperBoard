## Why

SuperBoard currently suffers from visual inconsistency across its UI: some components use a dark glass aesthetic (task board, list view, task edit panel), while others revert to light Tailwind defaults (filter bar, calendar view, morning briefing, memoir gallery). Additionally, a significant portion of the UI uses "mission command" military/crypto vocabulary ("Unit Specification", "Neural Health Forecast", "Archive Manifest", "Intelligence Terminal") that conflicts with the project's Vietnamese PM language convention (CLAUDE.md) and creates an unnecessary cognitive load for users who expect a professional project management tool.

## What Changes

### Theme Consistency

- Convert `task-filter-bar.tsx` from light (`bg-slate-50 border-slate-200`) to dark glass aesthetic matching the board view
- Convert `task-calendar-view.tsx` from light to dark glass with matching rounded corners, backdrop blur, and glass effects
- Convert `morning-briefing.tsx` from light (`bg-white text-slate-950`) to dark glass
- Convert `memoir-gallery.tsx` from light to dark glass
- Convert `executive-briefing-card.tsx` mixed sections to fully dark glass

### Language Normalization

- Replace all "mission command" / military / crypto vocabulary with Vietnamese PM language across ~12 frontend components and ~4 backend API services
- Replace English military labels with Vietnamese equivalents throughout the UI

### UX Enhancements

- Add week view toggle to calendar alongside existing month view
- Fix `task-board-view.tsx` dragged task performance (nested for-of loop → `useMemo`)
- Fix `task-board-view.tsx` column overflow on narrow screens (`w-80` fixed → responsive min-width)
- Add skeleton loading states for AI-powered panels (prediction, intelligence, suggestions) in task edit slide-over
- Replace RichTextEditor hardcoded random Unsplash cover image with gradient placeholder
- Fix RichTextEditor icon picker (remove random behavior — static icon selection)

### Dependencies

- Install `@dnd-kit/core` + `@dnd-kit/sortable` for calendar drag-drop functionality

## Capabilities

### New Capabilities

- `dark-glass-theme`: Define the dark glass design system tokens used across all SuperBoard components (CSS classes, color tokens, shadow system)
- `task-calendar-ux`: Calendar view enhancements including week view toggle and drag-drop task rescheduling
- `task-board-performance`: Optimized board view rendering and responsive layout fixes
- `ai-panel-loading`: Skeleton loading states for AI-powered insight panels

### Modified Capabilities

- _(none — no spec-level behavior changes; purely visual and UX improvements)_

## Impact

### Files Affected

**Frontend — Theme consistency:**

- `apps/web/src/features/jira/components/task-filter-bar.tsx`
- `apps/web/src/features/jira/components/task-calendar-view.tsx`
- `apps/web/src/features/executive/components/morning-briefing.tsx`
- `apps/web/src/features/executive/components/memoir-gallery.tsx`
- `apps/web/src/features/reports/components/executive-briefing-card.tsx`

**Frontend — Vocabulary normalization:**

- `apps/web/src/features/jira/components/project-detail-header.tsx`
- `apps/web/src/features/jira/components/task-edit-slide-over.tsx`
- `apps/web/src/features/jira/components/quick-search-dialog.tsx`
- `apps/web/src/features/chat/components/ChatShell.tsx`
- `apps/web/src/features/chat/components/MessageList.tsx`
- `apps/web/src/features/chat/components/ThreadPanel.tsx`
- `apps/web/src/features/chat/components/MessageInput.tsx`
- `apps/web/src/features/docs/components/RichTextEditor.tsx`
- `apps/web/src/features/automation/components/connect-hub.tsx`
- `apps/web/src/features/automation/components/AutomationList.tsx`
- `apps/web/src/features/automation/components/ExecutiveDirective.tsx`
- `apps/web/src/features/automation/components/TheVoid.tsx`
- `apps/web/src/features/automation/components/SymbiosisConsole.tsx`
- `apps/web/src/features/executive/components/morning-briefing.tsx`
- `apps/web/src/features/reports/components/executive-briefing-card.tsx`
- `apps/web/src/features/ai/components/ai-planner-modal.tsx`
- `apps/web/src/features/ai/components/neural-workspace-digest.tsx`
- `apps/web/src/features/qa/components/neural-qa-dashboard.tsx`
- `apps/web/src/features/search/components/knowledge-map.tsx`
- `apps/web/src/features/knowledge/components/knowledge-graph-view.tsx`
- `apps/web/src/features/knowledge/components/ConflictResolver.tsx`

**Frontend — UX enhancements:**

- `apps/web/src/features/jira/components/task-board-view.tsx`
- `apps/web/src/features/jira/components/task-edit-slide-over.tsx`
- `apps/web/src/features/docs/components/RichTextEditor.tsx`

**Backend — Vocabulary normalization:**

- `apps/api/src/modules/ai/ai.service.ts`
- `apps/api/src/modules/search/search.service.ts`
- `apps/api/src/modules/automation/connect.service.ts`

**Dependencies:**

- `package.json`: Add `@dnd-kit/core` and `@dnd-kit/sortable`
