// Points pose-detection at the bundled model (ADR-004 — fully local, no network).
// Served from public/pose/ by the web dev server; populate with `npm run fetch:pose`.
export const MOVENET_MODEL_URL = "/pose/movenet-singlepose-lite/model.json";
