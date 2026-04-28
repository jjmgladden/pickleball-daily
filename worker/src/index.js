/**
 * Pickleball Daily — API Worker (KB-0008 + KB-0012)
 *
 * Two routes:
 *   POST /submit  — public submission → GitHub Issue (KB-0012, dormant until Suggest UI)
 *   POST /ai      — AI Q&A proxy → Anthropic Messages API (KB-0008)
 *
 * Anti-abuse on /ai:
 *   - Per-isolate rate limit: 10/hr/IP, 50/day/IP
 *   - Kill switch: env.AI_DISABLED === "true" → 503
 *   - CORS locked to ALLOWED_ORIGINS
 *   - Anthropic spend cap is the hard ceiling (set in console.anthropic.com)
 *
 * Anti-abuse on /submit:
 *   - Honeypot field (`website`) silently drops bot submissions
 *   - Per-isolate rate limit: 3/10min/IP
 */

// ===== Per-isolate rate-limit state (resets on Worker restart) =====
const submitLimit = new Map();
const aiHourLimit = new Map();
const aiDayLimit  = new Map();

const SUBMIT_WINDOW_MS = 10 * 60 * 1000;
const SUBMIT_MAX = 3;

const AI_HOUR_WINDOW_MS = 60 * 60 * 1000;
const AI_HOUR_MAX = 10;
const AI_DAY_WINDOW_MS = 24 * 60 * 60 * 1000;
const AI_DAY_MAX = 50;

const DEFAULT_TYPES = ['player', 'event', 'moment', 'other'];
const DEFAULT_AI_MODEL = 'claude-haiku-4-5';

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

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '');

    // Health endpoint — open to anyone (info-only, no PII, no API spend).
    // Lets owner sanity-check the deploy from a browser address bar or curl.
    if (request.method === 'GET' && (path === '' || path === '/' || path === '/health')) {
      return json({
        ok: true,
        worker: env.WORKER_NAME || 'pickleball-daily-api',
        routes: ['POST /submit', 'POST /ai'],
        aiEnabled: env.AI_DISABLED !== 'true'
      }, 200, { 'Access-Control-Allow-Origin': '*' });
    }

    // Real routes require an allowed Origin (CORS protection for cost + abuse).
    if (!originAllowed) {
      return json({ error: 'Origin not allowed' }, 403, corsHeaders);
    }

    if (path === '/submit') return handleSubmit(request, env, corsHeaders);
    if (path === '/ai')     return handleAi(request, env, corsHeaders);

    return json({ error: 'Not found' }, 404, corsHeaders);
  }
};

