#!/usr/bin/env node
// serve.js — zero-dep static file server for local dev.
// Port 1965 (Bainbridge Island origin year).
// Run: `npm run serve`

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.PORT) || 1965;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.mjs':  'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg':  'image/svg+xml; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico':  'image/x-icon',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.txt':  'text/plain; charset=utf-8',
  '.map':  'application/json; charset=utf-8'
};

function sanitize(p) {
  const decoded = decodeURIComponent(p.split('?')[0]);
  const abs = path.normalize(path.join(ROOT, decoded));
  if (!abs.startsWith(ROOT)) return null; // traversal guard
  return abs;
}

const server = http.createServer((req, res) => {
  let urlPath = req.url || '/';
  if (urlPath === '/') urlPath = '/index.html';
  let filePath = sanitize(urlPath);
  if (!filePath) { res.writeHead(400); return res.end('Bad request'); }

  fs.stat(filePath, (err, stat) => {
    if (!err && stat.isDirectory()) filePath = path.join(filePath, 'index.html');
    fs.readFile(filePath, (err2, body) => {
      if (err2) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        return res.end('404: ' + urlPath);
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, {
        'Content-Type': MIME[ext] || 'application/octet-stream',
        'Cache-Control': 'no-cache',
        'Service-Worker-Allowed': '/'
      });
      res.end(body);
    });
  });
});

server.listen(PORT, () => {
  console.log('Pickleball Daily — local server on http://localhost:' + PORT + '/');
  console.log('Root:', ROOT);
});
