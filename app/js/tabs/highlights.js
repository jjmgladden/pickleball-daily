// highlights.js (tab) — recent YouTube uploads from the official-channel allowlist.

import { escapeHtml } from '../components/confidence-badge.js';
import { renderVideoCard } from '../components/highlights.js';

export function renderHighlights(root, snapshot) {
  const h = (snapshot && snapshot.sources && snapshot.sources.highlights) || {};
  const channels = h.channels || [];
  if (!channels.length) {
    root.innerHTML =
      '<h2 class="section-title">Highlights</h2>' +
      '<div class="empty">No highlights (YouTube API pull failed or no channels returned videos).</div>';
    return;
  }

  let html = '<h2 class="section-title">Highlights</h2>';
  for (const ch of channels) {
    html += '<h2 class="section-title">' + escapeHtml(ch.channelTitle || ch.channelSourceId) + '</h2>';
    const vids = ch.videos || [];
    if (!vids.length) {
      html += '<div class="empty">No recent videos.</div>';
    } else {
      html += '<div class="list-grid">' + vids.map(v => renderVideoCard(v, ch.channelTitle)).join('') + '</div>';
    }
  }

  if ((h.errors || []).length) {
    html += '<div class="muted">Some channels errored: ' +
      h.errors.map(e => escapeHtml(e.id + ' (' + e.reason + ')')).join(', ') + '</div>';
  }

  root.innerHTML = html;
}
