// M4-4 pure smoke-decision — the part of the browser smoke that's testable without
// a browser. `decidePath` picks which studio path the harness asserts on: 'auto'
// when the MoveNet model is reachable (URL pointer + model bytes present), 'manual'
// otherwise. A model-absent run still asserts the happy path *on the manual
// fallback* (safeEstimate → [] → identity transform + the M2-4 banner), so a skip
// is green, not a regression (ADR-004: the model is an enhancement, not a gate).
//
// Two independent, both-exit-0 decisions (AC1 + AC3):
//    1. shouldSkipBrowser — when @playwright/test (Chromium) is absent, skip the
//      browser pass entirely and run this self-test instead (mirrors D22.3).
//    2. decidePath + classifyConsole — a model-absent browser run asserts the
//      MANUAL fallback: it must surface the expected "falling back to manual" warn
//      (AC3) and NO fatal pageerror/console-error on the happy path.
//
// This sandbox has neither a browser binary nor the model, so `web-smoke` exits at
// skip #1. The browser pass in `web-smoke.mjs` is written for a machine with Chromium.

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

// Studio status text the harness asserts on for each path (app/studio.tsx
// `statusText`). The web studio renders these exact strings.
export const STATUS_AUTO = 'Auto-placed from detected pose';
export const STATUS_MANUAL = 'Auto-drape unavailable — adjusting manually';
// The dismissible M2-4 banner shown on the manual path (app/studio.tsx `bannerText`).
export const BANNER_MANUAL = 'Auto-drape unavailable here — adjusting manually.';

// The console.warn the safeEstimate wrapper emits when the web provider fails to
// load the (absent) model (src/pose/PoseProvider.ts). On a model-absent run this
// is EXPECTED — assert it appeared (AC3) but never treat it as fatal.
export const EXPECTED_FALLBACK_RE = /falling back to manual/i;
export function isExpectedWarn(text) {
    return EXPECTED_FALLBACK_RE.test(text ?? '');
}

// Browser-generated sub-resource load failures ("Failed to load resource: the
// server responded with a status of 404/500"). These are network failures, not
// app-logic crashes: on the manual path the pose-detection bundle 500s (that's the
// very trigger for the fallback, AC3) and benign asset 404s (placeholders) also
// surface this way. They are recorded for QA but MUST NOT fail the run — real
// breaks arrive as a `pageerror` or an app-emitted console.error, and route-level
// failures are gated separately by the route goto/networkidle checks.
export const RESOURCE_LOAD_ERROR_RE = /failed to load resource/i;
export function isResourceLoadError(text) {
    return RESOURCE_LOAD_ERROR_RE.test(text ?? '');
}

/**
 * Classify one console/pageerror entry from the browser pass.
 * @param {{ kind: 'console' | 'pageerror', type?: string, text?: string }} entry
 * @returns {'fatal' | 'expected' | 'resource' | 'info'}
 */
export function classifyConsole(entry) {
    const { kind, type, text } = entry ?? {};
    // An uncaught pageerror always breaks the happy path → fatal.
    if (kind === 'pageerror') return 'fatal';
    // The pose-fallback warn is the one thing we WANT on the manual path (AC3).
    if (isExpectedWarn(text)) return 'expected';
    // A console.error that is a browser resource-load failure (404/500 on a
    // sub-resource, incl. the intentionally-absent model bundle) is non-fatal.
    if (type === 'error' && isResourceLoadError(text)) return 'resource';
    // Any other console.error is a genuine app-level error → fatal.
    if (type === 'error') return 'fatal';
    return 'info';
}

// The browser pass only runs when Chromium is actually installed. When it's absent
// we skip (exit 0) and run this module's --selftest instead — the in-sandbox
// ceiling, mirrored from M3-5 D22.3.
export function shouldSkipBrowser(input) {
    return !(input && input.playwright);
}

// A recorded assertion: a named check that the browser pass proved (or failed to
// prove). Required UI checks contribute a `{ ok: false }` here, which gates the
// run (see buildReport). This is the hard-assertion contract #83 demanded: any
// missing screen/fallback/interaction surfaces as a failed assertion, never a
// logged-and-ignored warning.
export function makeAssertion(name, ok, detail = '') {
    return { name, ok: Boolean(ok), detail };
}

