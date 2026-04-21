## Why

The codebase contains dead code that creates noise, slows down builds, and increases cognitive load during maintenance. Orphan files, resolved TODO/FIXME comments, and unused exports are indicators of codebase decay.

## What Changes

**Removes:**

- One orphan `.old` file left behind from a previous refactor
- All resolved `// TODO:`, `// FIXME:`, `// HACK:` comment blocks that no longer have pending work
- All exported functions and components that are never imported anywhere in the codebase

**Does NOT remove:**

- Valid TODO comments that describe future work (must be actionable and not resolved)
- Comments explaining "why" code exists (as-if/self-documentation)
- Imports/exports needed for type re-exports or barrel files

## Capabilities

### Modified Capabilities

- `code-quality`: Dead code elimination restores ESLint `no-unused-vars` / tree-shaking integrity

## Impact

- **No breaking changes** — only deletion of orphaned/unused code
- No API, schema, or behavior changes
- Reduces bundle size marginally
- Improves `tsc --noEmit` and ESLint analysis speed
