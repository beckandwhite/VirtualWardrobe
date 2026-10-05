# Feedback and Issue Reporting

VirtualWardrobe is local-first: everything you capture stays on your device and is
never uploaded. Feedback therefore flows **outward** to the GitHub project — the app
never collects it. The Me tab's **About & feedback** section gives users direct,
localized links to this project; this document describes those links and the two
issue templates they open.

## How users report: the Me tab

On the **Me** tab, below the language switcher, there is an **About & feedback**
section with four actions (all open in the platform's external browser via
`expo-linking`):

| Action | Destination |
| --- | --- |
| **About · GitHub repository** | `https://github.com/beckandwhite/VirtualWardrobe` |
| **Report a bug** | `…/issues/new?template=bug_report.md` |
| **Request a feature** | `…/issues/new?template=feature_request.md` |
| **How to use the app** | `…/blob/main/docs/usage.md` |

A link that cannot be opened shows a short, localized error instead of failing
silently. Opening a link is a no-op until the user actually taps it; the app never
navigates or submits on your behalf.

## Sign-in and privacy expectations

- **A GitHub account is required to submit an issue.** Tapping a template link opens
  GitHub's "new issue" screen prefilled from the template; if you're not signed in,
  GitHub prompts you to sign in first. Browsing the repository and the usage guide
  needs no account.
- **Photos stay private.** The app's photo/wardrobe data is device-local, and the
  templates warn users not to attach — or to **redact** — any photo of their body or
  wardrobe. There is **no in-app form, no telemetry, and no upload**; the only output
  of feedback is an issue the user chooses to open and submit on GitHub.

## Issue templates

Both live in `.github/ISSUE_TEMPLATE/` and are the exact templates the Me-tab links
open.

### Bug report — `bug_report.md` (label: `bug`)

Fields:

- **Summary** — a short one-line description.
- **Steps to reproduce** — numbered actions that lead to the bug.
- **Expected behavior** and **Actual behavior**.
- **Environment** — route/screen (Wardrobe, Capture, Studio, Looks, Me), OS/device,
  browser (web only), app version, and Node version (developer runs).
- **Logs / evidence (optional, redacted)** — any redacted console output or a short,
  redacted screenshot.

Good bug reports name the exact screen/route, the garment or photo used, any error
text shown, and whether the issue is reproducible.

### Feature request — `feature_request.md` (label: `enhancement`)

Fields:

- **The problem I'm trying to solve.**
- **The outcome I'd like.**
- **Alternatives or context (optional).**

Concrete problems and desired outcomes are the easiest requests to act on.

## Filing from the command line

If GitHub auth is configured, you can also create an issue directly:

```bash
gh issue create --title "Bug: <short summary>" --body-file .github/ISSUE_TEMPLATE/bug_report.md
```

If the repo is not yet connected to your account, complete the one-time setup first:

```bash
gh auth login -h github.com
gh auth status -h github.com
```

See [Plans/04-gh-setup.md](../Plans/04-gh-setup.md) for the full setup notes.

## Good reports

The best reports are specific, easy to verify, and **private**:

- the exact screen name or route (for example: Wardrobe, Capture, Studio, Looks, Me)
- the garment or photo used, described in text (not attached as a personal image)
- any error text shown in the app
- whether the issue is reproducible, plus a short reproduction flow
- redacted logs or a redacted screenshot, with any body/wardrobe photo removed
