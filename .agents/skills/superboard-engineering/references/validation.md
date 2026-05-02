# Validation Commands

## Command Selection

- Prefer changed-workspace checks first; run root checks only after broad config/package changes.
- TypeScript workspace pattern: `npm --workspace <workspace-name> run lint` then `npm --workspace <workspace-name> run typecheck`.
- Build when exports, runtime wiring, Next routes, Nest modules, Prisma, or package entrypoints changed.
- Tests should be targeted first, then broader if the target passes and the change is risky.

## Common Commands

- Root lint: `npm run lint`
- Root typecheck: `npm run typecheck`
- Root build: `npm run build`
- Root tests: `npm run test`
- API db generate: `npm --workspace @superboard/api run db:generate`
- API integration tests: `npm --workspace @superboard/api run test:integration`
- Web audit: `npm --workspace @superboard/web run ui:audit`
- Python integration: `npm --workspace @superboard/ai-service run test:integration`

## Final Review Checklist

- No new `any`, file-wide lint disables, or loosened compiler options.
- No app imports from packages and no package imports from apps.
- No direct frontend `fetch(` except `apps/web/src/lib/api-client.ts`.
- Controllers do not bypass services.
- Workspace `package.json` dependencies match new imports.
- Public package exports are updated when new public files are added.
- Generated/build folders are not edited manually.
