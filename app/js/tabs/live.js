// live.js — in-progress matches. Phase 1 stub: displays in-progress events with deep-links to PickleballBrackets for live scoring; per-match reconciliation is Phase 2.

import { escapeHtml, confidenceBadgeHtml } from '../components/confidence-badge.js';

const PB_HOME = 'https://pickleballbrackets.com/';

export function renderLive(root, snapshot) {
  const buckets = (snapshot && snapshot.sources && snapshot.sources.tournaments && snapshot.sources.tournaments.buckets) || {};
  const events = buckets.inProgress || [];
  if (events.length === 0) {
    root.innerHTML =
      '<h2 class="section-title">Live Matches</h2>' +
      '<div class="empty">No events currently in progress. When one starts, you\u2019ll see a live-brackets link here.</div>';
    return;
  }
  root.innerHTML =
    '<h2 class="section-title">Events In Progress</h2>' +
    events.map(e => {
      const pb = e.pickleballBracketsUrl || PB_HOME;
      const pbLabel = e.pickleballBracketsUrl ? 'Open live brackets ↗' : 'Find on PickleballBrackets ↗';
      const siteLink = (e.sources && e.sources[0] && e.sources[0].url)
        ? ' · <a href="' + escapeHtml(e.sources[0].url) + '" target="_blank" rel="noopener">Event page ↗</a>'
        : '';
      return '<div class="card card-live">' +
        '<h3>' + escapeHtml(e.displayName) + confidenceBadgeHtml(e.confidence) + '</h3>' +
        '<div class="meta">' + escapeHtml(e.city || '') + (e.state ? ', ' + escapeHtml(e.state) : '') +
          (e.venue ? ' · ' + escapeHtml(e.venue) : '') + '</div>' +
        '<div class="stats-row">' +
          '<a href="' + escapeHtml(pb) + '" target="_blank" rel="noopener" class="cta-live">▶ ' + pbLabel + '</a>' +
          siteLink +
        '</div>' +
      '</div>';
    }).join('') +
    '<div class="muted">Per-match live scoring reconciliation is a Phase 2 task.</div>';
}
