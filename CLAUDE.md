# SuperBoard — Project Rules

## CRITICAL: Prisma Migration Rules (HIGHEST PRIORITY)

**KHÔNG BAO GIỜ dùng `prisma db push` cho schema changes.** Luôn dùng migration files.

### Khi thay đổi schema (`schema.prisma`):

1. Sửa `schema.prisma`
2. Chạy `npx prisma migrate dev --name <tên_migration>` — tạo migration file + apply + regenerate client
3. Cập nhật seed nếu cần → `npm run db:seed --workspace @superboard/api`

### Các lệnh đúng:

- `npx prisma migrate dev --name <name>` — tạo + apply migration (dev)
- `npx prisma migrate deploy` — apply pending migrations (CI/prod)
- `npx prisma migrate reset --force` — reset toàn bộ DB + apply tất cả migrations + seed
- `npm run db:seed --workspace @superboard/api` — chỉ seed lại data

### KHÔNG dùng:

- ❌ `prisma db push` — sync schema không tạo migration, gây drift
- ❌ `prisma db push --force-reset` — phá DB không có migration history

### Migration baseline:

- Project dùng 1 baseline migration `0_init` chứa toàn bộ schema
- Mọi thay đổi schema sau này phải tạo migration file mới

---

## Project Structure

- `apps/api` — NestJS backend (Prisma + PostgreSQL)
- `apps/web` — Next.js frontend (React, Tailwind v4)
- `packages/shared` — Shared types, DTOs, schemas

## Database

- PostgreSQL at localhost:5433
- Dev credentials: dev/devpassword/superboard
- Seed login: nguyen.minh.tuan@techviet.local / Passw0rd!

## Commands

- `make dev` — start dev servers
- `make db-seed` — seed data
- `npx turbo build lint typecheck` — verify all packages
- `npx prisma migrate status` — check migration status

## Code Style

- Vietnamese UI text throughout
- ESLint strict: no `any` types
- `exactOptionalPropertyTypes: true` in tsconfig — use `| undefined` explicitly
- Tailwind v4 with oklch color tokens