// The entry route's valid destinations per src/onboarding/welcomeGate.ts. A
// fresh context (no persisted state) resolves to /welcome; a returning photoless
// user to /me; a photo-set user to /wardrobe. The harness asserts the landing is
// one of these.
export const ENTRY_DESTINATIONS = Object.freeze(['/welcome', '/me', '/wardrobe']);

// A fresh-context (empty persisted state) entry lands on /welcome: has_seen_welcome
// is bootstrapped '0', so welcomeGate(false, …) → '/welcome'. This is the
// deterministic expected screen the harness proves for a clean run.
export const EXPECTED_ENTRY_DESTINATION = '/welcome';

/**
 * @param {{
 *   path?: 'auto' | 'manual';
 *   modelUrl?: string | null;
 *   modelPresent?: boolean;
 *   browserEnabled?: boolean;
 *   skipped?: boolean;
 *   fatalErrors?: string[];
 *   resourceErrors?: string[];
 *   expectedWarns?: number;
 *   routes?: { route: string; ok: boolean }[];
 *   screenshots?: string[];
 *   assertions?: { name: string; ok: boolean; detail?: string }[];
 *   interaction?: { name: string; ok: boolean; detail?: string };
 *   entryDestination?: string;
 *   seconds?: number;
 * }} run
 */
export function buildReport(run) {
    const fatalErrors = run.fatalErrors ?? [];
    const resourceErrors = run.resourceErrors ?? [];
    const expectedWarns = run.expectedWarns ?? 0;
    const routes = run.routes ?? [];
    // #83: the hard-assertion contract. Any failed screen/fallback/interaction
    // assertion is recorded here and gates the run — assertion failures can no
    // longer be swallowed into a passing report.
    const assertions = run.assertions ?? [];
    const failedAssertions = assertions.filter((a) => !a.ok);
     // The one meaningful interaction the smoke proves (a state transition, not a
    // bare URL load). Absent means "not yet proven", which fails the run.
    const interaction = run.interaction ?? { name: 'no-interaction', ok: false, detail: 'no interaction recorded' };
    const path = run.path ?? 'manual';
    const skipped = Boolean(run.skipped);
    const failedRoutes = routes.filter((r) => !r.ok);
    // Which welcome viewports were proofed this run (the language selector only
    // renders on /welcome; on a persisted-state landing the check is N/A).
    const welcomeCoverage = run.welcomeCoverage ?? [];
      // A run is PASS only when not skipped, no fatal errors, no failed routes, no
      // failed assertions, a proven interaction, and (on the manual path) the
      // fallback warn having appeared (AC3). Resource-load failures are recorded
      // but never gate (see classifyConsole).
    let status = 'PASS';
    if (skipped) status = 'SKIP';
    else if (fatalErrors.length) status = 'FAIL';
    else if (failedRoutes.length) status = 'FAIL';
    else if (failedAssertions.length) status = 'FAIL';
    else if (!interaction.ok) status = 'FAIL';
    else if (path === 'manual' && expectedWarns === 0) status = 'FAIL';
    return {
          ...run,
        path,
        skipped,
        resourceErrors,
        assertions,
        interaction,
        entryDestination: run.entryDestination ?? null,
        welcomeCoverage,
        status,
        ok: status === 'PASS',
        summary: reportSummary({
            path,
            skipped,
            status,
            fatalErrors,
            failedRoutes,
            failedAssertions,
            interaction,
            entryDestination: run.entryDestination ?? null,
            welcomeCoverage,
            expectedWarns,
            routes,
            resourceErrors,
          }),
      };
}

