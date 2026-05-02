# Hocuspocus Collaboration Service Rules

## Scope

Applies to `apps/collab-service`.

## TypeScript

- This service is standalone strict TypeScript with `NodeNext`; keep imports NodeNext-compatible.
- Do not apply NestJS assumptions here unless the service already uses them.
- Keep Hocuspocus/Yjs behavior isolated from API-specific modules.
- Do not import from `apps/api/src`; use shared contracts or explicit APIs.

## Validation

- Use `npm --workspace @superboard/collab-service run build`.
- Use `npm --workspace @superboard/collab-service run test`.
- The current lint script uses legacy `--ext`; if it fails due ESLint 9 CLI compatibility, report it instead of weakening lint rules.
