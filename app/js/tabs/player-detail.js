// player-detail.js — Player Detail Page (in-tab swap from Players list).
// Lifts the KB-0052 γ deferral after Phase C5 ranking-history rollup landed in S12 (KB-0055).
//
// Renders: header block (name + meta + profile links), Rankings block (current rank + delta +
// best/worst + sparkline), Ratings block (DUPR doubles/singles), and a larger Trend block.
// State is ephemeral — owner returns to the list with the back button; no URL hash.

import { escapeHtml, confidenceBadgeHtml } from '../components/confidence-badge.js';
import { sparklineSvg, seriesFrom } from '../components/sparkline.js';

function chipRating(label, val) {
  if (val == null) return '';
  return (
    '<div class="pd-chip-block">' +
      '<div class="pd-chip-label">' + escapeHtml(label) + '</div>' +
      '<span class="chip-rating">' + escapeHtml(String(val)) + '</span>' +
    '</div>'
  );
}

function rankCurrentChip(player) {
  if (player.ppaRankFlag) return '<span class="chip-rank">' + escapeHtml(String(player.ppaRankFlag)) + '</span>';
  if (player.ppaRank != null) return '<span class="chip-rank">#' + escapeHtml(String(player.ppaRank)) + '</span>';
  return '<span class="muted">—</span>';
}

function rankSummaryHtml(history) {
  if (!Array.isArray(history) || history.length === 0) return '';
  const ranked = history.filter(h => typeof h.ppaRank === 'number');
  if (!ranked.length) return '';
  const first = ranked[0];
  const last = ranked[ranked.length - 1];
  const ranks = ranked.map(h => h.ppaRank);
  const best = Math.min.apply(null, ranks);
  const worst = Math.max.apply(null, ranks);
  const delta = last.ppaRank - first.ppaRank;
  const arrow = delta < 0 ? '▲' : (delta > 0 ? '▼' : '·');
  const cls = delta < 0 ? 'trend-up' : (delta > 0 ? 'trend-down' : 'trend-flat');
  const summary = (delta === 0) ? 'flat' : (delta < 0 ? '+' + (-delta) : '−' + delta);

  return (
    '<div class="pd-rank-summary">' +
      '<span class="' + cls + '">' + arrow + ' ' + summary + '</span> ' +
      '<span class="trend-meta">over ' + ranked.length + ' snapshots · ' +
        'best #' + best + (best !== worst ? ' · worst #' + worst : '') +
      '</span>' +
    '</div>'
  );
}

function profileLinksHtml(p) {
  const links = [];
  if (p.ppaPlayerUrl) links.push('<a class="profile-link" href="' + escapeHtml(p.ppaPlayerUrl) + '" target="_blank" rel="noopener">PPA profile ↗</a>');
  if (p.wikipediaUrl) links.push('<a class="profile-link" href="' + escapeHtml(p.wikipediaUrl) + '" target="_blank" rel="noopener">Wikipedia ↗</a>');
  if (p.mlpProfileUrl && !p.ppaPlayerUrl) links.push('<a class="profile-link" href="' + escapeHtml(p.mlpProfileUrl) + '" target="_blank" rel="noopener">MLP profile ↗</a>');
  return links.join(' · ');
}

function sourceChips(p) {
  const out = [];
  if (p.fromSeed) out.push('<span class="src-chip src-seed" title="In curated seed list">SEED</span>');
  const srcs = p.sources || [];
  if (srcs.includes('mlp')) out.push('<span class="src-chip src-mlp" title="MLP rostered player">MLP</span>');
  if (srcs.includes('ppa')) {
    const rank = (p.ppaRank != null) ? ' #' + p.ppaRank : '';
    out.push('<span class="src-chip src-ppa" title="PPA Tour ranked player">PPA' + rank + '</span>');
  }
  return out.join('');
}

function metaLine(p) {
  const parts = [];
  if (p.country) parts.push(escapeHtml(p.country));
  if (p.mlpTeam || p.mlpTeam2026) parts.push('MLP: ' + escapeHtml(String(p.mlpTeam || p.mlpTeam2026)));
  if (p.age != null) parts.push('age ' + escapeHtml(String(p.age)));
  if (p.handedness) parts.push(escapeHtml(p.handedness));
  if (p.ppaPoints != null) parts.push(Number(p.ppaPoints).toLocaleString() + ' pts');
  return parts.length ? parts.join(' · ') : '';
}

// Build the path-string ("#33 → #33 → #34 …") for the trend block. Compact label of recent moves.
function rankPathHtml(history) {
  const ranked = (history || []).filter(h => typeof h.ppaRank === 'number');
  if (!ranked.length) return '';
  const path = ranked.map(h => '#' + h.ppaRank).join(' → ');
  return '<div class="pd-rank-path" title="' + escapeHtml(path) + '">' + escapeHtml(path) + '</div>';
}

// Public renderer. `history` is the player's entry from ranking-history.json (or undefined).
export function renderPlayerDetailHtml(player, history) {
  if (!player) return '<div class="empty">Player not found.</div>';

  const headerName = escapeHtml(player.displayName) + (player.confidence ? confidenceBadgeHtml(player.confidence) : '');
  const sources = sourceChips(player);
  const meta = metaLine(player);
  const profiles = profileLinksHtml(player);
  const knownFor = player.knownFor ? '<div class="pd-known-for">' + escapeHtml(player.knownFor) + '</div>' : '';

  const rankSeries = seriesFrom(history, 'ppaRank');
  const sparkRank = rankSeries.length >= 2
    ? sparklineSvg(rankSeries, { type: 'rank', width: 320, height: 60, strokeColor: '#ffd28c' })
    : '';
  const rankSummary = rankSummaryHtml(history);
  const rankPath = rankPathHtml(history);

  const rankingsBlock =
    '<section class="pd-section">' +
      '<h3 class="pd-section-title">PPA Ranking</h3>' +
      '<div class="pd-rank-current">' + rankCurrentChip(player) + '</div>' +
      (rankSummary || '<div class="muted pd-no-trend">— no rank trend yet —</div>') +
    '</section>';

  const ratingsBlock =
    '<section class="pd-section">' +
      '<h3 class="pd-section-title">DUPR Ratings</h3>' +
      '<div class="pd-rating-row">' +
        chipRating('Doubles', player.duprDoubles) +
        chipRating('Singles', player.duprSingles) +
        ((player.duprDoubles == null && player.duprSingles == null)
          ? '<div class="muted">— no DUPR data —</div>'
          : '') +
      '</div>' +
    '</section>';

  const trendBlock = sparkRank
    ? '<section class="pd-section pd-trend-section">' +
        '<h3 class="pd-section-title">Rank Trend</h3>' +
        '<div class="pd-spark-frame">' + sparkRank + '</div>' +
        rankPath +
      '</section>'
    : '';

  return (
    '<div class="pd-toolbar">' +
      '<button id="pd-back" class="cmp-back">← Back to all players</button>' +
    '</div>' +
    '<article class="pd-card">' +
      '<header class="pd-header">' +
        '<h2 class="pd-name">' + headerName + '</h2>' +
        (sources ? '<div class="pd-sources">' + sources + '</div>' : '') +
        (meta ? '<div class="pd-meta">' + meta + '</div>' : '') +
        knownFor +
        (profiles ? '<div class="pd-profiles profile-row">' + profiles + '</div>' : '') +
      '</header>' +
      rankingsBlock +
      ratingsBlock +
      trendBlock +
    '</article>'
  );
}
