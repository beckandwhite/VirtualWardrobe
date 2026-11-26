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
- Use `gh project item-edit` for the custom `Board Status` single-select field. Its options are
  `Ideas`, `Planning/Grilling`, `Ready to pickup`, `In Progress`, `Done` (see the ID table under
  **Autonomous run lifecycle**; re-list with `gh project field-list` if an edit is rejected).
- Add missing issue cards with `gh project item-add 1 --owner beckandwhite --url <issue-url>`.
- Prefer issue numbers and URLs over title matching because titles can be renamed.
- Run `node scripts/gh-bootstrap.mjs` only to reconcile milestones, labels, and project cards; issue
  bodies and issue creation are managed directly in GitHub.

## Autonomous run lifecycle

An autonomous agent run takes one work item from the board to a merged, closed state
without pausing for human approval between steps. **Commit early, push, and raise a PR** —
do not hold finished work in the working tree waiting for permission. The run is only
"done" once the item is merged and closed, or explicitly handed to a human.

### `Board Status` field (live IDs)

`Board Status` is a single-select project field. Current options (re-list with
`gh project field-list 1 --owner beckandwhite --format json` if an edit is rejected — IDs can change):

| Status            | Option ID  |
| ----------------- | ---------- |
| Ideas             | `4adff264` |
| Planning/Grilling | `f75ad846` |
| Ready to pickup   | `a3f2ea0b` |
| In Progress       | `47fc9ee4` |
| Done              | `98236657` |

- Project ID: `PVT_kwHOA6-ZGM4BkOSP`
- `Board Status` field ID: `PVTSSF_lAHOA6-ZGM4BkOSPzhi_onA`

Resolve a card's item ID from an issue number:

```bash
item_id() { gh project item-list 1 --owner beckandwhite --limit 200 --format json \
  | node -e 'const d=JSON.parse(require("fs").readFileSync(0));const i=d.items.find(x=>x.content&&x.content.number===+process.argv[1]);console.log(i?i.id:"")' "$1"; }
```

### 1. Pick up — move to In Progress and label the run

Pick the top issue in **Ready to pickup**. Before writing any code:

1. Move its card to **In Progress**:
   ```bash
   ISSUE=83
   gh project item-edit --id "$(item_id $ISSUE)" --project-id PVT_kwHOA6-ZGM4BkOSP \
     --field-id PVTSSF_lAHOA6-ZGM4BkOSPzhi_onA --single-select-option-id 47fc9ee4
   ```
2. Tag the issue with a unique run label so the card shows which agent/model owns it.
   Format `<hostname>-<model-id>`, e.g. `D72NQ7W67L-Qwen3.8-27b`. Create it if missing, then add it:
   ```bash
   RUN_LABEL="D72NQ7W67L-Qwen3.8-27b"
   gh label create "$RUN_LABEL" --repo beckandwhite/VirtualWardrobe --color 5319e7 \
     --description "Autonomous run owner" 2>/dev/null || true
   gh issue edit $ISSUE --repo beckandwhite/VirtualWardrobe --add-label "$RUN_LABEL"
   ```

If an acceptance criterion or step is materially ambiguous, stop: move the card back to
**Planning/Grilling**, remove the run label, and request clarification rather than guessing.

### 2. Implement, commit, push, open a PR

- Branch `work/<issue>-<slug>` from a fresh `main`.
- **Commit and push freely** as you go — reference the issue in commit messages. Do not leave
  completed changes uncommitted.
- Open a PR whose body contains `Closes #<issue>` so the merge auto-closes the item:
  ```bash
  gh pr create --repo beckandwhite/VirtualWardrobe --base main --head work/$ISSUE-<slug> \
    --title "<type>(<scope>): <summary> (#$ISSUE)" \
    --body "Closes #$ISSUE"$'\n\n'"<what changed + how it was verified>"
  ```

### 3. Gate on checks, then close out or escalate

Wait for CI and every required check to settle:

```bash
PR=<pr-number>
gh pr checks $PR --repo beckandwhite/VirtualWardrobe --watch
```

- **All checks green → the work is ready: merge and close it.** Squash-merge, delete the branch,
  confirm the item closed (close it explicitly if `Closes #` did not), move the card to **Done**,
:
  ```bash
  gh pr merge $PR --repo beckandwhite/VirtualWardrobe --squash --delete-branch
  gh issue view $ISSUE --repo beckandwhite/VirtualWardrobe --json state   # expect CLOSED
  gh issue close $ISSUE --repo beckandwhite/VirtualWardrobe 2>/dev/null || true
  gh project item-edit --id "$(item_id $ISSUE)" --project-id PVT_kwHOA6-ZGM4BkOSP \
    --field-id PVTSSF_lAHOA6-ZGM4BkOSPzhi_onA --single-select-option-id 98236657
  ```
- **Any check failing → do NOT merge. Hand it to a human.** Add the `HUMAN!!!` label, leave the
  card in **In Progress**, and stop:
  ```bash
  gh label create "HUMAN!!!" --repo beckandwhite/VirtualWardrobe --color b60205 \
    --description "Autonomous run blocked — needs a human" 2>/dev/null || true
  gh issue edit $ISSUE --repo beckandwhite/VirtualWardrobe --add-label "HUMAN!!!"
  ```

## Planning edits

When adding or renaming a work item:

1. Update the GitHub issue first, including its body, milestone, labels, and state.
2. Update the concise local summary and the ledger in `Plans/02-product-backlog.md` when identifiers or durable status change.
3. Record material implementation decisions in `Plans/00-decisions-and-log.md`.
4. Verify issue count, project-card count, milestone assignment, and live body state.

Do not create a second issue to repair a title or milestone mistake. Edit the existing issue.
