# M3-7 · known-good MoveNet graph — network-free one-run demo

Proven source: vladmandic/human-models `models/movenet-lightning.{json,bin}`
(canonical tfhub origin `tfhub.dev/google/movenet/singlepose/lightning/4`).

Run: `node scripts/pose-m37-verify.mjs` (Node 22, CPU backend, no playwright).

## Assertions (all green)
- modelUrl.ts -> /pose/movenet-singlepose-lite/model.json
- generatedBy: https://tfhub.dev/google/movenet/singlepose/lightning/4 (canonical, not a converter synthesis)
- tf.loadGraphModel succeeded network-free (fetch intercepted; no runtime network)
- input signature [1,192,192,3] int32 == pose-detection MoveNet contract
- runtime output shape [1,1,17,3] float32
- forward pass on assets/sample/body.png produced 17 finite COCO keypoints

Result: PASS. MoveNet singlepose-lite drives a real estimate on a bundled fixture
with zero runtime network. This is the API-compatibility proof M3-7 requires and
the path that supersedes M3-6's unverified converter output for public/pose/.
