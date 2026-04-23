// confidence-badge.js — T1/T2/T3/developing visual tier (KB-0002, ui-modules.json).

export function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function confidenceBadgeHtml(tier) {
  const t = (tier || '').toLowerCase();
  if (t === 't1') return '';                                    // T1 = no badge (normal render)
  if (t === 't2') return '<span class="badge-confidence t2">T2</span>';
  if (t === 't3') return '<span class="badge-confidence t3">editorial</span>';
  if (t === 'developing') return '<span class="badge-confidence developing">developing</span>';
  return '';
}
