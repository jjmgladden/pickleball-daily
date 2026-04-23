// dupr-api.js — public DUPR leaderboard scrape helpers.
// Partner API (per-player) is Phase 2. Top-50 public leaderboard only.
// dupr.com loads leaderboard dynamically — a pure fetch may return a shell. Graceful fallback.

const BASE = 'https://dupr.com';
const UA = 'Mozilla/5.0 (compatible; PickleballDailyBot/1.0; +https://github.com/jjmgladden/pickleball-daily)';

async function fetchHtml(pathname) {
  const url = BASE + pathname;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    const body = await res.text();
    return { ok: res.ok, url, status: res.status, body };
  } catch (e) {
    return { ok: false, url, status: 0, error: e.message };
  }
}

// Liveness only; real scrape of the leaderboard needs Playwright (Phase 2 upgrade).
async function probeLeaderboard() {
  const r = await fetchHtml('/leaderboard');
  return { reachable: r.ok, status: r.status, bytes: r.body ? r.body.length : 0 };
}

module.exports = { fetchHtml, probeLeaderboard, UA };
