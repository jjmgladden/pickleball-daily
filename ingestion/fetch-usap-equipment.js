// fetch-usap-equipment.js — Playwright scrape of equipment.usapickleball.org.
//
// USAP publishes the approved-paddle list (~5,114 entries) and approved-ball list
// (~368 entries) as server-rendered HTML pages with no API. This script:
//   1. Paginates the paddle index (205 pages × 25/page) → brand/model/addedDate/imageUrl/detailUrl
//   2. Visits each paddle detail page → shape/coreMaterial/faceMaterial/finish/depth
//   3. Paginates the ball index → brand/model/ballType/listDate
//   4. Writes data/master/paddles.json + data/master/balls.json
//
// Polite delays:
//   - 1.5s between paddle index pages
//   - 1.0s between paddle detail-page fetches
//   - 1.5s between ball index pages
// Total runtime: ~5 min index + ~85 min details + ~25 sec balls ≈ ~90 min.
//
// Designed for the quarterly equipment-refresh.yml workflow, with --paddles-only,
// --balls-only, --limit N, and --skip-details flags for dev/test.
//
// Requires: `npm install` + `npx playwright install chromium`.

const fs = require('fs');
const path = require('path');

const PADDLE_LIST_URL = 'https://equipment.usapickleball.org/paddle-list/';
const BALL_LIST_URL = 'https://equipment.usapickleball.org/ball-list/';
const UA = 'Mozilla/5.0 (compatible; PickleballDailyBot/1.0; +https://github.com/jjmgladden/pickleball-daily)';
const PAGE_TIMEOUT_MS = 30_000;
const INDEX_DELAY_MS = 1_500;
const DETAIL_DELAY_MS = 1_000;
const MAX_INDEX_PAGES = 250;       // safety bound; paddle list is ~205 pages
const MAX_BALL_INDEX_PAGES = 30;   // safety bound; ball list is ~15 pages

const OUT_DIR = path.resolve(__dirname, '..', 'data', 'master');
const PADDLES_OUT = path.join(OUT_DIR, 'paddles.json');
const BALLS_OUT = path.join(OUT_DIR, 'balls.json');

function parseArgs(argv) {
  const args = { paddlesOnly: false, ballsOnly: false, skipDetails: false, limit: null };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--paddles-only') args.paddlesOnly = true;
    else if (a === '--balls-only') args.ballsOnly = true;
    else if (a === '--skip-details') args.skipDetails = true;
    else if (a === '--limit' && argv[i + 1]) { args.limit = parseInt(argv[++i], 10); }
  }
  return args;
}

function isoDateFromUS(s) {
  // USAP renders "MM/DD/YYYY" — convert to ISO-8601 date.
  if (!s) return null;
  const m = String(s).trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const [, mm, dd, yyyy] = m;
  return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
}

async function scrapePaddleIndexPage(page, pageNum) {
  // USAP's GravityView grid uses ?pagenum=N for pagination — NOT /page/N/.
  const url = pageNum === 1 ? PADDLE_LIST_URL : `${PADDLE_LIST_URL}?pagenum=${pageNum}`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: PAGE_TIMEOUT_MS });
  try { await page.waitForSelector('div.gv-grid-row', { timeout: 10_000 }); } catch {}

  return page.evaluate(() => {
    const out = [];
    const rows = document.querySelectorAll('div.gv-grid-row');
    rows.forEach(row => {
      const cols = row.querySelectorAll('.gv-grid-value');
      if (cols.length < 3) return;
      const brand = (cols[0]?.textContent || '').trim();
      const model = (cols[1]?.textContent || '').trim();
      const addedRaw = (cols[2]?.textContent || '').trim();
      const linkEl = row.querySelector('a[href*="/paddle-list/entry/"]');
      const detailUrl = linkEl ? linkEl.href.replace(/\/$/, '') : null;
      const imgEl = row.querySelector('img');
      // Prefer lazy-load real URL; fall back to src; reject base64 placeholders.
      let imageUrl = null;
      if (imgEl) {
        const candidates = [
          imgEl.getAttribute('data-src'),
          imgEl.getAttribute('data-lazy-src'),
          imgEl.getAttribute('data-original'),
          imgEl.src
        ].filter(Boolean);
        imageUrl = candidates.find(u => !u.startsWith('data:')) || null;
      }
      out.push({ brand, model, addedRaw, detailUrl, imageUrl });
    });
    return out;
  });
}

