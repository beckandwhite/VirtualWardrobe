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
options, in order of preference:

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

## 7. Dev environment limitations

The current dev setup can't:
- Render a web UI (no browser in the sandbox) — M2-1's "attach a screenshot"
  DoD is therefore not runnable here. Tracked in
  `Plans/issues/M3-5-dev-env-playwright.md`.
- Run the iOS/Android simulator — same story.
- Talk to the canonical tfhub.dev URL (the endpoint is dead).

The **M3-5** issue proposes a Playwright-based harness that runs the web
build, loads a fixture body photo, runs MoveNet, and screenshots the result.
Until M3-5 lands, the M2-1 screenshot DoD is waived per user request; a one-run
demo note can be attached when the model is manually fetched.
