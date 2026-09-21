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
- [ ] Browser-level smoke test exists and runs in a suitable environment
- [ ] A minimal happy path is asserted end-to-end
- [ ] Model-absent runs can assert the manual fallback path cleanly
- [ ] Test results are artifact-friendly for QA and CI

## Notes
This work complements the existing unit test suite and is the best next step to validate the real user experience.
