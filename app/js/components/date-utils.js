// date-utils.js — date parsing/formatting helpers.
// Plain YYYY-MM-DD strings must parse as local midnight, not UTC, so that
// west-of-UTC viewers don't see dates shifted one day earlier (KB-0016).

export function parseLocalDate(ymd) {
  if (typeof ymd === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(ymd)) {
    const [y, m, d] = ymd.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(ymd);
}

export function fmtDateShort(ymd) {
  if (!ymd) return '—';
  try {
    return parseLocalDate(ymd).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return String(ymd);
  }
}