// =====================================================================
// /ai handler — Anthropic Messages proxy with prompt caching
// =====================================================================
async function handleAi(request, env, corsHeaders) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405, corsHeaders);
  }
  if (env.AI_DISABLED === 'true') {
    return json({ error: 'AI is temporarily disabled.' }, 503, corsHeaders);
  }
  if (!env.ANTHROPIC_API_KEY) {
    return json({ error: 'AI is not configured (server missing API key).' }, 500, corsHeaders);
  }

  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'Invalid JSON' }, 400, corsHeaders); }

  const question = (body.question || '').trim();
  if (question.length < 5 || question.length > 500) {
    return json({ error: 'question must be 5-500 characters' }, 400, corsHeaders);
  }

  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const hourCheck = checkLimit(aiHourLimit, ip, AI_HOUR_WINDOW_MS, AI_HOUR_MAX);
  if (!hourCheck.ok) {
    return json({ error: 'Rate limit: max ' + AI_HOUR_MAX + ' questions per hour. Try again in ' + hourCheck.retryMin + ' min.' }, 429, corsHeaders);
  }
  const dayCheck = checkLimit(aiDayLimit, ip, AI_DAY_WINDOW_MS, AI_DAY_MAX);
  if (!dayCheck.ok) {
    return json({ error: 'Rate limit: max ' + AI_DAY_MAX + ' questions per day.' }, 429, corsHeaders);
  }

  // Pull the curated context bundle from GitHub Pages. Cloudflare's edge cache
  // handles repeated fetches automatically; we add explicit cf cache options as
  // belt-and-suspenders.
  const contextUrl = env.AI_CONTEXT_URL;
  if (!contextUrl) {
    return json({ error: 'AI is not configured (server missing context URL).' }, 500, corsHeaders);
  }

  let context;
  try {
    const res = await fetch(contextUrl, {
      cf: { cacheTtl: 300, cacheEverything: true },
      headers: { 'User-Agent': 'pickleball-daily-api/1.0' }
    });
    if (!res.ok) throw new Error('context fetch ' + res.status);
    context = await res.json();
  } catch (e) {
    return json({ error: 'Could not load context bundle: ' + (e.message || e) }, 502, corsHeaders);
  }

  const model = env.AI_MODEL || DEFAULT_AI_MODEL;
  const system = [
    'You are the AI assistant for Ozark Joe\'s Pickleball Daily Intelligence Report.',
    'Answer questions about pickleball using ONLY the data in the supplied context bundle.',
    'If the answer is not in the context, say so honestly — do not guess or fabricate.',
    'Keep answers concise (1-3 short paragraphs). Use plain English.',
    'When citing rankings, ratings, or specific facts, mention the source category in parentheses (e.g., "(PPA rankings)", "(DUPR ratings)", "(MLP rosters)", "(USAP rules)").',
    'Today\'s context bundle was generated at: ' + (context.generatedAt || 'unknown'),
    'Distinguish DUPR ratings (skill, 2.0-8.0+) from PPA rankings (tour position #1, #2, ...). They answer different questions.'
  ].join('\n');

  const messages = [
    {
      role: 'user',
      content: [
        // The context block carries cache_control — prompt-cached after first
        // call within ~5 minutes. ~5K tokens of curated content.
        {
          type: 'text',
          text: 'Pickleball Daily context bundle (as of ' + (context.generatedAt || 'unknown') + '):\n\n' + (context.content || '(empty context)'),
          cache_control: { type: 'ephemeral' }
        },
        {
          type: 'text',
          text: 'Question: ' + question
        }
      ]
    }
  ];

  let apiRes;
  try {
    apiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        max_tokens: 600,
        system,
        messages
      })
    });
  } catch (e) {
    return json({ error: 'Anthropic API call failed: ' + (e.message || e) }, 502, corsHeaders);
  }

  if (!apiRes.ok) {
    const errText = await apiRes.text();
    console.error('Anthropic non-200:', apiRes.status, errText.slice(0, 300));
    return json({ error: 'Anthropic API ' + apiRes.status + '. Try again later.' }, 502, corsHeaders);
  }

  let apiBody;
  try { apiBody = await apiRes.json(); }
  catch { return json({ error: 'Bad response from Anthropic.' }, 502, corsHeaders); }

  const answer = (apiBody.content || []).filter(c => c.type === 'text').map(c => c.text).join('\n').trim();
  const usage = apiBody.usage || {};
  const cacheHit = (usage.cache_read_input_tokens || 0) > 0;

  return json({
    ok: true,
    answer,
    model: apiBody.model || model,
    contextGeneratedAt: context.generatedAt || null,
    usage: {
      inputTokens: usage.input_tokens || 0,
      outputTokens: usage.output_tokens || 0,
      cacheReadTokens: usage.cache_read_input_tokens || 0,
      cacheCreationTokens: usage.cache_creation_input_tokens || 0,
      cacheHit
    }
  }, 200, corsHeaders);
}

// =====================================================================
// /submit handler — preserved from KB-0012 (dormant until Suggest UI)
// =====================================================================
async function handleSubmit(request, env, corsHeaders) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405, corsHeaders);
  }

  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'Invalid JSON' }, 400, corsHeaders); }

  if (body.website && body.website.trim() !== '') {
    return json({ ok: true }, 200, corsHeaders);
  }

  const types = (env.ALLOWED_TYPES || DEFAULT_TYPES.join(',')).split(',').map(s => s.trim());
  const errors = validateSubmit(body, types);
  if (errors.length) return json({ error: errors.join(', ') }, 400, corsHeaders);

  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const lim = checkLimit(submitLimit, ip, SUBMIT_WINDOW_MS, SUBMIT_MAX);
  if (!lim.ok) {
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

function validateSubmit(body, types) {
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

  const workerName = env.WORKER_NAME || 'pickleball-daily-api';
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

// =====================================================================
// Shared helpers
// =====================================================================
function checkLimit(map, ip, windowMs, max) {
  const now = Date.now();
  const entry = map.get(ip) || { count: 0, windowStart: now };
  if (now - entry.windowStart > windowMs) {
    entry.count = 1;
    entry.windowStart = now;
  } else {
    entry.count += 1;
  }
  map.set(ip, entry);
  const ok = entry.count <= max;
  const retryMin = ok ? 0 : Math.max(1, Math.ceil((windowMs - (now - entry.windowStart)) / 60000));
  return { ok, retryMin };
}

function json(obj, status, extraHeaders) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: Object.assign({ 'Content-Type': 'application/json' }, extraHeaders || {})
  });
}
