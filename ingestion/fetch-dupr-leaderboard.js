// fetch-dupr-leaderboard.js — DUPR top-N public leaderboard.
// Phase 1: seeds from players-seed.json (duprRating field). Live scrape of dupr.com/leaderboard
// is Phase 2 (needs Playwright — page is hydrated).

const fs = require('fs');
const path = require('path');
const { loadEnv } = require('./lib/env');
const { probeLeaderboard } = require('./lib/dupr-api');

loadEnv();

const SEED = path.resolve(__dirname, '..', 'data', 'master', 'players-seed.json');

async function run() {
  if (!fs.existsSync(SEED)) {
    return { sourceId: 'dupr', ok: false, error: 'seed-missing' };
  }
  const seed = JSON.parse(fs.readFileSync(SEED, 'utf8'));
  const ratingOf = p => {
    if (p.duprDoubles != null) return Number(p.duprDoubles);
    if (p.duprRating && typeof p.duprRating === 'object') return Number(p.duprRating.doubles || p.duprRating.value || 0) || null;
    if (typeof p.duprRating === 'number') return p.duprRating;
    return null;
  };
  const players = (seed.players || []).filter(p => ratingOf(p) != null);

  const byDoublesDesc = [...players].sort((a, b) => (ratingOf(b) || 0) - (ratingOf(a) || 0));

  const top20 = byDoublesDesc.slice(0, 20).map(p => ({
    playerId: p.playerId || p.id,
    displayName: p.displayName || p.name,
    rating: ratingOf(p),
    categories: p.primaryCategories || null,
    country: p.country || null
  }));

  const probe = await probeLeaderboard();

  return {
    sourceId: 'dupr',
    ok: true,
    retrievedAt: new Date().toISOString(),
    freshness: 'seed-only',
    note: 'Phase 1 uses seed ratings; Playwright-scrape of public leaderboard deferred to Phase 2.',
    top20,
    probe
  };
}

if (require.main === module) {
  run().then(r => console.log(JSON.stringify(r, null, 2))).catch(e => { console.error(e); process.exit(1); });
}
module.exports = { run };
