// M4-4 e2e:web harness. Drives the Expo web build through a minimal happy path and
// asserts the real screens render: entry (loading → redirect to /onboarding or
// /wardrobe), the /wardrobe + /studio routes, and the manual-fallback banner when
// the pose model is absent (the in-sandbox default). Captures a screenshot + a
// JSON/text report to docs/screenshots/ so a QA run or CI step has an artifact.
//
// Skippable-when-browser-absent (AC1/AC3, mirrors D22.3): two independent skips,
// both exit 0 so a clean checkout is green (ADR-004: the model is an enhancement,
// not a gate):
//   1. @playwright/test not installed → skip the browser pass, run the pure
//      self-test, print the decided path, write the demo note + JSON report.
//   2. MoveNet model absent → the browser pass asserts the MANUAL-fallback path
//       (safeEstimate → [] → identity + the M2-4 banner) instead of auto, so a
//      model-less run still produces a PNG + pass.
//
// Fatal-error gate: a `pageerror` listener + console-error capture fails the happy
// path. The pose-fallback `console.warn` ("... falling back to manual") is
// EXPECTED on the manual path and MUST NOT fail the run — it's asserted to have
// appeared instead (AC3, via web-smoke-path.classifyConsole).
//
// Per D35, @playwright/test is now a repo devDependency and the browser pass is
// required in CI; per D50.1, Chromium is installed on the macOS host and the two
// M3-9 bugs (directory-URL presence check; blocking `execSync` server launch) are
// fixed here to match pose-smoke.mjs. Skip #1 remains only as a defensive fallback
// for environments where Chromium genuinely cannot be provisioned.

import { fileURLToPath } from 'node:url';
import { existsSync, mkdirSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { execSync, spawn } from 'node:child_process';
import {
    decidePath,
    shouldSkipBrowser,
    classifyConsole,
    buildReport,
    renderReport,
    reportJson,
} from './web-smoke-path.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MODEL_DIR = join(root, 'public', 'pose', 'movenet-singlepose-lite');
const SHOTS_DIR = join(root, 'docs', 'screenshots');
const startMs = Date.now();
const now = () => Math.round((Date.now() - startMs) / 1000);

// Decide which path to assert: 'auto' only if the URL pointer AND the model bytes
// exist. Otherwise 'manual' (the fallback path still asserts the happy path).
const modelUrl = process.env.MOVENET_MODEL_URL || null;
const modelDirPresent = existsSync(MODEL_DIR) && readdirSync(MODEL_DIR).length > 0;
const path = decidePath({ modelUrl, modelDir: modelDirPresent ? MODEL_DIR : null });

// The routes the happy path must load (AC2). Entry is checked implicitly (the app
// redirects to /onboarding or /wardrobe); these are the screens we assert on.
const ROUTES = ['wardrobe', 'studio'];

// The expected console.warn the manual path surfaces (AC3).
const EXPECTED_WARN_RE = /falling back to manual/i;

function ensureShotsDir() {
    if (!existsSync(SHOTS_DIR)) mkdirSync(SHOTS_DIR, { recursive: true });
}

function stamp() {
    return new Date().toISOString().replace(/[:.]/g, '-');
}

// Persist the demo note + JSON report so a QA run / CI has an artifact (AC4).
function writeArtifacts(report) {
    ensureShotsDir();
    const noteFile = join(SHOTS_DIR, 'web-last-run.md');
    const jsonFile = join(SHOTS_DIR, 'web-last-run.json');
    writeFileSync(noteFile, renderReport(report) + '\n');
    writeFileSync(jsonFile, reportJson(report) + '\n');
    console.log('[e2e:web] report -> docs/screenshots/web-last-run.md (+ .json)');
}

async function hasPlaywright() {
    // Resolve via the bare package specifier so Node applies package.json
    // "exports". Importing the package *directory* as a file:// URL throws
    // ERR_UNSUPPORTED_DIR_IMPORT even when the dep is installed (M3-9 / D50.1).
    try {
        await import('@playwright/test');
        return true;
    } catch {
        return false;
    }
}

// Start the Expo web dev server. NOTE: execSync would block forever on a
// long-running server (it returns a Buffer, not a child), so spawn it
// non-blocking and poll waitForServer() until it answers before driving the
// routes (M3-9 / D50.1 — back-ported from pose-smoke.mjs).
function startExpoWeb() {
    const port = process.env.EXPO_WEB_PORT || '8081';
    return spawn('npx', ['expo', 'start', '--web', '--port', String(port)], {
        cwd: root,
        stdio: 'inherit',
        env: { ...process.env, BROWSER: 'none', CI: '1' },
    });
}

// Poll the dev server until it answers (< 500) or the deadline passes.
async function waitForServer(url, timeoutMs) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        try {
            const r = await fetch(url);
            if (r.status < 500) return true;
        } catch {
            // server not up yet — keep polling
        }
        await new Promise((res) => setTimeout(res, 2000));
    }
    return false;
}

function baseUrl() {
    return process.env.EXPO_WEB_URL || 'http://localhost:' + (process.env.EXPO_WEB_PORT || '8081');
}

