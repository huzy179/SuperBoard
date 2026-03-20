# DONE

## MVP 1 — Login (FE + BE + DB)

- [x] Mở rộng Prisma schema với bảng IAM/Auth nền tảng: `Role`, `Permission`, `RolePermission`, `UserRole`, `WorkspaceMember` + fields login trên `User` (`passwordHash`, `isActive`, `lastLoginAt`, ...).
- [x] Tạo và apply migration `auth_jira_mvp1` để tạo bảng thực tế trong DB local.
- [x] Implement Auth API: `POST /api/v1/auth/login` và `GET /api/v1/auth/me` (JWT + verify password hash).
- [x] Implement Frontend login flow ở web: trang `/login`, lưu token localStorage, route bảo vệ cơ bản sang `/jira`.
- [x] Seed data đầy đủ cho login và IAM: roles, permissions, role-permission mapping, users + workspace membership + user role assignment.
- [x] Smoke test login end-to-end pass với account seed `owner@acme.local / Passw0rd!`.

## Foundation đã hoàn thành

- [x] Monorepo + Turborepo + TS strict config hoạt động.
- [x] Shared package có domain types, schemas, websocket events, ULID utility.
- [x] Env validation bằng Zod khi API startup.
- [x] Docker dev stack có Postgres, Redis, MinIO, Keycloak, MailHog, Elasticsearch + health checks.
- [x] Thiết lập Husky + lint-staged + Prettier.
- [x] CI workflow chạy lint + typecheck + test.
- [x] CD skeleton có paths filter theo từng app.

## API runtime

- [x] `/api/v1/health` trả trạng thái DB/Redis/queue.
- [x] Pino structured logging có auto `correlationId`.
- [x] Header `x-correlation-id` được inject tự động.

## Dev scripts

- [x] `npm run db:reset` hoạt động theo migration-only flow (reset + migrate + seed).
- [x] `npm run db:seed` hoạt động với dữ liệu mẫu.
- [x] `Makefile` đã có alias tiện dùng (`dev`, `db-reset`, `db-seed`, ...).

## Database migration strategy

- [x] Đã tạo migration đầu tiên `init` trong `apps/api/prisma/migrations`.
- [x] Đã loại bỏ fallback `prisma db push` trong `scripts/db-reset.mjs`.

## Shared package imports

- [x] Đã rà soát import `@superboard/shared` trong các app, không còn subpath runtime import.
- [x] Xác nhận lại `npm run typecheck` và `npm run lint` đều pass sau khi chuẩn hóa.

## Environment & cleanup

- [x] Đã đồng bộ `.env.example` giữa root/web/api/ai-service theo runtime local hiện tại.
- [x] Đã cập nhật README cho đúng ports và hành vi `npm run setup`.
- [x] Đã xóa file thừa `docker-compose.yml` ở root (giữ `docker/docker-compose.yml` làm nguồn duy nhất).

## Health check standardization

- [x] Chuẩn hóa response `/health` của AI service theo format `success/data/meta` giống API.
- [x] Cập nhật `scripts/health-check.mjs` để validate JSON envelope + trạng thái `ok`.
- [x] Xác nhận `npm run health:check` pass cho cả API và AI service.

## Base setup hardening

- [x] Sửa `npm run dev:infra` để chỉ khởi động infrastructure services (không build app images).
- [x] Bỏ `version` deprecated trong `docker/docker-compose.yml` để giảm warning Compose v2.
- [x] Dọn container cũ gây xung đột port và xác nhận lại flow `setup` → `dev:infra` → `dev` → `health:check`.
- [x] Bổ sung tài liệu local workflow ngắn trong `README.md`.
- [x] Chốt rõ vai trò `dev:infra`: chỉ bật dịch vụ nền để app local chạy ổn định.

## Security audit cleanup

- [x] Chạy `npm audit fix` để áp dụng các bản vá non-breaking cho dependency tree.
- [x] Loại bỏ phụ thuộc local `@nestjs/cli` và `@nestjs/schematics` khỏi `apps/api`, chuyển scripts sang `npx nest ...`.
- [x] Cài `chalk@4` ở root để ổn định formatter của ESLint sau khi tối ưu dependency tree.
- [x] Xác nhận `npm audit` về **0 vulnerabilities** và `npm run lint` + `npm run typecheck` đều pass.

## Base standardization v1 (FE + BE)

- [x] Chuẩn hóa response contract về một envelope thống nhất: `success`, `data/error`, `meta.timestamp` cho Auth/Project/Health.
- [x] Thêm `@Public()` decorator + global auth guard để route private được bảo vệ mặc định, không cần gắn guard lặp lại.
- [x] Thêm `@CurrentUser()` decorator để loại bỏ logic parse Bearer token trong controller.
- [x] Thêm global HTTP exception filter để error response cùng format với success envelope.
- [x] Tách và chuẩn hóa shared types/DTO theo domain, gồm cả `health.dto.ts` dùng chung FE/BE.
- [x] Cập nhật frontend parser cho envelope mới (`auth/login`, `auth/me`, `projects`) + chuẩn hóa token storage helper.
- [x] Smoke test pass: `health`, `login`, `me`, `projects` và unauthorized `projects` đều đúng contract.

