# Repository Test Execution Checklist

## Status: DONE (2026-09-21) — `tests/store/repo.test.ts` (28 tests, gate-green)

> This checklist was implemented by `tests/store/repo.test.ts` (M4-1). The repository layer is now
> protected: `npx jest` is **76/76 across 8 suites** (was 48/7), `tsc`/`eslint` clean. A few
> sub-items were adapted to the *actual* production contract rather than an ideal one — notably
> path fragments (D26.2: `rowToPaths` does not trim whitespace the way `rowToTags` does), which is
> asserted as-is and recorded in `Plans/decision-log.md` D26.

## Objective

Implement the repository / SQLite regression suite for the highest-priority QA gap described in [Plans/issues/M4-1.md](../Plans/issues/M4-1.md).

This checklist is sprint-ready and intentionally focused on execution. It assumes no product scope changes and no production code refactoring beyond the test harness itself.

## Execution priority

Priority: P0

This is the first QA implementation task because it protects the app’s persistent local state layer, which is the foundation for onboarding, wardrobe management, and saved try-ons.

## Scope

### Primary source files under test

- [src/store/repo.ts](../src/store/repo.ts)
- [src/store/db.ts](../src/store/db.ts)
- [src/store/index.ts](../src/store/index.ts)

### Existing supporting docs

- [docs/qa-repository-test-plan.md](qa-repository-test-plan.md)
- [docs/testing-summary.md](testing-summary.md)
- [Plans/issues/M4-1.md](../Plans/issues/M4-1.md)

## Workstream 1: test harness setup

### Task 1.1 — create repository test file

- [x] Create a new Jest suite at [tests/store/repo.test.ts](../tests/store/repo.test.ts) or a small set of store-specific suites.
- [x] Keep the file focused on repository behavior only.
- [x] Avoid UI or app-route assumptions.

### Task 1.2 — define a minimal fake DB contract

- [x] Build a test double with the SQLite methods the repository calls: `getFirstAsync`, `getAllAsync`, `runAsync`, and `withTransactionAsync`.
- [x] Support insert return values with `lastInsertRowId`.
- [x] Track rows in memory so CRUD flows can be asserted deterministically.
- [x] Keep the fake DB narrow and behaviorally faithful to the app’s row schema.

### Task 1.3 — define representative fixtures

- [x] Add one item row with tags and paths.
- [x] Add one catalog row with multiple image paths.
- [x] Add one body photo row.
- [x] Add one try-on row with a transform payload.
- [x] Add one app_settings row for onboarding verification.

## Workstream 2: settings and onboarding coverage

### Task 2.1 — settings persistence

- [x] Test `getSetting` returns `undefined` when the key does not exist.
- [x] Test `setSetting` writes a key/value pair.
- [x] Test `getSetting` returns the stored value for a known key.
- [x] Test repeated writes replace the stored value rather than duplicating it.

### Task 2.2 — onboarding persistence

- [x] Test `setOnboarded` stores the expected `has_onboarded` value.
- [x] Test repeated onboarding calls remain stable and do not corrupt the setting.
- [x] Test onboarding data is readable via `getSetting`.

### Definition of done for this block

- [x] Settings and onboarding tests pass under the normal Jest workflow.
- [x] Storage keys and values match the repository contract.

## Workstream 3: item CRUD coverage

### Task 3.1 — insert item

- [x] Test `insertItem` creates a row with the expected fields.
- [x] Assert the returned object includes typed values (`id`, `type`, `name`, `color`, `tags`, `imagePath`, `thumbnailPath`, `createdAt`).
- [x] Confirm `tags` are serialized and restored as arrays.
- [x] Confirm the `created_at` timestamp is populated.

### Task 3.2 — list and get item

- [x] Test `listItems` returns rows in descending `created_at` order.
- [x] Test `getItem` returns the correct item for a valid ID.
- [x] Test `getItem` returns `undefined` for an invalid or missing ID.
- [x] Assert item values are converted into the app’s expected domain model shape.

### Task 3.3 — update item

- [x] Test partial update with a name change.
- [x] Test partial update with a color change.
- [x] Test partial update with tags change.
- [x] Test partial update with a thumbnail path change.
- [x] Test that undefined patch fields do not trigger unintended writes.
- [x] Confirm `updateItem` preserves unaffected fields.

