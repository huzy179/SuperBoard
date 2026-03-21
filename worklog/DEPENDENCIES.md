# SuperBoard - Dependencies & Purpose

## Cập nhật trạng thái (2026-03)

- Jira realtime hiện tại (multi-tab) đang dùng `BroadcastChannel` native của browser, chưa cần thêm package mới.
- Realtime đa user qua `socket.io` vẫn là hạng mục kế tiếp (đã có dependency nền ở web/api).

## Root (Monorepo Tooling)

- `turbo`: điều phối pipeline monorepo (`dev`, `build`, `lint`, `typecheck`, `test`).
- `typescript`: compiler/type system dùng chung toàn repo.
- `eslint`: kiểm soát code quality.
- `prettier`: format code đồng bộ.
- `husky`, `lint-staged`: chạy check/format tự động ở pre-commit.
- `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin`: lint TypeScript.

## apps/web (Next.js frontend)

- `next`, `react`, `react-dom`: nền tảng frontend (App Router + SSR/RSC).
- `@tanstack/react-query`: quản lý server state, cache, refetch.
- `zustand`: state management nhẹ cho UI/realtime state.
- `socket.io-client`: client realtime với backend websocket.
- `zod`: runtime schema validation phía client.
- `tailwindcss`, `postcss`, `autoprefixer`: styling pipeline.
- `eslint-config-next`: lint rules chuẩn cho Next.js.
- `@types/node`, `@types/react`, `@types/react-dom`: type definitions cho TypeScript.

## apps/api (NestJS backend)

- `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`: core framework NestJS.
- `@nestjs/config`: quản lý env/config (kết hợp validate Zod lúc startup).
- `@nestjs/swagger`, `swagger-ui-express`: generate và serve OpenAPI docs.
- `@nestjs/websockets`, `@nestjs/platform-socket.io`, `socket.io`: websocket realtime.
- `redis`, `@socket.io/redis-adapter`: Redis + adapter cho scaling realtime.
- `bullmq`: queue engine dùng Redis (health check queue/deferred jobs).
- `pg`: PostgreSQL driver cho runtime DB checks.
- `@prisma/client`, `prisma`: ORM + migration/seed workflow.
- `@prisma/adapter-pg`: adapter Prisma 7 cho PostgreSQL.
- `zod`: validate payload/schema.
- `pino`, `pino-http`: structured logging.
- `reflect-metadata`, `rxjs`: dependency nền của NestJS.
- `@superboard/shared`: import shared types/schemas/id utilities từ package chung.
- Dev tooling: `@nestjs/cli`, `@nestjs/schematics`, `ts-node`, `ts-node-dev`, `@types/node`, `@types/express`, `@types/pg`.

## packages/shared

- `zod`: schema validation dùng chung FE/BE.
- `ulid`: sinh sortable IDs (ULID).

## apps/ai-service (Python)

- `fastapi`: HTTP API cho AI service.
- `uvicorn[standard]`: ASGI server chạy FastAPI.
- `grpcio`, `grpcio-tools`: gRPC server/client + generate code từ proto.
- `pydantic`: validation/serialization models.
- `openai`: gọi OpenAI models.
- `google-generativeai`: gọi Gemini models.
- `pgvector`: vector operations trên PostgreSQL.

## Notes

- Chạy `npm audit` định kỳ tại root để rà soát vulnerabilities.
- Với production: ưu tiên lockfile, bật Dependabot/Renovate, và pin version cho các thành phần hạ tầng quan trọng.
