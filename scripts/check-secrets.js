#!/usr/bin/env node
// check-secrets.js — scan the repo for common API-key patterns before commit.
// Run: `npm run check:secrets`
// Exit 0 if clean, 1 if any suspect token found.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// Files/dirs to skip entirely
const SKIP_DIRS = new Set([
  'node_modules', '.git', 'logs', 'archive',
  'data/snapshots', 'data/archive', '.playwright', 'playwright-report', 'test-results'
]);
const SKIP_FILES = new Set([
  '.env', '.env.example', '.env.local',
  'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'
]);

// Signature patterns — high-confidence
const PATTERNS = [
  { name: 'Google API key',      re: /\bAIza[0-9A-Za-z_-]{35}\b/ },
  { name: 'GitHub PAT classic',  re: /\bghp_[0-9A-Za-z]{36,}\b/ },
  { name: 'GitHub fine-grained', re: /\bgithub_pat_[0-9A-Za-z_]{60,}\b/ },
  { name: 'AWS access key',      re: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: 'Resend API key',      re: /\bre_[0-9A-Za-z_-]{20,}\b/ },
  { name: 'Anthropic API key',   re: /\bsk-ant-[0-9A-Za-z-]{90,}\b/ },
  { name: 'OpenAI API key',      re: /\bsk-[A-Za-z0-9]{48,}\b/ },
  { name: 'Slack bot token',     re: /\bxox[baprs]-[0-9A-Za-z-]{10,}\b/ }
];

// Only scan these extensions (plus dotfiles w/ no ext)
const SCAN_EXT = new Set(['', '.js', '.mjs', '.cjs', '.ts', '.json', '.md', '.html',
                          '.css', '.yml', '.yaml', '.toml', '.txt', '.webmanifest']);

function shouldSkipPath(rel) {
  const parts = rel.split(/[\\/]/);
  for (const p of parts) if (SKIP_DIRS.has(p)) return true;
  for (let i = 0; i < parts.length - 1; i++) {
    const combo = parts.slice(i).join('/');
    if (SKIP_DIRS.has(combo)) return true;
  }
  const base = path.basename(rel);
  if (SKIP_FILES.has(base)) return true;
  return false;
}

function walk(dir, out = []) {
  const rel = path.relative(ROOT, dir);
  if (rel && shouldSkipPath(rel)) return out;
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    const r = path.relative(ROOT, full);
    if (shouldSkipPath(r)) continue;
    if (e.isDirectory()) walk(full, out);
    else {
      const ext = path.extname(e.name);
      if (SCAN_EXT.has(ext)) out.push(full);
    }
  }
  return out;
}

function scan() {
  const files = walk(ROOT);
  const findings = [];
  for (const f of files) {
    let body;
    try { body = fs.readFileSync(f, 'utf8'); } catch { continue; }
    for (const p of PATTERNS) {
      const m = body.match(p.re);
      if (m) findings.push({ file: path.relative(ROOT, f), pattern: p.name, sample: m[0].slice(0, 8) + '…' });
    }
  }
  return findings;
}

const findings = scan();
if (findings.length === 0) {
  console.log('✓ check-secrets: clean (' + PATTERNS.length + ' patterns scanned).');
  process.exit(0);
}
console.error('✗ check-secrets: found ' + findings.length + ' suspect token(s):');
for (const f of findings) console.error('  ' + f.pattern + '  in  ' + f.file + '  (' + f.sample + ')');
console.error('Resolve before committing. Move secrets to .env (gitignored) or GitHub Secrets.');
process.exit(1);
