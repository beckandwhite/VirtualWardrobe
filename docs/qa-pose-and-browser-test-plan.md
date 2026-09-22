# Pose and Browser Test Execution Plan

## Objective

Create an implementation-ready plan for the final major QA workstream: pose-system resilience and browser-level validation. This closes the remaining risk area after repository and screen-level automation: runtime behavior in the web app and the pose fallback path.

## Why this matters

The app’s highest-risk runtime dependencies are:

- the MoveNet pose model and provider selection
- browser rendering of the Expo web build
- failure handling when the model is missing or cannot load
- graceful fallback to the manual placement path

The repository already validates the pure math and data logic, but not the real runtime behavior in the browser or the degraded-mode system behavior.

## Scope

### Primary source areas

- [src/pose](../src/pose)
- [src/composer](../src/composer)
- [app/studio.tsx](../app/studio.tsx)
- [docs/dev-setup.md](dev-setup.md)
- [M3-5](https://github.com/beckandwhite/VirtualWardrobe/issues/18)

### In scope

- pose provider selection by platform
- pose estimation failure handling
- manual fallback behavior
- browser startup smoke validation
- minimal end-to-end try-on flow in web
- model-absent path assertions

### Out of scope

- full native simulator E2E validation
- large visual regression suites
- production deployment verification
- deep device-specific browser testing

## Test strategy

This work should be split into two layers:

1. Runtime unit/integration tests for provider logic and fallback behavior
2. Browser smoke tests for the Expo web app in a browser-capable environment

This preserves fast feedback for local development while still covering the real browser-facing risk.

## Workstream 1: pose provider and fallback resilience

### Target files

- [src/pose/poseLoader.ts](../src/pose/poseLoader.ts)
- [src/pose/providers.ts](../src/pose/providers.ts)
- [src/pose/providers.web.ts](../src/pose/providers.web.ts)
- [src/pose/PoseProvider.ts](../src/pose/PoseProvider.ts)
- [src/pose/index.ts](../src/pose/index.ts)

### Proposed tests

#### A. Provider selection

- [ ] `createPoseProvider()` resolves the correct provider for the current platform branch.
- [ ] The web provider path is selected in a browser environment.
- [ ] The native/manual path is selected when the web branch is unavailable.
- [ ] Platform selection does not crash even when runtime is partially initialized.

#### B. Safe estimation behavior

- [ ] A healthy provider returns normalized keypoints.
- [ ] A failing provider produces a safe fallback result instead of throwing.
- [ ] Empty or malformed keypoint data is handled gracefully.
- [ ] The studio still renders a usable manual transform path when pose estimation fails.

#### C. Loader behavior

- [ ] Loading state is reported correctly when initialization starts.
- [ ] A failed load results in a controlled fallback path.
- [ ] The loader does not retry endlessly or block the UI on repeated attempts.
- [ ] A successful initialization returns a reusable cached detector.

#### D. Manual fallback path

- [ ] The manual fallback banner is displayed when the model is absent or inaccessible.
- [ ] The user can continue editing the garment transform without a crash.
- [ ] The app does not silently fail when auto-placement is unavailable.

### Acceptance criteria

- [ ] Pose-provider failure scenarios are covered.
- [ ] Manual fallback is asserted as a supported behavior.
- [ ] The loader and provider contract remain stable under degraded conditions.

## Workstream 2: browser smoke validation

### Target files

- [app/studio.tsx](../app/studio.tsx)
- [scripts/pose-smoke.mjs](../scripts/pose-smoke.mjs)
- [scripts/pose-smoke-path.mjs](../scripts/pose-smoke-path.mjs)
- [docs/dev-setup.md](dev-setup.md)
- [M3-5](https://github.com/beckandwhite/VirtualWardrobe/issues/18)

### Proposed tests

#### A. Expo web startup

- [ ] The app starts in a browser-capable environment.
- [ ] The main route loads without fatal runtime errors.
- [ ] The studio route renders with or without pose auto-placement.

#### B. Minimal happy path

- [ ] A sample body photo and garment are loaded into the try-on flow.
- [ ] The app either auto-places the garment or falls back to manual adjustment.
- [ ] The studio remains interactive and does not crash.

#### C. Model-absent behavior

- [ ] When the model is missing, the app asserts the manual fallback path instead of failing.
- [ ] The smoke test does not fail solely because the pose model is not available.
- [ ] The relevant banner or status text is checked as a user-visible guardrail.

#### D. Artifact generation

- [ ] Capture a screenshot or smoke trace when a browser-capable environment is available.
- [ ] Document the run output in a demo note if the environment supports it.

### Acceptance criteria

- [ ] A browser-level smoke path exists for the critical route.
- [ ] Model-absent runs are handled as a valid manual fallback state.
- [ ] The smoke path validates that the studio does not crash during load.
- [ ] Browser environment constraints are called out clearly if unavailable.

## Execution order

1. Add provider and fallback unit/integration checks.
2. Add the minimal browser smoke coverage in a browser-capable environment.
3. Validate the model-absent path as a supported degraded mode.
4. Use the results to refine the user-facing messaging around manual fallback.

## Suggested test file layout

- [tests/pose/provider-fallback.test.ts](../tests/pose/provider-fallback.test.ts)
- [tests/app/studio-runtime.test.ts](../tests/app/studio-runtime.test.ts)
- optional browser smoke script under the existing scripts folder

## Risks to watch for

- model initialization failure can masquerade as a general rendering failure
- browser-only code paths may pass in unit tests but fail on actual runtime due to platform assumptions
- silent fallback may hide a bigger pose pipeline issue if not explicitly asserted
- missing model assets may confuse the smoke path unless the fallback logic is enforced intentionally

## Definition of done

The pose + browser QA work is complete when:

- pose fallback behavior is explicitly covered and asserted
- model-absent runs are treated as a valid degraded-mode path
- browser smoke coverage exists for the critical route in a suitable environment
- the app does not silently fail during the main studio flow

## Related docs

- [docs/testing-summary.md](testing-summary.md)
- [docs/qa-grooming-plan.md](qa-grooming-plan.md)
- [M4-3](https://github.com/beckandwhite/VirtualWardrobe/issues/30)
- [M4-4](https://github.com/beckandwhite/VirtualWardrobe/issues/31)
- [M3-5](https://github.com/beckandwhite/VirtualWardrobe/issues/18)
- [src/pose](../src/pose)
- [app/studio.tsx](../app/studio.tsx)
