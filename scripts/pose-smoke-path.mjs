// M3-5 pure skip-decision — the one part of the pipeline that's testable without a
// browser. `decidePath` picks which path the e2e harness asserts on: 'auto' when
// the MoveNet model is reachable (URL set + model bytes present), 'manual'
// otherwise. A model-absent run still asserts the happy path (on the manual
// fallback), so CI stays green on a clean checkout (ADR-004: the model is an
// enhancement, not a gate). Skippable-when-model-absent per M3-5 AC2.

/**
 * @param {{ modelUrl?: string | null, modelDir?: string | null }} input
 * @returns {'auto' | 'manual'}
 */
export function decidePath(input) {
    const { modelUrl, modelDir } = input ?? {};
    // 'auto' only when both the URL pointer and the model bytes are present.
    if (modelUrl && modelDir && modelDir.length > 0) return 'auto';
    return 'manual';
}

// Status text the harness asserts on for each path. The web studio renders these
// exact strings (see app/studio.tsx statusText + the M2-4 manual banner).
export const STATUS_AUTO = 'Auto-placed from detected pose';
export const STATUS_MANUAL = 'Auto-drape unavailable — adjusting manually';

/**
 * Human-readable demo note for a run. M3-5 AC3: a one-run demo note auto-gen
 * from the run log + captured PNG.
 * @param {{ path: 'auto' | 'manual', screenshot?: string, seconds?: number }} run
 */
export function demoNote(run) {
    const { path, screenshot, seconds } = run;
    const label = path === 'auto' ? 'MoveNet auto-place' : 'manual fallback';
    const shot = screenshot ? `\nScreenshot: ${screenshot}` : '';
    const t = typeof seconds === 'number' ? `\nWall time: ${seconds}s` : '';
    return `M3-5 e2e:pose run (asserts the ${label} path)${shot}${t}`;
}

// Self-test mode: `node scripts/pose-smoke-path.mjs --selftest`. Returns process
// exit 0/1 so a CI step can gate on it without a browser.
if (import.meta.url === `file://${process.argv[1]}` || process.argv.includes('--selftest')) {
    let failed = 0;
    const cases = [
         { in: { modelUrl: 'x', modelDir: '/m' }, out: 'auto' },
         { in: { modelUrl: 'x', modelDir: null }, out: 'manual' },
         { in: { modelUrl: null, modelDir: '/m' }, out: 'manual' },
         { in: {}, out: 'manual' },
        ];
    for (const c of cases) {
        const got = decidePath(c.in);
        const ok = got === c.out;
        if (!ok) failed++;
        console.log(`decidePath(${JSON.stringify(c.in)}) = ${got} ${ok ? 'ok' : 'FAIL (want ' + c.out + ')'}`);
     }
    if (failed) {
        console.error(`${failed} self-test case(s) failed`);
        process.exit(1);
     }
    console.log('pose-smoke-path self-test: PASS');
}
