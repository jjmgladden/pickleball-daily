// players-index.js — derived universal player index.
//
// KB-0004: combines players-seed.json (canonical headliners with rich fields) +
// MLP rosters (~100 players via WP REST API) + PPA top-200 rankings into a single
// searchable index for the Players tab. Seed entries are authoritative — when a
// player matches by normalized name, MLP/PPA fields enrich the seed entry rather
// than overwrite it.
//
// Output shape (per player):
//   {
//     playerId,          // seed.playerId, or synthetic 'mlp-<wpId>' / 'ppa-<slug>'
//     displayName,
//     sources: [...],    // subset of ['seed', 'mlp', 'ppa']
//     country?,          // seed.country wins; else PPA country (3-letter abbr like USA/BOL)
//     age?,              // PPA age
//     ppaRank?,          // numeric 1..200
//     ppaPoints?,
//     mlpTeam?,          // seed.mlpTeam2026 wins; else derived team name from MLP roster match
//     duprDoubles?,      // seed.duprDoubles wins; else MLP roster duprDoubles
//     ppaPlayerUrl?,     // seed.ppaPlayerUrl wins; else MLP profileUrl when domain is ppatour.com
//     wikipediaUrl?,     // seed only
//     ppaRankFlag?,      // seed only — descriptive flag (e.g. "top-5 across disciplines")
//     knownFor?,         // seed only
//     confidence?,       // seed only
//     handed?,           // seed only
//     fromSeed: bool     // true if this entry traces back to players-seed.json
//   }

function normalize(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function ensureSource(entry, src) {
  if (!entry.sources) entry.sources = [];
  if (!entry.sources.includes(src)) entry.sources.push(src);
}

function buildPlayersIndex({ seed, mlpTeams, ppaRankings }) {
  const startedAt = new Date().toISOString();
  const byKey = new Map();

  // 1. Seed first — these are authoritative.
  const seedPlayers = (seed && seed.players) || [];
  for (const p of seedPlayers) {
    const key = normalize(p.displayName);
    if (!key) continue;
    const entry = {
      playerId: p.playerId,
      displayName: p.displayName,
      sources: ['seed'],
      country: p.country || undefined,
      mlpTeam: p.mlpTeam2026 || undefined,
      duprDoubles: (p.duprDoubles != null) ? p.duprDoubles : undefined,
      ppaPlayerUrl: p.ppaPlayerUrl || undefined,
      wikipediaUrl: p.wikipediaUrl || undefined,
      ppaRankFlag: p.ppaRankFlag || undefined,
      knownFor: p.knownFor || undefined,
      confidence: p.confidence || undefined,
      handed: p.handed || undefined,
      fromSeed: true,
    };
    byKey.set(key, entry);
  }

  // 2. MLP rosters — augment seed entries; create new entries for non-seed players.
  for (const team of (mlpTeams || [])) {
    for (const r of (team.roster || [])) {
      const key = normalize(r.displayName);
      if (!key) continue;
      let entry = byKey.get(key);
      if (!entry) {
        entry = {
          playerId: 'mlp-' + (r.wpId != null ? r.wpId : key.replace(/\s+/g, '-')),
          displayName: r.displayName,
          sources: [],
          fromSeed: false,
        };
        byKey.set(key, entry);
      }
      ensureSource(entry, 'mlp');
      // Seed wins; only fill when seed didn't supply.
      if (entry.mlpTeam === undefined && team.displayName) entry.mlpTeam = team.displayName;
      if (entry.duprDoubles === undefined && r.duprDoubles != null) entry.duprDoubles = r.duprDoubles;
      // MLP profile URLs go to majorleaguepickleball.co player pages — don't overwrite ppaPlayerUrl.
      if (!entry.mlpProfileUrl && r.profileUrl) entry.mlpProfileUrl = r.profileUrl;
    }
  }

  // 3. PPA rankings — augment seed/MLP entries; create new entries for non-seed/non-MLP players.
  const ranks = (ppaRankings && ppaRankings.rankings) || [];
  const slugCache = (ppaRankings && ppaRankings.slugCache) || {};
  for (const r of ranks) {
    const key = normalize(r.playerName);
    if (!key) continue;
    let entry = byKey.get(key);
    if (!entry) {
      const slug = key.replace(/\s+/g, '-');
      entry = {
        playerId: 'ppa-' + slug,
        displayName: r.playerName,
        sources: [],
        fromSeed: false,
      };
      byKey.set(key, entry);
    }
    ensureSource(entry, 'ppa');
    if (entry.ppaRank === undefined && r.rank != null) entry.ppaRank = r.rank;
    if (entry.ppaPoints === undefined && r.points != null) entry.ppaPoints = r.points;
    if (entry.age === undefined && r.age != null) entry.age = r.age;
    // Seed country wins; PPA country is a 3-letter abbreviation (USA, BOL).
    if (entry.country === undefined && r.country) entry.country = r.country;
    // Profile URL backfill: only when seed didn't supply.
    if (!entry.ppaPlayerUrl && slugCache[r.playerName]) entry.ppaPlayerUrl = slugCache[r.playerName];
  }

  // Final ordering: seed entries first (richest data), then MLP-only, then PPA-only.
  // Within each tier, alphabetical by displayName for stable diffs.
  const all = Array.from(byKey.values());
  all.sort((a, b) => {
    const ta = a.fromSeed ? 0 : (a.sources.includes('mlp') ? 1 : 2);
    const tb = b.fromSeed ? 0 : (b.sources.includes('mlp') ? 1 : 2);
    if (ta !== tb) return ta - tb;
    return (a.displayName || '').localeCompare(b.displayName || '');
  });

  // Strip undefined fields for compact JSON.
  const players = all.map(p => {
    const out = {};
    for (const [k, v] of Object.entries(p)) if (v !== undefined) out[k] = v;
    return out;
  });

  const sourceCounts = {
    seed: players.filter(p => p.fromSeed).length,
    mlp:  players.filter(p => p.sources && p.sources.includes('mlp')).length,
    ppa:  players.filter(p => p.sources && p.sources.includes('ppa')).length,
  };

  return {
    sourceId: 'players-index',
    ok: true,
    retrievedAt: startedAt,
    derivedFrom: ['seed', 'mlp', 'ppa-rankings'],
    totalPlayers: players.length,
    sourceCounts,
    players,
    note: 'Derived index — seed entries are authoritative; MLP + PPA enrich rather than overwrite. Universal Players tab consumes this. KB-0004.',
  };
}

module.exports = { buildPlayersIndex, normalize };
