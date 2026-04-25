// stats.js — Combined Rankings + Ratings tab (Session 8 consolidation).
// Two-column layout on desktop, stacked on mobile.
// Preserves KB-0009 separation: explicit headers + distinct chip styles
// (chip-rank ordinal in left column, chip-rating numeric in right column).

import { renderRankings } from './rankings.js';
import { renderRatings } from './ratings.js';

export function renderStats(root, snapshot) {
  root.innerHTML =
    '<div class="stats-grid">' +
      '<div class="stats-col" id="stats-col-rankings"></div>' +
      '<div class="stats-col" id="stats-col-ratings"></div>' +
    '</div>';

  const rankingsEl = root.querySelector('#stats-col-rankings');
  const ratingsEl  = root.querySelector('#stats-col-ratings');

  try { renderRankings(rankingsEl, snapshot); }
  catch (e) { rankingsEl.innerHTML = '<div class="error">Rankings render error: ' + (e.message || e) + '</div>'; }

  try { renderRatings(ratingsEl, snapshot); }
  catch (e) { ratingsEl.innerHTML = '<div class="error">Ratings render error: ' + (e.message || e) + '</div>'; }
}
