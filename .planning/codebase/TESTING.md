# Testing Patterns

**Analysis Date:** 2026-03-19

## Test Framework

**Runner:**

- Not detected in repository source workspaces (`apps/api`, `apps/web`, `apps/ai-service`) as of this analysis.
- Config: Not detected (`jest.config.*`, `vitest.config.*`, `pytest.ini`, `playwright.config.*` absent).

**Assertion Library:**

- Not detected (no active test files importing `expect`, `assert`, or test-runner APIs under app/package source).

**Run Commands:**

```bash
npm run test                      # Root script: delegates to workspaces that define `test`
npm --ws --if-present run test    # Actual root implementation in `package.json`
npm run lint && npm run typecheck # Current enforced quality gate in practice
```

## Test File Organization

**Location:**

- No `*.test.*`, `*.spec.*`, `tests/`, `test_*.py`, or `*_test.py` files detected under `apps/**` and `packages/**`.

**Naming:**

- Not applicable currently; no repository test naming pattern established.

**Structure:**

```
No in-repo test directory structure detected.
```

## Test Structure

**Suite Organization:**

```typescript
Not applicable: no `describe` / `it` / `test` suites detected in source workspaces.
```

**Patterns:**

- Setup pattern: Not detected.
- Teardown pattern: Not detected.
- Assertion pattern: Not detected.

## Mocking

**Framework:**

- Not detected (`jest.mock`, `vi.mock`, `sinon`, `pytest-mock` patterns are absent in app source).

**Patterns:**

```typescript
Not applicable: no repository-level mocking pattern exists yet.
```

**What to Mock:**

- Current code architecture suggests mocking external boundaries first when adding tests:
  - HTTP `fetch` in `apps/web/lib/api-client.ts`.
  - Prisma client calls in `apps/api/src/modules/**/` services.
  - JWT/config dependencies in `apps/api/src/modules/auth/auth.service.ts`.

**What NOT to Mock:**

- DTO/type contracts from `packages/shared/src/dtos/*.ts` and schema definitions in `packages/shared/src/schemas/index.ts` should stay real in tests.

## Fixtures and Factories

**Test Data:**

```typescript
Not detected: no fixtures/factory helpers currently committed.
```

**Location:**

- Not applicable currently.

## Coverage

**Requirements:**

- No coverage threshold config detected (no Jest/Vitest/Pytest coverage config files).
- CI still executes `npm run test` in `.github/workflows/ci.yml`; with current workspace scripts, this step is effectively a no-op when no workspace defines `test`.

**View Coverage:**

```bash
Not available yet (no configured coverage command in root or workspace package scripts).
```

## Test Types

**Unit Tests:**

- Not used in committed source at this time.

**Integration Tests:**

- Not used in committed source at this time.

**E2E Tests:**

- Not used; no Playwright/Cypress config detected in repository root or apps.

## CI Test Flow

- CI workflow at `.github/workflows/ci.yml` runs sequential quality checks: `npm ci` → `npm run lint` → `npm run typecheck` → `npm run test`.
- Root `test` command in `package.json` uses `npm --ws --if-present run test`, so only workspaces with explicit `test` scripts participate.
- Current workspace package manifests (`apps/api/package.json`, `apps/web/package.json`, `apps/ai-service/package.json`) do not define a `test` script.
- Pre-commit quality gate runs `lint-staged` via `.husky/pre-commit`, applying Prettier/ESLint fixes to staged files before commit.

## Common Patterns

**Async Testing:**

```typescript
Not detected in repository because no committed async test suites are present.
```

**Error Testing:**

```typescript
Not detected in repository because no committed test assertions are present.
```

---

_Testing analysis: 2026-03-19_
