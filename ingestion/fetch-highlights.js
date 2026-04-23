// fetch-highlights.js — YouTube recent-uploads from the channel allowlist.
// Uses channels.list (resolve handle) + playlistItems.list (uploads). 2 units per channel.
// Writes to snapshot.highlights[]. Skips a channel on any API error; logs + continues.

const fs = require('fs');
const path = require('path');
const { loadEnv } = require('./lib/env');
const { resolveHandle, recentUploads } = require('./lib/youtube-api');

loadEnv();

const SEED = path.resolve(__dirname, '..', 'data', 'master', 'video-sources.json');

function pickChannels(sources) {
  // Start with the 2 T1 official pro channels — PPA + MLP. Add USAP and APP if time permits.
  const official = (sources.officialChannels || []).filter(c => c.tier === 'T1');
  return official;
}

async function run() {
  if (!process.env.YOUTUBE_API_KEY) {
    return { sourceId: 'highlights', ok: false, error: 'no-youtube-key' };
  }
  if (!fs.existsSync(SEED)) {
    return { sourceId: 'highlights', ok: false, error: 'seed-missing' };
  }
  const seed = JSON.parse(fs.readFileSync(SEED, 'utf8'));
  const channels = pickChannels(seed);
  const results = [];
  const errors = [];
  let quotaEstimate = 0;

  for (const ch of channels) {
    try {
      const handle = ch.channelHandle || (ch.url && ch.url.match(/@([A-Za-z0-9_.-]+)/)?.[1]);
      if (!handle) { errors.push({ id: ch.id, reason: 'no-handle-available' }); continue; }
      const resolved = await resolveHandle(handle);
      quotaEstimate += 1;
      if (!resolved || !resolved.uploadsPlaylistId) {
        errors.push({ id: ch.id, reason: 'resolve-failed' });
        continue;
      }
      const videos = await recentUploads(resolved.uploadsPlaylistId, 5);
      quotaEstimate += 1;
      results.push({
        channelSourceId: ch.id,
        channelId: resolved.channelId,
        channelTitle: resolved.title,
        videos
      });
    } catch (e) {
      errors.push({ id: ch.id, reason: e.message });
    }
  }

  return {
    sourceId: 'highlights',
    ok: errors.length < channels.length, // partial OK as long as at least one channel succeeded
    retrievedAt: new Date().toISOString(),
    quotaEstimate,
    channels: results,
    errors
  };
}

if (require.main === module) {
  run().then(r => console.log(JSON.stringify(r, null, 2))).catch(e => { console.error(e); process.exit(1); });
}
module.exports = { run };
