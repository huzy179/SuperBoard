# DOING

> Đang code. Mỗi item ở đây phải có output rõ ràng trong tuần.

---

## Sprint hiện tại — Jira v1.2: Bulk Completion + Realtime Sync

- [x] Bulk actions đầy đủ: status, assignee, priority, type, due date, delete
- [x] Bulk endpoint BE hợp nhất (`PATCH /projects/:projectId/tasks/bulk`) thay cho loop N requests
- [x] Optimistic update cho bulk mutations (status/assignee/priority/type/dueDate/delete)
- [x] Undo bulk delete 5 giây + countdown/progress bar
- [x] Realtime sync đa tab cho project detail / projects list / task comments
- [x] Tối ưu realtime: debounce invalidate + visibility-aware refetch
- [x] Implement task ordering cho Kanban (`position` / fractional indexing) — drag-drop theo vị trí, không chỉ status
- [x] Realtime collaborative board đa user bằng Socket.io (không chỉ multi-tab cùng browser)
- [x] Chuẩn hóa Zustand store cho UI state: board/list/filter/search/panel

## Blockers

- Không có blocker.
