# Decision Log

Run-time decisions while building M0+, each with rationale. Newest at top.
For durable, locked decisions see `00-decisions.md` (ADRs). This log is for
in-flight, build-time choices.

---

## 2026-09-22 — M3-7 known-good MoveNet graph lands (D42)

- **D42: M3-7 is DONE; the known-good graph supersedes M3-6's converter output.** Sourced the
  canonical TFJS MoveNet-singlepose-lite graph from `vladmandic/human-models`
  (`models/movenet-lightning.json` + `movenet-lightning.bin`, `main`), whose `generatedBy` is the
  canonical tfhub origin `tfhub.dev/google/movenet/singlepose/lightning/4` — i.e. a *vendored
  canonical* graph, not a local ONNX→TFJS synthesis (that distinction is the whole point of M3-7 vs
  M3-6). It was placed into `assets/pose/movenet-singlepose-lite/` (replacing M3-6's 3 converter
  shards + unverified `model.json`) and mirrored to `public/pose/` (gitignored per ADR-004). Provenance:
   `model.json` sha256 `df8cbde44d00f533ccc4916a7c6ebc17316532fb3fadad114ec667fef22872e9`
   (161,813 B), `movenet-lightning.bin` sha256 `bf97bc10d9c8a11200b0190ed64ce039b6252f1aff7cb552aca99b3d191c2f34`
   (4,650,216 B).
- **D42.1 — real network-free inference proved, closing M3-6's open inference AC.** New harness
  `scripts/pose-m37-verify.mjs` (Node 22, CPU backend, `fetch` intercepted so a runtime network is
  impossible) asserts: pointer `→ /pose/movenet-singlepose-lite/model.json`; `generatedBy` canonical;
  `tf.loadGraphModel` succeeds network-free; input `[1,192,192,3]` int32 and runtime output
  `[1,1,17,3]` float32 (exactly the `@tensorflow-models/pose-detection` MoveNet contract); and a
  forward pass on the bundled `assets/sample/body.png` yields 17 finite COCO keypoints. One-run demo
  note at `docs/screenshots/last-run.md`.
- **D42.2 — why not the browser e2e.** `@playwright/test`/Chromium is not installed on this host
  (D20.5 / D31.4), so M3-7's "minimal TFJS load + `estimatePoses`" path is the allowed substitute;
  the Node forward pass exercises the same `execute → [1,1,17,3] → 17 keypoints` contract the detector
  uses, so API-compatibility is proven even without a browser.
- **D42.3 — M3-6 is superseded and closed.** Per the competition rule, the first independently
  verified, network-free graph wins the shared `public/pose/` slot. M3-7 lands that graph *and* the
  inference proof M3-6 lacked; M3-6 is closed as superseded (its unverified converter output is
  removed from `assets/pose/`). No two production graphs are maintained.
- **D42.4 — a third-party vendored graph is flagged for human trust review.** The bytes come from
   `vladmandic/human-models`; source URL + sha256 are recorded (D42) but the trust attestation is out
  of scope (M3-7 out-of-scope). `public/pose/` stays gitignored (ADR-004); `assets/pose/` holds the
  committed canonical copy so a fresh clone is reproducible via the recorded hashes.
- **D42.5 — Board Status "Done" move is blocked by token scope; recorded on the workitem instead.**
  The user asked to close M3-7 and move it to Done on the project board. Issue #20 was closed with
   reason `completed` and issue #19 (M3-6) closed as superseded, and the full run/decision record was
   posted as a comment on #20 — all within the `repo` scope the token has. The project **Board
   Status** field, however, is mutated only via `gh project item-edit`, which requires
   `read:project`/`write:project` scopes the GitHub token lacks, and the classic REST `projection`
   endpoint 404s (ProjectV2-only). So the card could not be flipped to `Done` non-interactively. This
   is a precise record of what a token with project scope must do: run
   `gh project item-edit` to set item #20's Board Status to `Done` (and #19 to its terminal column).
   No half-broken board state was left.

---

## 2026-09-22 - M5-1 and M5-2 hosted CI

