# TypeScript and Lint Rules

## Baseline

- Root uses npm workspaces, Turborepo, TypeScript 5.8, ESLint 9 flat config, Prettier 3, Node `>=20.11.0`.
- Prefer workspace scripts: `npm --workspace <name> run lint`, `npm --workspace <name> run typecheck`, `npm --workspace <name> run build`.
- Root commands exist but are broader: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test`.

## TypeScript

- Keep `strict` semantics in shared/configured packages; do not loosen compiler options to unblock local code.
- Preserve `NodeNext` for backend packages and `Bundler`/`ESNext` patterns for Next/UI packages.
- Use exported contracts from `@superboard/shared` instead of duplicating DTO/event types in apps.
- Avoid `any`; use `unknown` plus narrowing, Zod schemas, generics, or explicit local interfaces.
- Avoid non-null assertions. Prove presence with guards or return early.
- Use `import type` for type-only imports when it avoids runtime cycles.
- Preserve file casing exactly; `forceConsistentCasingInFileNames` is intentional.

## ESLint

- Root ESLint ignores build artifacts, generated `.d.ts`, `.next`, `.turbo`, coverage, and `.venv`.
- Unused args/vars must be removed or prefixed with `_`.
- Test files are stricter at root for `no-explicit-any`; do not use test-only `any` unless the scoped package explicitly relaxes it.
- Do not silence lint with file-wide disables. Use the smallest line-level exception only when there is a documented external constraint.

## Imports

- Do not import from `dist`, `.next`, generated build output, or another app's `src`.
- Packages can be imported by workspace name only when `package.json` declares the dependency.
- Keep imports acyclic across contracts, backend shared infrastructure, and apps.
- Prefer public package entrypoints over deep internal imports unless that package explicitly exports a subpath.
