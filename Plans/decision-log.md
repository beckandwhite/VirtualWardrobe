# Decision Log

Run-time decisions while building M0+, each with rationale. Newest at top.
For durable, locked decisions see `00-decisions.md` (ADRs). This log is for
in-flight, build-time choices.

---

## 2026-09-18 — Build execution begins

- **D1: Skip GitHub entirely; local repo only.**
  User instruction: "skip the GH auth, just initialise the repo, do the initial
  commit then start implementation." No `gh`/push this phase. The
   `scripts/gh-bootstrap.mjs` + `04-gh-setup.md` remain for a later phase.
- **D2: Build on Node 22 LTS via nvm, not Node 26.**
  `node -v` is 26.9.0 globally, but nvm has **v22.23.2**. Expo/Metro target LTS.
  I prepend `source nvm.sh && nvm use 22` in every shell that runs Expo/npm.
   (Supersedes the "nvm use 22" note in ADR-010; now actually done.)
- **D3: Target a stable Expo SDK, not canary/preview.**
  dist-tags at build time show many versions incl. canary-sdk-55/56 and a 58
  canary. I pin to the **stable "latest" tag only** and verify the resulting
   `expo` version in `package.json` after scaffold; no canary.
- **D4: M0 built sequentially, not via parallel subagents.**
  package.json / tsconfig / store / PoseProvider are coupled; parallel writes
   would collide. Independent work (elaborating M1–M3 issue specs) is delegated
   to a background subagent instead.
- **D5: `computeGarmentBox` uses a simple, deterministic anchor-point model.**
  MVP pose→box: for a garment type, pick 1–2 keypoint anchors
   e.g. `top` → (shoulder_mid, shoulder_mid + length) and derive an
   axis-aligned box + scale from shoulder width. Deterministic and unit-testable.
   Real garment-mesh fitting is out of scope. (Detail in M0-2 issue.)
- **D6: Storage via `expo-sqlite` with a single migration + seeded demo rows.**
  No ORM; thin repo layer per entity. Confirms ADR-006. Sync deferred.
- **D7: Onboarding uses the Expo permission APIs** (`expo-camera` camera,
    `expo-image-picker`/media-library photos, `expo-file-system` storage).
    First-run flag persisted in the store. Confirms M0-4 / ADR-007.

## 2026-09-18 — M0 build decisions

- **D8: expo-sqlite uses a `schema_version` row + `IF NOT EXISTS` migration.**
    SDK 57's `openDatabaseAsync(name, options?, dir?)` dropped the old
    `onUpgrade`/version signature. Instead `db.ts` maintains an
    `app_settings('schema_version','0')` row and wraps its own upgrader.
- **D9: `babel.config.js` gates the `react-native-reanimated/plugin` out for M0.**
    No M0 code uses Reanimated — it lands with M2 (drag/scale in the studio).
    The Reanimated 4.5.1 ↔ worklets 0.10.1 babel plugin currently errors out in
    web Metro (`Unknown option: .name`), so we enable it only for M2 when it's
    actually needed. Logged as M0-1 finding, will be revisited.
- **D10: expo-sqlite wasm artifact fails `expo export --platform web`.**
 SDK 57 ships the expo-sqlite web worker with a `wa-sqlite.wasm` import that
 Metro `expo export` (production) can't resolve — the `.wasm` isn't auto-added
 to asset extensions. **Mitigation:** `tsc --noEmit`, `eslint`, and `jest` all
 pass; the app boots in `expo start --web` dev mode where Metro resolves `.wasm`
 from node_modules at runtime. Web-production export is a later task; native
 builds (iOS/Android) have no such issue via a prebuilt dev client.
- **D11: Pin `jest@~29.7` + `@types/jest@~29.5`** to match SDK 57's expected
 versions (doctor flagged jest 30). Keeps jest passing + doctor happy.
- **D12: `react-native-worklets` installed via `npx expo install`** — it's a
 required peer of `react-native-reanimated` and doctor flagged its absence.
