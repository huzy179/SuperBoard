# DOING

> Đang code. Mỗi item ở đây phải có output rõ ràng trong tuần.

---

## Sprint hiện tại — Jira v1.38: Productization Baseline

Mục tiêu: đưa SuperBoard từ mức “feature demo rất mạnh” sang mức “Jira MVP dùng thật, dễ maintain, dễ verify, dễ ship”.

### Chất lượng sản phẩm (Sprint v1.38)

**Hoàn tất (Commit: 600cb85):**

- [x] E2E flow cốt lõi: Login → Home → Create Project → Create Task → Drag-drop → Comments/History
- [x] Smoke test checklist: 15 sections, 150+ test cases, ready for manual/automation testing

**Tiếp theo (Priority P0):**

- [ ] Rà lại các lỗi UX mức P0/P1: empty state, loading state, error state, responsive breakpoints
  - Run SMOKE_TEST_CHECKLIST.md manually hoặc tự động với Playwright
  - Capture lỗi + fix trước PR review

### Kỹ thuật / maintainability (Sprint v1.38)

**Hoàn tất:**

- [x] Wave 1: Tách pure helpers + calendar utility
- [x] Wave 2a: Tách bulk actions + undo delete timer
- [x] Wave 2b: Tách task detail/edit/subtask handlers → `use-task-edit-panel`
- [x] Cập nhật `worklog/PROJECT_STRUCTURE.md`

**Tiếp theo (Wave 2c — optional):**

- [ ] Tách drag-drop + rebalance logic sang hook riêng `use-task-drag-drop` (nếu cần giảm complexity thêm)

**Roadmap (Sprint v1.39+):**

- [ ] Chốt roadmap thực tế theo hướng Jira-first: tránh mở rộng sang Slack / Notion / AI platform cho tới khi Jira đủ ổn định

## Blockers

- Không có blocker kỹ thuật nghiêm trọng.
- Blocker lớn nhất hiện tại là **scope quá rộng so với trạng thái thực tế**; cần giữ kỷ luật Jira-first để tránh phân tán.
