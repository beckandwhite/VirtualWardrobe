# Architecture

## 1. Layered view

```
┌────────────────────────────────────────────────────────────┐
│                    Expo App (one codebase)                   │
│                 Expo Router (file-based) + TypeScript        │
├───────────────┬───────────────┬─────────────────────────────┤
│  Onboarding     │  Capture       │  Catalog / Wardrobe         │
│ (perms, i18n)  │ (camera+lib)   │ (user + bundled JSON)        │
└───────┬────────┴───────┬───────┴──────────────┬──────────────┘
        │                │                       │
┌───────▼────────────────▼───────────┐   ┌──────▼──────────────┐
│  Try-On Studio                      │   │  Local Storage        │
│  PoseProvider + Compositor + Manual │   │  expo-sqlite          │
│  + Export/Share                     │   │  (→ WatermelonDB opt) │
└───────────────┬─────────────────────┘   └──────────────────────┘
                │
   ┌────────────┴───────────────────────────────────────┐
   │            PoseProvider (interface)                 │
   ├────────────────┬─────────────────┬──────────────────┤
   │ Web: TFJS      │ Native ML (later)│ Manual fallback  │
   │ MoveNet/MediaPipe│ MediaPipe Tasks│ (position/scale/  │
   │                 │ via EAS prebuilt│ rotation/opacity)  │
   └─────────────────┴─────────────────┴──────────────────┘
                │
        ┌───────▼────────┐
        │ optional sync  │  (M3-4, opt-in, NOT MVP)
        └────────────────┘
```

## 2. Module boundaries

- `src/pose/PoseProvider.ts` — platform abstraction. Web impl = TFJS MoveNet; native impl =
  manual stub now, MediaPipe later. The composer only ever talks to this interface.
- `src/composer/` — converts keypoints → an auto-scaled garment "box" transform, plus the
  manual transform layer (position/scale/rotation/opacity), and export/share via
  `expo-image-manipulator`.
- `src/store/` — `expo-sqlite` wrapper + schemas: `Item`, `BodyPhoto`, `TryOn`, `StoreItem`.
  The store is the single source of truth; UI is stateless w.r.t. persistence.
- `app/` — Expo Router screens: `(onboarding)`, `(wardrobe)`, `studio`, `catalog`.
- `assets/store.json` (+ images) — bundled catalog; ingested into the store on first run.

## 3. Data model (local, GDPR-clean — no personal data leaves device)

```
Item        { id, type: 'top'|'bottom'|'dress'|'outerwear'|'shoes'|'other',
              category, color, tags[], thumbnailPath, fullPath, createdAt }
BodyPhoto   { id, path, pose?: Keypoint[], createdAt }
TryOn       { id, bodyPhotoId, itemId, transform: {x,y,scale,rotation,opacity},
              outputPath, createdAt }
StoreItem   { id, source: 'catalog', name, category, color, imagePaths[], specs?, createdAt }
Keypoint    { name: string, x: number, y: number, score?: number }  // normalized 0..1
```

Transform math (auto-box from pose) is pure → unit-tested in `tests/`.

## 4. Pose flow
1. User picks a body photo (or captures).
2. `PoseProvider.estimate(bodyPhoto)` → keypoints (web) or `null` (native manual fallback).
3. If keypoints: `computeGarmentBox(keypoints, garmentType)` → initial transform.
4. Manual layer always available to override/adjust.
5. `exportTryOn(composition)` → shared image + `TryOn` row.

## 5. Cross-platform strategy
- Web is the primary onboarding + demo path (no native tooling, instant).
- Native uses manual overlay in MVP; `M3-1` spike adds on-device MediaPipe behind the same
  `PoseProvider`, so the UI never changes.

## 6. Non-goals for MVP
- No server / no API. No generative VTO. No real 3D. No live-camera AR. No account/sync.
- These are deliberately out of scope to keep the first milestone shippable.

## 7. Tooling
- Expo (SDK 51/52+) + TypeScript strict + Expo Router.
- Reanimated for drag/scale; `expo-camera`, `expo-image-picker`, `expo-image-manipulator`,
  `expo-sqlite`.
- Pose: Web = `@tensorflow-models/pose-detection`; native later = `@mediapipe/tasks-vision`
  via EAS prebuilt.
- Jest + react-native-testing-library for transform/pose math.
- Node 22 LTS for the toolchain (ADR-010).
