// data-loader.js — fetch the latest snapshot + master seeds.
// All paths relative so the same build works local (port 1965) and on GitHub Pages.

async function fetchJson(url) {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('fetch ' + url + ' → HTTP ' + res.status);
  return res.json();
}

export async function loadSnapshot() {
  try {
    return await fetchJson('../data/snapshots/latest.json');
  } catch (e) {
    console.warn('No snapshot yet — falling back to seed-only view:', e.message);
    return null;
  }
}

export async function loadMaster(name) {
  return fetchJson('../data/master/' + name + '.json');
}

export async function loadRankingHistory() {
  try {
    return await fetchJson('../data/snapshots/ranking-history.json');
  } catch (e) {
    console.warn('No ranking-history yet — comparison trend rows will be empty:', e.message);
    return null;
  }
}
