# DONE

> Những gì đã ship. Mỗi mục là một bước thật, không phải checkbox tutorial.

---

## Foundation

- [x] Monorepo Turborepo + TS strict config
- [x] Shared package: domain types, Zod schemas, WS events, ULID
- [x] Env validation (Zod) khi API startup
- [x] Docker dev stack: Postgres, Redis, MinIO, Keycloak, MailHog, Elasticsearch + health checks
- [x] Husky + lint-staged + Prettier
- [x] CI workflow: lint + typecheck + test
- [x] CD skeleton với paths filter per app
- [x] `/api/v1/health` trả trạng thái DB/Redis/queue
- [x] Pino structured logging + auto `correlationId`
- [x] `npm run db:reset` / `db:seed` / Makefile aliases
- [x] Đồng bộ `.env.example` giữa root/web/api/ai-service
- [x] Dọn Docker Compose, ổn định `dev:infra` → `dev` → `health:check`
- [x] `npm audit` → 0 vulnerabilities

## MVP1 — Login (E2E)

- [x] Prisma schema IAM: `Role`, `Permission`, `RolePermission`, `UserRole`, `WorkspaceMember`
- [x] Migration `auth_jira_mvp1`
- [x] `POST /auth/login` + `GET /auth/me` (JWT)
- [x] FE login flow: `/login` → token localStorage → route guard → `/jira`
- [x] Seed data: roles, permissions, users, workspace membership
- [x] Smoke test E2E pass: `owner@acme.local / Passw0rd!`

## Base Standardization v1

- [x] Response envelope thống nhất: `success`, `data/error`, `meta.timestamp`
- [x] `@Public()` + global auth guard
- [x] `@CurrentUser()` decorator
- [x] Global HTTP exception filter
- [x] Shared DTO theo domain (FE/BE)
- [x] FE parser cho envelope mới

## Jira v0.2 — Project + Task Board/List

- [x] `GET /projects/:id` detail + task list
- [x] `POST /projects/:id/tasks` tạo task từ project
- [x] `PATCH .../tasks/:id/status` đổi trạng thái
- [x] FE route `/jira/projects/[projectId]` — Board + List view
- [x] Kanban drag-drop đổi status
- [x] List view inline status change
- [x] Task Detail panel: xem/sửa/xóa

## Jira v0.3 — Soft Delete

- [x] `deletedAt` cho các bảng nghiệp vụ chính
- [x] Migration `add_global_soft_delete_columns`
- [x] DELETE → soft-delete (`update deletedAt`)
- [x] Filter BE không trả data đã soft-delete
- [x] Smoke test E2E: login → project → create task → delete → biến mất

## Jira v0.4 — Project CRUD

- [x] `PATCH /projects/:id` update (name/description/color/icon)
- [x] `DELETE /projects/:id` soft-delete (archive)
- [x] UI Jira Home: sửa + lưu trữ project

## Jira v0.5 — Task Fields

- [x] Shared DTO: `priority`, `dueDate`, `assigneeId`
- [x] BE xử lý + validate assignee theo workspace member
- [x] FE: form tạo task + detail panel hỗ trợ priority/dueDate/assignee

## Jira v0.6 — Consistency + Test Restructure

- [x] Chuẩn hóa soft-delete lifecycle BE: Workspace/Project/Task
- [x] Tái cấu trúc test theo service: `workspace/project/task.service.test.ts`
- [x] Xóa test cũ trùng, cập nhật script test
- [x] Ổn định pre-commit: lint scope + shared DTO exports
- [x] Tối ưu index Prisma theo query `deletedAt`

## Jira v0.7 — Comments + React Query

- [x] Implement task comments (CRUD)
- [x] Tích hợp React Query cho project + comment management
- [x] Fetch/mutation pattern chuẩn hóa

## Jira v0.8 — Labels, Types, Story Points, Schema Enhancements

- [x] TaskType enum (task/bug/story/epic), Label + TaskLabel join table
- [x] User.avatarColor, Project.key, Task.number/storyPoints
- [x] Seed data: 6 users, 4 projects, 29 tasks, 8 labels

## Jira v0.9 — Filter/Sort, Dashboard, Notifications, Settings

- [x] Client-side filter & sort (assignee/priority/type + sort by date/priority/SP)
- [x] Dashboard page: stat cards, status/project/assignee charts, activity feed
- [x] Notification module: bell icon, unread badge, mark read, triggers on assign/comment
- [x] Workspace Settings: member list, role management

## Jira v1.0 — Code Quality & UI Polish

- [x] Extract FE constants/components (task-badges, comment-section, notification-bell)
- [x] Shared helpers BE (requireWorkspace, findOrThrow, parseBooleanQuery)
- [x] Shared helpers FE (toDateInputValue, getInitials, percentOf)
- [x] React Query mutations cho project list
- [x] UI animations, visual polish across all pages

