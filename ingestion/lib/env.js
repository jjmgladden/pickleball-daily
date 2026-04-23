// env.js — zero-dependency .env loader.
// Call loadEnv() once from any ingestion entry point; reads ../../.env relative to this file.
// Never logs values.

const fs = require('fs');
const path = require('path');

function loadEnv(envPath) {
  const p = envPath || path.resolve(__dirname, '..', '..', '.env');
  if (!fs.existsSync(p)) return { loaded: false, path: p };
  const text = fs.readFileSync(p, 'utf8');
  let count = 0;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!m) continue;
    let val = m[2];
    if ((val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(m[1] in process.env)) { process.env[m[1]] = val; count++; }
  }
  return { loaded: true, path: p, count };
}

module.exports = { loadEnv };
