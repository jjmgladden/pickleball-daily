// ppa-api.js — scrape helpers for ppatour.com static HTML.
// For JS-hydrated rankings, use fetch-ppa-rankings.js (Playwright) — NOT this file.
// Respects Crawl-delay: 3 via sleep between requests.

const BASE = 'https://www.ppatour.com';
const UA = 'Mozilla/5.0 (compatible; PickleballDailyBot/1.0; +https://github.com/jjmgladden/pickleball-daily)';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchHtml(pathname) {
  const url = BASE + pathname;
  const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept': 'text/html,application/xhtml+xml' } });
  const status = res.status;
  const body = await res.text();
  return { url, status, body };
}

// Seed-driven event check — confirms URLs in tournaments-2026.json still respond.
// Returns {eventId, url, status, reachable}. NON-paginated one-shot.
async function probeEventUrl(eventId, url) {
  try {
    const res = await fetch(url, { method: 'HEAD', headers: { 'User-Agent': UA } });
    return { eventId, url, status: res.status, reachable: res.ok };
  } catch (e) {
    return { eventId, url, status: 0, reachable: false, error: e.message };
  }
}

module.exports = { fetchHtml, probeEventUrl, sleep, UA };
