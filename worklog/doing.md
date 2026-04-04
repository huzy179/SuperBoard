# DOING

> Đang code. Mỗi item ở đây phải có output rõ ràng trong tuần.

---

## Sprint hiện tại — Jira v1.51+: Productization Baseline

Mục tiêu: đưa SuperBoard từ mức "feature demo rất mạnh" sang mức "Jira MVP dùng thật, dễ maintain, dễ verify, dễ ship".

**Tất cả P0 + P1 productization tasks đã hoàn tất ✅**

### Kỹ thuật / maintainability

**Hoàn tất:**

- [x] Wave 1: Tách pure helpers + calendar utility
- [x] Wave 2a: Tách bulk actions + undo delete timer → `use-task-bulk-actions`
- [x] Wave 2b: Tách task detail/edit/subtask handlers → `use-task-edit-panel`
- [x] Wave 2c: Tách calendar state → `use-project-calendar` + presence/copy-link → `use-project-header-actions`
- [x] Cập nhật `worklog/PROJECT_STRUCTURE.md`

**Roadmap (Sprint v1.52+):**

- [ ] Jira v1.80: Task Attachment Support (Productization MVP with Mock Storage)
- [ ] Tiếp theo: deploy thực tế lên môi trường staging/production
- [ ] Chốt roadmap thực tế theo hướng Jira-first: tránh mở rộng sang Slack / Notion / AI platform cho tới khi Jira đủ ổn định

## Blockers

- Không có blocker kỹ thuật nghiêm trọng.
- Blocker lớn nhất hiện tại là **scope quá rộng so với trạng thái thực tế**; cần giữ kỷ luật Jira-first để tránh phân tán.
