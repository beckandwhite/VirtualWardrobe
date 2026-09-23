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

## Conventions

- **GitHub issues are the source of truth for work items.** Creating a local `Plans/issues/*.md`
  file is not required and should not be committed. The GH issue body holds the full spec;
  `Plans/00-decisions-and-log.md` holds build-time decisions. Local files in `Plans/issues/` are scratch
  only — delete or gitignore them after the issue is created on GitHub.

The issue-number mapping (work item → GH #) is maintained in `Plans/02-product-backlog.md`
as a `GH #` column on each milestone table. Update it there when new issues are created.
