// Committed canonical pointer. Points pose-detection at the *bundled* MoveNet
// model that `npm run fetch:pose` places under `public/pose/` (served at the web
// root; bytes are gitignored — see .gitignore and docs/dev-setup.md). Native
// never imports this file (platform split via providers.web.ts), so the
// `@tensorflow*` deps stay out of the native bundle.
//
// If the bytes aren't downloaded, runtime load fails → `PoseUnavailable` → the
// studio's `safeEstimate` degrades to manual placement (M2-4 path). No crash.
//
// To repoint after moving the model, run:  node scripts/fetch-movenet.mjs --emit-url-only
export const MOVENET_MODEL_URL = '/pose/movenet-singlepose-lite/model.json';
