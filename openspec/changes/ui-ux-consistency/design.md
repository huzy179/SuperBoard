## Context

SuperBoard uses two conflicting design systems:

1. **Dark glass aesthetic** — `bg-slate-950/80 backdrop-blur-3xl glass shadow-glass` used in board view, project header, chat, and automation components
2. **Light default Tailwind** — `bg-white border-slate-200 shadow-xs` used in filter bar, calendar, morning briefing, and executive cards

The codebase already defines a solid CSS foundation in `theme.css` (Tailwind v4 `@theme` block with oklch tokens) and `globals.css` (glass panels, premium cards, spring easing). The task is to extend this foundation to all components and normalize vocabulary.

The project enforces Vietnamese UI text (CLAUDE.md) but large portions of the UI use English military/crypto language that violates this standard.

## Goals / Non-Goals

**Goals:**

- All components in Jira, Chat, Docs, and Executive views use consistent dark glass aesthetic
- All UI text follows Vietnamese PM vocabulary (no mission/crypto/AI jargon in labels)
- Calendar supports both month and week views with drag-drop rescheduling
- Board view renders efficiently and responds correctly on all screen sizes
- AI panels have proper loading states

**Non-Goals:**

- No dark/light theme toggle (dark is the single theme)
- No backend integration with Jira/Notion/Slack APIs (UI-only change)
- No changes to component APIs (props remain the same; only visual/label changes)
- No new spec-level behavior (no functional changes to how tasks, projects, or users behave)
- No changes to data models or Prisma schema

## Decisions

### D1: CSS token approach for dark glass

**Decision:** Define dark glass CSS classes as Tailwind v4 `@apply` utilities in `globals.css`, referencing existing oklch tokens from `theme.css`.

**Rationale:** The existing `theme.css` already defines oklch color tokens (`--color-brand-*`, `--color-surface-*`) and shadow tokens (`--shadow-luxe`, `--shadow-glass`). Rather than creating new CSS variables, reuse existing tokens and compose them into reusable class utilities.

**Implementation:**

```css
/* Dark glass card */
.dark-glass-card {
  @apply bg-slate-950/80 backdrop-blur-3xl border border-white/5 shadow-glass rounded-[2rem];
}

/* Dark glass input/filter */
.dark-glass-input {
  @apply bg-white/[0.03] border border-white/10 text-white placeholder:text-white/20 rounded-xl;
}

/* Dark glass badge */
.dark-glass-badge {
  @apply bg-white/[0.03] border border-white/5 text-white/60;
}
```

**Alternatives considered:**

- Inline Tailwind classes on every component — high duplication, maintenance nightmare
- CSS custom properties only — requires more refactoring than using existing @apply utilities
- Design system component library — out of scope for this change; work against existing pattern

### D2: Vocabulary replacement strategy

**Decision:** Replace mission/crypto vocabulary with Vietnamese PM language using a translation map, applied component-by-component.

**Rationale:** The replacements are unambiguous (each mission term maps to exactly one Vietnamese PM term), so no i18n library is needed. Changes are purely cosmetic label text.

**Key replacements:**
| Mission Speak | → | Vietnamese PM |
|---|---|---|
| "Mission Active" | → | "Công việc đang mở" |
| "Unit Specification" | → | "Chi tiết công việc" |
| "Intelligence Terminal" | → | "Tùy chọn AI" |
| "Neural Decompose" | → | "Phân tách AI" |
| "Refine Payload" | → | "Tối ưu nội dung" |
| "Executive Brief" | → | "Tóm tắt AI" |
| "Archive Manifest" | → | "Xóa công việc" |
| "Commit Specification" | → | "Lưu thay đổi" |
| "Initialize Mission" | → | "Tạo công việc" |
| "Tactical Board" | → | "Bảng công việc" |
| "Mission List" | → | "Danh sách công việc" |
| "Chronos" | → | "Lịch" |
| "Strategic Insights" | → | "Phân tích" |
| "Neural Health Forecast" | → | "Dự đoán tiến độ" |
| "Active Operatives" | → | "Đang hoạt động" |
| "Sync Status" | → | "Cập nhật gần nhất" |
| "Protocol Selection" | → | "Chọn chức năng" |
| "Semantic Duplicate Warning" | → | "Công việc trùng lặp" |
| "Neural Triage Suggestions" | → | "Gợi ý AI" |
| "Intelligent Briefing" | → | "Tóm tắt AI" |
| "Signal Logs" | → | "Bình luận" |
| "Established" | → | "Tạo lúc" |
| "Last Synced" | → | "Cập nhật lúc" |
| "Abort Protocol" | → | "Hủy bỏ" |
| "Neural Pulse" | → | "Đang nhập..." |
| "Elite Protocol Header" | → | (remove — use channel name directly) |
| "Transmission Interface" | → | (remove — no label needed) |
| "Protocol_v4.2.0" | → | "v4.2.0" |
| "End_to_End_Encryption_Active" | → | (remove — irrelevant for internal PM tool) |
| "Neural Synthesis Complete" | → | "Đã xử lý xong" |
| "Synthesis Interrupted" | → | "Lỗi xử lý" |

### D3: Calendar week view and drag-drop

