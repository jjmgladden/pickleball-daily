// app.js — bootstrap: tab routing + SW registration + data load.
//
// APP_VERSION must stay in sync with `CACHE` in app/sw.js. When a shell-file change rolls the
// SW cache version, update this constant in the same commit.

const APP_VERSION = 'v8';

import { loadSnapshot } from './data-loader.js';
import { showSplashIfFirstVisit } from './components/splash.js';
import { renderDaily }       from './tabs/daily.js';
import { renderLive }        from './tabs/live.js';
import { renderTournaments } from './tabs/tournaments.js';
import { renderTeams }       from './tabs/teams.js';
import { renderPlayers }     from './tabs/players.js';
import { renderRankings }    from './tabs/rankings.js';
import { renderRatings }     from './tabs/ratings.js';
import { renderHighlights }  from './tabs/highlights.js';
import { renderNews }        from './tabs/news.js';
import { renderLearn }       from './tabs/learn.js';

const RENDERERS = {
  daily:       renderDaily,
  live:        renderLive,
  tournaments: renderTournaments,
  teams:       renderTeams,
  players:     renderPlayers,
  rankings:    renderRankings,
  ratings:     renderRatings,
  highlights:  renderHighlights,
  news:        renderNews,
  learn:       renderLearn
};

function setTab(name) {
  document.querySelectorAll('nav.tabs button').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === name);
    b.setAttribute('aria-pressed', b.dataset.tab === name ? 'true' : 'false');
  });
  document.querySelectorAll('section.tab-panel').forEach(s => {
    s.classList.toggle('active', s.id === 'tab-' + name);
  });
  try { location.hash = '#' + name; } catch {}
}

function wireTabs() {
  document.querySelectorAll('nav.tabs button').forEach(b => {
    b.addEventListener('click', () => setTab(b.dataset.tab));
  });
  const initial = (location.hash || '').replace('#', '') || 'daily';
  setTab(RENDERERS[initial] ? initial : 'daily');
}

function setHeader(snapshot) {
  const version = document.getElementById('app-version');
  if (version) version.textContent = APP_VERSION;

  const meta = document.getElementById('header-meta');
  if (!meta) return;
  if (!snapshot) {
    meta.textContent = 'Data unavailable (run `npm run fetch:daily`)';
    meta.style.color = '#ff8a8a';
    return;
  }
  const d = new Date(snapshot.generatedAt);
  const dateTxt = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  const timeTxt = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  meta.textContent = dateTxt + ' · snapshot ' + timeTxt;
}

async function renderAll(snapshot) {
  for (const [name, fn] of Object.entries(RENDERERS)) {
    const el = document.getElementById('tab-' + name);
    if (!el) continue;
    try {
      fn(el, snapshot);
    } catch (e) {
      el.innerHTML = '<div class="error">Render error in <code>' + name + '</code>: ' + escapeHtml(e.message) + '</div>';
      console.error('tab ' + name, e);
    }
  }
}

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

async function boot() {
  wireTabs();
  showSplashIfFirstVisit();

  let snapshot = null;
  try { snapshot = await loadSnapshot(); }
  catch (e) { console.warn('snapshot load failed', e); }

  setHeader(snapshot);
  await renderAll(snapshot);

  // SW registration — last so it never blocks rendering.
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js', { scope: './' })
        .catch(err => console.warn('SW register failed:', err));
    });
  }
}

if (typeof document !== 'undefined') boot();
