// ranking-card.js — PPA ranking widget (ORDINAL chip). Distinct from rating-card (KB-0009).

import { escapeHtml } from './confidence-badge.js';

export function rankChipHtml(position) {
  if (position == null) return '<span class="chip-rank">—</span>';
  return '<span class="chip-rank">' + escapeHtml(String(position)) + '</span>';
}

export function renderRankingRow({ position, displayName, points, country }) {
  return '<div class="card">' +
    rankChipHtml(position) + ' <strong>' + escapeHtml(displayName || '—') + '</strong>' +
    (country ? ' <span class="meta">' + escapeHtml(country) + '</span>' : '') +
    (points != null ? ' <span class="meta">· ' + escapeHtml(String(points)) + ' pts</span>' : '') +
    '</div>';
}
