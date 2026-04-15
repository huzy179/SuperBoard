# Implementation Tasks

## Phase 1: CSS Foundation

- [x] 1.1 Add dark glass utility classes to globals.css

---

## Phase 2: Theme Consistency

- [x] 2.1 Convert task-filter-bar.tsx to dark glass

  **File:** `apps/web/src/features/jira/components/task-filter-bar.tsx`

  Changes:
  - Container: `rounded-xl border border-slate-200 bg-white p-3 shadow-xs` → `.dark-glass-panel` or equivalent dark glass classes
  - Filter chips: `bg-slate-100 text-slate-600` (selected) / `bg-slate-50 text-slate-500` (unselected) → dark glass equivalents
  - Search input: `bg-slate-50 border-slate-300 text-slate-700` → dark glass input
  - Status label text: `text-slate-500` → `text-white/40`
  - Clear filter button: `text-rose-600` stays the same (error color)
  - Divider `h-px bg-slate-200` → `h-px bg-white/5`

  ← (verify: filter bar visually matches board view dark glass aesthetic; all filter interactions work correctly)

- [x] 2.2 Convert task-calendar-view.tsx to dark glass + week view + drag-drop

  **File:** `apps/web/src/features/jira/components/task-calendar-view.tsx`

  Changes (in order):
  1. **Dark glass styling** — container, navigation bar, day cells, task chips
  2. **Week view toggle** — add `viewMode: 'month' | 'week'` prop and toggle button in header
  3. **Week view rendering** — show only 7 days when in week mode
  4. **Drag-drop** — install `@dnd-kit/core` + `@dnd-kit/sortable`, implement drag on task chips

  Dark glass changes:
  - Container: `rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-xs` → dark glass
  - Nav buttons: `border border-slate-300 bg-white text-slate-700 hover:bg-slate-50` → dark glass buttons
  - Month label: `text-sm font-semibold text-slate-900 capitalize` → `text-sm font-semibold text-white`
  - Day header: `text-slate-600 uppercase` → `text-white/40 uppercase`
  - Calendar grid cells: `border border-slate-200 bg-white` (in-month) / `bg-slate-50` (out-month) → dark glass
  - Day number: `text-slate-700` / `text-slate-400` → `text-white` / `text-white/20`
  - Task chips: `bg-white border-slate-200 text-slate-700` → dark glass chip
  - Show-archived section: `border border-slate-200 bg-white shadow-xs` → dark glass panel

  Week view toggle (add to nav bar):
  - Add `viewMode: 'month' | 'week'` prop
  - Add toggle button between month label and prev/next buttons
  - When `viewMode='week'`, only render 7 cells (current week), otherwise 42 (6 weeks)
  - Navigation: week mode goes forward/back by 7 days; month mode by 1 month

  Drag-drop:
  - Wrap task chips in `<Draggable>` from `@dnd-kit/core`
  - Wrap date cells in `<Droppable>` from `@dnd-kit/sortable`
  - `onDragEnd` → call task mutation to update `dueDate`
  - Optimistic update: move task chip to new cell immediately

  ← (verify: calendar renders dark glass; week/month toggle works; drag-drop updates dueDate via API)

- [x] 2.3 Install drag-drop dependencies

  **Files:** `apps/web/package.json` (or via workspace package.json if monorepo)

  ```bash
  npm install @dnd-kit/core @dnd-kit/sortable --workspace @superboard/web
  ```

  Or add directly to `apps/web/package.json` and run `npm install`.

  ← (verify: packages listed in package.json; `import { DndContext } from '@dnd-kit/core'` compiles without errors)

- [x] 2.4 Convert morning-briefing.tsx to dark glass

  **File:** `apps/web/src/features/executive/components/morning-briefing.tsx`

  Changes:
  - Container: `bg-white rounded-[4rem] text-slate-950` → dark glass with white/muted text
  - All card backgrounds: `bg-slate-100` → `bg-white/[0.02] border border-white/5`
  - Metric numbers: `text-slate-900` → `text-white`
  - Labels: `text-slate-500 uppercase tracking-wide` → `text-white/40 uppercase tracking-widest text-[9px]`
  - Section titles: `text-slate-900 font-black` → `text-white font-black`
  - Priority Mission chip: `bg-indigo-50 text-indigo-700` → `bg-brand-500/10 text-brand-400`
  - Operational Pulse section: `bg-white text-slate-950` → dark glass

  ← (verify: morning briefing visually matches dark glass theme; no light-colored elements visible)