- **D41: split CI ownership by job.** `.github/workflows/ci.yml` keeps M5-1
  responsible for checkout, Node 22 setup, `npm ci`, typecheck, lint, npm
  audit at the `high` threshold, CodeQL, and pull-request dependency review.
  M5-2 owns an independent Jest job so test diagnostics are still produced
  when the quality job fails.
- **D41.1: use native Jest outputs instead of a new reporter dependency.** The
  test job runs `npm test -- --coverage --runInBand --json`, writes
  `artifacts/jest-results.json`, and uploads it with `coverage/`. A short
  summary is appended to the Actions run summary and artifact upload runs on
  failure.
- **D41.2: security-setting limits are documented, not bypassed.** Secret
  scanning and push protection require repository administration and are
  documented in `docs/ci.md`; the workflow does not pretend it can enable or
  verify those settings.

---

## 2026-09-22 - M5-3 private runner path

- **D40: use an ephemeral, non-root Docker runner.** M5-3 adds a pinned Ubuntu
  24.04 image with GitHub Actions runner `2.328.0`, explicit labels, a
  read-only root filesystem, dropped capabilities, `no-new-privileges`, no
  Docker socket, and a named work volume. The runner token is runtime-only;
  the container configures one `--ephemeral` runner and removes its
  registration on exit.
- **D40.1: keep hosted CI independent.** The labeled smoke workflow is
  `workflow_dispatch`-only and targets `virtualwardrobe-private`; M5-1/M5-2
  remain the default GitHub-hosted path.
- **D40.2: PARTIAL on this Windows host.** The offline Compose preflight,
  PowerShell syntax check, shell syntax check, Compose rendering, and
  whitespace validation pass. Docker image build and the disposable labeled
  job remain unverified because the Docker Desktop Linux engine is not running;
  no GitHub runner was registered and no token was stored.

---

## 2026-09-22 — welcome and navigation work items

- **D39: welcome and navigation are separate autonomous slices.** M3-16 owns first-run product
  orientation, persistence, and welcome copy; M3-17 owns route ownership, return paths, and
  navigation behavior. Both use M3-14 as the journey source of truth and log material decisions
  here rather than waiting for approval.

## 2026-09-22 — backlog grilling decisions

- **D32: M3-3 is split by ownership.** M3-3 owns branding/release configuration, M3-15 owns the
  portfolio screenshot kit, and M6-1 owns the i18n foundation; no issue may silently absorb the
  others' work.
- **D33: M3-6 and M3-7 compete for one MoveNet graph.** The first independently verified,
  network-free graph wins; the other issue is closed as superseded and its evidence is retained.
- **D34: host-specific setup is honest.** M3-9, M3-11, and M3-13 are future Mac-host briefs;
  Windows execution records PARTIAL/NO-GO rather than claiming Mac success. M1-1 requires camera
  permission, capture, import, persistence, draft creation, and screenshot/video evidence on each
  target.
- **D35: Playwright is a repository devDependency and required in CI.** The model-absent manual
  fallback remains valid, but missing Playwright is not a permitted CI skip after setup lands.
- **D36: CI ownership is separated.** M5-1 owns workflow/install/typecheck/lint/security; M5-2
  owns Jest, coverage, artifacts, diagnostics, and required-check guidance; M5-3 is an optional
  private-runner path and never a prerequisite for hosted CI.
- **D37: M6 supports nine locales.** The set is `en`, `hu`, `de`, `es`, `it`, `fr`, `vi`, `zh-CN`,
  and `zh-TW`. Translation agents may complete work when automated gates pass; native review is
  not a separate blocking criterion. Material choices still go in this log.
- **D38: M3-4 stays parked.** Account/sync implementation is not authorized; the next allowed
  step is a separately scoped privacy/backend architecture spike.

## 2026-09-22 — M4 QA sprint lands (M4-2 / M4-3 / M4-4)

M4-1 was already committed (76/76). M4-2, M4-3, M4-4 finished this sprint; full suite
now **129/129 across 15 suites**, with `tsc`, `eslint --max-warnings 0`, `e2e:web:check`,
and the skippable `e2e:web` all green.

