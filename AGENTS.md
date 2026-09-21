# Agent Workflow

## Source of truth

GitHub is the operational source of truth for work-item state:

- Issues: https://github.com/beckandwhite/VirtualWardrobe/issues
- Project: https://github.com/users/beckandwhite/projects/1
- Milestones, labels, comments, issue state, and `Board Status` are read from GitHub.
- `Plans/issues/*.md` are the local issue specifications and audit snapshot. Do not infer the
  current status from a local file when GitHub disagrees.
- Update both sides when changing an issue definition: preserve the full issue body on GitHub,
  then update the matching local specification and `Plans/02-product-backlog.md`.

## Start here

From the repository root:

```powershell
$repo = 'beckandwhite/VirtualWardrobe'
gh issue list --repo $repo --state all --limit 100 --json number,title,state,milestone,labels
$project = gh project view 1 --owner beckandwhite --format json
gh project item-list 1 --owner beckandwhite --limit 100 --format json
```

Filter the live backlog by milestone:

```powershell
gh issue list --repo $repo --milestone 'M5 Devops' --state all --limit 100 --json number,title,url
```

## Updating work items

- Use `gh issue edit` or `gh api` for live issue title, body, milestone, labels, comments, and
  open/closed state.
- Use `gh project item-edit` for the custom `Board Status` field (`Backlog`, `To Do`, `In Progress`,
  `Done`, `Shipped`).
- Add missing issue cards with `gh project item-add 1 --owner beckandwhite --url <issue-url>`.
- Prefer issue numbers and URLs over title matching because titles can be renamed.
- Run `node scripts/gh-bootstrap.mjs` only when reconciling the complete local specification set;
  it is idempotent and creates missing issues/cards without replacing GitHub comments.

## Planning edits

When adding or renaming a work item:

1. Update the GitHub issue first, including its milestone and labels.
2. Add or rename the matching file under `Plans/issues/` with the complete issue body.
3. Update `Plans/02-product-backlog.md` and the upload ledger in `Plans/04-gh-setup.md`.
4. Verify issue count, project-card count, milestone assignment, and body fidelity.

Do not create a second issue to repair a title or milestone mistake. Edit the existing issue.
