# SuperBoard - Chi tiết Cấu trúc Dự án

Tài liệu này mô tả chi tiết từng folder, những file quan trọng, và mục đích của chúng trong dự án SuperBoard.

## Cập nhật nhanh trạng thái (2026-03)

- `apps/web` đã triển khai đầy đủ App Router structure cho Jira (`app/(private)/jira/*`), không còn ở mức `app/page.tsx` đơn lẻ.
- `apps/web/components/jira/*` đã có các component tách riêng cho form/filter/bulk actions.
- `apps/web/hooks/*` đã dùng React Query sâu cho projects/tasks/comments + optimistic updates.
- `apps/web/lib/realtime/*` đã có lớp sync đa tab qua BroadcastChannel cho project/tasks/comments.
- `apps/api/src/modules/project/*` đã có bulk endpoint hợp nhất cho nhiều thao tác task.

---

## 📁 Root Level Files (Thư mục gốc)

### `package.json`

- **Mục đích:** Entry point của cả monorepo
- **Quan trọng:** ✅ CRITICAL
- **Chi tiết:**
  - Định nghĩa workspaces cho `apps/*` và `packages/*`
  - Chứa tất cả npm scripts chính (`dev`, `dev:infra`, `build`, `lint`, `test`, `db:*`)
  - Cấu hình dependency cho toàn dự án
  - Package manager: npm 10.9.2+, Node >= 20.11

### `turbo.json`

- **Mục đích:** Cấu hình Turborepo cho build hệ thống
- **Quan trọng:** ✅ CRITICAL
- **Chi tiết:**
  - Task pipeline (build → lint → typecheck → test)
  - Cache configuration
  - Dependency graph giữa các apps/packages

### `Makefile`

- **Mục đích:** Alias tiện dùng cho npm scripts
- **Quan trọng:** 🔵 Nice to have
- **Chi tiết:**
  - `make dev`, `make dev-infra`, `make db-reset`, v.v.
  - Không bắt buộc, chỉ là convenience layer

### `eslint.config.mjs`

- **Mục đích:** Unified ESLint config cho toàn monorepo
- **Quan trọng:** 🟠 Core
- **Chi tiết:**
  - Quy tắc linting cho JS/TS
  - Apply cho tất cả apps và packages

### `README.md`

- **Mục đích:** Hướng dẫn setup và chạy project
- **Quan trọng:** 🟠 Core (dành cho developers mới)

---

## 📦 `/apps` - Application Services

### 📂 `/apps/api` - NestJS REST API

**Mục đích:** Backend chính của hệ thống

#### Cấu trúc:

```
apps/api/
├── package.json              ✅ Dependencies riêng API
├── tsconfig.json             ✅ TypeScript config cho API
├── nest-cli.json             ✅ NestJS CLI config
├── prisma.config.ts          ✅ Prisma db connection string
├── prisma/
│   ├── schema.prisma         ✅ CRITICAL - DB schema (tables, relations)
│   ├── seed.ts               🟠 Seed dữ liệu dev (roles, permissions, users)
│   └── migrations/           ✅ CRITICAL - Database migrations (đã khởi tạo `init`)
└── src/
    ├── app.module.ts         ✅ Root module, imports tất cả feature modules
    ├── main.ts               ✅ Entry point, port 4000
    ├── health.controller.ts  🟠 Health check endpoint (/api/v1/health)
    ├── health.service.ts     🟠 DB/Redis/Queue status checks
    ├── common/
    │   ├── logger.ts         🟠 Pino structured JSON logger
    │   ├── queue.service.ts  🟠 Bull queue wrapper (async jobs)
    │   ├── redis.service.ts  🟠 Redis connection manager
    │   ├── request-context.middleware.ts  🟠 Correlate requests
    │   └── request-context.ts  🟠 AsyncLocal storage for correlation ID
    ├── config/
    │   └── env.ts            🟠 Zod validation cho .env variables
    └── prisma/
        └── prisma.service.ts 🟠 Prisma client singleton
```

**Quan trọng nhất:**

- `prisma/schema.prisma` - Đây là single source of truth cho cơ sở dữ liệu
- `app.module.ts` - Nơi wire toàn bộ dự án
- `main.ts` - Nơi bootstrap ứng dụng
- `common/` - Các utilities dùng chung (logging, request tracking, redis, queue)

**Workflow:**

1. Thay đổi `schema.prisma` → chạy migration được tạo
2. Update `.env` cho database URL
3. Chạy `npm run db:migrate` để apply migration
4. API tự động load schema qua Prisma client

---

### 📂 `/apps/web` - Next.js Frontend

