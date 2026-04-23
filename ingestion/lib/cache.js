// cache.js — per-source cache-and-diff helper.
// Each source writes its raw fetch to logs/cache/<sourceId>-<timestamp>.json for audit,
// and a rolling logs/cache/<sourceId>-latest.json for next-run diff.

const fs = require('fs');
const path = require('path');

const CACHE_DIR = path.resolve(__dirname, '..', '..', 'logs', 'cache');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeCache(sourceId, payload) {
  ensureDir(CACHE_DIR);
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const dated = path.join(CACHE_DIR, sourceId + '-' + ts + '.json');
  const latest = path.join(CACHE_DIR, sourceId + '-latest.json');
  const body = JSON.stringify(payload, null, 2);
  fs.writeFileSync(dated, body);
  fs.writeFileSync(latest, body);
  return { dated, latest };
}

function readLatest(sourceId) {
  const p = path.join(CACHE_DIR, sourceId + '-latest.json');
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; }
}

module.exports = { writeCache, readLatest, CACHE_DIR };
