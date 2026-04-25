// fetch-news.js — RSS-based news ingestion from T2 newsletter sources.
// MVP sources: The Dink + Pickleball Union (both T2). Reads from
// data/master/media-sources.json so source metadata stays in one place.
//
// Output shape (snapshot.sources.news):
//   {
//     sourceId: 'news', ok, retrievedAt,
//     sources: [{ sourceId, ok, count, error? }],
//     items: [{ id, title, url, summary, author, categories, imageUrl,
//               publishedAt, sourceId, sourceName, tier, feedUrl }],
//     errors: [{ sourceId, message }]
//   }
//
// Items are sorted newest-first, deduped by url + normalized title, capped at 30.

const fs = require('fs');
const path = require('path');
const { fetchFeed } = require('./lib/rss-parser');

const ROOT = path.resolve(__dirname, '..');
const MEDIA_SOURCES = path.join(ROOT, 'data', 'master', 'media-sources.json');

// MVP source set — newsletter ids from media-sources.json plus their RSS feed URLs.
// Probe results 2026-04-24:
//   The Dink (Ghost):           https://www.thedinkpickleball.com/rss/   200 application/rss+xml
//   Pickleball Union (WP):      https://pickleballunion.com/feed/        200 application/rss+xml
const FEED_BINDINGS = [
  { newsletterId: 'newsletter-the-dink',          feedUrl: 'https://www.thedinkpickleball.com/rss/' },
  { newsletterId: 'newsletter-pickleball-union',  feedUrl: 'https://pickleballunion.com/feed/' }
];

const MAX_ITEMS = 30;
const MAX_PER_SOURCE = 20;

function normalizeTitle(t) {
  return String(t || '').toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 80);
}

function loadSourceMeta() {
  if (!fs.existsSync(MEDIA_SOURCES)) return {};
  try {
    const j = JSON.parse(fs.readFileSync(MEDIA_SOURCES, 'utf8'));
    const map = {};
    for (const n of (j.newsletters || [])) map[n.id] = n;
    return map;
  } catch { return {}; }
}

async function run() {
  const sourceMeta = loadSourceMeta();
  const errors = [];
  const perSource = [];
  let allItems = [];

  for (const binding of FEED_BINDINGS) {
    const meta = sourceMeta[binding.newsletterId];
    const tier = meta && meta.tier ? meta.tier : 'T2';
    const sourceName = meta && meta.displayName ? meta.displayName : binding.newsletterId;
    try {
      const items = await fetchFeed({
        sourceId: binding.newsletterId,
        sourceName,
        tier,
        feedUrl: binding.feedUrl
      });
      const capped = items.slice(0, MAX_PER_SOURCE);
      perSource.push({ sourceId: binding.newsletterId, sourceName, tier, ok: true, count: capped.length });
      allItems = allItems.concat(capped);
    } catch (e) {
      errors.push({ sourceId: binding.newsletterId, message: e.message });
      perSource.push({ sourceId: binding.newsletterId, sourceName, tier, ok: false, error: e.message });
    }
  }

  // Dedupe — primary by URL, secondary by normalized title (cross-source repeats).
  const seenUrl = new Set();
  const seenTitle = new Set();
  const deduped = [];
  for (const it of allItems) {
    const u = (it.url || '').toLowerCase();
    const t = normalizeTitle(it.title);
    if (u && seenUrl.has(u)) continue;
    if (t && seenTitle.has(t)) continue;
    if (u) seenUrl.add(u);
    if (t) seenTitle.add(t);
    deduped.push(it);
  }

  // Sort newest-first; items missing publishedAt drop to the back.
  deduped.sort((a, b) => {
    const aT = a.publishedAt || '';
    const bT = b.publishedAt || '';
    if (!aT && !bT) return 0;
    if (!aT) return 1;
    if (!bT) return -1;
    return bT.localeCompare(aT);
  });

  const items = deduped.slice(0, MAX_ITEMS);

  const ok = perSource.some(s => s.ok && s.count > 0);
  return {
    sourceId: 'news',
    ok,
    retrievedAt: new Date().toISOString(),
    sources: perSource,
    items,
    errors
  };
}

if (require.main === module) {
  run().then(r => console.log(JSON.stringify(r, null, 2))).catch(e => { console.error(e); process.exit(1); });
}

module.exports = { run };
