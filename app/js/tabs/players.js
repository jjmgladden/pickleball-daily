// players.js — universal player directory (search + favorites + compare).
// KB-0004 Session 8: consumes derived `snapshot.sources.playersIndex` when present
// (seed + MLP rosters + PPA top-200), with fallback to bare seed when index missing.
// Session 11: adds inline Compare checkbox + 2-up comparison view (Decision 2 bundle).

import { escapeHtml, confidenceBadgeHtml } from '../components/confidence-badge.js';
import { getFavorites, togglePlayer } from '../components/favorites.js';
import { loadMaster, loadRankingHistory } from '../data-loader.js';
import {
  getSelected as getCmpSelected,
  isSelected as isCmpSelected,
  toggleSelected as toggleCmpSelected,
  clearSelected as clearCmpSelected,
  renderComparisonHtml,
} from '../components/player-compare.js';
import { renderPlayerDetailHtml } from './player-detail.js';

function sourceChips(p) {
  const out = [];
  if (p.fromSeed) out.push('<span class="src-chip src-seed" title="In curated seed list">SEED</span>');
  const srcs = p.sources || [];
  if (srcs.includes('mlp')) out.push('<span class="src-chip src-mlp" title="MLP rostered player">MLP</span>');
  if (srcs.includes('ppa')) {
    const rank = (p.ppaRank != null) ? ' #' + p.ppaRank : '';
    out.push('<span class="src-chip src-ppa" title="PPA Tour ranked player">PPA' + rank + '</span>');
  }
  return out.join('');
}