## Jira-first v0.2 (Project + Task Board/List)

- [x] Implement `GET /projects/:projectId` để lấy project detail + task list theo workspace.
- [x] Implement `POST /projects/:projectId/tasks` để tạo task trực tiếp từ project detail page.
- [x] Implement `PATCH /projects/:projectId/tasks/:taskId/status` để đổi trạng thái task.
- [x] Bổ sung shared DTOs cho project detail/task create/task status update.
- [x] Dựng route FE `/jira/projects/[projectId]` với 2 chế độ `Board` và `List`.
- [x] Tạo task từ FE (title/description/status) và tự reload board/list sau khi tạo.
- [x] Implement kéo-thả task giữa các cột board để cập nhật status.
- [x] Implement inline status change trong list view bằng select.
- [x] Implement Task Detail panel cho phép xem chi tiết, sửa Title/Description/Status và Xoá task.
- [x] Hoàn thiện trọn bộ CRUD Task cơ bản cho Jira MVP.

## Jira-first v0.3 (Soft Delete + Runtime Validation)

- [x] Bổ sung `deletedAt` cho các bảng nghiệp vụ chính trong Prisma schema để chuẩn bị soft-delete thống nhất.
- [x] Tạo và apply migration `add_global_soft_delete_columns` cho DB local.
- [x] Chuyển `DELETE /projects/:projectId/tasks/:taskId` sang hành vi soft-delete (`update deletedAt`).
- [x] Chuẩn hóa filter BE cho luồng `Auth/Project/Task` để không trả dữ liệu đã soft-delete.
- [x] Rà lại toàn bộ call FE/BE liên quan project/task, xác nhận typecheck + lint pass.
- [x] Smoke test runtime end-to-end pass: login → list project → create task → delete task → task biến mất khỏi project detail.

## Jira-first v0.4 (Project Base CRUD Completion)

- [x] Implement `PATCH /projects/:projectId` để cập nhật project (name/description/color/icon).
- [x] Implement `DELETE /projects/:projectId` theo soft-delete (archive bằng `isArchived + deletedAt`).
- [x] Bổ sung DTO/contracts FE/BE cho update/delete project.
- [x] Tích hợp UI Jira Home cho sửa project và lưu trữ project.
- [x] Smoke test runtime pass: update project → archive project → project biến mất khỏi list.

## Jira-first v0.5 (Task Assignee + Priority + DueDate)

- [x] Mở rộng shared DTO contracts cho Task với `priority`, `dueDate`, `assigneeId` trong create/update/detail.
- [x] Cập nhật BE `ProjectController/ProjectService` để xử lý và trả về đầy đủ `priority`, `dueDate`, `assigneeId`.
- [x] Thêm validate assignee theo workspace member để tránh lỗi 500 khi `assigneeId` không hợp lệ.
- [x] Mở rộng FE project detail page: form tạo task + task detail panel hỗ trợ chỉnh `priority`, `dueDate`, `assignee`.
- [x] Typecheck + lint pass cho cả API/Web sau thay đổi.
- [x] Smoke test runtime pass cho create/update task với `priority/dueDate/assignee` (hợp lệ và invalid assignee).

## Jira-first v0.6 (Soft-delete consistency + Test Restructure)

- [x] Chuẩn hóa lifecycle soft-delete BE theo `deletedAt` cho `Workspace/Project/Task` trong service layer.
- [x] Sửa và đồng bộ lại test policy/lifecycle để khớp service constructor và contract hiện tại.
- [x] Tái cấu trúc test API theo service: `workspace.service.test.ts`, `project.service.test.ts`, `task.service.test.ts`.
- [x] Xóa test entrypoint/test file cũ gây trùng và nhiễu suite.
- [x] Cập nhật script test workflow lifecycle trong `apps/api/package.json` theo cấu trúc test mới.
- [x] Xác nhận `npm --workspace @superboard/api run typecheck` và `npm --workspace @superboard/api run test` pass.

## Repo hygiene & commit flow stabilization

- [x] Thu hẹp scope `lint-staged` eslint để tránh fail do lint nhầm vào bộ `.github/get-shit-done/*`.
- [x] Sửa xung đột export DTO ở `packages/shared/src/dtos/index.ts` để typecheck không bị duplicate symbol.
- [x] Dọn file/folder tạm dư trong `.github` không thuộc tracked repository.
- [x] Tối ưu index Prisma theo pattern query soft-delete hiện tại (`deletedAt`).
- [x] Nhóm commit sạch theo phạm vi API/test và phần tối ưu tooling/repo.
