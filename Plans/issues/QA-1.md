# QA-1 · Add repository / SQLite regression tests

Milestone: QA · Labels: qa, coverage, M3

## Description
The repository layer in [src/store/repo.ts](../../src/store/repo.ts) is currently untested despite being a critical data boundary. The app relies on persistent storage for onboarding state, wardrobe items, catalog rows, body photos, and saved try-ons. This is a high-risk gap because the DB layer is where data shape and persistence behavior are most likely to drift.

## Scope
Add tests covering:

- `insertItem` / `updateItem` / `deleteItem`
- `listItems` and `getItem`
- onboarding persistence via `setOnboarded`
- catalog insert/list flow via `insertStoreItem`
- `insertBodyPhoto`
- `insertTryOn` and `listTryOns`
- tag and path serialization round-trips
- malformed or missing rows

## Acceptance criteria
- [ ] Repository CRUD behavior is covered by automated tests
- [ ] Tag/path serialization is exercised with real data-shape cases
- [ ] Missing-row and invalid-input handling is asserted
- [ ] Tests run as part of the normal Jest suite

## Notes
This is a foundational QA work item because the app stores user state locally and lacks direct regression protection for that data contract.