export async function renderPlayers(root, snapshot) {
  root.innerHTML = '<div class="loading">Loading players…</div>';

  // Prefer the derived index when present; fall back to seed-only.
  let players = [];
  let counts = null;
  const idx = snapshot && snapshot.sources && snapshot.sources.playersIndex;
  if (idx && idx.ok && Array.isArray(idx.players) && idx.players.length) {
    players = idx.players;
    counts = idx.sourceCounts || null;
  } else {
    try {
      const master = await loadMaster('players-seed');
      players = (master.players || []).map(p => ({
        playerId: p.playerId,
        displayName: p.displayName,
        sources: ['seed'],
        country: p.country,
        mlpTeam: p.mlpTeam2026,
        duprDoubles: p.duprDoubles,
        duprSingles: p.duprSingles,
        ppaPlayerUrl: p.ppaPlayerUrl,
        wikipediaUrl: p.wikipediaUrl,
        ppaRankFlag: p.ppaRankFlag,
        knownFor: p.knownFor,
        handedness: p.handedness,
        confidence: p.confidence,
        fromSeed: true,
      }));
    } catch (e) {
      root.innerHTML = '<div class="error">Could not load players index or seed: ' + escapeHtml(e.message) + '</div>';
      return;
    }
  }

  const playersById = {};
  for (const p of players) playersById[p.playerId] = p;

  // Phase C5: per-player time-series for the comparison Rank Trend row.
  const rankingHistoryById = {};
  try {
    const rh = await loadRankingHistory();
    if (rh && Array.isArray(rh.players)) {
      for (const r of rh.players) rankingHistoryById[r.playerId] = r.history;
    }
  } catch (e) { /* non-fatal — comparison row falls back to muted placeholder */ }

  // Three view states inside this tab: 'list', 'compare', 'detail'.
  let viewState = 'list';
  let detailPlayerId = null;

  function renderListView() {
    const favs = getFavorites();
    const sel = getCmpSelected();
    const countsLine = counts
      ? '<div class="muted">' + counts.seed + ' curated · ' + counts.mlp + ' MLP roster · ' + counts.ppa + ' PPA-ranked · ' + players.length + ' total</div>'
      : '<div class="muted">' + players.length + ' total</div>';

    const cmpBanner = (sel.length === 2)
      ? '<div class="cmp-banner" id="cmp-banner">' +
          '<span><strong>2 selected:</strong> ' + escapeHtml(playersById[sel[0]]?.displayName || sel[0]) +
          ' vs ' + escapeHtml(playersById[sel[1]]?.displayName || sel[1]) + '</span> ' +
          '<button id="cmp-open" class="cmp-cta">Compare these 2 →</button> ' +
          '<button id="cmp-clear" class="cmp-clear">Clear</button>' +
        '</div>'
      : (sel.length === 1)
        ? '<div class="cmp-banner cmp-banner-hint" id="cmp-banner">' +
            '<span><strong>1 selected:</strong> pick one more to compare</span> ' +
            '<button id="cmp-clear" class="cmp-clear">Clear</button>' +
          '</div>'
        : '';

    const header =
      '<h2 class="section-title">Players (' + players.length + ')</h2>' +
      countsLine +
      cmpBanner +
      '<input id="player-filter" type="search" placeholder="Filter by name…" ' +
      'style="width:100%;padding:8px 10px;background:var(--bg-2);color:var(--text);border:1px solid var(--border);border-radius:8px;margin:10px 0 12px">' +
      '<div id="player-list"></div>';

    root.innerHTML = header;

    function renderRows(filter) {
      const q = (filter || '').trim().toLowerCase();
      const list = players.filter(p => !q || (p.displayName || '').toLowerCase().includes(q));
      const node = root.querySelector('#player-list');
      if (!list.length) { node.innerHTML = '<div class="empty">No matches.</div>'; return; }
      const selNow = getCmpSelected();
      const cmpFull = selNow.length >= 2;
      node.innerHTML = list.map(p => {
        const isFav = favs.players.includes(p.playerId);
        const checked = isCmpSelected(p.playerId);
        const disabled = !checked && cmpFull;
        const rating = (p.duprDoubles != null)
          ? '<span class="chip-rating">' + escapeHtml(String(p.duprDoubles)) + '</span>'
          : '';
        const rankFlag = p.ppaRankFlag
          ? '<span class="chip-rank">' + escapeHtml(String(p.ppaRankFlag)) + '</span>'
          : '';
        const profileLinks = [];
        if (p.ppaPlayerUrl) profileLinks.push('<a class="profile-link" href="' + escapeHtml(p.ppaPlayerUrl) + '" target="_blank" rel="noopener">PPA profile ↗</a>');
        if (p.wikipediaUrl) profileLinks.push('<a class="profile-link" href="' + escapeHtml(p.wikipediaUrl) + '" target="_blank" rel="noopener">Wikipedia ↗</a>');
        if (p.mlpProfileUrl && !p.ppaPlayerUrl) profileLinks.push('<a class="profile-link" href="' + escapeHtml(p.mlpProfileUrl) + '" target="_blank" rel="noopener">MLP profile ↗</a>');
        const profileRow = profileLinks.length
          ? '<div class="profile-row">' + profileLinks.join(' · ') + '</div>'
          : '';
        const ageNode = (p.age != null) ? '<span class="meta">age ' + escapeHtml(String(p.age)) + '</span>' : '';
        const ptsNode = (p.ppaPoints != null) ? '<span class="meta">' + Number(p.ppaPoints).toLocaleString() + ' pts</span>' : '';
        const cmpToggle =
          '<label class="cmp-toggle' + (disabled ? ' cmp-toggle-disabled' : '') + '" title="' +
            (disabled ? 'Two players already selected' : 'Add to comparison') + '">' +
            '<input type="checkbox" data-cmp="' + escapeHtml(p.playerId) + '"' +
              (checked ? ' checked' : '') + (disabled ? ' disabled' : '') + '>' +
            '<span>Compare</span>' +
          '</label>';
        return '<div class="card' + (checked ? ' card-cmp-selected' : '') + '">' +
          '<h3>' +
            '<button class="player-name-btn" data-open="' + escapeHtml(p.playerId) + '" title="View detail">' +
              escapeHtml(p.displayName) +
            '</button>' +
            (p.confidence ? confidenceBadgeHtml(p.confidence) : '') +
            ' <button data-fav="' + escapeHtml(p.playerId) + '" ' +
            'style="background:transparent;border:none;color:' + (isFav ? 'var(--accent)' : 'var(--text-dim)') + ';cursor:pointer;font-size:1rem">' +
            (isFav ? '★' : '☆') + '</button>' +
            ' <span class="src-chips">' + sourceChips(p) + '</span>' +
            ' ' + cmpToggle +
          '</h3>' +
          '<div class="stats-row">' + rankFlag + ' ' + rating + ' ' + ageNode + ' ' + ptsNode +
            (p.country ? ' <span class="meta">' + escapeHtml(p.country) + '</span>' : '') +
            (p.mlpTeam ? ' <span class="meta">MLP: ' + escapeHtml(p.mlpTeam) + '</span>' : '') +
          '</div>' +
          (p.knownFor ? '<div class="meta">' + escapeHtml(p.knownFor) + '</div>' : '') +
          profileRow +
        '</div>';
      }).join('');

      node.querySelectorAll('[data-fav]').forEach(btn => {
        btn.addEventListener('click', () => {
          togglePlayer(btn.dataset.fav);
          renderListView();
          // Re-apply current filter after re-render.
          const f = root.querySelector('#player-filter');
          if (f) f.value = filter || '';
        });
      });

      node.querySelectorAll('[data-cmp]').forEach(box => {
        box.addEventListener('change', () => {
          const ok = toggleCmpSelected(box.dataset.cmp);
          if (!ok) box.checked = false; // rejected — already at MAX_SELECTED
          renderListView();
          const f = root.querySelector('#player-filter');
          if (f) f.value = filter || '';
        });
      });

      node.querySelectorAll('[data-open]').forEach(btn => {
        btn.addEventListener('click', () => {
          detailPlayerId = btn.dataset.open;
          viewState = 'detail';
          renderDetailView();
        });
      });
    }

    const openBtn = root.querySelector('#cmp-open');
    if (openBtn) openBtn.addEventListener('click', () => {
      viewState = 'compare';
      renderCompareView();
    });
    const clearBtn = root.querySelector('#cmp-clear');
    if (clearBtn) clearBtn.addEventListener('click', () => {
      clearCmpSelected();
      renderListView();
    });

    root.querySelector('#player-filter').addEventListener('input', (e) => renderRows(e.target.value));
    renderRows('');
  }

  function renderCompareView() {
    const sel = getCmpSelected();
    if (sel.length !== 2) {
      viewState = 'list';
      renderListView();
      return;
    }
    const [aId, bId] = sel;
    const a = playersById[aId];
    const b = playersById[bId];
    root.innerHTML =
      '<div class="cmp-toolbar">' +
        '<button id="cmp-back" class="cmp-back">← Back to all players</button>' +
      '</div>' +
      '<h2 class="section-title">Compare Players</h2>' +
      renderComparisonHtml(a, b, { history: rankingHistoryById });

    root.querySelector('#cmp-back').addEventListener('click', () => {
      viewState = 'list';
      renderListView();
    });
  }

  function renderDetailView() {
    const p = playersById[detailPlayerId];
    if (!p) {
      viewState = 'list';
      renderListView();
      return;
    }
    const history = rankingHistoryById[detailPlayerId] || [];
    root.innerHTML = renderPlayerDetailHtml(p, history);
    const back = root.querySelector('#pd-back');
    if (back) back.addEventListener('click', () => {
      viewState = 'list';
      detailPlayerId = null;
      renderListView();
    });
  }

  // Initial render.
  if (viewState === 'compare' && getCmpSelected().length === 2) renderCompareView();
  else renderListView();
}
