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
- [x] Screen transitions are covered at the component or route level
- [x] Permission and empty-state branches are tested
- [x] A user flow can be verified without manual device use
- [x] Critical studio controls are covered by regression tests

## Notes
This should be the next major QA layer after repository tests. It closes the gap between pure logic tests and real app behavior.

## Decision log
- **D29.1 — onboarding camera-feedback is one source of truth, not two.**
  `app/onboarding.tsx` had an *inline copy* of `onboardingCameraState`/`OnboardingCameraState`
  that could drift from `src/onboarding/cameraState.ts`. Deleted the inline copy; the screen now
  imports the pure branch from `src/onboarding/cameraState.ts` (the file the QA-2 tests exercise).
  The screen keeps the `PermissionResponse` type at its call site; `cameraState.ts` keeps a
  structural `CameraPermissionStatus` so it stays node/jest-importable. Single source of truth.
- **D29.2 — extract the *decision*, leave a thin view, not a rendering harness.** No
  `@testing-library/react-native` and no device (per repo policy). Each screen's decision is pulled
  into a node-safe `src/` module that the screen imports and the test drives: entry redirect →
  `src/onboarding/entryRedirect.ts` (`entryRedirect(onboarded): 'loading'|'/onboarding'|'/wardrobe'`);
  capture draft → `src/capture/draft.ts` (`buildDraftFromCapture` + `captureNextStep`);
  wardrobe empty-state → `src/wardrobe/emptyState.ts` (`emptyStateVariant` + `hasActiveCriteria`);
  studio notice → `src/composer/notice.ts` (`noticeForShare` + `EXPORT_ERROR_NOTICE` + `canShareRow`).
  Each screen is the thin view that calls the extracted function; tests assert the pure logic with
  no router / store / UI. Mirrors the existing `tests/catalog/ingest.test.ts` fake style.
- **D29.3 — `captureNextStep` is a typed discriminated union, not a loose flag.** The screen's
  `router.replace` needs a typed `Href` literal; the helper returns
  `{ navigate: true; route: '/wardrobe' } | { navigate: false; route: null }` so a null draft (the
  cancel / denial / error branch) resets busy and never navigates, while a built draft narrows to the
  typed route. The "on nothing captured / on error, don't navigate" branch is the null-draft case.
- **D29.4 — empty-state selection is a pure selector over the *snapshot*, not the view.** The
  wardrobe screen already derives `visible = applyFilters(items, criteria, query)` (covered by
  `tests/wardrobe/filter.test.ts`); this suite adds the part the screen owns — `emptyStateVariant`
  (`none` when the snapshot is empty, `filtered` when items exist but none match, `has-items`
  otherwise) + `hasActiveCriteria`. `applyFilters` is reused, not duplicated.
- **D29.5 — studio transform sliders + export are already covered; this adds the *notice* gap.** The
  critical studio controls (`clampTransform`, `autoTransformFor`, `serializeTransform`/
  `deserializeTransform`, manual-fallback = empty keypoints → identity + dismissible banner) and the
  export geometry (`compose`) are already regression-tested in `tests/composer/transform.test.ts` and
  `tests/composer/export.test.ts` — not duplicated here. `src/composer/notice.ts` covers the one
  branch those suites don't: the error-rendering surface (`noticeForShare` / `EXPORT_ERROR_NOTICE` /
  `canShareRow`) the studio renders from a share result or a failed export. The native share sheet /
  browser export are not runtime-exercised (same in-sandbox ceiling as D20.5 / D21.6), but every
   *decision* feeding them is asserted here.

## Status: BUILT (2026-09-22)
Gate-green (tsc + eslint exit 0 + jest 129 tests / 15 suites). QA-2 contributes **39 tests across 5
new suites** (onboarding × 2, capture, wardrobe, composer-notice); the full run also picks up the
concurrent QA-3 / QA-4 suites. The onboarding duplication (D29.1) was fixed and the four screens now
call their extracted pure logic.

### Built
- `tests/onboarding/cameraState.test.ts` — onboarding permission branches (`granted` / `none` =
  not-asked / `denied` = `canAskAgain false` / `notgranted` = `canAskAgain true`, incl. the
  `canAskAgain ?? true` default and a null status), the copy-key mapping (`cameraStateMessageKey`),
  and the continuation transition (`continueOnboardingTransition`: persist `has_onboarded='1'` +
  `replace /wardrobe`). Drives `src/onboarding/cameraState.ts`.
- `tests/onboarding/entryRedirect.test.ts` — all three entry branches (`null` → loading, `false` →
  `/onboarding`, `true` → `/wardrobe`). Drives `src/onboarding/entryRedirect.ts`.
