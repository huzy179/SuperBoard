## 1. CommandPalette Deduplication

- [ ] 1.1 Find all imports referencing the old `CommandPalette`
  - Run: `rg "from ['\"]@/components/CommandPalette" /Users/maitranhuy/SuperBoard/apps/web/src --type tsx -n`
  - Run: `rg "from ['\"]@/components/CommandPalette['\"]" /Users/maitranhuy/SuperBoard/apps/web/src --type ts --type tsx -n`
  - Collect all files that import from the old path
- [ ] 1.2 Update each import to use the canonical path
  - Change: `from '@/components/CommandPalette'` → `from '@/components/search/CommandPalette'`
  - If the import uses a named export, verify the new file exports the same name (`CommandPalette`)
  - If the new file uses a different export shape, update the consuming code accordingly
- [ ] 1.3 Delete the old file
  - `apps/web/src/components/CommandPalette.tsx`
- [ ] 1.4 Verify no remaining references to old path
  - Run: `rg "from ['\"]@/components/CommandPalette" /Users/maitranhuy/SuperBoard/apps/web/src --type tsx --type ts`
  - Must return zero results

## 2. Notification Barrel Cleanup

- [ ] 2.1 Check contents of `components/notifications/index.ts`
  - Read `apps/web/src/components/notifications/index.ts`
  - Confirm it only re-exports from `notification-bell.tsx`
- [ ] 2.2 Find all imports that go through the barrel
  - Run: `rg "from ['\"]@/components/notifications['\"]" /Users/maitranhuy/SuperBoard/apps/web/src --type tsx --type ts -n`
  - Run: `rg "from ['\"]@/components/notifications/index['\"]" /Users/maitranhuy/SuperBoard/apps/web/src --type tsx --type ts -n`
- [ ] 2.3 Update imports to use direct path
  - Change: `from '@/components/notifications'` → `from '@/components/notifications/notification-bell'`
  - Change: `from '@/components/notifications/index'` → `from '@/components/notifications/notification-bell'`
- [ ] 2.4 Delete the barrel
  - `apps/web/src/components/notifications/index.ts`
- [ ] 2.5 Verify no remaining barrel imports
  - Run: `rg "from ['\"]@/components/notifications['\"]" /Users/maitranhuy/SuperBoard/apps/web/src --type tsx --type ts`
  - Must return zero results

## 3. Verification

- [ ] 3.1 Run `npx turbo typecheck` — must pass
- [ ] 3.2 Run `npx turbo lint` — must pass
- [ ] 3.3 Run `npx turbo build` — must succeed
- [ ] 3.4 Open app and verify CommandPalette still works (search shortcut, navigation)
- [ ] 3.5 Verify notification bell still renders correctly
