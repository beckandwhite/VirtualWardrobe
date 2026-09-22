# QA Grooming Plan

## Objective

This plan defines the next quality-engineering work for the VirtualWardrobe repo without changing production behavior. The goal is to raise confidence in the app’s real workflows, data integrity, and runtime reliability before adding more feature work.

## Current QA baseline

The project already has a good unit-test baseline. Verified in the local workspace:

- `npm test -- --runInBand` passed: 7/7 suites, 48/48 tests
- `npx tsc --noEmit` passed
- `npx eslint . --max-warnings 0` passed

This means the codebase is stable at the pure-logic and type/lint level. The remaining gaps are integration and behavior coverage, not a failing suite.

## Highest-value workstreams

### 1. Repository and persistence regression coverage

Target: [src/store/repo.ts](../src/store/repo.ts)

Why this matters:

- It is the boundary between the UI and all persistent app state.
- The app stores onboarding, items, catalog entries, body photos, and try-on results here.
- A regression here would damage the user experience even if math and filtering tests still pass.

Implementation direction:

- Create repository-focused tests with the same DB semantics the app uses in production.
- Validate insert/update/delete and tag/path serialization.
- Verify missing-row and invalid-data edges.
- Confirm onboarding persistence and try-on record creation.

Work item:

- [M4-1](https://github.com/beckandwhite/VirtualWardrobe/issues/28)

### 2. Screen-level behavioral coverage

Target: [app](../app)

Why this matters:

- The app behavior is driven by route transitions and UI state, not only by pure functions.
- Without UI-level coverage, a user flow can fail even when the logic layer is green.

Implementation direction:

- Exercise onboarding permission flow and continuation.
- Validate route redirects from the app entry screen.
- Verify capture-to-wardrobe flow and empty-state handling.
- Test studio controls for transform edits and save/share actions.

Work item:

- [M4-2](https://github.com/beckandwhite/VirtualWardrobe/issues/29)

### 3. Pose fallback and provider resilience

Target: [src/pose](../src/pose)

Why this matters:

- The pose pipeline depends on model availability and platform-specific behavior.
- A missing or failed model is a realistic runtime risk for this app.

Implementation direction:

- Add tests around provider selection and failure handling.
- Exercise the safe fallback to manual placement logic.
- Validate loader state transitions and retry behavior.
- Confirm degraded-mode behavior is not a crash.

Work item:

- [M4-3](https://github.com/beckandwhite/VirtualWardrobe/issues/30)

### 4. Browser smoke validation

Target: Expo web/runtime validation

Why this matters:

- Unit tests cannot confirm route rendering, asset loading, or browser runtime issues.
- The repo already documents a headless-browser gap in [M3-5](https://github.com/beckandwhite/VirtualWardrobe/issues/18).

Implementation direction:

- Add a browser-driven smoke test for the Expo web app.
- Cover route load and a minimal happy path for the studio/wardrobe flow.
- Allow model-absent runs to assert the manual fallback without failing the suite.

Work item:

- [M4-4](https://github.com/beckandwhite/VirtualWardrobe/issues/31)

## Recommended execution order

1. Start with repository persistence tests to cover the most critical data layer.
2. Add screen-level interaction tests for user flows that the app depends on.
3. Add pose-provider failure and fallback tests to cover runtime degradation.
4. Add browser smoke tests when a browser-capable environment is available.

## Definition of ready for execution

A QA issue is ready when:

- the behavior under test is identified and mapped to an app or source file
- the acceptance criteria are explicit and verifiable
- the test environment is described and available
- the expected failure/edge cases are listed
- the test can be run within the normal repo workflow

## Exit criteria for this work

The repo is considered sufficiently groomed for the next QA sprint when:

- repository logic has regression protection
- the main user flows are covered at the interaction level
- pose fallback behavior is validated under failure conditions
- browser smoke coverage exists for the most critical route

## Related docs

- [docs/testing-summary.md](testing-summary.md)
- [docs/testing.md](testing.md)
- [Plans/issues/M4-1.md](../Plans/issues/M4-1.md)
- [Plans/issues/M4-2.md](../Plans/issues/M4-2.md)
- [Plans/issues/M4-3.md](../Plans/issues/M4-3.md)
- [Plans/issues/M4-4.md](../Plans/issues/M4-4.md)
