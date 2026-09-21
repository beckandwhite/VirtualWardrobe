# Product Backlog

Single backlog → maps 1:1 to GitHub issues and a GitHub Project board.
Milestones: **M0 Foundations · M1 Wardrobe · M2 Try-On · M3 Native+Polish · M6 Language & i18n · M5 Devops · QA**.
Each item below has a full issue body in `Plans/issues/<id>.md`.

## Label scheme
`feat` · `ux` · `ml` · `qa` · `coverage` · `debt` · `docs` · `spike` · `tooling` · and milestone tags `M0` `M1` `M2` `M3` `M6` `M5`.

## Board columns
`Backlog · To Do · In Progress · Done · Shipped`

---

## M0 · Foundations  (repo: VirtualWardrobe) — ✅ Complete

| ID    | Title                                                          | Labels      | Status     |
|------|--------------------------------------------------------------|-----------|------------|
| M0-1 | Initialize Expo + TS strict + Expo Router + lint/format       | feat, M0   | ✅ DONE     |
| M0-2 | Define PoseProvider + Compositor interfaces (abstraction)     | ml, M0     | ✅ DONE     |
| M0-3 | Local storage: expo-sqlite + Item/BodyPhoto/TryOn/StoreItem   | feat, M0   | ✅ DONE     |
| M0-4 | Permissions onboarding flow (camera, photos, storage)         | ux, M0     | ✅ DONE     |
| M0-5 | Studio route + pose→garment demo (manual fallback)             | feat, ux, ml, M0 | ✅ DONE   |

## M1 · Wardrobe (vertical slice, no try-on yet) — ✅ Complete (2026-09)

| ID    | Title                                                           | Labels         | Status      |
|------|----------------------------------------------------------------|---------------|------------|
| M1-1 | Camera + library capture (expo-camera / image-picker)           | feat, M1       | 🚧 PARTIAL   |
| M1-2 | Item CRUD + thumbnail gen (expo-image-manipulator)              | feat, M1       | ✅ DONE      |
| M1-3 | Gallery grid + filter/search (category / color / tag)           | feat, ux, M1   | ✅ DONE      |
| M1-4 | Bundled store.json catalog + ingester                           | feat, M1       | ✅ DONE      |

## M2 · Try-On Studio — ✅ Complete (2026-09-20, code-complete + gate-green; native runtime not exercised in-sandbox → M3-5)

| ID     | Title                                                         | Labels            | Status       |
|------|-------------------------------------------------------------|-----------------|------------|
| M2-1 | Web MoveNet pose integration                                  | ml, M2            | 🚧 BUILT*    |
| M2-2 | Auto-scaled garment box from keypoints + manual fine-tune      | feat, ux, M2      | ✅ BUILT      |
| M2-3 | Save/share output to Photos (expo-image-manipulator)          | feat, M2          | ✅ BUILT      |
| M2-4 | Manual-overlay fallback (no ML) so native is usable pre-ML     | feat, ux, M2      | ✅ BUILT      |

> *M2-1 is **code-complete and gate-green** (providers/loader/provider/factory +
  skeleton overlay + unit tests). Its `ml`-doD screenshot is waived this session
  (sandbox renders no browser); the `e2e:pose` harness that produces it is
  tracked in **M3-5**.

## M3 · Native + Polish (spikes / optional / tooling)

| ID       | Title                                                     | Labels              | Status      |
|--------|---------------------------------------------------------|-------------------|------------|
| M3-1     | [spike] EAS prebuilt + Mediapose/Tasks pose for native    | spike, ml, M3       | ⛔ NO-GO*    |
| M3-2     | Saved-looks gallery + export/share sheet                  | feat, ux, M3        | ✅ BUILT       |
| M3-3      | App icons / launch screens / i18n / store asset prep       | feat, ux, M3        | 🚧 PARTIAL*  |
| M3-4     | [optional] Account + multi-device sync (separately scoped)| feat, M3, debt     | ⏸ (opt)     |
| M3-5      | Dev-env: headless-browser harness for `ml`/`spike` DoD     | debt, tooling, M3    | 🚧 BUILT*     |
| M3-6      | [autonomous] Vendor TFJS MoveNet via ONNX→TFJS conversion (fast) | ml, debt, M3, spike | 🚧 PARTIAL*     |
| M3-7       | [autonomous] Vendor a known-good TFJS MoveNet graph (long-term) | ml, debt, M3, spike | 🚧 BACKLOG     |
| M3-8       | [autonomous] Docs: Playwright web-test environment setup      | docs, tooling, qa, M3 | 🚧 BACKLOG   |
| M3-9       | [autonomous] Setup: install + run Playwright on this MacBook  | tooling, qa, M3       | 🚧 BACKLOG   |
| M3-10      | [autonomous] Docs: Android test-environment setup             | docs, tooling, qa, M3 | 🚧 BACKLOG   |
| M3-11      | [autonomous] Setup: Android emulator/device on this MacBook   | tooling, qa, M3       | 🚧 BACKLOG   |
| M3-12      | [autonomous] Docs: iOS test-environment setup                 | docs, tooling, qa, M3 | 🚧 BACKLOG   |
| M3-13      | [autonomous] Setup: iOS Simulator on this MacBook             | tooling, qa, M3       | 🚧 BACKLOG   |
| M3-14      | Storyboard the core wardrobe-to-try-on user journey             | ux, docs, M3          | 🚧 BACKLOG   |