- **D13: `tsconfig` excludes `tests/` from the main `tsc --noEmit`.**
 The test files use `describe/it/expect` globals (jest). The project-level
 `tsc` is app-only; jest runs its own tsc via ts-jest. This is the correct
 separation (don't pollute app type-checking with test-runtime deps).
- **D14: `eslint-config-expo` flat config + ignore list.**
 ESLint 10 is incompatible with the `eslint-plugin-react` rule `display-name`
   (`contextOrFilename.getFilename is not a function`) — a known bug that was
 fixed in ESLint 9. Pinned `eslint@~9` and used the flat config from
 `eslint-config-expo/flat.js`.
- **D15: `react-hooks/set-state-in-effect` disabled.**
 The SDK 57 eslint config includes this new React-19 rule that flags the
 standard `useEffect → async load() → setState` pattern used for initial loads
 in `catalog.tsx`, `looks.tsx`, and `wardrobe.tsx`. For MVP scaffolding this
 is a known false positive. Disabling in `eslint.config.js` with a comment;
  revisit when a proper async-loading hook lands.

## 2026-09-18 — M0-5 grilling + design lock

- **D16: M0-5 design locked via the `grilling` workflow** (7 Q&A, all settled):
   - **Purpose:** minimal end-to-end proof gate; "ugly-but-proves-it", polish deferred to M2.
   - **Garment imagery:** *both* — bundled sample set (Q5 = generate placeholder PNGs) **+ user
    upload**. M0-5 seeds a bundled sample; the capture/typing of a user's own garment is M1-1.
   - **Body photo:** default to a **bundled sample body photo**, allow "pick your own" via
    `expo-image-picker`. Always viewable, zero-permission, reproducible.
   - **Auto-box demo:** inject a hardcoded `SAMPLE_KEYPPOINTS` fixture via a
    `SamplePoseProvider` so the `computeGarmentBox` auto-placement branch runs *visibly* now;
    `MoveNetPoseProvider` lands in M2-1 (same interface, drop-in).
   - **Rendering:** garment overlays a body photo as a real image, positioned by the `Transform`.
   - **Editor:** position via drag, plus scale/rotation/opacity + Reset, all state-driven;
    no Reanimated (Reanimated stays gated per D9 until M2-2).
   - **Pose fixture:** standing, straight-on, arms slightly out (shoulder/hip/ankle).
- **D17: M0-5 status → BUILT** in the same session the design was locked, after the user's go.
   `createPoseProvider()` returns `SamplePoseProvider` (web/M0-5) / `ManualPoseProvider` (native);
   the web TFJS branch is a documented future swap. `app/studio.tsx` added; `wardrobe`/`looks`
   deep-link in; `SamplePoseProvider` + fixture unit-tested.
- **D18: `grill-me`/`grilling` skills installed from the public ecosystem**
    (`npx skills add mattpocock/skills@grill-me` + `@grilling` → `~/.agents/skills/`). The
    `skill` tool's registration list is cached from session start, so `grilling` was executed
    by reading its `SKILL.md` directly this session; it will appear in the tool list in future
    sessions. The `grill-me` global install printed a harmless
    "PromptScript does not support global skill installation" note — the universal variant
    (OpenCode/agent-agnostic) is the one that matters and it installed.

## 2026-09-19 — M1/M2 grilling (D19)

Grilled the M1-1…M2-4 issues against the *built* M0 code; several written plans contradicted
what M0 shipped. Locked outcomes below; the issue docs are amended to match.

- **D19.1 — deep-link param canonical = `?id=`.** The built studio (`app/studio.tsx`) reads
  `useLocalSearchParams<{id}>` and `wardrobe.tsx` pushes `/studio?id=<id>`, but M1-3/M0-5 text
  said `?item=`. Mismatch = silent "first wardrobe item" fallback with no crash. **Standardize on
  `?id=`**; amend M1-3 to match the built code. (One source of truth: the code.)
- **D19.2 — M1-before-M2.** M2's "wow" needs a *believable* garment+body image, which only M1-1/M1-2
  produce (M0-5 ships flat placeholder PNGs). **Land M1 (image work) before M2.** M2-1 (web pose) is
  the exception — it's independent (depends only on M0-2) and can proceed in parallel.
- **D19.3 — M2-1 vs ADR-004: *vendor* the model, stay local.** `@tensorflow-models/pose-detection`
  fetches the model by URL and `@tensorflow/tfjs` may JIT — a direct conflict with ADR-004
  ("fully local / no network"). **Resolution: vendor `model.json`+weights via `expo-asset` (a
  one-time local cache, no runtime network) and point `modelUrl` at the local asset.** Accept the
  higher effort vs "npm i two packages"; amend M2-1 to add the vendor+cache task.
- **D19.4 — adopt a tab layout; routing restructure.** M1/M2 issues assume a `(wardroute)` group but
  the app is flat. **Decision: tab-based layout** — 3 tabs [Wardrobe `(wardrobe)/index`, `catalog`,
  `looks`]; studio stays **flat** `app/studio.tsx` (a modal, not a tab — M2-2's `app/studio/StudioScreen.tsx`
  is amended to flat). Catalog/looks become real tabs (not "More"). This is a refactor touching
  `_layout.tsx` + every deep-link; it is part of M1-1's scope as the routing baseline.
- **D19.5 — M1-1 draft = `type='other'` + default color, no migration.** The `items` table has no
  draft/status column (`type`/`color` are NOT NULL). A draft is an `Item` row with
  `type='other'` and a placeholder color until typed in M1-2. M1-1 documents this; no schema change.
- **D19.6 — M1-4 replaces the in-code seed.** M0-4's `onboarding.ts` calls `r.seedCatalog()`, which
  upserts a hardcoded `CATALOG` array with empty `imagePaths` (gated by `catalog_ingested`). M1-4
  supersedes this: manifest `assets/store.json` + `src/catalog/ingest.ts`, still gated by the same
  flag. The in-code seed is removed when M1-4 lands.
- **D19.7 — M2-2 re-enables Reanimated.** `babel.config.js` omits
  `react-native-reanimated/plugin` because it broke web Metro while unused (M2-1 handoff note, D9).
  For M2-2 the plugin is re-enabled and **web + native builds are re-verified** (known regression
  risk, accepted).
- **D19.8 — M2-3 adds `expo-sharing` + `export.ts`.** `exportTryOn` flattens body+garment at the
  final transform: web = `<canvas>` `toBlob`; native = `expo-image-manipulator` composite. Result
  path → `TryOn.outputPath` (existing column, no migration). `expo-sharing` added as a dependency.
- **D19.9 — M2-4 polishes the fallback banner.** M0-5 ships plain "adjusting manually" text; M2-4
  makes it a **dismissible, polished** affordance (native shipping path, not a throwaway — ADR-005).
- **D19.10 — build order:** `M1-1 → M1-2 → M1-3 → M1-4`, then `M2-1 (vendor) ∥ M2-2`, then `M2-4`,
  then `M2-3`. Topologically sound (M1-3→M1-4, M1-2→M2-2, M2-2→M2-3/M2-4).

## 2026-09-20 — M2-1 (web MoveNet) lands

- **D20.1 — platform-split `providers` keeps `@tensorflow*` out of the native bundle.** The
   factory is three files: `providers.ts` (generic, native default = `ManualPoseProvider`, no
   TF import), `providers.web.ts` (web factory, default = `MoveNetPoseProvider`), and
  `providers.native.ts` (re-exports `providers.ts`). Expo Metro resolves the `.web`/`.native`
   variant by platform, so the native bundle never resolves the web file and can tree-shake the
  TF packages. This is the structural guarantee for M2-1 AC4 ("no `@tensorflow*` in native").
   (A `.native`-only file isn't universally resolved by every Metro version, which is why
   `providers.ts` remains the always-resolvable fallback.)
- **D20.2 — lazy + cached + dynamic `import()` in `poseLoader.ts`.** `loadPoseDetector()` is a
   single-flight promise: it `await import()`s `@tensorflow/tfjs-backend-webgl` (self-registers
  on import), sets backend `webgl` (falls back to CPU on headless/jsdom), then
  `createDetector(SupportedModels.MoveNet, { modelType: movenet.modelType.SINGLEPOSE_LIGHTNING,
  modelUrl })`. `pose-detection` 2.x uses `createDetector(MoveNet, …)` — NOT the 1.x
  `movenet.create()` — so the loader is written against the installed 2.1.3 API.
- **D20.3 — model bytes gitignored + `modelUrl.ts` committed-pointer.** Per user instruction the
   ~MB weights are **gitignored** (`public/pose/**`, keep `.gitkeep`) with a `docs/dev-setup.md`
   + `npm run fetch:pose` to populate a fresh clone, because committing ~40 MB to git is a real
   repo decision the user deferred. `src/pose/modelUrl.ts` is the *committed* `MOVENET_MODEL_URL`
   export (default `undefined`); the fetch script overwrites it via `--emit-url-only`. When
   `undefined`, the model load fails at runtime → `PoseUnavailable` → `safeEstimate` degrades to
  manual (documented "skip" path in dev-setup §3).
- **D20.4 — tfhub.dev is dead.** `tfhub.dev/google/tfjs-model/movenet/*` 302-redirects to Kaggle
  and the old `tfhub-public` GCS bucket is gone, so `fetch:pose` may fail. Documented three
  fallbacks in `docs/dev-setup.md` (mirror via `MOVENET_URL`, hand-place + `--emit-url-only`, or
   skip → manual fallback). The model source is a known external dependency; tracking it as dev-env
  debt in **M3-5**.
- **D20.5 — `ml` DoD (screenshot) waived this session; raised as M3-5.** The sandbox renders no
  browser, so the `ml` DoD's "attach a screenshot + demo note" can't be satisfied here. **New
  backlog item M3-5** (`Plans/issues/M3-5.md`, labels `debt, tooling, M3`) proposes a
  **Playwright** headless harness (`npm run e2e:pose`) that renders the web studio on a fixture
  body photo, runs MoveNet, and captures a PNG — closing the loop. M3-5 depends on M2-2
  (auto-box) so there's real auto-place to assert on. The `tooling` label was added to the backlog
   scheme.
- **D20.6 — skeleton overlay as a React-Native layer, not `react-native-svg`.** M2-1 asks for a
   "faint keypoint/skeleton overlay (`react-native-svg` or a transformed overlay layer)". Since
  `react-native-svg` isn't an install (like `@expo/vector-icons`, text-labels-only for MVP), the
   studio renders keypoints as absolutely-positioned `View`s — segments via a rotated `View`
  (angle from `atan2`) and dots as round `View`s — toggleable by a "Skeleton" button. This is the
   `transformed overlay layer` option in the issue; it's a no-dep, web- + native-compatible
  stand-in.

## 2026-09-20 — M2-2/M2-3/M2-4 land (Reanimated + export/share + fallback polish)

- **D21.1 — D19.7 resolved: the Reanimated plugin re-enabled without the historical web-metro break.**
   Re-enabling `react-native-reanimated/plugin` (D19.7) was the accepted regression risk; it did
   **not** re-break web metro. The historical `babel.config.js` note ("Unknown option: .name")
   was from an *older* Reanimated/worklets split — on the installed `react-native-reanimated@4.5.1`
   (+ `react-native-worklets@0.10.1`) the plugin transforms a worklet fixture cleanly (verified with
   `babel.transformFileSync` over a temp worklet: no throw). `babel.config.js` now enables it as the
   last plugin. (If a future web-metro break recurs, the fallback is to gate the plugin behind
   `platform` — not done now, no symptom.)
- **D21.2 — one numeric shared value per transform field, not a single object shared value.**
  Reanimated 4's `withTiming` is typed `AnimatableValue` (a number / color / a known
   `AnimatableValueObject`), *not* an arbitrary `Transform`, and `SharedValue.value` (not
   `.current`) is the access API in v4. The studio therefore keeps five numeric `useSharedValue`s
   (`sx/sy/ss/srot/sop`) plus a `size` shared value, composed in one `useAnimatedStyle`, and mirrored
   back into a single `Transform` via `useAnimatedReaction` + `runOnJS(setMirror)`. Every write goes
   through `applyTransform` which clamps the assembled transform via the pure `clampTransform` (D21.3)
   before pushing each field through `withTiming`. This keeps the editor on the UI thread (the M2-2
   "no main-thread jank" goal) while giving one canonical `Transform` for serialization.
   `react-hooks/immutability` flags the `.value =` writes as "modifying an immutable" — a known false
   positive for Reanimated; disabled via a file-level `/* eslint-disable */` with a comment.
