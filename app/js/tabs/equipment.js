// equipment.js — Gear tab > Equipment sub-tab content.
// (Internal route key remains "gear-courts" for stability; user-visible
//  label was renamed Gear & Courts → Gear in S12 after L4 deferral.)
// Renders three sections (TOC + flat scroll): Paddles · Balls · Nets specs.
// Per KB-0040 L3 / KB-0048: no commerce, no affiliate, no editorial reviews.
//
// Paddles: ~5,114 entries → search-driven (brand + model) + paginated (25/page).
// Balls:   ~368 entries → grouped by Indoor / Outdoor / Indoor & Outdoor.
// Nets:    written specification block (USAP doesn't publish a product list).

import { escapeHtml } from '../components/confidence-badge.js';
import { loadMaster } from '../data-loader.js';

const PADDLES_PER_PAGE = 25;

function formatDate(iso) {
  if (!iso) return '—';
  // ISO yyyy-mm-dd → "Apr 29, 2026"
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return iso;
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return months[parseInt(m[2], 10) - 1] + ' ' + parseInt(m[3], 10) + ', ' + m[1];
}

function paddleCardHtml(p) {
  const img = p.imageUrl
    ? '<div class="paddle-thumb-wrap">' +
        '<div class="paddle-thumb-placeholder" aria-hidden="true">🏓</div>' +
        '<img class="paddle-thumb" src="' + escapeHtml(p.imageUrl) + '" alt="" loading="lazy" onerror="this.style.display=\'none\'">' +
      '</div>'
    : '<div class="paddle-thumb-placeholder" aria-hidden="true">🏓</div>';

  const specRow = (label, val) => val
    ? '<div class="paddle-spec"><span class="paddle-spec-label">' + label + '</span> <span class="paddle-spec-value">' + escapeHtml(val) + '</span></div>'
    : '';

  const link = p.detailUrl
    ? '<a class="paddle-link" href="' + escapeHtml(p.detailUrl) + '" target="_blank" rel="noopener">View on USAP ↗</a>'
    : '';

  return (
    '<article class="paddle-card">' +
      img +
      '<div class="paddle-info">' +
        '<div class="paddle-brand">' + escapeHtml(p.brand || '—') + '</div>' +
        '<div class="paddle-model">' + escapeHtml(p.model || '—') + '</div>' +
        '<div class="paddle-added">Added ' + escapeHtml(formatDate(p.addedDate)) + '</div>' +
        '<div class="paddle-specs">' +
          specRow('Shape', p.shape) +
          specRow('Depth', p.depth) +
          specRow('Core', p.coreMaterial) +
          specRow('Face', p.faceMaterial) +
          specRow('Finish', p.finish) +
        '</div>' +
        link +
      '</div>' +
    '</article>'
  );
}

function paddlesSectionHtml() {
  return (
    '<section id="equipment-paddles" class="equipment-section">' +
      '<h3>Paddles</h3>' +
      '<div id="paddles-status" class="meta">Loading paddle data…</div>' +
      '<div class="paddle-controls">' +
        '<input id="paddle-search-brand" type="search" placeholder="Search brand…" aria-label="Search by brand" autocomplete="off">' +
        '<input id="paddle-search-model" type="search" placeholder="Search model…" aria-label="Search by model" autocomplete="off">' +
        '<select id="paddle-sort" aria-label="Sort order">' +
          '<option value="newest">Newest first</option>' +
          '<option value="oldest">Oldest first</option>' +
          '<option value="brand">Brand A–Z</option>' +
        '</select>' +
      '</div>' +
      '<div id="paddle-results-meta" class="meta"></div>' +
      '<div id="paddle-grid" class="paddle-grid"></div>' +
      '<div id="paddle-pagination" class="paddle-pagination"></div>' +
    '</section>'
  );
}

function ballsSectionHtml() {
  return (
    '<section id="equipment-balls" class="equipment-section">' +
      '<h3>Balls</h3>' +
      '<div id="balls-status" class="meta">Loading ball data…</div>' +
      '<div id="balls-content"></div>' +
    '</section>'
  );
}

function netsSpecCardHtml(spec) {
  return (
    '<div class="nets-spec-row">' +
      '<div class="nets-spec-label">' + escapeHtml(spec.label) + '</div>' +
      '<div class="nets-spec-value">' + escapeHtml(spec.value) + '</div>' +
      (spec.note ? '<div class="nets-spec-note">' + escapeHtml(spec.note) + '</div>' : '') +
    '</div>'
  );
}

function netsBuyerNoteHtml(n) {
  return (
    '<div class="nets-note">' +
      '<div class="nets-note-label">' + escapeHtml(n.label) + '</div>' +
      '<div class="nets-note-text">' + escapeHtml(n.text) + '</div>' +
    '</div>'
  );
}

