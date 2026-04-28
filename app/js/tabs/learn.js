// learn.js (tab) — rules + history + governance reference.
// Pulls from data/master/rules-changes-2026.json + data/master/history-seed.json.
// Section numbers carry caveat per rules-changes-2026.json (verify against USAP PDF).
//
// KB-0040 Phase L1: TOC + accordion structure modeled on Travel Project Help tab.
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

function moreComingBodyHtml() {
  return (
    '<p>Future Learn-tab additions are queued (KB-0040 Phase L2+):</p>' +
    '<ul>' +
      '<li><strong>Glossary</strong> — pickleball terminology (dink, ATP, Erne, kitchen, third shot drop, …).</li>' +
      '<li><strong>Court etiquette</strong> — open-play courtesies + paddle-stack conventions.</li>' +
      '<li><strong>DUPR explainer</strong> — how ratings move + what the numbers mean.</li>' +
      '<li><strong>Tournament prep</strong> — what to expect at sanctioned events.</li>' +
      '<li><strong>Equipment</strong> — USAP-approved paddle reference (informational).</li>' +
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
  try { rules = await loadMaster('rules-changes-2026'); } catch (e) { console.warn('rules load', e); }
  try { history = await loadMaster('history-seed'); } catch (e) { console.warn('history load', e); }

  const sections = [
    { id: 'learn-rules',   num: 1, title: 'Rules & Authority', body: rulesAndAuthorityBodyHtml(rules), open: true },
    { id: 'learn-history', num: 2, title: 'History',           body: historyBodyHtml(history) },
    { id: 'learn-more',    num: 3, title: 'More coming',       body: moreComingBodyHtml() }
  ];

  const tocItems = sections.map(s =>
    '<li><a href="#' + s.id + '">' + s.num + '. ' + escapeHtml(s.title) + '</a></li>'
  ).join('');

  let html = '';
  html += '<h2 class="section-title">Learn</h2>';
  html += '<p class="learn-intro">Rules, governance, and history of pickleball. Click any section to expand.</p>';
  html += (
    '<nav class="tab-toc" aria-label="Learn tab sections">' +
      '<div class="tab-toc-title">Jump to section</div>' +
      '<ol>' + tocItems + '</ol>' +
    '</nav>'
  );
  html += sections.map(s => sectionHtml(s.id, s.num, s.title, s.body, { open: s.open })).join('');

  root.innerHTML = html;
}
