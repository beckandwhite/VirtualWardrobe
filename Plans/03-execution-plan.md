# Execution Plan

## Status
- Repo initialized locally (`git init`), branch `main`, local identity set.
- **Not yet on github.com** — the machine's `gh` is authed only to `github.tools.sap`
  (ADR-009). See `Plans/04-gh-setup.md` for the one manual unblock.
- **Step 4 (implementation) is intentionally NOT started** — planning phase only.

## Steps
1. **Scaffold + Plans (DONE in this phase)** — folder skeleton + this `Plans/` dir.
2. **GitHub unblock (manual, one-time):** `gh auth login -h github.com` with the
   beckandwhite personal token (scope incl. `repo`, `project`).
3. **Create GitHub Project + issues (this is the priority this phase):**
   - `gh project init` a board with columns Backlog/To Do/In Progress/Done/Shipped.
   - Create milestones M0–M3 and the label set.
   - Open the 15 issues from `Plans/issues/*.md`, tag milestones + labels,
     add each to the board; move M0-1 → In Progress.
   - The generator script lives in the repo (see `04-gh-setup.md`).
4. **Implement M0 (deferred, not now):** M0-1 → M0-4, each a PR off `main`.
5. **M1, then M2** vertical slices. M3 spikes/optional afterwards.

## GitHub structure (target, on github.com / beckandwhite)
- Repo: `VirtualWardrobe` (private initially; can go public for portfolio).
- Project board columns: `Backlog · To Do · In Progress · Done · Shipped`.
- Milestones: `M0 Foundations`, `M1 Wardrobe`, `M2 Try-On`, `M3 Native+Polish`.
- Labels: `feat`, `ux`, `ml`, `debt`, `docs`, `spike`, `M0`, `M1`, `M2`, `M3`.

## Risks / watch-items
- `M3-1` (EAS prebuilt + on-device MediaPipe) is the #1 risk; it's a `spike`, non-blocking.
- Node 26 is active; must `nvm use 22` before any `npx create-expo-app` (ADR-010).
- `PoseProvider` abstraction must be clean or native/web drift will happen early.

## Out of scope for the planning phase
- Any actual feature implementation (Step 4+).
- Pushing to any remote other than the chosen personal github.com.
