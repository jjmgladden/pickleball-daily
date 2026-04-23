/**
 * Pickleball Daily — submission Worker
 *
 * Single-endpoint Cloudflare Worker that accepts JSON submissions from the
 * public site (future suggest-modal component) and creates a labeled GitHub
 * Issue on the repo named in env.GITHUB_REPO.
 *
 * Reusable across projects per KB-0012. All project-specific values live in
 * wrangler.toml [vars] so porting to a new project is wrangler.toml + PAT.
 *
 * Anti-abuse:
 *   - Honeypot field (`website`) silently drops bot submissions
 *   - Per-isolate rate limiting (3 submissions per IP per 10 min)
 *   - CORS locked to ALLOWED_ORIGINS
 *
 * Deployment: see worker/README.md.
 */

const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 3;

// Pickleball-specific submission types (validated); override via env.ALLOWED_TYPES
// if porting to another project (comma-separated).
const DEFAULT_TYPES = ['player', 'event', 'moment', 'other'];

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
    const originAllowed = allowed.length === 0 || allowed.includes(origin);

    const corsHeaders = {
      'Access-Control-Allow-Origin': originAllowed ? origin : (allowed[0] || ''),
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }
    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405, corsHeaders);
    }
    if (!originAllowed) {
      return json({ error: 'Origin not allowed' }, 403, corsHeaders);
    }

    let body;
    try { body = await request.json(); }
    catch { return json({ error: 'Invalid JSON' }, 400, corsHeaders); }

    // Honeypot — silent success for bots
    if (body.website && body.website.trim() !== '') {
      return json({ ok: true }, 200, corsHeaders);
    }

    const types = (env.ALLOWED_TYPES || DEFAULT_TYPES.join(',')).split(',').map(s => s.trim());
    const errors = validate(body, types);
    if (errors.length) return json({ error: errors.join(', ') }, 400, corsHeaders);

    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    if (!checkRateLimit(ip)) {
      return json({ error: 'Too many submissions — please try again later.' }, 429, corsHeaders);
    }

    try {
      const issue = await createGitHubIssue(body, env);
      return json({ ok: true, issueUrl: issue.html_url, issueNumber: issue.number }, 200, corsHeaders);
    } catch (err) {
      console.error('GitHub Issue creation failed:', err);
      return json({ error: 'Failed to create submission — please try again later.' }, 502, corsHeaders);
    }
  }
};

function validate(body, types) {
  const errors = [];
  const type = (body.type || '').trim().toLowerCase();
  if (!types.includes(type)) errors.push('type must be one of: ' + types.join(', '));
  const name = (body.name || '').trim();
  if (!name || name.length < 2 || name.length > 200) errors.push('name must be 2-200 characters');
  const reason = (body.reason || '').trim();
  if (!reason || reason.length < 10 || reason.length > 2000) errors.push('reason must be 10-2000 characters');
  const source = (body.source || '').trim();
  if (source && source.length > 500) errors.push('source too long');
  const submitterName = (body.submitterName || '').trim();
  if (submitterName && submitterName.length > 100) errors.push('submitter name too long');
  const submitterEmail = (body.submitterEmail || '').trim();
  if (submitterEmail && submitterEmail.length > 200) errors.push('submitter email too long');
  return errors;
}

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip) || { count: 0, windowStart: now };
  if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    entry.count = 1;
    entry.windowStart = now;
  } else {
    entry.count += 1;
  }
  rateLimitMap.set(ip, entry);
  return entry.count <= RATE_LIMIT_MAX;
}

async function createGitHubIssue(body, env) {
  const repo = env.GITHUB_REPO;
  const token = env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN not configured');
  if (!repo) throw new Error('GITHUB_REPO not configured');

  const type = body.type.trim().toLowerCase();
  const name = body.name.trim().slice(0, 200);
  const reason = body.reason.trim().slice(0, 2000);
  const source = (body.source || '').trim().slice(0, 500);
  const submitterName = (body.submitterName || '').trim().slice(0, 100) || '(anonymous)';
  const submitterEmail = (body.submitterEmail || '').trim().slice(0, 200);

  const workerName = env.WORKER_NAME || 'submission-worker';
  const title = 'Submission: ' + type + ' — ' + name;
  const issueBody = [
    '**Type:** ' + type,
    '**Name / title:** ' + name,
    '',
    '**Why notable:**',
    reason,
    '',
    source ? '**Source link:** ' + source : '',
    '',
    '---',
    '**From:** ' + submitterName + (submitterEmail ? ' (' + submitterEmail + ')' : ''),
    '_Submitted via the site. This Issue was opened automatically by ' + workerName + '._'
  ].filter(Boolean).join('\n');

  const url = 'https://api.github.com/repos/' + repo + '/issues';
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Accept': 'application/vnd.github+json',
      'User-Agent': workerName,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title,
      body: issueBody,
      labels: ['submission', 'submission:' + type]
    })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error('GitHub API ' + res.status + ': ' + text.slice(0, 200));
  }
  return res.json();
}

function json(obj, status, extraHeaders) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: Object.assign({ 'Content-Type': 'application/json' }, extraHeaders || {})
  });
}