- [x] 2.5 Convert memoir-gallery.tsx to dark glass

  **File:** `apps/web/src/features/executive/components/memoir-gallery.tsx`

  Changes:
  - Container: `bg-slate-50/50 text-slate-900` → dark glass
  - Card backgrounds: `bg-white rounded-[3rem] border border-slate-200/50` → dark glass card
  - Text: `text-slate-900` → `text-white`; `text-slate-600` → `text-white/60`; `text-slate-400` → `text-white/40`
  - "No items" state: use dark glass panel with muted text instead of light background

  ← (verify: memoir gallery renders all items in dark glass aesthetic)

- [x] 2.6 Convert executive-briefing-card.tsx to fully dark glass

  **File:** `apps/web/src/features/reports/components/executive-briefing-card.tsx`

  Changes:
  - All `text-slate-950` → `text-white`
  - All `text-slate-700` → `text-white/80`
  - All `text-slate-500` → `text-white/40`
  - All `bg-white` / `bg-slate-50` / `bg-indigo-50` / `bg-emerald-50` → dark glass equivalents with appropriate accent colors preserved (emerald-500 for positive metrics, amber-500 for warnings, rose-500 for errors — accent colors stay the same, only backgrounds/labels change to dark)

  ← (verify: executive briefing card is fully dark glass with no light backgrounds; accent colors (emerald/amber/rose) preserved correctly)

---

## Phase 3: Vocabulary Normalization

- [x] 3.1 Replace mission speak in Jira components

  **File:** `apps/web/src/features/jira/components/project-detail-header.tsx`

  Replace labels (maintain icon usage, change only text labels):
  | Original | → | Replacement |
  |---|---|---|
  | "Project Nodes" | → | "Dự án" |
  | "NODE_ID: {projectKey}" | → | "{projectKey}" |
  | "Intelligence Pulse" | → | "Tình trạng dự án" |
  | Project health tooltip | → | Vietnamese translation |
  | "Initialize Mission" | → | "Tạo công việc" |
  | "Plan with AI" | → | "Lên kế hoạch với AI" |
  | "Mission Briefing" | → | "Tóm tắt nhanh" |
  | "Tactical Board" | → | "Bảng công việc" |
  | "Mission List" | → | "Danh sách" |
  | "Chronos" | → | "Lịch" |
  | "Strategic Insights" | → | "Phân tích" |
  | "Intelligence" (reports nav) | → | "Báo cáo" |
  | "Neural Workflow Architect" | → | "Thiết kế quy trình" |
  | "Active Operatives" | → | "Thành viên đang hoạt động" |
  | "Sync Status" | → | "Cập nhật gần nhất" |
  | "MODIFIED" | → | "Cập nhật" |
  | "Live Status" | → | "Đang theo dõi" |
  | "Automation Gateway" | → | "Tự động hóa" |
  | "Neural Knowledge Map" | → | "Bản đồ kiến thức" |
  | "Synchronize Neural Link" | → | "Sao chép liên kết" |
  | "Command Protocol V4.2" | → | (remove footer label) |
  | "Manifest objectives pending definition..." | → | "Mô tả dự án..." |

  ← (verify: all visible text labels in project detail header are in Vietnamese; no English mission speak visible)

