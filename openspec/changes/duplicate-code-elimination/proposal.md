## Why

The codebase has two instances of `CommandPalette` in different locations with different implementations — one is an older, simpler version and one is a newer, feature-rich version. This creates confusion: developers importing from the wrong path get a broken experience, and the older file may still be referenced by legacy pages. Additionally, the `components/notifications/` folder contains only two files where an `index.ts` barrel adds indirection without value.

## What Changes

**Files deleted:**

- `apps/web/src/components/CommandPalette.tsx` (older, simpler version — replaced by the search variant)
- `apps/web/src/components/notifications/index.ts` (barrel file with only one export — no value)

**Files modified:**

- Any `.tsx`/`.ts` files that import from `components/CommandPalette` (not `components/search/CommandPalette`) → update import path to `components/search/CommandPalette`
- `components/notifications/notification-bell.tsx` → remove `index.ts` re-export, update any imports that go through the barrel

**Files NOT changed:**

- `components/search/CommandPalette.tsx` (canonical version — stays as-is)
- `components/notifications/notification-bell.tsx` (the actual component)

## Capabilities

### Modified Capabilities

- `ui-command-palette`: Consolidate to single canonical source at `components/search/CommandPalette.tsx`

## Impact

- **Breaking**: Any code still importing from `components/CommandPalette` (not the search variant) will get a module-not-found error at runtime. All such imports must be updated.
- No API or behavior changes — both versions expose a `CommandPalette` component with similar props
- The canonical version has more features (categories, recent searches, sync status indicator) so some UI pages may subtly improve
