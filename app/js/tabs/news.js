// news.js (tab) — curated headlines from T1/T2 newsletter sources via RSS.
// Bucketed by date: Today / This Week / Recent. Each item links out.

import { escapeHtml } from '../components/confidence-badge.js';
import { renderNewsCard, bucketNews } from '../components/news-card.js';

export function renderNews(root, snapshot) {
  const news = (snapshot && snapshot.sources && snapshot.sources.news) || {};
  const items = news.items || [];
  const sources = news.sources || [];

  const sourceLine = sources.length
    ? sources.map(s => escapeHtml(s.sourceName || s.sourceId) + (s.ok ? ' (' + (s.count || 0) + ')' : ' (error)')).join(' · ')
    : '';

  if (!items.length) {
    root.innerHTML =
      '<h2 class="section-title">News</h2>' +
      '<div class="empty">No news items (RSS pull returned no items or both sources errored).</div>' +
      (sourceLine ? '<div class="muted">Sources: ' + sourceLine + '</div>' : '');
    return;
  }

  const { today, thisWeek, recent } = bucketNews(items);

  let html = '<h2 class="section-title">News</h2>';
  html += '<div class="muted news-sources-line">From: ' + sourceLine + '</div>';

  if (today.length) {
    html += '<h3 class="section-subtitle">Today</h3>';
    html += '<div class="news-list">' + today.map(renderNewsCard).join('') + '</div>';
  }
  if (thisWeek.length) {
    html += '<h3 class="section-subtitle">This Week</h3>';
    html += '<div class="news-list">' + thisWeek.map(renderNewsCard).join('') + '</div>';
  }
  if (recent.length) {
    html += '<h3 class="section-subtitle">Recent</h3>';
    html += '<div class="news-list">' + recent.map(renderNewsCard).join('') + '</div>';
  }

  if ((news.errors || []).length) {
    html += '<div class="muted">Some sources errored: ' +
      news.errors.map(e => escapeHtml(e.sourceId + ' (' + e.message + ')')).join(', ') + '</div>';
  }

  root.innerHTML = html;
}
