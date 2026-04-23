// players.js — player directory (search + favorites). Phase 1 minimum: list from seed, filter-by-name.

import { escapeHtml, confidenceBadgeHtml } from '../components/confidence-badge.js';
import { getFavorites, togglePlayer } from '../components/favorites.js';
import { loadMaster } from '../data-loader.js';

export async function renderPlayers(root) {
  root.innerHTML = '<div class="loading">Loading players…</div>';
  let master;
  try { master = await loadMaster('players-seed'); }
  catch (e) {
    root.innerHTML = '<div class="error">Could not load players seed: ' + escapeHtml(e.message) + '</div>';
    return;
  }
  const players = (master.players || []);
  const favs = getFavorites();

  const header =
    '<h2 class="section-title">Players (' + players.length + ')</h2>' +
    '<input id="player-filter" type="search" placeholder="Filter by name…" ' +
    'style="width:100%;padding:8px 10px;background:var(--bg-2);color:var(--text);border:1px solid var(--border);border-radius:8px;margin-bottom:12px">' +
    '<div id="player-list"></div>';

  root.innerHTML = header;

  function render(filter) {
    const q = (filter || '').trim().toLowerCase();
    const list = players.filter(p => !q || (p.displayName || '').toLowerCase().includes(q));
    const node = root.querySelector('#player-list');
    if (!list.length) { node.innerHTML = '<div class="empty">No matches.</div>'; return; }
    node.innerHTML = list.map(p => {
      const isFav = favs.players.includes(p.playerId);
      const rating = (p.duprDoubles != null)
        ? '<span class="chip-rating">' + escapeHtml(String(p.duprDoubles)) + '</span>'
        : '';
      const rank = p.ppaRankFlag
        ? '<span class="chip-rank">' + escapeHtml(String(p.ppaRankFlag)) + '</span>'
        : '';
      const profileLinks = [];
      if (p.ppaPlayerUrl) profileLinks.push('<a class="profile-link" href="' + escapeHtml(p.ppaPlayerUrl) + '" target="_blank" rel="noopener">PPA profile ↗</a>');
      if (p.wikipediaUrl) profileLinks.push('<a class="profile-link" href="' + escapeHtml(p.wikipediaUrl) + '" target="_blank" rel="noopener">Wikipedia ↗</a>');
      const profileRow = profileLinks.length
        ? '<div class="profile-row">' + profileLinks.join(' · ') + '</div>'
        : '';
      return '<div class="card">' +
        '<h3>' + escapeHtml(p.displayName) + confidenceBadgeHtml(p.confidence) +
          ' <button data-fav="' + escapeHtml(p.playerId) + '" ' +
          'style="background:transparent;border:none;color:' + (isFav ? 'var(--accent)' : 'var(--text-dim)') + ';cursor:pointer;font-size:1rem">' +
          (isFav ? '★' : '☆') + '</button>' +
        '</h3>' +
        '<div class="stats-row">' + rank + ' ' + rating +
          (p.country ? '<span class="meta">' + escapeHtml(p.country) + '</span>' : '') +
          (p.mlpTeam2026 ? '<span class="meta">MLP: ' + escapeHtml(p.mlpTeam2026) + '</span>' : '') +
        '</div>' +
        (p.knownFor ? '<div class="meta">' + escapeHtml(p.knownFor) + '</div>' : '') +
        profileRow +
      '</div>';
    }).join('');

    node.querySelectorAll('[data-fav]').forEach(btn => {
      btn.addEventListener('click', () => {
        togglePlayer(btn.dataset.fav);
        render(root.querySelector('#player-filter').value);
      });
    });
  }

  root.querySelector('#player-filter').addEventListener('input', (e) => render(e.target.value));
  render('');
}
