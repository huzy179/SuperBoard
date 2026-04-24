# Boundary Rules — Architectural Import Constraints

This document explains the three ESLint boundary rules enforced in the SuperBoard monorepo, the violation categories they prevent, and how to fix each type of violation.

---

## Overview

Boundary rules are ESLint `no-restricted-imports` rules that prevent invalid cross-module imports. They are configured in:

- `apps/api/eslint.config.js` — enforces Rules 1 and 2 for the Core API
- `packages/shared/eslint.config.js` — enforces Rule 3 for the shared package

Run `npm run lint` (or `turbo lint`) to check for violations.

---

## Rule 1 — Cross-Domain Service Import

**What it blocks:** A service or controller in module A directly importing a `.service.ts` or `.repository.ts` file from module B.

**Why:** Each NestJS module owns its domain logic. Importing another module's service file directly creates tight coupling, bypasses the NestJS dependency injection container, and makes it impossible to swap implementations or mock dependencies in tests.

### Example violation

```ts
// ❌ apps/api/src/modules/task/task.service.ts
import { WorkspaceService } from '../workspace/workspace.service'; // BLOCKED
```

### How to fix

1. Declare the dependency in the consuming module's `imports` array:

```ts
// apps/api/src/modules/task/task.module.ts
@Module({
  imports: [WorkspaceModule], // ← import the module, not the file
  providers: [TaskService],
})
export class TaskModule {}
```

2. Inject the service via the constructor:

```ts
// apps/api/src/modules/task/task.service.ts
@Injectable()
export class TaskService {
  constructor(private readonly workspaceService: WorkspaceService) {}
}
```

Make sure `WorkspaceModule` exports `WorkspaceService` so it is available to importing modules.

---

## Rule 2 — Controller Bypassing Service Layer

**What it blocks:** A `*.controller.ts` file importing a `*.repository.ts` file or `PrismaService` / `@prisma/client` directly.

**Why:** Controllers are responsible for HTTP request/response handling only. All business logic and data access must go through the service layer. Direct repository or Prisma access in a controller:

- Leaks persistence concerns into the HTTP layer
- Makes the controller untestable without a real database
- Bypasses any business rules enforced in the service

### Example violations

```ts
// ❌ apps/api/src/modules/task/task.controller.ts
import { TaskRepository } from './task.repository'; // BLOCKED
import { PrismaService } from '../../prisma/prisma.service'; // BLOCKED
import { PrismaClient } from '@prisma/client'; // BLOCKED
```

### How to fix

Move all data access to the service layer and inject the service into the controller:

```ts
// ✅ apps/api/src/modules/task/task.controller.ts
@Controller('tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.taskService.findById(id); // delegate to service
  }
}
```

The service is the only layer that should interact with repositories or Prisma.

---

## Rule 3 — `packages/shared` Must Not Import from `apps/*`

**What it blocks:** Any file inside `packages/shared/src/` importing from `apps/api`, `apps/web`, `apps/ai-service`, or any other app directory.

**Why:** `packages/shared` (`@superboard/shared`) is the inter-service contract package. It is consumed by every service in the monorepo. If it imports from an app, it creates a circular dependency and couples the shared contract to a specific runtime — defeating the purpose of having a shared package.

### Example violation

```ts
// ❌ packages/shared/src/events/task.events.ts
import { TaskService } from '../../../apps/api/src/modules/task/task.service'; // BLOCKED
```

### How to fix

`packages/shared` must only contain:

- Plain TypeScript interfaces, types, and enums
- Zod schemas for validation
- Protobuf definitions
- Pure utility functions with no app-level dependencies

If you need logic from an app in the shared package, extract it into a new package under `packages/` (e.g., `packages/utils`) and have both the app and `packages/shared` depend on that new package.

```
packages/
  shared/      ← contracts only, no app imports
  utils/       ← pure utilities shared across apps and packages
apps/
  api/         ← imports from packages/shared and packages/utils
```

---

## CI Enforcement

These rules run as part of the standard lint step:

```bash
turbo lint
# or for a single app:
npm run lint --workspace @superboard/api
```

A pull request that introduces any boundary violation will fail the `lint` status check and be blocked from merging (see branch protection rules in `docs/branch-protection-setup.md`).

---

## Quick Reference

| Rule                            | Applies to                             | Blocks                                                      | Fix                                                             |
| ------------------------------- | -------------------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------- |
| 1 — Cross-domain service import | `apps/api/src/modules/**`              | Importing another module's `.service` or `.repository` file | Use NestJS `imports` + DI                                       |
| 2 — Controller bypasses service | `apps/api/src/modules/**/*.controller` | Importing `.repository` or `PrismaService`/`@prisma/client` | Delegate to service layer                                       |
| 3 — Shared imports app code     | `packages/shared/src/**`               | Importing from `apps/*`                                     | Keep shared package pure; extract to `packages/utils` if needed |
