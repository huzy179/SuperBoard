---
name: superboard-engineering
description: Project-specific engineering workflow for the SuperBoard monorepo. Use when editing SuperBoard TypeScript, Next.js, NestJS, Python AI service, shared packages, lint/typecheck config, workspace scripts, architecture, API contracts, frontend data fetching, or any task where syntax, ESLint, TypeScript, imports, module boundaries, or folder structure must stay consistent.
---

# SuperBoard Engineering

## Overview

Use this skill before changing code in SuperBoard. It keeps Codex focused on the repo's actual architecture, TypeScript rules, lint rules, import boundaries, and validation commands instead of applying generic patterns.

## Working Protocol

1. Read the nearest `AGENTS.md` before touching files; scoped rules override root rules.
2. Identify the workspace from the path (`apps/*` or `packages/*`) and read the matching reference only when needed.
3. Prefer narrow workspace commands over full monorepo commands while iterating.
4. Keep changes inside the owning domain unless the contract or package API must change.
5. Run or recommend `lint` and `typecheck` for every changed TypeScript workspace.

## Reference Selection

- For repo-wide syntax, imports, package scripts, and TypeScript: read `references/typescript-lint.md`.
- For app/package boundaries and where code belongs: read `references/architecture-map.md`.
- For `apps/web` and `packages/ui`: read `references/frontend.md`.
- For `apps/api`, Nest services, Prisma, workers, realtime services: read `references/backend.md`.
- For `packages/shared`, `packages/backend-shared`, `packages/config-*`: read `references/packages.md`.
- For final checks and command selection: read `references/validation.md`.

## Non-Negotiables

- Never introduce `any` to bypass errors; model unknown data with `unknown`, Zod, or explicit interfaces.
- Never add direct `fetch(` in frontend feature code; use `apps/web/src/lib/api-client.ts` and service files.
- Never import app code into `packages/shared`; shared contracts must be app-agnostic.
- Never bypass Nest service layers from controllers; controllers call services, services call repositories/Prisma.
- Never broaden `tsconfig` or disable ESLint rules to make unrelated errors disappear.