function renderNetsSection(nets) {
  if (!nets) {
    return '<section id="equipment-nets" class="equipment-section"><h3>Nets</h3><div class="empty">Nets specification unavailable.</div></section>';
  }
  const sourceLink = nets.source && nets.source.url
    ? '<a href="' + escapeHtml(nets.source.url) + '" target="_blank" rel="noopener">' + escapeHtml(nets.source.displayName || 'USAP Rulebook ↗') + '</a>'
    : '';
  return (
    '<section id="equipment-nets" class="equipment-section">' +
      '<h3>Nets</h3>' +
      '<p class="equipment-section-intro">' + escapeHtml(nets.summary) + '</p>' +
      '<div class="nets-spec-grid">' +
        (nets.specs || []).map(netsSpecCardHtml).join('') +
      '</div>' +
      ((nets.buyerNotes || []).length
        ? '<h4>Buyer notes</h4>' +
          '<div class="nets-notes-list">' +
            nets.buyerNotes.map(netsBuyerNoteHtml).join('') +
          '</div>'
        : '') +
      '<div class="meta">Section ' + escapeHtml(nets.rulebookSection || '—') +
        (sourceLink ? ' · ' + sourceLink : '') +
        (nets.lastReviewed ? ' · last reviewed ' + escapeHtml(nets.lastReviewed) : '') +
      '</div>' +
    '</section>'
  );
}

function renderTocHtml() {
  return (
    '<nav class="tab-toc" aria-label="Equipment sections">' +
      '<div class="tab-toc-title">Jump to section</div>' +
      '<ol>' +
        '<li><a href="#equipment-paddles">Paddles</a></li>' +
        '<li><a href="#equipment-balls">Balls</a></li>' +
        '<li><a href="#equipment-nets">Nets</a></li>' +
      '</ol>' +
    '</nav>'
  );
}

