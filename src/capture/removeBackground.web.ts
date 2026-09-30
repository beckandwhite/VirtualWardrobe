import type { BackgroundRemovalResult } from './removeBackground';

// Web on-device background removal — TEMPORARY PASSTHROUGH.
//
// The intended engine is @imgly/background-removal (in-browser WASM), but it
// imports onnxruntime-web through package-"exports" subpaths (e.g.
// "onnxruntime-web/webgpu") that Metro's default resolver can't bundle. A static
// import here pulled that unresolvable graph into the whole web bundle via
// `@/capture` and broke every route (#76 web-smoke failure). Until the engine is
// wired properly — install onnxruntime-web, enable Metro package exports, and
// verify in a browser (tracked as a #64 follow-up) — web keeps the original image
// so captures still succeed and the review step falls back to "keep original".
export async function removeBackground(sourceUri: string): Promise<BackgroundRemovalResult> {
   return { uri: sourceUri, removed: false };
}
