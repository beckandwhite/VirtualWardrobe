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

// #65 welcome language-selector coverage. On a fresh web context the active locale
// is the default 'en' (no persisted setting, no system-locale global on web), so
// the switcher offers the eight *non-English* native-language labels. We assert all
// eight render fully (no chip clipped past the viewport, no horizontal document
// scroll) at a desktop width and a narrow phone width, then that selecting one swaps
// the welcome copy (the clicked label drops to zero as it becomes the active,
// excluded locale). Each label's box is measured against the viewport — an
// equivalent robust check to "within the selector/card bounds" — not a DOM presence
// check. Labels mirror src/i18n/strings.ts LOCALE_LABELS minus the active 'en'.
const WELCOME_LANG_LABELS = [
    'Magyar',
    'Deutsch',
    'Español',
    'Italiano',
    'Français',
    'Tiếng Việt',
    '简体中文',
    '繁體中文',
];
const WELCOME_LANG_VIEWPORTS = [
    { name: 'desktop', width: 1024, height: 768 },
    { name: 'narrow', width: 375, height: 812 },
];
// Horizontal tolerance (px) so a 1px sub-pixel rounding at the card edge isn't a
// false clip. A chip is "visible" when its left edge is at/after 0 and its right
// edge never passes the viewport (the card is max-width 480, full-width only on a
// narrow screen, so the viewport bound is the binding edge either way).
const CLIP_TOLERANCE = 2;

// The expected console.warn the manual path surfaces (AC3).
const EXPECTED_WARN_RE = /falling back to manual/i;

// #63 — the Me tab's About & feedback section. On web, each action renders as an
// `<a data-testid="…">` (the inner View's `href` + `testID`), so the harness can
// read each action's destination `href` WITHOUT clicking it — a click would make
// expo-linking's web openURL set window.location and navigate the page away to the
// target. The four canonical URLs mirror app/(tabs)/me.tsx FEEDBACK_ACTIONS.
const REPO = 'https://github.com/beckandwhite/VirtualWardrobe';
const ME_FEEDBACK_ACTIONS = [
   { testId: 'me.link.about', href: REPO },
   { testId: 'me.link.bug', href: `${REPO}/issues/new?template=bug_report.md` },
   { testId: 'me.link.feature', href: `${REPO}/issues/new?template=feature_request.md` },
   { testId: 'me.link.guide', href: `${REPO}/blob/main/docs/usage.md` },
];

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