async function scrapePaddleDetail(page, detailUrl) {
  await page.goto(detailUrl, { waitUntil: 'domcontentloaded', timeout: PAGE_TIMEOUT_MS });
  try { await page.waitForSelector('main, .entry-content, body', { timeout: 8_000 }); } catch {}

  // Extract label/value pairs robustly — USAP uses a definition list / label-text pattern.
  return page.evaluate(() => {
    const result = {};
    const text = document.body ? document.body.innerText : '';
    const pull = (label) => {
      const re = new RegExp('(?:^|\\n)\\s*' + label + '\\s*[:\\-]?\\s*(.+)', 'i');
      const m = text.match(re);
      return m ? m[1].trim().split('\n')[0].trim() : null;
    };
    result.status = pull('Status');
    result.shape = pull('Shape');
    result.depth = pull('Depth');
    result.finish = pull('Finish');

    // "Material" appears twice (core, face). Capture both occurrences.
    const matRe = /Material\s*[:\-]?\s*(.+)/gi;
    const matches = [];
    let mm;
    while ((mm = matRe.exec(text)) && matches.length < 4) {
      matches.push(mm[1].trim().split('\n')[0].trim());
    }
    if (matches.length >= 1) result.coreMaterial = matches[0];
    if (matches.length >= 2) result.faceMaterial = matches[1];
    return result;
  });
}

async function scrapeAllPaddles(page, opts) {
  const all = [];
  const seenUrls = new Set();
  let pageNum = 1;
  while (pageNum <= MAX_INDEX_PAGES) {
    process.stdout.write(`[paddles] index page ${pageNum}… `);
    let rows;
    try {
      rows = await scrapePaddleIndexPage(page, pageNum);
    } catch (e) {
      console.log(`FAIL (${e.message})`);
      break;
    }
    if (!rows.length) { console.log('empty — done'); break; }
    // Stop if every detailUrl on this page was already seen (silent-loop defense:
    // some paginators return the last valid page when the request is past the end).
    const newRows = rows.filter(r => r.detailUrl && !seenUrls.has(r.detailUrl));
    if (!newRows.length) { console.log(`${rows.length} rows (all duplicates — end of list)`); break; }
    newRows.forEach(r => seenUrls.add(r.detailUrl));
    console.log(`${newRows.length} new rows (${rows.length - newRows.length} dup)`);
    all.push(...newRows);
    if (opts.limit && all.length >= opts.limit) break;
    pageNum++;
    await new Promise(r => setTimeout(r, INDEX_DELAY_MS));
  }

  const indexed = (opts.limit ? all.slice(0, opts.limit) : all).map(r => ({
    brand: r.brand,
    model: r.model,
    addedDate: isoDateFromUS(r.addedRaw),
    imageUrl: r.imageUrl || null,
    detailUrl: r.detailUrl || null
  }));

  if (opts.skipDetails) return indexed;

  // RESUMABILITY: if paddles.json already exists with detail-enriched entries,
  // merge them in by detailUrl so we skip work already done. A crash mid-run
  // therefore only loses the few entries between the last checkpoint and the crash.
  const cached = loadCachedPaddles();
  if (cached && cached.size) {
    let merged = 0;
    for (const p of indexed) {
      const prior = cached.get(p.detailUrl);
      if (prior && prior.shape) { Object.assign(p, prior); merged++; }
    }
    if (merged) console.log(`[paddles] resume: ${merged} entries already enriched from prior run; skipping their detail fetches`);
  }

  console.log(`[paddles] enriching ${indexed.length} entries with detail-page data…`);
  let okCount = 0;
  let failCount = 0;
  let alreadyDone = 0;
  for (let i = 0; i < indexed.length; i++) {
    const p = indexed[i];
    if (!p.detailUrl) continue;
    if (p.shape) { alreadyDone++; continue; }
    try {
      const detail = await scrapePaddleDetail(page, p.detailUrl);
      Object.assign(p, detail);
      okCount++;
    } catch (e) {
      failCount++;
    }
    if ((i + 1) % 100 === 0 || i === indexed.length - 1) {
      console.log(`[paddles] detail ${i + 1}/${indexed.length} (ok=${okCount}, fail=${failCount}, resumed=${alreadyDone})`);
    }
    // Checkpoint every 250 entries so a crash loses at most ~4 min of work.
    if ((i + 1) % 250 === 0) {
      writeCheckpoint(indexed);
      console.log(`[paddles] checkpoint written at ${i + 1}/${indexed.length}`);
    }
    await new Promise(r => setTimeout(r, DETAIL_DELAY_MS));
  }
  return indexed;
}

function loadCachedPaddles() {
  try {
    const raw = JSON.parse(fs.readFileSync(PADDLES_OUT, 'utf8'));
    const map = new Map();
    for (const p of (raw.paddles || [])) {
      if (p.detailUrl) map.set(p.detailUrl, p);
    }
    return map;
  } catch { return new Map(); }
}

function writeCheckpoint(paddles) {
  const out = {
    schemaVersion: 1,
    version: 'v1',
    generatedAt: new Date().toISOString(),
    source: { id: 'usap-equipment', url: PADDLE_LIST_URL, retrievedAt: new Date().toISOString() },
    totalCount: paddles.length,
    paddles
  };
  writeJsonFile(PADDLES_OUT, out);
}