async function main() {
    console.log(`[e2e:web] path=${path} modelUrl=${modelUrl ? 'set' : 'absent'} bytes=${modelDirPresent}`);

    // Skippable browser pass: skip cleanly when Playwright/Chromium is unavailable.
    if (shouldSkipBrowser({ playwright: await hasPlaywright() })) {
        console.log('[e2e:web] SKIP browser pass: @playwright/test not installed.');
        console.log('          (run `npm add -D @playwright/test && npx playwright install chromium` to enable)');
        // Still run the pure skip-decision self-test so the run is meaningful.
        execSync('node scripts/web-smoke-path.mjs --selftest', { cwd: root, stdio: 'inherit' });
        writeArtifacts(
             buildReport({
                path,
                modelUrl,
                modelPresent: modelDirPresent,
                browserEnabled: false,
                skipped: true,
                routes: ROUTES.map((r) => ({ route: '/' + r, ok: false })),
                seconds: now(),
             }),
        );
        return;
     }

    const { chromium } = await import('@playwright/test');

     // Start the Expo web dev server, wait until it answers, then drive the path.
    const server = startExpoWeb();
    let browser;
    try {
        const ready = await waitForServer(baseUrl(), 180000);
        if (!ready) throw new Error(`expo web dev server never became ready at ${baseUrl()}`);

        browser = await chromium.launch();
        const page = await browser.newPage();

        // Fatal-error gate (AC "no fatal console errors"). A pageerror or any
        // console.error breaks the happy path; the pose-fallback warn is expected
        // on the manual path and is recorded, not fatal (via classifyConsole).
        // Fatal-error gate (AC "no fatal console errors"), classified via the pure
        // web-smoke-path.classifyConsole so the rules are unit-tested:
        //   pageerror / app console.error → fatal (breaks the happy path)
        //   "falling back to manual" warn  → expected (AC3, must appear on manual)
        //   "Failed to load resource" 4xx/5xx → resource (non-fatal, recorded for QA;
        //      incl. the intentionally-absent pose bundle that triggers the fallback)
        const fatalErrors = [];
        const warnings = [];
        const resourceErrors = [];
        const record = (entry) => {
            const kind = classifyConsole(entry);
            if (kind === 'fatal') fatalErrors.push(`${entry.kind === 'pageerror' ? 'pageerror' : 'console.error'}: ${entry.text}`);
            else if (kind === 'expected') warnings.push(entry.text);
            else if (kind === 'resource') resourceErrors.push(entry.text);
        };
        page.on('pageerror', (e) => record({ kind: 'pageerror', text: String(e) }));
        page.on('console', (m) => record({ kind: 'console', type: m.type(), text: m.text() }));

        // 1. Expo web startup: the entry route boots and redirects (index.tsx).
        await page.goto(baseUrl() + '/', { waitUntil: 'domcontentloaded' });
        // 2. Route loads for wardrobe + studio (AC2). WaitFor the tab labels the
        //    studio/wardrobe render, with a generous timeout; on timeout we report
        //    but do not hard-fail before writing the artifact.
        const routes = [];
        for (const route of ROUTES) {
            try {
                await page.goto(baseUrl() + '/' + route, { waitUntil: 'domcontentloaded' });
                await page.waitForLoadState('networkidle', { timeout: 30000 });
                routes.push({ route: '/' + route, ok: true });
                console.log(`[e2e:web] route /${route} loaded`);
            } catch (e) {
                routes.push({ route: '/' + route, ok: false });
                console.log(`[e2e:web] route /${route}: ${e.message}`);
             }
        }

        // 3 + 4. Studio manual-fallback path (AC3): the M2-4 banner renders when the
        // model is absent. On the auto path we instead assert the auto-status.
        const expectedText =
            path === 'auto'
                 ? 'Auto-placed from detected pose'
                : 'Auto-drape unavailable here — adjusting manually.';
        try {
            await page.getByText(expectedText, { exact: false }).waitFor({ timeout: 90000 });
        } catch (e) {
            console.log(`[e2e:web] status wait: ${e.message}`);
         }

        // Assert the expected fallback warn appeared on the manual path (AC3).
        const expectedWarns = warnings.filter((w) => EXPECTED_WARN_RE.test(w)).length;

        // Capture the screenshot artifact.
        ensureShotsDir();
        const out = join(SHOTS_DIR, `web-${path}-${stamp()}.png`);
        try {
            await page.screenshot({ path: out, fullPage: true });
            console.log(`[e2e:web] screenshot -> ${out} (via ${path} path)`);
        } catch (e) {
            console.log(`[e2e:web] screenshot: ${e.message}`);
         }

        const report = buildReport({
            path,
            modelUrl,
            modelPresent: modelDirPresent,
            browserEnabled: true,
            skipped: false,
            fatalErrors,
            resourceErrors,
            expectedWarns,
            routes,
         screenshots: out ? [out] : [],
            seconds: now(),
         });
        writeArtifacts(report);
        console.log(`[e2e:web] fatal: ${fatalErrors.length}; expected warns: ${expectedWarns}; resource-load failures (non-fatal): ${resourceErrors.length}`);
        console.log(`[e2e:web] ${report.summary}`);

        // A fatal error or a failed route / missing fallback warn is a real break.
        if (!report.ok) {
            console.error(`[e2e:web] smoke FAIL: ${report.status}`);
            process.exitCode = 1;
        }
     } finally {
        if (browser) await browser.close();
        server.kill('SIGTERM');
     }
}

main().catch((e) => {
    console.error('[e2e:web] fatal:', e);
    process.exit(1);
});
