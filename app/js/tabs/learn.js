// learn.js (tab) — rules + history + governance + glossary + etiquette + DUPR + tournament prep.
// Pulls from data/master/rules-changes-2026.json + history-seed.json + glossary.json.
// Section numbers carry caveat per rules-changes-2026.json (verify against USAP PDF).
//
// KB-0040 Phase L1: TOC + accordion structure modeled on Travel Project Help tab.
// KB-0040 Phase L2: + Glossary (JSON-backed) + Court Etiquette + DUPR Explainer + Tournament Prep.
// Generic CSS classes (.tab-toc / .tab-section / .tab-callout) so the pattern is reusable
// for the future Help feature anticipated in KB-0039.

import { escapeHtml, confidenceBadgeHtml } from '../components/confidence-badge.js';
import { loadMaster } from '../data-loader.js';

const CATEGORY_LABELS = {
  play: 'Play',
  officiating: 'Officiating',
  serve: 'Serve',
  format: 'Format',
  equipment: 'Equipment',
  accessibility: 'Accessibility'
};

const HISTORY_CATEGORY_LABELS = {
  founding: 'Founding',
  governance: 'Governance',
  professional: 'Professional Era',
  growth: 'Growth',
  competition: 'Competition',
  business: 'Business',
  infrastructure: 'Infrastructure',
  accessibility: 'Accessibility'
};

function ruleCardHtml(rule) {
  const sources = (rule.sources || []).map(s =>
    '<a href="' + escapeHtml(s.url) + '" target="_blank" rel="noopener">' + escapeHtml(s.sourceId) + ' ↗</a>'
  ).join(' · ');
  const cat = CATEGORY_LABELS[rule.category] || rule.category || '';
  const section = rule.section ? '<span class="rule-section">§ ' + escapeHtml(String(rule.section)) + '</span>' : '';
  const badge = confidenceBadgeHtml(rule.confidence);
  return (
    '<article class="card rule-card">' +
      '<h3>' + escapeHtml(rule.displayName) + badge + '</h3>' +
      '<div class="meta">' + section + (cat ? ' · ' + escapeHtml(cat) : '') + '</div>' +
      '<p class="rule-summary">' + escapeHtml(rule.summary) + '</p>' +
      (rule.impact ? '<div class="rule-impact"><strong>Impact:</strong> ' + escapeHtml(rule.impact) + '</div>' : '') +
      (sources ? '<div class="meta">Sources: ' + sources + '</div>' : '') +
    '</article>'
  );
}

function milestoneCardHtml(m) {
  const cat = HISTORY_CATEGORY_LABELS[m.category] || m.category || '';
  const sources = (m.sources || []).map(s =>
    '<a href="' + escapeHtml(s.url) + '" target="_blank" rel="noopener">' + escapeHtml(s.sourceId) + ' ↗</a>'
  ).join(' · ');
  const badge = confidenceBadgeHtml(m.confidence);
  const variant = m.flaggedVariants
    ? '<div class="meta">Variants flagged · official position: ' + escapeHtml(m.officialPosition || '—') + '</div>'
    : '';
  return (
    '<article class="card history-card">' +
      '<div class="history-year">' + escapeHtml(String(m.year || '')) + '</div>' +
      '<div class="history-body">' +
        '<h3>' + escapeHtml(m.displayName) + badge + '</h3>' +
        '<div class="meta">' + escapeHtml(cat) + (m.location ? ' · ' + escapeHtml(m.location) : '') + '</div>' +
        '<p>' + escapeHtml(m.summary) + '</p>' +
        variant +
        (sources ? '<div class="meta">Sources: ' + sources + '</div>' : '') +
      '</div>' +
    '</article>'
  );
}

