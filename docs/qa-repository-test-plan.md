# Repository Test Implementation Plan

## Goal

Create a focused, implementation-ready test plan for the repository layer in [src/store/repo.ts](../src/store/repo.ts) and the database contract in [src/store/db.ts](../src/store/db.ts).

This work is intentionally planning-only. It does not change production code; it defines the test cases and execution structure needed for the next QA effort.

## Why this is the first QA priority

The app stores all critical state in the local SQLite layer:

- onboarding state
- wardrobe items
- catalog rows
- body photos
- saved try-ons

The repository layer is therefore a core trust boundary. A bug here creates user-visible breakage even when the pure business logic remains green.

## Scope

### In scope

- repository CRUD logic in [src/store/repo.ts](../src/store/repo.ts)
- persistence and serialization semantics in [src/store/db.ts](../src/store/db.ts)
- settings persistence and onboarding state
- item lifecycle behavior
- try-on save/retrieval behavior
- catalog ingestion data contract
- tag and path conversion helpers

### Out of scope

- UI rendering tests
- browser E2E tests
- pose model runtime tests
- any production code modifications beyond the test harness itself

## Test strategy

Use Jest with test doubles that exercise the repository contract without requiring a full device runtime. The repository functions interact with SQLite via `getDb()`, so the test strategy should isolate the repository logic while still asserting the real row/serialization behaviors.

### Recommended approach

1. Build a minimal in-memory or fake DB object that matches the expected SQLite surface.
2. Test the repository functions against that contract instead of mocking user flows.
3. Validate real data-shape behavior: string-to-array conversion, row-to-domain conversion, persisted values, and insert IDs.
4. Keep the tests deterministic and purely data-driven.

## Proposed test suites

### Suite A: settings and onboarding

#### Test cases

- `setSetting` persists a key/value pair
- `getSetting` returns the stored value for a known key
- `getSetting` returns `undefined` for a missing key
- `setOnboarded` writes the expected `has_onboarded` flag
- repeated onboarding calls remain idempotent

#### Assertions

- row count and value correctness
- storage key names and values match the contract
- no extra side effects beyond app_settings updates

### Suite B: item CRUD lifecycle

#### Test cases

- `insertItem` inserts a valid record and returns a typed `Item`
- `listItems` returns newest-first ordering by `created_at`
- `getItem` returns the expected object for a valid ID
- `getItem` returns `undefined` for an unknown ID
- `updateItem` updates allowed fields only
- `updateItem` ignores undefined patches
- `deleteItem` removes the item and cascades deletion of related try-ons

#### Assertions

- lastInsertRowId conversion works correctly
- tags are stored as a comma-separated row and round-trip cleanly
- thumbnail and image paths are retained
- item type and color remain intact

### Suite C: catalog store item persistence

#### Test cases

- `insertStoreItem` stores the expected metadata and returns a `StoreItem`
- `listStoreItems` orders results by `name`
- empty `imagePaths` remains valid
- `specs` can be `null` and round-trip correctly
- path arrays are stored and rehydrated with `|` delimitation

#### Assertions

- the source field is set to `catalog`
- names and colors persist correctly
- image path arrays are not corrupted by serialization

### Suite D: body photos and try-ons

#### Test cases

- `insertBodyPhoto` inserts a body photo record with the expected timestamp
- `insertTryOn` persists a try-on row with the expected transform blob
- `listTryOns` returns records in descending time order
- `deleteTryOn` removes only the selected row

#### Assertions

- `bodyPhotoId`, `itemId`, `transform`, and `outputPath` are persisted correctly
- `createdAt` is set and returned as a valid ISO string
- null output paths remain valid and do not crash serialization

### Suite E: serialization helpers and edge conditions

#### Test cases

- `tagsToRow([])` returns an empty string
- `rowToTags('')` returns an empty array
- `rowToTags('a,b,c')` trims values and drops empties
- `pathsToRow([])` returns an empty string
- `rowToPaths('')` returns an empty array
- mixed path strings with empty entries are sanitized correctly
- malformed shape values do not crash repository methods

#### Assertions

- conversion functions are deterministic
- helper inputs are robust under empty and partially malformed values

## Detailed acceptance criteria

### Functional acceptance criteria

- [ ] Settings persistence is tested for both writes and reads.
- [ ] Onboarding is verified to persist state correctly.
- [ ] Item create/read/update/delete behavior is covered.
- [ ] Tag/path serialization is tested in both directions.
- [ ] Body photo and try-on persistence behavior is covered.
- [ ] Catalog item storage is covered for metadata and path arrays.
- [ ] Missing-row and invalid-input scenarios are asserted.

### Quality acceptance criteria

- [ ] All tests run under the standard Jest suite.
- [ ] No test relies on UI rendering or device runtime assumptions.
- [ ] Tests verify behavior, not mock-only interactions.
- [ ] Edge conditions are explicitly covered.

## Suggested test file layout

Add a dedicated repository test file or a small matching suite under the existing structure:

- [tests/store/repo.test.ts](../tests/store/repo.test.ts)

If the repo keeps expanding, structure it into:

- [tests/store/repo-settings.test.ts](../tests/store/repo-settings.test.ts)
- [tests/store/repo-items.test.ts](../tests/store/repo-items.test.ts)
- [tests/store/repo-tryons.test.ts](../tests/store/repo-tryons.test.ts)

## Suggested fixture strategy

Use a minimal repository fake that implements the same row-shape contracts as the real SQLite calls, without needing a live device or emulator.

Example seeds:

- one item with tags and a thumbnail path
- one catalog row with multiple image paths
- one try-on record with a transform string
- one body photo row

This gives deterministic coverage without introducing brittle UI or platform assumptions.

## Risks to watch for

### 1. Serialization mismatches

The repository stores arrays as delimited strings. If a test does not assert round-tripping, subtle regressions can slip through.

### 2. Cascading deletes

`deleteItem` deletes related `try_ons`. This should be explicitly tested to avoid orphaned data.

### 3. Ordering assumptions

The app expects `created_at` ordering for items and try-ons. Tests should assert this order explicitly rather than just checking membership.

### 4. Null and empty edge types

Paths and tags can be empty or null-like; robustness must be validated, especially for early app state.

## Execution checklist

1. Create the repository-focused Jest file.
2. Add a fake DB mock with the row operations the repo uses.
3. Add settings/onboarding tests.
4. Add item CRUD tests.
5. Add catalog item persistence tests.
6. Add try-on and body-photo tests.
7. Add serialization edge-case tests.
8. Run the Jest suite and confirm regression coverage.

## Definition of done for this QA issue

The repository coverage work is complete when:

- repository CRUD flows are covered by automated tests
- serialization and edge cases are asserted
- onboarding and try-on storage are tested
- the suite passes under the normal repository test command

## Related docs

- [Plans/issues/M4-1.md](../Plans/issues/M4-1.md)
- [docs/testing-summary.md](testing-summary.md)
- [src/store/repo.ts](../src/store/repo.ts)
- [src/store/db.ts](../src/store/db.ts)
