---
title: "VirtualWardrobe"
description: "Local-first virtual wardrobe + pose-aware try-on web/app (Expo)."
---

# VirtualWardrobe

Local-first virtual wardrobe + **pose-aware try-on**. One Expo codebase, shipped to
**web + iOS + Android**. MVP plan lives in [`Plans/`](Plans/).

> Status: **planning phase.** The GitHub project and issue backlog are live; see
> [`Plans/04-gh-setup.md`](Plans/04-gh-setup.md) and [`AGENTS.md`](AGENTS.md) for the sync workflow.

## Why it exists
Try on clothes from your own photos + a bundled catalog, with believable
pose-aware draping — locally, privacy-first, no server.

## Planning docs (read these first)
- [`Plans/00-decisions.md`](Plans/00-decisions.md) — the locked ADRs.
- [`Plans/01-architecture.md`](Plans/01-architecture.md) — modules + data model.
- [`Plans/02-product-backlog.md`](Plans/02-product-backlog.md) — milestone → issue map.
- [`Plans/03-execution-plan.md`](Plans/03-execution-plan.md) — what gets built, in what order.
- [`Plans/04-gh-setup.md`](Plans/04-gh-setup.md) — the one manual step to push to github.com.
- [`Plans/issues/`](Plans/issues/) — local issue specifications mirrored to GitHub.

## Stack (target)
Expo + TypeScript + Expo Router · Reanimated ·
`expo-camera`/`expo-image-picker`/`expo-image-manipulator` · `expo-sqlite`
(web pose: `@tensorflow-models/pose-detection`; native pose: later, via EAS).

## Toolchain notes
- Run the Expo toolchain on **Node 22 LTS** (`nvm use 22`) — the machine default (Node 26)
   is too new for the Expo CLI. See ADR-010.
- `gh` here is authed to `github.tools.sap`; the project targets the **personal**
   `github.com` (ADR-009). Add that auth via `Plans/04-gh-setup.md`.

## Documentation
- [`docs/quickstart.md`](docs/quickstart.md) — install, start, and first-run steps.
- [`docs/usage.md`](docs/usage.md) — how the app works and the expected user flow.
- [`docs/testing.md`](docs/testing.md) — test, lint, typecheck, and pose smoke checks.
- [`docs/testing-summary.md`](docs/testing-summary.md) — QA summary, coverage assessment, and risk areas.
- [`docs/qa-grooming-plan.md`](docs/qa-grooming-plan.md) — execution-ready QA plan for the next grooming cycle.
- [`docs/qa-repository-test-plan.md`](docs/qa-repository-test-plan.md) — implementation-ready plan for repository and SQLite regression tests.
- [`docs/qa-repository-test-checklist.md`](docs/qa-repository-test-checklist.md) — step-by-step execution checklist for the first QA implementation task.
- [`docs/qa-screen-test-plan.md`](docs/qa-screen-test-plan.md) — implementation-ready plan for onboarding, capture, wardrobe, and studio flow coverage.
- [`docs/qa-pose-and-browser-test-plan.md`](docs/qa-pose-and-browser-test-plan.md) — implementation-ready plan for pose fallback and browser smoke validation.
- [`docs/qa-sprint-backlog.md`](docs/qa-sprint-backlog.md) — consolidated sprint backlog and prioritization for the next QA cycle.
- [`docs/feedback.md`](docs/feedback.md) — how to report bugs or request features.
- [`docs/dev-setup.md`](docs/dev-setup.md) — deeper local setup notes for the pose model and environment.

## QA work items
- [`Plans/issues/QA-1.md`](Plans/issues/QA-1.md) — repository / SQLite regression tests
- [`Plans/issues/QA-2.md`](Plans/issues/QA-2.md) — screen-level flow tests for onboarding, capture, and studio
- [`Plans/issues/QA-3.md`](Plans/issues/QA-3.md) — pose-provider failure and fallback regression tests
- [`Plans/issues/QA-4.md`](Plans/issues/QA-4.md) — browser-level smoke tests for the Expo web app

## Roadmap (MVP)
- **M0 Foundations** — scaffold, abstractions, local storage, onboarding.
- **M1 Wardrobe** — capture, CRUD, gallery/filter, bundled catalog.
- **M2 Try-On** — web pose + auto-box + manual fine-tune + save/share + manual fallback.
- **M3 Native + Polish** — on-device pose spike, looks gallery, icons/i18n, optional sync.
- **M5 Devops** — CI/security workflow and CI/CD test execution/reporting.
