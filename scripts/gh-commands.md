# Manual GitHub commands

Use these instead of `scripts/gh-bootstrap.mjs` if you prefer to do it by hand.
**First:** `gh auth login -h github.com` with token scopes `repo, project, public_repo`.

## Repo
```bash
gh repo create VirtualWardrobe --private \
  --description "Local-first virtual wardrobe + pose-aware try-on (Expo)."
```
(If the folder already has a remote, push instead: `git remote add origin https://github.com/<handle>/VirtualWardrobe.git`.)

## Milestones
```bash
gh milestone create "M0 Foundations"
gh milestone create "M1 Wardrobe"
gh milestone create "M2 Try-On"
gh milestone create "M3 Native+Polish"
```

## Labels
```bash
for l in feat ux ml debt docs spike M0 M1 M2 M3; do
  gh label create "$l" --description "$l" --color 0e639c 2>/dev/null || true
done
```

## Issues (one per Plans/issues/*.md)
Replace `M0-1` etc. with the actual id; copy title/body from the md:
```bash
gh issue create --title "M0-1 · Initialize Expo + TS strict + Expo Router + lint/format" \
  --body-file Plans/issues/M0-1.md \
  --milestone "M0 Foundations" --labels "feat,M0"
# ...repeat for M0-2, M0-3, M0-4, M1-1..1-4, M2-1..2-4, M3-1..3-4
```

## Board (GitHub Projects v2)
```bash
gh project init --owner <handle> --title VirtualWardrobe --body "VirtualWardrobe backlog"
# add a Status field with the 5 columns, then:
gh project item add <project-id> --url https://github.com/<handle>/VirtualWardrobe/issues/1
```
Then move `M0-1`'s card into the "In Progress" column on the board.