- [x] 3.2 Replace mission speak in task-edit-slide-over.tsx

  **File:** `apps/web/src/features/jira/components/task-edit-slide-over.tsx`

  Replace labels:
  | Original | → | Replacement |
  |---|---|---|
  | "Mission Active" | → | "Công việc đang mở" |
  | "Unit Specification" | → | "Chi tiết công việc" |
  | "Intelligence Terminal" | → | "Tùy chọn AI" |
  | "Protocol Selection" | → | "Chọn chức năng" |
  | "Neural Decompose" | → | "Phân tách AI" |
  | "Analyze & generate sub-nodes" | → | "Phân tích & tạo công việc con" |
  | "Refine Payload" | → | "Tối ưu nội dung" |
  | "Optimize description & sizing" | → | "Tối ưu mô tả & ước lượng" |
  | "Executive Brief" | → | "Tóm tắt AI" |
  | "Generate status intelligence" | → | "Tạo tóm tắt tự động" |
  | "Neural Health Forecast" | → | "Dự đoán tiến độ" |
  | "Estimated Completion" | → | "Dự kiến hoàn thành" |
  | "Risk Assessment" | → | "Đánh giá rủi ro" |
  | "High Delay Risk" | → | "Nguy cơ trễ" |
  | "Healthy Vector" | → | "Đúng tiến độ" |
  | "Confidence" | → | "Độ tin cậy" |
  | "Redistribute to:" | → | "Chuyển cho:" |
  | "(Low workload)" | → | "(ít việc)" |
  | "Semantic Duplicate Warning" | → | "Công việc trùng lặp" |
  | "MATCH" | → | "% trùng" |
  | "Neural Triage Suggestions" | → | "Gợi ý AI" |
  | "Suggested Priority:" | → | "Ưu tiên gợi ý:" |
  | "Intelligent Briefing" | → | "Tóm tắt AI" |
  | "Signal Logs" | → | "Bình luận" |
  | "Established" | → | "Tạo lúc" |
  | "Last Synced" | → | "Cập nhật lúc" |
  | "Archive Manifest" | → | "Xóa công việc" |
  | "Restore Vector" | → | "Khôi phục" |
  | "Abort Protocol" | → | "Hủy bỏ" |
  | "Commit Specification" | → | "Lưu thay đổi" |
  | "Synchronizing..." | → | "Đang lưu..." |
  | "PROTOCOL_SYNC_HEADER_ERROR" | → | "Lỗi lưu" |

  ← (verify: all visible text labels in task edit slide-over are in Vietnamese; no mission speak visible)

- [x] 3.3 Replace mission speak in Chat components

  **Files:**
  - `apps/web/src/features/chat/components/ChatShell.tsx`
  - `apps/web/src/features/chat/components/MessageList.tsx`
  - `apps/web/src/features/chat/components/ThreadPanel.tsx`
  - `apps/web/src/features/chat/components/MessageInput.tsx`

  Replace in ChatShell.tsx:
  | Original | → | Replacement |
  |---|---|---|
  | "Elite Protocol Header" | → | (remove — only channel name in header) |
  | "Transmission Interface" | → | (remove — no label) |
  | "Neural pulse detected: Transmission incoming" | → | "{name} đang nhập..." |
  | "End_to_End_Encryption_Active" | → | (remove — not relevant for internal PM) |
  | "Protocol_v4.2.0" | → | "v4.2.0" |

  MessageList.tsx — search for mission speak labels and replace with Vietnamese equivalents.

  ThreadPanel.tsx — replace any mission speak in thread panel header or messages.

  MessageInput.tsx — replace any mission speak labels on input actions.

  ← (verify: chat UI shows only Vietnamese text; no English mission speak visible in UI labels)

- [x] 3.4 Replace mission speak in Docs components

  **File:** `apps/web/src/features/docs/components/RichTextEditor.tsx`

  Replace:
  | Original | → | Replacement |
  |---|---|---|
  | "Neural Synthesis Complete" | → | "Đã xử lý xong" |
  | "Synthesis Interrupted" | → | "Lỗi xử lý" |
  | "AI_PROTOCOL_CMDS" | → | "LỆNH AI" |
  | "Continue Writing" | → | "Tiếp tục viết" |
  | "AI will complete the neural sequence" | → | "AI sẽ hoàn thành đoạn văn" |
  | "Extract Keywords" | → | "Trích xuất từ khóa" |
  | "Isolate core intel points" | → | "Lấy các ý chính" |
  | "Protocol Condenser" | → | "Rút gọn nội dung" |
  | "Optimize data density" | → | "Tối ưu độ dài" |
  | "Neural_Bridge_Active" | → | "Kết nối AI đang hoạt động" |
  | "Archive_Node" | → | "Tài liệu" |
  | "Regenerate_Skin" | → | "Thay đổi nền" |

  Also fix:
  - Remove random Unsplash URL cover image → replace with gradient placeholder `bg-gradient-to-br from-brand-500/20 via-slate-900 to-slate-950`
  - Remove "Regenerate_Skin" button (no cover image upload in scope)
  - Fix icon picker: replace `Math.floor(Math.random() * icons.length)` with cycling: `const nextIcon = ICONS[(ICONS.indexOf(icon) + 1) % ICONS.length]`

  ← (verify: RichTextEditor loads with gradient cover (no external image fetch); icon click cycles forward not random; all labels in Vietnamese)

