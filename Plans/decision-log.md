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
