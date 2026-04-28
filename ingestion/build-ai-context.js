// build-ai-context.js — KB-0008 curated context bundle for the AI Q&A layer.
//
// Reads data/snapshots/latest.json (produced by fetch-daily.js) plus a few
// stable seed files, distills them into a compact text block (~5K tokens),
// and writes data/snapshots/ai-context.json. The Worker fetches this file
// on each /ai request and ships it to Claude with prompt caching.
//
// Run order:
//   node ingestion/fetch-daily.js     # produces latest.json
//   node ingestion/build-ai-context.js  # produces ai-context.json

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SNAP_DIR = path.join(ROOT, 'data', 'snapshots');
const MASTER_DIR = path.join(ROOT, 'data', 'master');
const LATEST = path.join(SNAP_DIR, 'latest.json');
const OUT = path.join(SNAP_DIR, 'ai-context.json');

function readJson(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); }
  catch { return null; }
}

function fmtDate(iso) {
  if (!iso) return '—';
  try { return new Date(iso).toISOString().slice(0, 10); }
  catch { return iso; }
}

function approxTokens(text) {
  // Conservative estimate: ~4 chars/token for English text.
  return Math.ceil((text || '').length / 4);
}

function sectionGovernance() {
  return [
    '## GOVERNANCE',
    '- USA Pickleball (USAP) — official US rulebook, paddle approval, amateur sanctioning.',
    '- UPA (United Pickleball Association) — holding company for PPA Tour + MLP after 2023 merger. UPA-Athletes is the pro-side governance arm following the 2024 UPA-USAP split.',
    '- PPA Tour — tour-event pro structure. Owns PPA rankings + most singles/doubles tournament purses.',
    '- Major League Pickleball (MLP) — team-franchise pro structure. 20-team Premier format starting 2026; mixed-gender team matches with the DreamBreaker singles tiebreaker.',
    '- DUPR — official exclusive skill-rating system since 2024 USAP partnership. Auto-fed by PickleballBrackets results.',
    '',
    'Ratings vs Rankings: DUPR ratings (2.0-8.0+) measure skill ("how good?"). PPA rankings (#1, #2, ...) measure tour position over the past 52 weeks ("winning on tour?"). They are NOT interchangeable.'
  ].join('\n');
}

function sectionGlossary() {
  return [
    '## GLOSSARY (selected terms)',
    '- Dink: a soft shot landing in the opponent\'s non-volley zone (kitchen).',
    '- Kitchen: the 7-foot non-volley zone on each side of the net. You cannot volley while standing in it.',
    '- Third shot drop: soft third shot from the baseline into the opposing kitchen, used to neutralize the serve-receive advantage.',
    '- Erne: a volley taken outside the kitchen by jumping around it.',
    '- ATP (around the post): a shot that goes around the net post rather than over the net.',
    '- Bert: like an Erne but the player crosses in front of their partner.',
    '- Stacking: a positioning strategy where partners deliberately swap court sides each rally.',
    '- DreamBreaker: MLP\'s mixed-gender singles tiebreaker for tied team matches.'
  ].join('\n');
}

function sectionPpaRankings(snapshot, n = 50) {
  const ppa = (snapshot.sources && snapshot.sources.ppaRankings) || {};
  const ranks = (ppa.rankings || []).slice(0, n);
  if (!ranks.length) return '## PPA TOUR RANKINGS (52-week)\n(unavailable)';
  const retrievedAt = ppa.retrievedAt ? fmtDate(ppa.retrievedAt) : '—';
  const lines = ['## PPA TOUR RANKINGS (52-week, top ' + n + ', retrieved ' + retrievedAt + ')'];
  lines.push('Format: rank. name (country, age) — points');
  for (const r of ranks) {
    const country = r.country || '—';
    const age = (r.age != null) ? r.age : '—';
    const pts = (r.points != null) ? r.points.toLocaleString() : '—';
    lines.push(r.rank + '. ' + r.playerName + ' (' + country + ', ' + age + ') — ' + pts + ' pts');
  }
  return lines.join('\n');
}

