# Testing Guide

This project includes unit tests and a few validation scripts. The repository is in active development, so tests are focused on the stable core logic and local validation.

## Run the test suite

```bash
npm test
```

This executes Jest across the project.

## Coverage

### Run with coverage

```bash
npm test -- --coverage --runInBand
```

Or to see only the summary line:

```bash
npm test -- --coverage --runInBand 2>&1 | grep "^All files"
```

### Coverage denominator

The `collectCoverageFrom` config in `jest.config.mjs` sets the denominator to every
production TypeScript/TSX file under `src/`, `app/`, and `modules/`. Files that no
test imports are included as 0% entries so they cannot inflate the headline.

**Exclusions** (documented in `jest.config.mjs`):

| Pattern | Reason |
|---------|--------|
| `**/*.d.ts` | Ambient type declarations — no executable statements |

Platform variants (`*.web.ts`, `*.web.tsx`) remain in scope: they are production code
for the web target and their uncovered state should be visible, not hidden.
Native-language sources (Swift/Kotlin) are tracked via the separate native
verification workstream (issue #84).

### Thresholds

`coverageThreshold` in `jest.config.mjs` enforces minimums on the **full production
surface**. CI fails when any threshold regresses. The table below shows the initial
baseline (measured 2026-10-07) and the enforced threshold for each metric:

| Metric | Measured baseline | Enforced threshold |
|--------|------------------:|-------------------:|
| Statements | 40.03 % | 38 % |
| Branches | 49.74 % | 48 % |
| Functions | 38.73 % | 37 % |
| Lines | 45.44 % | 43 % |

Raise a threshold whenever it drifts more than a point or two below the current
measured value. Never lower it.

### CI coverage summary

The **"Jest tests and coverage"** GitHub Actions job appends a coverage table (all
four metrics, covered / total counts) to the workflow step summary for every push and
pull request.

## Type checking

```bash
npm run typecheck
```

This runs TypeScript without emitting build files and is useful for catching type issues early.

## Linting

```bash
npm run lint
```

This runs ESLint with the repo's warning threshold set to zero for errors or warnings.

## Formatting

```bash
npm run format
```

This formats source files and docs with Prettier.

## Pose smoke checks

The project contains helper scripts for the pose model path and web smoke checks.

### Check the pose model decision logic

```bash
npm run e2e:pose:check
```

This validates the model-path decision logic used by the automatic pose flow.

### Full pose smoke script

```bash
npm run e2e:pose
```

This is intended to run in a browser-capable environment. It may be skipped or adapted depending on whether the model assets are available on the machine.

## Good local validation loop

For a typical development session, use:

```bash
npm run typecheck
npm run lint
npm test
```

Then run the app locally with:

```bash
npm run web
```

## QA summary

For a coverage assessment and a prioritized list of QA gaps, see [docs/testing-summary.md](testing-summary.md).

For execution-ready planning and implementation guidance for the next QA iteration, see [docs/qa-grooming-plan.md](qa-grooming-plan.md).

For the most immediate implementation-ready repository test plan, see [docs/qa-repository-test-plan.md](qa-repository-test-plan.md).

For the exact execution checklist to implement the first QA test sprint, see [docs/qa-repository-test-checklist.md](qa-repository-test-checklist.md).

For the next major UI-focused QA workstream, see [docs/qa-screen-test-plan.md](qa-screen-test-plan.md).

For the runtime pose and browser validation stream, see [docs/qa-pose-and-browser-test-plan.md](qa-pose-and-browser-test-plan.md).

For the consolidated next sprint queue, see [docs/qa-sprint-backlog.md](qa-sprint-backlog.md).

The project currently has a solid unit-test baseline, but the highest-value gaps are the repository/SQLite layer, screen-level flows, and pose fallback integration checks.

## Test areas in the repo

Current tests are organized under the [tests](tests) folder and cover areas such as:

- wardrobe filtering
- catalog ingestion
- composer transforms and exports
- pose keypoint utilities
- localization strings

Additional checks and app-level verification are covered in the developer setup notes in [docs/dev-setup.md](docs/dev-setup.md).
