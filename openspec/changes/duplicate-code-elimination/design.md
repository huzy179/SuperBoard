## Context

Two `CommandPalette` components exist:

| File | Path                                   | Lines | Key Differences                                                   |
| ---- | -------------------------------------- | ----- | ----------------------------------------------------------------- |
| Old  | `components/CommandPalette.tsx`        | ~290  | Simple — keyboard nav, basic search results, no categories        |
| New  | `components/search/CommandPalette.tsx` | ~440  | Full — categories, recent searches, sync status, action shortcuts |

The newer version replaced the old one but the old file was never deleted.

## Goals / Non-Goals

**Goals:**

- Single source of truth for `CommandPalette`
- Zero broken imports after deletion
- Notification barrel file removed (only 1 export, no value)

**Non-Goals:**

- NOT merging features between the two versions (the new one is already more capable)
- NOT changing the import path for `components/search/CommandPalette` — it stays where it is
- NOT renaming `components/search/CommandPalette` to `components/CommandPalette` — the subdirectory structure is meaningful

## Decisions

| Decision                                                 | Rationale                                                                                                                                  |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Keep `components/search/CommandPalette.tsx` as canonical | It has more features, more recent updates, better UX. Deleting it would lose work.                                                         |
| Do NOT rename to `components/CommandPalette.tsx`         | The `search/` subdirectory clearly communicates purpose and avoids future collisions. Moving it would break all existing imports.          |
| Delete `components/notifications/index.ts`               | Barrel file with only 1 export adds indirection with zero benefit. Direct imports from `notification-bell.tsx` are cleaner.                |
| Update all legacy imports before deletion                | Must find and redirect all `from '@/components/CommandPalette'` → `from '@/components/search/CommandPalette'` before deleting the old file |

## Risks / Trade-offs

- **Risk**: Missing an import path during the migration. **Mitigation**: after updating all found imports, run `rg "from.*components/CommandPalette" --type tsx --type ts` to confirm zero remaining. If any remain, the build will fail and catch it.
- **Risk**: Pages that use `CommandPalette` in a way the new version doesn't support. **Mitigation**: the new version has all capabilities of the old one (search, navigation, keyboard shortcuts). If a gap is found, it's a bug to fix, not a reason to keep the old file.
- **Trade-off**: Deleting the old file means we lose the simpler component as a fallback. If developers prefer a simpler variant in the future, they can copy from git history.
