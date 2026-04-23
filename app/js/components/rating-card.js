// rating-card.js — DUPR rating widget (NUMERIC chip). Distinct from ranking-card (KB-0009).

import { escapeHtml } from './confidence-badge.js';

export function ratingChipHtml(rating) {
  if (rating == null || isNaN(rating)) return '<span class="chip-rating">—</span>';
  return '<span class="chip-rating">' + Number(rating).toFixed(3).replace(/0+$/, '').replace(/\.$/, '') + '</span>';
}

export function renderRatingRow(player) {
  const name = escapeHtml(player.displayName || player.name || player.playerId || '—');
  const rating = ratingChipHtml(player.rating);
  const country = player.country ? ' <span class="meta">' + escapeHtml(player.country) + '</span>' : '';
  return '<div class="card"><strong>' + name + '</strong> ' + rating + country + '</div>';
}
