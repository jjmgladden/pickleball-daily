// teams.js — MLP team-centric view (separate information model from PPA per KB-0010).

import { escapeHtml, confidenceBadgeHtml } from '../components/confidence-badge.js';
import { getFavorites, setFavoriteTeam } from '../components/favorites.js';

function rosterBlock(t) {
  const roster = Array.isArray(t.roster) ? t.roster : [];
  if (roster.length > 0) {
    const chips = roster.map(p => {
      const name = escapeHtml(p.displayName || '—');
      const dupr = (p.duprDoubles != null && !Number.isNaN(p.duprDoubles))
        ? ' <span class="chip-rating">' + escapeHtml(String(p.duprDoubles)) + '</span>'
        : '';
      const anchor = p.profileUrl
        ? '<a href="' + escapeHtml(p.profileUrl) + '" target="_blank" rel="noopener">' + name + '</a>'
        : name;
      return '<span class="roster-chip">' + anchor + dupr + '</span>';
    }).join(' ');
    const tag = t.rosterFreshness === 'live-partial'
      ? '<div class="muted roster-tag">Roster: live (partial — some records unresolved)</div>'
      : '<div class="muted roster-tag">Roster: live</div>';
    return '<div class="roster-row">' + chips + '</div>' + tag;
  }
  // Fallback: headliners when live roster unavailable
  const headliners = (t.headlinePlayers || []).slice(0, 4).map(escapeHtml).join(' · ');
  if (!headliners) return '';
  const note = t.rosterFreshness === 'seed-only'
    ? '<div class="muted roster-tag">Headliners shown — live roster pending.</div>'
    : '';
  return '<div class="stats-row"><span>' + headliners + '</span></div>' + note;
}

function teamCard(t, isFav) {
  const owners = (t.owners || []).slice(0, 2).map(escapeHtml).join(', ');
  const teamPageLink = t.teamPageUrl
    ? '<div class="meta"><a href="' + escapeHtml(t.teamPageUrl) + '" target="_blank" rel="noopener">Team page ↗</a></div>'
    : '';
  return '<div class="card" data-team="' + escapeHtml(t.teamId) + '">' +
    '<h3>' + escapeHtml(t.displayName) + confidenceBadgeHtml(t.confidence) +
      ' <button class="fav-btn" aria-label="Set as favorite" data-team-id="' + escapeHtml(t.teamId) + '" ' +
      'style="background:transparent;border:none;color:' + (isFav ? 'var(--accent)' : 'var(--text-dim)') + ';cursor:pointer;font-size:1rem">' +
      (isFav ? '★' : '☆') + '</button>' +
    '</h3>' +
    '<div class="meta">' + escapeHtml(t.homeMarket || '—') + '</div>' +
    rosterBlock(t) +
    (owners ? '<div class="meta">Owners: ' + owners + '</div>' : '') +
    (t.captain ? '<div class="meta">Captain: ' + escapeHtml(t.captain) + '</div>' : '') +
    teamPageLink +
  '</div>';
}

export function renderTeams(root, snapshot) {
  const teams = (snapshot && snapshot.sources && snapshot.sources.mlp && snapshot.sources.mlp.teams) || [];
  if (teams.length === 0) {
    root.innerHTML =
      '<h2 class="section-title">MLP Teams</h2>' +
      '<div class="soft-banner">MLP team data is briefly unavailable — check back later today.</div>';
    return;
  }
  const favs = getFavorites();
  root.innerHTML =
    '<h2 class="section-title">MLP Teams (' + teams.length + ')</h2>' +
    '<div class="list-grid">' + teams.map(t => teamCard(t, favs.team === t.teamId)).join('') + '</div>';

  root.querySelectorAll('.fav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.teamId;
      const cur = getFavorites().team;
      setFavoriteTeam(cur === id ? null : id);
      renderTeams(root, snapshot); // re-render
    });
  });
}
