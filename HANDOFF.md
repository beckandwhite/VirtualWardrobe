# Session Handoff — VirtualWardrobe (M0 done, M1 in progress)

**Resume point:** M0 (all 5 issues) + M1-1 are shipped and green. M1-2 is **half-built**.
Run `tsc --noEmit`, `eslint .`, `jest` to confirm green baseline, then continue M1-2.

## What was just committed
- `94ec402` feat(m0-5): studio route — pose→box→transform→save pipeline + placeholder PNGs (`app/studio.tsx`)
- `a077750` docs: D19 grilling outcomes (M1/M2) + issue amendments
- `d1aa74c` feat(m1-1): tab layout + `useCapture` hook + draft item creation
- Working tree after M1-1: **clean** (all committed).

## What is UNCOMMITTED (M1-2, in progress)
Two files are written, typecheck-clean, but **untracked** — do NOT lose them:
- `src/store/useItem.ts` — `useItems()`, `useItem(id)`, `upsertItem`, `deleteItem` over the M0-3 repo.
- `src/store/thumbnail.ts` — `makeThumbnail(fullPath)` via `expo-image-manipulator` `manipulateAsync([{resize}],{format:JPEG,compress})`, best-effort fallback to full path.

## Next: finish M1-2 (`Plans/issues/M1-2.md`)
Still to build:
1. **`app/item.tsx`** — flat modal detail/edit screen (per D19.4, like `studio`/`capture`, NOT `app/(wardrobe)/item.tsx`).
   - Load a draft via `useItem(id)` (deep-link `?id=<itemId>`).
   - Field editors: type selector (`top|bottom|dress|outerwear|shoes|other`), color swatch set,
     tag input (comma/enter → `tags[]`), and a thumbnail preview.
   - On save: `makeThumbnail(item.imagePath)` → `upsertItem(id, {type,color,tags,thumbnailPath})`;
     then `router.back()` to the wardrobe tab.
   - On delete: `deleteItem(id)` (repo already cascades `try_ons` rows — verified in `repo.ts:117`) → `router.back()`.
   - Guard "not found" (useItem returns null when the id is stale).
2. **Export the new hooks** from the store barrel `src/store/index.ts` (`export * from './useItem'; export {makeThumbnail} from './thumbnail';`).
   - NOTE: `thumbnail.ts` pulls in `expo-image-manipulator`. Keep it out of the node jest path
     (jest only collects `tests/**` — it doesn't import these, so fine).
3. **Wire the wardrobe tab to the item screen**: in `app/(tabs)/wardrobe.tsx` render a thumbnail
   (`Image source={{uri: item.thumbnailPath ?? item.imagePath}}`), and make the item card
   (or a tap on the row) `router.push('/item?id=<itemId>')`. The "Try on" button already deep-links
   to `/studio?id=<id>` (keep it).
4. **Register `app/item`** in `app/_layout.tsx` Stack: `<Stack.Screen name="item" options={{presentation:'modal'}}/>`.
5. **Update `Plans/issues/M1-2.md`** status → BUILT + tick acceptance + note the "flat modal not (wardrobe)/item" D19.4 decision.
6. Run `npx tsc --noEmit` + `npx eslint .` + `npx jest`, then `git add -A && git commit`.

## Build order ahead (from D19, `Plans/decision-log.md`)
M1-1 ✅ → **M1-2 (in progress)** → M1-3 (gallery grid + `filter.ts`/`searchItems` pure fns + jest tests,
deep-link `router.push('/studio?id=<id>')` — M1-3 doc was amended to `?id=` to match built studio)
→ M1-4 (`assets/store.json` manifest + `src/catalog/ingest.ts`, **replace** the in-code `seedCatalog` in
`onboarding.ts`/`repo.ts`, same `catalog_ingested` gate) → M2-1 (vendored MoveNet, independent of M1)
→ M2-2 (re-enable `react-native-reanimated/plugin` in `babel.config.js`, auto-box + Reanimated fine-tune in `app/studio.tsx`)
→ M2-4 (dismissible "adjusting manually" banner) → M2-3 (`src/composer/export.ts` + `expo-sharing` + saved-looks list).

## Conventions / gotchas already discovered (don't relearn)
- **Routing (D19.4):** tab layout. `app/(tabs)/` = `_layout.tsx` (Tabs: wardrobe/catalog/looks, text labels,
  no icons — `@expo/vector-icons` NOT installed). Flat modals at `app/` root: `capture`, `studio`; add `item` here too.
- **tsconfig paths:** `@/store`, `@/capture`, `@/composer`, `@/pose` (+`/*` variants for each) — add new aliases if you make a new `@/x` root.
- **v57 expo-image-picker:** `requestMediaLibraryPermissionsAsync()` / `requestCameraPermissionsAsync()`, `launch*Async({mediaTypes:'images',quality})`. `res.canceled`, `res.assets?.[0].uri`.
- **v57 expo-file-system (new class API, all SYNC):** `Paths.document`, `new File(dir, name)`, `file.copy(dest,{overwrite:true})` (option is `overwrite`, NOT `idempotent`), `file.uri`. `createDirectory(name)` does NOT take `intermediates` in this ver.
- **v57 expo-image-manipulator:** `manipulateAsync(uri, [{resize:{width,height}}], {format:SaveFormat.JPEG, compress:0.7})` → `{uri,width,height}`. `manipulateAsync` is deprecated-but-working; new API is `ImageManipulator.manipulate(source)` context.
- **Jest:** `jest.config.mjs` uses `ts-jest` and only collects `tests/**/*.test.ts` in a node env. Pure modules only
  (no `react-native`/expo imports). autoBox tests exist; add `filter.ts`/`searchItems` tests in M1-3.
- **eslint config:** `react-hooks/set-state-in-effect` and `react-hooks/refs` are disabled/commented as
  conservative false-positives for the async-load + PanResponder patterns. `import/no-unresolved` is
  disabled on the `.png` imports in `app/studio.tsx` (metro handles them, eslint can't). Node scripts get
  node globals via `eslint.config.js` `vw/node-scripts`.
- **eslint-env flat-config:** `/* eslint-env node */` is a WARNING in flat config — use config-file globals instead.
- **Deep-link param is `id`** (not `item`); the built studio reads `useLocalSearchParams<{id}>`. All deep-links use `?id=<id>`.
- **Draft = `type:'other'` + default color** (D19.5); no schema migration for drafts. `Item` = `{id,type,name,color,tags[],imagePath,thumbnailPath,createdAt}`.

## Open caveat worth surfacing to user
M1-1 web image-persistence: on web the captured URI is a session object URL, so a web *draft's image*
isn't restart-persistent (the SQLite row is). Native is fine. Documented in M1-1 status.
A web FS model (persist blob to a store) is out of MVP scope.

## Suggested first action on resume
Read `Plans/issues/M1-2.md` (full task list), then build `app/item.tsx`, wire the wardrobe tab + root layout,
export from the store barrel, verify green, commit M1-2. Two untracked files are already written — keep them.
