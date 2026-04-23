#!/usr/bin/env node
// check-esm.js — runtime import-check every ES module under app/js/.
// node --check alone misses ESM-specific errors (bad template literal escapes, bad imports).
// Run: `npm run check:esm`
// Exit 0 if all import cleanly; 1 if any fail.

const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const ROOT = path.resolve(__dirname, '..');
const APP_JS = path.join(ROOT, 'app', 'js');

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else if (e.name.endsWith('.js')) out.push(full);
  }
  return out;
}

(async () => {
  if (!fs.existsSync(APP_JS)) {
    console.error('No app/js directory — nothing to check.');
    process.exit(0);
  }
  const files = walk(APP_JS);
  let fails = 0;
  for (const f of files) {
    const rel = path.relative(ROOT, f).replace(/\\/g, '/');
    try {
      await import(pathToFileURL(f).href);
      console.log('OK   ' + rel);
    } catch (e) {
      fails++;
      console.error('FAIL ' + rel + '  -- ' + e.message);
    }
  }
  if (fails > 0) {
    console.error('\n✗ ' + fails + ' file(s) failed ESM import check.');
    process.exit(1);
  }
  console.log('\n✓ All ' + files.length + ' ES modules imported cleanly.');
})();
