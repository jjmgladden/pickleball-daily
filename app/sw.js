// sw.js — service worker for Ozark Joe's Pickleball Daily Intelligence Report.
// RULE: any commit touching SHELL_FILES MUST bump CACHE in the same commit (CLAUDE.md Critical Rule).
// Paired: `APP_VERSION` in app/js/app.js must match this CACHE version (owner-visible app version).

const CACHE = 'pickleball-daily-v12';

const SHELL_FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon.svg',
  './icons/apple-touch-icon-180x180.png',
  './icons/apple-touch-icon-167x167.png',
  './icons/apple-touch-icon-152x152.png',
  './icons/apple-touch-icon-120x120.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './styles/main.css',
  './js/app.js',
  './js/data-loader.js',
  './js/components/confidence-badge.js',
  './js/components/date-utils.js',
  './js/components/error-messages.js',
  './js/components/explainer.js',
  './js/components/rating-card.js',
  './js/components/ranking-card.js',
  './js/components/favorites.js',
  './js/components/highlights.js',
  './js/components/live-scoreboard.js',
  './js/components/news-card.js',
  './js/components/on-this-day.js',
  './js/components/splash.js',
  './js/tabs/daily.js',
  './js/tabs/live.js',
  './js/tabs/tournaments.js',
  './js/tabs/teams.js',
  './js/tabs/players.js',
  './js/tabs/rankings.js',
  './js/tabs/ratings.js',
  './js/tabs/stats.js',
  './js/tabs/highlights.js',
  './js/tabs/news.js',
  './js/tabs/learn.js',
  './js/tabs/ask.js'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL_FILES).catch(() => {}))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

// Cache-first for shell, network-first for data (data/ path).
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Network-first for data snapshots (always try fresh)
  if (url.pathname.includes('/data/')) {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req, { cache: 'no-store' });
        return fresh;
      } catch {
        const cached = await caches.match(req);
        return cached || new Response(JSON.stringify({ error: 'offline-no-cache' }), {
          status: 503, headers: { 'Content-Type': 'application/json' }
        });
      }
    })());
    return;
  }

  // Cache-first for shell
  event.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;
    try {
      const fresh = await fetch(req);
      if (fresh.ok && url.origin === location.origin) {
        const cache = await caches.open(CACHE);
        cache.put(req, fresh.clone());
      }
      return fresh;
    } catch {
      return cached || new Response('offline', { status: 503 });
    }
  })());
});
