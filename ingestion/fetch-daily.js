// fetch-daily.js — orchestrator.
// Runs all fetchers and writes data/snapshots/YYYY-MM-DD.json + data/snapshots/latest.json.
// Every fetcher returns {ok, ...} — orchestrator never hard-fails if a single source fails.

const fs = require('fs');
const path = require('path');
const { loadEnv } = require('./lib/env');
const { writeCache } = require('./lib/cache');

loadEnv();

const ROOT = path.resolve(__dirname, '..');
const SNAP_DIR = path.join(ROOT, 'data', 'snapshots');

const tournaments = require('./fetch-ppa-events');
const mlp         = require('./fetch-mlp');
const dupr        = require('./fetch-dupr-leaderboard');
const highlights  = require('./fetch-highlights');
const news        = require('./fetch-news');
const { buildPlayersIndex } = require('./lib/players-index');

const SEED_PLAYERS = path.join(ROOT, 'data', 'master', 'players-seed.json');

async function runAll() {
  const started = new Date();
  const sources = {};
  const errors = [];

  for (const [name, mod] of [
    ['tournaments', tournaments],
    ['mlp',         mlp],
    ['dupr',        dupr],
    ['highlights',  highlights],
    ['news',        news]
  ]) {
    try {
      console.log('[fetch-daily] running ' + name + '...');
      const result = await mod.run();
      sources[name] = result;
      try { writeCache(name, result); } catch {}
      console.log('[fetch-daily]   ' + name + ' → ok=' + result.ok);
    } catch (e) {
      errors.push({ source: name, message: e.message });
      sources[name] = { sourceId: name, ok: false, error: e.message };
      console.error('[fetch-daily]   ' + name + ' → FAILED: ' + e.message);
    }
  }

  // PPA rankings (Playwright) runs on a separate schedule — include last-cached if present
  const lastRankings = path.join(ROOT, 'logs', 'cache', 'ppa-rankings-latest.json');
  if (fs.existsSync(lastRankings)) {
    try { sources.ppaRankings = JSON.parse(fs.readFileSync(lastRankings, 'utf8')); } catch {}
  } else {
    sources.ppaRankings = { sourceId: 'ppa-rankings', ok: false, error: 'not-yet-scraped', note: 'Run `npm run fetch:ppa-rankings` after `npx playwright install chromium`.' };
  }

  // KB-0004: derived universal players index (seed + MLP rosters + PPA top-200).
  try {
    const seed = fs.existsSync(SEED_PLAYERS) ? JSON.parse(fs.readFileSync(SEED_PLAYERS, 'utf8')) : null;
    const mlpTeams = (sources.mlp && sources.mlp.teams) || [];
    sources.playersIndex = buildPlayersIndex({ seed, mlpTeams, ppaRankings: sources.ppaRankings });
    console.log('[fetch-daily]   playersIndex → ' + sources.playersIndex.totalPlayers + ' players (seed=' + sources.playersIndex.sourceCounts.seed + ', mlp=' + sources.playersIndex.sourceCounts.mlp + ', ppa=' + sources.playersIndex.sourceCounts.ppa + ')');
  } catch (e) {
    sources.playersIndex = { sourceId: 'players-index', ok: false, error: e.message };
    errors.push({ source: 'playersIndex', message: e.message });
    console.error('[fetch-daily]   playersIndex → FAILED: ' + e.message);
  }

  const finished = new Date();

  const snapshot = {
    schemaVersion: 1,
    generatedAt: finished.toISOString(),
    startedAt: started.toISOString(),
    durationMs: finished - started,
    version: 'v1',
    brand: "Ozark Joe's Pickleball Daily Intelligence Report",
    errors,
    sources
  };

  fs.mkdirSync(SNAP_DIR, { recursive: true });
  const dateStr = finished.toISOString().slice(0, 10);
  const dated = path.join(SNAP_DIR, dateStr + '.json');
  const latest = path.join(SNAP_DIR, 'latest.json');
  const body = JSON.stringify(snapshot, null, 2);
  fs.writeFileSync(dated, body);
  fs.writeFileSync(latest, body);

  console.log('[fetch-daily] wrote ' + dated);
  console.log('[fetch-daily] wrote ' + latest);
  console.log('[fetch-daily] duration ' + snapshot.durationMs + 'ms, ' + errors.length + ' errors');

  return { snapshotPath: latest, snapshot };
}

if (require.main === module) {
  runAll().catch(e => { console.error(e); process.exit(1); });
}
module.exports = { runAll };
