// live-scoreboard.js — in-progress match card. Phase 1 stub (no live-scoring feed yet).
// Phase 1.5+ will wire PickleballBrackets live feed.

import { escapeHtml } from './confidence-badge.js';

export function renderLiveCard(match) {
  const a = escapeHtml(match.teamA || match.playerA || '—');
  const b = escapeHtml(match.teamB || match.playerB || '—');
  const sa = match.scoreA != null ? escapeHtml(String(match.scoreA)) : '—';
  const sb = match.scoreB != null ? escapeHtml(String(match.scoreB)) : '—';
  const venue = match.venue ? ' · ' + escapeHtml(match.venue) : '';
  return '<div class="card">' +
    '<h3>' + a + ' vs ' + b + '</h3>' +
    '<div class="stats-row"><span><strong>' + sa + '</strong> — <strong>' + sb + '</strong></span>' +
    '<span class="meta">' + escapeHtml(match.state || 'in progress') + venue + '</span></div>' +
  '</div>';
}
