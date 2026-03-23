# SuperBoard — Project Structure (thực tế)

Tài liệu này phản ánh cấu trúc hiện tại của repo `SuperBoard` để dev mới vào có thể định hướng nhanh và tránh nhiễu từ roadmap cũ.

Cập nhật: 2026-03-23

---

## 1) Tổng quan monorepo

```text
SuperBoard/
├── apps/
│   ├── web/               # Next.js App Router frontend (Jira-first)
│   ├── api/               # NestJS backend + Prisma + PostgreSQL
│   └── ai-service/        # Python AI service (FastAPI/gRPC)
├── packages/
│   ├── shared/            # Shared types, DTOs, schemas, events
│   ├── config-ts/         # Shared tsconfig presets
│   ├── config-eslint/     # Shared ESLint config
│   └── ui/                # Shared UI package (đang tối giản)
├── docker/                # Dockerfiles + docker-compose dev infra
├── openspec/              # Change artifacts/spec workflow
├── scripts/               # Setup/health/db reset scripts
├── worklog/               # todo/doing/done + docs nội bộ
├── turbo.json
├── package.json
└── Makefile
```

---

## 2) `apps/web` (Next.js)

### Mục đích

- Frontend chính của sản phẩm, hiện tập trung vào Jira MVP.

### Cấu trúc chính

```text
apps/web/
├── app/
│   ├── (private)/         # Routes yêu cầu đăng nhập
│   ├── (public)/          # Routes public
│   ├── layout.tsx
│   ├── page.tsx
│   ├── loading.tsx
│   ├── error.tsx
│   ├── global-error.tsx
│   ├── not-found.tsx
│   ├── globals.css
│   ├── theme.css
│   └── ARCHITECTURE.md
├── components/
│   ├── guards/
│   ├── jira/
│   ├── layout/
│   ├── notifications/
│   ├── providers/
│   └── ui/
├── hooks/
├── lib/
│   ├── api/
│   ├── constants/
│   ├── helpers/
│   ├── mocks/
│   ├── realtime/
│   ├── services/
│   ├── api-client.ts
│   ├── auth-storage.ts
│   ├── format-date.ts
│   └── navigation.ts
├── stores/
└── public/
    └── sw.js
```

### Ghi chú

- Đã có nhiều hook tách domain (`use-project-detail`, `use-projects`, `use-task-comments`, ...).
- Realtime phía client đã có nền `socket.io-client` + sync đa tab qua `lib/realtime`.

---

## 3) `apps/api` (NestJS + Prisma)

### Mục đích

- API chính cho auth/workspace/project/task/notification/upload.

### Cấu trúc chính

```text
apps/api/
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── health.controller.ts
│   ├── health.service.ts
│   ├── common/
│   │   ├── api-response.ts
│   │   ├── logger.ts
│   │   ├── queue.service.ts
│   │   ├── redis.service.ts
│   │   ├── request-context.middleware.ts
│   │   ├── request-context.ts
│   │   ├── decorators/
│   │   ├── filters/
│   │   ├── guards/
│   │   └── helpers.ts
│   ├── config/
│   ├── prisma/
│   └── modules/
│       ├── auth/
│       ├── workspace/
│       ├── project/
│       ├── task/
│       ├── notification/
│       └── upload/
└── test/
    └── services/
```

### Quy tắc DB (bắt buộc)

- Không dùng `prisma db push` cho schema changes.
- Luôn đổi `schema.prisma` rồi chạy migration file:
  - `npx prisma migrate dev --name <migration_name>`

---

## 4) `apps/ai-service` (Python)

```text
apps/ai-service/
├── main.py
├── grpc_server.py
├── requirements.txt
├── proto/
│   └── ai_service.proto
└── services/
    ├── chatbot.py
    ├── semantic_search.py
    └── summarize.py
```

Mục tiêu hiện tại: service AI vẫn ở vai trò phụ trợ, chưa phải trục chính của sprint Jira-first.

---

## 5) `packages/*`

### `packages/shared`

- Chứa contract dùng chung FE/BE: `dtos`, `schemas`, `events`, `types`, `id.ts`.

### `packages/config-ts`

- Presets TS: `base.json`, `nextjs.json`, `node.json`.

### `packages/config-eslint`

- Quy tắc lint dùng chung.

### `packages/ui`

- Package UI shared; chỉ mở rộng khi có nhu cầu reuse thật giữa nhiều module.

---

## 6) `docker/`

```text
docker/
├── docker-compose.yml
├── Dockerfile.api
├── Dockerfile.web
├── Dockerfile.ai
├── .dockerignore
├── README.md
└── postgres/
```

- Dùng cho local infra/dev images.
- Postgres local đang chạy qua compose ở port `5433` (theo setup hiện tại).

---

## 7) `openspec/` và `worklog/`

### `openspec/`

- `changes/` chứa change artifacts đang làm và archive.
- `specs/` chứa spec tài liệu theo workflow.

### `worklog/`

- `todo.md`: backlog ưu tiên.
- `doing.md`: sprint hiện tại.
- `done.md`: changelog đã ship.
- `PROJECT_STRUCTURE.md`: tài liệu này.
- `DEPENDENCIES.md`: dependency map thực tế.

---

## 8) Lệnh thường dùng

```bash
make dev
make db-seed
npx turbo build lint typecheck
npx prisma migrate status
npm run db:seed --workspace @superboard/api
```

---

## 9) Trọng tâm hiện tại

- Dự án ở trạng thái **Jira-first**.
- Ưu tiên: ổn định flow Jira dùng thật, tăng độ tin cậy và maintainability.
- Hạ tầng/feature nâng cao chỉ mở khi có nhu cầu thực từ flow đang chạy.
