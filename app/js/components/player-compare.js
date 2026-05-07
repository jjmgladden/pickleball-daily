// player-compare.js — side-by-side comparison of two players.
// Inline-toggle UX: Compare checkbox on each player card; when exactly 2 are
// selected, a sticky CTA opens the comparison view. State is ephemeral (per
// Session 11 Decision 2e — no localStorage, no URL hash).
//
// Recent results row is currently a placeholder — no per-player results data
// exists in the snapshot today (tournaments carry event metadata only).
// When a per-player results ingestion lands, populate via cross-reference.

import { escapeHtml, confidenceBadgeHtml } from './confidence-badge.js';
import { sparklineSvg, seriesFrom } from './sparkline.js';

const MAX_SELECTED = 2;
const selected = new Set();
const subscribers = new Set();

export function getSelected() {
  return [...selected];
}

export function isSelected(playerId) {
  return selected.has(playerId);
}

// Returns true if successfully toggled, false if attempted to add a 3rd.
export function toggleSelected(playerId) {
  if (selected.has(playerId)) {
    selected.delete(playerId);
    notify();
    return true;
  }
  if (selected.size >= MAX_SELECTED) return false;
  selected.add(playerId);
  notify();
  return true;
}

export function clearSelected() {
  selected.clear();
  notify();
}