function reportSummary({
    path,
    skipped,
    status,
    fatalErrors,
    failedRoutes,
    failedAssertions,
    interaction,
    entryDestination,
    welcomeCoverage,
    expectedWarns,
    routes,
    resourceErrors,
 }) {
    const parts = [`M4-4 e2e:web smoke (asserts the ${path} path)`];
    if (skipped) parts.push('browser pass skipped — no Chromium/Playwright (in-sandbox ceiling)');
    parts.push(`status: ${status}`);
    if (entryDestination) parts.push(`entry destination: ${entryDestination}`);
    parts.push(`routes: ${routes.filter((r) => r.ok).length}/${routes.length} ok`);
    parts.push(`fatal console/pageerror: ${fatalErrors.length}`);
    parts.push(`expected fallback warns: ${expectedWarns}`);
    parts.push(`resource-load failures (non-fatal): ${(resourceErrors ?? []).length}`);
    if (failedRoutes.length) parts.push(`failed routes: ${failedRoutes.map((r) => r.route).join(', ')}`);
    if (failedAssertions.length) parts.push(`failed assertions: ${failedAssertions.map((a) => a.name).join(', ')}`);
    parts.push(
     `welcome language selector: ${welcomeCoverage.length ? `proofed at ${welcomeCoverage.join(', ')}` : 'N/A (not on /welcome)'}`,
    );
    parts.push(`interaction: ${interaction.ok ? 'proven' : 'NOT proven'} — ${interaction.name}`);
    return parts.join('\n');
}

export function renderReport(report) {
    const shot = report.screenshots?.length ? `\nScreenshot: ${report.screenshots.join(', ')}` : '';
    const t = typeof report.seconds === 'number' ? `\nWall time: ${report.seconds}s` : '';
    return `${report.summary}${shot}${t}`;
}

export function reportJson(report) {
    return JSON.stringify({ ...report, generatedAt: new Date().toISOString() }, null, 2);
}

