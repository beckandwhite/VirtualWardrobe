# QA-3 · Add pose-provider failure and fallback regression tests

Milestone: QA · Labels: qa, coverage, ml, M3

## Description
The pose flow is likely the most fragile integration in the app because it depends on runtime environment, model availability, and platform branching. The current tests cover pure keypoint transformation logic, but not the full provider/fallback path that the app depends on at runtime.

## Scope
Test:

- provider selection between web and native paths
- `safeEstimate` behavior when the provider fails
- fallback to manual transform path when estimation fails
- loader single-flight behavior and failed-load state
- model absence / invalid URL handling

## Acceptance criteria
- [ ] Pose-provider fallback logic is tested under failure conditions
- [ ] Manual fallback path is asserted as a supported behavior
- [ ] The web/native split is validated by platform-aware logic
- [ ] A regression around missing model data is prevented

## Notes
This is especially important because the pose feature is optional in some environments yet critical in the web flow.
