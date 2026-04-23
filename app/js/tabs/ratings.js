// ratings.js — DUPR ratings leaderboard. NUMERIC chips (KB-0009).
// Visually + semantically distinct from Rankings — do not merge.

import { escapeHtml } from '../components/confidence-badge.js';
import { ratingChipHtml } from '../components/rating-card.js';
import { ratingsVsRankingsExplainer } from '../components/explainer.js';

export function renderRatings(root, snapshot) {
  const dupr = (snapshot && snapshot.sources && snapshot.sources.dupr) || {};
  const rows = dupr.top20 || [];

  const header =
    '<h2 class="section-title">DUPR Doubles Ratings — Top ' + rows.length + '</h2>' +
    ratingsVsRankingsExplainer('ratings') +
    (dupr.freshness === 'seed-only'
      ? '<div class="muted">Seed-sourced. Live scrape of dupr.com/leaderboard deferred to Phase 2 (hydrated page).</div>'
      : '');

  if (rows.length === 0) {
    root.innerHTML = header + '<div class="empty">No ratings data.</div>';
    return;
  }

  root.innerHTML = header +
    rows.map((p, i) =>
      '<div class="card">' +
        '<span class="meta" style="font-variant-numeric:tabular-nums;color:var(--text-dim);margin-right:8px">' + (i + 1) + '.</span>' +
        '<strong>' + escapeHtml(p.displayName || '—') + '</strong> ' +
        ratingChipHtml(p.rating) +
        (p.country ? ' <span class="meta">' + escapeHtml(p.country) + '</span>' : '') +
      '</div>'
    ).join('');
}
