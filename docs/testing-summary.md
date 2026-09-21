# QA Testing Summary

## Executive summary

The repository is in a strong unit-test baseline, with 7 Jest suites passing and 48 tests passing in the current workspace. The suite is especially good at validating pure logic such as garment placement, wardrobe filtering, catalog ingestion, export composition, and locale lookup.

Current baseline evidence:

- `npm test -- --runInBand` → 7/7 suites passed
- 48/48 tests passed
- `npx tsc --noEmit` → passed during the last verification run
- `npx eslint . --max-warnings 0` → passed during the last verification run

## What is currently covered well

### 1. Composer and fitting logic
The test suite validates the core math behind the try-on experience in:

- [tests/autoBox.test.ts](../tests/autoBox.test.ts)
- [tests/composer/transform.test.ts](../tests/composer/transform.test.ts)
- [tests/composer/export.test.ts](../tests/composer/export.test.ts)

This covers:

- empty keypoint handling
- garment placement by category and body structure
- transform clamping and safe defaults
- JSON serialization round-trips
- canvas export ordering and placeholder behavior
- rotation handling in composed output

### 2. Wardrobe filtering
The repository verifies the critical wardrobe browsing rules in:

- [tests/wardrobe/filter.test.ts](../tests/wardrobe/filter.test.ts)

This covers:

- category filtering
- color filtering
- combined facets using AND semantics
- free-text search by name and tags
- empty-query behavior
- no-match behavior

### 3. Catalog ingestion
The project validates the offline catalog bootstrap logic in:

- [tests/catalog/ingest.test.ts](../tests/catalog/ingest.test.ts)

This covers:

- manifest ordering
- duplicate filtering by name
- one-time ingestion semantics
- stale-version recovery behavior
- version flag persistence

### 4. Localization
The app’s localization contract is covered in:

- [tests/i18n/strings.test.ts](../tests/i18n/strings.test.ts)

This covers:

- default locale handling
- locale fallback behavior
- validity checks for locale names
- catalog completeness across the supported locales

## Coverage gaps and risk areas

### 1. Repository / SQLite layer is not covered
The repository layer in [src/store/repo.ts](../src/store/repo.ts) contains a large amount of DB logic, but there are no direct tests for:

- item insert/update/delete flows
- onboarding persistence
- try-on persistence
- storage conversion from string rows to typed objects
- body-photo lifecycles
- error handling around missing rows or invalid shapes

Risk: logic that looks simple in code can still fail under real Expo SQLite conditions.

### 2. UI flow and screen logic is not tested
The app screens in [app](../app) include several user interactions that are not covered by automated tests:

- onboarding permission flow
- redirect logic from the index route
- capture flow selection (camera vs library)
- save path after capture
- wardrobe list refresh behavior
- studio transform editing workflow
- share/export actions and user-facing errors

Risk: route logic and local state transitions can regress without a UI-level or component-level regression suite.

### 3. Pose-provider and fallback logic is lightly tested
The pose logic is partly covered, but the integration points that matter for app reliability are not fully exercised:

- [src/pose/index.ts](../src/pose/index.ts)
- [src/pose/providers.ts](../src/pose/providers.ts)
- [src/pose/providers.web.ts](../src/pose/providers.web.ts)
- [src/pose/poseLoader.ts](../src/pose/poseLoader.ts)

Missing validation for:

- provider selection by platform
- fallback from model failure to manual path
- safeEstimate degradation behavior
- loader single-flight behavior
- loading and failure state transitions

Risk: an unavailable model or provider initialization issue could break the studio in a way that unit tests do not catch.

### 4. Browser and app-level smoke tests are still deferred
The repo documents the browser-based capability gap in [Plans/issues/M3-5.md](../Plans/issues/M3-5.md). The current suite does not validate:

- Expo web startup
- actual rendering of the Studio route
- body photo loading and pose execution in-browser
- screenshot-based regressions for the try-on flow

Risk: the app can pass unit tests and still fail in a browser due to runtime wiring, asset loading, or UI behavior.

### 5. Error-path coverage is limited
There are strong happy-path tests, but limited coverage for:

- failed image loads
- invalid export data
- permission denied states
- malformed serialized transforms
- duplicate or conflicting user actions

Risk: a broken edge condition can produce silent failures that are not protected by tests.

## Recommended test strategy

### Priority 1: database and state regressions
Add repository-level tests for data persistence and conversion behavior.

### Priority 2: user flow tests
Add screen-level tests for onboarding, capture, wardrobe, and studio interactions.

### Priority 3: pose-provider resilience
Add provider and loader tests for fallback paths, failures, and platform selection.

### Priority 4: browser smoke validation
Create a browser-driven smoke test for the studio route once a capable environment is available.

## QA conclusion

The project is in a solid initial quality state for pure logic and deterministic domain logic, but it is not yet broad enough to serve as a production confidence suite. The next most valuable investment is not more random unit tests; it is coverage for data persistence, real app flow, and the pose fallback integration path.