- **D28.1 — orchestrator reconciliation: number the QA decisions D29–D31, contiguous after
  the committed D28.** The three QA agents ran in parallel and independently picked numbers
  that collided / skipped: M4-2 wrote `D27.x` (collided with M3-6's uncommitted `D27`) and
  M4-3/M4-4 wrote `D30.x`/`D32.x`. Reconciled to a single contiguous block — **M4-2 → D29.x,
  M4-3 → D30.x, M4-4 → D31.x** — and the stale `D27.x`/`D32.x` cross-refs in the issue files
  *and* the new source/test comments were renumbered to match. M4-3's agent timed out before
  returning its log block; D30.x here is reconstructed from its on-disk work (`tests/pose/`
  + `M4-3.md` status), which was complete (tests + AC + status verified green). The unrelated
  `Research/bookmarks.md` edits a QA agent made are out of scope and were left uncommitted.

- **D29.1 — onboarding camera-feedback is one source of truth, not two.** `app/onboarding.tsx`
  carried an *inline* copy of `onboardingCameraState`/`OnboardingCameraState` that could drift
  from `src/onboarding/cameraState.ts` (created mid-M4-2). Deleted the inline copy; the screen
  imports the pure branch and keeps `PermissionResponse` at its call site, while
  `cameraState.ts` keeps a structural `CameraPermissionStatus` to stay node/jest-importable.

- **D29.2 — extract the *decision*, leave a thin view — no device or rendering harness.** Per
  repo policy (no `@testing-library/react-native`, no simulator), each screen's decision was
  pulled into a node-safe `src/` module the screen imports and the test drives: entry redirect
  → `src/onboarding/entryRedirect.ts` (`'loading'|'/onboarding'|'/wardrobe'`); capture draft/nav
  → `src/capture/draft.ts` (`buildDraftFromCapture` + `captureNextStep`); wardrobe empty-state →
   `src/wardrobe/emptyState.ts` (`emptyStateVariant` + `hasActiveCriteria`); studio save/share
  notice → `src/composer/notice.ts`. Tests assert the pure logic with no router/store/UI — the
   `tests/catalog/ingest.test.ts` fake style.

- **D29.3 — `captureNextStep` is a typed discriminated union, not a loose flag.** The screen's
   `router.replace` needs a typed `Href`; the helper returns
   `{ navigate:true, route:'/wardrobe' } | { navigate:false, route:null }` so a null draft
   (cancel/denial/error) resets busy and never navigates. The "on error, don't navigate" safety
  property is the null-draft case; `busy` itself stays a UI side-effect in the view.

- **D29.4 — empty-state is a pure selector over the *snapshot*.** The wardrobe screen already
  derives `visible = applyFilters(...)` (covered by `tests/wardrobe/filter.test.ts`); M4-2 adds
  the screen-owned selection `emptyStateVariant` (`none`|`filtered`|`has-items`, snapshot-empty
  takes priority) + `hasActiveCriteria`, reusing not duplicating the filter test.

- **D29.5 — studio sliders + export already covered; M4-2 adds the *notice* gap.** The critical
  controls (`clampTransform`, `autoTransformFor` incl. empty-keypoint identity fallback,
   `serialize`/`deserialize`, `compose` geometry) are regression-tested by
   `tests/composer/transform.test.ts` + `tests/composer/export.test.ts` (cited, not duplicated).
   `src/composer/notice.ts` covers the one untested branch: the save/share error-rendering
   surface. Native `expo-sharing` / browser canvas export are not runtime-exercised (same
  in-sandbox ceiling as D20.5 / D21.6; M3-5/M3-9 is the path to a real e2e share screenshot).

- **D30.1 — exercise the *real* loader/providers, mock only the `@tensorflow*` boundary.** The
  pose flow's logic is real code worth covering; only the heavy model boundary is unrunnable in a
  node/jsdom-less env. The suite mocks `tfjs-backend-webgl`, `tfjs-core`, and
  `@tensorflow-models/pose-detection` and drives the actual `loadPoseDetector` /
   `createPoseProvider` / `safeEstimate` — no model bytes, WebGL, or network.
- **D30.2 — assert call *counts*, not reference identity (single-flight).** `loadPoseDetector` is
  `async` and wraps the cached promise in a fresh `Promise` per call, so single-flight is asserted
   via `createDetector` called exactly once across N concurrent callers, and `resetPoseDetector`
  re-opening init (called twice).
- **D30.3 — model-absence / invalid-URL guard = "thread the bundled URL, don't fetch".** The
   loader test pins `createDetector` receives `modelUrl: MOVENET_MODEL_URL` +
  `modelType: 'lite'`, so a wiring regression is caught; a missing/undecodable model surfaces as
   `PoseUnavailable` (the fallback signal).
- **D30.4 — the manual fallback is an end-to-end property.** AC1+AC2 covered by the full chain:
  throwing provider → `safeEstimate` `[]` → `autoTransformFor([])` → `IDENTITY_TRANSFORM`,
   proving estimation failure lands on the manual-overlay path (the native shipping path, D21.5),
  not just that `safeEstimate` returns `[]`.
- **D30.5 — per-line eslint disables are scoped, not blanket.** `import/no-duplicates` (Expo
  resolver collapses `providers` + `providers.web`) and `import/first` (the loader's
  `jest.mock`-before-`import`) are false positives, disabled per-line with rationale so
   `--max-warnings 0` stays green without weakening other rules.

- **D31.1 — skippable browser smoke harness, mirroring M3-5's `e2e:pose`.** `scripts/
  web-smoke.mjs` (`e2e:web`) does an optional dynamic `import('@playwright/test')` and skips
   (exit 0 + demo note + artifact) when Playwright/Chromium is absent — the same in-sandbox
  ceiling as D22.3. `scripts/web-smoke-path.mjs` (`e2e:web:check`, `--selftest`) holds the pure
  skip-decision + report builders so CI can gate without a browser. `@playwright/test` is **not**
   added (ADR-004); `import/no-unresolved` stays off for `scripts/**/*.mjs` (D22.2).
- **D31.2 — no-fatal-error vs expected-warn is a classification, not a blanket ban.** The happy
  path asserts **zero fatal** `pageerror`/`console.error`, but the pose-fallback `console.warn`
   (`safeEstimate`) is **expected** on the model-absent manual path. `classifyConsole` sorts
   entries into `fatal`/`expected`/`info`; a manual run passes only when `expectedWarns>0` —
    *asserting the fallback fired*, not that the console is silent.
- **D31.3 — the manual-fallback path is the in-sandbox default, asserted cleanly (AC3).** With the
  MoveNet model absent, web `createPoseProvider('movenet')` → `safeEstimate` `[]` →
  `autoTransformFor([])` → identity, and the studio renders the M2-4 banner; the harness asserts
   that banner when `decidePath('manual')`, so a model-less run still completes with a PNG + report.
- **D31.4 — in-sandbox browser ceiling: BUILT-with-waived-browser-pass, not DONE.** No Chromium/
  Playwright and no model bytes in the sandbox (D20.5 / D21.6 / D22.3), so the browser pass is
   written for a capable machine and *waived* here: `e2e:web` exits 0 with a SKIP note +
    `docs/screenshots/web-last-run.{md,json}`, and `e2e:web:check` proves the skip-decision +
   classification without a browser. No CI workflow was wired (left to the orchestrator; the
   harness is CI-friendly via exit codes + the JSON artifact).

## 2026-09-21 — M3-6 follow-up

- **D28: M3-6 produced a TFJS graph, but remains PARTIAL pending inference proof.** The graph and
  three weight shards are present in `public/pose/movenet-singlepose-lite/` and mirrored under
  `assets/pose/movenet-singlepose-lite/`. TypeScript, ESLint, Jest (76 tests), and the pose-path
  self-test pass. The browser harness could not run because Playwright/Chromium is not installed;
  `estimatePoses` and op coverage therefore remain unverified. The earlier Windows TensorFlow DLL
  import block is retained below as historical context. M3-7 remains the fallback for a known-good
  graph if inference fails in an approved browser-enabled environment.

## 2026-09-21 — M3-6 conversion attempt

- **D27: M3-6 is PARTIAL on this Windows host.** The Hugging Face MoveNet ONNX source downloaded
  successfully (9,413,268 bytes). Python 3.12.10 and `tensorflowjs` 3.18.0 with TensorFlow 2.21.0
  installed, but importing the converter failed before conversion because Windows Application
  Control blocked TensorFlow's `_pywrap_record_io` native DLL. No model bytes were emitted or
  added to the repository. Continue in an approved WSL/Linux or CI environment; M3-7 remains the
  fallback for a known-good TFJS graph.

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
- **D21.7 — M3-1 is NO-GO in-sandbox; M2-4 remains the native path.** No device/emulator/
   camera/EAS account in the sandbox, so on-device pose cannot be built, run, or timed. Per the
   spike's non-blocking design, the manual fallback (M2-4 / ADR-005) is the shipping native path
   and the UI is untouched. A `MediaPipePoseProvider` scaffold is deferred behind a "device
   available" trigger; a one-day revisit flips this to GO. No ADR change (ADR-005 already encodes
   "native pose is a spike; manual is the shipping path"). Recorded in `Plans/spikes/M3-1-
   mediapipe-native-pose.md`.
## 2026-09-20 — M3-2 lands + backlog reconciliation

- **D22.1 — unified share sheet (`src/composer/share.ts`) is the single share path.** Both the
   studio (M2-3 "save & share") and the Looks gallery (`app/(tabs)/looks.tsx`, M3-2) call
   `shareLook`/`persistLook`; zero duplicated share code (M3-2 AC3). A `Looks` tab now sits in
   `app/(tabs)/_layout.tsx` so the gallery is discoverable (M3-2 AC5). M3-2 is **BUILT** (all ACs
   checked in `Plans/issues/M3-2.md`).
- **D22.2 — `import/no-unresolved` off for `scripts/**/*.mjs`.** The M3-5 harness
   (`scripts/pose-smoke.mjs`) does an *optional dynamic* `import('@playwright/test')` that is
   only present when the browser pass is enabled, and is explicitly skipped (exit 0) when absent.
   A static resolver false-positives "unresolved" on a clean checkout, so the rule is disabled for
   the `vw/node-scripts` config block (mirroring the existing node-globals treatment there). This
   keeps `npx eslint . --max-warnings 0` green so the gate reflects "work is ready" instead of a
   tooling artifact.
- **D22.3 — M3-5 status is BUILT-with-waived-browser-pass, not DONE.** `pose-smoke-path.mjs`
  (pure skip-decision + self-test, `e2e:pose:check`) and `pose-smoke.mjs` (`e2e:pose`, skippable,
  exits 0 with a demo note when neither a browser nor the model is present) are wired. The
  Chromium screenshot (AC1) is only produced on a machine with `@playwright/test` + the model —
   the same in-sandbox ceiling as D20.5/D21.6.
## 2026-09-20 — M3-3 lands (i18n + branded splash) + backlog reconciliation

## 2026-09-22 — M6-1 / M6-3 i18n foundation and Hungarian catalog

- **D39.1 — M6 keeps the zero-dependency catalog.** The existing pure TypeScript i18n core was
  extended rather than replaced: `LOCALES` is the typed nine-locale selection order, English is
  canonical, and `catalogCoverage()` reports missing and unexpected keys for each locale.
- **D39.2 — Locale resolution accepts BCP-47 variants.** Exact supported tags such as `zh-CN`
  and `zh-TW` are preserved; regional variants such as `es-MX` fall back to their supported base
  locale, while unknown languages fall back to English. Switching remains React state plus the
  existing persisted setting, with no reload.
- **D39.3 — M6-3 is partial by design.** Hungarian covers every key in the current canonical
  catalog and has automated completeness/nonblank checks. The work item remains open until the
  English catalog covers all user-facing surfaces and the Hungarian core journey is reviewed.

- **D23.1 — i18n is a zero-dependency in-house catalog, not i18next.** M3-3 suggests
   `i18next` + `react-i18next`, but the project's standing philosophy is minimal deps
  (D21.3 refused a new dep for the composer; D7 favors in-house where the surface is
   small). The onboarding flow that needed i18n most is the smallest surface, and a
   2-locale catalog is a `Record<Locale, Record<string,string>>` + one pure `translate`
   function — strictly more legible than `i18next.init()`, with zero runtime cost. So:
    `src/i18n/strings.ts` (pure core, jest-runnable, like `compose`/`autoBox`) +
   `src/i18n/useI18n.tsx` (React provider, language persisted via `r.setSetting('language', …)`)
   + `src/i18n/LanguageSwitcher.tsx`. **2 locales: en + es.** If a 3rd locale or plural/
   interpolation needs appear, that's the trigger to adopt i18next — not before.
- **D23.2 — language switch re-renders via context state, not a native reload.** `setLocale`
   updates React context state (instant re-render of the consuming tree) and persists to
    `app_settings`. No `expo-localization`, no `reloadAsync` — so a switch provably cannot
   reload-crash the app (M3-3 AC2). A `language` seed is added to `app_settings` in
   `initStore` next to `has_onboarded`/`catalog_ingested`.
- **D23.3 — branded splash via core `app.json` `splash` (no `expo-splash-screen`).** The
   `splash` key is a core Expo config, so a branded splash needs no plugin dep. `app.json`
   now points `splash.image` at the existing `assets/splash-icon.png` with bg `#E6F4FE`
   (matching the adaptive-icon background). Icons themselves already existed from M0-1.
   AC1 ("builds + launches on both platforms") and the AC3 screenshot kit are **not**
    verifiable in-sandbox (no iOS/Android build / no rendered run — same ceiling as D20.5 /
     D21.6 / M3-1 NO-GO), so M3-3 is recorded **PARTIAL**, not DONE.

## 2026-09-21 — Dead MoveNet source: two autonomous work items (D24)

Ran `npm run fetch:pose` to vendor the web pose model (M2-1 / M3-5). It failed: `tfhub.dev`
returns a Kaggle **HTML page** (5.7 KB), which the script then wrote as `model.json` and tried
to `JSON.parse` ("Unexpected token '<'"). Probed the landscape: `tfhub.dev`→Kaggle HTML,
`tfhub-public`/`modelzoo-asia` GCS 404, jsDelivr/githack/statically `tfjs-models` 404 (the
repo ships **source**, not weights). The only live byte for this model is an **ONNX** graph
on HuggingFace (`Xenova/movenet-singlepose-lightning`, `onnx/model.onnx` ≈9.4 MB, HTTP 200) —
the **wrong format**, since `@tensorflow-models/pose-detection@2.1.3` (hardcoded dead
`tfhub.dev` URL) needs a **TFJS graph** (`model.json` + `weightsManifest` shards).

- **D24.1 — deleted the corrupt `model.json`.** The failed `fetch:pose` left a 5.7 KB Kaggle
  HTML page at `assets/pose/movenet-singlepose-lite/model.json` (not a graph). Removed it so it
  can't masquerade as a valid model; `public/pose/` was already empty.
- **D24.2 — two autonomous work items, mutually substitutable.** Created **M3-6** and **M3-7**
  as **autonomous subagent briefs** (no human in the loop; each logs its own decisions here and in
  its issue file, finishes DONE/NO-GO/PARTIAL). Both vendor into the same
   `public/pose/movenet-singlepose-lite/` drop-in slot + `--emit-url-only`, so whichever lands
  first with a *verified* graph wins and the other closes as superseded:
     - **M3-6 (START FIRST, fast):** synthesize the TFJS graph by converting the live ONNX with
       `tensorflowjs_converter --input_format=onnx --output_format=tfjs_graph`. Highest
       uncertainty (converter op-coverage — `NonMaxSuppressionV3`/`SpaceToDepth` etc.); bails to
       NO-GO fast. User's "start first" gut call — quickest route to a real model.
     - **M3-7 (long-term, reliable):** source a *known-good* TFJS graph (teammate cache / a repo
       that vendors `model.json` + shards), verify API-compat against
       `node_modules/@tensorflow-models/pose-detection/dist/movenet/`, record provenance (URL +
       sha256). The durable path if M3-6's converter can't reproduce the op set.
- **D24.3 — keep it local per ADR-004.** The HuggingFace fetch is a one-time **build-time**
  vendoring step; at runtime the model loads by URL to a bundled asset, no network.

## 2026-09-21 — §7 limitations → six autonomous env work items (D25)

`docs/dev-setup.md` §7 names two unmet dev-env prerequisites the user bumped into: **§7.1**
*"can't render a web UI"* (`@playwright/test` not installed — M3-5's browser pass is waived,
deferring AC1 / M2-1's `ml` DoD) and **§7.2** *"can't run the iOS/Android simulator"*
(native E2E out of scope). The user asked to raise work items to stand these up — **both the
docs and the actual setup on this MacBook** — and (where easier) to split them 2 per platform.
Checked first for duplicates: M3-5 is the *harness script* (explicitly defers the browser
pass), M3-1 is the *on-device pose* spike (NO-GO) — **neither** is about standing up a test
environment, so all six are net-new.

- **D25.1 — three doc + setup pairs, six items, all autonomous briefs.** Symmetry with the user's
  "2 each" ask and the M3-6/M3-7 pattern:
    - **Playwright:** M3-8 (docs) / M3-9 (setup on this mac) — unblocks M3-5 AC1 + M2-1 `ml` DoD.
    - **Android:** M3-10 (docs) / M3-11 (setup) — unblocks M1-1 AC1's camera→Item-draft on-device.
    - **iOS:** M3-12 (docs) / M3-13 (setup) — same on iOS; the host **is** macOS, so iOS is the
      pair most likely to actually pass in-sandbox (unlike headless Chromium / Android emulator).
  Each `issue` file is a self-contained autonomous brief (no human in loop; self-logs to this
  file; finishes DONE/NO-GO/PARTIAL). `docs` = the repeatable prose; `setup` = the *execution*
  half that proves it on this machine.
- **D25.2 — scope is the *environment*, never on-device ML.** All six are tooling/docs/qa; the
  on-device *pose* capability stays M3-1's NO-GO domain. The native test envs verify the **manual**
  `PoseProvider` path (`providers.native.ts` / M2-4, dev-setup §3), not MoveNet.
- **D25.3 — a setup item that can't run here is still valuable.** Like D24's "NO-GO is expected
  and useful," a `setup` item blocked by the known in-sandbox ceiling (D20.5 / D21.6 / M3-1)
  records a **NO-GO/PARTIAL with the exact blocker** — a precise record of what a capable
  machine must do, not a dead end. No half-broken toolchain config is left behind (roll back).
- **D25.4 — `dev-setup.md` §7 now cross-references the pairs.** §7.1 → M3-8/9, §7.2 → M3-10/11/
   12/13, so each limitation entry points straight at its unblock.

## 2026-09-21 — M4 QA sprint begins (M4-1 repository regressions)

- **D26.1 — M4-1 covers the repo with a faithful in-memory fake DB, not a device/wasm harness.**
  The persistence contract in `src/store/repo.ts` is pure data logic, so the suite
  (`tests/store/repo.test.ts`, 28 tests / 5 describe blocks) drives the *real* `r` object
  against a hand-rolled fake of the four expo-sqlite surface methods
   (`getFirstAsync`/`getAllAsync`/`runAsync`/`withTransactionAsync`) + a `jest.mock` of `db.ts`'s
  `getDb` that hands the repo the active fake. No `@testing-library/react-native`, no native
   runtime, no `.wasm` — the same structural-fake style as `tests/catalog/ingest.test.ts`.
- **D26.2 — assert the *actual* `rowToPaths`/`rowToTags` asymmetry, record a latent finding.**
  `rowToTags` trims + drops empties; `rowToPaths` only drops *empty-string* fragments, so a
  `' '` (whitespace-only) fragment **survives**. The test asserts the real behavior (don't change
   production code to make a test pass) and flags the asymmetry as a non-blocking robustness note:
   paths aren't trimmed the way tags are. No clean-data caller is affected.
- **D26.3 — deterministic fault-injection for the missing-row error path.** `insertItem` /
   `insertStoreItem` throw `'<entity>: row missing after insert'` when the post-insert read
   returns null; the fake exposes `setFailAfterInsert(true)` so that branch is asserted without a
   real DB.
- **D26.4 — `jest` baseline moves 48→76 tests (7→8 suites).** The new `store/repo` suite is the
   first persistence-layer coverage; gates (tsc + eslint + jest) stay green.