function governanceBlockHtml() {
  return (
    '<article class="card governance-card">' +
      '<h3>Who governs what</h3>' +
      '<dl class="governance-list">' +
        '<dt>USA Pickleball (USAP)</dt>' +
        '<dd>Official rulebook · paddle approval · amateur sanctioning · governance for the sport in the US.</dd>' +
        '<dt>UPA (United Pickleball Association)</dt>' +
        '<dd>Holding company for PPA Tour + Major League Pickleball after the 2023 merger. UPA-Athletes is the pro-side governance arm following the 2024 UPA–USAP split.</dd>' +
        '<dt>PPA Tour</dt>' +
        '<dd>Tour-event pro structure. Owns rankings (52-week + Race) and most singles + doubles tournament purse.</dd>' +
        '<dt>Major League Pickleball (MLP)</dt>' +
        '<dd>Team-franchise pro structure. 20-team Premier format starting 2026; mixed-gender team matches with the DreamBreaker singles tiebreaker.</dd>' +
        '<dt>DUPR</dt>' +
        '<dd>Official exclusive skill-rating system since the 2024 USAP partnership. Auto-fed by PickleballBrackets results.</dd>' +
      '</dl>' +
    '</article>'
  );
}

function rulebookHeaderHtml(rules) {
  const edition = rules.rulebookEdition || '—';
  const effective = rules.effectiveDate || '—';
  const pdfUrl = rules.primarySource && rules.primarySource.url;
  const changeDoc = rules.changeDocument && rules.changeDocument.url;
  return (
    '<article class="card rulebook-header">' +
      '<h3>USAP Rulebook ' + escapeHtml(String(edition)) + '</h3>' +
      '<div class="meta">Effective ' + escapeHtml(effective) + '</div>' +
      '<div class="meta" style="margin-top:8px;">' +
        (pdfUrl ? '<a href="' + escapeHtml(pdfUrl) + '" target="_blank" rel="noopener">Official rulebook PDF ↗</a>' : '') +
        (pdfUrl && changeDoc ? ' · ' : '') +
        (changeDoc ? '<a href="' + escapeHtml(changeDoc) + '" target="_blank" rel="noopener">Change document ↗</a>' : '') +
      '</div>' +
    '</article>'
  );
}

function rulesAndAuthorityBodyHtml(rules) {
  let html = '';
  html += '<h4>Governance</h4>';
  html += governanceBlockHtml();

  html += '<h4>2026 Rule Changes</h4>';
  if (rules && rules.changes && rules.changes.length) {
    html += rulebookHeaderHtml(rules);
    html += '<div class="learn-list">' + rules.changes.map(ruleCardHtml).join('') + '</div>';
    html += (
      '<div class="tab-callout info">' +
        '<div class="tab-callout-label">Section-number caveat</div>' +
        'Section numbers cite secondary summaries (Selkirk · The Dink) where the primary USAP PDF has not been programmatically verified. Always defer to the USAP PDF for authoritative citations.' +
      '</div>'
    );
  } else {
    html += '<div class="empty">Rule-changes data unavailable.</div>';
  }
  return html;
}

function historyBodyHtml(history) {
  if (!history || !history.milestones || !history.milestones.length) {
    return '<div class="empty">History data unavailable.</div>';
  }
  const sorted = history.milestones.slice().sort((a, b) => (a.year || 0) - (b.year || 0));
  let html = '<div class="history-timeline">' + sorted.map(milestoneCardHtml).join('') + '</div>';
  html += (
    '<div class="tab-callout">' +
      '<div class="tab-callout-label">Founding narrative</div>' +
      'Follows USA Pickleball’s official position. Folk variants (e.g., the dog “Pickles”) are flagged where they exist on individual entries.' +
    '</div>'
  );
  return html;
}

function glossaryBodyHtml(glossary) {
  if (!glossary || !glossary.terms || !glossary.terms.length) {
    return '<div class="empty">Glossary data unavailable.</div>';
  }
  const cats = (glossary.categories || []).slice();
  const byCat = {};
  cats.forEach(c => { byCat[c.id] = []; });
  glossary.terms.forEach(t => {
    if (!byCat[t.category]) byCat[t.category] = [];
    byCat[t.category].push(t);
  });

  let html = '<p class="glossary-intro">Common terminology — alphabetical within each grouping. Tap a category to scan, or scroll through.</p>';
  cats.forEach(cat => {
    const list = byCat[cat.id] || [];
    if (!list.length) return;
    list.sort((a, b) => a.term.localeCompare(b.term));
    html += '<h4>' + escapeHtml(cat.label) + '</h4>';
    html += '<dl class="glossary-list">';
    list.forEach(t => {
      html += '<dt>' + escapeHtml(t.term) + '</dt>';
      html += '<dd>' + escapeHtml(t.definition) + '</dd>';
    });
    html += '</dl>';
  });

  if (glossary.lastReviewed) {
    html += (
      '<div class="tab-callout info">' +
        '<div class="tab-callout-label">Glossary maintenance</div>' +
        'Last reviewed ' + escapeHtml(glossary.lastReviewed) + '. Definitions are paraphrased for plain-language use; the USAP rulebook is authoritative for any rules-bearing term.' +
      '</div>'
    );
  }
  return html;
}

