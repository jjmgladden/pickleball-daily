// tournaments.js — event calendar (PPA + MLP).

import { escapeHtml, confidenceBadgeHtml } from '../components/confidence-badge.js';
import { fmtDateShort } from '../components/date-utils.js';

const PB_HOME = 'https://pickleballbrackets.com/';

function bracketsLink(e) {
  const url = e.pickleballBracketsUrl || PB_HOME;
  const label = e.pickleballBracketsUrl ? 'Live brackets ↗' : 'PickleballBrackets ↗';
  return ' <a href="' + escapeHtml(url) + '" target="_blank" rel="noopener" class="cta-live">▶ ' + label + '</a>';
}

function card(e, opts) {
  const live = !!(opts && opts.live);
  const when = fmtDateShort(e.startDate) + ' – ' + fmtDateShort(e.endDate);
  const loc = [e.city, e.state].filter(Boolean).join(', ');
  const siteLink = (e.sources && e.sources[0] && e.sources[0].url)
    ? ' <a href="' + escapeHtml(e.sources[0].url) + '" target="_blank" rel="noopener">site ↗</a>' : '';
  const linksRow = (live ? bracketsLink(e) : '') + siteLink;
  return '<div class="card' + (live ? ' card-live' : '') + '">' +
    '<h3>' + escapeHtml(e.displayName) + confidenceBadgeHtml(e.confidence) + '</h3>' +
    '<div class="meta">' + when + (loc ? ' · ' + escapeHtml(loc) : '') + '</div>' +
    '<div class="stats-row">' +
      (e.circuit ? '<span><strong>' + escapeHtml(e.circuit) + '</strong></span>' : '') +
      (e.tier ? '<span>Tier: ' + escapeHtml(e.tier) + '</span>' : '') +
      (e.purseUsd ? '<span>Purse: $' + Number(e.purseUsd).toLocaleString() + '</span>' : '') +
    '</div>' +
    (linksRow ? '<div class="meta" style="margin-top:6px">' + linksRow + '</div>' : '') +
  '</div>';
}

export function renderTournaments(root, snapshot) {
  const buckets = (snapshot && snapshot.sources && snapshot.sources.tournaments && snapshot.sources.tournaments.buckets) || {};
  const up = buckets.upcoming || [];
  const ip = buckets.inProgress || [];
  const rec = buckets.recent || [];
  root.innerHTML =
    '<h2 class="section-title">In Progress</h2>' +
      (ip.length ? ip.map(e => card(e, { live: true })).join('') : '<div class="empty">None.</div>') +
    '<h2 class="section-title">Upcoming (30 days)</h2>' +
      (up.length ? up.map(e => card(e)).join('') : '<div class="empty">None.</div>') +
    '<h2 class="section-title">Recently Finished (7 days)</h2>' +
      (rec.length ? rec.map(e => card(e)).join('') : '<div class="empty">None.</div>');
}
