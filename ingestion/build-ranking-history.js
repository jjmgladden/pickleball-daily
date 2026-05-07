// build-ranking-history.js — KB-0052 unblocking step (Phase C5).
// Aggregates per-snapshot ranking + rating values into per-player time-series.
//
// Source: every data/snapshots/YYYY-MM-DD.json — read sources.playersIndex.players[]
// (already keyed by playerId; carries ppaRank, ppaPoints, duprDoubles).
// Output: data/snapshots/ranking-history.json — { schemaVersion, generatedAt,
// snapshotDateRange, players: [{playerId, displayName, history: [{date, ppaRank,
// ppaPoints, duprDoubles}]}] }.
//
// Player Detail Page + Player Comparison Recent-Results-adjacent rows can
// consume this without needing a per-player results crawl.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SNAP_DIR = path.join(ROOT, 'data', 'snapshots');

const DATE_RE = /^(\d{4}-\d{2}-\d{2})\.json$/;

function listSnapshotDates() {
  if (!fs.existsSync(SNAP_DIR)) return [];
  return fs.readdirSync(SNAP_DIR)
    .map(f => {
      const m = f.match(DATE_RE);
      return m ? { date: m[1], file: path.join(SNAP_DIR, f) } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.date.localeCompare(b.date));
}

function extractPlayersFromSnapshot(snap) {
  const idx = snap && snap.sources && snap.sources.playersIndex;
  if (!idx || !Array.isArray(idx.players)) return [];
  return idx.players;
}

function pickHistoryFields(p) {
  const out = {};
  if (typeof p.ppaRank === 'number') out.ppaRank = p.ppaRank;
  if (typeof p.ppaPoints === 'number') out.ppaPoints = p.ppaPoints;
  if (typeof p.duprDoubles === 'number') out.duprDoubles = p.duprDoubles;
  return out;
}

function build() {
  const snaps = listSnapshotDates();
  if (!snaps.length) {
    throw new Error('no snapshot files found in ' + SNAP_DIR);
  }

  const byPlayer = new Map();

  for (const { date, file } of snaps) {
    let snap;
    try {
      snap = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (e) {
      console.warn('[ranking-history]   skipping ' + date + ' (parse error: ' + e.message + ')');
      continue;
    }
    const players = extractPlayersFromSnapshot(snap);
    for (const p of players) {
      if (!p || !p.playerId) continue;
      const fields = pickHistoryFields(p);
      if (!Object.keys(fields).length) continue;
      let rec = byPlayer.get(p.playerId);
      if (!rec) {
        rec = {
          playerId: p.playerId,
          displayName: p.displayName || p.playerId,
          history: []
        };
        byPlayer.set(p.playerId, rec);
      }
      if (p.displayName && rec.displayName !== p.displayName) {
        rec.displayName = p.displayName;
      }
      rec.history.push(Object.assign({ date }, fields));
    }
  }

  const players = Array.from(byPlayer.values())
    .filter(r => r.history.length)
    .sort((a, b) => a.displayName.localeCompare(b.displayName));

  const out = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    snapshotDateRange: {
      first: snaps[0].date,
      last: snaps[snaps.length - 1].date,
      count: snaps.length
    },
    playerCount: players.length,
    players
  };

  const outPath = path.join(SNAP_DIR, 'ranking-history.json');
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
  return { outPath, playerCount: players.length, snapshotCount: snaps.length };
}

if (require.main === module) {
  try {
    const r = build();
    console.log('[ranking-history] wrote ' + r.outPath + ' — ' + r.playerCount + ' players across ' + r.snapshotCount + ' snapshots');
  } catch (e) {
    console.error('[ranking-history] FAILED: ' + e.message);
    process.exit(1);
  }
}

module.exports = { build };
