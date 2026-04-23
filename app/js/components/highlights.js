// highlights.js — YouTube thumbnail + click-out (default per KB-0006 / embedPolicy).
// Iframe rendering is conditional on Phase 1 live test — see future KB entry.

import { escapeHtml } from './confidence-badge.js';

export function renderVideoCard(v, channelTitle) {
  const thumb = v.thumbnail && v.thumbnail.url
    ? '<img src="' + escapeHtml(v.thumbnail.url) + '" alt="" loading="lazy">'
    : '<img alt="" loading="lazy">';
  const published = v.publishedAt
    ? new Date(v.publishedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : '—';
  return '<a class="card video-card" href="' + escapeHtml(v.url) + '" target="_blank" rel="noopener">' +
    thumb +
    '<div class="video-body">' +
      '<h4>' + escapeHtml(v.title || '—') + '</h4>' +
      '<div class="meta">' + escapeHtml(channelTitle || v.channelTitle || '—') + ' · ' + published + '</div>' +
    '</div>' +
  '</a>';
}