function etiquetteBodyHtml() {
  return (
    '<p>Most pickleball rooms — public courts, club open play, drop-in nights — run on shared conventions rather than written rules. The basics:</p>' +

    '<h4>Open-play queueing</h4>' +
    '<ul>' +
      '<li><strong>Paddle stack.</strong> Place your paddle in the designated stack or rack when you arrive. The next four paddles get the next open court.</li>' +
      '<li><strong>Don’t skip the stack.</strong> Hopping onto a court out of order is the fastest way to start a fight. If you’re unsure, ask who’s next.</li>' +
      '<li><strong>One game then off.</strong> At busy venues, the convention is one game (to 11) then back to the stack — even if you win.</li>' +
      '<li><strong>Mixed-skill rooms.</strong> Many venues separate by self-rating (2.5 / 3.0 / 3.5 / 4.0+) on different courts. Play the level you actually are, not the level you’d like to be.</li>' +
    '</ul>' +

    '<h4>The kitchen line</h4>' +
    '<ul>' +
      '<li><strong>Don’t volley standing in (or touching the line of) the kitchen.</strong> The non-volley zone rule is the most-broken rule in rec play. Step back behind the line before volleying.</li>' +
      '<li><strong>Momentum counts.</strong> If you volley while airborne and your foot lands in the kitchen on the follow-through, it’s still a fault.</li>' +
      '<li><strong>You may stand in the kitchen anytime — just not when volleying.</strong> Walking through it, retrieving a ball, returning a bounce — all legal.</li>' +
    '</ul>' +

    '<h4>Calling the score &amp; lines</h4>' +
    '<ul>' +
      '<li><strong>Server calls the score</strong> before serving — three numbers in doubles (your team / opponents / server #).</li>' +
      '<li><strong>The team on whose side the ball lands makes the call</strong> in unrefereed play.</li>' +
      '<li><strong>If you can’t call it out with certainty, it’s in.</strong> Benefit of the doubt always goes to the opponent. Never call your own ball out unless you’re sure.</li>' +
      '<li><strong>If you and your partner disagree</strong> on a line call, the ball is in.</li>' +
    '</ul>' +

    '<h4>Crossing courts &amp; safety</h4>' +
    '<ul>' +
      '<li><strong>Wait for a dead ball</strong> before walking behind a court that’s in play. \"Behind\" is the standard call.</li>' +
      '<li><strong>If a ball rolls onto your court</strong> mid-rally, call \"ball on\" — it’s a let, replay the point.</li>' +
      '<li><strong>Don’t step onto an active court</strong> to retrieve your ball. Wait for a stoppage.</li>' +
    '</ul>' +

    '<h4>Partner conduct</h4>' +
    '<ul>' +
      '<li><strong>Encourage your partner.</strong> No public coaching, no eye-rolling. Paddle taps after every point — win or lose.</li>' +
      '<li><strong>Apologize for an Erne / poach win on a body shot.</strong> Standard pro courtesy; rec players follow it too.</li>' +
      '<li><strong>Shake (or paddle-tap) at the end of every game</strong> — at the net, with all four players.</li>' +
    '</ul>' +

    '<div class="tab-callout tip">' +
      '<div class="tab-callout-label">Newcomer tip</div>' +
      'Most rooms welcome new players. Tell whoever\'s organizing rotation that you\'re new — they\'ll point you to the right court and explain local conventions in 30 seconds.' +
    '</div>'
  );
}