async function scrapeBallIndexPage(page, pageNum) {
  // USAP's GravityView grid uses ?pagenum=N for pagination — NOT /page/N/.
  const url = pageNum === 1 ? BALL_LIST_URL : `${BALL_LIST_URL}?pagenum=${pageNum}`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: PAGE_TIMEOUT_MS });
  try { await page.waitForSelector('div.gv-grid-row', { timeout: 10_000 }); } catch {}

  return page.evaluate(() => {
    const out = [];
    const rows = document.querySelectorAll('div.gv-grid-row');
    const dateRe = /^\d{2}\/\d{2}\/\d{4}$/;
    rows.forEach(row => {
      const cols = row.querySelectorAll('.gv-grid-value');
      if (cols.length < 3) return;
      const brand = (cols[0]?.textContent || '').trim();
      const model = (cols[1]?.textContent || '').trim();
      let ballType = (cols[2]?.textContent || '').trim();
      let listedRaw = (cols[3]?.textContent || '').trim();
      // Older balls have only 3 columns (Brand · Model · Listed Date) — col[2] is the date.
      // Detect this and shift the value into listedRaw, leaving ballType blank.
      if (dateRe.test(ballType) && !listedRaw) {
        listedRaw = ballType;
        ballType = '';
      }
      out.push({ brand, model, ballType, listedRaw });
    });
    return out;
  });
}

async function scrapeAllBalls(page, opts) {
  const all = [];
  // Balls have no per-entry detail URL on the list page, so dedupe by composite key.
  const seenKeys = new Set();
  const keyFor = r => `${r.brand}|${r.model}|${r.ballType}|${r.listedRaw}`;
  let pageNum = 1;
  while (pageNum <= MAX_BALL_INDEX_PAGES) {
    process.stdout.write(`[balls] index page ${pageNum}… `);
    let rows;
    try {
      rows = await scrapeBallIndexPage(page, pageNum);
    } catch (e) {
      console.log(`FAIL (${e.message})`);
      break;
    }
    if (!rows.length) { console.log('empty — done'); break; }
    const newRows = rows.filter(r => !seenKeys.has(keyFor(r)));
    if (!newRows.length) { console.log(`${rows.length} rows (all duplicates — end of list)`); break; }
    newRows.forEach(r => seenKeys.add(keyFor(r)));
    console.log(`${newRows.length} new rows (${rows.length - newRows.length} dup)`);
    all.push(...newRows);
    if (opts.limit && all.length >= opts.limit) break;
    pageNum++;
    await new Promise(r => setTimeout(r, INDEX_DELAY_MS));
  }
  return (opts.limit ? all.slice(0, opts.limit) : all).map(r => ({
    brand: r.brand,
    model: r.model,
    ballType: r.ballType,
    listedDate: isoDateFromUS(r.listedRaw)
  }));
}

function writeJsonFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n');
}

async function run(opts) {
  let chromium;
  try {
    ({ chromium } = require('playwright'));
  } catch (e) {
    return { ok: false, error: 'playwright-not-installed', note: 'Run `npm install` + `npx playwright install chromium`.' };
  }

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ userAgent: UA });
  const page = await ctx.newPage();

  const result = { ok: true, retrievedAt: new Date().toISOString(), paddles: null, balls: null };

  try {
    if (!opts.ballsOnly) {
      const paddles = await scrapeAllPaddles(page, opts);
      const out = {
        schemaVersion: 1,
        version: 'v1',
        generatedAt: new Date().toISOString(),
        source: {
          id: 'usap-equipment',
          url: PADDLE_LIST_URL,
          retrievedAt: new Date().toISOString()
        },
        totalCount: paddles.length,
        paddles
      };
      writeJsonFile(PADDLES_OUT, out);
      result.paddles = { count: paddles.length, file: PADDLES_OUT };
      console.log(`[paddles] wrote ${paddles.length} entries to ${PADDLES_OUT}`);
    }

    if (!opts.paddlesOnly) {
      const balls = await scrapeAllBalls(page, opts);
      const out = {
        schemaVersion: 1,
        version: 'v1',
        generatedAt: new Date().toISOString(),
        source: {
          id: 'usap-equipment',
          url: BALL_LIST_URL,
          retrievedAt: new Date().toISOString()
        },
        totalCount: balls.length,
        balls
      };
      writeJsonFile(BALLS_OUT, out);
      result.balls = { count: balls.length, file: BALLS_OUT };
      console.log(`[balls] wrote ${balls.length} entries to ${BALLS_OUT}`);
    }
  } catch (e) {
    result.ok = false;
    result.error = e.message;
    console.error('FATAL:', e);
  } finally {
    await browser.close();
  }

  return result;
}

if (require.main === module) {
  const opts = parseArgs(process.argv);
  run(opts).then(r => {
    console.log('\n=== Summary ===');
    console.log(JSON.stringify(r, null, 2));
    process.exit(r.ok ? 0 : 1);
  }).catch(e => { console.error(e); process.exit(1); });
}

module.exports = { run };