**Decision:** Use `@dnd-kit/core` + `@dnd-kit/sortable` for drag-drop (add as dependencies). Calendar uses framer-motion for view transitions.

**Rationale:** `@dnd-kit` is the standard drag-drop library for React (used by shadcn/ui, Radix, etc.). The project already has `framer-motion` installed. No other drag-drop library is in use.

**Implementation approach:**

- Add `@dnd-kit/core` + `@dnd-kit/sortable` to `apps/web/package.json`
- Week view: toggle between month/week using state; share the same data structure
- Drag-drop: `onDragEnd` → calls `useProjectCalendar` hook → updates task dueDate via mutation
- Both month and week view use the same `TaskCalendarView` component with a `viewMode` prop (`'month' | 'week'`)

### D4: Board view performance

**Decision:** Replace nested `for-of` loop with `useMemo` on `boardData` lookup, and fix column width with `min-w-[20rem]` instead of `w-80`.

**Rationale:** The `draggedTask` lookup in `task-board-view.tsx` runs on every render (lines 103-110). With a `useMemo` keyed on `[draggedTaskId, boardData]`, React skips recomputation when neither changes. The column width change ensures readability on 1024px+ screens while maintaining horizontal scroll on smaller ones.

### D5: RichTextEditor cover image

**Decision:** Replace the hardcoded Unsplash URL + random regeneration with a static gradient placeholder. Remove the "Regenerate_Skin" button.

**Rationale:** Random Unsplash photos can be inappropriate or irrelevant. A gradient placeholder is clean, lightweight, and requires no backend storage. Users can set cover image later when backend supports it.

**Implementation:**

```tsx
// Replace coverImage state + Unsplash URL with:
const coverGradient = 'bg-gradient-to-br from-brand-500/20 via-slate-900 to-slate-950';

// Remove setCoverImage button from the cover div
```

### D6: Icon picker fix

**Decision:** Replace `icons[Math.floor(Math.random() * icons.length)]` with a controlled click that cycles to the NEXT icon, not a random one.

**Rationale:** Random on every click is disorienting. Cycling through a predefined list gives user control without needing a state machine.

```tsx
const ICONS = ['📑', '💾', '🛡️', '⚡', '📊', '🏛️', '🎯'];
const nextIcon = ICONS[(ICONS.indexOf(icon) + 1) % ICONS.length];
setIcon(nextIcon);
```

### D7: API service string cleanup

**Decision:** Replace string literals in API response logs/comments with neutral Vietnamese PM language.

**Rationale:** Backend service logs appear in API responses and server logs. Cleaning them improves debugging clarity and maintains consistency with the frontend vocabulary.

Files: `ai.service.ts`, `search.service.ts`, `connect.service.ts` — replace string literals like `"Neural synchronization sequence initiated"`, `"Signal handshake complete"`, etc.

## Risks / Trade-offs

- **[Risk]** Theme changes may affect existing component tests (e.g., snapshot tests that match exact class names) → **Mitigation:** Run `npm test -- --updateSnapshot` after changes; update snapshots if visual output is correct
- **[Risk]** Adding `@dnd-kit` increases bundle size (~15kb gzipped) → **Mitigation:** Only imported in calendar view; tree-shaken in other bundles
- **[Risk]** Removing mission speak from `ChatShell` may affect any external integrations that parse the "Protocol_v4.2.0" string → **Mitigation:** Only removed from UI label; version string remains in data attributes if needed
- **[Risk]** `task-calendar-view.tsx` receives data from `useProjectCalendar` hook — if week view data transformation is missing, it will fail silently → **Mitigation:** Check hook data transformation before implementing week view; add `useMemo` for week data if needed

## Migration Plan

**Phase 1 — CSS foundation (small, low risk):**

1. Add dark glass utility classes to `globals.css`
2. Test that existing dark glass components still render correctly

**Phase 2 — Theme consistency (component-by-component):** 3. Convert `task-filter-bar.tsx` 4. Convert `task-calendar-view.tsx` 5. Convert `morning-briefing.tsx` 6. Convert `memoir-gallery.tsx` 7. Convert `executive-briefing-card.tsx`
Each change is independently deployable — no coordinated release needed.

**Phase 3 — Vocabulary normalization:** 8. Replace mission speak in Jira components 9. Replace in Chat components 10. Replace in Docs components 11. Replace in Automation/AI components 12. Replace in Executive/Reports components 13. Clean backend API strings

**Phase 4 — UX enhancements:** 14. Install `@dnd-kit/core` + `@dnd-kit/sortable` 15. Add week view to calendar 16. Implement calendar drag-drop 17. Optimize board view performance 18. Add AI panel loading states 19. Fix RichTextEditor cover + icon picker

**Rollback:** Each phase can be independently reverted via `git checkout`. No database migration needed.

## Open Questions

All decisions resolved:

- **Q1:** "Intelligence Pulse" → "Tình trạng dự án" (contexto: tooltip trong project header)
- **Q2:** `connect-hub.tsx` Neural Monitor tab → Empty state "Tính năng đang phát triển" (không giữ mock data trên production)
- **Q3:** "Priority Mission" → "Công việc quan trọng" (phổ quát hơn)
