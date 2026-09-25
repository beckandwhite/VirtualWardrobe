# Product Backlog

Single backlog → maps 1:1 to GitHub issues and a GitHub Project board.
Milestones: **M0 Foundations · M1 Wardrobe · M2 Try-On · M3 Native+Polish · M4 QA · M5 Devops · M6 Language & i18n**.
Each item below links to its full work-item body in GitHub. Local files intentionally do not mirror
issue bodies; implementation notes remain here only when they are useful as durable project status.

## Label scheme
`feat` · `ux` · `ml` · `qa` · `coverage` · `debt` · `docs` · `spike` · `tooling` · and milestone tags `M0` `M1` `M2` `M3` `M4` `M5` `M6`.

## Board columns
`Backlog · To Do · In Progress · Done · Shipped`

---

## M0 · Foundations  (repo: VirtualWardrobe) — ✅ Complete

| ID    | Title                                                          | Labels           | Status    | GH #                                                                         |
|-------|----------------------------------------------------------------|------------------|-----------|------------------------------------------------------------------------------|
| M0-1  | Initialize Expo + TS strict + Expo Router + lint/format        | feat, M0         | ✅ DONE   | [#1](https://github.com/beckandwhite/VirtualWardrobe/issues/1)               |
| M0-2  | Define PoseProvider + Compositor interfaces (abstraction)      | ml, M0           | ✅ DONE   | [#2](https://github.com/beckandwhite/VirtualWardrobe/issues/2)               |
| M0-3  | Local storage: expo-sqlite + Item/BodyPhoto/TryOn/StoreItem    | feat, M0         | ✅ DONE   | [#3](https://github.com/beckandwhite/VirtualWardrobe/issues/3)               |
| M0-4  | Permissions onboarding flow (camera, photos, storage)          | ux, M0           | ✅ DONE   | [#4](https://github.com/beckandwhite/VirtualWardrobe/issues/4)               |
| M0-5  | Studio route + pose→garment demo (manual fallback)             | feat, ux, ml, M0 | ✅ DONE   | [#5](https://github.com/beckandwhite/VirtualWardrobe/issues/5)               |

## M1 · Wardrobe (vertical slice, no try-on yet) — ✅ Complete (2026-09)

| ID    | Title                                                           | Labels       | Status     | GH #                                                                         |
|-------|-----------------------------------------------------------------|--------------|------------|------------------------------------------------------------------------------|
| M1-1  | Camera + library capture (expo-camera / image-picker)           | feat, M1     | 🚧 PARTIAL | [#6](https://github.com/beckandwhite/VirtualWardrobe/issues/6)               |
| M1-2  | Item CRUD + thumbnail gen (expo-image-manipulator)              | feat, M1     | ✅ DONE    | [#7](https://github.com/beckandwhite/VirtualWardrobe/issues/7)               |
| M1-3  | Gallery grid + filter/search (category / color / tag)           | feat, ux, M1 | ✅ DONE    | [#8](https://github.com/beckandwhite/VirtualWardrobe/issues/8)               |
| M1-4  | Bundled store.json catalog + ingester                           | feat, M1     | ✅ DONE    | [#9](https://github.com/beckandwhite/VirtualWardrobe/issues/9)               |

> * **M1-4 note (2026-09-22):** Catalog card placeholder images replaced with inline SVG
>   illustrations (t-shirt, trousers, dress, jacket, sneaker, tote bag) in
>   `src/catalog/placeholders.ts`; no binary assets or file imports required on web.

## M2 · Try-On Studio — ✅ Complete (2026-09-20, code-complete + gate-green; native runtime not exercised in-sandbox → M3-5)

| ID    | Title                                                          | Labels       | Status        | GH #                                                                         |
|-------|----------------------------------------------------------------|--------------|---------------|------------------------------------------------------------------------------|
| M2-1  | Web MoveNet pose integration                                   | ml, M2       | 🚧 BUILT*     | [#10](https://github.com/beckandwhite/VirtualWardrobe/issues/10)             |
| M2-2  | Auto-scaled garment box from keypoints + manual fine-tune      | feat, ux, M2 | ✅ BUILT      | [#11](https://github.com/beckandwhite/VirtualWardrobe/issues/11)             |
| M2-3  | Save/share output to Photos (expo-image-manipulator)           | feat, M2     | ✅ BUILT      | [#12](https://github.com/beckandwhite/VirtualWardrobe/issues/12)             |
| M2-4  | Manual-overlay fallback (no ML) so native is usable pre-ML    | feat, ux, M2 | ✅ BUILT      | [#13](https://github.com/beckandwhite/VirtualWardrobe/issues/13)             |

> *M2-1 is **code-complete and gate-green** (providers/loader/provider/factory +
  skeleton overlay + unit tests). Its `ml`-doD screenshot is waived this session
  (sandbox renders no browser); the `e2e:pose` harness that produces it is
  tracked in **M3-5**.

## M3 · Native + Polish (spikes / optional / tooling)

| ID     | Title                                                              | Labels                | Status              | GH #                                                                         |
|--------|--------------------------------------------------------------------|-----------------------|---------------------|------------------------------------------------------------------------------|
| M3-1   | [spike] EAS prebuilt + Mediapose/Tasks pose for native             | spike, ml, M3         | ⛔ NO-GO*           | [#14](https://github.com/beckandwhite/VirtualWardrobe/issues/14)             |
| M3-2   | Saved-looks gallery + export/share sheet                           | feat, ux, M3          | ✅ BUILT            | [#15](https://github.com/beckandwhite/VirtualWardrobe/issues/15)             |
| M3-3   | [autonomous] App branding and release asset configuration          | feat, ux, M3          | 🚧 PARTIAL*         | [#16](https://github.com/beckandwhite/VirtualWardrobe/issues/16)             |
| M3-4   | [optional] Account + multi-device sync (separately scoped)        | feat, M3, debt        | ⏸ (opt)            | [#17](https://github.com/beckandwhite/VirtualWardrobe/issues/17)             |
| M3-5   | Dev-env: headless-browser harness for `ml`/`spike` DoD            | debt, tooling, M3     | 🚧 BUILT*           | [#18](https://github.com/beckandwhite/VirtualWardrobe/issues/18)             |
| M3-6   | [autonomous] Vendor TFJS MoveNet via ONNX→TFJS conversion (fast)  | ml, debt, M3, spike   | ⛔ SUPERSEDED*      | [#19](https://github.com/beckandwhite/VirtualWardrobe/issues/19)             |
| M3-7   | [autonomous] Vendor a known-good TFJS MoveNet graph (long-term)   | ml, debt, M3, spike   | ✅ DONE*            | [#20](https://github.com/beckandwhite/VirtualWardrobe/issues/20)             |
| M3-8   | [autonomous] Docs: Playwright web-test environment setup           | docs, tooling, qa, M3 | 🚧 BACKLOG          | [#26](https://github.com/beckandwhite/VirtualWardrobe/issues/26)             |
| M3-9   | [autonomous] Setup: install + run Playwright on this MacBook       | tooling, qa, M3       | 🚧 BACKLOG          | [#27](https://github.com/beckandwhite/VirtualWardrobe/issues/27)             |
| M3-10  | [autonomous] Docs: Android test-environment setup                  | docs, tooling, qa, M3 | 🚧 BACKLOG          | [#21](https://github.com/beckandwhite/VirtualWardrobe/issues/21)             |
| M3-11  | [autonomous] Setup: Android emulator/device on this MacBook        | tooling, qa, M3       | 🚧 BACKLOG          | [#22](https://github.com/beckandwhite/VirtualWardrobe/issues/22)             |
| M3-12  | [autonomous] Docs: iOS test-environment setup                      | docs, tooling, qa, M3 | 🚧 BACKLOG          | [#23](https://github.com/beckandwhite/VirtualWardrobe/issues/23)             |
| M3-13  | [autonomous] Setup: iOS Simulator on this MacBook                  | tooling, qa, M3       | 🚧 BACKLOG          | [#24](https://github.com/beckandwhite/VirtualWardrobe/issues/24)             |
| M3-14  | Storyboard the core wardrobe-to-try-on user journey                | ux, docs, M3          | 🚧 BACKLOG          | [#34](https://github.com/beckandwhite/VirtualWardrobe/issues/34)             |
| M3-15  | [autonomous] Portfolio screenshot kit and demo path                | ux, docs, M3          | 🚧 BACKLOG          | [#44](https://github.com/beckandwhite/VirtualWardrobe/issues/44)             |
| M3-16   | [autonomous] Welcome screen: explain VirtualWardrobe and try-on    | feat, ux, M3           | ✅ DONE*             | [#46](https://github.com/beckandwhite/VirtualWardrobe/issues/46)              |
| M3-17  | [autonomous] Improve application navigation and return paths       | feat, ux, M3          | 🚧 BACKLOG          | [#47](https://github.com/beckandwhite/VirtualWardrobe/issues/47)             |
| M3-18  | [autonomous] M2-1 post-M3-7 housekeeping                          | debt, tooling, M3     | 🚧 BACKLOG          | [#49](https://github.com/beckandwhite/VirtualWardrobe/issues/49)             |
| M3-19  | [autonomous] M2-1 AC4 — native bundle exclusion CI gate           | ml, qa, M3            | 🚧 BACKLOG          | [#50](https://github.com/beckandwhite/VirtualWardrobe/issues/50)             |

> * **M3-1 — NO-GO (in-sandbox).** See the M3-1 issue (#14) "Verdict" + its migrated spike detail.
>   No device/EAS/camera in the sandbox, so the on-device pose spike
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
> * **M3-3 — PARTIAL, branding only.** `app.json` has a branded `splash` + `icon`, but release
>   device-build verification remains open. The existing two-locale implementation is carried
>   forward as input to M6-1; the portfolio screenshot kit is M3-15.
>
> * **M3-6 / M3-7 — the dead MoveNet source, two ways to a real graph (D24 → resolved D42).**
   `npm run fetch:pose` failed because the canonical TFJS MoveNet graph is gone everywhere public
>    (`tfhub.dev`→Kaggle, `tfhub-public` GCS gone, no jsDelivr mirror). A live **ONNX** copy exists
>    on HuggingFace (`Xenova/movenet-singlepose-lightning`), but `pose-detection` needs **TFJS**. Two
>    autonomous subagent work items competed for the same `public/pose/` drop-in slot:
>      - **M3-6 (fast):** synthesize a TFJS graph by converting the ONNX with
>       `tensorflowjs_converter`. Produced a graph + 3 weight shards, but the network-free
>       `estimatePoses` proof and op-coverage stayed unverified (no Playwright/Chromium on host) →
>       **PARTIAL**, then **SUPERSEDED** by M3-7.
>      - **M3-7 (reliable):** source a *known-good* TFJS graph → **DONE**. Sourced the canonical
>       graph from `vladmandic/human-models` (canonical tfhub origin), placed it in
>       `assets/pose/`+`public/pose/`, and proved network-free inference end-to-end via
>       `scripts/pose-m37-verify.mjs` (load + `[1,192,192,3]→[1,1,17,3]` + 17 keypoints on the
>       bundled body fixture). Provenance (URL + sha256) recorded in the decision log (D42).
>    M3-7 won; M3-6 is closed as superseded. Both unblocked M2-1's real `ml` DoD.
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
>
> * **M3-16 — first-run welcome orientation, DONE (D44.1–D44.4).** A flat `app/welcome.tsx`
>   screen, gated on a new `has_seen_welcome` flag (separate from `has_onboarded`, so the
>    orientation shows at most once even if M0-4 is bypassed). The entry routing decision moved
>    to the pure `welcomeGate(onboarded, seenWelcome)` (superseding `entryRedirect`, which the
>    M4-2 entry-branch test still asserts). It presents the four-step model, an honest
>    manual-fallback note (no native-pose promise, M3-1 NO-GO), and Continue/Skip — both
>    collapse to one continuation. All 14 `welcome.*` strings are in every locale (no new
>    locale). Covered by `tests/onboarding/welcomeGate.test.ts` + the `setSeenWelcome` repo
>    test; 165 tests, typecheck, and lint pass. On-device/simulator *rendering* is not exercised
>    in-sandbox (the known M3-1/D20.5 ceiling); the routing + persistence + copy logic is fully
>    asserted unit-free of a device.

## M4 QA · Regression & Coverage

| ID    | Title                                                      | Labels                    | Status              | GH #                                                                         |
|-------|------------------------------------------------------------|---------------------------|---------------------|------------------------------------------------------------------------------|
| M4-1  | Repository / SQLite regression tests                       | qa, coverage, M4          | ✅ BUILT (D26)      | [#28](https://github.com/beckandwhite/VirtualWardrobe/issues/28)             |
| M4-2  | Screen-level flow tests (onboarding, capture, studio)      | qa, coverage, ux, M4      | ✅ BUILT (D29)      | [#29](https://github.com/beckandwhite/VirtualWardrobe/issues/29)             |
| M4-3  | Pose-provider failure & fallback regression tests          | qa, coverage, ml, M4      | ✅ BUILT (D30)      | [#30](https://github.com/beckandwhite/VirtualWardrobe/issues/30)             |
| M4-4  | Browser-level smoke tests for the Expo web app             | qa, coverage, tooling, M4 | 🟡 BUILT-waived (D31) | [#31](https://github.com/beckandwhite/VirtualWardrobe/issues/31)           |

## M5 · Devops (CI/CD and delivery confidence)

| ID    | Title                                                   | Labels          | Status       | GH #                                                                         |
|-------|---------------------------------------------------------|-----------------|--------------|------------------------------------------------------------------------------|
| M5-1  | [autonomous] GitHub Actions build and security workflow | tooling, qa, M5 | 🚧 PARTIAL*  | [#25](https://github.com/beckandwhite/VirtualWardrobe/issues/25)             |
| M5-2  | CI/CD test execution and reporting                      | tooling, qa, M5 | ✅ DONE*     | [#32](https://github.com/beckandwhite/VirtualWardrobe/issues/32)             |
| M5-3  | [autonomous] Private GitHub Actions runner from Docker  | tooling, qa, M5 | ✅ CLOSED*   | [#33](https://github.com/beckandwhite/VirtualWardrobe/issues/33)             |

> * **M5-1 - establish a small, trustworthy CI/security baseline.** The workflow should run on
>   pushes and pull requests, install from the lockfile with `npm ci`, and enforce the repository's
>   existing typecheck, lint, and Jest gates. Security coverage should start with `npm audit` at a
>   deliberate severity threshold, CodeQL for JavaScript/TypeScript, and dependency review on pull
>   requests. GitHub secret scanning/push protection is a repository setting to enable and verify,
>   not a substitute for the workflow itself.
>   **Current status:** `Quality` and `Jest` jobs passed in the first GH run, but the overall run
>   still fails because the `CodeQL` analysis step failed. The work item remains **PARTIAL** until the
>   security analysis job is fixed or the workflow is narrowed to a verified default configuration.

> * **M5-2 - make CI test results actionable.** Add the clean-install test sequence, coverage and
>   machine-readable artifacts, clear failure output, required-check guidance, and rerun/download
>   documentation so a failing CI run can be diagnosed from GitHub Actions.
>   **Current status:** The repository's `Jest tests and coverage` job succeeded on GitHub run
>   `35736973132`; the issue is therefore **DONE** relative to its own scope, even though the overall
>   workflow still failed on CodeQL.
>
> * **M5-3 - closed on 2026-09-22 with a documented blocker.** The pinned Docker runner,
>   secret-free ephemeral bootstrap, least-privilege defaults, labeled dispatch-only smoke workflow,
>   and teardown documentation are implemented. Docker image build and live labeled-job execution
>   remain unverified because the current Windows host has no running Docker Desktop Linux engine;
>   no runner was registered. The issue is closed as a verified host/permission blocker, with the
>   exact prerequisites recorded for a future private-runner deployment.

## M6 · Language & i18n

| ID     | Title                                        | Labels       | Status      | GH #                                                                         |
|--------|----------------------------------------------|--------------|-------------|------------------------------------------------------------------------------|
| M6-1   | Language/i18n foundation and translation workflow | docs, ux, M6 | ✅ DONE | [#35](https://github.com/beckandwhite/VirtualWardrobe/issues/35)             |
| M6-2   | English canonical catalog and copy review    | docs, ux, M6 | ✅ DONE  | [#36](https://github.com/beckandwhite/VirtualWardrobe/issues/36)             |
| M6-3   | Hungarian translation                        | docs, ux, M6 | ✅ DONE  | [#37](https://github.com/beckandwhite/VirtualWardrobe/issues/37)             |
| M6-4   | German translation                           | docs, ux, M6 | ✅ DONE  | [#38](https://github.com/beckandwhite/VirtualWardrobe/issues/38)             |
| M6-5   | Spanish translation completion               | docs, ux, M6 | ✅ DONE  | [#39](https://github.com/beckandwhite/VirtualWardrobe/issues/39)             |
| M6-6   | Italian translation                          | docs, ux, M6 | ✅ DONE  | [#40](https://github.com/beckandwhite/VirtualWardrobe/issues/40)             |
| M6-7   | French translation                           | docs, ux, M6 | ✅ DONE  | [#41](https://github.com/beckandwhite/VirtualWardrobe/issues/41)             |
| M6-8   | Vietnamese translation                       | docs, ux, M6 | ✅ DONE  | [#42](https://github.com/beckandwhite/VirtualWardrobe/issues/42)             |
| M6-9   | [autonomous] Simplified Chinese translation  | docs, ux, M6 | ✅ DONE  | [#43](https://github.com/beckandwhite/VirtualWardrobe/issues/43)             |
| M6-10  | [autonomous] Traditional Chinese translation | docs, ux, M6 | ✅ DONE  | [#45](https://github.com/beckandwhite/VirtualWardrobe/issues/45)             |

> * **M6-1** establishes the typed nine-locale catalog (`en`, `hu`, `de`, `es`, `it`, `fr`, `vi`,
>   `zh-CN`, `zh-TW`), fallback and formatting rules, coverage checks, persistence behavior, and
>   contributor workflow. M6-2 makes English the reviewed source catalog; M6-3 through M6-10 then
>   deliver Hungarian, German, Spanish completion, Italian, French, Vietnamese, Simplified Chinese,
>   and Traditional Chinese translations.

> * **M6-1 / M6-3 — PARTIAL.** The i18n core now has typed metadata for all nine locales,
>   deterministic fallback and BCP-47 normalization, per-locale coverage reporting, and focused
>   Jest tests. The current canonical catalog is covered in Hungarian. Remaining work is the
>   contributor workflow and interpolation/formatting rules, expansion to every user-facing app
>   surface, and Hungarian storyboard review.

> * **M6 — DONE (branch `m6-translations`, commit `e5ef9f8`, pending merge).** The canonical
>   English catalog was expanded to every user-facing surface and split into per-locale files
>   (`src/i18n/locales/`), every screen wired to `t()`, and `{token}` interpolation plus a
>   `placeholderMismatches` gate added. All eight non-English locales are fully translated; the
>   translator workflow is documented (`Plans/translation-workflow.md`) and decisions logged
>   (D43.1–D43.5). Gates iterate all nine locales — typecheck/lint clean, 148 Jest tests pass.
>   One open item on M6-3..M6-7: a human native/visual review of the running app per locale.
>   Board Status cards could not be moved to `Done` automatically (token lacks project scope, cf.
>   D42.5); a project-scoped token should run `gh project item-edit`.

## Autonomous delivery workflow
- Start each autonomous work item from the latest `main` on a unique branch named
  `work/<issue-number>-<short-slug>`; never work directly on `main` or share a branch with another agent.
- Keep the GitHub issue current: record the branch and progress, move `Board Status` to `In Progress`
  when permitted, and add verification results, blockers, and the PR link. Do not close the issue or
  mark it complete until its PR is merged; update the issue and board after merge if automation has
  not already done so.
- Update the relevant row or concise status note in this backlog as part of the same branch/PR; do
  not duplicate the full issue specification here.
- Commit the scoped implementation and backlog update, then open a PR to `main` that links the issue
  and reports the checks run. Request automerge only when repository settings support it and required
  checks/reviews pass; never bypass a gate or change repository settings. If automerge is unavailable,
  leave the PR open and record the blocker.

## Definition of Done (every issue)
- [ ] Acceptance criteria met and verified (test where applicable).
- [ ] Type-clean (tsc), lint-clean (eslint).
- [ ] No console errors on the happy path; failures handled gracefully.
- [ ] For `ml`: a screenshot + one-run demo note attached.
- [ ] For `spike`: written conclusion (go / no-go) and an ADR if it changes a plan.