## Jira v1.1 — Board/List Bulk Actions + Safety UX

- [x] Refactor FE: tách components/hook cho Jira Home + Project Detail filter/create sections
- [x] Chuẩn hoá helper FE về `lib/helpers/*` (tránh trùng file/folder helper)
- [x] Nâng cấp filter task: search theo tiêu đề/mô tả/mã task + lọc trạng thái
- [x] Dashboard mở rộng: `tasksByType` từ API + hiển thị chart theo loại task
- [x] Bulk update status nhiều task (board + list)
- [x] Bulk delete nhiều task (soft-delete) + undo 5 giây
- [x] Banner undo với countdown + progress bar tuyến tính
- [x] Khoá drag-drop và inline status change khi pending bulk delete để tránh xung đột
- [x] Tooltip giải thích lý do control bị khoá
- [x] Bulk gán / bỏ gán người thực hiện cho nhiều task

## Jira v1.2 — Bulk API Maturity + URL/Realtime Improvements

- [x] Đồng bộ trạng thái UI vào URL query params (view/filter/sort/search) + sync Back/Forward
- [x] Chuyển bulk actions FE từ nhiều request/task sang 1 bulk API request
- [x] Bulk API mở rộng cập nhật nhiều trường trong một lần gọi
- [x] Optimistic cache update cho bulk operations (rollback khi lỗi)
- [x] Cross-tab realtime sync bằng BroadcastChannel cho project detail
- [x] Mở rộng cross-tab sync cho projects list và task comments
- [x] Debounce invalidate khi nhận burst events để giảm refetch dư thừa
- [x] Visibility-aware refetch: tab hidden thì defer, tab visible thì flush một lần

## Jira v1.3 — Bulk Field Expansion

- [x] Bulk cập nhật `priority` cho nhiều task
- [x] Bulk cập nhật `type` cho nhiều task
- [x] Bulk cập nhật/clear `dueDate` cho nhiều task
- [x] Mở rộng Task Bulk Action Bar với control cho priority/type/due date
- [x] API contract shared DTO cập nhật đồng bộ FE ↔ BE cho bulk fields mới

## Jira v1.4 — Task History via TaskEvent

- [x] Thêm endpoint `GET /projects/:projectId/tasks/:taskId/history`
- [x] Ghi `TaskEvent` cho các thao tác chính: create/update/status/assignee/bulk/delete/comment
- [x] FE thêm hook/service lấy task history theo task
- [x] Task detail panel hiển thị timeline lịch sử thao tác (ai làm gì, lúc nào)

## Jira v1.5 — API Contract Hardening

- [x] Chuẩn hoá DTO dùng chung cho Jira: `TaskStatusDTO`, `TaskEventTypeDTO`, `TaskEventActionDTO`
- [x] Siết type cho `TaskHistoryItemDTO` và `TaskHistoryPayloadDTO` (loại bỏ payload tự do)
- [x] Siết type cho `DashboardStatsDTO` (`tasksByStatus/priority/type`, `recentActivity.type`)
- [x] Đồng bộ mapping BE `project.service` và FE timeline theo contract typed mới

## Jira v1.6 — Archive Semantics Cleanup

- [x] Thống nhất archive semantics dùng `deletedAt` làm nguồn sự thật duy nhất
- [x] Loại bỏ cột `isArchived` khỏi schema Prisma (`Workspace`, `Project`, `Task`)
- [x] Tạo và apply migration `20260321142214_remove_is_archived_columns`
- [x] Cập nhật seed và shared types để bỏ phụ thuộc `isArchived`

## Jira v1.7 — Service Test Coverage for Task History

- [x] Cập nhật `project.service.test.ts` theo logic mới (`task.aggregate`, `taskEvent.create`)
- [x] Thêm test `getTaskHistoryForProject` để verify mapping payload + actor + type
- [x] Chạy test mục tiêu `test/services/project.service.test.ts` pass 100%

## Jira v1.8 — Calendar View (Project Tasks)

- [x] Thêm view mode `calendar` trong Jira project detail (song song board/list)
- [x] Lịch theo tháng có điều hướng tháng trước/sau, hiển thị task theo `dueDate`
- [x] Mỗi ngày hiển thị tối đa 3 task + chỉ báo số task còn lại
- [x] Click task trong lịch mở panel chi tiết task như các view khác
- [x] Bổ sung khu vực task chưa có hạn hoàn thành trong calendar view

## Jira v1.9 — Realtime Presence on Project Board

- [x] Mở rộng `ProjectGateway` phát event `project:presence` theo số client trong room
- [x] Quản lý join/switch/disconnect room để cập nhật presence chính xác
- [x] Thêm subscriber presence ở web socket client (`subscribeProjectPresence`)
- [x] Hiển thị badge realtime `👀 X đang xem` trên project detail header