**Mục đích:** Web UI cho hệ thống

#### Cấu trúc:

```
apps/web/
├── package.json              ✅ Dependencies riêng web
├── tsconfig.json             ✅ TypeScript config cho web
├── next.config.js            🟠 Next.js configuration
├── next-env.d.ts             🔵 Type definitions auto-generated
├── app/
│   └── page.tsx              🟠 Homepage (App Router)
└── public/
    └── sw.js                 🟠 Service Worker cho PWA
```

**Quan trọng nhất:**

- `app/page.tsx` - Main entry point của frontend
- `public/sw.js` - Offline support, caching strategy
- `next.config.js` - Cấu hình build, middleware, v.v.

**Kỳ vọng sẽ có (chưa implement):**

- `/app/(auth)/` - Login/signup pages
- `/app/(dashboard)/` - Main dashboard
- `/app/api/` - Route handlers (edge functions)
- `/components/` - Reusable UI components
- `/hooks/` - Custom React hooks
- `/lib/` - Utilities, API clients, validators

---

### 📂 `/apps/ai-service` - Python AI Service

**Mục đích:** AI/ML backend cho semantic search, summarization, chatbot (hiện chạy FastAPI local, có gRPC placeholder)

#### Cấu trúc:

```
apps/ai-service/
├── package.json              🟠 Node deps (chủ yếu cho build/deploy)
├── requirements.txt          ✅ Python dependencies
├── main.py                   ✅ Entry point, gRPC server
├── grpc_server.py            🟠 gRPC server initialization
├── proto/
│   └── ai_service.proto      ✅ gRPC service definitions
└── services/
    ├── chatbot.py            🟠 Chatbot logic (LLM integration)
    ├── semantic_search.py    🟠 Vector DB + embedding search
    └── summarize.py          🟠 Document summarization
```

**Quan trọng nhất:**

- `ai_service.proto` - API contract định nghĩa gRPC methods
- `main.py` - Server startup, port 50051
- `services/` - Business logic modules

---

## 📦 `/packages` - Shared Libraries

### 📂 `/packages/shared` - Shared TypeScript Types & Utils

**Mục đích:** Định nghĩa types, constants, schemas dùng chung giữa FE/BE

#### Cấu trúc:

```
packages/shared/
├── package.json              ✅ Exported as @superboard/shared
├── tsconfig.json             ✅ TypeScript config
├── src/
│   ├── index.ts              🟠 Main export file
│   ├── id.ts                 🟠 ULID generation utility
│   ├── dtos/                 🟠 API request/response contracts (Auth/Project/Health)
│   ├── events/
│   │   └── index.ts          🟠 WebSocket event definitions
│   ├── schemas/
│   │   └── index.ts          🟠 Zod validation schemas
│   └── types/
│       ├── index.ts          🟠 Barrel export for domain types
│       ├── auth.types.ts     ✅ Auth/User domain types
│       ├── project.types.ts  ✅ Project domain types
│       ├── task.types.ts     ✅ Task domain types
│       ├── workspace.types.ts ✅ Workspace domain types
│       └── common.types.ts   ✅ Shared API envelope/common types
```

**Quan trọng nhất:**

- `types/*` - Domain types được tách theo module để dễ maintain
- `dtos/*` - Contract request/response dùng chung FE/BE
- `schemas/index.ts` - Validation rules cho API payloads
- `events/index.ts` - Real-time event definitions

**Cách sử dụng:**

```typescript
// API, Web, AI service đều import từ main barrel
import type { User, Project } from '@superboard/shared';
import { userSchema } from '@superboard/shared/schemas';
```

### 📂 `/packages/config-ts` - TypeScript Base Config

**Mục đích:** Shared TypeScript configuration

#### Cấu trúc:

```
packages/config-ts/
├── base.json                 🟠 Base tsconfig (strict mode)
├── nextjs.json               🟠 Extends base, Next.js specific
├── node.json                 🟠 Extends base, Node.js specific
└── package.json              ✅ Exported as @superboard/config-ts
```

**Cách sử dụng:** Mỗi app `extends` config này

```json
{
  "extends": "@superboard/config-ts/nextjs.json"
}
```

### 📂 `/packages/config-eslint` - ESLint Base Config

**Mục đích:** Shared ESLint rules

#### Cấu trúc:

```
packages/config-eslint/
├── index.js                  🟠 ESLint config rules
└── package.json              ✅ Exported as @superboard/config-eslint
```

### 📂 `/packages/ui` - (Dự kiến) UI Component Library

**Mục đích:** Reusable components (button, form, modal, v.v.)

