// youtube-api.js — thin wrapper around YouTube Data API v3.
// Quota strategy (per docs/phase-0-research.md § 8 + KB-0006):
//   - Prefer channels.list + playlistItems.list (1 unit each).
//   - Avoid search.list (100 units).
// All calls require YOUTUBE_API_KEY in process.env (loaded by env.js).

const API = 'https://www.googleapis.com/youtube/v3';

function requireKey() {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error('YOUTUBE_API_KEY missing (did you load .env?)');
  return key;
}

async function call(endpoint, params) {
  const key = requireKey();
  const qs = new URLSearchParams({ ...params, key }).toString();
  const url = API + '/' + endpoint + '?' + qs;
  const res = await fetch(url);
  const json = await res.json();
  if (json.error) {
    const e = new Error('YouTube API: ' + json.error.message);
    e.status = json.error.code;
    e.errors = json.error.errors;
    throw e;
  }
  return json;
}

// Resolve a handle like "@ppatour" to a channel id. 1 unit.
async function resolveHandle(handle) {
  const h = handle.startsWith('@') ? handle : '@' + handle;
  const data = await call('channels', { part: 'snippet,contentDetails', forHandle: h });
  const item = (data.items || [])[0];
  if (!item) return null;
  return {
    channelId: item.id,
    title: item.snippet.title,
    uploadsPlaylistId: item.contentDetails && item.contentDetails.relatedPlaylists
      ? item.contentDetails.relatedPlaylists.uploads
      : null
  };
}

// Fetch recent uploads for a channel via its uploads playlist. 1 unit.
async function recentUploads(uploadsPlaylistId, maxResults = 10) {
  const data = await call('playlistItems', {
    part: 'snippet,contentDetails',
    playlistId: uploadsPlaylistId,
    maxResults: String(maxResults)
  });
  return (data.items || []).map(it => ({
    videoId: it.contentDetails.videoId,
    title: it.snippet.title,
    channelTitle: it.snippet.channelTitle,
    publishedAt: it.contentDetails.videoPublishedAt || it.snippet.publishedAt,
    description: (it.snippet.description || '').slice(0, 400),
    thumbnail: (it.snippet.thumbnails && (it.snippet.thumbnails.medium || it.snippet.thumbnails.default)) || null,
    url: 'https://www.youtube.com/watch?v=' + it.contentDetails.videoId
  }));
}

module.exports = { resolveHandle, recentUploads, call };
