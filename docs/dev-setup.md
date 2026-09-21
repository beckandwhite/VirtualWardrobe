# Dev Setup

Getting the app to run **offline** (ADR-004), including the web MoveNet pose
model.

## 1. Install

```bash
nvm use 22            # see .nvmrc / ADR-010 — Node 26's create-expo-app is broken
npm install
```

## 2. Web pose model (MoveNet-SinglePose-Lite)

The web studio's auto-drape runs **MoveNet-SinglePose-Lite** (TF.js,
`@tensorflow-models/pose-detection`). To keep it local per ADR-004, the model
bytes are downloaded **once** into the repo and loaded from a bundled URL — no
runtime network. The bytes are **gitignored** (`public/pose/`,
`src/pose/modelUrl.ts`); a fresh checkout must fetch them.

### Download the model

```bash
npm run fetch:pose     # downloads ModelNet-SinglePose-Lite into public/pose/
                      # and generates src/pose/modelUrl.ts pointing at it.
```

### The canonical source is dead — what to do

As of 2025-09 `tfhub.dev` 302-redirects to Kaggle and the old GCS
`tfhub-public` bucket no longer exists, so `npm run fetch:pose` may fail. Three
options, in order of preference (the two active autonomous briefs are
**M3-6** "synthesize TFJS from the live ONNX, start first" and **M3-7**
"vendor a known-good TFJS graph" — see `Plans/issues/` + `Plans/decision-log.md` D24):

1. **Find a mirror and hand-fetch it:**
   ```bash
   MOVENET_URL=https://<mirror>/movenet-singlepose-lightning npm run fetch:pose
   ```
   Any URL serving a tfjs graph with `model.json` + its `weightsManifest`
   binaries works. The script pulls the binaries via the manifest and copies
   them into `public/pose/`.

2. **Hand-place the model, then regenerate the URL file:**
   Drop a MoveNet-SinglePose-Lite tfjs graph at
   `public/pose/movenet-singlepose-lite/` (any source, e.g. one a coworker sent
   you), then:
   ```bash
   node scripts/fetch-movenet.mjs --emit-url-only
   ```

3. **Skip it** — web still works, but the MoveNet branch throws on first use
   and the studio falls back to the **manual** fallback path, the same path
   native ships. No user-facing breakage.

## 3. Platform-specific bundling

The TF.js + pose-detection packages are imported only via `providers.web.ts`'s
dynamic `import()` in `poseLoader.ts` — Metro on iOS/Android resolves
`providers.ts` (manual), not `providers.web.ts`, so `@tensorflow*` is **excluded
from the native bundle** (M2-1 acceptance criteria).

## 4. Verify

```bash
npm run web     # Expo dev server. Load /studio, pick a body photo.
```
Expected: the studio loads on web, MoveNet auto-places a garment if the model
is present, the skeleton overlay shows, and you can drag/scale/rotate/opacity +
Save. If MoveNet wasn't fetched (option 3), the status text reads "adjusting
manually" and the controls behave identically.

## 5. Tests

```bash
npx jest              # unit tests — see tests/ for suites
npx tsc --noEmit      # typecheck
npx eslint . --max-warnings 0
```

## 6. Catalog (M1-4)

`npm run fetch:catalog` re-generates category placeholder PNGs from
`scripts/gen-placeholders.mjs`. `assets/store.json` is the source of truth;
ingestion into SQLite happens at boot and is idempotent under `catalog_ingested`
flag (see `src/catalog/ingest.ts`).

## 7. Dev environment limitations (M3-5)

The current dev setup can't — each now has unblocking work items (autonomous briefs in
`Plans/issues/`, 2026-09-21, D25):

- **Render a web UI (no browser in the sandbox).** `@playwright/test` is not installed;
   even then, the harness below is **skippable** when the model bytes are absent, so CI
  stays green in a clean checkout. → **M3-8** (docs) / **M3-9** (install + run here).
- **Run the iOS/Android simulator.** Same story; native E2E (Expo Go / Detox) is out of
   scope for M3-5. The test *environment* is now in scope for two pairs (doc + setup):
    **M3-10**/**M3-11** (Android emulator + device) and **M3-12**/**M3-13** (iOS Simulator).
     On-device *pose* stays the M3-1 NO-GO spike; these items stand up the env, not the ML.
- **Talk to the canonical `tfhub.dev` MoveNet URL (302→Kaggle; see §2).** The
    `fetch:pose` script has a fallback; a model-absent run still produces a PNG of the
   manual-fallback path. → **M3-6** (synthesize TFJS from the live ONNX, *start first*) /
    **M3-7** (vendor a known-good TFJS graph, long-term). See §2 options + D24.

### M3-5 harness (`npm run e2e:pose`)
- **Script:** `scripts/pose-smoke.mjs` — a thin Playwright runner that drives
   `expo start --web` through a fixture body photo + catalog garment, waits for
   MoveNet auto-place *or* the "Auto-drape unavailable — adjusting manually"
    banner (assert on the status text), and captures a PNG to
   `docs/screenshots/studio-<ts>.png`.
- **Skip logic:** the harness detects `process.env.MOVENET_MODEL_URL` *and* the
    presence of `public/pose/movenet-singlepose-lite/`. When either is missing,
    the run asserts the **manual-fallback** path instead of failing, so CI is
    green on a clean machine (ADR-004: the model is an enhancement, not a gate).
- **Pure decision, jest-testable:** `scripts/pose-smoke-path.mjs` exports
   `decidePath({ modelUrl, modelDir })` — a pure function returning `'auto'` or
   `'manual'`. That's the one thing we can unit-test in the sandbox; the actual
    `e2e:pose` run is a one-line `node scripts/pose-smoke.mjs` and is deferred
   to a browser-available machine (M3-5 AC1 deferred for the same reason as
    M2-1's screenshot DoD; no `@playwright/test` installed yet).
- **Demo note auto-gen:** after a run, the script writes
   `docs/screenshots/last-run.md` with the path + the captured PNG filename.

