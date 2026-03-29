# DOING

> Đang code. Mỗi item ở đây phải có output rõ ràng trong tuần.

---

## Sprint hiện tại — Jira v1.38: Productization Baseline

Mục tiêu: đưa SuperBoard từ mức “feature demo rất mạnh” sang mức “Jira MVP dùng thật, dễ maintain, dễ verify, dễ ship”.

### Chất lượng sản phẩm (Sprint v1.38)

**Hoàn tất (Commit: 600cb85):**

- [x] E2E flow cốt lõi: Login → Home → Create Project → Create Task → Drag-drop → Comments/History
- [x] Smoke test checklist: 15 sections, 150+ test cases, ready for manual/automation testing
- [x] Wave 2c: Tách calendar state + presence/copy-link ra khỏi project detail page
  - Tạo `use-project-calendar.ts` — quản lý calendar month, cells, navigation, task grouping theo due date
  - Tạo `use-project-header-actions.ts` — quản lý viewer count (realtime presence) + copy-link/open-tab
  - `page.tsx` giảm từ 538 lines xuống ~460 lines, bỏ duplicate logic đã extract
  - Lưu ý: typecheck có 1 lỗi pre-existing `FormEvent<HTMLFormElement>` trong `use-task-edit-panel` — đã fix (Cast `handleCreateSubtask as () => void` tại call site, đổi prop `TaskSubtaskManager` thành `() => void`, xoá `FormEvent` import không dùng)

**Tiếp theo (Priority P0):**

- [x] Rà lại các lỗi UX mức P0/P1: empty state, loading state, error state, responsive breakpoints
  - Đã rà theo code paths chính (Jira Home, Project Detail) và cập nhật `worklog/SMOKE_TEST_CHECKLIST.md` cho khớp UI hiện tại (empty/error state)
  - Đã chạy smoke test headless (login → error state → tạo project empty → verify empty state + responsive) và PASS cho các điểm trọng yếu
  - Đã fix Known Limitation: thêm Sonner toast feedback cho tất cả CRUD operations (project/task/subtask/comment)

### Kỹ thuật / maintainability (Sprint v1.38)

**Hoàn tất:**

- [x] Wave 1: Tách pure helpers + calendar utility
- [x] Wave 2a: Tách bulk actions + undo delete timer
- [x] Wave 2b: Tách task detail/edit/subtask handlers → `use-task-edit-panel`
- [x] Cập nhật `worklog/PROJECT_STRUCTURE.md`

**Tiếp theo (Wave 2c — optional):**

- [x] ~~Tách drag-drop + rebalance logic sang hook riêng `use-task-drag-drop`~~ — đã hoàn tất (Wave 2c hoàn chỉnh)
- [x] Tách calendar state → `use-project-calendar.ts` (Wave 2c)
- [x] Tách presence + copy-link → `use-project-header-actions.ts` (Wave 2c)

**Roadmap (Sprint v1.39+):**

- [ ] Chốt roadmap thực tế theo hướng Jira-first: tránh mở rộng sang Slack / Notion / AI platform cho tới khi Jira đủ ổn định

## Blockers

- Không có blocker kỹ thuật nghiêm trọng.
- Blocker lớn nhất hiện tại là **scope quá rộng so với trạng thái thực tế**; cần giữ kỷ luật Jira-first để tránh phân tán.