export function subscribe(fn) {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

function notify() {
  for (const fn of subscribers) {
    try { fn(); } catch (e) { /* subscriber errors must not break the flow */ }
  }
}

// ---------- comparison view rendering ----------

function fieldRow(label, leftHtml, rightHtml) {
  return (
    '<div class="cmp-row">' +
      '<div class="cmp-label">' + escapeHtml(label) + '</div>' +
      '<div class="cmp-cell">' + (leftHtml || '<span class="muted">—</span>') + '</div>' +
      '<div class="cmp-cell">' + (rightHtml || '<span class="muted">—</span>') + '</div>' +
    '</div>'
  );
}

function fieldText(label, leftVal, rightVal) {
  const l = (leftVal == null || leftVal === '') ? '' : escapeHtml(String(leftVal));
  const r = (rightVal == null || rightVal === '') ? '' : escapeHtml(String(rightVal));
  return fieldRow(label, l, r);
}

function ratingChip(val) {
  return (val == null) ? '' : '<span class="chip-rating">' + escapeHtml(String(val)) + '</span>';
}

function rankChip(p) {
  if (p.ppaRankFlag) return '<span class="chip-rank">' + escapeHtml(String(p.ppaRankFlag)) + '</span>';
  if (p.ppaRank != null) return '<span class="chip-rank">#' + escapeHtml(String(p.ppaRank)) + '</span>';
  return '';
}

function rankTrendHtml(entries) {
  if (!entries || !entries.length) return '';
  const ranked = entries.filter(e => typeof e.ppaRank === 'number');
  if (!ranked.length) {
    const dupred = entries.filter(e => typeof e.duprDoubles === 'number');
    if (!dupred.length) return '';
    const first = dupred[0].duprDoubles;
    const last = dupred[dupred.length - 1].duprDoubles;
    const delta = +(last - first).toFixed(3);
    const arrow = delta > 0 ? '▲' : (delta < 0 ? '▼' : '·');
    const cls = delta > 0 ? 'trend-up' : (delta < 0 ? 'trend-down' : 'trend-flat');
    return (
      '<div class="trend">' +
        '<span class="trend-label">DUPR</span> ' +
        '<span class="trend-current">' + escapeHtml(String(last)) + '</span> ' +
        '<span class="' + cls + '">' + arrow + (delta === 0 ? ' flat' : ' ' + (delta > 0 ? '+' : '') + delta) + '</span> ' +
        '<span class="trend-meta">over ' + dupred.length + 'd</span>' +
      '</div>'
    );
  }
  const first = ranked[0].ppaRank;
  const last = ranked[ranked.length - 1].ppaRank;
  const best = Math.min.apply(null, ranked.map(e => e.ppaRank));
  const worst = Math.max.apply(null, ranked.map(e => e.ppaRank));
  const delta = last - first;
  const arrow = delta < 0 ? '▲' : (delta > 0 ? '▼' : '·');
  const cls = delta < 0 ? 'trend-up' : (delta > 0 ? 'trend-down' : 'trend-flat');
  const path = ranked.map(e => '#' + e.ppaRank).join(' → ');
  const summary = (delta === 0)
    ? 'flat'
    : (delta < 0 ? '+' + (-delta) : '−' + delta);
  const series = seriesFrom(ranked, 'ppaRank');
  const spark = (series.length >= 2)
    ? sparklineSvg(series, { type: 'rank', width: 180, height: 32, strokeColor: '#ffd28c' })
    : '';
  return (
    '<div class="trend">' +
      '<span class="trend-current">#' + escapeHtml(String(last)) + '</span> ' +
      '<span class="' + cls + '">' + arrow + ' ' + summary + '</span> ' +
      '<span class="trend-meta">best #' + best + (best !== worst ? ' · worst #' + worst : '') + ' over ' + ranked.length + 'd</span>' +
      (spark ? '<div class="trend-spark">' + spark + '</div>' : '') +
      '<div class="trend-path" title="' + escapeHtml(path) + '">' + escapeHtml(path) + '</div>' +
    '</div>'
  );
}

function profileLinksHtml(p) {
  const links = [];
  if (p.ppaPlayerUrl) links.push('<a class="profile-link" href="' + escapeHtml(p.ppaPlayerUrl) + '" target="_blank" rel="noopener">PPA ↗</a>');
  if (p.wikipediaUrl) links.push('<a class="profile-link" href="' + escapeHtml(p.wikipediaUrl) + '" target="_blank" rel="noopener">Wikipedia ↗</a>');
  if (p.mlpProfileUrl && !p.ppaPlayerUrl) links.push('<a class="profile-link" href="' + escapeHtml(p.mlpProfileUrl) + '" target="_blank" rel="noopener">MLP ↗</a>');
  return links.join(' · ');
}

function playerHeaderCell(p) {
  return (
    '<div class="cmp-header-cell">' +
      '<div class="cmp-player-name">' + escapeHtml(p.displayName) + (p.confidence ? confidenceBadgeHtml(p.confidence) : '') + '</div>' +
    '</div>'
  );
}

export function renderComparisonHtml(playerA, playerB, opts) {
  if (!playerA || !playerB) {
    return '<div class="empty">Comparison requires two players.</div>';
  }
  const history = (opts && opts.history) || {};
  const aHist = history[playerA.playerId];
  const bHist = history[playerB.playerId];
  const trendA = rankTrendHtml(aHist) || '<span class="muted">— no trend data yet —</span>';
  const trendB = rankTrendHtml(bHist) || '<span class="muted">— no trend data yet —</span>';

  const headerRow =
    '<div class="cmp-row cmp-row-header">' +
      '<div class="cmp-label"></div>' +
      playerHeaderCell(playerA) +
      playerHeaderCell(playerB) +
    '</div>';

  const rows = [
    fieldRow('PPA Rank', rankChip(playerA), rankChip(playerB)),
    fieldRow('Rank Trend', trendA, trendB),
    fieldRow('DUPR Doubles', ratingChip(playerA.duprDoubles), ratingChip(playerB.duprDoubles)),
    fieldRow('DUPR Singles', ratingChip(playerA.duprSingles), ratingChip(playerB.duprSingles)),
    fieldText('Country', playerA.country, playerB.country),
    fieldText('MLP Team (2026)', playerA.mlpTeam || playerA.mlpTeam2026, playerB.mlpTeam || playerB.mlpTeam2026),
    fieldText('Handedness', playerA.handedness, playerB.handedness),
    fieldText('Age', playerA.age, playerB.age),
    fieldText('PPA Points', playerA.ppaPoints != null ? Number(playerA.ppaPoints).toLocaleString() : '', playerB.ppaPoints != null ? Number(playerB.ppaPoints).toLocaleString() : ''),
    fieldText('Known For', playerA.knownFor, playerB.knownFor),
    fieldRow('Profiles', profileLinksHtml(playerA), profileLinksHtml(playerB)),
  ].join('');

  return (
    '<div class="cmp-table">' +
      headerRow +
      rows +
    '</div>'
  );
}
