// fetch-mlp.js — MLP teams + rosters snapshot.
// Phase 1.5: parses /mlp-teams/ to confirm the live 20-team list and enrich seed entries with teamPageUrl.
// Per-team roster HTML parse (one HTTP per team) is a Phase 2 task (~20 extra requests + selector work).

const fs = require('fs');
const path = require('path');
const { loadEnv } = require('./lib/env');
const {
  fetchTeamsList,
  normalizeCity,
  fetchWpTeams,
  fetchWpPlayerIndex,
  buildPlayerLookup,
  rosterFromTeamRecord,
} = require('./lib/mlp-api');

loadEnv();

const SEED = path.resolve(__dirname, '..', 'data', 'master', 'mlp-teams.json');

function seedMatchKeys(team) {
  // The live listing gives us raw city headings ("BAY AREA", "SOCAL", "St. Louis").
  // Seed stores richer `homeMarket` + `teamId`. Gather both so abbreviations like SOCAL
  // still match via teamId `socal-hard-eights`.
  return [
    normalizeCity(team.homeMarket),
    normalizeCity(team.displayName),
    normalizeCity((team.teamId || '').replace(/-/g, ' '))
  ].filter(Boolean);
}

function looseMatch(liveCityNorm, seedKeys) {
  if (!liveCityNorm || !seedKeys || !seedKeys.length) return false;
  const firstToken = liveCityNorm.split(/[\s,]+/)[0];
  for (const k of seedKeys) {
    if (k.includes(liveCityNorm)) return true;
    if (firstToken && k.includes(firstToken)) return true;
  }
  return false;
}

function teamPageSlug(teamPageUrl) {
  if (!teamPageUrl) return null;
  const m = teamPageUrl.match(/\/team\/([^/]+)\/?/);
  return m ? m[1] : null;
}

async function run() {
  if (!fs.existsSync(SEED)) {
    return { sourceId: 'mlp', ok: false, error: 'seed-missing' };
  }
  const seed = JSON.parse(fs.readFileSync(SEED, 'utf8'));
  const seedTeams = seed.teams || [];

  const live = await fetchTeamsList();

  // Enrich seed teams with teamPageUrl when we find a match. Track unmatched rows on both sides.
  const matchedLiveIndexes = new Set();
  let teams = seedTeams.map(seedT => {
    const keys = seedMatchKeys(seedT);
    const i = (live.teams || []).findIndex((lt, idx) =>
      !matchedLiveIndexes.has(idx) && looseMatch(normalizeCity(lt.city), keys)
    );
    if (i >= 0) matchedLiveIndexes.add(i);
    const lt = i >= 0 ? live.teams[i] : null;
    return lt ? { ...seedT, teamPageUrl: lt.teamPageUrl, liveMatched: true } : { ...seedT, liveMatched: false };
  });

  const unmatchedLive = (live.teams || []).filter((_, idx) => !matchedLiveIndexes.has(idx));

  // Phase 1.5 Round 2 Item 3: roster enrichment via WordPress REST API.
  // Two calls to /wp-json/wp/v2/team + player build a full roster lookup. Per-team failure
  // isolated (missing wp slug or dropped player ID degrades to headliners).
  const rosterMeta = {
    attempted: false, ok: false, teamsRostered: 0, teamsFailed: 0,
    playerIndexSize: 0, errors: [],
  };
  try {
    rosterMeta.attempted = true;
    const [wpTeams, wpPlayers] = await Promise.all([fetchWpTeams(), fetchWpPlayerIndex()]);
    if (!wpTeams.ok || !wpPlayers.ok) {
      rosterMeta.errors.push({
        phase: 'fetch',
        teamsError: wpTeams.ok ? null : wpTeams.error,
        playerIndexError: wpPlayers.ok ? null : (wpPlayers.errors && wpPlayers.errors[0]),
      });
    } else {
      const playersById = buildPlayerLookup(wpPlayers.players);
      rosterMeta.playerIndexSize = wpPlayers.players.length;
      const wpTeamsBySlug = {};
      for (const t of (wpTeams.data || [])) wpTeamsBySlug[t.slug] = t;

      teams = teams.map(seedT => {
        const slug = teamPageSlug(seedT.teamPageUrl);
        const wpT = slug ? wpTeamsBySlug[slug] : null;
        if (!wpT) {
          return { ...seedT, rosterFreshness: 'seed-only' };
        }
        const { players: roster, missing } = rosterFromTeamRecord(wpT, playersById);
        if (roster.length === 0) {
          return { ...seedT, rosterFreshness: 'seed-only', rosterMissingIds: missing };
        }
        rosterMeta.teamsRostered++;
        return {
          ...seedT,
          roster,
          rosterFreshness: missing.length > 0 ? 'live-partial' : 'live',
          rosterRetrievedAt: new Date().toISOString(),
          rosterMissingIds: missing.length > 0 ? missing : undefined,
        };
      });
      rosterMeta.teamsFailed = teams.filter(t => t.rosterFreshness === 'seed-only').length;
      rosterMeta.ok = rosterMeta.teamsRostered > 0;
    }
  } catch (e) {
    rosterMeta.errors.push({ phase: 'run', error: e.message || String(e) });
  }

  const freshness = live.ok
    ? (unmatchedLive.length === 0 && teams.every(t => t.liveMatched) ? 'live-verified' : 'live-partial')
    : 'seed-only';

  return {
    sourceId: 'mlp',
    ok: true,
    retrievedAt: new Date().toISOString(),
    freshness,
    teams,
    teamsCount: teams.length,
    live: {
      ok: !!live.ok,
      status: live.status || null,
      liveTeamCount: (live.teams || []).length,
      unmatchedLive: unmatchedLive.map(t => ({ city: t.city, displayName: t.displayName, teamPageUrl: t.teamPageUrl })),
      unmatchedSeed: teams.filter(t => !t.liveMatched).map(t => ({ teamId: t.teamId, homeMarket: t.homeMarket }))
    },
    rosters: rosterMeta,
    note: 'Phase 1.5 Round 2: team list verified + rosters resolved via WordPress REST API.'
  };
}

if (require.main === module) {
  run().then(r => console.log(JSON.stringify(r, null, 2))).catch(e => { console.error(e); process.exit(1); });
}
module.exports = { run };
