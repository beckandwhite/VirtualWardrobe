# Screen Test Execution Plan

## Objective

Create a realistic, implementation-ready plan for adding screen-level coverage to the app’s major flows without writing the production code itself. This work addresses the second highest-value QA gap identified in [docs/testing-summary.md](testing-summary.md).

## Why this is next

The repo already validates deterministic logic, but the app’s user-facing behavior is driven by route transitions, UI state, screen branching, and permission flows. These are not currently protected by automated checks.

## Scope

### Primary areas under test

- [app/index.tsx](../app/index.tsx)
- [app/onboarding.tsx](../app/onboarding.tsx)
- [app/capture.tsx](../app/capture.tsx)
- [app/(tabs)/wardrobe.tsx](../app/(tabs)/wardrobe.tsx)
- [app/studio.tsx](../app/studio.tsx)
- [src/store/repo.ts](../src/store/repo.ts)

### Related behavior

- redirect logic
- onboarding permission request flow
- empty inventory states
- search/filter behavior
- capture flow entry/exit
- try-on studio transform controls
- save/share error surfaces and user feedback

## Test strategy

Use component-level or screen-level tests that interact with the UI and validate user-visible state changes. Favor integration-style tests that exercise route state and state updates without needing full native device runtime.

## Proposed test suites

### Suite A: app entry and onboarding

#### Test cases

- app starts in a loading state before onboarding status is resolved
- onboarding redirects uninitialized users to `/onboarding`
- onboarded users redirect to `/wardrobe`
- camera permission request renders the expected state when granted or denied
- finish action persists onboarding state and navigates to the wardrobe screen

#### Assertions

- navigation calls are correct
- permission statuses render matching user feedback
- onboarding state is persisted via the repository contract

### Suite B: capture flow

#### Test cases

- user can choose the library capture path
- user can choose the camera capture path when available
- optional hint chips update the selected hint state
- busy state prevents duplicate actions while saving
- successful save returns to the wardrobe screen
- failed save keeps the user in a stable error state without crashing

#### Assertions

- button availability matches the app state
- navigation and persistence calls happen in the expected order
- error handling is surfaced without silent failure

### Suite C: wardrobe screen

#### Test cases

- empty wardrobe shows the correct empty-state prompt
- non-empty wardrobe renders the item grid
- free-text search narrows results
- category filter narrows results
- color filter narrows results
- combined filters use AND semantics
- clearing filters restores the full list
- refresh action triggers a reload path
- try-on action navigates to the studio route with the selected item

#### Assertions

- list contents match the expected filter state
- count text and filter state remain consistent
- navigation targets are correct

### Suite D: studio screen

#### Test cases

- a garment and body image are resolved correctly
- auto-placement applies when pose estimation succeeds
- manual fallback banner appears when pose estimation fails or is unavailable
- drag interaction updates transform state
- scale controls clamp to valid limits
- rotation and opacity controls clamp to their valid ranges
- reset action restores the baseline transformed position
- save action serializes the current transform
- share/export error surfaces a visible notice

#### Assertions

- transform values remain bounded
- UI response paths align with the current state model
- manual fallback appears without throwing errors
- user visible notices are present when actions fail

## Acceptance criteria

- [ ] Entry and onboarding route behavior is covered.
- [ ] Capture flow actions and error states are covered.
- [ ] Wardrobe search/filter flows are covered.
- [ ] Studio transform and fallback flows are covered.
- [ ] Navigation and persistence flows are validated using real screen behavior.
- [ ] The tests run under the standard Jest suite.

## Implementation notes

### Preferred tooling

Use the existing Jest setup and add screen/component tests that exercise behavior through UI logic and state transitions. Avoid over-mocking the entire app. Instead, mock the lowest-level boundaries that preserve the real behavior under test.

### Recommended test boundaries

- mock database access only at the repo boundary if needed
- keep screen logic and route behavior real
- test actual visible states and callbacks instead of mock-only IDs

### Guardrails

- no test-only production methods
- no assertion on mock-only internals if the real UI surface can be asserted instead
- cover the real user flow, not only a helper function

## Risks and edge conditions to cover

- denied camera permission
- empty garment list
- no pose inference available
- manual fallback path
- save/share failure while the user is in the studio
- invalid transform values or clamped limits
- route transitions during async load

## Suggested file layout

Add a dedicated suite under:

- [tests/app](../tests)

Example names:

- [tests/app/onboarding.test.ts](../tests/app/onboarding.test.ts)
- [tests/app/capture.test.ts](../tests/app/capture.test.ts)
- [tests/app/wardrobe.test.ts](../tests/app/wardrobe.test.ts)
- [tests/app/studio.test.ts](../tests/app/studio.test.ts)

## Definition of done

The screen-level QA work is complete when:

- the major user flows are covered by automated tests
- route redirection and state transitions are asserted
- fallback and error handling are covered
- the suite passes as part of the standard repo verification flow

## Related docs

- [docs/testing-summary.md](testing-summary.md)
- [docs/qa-grooming-plan.md](qa-grooming-plan.md)
- [M4-2](https://github.com/beckandwhite/VirtualWardrobe/issues/29)
- [app/index.tsx](../app/index.tsx)
- [app/onboarding.tsx](../app/onboarding.tsx)
- [app/capture.tsx](../app/capture.tsx)
- [app/(tabs)/wardrobe.tsx](../app/(tabs)/wardrobe.tsx)
- [app/studio.tsx](../app/studio.tsx)
