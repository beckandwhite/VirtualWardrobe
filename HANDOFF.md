# Session Handoff — VirtualWardrobe (through M2-1)

**Resume point:** M0 (5 issues) + M1 (4 issues) + M2-1 are shipped and green.
Gates: `npx jest` = 27/27 (4 suites), `npx tsc --noEmit` clean,
`npx eslint . --max-warnings 0` clean.

## What just landed (M2-1 `feat(m2-1)` commit)
- `src/keypoints.ts` (M2-1) — pure COCO→named `Keypoint[]` mapper +
  `RawKeypoint` shape; tested in `tests/pose/keypoints.test.ts`.
- `src/pose/MoveNetPoseProvider.ts` (M2-1) — `poseProvider` impl: wraps
   `poseLoader` + `mapKeypoints`, decodes string URI → `HTMLImageElement` on
   web (falls back to raw string when no DOM), throws `PoseUnavailable` on
    failure so `safeEstimate` degrades to manual.
- `src/pose/poseLoader.ts` (M2-1) — single-flight lazy init: dynamic-imports
   `@tensorflow/tfjs-backend-webgl` (side-effect self-registers) + `tfjs-core`
   `setBackend('webgl')` + `@tensorflow-models/pose-detection`
    `createDetector(SupportedModels.MoveNet, { modelType:
   movenet.modelType.SINGLEPOSE_LIGHTNING, modelUrl: MOVENET_MODEL_URL })`.
   `MOVENET_MODEL_URL` imported from committed `src/pose/modelUrl.ts`
    (default `undefined` when unfetched; overwritten by `npm run fetch:pose`).
- `src/pose/modelUrl.ts` (committed, gitignored bytes only) — the single
    `MOVENET_MODEL_URL` export; default `undefined`, `--emit-url-only` rewrites
    it to `'/pose/movenet-singlepose-lite/model.json'` after fetch.
- `src/pose/providers.web.ts` (M2-1) — Expo platform split: web factory
   selects `MoveNetPoseProvider` by default (manual / sample overrides). No
    TF import on native — the split is what keeps `@tensorflow*` out of the
    native Metro bundle.
- `src/pose/providers.native.ts` (M2-1) — thin re-export of
   `providers.ts` (manual default on native).
- `app/studio.tsx` (M2-1) — faint keypoint skeleton overlay (segments + dots at
   `rgba(88,166,255, ...)`, toggleable via a "Skeleton: on/off" button) and a
    "Skeleton" state. Overlay is purely decorative; no interaction.
- `scripts/fetch-movenet.mjs` — downloads the model + weights to
   `public/pose/` (gitignored); supports `MOVENET_URL` env or a URL arg, plus
   `--emit-url-only`. tfhub.dev is known-dead as of 2025-09 — fallback
    documented in `docs/dev-setup.md`.
- `tests/pose/keypoints.test.ts` — pure tests for the mapper (`naming`,
   `confidence floor`, `out-of-range` fallback) and an end-to-end fake-detector
    → provider → `computeGarmentBox` flow.