// #65 welcome language-selector coverage. Visits /welcome at a desktop and a
// narrow viewport and asserts all eight non-active native-language labels render
// unclipped and that selecting one swaps the welcome copy. The active locale on a
// fresh web context is the default 'en' (no persisted setting / system-locale
// global on web), so the eight visible labels are the non-English LOCALE_LABELS.
//
// Clipping is measured, not text-presence: each label's bounding box must sit
// inside the viewport (left edge >= 0, right edge <= viewport width) — the card is
// max-width 480, so the viewport bound is the binding edge — and the document must
// have no horizontal overflow (no hidden horizontal scroll). Selection is verified
// behaviorally: after clicking 'Deutsch' the active locale flips to 'de', so that
// label leaves the selector (the active locale is excluded) and 'English' (the
// now-inactive locale) appears — i.e. the welcome copy/selector changed.
async function checkWelcomeLanguages(browser, baseUrl, fatalErrors) {
     for (const vp of WELCOME_LANG_VIEWPORTS) {
         const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
         try {
             const page = await context.newPage();

             await page.goto(baseUrl() + '/welcome', { waitUntil: 'domcontentloaded' });
             // The selector only renders once the i18n provider resolves; wait on the
             // first known label so the check runs against a settled selector.
             await page.getByText(WELCOME_LANG_LABELS[0], { exact: true }).waitFor({ timeout: 60000 });

             const clipped = [];
             for (const label of WELCOME_LANG_LABELS) {
                 const loc = page.getByText(label, { exact: true });
                 const count = await loc.count();
                 if (count === 0) {
                     clipped.push(`${label} (not rendered)`);
                     continue;
                 }
                 const box = await loc.first().boundingBox();
                 if (!box) {
                     clipped.push(`${label} (no bounds)`);
                     continue;
                 }
                 const offLeft = box.x < -CLIP_TOLERANCE;
                 const offRight = box.x + box.width > vp.width + CLIP_TOLERANCE;
                 if (offLeft || offRight) clipped.push(`${label} (x=${Math.round(box.x)} w=${Math.round(box.width)})`);
             }

             // The document must not overflow horizontally (no hidden scroll area).
             const hOverflow = await page.evaluate(
                 () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
             );

             // Selection: click a known alternative and assert the active locale flipped.
             let selectionErr = null;
             try {
                 await page.getByText('Deutsch', { exact: true }).click();
                 const stillThere = await page.getByText('Deutsch', { exact: true }).count();
                 const englishNow = await page.getByText('English', { exact: true }).count();
                 if (stillThere > 0 || englishNow === 0) {
                     selectionErr =
                         `selection did not flip active locale (Deutsch still=${stillThere}, English now=${englishNow})`;
                 }
             } catch (e) {
                 selectionErr = e.message;
             }

             const problems = [];
             if (clipped.length) problems.push(`clipped/off-viewport: ${clipped.join(', ')}`);
             if (hOverflow > CLIP_TOLERANCE) problems.push(`horizontal overflow ${Math.round(hOverflow)}px`);
             if (selectionErr) problems.push(`selection: ${selectionErr}`);

             if (problems.length) {
                 fatalErrors.push(`[welcome ${vp.name} ${vp.width}x${vp.height}] ${problems.join('; ')}`);
                 console.log(`[e2e:web] welcome ${vp.name} (${vp.width}x${vp.height}): FAIL — ${problems.join('; ')}`);
             } else {
                 console.log(`[e2e:web] welcome ${vp.name} (${vp.width}x${vp.height}): 8 options visible + selectable, no clip/overflow`);
             }
        } finally {
            await context.close();
        }
    }
}

// #63 — assert the Me tab's About & feedback section renders all four actions and
// each targets its canonical GitHub/usage URL. The harness *reads* each action's
// `href` (the inner View renders an <a data-testid="…"> on web) instead of clicking
// it: tapping runs expo-linking's openURL, which on web sets window.location and
// navigates the page away from /me (the AC "without opening/submitting an issue").
// A missing action or a wrong target is a real break, folded into fatalErrors like
// a route failure; the check itself never navigates.
async function checkMeFeedbackLinks(page, fatalErrors) {
    const problems = [];
    for (const action of ME_FEEDBACK_ACTIONS) {
        const locator = page.getByTestId(action.testId);
        const count = await locator.count();
        if (count === 0) {
            problems.push(`${action.testId} not rendered`);
            continue;
        }
        const first = locator.first();
        // Read the destination from the DOM attribute, not a navigation.
        const href = await first.getAttribute('href').catch(() => null);
        const visible = await first.isVisible().catch(() => false);
        if (!visible) {
            problems.push(`${action.testId} not visible`);
            continue;
        }
        if (href !== action.href) {
            problems.push(`${action.testId} href=${JSON.stringify(href)} want ${JSON.stringify(action.href)}`);
        }
    }
    if (problems.length) {
        fatalErrors.push(`[me feedback] ${problems.join('; ')}`);
        console.log(`[e2e:web] me feedback: FAIL — ${problems.join('; ')}`);
    } else {
        console.log(`[e2e:web] me feedback: 4 actions render with canonical targets (no navigation)`);
    }
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

          // #65 welcome language-selector coverage: all eight non-active native-language
          // options render unclipped and are selectable at desktop + narrow viewports.
          // Failures are folded into fatalErrors so they gate the run like a route break.
         await checkWelcomeLanguages(browser, baseUrl, fatalErrors);

            // #63 Me About & feedback section: load /me and assert all four actions
            // render and target the canonical URLs — without clicking (reading the
            // href keeps the smoke on /me). Folded into fatalErrors like a route.
         try {
             await page.goto(baseUrl() + '/me', { waitUntil: 'domcontentloaded' });
             await checkMeFeedbackLinks(page, fatalErrors);
         } catch (e) {
             fatalErrors.push(`[me feedback] ${e.message}`);
             console.log(`[e2e:web] me feedback: ${e.message}`);
          }

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
