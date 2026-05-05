// gear-courts.js — top-level "Gear" tab orchestrator (filename retained
// for git stability; user-visible label was renamed Gear & Courts → Gear
// in S12 after L4 (Courts) was deferred per KB-0051. If/when Courts ships
// later it will be a SEPARATE top-level tab, not a sub-tab here.
//
// Hosts sub-tabs via sub-tab-strip.js. Currently only Equipment exists,
// so the strip is suppressed (single-pill = no chrome).
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
