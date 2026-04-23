# Pickleball Daily Intelligence — Knowledge Base

Living record of decisions, open issues, and action items. Updated every session.

**Last updated:** 2026-04-22 (Session 4 shutdown — KB v5, 22 entries; Phase 1.5 Round 2 bundle shipped; MLP WordPress REST API discovered)

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
- **Status:** Open (awaiting Phase 1/3 trigger — owner creates repo)
- **Cross-ref:** CLAUDE.md § Project Context · CLAUDE.md § Secret Safety · scripts/check-secrets.js

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
- **Status:** Local autopilot Closed; Remote Phase 3 owner-paste still Open
- **Cross-ref:** data/master/video-sources.json · CLAUDE.md § Data Sources · ingestion/lib/youtube-api.js

### KB-0007 | Resend email — shared account, separate recipient list
- **Type:** Decision
- **Tier:** T2
- **Dependency:** Owner + Claude
- **Date:** 2026-04-22
- **Category:** Features / Delivery / Ops
- **Tags:** email, resend, notifications, sharing
- **Finding:** Share sibling project's Resend.com account + `re_...` API key (free tier covers both projects). `EMAIL_RECIPIENTS` is per-repo Secret (independent list — owner may manually sync if identical recipients desired; two-parallel-lists problem is real but manageable per sibling's ~1-3 changes/year estimate).

  Phase 3 scope: rich HTML preview + CTA link — today's live events, top movers, new highlights, rule-of-the-day. Triggered after daily ingestion (GitHub Actions cron 07:00 UTC, same slot as sibling). Brother-in-Virginia friendly (arrives before both time zones start morning).
- **Status:** Open (Phase 3)
- **Cross-ref:** CLAUDE.md § Current Phase · CLAUDE.md § Session-End Protocol

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

---

**End of KB. Entry count: 22. Next ID: KB-0023.**
