# GitHub Setup (the one manual unblock)

The machine is authenticated to the **personal** `github.com` account (beckandwhite@gmail.com),
and the setup below has been completed there.

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
node scripts/gh-bootstrap.mjs          # creates project+statuses+milestones+labels+issues
```
Or, if you prefer fully manual, the equivalent `gh` commands are documented in
`scripts/gh-commands.md`.

## 3. Verify
- `gh project list` shows `VirtualWardrobe`.
- Project 1 has 42 issue-backed cards; `M0-1` is `In Progress` in the custom `Board Status` field.
- Board is at `https://github.com/users/beckandwhite/projects/1`.

## Notes
- `gh project` requires the `project` scope on the token (it's the #1 gotcha).
- GitHub Projects v2 is used; the built-in `Status` field remains unchanged because GitHub does
   not allow deleting it. The custom `Board Status` field has `Backlog`, `To Do`, `In Progress`,
   `Done`, and `Shipped`.
- The generator checks existing milestones, issues, and project cards before creating them.

## Upload ledger (2026-09-21)

Uploaded to `beckandwhite/VirtualWardrobe` and added to project 1:

| Work item | GitHub issue | Uploaded |
| --- | ---: | :---: |
| M0-1 | #1 | yes |
| M0-2 | #2 | yes |
| M0-3 | #3 | yes |
| M0-4 | #4 | yes |
| M0-5 | #5 | yes |
| M1-1 | #6 | yes |
| M1-2 | #7 | yes |
| M1-3 | #8 | yes |
| M1-4 | #9 | yes |
| M2-1 | #10 | yes |
| M2-2 | #11 | yes |
| M2-3 | #12 | yes |
| M2-4 | #13 | yes |
| M3-1 | #14 | yes |
| M3-2 | #15 | yes |
| M3-3 | #16 | yes |
| M3-15 | #44 | yes |
| M3-16 | #46 | yes |
| M3-17 | #47 | yes |
| M3-4 | #17 | yes |
| M3-5 | #18 | yes |
| M3-6 | #19 | yes |
| M3-7 | #20 | yes |
| M3-8 | #26 | yes |
| M3-9 | #27 | yes |
| M3-10 | #21 | yes |
| M3-11 | #22 | yes |
| M3-12 | #23 | yes |
| M3-13 | #24 | yes |
| M3-14 | #34 | yes |
| M6-1 | #35 | yes |
| M6-2 | #36 | yes |
| M6-3 | #37 | yes |
| M6-4 | #38 | yes |
| M6-5 | #39 | yes |
| M6-6 | #40 | yes |
| M6-7 | #41 | yes |
| M6-8 | #42 | yes |
| M6-9 | #43 | yes |
| M6-10 | #45 | yes |
| M5-1 | #25 | yes |
| M5-2 | #32 | yes |
| M5-3 | #33 | yes |
| QA-1 | #28 | yes |
| QA-2 | #29 | yes |
| QA-3 | #30 | yes |
| QA-4 | #31 | yes |

QA items are included under the `QA` milestone.
