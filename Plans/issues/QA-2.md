# QA-2 · Add screen-level flow tests for onboarding, capture, and studio

Milestone: QA · Labels: qa, coverage, ux, M3

## Description
The app’s core screens are not covered at the interaction level. The repository validates the math and filter logic, but not the route-level or screen-level behaviors that determine whether the app works for a user.

## Scope
Add tests for:

- onboarding permission request and continuation flow
- redirect behavior from the entry screen
- add-item flow from capture to wardrobe
- wardrobe refresh and empty-state handling
- studio transform sliders and manual adjustments
- save/share flow and error rendering

## Acceptance criteria
- [ ] Screen transitions are covered at the component or route level
- [ ] Permission and empty-state branches are tested
- [ ] A user flow can be verified without manual device use
- [ ] Critical studio controls are covered by regression tests

## Notes
This should be the next major QA layer after repository tests. It closes the gap between pure logic tests and real app behavior.
