# TODO

## Mốc vừa hoàn tất

- [x] Global auth guard + `@Public()` + `@CurrentUser()` decorator đã setup.
- [x] Response envelope đã chuẩn hóa cho Auth/Project/Health (`success`, `data/error`, `meta`).
- [x] Shared DTO contracts FE/BE đã đồng bộ, bao gồm health response type.
- [x] Jira project detail page (`/jira/projects/[projectId]`) với board/list view đã chạy.
- [x] Task create trong project detail đã hoạt động (`POST /projects/:projectId/tasks`).
- [x] Task status update đã hoạt động cả board drag-drop và list inline update (`PATCH .../status`).
- [x] Task CRUD cơ bản đã hoàn tất (create/update/delete + detail panel).
- [x] Soft-delete cho Task đã hoạt động (`deletedAt`) và đã smoke test runtime pass.
- [x] Chuẩn hóa soft-delete lifecycle cho `Workspace/Project/Task` theo `deletedAt` trong BE services.
- [x] Viết lại và tái cấu trúc API tests theo service (`workspace/project/task`) + loại bỏ test cũ trùng.
- [x] Ổn định pre-commit flow bằng cách giới hạn lint scope và dọn artifact dư ngoài codebase chính.

## Ưu tiên cao (P0) — Kế hoạch mới

- [ ] **Re-prioritize scope:** tạm hoãn implementation chi tiết Login/Register/OAuth/MFA UI-flow, chỉ giữ phần cần thiết cho data model và backend foundation.
- [ ] **DB schema đầy đủ (Auth + Core):** hoàn thiện Prisma models và fields cho `User`, `Role`, `Permission`, `RolePermission`, `UserRole` (hoặc `WorkspaceMember.role`), cùng các bảng core theo master plan (`Workspace`, `Project`, `Task`, `TaskEvent`, `Comment`, `Attachment`, `Notification`, ...).
- [ ] **Ràng buộc dữ liệu:** bổ sung relation, unique constraints, indexes, enum (role/status/priority/plan/type) để sẵn sàng scale.
- [ ] **Migration strategy:** tạo migration mới từ schema hoàn chỉnh, đảm bảo chạy sạch trên môi trường local (`db reset`/`migrate`/`seed`).
- [ ] **Seed dữ liệu nền:** seed roles, permissions, role-permission mapping, user/workspace mẫu, project/task mẫu để bắt đầu Jira nhanh.
- [ ] **Chuẩn bị Jira-first API modules:** chốt phạm vi module làm trước: `Workspace` (tối thiểu), `Project`, `Task`, `TaskEvent`, `Comment`.

## Ưu tiên trung bình (P1) — Jira First (Backend + Frontend song song)

### Backend (API)

- [x] Implement CRUD cơ bản `Project` (create, update, archive mềm; list/detail).
- [x] Hoàn thiện `Task` phần còn lại: assignee + priority + dueDate.
- [ ] Implement task ordering cho Kanban (`position`/fractional indexing) cho drag-drop theo vị trí.
- [ ] Implement Task history qua `TaskEvent`.
- [ ] Implement filter/sort nền tảng cho board/list (status, priority, assignee, dueDate).
- [ ] Chuẩn hóa semantics archive ở DB level (cân nhắc loại bỏ dần `isArchived` khỏi schema nếu quyết định theo `deletedAt` thuần toàn cục).

### Frontend (Web)

- [ ] Thiết kế routing Jira trong `apps/web/app` cho luồng: Workspace → Project → Board/List.
- [ ] Dựng UI `Project list` + `Project create/edit` form (ưu tiên chức năng, chưa tối ưu style nâng cao).
- [x] Dựng UI `Task board (Kanban)` theo status cột + drag-drop đổi trạng thái.
- [x] Dựng UI `Task list/table` cơ bản + inline status change.
- [x] Dựng `Task detail panel/page` cơ bản (title, description, status, edit/delete).
- [~] Mở rộng `Task detail panel/page` với assignee/priority/dueDate/comments (đã xong assignee/priority/dueDate, còn comments).
- [ ] Tích hợp React Query cho fetch/mutation + optimistic update cho thao tác kéo thả và đổi trạng thái.
- [ ] Chuẩn hóa client state (Zustand) cho UI state của board/list/filter/search.
- [ ] Đồng bộ contract FE ↔ BE bằng types/schemas từ `packages/shared`.

### Integration (FE ↔ BE)

- [ ] Chốt API contract Jira v1 trước khi build FE hoàn chỉnh (DTO/request/response/error format).
- [ ] Mock fallback ở FE cho các endpoint BE chưa xong để không chặn tiến độ UI.
- [ ] Hoàn thiện end-to-end luồng Jira đầu tiên: tạo project → tạo task → kéo task qua cột → xem lịch sử.

## Backlog (tạm để sau)

- [ ] Chi tiết hóa auth flows nâng cao: social login, MFA/TOTP, session UI, brute-force hardening nâng cao.
- [ ] Hoàn thiện deploy production thật trong `.github/workflows/cd.yml` sau khi Jira core ổn định.
- [ ] Bổ sung test integration mở rộng ngoài `/api/v1/health` sau khi ổn định domain Jira.