function sectionDuprTop(snapshot, n = 20) {
  const dupr = (snapshot.sources && snapshot.sources.dupr) || {};
  const rows = (dupr.top20 || []).slice(0, n);
  if (!rows.length) return '## DUPR DOUBLES RATINGS\n(unavailable)';
  const lines = ['## DUPR DOUBLES RATINGS (top ' + rows.length + ', source: DUPR)'];
  lines.push('Format: rating. name (country)');
  rows.forEach((p, i) => {
    const c = p.country || '—';
    const r = (p.rating != null) ? p.rating : '—';
    lines.push((i + 1) + '. ' + (p.displayName || '—') + ' — ' + r + ' (' + c + ')');
  });
  return lines.join('\n');
}

function sectionMlpTeams(snapshot) {
  const mlp = (snapshot.sources && snapshot.sources.mlp) || {};
  const teams = mlp.teams || [];
  if (!teams.length) return '## MLP TEAMS (2026 PREMIER)\n(unavailable)';
  const lines = ['## MLP TEAMS (2026 PREMIER — 20 teams)'];
  for (const t of teams) {
    const headline = (t.headlinePlayers || []).slice(0, 4).join(', ') || '(roster TBD)';
    const captain = t.captain ? (' · captain: ' + t.captain) : '';
    const market = t.homeMarket ? (' (' + t.homeMarket + ')') : '';
    lines.push('- ' + t.displayName + market + ' — ' + headline + captain);
  }
  return lines.join('\n');
}

function sectionUpcomingTournaments(snapshot) {
  const t = (snapshot.sources && snapshot.sources.tournaments) || {};
  const upcoming = (t.buckets && t.buckets.upcoming) || [];
  const inProgress = (t.buckets && t.buckets.inProgress) || [];
  const lines = ['## TOURNAMENTS'];
  if (inProgress.length) {
    lines.push('In progress:');
    for (const e of inProgress.slice(0, 6)) {
      const loc = [e.city, e.state].filter(Boolean).join(', ');
      lines.push('- ' + e.displayName + ' (' + (e.circuit || 'circuit?') + ') — ' + fmtDate(e.startDate) + ' to ' + fmtDate(e.endDate) + (loc ? ' · ' + loc : ''));
    }
  }
  if (upcoming.length) {
    lines.push('Upcoming (next 30 days):');
    for (const e of upcoming.slice(0, 10)) {
      const loc = [e.city, e.state].filter(Boolean).join(', ');
      lines.push('- ' + e.displayName + ' (' + (e.circuit || 'circuit?') + ') — ' + fmtDate(e.startDate) + ' to ' + fmtDate(e.endDate) + (loc ? ' · ' + loc : ''));
    }
  }
  if (!inProgress.length && !upcoming.length) lines.push('(no events found)');
  return lines.join('\n');
}

function sectionPlayersIndex(snapshot, n = 60) {
  const idx = (snapshot.sources && snapshot.sources.playersIndex) || {};
  const players = (idx.players || []).slice(0, n);
  if (!players.length) return '## PLAYERS DIRECTORY\n(unavailable)';
  const lines = ['## PLAYERS DIRECTORY (top ' + players.length + ' from ' + (idx.totalPlayers || '?') + ' indexed; seed-curated first, then MLP-rostered, then PPA-ranked)'];
  for (const p of players) {
    const bits = [p.displayName];
    const meta = [];
    if (p.ppaRank != null) meta.push('PPA #' + p.ppaRank);
    if (p.duprDoubles != null) meta.push('DUPR ' + p.duprDoubles);
    if (p.mlpTeam) meta.push('MLP: ' + p.mlpTeam);
    if (p.country) meta.push(p.country);
    if (p.handed) meta.push(p.handed);
    if (p.knownFor) meta.push(p.knownFor.slice(0, 80));
    if (meta.length) bits.push('— ' + meta.join(' · '));
    lines.push('- ' + bits.join(' '));
  }
  return lines.join('\n');
}

function sectionRulesHighlights() {
  const rules = readJson(path.join(MASTER_DIR, 'rules-changes-2026.json'));
  if (!rules || !rules.changes) return '';
  const lines = ['## RULES — 2026 USAP RULEBOOK CHANGES'];
  lines.push('Edition: ' + (rules.rulebookEdition || '—') + ' (effective ' + (rules.effectiveDate || '—') + ')');
  for (const c of (rules.changes || []).slice(0, 12)) {
    const sec = c.section ? '§' + c.section + ' ' : '';
    lines.push('- ' + sec + c.displayName + ' — ' + c.summary);
  }
  return lines.join('\n');
}

