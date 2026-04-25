// fetch-ppa-rankings.js — Playwright scrape of ppatour.com/player-rankings/.
// The page is JavaScript-hydrated; a naked fetch returns "Loading…".
// Respect Crawl-delay: 3. Disallow query strings per robots.txt.
// Requires: `npm install` + `npx playwright install chromium`.
// Writes logs/cache/ppa-rankings-latest.json; orchestrator picks it up.

const fs = require('fs');
const path = require('path');
const { loadEnv } = require('./lib/env');
const { writeCache } = require('./lib/cache');

loadEnv();

const URL = 'https://www.ppatour.com/player-rankings/';
const TIMEOUT_MS = 45_000;
const SLUG_CACHE_PATH = path.resolve(__dirname, '..', 'logs', 'cache', 'ppa-player-slugs.json');
const PPA_UA = 'Mozilla/5.0 (compatible; PickleballDailyBot/1.0; +https://github.com/jjmgladden/pickleball-daily)';

function isCleanName(name) {
  // Conservative: ASCII letters + spaces only, <= 3 tokens. Accented, hyphenated,
  // or multi-part names stay unlinked per KB-0021 "no guessing".
  return /^[A-Za-z ]+$/.test(name) && name.split(/\s+/).length <= 3;
}

function slugifyName(name) {
  return name.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');
}

function loadSlugCache() {
  try { return JSON.parse(fs.readFileSync(SLUG_CACHE_PATH, 'utf8')); }
  catch { return { generatedAt: null, mapping: {}, unresolved: [] }; }
}

function saveSlugCache(cache) {
  try { fs.writeFileSync(SLUG_CACHE_PATH, JSON.stringify(cache, null, 2) + '\n'); }
  catch (e) { /* cache failures are non-fatal */ }
}

// Verify any top-20 names not already in the slug cache. HTTP HEAD per candidate,
// 400ms throttle to honor PPA's robots Crawl-delay spirit. Returns fresh merged cache.
async function enrichSlugCache(topNames) {
  const cache = loadSlugCache();
  cache.mapping = cache.mapping || {};
  cache.unresolved = Array.isArray(cache.unresolved) ? cache.unresolved : [];
  const unresolvedNames = new Set(cache.unresolved.map(u => u.playerName));
  for (const name of topNames) {
    if (cache.mapping[name] || unresolvedNames.has(name)) continue;
    if (!isCleanName(name)) {
      cache.unresolved.push({ playerName: name, reason: 'ambiguous-characters' });
      continue;
    }
    const slug = slugifyName(name);
    const testUrl = 'https://ppatour.com/athlete/' + slug + '/';
    try {
      const res = await fetch(testUrl, { method: 'HEAD', headers: { 'User-Agent': PPA_UA }, redirect: 'manual' });
      if (res.status === 200) cache.mapping[name] = testUrl;
      else cache.unresolved.push({ playerName: name, reason: 'http-' + res.status });
    } catch (e) {
      cache.unresolved.push({ playerName: name, reason: e.message || 'fetch-failed' });
    }
    await new Promise(r => setTimeout(r, 400));
  }
  cache.generatedAt = new Date().toISOString();
  saveSlugCache(cache);
  return cache;
}

function toInt(s) {
  const n = parseInt(String(s).replace(/[,\s]/g, ''), 10);
  return Number.isFinite(n) ? n : null;
}

// Live column order on ppatour.com/player-rankings/ (verified 2026-04-25, KB-0031):
//   PPA Rank · Name · Country · Age · Points
// Country renders as a flag <img> with no textContent → comes through as ''.
// Earlier mapping mislabeled column 3 as "bracket" and column 4 as "eventsPlayed";
// "27 events played" for Ben Johns was actually his age. Corrected here.
function mapRow(cols) {
  if (!Array.isArray(cols)) return null;
  if (cols.length < 4) return null;
  const [rank, playerName, country = '', age = '', points = ''] = cols;
  const rankInt = toInt(rank);
  if (rankInt == null) return null;  // skip header rows
  return {
    rank: rankInt,
    playerName: String(playerName || '').trim(),
    country: String(country || '').trim() || null,
    age: toInt(age),
    points: toInt(points)
  };
}

async function run() {
  let chromium;
  try {
    ({ chromium } = require('playwright'));
  } catch (e) {
    return {
      sourceId: 'ppa-rankings',
      ok: false,
      error: 'playwright-not-installed',
      note: 'Run `npm install` + `npx playwright install chromium` to enable this scraper.'
    };
  }

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (compatible; PickleballDailyBot/1.0; +https://github.com/jjmgladden/pickleball-daily)'
  });
  const page = await ctx.newPage();

  try {
    // 'networkidle' hangs on PPA's analytics pings (verified 2026-04-25 KB-0031). Use
    // domcontentloaded + an explicit wait for a populated row instead.
    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: TIMEOUT_MS });
    try { await page.waitForSelector('table tbody tr td', { timeout: 15_000 }); } catch {}
    // Brief settle so any post-paint hydration completes before snapshotting.
    await page.waitForTimeout(2000);

    // Extract via generic table parse — resilient across layout tweaks.
    const rows = await page.evaluate(() => {
      const out = [];
      const tables = Array.from(document.querySelectorAll('table'));
      for (const t of tables) {
        const trs = Array.from(t.querySelectorAll('tr'));
        for (const tr of trs) {
          const tds = Array.from(tr.querySelectorAll('td')).map(td => td.textContent.trim());
          if (tds.length >= 2) out.push(tds);
        }
      }
      return out;
    });

    // Observed column order (Phase 1 live inspection): rank · name · bracket · events · points.
    const rankings = rows
      .map(r => mapRow(r))
      .filter(x => x && x.playerName);

    // Resolve + cache PPA profile slugs for the top-20 rows (names already seen
    // are skipped; only new entrants pay the HEAD cost).
    const top20Names = rankings.slice(0, 20).map(r => r.playerName).filter(Boolean);
    const slugCache = await enrichSlugCache(top20Names);

    const result = {
      sourceId: 'ppa-rankings',
      ok: rankings.length > 0,
      retrievedAt: new Date().toISOString(),
      url: URL,
      rowsFound: rows.length,
      rankings,
      slugCache: slugCache.mapping,
      note: 'Columns: rank · playerName · country · age · points. Country may be empty when rendered as flag image. Ties share rank and skip the next ordinal (1224 convention). Top-20 names linked to ppatour.com/athlete/ profiles when the slug HEADs 200.'
    };
    writeCache('ppa-rankings', result);
    return result;
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  run().then(r => console.log(JSON.stringify(r, null, 2))).catch(e => { console.error(e); process.exit(1); });
}
module.exports = { run };
