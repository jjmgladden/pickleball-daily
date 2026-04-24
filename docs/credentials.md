# Credentials Inventory

**Version:** 1 | **Last updated:** 2026-04-24 (Session 6 — Path B activated end-to-end: glad-fam.com domain purchased + verified, EMAIL_FROM ✅, EMAIL_RECIPIENTS re-expanded to 3, multi-recipient sending operational)

This is the canonical, living record of every credential (API key, token, account login) that the **pickleball-daily** project uses. Updated whenever a credential is added, rotated, or revoked.

The doc lists *what exists* and *where it lives* — never the actual values. Real values live only in your password manager + the encrypted secret stores listed below.

> **Maintenance trigger:** Per `CLAUDE.md` § Session-End Protocol Step 2, this doc must be updated in any session where a credential is added, rotated, revoked, moved between storage locations, or has a status change. The KB owner-action list at session end checks this. If you're reading this doc and notice it's out of date with reality, update it as part of whatever session you're in.

---

## Table of Contents

1. [Quick primer](#quick-primer)
2. [Storage locations](#storage-locations)
3. [Active credentials inventory](#active-credentials-inventory)
4. [Adding a new credential — checklist](#adding-a-new-credential--checklist)
5. [Rotating a credential — checklist](#rotating-a-credential--checklist)
6. [Lost / leaked credential — recovery procedure](#lost--leaked-credential--recovery-procedure)
7. [Per-credential detail sections](#per-credential-detail-sections)

---

## Quick primer

A **credential** is a string of characters that proves identity to a third-party service (Google, Resend, GitHub, Cloudflare). Holding the credential = ability to act as you on that service. Treat each one like a house key.

### Flavors

- **API key** — long random string from a service's dashboard. Most common.
- **Personal Access Token (PAT)** — GitHub-specific API key, can be scoped narrowly.
- **OAuth token** — auto-managed when you click "Allow" in a browser-based login flow. You don't usually handle these directly.
- **Account password / 2FA** — what you remember + your phone.
- **Service-managed CLI token** — auto-stored after `wrangler login` / `gh auth login`. You don't touch these directly.

### The non-negotiable rules

1. **Never commit a credential to git.** Public repo = compromised forever. The `scripts/check-secrets.js` gate catches this on the way in.
2. **Each credential has one job.** Don't share across projects unless absolutely necessary.
3. **Scope as narrowly as the service allows.** Fine-grained > broad. Single-API-restriction > full-account.
4. **You cannot recover a credential — only replace it.** Services show the value once. If lost: delete the dead one, create a new one.
5. **Rotation is normal.** Replace each credential annually or on suspicion of leakage. Process: create new → paste into all storage locations → revoke old.

---

## Storage locations

Five distinct places credentials live in this project:

| Location | What it is | Visible to | Used when |
|---|---|---|---|
| **Your password manager** | Personal copy of every credential. Canonical home that you maintain. | You only. | Source of truth — where you paste *from* into all other locations. |
| **Local `.env` file** | Plain-text file at project root. Gitignored. Never leaves your Windows machine. | You + anything running on your machine. | Running ingestion locally (`node ingestion/fetch-daily.js`, `npm run send:email`, etc.). |
| **GitHub repository Secrets** | Encrypted in GitHub's vault. Readable only by your workflows. | The workflow at runtime. Not even you can read after pasting (only delete + re-paste). | GitHub Actions runs your daily workflow. |
| **Cloudflare Worker secrets** | Encrypted in Cloudflare's vault. Readable only by the deployed Worker. | The Worker at runtime. Not even you can read after pasting. | Worker is deployed and receiving requests. |
| **Service-managed CLI auth** | Hidden token files written by `wrangler login` / `gh auth login`. | The CLIs only. | You run a wrangler / gh command from your terminal. |

**Direction of movement:** password manager → all other locations (one-way). Never the other direction. If the password manager copy is lost, you re-create at the source service rather than trying to extract from a deployment location.

---

## Active credentials inventory

Quick-reference table. Detailed sections below.

| Name | Type | Status | Created | Used by | Where stored | Manage at |
|---|---|---|---|---|---|---|
| **`YOUTUBE_API_KEY`** | API key (Google) | ✅ Active | 2026-04-22 (Session 2) | `ingestion/lib/youtube-api.js` (highlight ingestion) | Local `.env` + GitHub Secret | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) |
| **`RESEND_API_KEY`** | API key (Resend) | ✅ Active | 2026-04-23 (Session 6) | `ingestion/send-email.js` | GitHub Secret | [Resend → API Keys](https://resend.com/api-keys) |
| **`EMAIL_RECIPIENTS`** | Plain config | ✅ Active | 2026-04-23 (Session 6) | `ingestion/send-email.js` | GitHub Secret | [Repo Secrets](https://github.com/jjmgladden/pickleball-daily/settings/secrets/actions) |
| **`EMAIL_FROM`** | Plain config (sender address) | ✅ Active | 2026-04-24 (Session 6) | `ingestion/send-email.js` | GitHub Secret | [Repo Secrets](https://github.com/jjmgladden/pickleball-daily/settings/secrets/actions) |
| **`glad-fam.com`** (domain) | Owned domain | ✅ Active | 2026-04-24 (Session 6) | Resend sender + future personal use | Cloudflare Registrar (account credentials in password manager) | [Cloudflare Registrar](https://dash.cloudflare.com/?to=/:account/registrar) |
| **`GITHUB_TOKEN`** (Worker) | Fine-grained PAT | ⏸ Not yet | — | `worker/src/index.js` | Cloudflare Worker secret | [GitHub PAT settings](https://github.com/settings/personal-access-tokens) |
| **DUPR username/password** | Account credentials | ⏸ Phase 2 | — | `ingestion/lib/dupr-api.js` (Phase 2) | Local `.env` only | dupr.com |
| **Cloudflare account login** | Account credentials | ⏸ Not yet | — | `wrangler` CLI | Wrangler config | [Cloudflare dashboard](https://dash.cloudflare.com) |
| **Google Cloud account** | Account credentials | ✅ Active | (pre-existing) | Hosts the YouTube key project | Your password manager | [Google Cloud Console](https://console.cloud.google.com) |
| **Resend account** | Account credentials | ✅ Active | 2026-04-23 (Session 6) | Holds the Resend API key | Your password manager | https://resend.com |
| **GitHub account** | Account credentials | ✅ Active | (pre-existing) | Repo + Actions + future PAT | Your password manager | https://github.com |
| **GitHub git push auth** | OAuth (Windows Credential Manager) | ✅ Active | (pre-existing) | `git push` from terminal | Windows Credential Store | Windows Credential Manager (`cmdkey /list`) |

Status legend: ✅ Active · ⏸ Not yet created (or not yet needed)

---

## Adding a new credential — checklist

Repeatable process for any new credential:

1. **Decide on the name.** Use `UPPER_SNAKE_CASE` for env-var-style names (`RESEND_API_KEY`, not `resend-api-key`). Be specific (`GITHUB_TOKEN_WORKER`, not just `GITHUB_TOKEN`, if you have multiple).
2. **Generate at the source service.** Log into the dashboard, create the credential, **copy the value before closing the dialog** (most services show only once).
3. **Paste into your password manager FIRST.** Before you do anything else with it. This is the canonical home.
4. **Paste into the deployment location(s):**
   - For GitHub Actions: [Repo Secrets page](https://github.com/jjmgladden/pickleball-daily/settings/secrets/actions) → New repository secret.
   - For Cloudflare Worker: `cd worker && npx wrangler secret put NAME_HERE`.
   - For local development: edit `.env` (project root, gitignored).
5. **Update `.env.example`** with a commented line documenting the variable name (NOT the value):
   ```
   # NEW_CREDENTIAL_NAME=...
   ```
6. **Update this document** (`docs/credentials.md`) — add a row to the inventory table + a per-credential detail section below.
7. **Update KB if appropriate** — for credentials that come with policy decisions (sharing posture, rotation cadence), add or update a KB entry.
8. **Verify it works** — run a workflow / Worker / local script that exercises the new credential. Check the log for success.
9. **Commit the doc + .env.example + KB changes** in one bundled commit.

---

## Rotating a credential — checklist

Recommended cadence: annually, OR immediately on suspicion of leakage.

1. **Generate a NEW credential** at the source service. Most services let you have multiple active credentials at once — useful for zero-downtime rotation.
2. **Paste new value into all storage locations** (password manager → GitHub Secret / Cloudflare Worker secret / local `.env`).
3. **Verify the new credential works** by triggering whatever uses it (workflow run, Worker request, local script).
4. **Revoke the OLD credential** at the source service. Don't leave orphans — every active credential is an attack surface.
5. **Update this doc** — change the "last rotated" date in the credential's detail section.

---

## Lost / leaked credential — recovery procedure

If you've lost a credential or suspect it's been exposed (committed to git accidentally, screenshot leaked, employee left, etc.):

1. **Treat as compromised immediately.** Don't wait to confirm. Time matters.
2. **Revoke the existing credential** at the source service first. This stops the bleed.
3. **Generate a new credential** at the source service.
4. **Paste new value into all storage locations.**
5. **Verify replacement works.**
6. **Investigate the leak** (if relevant). Check `git log` for the offending commit; rotate any other credentials that may have been exposed in the same incident.
7. **Update this doc.** Note what happened in the credential's detail section as a maintenance log entry.

---

## Per-credential detail sections

### `YOUTUBE_API_KEY`

- **Type:** Google Cloud API key, restricted to YouTube Data API v3.
- **Used by:** `ingestion/lib/youtube-api.js` — fetches channel uploads + video metadata for the Highlights tab + email Top Highlights section.
- **Storage:** Local `.env` (for local ingestion runs) + GitHub Secret named `YOUTUBE_API_KEY` (for the daily workflow).
- **Source dashboard:** https://console.cloud.google.com/apis/credentials
- **Format:** `AIza...` followed by ~35 alphanumeric characters.
- **Quota:** 10,000 units/day. Daily ingestion uses ~10–20 units. Plenty of headroom.
- **Restrictions to apply:** API restriction = "YouTube Data API v3 only". (Application restriction can be left unrestricted; ours runs from GH Actions IPs that change.)
- **If lost:** revoke at the dashboard, create new key with same restrictions, update both storage locations, run `node ingestion/fetch-highlights.js` to verify.
- **Rotation history:**
  - 2026-04-22 (Session 2) — initial creation.
- **Cross-reference:** [KB-0006](knowledge-base.md#kb-0006--youtube-data-api-v3--shared-key-with-sibling-project-autopilot-local-copy)
- **Note on "shared with sibling project":** KB-0006 documents this as shared with the sibling Baseball Project. Verify before assuming during rotation — if accounts diverge, treat as separate.

### `RESEND_API_KEY`

- **Type:** Resend API key, scoped to "Sending access".
- **Used by:** `ingestion/send-email.js` — sends the daily morning briefing email.
- **Storage:** GitHub Secret named `RESEND_API_KEY`.
  - Could also live in local `.env` for testing `npm run send:email` locally; not currently set there.
- **Source dashboard:** https://resend.com/api-keys
- **Format:** `re_` followed by ~30 alphanumeric characters.
- **Quota:** Free tier — 100 emails/day, 3,000/month. Daily briefing uses 1 send per recipient. Headroom is enormous.
- **Restrictions to apply:** Permission = "Sending access" (NOT "Full access"). Domain = "All domains".
- **If lost:** revoke at the Resend dashboard, create new key with "Sending access", update GitHub Secret, dispatch a test workflow run to verify.
- **Rotation history:**
  - 2026-04-23 (Session 6) — initial creation; first test send verified successfully (Resend id `d2b4f1e7-9b04-4df8-8d99-2b4eefeac646`).
- **Cross-reference:** [KB-0007](knowledge-base.md#kb-0007--resend-email--shared-account-separate-recipient-list)
- **Account note:** Owner's Resend account is at user `jjmgladden`. KB-0007 originally documented this as "shared with sibling project" — that turned out to be incorrect; this is a fresh account created Session 6 specifically for this project. KB-0007 will be revised at Session 6 shutdown to reflect actual state.

### `EMAIL_RECIPIENTS`

- **Type:** Plain config string (comma-separated email addresses, no spaces). Not a true credential, but stored as a Secret for workflow access + privacy hygiene.
- **Used by:** `ingestion/send-email.js`.
- **Storage:** GitHub Secret named `EMAIL_RECIPIENTS`.
- **Format example:** `you@example.com,reader@example.com`
- **Editing:** GitHub Secrets are pure-replace — to add or remove a recipient, click the edit icon next to the secret on the Repo Secrets page, paste the new full comma-separated list, save. **Always include EVERY current recipient + EVERY new recipient in one full string.** Forgetting an existing recipient silently drops them from future sends.
- **Where the canonical list lives:** owner's password manager has the actual comma-separated string. This doc tracks WHO is on the list (descriptors only, no actual addresses) so future sessions can see membership without seeing values.
- **Current value:** 3 recipients as of 2026-04-24 (Path B activated):
  - Owner's primary address (added 2026-04-23, Session 6)
  - Owner's brother (eastern-zone reader, added 2026-04-24, Session 6 via Path B)
  - Owner's brother's wife (added 2026-04-24, Session 6 via Path B)
- **Recipient change log:**
  - 2026-04-23 (Session 6) — initial: owner only
  - 2026-04-24 (Session 6, ~05:06 UTC) — expanded to 3 recipients. Verification run `24873265142` failed (Resend 403 due to Path A free-tier sender restriction).
  - 2026-04-24 (Session 6, ~05:15 UTC) — reverted to 1 recipient (owner only) to stop daily failure-email noise.
  - 2026-04-24 (Session 6, ~22:59 UTC) — Path B activated (see KB-0034 + § glad-fam.com domain section). Re-expanded to 3 recipients. Verification run `24915664144` succeeded — multi-recipient sending operational.
- **Maintenance log:**
  - 2026-04-23 (Session 6) — initial set with owner only; first email confirmed delivered.
  - 2026-04-24 (Session 6) — recipient list expanded from 1 to 3 — failed (Path A restriction). Reverted to 1.
  - 2026-04-24 (Session 6) — Path B activated; recipient list re-expanded to 3; multi-recipient sending verified.

### `EMAIL_FROM`

- **Type:** Plain config string — sender display name + address.
- **Used by:** `ingestion/send-email.js`. If unset, defaults to `Ozark Joe's Pickleball Daily <onboarding@resend.dev>` (Path A — owner-only sending due to Resend free-tier restriction).
- **Storage:** GitHub Secret named `EMAIL_FROM`.
- **Current status:** ✅ Active (2026-04-24 — Path B). Value uses verified domain `glad-fam.com`.
- **Format:** `Display Name <localpart@verified-domain>` — must be a sender on a domain verified at Resend.
- **Source dashboard:** [Repo Secrets](https://github.com/jjmgladden/pickleball-daily/settings/secrets/actions) for the value · Resend dashboard for domain verification status (Domains tab).
- **If lost / accidentally cleared:** the workflow falls back to the Path A default sender (`onboarding@resend.dev`), which silently restricts sends back to owner-only. To restore: edit the Secret with the same value (display + verified-domain address). Domain verification on Resend is unaffected by losing this Secret.
- **Maintenance log:**
  - 2026-04-24 (Session 6) — first set; sender on verified `glad-fam.com` domain. Path B activated.

### `GITHUB_TOKEN` (Worker — fine-grained PAT)

- **Type:** Fine-grained GitHub Personal Access Token.
- **Used by:** `worker/src/index.js` — creates Issues from form submissions.
- **Storage:** Cloudflare Worker secret (set via `npx wrangler secret put GITHUB_TOKEN` from `worker/`).
- **Source dashboard:** https://github.com/settings/personal-access-tokens
- **Format:** `github_pat_` followed by ~80 alphanumeric characters.
- **Status:** Not yet created — Worker is not deployed.
- **When created, scope must be:**
  - **Repository access:** Only select repositories → choose `jjmgladden/pickleball-daily` (single repo, not "all repositories")
  - **Repository permissions → Issues:** Read and write
  - **All other permissions:** leave at "No access"
  - **Expiration:** 1 year recommended.
- **If lost:** revoke at the GitHub PAT settings page, create new with identical scope, run `npx wrangler secret put GITHUB_TOKEN` from `worker/` to update the Worker, submit a test form to verify.
- **Cross-reference:** [KB-0012](knowledge-base.md#kb-0012--cloudflare-worker-public-submissions--separate-worker-separate-pat) · `worker/README.md`

### DUPR username / password (Phase 2, optional)

- **Type:** Account credentials.
- **Used by:** `ingestion/lib/dupr-api.js` (Phase 2 per-player DUPR fetching).
- **Storage:** Local `.env` only (typically). Not used by GitHub Actions (per-player scrape is a Phase 2 enhancement; orchestration not yet decided).
- **Source:** Sign up at https://dupr.com.
- **Status:** Not yet created — DUPR per-player access is Phase 2.
- **Cross-reference:** `data/master/sources.json` § DUPR partner API note.

### Cloudflare account login

- **Type:** Account credentials.
- **Used by:** Multiple — (a) owns `glad-fam.com` domain via Cloudflare Registrar; (b) hosts DNS for `glad-fam.com` (Resend SPF/DKIM/DMARC records live here); (c) future Worker deployment will use this same account.
- **Storage:** Account credentials in owner's password manager. Wrangler will auto-store an OAuth token at `~/.wrangler/config/default.toml` (Windows equivalent) when `wrangler login` runs (not yet, Worker still dormant).
- **Source:** https://dash.cloudflare.com (existing account — created 2026-04-24 alongside `glad-fam.com` purchase).
- **Status:** ✅ Active (account exists, owns `glad-fam.com`, hosts its DNS). Worker deployment via wrangler still pending owner action.
- **Cross-reference:** `worker/README.md` · § glad-fam.com domain section (below)

### `glad-fam.com` domain

- **Type:** Owned domain name.
- **Used by:** Resend sender address (`daily@glad-fam.com` via `EMAIL_FROM` Secret). Future personal-use possibilities (personal email forwarding, future personal landing page, future projects).
- **Storage:**
  - **Registrar:** Cloudflare Registrar (linked to owner's Cloudflare account)
  - **DNS host:** Cloudflare DNS (auto-set when Cloudflare is the registrar)
  - **Renewal:** annual, ~$10/year at Cloudflare's at-cost pricing
- **DNS records currently active:**
  - `MX send.glad-fam.com → feedback-smtp.us-east-1.amazonses.com` (Resend bounce handling)
  - `TXT resend._domainkey.glad-fam.com` (Resend DKIM public key)
  - `TXT send.glad-fam.com` (Resend SPF: `v=spf1 include:amazonses.com ~all`)
  - All 3 records were pushed automatically by Resend's Auto-configure flow during Session 6 setup. One-time push; Resend cannot modify DNS again without owner re-authorization.
- **Source dashboard:**
  - Domain ownership / renewal: [Cloudflare Registrar](https://dash.cloudflare.com/?to=/:account/registrar)
  - DNS records: Cloudflare DNS dashboard for `glad-fam.com`
  - Resend domain status: https://resend.com/domains
- **Verification status on Resend:** ✅ Verified (2026-04-24, ~3 minutes after Auto-configure push)
- **If lost:** if the domain registration lapses (failure to renew), Resend will eventually fail to verify SPF/DKIM/DMARC and email sending will degrade. To prevent: keep auto-renewal enabled at Cloudflare; renewal reminder emails go to owner's primary address. If domain is deliberately abandoned, the project must either acquire a new domain (repeating Path B) or revert to Path A (owner-only sending via `onboarding@resend.dev`).
- **Status:** ✅ Active.
- **Maintenance log:**
  - 2026-04-24 (Session 6) — purchased via Cloudflare Registrar (~$10/year); Resend Auto-configure pushed 3 DNS records; Resend verification completed ~3 min later; immediately used as the verified sender domain for the daily morning email.
- **Cross-reference:** KB-0033 (the limitation that drove this purchase) · KB-0034 (the activation record) · § EMAIL_FROM · § Cloudflare account login

### Google Cloud account

- **Type:** Account credentials (pre-existing, owned by you personally).
- **Used by:** Hosts the GCP project that owns the `YOUTUBE_API_KEY`.
- **Storage:** Your password manager.
- **Notes:** This account also owns the sibling Baseball Project's YouTube key. Be careful with billing settings — YouTube Data API v3 is free at our usage volumes, but a misconfigured restriction or an enabled-paid-API could surprise you.

### Resend account

- **Type:** Account credentials.
- **Used by:** Holds the `RESEND_API_KEY`.
- **Storage:** Your password manager.
- **Created:** 2026-04-23 (Session 6).
- **Username:** `jjmgladden`
- **Plan:** Free tier (100 emails/day, 3,000/month).

### GitHub account

- **Type:** Account credentials (pre-existing, owned by you personally).
- **Used by:** Owns the `pickleball-daily` repo, the workflows, the Repo Secrets, and (eventually) the fine-grained PAT for the Worker.
- **Storage:** Your password manager.
- **Notes:** 2FA is strongly recommended for any GitHub account that owns a PAT or hosts repos with Secrets.

### GitHub git push auth (Windows Credential Manager)

- **Type:** OAuth credential auto-managed by Git Credential Manager on Windows.
- **Used by:** Every `git push` you run from your terminal.
- **Storage:** Windows Credential Store. View with `cmdkey /list | grep git` from a command prompt.
- **Created:** Pre-existing (was already set up before this project — likely from sibling project work).
- **If lost:** Git will prompt for re-auth on next push; a browser window opens for GitHub login, token gets re-stored automatically.

---

## Maintenance log

Significant credential events worth recording:

- **2026-04-22 (Session 2)** — `YOUTUBE_API_KEY` set up; ingestion verified end-to-end.
- **2026-04-22 (Session 5)** — `YOUTUBE_API_KEY` pasted as GitHub Secret; first workflow run consumed it successfully.
- **2026-04-23 (Session 6)** — Resend account created at `jjmgladden`; `RESEND_API_KEY` + `EMAIL_RECIPIENTS` created and pasted as GitHub Secrets; first email send (workflow run `24869972946`, Resend id `d2b4f1e7-9b04-4df8-8d99-2b4eefeac646`) confirmed delivered to owner's primary address; KB-0007 revised to reflect that the original "shared with sibling Baseball Project" assumption was inaccurate (account is a fresh Resend signup specific to this project).
- **2026-04-23 (Session 6)** — Doc itself created and made canonical via CLAUDE.md v2 Session-End Protocol Step 2 mandate.
- **2026-04-24 (Session 6)** — `EMAIL_RECIPIENTS` expanded from 1 to 3 recipients (owner + brother + brother's wife) per owner-led GitHub Secret update; per-recipient descriptors + change log added to the EMAIL_RECIPIENTS detail section. Verification dispatched as workflow run `24873265142` — **failed with Resend 403 (free-tier sender restriction).**
- **2026-04-24 (Session 6)** — `EMAIL_RECIPIENTS` reverted to 1 recipient (owner only) to stop daily failure-email noise. Multi-recipient deferred until Path B (Resend domain verification) lands in a future session. Verification dispatched as workflow run `24873522457`.
- **2026-04-24 (Session 6, ~22:30 UTC)** — Owner purchased `glad-fam.com` domain via Cloudflare Registrar (~$10/year); domain is now an actively tracked owned asset (see § glad-fam.com domain section).
- **2026-04-24 (Session 6, ~22:45 UTC)** — Path B activated: Resend Auto-configure pushed SPF/DKIM/DMARC records into Cloudflare DNS, domain verified within ~3 minutes; `EMAIL_FROM` Secret created with `Ozark Joe's Pickleball Daily <daily@glad-fam.com>`; `EMAIL_RECIPIENTS` re-expanded from 1 to 3 recipients. Verification run `24915664144` succeeded with `Recipients: 3`, Resend id `921b759a-caf3-4ca3-9fc9-1147568fe133`. Multi-recipient daily morning email is operational.

---

## Related documents

- `docs/knowledge-base.md` — KB entries reference specific credentials and policy decisions.
- `.env.example` — template showing which env vars exist (without values).
- `.gitignore` — ensures `.env` is never committed.
- `scripts/check-secrets.js` — pre-commit/pre-push gate that scans for known credential patterns.
- `worker/README.md` — Worker deployment walkthrough including PAT creation.