// Self-test mode: `node scripts/web-smoke-path.mjs --selftest`. Returns process
// exit 0/1 so a CI step can gate on it without a browser (AC4).
if (import.meta.url === `file://${process.argv[1]}` || process.argv.includes('--selftest')) {
    let failed = 0;
    const check = (name, got, want) => {
        const ok = JSON.stringify(got) === JSON.stringify(want);
        if (!ok) failed++;
        console.log(`${name}: got ${JSON.stringify(got)} want ${JSON.stringify(want)} ${ok ? 'ok' : 'FAIL'}`);
    };
    // decidePath — mirror the M3-5 (pose-smoke-path) self-test cases.
    check('decidePath auto', decidePath({ modelUrl: 'x', modelDir: '/m' }), 'auto');
    check('decidePath null dir', decidePath({ modelUrl: 'x', modelDir: null }), 'manual');
    check('decidePath null url', decidePath({ modelUrl: null, modelDir: '/m' }), 'manual');
    check('decidePath empty', decidePath({}), 'manual');
    // skip decision — the in-sandbox ceiling.
    check('shouldSkipBrowser absent', shouldSkipBrowser({ playwright: false }), true);
    check('shouldSkipBrowser present', shouldSkipBrowser({ playwright: true }), false);
    // console classification — fatal vs the expected manual-fallback warn (AC3).
    check('classify pageerror', classifyConsole({ kind: 'pageerror', text: 'boom' }), 'fatal');
    check('classify console-error', classifyConsole({ kind: 'console', type: 'error', text: 'TypeError' }), 'fatal');
    check(
        'classify resource 404 non-fatal',
        classifyConsole({ kind: 'console', type: 'error', text: 'Failed to load resource: the server responded with a status of 404 (Not Found)' }),
        'resource',
    );
    check(
        'classify resource 500 (absent model) non-fatal',
        classifyConsole({ kind: 'console', type: 'error', text: 'Failed to load resource: the server responded with a status of 500 (Internal Server Error)' }),
        'resource',
    );
    check('isResourceLoadError hit', isResourceLoadError('Failed to load resource: status of 404'), true);
    check('isResourceLoadError miss', isResourceLoadError('TypeError: x is not a function'), false);
    check(
        'classify expected warn',
        classifyConsole({ kind: 'console', type: 'warning', text: 'PoseProvider "movenet-web" failed, falling back to manual:' }),
        'expected',
    );
    check('classify plain warn', classifyConsole({ kind: 'console', type: 'warning', text: 'webgl unavailable' }), 'info');
    check('classify log', classifyConsole({ kind: 'console', type: 'log', text: 'hi' }), 'info');
    check('isExpectedWarn hit', isExpectedWarn('... falling back to manual:'), true);
    check('isExpectedWarn miss', isExpectedWarn('nothing here'), false);
    // report outcomes — skip stays green; manual needs the warn; fatal/fail routes fail.
    check('buildReport skip status', buildReport({ path: 'manual', skipped: true }).status, 'SKIP');
    check('buildReport skip summary has SKIP', buildReport({ path: 'manual', skipped: true }).summary.includes('SKIP'), true);
     check(
         'buildReport manual pass',
        buildReport({
           path: 'manual',
           fatalErrors: [],
           routes: [{ route: '/studio', ok: true }],
           expectedWarns: 1,
           interaction: { name: 'save-share', ok: true },
           assertions: [makeAssertion('studio-state', true)],
           entryDestination: EXPECTED_ENTRY_DESTINATION,
         }).status,
         'PASS',
      );
     check(
         'buildReport manual no-warn fails',
        buildReport({
          path: 'manual',
          fatalErrors: [],
          routes: [{ route: '/studio', ok: true }],
          expectedWarns: 0,
          interaction: { name: 'save-share', ok: true },
          assertions: [makeAssertion('studio-state', true)],
         }).status,
         'FAIL',
      );
    check(
        'buildReport fatal fails',
        buildReport({ path: 'manual', fatalErrors: ['pageerror boom'], routes: [{ route: '/wardrobe', ok: true }], expectedWarns: 1 }).status,
        'FAIL',
    );
     check(
        'buildReport failed route fails',
        buildReport({ path: 'manual', fatalErrors: [], routes: [{ route: '/wardrobe', ok: false }], expectedWarns: 1 }).status,
        'FAIL',
     );
      // #83 hard-assertion contract: a failed required assertion gates the run and
      // surfaces in the summary (swallowing is no longer possible).
    check(
        'buildReport failed assertion fails',
        buildReport(
           {
              path: 'manual',
              fatalErrors: [],
              routes: [{ route: '/studio', ok: true }],
              expectedWarns: 1,
              interaction: { name: 'save-share', ok: true },
              assertions: [makeAssertion('studio-state', false, 'banner missing')],
           },
        ).status,
        'FAIL',
     );
    check(
        'buildReport failed assertion names itself',
        buildReport(
           {
              path: 'manual',
              assertions: [makeAssertion('entry-landing', false, 'not /welcome')],
              interaction: { name: 'save-share', ok: true },
              expectedWarns: 1,
           },
        ).summary.includes('entry-landing'),
        true,
     );
    // #83 AC3: a run with no proven interaction fails even when everything else is green.
    check(
        'buildReport no-interaction fails',
        buildReport({
           path: 'manual',
           fatalErrors: [],
           routes: [{ route: '/studio', ok: true }],
           expectedWarns: 1,
           assertions: [makeAssertion('studio-state', true)],
        }).status,
        'FAIL',
     );
    // #83: a full happy path (assertions + interaction + warn) passes.
    check(
        'buildReport all-proven passes',
        buildReport({
           path: 'manual',
           fatalErrors: [],
           routes: [{ route: '/wardrobe', ok: true }, { route: '/studio', ok: true }],
           expectedWarns: 1,
           interaction: { name: 'save-share', ok: true },
           assertions: [
            makeAssertion('entry-landing', true),
            makeAssertion('wardrobe-content', true),
            makeAssertion('studio-state', true),
           ],
           entryDestination: EXPECTED_ENTRY_DESTINATION,
        }).status,
        'PASS',
     );
    check('EXPECTED_ENTRY_DESTINATION', EXPECTED_ENTRY_DESTINATION, '/welcome');
    check('ENTRY_DESTINATIONS has wardrobe', ENTRY_DESTINATIONS.includes('/wardrobe'), true);
      // artifact round-trip — the JSON report a CI step can parse (AC4).
    const goodManual = buildReport({
        path: 'manual',
        fatalErrors: [],
        routes: [{ route: '/wardrobe', ok: true }, { route: '/studio', ok: true }],
        expectedWarns: 1,
        interaction: { name: 'save-share', ok: true },
        assertions: [
             makeAssertion('entry-landing', true),
             makeAssertion('wardrobe-content', true),
             makeAssertion('studio-state', true),
             makeAssertion('screenshot', true),
            ],
        entryDestination: EXPECTED_ENTRY_DESTINATION,
      });
    check('reportJson round-trip', JSON.parse(reportJson(goodManual)).status, 'PASS');
    check('renderReport has summary', renderReport(goodManual).includes('PASS'), true);

    if (failed) {
        console.error(`${failed} self-test case(s) failed`);
        process.exit(1);
    }
    console.log('web-smoke-path self-test: PASS');
}
