#!/usr/bin/env node
// gh-bootstrap.mjs — create the VirtualWardrobe GitHub project on the PERSONAL github.com.
//
// Prereqs (see Plans/04-gh-setup.md):
//   gh auth login -h github.com   # token scopes: repo, project, public_repo
//   gh auth status -h github.com  # must show your personal login
//
// This script is idempotent-ish (checks before creating milestones/labels) and is
// intentionally the "single source of truth" between Plans/issues/*.md and GitHub.
//
// Usage:  node scripts/gh-bootstrap.mjs
// Env:    OWNER=<your-handle>  REPO=VirtualWardrobe  DRY_RUN=1  (dry run prints only)

import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const OWNER = process.env.OWNER || 'beckandwhite';
const REPO = process.env.REPO || 'VirtualWardrobe';
const DRY = process.env.DRY_RUN === '1';

const MILESTONES = ['M0 Foundations', 'M1 Wardrobe', 'M2 Try-On', 'M3 Native+Polish'];
const LABELS = ['feat', 'ux', 'ml', 'debt', 'docs', 'spike', 'M0', 'M1', 'M2', 'M3'];

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const issuesDir = join(repoRoot, 'Plans', 'issues');

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
  for (const m of MILESTONES) {
    const out = spawnSync('gh', ['milestone', 'list', '--state', 'all', '--json', 'title'], {
      stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8',
      });
    const has = out.status === 0 && (out.stdout || '').includes(m);
    if (has) { console.log(`    (milestone exists: ${m})`); continue; }
    gh(['milestone', 'create', m]);
    }
  for (const l of LABELS) {
    // create if missing; "already exists" returns status 1 and is fine.
    const r = spawnSync('gh', ['label', 'create', l, '--description', l, '--color', '0e639c'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      });
    if (r.status !== 0) console.log(`    (label ${l}: ${r.status === 1 ? 'exists' : 'created/err'})`);
    }
});

// 3. Issues from Plans/issues/*.md
function parseIssue(name) {
  const raw = readFileSync(join(issuesDir, name), 'utf8');
  const [first, ...rest] = raw.split('\n');
  const title = first.replace(/^#\s*/, '').trim();
  const meta = raw.match(/Milestone:\s*([^·]+)·\s*Labels:\s*(.+)/);
  const milestone = meta ? meta[1].trim() : null;
  const labels = meta ? meta[2].trim() : '';
  const num = title.split(' · ')[0]; // e.g. M0-1
  return { title, milestone, labels, num, body: rest.join('\n'), file: name };
}

function createIssue(issue) {
  console.log(`   • ${issue.num}: ${issue.title}`);
  const args = ['issue', 'create', '--title', issue.title, '--body', issue.body];
  if (issue.milestone) args.push('--milestone', issue.milestone);
  if (issue.labels) args.push('--labels', issue.labels.split(',').map(s => s.trim()).join(','));
  const num = gh(args) ;
  return num;
}

run('issues', () => {
  console.log(`\n[3/4] issues from Plans/issues/`);
  const files = readdirSync(issuesDir).filter(f => f.endsWith('.md')).sort();
  for (const f of files) createIssue(parseIssue(f));
});

// 4. Project board + add issues (GitHub Projects v2)
run('project', () => {
  console.log(`\n[4/4] project board`);
  // gh project create --owner ... --title ... ; then column add; then items.
  // Full wiring is environment-specific; printed as guidance:
  console.log('  gh project init --owner '+OWNER+' --title VirtualWardrobe --body ""');
  console.log('  gh project field add <proj> <item> --type single_select --name Status --options "Backlog,To Do,In Progress,Done,Shipped"');
  console.log('  gh project item add <proj> --url https://github.com/'+OWNER+'/'+REPO+'/issues/<n>  (repeat per issue)');
});

console.log('\nDone. (Set DRY_RUN=1 to preview without writing.)');