- `tests/capture/draft.test.ts` — the add-item flow: `buildDraftFromCapture` (library vs camera tag,
  hint appended / omitted when empty, `type='other'` + default color draft, null result → null) and
  `captureNextStep` (null draft resets busy + no nav; built draft → `/wardrobe`). Drives
  `src/capture/draft.ts`.
- `tests/wardrobe/emptyState.test.ts` — empty-state selection (`none` vs `filtered` vs `has-items`,
  snapshot-priority, derived from `applyFilters`) and `hasActiveCriteria` (facet/color/whitespace).
  Drives `src/wardrobe/emptyState.ts`; reuses `src/wardrobe/filter.ts`.
- `tests/composer/notice.test.ts` — save/share error rendering: `noticeForShare` (downloaded /
  shared → info, error → error notice), `EXPORT_ERROR_NOTICE` (failed export never silent),
  `canShareRow` (null-row guard), and the device-free save→share→notice decision. Drives
  `src/composer/notice.ts`.
- **Fix (D29.1):** deleted `app/onboarding.tsx`'s inline `onboardingCameraState`/`OnboardingCameraState`
  copy; it now imports from `src/onboarding/cameraState.ts`. `app/index.tsx`, `app/capture.tsx`,
  `app/(tabs)/wardrobe.tsx`, and `app/studio.tsx` were wired to call their extracted logic.
- **Config:** added `@/onboarding/*` to `tsconfig.json` `paths` (jest's `moduleNameMapper` already
  resolved `@/` via `jest.config.mjs`; tsc needed the explicit mapping).

### Verified against
- `src/onboarding/cameraState.ts` / `src/onboarding/entryRedirect.ts`
     - [x] camera-feedback branches: granted / none (not-asked + null status) / denied (`canAskAgain
      false`) / notgranted (`canAskAgain true` + the `?? true` default); copy-key mapping per state.
     - [x] continuation transition persists `has_onboarded='1'` and replaces `/wardrobe`.
     - [x] entry redirect: all three branches (`null`→loading, `false`→`/onboarding`, `true`→`/wardrobe`).
- `src/capture/draft.ts`
     - [x] library capture → `['draft','library']`; camera capture → `['draft','camera']`; hint chip
      appended when set, omitted when empty; draft is `type='other'` / `name='New item'` /
       `color='unknown'` (M1-1 / D19.5); null result → `null` (no insert, no nav).
     - [x] `captureNextStep`: null draft → `{ navigate:false, route:null }` (reset busy, no nav);
      built draft → `{ navigate:true, route:'/wardrobe' }`.
- `src/wardrobe/emptyState.ts`
     - [x] `emptyStateVariant`: `none` (empty snapshot), `filtered` (items exist, none match),
       `has-items` (visible); snapshot-empty takes priority; variants derive from `applyFilters`.
     - [x] `hasActiveCriteria`: false on no facet + blank/whitespace query; true on category/color
      facet or a non-blank query.
- `src/composer/notice.ts` (studio save/share + error rendering)
     - [x] `noticeForShare`: `downloaded`/`shared` → info notice (downloaded names the image),
       `error` → error notice; `EXPORT_ERROR_NOTICE` is a red error notice; `canShareRow` guards a
      null row; the save→share→notice decision is asserted device-free.
     - [x] studio transform sliders + export **covered by existing suites**
       `tests/composer/transform.test.ts` (`clampTransform`, `autoTransformFor` incl. empty-keypoint
      identity fallback, `serialize`/`deserialize` round-trip + malformed recovery) and
       `tests/composer/export.test.ts` (`compose` layer geometry, placeholder skip, rotation).

### Follow-ups
- **Native share sheet + browser export are not runtime-exercised** (no simulator / browser in the
  sandbox — same in-sandbox ceiling as D20.5 / D21.6 / M3-1). Every *decision* feeding them is
  asserted; only the actual `expo-sharing` / `document.canvas` calls are not. M3-5 / M3-9 (Playwright
  harness) is the path to a real end-to-end share screenshot.
- **`captureNextStep` carries only the navigation decision** (`navigate` + `route`), not `busy`:
  the screen's `setBusy(false)` on the null-draft / error branch is a UI side-effect left in the
  view; the *decision to not navigate* (the safety property) is what's extracted + asserted. The
  screen's own error paths (`useCapture` throw → `null` → `captureNextStep(null)`, and the
   `captureAndSave` `catch` → `setBusy(false)`) both funnel through this helper.

### Stats
| check | result |
|---|---|
| `tsc --noEmit` | ✅ PASS |
| `eslint . --max-warnings 0` | ✅ PASS (exit 0) |
| `jest` | ✅ PASS (129 tests / 15 suites — QA-2 adds 39 across 5 new suites: `onboarding/cameraState`, `onboarding/entryRedirect`, `capture/draft`, `wardrobe/emptyState`, `composer/notice`) |
