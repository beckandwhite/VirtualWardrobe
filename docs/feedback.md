# Feedback and Issue Reporting

We want feedback while the project is still in development. The most useful feedback includes:

- what you expected to happen
- what actually happened
- the screen or flow you were using
- reproduction steps
- screenshots or a short video
- the device or browser you used
- whether the issue is blocking or minor

## Preferred route: GitHub issues

The project plan expects the repo to live on a personal GitHub account. The setup notes are in [Plans/04-gh-setup.md](Plans/04-gh-setup.md) and [scripts/gh-commands.md](scripts/gh-commands.md).

If GitHub auth is configured, you can create a new issue with:

```bash
gh issue create --title "Bug: <short summary>" --body-file .github/ISSUE_TEMPLATE/bug_report.md
```

If the repo is not yet connected to your personal GitHub account, complete the one-time setup first:

```bash
gh auth login -h github.com
```

Then confirm the auth:

```bash
gh auth status -h github.com
```

## Suggested issue template

Use this format when reporting a problem:

```md
## Summary
Short description of the bug or request.

## Steps to reproduce
1. Open the app
2. Navigate to ...
3. Tap ...
4. Observe ...

## Expected behavior
What should happen.

## Actual behavior
What happened instead.

## Environment
- OS:
- Device/browser:
- App version:
- Node version:
- Screenshots:

## Additional notes
Any extra context.
```

## Feedback categories

Please file issues in one of these categories:

- bug
- feature request
- UX improvement
- documentation gap
- pose-model issue
- data or storage issue

## Good bug reports

The best reports are specific and easy to verify. Include:

- exact screen name or route (for example: Wardrobe, Capture, Studio)
- the garment or photo used
- any error text shown in app
- whether the issue is reproducible
- screenshots or a photo of the problem

## If you cannot submit a GitHub issue yet

Until the repo is pushed to GitHub, feedback can still be shared in a local note or by opening a tracked issue in the repo's planning folders. See [Plans](Plans) for issue specs and backlog tracking.

## Questions and improvements

If you are unsure whether something is a bug or a feature idea, open it as a GitHub issue and label it clearly. A rough report is still better than silence while the app is in active development.
