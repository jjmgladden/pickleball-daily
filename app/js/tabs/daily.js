// daily.js — Home tab. Home-module priority per data/master/ui-modules.json.

import { escapeHtml, confidenceBadgeHtml } from '../components/confidence-badge.js';
import { renderVideoCard } from '../components/highlights.js';
import { renderNewsCardCompact } from '../components/news-card.js';
import { fmtDateShort } from '../components/date-utils.js';
import { getFavorites } from '../components/favorites.js';
import { loadMaster } from '../data-loader.js';

function renderInProgress(buckets) {
  const items = buckets.inProgress || [];
  if (items.length === 0) return '<div class="empty">No events currently in progress.</div>';
  return items.map(e => eventCard(e)).join('');
}

function renderUpcoming(buckets, limit = 4) {
  const items = (buckets.upcoming || []).slice(0, limit);
  if (items.length === 0) return '<div class="empty">No events in the next 30 days.</div>';
  return items.map(e => eventCard(e)).join('');
}

function eventCard(e) {
  const when = fmtDateShort(e.startDate) + ' – ' + fmtDateShort(e.endDate);
  const loc = [e.city, e.state].filter(Boolean).join(', ');
  const tier = e.tier ? ' · ' + escapeHtml(e.tier) : '';
  const circuit = e.circuit ? '<span class="meta">' + escapeHtml(e.circuit) + tier + '</span>' : '';
  const badge = confidenceBadgeHtml(e.confidence);
  const link = (e.sources && e.sources[0] && e.sources[0].url)
    ? ' <a href="' + escapeHtml(e.sources[0].url) + '" target="_blank" rel="noopener">site ↗</a>'
    : '';
  return '<div class="card">' +
    '<h3>' + escapeHtml(e.displayName) + badge + '</h3>' +
    '<div class="meta">' + when + (loc ? ' · ' + escapeHtml(loc) : '') + link + '</div>' +
    (circuit ? '<div class="stats-row">' + circuit + '</div>' : '') +
  '</div>';
}

function renderFavoritesStrip(favs, playersById, teamsById) {
  const favTeam = favs.team ? teamsById[favs.team] : null;
  const favPlayers = (favs.players || []).map(id => playersById[id]).filter(Boolean);
  if (!favTeam && favPlayers.length === 0) return '';

  const teamBlock = favTeam
    ? '<div class="fav-team">' +
        '<span class="fav-label">Team:</span> ' +
        '<strong>' + escapeHtml(favTeam.displayName) + '</strong>' +
        (favTeam.homeMarket ? ' <span class="meta">· ' + escapeHtml(favTeam.homeMarket) + '</span>' : '') +
        ((favTeam.headlinePlayers || []).length
          ? '<div class="meta">' + (favTeam.headlinePlayers || []).slice(0, 4).map(escapeHtml).join(' · ') + '</div>'
          : '') +
      '</div>'
    : '';

  const playersBlock = favPlayers.length
    ? '<div class="fav-players">' +
        '<span class="fav-label">Players:</span> ' +
        favPlayers.map(p =>
          '<span class="fav-chip">' +
            escapeHtml(p.displayName) +
            (p.duprDoubles != null ? ' <span class="chip-rating">' + escapeHtml(String(p.duprDoubles)) + '</span>' : '') +
            (p.ppaRankFlag ? ' <span class="chip-rank">' + escapeHtml(String(p.ppaRankFlag)) + '</span>' : '') +
          '</span>'
        ).join(' ') +
      '</div>'
    : '';

  return '<h2 class="section-title">Your Favorites</h2>' +
    '<div class="card fav-strip">' + teamBlock + playersBlock + '</div>';
}

async function loadPlayersSeed() {
  try {
    const m = await loadMaster('players-seed');
    const map = {};
    for (const p of (m.players || [])) map[p.playerId] = p;
    return map;
  } catch { return {}; }
}

export async function renderDaily(root, snapshot) {
  if (!snapshot) {
    root.innerHTML = '<div class="soft-banner">Daily intelligence is loading — data will appear once tonight\u2019s ingestion finishes.</div>';
    return;
  }
  const t = (snapshot.sources && snapshot.sources.tournaments) || { buckets: {} };
  const highlights = (snapshot.sources && snapshot.sources.highlights) || { channels: [] };
  const dupr = (snapshot.sources && snapshot.sources.dupr) || { top20: [] };
  const news = (snapshot.sources && snapshot.sources.news) || { items: [] };
  const topNews = (news.items || []).slice(0, 3);
  const mlpTeams = (snapshot.sources && snapshot.sources.mlp && snapshot.sources.mlp.teams) || [];
  const teamsById = {};
  for (const team of mlpTeams) teamsById[team.teamId] = team;

  const favs = getFavorites();
  const playersById = (favs.players && favs.players.length) ? await loadPlayersSeed() : {};

  const topHighlights = [];
  for (const ch of (highlights.channels || [])) {
    for (const v of (ch.videos || [])) topHighlights.push({ v, channelTitle: ch.channelTitle });
    if (topHighlights.length >= 4) break;
  }

  const topRatings = (dupr.top20 || []).slice(0, 5);

  root.innerHTML =
    renderFavoritesStrip(favs, playersById, teamsById) +

    '<h2 class="section-title">Live Now</h2>' +
    renderInProgress(t.buckets) +

    '<h2 class="section-title">Upcoming (next 30 days)</h2>' +
    renderUpcoming(t.buckets) +

    '<h2 class="section-title">Top Highlights</h2>' +
    (topHighlights.length
      ? '<div class="list-grid">' + topHighlights.slice(0, 4).map(h => renderVideoCard(h.v, h.channelTitle)).join('') + '</div>'
      : '<div class="empty">No recent highlights.</div>') +

    '<h2 class="section-title">Top News</h2>' +
    (topNews.length
      ? '<div class="news-list-compact">' + topNews.map(renderNewsCardCompact).join('') + '</div>'
      : '<div class="empty">No news items.</div>') +

    '<h2 class="section-title">Top DUPR Ratings (Doubles)</h2>' +
    (topRatings.length
      ? topRatings.map(p => '<div class="card"><strong>' + escapeHtml(p.displayName) + '</strong> <span class="chip-rating">' + (p.rating != null ? p.rating : '—') + '</span> <span class="meta">' + escapeHtml(p.country || '') + '</span></div>').join('')
      : '<div class="empty">No ratings data.</div>');
}