function wirePaddlesUI(rootEl, paddlesData) {
  const statusEl = rootEl.querySelector('#paddles-status');
  const brandInput = rootEl.querySelector('#paddle-search-brand');
  const modelInput = rootEl.querySelector('#paddle-search-model');
  const sortSelect = rootEl.querySelector('#paddle-sort');
  const metaEl = rootEl.querySelector('#paddle-results-meta');
  const gridEl = rootEl.querySelector('#paddle-grid');
  const pagEl = rootEl.querySelector('#paddle-pagination');

  if (!paddlesData || !paddlesData.paddles || !paddlesData.paddles.length) {
    statusEl.textContent = 'Paddle data not yet available — first quarterly scrape will populate this section.';
    [brandInput, modelInput, sortSelect].forEach(el => el && (el.disabled = true));
    return;
  }

  const all = paddlesData.paddles.slice();
  statusEl.textContent = 'Showing approved paddles from USA Pickleball — ' +
    paddlesData.totalCount.toLocaleString() + ' entries' +
    (paddlesData.generatedAt ? ' (data refreshed ' + escapeHtml(formatDate(paddlesData.generatedAt.slice(0,10))) + ')' : '');

  let currentPage = 1;
  let currentResults = all;

  function applyFilters() {
    const b = (brandInput.value || '').trim().toLowerCase();
    const m = (modelInput.value || '').trim().toLowerCase();
    let r = all.slice();
    if (b) r = r.filter(p => (p.brand || '').toLowerCase().includes(b));
    if (m) r = r.filter(p => (p.model || '').toLowerCase().includes(m));
    const sort = sortSelect.value;
    if (sort === 'newest') r.sort((x, y) => (y.addedDate || '').localeCompare(x.addedDate || ''));
    else if (sort === 'oldest') r.sort((x, y) => (x.addedDate || '').localeCompare(y.addedDate || ''));
    else if (sort === 'brand') r.sort((x, y) => (x.brand || '').localeCompare(y.brand || ''));
    currentResults = r;
    currentPage = 1;
    renderPage();
  }

  function renderPage() {
    const total = currentResults.length;
    const totalPages = Math.max(1, Math.ceil(total / PADDLES_PER_PAGE));
    if (currentPage > totalPages) currentPage = totalPages;
    const start = (currentPage - 1) * PADDLES_PER_PAGE;
    const slice = currentResults.slice(start, start + PADDLES_PER_PAGE);
    metaEl.textContent = total === 0
      ? 'No paddles match your search.'
      : 'Showing ' + (start + 1).toLocaleString() + '–' + (start + slice.length).toLocaleString() +
        ' of ' + total.toLocaleString() + ' matching paddle' + (total === 1 ? '' : 's');
    gridEl.innerHTML = slice.map(paddleCardHtml).join('');
    pagEl.innerHTML = totalPages > 1
      ? '<button type="button" data-action="prev" ' + (currentPage <= 1 ? 'disabled' : '') + '>‹ Prev</button>' +
        '<span class="paddle-page-indicator">Page ' + currentPage + ' of ' + totalPages.toLocaleString() + '</span>' +
        '<button type="button" data-action="next" ' + (currentPage >= totalPages ? 'disabled' : '') + '>Next ›</button>'
      : '';
  }

  // Wire events. Use input event with a tiny debounce so 5,000-entry filter feels snappy but doesn't run on every keystroke.
  let debounce;
  function deferred(fn) { clearTimeout(debounce); debounce = setTimeout(fn, 120); }
  brandInput.addEventListener('input', () => deferred(applyFilters));
  modelInput.addEventListener('input', () => deferred(applyFilters));
  sortSelect.addEventListener('change', applyFilters);
  pagEl.addEventListener('click', e => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    if (btn.dataset.action === 'prev' && currentPage > 1) currentPage--;
    else if (btn.dataset.action === 'next') currentPage++;
    renderPage();
    rootEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  applyFilters();
}

function renderBallsContent(ballsData) {
  if (!ballsData || !ballsData.balls || !ballsData.balls.length) {
    return '<div class="empty">Ball data not yet available — first quarterly scrape will populate this section.</div>';
  }
  // Group by ballType. USAP uses "Out", "Ind", "Both" / "I&O".
  const labels = {
    'Out':   'Outdoor',
    'Ind':   'Indoor',
    'I&O':   'Indoor & Outdoor',
    'Both':  'Indoor & Outdoor',
    'I/O':   'Indoor & Outdoor',
    'In/Out':'Indoor & Outdoor'
  };
  const groups = {};
  ballsData.balls.forEach(b => {
    const lbl = labels[b.ballType] || b.ballType || 'Other';
    if (!groups[lbl]) groups[lbl] = [];
    groups[lbl].push(b);
  });
  const order = ['Outdoor', 'Indoor', 'Indoor & Outdoor', 'Other'];
  const renderGroup = (label, list) => {
    list.sort((a, b) => (a.brand || '').localeCompare(b.brand || '') || (a.model || '').localeCompare(b.model || ''));
    return (
      '<div class="ball-group">' +
        '<h4>' + escapeHtml(label) + ' <span class="ball-group-count">(' + list.length.toLocaleString() + ')</span></h4>' +
        '<dl class="ball-list">' +
          list.map(b =>
            '<dt>' + escapeHtml(b.brand || '—') + ' — ' + escapeHtml(b.model || '—') + '</dt>' +
            '<dd>Listed ' + escapeHtml(formatDate(b.listedDate)) + '</dd>'
          ).join('') +
        '</dl>' +
      '</div>'
    );
  };
  let html = '<p class="meta">' + ballsData.totalCount.toLocaleString() + ' approved balls' +
    (ballsData.generatedAt ? ' · refreshed ' + escapeHtml(formatDate(ballsData.generatedAt.slice(0,10))) : '') +
    '</p>';
  order.forEach(lbl => { if (groups[lbl]) html += renderGroup(lbl, groups[lbl]); });
  // Render any unexpected groups not in `order`
  Object.keys(groups).forEach(lbl => { if (!order.includes(lbl)) html += renderGroup(lbl, groups[lbl]); });
  return html;
}

export async function renderEquipment(root, snapshot) {
  root.innerHTML =
    '<h2 class="section-title">Equipment</h2>' +
    '<p class="equipment-intro">USA Pickleball-approved paddles and balls plus the rulebook net specification. Informational reference — no commerce, no reviews.</p>' +
    renderTocHtml() +
    paddlesSectionHtml() +
    ballsSectionHtml() +
    '<div id="equipment-nets-mount"></div>';

  // Load all three datasets in parallel; tolerate any individual miss.
  const [paddlesData, ballsData, netsData] = await Promise.all([
    loadMaster('paddles').catch(() => null),
    loadMaster('balls').catch(() => null),
    loadMaster('nets-spec').catch(() => null)
  ]);

  // Wire paddles
  wirePaddlesUI(root, paddlesData);

  // Render balls
  const ballsStatus = root.querySelector('#balls-status');
  const ballsContent = root.querySelector('#balls-content');
  if (ballsData) ballsStatus.style.display = 'none';
  ballsContent.innerHTML = renderBallsContent(ballsData);

  // Render nets
  root.querySelector('#equipment-nets-mount').outerHTML = renderNetsSection(netsData);
}
