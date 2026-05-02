// sub-tab-strip.js — reusable pill segmented control for sub-navigation
// inside a top-level tab. Suppresses its own rendering when there is only one
// sub-tab (no point showing a single-pill strip — see KB-0040 L3 design).
//
// Usage:
//   import { renderSubTabStrip } from '../components/sub-tab-strip.js';
//   const subTabs = [
//     { id: 'equipment', label: 'Equipment', renderer: renderEquipment },
//     { id: 'courts',    label: 'Courts',    renderer: renderCourts }
//   ];
//   renderSubTabStrip(rootEl, subTabs, { storageKey: 'gear-courts-active' }, snapshot);

const STORAGE_PREFIX = 'pkb-subtab.';

function getActiveId(storageKey, fallback) {
  if (!storageKey) return fallback;
  try {
    const v = localStorage.getItem(STORAGE_PREFIX + storageKey);
    return v || fallback;
  } catch {
    return fallback;
  }
}

function setActiveId(storageKey, id) {
  if (!storageKey) return;
  try { localStorage.setItem(STORAGE_PREFIX + storageKey, id); } catch {}
}

export function renderSubTabStrip(root, subTabs, opts, snapshot) {
  if (!root || !Array.isArray(subTabs) || subTabs.length === 0) return;
  const storageKey = opts && opts.storageKey;
  const initialId = getActiveId(storageKey, subTabs[0].id);
  const activeIdx = Math.max(0, subTabs.findIndex(t => t.id === initialId));
  const activeTab = subTabs[activeIdx];

  // KB-0040 L3 decision: hide the sub-tab strip when only one sub-tab exists.
  const showStrip = subTabs.length >= 2;

  const stripHtml = showStrip
    ? '<div class="sub-tab-strip" role="tablist">' +
        subTabs.map(t =>
          '<button type="button" role="tab" data-subtab="' + t.id + '"' +
            (t.id === activeTab.id ? ' aria-selected="true" class="active"' : ' aria-selected="false"') +
            '>' + t.label + '</button>'
        ).join('') +
      '</div>'
    : '';

  root.innerHTML = stripHtml + '<div class="sub-tab-content"></div>';
  const content = root.querySelector('.sub-tab-content');

  function activate(id) {
    const tab = subTabs.find(t => t.id === id) || subTabs[0];
    setActiveId(storageKey, tab.id);
    if (showStrip) {
      root.querySelectorAll('.sub-tab-strip button').forEach(b => {
        const on = b.dataset.subtab === tab.id;
        b.classList.toggle('active', on);
        b.setAttribute('aria-selected', on ? 'true' : 'false');
      });
    }
    content.innerHTML = '<div class="loading">Loading…</div>';
    Promise.resolve()
      .then(() => tab.renderer(content, snapshot))
      .catch(e => {
        content.innerHTML = '<div class="error">Failed to load: ' + (e && e.message ? e.message : 'unknown error') + '</div>';
        console.error('sub-tab render', tab.id, e);
      });
  }

  if (showStrip) {
    root.querySelectorAll('.sub-tab-strip button').forEach(b => {
      b.addEventListener('click', () => activate(b.dataset.subtab));
    });
  }

  activate(activeTab.id);
}
