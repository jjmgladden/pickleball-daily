// favorites.js — localStorage-backed user favorites. Phase 1 stub; Phase 2 expands UI.

const KEY = 'pickleball-daily.favorites.v1';

function read() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}'); }
  catch { return {}; }
}

function write(obj) {
  try { localStorage.setItem(KEY, JSON.stringify(obj)); } catch {}
}

export function getFavorites() {
  const f = read();
  return {
    team: f.team || null,
    players: Array.isArray(f.players) ? f.players : []
  };
}

export function setFavoriteTeam(teamId) {
  const f = read();
  f.team = teamId || null;
  write(f);
}

export function togglePlayer(playerId) {
  const f = read();
  f.players = Array.isArray(f.players) ? f.players : [];
  const i = f.players.indexOf(playerId);
  if (i === -1) f.players.push(playerId);
  else f.players.splice(i, 1);
  write(f);
  return [...f.players];
}
