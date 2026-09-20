# Product Backlog

Single backlog → maps 1:1 to GitHub issues and a GitHub Project board.
Milestones: **M0 Foundations · M1 Wardrobe · M2 Try-On · M3 Native+Polish**.
Each item below has a full issue body in `Plans/issues/<id>.md`.

## Label scheme
`feat` · `ux` · `ml` · `debt` · `docs` · `spike` · `tooling` · and milestone tags `M0` `M1` `M2` `M3`.

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
| M1-1 | Camera + library capture (expo-camera / image-picker)           | feat, M1       | ✅ DONE      |
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
| M3-3     | App icons / launch screens / i18n / store asset prep      | feat, ux, M3        | ⏸ TODO      |
| M3-4     | [optional] Account + multi-device sync (separately scoped)| feat, M3, debt     | ⏸ (opt)     |
| M3-5     | Dev-env: headless-browser harness for `ml`/`spike` DoD    | debt, tooling, M3   | 🚧 BUILT*    |

> * **M3-1 — NO-GO (in-sandbox).** See `Plans/spikes/M3-1-mediapipe-native-pose.md` + M3-1
>   issue "Verdict". No device/EAS/camera in the sandbox, so the on-device pose spike
>   (AC1/AC2) cannot be executed; AC3/AC4 are met. M2-4 (manual overlay, ADR-005) stays the
>    native shipping path; a `MediaPipePoseProvider` is a drop-in when a device appears.
>
> * **M3-5 — harness BUILT, browser pass waived.** `scripts/pose-smoke.mjs` +
>   `scripts/pose-smoke-path.mjs` (pure skip-decision + `e2e:pose` / `e2e:pose:check`)
>   are wired; on a clean checkout they **skip the browser pass and exit 0** (skippable-when-
>   model-absent, AC2) and run the pure self-test. The actual Chromium screenshot (AC1) is only
>   produced on a machine with `@playwright/test` + the MoveNet model — the same in-sandbox
>    ceiling as M2-1 D20.5 / M2-2 D21.6. M3-3 remains the open M3 feature work.

## Definition of Done (every issue)
- [ ] Acceptance criteria met and verified (test where applicable).
- [ ] Type-clean (tsc), lint-clean (eslint).
- [ ] No console errors on the happy path; failures handled gracefully.
- [ ] For `ml`: a screenshot + one-run demo note attached.
- [ ] For `spike`: written conclusion (go / no-go) and an ADR if it changes a plan.
