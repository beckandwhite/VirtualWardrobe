# Repository Test Execution Checklist

## Objective

Implement the repository / SQLite regression suite for the highest-priority QA gap described in [Plans/issues/QA-1.md](../Plans/issues/QA-1.md).

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
- [Plans/issues/QA-1.md](../Plans/issues/QA-1.md)

## Workstream 1: test harness setup

### Task 1.1 — create repository test file

- [ ] Create a new Jest suite at [tests/store/repo.test.ts](../tests/store/repo.test.ts) or a small set of store-specific suites.
- [ ] Keep the file focused on repository behavior only.
- [ ] Avoid UI or app-route assumptions.

### Task 1.2 — define a minimal fake DB contract

- [ ] Build a test double with the SQLite methods the repository calls: `getFirstAsync`, `getAllAsync`, `runAsync`, and `withTransactionAsync`.
- [ ] Support insert return values with `lastInsertRowId`.
- [ ] Track rows in memory so CRUD flows can be asserted deterministically.
- [ ] Keep the fake DB narrow and behaviorally faithful to the app’s row schema.

### Task 1.3 — define representative fixtures

- [ ] Add one item row with tags and paths.
- [ ] Add one catalog row with multiple image paths.
- [ ] Add one body photo row.
- [ ] Add one try-on row with a transform payload.
- [ ] Add one app_settings row for onboarding verification.

## Workstream 2: settings and onboarding coverage

### Task 2.1 — settings persistence

- [ ] Test `getSetting` returns `undefined` when the key does not exist.
- [ ] Test `setSetting` writes a key/value pair.
- [ ] Test `getSetting` returns the stored value for a known key.
- [ ] Test repeated writes replace the stored value rather than duplicating it.

### Task 2.2 — onboarding persistence

- [ ] Test `setOnboarded` stores the expected `has_onboarded` value.
- [ ] Test repeated onboarding calls remain stable and do not corrupt the setting.
- [ ] Test onboarding data is readable via `getSetting`.

### Definition of done for this block

- [ ] Settings and onboarding tests pass under the normal Jest workflow.
- [ ] Storage keys and values match the repository contract.

## Workstream 3: item CRUD coverage

### Task 3.1 — insert item

- [ ] Test `insertItem` creates a row with the expected fields.
- [ ] Assert the returned object includes typed values (`id`, `type`, `name`, `color`, `tags`, `imagePath`, `thumbnailPath`, `createdAt`).
- [ ] Confirm `tags` are serialized and restored as arrays.
- [ ] Confirm the `created_at` timestamp is populated.

### Task 3.2 — list and get item

- [ ] Test `listItems` returns rows in descending `created_at` order.
- [ ] Test `getItem` returns the correct item for a valid ID.
- [ ] Test `getItem` returns `undefined` for an invalid or missing ID.
- [ ] Assert item values are converted into the app’s expected domain model shape.

### Task 3.3 — update item

- [ ] Test partial update with a name change.
- [ ] Test partial update with a color change.
- [ ] Test partial update with tags change.
- [ ] Test partial update with a thumbnail path change.
- [ ] Test that undefined patch fields do not trigger unintended writes.
- [ ] Confirm `updateItem` preserves unaffected fields.

### Task 3.4 — delete item

- [ ] Test `deleteItem` removes the selected item row.
- [ ] Confirm `deleteItem` deletes all related `try_ons` rows for the same item.
- [ ] Confirm unrelated rows remain intact.

### Definition of done for this block

- [ ] Create, list, update, and delete item behaviors are all asserted.
- [ ] The repository returns the app’s typed shape, not just raw DB rows.

## Workstream 4: catalog store item coverage

### Task 4.1 — insert catalog item

- [ ] Test `insertStoreItem` persists the catalog metadata correctly.
- [ ] Assert `source` is set to `catalog`.
- [ ] Assert category, name, color, and specs are preserved.
- [ ] Confirm multiple `imagePaths` are serialized and restored correctly.

### Task 4.2 — list catalog items

- [ ] Test `listStoreItems` returns rows ordered by `name`.
- [ ] Test empty or missing `imagePaths` produce a valid empty array.
- [ ] Test `specs` can be `null` without causing a failure.

### Definition of done for this block

- [ ] Catalog persistence behaves as expected under the app’s store schema.
- [ ] The path-array serialization contract is verified.

## Workstream 5: body photo and try-on coverage

### Task 5.1 — body photo persistence

- [ ] Test `insertBodyPhoto` creates a valid record with a path and timestamp.
- [ ] Assert the returned object includes the `id` and `createdAt` values.

### Task 5.2 — try-on persistence

- [ ] Test `insertTryOn` stores the body photo ID, item ID, transform string, and output path.
- [ ] Test `listTryOns` returns rows in descending `created_at` order.
- [ ] Test `deleteTryOn` deletes only the intended item record.
- [ ] Test null output path values remain valid.

### Definition of done for this block

- [ ] User saved try-ons are protected by regression tests.
- [ ] The transform payload is persisted safely and read back without corruption.

## Workstream 6: serialization and edge-case validation

### Task 6.1 — tag parsing

- [ ] Test an empty string becomes `[]`.
- [ ] Test `'a,b,c'` becomes `['a', 'b', 'c']`.
- [ ] Test whitespace is trimmed.
- [ ] Test empty entries are removed.

### Task 6.2 — path parsing

- [ ] Test an empty string becomes `[]`.
- [ ] Test `'a|b|c'` becomes `['a', 'b', 'c']`.
- [ ] Test empty path fragments are removed.

### Task 6.3 — malformed input handling

- [ ] Test missing or empty arrays do not crash repository flows.
- [ ] Test `undefined` patch values are ignored, not applied.
- [ ] Test invalid or missing rows are handled gracefully in `getItem` / `getSetting` patterns.

### Definition of done for this block

- [ ] Serialization helpers are validated in both directions.
- [ ] Hidden data corruption risks are covered by explicit regression tests.

## Acceptance criteria summary

- [ ] Repository CRUD behavior is covered by automated tests.
- [ ] Settings and onboarding persistence are covered.
- [ ] Item lifecycle is covered from insert to delete.
- [ ] Catalog item persistence is covered.
- [ ] Body-photo and try-on persistence is covered.
- [ ] Serialization and edge-case handling are tested.
- [ ] The test suite runs under the standard repo Jest command.
- [ ] No production code is changed outside the test harness and any targeted test-only helpers.

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

- [Plans/issues/QA-1.md](../Plans/issues/QA-1.md)
- [docs/qa-repository-test-plan.md](qa-repository-test-plan.md)
- [docs/testing-summary.md](testing-summary.md)
- [src/store/repo.ts](../src/store/repo.ts)
- [src/store/db.ts](../src/store/db.ts)