## M6 · Language & i18n

| ID       | Title                                                     | Labels              | Status      |
|--------|---------------------------------------------------------|-------------------|------------|
| M6-1    | Language/i18n foundation and translation workflow        | docs, ux, M6        | 🚧 BACKLOG |
| M6-2    | English canonical catalog and copy review                | docs, ux, M6        | 🚧 BACKLOG |
| M6-3    | Hungarian translation                                    | docs, ux, M6        | 🚧 BACKLOG |
| M6-4    | German translation                                       | docs, ux, M6        | 🚧 BACKLOG |
| M6-5    | Spanish translation completion                           | docs, ux, M6        | 🚧 BACKLOG |
| M6-6    | Italian translation                                      | docs, ux, M6        | 🚧 BACKLOG |
| M6-7    | French translation                                       | docs, ux, M6        | 🚧 BACKLOG |
| M6-8    | Vietnamese translation                                   | docs, ux, M6        | 🚧 BACKLOG |
| M6-9    | Chinese translation                                      | docs, ux, M6        | 🚧 BACKLOG |

> * **M6-1** establishes the typed eight-locale catalog, fallback and formatting rules, coverage
>   checks, persistence behavior, and contributor workflow. M6-2 makes English the reviewed source
>   catalog; M6-3 through M6-9 then deliver Hungarian, German, Spanish completion, Italian,
>   French, Vietnamese, and Chinese translations.

