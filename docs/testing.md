# Testing Guide

This project includes unit tests and a few validation scripts. The repository is in active development, so tests are focused on the stable core logic and local validation.

## Run the test suite

```bash
npm test
```

This executes Jest across the project.

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

## Test areas in the repo

Current tests are organized under the [tests](tests) folder and cover areas such as:

- wardrobe filtering
- catalog ingestion
- composer transforms and exports
- pose keypoint utilities
- localization strings

Additional checks and app-level verification are covered in the developer setup notes in [docs/dev-setup.md](docs/dev-setup.md).
