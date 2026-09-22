// M3-7 network-free verification: load the *vendored* TFJS MoveNet singlepose-lite
// graph from public/pose/ on the CPU backend (no runtime network, ADR-004) and run
// a forward pass on the bundled body-photo fixture, asserting 17 COCO keypoints come
// back. This is the "minimal TFJS load + estimatePoses" path M3-7 allows instead of
// the browser e2e (Playwright is not installed on this host).
//
// It also asserts the graph is the *canonical* known-good artifact (generatedBy the
// canonical tfhub origin, not a local converter synthesis) and cross-checks the
// input signature against what @tensorflow-models/pose-detection consumes
// (`int32 [1,192,192,3]` input), plus the runtime output shape `[1,1,17,3]`.

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MODEL_DIR = path.join(root, 'public', 'pose', 'movenet-singlepose-lite');
const FIXTURE = path.join(root, 'assets', 'sample', 'body.png');
const EXPECTED_URL = '/pose/movenet-singlepose-lite/model.json';

const modelJsonPath = path.join(MODEL_DIR, 'model.json');
let failures = 0;
const fail = (msg) => {
    failures++;
    console.error(`  FAIL: ${msg}`);
    return failures;
};
const ok = (msg) => console.log(`  ok: ${msg}`);

// 1) The pointer the app uses must target the vendored graph. Read the generated
// loader as text (it's TS, not importable from a .mjs) and parse the constant.
const modelUrlTs = fs.readFileSync(path.join(root, 'src', 'pose', 'modelUrl.ts'), 'utf8');
const m = modelUrlTs.match(/MOVENET_MODEL_URL\s*=\s*["']([^"']+)["']/);
const MOVENET_MODEL_URL = m ? m[1] : null;
if (MOVENET_MODEL_URL === EXPECTED_URL) ok(`modelUrl.ts -> ${MOVENET_MODEL_URL}`);
else fail(`modelUrl.ts = ${MOVENET_MODEL_URL}, want ${EXPECTED_URL}`);

// 2) Load the graph *from the vendored bytes only* — replace global fetch with a
// handler that serves the on-disk assets, so a runtime network fetch is impossible.
const modelJsonBytes = fs.readFileSync(modelJsonPath);
const bin = fs.readFileSync(path.join(MODEL_DIR, 'movenet-lightning.bin'));
const origFetch = globalThis.fetch;
globalThis.fetch = async (input) => {
    const url = typeof input === 'string' ? input : input.url;
    if (url.includes('movenet-lightning.bin')) return new Response(new Uint8Array(bin));
    if (url.includes('model.json')) return new Response(modelJsonBytes);
    return new Response(null, { status: 404 });
};

// 3) Imports guarded: a missing tfjs/converter is a hard failure here — the whole
// point is to prove a real forward pass, unlike the skippable M3-5 harness.
const converterMod = await import('@tensorflow/tfjs-converter');
const converter = converterMod.default ?? converterMod;
const tfMod = await import('@tensorflow/tfjs-core');
const tf = tfMod.default ?? tfMod;
await import('@tensorflow/tfjs-backend-cpu');
await tf.setBackend('cpu');
await tf.ready();

// 4) Canonical-known-good check: the graph must be generated from the canonical
// origin, not a local ONNX->TFJS converter synthesis (that is M3-6).
const parsed = JSON.parse(modelJsonBytes.toString('utf8'));
const generatedBy = parsed.generatedBy ?? '';
if (/tfhub\.dev\/google\/movenet/i.test(generatedBy)) {
    ok(`generatedBy is canonical origin: ${generatedBy}`);
} else {
    fail(`generatedBy not canonical: ${generatedBy || '(absent)'}`);
}

// 5) Load network-free via the intercepted fetch.
let model;
try {
    model = await converter.loadGraphModel(MOVENET_MODEL_URL, {
        fetchHandler: globalThis.fetch,
      });
    ok('tf.loadGraphModel succeeded (network-free)');
} catch (e) {
    globalThis.fetch = origFetch;
    await tf.dispose();
    process.exit(fail(`loadGraphModel threw: ${e.message}`));
}

// 6) Input signature cross-check vs pose-detection's MoveNet contract.
const expectedIn = [1, 192, 192, 3];
const expectedOut = [1, 1, 17, 3];
const inShape = (model.inputs?.[0]?.shape ?? []).map((n) => n ?? 0);
const inMatch = inShape.join(',') === expectedIn.join(',');
if (inMatch) ok(`input signature [${inShape}] == ${JSON.stringify(expectedIn)}`);
else fail(`input signature [${inShape}] != ${JSON.stringify(expectedIn)}`);

// 7) Forward pass on the bundled fixture. Decode the PNG with pngjs (no canvas),
// resize to 192x192, cast to int32 [0,255] as MoveNet expects, and assert the
// runtime output shape + 17 finite COCO keypoints. The detector consumes the
// output the same way (moveNetModel.execute -> shape [1,1,17,3]), so this is the
// API-compatibility proof M3-7 requires.
let outputShape = [];
try {
    const PNG = require('pngjs').PNG;
    const png = PNG.sync.read(fs.readFileSync(FIXTURE));
    const h = png.height;
    const w = png.width;
    const rgb = new Float32Array(h * w * 3);
    for (let i = 0; i < h * w; i++) {
        rgb[i * 3] = png.data[i * 4];
        rgb[i * 3 + 1] = png.data[i * 4 + 1];
        rgb[i * 3 + 2] = png.data[i * 4 + 2];
       }
    const img = tf.tensor4d(rgb, [1, h, w, 3]);
    const resized = tf.image.resizeBilinear(img, [expectedIn[1], expectedIn[2]]);
    const input = tf.reshape(tf.cast(resized, 'int32'), expectedIn);
    const output = model.execute(input);
    const data = output.dataSync();
    outputShape = output.shape.slice();
    img.dispose();
    input.dispose();
    output.dispose();

    const outMatch = outputShape.join(',') === expectedOut.join(',');
    if (outMatch) ok(`runtime output shape [${outputShape}] == ${JSON.stringify(expectedOut)}`);
    else fail(`runtime output shape [${outputShape}] != ${JSON.stringify(expectedOut)}`);

    const nOut = 17;
    const step = 3;
    const keypoints = new Array(nOut);
    let finiteCount = 0;
    for (let k = 0; k < nOut; k++) {
        const x = data[k * step];
        const y = data[k * step + 1];
        const s = data[k * step + 2];
        const finite = Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(s);
        if (finite) finiteCount++;
        keypoints[k] = { x, y, score: s };
       }
    if (keypoints.length === 17) ok('forward pass produced 17 keypoints');
    else fail(`keypoints.length = ${keypoints.length}, want 17`);
    if (finiteCount === 17) ok('all 17 keypoints are finite (model ran end-to-end)');
    else fail(`${finiteCount}/17 keypoints finite`);
    const sample = keypoints.slice(0, 6).map((k) => `(${k.x.toFixed(3)},${k.y.toFixed(3)},s=${(k.score ?? NaN).toFixed(3)})`);
    console.log(`  sample keypoints: ${sample.join(' ')}`);
} catch (e) {
    fail(`forward pass threw: ${e.message}`);
}

model.dispose();
await tf.dispose();
globalThis.fetch = origFetch;

console.log(
    failures
          ? `\nM3-7 verify: ${failures} FAIL — graph not verified clean.`
          : '\nM3-7 verify: PASS — known-good canonical MoveNet graph loaded network-free and produced 17 keypoints.',
);
process.exit(failures ? 1 : 0);
