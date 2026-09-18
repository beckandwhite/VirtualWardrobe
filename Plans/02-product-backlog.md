# Product Backlog

Single backlog → maps 1:1 to GitHub issues and a GitHub Project board.
Milestones: **M0 Foundations · M1 Wardrobe · M2 Try-On · M3 Native+Polish**.
Each item below has a full issue body in `Plans/issues/<id>.md`.

## Label scheme
`feat` · `ux` · `ml` · `debt` · `docs` · `spike` · and milestone tags `M0` `M1` `M2` `M3`.

## Board columns
`Backlog · To Do · In Progress · Done · Shipped`

---

## M0 · Foundations  (repo: VirtualWardrobe)

| ID   | Title                                                        | Labels           |
|------|--------------------------------------------------------------|------------------|
| M0-1 | Initialize Expo + TS strict + Expo Router + lint/format        | feat, M0, feat   |
| M0-2 | Define PoseProvider + Compositor interfaces (abstraction)     | feat, ml, M0     |
| M0-3 | Local storage: expo-sqlite + Item/BodyPhoto/TryOn/StoreItem   | feat, M0         |
| M0-4 | Permissions onboarding flow (camera, photos, storage)         | ux, M0           |

## M1 · Wardrobe (vertical slice, no try-on yet)

| ID   | Title                                                          | Labels        |
|------|----------------------------------------------------------------|---------------|
| M1-1 | Camera + library capture (expo-camera / image-picker)          | feat, M1      |
| M1-2 | Item CRUD + thumbnail gen (expo-image-manipulator)             | feat, M1      |
| M1-3 | Gallery grid + filter/search (category / color / tag)          | feat, ux, M1  |
| M1-4 | Bundled store.json catalog + ingester                          | feat, M1      |

## M2 · Try-On Studio

| ID   | Title                                                       | Labels          |
|------|-------------------------------------------------------------|-----------------|
| M2-1 | Web MoveNet pose integration                                | ml, M2          |
| M2-2 | Auto-scaled garment box from keypoints + manual fine-tune    | feat, ux, M2    |
| M2-3 | Save/share output to Photos (expo-image-manipulator)        | feat, M2        |
| M2-4 | Manual-overlay fallback (no ML) so native is usable pre-ML   | feat, ux, M2    |

## M3 · Native + Polish (largely spikes / optional)

| ID     | Title                                                   | Labels            |
|--------|---------------------------------------------------------|-------------------|
| M3-1   | [spike] EAS prebuilt + Mediapose/Tasks pose for native  | spike, ml, M3     |
| M3-2   | Saved-looks gallery + export/share sheet                | feat, ux, M3      |
| M3-3   | App icons / launch screens / i18n / store asset prep    | feat, ux, M3      |
| M3-4   | [optional] Account + multi-device sync (separately scoped)| feat, M3, debt   |

## Definition of Done (every issue)
- [ ] Acceptance criteria met and verified (test where applicable).
- [ ] Type-clean (tsc), lint-clean (eslint).
- [ ] No console errors on the happy path; failures handled gracefully.
- [ ] For `ml`: a screenshot + one-run demo note attached.
- [ ] For `spike`: written conclusion (go / no-go) and an ADR if it changes a plan.
