## Context

Dead code cleanup is a standard hygiene task. The three categories targeted here are:

1. **Orphan files** — files that were replaced but not deleted
2. **Dead comment blocks** — resolved TODO/FIXME/HACK markers that no longer track meaningful work
3. **Unused exports** — `export function` / `export const` / `export default` that are never imported anywhere in the codebase

## Goals / Non-Goals

**Goals:**

- Zero orphan files left in `src/`
- Zero resolved dead comment blocks
- Zero unused exports in the web and api source trees
- All deletions verified with a build + type-check pass

**Non-Goals:**

- NOT refactoring live code (even if poorly written)
- NOT removing commented-out code blocks that are intentional (e.g., feature flags)
- NOT analyzing runtime dead code (code imported but never called)

## Decisions

| Decision                                                                                              | Rationale                                                                                                               |
| ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Keep `.old` files with real content in a `_archive/` folder                                           | Orphan files that may be needed for git history reference                                                               |
| Only delete `project.controller.ts.old` since it has no meaningful content and a clean version exists | Other `.old` files may contain useful code; this one is a duplicate of a recently modified file                         |
| Treat `// TODO:` as dead only when the text describes a **resolved** or **completed** action          | `// TODO: add error handling` without evidence it's pending → remove. `// TODO(nick): support OAuth` → keep if not done |
| Exclude `dist/`, `node_modules/`, `.turbo/` from unused-export scan                                   | These are build artifacts, not source                                                                                   |
| Exclude barrel `index.ts` files from "unused" check                                                   | These export for external consumption and will show as "unused" internally                                              |

## Risks / Trade-offs

- **Risk**: Accidentally deleting a file that is dynamically imported (e.g., `next/dynamic`). **Mitigation**: verify with `rg "import.*project.controller.ts.old"` before deletion.
- **Risk**: Comment blocks that appear resolved but are intentional documentation. **Mitigation**: only remove blocks that explicitly say "FIXED", "DONE", or describe a resolved bug.
- **Trade-off**: Spending time analyzing comments may slow the task down. Keep it mechanical — only remove clearly dead comments, flag ambiguous ones for manual review.
