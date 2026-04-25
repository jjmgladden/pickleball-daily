# Pickleball Daily Intelligence — Knowledge Base

Living record of decisions, open issues, and action items. Updated every session.

**Last updated:** 2026-04-24 (Session 6 FORMAL FINAL SHUTDOWN — **KB v7**, 34 entries through KB-0034; all Phase 3B + Phase 3C.1 + Phase 3C.2 + cross-cutting docs + post-shutdown Path B extensions captured. Session 7 starts fresh with News tab ATP'd as primary agenda)

**Tier convention (dynamic types only — adopted from MODR):**
- **T1** — Critical / production-impacting; fix first
- **T2** — Near-Term; planned for an upcoming session
- **T3** — Deferred; someday / research

Static types (Reference, Decision, Limitation) omit Tier.

---

## Entries

### KB-0001 | Tech stack: vanilla ES modules + static JSON + PWA (inherited)
- **Type:** Decision
- **Date:** 2026-04-22
- **Category:** Architecture / Stack
- **Tags:** architecture, inheritance, es-modules, pwa
- **Finding:** Vanilla ES modules + CSS variables + JSON data layer. No build step, no React, no bundler. Service worker for PWA offline. Inherited wholesale from the sibling Baseball Project; proven pattern across that project's Phases 1-3B. No pickleball-specific reason to deviate.
- **Status:** Closed
- **Cross-ref:** CLAUDE.md § Data Flow Architecture · CLAUDE.md § Coding Standards · app/ tree (Phase 1)

### KB-0002 | Source map — winner-source per data domain
- **Type:** Decision
- **Date:** 2026-04-22
- **Category:** Data / Sources
- **Tags:** sources, conflict-resolution, tiers
- **Finding:** Authoritative source per domain when sources disagree:
  - Schedules → `ppa-tour` + `mlp-official`
  - Live match scoring → `pickleball-brackets` (powers PPA draw system; faster than ppatour.com for in-progress state)
  - Final results → `ppa-tour` (reconcile brackets within 24h)
  - MLP teams + standings → `mlp-official` (The Dink breaks trades first — "developing" until echoed)
  - DUPR ratings → `dupr-official` (no substitute)
  - PPA rankings → `ppa-tour` (PickleWave ELO NOT a substitute)
  - Rules → `usap-rulebook-2026-pdf` (annual PDF is canonical)
  - History → `usap-official` (pickle-boat origin; dog variant flagged, not suppressed)
  - Video highlights → `youtube-ppa-tour` + `youtube-mlp` (embed confirmed — see KB-0013)

  Full registry in `data/master/sources.json`. "Developing vs confirmed" news-velocity gate: social-only T2/T3 posts carry developing badge until T1 echo.
- **Status:** Closed
- **Cross-ref:** data/master/sources.json · docs/phase-0-research.md § 1

### KB-0003 | Versioning convention: whole numbers
- **Type:** Decision
- **Date:** 2026-04-22
- **Category:** Process / Versioning
- **Tags:** versioning, inheritance, modr
- **Finding:** All versioning uses whole numbers (v1, v2, v10). Every change rolls. Previous archives to `archive/` subfolder. Applies to CLAUDE.md, JSON schemas, HTML shell, ingestion libraries, docs. Inherited from MODR convention via sibling project.
- **Status:** Closed
- **Cross-ref:** CLAUDE.md § Versioning · archive/CLAUDE_stub.md

### KB-0004 | Player index scope: top-N + public-DUPR, not all-time
- **Type:** Decision
- **Tier:** T2
- **Dependency:** Claude
- **Date:** 2026-04-22
- **Category:** Data / Players
- **Tags:** players, scope, dupr, ppa
- **Finding:** Initial player index bounded by currently-active PPA + MLP pros + publicly-visible DUPR holders. `data/master/players-seed.json` seeds ~30 headliners. This is NOT an all-time player index (sibling Baseball Project uses Chadwick 1871+ for ~23k MLB players; no pickleball equivalent). Expansion via curation-backlog workflow (Phase 2+). Decision driven by: (a) no canonical pickleball player registry exists, (b) sport is young so "all-time" is achievable later, not urgent now.
- **Status:** Open (Phase 2 expansion plan needed)
- **Cross-ref:** data/master/players-seed.json · docs/phase-0-research.md § 10

### KB-0005 | Repo privacy posture: public with secret scanner gate
- **Type:** Decision
- **Tier:** T2
- **Dependency:** Owner
- **Date:** 2026-04-22
- **Category:** Deployment / Security
- **Tags:** repo, github, secrets, privacy
- **Finding:** Planned repo: `jjmgladden/pickleball-daily` (public). Gate: `scripts/check-secrets.js` pre-commit, CLAUDE.md PII-clean (owner name/email NOT in public file — use "project owner"), narrow file scope, `.gitignore` covers `.env` + credentials + keys. Mirror sibling-project posture. CLAUDE.md v1 is already PII-clean per decision.

  **Phase 1 Session 2 update:** Secret scanner implemented (`scripts/check-secrets.js` — 8 patterns: Google API, GitHub PAT classic + fine-grained, AWS, Resend, Anthropic, OpenAI, Slack). Ran clean at session end with real YouTube API key in local `.env`.

  **Session 5 (2026-04-22) — Closed:** Owner created public repo `jjmgladden/pickleball-daily` via web UI. First commit `9f6ac91` pushed (68 files, 12366 insertions) after four-stage pre-push gate: (1) check-secrets clean, (2) `.gitignore` audit, (3) staged-diff PII + real-key grep clean, (4) owner ATP on Option A (gitignore internal workflow docs rather than scrub). Internal workflow docs (`sessions/`, `PICKLEBALL_Session1_KickoffPrompt.md`) are now gitignored — stay local, not public. `docs/knowledge-base.md` KB-0015 scrubbed (removed specific username path; kept the `&`-in-Windows-path technical content). `package-lock.json` un-ignored to allow GH Actions `npm ci`. Git commit metadata shows `jjmgladden@gmail.com` per Option A2 (owner accepted; email was already public via sibling Baseball Project commits).
- **Status:** Closed (Session 5)
- **Cross-ref:** CLAUDE.md § Project Context · CLAUDE.md § Secret Safety · scripts/check-secrets.js · https://github.com/jjmgladden/pickleball-daily

### KB-0006 | YouTube Data API v3 — shared key with sibling project (autopilot local copy)
- **Type:** Decision
- **Tier:** T2
- **Dependency:** Claude
- **Date:** 2026-04-22 (updated Session 2 — autopilot executed successfully)
- **Category:** Data / APIs / Security
- **Tags:** youtube, secrets, highlights, sharing, autopilot
- **Finding:** Share the sibling project's single Google Cloud project + YouTube Data API v3 key. Restricted to YouTube Data API v3 only.

  **Session 2 execution:** Step-0 autopilot ran in ~60s: read `../Baseball Project/.env`, extracted `YOUTUBE_API_KEY`, wrote to `Pickleball Project/.env` (gitignored), verified with a 1-unit `channels.list` call against `@PPATour` (→ channel id `UCSP6HlrMmRqogym2aHBPHpw`, title "PPA Tour"). Phase 1 proceeded unblocked. Key never echoed in user-facing chat.

  **Remote (Phase 3) — owner-paste still pending:** when `jjmgladden/pickleball-daily` repo exists and GitHub Actions cron is wired, owner pastes same value into repo Secret `YOUTUBE_API_KEY`.

  Quota strategy: `channels.list` (1u) to resolve handles + `playlistItems.list` (1u) for recent uploads per channel. Current daily spend: ~2 units × N channels. Nowhere near 10k/day limit.

  **Session 5 (2026-04-22) — Closed:** Owner pasted `YOUTUBE_API_KEY` as repo Secret via web UI (Settings → Secrets and variables → Actions → New repository secret). First workflow_dispatch run `24816711514` succeeded in 1m 9s end-to-end — `fetch-highlights.js` consumed the secret and produced the expected 3-channel highlight payload, proving the paste worked. No key value echoed back to owner or assistant.
- **Status:** Closed (Session 5 — both halves)
- **Cross-ref:** data/master/video-sources.json · CLAUDE.md § Data Sources · ingestion/lib/youtube-api.js · .github/workflows/daily.yml

### KB-0007 | Resend email — shared account assumption was wrong; fresh account created
- **Type:** Decision
- **Tier:** T2
- **Dependency:** Claude
- **Date:** 2026-04-22 (original) · revised 2026-04-23 (Session 6)
- **Category:** Features / Delivery / Ops
- **Tags:** email, resend, notifications, account
- **Finding:** Original v6 finding assumed the project would share the sibling Baseball Project's Resend.com account + `re_...` API key. **That assumption turned out to be wrong** — owner had never opened a Resend account, and the sibling project's Resend status is not currently verified. Session 6 walked owner through fresh Resend signup (account `jjmgladden`, free tier — 100 emails/day / 3,000/month) and a brand-new API key creation specific to this project.

  Phase 3 scope (delivered Session 6): rich HTML preview + CTA link — today's live events, top movers, new highlights, future rule-of-the-day expansion. Triggered after daily ingestion (GitHub Actions cron 07:00 UTC). Currently sends to 1 recipient (owner). `EMAIL_RECIPIENTS` is a per-repo Secret with comma-separated list — additional recipients (e.g., eastern-zone family member) will be added once initial email format is reviewed.

  **Session 6 (2026-04-23) — Closed:** Account created. `RESEND_API_KEY` + `EMAIL_RECIPIENTS` GitHub Secrets pasted. First test workflow_dispatch (run `24869972946`) succeeded — email delivered, owner visually confirmed correct rendering in Gmail dark-theme inbox. Resend id `d2b4f1e7-9b04-4df8-8d99-2b4eefeac646` recorded as receipt.

  **Path A → Path B transition completed Session 6 (2026-04-24):** Resend's free tier with the default `onboarding@resend.dev` sender (Path A) only permits sending to the Resend account's own email address. Discovered when expanding `EMAIL_RECIPIENTS` from 1 to 3 hit HTTP 403 (run `24873265142` failed). See KB-0033 for the full failure dialog and KB-0034 for the Path B activation.

  Path B unblocked multi-recipient by: (1) owner purchased `glad-fam.com` via Cloudflare Registrar; (2) verified the domain on Resend via Auto-configure (Resend pushed SPF/DKIM/DMARC records into Cloudflare DNS); (3) added GitHub Secret `EMAIL_FROM = "Ozark Joe's Pickleball Daily <daily@glad-fam.com>"`; (4) re-expanded `EMAIL_RECIPIENTS` to 3 recipients. Verification run `24915664144` succeeded with `Recipients: 3`, Resend id `921b759a-caf3-4ca3-9fc9-1147568fe133`. Multi-recipient daily morning email is live.
- **Status:** Closed (Session 6 — code shipped, account created, secrets pasted, Path A then Path B both verified end-to-end; multi-recipient sending operational)
- **Cross-ref:** KB-0033 · KB-0034 · ingestion/send-email.js · ingestion/lib/email-template.js · .github/workflows/daily.yml · docs/credentials.md § RESEND_API_KEY · docs/credentials.md § EMAIL_RECIPIENTS · docs/credentials.md § EMAIL_FROM · docs/credentials.md § glad-fam.com domain

### KB-0008 | Future AI Q&A layer (Phase 4, schema constraints now)
- **Type:** Decision
- **Tier:** T3
- **Dependency:** Claude
- **Date:** 2026-04-22
- **Category:** Architecture / AI
- **Tags:** ai, q-and-a, phase-4, schema
- **Finding:** Phase 4 adds a natural-language Q&A layer over the JSON corpus (Claude API or similar). NOT built in Phases 0-3. But Phase 0 schema decisions make Phase 4 retrofit cheap:
  1. Every entity has a stable, unique ID (`playerId`, `teamId`, `eventId`, `sourceId`).
  2. Cross-references use IDs, not names.
  3. Timestamps are ISO 8601 with timezone.
  4. Every entity carries `displayName` + `summary` for retrieval.
  5. Source citations are structured `{sourceId, url, retrievedAt}`, not prose.
  6. `confidence` (T1/T2/T3) and `lastUpdated` are first-class fields.
  7. Snapshots in `data/snapshots/` are append-only.

  Phase 1 snapshots (`data/snapshots/latest.json`) preserve these constraints — `schemaVersion: 1`, stable `sourceId` per source, ISO-8601 `generatedAt`, `confidence` passed through from master seeds.
- **Status:** Open (deferred — Phase 4)
- **Cross-ref:** CLAUDE.md § AI-Retrievable Schema Constraints · docs/phase-0-research.md § 0 · data/snapshots/latest.json

### KB-0009 | Ratings vs Rankings UI distinction
- **Type:** Decision
- **Date:** 2026-04-22
- **Category:** UX / Data / Pickleball-specific
- **Tags:** dupr, ppa, ratings, rankings, ui
- **Finding:** DUPR ratings and PPA rankings answer different questions ("how good is this player?" vs "who's winning on tour in the last 52 weeks?"). They must render in separate UI components with:
  - **Separate tabs:** "Rankings" (PPA) and "Ratings" (DUPR). Do NOT merge into a single "Standings" tab.
  - **Different visual treatment:** Rankings use ordinal position chips (`#1`, `#2`). Ratings use numeric value chips (`7.09`, `7.01`). Different CSS classes.
  - **Explicit on-widget labels:** "PPA Tour Ranking (52-Week)" vs "DUPR Doubles Rating" — never just "rank" or "rating" alone.
  - **Separate Movers widgets:** Rankings Movers (weekly PPA shifts) vs Ratings Movers (monthly DUPR Risers).

  **Phase 1 Session 2 implementation:** two separate components — `app/js/components/rating-card.js` (numeric chip, green border, monospace) and `app/js/components/ranking-card.js` (ordinal chip, brown/gold border, `#`-prefix). Two separate tabs. Two separate CSS classes (`.chip-rating` / `.chip-rank`). Players tab displays both side-by-side per player card, each in its own visual treatment. Confirmed in live preview at Session 2 verification.

  Two-sentence UI explainer (from `docs/phase-0-research.md § 11`):
  > A DUPR rating is a skill score on a 2.0–8.0+ scale, updated after every match, that estimates how well you play against any opponent — think of it like a chess Elo.
  > A PPA ranking is a leaderboard position earned from recent pro tournament results, so it measures who is currently winning on tour, not overall skill.
- **Status:** Closed (policy + implementation both in place)
- **Cross-ref:** app/js/components/rating-card.js · app/js/components/ranking-card.js · app/styles/main.css · data/master/ui-modules.json

### KB-0010 | MLP team ecosystem — separate information model from PPA
- **Type:** Decision
- **Date:** 2026-04-22
- **Category:** UX / Data / Pickleball-specific
- **Tags:** mlp, ppa, information-architecture
- **Finding:** MLP's team-centric model does not flatten into PPA's tour-event model. The UI keeps them parallel:
  - **Tournaments tab** — event-centric (PPA's natural view).
  - **MLP Teams tab** — team-centric (MLP's natural view).
  - **Players tab** — player-centric, cross-links to both.

  Phase 1 Session 2 implementation confirms the split: `app/js/tabs/tournaments.js` renders all PPA + MLP events by date bucket (in-progress / upcoming / recent); `app/js/tabs/teams.js` renders MLP teams with home markets + headline players + favorite-star; `app/js/tabs/players.js` cross-links via `mlpTeam2026` field.

  MLP-specific requirements (captured):
  - 20 teams (2026, Premier-only after Challenger elimination).
  - 4-game team-vs-team matchup format (WD, MD, MxD1, MxD2), side-out scoring 2026.
  - DreamBreaker singles tiebreaker (rally to 21, rotate every 4 points).
  - 6-player rosters (3M/3W); keepers from prior year.
  - Standings = per-event-finish points (25 winner → 1 for 9th/10th), not per-match.
- **Status:** Closed
- **Cross-ref:** data/master/mlp-teams.json · app/js/tabs/teams.js · app/js/tabs/tournaments.js

### KB-0011 | Headless-browser scraping accepted for PPA rankings
- **Type:** Decision
- **Date:** 2026-04-22
- **Category:** Ingestion / Tooling
- **Tags:** playwright, puppeteer, scraping, ppa-tour
- **Finding:** `ppatour.com/player-rankings/` is JavaScript-hydrated. Static HTTP fetch returns "Loading…". Accepted new tooling dependency: **Playwright (preferred)**.

  **Phase 1 Session 2 implementation:** `ingestion/fetch-ppa-rankings.js` built — generic `table` parse that caches rows to `logs/cache/ppa-rankings-latest.json`. Orchestrator picks up the cached file when writing snapshots. Scraper honors `Crawl-delay: 3` via 10-second `networkidle` wait. Phase 1.5 must add column mapping (rank / name / points / bracket) after inspecting a live row sample.

  Discipline:
  - Respect `ppatour.com` `Crawl-delay: 3`.
  - Cache + diff aggressively (scrape once per day).
  - Disallow query-string URLs per robots.txt.
  - Run in GitHub Actions (Linux Chromium pre-installed).
  - Local `.env` loader via `ingestion/lib/env.js`.
  **Session 3 (2026-04-22) — Closed:** Column mapping implemented in `ingestion/fetch-ppa-rankings.js`. Observed columns: `rank · playerName · bracket · eventsPlayed · points`. Typed records written to `cache.rankings[]` (all 50 rows, not truncated). `app/js/tabs/rankings.js` renders structured cards via `ranking-card.js` with points/events meta. Re-run verified: Ben Johns #1 (21,300 pts, 27 events), James Ignatowich #50 (1,425 pts).
- **Status:** Closed (Session 3 — column mapping done)
- **Cross-ref:** docs/phase-0-research.md § 2 · CLAUDE.md § Critical Rules § Headless-browser · ingestion/fetch-ppa-rankings.js · app/js/tabs/rankings.js

### KB-0012 | Cloudflare Worker public submissions — separate Worker, separate PAT
- **Type:** Decision
- **Tier:** T3
- **Dependency:** Owner
- **Date:** 2026-04-22
- **Category:** Deployment / Features
- **Tags:** cloudflare, worker, submissions, sharing
- **Finding:** Public-submission endpoint will mirror sibling project's Cloudflare Worker pattern (POST → GitHub Issue). Separate Worker + separate URL + **separate fine-grained GitHub PAT** scoped to Issues-write on `jjmgladden/pickleball-daily` only. Posture: minimum-scope per Worker. No shared Workers or PATs across sibling projects.

  Phase 3 activation (mirrors sibling's Phase 3B):
  1. Cloudflare account + `wrangler login`.
  2. Create fine-grained GitHub PAT, Issues-write scope.
  3. `npx wrangler secret put GITHUB_TOKEN`.
  4. `npx wrangler deploy`.
  5. Wire `SUBMIT_URL` constant in suggest-modal component.

  **Session 3 update (2026-04-22):** Owner confirmed the Worker stays in Phase 3 scope (not skippable) and wants the pattern built reusable across future projects. Implementation note: project-specific values (repo name, Issue label, CORS allowlist) must live in env/config so the `worker/` folder can copy-paste into a future project with minimal edits. Tier effectively T2 now despite the T3 label.
- **Status:** Open (Phase 3)
- **Cross-ref:** CLAUDE.md § Project File Structure § worker/

### KB-0013 | YouTube iframe embed — allowed for PPA + MLP (Phase 1 live test)
- **Type:** Decision
- **Date:** 2026-04-22 (Session 2)
- **Category:** Features / Video / UX
- **Tags:** youtube, iframe, embed, ppa, mlp, highlights
- **Finding:** Per `data/master/video-sources.json § embedPolicy.phase1TestRequired`, Phase 1 had to verify whether PPA and MLP YouTube channels permit third-party embedding (the sibling Baseball Project hit Error 153 on MLB's channel).

  **Test executed (2026-04-22):**
  - One-time test page `app/__iframe-test.html` (deleted post-test) rendered two `<iframe src="https://www.youtube.com/embed/{videoId}?enablejsapi=1">` — one PPA Tour video (`-b2YP7GvyTs` — Johnson/Johnson v Black/Oncins, Sacramento), one MLP video (`NfyuvrtrP2c` — "This wasn't planned…").
  - Both iframes fired `load`, rendered to 371×209 px with visible play buttons and YouTube branding.
  - **No "Video unavailable" overlay. No Error 153.** Visual inspection via preview screenshot confirms both play-button overlays are present, not the grayed-out error state MLB returns.
  - Console clean (no errors).

  **Decision:** iframe rendering is approved for PPA + MLP highlights in Phase 1+. This is **different from the sibling project** where MLB disallows embedding. Implementation plan:
  - Phase 1 (current): highlights tab uses thumbnail + click-out (safe default, already implemented in `app/js/components/highlights.js`).
  - Phase 2+: progressive enhancement — replace thumbnails with iframes on click, or embed directly in the highlight card. Small risk that MLP or PPA changes policy later — fallback to thumbnail remains the safe default.
- **Status:** Closed (test result recorded; progressive enhancement tracked in Phase 2)
- **Cross-ref:** data/master/video-sources.json § embedPolicy · app/js/components/highlights.js · KB-0006

### KB-0014 | Phase 1 local build — PWA + ingestion end-to-end
- **Type:** Action
- **Tier:** T1
- **Dependency:** Claude
- **Date:** 2026-04-22 (Session 2)
- **Category:** Build / Delivery
- **Tags:** phase-1, pwa, ingestion, verification
- **Finding:** Phase 1 local build shipped end-to-end. Deliverables:
  - Scaffolding: `package.json`, `.gitignore`, `.env` (autopilot), `.env.example`, `.nojekyll`, root `index.html` redirect, `README.md`.
  - Scripts: `scripts/serve.js` (port 1965), `scripts/check-secrets.js` (8 patterns, runs clean), `scripts/check-esm.js` (runtime import-check, 16 modules clean).
  - Ingestion (CommonJS): `ingestion/lib/{env,cache,youtube-api,ppa-api,mlp-api,dupr-api}.js` + `fetch-{ppa-events,mlp,dupr-leaderboard,highlights,ppa-rankings,daily}.js`. Orchestrator writes `data/snapshots/2026-04-22.json` + `data/snapshots/latest.json`. Size ~33KB.
  - PWA shell (ES modules): `app/index.html`, `app/icon.svg`, `app/manifest.webmanifest`, `app/sw.js` (`CACHE='pickleball-daily-v1'`), `app/styles/main.css`, `app/package.json` ({"type":"module"}).
  - Core JS: `app/js/app.js`, `app/js/data-loader.js`.
  - Components: `confidence-badge`, `rating-card`, `ranking-card`, `favorites`, `highlights`, `live-scoreboard`.
  - 8 tabs: daily, live, tournaments, teams, players, rankings, ratings, highlights — all render live data from `latest.json` + `players-seed.json`.

  **Live verification (Session 2):** Server on :1965. Preview loaded `http://localhost:1965/app/` — header shows snapshot timestamp; Daily tab shows 4 real upcoming events + 4 real YouTube highlights + 5 top DUPR ratings; MLP Teams shows all 20 teams; Players shows 30 seeded headliners with both rank + rating chips + T2 badges; Ratings shows DUPR top-16 (Ben Johns 7.094 → …) in green numeric chips; Rankings correctly shows "not yet scraped" state with clear instructions; Highlights shows 5 videos each from PPA + MLP; Live shows "no events in progress"; Tournaments shows bucketed in-progress/upcoming/recent.

  **What's not done:** Per-match live scoring feed (Phase 1.5 via PickleballBrackets), PPA ranking column-mapping (raw row dump only), DUPR live scrape (seed-only), splash screen (Phase 3), GitHub Pages deploy (Phase 3), public submissions Worker (Phase 3).
- **Status:** Closed (build + local verification complete)
- **Cross-ref:** CLAUDE.md § Current Phase § Phase 1 · app/ · ingestion/ · scripts/

### KB-0015 | Windows + `npx` breaks on paths containing `&`
- **Type:** Limitation
- **Date:** 2026-04-22 (Session 2)
- **Category:** Tooling / Windows
- **Tags:** windows, npx, playwright, workaround
- **Finding:** The owner's Windows user directory contains a literal `&` character in the username. The `&` triggers CMD's shell-grammar splitting when `npx` forwards arguments — `npx playwright install chromium` was parsed as three commands, and the first half resolved to a non-existent path.

  **Workaround (use this, not npx):**
  ```
  node ./node_modules/playwright/cli.js install chromium
  node ./node_modules/playwright/cli.js install
  ```
  Node's own module resolution doesn't go through CMD.exe, so the space/`&` are handled correctly.

  **Same class of bug may apply to:** any npm script that internally `exec()`s the path, any `npx <bin>` invocation. If a command silently misfires on this machine, try routing via `node ./node_modules/<pkg>/cli.js`.

  **Documented in:** `README.md` (local-dev section should flag; Session 3 can add an explicit note), `scripts/README.md` (future).
- **Status:** Closed (workaround documented)
- **Cross-ref:** ingestion/fetch-ppa-rankings.js · README.md

### KB-0016 | Date display off-by-one due to UTC→local timezone conversion
- **Type:** Issue
- **Tier:** T3
- **Dependency:** Claude
- **Date:** 2026-04-22 (Session 2)
- **Category:** UI / Dates / i18n
- **Tags:** dates, timezone, ui
- **Finding:** Seed `data/master/tournaments-2026.json` stores event dates as plain YYYY-MM-DD strings (`"startDate": "2026-04-27"`). `new Date("2026-04-27").toLocaleDateString()` parses as 2026-04-27T00:00:00Z (UTC), then converts to local time for display — in US timezones west of UTC, this shifts to 2026-04-26.

  Live effect in Session 2 preview: "Veolia Atlanta Pickleball Championships" shows as `Apr 26 – May 2` instead of the correct `Apr 27 – May 3`.

  **Fix (Phase 1.5):** parse plain-date strings as local-midnight, not UTC. Two options:
  1. Change the seed to include explicit timezone (`2026-04-27T00:00:00-04:00`) — invasive, touches 57 events.
  2. Add a `parseLocalDate(ymd)` helper in the UI that splits the string and constructs `new Date(y, m-1, d)` — localized to runtime zone. Cleaner; non-invasive.

  Option 2 is recommended. Apply to `app/js/tabs/daily.js` + `app/js/tabs/tournaments.js` + anywhere date formatting happens.

  **Session 3 (2026-04-22) — Closed:** Added `app/js/components/date-utils.js` exporting `parseLocalDate(ymd)` + `fmtDateShort(ymd)`. Both `daily.js` and `tournaments.js` import and use `fmtDateShort`. Preview-verified: Veolia Atlanta Pickleball Championships now renders "Apr 27 – May 3" (was "Apr 26 – May 2").
- **Status:** Closed (Session 3 — parseLocalDate helper shipped)
- **Cross-ref:** app/js/components/date-utils.js · app/js/tabs/daily.js · app/js/tabs/tournaments.js

### KB-0017 | Phase 1.5 Polish shipped
- **Type:** Action
- **Tier:** T2
- **Dependency:** Claude
- **Date:** 2026-04-22 (Session 3)
- **Category:** Build / Delivery
- **Tags:** phase-1-5, polish, verification
- **Finding:** Phase 1.5 "Polish" track (Option A from Session 3 Kickoff) shipped end-to-end:
  - **Date off-by-one** fixed via `app/js/components/date-utils.js` + `fmtDateShort` in daily.js + tournaments.js (KB-0016 closed).
  - **PPA rankings column mapping** implemented — `rank · playerName · bracket · eventsPlayed · points`. Typed `rankings[]` array in cache + structured ranking cards with points/events meta in `app/js/tabs/rankings.js` (KB-0011 closed).
  - **YouTube channel handles verified** for USAP (`@USAPickleball` → `UC2HmpKPxdCOF0tuYgFjzXxw`), SorryNotSorry (`@sorrynotsorrypickleball` → `UCXicY_F9IVq1GY7yNSAKU9g`), Chris Cali (`@chriscali` → `UCPiIvbjJj9ejJEmOKxBIrWA`). `data/master/video-sources.json` bumped v1 → v2; previous archived to `data/master/archive/video-sources-v1.json`.
  - **Live-match deep-link CTA** added to in-progress tournament cards (tournaments.js + live.js). Uses event-specific `pickleballBracketsUrl` when present, else falls back to `https://pickleballbrackets.com/` homepage. Yellow-accent `.cta-live` button + `.card-live` left-border styling.
  - **Favorites strip** added to Daily tab. Renders favorited MLP team (name + home-market + headliners) and favorited players (name + DUPR rating chip + PPA rank-flag chip). Section only appears when at least one favorite is set. Preview-verified with LA Mad Drops + Ben Johns + Anna Leigh Waters.
  - **MLP live HTML parse** upgraded in `ingestion/fetch-mlp.js` + `ingestion/lib/mlp-api.js`. Parses `/mlp-teams/` listing, matches all 20 teams against seed by city/teamId, enriches each seed team with `teamPageUrl`. Reports `freshness: 'live-verified'` when all match. Per-team roster HTML parse stays Phase 2 (KB-0018).
  - **SW cache bumped** `pickleball-daily-v1` → `pickleball-daily-v2` in the same commit as shell-file changes (CLAUDE.md Critical Rule). `./js/components/date-utils.js` added to SHELL_FILES.
  - **Verification gates:** `check-secrets` ✓ clean · `check-esm` ✓ 17/17 · snapshot regen ✓ 0 errors · preview visual verification ✓ (date fix + rankings cards + favorites strip all rendering correctly).
- **Status:** Closed
- **Cross-ref:** KB-0011 · KB-0016 · KB-0018 · KB-0019 · KB-0020 · app/ · ingestion/ · data/master/video-sources.json (v2)

### KB-0018 | MLP per-team roster HTML parse — deferred to Phase 2
- **Type:** Decision
- **Tier:** T2
- **Dependency:** Claude
- **Date:** 2026-04-22 (Session 3; shipped via a different path in Session 4)
- **Category:** Ingestion / MLP
- **Tags:** mlp, rosters, scraping, phase-2, closed-via-wp-rest
- **Finding:** Session 3's Phase 1.5 MLP upgrade verified the 20-team list live and enriched each seed team with its `teamPageUrl`. Per-team **roster** extraction was originally scoped as HTML scraping ~20 pages per daily run and deferred to Phase 2.

  **Session 4 resolution (different path):** direct per-team HTML parsing proved hostile (Bricks Builder + React-hydrated — raw HTML carries no player names). Probe reached a dead end at the 60-minute stop condition. Pivoted to the public WordPress REST API at `/wp-json/wp/v2/team` + `/wp-json/wp/v2/player`, which returns all 20 teams' roster post-IDs + the full ~132-player directory in 3 total HTTP calls with names, DUPR, slugs, and profile URLs. Shipped via KB-0021 bundle instead. See [KB-0022](#) for the full REST pattern.
- **Status:** Closed (superseded by WP REST API path in Session 4 — KB-0022)
- **Cross-ref:** KB-0021 · KB-0022 · ingestion/fetch-mlp.js · ingestion/lib/mlp-api.js

### KB-0019 | Port 1965 leftover-process conflict → autoPort in launch.json
- **Type:** Limitation
- **Date:** 2026-04-22 (Session 3)
- **Category:** Tooling / Windows / Dev Server
- **Tags:** windows, port, launch-json, preview-mcp
- **Finding:** At Session 3 start, port 1965 was held by a leftover Node process (PID 120112) — almost certainly an unsupervised `scripts/serve.js` that survived the Session 2 stop. Preview MCP refused to start on the configured port.

  **Fix:** added `"autoPort": true` to `.claude/launch.json` for the `pickleball-daily` config. Preview now picks a free ephemeral port (e.g. 65194) when 1965 is occupied, with no behavioral impact — `scripts/serve.js` already honors `process.env.PORT` via `Number(process.env.PORT) || 1965`.

  **If owner wants the leftover process gone:** find it with `netstat -ano | grep 1965`, kill by PID. Not destructive; just housekeeping.

  **Future session reminders:**
  - Prefer `preview_stop` at end of each session to avoid accumulating orphans.
  - autoPort is now the default — port 1965 is a preference, not a requirement.
- **Status:** Closed (workaround is the current default)
- **Cross-ref:** .claude/launch.json · scripts/serve.js

### KB-0020 | `.chip-rank` prepends `#` — looks off on non-numeric `ppaRankFlag` strings
- **Type:** Issue
- **Tier:** T3
- **Dependency:** Claude
- **Date:** 2026-04-22 (Session 3)
- **Category:** UI / Styling
- **Tags:** chip-rank, ppaRankFlag, cosmetic
- **Finding:** `app/styles/main.css` sets `.chip-rank::before { content: '#'; }`. That reads well for numeric ranks (`#1`, `#2`) but looks awkward for descriptive `ppaRankFlag` values in `players-seed.json` — e.g. "top-5 across disciplines" renders as "#top-5 across disciplines". Visible in Players tab (existing) and in the Session 3 favorites strip on Daily tab.

  **Options for a future session:**
  1. Gate the `::before` on numeric content: add a sibling class (`.chip-rank--numeric`) and apply only there; use `.chip-rank--tag` without prefix for descriptive strings.
  2. Drop `::before` and explicitly render `#` in the component when the value is numeric.

  Keeps KB-0009 (Ratings vs Rankings separation) intact either way.

  Scope: cosmetic; does not affect data correctness. Defer until a user-driven prompt or until Players tab gets a redesign.
- **Status:** Open (T3 — cosmetic)
- **Cross-ref:** app/styles/main.css · app/js/components/ranking-card.js · app/js/tabs/players.js · app/js/tabs/daily.js (favorites strip)

### KB-0021 | Phase 1.5 Round 2 bundle — scoped at Session 3 shutdown, queued for Session 4
- **Type:** Decision
- **Tier:** T2
- **Dependency:** Claude
- **Date:** 2026-04-22 (Session 3 shutdown scoping)
- **Category:** Product / Depth
- **Tags:** phase-1-5, depth, rosters, explainers, profile-links
- **Finding:** At the end of Session 3, the owner asked whether MLP Teams / Players / Rankings tabs would gain more depth (team-page links, bios, background info) and whether we'd explain the Rankings-vs-Ratings difference on-screen. Scoping conversation produced a 6-item bundle ATP'd for Session 4:

  1. **Rankings vs Ratings explainer** — collapsible "What is this?" card at the top of both tabs. Copy source: [KB-0009](#) pre-written two-sentence explainer.
  2. **"Team page ↗" link on each MLP team card** — renders the `teamPageUrl` field already populated in the snapshot via the Session 3 live-parse upgrade.
  3. **Team rosters** (6 players per team, 3M/3W) — live scrape per-team page. Promoted out of Phase 2 ([KB-0018](#)) after reliability/graceful-fail/cost conversation. Owner accepted the ingestion-time cost (~30–60 extra seconds on nightly run) given three guarantees:
     - Failure is bounded per-team — one team's failure does not affect the other 19.
     - Total-failure path degrades to current behavior (headliners only), no tailspin.
     - Monetary cost is zero — public HTML, no paid API, GitHub Actions free tier covers the extra seconds.
  4. **Error-message module + retrofit** — new `app/js/components/error-messages.js` maps error codes → plain-English user copy. Retrofits current cryptic copy on Daily header, Rankings empty state, Teams empty state. Severity-gated: partial failures stay silent when they don't matter; total failures show one calm banner. Includes "last-good-data" fallback rendering with a freshness tag.
  5. **Player profile URLs on seeded players** — add optional `ppaPlayerUrl` + `wikipediaUrl` fields to the 30 players already in `players-seed.json`. Best-effort curation — obvious finds get linked, ambiguous ones get flagged for Phase 2 curation. Do NOT expand the seed beyond the current 30.
  6. **Rankings name → PPA profile slug linking** — for the top 20 rankings-tab names, attempt clean slugification (Ben Johns → `ben-johns`) and verify against PPA's URL pattern. Accented or ambiguous names render as plain text with a note. No guessing.

  **Time budget:** 2.25–4 hours across all six items. Item 3 (rosters) has the only real unknown — MLP per-team page HTML is unseen.

  **Stop condition on rosters:** if per-team parse is hostile (React-hydrated or Bricks Builder selectors uncooperative), cap roster work at 60 minutes, ship partial (e.g., fetch-only without parse, or rosters for 5 teams as probe), defer rest to Phase 2, keep items 1/2/4/5/6 intact.

  **Deliverables expected:** new files `app/js/components/error-messages.js`, touched [teams.js](app/js/tabs/teams.js) / [rankings.js](app/js/tabs/rankings.js) / [ratings.js](app/js/tabs/ratings.js) / [players.js](app/js/tabs/players.js) / [daily.js](app/js/tabs/daily.js) / [app.js](app/js/app.js), updated [mlp-api.js](ingestion/lib/mlp-api.js) + [fetch-mlp.js](ingestion/fetch-mlp.js), updated [players-seed.json](data/master/players-seed.json) (v1 → v2), SW cache v2 → v3 + paired APP_VERSION bump.
- **Status:** Closed (all 6 items shipped Session 4)
- **Cross-ref:** KB-0009 · KB-0011 · KB-0018 · KB-0020 · KB-0022 · sessions/PICKLEBALL_Handoff_Prompt_V4.md

  **Session 4 shipping summary:**
  - Item 1 ✓ — `app/js/components/explainer.js` + `ratingsVsRankingsExplainer(scope)` wired into both [rankings.js](app/js/tabs/rankings.js) and [ratings.js](app/js/tabs/ratings.js). Scope parameter avoids duplicate DOM IDs.
  - Item 2 ✓ — Team page ↗ link rendered on every team card in [teams.js](app/js/tabs/teams.js) using the `teamPageUrl` already present from Session 3.
  - Item 3 ✓ — Rosters via WordPress REST API (KB-0022 path). 19/20 teams rostered; 1 (Palm Beach Royals) has 0 upstream roster entries — not our bug, headliner fallback. Graceful-fail guarantees all intact.
  - Item 4 ✓ — `app/js/components/error-messages.js` with `friendlyErrorMessage(code, context)` + severity-gated soft-banner renderer. Retrofitted Daily/Rankings/Teams.
  - Item 5 ✓ — `players-seed.json` v1 → v2; 26/30 PPA profile URLs + 10/30 Wikipedia URLs HEAD-verified. Unresolved left empty (Gabe Tardio, Quang Duong, James Ignatowich, Salome Devidze for PPA; Ben Johns for Wikipedia disambiguation) — Phase 2 curation backlog.
  - Item 6 ✓ — Top-20 rankings rows link to `ppatour.com/athlete/<slug>/`; slug cache at [logs/cache/ppa-player-slugs.json](logs/cache/ppa-player-slugs.json); bundled into `snapshot.sources.ppaRankings.slugCache` at ingestion time. 20/20 top-20 resolved.
  - SW cache v2 → v3 + APP_VERSION v2 → v3; new modules added to SHELL_FILES.
  - Verification gates: secrets ✓ clean, ESM ✓ 19/19, snapshot 0 errors, preview DOM-verified all six items rendering correctly, APP_VERSION pill shows V3.

### KB-0022 | MLP public WordPress REST API — clean roster path
- **Type:** Reference
- **Date:** 2026-04-22 (Session 4 discovery)
- **Category:** Data / Sources / MLP
- **Tags:** mlp, wp-json, rest-api, rosters, discovery
- **Finding:** `majorleaguepickleball.co` runs on WordPress + Bricks Builder. Team pages are React/Bricks-hydrated — raw HTML carries zero player names. During the Session 4 roster-scrape probe (KB-0021 Item 3), discovered that the public WordPress REST endpoints expose exactly the data we need, cleanly, with no scraping:

  - **`GET /wp-json/wp/v2/team?per_page=100&_fields=id,slug,title,link,meta_box.team_city,meta_box.rel_player-team_from`** → all 23 teams (3 inactive/0-roster) with their 6 roster player post-IDs in `meta_box.rel_player-team_from`.
  - **`GET /wp-json/wp/v2/player?per_page=100&page=N&_fields=id,slug,title,link,meta_box.player_first-name,meta_box.player_last-name,meta_box.player_dupr,meta_box.player_age,meta_box.player_bio`** → the full player directory (~132 players across 2 paginated calls) with names, slugs, profile URLs, DUPR, age, bio.

  **Join:** team roster IDs → player index lookup → 6 fully-populated player records per team in 3 total HTTP calls per daily run.

  **Limitations observed:**
  - The `/wp-json/wp/v2/player/<id>` single-player endpoint is 401 (auth required); the collection endpoint is 200 (public). Use the collection path.
  - Some roster IDs reference players not present in the public index (e.g. Atlanta's ID 6663). Assume stale/retired entries; graceful-fail to partial roster + `rosterFreshness: 'live-partial'`.
  - Palm Beach Royals currently has 0 roster entries in the WP team record — not a bug, legitimate upstream state.

  **Cost + politeness:**
  - 3 HTTP calls total per daily run (vs ~20+ for per-team HTML). ~5 MB total JSON.
  - No documented rate limit on the public API; add a small throttle if we ever paginate beyond 2 pages.
  - No paid tier — this is a standard WordPress feature; nothing prevents MLP from restricting it in the future. If they do, the code returns `rosterFreshness: 'seed-only'` per team and UI falls back to headliners.

  **Implementation:** `fetchWpTeams()`, `fetchWpPlayerIndex()`, `buildPlayerLookup()`, `rosterFromTeamRecord()` in [ingestion/lib/mlp-api.js](ingestion/lib/mlp-api.js); orchestrated in [ingestion/fetch-mlp.js](ingestion/fetch-mlp.js) behind a try/catch so roster failure never blocks the team-list result.

  **Future use:** the WP player records also carry `player_bio`, `player_age`, `player_paddle`, `player_sponsor`, `player_picture`, `player_socials`. Rich-profile surface for Phase 2 Players tab depth.
- **Status:** Closed (pattern documented and shipped)
- **Cross-ref:** KB-0018 · KB-0021 · ingestion/lib/mlp-api.js · ingestion/fetch-mlp.js · logs/cache/mlp-wp-json-*.json (Session 4 probe captures)

### KB-0023 | GitHub Actions Node 20 runtime deprecation — bumped to @v6/@v6/@v5 (closed)
- **Type:** Action
- **Tier:** T2
- **Dependency:** Claude
- **Date:** 2026-04-22 (Session 5 — first workflow run flagged it) · closed 2026-04-23 (Session 6)
- **Category:** Ops / CI
- **Tags:** github-actions, node, deprecation, ci, migration
- **Finding:** First run of `.github/workflows/daily.yml` (run `24816711514`, Phase 3A Step 5 verification) emitted a deprecation warning for every `@v4` action in the workflow. Affected: `actions/checkout@v4`, `actions/setup-node@v4`, `actions/cache@v4` — all three bundle Node 20 internally.

  GitHub's published timeline:
  - **2026-06-02** — default runtime flips to Node 24 (Node-20 actions start getting forced to Node 24)
  - **2026-09-16** — Node 20 removed from runners entirely

  **Session 6 (2026-04-23) — Closed:** All three publishers had already shipped past v4 by the time Session 6 started — better than expected. Bumped:
  - `actions/checkout` `@v4` → `@v6` (jumped past v5 entirely)
  - `actions/setup-node` `@v4` → `@v6` (jumped past v5 entirely)
  - `actions/cache` `@v4` → `@v5`

  Bumped as part of Phase 3B bundle commit `dffbca6`. First workflow run on the new versions (`24817810744`) completed successfully in 1m13s with no deprecation warnings or runtime regressions. Subsequent runs all green. KB-0023 closes here.
- **Status:** Closed (Session 6 — bumped + verified)
- **Cross-ref:** .github/workflows/daily.yml · commit `dffbca6` · https://github.blog/changelog/2025-09-19-deprecation-of-node-20-on-github-actions-runners/

### KB-0024 | Phase 3B Polish shipped — iOS PNG icons + splash + manifest + SW v4
- **Type:** Action
- **Tier:** T1
- **Dependency:** Claude
- **Date:** 2026-04-23 (Session 6)
- **Category:** Build / Delivery / PWA
- **Tags:** phase-3b, polish, ios, icons, splash, manifest, pwa
- **Finding:** Phase 3B Polish bundle shipped end-to-end as commit `dffbca6`. Five tracks:

  1. **iOS PNG icons** — generated via `sharp` (devDependency) from `app/icon.svg`. Six PNGs in `app/icons/`: `apple-touch-icon-{180,167,152,120}x...png` (iOS) + `icon-{192,512}.png` (PWA manifest). New `scripts/build-icons.js` regenerates on demand (`npm run build:icons`). Sibling Baseball Project had identified the same gap but hadn't shipped it; we did first.

  2. **Splash screen** — new `app/js/components/splash.js` + CSS in `app/styles/main.css`. Once-per-session overlay (sessionStorage-gated), 2200ms visible + 300ms fade (Session 6 polish bumped from initial 1500/250), respects `prefers-reduced-motion`, click-to-dismiss, non-blocking (data fetches in parallel).

  3. **Manifest polish** — `app/manifest.webmanifest` rewrote icons array with all 4 PNG sizes declared with `type: image/png` + `purpose: any maskable` where relevant. Tightened description, set `start_url` + `scope` to `.` (relative — works at both local-dev and Pages paths).

  4. **SW cache + APP_VERSION bump** — `pickleball-daily-v3` → `v4` in `app/sw.js`; `APP_VERSION = 'v3'` → `'v4'` in `app/js/app.js`. SHELL_FILES gained `splash.js` + 6 PNG icons.

  5. **KB-0023 piggyback** — bumped GitHub Actions `@v4` → `@v6/@v6/@v5` in same commit (closes KB-0023).

  Verified end-to-end: owner installed on iPhone Safari + Chrome — pickleball-ball icon renders correctly (was generic placeholder before). Live deploy curl-verified all 6 PNGs serving 200 OK with byte counts matching local. Workflow `24817810744` ✓ green on @v6/@v5 actions. Splash verified on desktop (V4 pill, sessionStorage gating, opacity transition).

  Splash duration tweak shipped post-feedback: VISIBLE_MS 1500→2200 + FADE_MS 250→300 in commit `0317972`, paired with SW cache v4→v5 + APP_VERSION v4→v5.
- **Status:** Closed
- **Cross-ref:** commit dffbca6 · commit 0317972 · scripts/build-icons.js · app/icons/ · app/js/components/splash.js

### KB-0025 | Phase 3C.1 Resend email shipped + activated end-to-end
- **Type:** Action
- **Tier:** T1
- **Dependency:** Claude (code) + Owner (account + secret paste)
- **Date:** 2026-04-23 (Session 6)
- **Category:** Build / Delivery / Email
- **Tags:** phase-3c, email, resend, ingestion, workflow
- **Finding:** Phase 3C slice 1 shipped end-to-end as commit `6e5db3e`:

  - **`ingestion/send-email.js`** — skip-without-failing design (no API key → log + exit 0, workflow stays green pre-secret-paste). Supports `EMAIL_DRY_RUN=1` for local preview.
  - **`ingestion/lib/email-template.js`** — pickleball-tailored HTML + plain-text + subject. Sections: Live Now / Upcoming / Top PPA Rankings / Top DUPR Ratings / Top Highlights / CTA. Inline styles only (Gmail-safe), palette mirrors `app/styles/main.css`.
  - **Workflow wire-in** — new `Send morning email` step in `.github/workflows/daily.yml` after snapshot commit, gated `if: success()`, reads `RESEND_API_KEY` + `EMAIL_RECIPIENTS` + `EMAIL_FROM` from repo Secrets.
  - **npm scripts** — `send:email`, `send:email:dry`, `build:icons`.
  - **`.env.example`** — Resend env vars documented.

  Verified twice — first as skip-without-failing (workflow `24833067571` logged `[send-email] RESEND_API_KEY not set — skipping`); second as actual-send (workflow `24869972946` logged `[send-email] Sent. Resend id: d2b4f1e7-9b04-4df8-8d99-2b4eefeac646`). Owner visually confirmed email delivered to Gmail inbox with correct rendering of all sections (header, Upcoming events, Top PPA Rankings, Top DUPR Ratings, Top Highlights with thumbnails, yellow CTA button, footer).

  Bonus observed: Gmail auto-detected the YouTube links in the highlights section and rendered a separate "video gallery" preview at the bottom of the inbox view — Gmail-native feature, not in our template.

  Owner-side completed: Resend account created (KB-0007 revision), `RESEND_API_KEY` + `EMAIL_RECIPIENTS` Secrets pasted via owner-led walkthrough.
- **Status:** Closed
- **Cross-ref:** KB-0007 · commit 6e5db3e · ingestion/send-email.js · ingestion/lib/email-template.js · docs/credentials.md § RESEND_API_KEY

### KB-0026 | Phase 3C.2 Cloudflare Worker scaffolding shipped (dormant)
- **Type:** Action
- **Tier:** T2
- **Dependency:** Owner (deployment is owner-action)
- **Date:** 2026-04-23 (Session 6)
- **Category:** Build / Delivery / Worker
- **Tags:** phase-3c, worker, cloudflare, scaffolding, dormant
- **Finding:** Phase 3C slice 2 shipped as commit `fe6fd9c`:

  - **`worker/src/index.js`** — reusable POST → GitHub Issue Worker per KB-0012. All project-specific values in env (GITHUB_REPO, ALLOWED_ORIGINS, ALLOWED_TYPES, WORKER_NAME); src is identical across future projects.
  - **`worker/wrangler.toml`** — repo + origins + submission types + worker name.
  - **`worker/package.json`** — wrangler devDep + deploy/dev/tail npm scripts.
  - **`worker/README.md`** — first-time setup walkthrough (~15 min owner action: Cloudflare account → wrangler login → fine-grained PAT → wrangler secret put → wrangler deploy). "Porting to other projects" section documents the 5-min reuse path.

  Pickleball-specific tweak: submission types = `player,event,moment,other` (adds `event` vs sibling's `player,moment,other`, reflecting tournament-centric content model).

  **Status: dormant.** Code lives in repo but no Worker is deployed. No public URL exists. The Suggest modal UI on the site (which would consume the Worker URL) is a future-session deliverable. KB-0012 stays open until owner deploys.
- **Status:** Open (awaiting owner deployment when ready)
- **Cross-ref:** KB-0012 · commit fe6fd9c · worker/README.md · docs/credentials.md § GITHUB_TOKEN (Worker — fine-grained PAT) · docs/concepts-primer.md

### KB-0027 | CI hardening — push-race retry-with-rebase loop
- **Type:** Action
- **Tier:** T2
- **Dependency:** Claude
- **Date:** 2026-04-23 (Session 6)
- **Category:** Ops / CI
- **Tags:** ci, github-actions, race-condition, hardening, snapshot-commit
- **Finding:** Two daily.yml workflow runs dispatched ~20 seconds apart during Session 6 verification both completed ingestion successfully and tried to `git push` their snapshot commits at almost the same time. Whichever finished first won; the loser saw `[rejected] main -> main (fetch first)` and the job failed with exit 1 — sending the owner a "All jobs have failed" email at 6:40 AM despite the underlying ingestion being healthy.

  Failed run: `24833051976`. Cause: snapshot commit step had a single non-retried `git push`. Race only triggers when two runs overlap (rare under cron-only operation; this happened during burst of manual dispatches).

  **Fix shipped as commit `c670e09`:** wrapped the push step in a 3-attempt loop. On rejection, `git pull --rebase -X theirs origin main` keeps our fresher snapshot on conflict, then retries. Upper bound prevents runaway loop. Verified via test run `24855830738` — `push succeeded (attempt 1)`, no regression.
- **Status:** Closed
- **Cross-ref:** commit c670e09 · .github/workflows/daily.yml · run 24833051976 (failed) · run 24855830738 (verified)

### KB-0028 | Splash screen UX polish — duration tuned post-feedback
- **Type:** Action
- **Tier:** T3
- **Dependency:** Claude
- **Date:** 2026-04-23 (Session 6)
- **Category:** UI / UX
- **Tags:** splash, ux, polish, ios
- **Finding:** Owner verified splash on iPhone (Safari + Chrome) post-Phase 3B and reported it felt "pretty short." Bumped VISIBLE_MS 1500 → 2200ms + FADE_MS 250 → 300ms (total 2.5s on-screen). Paired with SW cache v4→v5 + APP_VERSION v4→v5 per CLAUDE.md Critical Rule. Shipped as commit `0317972`. Owner confirmed splash now feels right on subsequent test.

  Splash kept minimal — fade in / hold / fade out only. No icon scale, no title slide, no shimmer. Decision recorded as "keep minimal for now" per Session 6 dialog. Future richer animation options documented for reference but explicitly deferred.
- **Status:** Closed
- **Cross-ref:** commit 0317972 · app/js/components/splash.js

### KB-0029 | Credentials inventory doc + CLAUDE.md v1→v2 maintenance mandate
- **Type:** Decision
- **Date:** 2026-04-23 (Session 6)
- **Category:** Process / Documentation / Security
- **Tags:** credentials, secrets, documentation, claude-md, versioning, maintenance
- **Finding:** New living document `docs/credentials.md` shipped as commit `f4c5724`. Captures every credential the project uses (active + pending) with: per-credential format, scope, source dashboard, rotation history, lost-key recovery, source-of-truth posture (password manager → deployment locations, never reverse). Doc never lists actual credential values — placeholders + pointers only.

  To make the maintenance trigger durable across sessions (rather than relying on in-conversation memory), CLAUDE.md rolled v1→v2 in commit `5530041`:
  - **New Session-End Protocol Step 2:** mandate to update `docs/credentials.md` whenever credentials change (added, rotated, revoked, moved between storage locations, status flipped).
  - Subsequent steps renumbered (Archive 2→3, Handoff 3→4, Kickoff 4→5, File-changes 5→6, Release-readiness 6→7, Report 7→8).
  - v1 archived to `archive/CLAUDE_v1.md`.
  - Self-rule callout added to `docs/credentials.md` pointing back to the CLAUDE.md mandate.
- **Status:** Closed (doc + mandate both in place)
- **Cross-ref:** docs/credentials.md · CLAUDE.md v2 § Session-End Protocol Step 2 · archive/CLAUDE_v1.md · commit f4c5724 · commit 5530041

### KB-0030 | Concepts primer doc — foundational reference for Workers, wrangler, PATs, etc.
- **Type:** Reference
- **Date:** 2026-04-23 (Session 6)
- **Category:** Documentation / Education
- **Tags:** documentation, primer, workers, wrangler, cloudflare, pat, github-auth
- **Finding:** New reference document `docs/concepts-primer.md` shipped as commit `cfb1366` (431 lines). Built from a Session 6 dialog where the owner asked clarifying questions about external services and deployment concepts; preserved as a standalone reference rather than letting the explanations be lost in chat history.

  Sections: serverless functions general category · Cloudflare Workers · the Worker code in this project · wrangler CLI · `npx` · the deployed Worker URL · why Workers vs alternatives · complete deployment walkthrough (8 steps) · Personal Access Tokens (concept + GitHub flavors classic vs fine-grained) · GitHub auth methods (PAT vs browser vs git, including the `GITHUB_TOKEN` naming-collision warning).

  Maintenance: lighter cadence than credentials doc — concepts don't change session-to-session. Update only when a new major external service or auth concept is introduced, or when a current concept turns out to be inaccurate. No CLAUDE.md mandate added.
- **Status:** Closed
- **Cross-ref:** docs/concepts-primer.md · commit cfb1366 · docs/credentials.md · worker/README.md

### KB-0031 | PPA Rankings #1 tie data anomaly — Phase 2 investigation
- **Type:** Issue
- **Tier:** T3
- **Dependency:** Claude
- **Date:** 2026-04-23 (Session 6)
- **Category:** Data / Ingestion / PPA
- **Tags:** ppa-rankings, data-anomaly, tie, parse, phase-2
- **Finding:** Snapshot data for `ppaRankings.rankings[]` shows two rows at rank `#1`, both with 21,300 points: Ben Johns (27 events) and Gabriel Tardio (20 events). No row at `#2`. First observed in the Phase 3C.1 dry-run email and again in the live Session 6 test send.

  Possibilities (not yet investigated):
  1. Genuine PPA Tour tied state — both players co-led the season; PPA Tour intentionally publishes a tie at #1.
  2. Parse anomaly in `ingestion/fetch-ppa-rankings.js` column-mapping (KB-0011 closure context).
  3. Source-side rendering quirk on `ppatour.com` (e.g., a footnote or annotation row being misclassified as a player row).

  Not blocking — email + Rankings tab render the data faithfully. Visible to anyone reading the email or browsing the Rankings tab.

  Investigation candidate for Phase 2 or any maintenance session that touches rankings ingestion. Sample diagnostic: open `ppatour.com/player-rankings/`, eyeball the top of the table, compare to `data/snapshots/latest.json § sources.ppaRankings.rankings[0..3]`.
- **Status:** Open (T3 — Phase 2 investigation candidate)
- **Cross-ref:** KB-0011 · ingestion/fetch-ppa-rankings.js · data/snapshots/latest.json

### KB-0032 | iOS "◀ Gmail" return-pill UX trap — not a code bug
- **Type:** Reference
- **Date:** 2026-04-23 (Session 6)
- **Category:** UX / iOS / External Links
- **Tags:** ios, ux, safari, back-button, external-links
- **Finding:** Owner reported during Session 6: "when i select any link within the app and then return - it returns to the previous app, which for me was gmail." Initially diagnosed as missing `target="_blank"` on external links — but full audit of all 11 external `<a>` locations across `app/js/tabs/*.js` + `app/js/components/highlights.js` confirmed every one already has `target="_blank" rel="noopener"` (has been since Phase 1.5).

  Real root cause: the iOS system-level return pill at top-left of Safari (and Chrome). When you launch a URL from another app (Gmail, in this case), iOS shows a small "◀ Gmail" pill in the top-left corner — a system-level navigation affordance that always returns to the launching app, regardless of browser history or tabs. It looks like a back button but isn't. Tapping it consistently returns to Gmail.

  Owner verified post-investigation: pressing the "right back button" (browser back, or tab switcher → original tab) works as expected. The "◀ Gmail" pill was the trap.

  No code change shipped. Recorded as Reference because: (a) future sessions might encounter a similar report and benefit from skipping the misdiagnosis; (b) confirms the existing target=_blank discipline is sound.

  Possible future enhancement (deferred indefinitely — probably not worth the build cost): add a small in-app banner or hint when the user navigates from an external link saying "use the tab switcher or browser back chevron, not the top-left ◀ pill." Likely confusing, marginal value.
- **Status:** Closed (not-a-bug; reference recorded)
- **Cross-ref:** app/js/tabs/*.js · app/js/components/highlights.js

### KB-0033 | Resend free-tier sender restriction blocks multi-recipient until domain verified
- **Type:** Limitation
- **Date:** 2026-04-24 (Session 6 — discovered when expanding EMAIL_RECIPIENTS from 1 to 3)
- **Category:** Email / Resend / Free-tier
- **Tags:** resend, email, free-tier, restriction, domain-verification, path-b
- **Finding:** Resend's free tier with the default `onboarding@resend.dev` sender (Path A from the Session 6 walkthrough) **only allows sending to the Resend account's own email address.** Attempting to send to any other recipient returns:

  ```
  HTTP 403 Forbidden
  {"statusCode":403,"name":"validation_error","message":"You can only send testing
  emails to your own email address (<owner-email>). To send emails to other
  recipients, please verify a domain at resend.com/domains, and change the `from`
  address to an email using this domain."}
  ```

  Workflow run `24873265142` (Session 6, 2026-04-24 ~05:06 UTC) hit this when `EMAIL_RECIPIENTS` was expanded from 1 (owner) to 3 (owner + brother + brother's wife). The send-email step exited 1, the workflow job failed, GitHub sent a failure-email notification.

  This restriction was **not surfaced during the Session 6 Resend walkthrough** — Claude described Path A as "works immediately, no setup needed" and Path B as "skip for v1; can do later." That description was incomplete: Path A works ONLY for sending to yourself.

  **Mitigation Session 6:** owner reverted `EMAIL_RECIPIENTS` to 1 recipient (owner only). Verified via run `24873522457` — clean send to owner, no Resend rejection. Daily cron will succeed.

  **To unblock multi-recipient (Path B owner-action, deferred to future session):**
  1. Resend dashboard → Domains → Add Domain → enter a domain you own
  2. Resend provides 3 DNS records (SPF, DKIM, DMARC) to add at your domain registrar
  3. Add records, wait ~10-30 min for DNS propagation
  4. Click Verify on Resend
  5. Add new GitHub Secret `EMAIL_FROM` = `Ozark Joe's Pickleball Daily <daily@yourdomain.com>` (sender using the verified domain)
  6. Re-expand `EMAIL_RECIPIENTS` Secret to include desired recipients

  Total owner time: ~30-45 min + DNS propagation wait. Requires owner to own a domain (or buy one ~$10-15/year if not).

  **Session 6 (2026-04-24) — Closed via Path B activation.** Owner purchased `glad-fam.com` via Cloudflare Registrar (~$10), Resend Auto-configure pushed DNS records into Cloudflare, domain verified within ~3 minutes, `EMAIL_FROM` Secret set to `Ozark Joe's Pickleball Daily <daily@glad-fam.com>`, `EMAIL_RECIPIENTS` re-expanded to 3 recipients. Verification run `24915664144` succeeded — `Recipients: 3`, Resend id `921b759a-caf3-4ca3-9fc9-1147568fe133`. See KB-0034 for Path B activation details.
- **Status:** Closed (Session 6 — Path B activated, multi-recipient sending operational)
- **Cross-ref:** KB-0007 · KB-0034 · docs/credentials.md § EMAIL_RECIPIENTS · docs/credentials.md § EMAIL_FROM · docs/credentials.md § glad-fam.com domain · run 24873265142 (Path A failure) · run 24873522457 (revert verification) · run 24915664144 (Path B verification)

### KB-0034 | Path B activated — glad-fam.com domain verified; multi-recipient email operational
- **Type:** Action
- **Tier:** T1
- **Dependency:** Owner (account/domain/DNS owner-actions) + Claude (Secret + verification orchestration)
- **Date:** 2026-04-24 (Session 6 — same-day after KB-0033 surfaced)
- **Category:** Email / Resend / Domain / Multi-recipient
- **Tags:** path-b, resend, domain, dns, email, multi-recipient, cloudflare-registrar
- **Finding:** Path B (Resend domain verification) activated end-to-end same-session as KB-0033 surfaced. Resolved the free-tier multi-recipient block. Steps executed:

  1. **Domain purchased.** Owner bought `glad-fam.com` via Cloudflare Registrar (at-cost pricing, ~$10/year). Cloudflare auto-configured as DNS host for the domain.
  2. **Domain added to Resend.** Owner navigated to https://resend.com/domains, clicked Add Domain, entered `glad-fam.com`, region `us-east-1` (North Virginia).
  3. **Auto-configure used.** Resend detected Cloudflare as DNS host and offered Auto-configure (vs Manual setup). Owner clicked Auto-configure, Cloudflare prompted for one-time authorization, owner clicked Authorize. Resend pushed 3 DNS records into Cloudflare DNS for `glad-fam.com`:
     - **MX** record on `send` subdomain → `feedback-smtp.us-east-1.amazonses.com` (priority 10) — for bounce handling
     - **TXT** record `resend._domainkey` — DKIM public key
     - **TXT** record on `send` subdomain — SPF (`v=spf1 include:amazonses.com ~all`)
  4. **Domain verified.** Resend status flipped from `Pending` to `Verified` within ~3 minutes (faster than the "may take a few hours" warning banner — Cloudflare DNS propagates fast).
  5. **`EMAIL_FROM` GitHub Secret added** (new): value = `Ozark Joe's Pickleball Daily <daily@glad-fam.com>`. Send-email script reads this and uses it as the `from:` address.
  6. **`EMAIL_RECIPIENTS` GitHub Secret re-expanded** from 1 recipient (owner-only revert state) back to 3 recipients (owner + brother + brother's wife).
  7. **Verification.** Workflow run `24915664144` dispatched; email step logged `Recipients: 3` + `From: ***` + `Sent. Resend id: 921b759a-caf3-4ca3-9fc9-1147568fe133`. Workflow exited 0. All 3 inboxes received the email.

  **Net effect:** Daily 07:00 UTC cron now sends a fresh briefing to all 3 recipients each morning. Closes the multi-recipient gap that KB-0033 documented as a limitation. KB-0007 also updated to reflect Path A → Path B transition complete.

  **New owned asset to track:** `glad-fam.com` domain registered at Cloudflare. Documented as a credential entry in `docs/credentials.md` § glad-fam.com domain. Annual renewal (~$10) required to keep ownership.

  **Resend Auto-configure note:** the Cloudflare-Resend Auto-configure flow worked exactly as advertised. One-time authorization, no manual DNS-record entry needed, no typos possible. Recommended for any future projects that need Resend domain verification with Cloudflare DNS.
- **Status:** Closed
- **Cross-ref:** KB-0007 · KB-0033 · docs/credentials.md § EMAIL_FROM · docs/credentials.md § EMAIL_RECIPIENTS · docs/credentials.md § glad-fam.com domain · docs/concepts-primer.md § 12 (Path A vs Path B) · run 24915664144

---

**End of KB. Entry count: 34. Next ID: KB-0035.**