- [x] 3.5 Replace mission speak in Automation/AI components

  **Files:**
  - `apps/web/src/features/automation/components/connect-hub.tsx`
  - `apps/web/src/features/automation/components/AutomationList.tsx`
  - `apps/web/src/features/automation/components/ExecutiveDirective.tsx`
  - `apps/web/src/features/automation/components/TheVoid.tsx`
  - `apps/web/src/features/automation/components/SymbiosisConsole.tsx`
  - `apps/web/src/features/ai/components/ai-planner-modal.tsx`
  - `apps/web/src/features/ai/components/neural-workspace-digest.tsx`
  - `apps/web/src/features/qa/components/neural-qa-dashboard.tsx`
  - `apps/web/src/features/search/components/knowledge-map.tsx`
  - `apps/web/src/features/knowledge/components/knowledge-graph-view.tsx`
  - `apps/web/src/features/knowledge/components/ConflictResolver.tsx`

  For each file: search for and replace all English mission/crypto speak labels with Vietnamese equivalents. Focus on visible text labels (aria-labels, button text, tooltip text, status badges).

  In `connect-hub.tsx` specifically:
  | Original | → | Replacement |
  |---|---|---|
  | "SuperBoard Connect" | → | "SuperBoard Kết nối" |
  | "Ecosystem Expansion Interface" | → | "Giao diện kết nối dịch vụ" |
  | "Node_Connected_Secure" | → | "Đã kết nối" |
  | "Register Node" | → | "Thêm kết nối" |
  | "Connect a new service..." | → | "Kết nối dịch vụ mới vào workspace" |
  | "Connections" tab | → | "Kết nối" |
  | "Neural Monitor" tab | → | **Replace entire tab content** with empty state: centered div showing "Tính năng đang phát triển" text with a muted icon (e.g., `Construction` icon from lucide), using dark glass panel styling. Remove all mock stats (420 pk/s, 14ms, 1.2k, terminal log rows). |
  | ~~"Global Throughput"~~ | → | **Remove** (no longer needed — tab is empty state) |
  | ~~"Neural Latency"~~ | → | **Remove** |
  | ~~"Signals Processed"~~ | → | **Remove** |
  | ~~"Simulation Mode Engaged"~~ | → | **Remove** |
  | ~~"SuperBoard Neural Terminal"~~ | → | **Remove** (terminal log section) |
  | "Awaiting tactical signals..." | → | "Đang chờ tín hiệu..." |

  ← (verify: no English mission speak visible in any automation/AI component UI labels)

- [x] 3.6 Replace mission speak in Executive/Reports components

  **Files:**
  - `apps/web/src/features/executive/components/morning-briefing.tsx` (already being converted for theme; add vocabulary replacement)
  - `apps/web/src/features/reports/components/executive-briefing-card.tsx` (already being converted for theme; add vocabulary replacement)

  Morning briefing vocabulary:
  | Original | → | Replacement |
  |---|---|---|
  | "Command Sector Briefing" | → | "Báo cáo buổi sáng" |
  | "Operational Pulse" | → | "Tình trạng hoạt động" |
  | "Command Intent" | → | "Mục tiêu chính" |
  | "Priority Mission" | → | "Công việc quan trọng" |
  | "Neural Activity" | → | "Hoạt động gần đây" |
  | "Neural Highlights" | → | "Nổi bật" |

  Executive briefing card vocabulary:
  | Original | → | Replacement |
  |---|---|---|
  | "Executive Briefing" | → | "Báo cáo tổng quan" |
  | "Neural Health" | → | "Tình trạng dự án" |
  | "Strategic Briefing" | → | "Phân tích chiến lược" |
  | "AI Briefing" | → | "Phân tích AI" |

- [x] 3.7 Clean backend API service strings

  **Files:**
  - `apps/api/src/modules/ai/ai.service.ts`
  - `apps/api/src/modules/search/search.service.ts`
  - `apps/api/src/modules/automation/connect.service.ts`

  Search for and replace string literals that reference mission speak in log messages and response payloads:
  - `"Neural synchronization sequence initiated"` → `"Đang đồng bộ..."` or neutral
  - `"Signal handshake complete"` → `"Kết nối thành công"`
  - `"AI Synthesis: commit..."` → `"Phân tích commit..."`
  - `"Mission Briefing Protocol Active"` → remove or neutralize
  - `"Tactical alignment"` → `"Đang phân tích..."`
  - `"Local Intelligence active"` → `"AI đang hoạt động"`
  - `"System health nominal"` → `"Hệ thống hoạt động tốt"`

  Do NOT change: variable names, function names, TypeScript types, or logic — only string literal values in console logs and API response strings.

  ← (verify: backend logs and API response strings use neutral/Vietnamese text; no mission speak in string literals)

---

## Phase 4: UX Enhancements

