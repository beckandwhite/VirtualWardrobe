# GitHub Setup (the one manual unblock)

The machine's `gh` is authenticated only to `github.tools.sap`. Per ADR-009 the project and
issues must live on the **personal** `github.com` (beckandwhite@gmail.com). Until a
github.com token is added, the project/issues exist only in this repo.

## 1. Add the personal github.com auth (one-time)
```bash
gh auth logout -h github.tools.sap   # optional: stop using corporate by default
gh auth login -h github.com
# choose "HTTPS", "Authenticate GitHib.com... via a browser", sign in as beckandwhite
# ensure token scopes include:  repo, project, public_repo, read:org (min: repo + project)
gh auth status -h github.com
gh api user    # should print login: beckandwhite-ish, site = github.com
```

## 2. Create the board, milestones, labels, and issues
Run the generator from the repo root:
```bash
node scripts/gh-bootstrap.mjs          # creates project+columns+milestones+labels+issues
```
Or, if you prefer fully manual, the equivalent `gh` commands are documented in
`scripts/gh-commands.md`.

## 3. Verify
- `gh project list` shows `VirtualWardrobe` with the 5 columns.
- `gh project items list` shows the 15 issue-backed cards, M0-1 in "In Progress".
- Board is at `https://github.com/beckandwhite/VirtualWardrobe/projects`.

## Notes
- `gh project` requires the `project` scope on the token (it's the #1 gotcha).
- GitHub Projects v2 is used (`gh project init --type project`); each issue becomes a card via
   `gh project item add <issue-url>`.
- The generator is idempotent-ish: it checks before creating milestones/labels.
