# M3-1 · Spike: EAS prebuilt + on-device MediaPipe pose (native)

**Status: NO-GO for this milestone — deferred. Native ships the manual fallback (M2-4 / ADR-005).**

## Verdict
**NO-GO** inside the current sandbox. The spike's acceptance criteria — a *prebuilt* EAS
build that runs on-device pose inference — cannot be met here: there is no device or
device-capable emulator, no camera, and no EAS account. As per the issue's own
"non-blocking spike" scope, this verdict **does not block the MVP**: native stays on the
manual overlay (`ManualPoseProvider`, M2-4) and is a complete, shippable experience
(ADR-005).

## Why no-go (evidence)
- No iOS/Android simulator or physical device is reachable in the sandbox, so
  `eas build --profile preview` → install → "time first inference" cannot be executed.
- `@mediapipe/tasks-vision` (`PoseLandmarker`) / `react-native-vision-camera` need a
  prebuilt native module; Expo Go can't run it, and no prebuild can be produced or tested
  here.
- Without a run, there is no inference timing or keypoint output to assert against
  `computeGarmentBox` — the spike's primary success metric.

## What stays true (the payoff of the abstraction)
- The `PoseProvider` interface (M0-2) and `PoseLandmarker`-shaped `Keypoint[]` output
  contract mean a native provider is a **drop-in** when we *do* get a device:
    1. `src/pose/MediaPipePoseProvider.ts` — `implements PoseProvider`, returns normalized
       `Keypoint[]` identical to `MoveNetPoseProvider` (M2-1).
    2. `createPoseProvider()` factory in `providers.native.ts` returns
       `MediaPipePoseProvider` instead of `ManualPoseProvider`.
    3. No studio/editor change — both providers feed `computeGarmentBox` unchanged.
  This is exactly why the spike is non-blocking: the UI never branches on provider (M2-4 AC).

## Decision log
- **D21.7 — M3-1 is NO-GO in-sandbox; M2-4 remains the native path.** No device/emulator/
   camera/EAS account in the sandbox, so on-device pose cannot be built, run, or timed.
  Per the spike's non-blocking design, the manual fallback (M2-4) is the shipping native
  path and the UI is untouched. A `MediaPipePoseProvider` scaffold is deferred behind a
   "device available" trigger; a one-day revisit is enough to flip this to GO if a device
   appears. **No ADR change** (ADR-005 already encodes "native pose is a spike; manual is
   the shipping path").

## Re-open trigger
A device or device-emulator + EAS account appears, **or** the team invests in an on-device
pose demo. Flip to GO by landing `MediaPipePoseProvider.ts` + a `providers.native.ts`
`MediaPipePoseProvider` default, then re-run the M3-1 AC list.
