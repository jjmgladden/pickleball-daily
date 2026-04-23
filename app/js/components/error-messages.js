// error-messages.js — plain-English error copy for tab-level failures.
// Severity gating: partial failures stay silent when not user-impacting;
// total failures render one calm banner, never a wall of red.
// Fallback: render yesterday's snapshot with an "As of {timestamp}" tag — snapshots are append-only.

const DEV_ONLY_CODES = new Set([
  'seed-missing',
  'no-youtube-key',
  'no-handle-available',
]);

const MESSAGES = {
  'playwright-not-installed': 'Rankings system is updating — usually back within an hour.',
  'http-429':                 '{source} site is briefly rate-limiting — try again later today.',
  'http-503':                 '{source} site is briefly unavailable — try again later today.',
  'http-504':                 '{source} site is briefly unavailable — try again later today.',
  'fetch-failed':             '{source} site could not be reached — check back soon.',
  'parse-failed':             '{source} data format changed — ingestion will adapt on the next run.',
};

function formatMessage(code, context) {
  const tmpl = MESSAGES[code];
  const source = (context && context.source) || 'This';
  if (!tmpl) {
    const ts = context && context.lastGoodTimestamp
      ? ' Last good data from ' + context.lastGoodTimestamp + '.'
      : '';
    return 'Data temporarily unavailable.' + ts;
  }
  return tmpl.replace('{source}', source);
}

// Returns plain-English user copy for an error code, or null if the code is
// dev-only (a signal to callers to render nothing and keep the UI quiet).
export function friendlyErrorMessage(code, context) {
  if (!code) return null;
  if (DEV_ONLY_CODES.has(code)) return null;
  // Normalize common HTTP-prefix codes ("http-503 Service Unavailable" -> "http-503")
  const normalized = /^http-\d{3}/.test(code) ? code.match(/^http-\d{3}/)[0] : code;
  return formatMessage(normalized, context);
}

// Renders a subtle banner (not a red wall) with the plain-English message.
// Skip entirely when friendlyErrorMessage returns null (dev-only code).
export function errorBannerHtml(code, context) {
  const msg = friendlyErrorMessage(code, context);
  if (!msg) return '';
  return '<div class="soft-banner">' + escapeForBanner(msg) + '</div>';
}

// Renders an "as of {timestamp}" freshness tag when falling back to older data.
export function freshnessTagHtml(timestamp) {
  if (!timestamp) return '';
  return '<div class="muted freshness-tag">As of ' + escapeForBanner(timestamp) + '.</div>';
}

function escapeForBanner(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);
}
