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
