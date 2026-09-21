# QA Sprint Backlog

## Purpose

This backlog consolidates the repo’s current QA planning into a single execution-ready sequence for the next QA or engineering sprint.

The goal is to reduce risk in the highest-value areas without changing production behavior. This is a planning artifact only.

## Current status

Baseline verification is green in the workspace:

- `npm test -- --runInBand` → 8/8 suites passed
- `npx tsc --noEmit` → passed
- `npx eslint . --max-warnings 0` → passed

The project has a solid unit-test foundation **that now includes the persistence/repo layer**
(after QA-1, 2026-09-21). The remaining gaps sit in runtime integration, user-flow coverage,
pose fallback, and browser smoke.

## Prioritization

### P0 — Repository / SQLite regression coverage — **DONE (QA-1, 2026-09-21)**

Primary docs:

- [Plans/issues/QA-1.md](../Plans/issues/QA-1.md)
- [docs/qa-repository-test-plan.md](qa-repository-test-plan.md)
- [docs/qa-repository-test-checklist.md](qa-repository-test-checklist.md)

Why it is first:

- all critical user state is stored here
- data corruption or lifecycle bugs are high-impact
- current unit tests do not cover this contract

Acceptance theme:

- repository CRUD logic is covered
- serialization and edge cases are asserted
- onboarding and saved try-ons are protected

### P1 — Screen flow coverage

Primary doc:

- [Plans/issues/QA-2.md](../Plans/issues/QA-2.md)
- [docs/qa-screen-test-plan.md](qa-screen-test-plan.md)

Why it is next:

- route behavior and state transitions drive the actual user experience
- many app flows are currently unguarded by tests

Acceptance theme:

- onboarding path is validated
- capture and wardrobe flows work as expected
- studio controls and fallback states are covered

### P2 — Pose and runtime fallback coverage

Primary doc:

- [Plans/issues/QA-3.md](../Plans/issues/QA-3.md)
- [docs/qa-pose-and-browser-test-plan.md](qa-pose-and-browser-test-plan.md)

Why it is next:

- the pose pipeline is the app’s most fragile runtime dependency
- fallback behavior is critical when the model is missing or fails

Acceptance theme:

- provider failures are handled without crashes
- manual fallback is a supported path
- degraded-mode behavior is explicit and tested

### P3 — Browser smoke validation

Primary doc:

- [Plans/issues/QA-4.md](../Plans/issues/QA-4.md)
- [docs/qa-pose-and-browser-test-plan.md](qa-pose-and-browser-test-plan.md)

Why it is after P2:

- browser execution requires a browser-capable environment
- this is the most environment-dependent QA workstream

Acceptance theme:

- the web app can load and render the main route
- the studio can run in a basic happy path
- model-absent runs assert the manual fallback instead of failing

## Recommended sprint order

### Sprint 1: storage and state safety

1. repository / SQLite regressions
2. onboarding persistence validation
3. item and try-on lifecycle checks
4. serialization edge cases

### Sprint 2: user experience confidence

1. onboarding workflow tests
2. capture flow tests
3. wardrobe behavior tests
4. studio control tests

### Sprint 3: runtime resilience

1. pose provider fallback tests
2. loader and degraded-mode tests
3. browser smoke path for the studio route
4. model-absent workflow verification

## Definition of ready for each issue

Each QA issue is ready when:

- the behavior under test is tied to a specific source or route
- the expected state transitions are explicit
- failure cases are documented
- the test can be run via the repo’s standard test command or browser-capable workflow
- no hidden dependencies are required for the first pass

## Definition of done for the sprint

The QA sprint is complete when:

- the repository layer is protected by automated regression tests
- the main user flows are covered by screen-level tests
- pose fallback and runtime degraded-mode behavior is asserted
- the critical browser route is smoke-tested in a suitable environment

## Related docs

- [docs/testing-summary.md](testing-summary.md)
- [docs/qa-grooming-plan.md](qa-grooming-plan.md)
- [docs/qa-repository-test-plan.md](qa-repository-test-plan.md)
- [docs/qa-screen-test-plan.md](qa-screen-test-plan.md)
- [docs/qa-pose-and-browser-test-plan.md](qa-pose-and-browser-test-plan.md)
- [Plans/issues/QA-1.md](../Plans/issues/QA-1.md)
- [Plans/issues/QA-2.md](../Plans/issues/QA-2.md)
- [Plans/issues/QA-3.md](../Plans/issues/QA-3.md)
- [Plans/issues/QA-4.md](../Plans/issues/QA-4.md)
