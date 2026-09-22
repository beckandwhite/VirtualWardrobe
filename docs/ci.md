# Continuous integration

The hosted CI workflow is [`.github/workflows/ci.yml`](../.github/workflows/ci.yml).
It runs on pushes and pull requests targeting `main` with Ubuntu 24.04 and
Node.js 22.x.

## Checks

The `Quality and dependency security` job installs with `npm ci`, then runs:

```text
npm run typecheck
npm run lint
npm audit --audit-level=high
```

The `Jest tests and coverage` job performs a clean install and runs Jest with
coverage in-band. It publishes `jest-results-and-coverage`, containing the
machine-readable Jest JSON result and the `coverage/` directory. The job also
writes a short pass/fail summary to the Actions run summary. Test failures
remain job failures; artifact upload is configured to run after failures so
diagnostics are still available.

`CodeQL` scans JavaScript/TypeScript on pushes and pull requests. `Dependency
review` runs only for pull requests and blocks newly introduced high or
critical dependency vulnerabilities when the repository plan supports the
GitHub action.

## Required check

After the first successful run, configure branch protection or a ruleset for
`main` and require these checks before merging:

- `Quality and dependency security`
- `Jest tests and coverage`
- `CodeQL`
- `Dependency review` for pull requests, if enabled for the repository plan

Keep the exact check names from the Actions run. To rerun, open the failed
workflow run and choose **Re-run failed jobs**. To inspect diagnostics, open
the run summary first, then download `jest-results-and-coverage` from the
Artifacts section.

## Failure diagnosis

- Install or setup failure: inspect the `Set up Node.js` or `Install dependencies`
  step; this is CI infrastructure rather than a product test failure.
- Typecheck, lint, or audit failure: reproduce the named command locally with
  Node.js 22.x and a clean `npm ci` install.
- Jest failure: open the test step log, then download the artifact for the
  JSON result and coverage details.
- CodeQL or dependency review failure: inspect the action's security finding;
  dependency review is limited to changes introduced by the pull request.

## Repository security settings

Secret scanning and push protection are repository settings, not workflow YAML.
Enable and verify them under **Settings > Code security and analysis**. The
workflow cannot enable these settings without administrator permissions; their
state must be checked in the GitHub repository UI.