// rankings.js — PPA Tour rankings (52-week). ORDINAL chips (KB-0009).
// Data source: Playwright scrape at ingestion/fetch-ppa-rankings.js → logs/cache/ppa-rankings-latest.json.
// Top-20 profile links resolved at ingestion time into logs/cache/ppa-player-slugs.json; bundled
// into snapshot.sources.ppaRankings.slugCache so the browser stays JSON-only.

import { escapeHtml } from '../components/confidence-badge.js';
import { rankChipHtml } from '../components/ranking-card.js';
import { ratingsVsRankingsExplainer } from '../components/explainer.js';
import { friendlyErrorMessage } from '../components/error-messages.js';

function rankingCard(r, slugCache, rowIndex) {
  const stats = [];
  if (r.points != null) stats.push('<span class="meta"><strong>' + Number(r.points).toLocaleString() + '</strong> pts</span>');
  if (r.eventsPlayed != null) stats.push('<span class="meta">' + r.eventsPlayed + ' events</span>');
  if (r.bracket) stats.push('<span class="meta">' + escapeHtml(r.bracket) + '</span>');
  const name = r.playerName || '—';
  const linkUrl = rowIndex < 20 ? (slugCache && slugCache[name]) : null;
  const nameNode = linkUrl
    ? '<a href="' + escapeHtml(linkUrl) + '" target="_blank" rel="noopener">' + escapeHtml(name) + '</a>'
    : escapeHtml(name);
  return '<div class="card">' +
    rankChipHtml(r.rank) + ' <strong>' + nameNode + '</strong>' +
    (stats.length ? '<div class="stats-row">' + stats.join(' · ') + '</div>' : '') +
  '</div>';
}

export function renderRankings(root, snapshot) {
  const ppa = (snapshot && snapshot.sources && snapshot.sources.ppaRankings) || {};

  const header = '<h2 class="section-title">PPA Tour Ranking (52-Week)</h2>' + ratingsVsRankingsExplainer('rankings');

  if (!ppa.ok) {
    const friendly = friendlyErrorMessage(ppa.error, { source: 'PPA Tour' })
      || 'Rankings are briefly unavailable — check back later today.';
    root.innerHTML = header + '<div class="soft-banner">' + escapeHtml(friendly) + '</div>';
    return;
  }

  const rankings = ppa.rankings || [];
  if (!rankings.length) {
    root.innerHTML = header + '<div class="empty">No rows parsed from page.</div>';
    return;
  }

  const retrieved = ppa.retrievedAt ? new Date(ppa.retrievedAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—';
  const slugCache = ppa.slugCache || {};
  root.innerHTML = header +
    '<div class="muted">Source: ppatour.com/player-rankings/ · scraped ' + escapeHtml(retrieved) + ' · ' + rankings.length + ' players.</div>' +
    rankings.map((r, i) => rankingCard(r, slugCache, i)).join('');
}
