# Execution Plan

## Status
- Repo initialized locally (`git init`), branch `main`, local identity set.
- GitHub is the live issue/project source of truth; the backlog has been implemented through M2
  and is now being decomposed into bounded M3/M5/M6 work items.
- Planning refresh completed 2026-09-22; issue definitions and local specifications are mirrored.

## Steps
1. **M1-1 native evidence:** execute Android and iOS host briefs when the corresponding Mac/device
  environments are available; require the evidence bar in M1-1.
2. **M3-8 → M3-9 → M3-5:** install Playwright as a repository devDependency and require the
  browser pass in CI; retain model-absent manual fallback.
3. **M3-6 ∥ M3-7:** race the conversion and known-good graph paths; the first verified graph wins,
  and the other issue is superseded.
4. **M3-14 → M3-16 → M3-17 → M3-15:** settle the product journey, implement welcome orientation,
   improve route/return behavior, then capture the portfolio artifact set.
5. **M5-1 → M5-2; M5-3 optional:** establish hosted CI first; private Docker runner remains
  independently parked until an approved host and permissions exist.
6. **M6-1 → M6-2 → M6-3…M6-10:** establish the nine-locale catalog, then translations.

## GitHub structure (target, on github.com / beckandwhite)
- Repo: `VirtualWardrobe` (private initially; can go public for portfolio).
- Project board columns: `Backlog · To Do · In Progress · Done · Shipped`.
- Milestones: `M0 Foundations`, `M1 Wardrobe`, `M2 Try-On`, `M3 Native+Polish`, `M5 Devops`,
  `M6 Language & i18n`.
- Labels: `feat`, `ux`, `ml`, `debt`, `docs`, `spike`, `M0`, `M1`, `M2`, `M3`.

## Risks / watch-items
- `M3-1` (EAS prebuilt + on-device MediaPipe) is the #1 risk; it's a `spike`, non-blocking.
- Node 26 is active; must `nvm use 22` before any `npx create-expo-app` (ADR-010).
- `PoseProvider` abstraction must be clean or native/web drift will happen early.

## Out of scope for the planning phase
- Any actual feature implementation (Step 4+).
- Pushing to any remote other than the chosen personal github.com.
