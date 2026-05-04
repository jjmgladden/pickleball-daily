// on-this-day.js — surface a milestone for today.
// Pickleball history is sparse (60-year-old sport) and most seed entries have
// "MM-00" or "0000-00-00" placeholders, so exact-date matches are rare. This
// module degrades gracefully through four fallback levels so the section
// always shows something:
//   1. SAME_DAY      — exact MM-DD match
//   2. SAME_WEEK     — within ±3 days of today (requires full date)
//   3. SAME_MONTH    — same MM (DD may be "00")
//   4. ROTATING      — deterministic daily rotation through all milestones
//
// Each level renders with its own header so the user understands what they
// are seeing. The non-same-day fallback levels cap at 3 entries to avoid
// flooding the home page on dense months.

import { escapeHtml, confidenceBadgeHtml } from './confidence-badge.js';

const FALLBACK_CAP = 3;
const WEEK_RADIUS_DAYS = 3;

function pad2(n) { return String(n).padStart(2, '0'); }

function parseDateParts(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const parts = dateStr.split('-');
  if (parts.length < 3) return null;
  const year = parseInt(parts[0], 10);
  const month = parts[1];
  const day = parts[2];
  if (!Number.isFinite(year)) return null;
  return { year, month, day };
}

function findSameDay(milestones, refDate) {
  const mm = pad2(refDate.getMonth() + 1);
  const dd = pad2(refDate.getDate());
  return milestones.filter(m => {
    const p = parseDateParts(m.date);
    if (!p) return false;
    return p.month === mm && p.day === dd;
  });
}

function findSameWeek(milestones, refDate) {
  const refYear = refDate.getFullYear();
  const lo = new Date(refDate); lo.setDate(refDate.getDate() - WEEK_RADIUS_DAYS);
  const hi = new Date(refDate); hi.setDate(refDate.getDate() + WEEK_RADIUS_DAYS);
  // Compare on MM-DD only (year-agnostic). Use refYear as the projection year for the milestone.
  return milestones.filter(m => {
    const p = parseDateParts(m.date);
    if (!p) return false;
    if (p.month === '00' || p.day === '00') return false;
    const mNum = parseInt(p.month, 10);
    const dNum = parseInt(p.day, 10);
    if (!Number.isFinite(mNum) || !Number.isFinite(dNum)) return false;
    const projected = new Date(refYear, mNum - 1, dNum);
    if (projected >= lo && projected <= hi) {
      // Exclude the exact same-day match (already surfaced at level 1).
      const sameMM = pad2(refDate.getMonth() + 1);
      const sameDD = pad2(refDate.getDate());
      if (p.month === sameMM && p.day === sameDD) return false;
      return true;
    }
    return false;
  });
}

function findSameMonth(milestones, refDate) {
  const mm = pad2(refDate.getMonth() + 1);
  return milestones.filter(m => {
    const p = parseDateParts(m.date);
    if (!p) return false;
    if (p.month !== mm) return false;
    // Exclude entries already qualified for level 1 (same-day) — level 2 (same-week)
    // is allowed to overlap with level 3 only when level 2 produced nothing, but the
    // simpler rule (drop only same-day) keeps month-level results readable.
    const sameDD = pad2(refDate.getDate());
    if (p.day === sameDD) return false;
    return true;
  });
}

function findRotating(milestones, refDate) {
  if (!milestones.length) return [];
  // Deterministic: day-of-year (0–365) mod milestone count picks today's index.
  const start = new Date(refDate.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((refDate - start) / 86400000);
  const idx = ((dayOfYear % milestones.length) + milestones.length) % milestones.length;
  return [milestones[idx]];
}

// Public API: returns { level, label, items } for the highest-priority level
// that produced any results. Always returns something when milestones is non-empty.
export function findOnThisDay(milestones, refDate = new Date()) {
  if (!Array.isArray(milestones) || !milestones.length) {
    return { level: 'NONE', label: '', items: [] };
  }
  // Newest first across the dataset (more recent context tends to be more relevant).
  const sorted = [...milestones].sort((a, b) => (b.year || 0) - (a.year || 0));

  const sameDay = findSameDay(sorted, refDate);
  if (sameDay.length) {
    return { level: 'SAME_DAY', label: 'On This Day in Pickleball', items: sameDay };
  }
  const sameWeek = findSameWeek(sorted, refDate);
  if (sameWeek.length) {
    return { level: 'SAME_WEEK', label: 'This Week in Pickleball', items: sameWeek.slice(0, FALLBACK_CAP) };
  }
  const sameMonth = findSameMonth(sorted, refDate);
  if (sameMonth.length) {
    return { level: 'SAME_MONTH', label: 'This Month in Pickleball', items: sameMonth.slice(0, FALLBACK_CAP) };
  }
  const rotating = findRotating(sorted, refDate);
  if (rotating.length) {
    return { level: 'ROTATING', label: 'From Pickleball History', items: rotating };
  }
  return { level: 'NONE', label: '', items: [] };
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
  const result = findOnThisDay(milestones, refDate);
  if (!result.items.length) return '';
  return (
    '<h2 class="section-title">' + escapeHtml(result.label) + '</h2>' +
    '<div class="card otd-card">' +
      result.items.map(milestoneRowHtml).join('') +
    '</div>'
  );
}