function duprExplainerBodyHtml() {
  return (
    '<p>DUPR — the <strong>Dynamic Universal Pickleball Rating</strong> — is a skill rating, not a ranking. It measures how well you currently play; it does not measure who is winning on tour. The two are easy to confuse and frequently are.</p>' +

    '<h4>What DUPR is</h4>' +
    '<ul>' +
      '<li><strong>A number from roughly 2.0 to 8.0+.</strong> Calculated to two decimal places (e.g., 4.27).</li>' +
      '<li><strong>The official exclusive skill-rating system</strong> for USA Pickleball since their 2024 partnership.</li>' +
      '<li><strong>Auto-fed</strong> from match results posted to PickleballBrackets — the largest live-scoring engine in the sport. You don\'t need to enter results manually for sanctioned play.</li>' +
      '<li><strong>Single-rating, single-system.</strong> Doubles results, singles results, men\'s, women\'s, mixed — all factor into one number per player. (DUPR also publishes a separate doubles-only and singles-only sub-rating.)</li>' +
    '</ul>' +

    '<h4>What DUPR is not</h4>' +
    '<ul>' +
      '<li><strong>Not a PPA Tour ranking.</strong> PPA rankings are an ordinal leaderboard of how players have performed at PPA events over a recent window — \"Anna Leigh Waters is #1\" is a PPA ranking statement. Anna Leigh\'s DUPR is a separate, much larger number.</li>' +
      '<li><strong>Not a USAP self-rating (2.5 / 3.0 / 3.5 / 4.0).</strong> Those are coarse rec-play tiers used for tournament brackets and open-play court groupings. DUPR is two decimals; the USAP tiers are quarter-point steps.</li>' +
      '<li><strong>Not the same as UTR-P or PickleWave ELO.</strong> Other rating systems exist but are no longer the official USAP rating.</li>' +
    '</ul>' +

    '<h4>What the numbers mean in practice</h4>' +
    '<ul>' +
      '<li><strong>2.0 – 2.5</strong> Beginner. Learning the serve, two-bounce rule, and basic positioning.</li>' +
      '<li><strong>3.0 – 3.5</strong> Intermediate rec player. Comfortable at the kitchen line, still working on third-shot drops and resets.</li>' +
      '<li><strong>4.0 – 4.5</strong> Strong club player. Wins local 4.0 brackets; can drop, dink, and counter-attack consistently.</li>' +
      '<li><strong>5.0 – 5.5</strong> Top amateur / regional tournament contender.</li>' +
      '<li><strong>6.0 – 6.5</strong> Elite amateur / fringe pro. Plays sanctioned PPA Challenger events.</li>' +
      '<li><strong>7.0+</strong> Touring pro. The top of the men\'s and women\'s pro game lives between 7.0 and ~7.6.</li>' +
    '</ul>' +

    '<h4>How a DUPR moves</h4>' +
    '<ul>' +
      '<li><strong>Win or lose, your DUPR adjusts</strong> based on how you performed against the rating-weighted expectation. Beating a higher-rated opponent moves you up; losing to a much lower-rated one moves you down.</li>' +
      '<li><strong>Score margin matters.</strong> 11–9 against a peer doesn\'t move the needle the way 11–2 does.</li>' +
      '<li><strong>It\'s dynamic.</strong> Recent matches weigh more than older ones; a long layoff increases volatility on your next match.</li>' +
      '<li><strong>Reliability score.</strong> DUPR also publishes a reliability indicator — newer accounts with few matches have lower reliability, meaning the number can swing more on a single result.</li>' +
    '</ul>' +

    '<h4>How to find your rating</h4>' +
    '<ul>' +
      '<li>Sign up at <a href="https://dupr.com" target="_blank" rel="noopener">dupr.com ↗</a> with your email.</li>' +
      '<li>If you\'ve played a sanctioned event run on PickleballBrackets, your matches are likely already there — the system auto-merges on name + email match.</li>' +
      '<li>Self-reported rec matches are allowed but carry lower reliability than sanctioned event results.</li>' +
    '</ul>' +

    '<div class="tab-callout info">' +
      '<div class="tab-callout-label">Rating vs ranking — the rule of thumb</div>' +
      'Asking \"how good are you?\" → answer with a DUPR rating. Asking \"who\'s winning on tour?\" → answer with a PPA ranking. They are not interchangeable and will not match.' +
    '</div>'
  );
}

