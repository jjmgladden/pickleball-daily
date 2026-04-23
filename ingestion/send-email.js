#!/usr/bin/env node
/**
 * send-email — v1
 *
 * Sends the morning briefing via Resend after fetch-daily.js + snapshot commit
 * in .github/workflows/daily.yml. Locally: `node ingestion/send-email.js`
 * with env vars set (or `EMAIL_DRY_RUN=1` to preview without sending).
 *
 * Required env (skip-without-failing if missing — workflow stays green):
 *   RESEND_API_KEY      — from resend.com dashboard (shared with sibling project per KB-0007)
 *   EMAIL_RECIPIENTS    — comma-separated list ("a@b.com,c@d.com")
 *
 * Optional env:
 *   EMAIL_FROM          — default "Ozark Joe's Pickleball Daily <onboarding@resend.dev>"
 *   EMAIL_DRY_RUN       — "1" to log the email without sending
 */

const fs = require('fs');
const path = require('path');

try { require('./lib/env').loadEnvFile(); } catch {}

const { buildEmail } = require('./lib/email-template');

const DEFAULT_FROM = "Ozark Joe's Pickleball Daily <onboarding@resend.dev>";
const PROJECT_ROOT = path.resolve(__dirname, '..');
const SNAPSHOT_PATH = path.join(PROJECT_ROOT, 'data', 'snapshots', 'latest.json');

async function main() {
  const apiKey = process.env.RESEND_API_KEY;
  const recipientsRaw = process.env.EMAIL_RECIPIENTS || '';
  const from = process.env.EMAIL_FROM || DEFAULT_FROM;
  const dryRun = process.env.EMAIL_DRY_RUN === '1';

  if (!apiKey && !dryRun) {
    console.log('[send-email] RESEND_API_KEY not set — skipping (configure in GitHub Secrets to activate)');
    return;
  }

  const recipients = recipientsRaw.split(',').map(s => s.trim()).filter(Boolean);
  if (!recipients.length && !dryRun) {
    console.log('[send-email] EMAIL_RECIPIENTS empty — skipping (add comma-separated addresses to GitHub Secret)');
    return;
  }

  if (!fs.existsSync(SNAPSHOT_PATH)) {
    console.error('[send-email] Snapshot not found at ' + SNAPSHOT_PATH + '. Run fetch-daily.js first.');
    process.exit(1);
  }

  const snapshot = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf8'));
  const { subject, html, text } = buildEmail(snapshot);

  console.log('[send-email] Recipients: ' + recipients.length + '  From: ' + from);
  console.log('[send-email] Subject: ' + subject);

  if (dryRun) {
    console.log('[send-email] DRY RUN — not sending. HTML size: ' + html.length + ' bytes');
    console.log('---- plain text preview ----');
    console.log(text);
    console.log('---- end preview ----');
    return;
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ from, to: recipients, subject, html, text })
  });

  if (!res.ok) {
    const body = await res.text();
    console.error('[send-email] Resend API ' + res.status + ' ' + res.statusText + ': ' + body.slice(0, 300));
    process.exit(1);
  }

  const result = await res.json();
  console.log('[send-email] Sent. Resend id: ' + result.id);
}

main().catch(err => {
  console.error('[send-email] FATAL: ' + err.message);
  console.error(err.stack);
  process.exit(1);
});
