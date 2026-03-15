# SuperBoard - Dependencies & Purpose

## Root (Monorepo Tooling)

- `turbo`: chạy pipeline monorepo (`dev`, `build`, `lint`, `typecheck`) giữa nhiều workspace.
- `typescript`: compiler/type system chung cho toàn repo.
- `eslint`: kiểm soát code quality.
- `prettier`: format code đồng bộ.

## apps/web (Next.js frontend)

- `next`, `react`, `react-dom`: nền tảng web app với App Router + SSR/RSC.
- `@tanstack/react-query`: cache server state, refetch, optimistic update.
- `zustand`: state management nhẹ cho UI/socket state.
- `socket.io-client`: client realtime.
- `zod`: runtime schema validation.
- `tailwindcss`, `postcss`, `autoprefixer`: styling pipeline cho Tailwind.
- `eslint-config-next`: rule lint khuyến nghị cho Next.js.
- `@types/node`, `@types/react`, `@types/react-dom`: type definitions cho TypeScript.

## apps/api (NestJS backend)

- `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`: core framework NestJS.
- `@nestjs/config`: quản lý cấu hình/env typed.
- `@nestjs/swagger`, `swagger-ui-express`: generate + serve OpenAPI docs.
- `@nestjs/websockets`, `@nestjs/platform-socket.io`, `socket.io`: websocket realtime trên backend.
- `redis`, `@socket.io/redis-adapter`: scale websocket đa instance.
- `@prisma/client`, `prisma`: ORM + migration cho PostgreSQL.
- `zod`: validate payload/schema.
- `pino`, `pino-http`: structured logging hiệu năng cao.
- `reflect-metadata`, `rxjs`: dependency nền của NestJS.
- `@nestjs/cli`, `@nestjs/schematics`: tooling tạo/chạy module NestJS.
- `ts-node`, `ts-node-dev`, `@types/node`: tooling TypeScript runtime/dev.

## packages/shared

- `zod`: giữ schema validation dùng chung FE/BE.

## apps/ai-service (Python)

- `fastapi`: HTTP API cho AI service.
- `uvicorn[standard]`: ASGI server chạy FastAPI.
- `grpcio`, `grpcio-tools`: gRPC server/client + generate code từ proto.
- `pydantic`: validation/serialization models.
- `openai`: gọi OpenAI models.
- `google-generativeai`: gọi Gemini models.
- `pgvector`: làm việc với vector embeddings trong PostgreSQL.

## Ghi chú bảo mật & cập nhật

- Sau cài đặt, nếu cần rà lỗ hổng: chạy `npm audit` tại root.
- Khi bắt đầu phase production, nên pin version theo lockfile và bật Dependabot/Renovate.
