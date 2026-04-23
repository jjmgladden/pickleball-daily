// fetch-ppa-events.js — tournament window builder.
// Reads data/master/tournaments-2026.json, filters to "relevant now" (upcoming 30d, in-progress, recently-finished 7d).
// Optionally probes a small sample of event URLs to flag broken links.
// Run: `npm run fetch:ppa-events`

const fs = require('fs');
const path = require('path');
const { loadEnv } = require('./lib/env');
const { probeEventUrl, sleep } = require('./lib/ppa-api');

loadEnv();

const ROOT = path.resolve(__dirname, '..');
const SEED = path.join(ROOT, 'data', 'master', 'tournaments-2026.json');

const UPCOMING_DAYS = 30;
const RECENT_DAYS = 7;

function classify(event, now) {
  const start = new Date(event.startDate || event.datesIso && event.datesIso.start || 0);
  const end   = new Date(event.endDate   || event.datesIso && event.datesIso.end   || start);
  const msDay = 86_400_000;
  if (isNaN(start)) return 'unknown';
  if (now >= start && now <= end) return 'in-progress';
  if (now < start && (start - now) <= UPCOMING_DAYS * msDay) return 'upcoming';
  if (now > end && (now - end) <= RECENT_DAYS * msDay) return 'recent';
  if (now < start) return 'future';
  return 'past';
}

async function run() {
  if (!fs.existsSync(SEED)) {
    return { sourceId: 'tournaments-2026', ok: false, error: 'seed-missing', path: SEED };
  }
  const seed = JSON.parse(fs.readFileSync(SEED, 'utf8'));
  const now = new Date();
  const events = (seed.ppaEvents || seed.events || []).concat(seed.mlpEvents || []);
  const classified = events.map(e => ({ ...e, _state: classify(e, now) }));

  const buckets = {
    inProgress: classified.filter(e => e._state === 'in-progress'),
    upcoming:   classified.filter(e => e._state === 'upcoming'),
    recent:     classified.filter(e => e._state === 'recent')
  };

  // Probe up to 3 upcoming URLs for liveness (cheap, respects crawl-delay)
  const toProbe = buckets.upcoming.slice(0, 3).filter(e => e.url);
  const probes = [];
  for (const e of toProbe) {
    const id = e.eventId || e.id || e.slug || e.displayName;
    probes.push(await probeEventUrl(id, e.url));
    await sleep(3100); // respect ppatour.com Crawl-delay: 3
  }

  return {
    sourceId: 'tournaments',
    ok: true,
    retrievedAt: now.toISOString(),
    counts: {
      inProgress: buckets.inProgress.length,
      upcoming: buckets.upcoming.length,
      recent: buckets.recent.length
    },
    buckets,
    probes
  };
}

if (require.main === module) {
  run().then(r => console.log(JSON.stringify(r, null, 2))).catch(e => { console.error(e); process.exit(1); });
}
module.exports = { run };
