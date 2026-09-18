# ADRs / Key Decisions

VirtualWardrobe — a virtual-wardrobe + try-on web/app.
Status of this document: locked as of planning phase (2026-09-18).

## ADR-001: Core try-on mechanism = Compositing / AR overlay
- **Decision:** For the MVP, the garment is composited onto a body photo with pose-aware
  auto-scaling and manual fine-tuning. No generative model, no true 3D.
- **Why:** Fastest path to a "wow" that's understandable and demonstrable. Generative VTO
  (CatVTON/IDM-VTON) and real 3D are explicitly deferred to post-MVP.
- **Consequences:** UI must expose manual position/scale/rotation/opacity controls as a
  first-class feature, not an afterthought.

## ADR-002: Clothing source = "Both" (user wardrobe + bundled catalog)
- **Decision:** Support user-captured items and a bundled store catalog.
- **Why:** Makes the product feel complete and gives the studio something to try even on day one.
- **Consequences:** Data model has both `Item` (user) and `StoreItem` (catalog). Catalog is
  **bundled** (local JSON + images), not a live API, to honor "fully local".

## ADR-003: Front-end = Expo (React Native), ships Web + iOS + Android
- **Decision:** One codebase via Expo Router; all three targets in scope.
- **Why:** User chose "real app" long-term; Expo covers web + native from one tree.
- **Consequences:** Hardest part is native on-device ML (see ADR-005). Web is the safe
  onboarding path.

## ADR-004: Data boundary = "Fully local + optional sync"
- **Decision:** Body photos and wardrobe stay on-device; cloud sync is opt-in and deferred.
- **Why:** Privacy-first; avoids GDPR personal-data processing in MVP. Portfolio quality.
- **Consequences:**
  - No server in MVP. No personal-data upload.
  - Catalog stays bundled/local.
  - "Guest now, account later" (ADR-007) is the only near-term auth-ish thing, and it is
    also deferred.

## ADR-005: Pose-aware drape on Web first; native pose is a spike
- **Decision:** Ship pose-aware drape on Web via TensorFlow.js MoveNet/MediaPipe for the
  demo. Native uses **manual overlay** in MVP; on-device MediaPipe is a non-blocking spike (M3).
- **Why:** Web pose is zero-native-pain and still gives the screenshot-worthy demo. Native
  on-device ML needs an EAS prebuilt build + a learning curve and would block everything else.
- **Consequences:**
  - Must have a clean `PoseProvider` abstraction so web (ML) and native (manual fallback)
    share the same composer UI.
  - A manual-overlay fallback is required so the app is fully usable on device without ML.
  - EAS prebuilt + MediaPipe remains the #1 risk item; tracked as `M3-1 [spike]`.

## ADR-006: Local DB = expo-sqlite now; WatermelonDB only when sync lands
- **Decision:** Start with `expo-sqlite` for simplicity.
- **Why:** Side-project velocity; sync is not in MVP.
- **Consequences:** Migration to a sync-aware store is a future task, not now.

## ADR-007: Auth = Guest now, account later
- **Decision:** No server auth in MVP. Onboarding is permission-granting, not sign-up.
- **Why:** With ADR-004 (local data), server auth adds cost and a backend for no MVP value.
- **Consequences:** "Onboarding + permissions" replaces "auth first". Account/sync is a
  separate, later milestone (M3-4 [optional]).

## ADR-008: MVP scope = M0 (Foundations) + M1 (Wardrobe) + M2 (Try-On)
- **Decision:** First shippable milestones are foundations, wardrobe vertical slice, and the
  try-on studio. Native ML polish is M3.
- **Why:** Delivers a usable app end-to-end while deferring the riskiest work.
- **Consequences:** See `02-product-backlog.md` for the full issue list.

## ADR-009: Target remote = personal github.com (beckandwhite@gmail.com)
- **Decision:** GitHub project/issues live on the **personal** github.com account, not the
  corporate `github.tools.sap`.
- **Why:** Portfolio/side project; should not land on a corporate repo/identity.
- **Consequences:**
  - The machine's `gh` is authed only to github.tools.sap. A `github.com` token must be
    added (see `04-gh-setup.md`). Until then, the project/issues are only local.
    See 03-execution-plan.md / 04-gh-setup.md.

## ADR-010: Node runtime = LTS (Node 22) for toolchain
- **Decision:** Run the Expo toolchain under Node 22 LTS via nvm, even though the machine has
  Node 26.
- **Why:** Expo SDKs target Node 18/20/22 LTS; Node 26 is bleeding-edge and may break the
  Expo CLI / Metro.
- **Consequences:** `nvm use 22` (install first) before `npx create-expo-app`.

## Open questions
- (none at planning phase — see execution plan).