### Task 3.4 — delete item

- [x] Test `deleteItem` removes the selected item row.
- [x] Confirm `deleteItem` deletes all related `try_ons` rows for the same item.
- [x] Confirm unrelated rows remain intact.

### Definition of done for this block

- [x] Create, list, update, and delete item behaviors are all asserted.
- [x] The repository returns the app’s typed shape, not just raw DB rows.

## Workstream 4: catalog store item coverage

### Task 4.1 — insert catalog item

- [x] Test `insertStoreItem` persists the catalog metadata correctly.
- [x] Assert `source` is set to `catalog`.
- [x] Assert category, name, color, and specs are preserved.
- [x] Confirm multiple `imagePaths` are serialized and restored correctly.

### Task 4.2 — list catalog items

- [x] Test `listStoreItems` returns rows ordered by `name`.
- [x] Test empty or missing `imagePaths` produce a valid empty array.
- [x] Test `specs` can be `null` without causing a failure.

### Definition of done for this block

- [x] Catalog persistence behaves as expected under the app’s store schema.
- [x] The path-array serialization contract is verified.

## Workstream 5: body photo and try-on coverage

### Task 5.1 — body photo persistence

- [x] Test `insertBodyPhoto` creates a valid record with a path and timestamp.
- [x] Assert the returned object includes the `id` and `createdAt` values.

### Task 5.2 — try-on persistence

- [x] Test `insertTryOn` stores the body photo ID, item ID, transform string, and output path.
- [x] Test `listTryOns` returns rows in descending `created_at` order.
- [x] Test `deleteTryOn` deletes only the intended item record.
- [x] Test null output path values remain valid.

### Definition of done for this block

- [x] User saved try-ons are protected by regression tests.
- [x] The transform payload is persisted safely and read back without corruption.

## Workstream 6: serialization and edge-case validation

### Task 6.1 — tag parsing

- [x] Test an empty string becomes `[]`.
- [x] Test `'a,b,c'` becomes `['a', 'b', 'c']`.
- [x] Test whitespace is trimmed.
- [x] Test empty entries are removed.

### Task 6.2 — path parsing

- [x] Test an empty string becomes `[]`.
- [x] Test `'a|b|c'` becomes `['a', 'b', 'c']`.
- [x] Test empty path fragments are removed. (Note D26.2: unlike tags, `rowToPaths` does **not** trim whitespace — a `' '` fragment survives; asserted as-is and flagged as a latent robustness note.)

### Task 6.3 — malformed input handling

- [x] Test missing or empty arrays do not crash repository flows.
- [x] Test `undefined` patch values are ignored, not applied.
- [x] Test invalid or missing rows are handled gracefully in `getItem` / `getSetting` patterns.

### Definition of done for this block

- [x] Serialization helpers are validated in both directions.
- [x] Hidden data corruption risks are covered by explicit regression tests.

## Acceptance criteria summary

- [x] Repository CRUD behavior is covered by automated tests.
- [x] Settings and onboarding persistence are covered.
- [x] Item lifecycle is covered from insert to delete.
- [x] Catalog item persistence is covered.
- [x] Body-photo and try-on persistence is covered.
- [x] Serialization and edge-case handling are tested.
- [x] The test suite runs under the standard repo Jest command.
- [x] No production code is changed outside the test harness and any targeted test-only helpers.

## Exit criteria

This issue is complete when:

- the repository-focused test suite passes in CI/local Jest runs
- all acceptance criteria above are implemented and documented
- the test cases are deterministic and non-UI-dependent
- there are no silent data-shape regressions in the storage layer

## Implementation notes

- Prefer a fake DB over broad mock-heavy test setup.
- Assert domain objects, not just DB rows.
- Validate the storage contract directly; the app depends on it strongly.
- Keep the tests small but complete; repository testing is higher-value than large UI scaffolding work for this phase.

## Related files

- [Plans/issues/M4-1.md](../Plans/issues/M4-1.md)
- [docs/qa-repository-test-plan.md](qa-repository-test-plan.md)
- [docs/testing-summary.md](testing-summary.md)
- [src/store/repo.ts](../src/store/repo.ts)
- [src/store/db.ts](../src/store/db.ts)