- `docs/dev-setup.md` — new dev-environment guide.
- GitHub issue [M3-5](https://github.com/beckandwhite/VirtualWardrobe/issues/18) — headless-browser (`Playwright`)
    harness for the `ml` / `spike` DoD.
- GitHub issue [M2-1](https://github.com/beckandwhite/VirtualWardrobe/issues/10) — acceptance criteria marked, decision log D20.1–D20.6,
    status BUILT.
- `Plans/02-product-backlog.md` — status columns + M3-5 + `tooling` label.
- `Plans/decision-log.md` — D20 entry.
- `.gitignore` — ignore `public/pose/**` model bytes but keep `.gitkeep`.
- `package.json` — `fetch:pose` and `gen-placeholders` npm scripts; `expo-sharing`
   added as a dependency (unused yet — M2-3 will use it).

## What's next (in order, per user instruction)
**M2-2 · Auto-scaled garment box + Reanimated fine-tune**
- Tasks per GitHub issue [M2-2](https://github.com/beckandwhite/VirtualWardrobe/issues/11):
   - `computeGarmentBox` is pure + unit-tested already (`src/composer/autoBox.ts`);
     just verify `autoBox` produces sane numbers for the fixture keypoints
      (M0-2's `SAMPLE_KEYPPOINTS`).
- **Reanimated wiring in `app/studio.tsx`:** re-enable
   `react-native-reanimated/plugin` in `babel.config.js` (D19.7), switch the
    overlay from a `PanResponder`-driven `useState<Transform>` to a
   `useAnimatedStyle`/`useSharedValue` transform with `PanGestureHandler`
    (or the Reanimated equivalent on v4) for position; a slider for scale,
    a slider for rotation, a slider for opacity; a `Reset` button that snaps
   the transform back to the auto-derived `computeGarmentBox` output; a live
     composite (body bg + garment foreground) rendered at the current
    transform — keep the keypoint overlay toggle.
- **Serialize:** `serializeTransform` is already on the
   `Transform`/`TryOn` path; add a test asserting JSON round-trips through
    the `TryOn.transform` row.
- **Verify:** `tsc` + `eslint` + `jest`, plus a manual
  `expo start --web` sanity check that the overlay stays smooth (the only
    runtime gate we can fully exercise here, per `docs/dev-setup.md`).
- Commit M2-2, then M2-3, then M2-4, then **one M2 commit** as the user asked.

## After M2-2: skip to M3
**Jump to M3** once M2-2 lands — per the user.
- M3-1 (`[spike] EAS prebuilt + MediaPipe/Tasks pose for native`) is the highest-value
  M3 item — it's the one that may add `on-device` pose.
- M3-2 (saved-looks gallery + export/share sheet) is the user-facing payoff;
   M2-3 already builds the export primitive for it.
- M3-3 (icons / launch screens / i18n / store asset prep) is mostly
   `expo-prebuild` + store-asset prep; can land after M3-2.
- M3-4 ([optional] multi-device sync) — explicitly optional; skip by default.
- M3-5 (Playwright `e2e:pose` harness) — should be done right after M2-2
   lands so the auto-place demo has a real screenshot to attach.
- Before M3 commits, update `Plans/02-product-backlog.md` to mark M2 complete
   and refresh M3 status; keep issue files' `## Status / ## Decision log /
   ## Stats` sections current (the convention established in M1-1 through M2-1).
- **Commit one M2 commit at the end of M2 work** — the user explicitly asked
   for that consolidation.

## Open follow-ups (not blockers, noted for the M2 window)
- GitHub issue [M2-1](https://github.com/beckandwhite/VirtualWardrobe/issues/10) "No `@tensorflow*` in native bundle" acceptance
   (AC3): not mechanically verified this session (no native build here).
   The platform file split (`providers.web.ts` vs `providers.ts`) and the
    dynamic `import()` in `poseLoader.ts` are the design; a
  `expo export --platform ios` dry-run would close it. Flag in M2-2's commit
   note.
- `src/pose/poseLoader.ts` line `await setBackend('webgl')` is wrapped in a
   `try/catch` that warns (doesn't throw) when webgl is missing
   (jsdom / CI / headless). `@tensorflow/tfjs-core` will fall back to CPU
    on web automatically, so it's safe — but the comment says `CPU fallback is
   automatic` rather than listing the fallback path explicitly. Minor.
- `docs/dev-setup.md` §2 (dead tfhub.dev) — if a working mirror of
  `MoveNet-SinglePose-Lite` surfaces, capture it in the doc (currently no
    canonical source).
- M3-5 (new backlog) is the right home for the `ml` DoD screenshot gap; until
   it lands, every `ml` issue's "screenshot" DoD is **waived** by convention
    (see M2-1's status note).

## Known-good invariants
- `Keypoint.name: string | number` (changed from `string` in M2-1 because
   `mapKeypoints` falls back to the numeric index past COCO_17). The
   `autoBox.test.ts` filter was patched to `String(k.name).includes('hip')`.
- `providers.ts` (generic, native default) + `providers.web.ts` +
   `providers.native.ts` (re-export of `providers.ts`) — never collapse these
     three into one file; that would pull TF into the native bundle.
- `MOVENET_MODEL_URL` lives in `src/pose/modelUrl.ts`, gitignored. The
   committed default is `undefined`; the `--emit-url-only` mode overwrites it.
- Gates are run after every change via `npx jest + npx tsc --noEmit +
  npx eslint . --max-warnings 0`.

## Build / verify
- `nvm use 22` first — Node 26 breaks `create-expo-app` (ADR-010).
- `npx jest` should print `27/27 passed, 4 suites`.
- `npx tsc --noEmit` should print nothing.
- `npx eslint . --max-warnings 0` should print nothing.
- `npm run fetch:pose` will try the canonical URL — likely fails (tfhub dead).
  See `docs/dev-setup.md` §2 for the three fallback options.

## Files touched this session
- New: `src/pose/MoveNetPoseProvider.ts`,
   `src/pose/poseLoader.ts`, `src/pose/providers.web.ts`,
    `src/pose/providers.native.ts`, `src/pose/modelUrl.ts`,
      `tests/pose/keypoints.test.ts`, `docs/dev-setup.md`,
      GitHub issue M3-5, `scripts/fetch-movenet.mjs`,
        `public/pose/movenet-singlepose-lite/.gitkeep`,
         `assets/pose/movenet-singlepose-lite/.gitkeep`
- Modified: `src/pose/types.ts` (`Keypoint.name` union),
     `src/pose/providers.ts` (generic factory, manual default),
      `app/studio.tsx` (skeleton overlay, `showSkeleton`),
       `.gitignore` (ignore `public/pose/**` bytes), `package.json`
        (`fetch:pose`, `gen-placeholders`, `expo-sharing` dep),
         `tests/autoBox.test.ts` (one filter patched for the union),
          GitHub issue M2-1 (acceptance + D20 + status),
           `Plans/02-product-backlog.md` (status cols, M3-5, `tooling`),
            `Plans/decision-log.md` (D20 entry).