function tournamentPrepBodyHtml() {
  return (
    '<p>This is a primer for amateur sanctioned events — local USAP-sanctioned tournaments, regional opens, club championships. Pro events follow different rules.</p>' +

    '<h4>Where events are listed &amp; registration</h4>' +
    '<ul>' +
      '<li><strong><a href="https://pickleballtournaments.com" target="_blank" rel="noopener">PickleballTournaments.com (PBT) ↗</a></strong> — the largest registration platform for amateur tournaments in the US. Search by location, date, or skill level.</li>' +
      '<li><strong><a href="https://pickleballbrackets.com" target="_blank" rel="noopener">PickleballBrackets ↗</a></strong> — also lists events; live-scores most of them on tournament day.</li>' +
      '<li><strong>Register early.</strong> Popular brackets fill within 48 hours of opening. Many events charge a per-event fee plus a per-bracket fee.</li>' +
    '</ul>' +

    '<h4>Sanctioned vs unsanctioned</h4>' +
    '<ul>' +
      '<li><strong>USAP-sanctioned</strong> events use the official rulebook, count toward national rankings (in the relevant divisions), and feed DUPR. Most reputable amateur events are sanctioned.</li>' +
      '<li><strong>Unsanctioned</strong> events still use the rulebook but may use modified scoring (rally to 15, etc.) and don\'t count for national rankings. Often cheaper and more local.</li>' +
    '</ul>' +

    '<h4>Picking your bracket</h4>' +
    '<ul>' +
      '<li><strong>Skill level (2.5 / 3.0 / 3.5 / 4.0 / 4.5 / 5.0+)</strong> — be honest. Sandbagging (entering below your real level) is bad form and increasingly policed via DUPR caps.</li>' +
      '<li><strong>Age group</strong> — many events offer 19+, 35+, 50+, 60+, 70+ brackets. Some skill levels split by age, others combine.</li>' +
      '<li><strong>Format</strong> — Singles, Men\'s Doubles, Women\'s Doubles, Mixed Doubles. Most amateur players enter 2–3 events across a weekend.</li>' +
      '<li><strong>Round-robin vs double-elimination.</strong> Smaller brackets often run round-robin; larger ones run double-elimination with a true backdraw.</li>' +
    '</ul>' +

    '<h4>Match format conventions</h4>' +
    '<ul>' +
      '<li><strong>Pool play / round-robin</strong> — one game to 15 (win by 2) or two-out-of-three games to 11 (win by 2).</li>' +
      '<li><strong>Single elimination / medal rounds</strong> — typically two-out-of-three games to 11 (win by 2). Finals occasionally go to 15.</li>' +
      '<li><strong>Side-out scoring</strong> is the default at sanctioned amateur events. (Pro events have moved more toward rally scoring; amateurs largely have not.)</li>' +
      '<li><strong>Self-officiated</strong> below medal rounds — players call their own lines and score. Referees are added at medals or for higher-level brackets.</li>' +
    '</ul>' +

    '<h4>What to bring</h4>' +
    '<ul>' +
      '<li><strong>Two paddles minimum.</strong> A backup is mandatory if your first delaminates or cracks mid-match. Both must be USAP-approved if the event is sanctioned.</li>' +
      '<li><strong>Court shoes</strong> — proper indoor or outdoor pickleball / tennis shoes. Running shoes are a sprained-ankle waiting to happen on lateral movement.</li>' +
      '<li><strong>Water + electrolytes</strong> — outdoor summer events go long. Most venues sell water but plan for outages.</li>' +
      '<li><strong>Snacks / lunch.</strong> Bracket play can stretch from 8 a.m. into evening. Concession-stand food is unreliable.</li>' +
      '<li><strong>Layers.</strong> Indoor venues run cold between matches; outdoor mornings run cold even in summer.</li>' +
      '<li><strong>Athletic tape / blister care.</strong> Day-two foot blisters end more tournaments than knee injuries.</li>' +
    '</ul>' +

    '<h4>Day-of expectations</h4>' +
    '<ul>' +
      '<li><strong>Check in 30+ minutes early.</strong> Some events close registration at the start of the bracket; latecomers forfeit.</li>' +
      '<li><strong>Listen for your court call.</strong> Most events use PA announcements + a tournament app; brackets run on PickleballBrackets in real time.</li>' +
      '<li><strong>Warm up between matches.</strong> 5 minutes of dinks at the kitchen line before each match — not full-court play.</li>' +
      '<li><strong>Time between matches</strong> can be 15 minutes or 3 hours depending on bracket flow. Stay near the venue and check the app frequently.</li>' +
    '</ul>' +

    '<div class="tab-callout tip">' +
      '<div class="tab-callout-label">First tournament?</div>' +
      'Register for one event (probably mixed or men\'s/women\'s doubles), not three. The first tournament is about learning the format. Save the triple-event push for tournament number two.' +
    '</div>'
  );
}

