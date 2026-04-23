// build-icons.js — generate PNG icons from app/icon.svg.
// Run with: node scripts/build-icons.js
//
// iOS Safari requires apple-touch-icon as PNG (SVG ignored). Android Chrome PWA
// uses the manifest icons array. We emit both sets here from a single SVG source.

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const SRC  = path.join(__dirname, '..', 'app', 'icon.svg');
const DEST = path.join(__dirname, '..', 'app', 'icons');

const SIZES = [
  // iOS apple-touch-icon variants
  { size: 180, name: 'apple-touch-icon-180x180.png' },
  { size: 167, name: 'apple-touch-icon-167x167.png' },
  { size: 152, name: 'apple-touch-icon-152x152.png' },
  { size: 120, name: 'apple-touch-icon-120x120.png' },
  // PWA manifest standard sizes
  { size: 192, name: 'icon-192.png' },
  { size: 512, name: 'icon-512.png' }
];

async function main() {
  if (!fs.existsSync(SRC)) {
    console.error('source SVG not found:', SRC);
    process.exit(1);
  }
  if (!fs.existsSync(DEST)) {
    fs.mkdirSync(DEST, { recursive: true });
    console.log('created', DEST);
  }

  const svgBuf = fs.readFileSync(SRC);
  const results = [];

  for (const { size, name } of SIZES) {
    const out = path.join(DEST, name);
    await sharp(svgBuf, { density: Math.max(72, size * 2) })
      .resize(size, size, { fit: 'contain', background: { r: 14, g: 20, b: 32, alpha: 1 } })
      .png({ compressionLevel: 9 })
      .toFile(out);
    const bytes = fs.statSync(out).size;
    results.push({ name, size, bytes });
    console.log('  wrote', name, '(' + size + 'x' + size + ', ' + bytes + ' bytes)');
  }

  console.log('\nbuilt', results.length, 'icons in', DEST);
}

main().catch(err => {
  console.error('build-icons failed:', err);
  process.exit(1);
});
