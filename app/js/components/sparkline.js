// sparkline.js — tiny inline-SVG sparkline for rank or rating series.
// Two consumers: Player Detail Page (large) and Player Comparison Rank Trend (small).
// For rank series, the y-axis is visually inverted (rank #1 sits at the top).

import { escapeHtml } from './confidence-badge.js';

const DEFAULTS = {
  width: 220,
  height: 40,
  paddingX: 4,
  paddingY: 4,
  type: 'rank',          // 'rank' (lower = better, inverted) or 'rating' (higher = better)
  strokeColor: '#ffd24a', // matches --accent (ball-yellow)
  strokeWidth: 1.6,
  pointRadius: 2,
  showEndpoints: true,
};

// Build an inline-SVG sparkline. Returns HTML string ready to drop into a card.
// `points` is an array of { date, value } in chronological order. Empty input → ''.
export function sparklineSvg(points, opts) {
  const o = Object.assign({}, DEFAULTS, opts || {});
  const valid = (points || []).filter(p => typeof p.value === 'number' && Number.isFinite(p.value));
  if (valid.length < 2) return '';

  const w = o.width;
  const h = o.height;
  const px = o.paddingX;
  const py = o.paddingY;
  const innerW = w - 2 * px;
  const innerH = h - 2 * py;

  const values = valid.map(p => p.value);
  const min = Math.min.apply(null, values);
  const max = Math.max.apply(null, values);
  const range = (max === min) ? 1 : (max - min);

  // For rank type: lower numeric value = better → render at top.
  // For rating type: higher numeric value = better → render at top.
  const yFor = (v) => {
    const norm = (v - min) / range;            // 0 = min, 1 = max
    const flip = (o.type === 'rank') ? norm : (1 - norm);
    return py + flip * innerH;
  };
  const xFor = (i) => {
    if (valid.length === 1) return px + innerW / 2;
    return px + (i / (valid.length - 1)) * innerW;
  };

  const dPath = valid.map((p, i) => (i === 0 ? 'M' : 'L') + xFor(i).toFixed(2) + ',' + yFor(p.value).toFixed(2)).join(' ');

  const endpoints = o.showEndpoints
    ? [
        { i: 0, p: valid[0] },
        { i: valid.length - 1, p: valid[valid.length - 1] },
      ].map(({ i, p }) => {
        const cx = xFor(i).toFixed(2);
        const cy = yFor(p.value).toFixed(2);
        const title = escapeHtml(p.date + ': ' + (o.type === 'rank' ? '#' : '') + p.value);
        return '<circle cx="' + cx + '" cy="' + cy + '" r="' + o.pointRadius + '" fill="' + o.strokeColor + '"><title>' + title + '</title></circle>';
      }).join('')
    : '';

  // Native title elements provide hover info on each point + the whole line.
  const fullTitle = escapeHtml(
    valid.map(p => p.date + ': ' + (o.type === 'rank' ? '#' : '') + p.value).join('  •  ')
  );

  return (
    '<svg class="sparkline" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" ' +
      'role="img" aria-label="' + (o.type === 'rank' ? 'PPA rank' : 'DUPR rating') + ' trend over ' + valid.length + ' snapshots">' +
      '<title>' + fullTitle + '</title>' +
      '<path d="' + dPath + '" fill="none" stroke="' + o.strokeColor + '" stroke-width="' + o.strokeWidth + '" stroke-linecap="round" stroke-linejoin="round"/>' +
      endpoints +
    '</svg>'
  );
}

// Convenience: extract a {date, value} series from a player's history array.
// `field` is 'ppaRank' | 'duprDoubles' | 'duprSingles' | 'ppaPoints'.
export function seriesFrom(history, field) {
  if (!Array.isArray(history)) return [];
  return history
    .filter(h => typeof h[field] === 'number' && Number.isFinite(h[field]))
    .map(h => ({ date: h.date, value: h[field] }));
}
