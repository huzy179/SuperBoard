## 1. Orphan File Removal

- [ ] 1.1 Verify `apps/api/src/modules/project/project.controller.ts.old` is not imported anywhere
  - Run: `rg "project\.controller\.ts\.old" /Users/maitranhuy/SuperBoard --type ts --type tsx`
  - If zero matches → proceed
- [ ] 1.2 Delete `apps/api/src/modules/project/project.controller.ts.old`
- [ ] 1.3 Verify no other `.old` files exist in `src/`
  - Run: `find /Users/maitranhuy/SuperBoard/apps -name "*.old" -type f`
  - If found, assess each one before deletion

## 2. Dead Comment Block Removal

- [ ] 2.1 Scan for resolved TODO comments in `apps/web/src/`
  - Pattern: `// TODO:` / `// TODO-FIXED:` / `// DONE:` / `// FIXME:` / `// HACK:`
  - Run: `rg "// (TODO|FIXME|HACK|DONE|FIXED):" /Users/maitranhuy/SuperBoard/apps/web/src -n --type ts --type tsx`
  - For each match, assess: is it describing a **resolved** item (remove) or a **pending future** item (keep)?
  - Remove only confirmed-resolved blocks
- [ ] 2.2 Scan for resolved TODO comments in `apps/api/src/`
  - Same pattern, same assessment criteria
  - Run: `rg "// (TODO|FIXME|HACK|DONE|FIXED):" /Users/maitranhuy/SuperBoard/apps/api/src -n --type ts`
- [ ] 2.3 Scan for resolved TODO comments in `packages/shared/src/`
  - Run: `rg "// (TODO|FIXME|HACK|DONE|FIXED):" /Users/maitranhuy/SuperBoard/packages/shared/src -n --type ts`

## 3. Unused Export Detection

- [ ] 3.1 Detect unused named exports in `apps/web/src/`
  - Run: `npx ts-prune --project /Users/maitranhuy/SuperBoard/apps/web/tsconfig.json 2>/dev/null || npx eslint apps/web/src --format json | jq '[.[] | .messages[] | select(.ruleId == "@typescript-eslint/no-unused-vars")] | length'`
  - Alternative manual check: for each `.tsx`/`.ts` file in `src/features/` and `src/components/`, verify its exports are imported elsewhere
  - List all suspected unused exports
  - **Do NOT auto-delete** — manually verify each before removal
- [ ] 3.2 Detect unused named exports in `apps/api/src/`
  - Run: `npx ts-prune --project /Users/maitranhuy/SuperBoard/apps/api/tsconfig.json 2>/dev/null`
  - Manually verify each result before deletion
  - Pay special attention to `export * from` barrel re-exports — these are intentional
- [ ] 3.3 Detect unused named exports in `packages/shared/src/`
  - Shared package exports are consumed by both api and web — verify no consumers before marking unused
  - Run: `rg "from '@superboard/shared'" /Users/maitranhuy/SuperBoard/apps --type ts --type tsx -l | head -20`

## 4. Verification

- [ ] 4.1 Run `npx turbo typecheck` — must pass with zero new errors
- [ ] 4.2 Run `npx turbo lint` — must pass with zero new errors
- [ ] 4.3 Run `npx turbo build` — must succeed
- [ ] 4.4 Confirm no `.old` files remain in `src/`
