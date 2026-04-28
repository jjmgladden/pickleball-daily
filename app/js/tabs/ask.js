// ask.js — KB-0008 AI Q&A chat tab.
// Posts {question} to the Worker /ai route and renders the answer with
// per-conversation history. History is in-memory only (resets on tab change).

import { escapeHtml } from '../components/confidence-badge.js';
import { loadMaster } from '../data-loader.js';

const HISTORY = []; // [{ role: 'user'|'ai', text, ts, model?, usage? }]

async function loadConfig() {
  try { return await loadMaster('ai-config'); }
  catch { return { workerBaseUrl: '', aiEnabled: false }; }
}

// Defense-in-depth markdown stripper: the system prompt already tells the
// model "no markdown," but if it slips through, drop the markup characters
// so the user sees clean prose rather than raw asterisks/hashes.
function stripMarkdown(s) {
  return String(s || '')
    .replace(/^#{1,6}\s+/gm, '')           // # heading → heading
    .replace(/\*\*(.+?)\*\*/g, '$1')        // **bold** → bold
    .replace(/(^|[^*])\*([^*\n]+?)\*(?!\*)/g, '$1$2')  // *italic* → italic (preserve list-bullet asterisks at line start? we strip those next)
    .replace(/__(.+?)__/g, '$1')            // __bold__ → bold
    .replace(/(^|\s)_([^_\n]+?)_(?=\s|$)/g, '$1$2')   // _italic_ → italic
    .replace(/^[\s]*[-*]\s+/gm, '')         // "- item" / "* item" → "item"
    .replace(/`([^`\n]+?)`/g, '$1');        // `code` → code
}

// After escapeHtml, find http(s) URLs and wrap them in clickable anchors.
// Safe because we operate on already-escaped HTML — the URL pattern excludes
// '<', '>', '"', and '&' which are what escapeHtml encodes.
function autolink(escapedText) {
  return escapedText.replace(
    /(https?:\/\/[^\s<>"]+[^\s<>".,;:!?)\]])/g,
    '<a href="$1" target="_blank" rel="noopener">$1</a>'
  );
}

function renderHistoryItem(item) {
  if (item.role === 'user') {
    return '<div class="ask-msg ask-msg-user"><div class="ask-msg-label">You</div><div class="ask-msg-body">' + escapeHtml(item.text) + '</div></div>';
  }
  if (item.role === 'ai') {
    const meta = [];
    if (item.model) meta.push(item.model);
    if (item.usage && item.usage.cacheHit) meta.push('cache hit');
    if (item.contextGeneratedAt) meta.push('context: ' + escapeHtml(item.contextGeneratedAt.slice(0, 10)));
    const metaLine = meta.length ? '<div class="ask-msg-meta">' + meta.join(' · ') + '</div>' : '';
    // 1. Strip any markdown the model produced despite the system prompt's instruction
    // 2. Split on blank lines into paragraphs
    // 3. escapeHtml each paragraph (XSS-safe)
    // 4. autolink http(s) URLs (operates on escaped HTML — safe)
    const cleaned = stripMarkdown(item.text || '');
    const paras = cleaned.split(/\n\n+/).map(p => '<p>' + autolink(escapeHtml(p)) + '</p>').join('');
    return '<div class="ask-msg ask-msg-ai"><div class="ask-msg-label">AI</div><div class="ask-msg-body">' + paras + metaLine + '</div></div>';
  }
  if (item.role === 'error') {
    return '<div class="ask-msg ask-msg-error"><div class="ask-msg-label">Error</div><div class="ask-msg-body">' + escapeHtml(item.text) + '</div></div>';
  }
  return '';
}

function renderHistory(rootEl) {
  const histEl = rootEl.querySelector('#ask-history');
  if (!histEl) return;
  if (HISTORY.length === 0) {
    histEl.innerHTML = '<div class="ask-empty">Ask a question about pickleball — players, rankings, ratings, MLP teams, tournaments, rules, history. The AI uses today\'s daily snapshot as its context.</div>';
    return;
  }
  histEl.innerHTML = HISTORY.map(renderHistoryItem).join('');
  // Scroll to latest
  histEl.scrollTop = histEl.scrollHeight;
}

async function submitQuestion(rootEl, config) {
  const input = rootEl.querySelector('#ask-input');
  const sendBtn = rootEl.querySelector('#ask-send');
  const clearBtn = rootEl.querySelector('#ask-clear');
  const question = (input.value || '').trim();
  if (question.length < 5) {
    HISTORY.push({ role: 'error', text: 'Please enter a question of at least 5 characters.', ts: Date.now() });
    renderHistory(rootEl);
    return;
  }
  if (question.length > 500) {
    HISTORY.push({ role: 'error', text: 'Please shorten the question to 500 characters or fewer.', ts: Date.now() });
    renderHistory(rootEl);
    return;
  }

  HISTORY.push({ role: 'user', text: question, ts: Date.now() });
  input.value = '';
  sendBtn.disabled = true;
  clearBtn.disabled = true;
  sendBtn.textContent = 'Thinking…';
  renderHistory(rootEl);

  // Add a temporary loading message
  const loadingId = '_loading_' + Date.now();
  const loadingEntry = { role: 'ai', text: '…', ts: Date.now(), _loadingId: loadingId };
  HISTORY.push(loadingEntry);
  renderHistory(rootEl);

  let res;
  try {
    res = await fetch(config.workerBaseUrl.replace(/\/+$/, '') + '/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question })
    });
  } catch (e) {
    removeLoading(loadingId);
    HISTORY.push({ role: 'error', text: 'Network error: ' + (e.message || e), ts: Date.now() });
    finishSend(rootEl);
    return;
  }

  removeLoading(loadingId);

  let data = null;
  try { data = await res.json(); } catch { /* fall through */ }

  if (!res.ok || !data || !data.ok) {
    const errMsg = (data && data.error) ? data.error : ('HTTP ' + res.status);
    HISTORY.push({ role: 'error', text: errMsg, ts: Date.now() });
  } else {
    HISTORY.push({
      role: 'ai',
      text: data.answer || '(empty response)',
      ts: Date.now(),
      model: data.model,
      usage: data.usage,
      contextGeneratedAt: data.contextGeneratedAt
    });
  }

  finishSend(rootEl);
}

function removeLoading(loadingId) {
  for (let i = HISTORY.length - 1; i >= 0; i--) {
    if (HISTORY[i]._loadingId === loadingId) { HISTORY.splice(i, 1); break; }
  }
}

function finishSend(rootEl) {
  const sendBtn = rootEl.querySelector('#ask-send');
  const clearBtn = rootEl.querySelector('#ask-clear');
  sendBtn.disabled = false;
  clearBtn.disabled = false;
  sendBtn.textContent = 'Ask';
  renderHistory(rootEl);
  rootEl.querySelector('#ask-input').focus();
}

export async function renderAsk(root) {
  root.innerHTML = '<div class="loading">Loading Ask…</div>';
  const config = await loadConfig();

  if (!config.aiEnabled || !config.workerBaseUrl) {
    root.innerHTML =
      '<h2 class="section-title">Ask</h2>' +
      '<div class="soft-banner">' +
        'AI Q&A is being configured. The Cloudflare Worker that proxies questions to Anthropic has not been deployed yet, ' +
        'or aiEnabled is false in <code>data/master/ai-config.json</code>. Once the Worker is live and the config flag is on, this tab will accept questions.' +
      '</div>';
    return;
  }

  root.innerHTML =
    '<h2 class="section-title">Ask the AI</h2>' +
    '<div class="muted">Powered by Claude. Answers are generated from today\'s snapshot — rankings, ratings, MLP teams, tournaments, rules, players. If something isn\'t in the snapshot, the AI will say so honestly.</div>' +
    '<div id="ask-history" class="ask-history"></div>' +
    '<div class="ask-controls">' +
      '<textarea id="ask-input" rows="2" maxlength="500" placeholder="e.g. Who is the #1 PPA player right now?"></textarea>' +
      '<div class="ask-buttons">' +
        '<button id="ask-send" class="ask-btn-primary">Ask</button>' +
        '<button id="ask-clear" class="ask-btn-secondary">Clear conversation</button>' +
      '</div>' +
      '<div class="ask-hint">5-500 characters · Enter to send · Shift+Enter for newline · max 10 questions/hour, 50/day</div>' +
    '</div>';

  renderHistory(root);

  const input = root.querySelector('#ask-input');
  const sendBtn = root.querySelector('#ask-send');
  const clearBtn = root.querySelector('#ask-clear');

  sendBtn.addEventListener('click', () => submitQuestion(root, config));
  clearBtn.addEventListener('click', () => {
    HISTORY.length = 0;
    renderHistory(root);
    input.focus();
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!sendBtn.disabled) submitQuestion(root, config);
    }
  });

  input.focus();
}
