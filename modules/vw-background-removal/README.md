# vw-background-removal

Local Expo native module for **on-device background removal** (issue #64). Produces a
transparent PNG cut-out of the foreground subject, fully offline.

## Requirements

- **Custom dev build required** — this module contains native Swift/Kotlin code and
  **cannot run in Expo Go**. It is blocked on enabling prebuild / a dev client (#75).
- **iOS 17+** — uses Vision `VNGenerateForegroundInstanceMaskRequest`. Older iOS
  versions degrade (no-op).
- **Android API 24+** — uses ML Kit Subject Segmentation
  (`com.google.mlkit:segmentation-subject`). The model downloads on first use.

## JS API

```ts
import { removeBackgroundAsync, isAvailable } from 'modules/vw-background-removal';

const { uri, removed } = await removeBackgroundAsync(inputUri);
// removed === true  -> `uri` is a new transparent PNG in the cache dir
// removed === false -> `uri` is the original input, unchanged
```

## Graceful degradation

`removeBackgroundAsync` **never throws** for expected conditions. When the native
module is absent (Expo Go / not yet built), the platform is unsupported (iOS < 17,
Android < 24), no subject is detected, or the Android model is not yet downloaded, it
resolves to `{ uri, removed: false }` with the original URI. `isAvailable` reports
whether the native module is linked into the current binary.

## Security audit

Audited 2026-11-28 (issue #127, M9 Security). Findings: **none — no fix required.**
The module requests no permissions beyond what the main app already declares, its
error paths leak no device-local paths or identifiers to the JS layer, and it makes
no user-controlled network requests. Detail per acceptance criterion:

### AC1 — Permissions

- **iOS:** The config plugin (`app.plugin.js`) adds only `NSCameraUsageDescription`
  and `NSPhotoLibraryUsageDescription`, and **only when not already present**. The
  main app's `ios/VirtualWardrobe/Info.plist` already declares both (along with
  `NSMicrophoneUsageDescription` and `NSLocalNetworkUsageDescription`), so the plugin
  is a no-op for this app and adds **no new permission**. The Swift source
  (`ios/VwBackgroundRemovalModule.swift`) declares no permission itself: it uses only
  Vision, CoreImage, and a `FileManager` write to the caches directory — none of which
  require a permission.
- **Android:** The module ships **no `AndroidManifest.xml` fragment** (the module
  directory contains only `build.gradle` and the Kotlin source), so it declares no
  Android permissions. `build.gradle` sets `minSdkVersion 24` and pulls
  `com.google.mlkit:segmentation-subject:16.0.0-beta1`; any `INTERNET` usage is a
  *library-level* dependency of ML Kit (its model download, see AC3), not a
  permission the module declares.

### AC2 — Error payloads returned to JS

Every error path discards the caught error and resolves to the fallback
`{ uri: <input>, removed: false }`:

- iOS `ios/.../VwBackgroundRemovalModule.swift`: the `catch { promise.resolve(fallback) }`
  at the `removeBackground` bridge and the `return fallback` guards both drop the error.
- Android `android/.../VwBackgroundRemovalModule.kt`: all three `catch (e: Throwable)`
  blocks (bridge, ML Kit `Tasks.await`, and `Uri.parse`) ignore `e` and return the fallback.
- JS `index.ts`: the `catch { return { uri, removed: false } }` swallows native rejections.

Consequently no error payload contains a stack trace, an `error.message`, or a user
identifier (no IDFA / `identifierForVendor` / UDID anywhere in the module). The only
path in a fallback is the **original input URI**, which the caller already supplied —
an echo, not a leak. The cache path the module *does* construct
(`vw-bg-removed-<UUID>.png`) is produced and returned only on the **success** path, and
its filename is a random `UUID` (not a user identifier). No fix required.

### AC3 — Network

- **iOS:** fully on-device — Vision `VNGenerateForegroundInstanceMaskRequest` +
  CoreImage + a `FileManager` caches write. No network.
- **Android:** ML Kit Subject Segmentation downloads its model on first use, which is a
  network fetch. It is handled by Google Play Services / the ML Kit runtime using a
  **fixed, vendor-controlled model URL** — the module passes no URL (only
  `SubjectSegmentation.getClient(options)` and `process(image)`), so the destination is
  not user-controlled. This is already noted above ("The model downloads on first use").

A grep of the module confirms no `URLSession`/`NSURL`/`fetch`/`okhttp`/`retrofit`/
socket/WebView usage on either platform. No fix required.

### AC5 — Verification

`npm run typecheck` and `npm run lint` pass on a clean tree; no code change was needed
because the audit found nothing to fix.

## Testing

### Automated — JS bridge (CI)

`tests/capture/backgroundRemoval.test.ts` runs in Node/Jest and covers the full
bridge contract without a device. It mocks `expo-modules-core` to exercise:

| Scenario | Expected result |
|---|---|
| Module not linked (`null`) | `{ uri: input, removed: false }` |
| Valid success result | `{ uri: outputPng, removed: true }` |
| Passthrough result (`removed: false`) | `{ uri: input, removed: false }` |
| Malformed result (no `uri` field, `null`) | falls back to original |
| `removed` type coercion (truthy/falsy non-boolean) | coerced to `boolean` |
| Native call rejects (Error or string) | `{ uri: input, removed: false }` |

Run with:

```sh
npx jest tests/capture/backgroundRemoval.test.ts
```

### Manual — native iOS (device or Simulator)

**Prerequisites:** iOS 17+ device or Simulator; custom dev build (prebuild enabled, see #75).

**Build:**
```sh
npx expo prebuild --platform ios
npx expo run:ios          # or open ios/ in Xcode and run on target
```

**Test matrix:**

| Condition | How to reproduce | Expected |
|---|---|---|
| Success path | Capture a photo of a person against a plain background | Result screen shows cutout; `removed: true` in logs |
| No subject found | Capture a photo of a landscape/object with no clear foreground | Falls back to original; `removed: false` |
| iOS < 17 | Run on a Simulator with iOS 16 runtime | Skips segmentation; `removed: false`; capture completes |
| Module missing (Expo Go) | Open the app in Expo Go | `isAvailable === false`; capture completes without cutout |

**Output verification:** when `removed: true`, the cached PNG must be readable and
contain transparent pixels. Verify in the review screen: the cutout preview must show
a transparent background (checkerboard or app background visible around the subject).

### Manual — native Android (device or Emulator)

**Prerequisites:** API 24+ physical device or AVD; custom dev build; Google Play Services
present (ML Kit model download requires Play Services).

**Build:**
```sh
npx expo prebuild --platform android
npx expo run:android
```

**Test matrix:**

| Condition | How to reproduce | Expected |
|---|---|---|
| Success path (model cached) | Capture a photo of a person; model already downloaded | Cutout PNG; `removed: true` |
| Model not yet downloaded | First run with no network access | Falls back to original; `removed: false` |
| No subject found | Capture landscape/text only image | Falls back to original; `removed: false` |
| API < 24 | Run on an emulator with API 23 | Build-level minSdk blocks install; document the block |
| Module missing | Run a bare managed-workflow build without the module linked | `isAvailable === false`; capture completes |

**Output verification:** same as iOS — the review screen must display a transparent-background
cutout when `removed: true`. The output file extension must be `.png` (JPEG cannot
represent transparency).

### CI limitations

The iOS and Android native paths require a physical device or platform-specific
emulator/simulator and cannot execute in the standard macOS/Linux Node CI runner.
The JS bridge tests give confidence that the contract and fallback logic are correct;
native paths are verified manually per the matrices above and on each platform
release that touches `VwBackgroundRemovalModule`.
