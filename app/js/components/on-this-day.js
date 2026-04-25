// on-this-day.js — match today's calendar date against history-seed.json milestones.
// Pickleball history is sparse (60-year-old sport), so most days will have no match
// and the module collapses. When matches exist, show all of them.
//
// Date shape in history-seed.json: "YYYY-MM-DD" or "YYYY-MM-00" or "YYYY-00-00".
// "00" placeholders mean the day or month is unknown — skip those for matching.
// We match strictly on MM-DD (ignoring year).

import { escapeHtml, confidenceBadgeHtml } from './confidence-badge.js';

export function findOnThisDay(milestones, refDate = new Date()) {
  if (!Array.isArray(milestones)) return [];
  const mm = String(refDate.getMonth() + 1).padStart(2, '0');
  const dd = String(refDate.getDate()).padStart(2, '0');
  const matches = [];
  for (const m of milestones) {
    if (!m.date || typeof m.date !== 'string') continue;
    const parts = m.date.split('-');
    if (parts.length < 3) continue;
    const [, mPart, dPart] = parts;
    if (mPart === '00' || dPart === '00') continue;
    if (mPart === mm && dPart === dd) matches.push(m);
  }
  // Newest first (more recent context tends to be more relevant).
  matches.sort((a, b) => (b.year || 0) - (a.year || 0));
  return matches;
}

function milestoneRowHtml(m) {
  const yearsAgo = m.year ? new Date().getFullYear() - m.year : null;
  const yearLabel = m.year ? String(m.year) + (yearsAgo > 0 ? ' (' + yearsAgo + ' yr ago)' : '') : '';
  const badge = confidenceBadgeHtml(m.confidence);
  const loc = m.location ? '<span class="meta"> · ' + escapeHtml(m.location) + '</span>' : '';
  return (
    '<div class="otd-item">' +
      '<div class="otd-year">' + escapeHtml(yearLabel) + '</div>' +
      '<div class="otd-body">' +
        '<strong>' + escapeHtml(m.displayName || '') + '</strong>' + badge +
        '<div class="otd-summary">' + escapeHtml(m.summary || '') + '</div>' +
        (m.category ? '<div class="meta">' + escapeHtml(m.category) + loc + '</div>' : '') +
      '</div>' +
    '</div>'
  );
}

export function renderOnThisDayHtml(milestones, refDate = new Date()) {
  const matches = findOnThisDay(milestones, refDate);
  if (!matches.length) return '';
  return (
    '<h2 class="section-title">On This Day in Pickleball</h2>' +
    '<div class="card otd-card">' +
      matches.map(milestoneRowHtml).join('') +
    '</div>'
  );
}
