# DOING

> Đang code. Mỗi item ở đây phải có output rõ ràng trong tuần.

---

## Sprint hiện tại — Jira v1.38+: Productization Baseline

Mục tiêu: đưa SuperBoard từ mức "feature demo rất mạnh" sang mức "Jira MVP dùng thật, dễ maintain, dễ verify, dễ ship".

### Chất lượng sản phẩm

**Hoàn tất:**

- [x] E2E flow cốt lõi: Login → Home → Create Project → Create Task → Drag-drop → Comments/History
- [x] Smoke test checklist: 15 sections, 150+ test cases, ready for manual/automation testing
- [x] Wave 2c: Tách calendar state + presence/copy-link ra khỏi project detail page
  - Tạo `use-project-calendar.ts` — quản lý calendar month, cells, navigation, task grouping theo due date
  - Tạo `use-project-header-actions.ts` — quản lý viewer count (realtime presence) + copy-link/open-tab
  - `page.tsx` giảm từ 538 lines xuống ~460 lines, bỏ duplicate logic đã extract
- [x] Rà lại các lỗi UX mức P0/P1: empty state, loading state, error state, responsive breakpoints
  - Đã rà theo code paths chính (Jira Home, Project Detail) — empty/error/loading states OK
  - Đã fix Known Limitation: thêm Sonner toast feedback cho tất cả CRUD operations
- [x] Fix typecheck clean pass: `FormEvent<HTMLFormElement>` → cast tại call site
- [x] Chuẩn bị deploy tối thiểu: fix Docker port mismatch (api 4000, web 3000)

### P1 — Productization thực tế

- [ ] Bổ sung error tracking / logging review ở các flow quan trọng
- [x] Kiểm tra và tinh gọn infra dev: giữ thứ gì đang thật sự dùng
  - Đã tách docker-compose minimal (postgres + redis) vs full (unused services)
  - Đã xoá dead services: keycloak, elasticsearch, minio, mailhog, ai-service (chưa có integration)
- [ ] Tăng test coverage cho các service/hook quan trọng của Jira

### Kỹ thuật / maintainability

**Hoàn tất:**

- [x] Wave 1: Tách pure helpers + calendar utility
- [x] Wave 2a: Tách bulk actions + undo delete timer → `use-task-bulk-actions`
- [x] Wave 2b: Tách task detail/edit/subtask handlers → `use-task-edit-panel`
- [x] Wave 2c: Tách calendar state → `use-project-calendar` + presence/copy-link → `use-project-header-actions`
- [x] Cập nhật `worklog/PROJECT_STRUCTURE.md`

**Roadmap (Sprint v1.39+):**

- [ ] Chốt roadmap thực tế theo hướng Jira-first: tránh mở rộng sang Slack / Notion / AI platform cho tới khi Jira đủ ổn định

## Blockers

- Không có blocker kỹ thuật nghiêm trọng.
- Blocker lớn nhất hiện tại là **scope quá rộng so với trạng thái thực tế**; cần giữ kỷ luật Jira-first để tránh phân tán.