function moreComingBodyHtml() {
  return (
    '<p>Future Learn-tab additions queued (KB-0040 Phase L3+):</p>' +
    '<ul>' +
      '<li><strong>Equipment</strong> — USAP-approved paddle reference (informational; no commerce, no reviews).</li>' +
      '<li><strong>Where to play</strong> — courts directory (Phase L4 — separate tab; new map integration pending).</li>' +
    '</ul>' +
    '<div class="tab-callout tip">' +
      '<div class="tab-callout-label">Have a topic in mind?</div>' +
      'Tell the project owner and it can drop into the curation backlog.' +
    '</div>'
  );
}

function sectionHtml(id, num, title, bodyHtml, opts = {}) {
  const open = opts.open ? ' open' : '';
  return (
    '<details class="tab-section" id="' + id + '"' + open + '>' +
      '<summary>' + num + '. ' + escapeHtml(title) + '</summary>' +
      '<div class="tab-section-body">' + bodyHtml + '</div>' +
    '</details>'
  );
}

export async function renderLearn(root, snapshot) {
  root.innerHTML = '<div class="loading">Loading Learn…</div>';

  let rules = null;
  let history = null;
  let glossary = null;
  try { rules = await loadMaster('rules-changes-2026'); } catch (e) { console.warn('rules load', e); }
  try { history = await loadMaster('history-seed'); } catch (e) { console.warn('history load', e); }
  try { glossary = await loadMaster('glossary'); } catch (e) { console.warn('glossary load', e); }

  const sections = [
    { id: 'learn-rules',      num: 1, title: 'Rules & Authority',   body: rulesAndAuthorityBodyHtml(rules), open: true },
    { id: 'learn-history',    num: 2, title: 'History',              body: historyBodyHtml(history) },
    { id: 'learn-glossary',   num: 3, title: 'Glossary',             body: glossaryBodyHtml(glossary) },
    { id: 'learn-etiquette',  num: 4, title: 'Court Etiquette',      body: etiquetteBodyHtml() },
    { id: 'learn-dupr',       num: 5, title: 'DUPR Explainer',       body: duprExplainerBodyHtml() },
    { id: 'learn-tournament', num: 6, title: 'Tournament Prep',      body: tournamentPrepBodyHtml() },
    { id: 'learn-more',       num: 7, title: 'More coming',          body: moreComingBodyHtml() }
  ];

  const tocItems = sections.map(s =>
    '<li><a href="#' + s.id + '">' + s.num + '. ' + escapeHtml(s.title) + '</a></li>'
  ).join('');

  let html = '';
  html += '<h2 class="section-title">Learn</h2>';
  html += '<p class="learn-intro">Rules, governance, history, terminology, etiquette, ratings, and tournament prep. Click any section to expand.</p>';
  html += (
    '<nav class="tab-toc" aria-label="Learn tab sections">' +
      '<div class="tab-toc-title">Jump to section</div>' +
      '<ol>' + tocItems + '</ol>' +
    '</nav>'
  );
  html += sections.map(s => sectionHtml(s.id, s.num, s.title, s.body, { open: s.open })).join('');

  root.innerHTML = html;
}
