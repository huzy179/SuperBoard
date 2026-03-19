# Technology Stack

**Analysis Date:** 2026-03-19

## Languages

**Primary:**

- TypeScript 5.8.x - backend/frontend/shared code in `apps/api/src`, `apps/web`, `packages/shared/src`
- Python 3.9+ (dev requirement), 3.12 (CI deploy job) - AI service in `apps/ai-service`

**Secondary:**

- SQL (PostgreSQL migrations) - schema changes in `apps/api/prisma/migrations/*/migration.sql`
- Protocol Buffers (gRPC contract) - `apps/ai-service/proto/ai_service.proto`
- JavaScript (tooling/config scripts) - `scripts/*.mjs`, `eslint.config.mjs`, `apps/web/next.config.js`

## Runtime

**Environment:**

- Node.js >= 20.11.0 (declared in `package.json` `engines.node`)
- Python runtime for AI service (venv usage in `apps/ai-service/package.json` and setup in `scripts/setup.mjs`)

**Package Manager:**

- npm 10.9.2 (declared in root `package.json`)
- Lockfile: present (`package-lock.json`)

## Frameworks

**Core:**

- NestJS 11 (`@nestjs/common`, `@nestjs/core`) - API service in `apps/api/src/main.ts` and `apps/api/src/app.module.ts`
- Next.js 16 + React 19 - web app in `apps/web/app` with config `apps/web/next.config.js`
- FastAPI 0.115 + Uvicorn 0.34 - AI service entrypoint in `apps/ai-service/main.py`

**Testing:**

- No dedicated test runner config detected at repository root (`jest.config.*` / `vitest.config.*` not detected)
- CI still executes `npm run test` from `.github/workflows/ci.yml`

**Build/Dev:**

- Turborepo 2 (`turbo.json`) - orchestrates `build`, `dev`, `lint`, `typecheck`
- Prisma 7 (`apps/api/package.json`) - ORM and migrations via `apps/api/prisma/schema.prisma`
- Tailwind CSS 4 + PostCSS - web styling pipeline in `apps/web/postcss.config.mjs`

## Key Dependencies

**Critical:**

- `@prisma/client` + `@prisma/adapter-pg` - database access in `apps/api/src/prisma/prisma.service.ts`
- `zod` - environment/schema validation in `apps/api/src/config/env.ts`
- `jsonwebtoken` + Node `crypto` - auth token/signature flow in `apps/api/src/modules/auth/auth.service.ts`
- `@superboard/shared` - cross-app DTO/types shared by `apps/api` and `apps/web`

**Infrastructure:**

- `redis` + `bullmq` - cache/queue integration in `apps/api/src/common/redis.service.ts` and `apps/api/src/common/queue.service.ts`
- `pino` - structured API logging in `apps/api/src/common/logger.ts`
- `socket.io`/`@nestjs/websockets`/`socket.io-client` - realtime stack dependencies present in `apps/api/package.json` and `apps/web/package.json`
- `openai`, `google-generativeai`, `pgvector`, `grpcio` - AI ecosystem dependencies pinned in `apps/ai-service/requirements.txt`

## Configuration

**Environment:**

- API validates env at startup via `validateEnv` in `apps/api/src/config/env.ts`
- Config loader uses `.env.local`, `.env`, `.env.example` in `apps/api/src/app.module.ts`
- Setup bootstrap copies example env files via `scripts/setup.mjs`

**Build:**

- Monorepo task graph in `turbo.json`
- Lint configuration in `eslint.config.mjs`
- TypeScript baselines in `packages/config-ts/*.json`
- Nest build config in `apps/api/nest-cli.json`

## Platform Requirements

**Development:**

- Node.js, npm, Python3, Docker/Docker Compose checked by `scripts/setup.mjs`
- Local infra orchestration commands in root `package.json` (`dev:infra`, `dev:infra:full`)

**Production:**

- CI/CD on GitHub Actions in `.github/workflows/ci.yml` and `.github/workflows/cd.yml`
- Deploy steps currently placeholders (`echo "TODO ..."`) in `.github/workflows/cd.yml`

---

_Stack analysis: 2026-03-19_
