# Portfolio demo path & screenshot kit (M3-15)

A small, reproducible set of screenshots that walks the VirtualWardrobe journey,
plus the exact command, viewport, and app state behind each image. Screenshots
and this doc only — branding (M3-3) and localized copy (M6-1) are out of scope.

## Reproduce the whole set

```bash
npm run screenshots      # alias for: node scripts/screenshot-kit.mjs
```

The script (`scripts/screenshot-kit.mjs`) reuses the M3-5 `pose-smoke.mjs`
pattern: it `spawn`s `expo start --web --port 8081` (env `BROWSER=none CI=1`),
fetch-polls until the dev server answers, launches Chromium via Playwright at a
fixed viewport, visits each route, waits on a stable on-screen anchor string, and
writes one PNG per screen under `docs/screenshots/`. Teardown (browser close +
server kill) runs in a `finally`. If `@playwright/test` is not installed the run
skips cleanly with exit 0.

- **Viewport (all images):** 390 x 844 CSS px, `deviceScaleFactor: 1` (a
  phone-ish portrait frame so the web build reads as the mobile app).
- **App state (all images):** a clean local Expo **web** run. On web the
  `expo-sqlite` store init / catalog ingest does not complete, so the own-clothes
  grid, the catalog section, and saved looks render their **empty states**. The
  pose auto-path is unavailable on web (`@mediapipe/pose` is not bundled), so the
  studio renders its honest **manual-fallback** path. These are the real,
  reproducible states of a clean web run, not staged fixtures.

## The journey: wardrobe → saved / shared look

1. **Onboarding / welcome** — first-run orientation: what the app is, the
   four-step workflow (add → try on → adjust → save/share), and the honest note
   that automatic placement may be unavailable.
2. **Gallery / wardrobe** — the browse surface: search + category/color filters
   over your own clothes, with the embedded **Catalog** section below (M7-2b
   consolidated the catalog into this one scroll). "Try on" on any item deep-links
   into the studio.
3. **Studio** — the try-on composer: pick a body photo and a garment, then
   scale / rotate / opacity sliders position the garment. Shown here on the manual
   path ("Auto-drape unavailable — adjusting manually"). "Save & share" persists
   the look and opens the share sheet.
4. **Saved / shared look** — the Looks gallery of saved try-ons; each card can be
   re-shared or reopened back into the studio.

## Images

| # | Screen | File | Route | Anchor waited on | State captured |
|---|--------|------|-------|------------------|----------------|
| 1 | Onboarding / welcome | [`kit-onboarding-welcome.png`](./kit-onboarding-welcome.png) | `/welcome` | `Welcome to VirtualWardrobe` | First-run orientation (a dev-only store-init error toast is visible — web-only, see notes) |
| 2 | Gallery / wardrobe | [`kit-gallery-wardrobe.png`](./kit-gallery-wardrobe.png) | `/wardrobe` | `Record your own clothes` | Own-clothes + Catalog sections, empty on web |
| 3 | Capture (add garment) | [`kit-capture.png`](./kit-capture.png) | `/capture` | `Add a garment` | M1-1 capture modal — hint chips + **Photo** (library) only; no Camera action on web (`cameraAvailable` false) |
| 4 | Studio (try-on) | [`kit-studio.png`](./kit-studio.png) | `/studio` | `Save & share` | Manual-fallback path (banner + status + sliders) |
| 5 | Saved / shared look | [`kit-looks-saved.png`](./kit-looks-saved.png) | `/looks` | `Your looks` | Saved-looks gallery, empty on a fresh web profile |

Every image is produced by the single `npm run screenshots` command above at the
390 x 844 viewport; the per-image "anchor" column is the exact string the script
waits for before shooting, which is what makes each capture deterministic.

## Notes & known limitations

- **Studio path:** the manual-fallback path is expected on web without
  `MOVENET_MODEL_URL` and without the `@mediapipe/pose` dependency bundled. This
  is the honest, shipped behavior (ADR-004: the pose model is an enhancement, not
  a gate), not a defect. Setting the model up would exercise the auto-place path.
- **Empty catalog / wardrobe / looks:** the web dev run does not complete the
  `expo-sqlite` store init, so seeded catalog items and any saved looks are not
  present; the screens render their empty states. On a native device with a
  working SQLite store these sections populate.
- **Welcome error toast:** the red "store init / catalog ingest failed" banner in
  image 1 is the same web-only store-init limitation surfaced by the dev LogBox;
  it does not appear once the store is available (native) or in a production web
  build.

## Native / device evidence — PARTIAL

Native device screenshots (iOS / Android) are **not** included.

- **iOS Simulator: blocked** — no iOS runtime is installed on this host, so the
  simulator cannot boot the app.
- **Android: not set up** — no Android SDK / emulator is configured on this host.

All images above are from the **Expo web** build via Playwright/Chromium, which is
the only runtime currently available here. Native captures should be added once a
simulator/emulator runtime is provisioned.

### M1-1 (capture) evidence status

- **Web (available now):** `kit-capture.png` shows the capture screen with the
  hint chips and the **Photo** (library) action only — the Camera action is hidden
  because `cameraAvailable` is false on web (no `expo-camera`). This exercises the
  "camera unavailable → only Library is shown, nothing crashes" acceptance
  criterion on web, and the library-import → `Item` draft path is covered by the
  passing `tests/capture/draft.test.ts` unit suite.
- **Native camera capture / permission / on-device persistence (still open):**
  producing this requires a booted iOS/Android runtime with camera access, which
  is not provisionable on this headless host (and simulators lack camera hardware,
  so even a booted simulator can only evidence library import). This is the sole
  remaining M1-1 gap and is tracked as **PARTIAL** — code complete, native
  device-capture evidence deferred until a device/emulator runtime lands.
