# Agent Workflow

## Source of truth

GitHub is the operational source of truth for work-item state:

- Issues: https://github.com/beckandwhite/VirtualWardrobe/issues
- Project: https://github.com/users/beckandwhite/projects/1
- Milestones, labels, comments, issue state, and `Board Status` are read from GitHub.
- GitHub issue bodies are the only full work-item specifications. Do not infer current status from
  local summaries when GitHub disagrees.
- Keep concise implementation status, dependencies, and durable decisions in the local backlog,
  handoff, and decision log; update the GitHub issue body first for work-item definition changes.

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
- Run `node scripts/gh-bootstrap.mjs` only to reconcile milestones, labels, and project cards; issue
  bodies and issue creation are managed directly in GitHub.

## Planning edits

When adding or renaming a work item:

1. Update the GitHub issue first, including its body, milestone, labels, and state.
2. Update the concise local summary and the ledger in `Plans/02-product-backlog.md` when identifiers or durable status change.
3. Record material implementation decisions in `Plans/00-decisions-and-log.md`.
4. Verify issue count, project-card count, milestone assignment, and live body state.

Do not create a second issue to repair a title or milestone mistake. Edit the existing issue.
