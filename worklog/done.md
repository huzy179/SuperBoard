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
