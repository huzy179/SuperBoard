# Backend Rules

## NestJS Apps

- Main backend domains live in `apps/api/src/modules/<domain>`.
- Controllers handle HTTP shape, auth decorators/guards, and request/response mapping only.
- Services own business rules, permission checks, orchestration, transactions, and event emission.
- Repositories/Prisma access belong behind services; controllers must not import repositories, `PrismaService`, or `@prisma/client` directly.
- Module-to-module interaction should use Nest dependency injection, public module APIs, or events. Do not import another module's repository/service file directly to shortcut architecture.

## Prisma and Database

- Prisma schema/migrations live under `apps/api/prisma`.
- Keep database writes that must be atomic inside transactions.
- Convert DB/nullability shape into DTO/domain shape at the boundary; do not leak Prisma-specific types into shared frontend contracts.
- Run `npm --workspace @superboard/api run db:generate` after Prisma client-affecting changes.

## Worker and Realtime Services

- `apps/automation`, `apps/notification`, `apps/search`, and `apps/collaboration` follow Nest service/module layering.
- Queue/event payloads must use `@superboard/shared` contracts where payloads cross service boundaries.
- Shared AMQP/health/metrics/bootstrap logic belongs in `@superboard/backend-shared`, not copy-pasted per service.
- `apps/collab-service` is strict standalone TS with Hocuspocus/Yjs; keep NodeNext imports valid and avoid Nest-only assumptions.

## Python AI Service

- `apps/ai-service` is Python/FastAPI. Do not apply TypeScript lint rules to Python files.
- Keep API/proto contracts aligned with callers; update generated or documented contracts together.
- Prefer targeted pytest commands for changed AI service behavior.

## Validation

- API: `npm --workspace @superboard/api run lint`, `npm --workspace @superboard/api run typecheck`, `npm --workspace @superboard/api run test`.
- Worker apps: run the owning workspace `lint`, `typecheck`, and `test` scripts if present.
- Integration tests may require database/infra; mention if skipped due environment.
