// Copies vendored model bytes from assets/pose/ to public/pose/ so the web dev
// server can serve them (ADR-004 — fully local, no network). The canonical
// MoveNet-SinglePose-Lite bytes are committed under assets/pose/ (M3-7); this
// step just stages them where Expo's web server serves public/. Run after a
// fresh install:  `npm run fetch:pose`. Idempotent — safe to run twice.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'assets', 'pose');
const DEST = path.join(ROOT, 'public', 'pose');

fs.cpSync(SRC, DEST, { recursive: true });
console.log(`ok: copied ${path.relative(ROOT, SRC)}/ -> ${path.relative(ROOT, DEST)}/`);
