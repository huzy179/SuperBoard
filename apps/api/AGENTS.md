# API App Rules

## Scope

Applies to `apps/api`.

## NestJS Layering

- Put domain code in `src/modules/<domain>`.
- Controllers only handle HTTP shape, guards/decorators, validation handoff, and service calls.
- Services own business logic, permission checks, transactions, orchestration, and event emission.
- Repositories/Prisma access must stay behind services.
- Controllers must not import repositories, `PrismaService`, or `@prisma/client` directly.

## Boundaries

- Do not import another domain module's service or repository file directly.
- Use Nest dependency injection, public module APIs, or events for cross-domain behavior.
- Shared request/response/event contracts belong in `@superboard/shared`.
- Shared backend infrastructure belongs in `@superboard/backend-shared`.

## Prisma

- Prisma schema and migrations live under `prisma`.
- Run `npm --workspace @superboard/api run db:generate` after Prisma client-affecting changes.
- Keep atomic database writes inside transactions.
- Do not leak Prisma-specific model shape into frontend/shared contracts.

## Validation

- Use `npm --workspace @superboard/api run lint`.
- Use `npm --workspace @superboard/api run typecheck`.
- Use `npm --workspace @superboard/api run test`.
- Use `npm --workspace @superboard/api run test:integration` only when database/infra prerequisites are available.
