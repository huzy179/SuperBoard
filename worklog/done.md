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