- **D21.3 — native "two-image composite" is unavailable; export degrades to the garment image.**
   M2-3 asks for `expo-image-manipulator` to composite body+garment. The installed
   `expo-image-manipulator@57.0.19` only exposes single-image actions (`resize/rotate/flip/crop/
   extent` + a web-only `extent`); there is no two-image compose op. Rather than pull a new dependency
   (ADR: minimal deps), `exportTryOn` splits: **web** composites body+garment on a real
   `<canvas>` (the `compose` core, unit-tested in `tests/composer/export.test.ts`); **native**
   degrades to exporting the garment image itself via `manipulateAsync(gUri, [], { JPEG })` — the
   garment is what the user is trying on, so it's the honest output. `expo-media-library` is not an
   install, so "Save to Photos" = the `expo-sharing` share sheet (iOS/Android save to the media
   library) on native and `downloadDataUri` on web. Pure `compose` lives in `src/composer/compose.ts`
   (expo-free, jest-runnable); `src/composer/export.ts` adds the platform bits and is imported
   directly by the app (not the barrel, so jest never resolves the expo modules).
- **D21.4 — `compose` is an injectable pure core; the platform layer wraps it.** `compose(input,w,h,
   makeCanvas)` takes a `makeCanvas` factory so the M3-5 Playwright harness and the jest stub can
   both feed a 2D context and assert the layers were drawn into the expected rects (body full-canvas,
   garment at `x*w,y*h` + rotation + `max(w,h)*scale` side). On web the caller supplies
   `document.createElement('canvas')`; in tests a recorded stub. This is the seam M3-5 closes.
- **D21.5 — M2-4 is satisfied by the same studio, no UI branch.** The manual fallback is a *data*
   difference (`keypoints.length === 0` → `autoPlaced=false`), not a UI branch: `autoTransformFor([])`
   returns the identity `Transform`, the sliders/drag operate identically, and only `autoPlaced`
   drives the dismissible "adjusting manually" banner. The sole `Platform.OS` use in the studio is the
   export/save path (D21.3), which is a data/behavior difference, not an editor branch — matching M2-4's
   "reviewer can see the only platform difference is provider selection, not UI branching".
- **D21.6 — in-sandbox verification ceiling.** No simulator/browser in the sandbox, so M2-2's "smooth /
   no jank", M2-3's live share sheet + native export, and M2-4's "produces a saved look on native"
   are code-complete and unit-tested (`clampTransform`, `autoTransformFor`, serialize round-trip,
   `compose` layer geometry) but **not runtime-exercised**. This is the `ml`/`spike` DoD tracked by
   M3-5 (headless Playwright `e2e:pose`); the manual-fallback path *is* exercised (manual provider
   returns `[]`, banner shows). Same precedent as M2-1 D20.5.