> * **M3-1 — NO-GO (in-sandbox).** See `Plans/spikes/M3-1-mediapipe-native-pose.md` + M3-1
>   issue "Verdict". No device/EAS/camera in the sandbox, so the on-device pose spike
>   (AC1/AC2) cannot be executed; AC3/AC4 are met. M2-4 (manual overlay, ADR-005) stays the
>    native shipping path; a `MediaPipePoseProvider` is a drop-in when a device appears.
>
> * **M3-5 — harness BUILT, browser pass waived.** `scripts/pose-smoke.mjs` +
>    `scripts/pose-smoke-path.mjs` (pure skip-decision + `e2e:pose` / `e2e:pose:check`)
>   are wired; on a clean checkout they **skip the browser pass and exit 0** (skippable-when-
>    model-absent, AC2) and run the pure self-test. The actual Chromium screenshot (AC1) is only
>   produced on a machine with `@playwright/test` + the MoveNet model — the same in-sandbox
>    ceiling as M2-1 D20.5 / M2-2 D21.6.
>
> * **M3-3 — PARTIAL, zero-dep (D23.1).** i18n layer (`src/i18n/`: pure 2-locale catalog en+es,
>     `useI18n` provider, `LanguageSwitcher`) is wired into onboarding + the tab titles, language
>   persisted in `app_settings`; `app.json` now has a branded `splash` + `icon`. **Not** device-
>  verified (no iOS/Android build in-sandbox, same ceiling as M2/M3-1) and the store-asset
>   screenshot kit is out of scope in-sandbox. 2 locales + working no-reload language switch
>    (AC2) are done and unit-tested.
>
> * **M3-6 / M3-7 — the dead MoveNet source, two ways to a real graph (D24).** `npm run fetch:pose`
>   fails because the canonical TFJS MoveNet graph is gone everywhere public (`tfhub.dev`→Kaggle,
>   `tfhub-public` GCS gone, no jsDelivr mirror). A live **ONNX** copy exists on HuggingFace
>   (`Xenova/movenet-singlepose-lightning`), but `pose-detection` needs **TFJS**. So two autonomous
>   subagent work items, mutually substitutable into the same `public/pose/` drop-in slot:
>     - **M3-6 (PARTIAL, fast):** synthesize a TFJS graph by converting the ONNX with
>       `tensorflowjs_converter`. The graph and three weight shards were generated and mirrored
>       into the `public/pose/` and `assets/pose/` drop-in slots, with matching SHA-256 hashes.
>       Repository gates pass, but Playwright/Chromium is unavailable on this host, so the
>       network-free `estimatePoses` proof and converter op-coverage remain unverified.
>     - **M3-7 (long-term, reliable):** source a *known-good* TFJS graph (teammate cache / a repo
>        that vendors `model.json`+shards), verify API-compat with `pose-detection`, record provenance.
>   Whichever lands first with a *verified* graph wins; the other closes as superseded. Both unblock
>    M2-1's real `ml` DoD. Each issue is a self-contained autonomous brief (no human in loop; logs
>   its own decisions to `Plans/decision-log.md`).
>
> * **M3-8 … M3-13 — turn §7's two "can't" limits into buildable envs, doc + setup each (D25).**
>   `docs/dev-setup.md` §7 names two unmet prerequisites: §7.1 *"can't render a web UI"* (no
>    `@playwright/test`) and §7.2 *"can't run the iOS/Android simulator."* Each becomes a
>    **doc + setup** pair, every item a self-contained autonomous brief (same style as M3-6/M3-7):
>      - **Playwright:** M3-8 (docs) / M3-9 (setup here) — unblocks M3-5's waived AC1 browser
>        screenshot (and M2-1's `ml` DoD).
>      - **Android:** M3-10 (docs) / M3-11 (setup here) — unblocks M1-1 AC1's camera→Item-draft
>        on a real Android target.
>      - **iOS:** M3-12 (docs) / M3-13 (setup here) — same on iOS; the host **is** macOS, so iOS
>        is the pair most likely to actually pass in-sandbox.
>   The `setup` items are the *execution* half (prove it on this machine); the `docs` items are the
>    *prose* half (repeatable answer for a fresh dev / CI). All three pairs scope the **environment**
>    only — on-device *pose* stays M3-1 (NO-GO in-sandbox). A `setup` item that can't run here
>    records a NO-GO/PARTIAL with the exact blocker (the known D20.5/D21.6/M3-1 ceiling) — still
>    valuable as a precise record.

## M5 · Devops (CI/CD and delivery confidence)

| ID       | Title                                                     | Labels              | Status       |
|--------|---------------------------------------------------------|-------------------|------------|
| M5-1    | [autonomous] GitHub Actions build and security workflow   | tooling, qa, M5      | 🚧 BACKLOG   |
| M5-2    | CI/CD test execution and reporting                        | tooling, qa, M5      | 🚧 BACKLOG   |

> * **M5-1 - establish a small, trustworthy CI/security baseline.** The workflow should run on
>   pushes and pull requests, install from the lockfile with `npm ci`, and enforce the repository's
>   existing typecheck, lint, and Jest gates. Security coverage should start with `npm audit` at a
>   deliberate severity threshold, CodeQL for JavaScript/TypeScript, and dependency review on pull
>   requests. GitHub secret scanning/push protection is a repository setting to enable and verify,
>   not a substitute for the workflow itself.

> * **M5-2 - make CI test results actionable.** Add the clean-install test sequence, coverage and
>   machine-readable artifacts, clear failure output, required-check guidance, and rerun/download
>   documentation so a failing CI run can be diagnosed from GitHub Actions.

## QA · Regression & Coverage

| ID        | Title                                                      | Labels                 | Status       |
|--------|---------------------------------------------------------|-------------------|------------|
| QA-1       | Repository / SQLite regression tests                      | qa, coverage, M3      | ✅ BUILT (D26) |
| QA-2      | Screen-level flow tests (onboarding, capture, studio)    | qa, coverage, ux, M3 | 🚧 TODO     |
| QA-3      | Pose-provider failure & fallback regression tests        | qa, coverage, ml, M3 | 🚧 TODO     |
| QA-4      | Browser-level smoke tests for the Expo web app           | qa, coverage, tooling, M3 | 🚧 TODO |

## Definition of Done (every issue)
- [ ] Acceptance criteria met and verified (test where applicable).
- [ ] Type-clean (tsc), lint-clean (eslint).
- [ ] No console errors on the happy path; failures handled gracefully.
- [ ] For `ml`: a screenshot + one-run demo note attached.
- [ ] For `spike`: written conclusion (go / no-go) and an ADR if it changes a plan.
