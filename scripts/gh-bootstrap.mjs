#!/usr/bin/env node
// gh-bootstrap.mjs — create the VirtualWardrobe GitHub project on the PERSONAL github.com.
//
// Prereqs (see Plans/04-gh-setup.md):
//   gh auth login -h github.com   # token scopes: repo, project, public_repo
//   gh auth status -h github.com  # must show your personal login
//
// This script reconciles GitHub milestones, labels, and project cards. GitHub issue bodies are
// the source of truth; the repository does not mirror them under Plans/issues/.
//
// Usage:  node scripts/gh-bootstrap.mjs
// Env:    OWNER=<your-handle>  REPO=VirtualWardrobe  DRY_RUN=1  (dry run prints only)

import { spawnSync } from 'node:child_process';

const OWNER = process.env.OWNER || 'beckandwhite';
const REPO = process.env.REPO || 'VirtualWardrobe';
const DRY = process.env.DRY_RUN === '1';

const MILESTONES = ['M0 Foundations', 'M1 Wardrobe', 'M2 Try-On', 'M3 Native+Polish', 'M4 QA', 'M5 Devops', 'M6 Language & i18n'];
const BASE_LABELS = ['feat', 'ux', 'ml', 'debt', 'docs', 'spike', 'tooling', 'M0', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6'];
const STATUS_OPTIONS = ['Backlog', 'To Do', 'In Progress', 'Done', 'Shipped'];

function gh(args, { input } = {}) {
  if (DRY) {
    console.log(`$ gh ${args.join(' ')}${input ? '   < ' + input.slice(0, 40) : ''}`);
    return true;
  }
  const r = spawnSync('gh', args, {
    input,
    stdio: ['pipe', 'inherit', 'inherit'],
    shell: false,
  });
  return r.status === 0;
}

function ghCapture(args, { input } = {}) {
  if (DRY) return '';
  const r = spawnSync('gh', args, { input, encoding: 'utf8', shell: false });
  if (r.status !== 0) throw new Error((r.stderr || '').trim() || `gh ${args.join(' ')} failed`);
  return (r.stdout || '').trim();
}

function api(method, path, body) {
  const args = ['api', path, '--method', method];
  if (body) args.push('--input', '-');
  return ghCapture(args, { input: body ? JSON.stringify(body) : undefined });
}

function run(step, fn) {
  try { fn(); } catch (e) {
    console.warn(`⚠ ${step}: ${e.message}`);
  }
}

// 1. Repo
run('repo', () => {
  console.log(`\n[1/4] repo ${OWNER}/${REPO}`);
  const view = spawnSync('gh', ['repo', 'view', REPO, '--json', 'name'], {
    stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8',
   });
  if (view.status !== 0) {
    gh(['repo', 'create', REPO, '--private', '--description', 'Local-first virtual wardrobe + pose-aware try-on (Expo).']);
   }
});

// 2. Milestones + labels (idempotent)
run('meta', () => {
  console.log(`\n[2/4] milestones + labels`);
  const milestones = JSON.parse(api('GET', `/repos/${OWNER}/${REPO}/milestones?state=all&per_page=100`));
  for (const title of MILESTONES) {
    if (milestones.some(m => m.title === title)) { console.log(`    (milestone exists: ${title})`); continue; }
    api('POST', `/repos/${OWNER}/${REPO}/milestones`, { title });
  }
  for (const label of BASE_LABELS) gh(['label', 'create', label, '--description', label, '--color', '0e639c']);
});

// 3. Issue bodies are managed directly in GitHub; this script never creates or overwrites them.
console.log('\n[3/4] issue bodies: GitHub source of truth (no local mirror)');

// 4. Project board + add issues (GitHub Projects v2)
run('project', () => {
  console.log(`\n[4/4] project board`);
  const projects = JSON.parse(ghCapture(['project', 'list', '--owner', OWNER, '--format', 'json']));
  let project = projects.projects.find(p => p.title === REPO);
  if (!project) project = JSON.parse(ghCapture(['project', 'create', '--owner', OWNER, '--title', REPO, '--format', 'json']));
  const projectNumber = project.number;
  let fields = JSON.parse(ghCapture(['project', 'field-list', String(projectNumber), '--owner', OWNER, '--format', 'json'])).fields;
  let boardStatus = fields.find(f => f.name === 'Board Status' && f.options);
  if (!boardStatus) {
    gh(['project', 'field-create', String(projectNumber), '--owner', OWNER, '--name', 'Board Status', '--data-type', 'SINGLE_SELECT', '--single-select-options', STATUS_OPTIONS.join(',')]);
  }
  const issues = JSON.parse(ghCapture(['issue', 'list', '--repo', `${OWNER}/${REPO}`, '--state', 'all', '--limit', '100', '--json', 'number,title,url']));
  const projectItems = JSON.parse(ghCapture(['project', 'item-list', String(projectNumber), '--owner', OWNER, '--limit', '100', '--format', 'json'])).items;
  const existingUrls = new Set(projectItems.map(item => item.content?.url).filter(Boolean));
  for (const remote of issues) {
    if (!existingUrls.has(remote.url)) gh(['project', 'item-add', String(projectNumber), '--owner', OWNER, '--url', remote.url]);
  }
  const m0 = issues.find(i => i.title.startsWith('M0-1 ·'));
  if (m0) gh(['project', 'item-edit', String(projectNumber), '--owner', OWNER, '--url', m0.url, '--field', 'Board Status', '--value', 'In Progress']);
  console.log(`  board: https://github.com/users/${OWNER}/projects/${projectNumber}`);
});

console.log('\nDone. (Set DRY_RUN=1 to preview without writing.)');
