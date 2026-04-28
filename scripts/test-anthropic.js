// scripts/test-anthropic.js — diagnostic for KB-0008 Worker debugging.
// Sends the EXACT payload the Worker would send (full system + full context bundle
// from GitHub Pages + cache_control), to isolate whether the bug is the payload
// itself or something Worker-runtime-specific.
//
// Run from project root: node scripts/test-anthropic.js
// Reads ANTHROPIC_API_KEY from .env at project root.

const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.resolve(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) { console.error('No .env at ' + envPath); process.exit(1); }
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}

loadEnv();

const KEY = process.env.ANTHROPIC_API_KEY;
if (!KEY) { console.error('ANTHROPIC_API_KEY not in .env'); process.exit(1); }

const MODEL = 'claude-haiku-4-5-20251001';
const CONTEXT_URL = 'https://jjmgladden.github.io/pickleball-daily/data/snapshots/ai-context.json';

console.log('Key length:', KEY.length, '| prefix:', KEY.slice(0, 15) + '...');
console.log('Model:', MODEL);
console.log('Fetching context from:', CONTEXT_URL);

(async () => {
  // Mirror the Worker's logic exactly.
  const ctxRes = await fetch(CONTEXT_URL);
  if (!ctxRes.ok) { console.error('Context fetch failed:', ctxRes.status); process.exit(1); }
  const context = await ctxRes.json();
  console.log('Context loaded: chars=' + context.chars + ', tokens~' + context.tokensApprox + ', generated=' + context.generatedAt);

  const question = 'What year was pickleball invented?';

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

  const payload = { model: MODEL, max_tokens: 600, system, messages };
  const bodyJson = JSON.stringify(payload);
  console.log('Payload total:', bodyJson.length, 'bytes');
  console.log('System length:', system.length);
  console.log('User msg[0].text length:', messages[0].content[0].text.length);

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': KEY,
      'anthropic-version': '2023-06-01'
    },
    body: bodyJson
  });
  console.log('\nResponse status:', res.status, res.statusText);
  const bodyText = await res.text();
  console.log('Response body length:', bodyText.length);
  console.log('Response body:');
  console.log(bodyText);
})();