- [x] 4.1 Optimize task-board-view.tsx performance

  **File:** `apps/web/src/features/jira/components/task-board-view.tsx`

  Changes:

  ```tsx
  // Replace lines 103-110: nested for-of loop
  const draggedTask = useMemo(() => {
    if (!draggedTaskId) return null;
    for (const tasks of boardData.values()) {
      const found = tasks.find((t) => t.id === draggedTaskId);
      if (found) return found;
    }
    return null;
  }, [draggedTaskId, boardData]);

  // Replace lines 124-130: allowedStatuses memo
  const allowedStatuses = useMemo(() => {
    if (!draggedTask) return new Set<string>();
    const currentStatus = workflow?.statuses.find((s) => s.key === draggedTask.status);
    if (!currentStatus) return new Set<string>();
    return getAllowedTargetStatuses(currentStatus.id);
  }, [draggedTask, workflow, getAllowedTargetStatuses]);
  ```

  Also fix column width:
  - `w-80` → `min-w-[20rem]` on the column container div

  Also add task card label max-height:
  - Labels container: `max-h-12 overflow-hidden` when more than 3 labels

  ← (verify: board view renders without performance degradation on 50+ task projects; columns readable at 1024px width)

- [x] 4.2 Add AI panel loading states

  **File:** `apps/web/src/features/jira/components/task-edit-slide-over.tsx`

  Add skeleton loading states for each AI panel using existing dark glass skeleton pattern (`bg-white/[0.03] animate-pulse rounded-[2rem]`). Import a `SkeletonPanel` component or inline the skeleton.

  Panels needing loading states:
  1. Neural Health Forecast (lines 334-423) — wrap in `isLoading ? <SkeletonPanel /> : <HealthCard />`
  2. Semantic Duplicate Warning (lines 426-466) — same pattern
  3. Neural Triage Suggestions (lines 469-514) — same pattern
  4. Intelligent Briefing (lines 517-545) — show skeleton while `summarizeMutation.isPending`

  ```tsx
  // Add inline skeleton component in task-edit-slide-over.tsx:
  function SkeletonPanel({ className = '' }: { className?: string }) {
    return (
      <div
        className={`animate-pulse rounded-[2.5rem] bg-white/[0.02] border border-white/5 p-8 ${className}`}
      >
        <div className="space-y-3">
          <div className="h-4 bg-white/[0.05] rounded-lg w-3/4" />
          <div className="h-4 bg-white/[0.03] rounded-lg w-1/2" />
          <div className="h-4 bg-white/[0.03] rounded-lg w-5/6" />
        </div>
      </div>
    );
  }
  ```

  Then wrap each panel:

  ```tsx
  {
    !intelligence ? (
      <SkeletonPanel />
    ) : intelligence.duplicates?.length > 0 ? (
      <DuplicateWarningPanel intelligence={intelligence} />
    ) : null;
  }
  ```

  ← (verify: when opening a task, AI panels show skeleton loading states first; content appears progressively as data loads; no layout shift after content loads)

- [x] 4.3 Fix RichTextEditor cover image and icon picker

  **File:** `apps/web/src/features/docs/components/RichTextEditor.tsx`

  Changes:
  1. Remove cover image state and gradient placeholder:

  ```tsx
  // Remove lines 48-50 (coverImage state)
  // Remove setCoverImage from the button onClick
  // Replace cover div with gradient:
  <div className="h-64 md:h-80 w-full rounded-[3rem] overflow-hidden relative border border-white/5 mb-[-5rem] shadow-glass group/cover bg-gradient-to-br from-brand-500/20 via-slate-900/90 to-slate-950">
    {/* Remove the img tag */}
    {/* Remove the regenerate button */}
  </div>
  ```

  2. Fix icon picker (lines 328-335):

  ```tsx
  // Replace Math.random() with cycling:
  const ICONS = ['📑', '💾', '🛡️', '⚡', '📊', '🏛️', '🎯'];
  const nextIcon = ICONS[(ICONS.indexOf(icon) + 1) % ICONS.length];
  setIcon(nextIcon);
  ```

  ← (verify: RichTextEditor renders with gradient cover (no external image requests); clicking icon cycles through the 7 options in order)

---

## Post-Implementation Verification

- [x] 4.4 Run type-check, lint, and build

  After all tasks are complete, run:

  ```bash
  npm run type-check
  npm run lint
  npm run build
  ```

  Confirm no TypeScript errors, no ESLint errors, and successful build.
