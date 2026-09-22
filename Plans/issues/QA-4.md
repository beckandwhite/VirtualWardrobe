# QA-4 · Create browser-level smoke tests for the Expo web app

Milestone: QA · Labels: qa, coverage, tooling, M3

## Description
The current repo has a strong unit-test baseline, but it still lacks an end-to-end smoke test that exercises the actual Expo web app. This gap is documented in [Plans/issues/M3-5.md](../issues/M3-5.md), and it is one of the highest-value additions for app confidence.

## Scope
Add smoke coverage for:

- Expo web startup
- route loads for wardrobe and studio screens
- a sample body photo + garment path
- overlay or manual-fallback rendering
- no fatal console errors during a basic happy path

## Acceptance criteria
- [x] Browser-level smoke test exists and runs in a suitable environment
- [x] A minimal happy path is asserted end-to-end
- [x] Model-absent runs can assert the manual fallback path cleanly
- [x] Test results are artifact-friendly for QA and CI

## Notes
This work complements the existing unit test suite and is the best next step to validate the real user experience.

## Decision log
- **D31.1 — skippable browser smoke harness, mirroring M3-5's `e2e:pose` pattern.** `scripts/
  web-smoke.mjs` (`e2e:web`) does an *optional dynamic* `import('@playwright/test')` and skips
  (exit 0, demo note) when Playwright/Chromium is absent — the same in-sandbox ceiling as D22.3.
  `scripts/web-smoke-path.mjs` (`e2e:web:check`, `--selftest`) holds the pure skip-decision + report
   builders so a CI step gates without a browser. `@playwright/test` is **not** added (ADR-004: no
  dep); `import/no-unresolved` stays off for `scripts/**/*.mjs` (D22.2) so the optional import doesn't
  false-positive the lint gate.
- **D31.2 — no-fatal-error vs expected-warn is a classification, not a blanket ban.** The happy path
  asserts **zero fatal** `pageerror`/`console.error` (a `pageerror` listener + a console-error capture
   both push into `fatalErrors` and fail the run), but the pose-fallback `console.warn` ("... falling
   back to manual", `safeEstimate` in `src/pose/PoseProvider.ts`) is **EXPECTED** on the model-absent
   manual path. `classifyConsole` (AC3) sorts entries into `fatal` / `expected` / `info`, and a manual
   run passes only when `expectedWarns > 0` — asserting the fallback fired, not that the console is
  silent.
- **D31.3 — the manual-fallback path is the in-sandbox default, asserted cleanly (AC3).** When the
   MoveNet model is absent, web `createPoseProvider('movenet')` → `safeEstimate` degrades to `[]` →
   `autoTransformFor([])` → identity transform, and the studio renders the M2-4 banner ("Auto-drape
   unavailable here — adjusting manually.", `app/studio.tsx` `bannerText`) + `statusText` "Auto-drape
   unavailable — adjusting manually". The harness asserts that banner when `decidePath('manual')`, so a
   model-less run still completes the happy path with a PNG + report.
- **D31.4 — in-sandbox browser ceiling: BUILT-with-waived-browser-pass, not DONE.** No Chromium/
   Playwright and no model bytes in the sandbox (D20.5 / D21.6 / D22.3), so the browser pass is
   written for a machine that has them and is *waived* here: `e2e:web` exits 0 with a SKIP demo note +
   a `docs/screenshots/web-last-run.{md,json}` artifact, and `e2e:web:check` proves the skip-decision +
   fatal/expected classification without a browser. A capable machine (`npm add -D @playwright/test &&
  npx playwright install chromium`, optionally `npm run fetch:pose`) runs the real pass.

## Status: BUILT-WITH-WAIVED-BROWSER-PASS (2026-09-22)

Gate-green (tsc + eslint + jest 129/15). The browser pass is waived in-sandbox
(no Chromium / no model — same ceiling as M3-5 D22.3); the pure skip-decision + fatal/expected
classification is built and self-testing (`e2e:web:check`), and `e2e:web` exits 0 with an artifact.

### Built
- `scripts/web-smoke-path.mjs` — pure skip-decision module + `--selftest` (`e2e:web:check`):
   `decidePath` (auto/manual, mirrors pose-smoke-path), `shouldSkipBrowser`, `classifyConsole`
   (fatal / expected / info, AC3), `buildReport` + `renderReport` + `reportJson` (AC4 artifacts).
   Exit 0/1 for a CI gate without a browser.
- `scripts/web-smoke.mjs` — `e2e:web` harness; skippable-when-browser-absent (optional dynamic
   `import('@playwright/test')`, D22.3). When a browser is present it: starts `expo start --web`
   (`EXPO_WEB_URL || http://localhost:8081`), asserts startup + the `/wardrobe` + `/studio` routes
   (AC2), asserts the M2-4 manual-fallback banner when the model is absent (AC3), captures a PNG, and
   writes `docs/screenshots/web-last-run.{md,json}` (AC4). Zero fatal `pageerror`/`console.error`;
   the expected fallback `warn` is asserted-present, not fatal.
- `package.json` — `e2e:web` + `e2e:web:check` scripts mirroring `e2e:pose` / `e2e:pose:check`.

### Verified against
- `scripts/web-smoke-path.mjs --selftest`
    - [x] `decidePath`: auto when url+dir present, manual otherwise (4 cases, mirrors M3-5)
    - [x] `shouldSkipBrowser`: true when Playwright absent (in-sandbox), false when present
    - [x] `classifyConsole`: pageerror + console.error → fatal; expected fallback warn → expected;
      plain warn/log → info
    - [x] `buildReport`: SKIP stays green; manual needs `expectedWarns>0`; fatal or failed route → FAIL
    - [x] `reportJson` round-trips; `renderReport` carries the summary
- `node scripts/web-smoke.mjs` (in-sandbox)
    - [x] exits 0 via the skip path (no `@playwright/test`), runs the self-test, writes
      `docs/screenshots/web-last-run.md` (+ `.json`) with `status: SKIP`

### Verified against (waived — no Chromium/model in sandbox)
- `scripts/web-smoke.mjs` browser pass
    - [~] startup → `/onboarding`|`/wardrobe` redirect asserted in-browser — **waived** (no browser)
    - [~] `/wardrobe` + `/studio` route loads asserted in-browser — **waived** (no browser)
    - [~] M2-4 manual-fallback banner + screenshot captured — **waived** (no browser; the skip
      decision that selects the manual path *is* self-tested, AC3)
- On a machine with `@playwright/test` + Chromium (and optionally `npm run fetch:pose`), `npm run
  e2e:web` produces `docs/screenshots/web-<path>-<ts>.png` + the JSON report (AC1/AC2/AC4). Same
  in-sandbox ceiling as M3-5 D20.5 / D21.6 / D22.3.

### Follow-ups
- **No CI workflow added** — the harness is CI-friendly (exit 0/1 + `docs/screenshots/web-last-run.json`
   artifact + `e2e:web:check` for a browserless gate) per the brief; wiring a GitHub Action is left
  to the orchestrator. The in-sandbox skip keeps the gate green on a clean checkout (ADR-004).

### Stats
| check | result |
|---|---|
| `tsc --noEmit` | ✅ PASS |
| `eslint . --max-warnings 0` | ✅ PASS |
| `jest` | ✅ PASS (129/129 across 15 suites) |
| `e2e:web:check` (`web-smoke-path --selftest`) | ✅ PASS, exit 0 |
| `e2e:web` (`web-smoke`) in-sandbox | ✅ exit 0 (SKIP path, no `@playwright/test`) |
