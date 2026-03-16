# DONE

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

- [x] `npm run db:reset` hoạt động (reset + sync schema + seed).
- [x] `npm run db:seed` hoạt động với dữ liệu mẫu.
- [x] `Makefile` đã có alias tiện dùng (`dev`, `db-reset`, `db-seed`, ...).
