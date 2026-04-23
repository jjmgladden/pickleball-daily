// mlp-api.js — scrape helpers for majorleaguepickleball.co.
// HTML is mostly static; roster updates post-Trade-Window require live re-fetch.

const BASE = 'https://www.majorleaguepickleball.co';
const UA = 'Mozilla/5.0 (compatible; PickleballDailyBot/1.0; +https://github.com/jjmgladden/pickleball-daily)';

async function fetchHtml(pathname) {
  const url = BASE + pathname;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept': 'text/html' } });
    const body = await res.text();
    return { ok: res.ok, url, status: res.status, body };
  } catch (e) {
    return { ok: false, url, status: 0, error: e.message };
  }
}

// Cheap liveness probe for the teams page.
async function probeTeamsPage() {
  const r = await fetchHtml('/mlp-teams/');
  return { reachable: r.ok, status: r.status, bytes: r.body ? r.body.length : 0 };
}

function normalizeCity(s) {
  return String(s || '').trim().toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/\bst\.?\s/, 'st ');
}

// Parse the /mlp-teams/ listing page. Returns { teams: [{city, teamPageUrl, displayName}], raw }.
function parseTeamsList(html) {
  if (!html) return { ok: false, teams: [] };
  const teams = [];
  const cardRe = /class="[^"]*league__team-card__city[^"]*"[^>]*>([^<]+)<\/h3>\s*<h3[^>]*class="[^"]*league__team-card__name[^"]*"[^>]*>\s*<a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/gi;
  let m;
  while ((m = cardRe.exec(html))) {
    const city = m[1].trim();
    const teamPageUrl = m[2].trim();
    const displayName = m[3].trim();
    teams.push({ city, teamPageUrl, displayName });
  }
  return { ok: teams.length > 0, teams };
}

async function fetchTeamsList() {
  const r = await fetchHtml('/mlp-teams/');
  if (!r.ok) return { ok: false, error: 'http-' + r.status };
  const parsed = parseTeamsList(r.body);
  return {
    ok: parsed.ok,
    url: r.url,
    status: r.status,
    bytes: r.body ? r.body.length : 0,
    teams: parsed.teams
  };
}

// WordPress REST endpoints (public, no auth). One call returns all teams with their
// roster post-IDs embedded in meta_box.rel_player-team_from; two paginated calls return
// the full player directory (~132 entries). Discovered Session 4 while probing HTML rosters.
async function fetchJson(pathname) {
  const url = BASE + pathname;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept': 'application/json' } });
    if (!res.ok) return { ok: false, url, status: res.status, error: 'http-' + res.status };
    return { ok: true, url, status: res.status, data: await res.json() };
  } catch (e) {
    return { ok: false, url, status: 0, error: e.message || 'fetch-failed' };
  }
}

async function fetchWpTeams() {
  const fields = 'id,slug,title,link,meta_box.team_city,meta_box.rel_player-team_from';
  return fetchJson('/wp-json/wp/v2/team?per_page=100&_fields=' + encodeURIComponent(fields));
}

async function fetchWpPlayerIndex() {
  const fields = 'id,slug,title,link,meta_box.player_first-name,meta_box.player_last-name,meta_box.player_dupr,meta_box.player_age,meta_box.player_bio';
  const perPage = 100;
  const all = [];
  const errors = [];
  for (let page = 1; page <= 5; page++) {
    const r = await fetchJson('/wp-json/wp/v2/player?per_page=' + perPage + '&page=' + page + '&_fields=' + encodeURIComponent(fields));
    if (!r.ok) { errors.push({ page, error: r.error }); break; }
    if (!Array.isArray(r.data) || r.data.length === 0) break;
    all.push(...r.data);
    if (r.data.length < perPage) break;
  }
  return { ok: all.length > 0, players: all, errors };
}

function buildPlayerLookup(players) {
  const byId = {};
  for (const p of (players || [])) byId[String(p.id)] = p;
  return byId;
}

function rosterFromTeamRecord(team, playersById) {
  const m = (team && team.meta_box) || {};
  const ids = m['rel_player-team_from'];
  if (!Array.isArray(ids) || ids.length === 0) return { players: [], missing: [] };
  const resolved = [];
  const missing = [];
  for (const rawId of ids) {
    const id = String(rawId);
    const p = playersById[id];
    if (!p) { missing.push(id); continue; }
    const pm = p.meta_box || {};
    const name = (p.title && p.title.rendered)
      || [pm['player_first-name'], pm['player_last-name']].filter(Boolean).join(' ').trim()
      || null;
    if (!name) { missing.push(id); continue; }
    const duprRaw = pm.player_dupr;
    const dupr = (duprRaw != null && duprRaw !== '') ? Number(duprRaw) : null;
    resolved.push({
      playerId: p.slug || ('wp-' + id),
      wpId: Number(id),
      displayName: name,
      duprDoubles: (dupr != null && !Number.isNaN(dupr)) ? dupr : null,
      profileUrl: p.link || null,
    });
  }
  return { players: resolved, missing };
}

module.exports = {
  fetchHtml, probeTeamsPage, fetchTeamsList, parseTeamsList, normalizeCity,
  fetchWpTeams, fetchWpPlayerIndex, buildPlayerLookup, rosterFromTeamRecord,
  UA
};
