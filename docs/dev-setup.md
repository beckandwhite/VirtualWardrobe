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
`@tensorflow-models/pose-detection`). Per ADR-004 the model runs **fully local,
no runtime network**. The canonical known-good TFJS graph is **committed to the
repo** under `assets/pose/movenet-singlepose-lite/` (M3-7), so a fresh clone
needs **no download** and **no mirror**. `src/pose/modelUrl.ts` is a committed
static constant pointing the loader at `/pose/movenet-singlepose-lite/model.json`.

### Stage the model for the web dev server

Expo's web dev server serves `public/`, which is gitignored for the model bytes.
`npm run fetch:pose` is a **local copy step** (not a download): it copies the
committed bytes from `assets/pose/` into `public/pose/`.

```bash
npm run fetch:pose     # copies assets/pose/ -> public/pose/ (idempotent, no network)
```

### Verify the wiring

```bash
npm run verify:pose    # loads the vendored graph network-free and asserts 17 COCO keypoints
```

`verify:pose` loads the graph from `public/pose/` on the CPU backend with `fetch`
stubbed to on-disk bytes (a runtime network call is impossible), runs a forward
pass on the bundled body-photo fixture, and exits 0 when 17 COCO keypoints come
back. Run `npm run fetch:pose` first so `public/pose/` is populated.

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
  stays green in a clean checkout. → **M3-8** (docs, see [§8](#8-web-test-environment-playwright-m3-8)) /
   **M3-9** (install + run here).
- **Run the iOS/Android simulator.** Same story; native E2E (Expo Go / Detox) is out of
   scope for M3-5. The test *environment* is now in scope for two pairs (doc + setup):
    **M3-10**/**M3-11** (Android emulator + device, see [§9](#9-android-test-environment-m3-10)) and
     **M3-12**/**M3-13** (iOS Simulator, see [§10](#10-ios-test-environment-m3-12)).
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

## 8. Web-test environment (Playwright) (M3-8)

Stands up the browser-driven test env the [§7.1](#7-dev-environment-limitations-m3-5)
"render a web UI" limitation blocks. This section is the **doc**; the actual install +
run on a browser-capable machine is **M3-9**.

### Install

Playwright is a **devDependency only** — it never enters the app bundle, so ADR-004's
minimal-deps / offline runtime stance is unaffected (nothing here ships to users):

```bash
npm i -D @playwright/test            # test-only; not a runtime dep (ADR-004)
npx playwright install --with-deps chromium
```

- **Browser download** (`npx playwright install chromium`) pulls a pinned Chromium build
  into Playwright's cache on all platforms.
- **`--with-deps`** additionally installs the **OS-level shared libraries** Chromium needs.
  It **matters on Linux** (Debian/Ubuntu CI images are missing libs like `libnss3`,
  `libatk`, `libgbm` out of the box) and runs `apt-get` under the hood — it may prompt for
  `sudo`. On **macOS** (this host) and **Windows** it is effectively a no-op: the browser
  ships self-contained, so `npx playwright install chromium` alone is enough there.
- Pin to `chromium` only — the harness targets one engine; skip `firefox`/`webkit` to keep
  the download minimal.

One-time OS browser deps, per platform:

- **macOS:** none — Chromium is self-contained. (This is the host; web is the most
  reproducible target here modulo the no-display sandbox.)
- **Linux:** `npx playwright install-deps chromium` (or `--with-deps` above); on a truly
  headless box also ensure an Xvfb/`--headless` path.
- **Windows:** none — self-contained; run from a normal (non-admin) shell.

### How the M3-5 harness attaches

The harness dynamically imports Playwright and manages the Expo web server itself:

- `npm run e2e:pose` runs `scripts/pose-smoke.mjs`, which spawns `expo start --web` (non-blocking),
  polls until the server is ready, then drives it through a fixture body photo + catalog garment
  (see [§7](#7-dev-environment-limitations-m3-5)'s "M3-5 harness"). It does an **optional dynamic
  `import('@playwright/test')`** so a clean checkout without the dep still lints and runs (browser
  pass skips cleanly, exit 0).
- That dynamic import is why `eslint.config.js` carries an `import/no-unresolved: 'off'`
  carve-out scoped to `scripts/**/*.mjs` (the `vw/node-scripts` block). **Keep that
  carve-out** — removing it re-introduces a false-positive "unresolved" lint error on any
  machine where `@playwright/test` isn't installed.
- **Note (M3-9, 2026-09-27):** the harness was fixed on its first real run — the Playwright
  presence check previously imported the package *directory* as a `file://` URL
  (`ERR_UNSUPPORTED_DIR_IMPORT`, always skipped the browser pass) and the server launch used a
  blocking `execSync`. Both are corrected (bare-specifier `import('@playwright/test')` +
  `spawn`/wait/`finally`-teardown). If `npx playwright install chromium` times out on the
  Playwright CDN, `curl` the Chrome-for-Testing build from the public GCS bucket into the
  `~/Library/Caches/ms-playwright` cache (the **headless-shell** build is also required for a
  headless `chromium.launch()`).

### Run and expected output

```bash
npm run e2e:pose            # node scripts/pose-smoke.mjs
```

Expected artifacts:

- A screenshot at `docs/screenshots/studio-<ts>.png` (`<ts>` is a run timestamp).
- A regenerated `docs/screenshots/last-run.md` recording the path taken + the captured PNG
  filename.

### Verify and skip behavior (do not regress the skippable contract)

The harness is **skippable by design** (ADR-004: the MoveNet model is an enhancement, not a
gate), decided by `scripts/pose-smoke-path.mjs`'s pure `decidePath({ modelUrl, modelDir })`:

- **Model present** — `MOVENET_MODEL_URL` set **and** `public/pose/movenet-singlepose-lite/`
  exists → **auto** path: asserts MoveNet auto-place, captures the PNG.
- **Model absent** — either missing → **manual** path: asserts the "Auto-drape unavailable —
  adjusting manually" banner and **exits 0** (still captures a PNG of the manual-fallback
  path). CI stays green on a clean machine.

`npm run e2e:pose:check` runs the pure `decidePath` selftest — the one piece unit-testable
without a browser.

### Gotchas

- `@playwright/test` stays a **devDependency**; never move it to `dependencies`.
- On Linux CI, a missing `--with-deps` surfaces as a Chromium launch failure (missing
  `.so`), not a Playwright install error — install the OS deps first.
- No display → run headless (Playwright's default) or under Xvfb; the sandbox has no browser
  at all, which is why M3-9 defers the real run to a browser-capable machine.
- Keep the eslint `scripts/**/*.mjs` `import/no-unresolved` carve-out (see above).
- Don't commit the Chromium cache or `node_modules`; screenshots under `docs/screenshots/`
  are the shareable artifact.

## 9. Android test environment (M3-10)

Stands up the Android test env the [§7.2](#7-dev-environment-limitations-m3-5)
"run the iOS/Android simulator" limitation blocks. This is the **doc**; the actual
emulator/device run is **M3-11**. It verifies the **manual** native pose path
(`src/pose/providers.ts` — Metro's `.native` resolution slot, the M2-4 no-ML path),
**not** MoveNet. On-device ML (MediaPipe / MoveNet re-scope) is **explicitly OUT** — that's
the **M3-1** spike, which is **NO-GO in-sandbox** (see backlog #14 / D21.7).

### Toolchain

- **Android Studio** (bundles the SDK, an AVD manager, and system images), or the
  command-line SDK via **`sdkmanager`**:
  ```bash
  sdkmanager "platform-tools" "emulator" "platforms;android-34" \
    "system-images;android-34;google_apis;arm64-v8a"
  avdmanager create avd -n vw_pixel -k "system-images;android-34;google_apis;arm64-v8a"
  ```
- **Emulator vs physical device:** an AVD is the reproducible default; a physical device over
  USB (`adb devices`, USB debugging on) is faster and better for camera-path smoke since the
  emulator's synthetic camera is limited.

### Launch

- **Expo Go baseline** (no native custom code):
  ```bash
  npx expo start --android      # opens the app in Expo Go on the running emulator/device
  ```
- **EAS prebuilt / preview** when native custom code is needed (e.g. a config plugin or a
  native module Expo Go can't host):
  ```bash
  eas build --profile preview --platform android
  ```
  See **M3-1** for the EAS prebuilt flow — not reproduced here.

### Performance

- **Apple Silicon** (this host is macOS/arm64) needs the **`arm64-v8a` system image**; there
  is **no x86 HAXM/KVM** acceleration path on Apple Silicon, so pick ARM images.
- The emulator has a real **speed ceiling** for pose/timing-sensitive checks — treat timing
  assertions as advisory on an emulator; prefer a physical device when timing matters.

### Test surface

- Drives **M1-1**'s camera → Item-draft acceptance criterion as a **manual smoke** today:
  launch, open the camera, capture, confirm an Item draft is produced.
- **Detox / instrumented E2E** are **future / out of scope** here — this item stands up the
  environment, not an automated native suite.

### Gotchas

- **First build is slow** (Gradle + system-image cold start); subsequent runs are cached.
- `eas build` requires **`eas login`** and an Expo account.
- Set the emulator **GPU mode** appropriately (`-gpu swiftshader_indirect` on headless hosts,
  hardware GPU on a desktop) — the wrong mode shows a black/blank surface.
- Scope stays the **manual** native path; MoveNet/MediaPipe on-device is **M3-1 NO-GO**, not
  this item.

## 10. iOS test environment (M3-12)

Stands up the iOS test env the [§7.2](#7-dev-environment-limitations-m3-5) "run the
iOS/Android simulator" limitation blocks. This is the **doc**; the actual Simulator run is
**M3-13**. Like [§9](#9-android-test-environment-m3-10) it verifies the **manual** native pose path
(`src/pose/providers.ts` — the M2-4 no-ML path), **not** MoveNet; on-device ML re-scope
(MediaPipe / MoveNet) is **explicitly OUT** as the **M3-1** NO-GO spike (#14 / D21.7).

**This host IS macOS**, so iOS is the native platform **most likely to pass** here (Xcode +
Simulator run natively; no cross-arch emulation needed).

### Toolchain

- **Xcode** (from the App Store) + at least one recent **iOS Simulator runtime** (installed
  via Xcode → Settings → Components, or `xcodebuild -downloadPlatform iOS`).
- **Command-line tools** (`xcode-select --install`) and the Simulator CLI **`xcrun simctl`**.

### Launch

- **Expo Go on the Simulator baseline** (no native custom code):
  ```bash
  npx expo start --ios          # boots a Simulator and opens the app in Expo Go
  ```
- **EAS prebuilt / preview** when native custom code is needed:
  ```bash
  eas build --profile preview --platform ios
  ```
  See **M3-1** for the EAS prebuilt flow — not reproduced here.

### Simulator choice

```bash
xcrun simctl list devices           # available devices + runtimes
xcrun simctl boot "iPhone 16"       # boot a specific model
open -a Simulator                   # show the Simulator window
```

- Pick a concrete **iPhone model + iOS version** (e.g. iPhone 16 / iOS 18) for reproducibility.
- **GPU/rendering:** the Simulator uses the host GPU via Metal — rendering is fast, but it is
  **not** a substitute for on-device GPU perf.
- **Headless vs visible:** `simctl boot` runs headless; `open -a Simulator` attaches the
  visible window. CI can drive `simctl` headless; local smoke usually wants the window.

### Test surface

- Drives **M1-1**'s camera → Item-draft acceptance criterion as a **manual smoke** today.
  Note the Simulator has **no real camera** — use a still image / photo-library pick for the
  capture step, or a physical device for a true camera path.
- **XCUITest / automated E2E** are **future / out of scope** here.

### Gotchas

- **Download size:** Xcode plus an iOS runtime is a multi-GB download — budget disk + time.
- **Device signing:** a free Apple ID works for the Simulator; a **physical** device needs a
  signing team (`eas build` handles credentials for EAS builds).
- **First build is slow** (native compile / Simulator cold boot); later runs are cached.
- Scope stays the **manual** native path; MoveNet/MediaPipe on-device is **M3-1 NO-GO**.