function sectionTopHighlights(snapshot, n = 5) {
  const h = (snapshot.sources && snapshot.sources.highlights) || {};
  const channels = h.channels || [];
  const items = [];
  for (const ch of channels) {
    for (const v of (ch.videos || [])) items.push({ ch: ch.channelTitle, v });
    if (items.length >= n) break;
  }
  if (!items.length) return '';
  const lines = ['## RECENT HIGHLIGHTS (YouTube, top ' + Math.min(n, items.length) + ')'];
  for (const { ch, v } of items.slice(0, n)) {
    lines.push('- "' + (v.title || '').slice(0, 100) + '" (' + ch + ', ' + (v.publishedAt ? fmtDate(v.publishedAt) : '—') + ')');
  }
  return lines.join('\n');
}

function sectionTopNews(snapshot, n = 5) {
  const news = (snapshot.sources && snapshot.sources.news) || {};
  const items = (news.items || []).slice(0, n);
  if (!items.length) return '';
  const lines = ['## TOP NEWS (recent, top ' + items.length + ')'];
  lines.push('Each item: title (source, date) + URL + Excerpt. Cite the URL when handing it to the user.');
  for (const it of items) {
    const src = it.sourceName || it.sourceId || '—';
    const url = it.url || it.link || '';
    const summary = String(it.summary || it.description || '').replace(/\s+/g, ' ').trim();
    const excerpt = summary.length > 200 ? summary.slice(0, 200).trim() + '...' : summary;
    lines.push('- "' + (it.title || '').slice(0, 120) + '" (' + src + ', ' + (it.publishedAt ? fmtDate(it.publishedAt) : '—') + ')');
    if (url) lines.push('  ' + url);
    if (excerpt) lines.push('  Excerpt: ' + excerpt);
  }
  return lines.join('\n');
}

function sectionHistoryPointers() {
  const h = readJson(path.join(MASTER_DIR, 'history-seed.json'));
  if (!h || !h.milestones) return '';
  const lines = ['## HISTORY POINTERS (selected milestones from history-seed.json)'];
  // Pick a stable handful — founding + a few governance/competition events
  const pick = (h.milestones || []).slice(0, 8);
  for (const m of pick) {
    lines.push('- ' + (m.year || '') + ': ' + m.displayName + ' — ' + (m.summary || '').slice(0, 160));
  }
  return lines.join('\n');
}

function build() {
  const snapshot = readJson(LATEST);
  if (!snapshot) {
    throw new Error('latest.json not found at ' + LATEST + ' — run fetch-daily.js first.');
  }

  const sections = [
    '# OZARK JOE\'S PICKLEBALL DAILY — AI Q&A CONTEXT BUNDLE',
    'Source: data/snapshots/latest.json + data/master/*.json',
    'Snapshot generated: ' + (snapshot.generatedAt || '—'),
    '',
    sectionGovernance(),
    '',
    sectionGlossary(),
    '',
    sectionPpaRankings(snapshot, 50),
    '',
    sectionDuprTop(snapshot, 20),
    '',
    sectionMlpTeams(snapshot),
    '',
    sectionUpcomingTournaments(snapshot),
    '',
    sectionPlayersIndex(snapshot, 60),
    '',
    sectionRulesHighlights(),
    '',
    sectionTopHighlights(snapshot, 5),
    '',
    sectionTopNews(snapshot, 5),
    '',
    sectionHistoryPointers(),
    '',
    '---',
    'END OF CONTEXT BUNDLE. If a question cannot be answered from the above, say so honestly.'
  ];

  const content = sections.filter(s => s !== null && s !== undefined).join('\n');
  const tokensApprox = approxTokens(content);
  const out = {
    sourceId: 'ai-context',
    generatedAt: new Date().toISOString(),
    snapshotGeneratedAt: snapshot.generatedAt || null,
    tokensApprox,
    chars: content.length,
    content
  };

  fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
  console.log('[build-ai-context] wrote ' + OUT);
  console.log('[build-ai-context]   chars: ' + content.length + ' | approx tokens: ' + tokensApprox);
  return out;
}

if (require.main === module) {
  try { build(); }
  catch (e) { console.error(e); process.exit(1); }
}
module.exports = { build };
