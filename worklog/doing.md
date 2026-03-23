# DOING

> Đang code. Mỗi item ở đây phải có output rõ ràng trong tuần.

---

## Sprint hiện tại — Jira v1.38: Productization Baseline

Mục tiêu: đưa SuperBoard từ mức “feature demo rất mạnh” sang mức “Jira MVP dùng thật, dễ maintain, dễ verify, dễ ship”.

### Chất lượng sản phẩm

- [ ] Hoàn thiện E2E flow cốt lõi: đăng nhập → vào Jira Home → tạo project → tạo task → kéo task → xem lịch sử
- [ ] Viết smoke test checklist cho toàn bộ Jira flow hiện có (Home / Project Detail / Dashboard / Settings / Notifications)
- [ ] Rà lại các lỗi UX mức P0/P1: empty state, loading state, error state, responsive breakpoints

### Kỹ thuật / maintainability

- [ ] Tiếp tục refactor FE theo hướng layer-based an toàn: tách `god hook` và `god page` ở Jira detail thành các phần nhỏ hơn
  - [x] Wave 1: tách pure helpers khỏi `use-jira-projects-page` (filter/sort/group theo ngày)
  - [x] Wave 1: tách calendar/link utility khỏi `app/(private)/jira/projects/[projectId]/page.tsx`
  - [x] Wave 2a: tách bulk actions + undo delete timer khỏi page sang `use-task-bulk-actions`
  - [ ] Wave 2b: tách tiếp task detail/edit/subtask handlers ra hook riêng
- [x] Cập nhật `worklog/PROJECT_STRUCTURE.md` để phản ánh đúng cấu trúc hiện tại của FE/BE, tránh tài liệu cũ gây nhiễu
- [ ] Chốt roadmap thực tế theo hướng Jira-first: chưa mở rộng Slack / Notion / AI platform cho tới khi Jira đủ ổn định

## Blockers

- Không có blocker kỹ thuật nghiêm trọng.
- Blocker lớn nhất hiện tại là **scope quá rộng so với trạng thái thực tế**; cần giữ kỷ luật Jira-first để tránh phân tán.
