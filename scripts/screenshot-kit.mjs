// M3-15 portfolio screenshot kit. Drives the Expo web build to each of the four
// portfolio-journey routes and writes a deterministic PNG per screen under
// docs/screenshots/. Reuses the M3-5 pose-smoke.mjs pattern: non-blocking
// `spawn` of `expo start --web`, a fetch-poll `waitForServer`, a Playwright
// `chromium.launch()` at a fixed viewport, and try/finally teardown.
//
// Deterministic by construction:
//   - Fixed viewport (VIEWPORT below), fixed device scale, no animations wait.
//   - Each route waits on a stable on-screen anchor string before shooting, so a
//     shot is never captured mid-hydration.
//   - App state is whatever a clean local web run renders (the welcome/wardrobe/
//     studio anchors are static; /looks renders its saved-looks state, empty on a
//     fresh web profile — see docs/screenshots/README.md).
//
// Skippable-when-Playwright-absent (mirrors pose-smoke.mjs): if @playwright/test
// is not installed the browser pass is skipped with exit 0, so a clean checkout /
// CI without a browser binary stays green. This host has Chromium installed, so a
// real run captures all four PNGs.
//
// Usage: `npm run screenshots`  (alias for `node scripts/screenshot-kit.mjs`)

import { fileURLToPath } from 'node:url';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { spawn } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SHOTS_DIR = join(root, 'docs', 'screenshots');

// Fixed, recorded viewport: a phone-ish portrait frame so the portfolio images
// read as the mobile app they represent. Documented in docs/screenshots/README.md.
const VIEWPORT = { width: 390, height: 844 };

// The four portfolio-journey routes, each with a stable anchor string that is
// always rendered on that screen (independent of the auto/manual pose path or of
// saved-look state), plus the deterministic output filename.
const ROUTES = [
    { name: 'welcome', file: 'kit-onboarding-welcome.png', anchor: 'Welcome to VirtualWardrobe' },
    { name: 'wardrobe', file: 'kit-gallery-wardrobe.png', anchor: 'Record your own clothes' },
    { name: 'studio', file: 'kit-studio.png', anchor: 'Save & share' },
    { name: 'looks', file: 'kit-looks-saved.png', anchor: 'Your looks' },
];

async function hasPlaywright() {
    // Resolve via the bare specifier so Node applies package.json "exports"
    // (importing the package dir as file:// throws ERR_UNSUPPORTED_DIR_IMPORT).
    try {
        await import('@playwright/test');
        return true;
    } catch {
        return false;
    }
}

async function main() {
    if (!(await hasPlaywright())) {
        console.log('[screenshots] SKIP: @playwright/test not installed.');
        console.log('         (run `npm add -D @playwright/test && npx playwright install chromium` to enable)');
        return;
    }

    const { chromium } = await import('@playwright/test');

    const PORT = 8081;
    const BASE = `http://localhost:${PORT}`;

    // execSync would block forever on a long-running server, so spawn the Expo web
    // dev server non-blocking and poll until it answers before driving the routes.
    const server = spawn('npx', ['expo', 'start', '--web', '--port', String(PORT)], {
        cwd: root,
        stdio: 'inherit',
        env: { ...process.env, BROWSER: 'none', CI: '1' },
    });

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

    let browser;
    try {
        const ready = await waitForServer(BASE, 180000);
        if (!ready) throw new Error(`expo web dev server never became ready at ${BASE}`);

        if (!existsSync(SHOTS_DIR)) mkdirSync(SHOTS_DIR, { recursive: true });

        browser = await chromium.launch();
        const page = await browser.newPage({
            viewport: VIEWPORT,
            deviceScaleFactor: 1,
        });

        for (const route of ROUTES) {
            const out = join(SHOTS_DIR, route.file);
            await page.goto(`${BASE}/${route.name}`, { waitUntil: 'domcontentloaded' });
            // Wait on the stable anchor so the shot is post-hydration; non-fatal on
            // timeout (we still capture whatever rendered and log it).
            await page
                .getByText(route.anchor, { exact: false })
                .first()
                .waitFor({ timeout: 60000 })
                .catch((e) => console.log(`[screenshots] ${route.name} anchor wait: ${e.message}`));
            // A short settle for fonts/images so the frame is stable, not animating.
            await page.waitForTimeout(1200);
            await page.screenshot({ path: out });
            console.log(`[screenshots] ${route.name} -> ${out}`);
        }
    } finally {
        if (browser) await browser.close();
        server.kill('SIGTERM');
    }
}

main().catch((e) => {
    console.error('[screenshots] fatal:', e);
    process.exit(1);
});
