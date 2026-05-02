// gear-courts.js — top-level "Gear & Courts" tab.
// Hosts sub-tabs via sub-tab-strip.js. At L3 launch only Equipment exists,
// so the strip is suppressed (single-pill = no chrome). At L4, Courts joins
// the array and the strip auto-renders.
//
// KB-0040 Phase L3 launch shape.

import { renderSubTabStrip } from '../components/sub-tab-strip.js';
import { renderEquipment } from './equipment.js';

const SUB_TABS = [
  { id: 'equipment', label: 'Equipment', renderer: renderEquipment }
  // L4 will add: { id: 'courts', label: 'Courts', renderer: renderCourts }
];

export function renderGearCourts(root, snapshot) {
  renderSubTabStrip(root, SUB_TABS, { storageKey: 'gear-courts-active' }, snapshot);
}