```
packages/ui/
├── package.json              ✅ Exported as @superboard/ui
└── src/                      🔵 (Chưa implement)
```

---

## 🐳 `/docker` - Container Configuration

**Mục đích:** Docker setup cho development environment

#### Cấu trúc:

```
docker/
├── Dockerfile.api            🟠 NestJS API build
├── Dockerfile.web            🟠 Next.js web build
├── Dockerfile.ai             🟠 Python AI service build
├── docker-compose.yml        ✅ Orchestration file (postgres, redis, minio, keycloak, mailhog, elasticsearch)
├── .dockerignore              🟠 Exclude files from build context
└── README.md                  🟠 Docker documentation
```

**Quan trọng nhất:**

- `docker-compose.yml` - Defines tất cả infrastructure services
  - **postgres** (port 5433) - Main database
  - **redis** (port 6379) - Cache & session store
  - **elasticsearch** (port 9200) - Full-text search
  - **minio** (port 9000) - S3-compatible object storage
  - **keycloak** (port 8080) - Auth service
  - **mailhog** (port 1025, 8025) - Email testing

**Chạy:**

```bash
npm run dev:infra  # hoặc: docker compose -f docker/docker-compose.yml up -d
```

---

## 🧪 `/scripts` - Development Automation Scripts

```
scripts/
├── setup.mjs                 ✅ Initial setup (checks Node/Python, creates .env.local)
├── health-check.mjs          🟠 Verify API/AI service health
└── db-reset.mjs              ✅ CRITICAL - Reset DB (drop + sync + seed)
```

**Quan trọng nhất:** `db-reset.mjs`

- Xóa DB mới, cấu hình lại schema từ Prisma
- Chạy seed dữ liệu dev
- Dùng khi muốn reset state

**Chạy:**

```bash
npm run db:reset   # hoặc: node scripts/db-reset.mjs
npm run db:seed    # hoặc: npm --workspace @superboard/api run db:seed
npm run setup      # Initial bootstrap
npm run health:check
```

---

## 📊 `/ambition` - Project Planning & Specs

```
ambition/
├── superboard-master-plan.md  📋 Full vision, tech stack, features roadmap
└── DEPENDENCIES.md             📋 Internal dependencies map
```

**Mục đích:** Strategic documentation

- Master plan contains full roadmap with P0/P1/P2/P3 priorities
- Tech stack specifications
- Feature list

---

## 📝 `/worklog` - Development Log

```
worklog/
├── todo.md                   📋 What needs to be done (P0, P1, Backlog)
├── doing.md                  📋 Currently in progress + blockers
├── done.md                   📋 Completed work
└── PROJECT_STRUCTURE.md      📋 This file - detailed folder breakdown
```

---

## 🔄 Key Development Flows

### Setting up từ đầu

```bash
npm install                    # Install Node deps
python3 -m venv .venv         # Create Python virtual env
.venv/bin/pip install -r apps/ai-service/requirements.txt
npm run setup                  # Bootstrap (checks, creates .env)
npm run dev:infra            # Start Docker containers
npm run dev                   # Start all apps
```

### Database workflow

```bash
# Edit schema
nano apps/api/prisma/schema.prisma

# Create migration
npm --workspace @superboard/api run prisma migrate dev --name "feature_name"

# Or reset completely
npm run db:reset

# Seed dev data
npm run db:seed
```

### Adding a new shared type

```bash
# Edit packages/shared/src/types/index.ts
# Then export from index.ts
# Import in API/Web: import type { NewType } from '@superboard/shared/types'
```

### Adding environment variables

```bash
# 1. Update apps/api/src/config/env.ts with Zod schema
# 2. Update .env.example
# 3. Run npm run setup (creates .env.local)
# 4. Restart API
```

---

## ⚠️ Critical Notes (P0 Issues)

### Hiện tại cần fix:

1. **Migrations** - Cần create initial migration từ schema.prisma (đang fallback `db push`)
2. **Import consistency** - All apps phải import từ `@superboard/shared`, không trực tiếp
3. **.env.example sync** - Keep root/web/api/ai-service đồng bộ

### Best Practices:

- ✅ Types dùng chung → `packages/shared/types`
- ✅ Schemas validation → `packages/shared/schemas`
- ✅ Events (WebSocket) → `packages/shared/events`
- ❌ Không import `src/` trực tiếp từ một package khác
- ✅ Luôn export từ `packages/*/src/index.ts`

---

## 🎯 Next Steps

1. Create initial Prisma migration
2. Standard import from `@superboard/shared` everywhere
3. Sync `.env.example` across all apps
4. Complete AI service health check
5. Write dev handbook
