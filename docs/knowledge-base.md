# Pickleball Daily Intelligence — Knowledge Base

Living record of decisions, open issues, and action items. Updated every session.

**Last updated:** 2026-05-02 (Session 10 shutdown — **KB v19**, 50 entries through KB-0050; KB-0048 added — KB-0040 Phase L2 launch entry: Glossary + Court Etiquette + DUPR Explainer + Tournament Prep shipped (commit 7ee1504); KB-0049 added — KB-0040 Phase L3 launch entry: new "Gear & Courts" tab + Equipment sub-tab (paddles + balls + nets) shipped (commit 6f9133a); KB-0050 added — USAP equipment scraping lessons (pagination quirk, parser graceful-degradation for older paddles, ball-column-shift fix, resumability + checkpointing pattern). KB-0040 sub-status updated: L1+L2+L3 complete, L4 still Open. Session 9 shutdown produced KB v18 (KB-0047 — Phase L1 launch).)

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

  **Session 7 update (2026-04-25):** Owner clarified the activation triggers — defer until **either**:
  1. The 3 daily-email recipients are demonstrably relying on the app for daily reading (signal: questions, requests for features, mentions of specific data points), OR
  2. Owner decides to develop Frontier-Model-LLM integration as a deliberate skill exercise (independent of pickleball value).

  **Session 8 ATP + closure (2026-04-26 → 2026-04-27):** Trigger #2 fired — owner ATP'd the build as a reusable-pattern exercise for future projects. KB-0042 captures the full ATP cost dialog. Built and shipped:

  **Architecture as built:**
  - **Backend:** Anthropic Messages API · model `claude-haiku-4-5-20251001` · prompt caching (5-min ephemeral TTL) · system prompt grounds the model in the curated bundle and forbids fabrication
  - **Proxy:** Cloudflare Worker `pickleball-daily-api` at `https://pickleball-daily-api.jjmgladden.workers.dev` (revives KB-0012 scaffolding for new use case; submit route preserved alongside)
  - **Auth + cost guards:** Anthropic spend cap $20/mo (auto-reload OFF) · email alerts at $1/$5/$15 · Worker per-IP rate limit 10/hr + 50/day · `AI_DISABLED` env-var kill switch · CORS locked to `jjmgladden.github.io` + `localhost:1965`
  - **Context bundle:** `ingestion/build-ai-context.js` produces `data/snapshots/ai-context.json` (~3.9K tokens) with governance + glossary + PPA top-50 + DUPR top-20 + 20 MLP teams + upcoming tournaments + 60-player directory + 2026 rule changes + recent highlights + top news titles + history pointers; cron rebuilds daily after fetch-daily.js
  - **UI:** `app/js/tabs/ask.js` — chat tab (10th nav slot, freed by KB-0043 Stats consolidation) · in-memory conversation history · Enter to send · Shift+Enter for newline · 5-500 char validation · per-message usage telemetry shown to user (model · cache hit · context date)
  - **Browser-side gate:** `data/master/ai-config.json` (workerBaseUrl + aiEnabled flag) — the Ask tab shows a friendly dormant-state banner when either is missing/false

  **Verification:** First real Anthropic answer returned successfully on 2026-04-27 (~$0.008 charged for first call, cost-per-call drops to ~$0.003 with cache hit). Smoke test question "what is pickleball butt" answered correctly by citing the Pickleball Union RSS news item title (today's snapshot includes that article).

  **Diagnostic battle scars (recorded for future projects):**
  - KB-0044: original API key value accidentally exposed in chat transcript via mistyped `wrangler secret put` argument; rotated immediately, full procedure in credentials.md maintenance log
  - Wrangler 3.x has libuv assertion crash on Node 24; bumped worker/package.json to wrangler ^4
  - First few questions returned Anthropic 400 with empty body; root cause was Windows cmd terminal mangling the `wrangler secret put` masked-input paste (only 1 char captured); fix was Cloudflare dashboard paste (browser inputs handle paste correctly)
  - Wrangler OAuth tokens self-refresh via unprompted Cloudflare consent popup; never click Cancel on these (lesson recorded in credentials.md)

  **Future enhancements deferred to follow-up KBs:**
  - News-item URL + ~200-char excerpt in context bundle (so AI can summarize articles + hand out clickable links) — pending separate small commit immediately after this closure
  - Self-hosted Ollama backend → see KB-0041 for the future-design concept
- **Status:** Closed (Session 8 — built, deployed, verified live)
- **Cross-ref:** KB-0012 (Worker — revived for AI proxy use case) · KB-0026 (Worker dormant — superseded) · KB-0041 (future Ollama backend) · KB-0042 (ATP cost dialog) · KB-0043 (Stats consolidation freed nav slot) · KB-0044 (Anthropic key rotation) · CLAUDE.md § AI-Retrievable Schema Constraints · docs/credentials.md § ANTHROPIC_API_KEY · worker/src/index.js · ingestion/build-ai-context.js · app/js/tabs/ask.js · data/master/ai-config.json · data/snapshots/ai-context.json

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

  **Session 3 update (2026-04-22):** Owner confirmed the Worker stays in Phase 3 scope (not skippable) and wants the pattern built reusable across future projects. Implementation note: project-specific values (repo name, Issue label, CORS allowlist) must live in env/config so the `worker/` folder can copy-paste into a future project with minimal edits.

  **Session 6 update (2026-04-23):** Worker code shipped to `worker/` (commit `fe6fd9c`) and remains dormant pending owner deployment. Reframed as one bundled feature with the Suggest modal UI — deploying the Worker without the modal produces no user value. KB-0026 captures the dormant-code state.

  **Session 7 update (2026-04-25):** Owner ATP'd deferral. Closing as **deferred** with the bundled-feature framing and a single trigger condition: **resume work when there is a demonstrated use case for visitor submissions.** Current readership (3 known users — owner + brother + brother's wife) doesn't motivate a public form. KB-0026 is closed as a duplicate (same trigger, same code state). Owner correction noted: this carry-forward should have been recorded at end of Session 6.
- **Status:** Closed (Session 7 — deferred indefinitely; resume on visitor-submission use case)
- **Cross-ref:** CLAUDE.md § Project File Structure § worker/ · KB-0026 (closed as duplicate) · worker/README.md · docs/concepts-primer.md § Sections 6-8 · docs/credentials.md § GITHUB_TOKEN (Worker — fine-grained PAT)

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
- **Finding:** `app/styles/main.css` set `.chip-rank::before { content: '#'; }`. That read well for numeric ranks (`#1`, `#2`) but looked awkward for descriptive `ppaRankFlag` values in `players-seed.json` — e.g. "top-5 across disciplines" rendered as "#top-5 across disciplines". Visible in Players tab and in the Session 3 favorites strip on Daily tab.

  **Session 8 fix (2026-04-25):** went with Option 2 from the original options list (drop `::before`, prepend `#` conditionally in JS).
  - `app/styles/main.css` — removed the `.chip-rank::before` rule entirely
  - `app/js/components/ranking-card.js` — `rankChipHtml(position)` now prepends `#` only when the value matches `/^\d+$/` (numeric). Defensive — `rankChipHtml` is called from `rankings.js` with PPA-scraped numeric ranks, but the regex check guards against future misuse
  - `app/js/tabs/players.js` + `app/js/tabs/daily.js` — unchanged; their inline `<span class="chip-rank">` with `ppaRankFlag` strings now render cleanly without the unwanted `#`

  **Verification (live preview):**
  - Rankings tab: `#1`, `#1`, `#3`, `#4`, `#5` — `#` prefix preserved on numeric ranks (KB-0037 1224 tie still renders correctly)
  - Players tab: "top-5 across disciplines", "top-3 men's doubles", etc. — descriptive flags render without `#` prefix
  - Computed `::before` content is `"none"` — CSS rule successfully removed
  - SW cache + APP_VERSION paired bump v7 → v8

  Preserves KB-0009 (Ratings vs Rankings separation) — `.chip-rank` remains the ordinal-rank visual treatment.
- **Status:** Closed (Session 8 — Option 2 implemented)
- **Cross-ref:** KB-0009 · KB-0037 · app/styles/main.css · app/js/components/ranking-card.js · app/js/tabs/players.js · app/js/tabs/daily.js (favorites strip) · app/sw.js · app/js/app.js

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

  **Status: dormant.** Code lives in repo but no Worker is deployed. No public URL exists. The Suggest modal UI on the site (which would consume the Worker URL) is a future-session deliverable.

  **Session 7 update (2026-04-25):** Closed as **duplicate of KB-0012**. Same trigger, same code state, same deferral. KB-0012 is the single source of truth going forward; this entry stays in the record for chronology only. Resume condition: visitor-submission use case emerges.
- **Status:** Closed (Session 7 — duplicate of KB-0012; deferred indefinitely)
- **Cross-ref:** KB-0012 (parent / authoritative) · commit fe6fd9c · worker/README.md · docs/credentials.md § GITHUB_TOKEN (Worker — fine-grained PAT) · docs/concepts-primer.md

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

  **Session 7 update (2026-04-25):** Investigated end-to-end. Result is two-part — see KB-0037 for the full root cause + fix. Summary: PPA Tour itself shows the tie (1224 convention; not a parse error) AND the scraper had a column-mapping bug where "events" was actually "age" (causing the misleading "27 events / 20 events" in the data). Both addressed in commit `6d57b8c`.
- **Status:** Closed (Session 7 — investigation complete; see KB-0037 for fix)
- **Cross-ref:** KB-0011 · KB-0037 · ingestion/fetch-ppa-rankings.js · data/snapshots/latest.json · commit 6d57b8c

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

### KB-0035 | News tab shipped — RSS-based ingestion across 4 sources (T1+T2+T3 mix)
- **Type:** Action
- **Tier:** T1
- **Dependency:** Claude
- **Date:** 2026-04-25 (Session 7)
- **Category:** Build / Delivery / Phase 2 / News
- **Tags:** phase-2, news, rss, atom, the-dink, pickleball-union, pickleball-magazine, the-kitchen
- **Finding:** Phase 2's News tab shipped to main across two commits (`a4326bf` initial + `7a11020` source expansion).

  **Architecture:** Minimal no-deps parser at `ingestion/lib/rss-parser.js` handles RSS 2.0 + Atom 1.0 with auto-detection in `fetchFeed()`. Atom support added because The Kitchen's Shopify-default feed is `application/atom+xml` (different element shape: `<entry>` not `<item>`, `<link href="..."/>` attribute not text content, `<published>` not `<pubDate>`, nested `<author><name>`).

  **Sources (4 total, mixed tiers):**
  | Source | Tier | Format | Feed URL |
  |---|---|---|---|
  | Pickleball Magazine (Wix) | T1 | RSS 2.0 | `https://www.pickleballmagazine.com/blog-feed.xml` |
  | The Dink (Ghost) | T2 | RSS 2.0 | `https://www.thedinkpickleball.com/rss/` |
  | Pickleball Union (WordPress) | T2 | RSS 2.0 | `https://pickleballunion.com/feed/` |
  | The Kitchen (Shopify) | T3 | **Atom 1.0** | `https://thekitchenpickle.com/blogs/news.atom` |

  **Pipeline:** `fetch-news.js` → dedupe by URL + normalized title → sort newest-first → cap MAX_PER_SOURCE=15 + MAX_ITEMS=40. Bound to `snapshot.sources.news.items[]` for browser consumption.

  **UI:**
  - News tab at [app/js/tabs/news.js](app/js/tabs/news.js) — Today / This Week / Recent buckets per `bucketNews()` in [app/js/components/news-card.js](app/js/components/news-card.js).
  - Top 3 surface on Daily tab as compact cards (`renderNewsCardCompact`).
  - Email template adds Top News section with purple accent (`#c69aff`) below Top Highlights.
  - Tier badges per [confidence-badge.js](app/js/components/confidence-badge.js): T1 = no badge (normal render), T2 = explicit T2 badge, T3 = "editorial" badge.

  **`displayNameOverride`** binding in `fetch-news.js` lets Magazine render as "Pickleball Magazine" without modifying [media-sources.json](data/master/media-sources.json)'s accurate "Pickleball Magazine (USAP-affiliated)" label.

  **Note on PickleWave:** Original Kickoff Session 7 named "The Dink + PickleWave" as MVP sources. PickleWave is only an X social account in [media-sources.json](data/master/media-sources.json) (not a newsletter), so pivoted to The Dink + Pickleball Union for MVP, then added Magazine + Kitchen on owner ATP.

  **Verification:** secrets clean · ESM 24/24 · ingestion 0 errors · preview confirms 40 cards rendering with T1+T2+T3 tier mix · email dry-run renders Top News section · production deploy at v6 (initial) and v7 (after KB-0038).
- **Status:** Closed
- **Cross-ref:** commit a4326bf (initial) · commit 7a11020 (sources expanded) · ingestion/lib/rss-parser.js · ingestion/fetch-news.js · app/js/components/news-card.js · app/js/tabs/news.js · ingestion/lib/email-template.js · data/master/media-sources.json

### KB-0036 | Learn tab shipped — governance + 2026 rules + history timeline
- **Type:** Action
- **Tier:** T1
- **Dependency:** Claude
- **Date:** 2026-04-25 (Session 7)
- **Category:** Build / Delivery / Phase 2 / Learn
- **Tags:** phase-2, learn, rules, history, governance, usap
- **Finding:** Phase 2's Learn tab shipped in commit `a4326bf` alongside News. Three sections:

  1. **Governance** — definition list of who-governs-what (USAP, UPA, PPA Tour, MLP, DUPR). Hand-written prose; not data-driven.
  2. **2026 Rule Changes** — 10 rule cards rendered from [data/master/rules-changes-2026.json](data/master/rules-changes-2026.json), each with section number (where known) + category + impact + source links. Header card surfaces `rulebookEdition`, `effectiveDate`, links to USAP rulebook PDF + change document.
  3. **History** — 22 milestones from [data/master/history-seed.json](data/master/history-seed.json) sorted ascending by year (1965 → 2026). Founding-narrative variants flagged where they exist (pickle-boat vs dog "Pickles"). Year column uses ranking-text color for visual continuity with rankings palette.

  **Caveat banners** at the bottom of each section: rules section reminds reader that section numbers cite secondary summaries (Selkirk + The Dink) where the primary USAP PDF hasn't been programmatically verified — addresses [rules-changes-2026.json](data/master/rules-changes-2026.json) caveat about "tbd" sections; history section notes USAP's official position with variants flagged.

  **No new ingestion.** Learn tab is purely seed-driven; loads via [data-loader.js](app/js/data-loader.js) `loadMaster()` at render time.

  **Verification:** preview confirms 10 rule cards + 22 history milestones (oldest 1965, newest 2026) + governance card + rulebook header all render with expected structure (preview_snapshot accessibility tree).
- **Status:** Closed
- **Cross-ref:** commit a4326bf · app/js/tabs/learn.js · data/master/rules-changes-2026.json · data/master/history-seed.json

### KB-0037 | KB-0031 root cause: PPA scraper column-mapping + networkidle timeout
- **Type:** Action
- **Tier:** T2
- **Dependency:** Claude
- **Date:** 2026-04-25 (Session 7)
- **Category:** Ingestion / PPA / Bug Fix
- **Tags:** ppa-rankings, scraper, column-mapping, playwright, timeout, networkidle, ben-johns, gabriel-tardio
- **Finding:** KB-0031 investigation completed. Two findings, one fix in commit `6d57b8c`:

  **Finding 1 (real, not our bug):** `ppatour.com/player-rankings/` itself renders Ben Johns + Gabriel Tardio tied at rank #1 with 21,300 pts each, then jumps to rank 3. Standard "1224" tie convention. Verified by direct Playwright extraction — single table on page, two rows with rank=1, no row at rank=2. The data is faithful.

  **Finding 2 (our bug):** Scraper's `mapRow()` labeled the 5 columns as `{rank, playerName, bracket, eventsPlayed, points}`. Live page columns are actually **`PPA Rank · Name · Country · Age · Points`**. So the cached `eventsPlayed: 27` for Ben Johns was always his age, not events played. `bracket` was always empty because country is rendered as a flag image with empty `textContent`. Visible to anyone reading the email or Rankings tab as misleading "27 events" labels.

  **Adjacent bug:** Scraper hung on `waitUntil: 'networkidle'` — PPA's analytics pings keep the network busy past the timeout. Switched to `waitUntil: 'domcontentloaded'` + `waitForSelector('table tbody tr td', { timeout: 15_000 })` + 2s settle. Re-scrape succeeded immediately after the fix.

  **Fix shipped (commit 6d57b8c):**
  - Scraper output shape: `{rank, playerName, country, age, points}` (was `{rank, playerName, bracket, eventsPlayed, points}`).
  - `country` may be `null` when the source renders a flag image — documented in scraper note.
  - [rankings.js](app/js/tabs/rankings.js) updated: shows "age 27" + country chip (when present) instead of "27 events" + bracket.
  - [email-template.js](ingestion/lib/email-template.js) HTML row updated: shows "21,300 pts · age 27 · US" instead of "21,300 pts · 27 events". Plain text unchanged (already only showed rank + name + points).

  **Verification:** preview_eval confirmed first row "21,300 pts · age 27"; both #1 rows still render (1224 tie preserved); skip to #3 preserved.
- **Status:** Closed
- **Cross-ref:** KB-0031 (parent) · KB-0011 · commit 6d57b8c · ingestion/fetch-ppa-rankings.js · app/js/tabs/rankings.js · ingestion/lib/email-template.js

### KB-0038 | On-This-Day module shipped — date-matched history milestones on Daily tab + email
- **Type:** Action
- **Tier:** T3
- **Dependency:** Claude
- **Date:** 2026-04-25 (Session 7)
- **Category:** Build / Delivery / Phase 2 / Daily
- **Tags:** phase-2, on-this-day, history, daily-tab, email, collapse
- **Finding:** Daily-delight module shipped in commit `6d57b8c`. Surfaces history milestones whose calendar MM-DD matches today's date.

  **Match logic ([on-this-day.js](app/js/components/on-this-day.js) `findOnThisDay`):** strict MM-DD match against `m.date` (skip "00" placeholders for unknown month or day), sort newest-first by year. History seed uses YYYY-MM-DD with "00" for unknowns; only 2 entries currently have full dates (2026-02-27 MLP draft, 2026-01-01 Adaptive Standing Division), so most days produce zero matches and the module collapses entirely.

  **Daily tab placement:** Between "Upcoming (next 30 days)" and "Top Highlights" (renders empty string when no match — no header, no card, fully invisible). Verified today (April 25): no Apr 25 milestone → module collapses correctly.

  **Email parallel:** "On This Day in Pickleball" section in HTML template (green accent `#7be5a7`, matching DUPR ratings palette to keep the green-accent-for-history pattern consistent) and plain-text fallback. Same collapse-when-empty behavior. Email template duplicates the match logic locally rather than importing from `app/` (Node CommonJS vs ESM separation per CLAUDE.md project structure).

  **End-to-end render path** verified via `preview_eval` against synthetic Feb 27 2027 reference date → renders "2026 — MLP unifies to 20-team Premier format" with 1 yr ago label.

  **Future expansion:** As [history-seed.json](data/master/history-seed.json) gains more full-date entries (currently sparse — most "00" placeholder dates), more days will surface a milestone. Curation backlog work could promote "00" dates to full dates over time.
- **Status:** Closed
- **Cross-ref:** commit 6d57b8c · app/js/components/on-this-day.js · app/js/tabs/daily.js · ingestion/lib/email-template.js · data/master/history-seed.json · data/master/ui-modules.json § home-on-this-day

---

### KB-0039 | Help-Local localhost:1965 server vs deployed GitHub Pages site — how they differ and what replaces serve.js when deployed
- **Type:** Reference
- **Date:** 2026-04-25 (Session 8)
- **Category:** Help / User-Facing / Deployment
- **Tags:** help, local-dev, github-pages, serve-js, service-worker, divergence, cdn
- **Finding:** Captured for the future Help feature. Two ways to view the app, what differs, and why GitHub Pages needs no equivalent of `scripts/serve.js`.

  **Two entry points:**

  | | `node scripts/serve.js` (localhost:1965) | Link in daily email |
  |---|---|---|
  | What it serves | Local working tree on disk | Deployed GitHub Pages site |
  | URL | `http://localhost:1965/` | `https://jjmgladden.github.io/pickleball-daily/` |
  | Code shown | Whatever's in the repo right now — including uncommitted edits and unpushed commits | Only what's been pushed to `main` and rebuilt by Pages |
  | Data shown | Local `data/snapshots/latest.json` | Whatever the last GitHub Actions cron committed (07:00 UTC daily) |
  | Who can see it | Only the owner, only while the server is running | Anyone on the internet |
  | Service-worker cache | Fresh per-machine | May serve a stale cached shell until SW `CACHE` constant is bumped |
  | Reachable from phone | No (unless port is exposed) | Yes |

  **They routinely diverge — that's normal during active development:**
  - Edit a file → local reflects the change immediately; Pages doesn't see it until `git push`
  - Commit but don't push → local is ahead of Pages
  - Push → Pages still serves the old version for ~30s–2min while the deploy action runs
  - After deploy, the user's browser may still show the **old** version until the SW shell-cache rolls (this is why CLAUDE.md mandates the SW cache + APP_VERSION bump on any shell change)
  - Local can also be **behind** Pages if the daily.yml bot pushed a snapshot the owner hasn't pulled

  **What replaces `scripts/serve.js` on GitHub Pages:** nothing — Pages is just a CDN serving the static files straight from the repo. There is no Node process, no server logic.

  | Piece | Local | GitHub Pages |
  |---|---|---|
  | HTTP server | `scripts/serve.js` (Node, port 1965) | GitHub's edge CDN (Fastly) |
  | Files served | Working tree on disk | The `main` branch as it exists at deploy time |
  | Entry point | `http://localhost:1965/` → root `index.html` redirect → `app/index.html` | `https://jjmgladden.github.io/pickleball-daily/` → same redirect via the same root `index.html` |
  | Trigger to update | Save the file, refresh | `git push` to `main` → Pages build action → CDN updated |
  | `.nojekyll` | Ignored | Tells Pages "don't run Jekyll, serve files literally" |
  | Data fetches | `../data/snapshots/latest.json` from disk | Same relative URL, served from CDN |

  `serve.js` exists only because **browsers refuse to load ES modules from `file://`** for security reasons — some HTTP server is required. Locally that's Node; on Pages, GitHub runs the CDN. The actual app code (`app/index.html`, `app/js/*`, etc.) is identical in both places — that's deliberate, and why all asset paths in `app/index.html` are relative.

  **Quick sanity check** for "are they in sync?":
  - Local header pill vs Pages header pill should match (currently both should read **V7**)
  - If local is ahead: `git status` shows staged/modified files, or `git log origin/main..HEAD` shows unpushed commits
  - If Pages is ahead: `git status` says "behind", and `git pull` fixes it
- **Status:** Closed (reference content; ready to feed into the planned Help feature)
- **Cross-ref:** scripts/serve.js · app/index.html · app/sw.js · CLAUDE.md § URL Structure · CLAUDE.md § Service Worker Cache — MUST bump on shell changes · KB-0019 (port 1965 leftover-process conflict)

---

### KB-0040 | Learn tab restructure + new Courts standalone tab — finalized scope (plan only, no ATP)
- **Type:** Action
- **Tier:** T2
- **Dependency:** Owner (final ATP per phase) + Claude (implementation)
- **Date:** 2026-04-25 (Session 8)
- **Category:** Build / Phase 2 / Learn / Courts
- **Tags:** phase-2, learn, courts, equipment, glossary, etiquette, dupr-explainer, tournament-prep, where-to-play, scope, plan
- **Finding:** Session 8 dialog finalized scope for the next major Phase 2 push. Plan is documented; **no ATP yet** — owner will ATP per phase.

  **Final Learn tab shape (sections, in display order):**
  1. **Rules & Authority** — re-shelved from existing "Governance" + "2026 Rule Changes" under one explicit section header. No content change; just structural re-grouping with an anchor nav.
  2. **Equipment** — NEW. Informational only — USAP-approved paddle list. **Explicitly NO commerce, no affiliate links, no "where to buy" links.** Owner directive: "informational only."
  3. **Glossary / Shot Terminology** — NEW. Hand-curated definitions of pickleball-specific terms (Erne, ATP, Bert, dink, third shot drop, kitchen, stacking, poach, lob, drive, drop volley, etc.).
  4. **Court Etiquette** — NEW. Hand-curated guide: open-play stacking, kitchen-line conventions, calling in/out, paddle-up rotation, paddle stacking on courts.
  5. **DUPR Explainer** — NEW. Hand-written walkthrough: what DUPR is, how it's calculated, why it differs from PPA rankings (preserves KB-0009 separation), how to find your own rating, what 3.0 vs 4.0 vs 5.0 means in practice.
  6. **Tournament Prep Guide** — NEW. Hand-written: how to register on PickleballTournaments.com, what sanctioned events are, what to bring, what to expect at check-in, format conventions (round-robin vs single-elim).
  7. **History** — existing timeline (1965 → 2026), unchanged.

  **DROPPED from earlier plan:** Tips / How-To section (deferred — owner: "Forget the Tips/How To for now").

  **Where to Play → standalone tab (NOT under Learn):** owner ATP'd splitting court-finder out into its own tab per Session 8 recommendation. Transactional UX (input → fetch → map) is structurally different from knowledge browsing. Tab name TBD; recommend **"Courts"** for navbar parallelism with Players/Teams/Tournaments.

  **Courts tab scope:**
  - Address input + adjustable radius (default 10 mi?)
  - Court list (name, address, court count, indoor/outdoor, lighted/unlighted, free/paid where known)
  - Popout Google Map showing pinned courts within radius
  - Reference Project Travel (`C:\Users\John & Cindy Gladden\Desktop\AI\Claude\Travel Project\` — path TBD verified) for Maps integration pattern + Google API credential reuse
  - Cost posture: owner's prior Travel-Project research suggests Google Places usage is well below paid tier unless app goes viral

  **Recommended phasing (4 phases):**

  | Phase | Scope | Estimated effort | Risk |
  |---|---|---|---|
  | **L1** | Convert Learn tab to **TOC + accordion** layout modeled on the Travel Project's Glacier Trip Planner Help tab (`C:\Users\John & Cindy Gladden\Desktop\AI\Claude\Travel\Glacier_RV_Trip_Planner.html` lines 116–150 + 851–905 for CSS + markup reference). Specific elements to adopt: (a) TOC card at top titled "JUMP TO SECTION" with numbered ordered-list of sections, (b) each section as `<details>` + `<summary>` accordion, (c) first section open by default (`<details open>`), (d) custom rotating ▶ arrow via CSS `summary::before` transform, (e) `scroll-margin-top: 12px` on each section for clean anchor-jump landings, (f) numbered sections matching TOC numbering, (g) `<h4>` subsections inside section bodies, (h) callout box CSS classes (`.help-callout` + `.info` + `.tip` variants) for important notes. Re-shelve existing Rules + History under this new structure. CSS classes named with a generic `.tab-toc` / `.tab-section` / `.tab-callout` prefix (NOT `.help-` prefix) so the same pattern is reusable for the future Help feature anticipated in KB-0039. SW cache + APP_VERSION bump | ~45–60 min (was ~30 min before TOC+accordion design refinement) | Low — pattern is proven in Travel Project; CSS variables already exist in `app/styles/main.css` |
  | **L2** | Add Glossary + Court Etiquette + DUPR Explainer + Tournament Prep — all hand-curated static content. Each becomes a new `<details>` accordion section under the L1 TOC. New JSON file(s) under `data/master/` for structured content (glossary terms especially); new render functions in `learn.js`; new TOC entries; CSS reused from L1; SW bump | ~3–4 hr (content curation dominates the build time) | Low — no external dependencies; just content writing + plumbing |
  | **L3** | Add Equipment — USAP-approved paddle list. Investigate first whether USAP exposes a structured feed (JSON/CSV) or paddle list is PDF-only (likely PDF). Build either: (a) hand-curated `data/master/paddles.json` snapshot, OR (b) PDF-extraction script in `ingestion/` if list is large. SW bump | ~1.5–2 hr | Low-medium — depends on USAP source format |
  | **L4** | New Courts tab. Largest unknown — owner-action gates on data-source decision. Steps: (1) Read Project Travel for Maps pattern + key reuse, (2) Decide data source — **Pickleheads** (largest db, ToS read needed) vs **USAP Places2Play** (T1, smaller coverage) vs **Google Places API** (universal, $$ at scale), (3) Add Maps API key to `.env` + GitHub Secret + `docs/credentials.md`, (4) Build `app/js/tabs/courts.js` with input + radius + list + map embed, (5) Add 11th nav tab + RENDERER + index.html nav button, (6) SW bump | ~6–10 hr | **Highest** — new external API, new credential, ToS reading, mobile-responsive map UX |

  **Ordering rationale:** L1 → L2 → L3 → L4 builds confidence and ships visible value early (low-risk structural change first; static content second; structured-list third; biggest unknown last). Each phase is independently shippable.

  **Owner-action items required before each phase:**
  - L1: ATP only
  - L2: ATP + decide whether to include user-visible "last reviewed" timestamps on hand-curated sections (recommend yes — sets expectation that content is reviewed periodically, not stale-and-forgotten)
  - L3: ATP + decide whether to include only paddles, or expand to balls + nets (USAP doesn't approve those at the same level)
  - L4: ATP + court-data-source decision + Google Maps API key approach (reuse Travel Project key vs new key) + tab-name decision ("Courts" vs "Where to Play" vs "Find Courts") + decision on whether to grandfather the 11-tab navbar or trigger a separate consolidation pass first (e.g., merge Rankings + Ratings into a single "Stats" tab with subviews)

  **Cumulative effort across all 4 phases:** ~10.5–16.5 hours of build time, spread across 2–4 sessions. L1 + L2 likely fits in one focused session.

  **NOT IN SCOPE:**
  - Commerce / affiliate links (explicit owner directive)
  - Tips / How-To section (deferred)
  - Equipment beyond USAP-approved-paddle reference (no editorial reviews, no comparisons, no rankings)
  - Crowdsourced court submissions (would re-open KB-0012 Worker dependency — defer)
- **Sub-status (Session 10, 2026-05-02):**
  - **L1 — DONE** (commit 89eed8e on main, S9, live at v13). TOC + accordion structure shipped. Generic CSS classes (`.tab-toc` / `.tab-section` / `.tab-callout`) reusable for KB-0039 Help feature. See KB-0047.
  - **L2 — DONE** (commit 7ee1504 on main, S10, live at v14). Glossary (37 terms × 7 categories, JSON-backed) + Court Etiquette + DUPR Explainer + Tournament Prep added under the L1 shell. See KB-0048.
  - **L3 — DONE** (commit 6f9133a on main, S10, live at v15). NEW "Gear & Courts" top-level tab (10 → 11 nav tabs) hosting Equipment sub-tab (Paddles 5,080 / Balls 365 / Nets spec). Sub-tab strip auto-suppressed at L3 launch (single sub-tab); architecture plumbed for L4 Courts to plug in as second sub-tab. Quarterly scrape workflow scheduled. See KB-0049 + KB-0050.
  - **L4 — Open** (Courts as second sub-tab inside Gear & Courts, ~6–10 hr, new Maps API + credential — sub-tab strip will auto-render once Courts joins the array)
- **Status:** Open (T2 — L1+L2+L3 done; L4 awaiting per-phase ATP)
- **Cross-ref:** KB-0009 (Ratings vs Rankings) · KB-0012 (Worker — out of scope) · KB-0036 (current Learn tab) · KB-0039 (Help feature — same TOC+accordion CSS classes will be reused) · KB-0047 (L1 launch) · app/js/tabs/learn.js · app/styles/main.css · data/master/rules-changes-2026.json · data/master/history-seed.json · Project Travel `Glacier_RV_Trip_Planner.html` (lines 116–150 CSS + 851–905 markup — TOC+accordion reference for L1) · Project Travel (Maps integration reference for L4)

---

### KB-0041 | Future design — self-hosted Ollama as KB-0008 LLM backend (Missouri home server, GitHub Pages browser, Cloudflare Worker proxy)
- **Type:** Concept
- **Tier:** T3
- **Dependency:** Owner (hardware procurement + home networking) + Claude (design doc + integration)
- **Date:** 2026-04-25 (Session 8)
- **Category:** AI / LLM / Self-Hosting / Architecture
- **Tags:** ollama, self-hosted, llm, kb-0008, ai-qa, dynamic-dns, cloudflare-tunnel, worker, llama, future-design
- **Finding:** Owner long-term goal: replace the Claude API backend (initial Phase 4 launch per KB-0008) with a self-hosted Ollama server at the owner's home in Missouri. Browser-side stays on GitHub Pages; Cloudflare Worker continues to proxy; backend swaps from Anthropic API to home Ollama instance.

  **Conceptual flow (owner's mental model is correct):**
  ```
  Brother in VA opens Pickleball PWA in browser
    ↓
  GitHub Pages serves static HTML/JS (unchanged)
    ↓
  Browser fires POST { question } to Cloudflare Worker
    ↓
  Worker forwards to home Ollama server in Missouri (auth + rate limit)
    ↓
  Ollama runs inference on local hardware
    ↓
  Response flows back: Ollama → Worker → Browser
  ```

  **Detailed design doc deferred to a future session — high-level scope of what that doc must cover:**

  **1. Hardware sizing.**
  | Model | RAM/VRAM needed | Notes |
  |---|---|---|
  | Llama 3.x 8B Q4 | ~6 GB | Runs on CPU comfortably; slow but workable (~10–20 tok/s) |
  | Llama 3.x 8B Q8 | ~10 GB | Better quality, still CPU-viable |
  | Llama 3.x 13B Q4 | ~10 GB | Sweet spot for quality at home |
  | Llama 3.x 70B Q4 | ~40 GB | Requires serious GPU (3090/4090 24GB + offload) or M-series Mac with unified memory |
  | Mistral / Mixtral | varies | Mixtral 8x7B Q4 ~28 GB |

  Owner's existing hardware capacity needs to be assessed. A used M1/M2 Mac mini 16GB (~$400 used) or a Mini PC + 32GB RAM (~$500) is the entry-level realistic option.

  **2. Networking — exposing home Ollama to the internet safely.**
  - **Option A: Cloudflare Tunnel (cloudflared)** — RECOMMENDED. Free, no port forwarding, no static IP needed, no certificate management. Owner already has Cloudflare account (KB-0034). Tunnel runs as service on the Ollama box; Worker calls a `*.cfargotunnel.com` URL or a custom subdomain like `ollama.glad-fam.com`.
  - **Option B: Dynamic DNS + port forward + Let's Encrypt** — traditional, more brittle, exposes home IP, requires router config, requires cert renewal.
  - **Option C: Tailscale** — works for owner-only access; would require Worker to be on Tailscale too, which Workers don't support natively.

  **3. Worker auth.** Without auth, anyone who learns the tunnel URL can hit the home server (cost: home electricity + bandwidth + potential hardware abuse). Options:
  - Bearer token shared between Worker and tunnel-side proxy (simplest)
  - Cloudflare Access policy in front of the tunnel (requires Cloudflare Zero Trust setup; free tier covers 50 users)

  **4. Rate limiting.** Even with auth, want per-IP limits at the Worker (10/hr/IP) and per-token-bucket limits at the home box to prevent runaway loops or abusive patterns from burning home compute.

  **5. Latency posture.** VA → Cloudflare edge (~10ms) → Missouri home (~30ms via Tunnel) → Ollama inference (1–10s depending on model + tokens) → reverse path. Total user-visible: ~1.5–11s per query. Acceptable for ask-and-wait UX; not acceptable for streaming/conversational where Anthropic API gives sub-second time-to-first-token.

  **6. Uptime.** Home power outages, ISP outages, router reboots, Ollama service crashes. Mitigation:
  - UPS for the Ollama box (~$80 — the network gear AND the Ollama box need backup power)
  - systemd / launchd service definition with auto-restart
  - Worker fallback: if Ollama call fails or times out >5s, fall back to "AI is offline; try again later" copy (do NOT silently fall back to Claude API — defeats the cost-savings purpose; better to fail visibly)

  **7. Quality vs Claude API.** Llama 3.1 8B and 70B are competitive with GPT-3.5 / Haiku for general Q&A but worse at structured-citation following. Will need prompt-engineering iteration. Output quality on the curated-context-bundle approach (KB-0008 §4) should be evaluated against Claude baseline before fully cutting over.

  **8. Migration sequencing.**
  - Stage A: Ship KB-0008 on Anthropic API (current plan)
  - Stage B: Stand up Ollama at home; smoke-test with curl to the tunnel
  - Stage C: Add Worker route variant `/ai-ollama` parallel to `/ai-claude`; A/B compare answer quality on real queries
  - Stage D: Once Ollama quality acceptable, flip default; keep Claude as backup behind feature flag
  - Stage E: Eventually retire Claude path if cost savings are real and quality holds

  **9. Cost crossover analysis.** Claude API at expected ~$1/mo for Pickleball-only usage means the hardware doesn't pay back fast. Real win is when this pattern serves OTHER projects (per owner pattern: build reusable infra here for future projects). At ~$15/mo across multiple projects, a $500 mini-PC pays back in ~33 months — long. The non-cost wins are stronger: privacy, no API cost ceiling, can fine-tune on owner-specific data, learning experience.

  **Trigger to build the detailed design doc:**
  - KB-0008 has been live on Anthropic API for 4+ weeks
  - Owner has selected hardware (or wants help selecting)
  - At least one other project would benefit from the same Ollama backend

  Until then this entry stands as the conceptual record — the corner-cases owner should know about before committing hardware spend.
- **Status:** Open (T3 — future design; concept captured, detailed doc deferred per owner request)
- **Cross-ref:** KB-0008 (parent — Phase 4 AI Q&A initial Anthropic launch) · KB-0012 (Worker — to be revived for KB-0008) · KB-0034 (glad-fam.com domain on Cloudflare) · docs/concepts-primer.md (Workers, Cloudflare patterns)

---

### KB-0042 | Help-Anthropic API costs, billing posture, build/test budget, full cost audit, and the chat-tab-vs-widget decision (KB-0008 ATP dialog)
- **Type:** Reference
- **Date:** 2026-04-25 (Session 8)
- **Category:** Help / User-Facing / Cost / Billing / API / KB-0008
- **Tags:** help, anthropic, claude-api, billing, costs, atp, kb-0008, kb-0041, ollama, chat-tab, rate-limit, spend-cap, worker, free-tier
- **Finding:** Captured for the future Help feature. Five owner questions asked during the KB-0008 ATP gate, with the full reasoning and numbers.

  ## Summary

  | Question | Short answer |
  |---|---|
  | Does API usage fall under my Claude Plan? | **No** — separate billing at console.anthropic.com, pay-as-you-go |
  | What's the per-query cost? | **~$0.003–0.008** with Haiku 4.5 + curated bundle + prompt caching → ~$1/mo at expected use |
  | Future self-hosted Ollama? | Captured as **KB-0041** future-design Concept; detailed doc deferred |
  | UX shape — chat tab vs inline widget? | **Chat tab** chosen (eleventh nav tab) — reusable pattern for future projects |
  | Curated context limits with Ollama? | **Same recommendation** (~20K tokens) but for different reasons (latency + quality vs cost) |
  | Account/key with no usage = costs? | **$0** — no monthly fee, no key-sitting fee, charges only on actual API calls |
  | Build/testing cost? | **~$0.15–0.30** total for full build + verification cycle |
  | Any other costs introduced by ATP? | **No** beyond Anthropic ~$1/mo. All other surfaces free-tier or already-paid |

  ---

  ## Q1: Anthropic API costs + relationship to Claude Plan

  **The Claude.ai subscription (Pro / Max) covers usage in the Claude.ai chat UI and Claude Code CLI. API usage is separate and metered.** Need to add credit or a payment method at console.anthropic.com under Workspace Settings → Billing.

  **Concrete pricing (Haiku 4.5):** $1/Mtok input, $5/Mtok output.

  **Per-query math with prompt caching:**
  - First query of the day: ~5K input tokens (curated context bundle) + ~500 question + ~500 output = **~$0.008**
  - Subsequent queries that day: ~5K **cached input** at 10% rate ($0.10/Mtok) + ~500 fresh + ~500 output = **~$0.003 each**

  **Projected steady-state usage:**
  - 3 readers × 3 queries/day each = ~$0.03/day = **~$1/month**
  - Heavy usage 50 queries/day = ~$5/month

  **Sonnet 4.6 ($3/Mtok input, $15/Mtok output)** runs ~3× costlier. Recommendation: start on Haiku, escalate to Sonnet only if quality demands it.

  ---

  ## Q2: Future self-hosted Ollama design

  Owner long-term goal: replace the Claude API backend with self-hosted Ollama in Missouri. Browser stays on GitHub Pages; Cloudflare Worker continues to proxy; backend swaps from Anthropic to home Ollama.

  Owner's mental model is correct:
  ```
  Brother in VA → Browser → GitHub Pages (static)
                ↓ POST { question }
  Cloudflare Worker (auth + rate limit)
                ↓ proxy
  Home Ollama in Missouri (Cloudflare Tunnel exposes it)
                ↓ inference
  Response back: Ollama → Worker → Browser
  ```

  **Detailed design doc deferred — captured as separate KB.** See **KB-0041** for full conceptual scope: hardware sizing (8B/13B/70B model RAM requirements), networking options (Cloudflare Tunnel recommended over DDNS+port-forward+LE certs), Worker auth (bearer token or Cloudflare Access), rate limiting, latency posture (~1.5–11s round-trip), uptime concerns (UPS, systemd auto-restart, fail-visible vs silent fallback), quality vs Claude API, migration sequencing (5-stage rollout), and cost crossover analysis (single-project vs multi-project ROI).

  Trigger to build the detailed design doc: KB-0008 has been live for 4+ weeks AND owner has selected hardware AND ≥1 other project would benefit.

  ---

  ## Q3 & Decisions 2–5 outcomes

  **Decision 2 — Where API key lives:** Cloudflare Worker proxy (revives KB-0012 scaffolding for new use case; "deferred before because the other part was deferred — now has a reason to live").

  **Decision 3 — UX shape:** **Chat tab as the eleventh nav tab**, NOT inline ask widget. Owner directive: "build the desired endstate up front" because this project is being used to develop reusable functionality for future projects with higher usage. Risk/complexity assessed as medium not high — chat UI is well-understood (input + scrollable history + send button + loading state). Adds ~1.5 hr vs the inline widget. Worth it for the reusable-pattern goal.

  **Decision 4 — Curated context limits:** ~20K-token bundle with prompt caching for both Claude API and future Ollama backends. Same recommendation, different reasons:

  | Concern | Claude API (cloud) | Self-hosted Ollama (home) |
  |---|---|---|
  | Token cost | Direct $ per token | Zero marginal cost |
  | Inference latency | Sub-second TTFT | Scales with context — 5K on Llama 8B Q4 ≈ 1s; 50K ≈ 10s |
  | Quality | Holds at large contexts | Degrades past ~8K on 8B-class models ("lost in the middle") |
  | Hardware load | None (Anthropic's problem) | Owner's home box CPU/GPU |

  Future enhancement (flagged in KB-0041 Stage C): when Ollama is in play, dynamically choose context size based on which model is loaded.

  **Decision 5 — Cost safeguards:** Per-IP rate limit at Worker (10/hr, 50/day) + Anthropic spend cap + env-var kill switch (panic button to disable feature entirely).

  ---

  ## Q4: Account creation costs

  **No charges for just having the account or the API key sitting unused.** Pure pay-as-you-go.

  - Account creation: **$0**
  - Adding payment method: **$0** (no monthly subscription, no minimum)
  - Generating an API key: **$0**
  - Setting spend limit / monthly cap: **$0**
  - Key sitting unused: **$0**
  - Charges begin: only when an actual API call is made (any source — code, anyone with the key, any test request)

  **Recommended safeguards at account creation:**
  1. Spend limit at Workspace Settings → Billing → hard monthly cap. Recommend **$5** (well above expected $1/mo, low enough to stop runaway loops fast).
  2. Email alerts at 50% and 80% of the cap.

  **Watch for after going live:**
  - **Free credits expiration** — Anthropic sometimes grants $5 trial credits to new accounts; expire after a few months. If applied first, no charges visible until consumed. Worth knowing for billing-statement clarity.
  - **Pre-funding minimums** — some payment flows ask for ~$5 initial credit purchase rather than charging only after usage. Easy to misread as a fee — it's prepaid credit you'll consume over time.

  ---

  ## Q5: Build / testing costs

  Honest accounting of API calls needed during build + verification:

  | Test | Purpose | Calls | Tokens | Cost |
  |---|---|---|---|---|
  | Smoke test after Worker deploy | Confirm key + Worker proxy work | 1–2 | ~1K each | ~$0.01 |
  | Curated-bundle build verify | Confirm ~5K bundle gets cached | 1–2 | ~5K each | ~$0.02 |
  | Cache-hit verify | Confirm subsequent calls hit cache (90% discount) | 2–3 | 5K cached + 500 fresh | ~$0.01 |
  | Citation-format iteration | Tweak system prompt for clean source citations | 5–15 | ~6K each | ~$0.05–0.15 |
  | End-to-end UX verify | Real questions through chat tab | 5–10 | ~6K each | ~$0.03–0.06 |
  | Rate-limit test | Send 11 requests in an hour to verify limit triggers | 11 | ~1K each | ~$0.01 |
  | **Total estimate** | | **~25–40 calls** | | **~$0.15–0.30** |

  **Worst case ~$0.50 for a full build + verification cycle.** Well within $5 spend cap; nothing relative to ongoing $1/mo expected steady-state.

  **Practical implications:**
  - Pre-funding minimum (if Anthropic asks for $5 prepaid) covers all build testing AND ~5 months of expected production. Not a recurring spend.
  - With $5/mo cap, build-day testing uses ~10% of cap. Visible in dashboard.
  - Claude (assistant) commits to telling owner in real time when about to make a real API call (e.g., "running smoke test — 1 API call coming") so owner can watch dashboard live.

  **Tighter posture available:** Build everything *except* actual API integration in dry-run mode (mock Worker responses, hardcoded sample answers), then batch all real-call testing in a single session at the end where owner watches dashboard live. Same total cost, more controlled.

  ---

  ## Q6: Full cost audit — anything else?

  **Direct $ costs introduced by this ATP:**

  | Source | Cost | Frequency | Notes |
  |---|---|---|---|
  | Anthropic API | $0.50 build + ~$1/mo steady | One-time + monthly | Discussed above |
  | Cloudflare Worker (free tier) | $0 | — | Free = 100k req/day, far above projection. Paid tier ~$5/mo only above that. Not realistic for Pickleball. |
  | Cloudflare Workers KV / D1 | $0 | — | Only needed for persistent rate limits; in-memory at single edge instance is fine for v1. Skip. |
  | glad-fam.com domain renewal | ~$10/yr | Annual | Already known, doesn't change. Worker uses subdomain like `ai.glad-fam.com` (free under existing zone) or default `*.workers.dev` (free, less branded). |
  | GitHub Actions | $0 | — | Free tier covers usage; AI work doesn't add cron load. |
  | GitHub Pages | $0 | — | Static hosting unchanged. |

  **Direct cost change: ~$1/mo new (Anthropic), $0 everything else. No hidden fees.**

  **Cost risks (potential, mitigated):**

  | Risk | Potential | Likelihood | Mitigation |
  |---|---|---|---|
  | API key compromised (leaked to repo, browser, console.log) | Hundreds of $ in hours | Low if built correctly | $5/mo spend cap HARD STOPS; key only in Secrets + Worker env, never browser; `scripts/check-secrets.js` catches `sk-ant-` patterns; pre-push gate enforced |
  | Bot/scraper hits public AI endpoint | Could blow monthly budget in a day | Medium-low (Worker URL must be discovered) | Per-IP rate limit at Worker; spend cap stops at API layer regardless |
  | Recursive bug in chat UI (loop re-fires queries on render) | $$$/hr if undetected | Low with proper testing | Build-time testing budget (~$0.50) catches; spend cap stops; env-var kill switch is panic button |
  | Anthropic raises prices | ~doubles bill if 2× | Low — Anthropic has only cut prices since launch | Ollama path (KB-0041) becomes faster ROI |
  | Kid/friend/family heavy chat use | Few $ extra/mo | Low | Per-IP rate limit caps it |

  **Things that have $0 cost despite seeming like they might:**
  - Adding a payment method to Anthropic
  - Generating multiple API keys
  - Cloudflare Worker custom domain (existing glad-fam.com zone)
  - Wrangler CLI tool
  - Service worker cache bumps (CDN bandwidth in Pages free tier)
  - Adding the eleventh tab (no new vendor)

  **Time costs (non-$, but real):**
  - Owner: ~30 min one-time: create Anthropic account + payment + spend cap + key (10 min); approve Worker deploy walkthrough or run `wrangler deploy` (10 min); review chat tab UX once built (10 min). Zero recurring after.
  - Claude (assistant): ~6–10 hr build, spread across 1–3 sessions per owner preference.

  **Net answer:** Beyond ~$1/mo Anthropic spend (capped at $5/mo via spend limit), no additional costs introduced by this ATP — assuming correct build. Every paid surface is either already paid (glad-fam.com), explicitly free-tier (Cloudflare, GitHub), or guarded (Anthropic spend cap + rate limits + kill switch + secrets scanner). Biggest cost-risk is key compromise or runaway bug — both stopped by spend cap at $5 worst case before owner would notice. That's the safety net.
- **Status:** Closed (reference content; ready to feed into the planned Help feature)
- **Cross-ref:** KB-0008 (parent — Phase 4 AI Q&A) · KB-0041 (future Ollama design) · KB-0012 (Worker — to be revived for KB-0008) · KB-0034 (glad-fam.com Cloudflare zone) · KB-0039 (Help-prefix convention origin) · scripts/check-secrets.js (key-leak guard) · docs/credentials.md (where ANTHROPIC_API_KEY entry will go on creation)

---

### KB-0043 | Stats tab shipped — Rankings + Ratings consolidated into one tab (two-column desktop / stacked mobile)
- **Type:** Action
- **Tier:** T2
- **Dependency:** Claude
- **Date:** 2026-04-25 (Session 8)
- **Category:** Build / Delivery / UX / Navbar / KB-0009
- **Tags:** stats, rankings, ratings, consolidation, navbar, two-column, responsive, kb-0009, slot-freeing
- **Finding:** Rankings tab + Ratings tab consolidated into a single new "Stats" tab in commit `43a396c`. Frees a navbar slot ahead of the KB-0008 Ask tab build (navbar went 10 → 9; will be 10 once Ask lands instead of 11).

  **Motivation:** Owner observed the single-column Rankings and Ratings tabs left wide empty margins on desktop — wasted space. Two-column side-by-side layout uses the horizontal real estate.

  **KB-0009 compliance:** The "Ratings vs Rankings UI distinction" rule was about visual distinction (separate components, distinct labels, different chip styles), NOT about being on separate tabs. Two-column layout with explicit "PPA Tour Ranking (52-Week)" + "DUPR Doubles Ratings — Top N" headers + the existing distinct chip treatments (ordinal `chip-rank` left column vs numeric `chip-rating` right column) satisfies the rule. Side-by-side actually *reinforces* the distinction by making "these are different things" visually obvious.

  **Implementation:**
  - **New** `app/js/tabs/stats.js` — thin wrapper that calls `renderRankings()` into a left column and `renderRatings()` into a right column. The two underlying modules (`rankings.js` + `ratings.js`) are unchanged — still imported, just no longer top-level RENDERERS entries.
  - `app/index.html` — replaced 2 nav buttons + 2 tab-panels with single Stats tab + panel (`tab-stats`).
  - `app/js/app.js` — removed rankings/ratings imports + RENDERERS entries; added stats. APP_VERSION v9 → v10.
  - `app/styles/main.css` — `.stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }`. `.stats-col { min-width: 0; }` (allows grid children to shrink below content width). Responsive breakpoint at `@media (max-width: 768px)` collapses to single column with smaller gap.
  - `app/sw.js` — added `stats.js` to SHELL_FILES; CACHE v9 → v10 (paired with APP_VERSION).

  **Verification (live preview):**
  - Desktop (1280×800): Rankings col at left=169 with 200 cards; Ratings col at left=645 with 16 cards; `sideBySide: true`.
  - Mobile (375×812): Both columns at left=16, width=343; Ratings top is far below Rankings bottom (`stacked: true`).
  - Navbar: 9 tabs (was 10).
  - App version pill: v10.
  - No console errors. ESM clean (25 modules — added stats.js).

  **Net effect:** identical functionality to the old separate tabs, better space usage on desktop, navbar comfort restored ahead of the eventual Ask tab addition.
- **Status:** Closed (shipped + verified live)
- **Cross-ref:** KB-0009 (Ratings vs Rankings UI distinction — preserved) · KB-0008 (Ask tab — Stats consolidation freed the slot) · commit 43a396c · app/js/tabs/stats.js · app/styles/main.css (stats-grid + breakpoint) · app/index.html

---

### KB-0044 | YOUTUBE_API_KEY rotation needed — value exposed in Session 8 chat transcript
- **Type:** Action
- **Tier:** T2
- **Dependency:** Owner (rotation in Google Cloud Console + redistribute to all storage locations)
- **Date:** 2026-04-26 (Session 8)
- **Category:** Security / Credentials / Rotation
- **Tags:** youtube-api-key, rotation, kb-0006, credentials, exposure, transcript
- **Finding:** During Session 8 owner shared a screenshot of the local `.env` file to confirm where to add the new `ANTHROPIC_API_KEY` entry. The screenshot included the full `YOUTUBE_API_KEY` value (`AIzaSy...`) on line 5. The key is now present in this conversation's transcript.

  **Risk posture:**
  - Transcript is private (only owner + assistant access directly)
  - Anthropic safety-team review of conversations is policy-permitted
  - Key remains in chat history until conversation cleared
  - Key is restricted to YouTube Data API v3 only (not full Google Cloud account access)
  - Key is behind the YouTube Data API daily quota (10,000 units/day default)

  Net: low practical exposure risk, but inconsistent with the project's credential discipline ("treat each credential like a house key" per `docs/credentials.md` § Quick primer).

  **Owner decision (2026-04-26):** rotate later, not now. Tracked here as T2 action.

  **Rotation procedure (per `docs/credentials.md` § Rotating a credential):**
  1. Open https://console.cloud.google.com/apis/credentials
  2. Find the YouTube Data API v3 key
  3. Click **REGENERATE KEY** — generates new value, immediately invalidates the exposed one
  4. Copy the new value
  5. Update in **four locations** (per KB-0006 — key is shared with sibling Baseball Project):
     - LastPass (canonical home)
     - Local `.env` line 5 (Pickleball Project)
     - GitHub Secrets `YOUTUBE_API_KEY` at https://github.com/jjmgladden/pickleball-daily/settings/secrets/actions
     - Sibling Baseball Project `.env` and its GitHub Secret (per KB-0006 — shared key, separate Secret entries)
  6. Notify Claude: "YouTube key rotated, please update credentials.md"
  7. Claude adds maintenance log entry to `docs/credentials.md` per Session-End Protocol Step 2

  **Until rotated:** no action required. The exposed key still works; the rotation is hygiene, not crisis response.

  **Future hygiene reminder:** when sharing screenshots of config files, crop or block out the value lines. Recorded as a session-feedback item — Claude won't ask for `.env` screenshots; owner crops if sharing voluntarily.
- **Status:** Open (T2 — owner action; rotation deferred to a future session at owner's convenience)
- **Cross-ref:** KB-0006 (YouTube key shared with sibling Baseball Project) · docs/credentials.md § Rotating a credential · docs/credentials.md § YOUTUBE_API_KEY entry · GitHub Secret `YOUTUBE_API_KEY` · sibling Baseball Project .env

---

### KB-0045 | AI context bundle — news section enhanced with URL + ~200-char excerpt per item
- **Type:** Action
- **Tier:** T3
- **Dependency:** Claude
- **Date:** 2026-04-27 (Session 8)
- **Category:** Build / Phase 4 / AI / Context
- **Tags:** ai-context, news, kb-0008, enhancement, prompt-caching, excerpt, url
- **Finding:** Small follow-up enhancement to KB-0008 closure. Owner observed during smoke test that the AI could see news article TITLES but couldn't summarize content or hand out URLs. Root cause: `ingestion/build-ai-context.js § sectionTopNews` only included title + source + date; the snapshot's news items also have `url` + `summary` fields (RSS-extracted) that were unused.

  **Change:** sectionTopNews now emits 3 lines per article:
  1. Title (up to 120 chars) + source + date
  2. URL (the article link)
  3. Excerpt: first ~200 chars of the RSS summary, whitespace-collapsed

  Plus a one-line lead instruction "Cite the URL when handing it to the user" so the model knows the URLs are quotable.

  **Impact on bundle:**
  - Before: 3,861 tokens / 15,442 chars
  - After: 4,229 tokens / 16,913 chars (+10%, within estimate)

  **Cost impact (Haiku 4.5 with prompt caching):**
  - First call of the day: ~$0.009 (was ~$0.008)
  - Cached calls within 5-min TTL: ~$0.003 (unchanged — cache discount dominates)
  - Net: rounding error against the $1/mo expected steady-state

  **Verification:** Local regenerate produced the expected shape (title + URL + Excerpt for top 5 news items). Production verification: ask a news-related question on the live Ask tab after this commit + push deploys to Pages and the Worker fetches the new ai-context.json on next call.

  **Future similar enhancements that might be worth flagging:**
  - Highlight VIDEO descriptions (currently title-only) — same pattern
  - Player profile URLs already present for top-N — possibly extend
  - History milestone source citations — currently just summary; sources field exists in seed
- **Status:** Closed (shipped, verified locally, awaiting live verification on next user question)
- **Cross-ref:** KB-0008 (parent — AI Q&A) · KB-0042 (cost dialog) · KB-0035 (News tab — the original RSS pipeline that produces the summary field) · ingestion/build-ai-context.js · data/snapshots/ai-context.json

---

### KB-0046 | Help-End-to-end Phase 4 AI Q&A launch playbook — Anthropic account setup, Cloudflare Worker deploy, key rotations, Windows cmd paste pitfall, OAuth refresh trap, debugging methodology, every command with explanation
- **Type:** Reference
- **Date:** 2026-04-27 (Session 8)
- **Category:** Help / User-Facing / Phase 4 / KB-0008 / Deployment
- **Tags:** help, kb-0008, anthropic, cloudflare, worker, wrangler, deployment, key-rotation, debugging, lessons-learned, windows-cmd, oauth, playbook
- **Finding:** Captured for the future Help feature. Comprehensive playbook of the entire Phase 4 AI Q&A buildout from owner's first browser visit to console.anthropic.com through the first successful answer. Most owner-facing setup tasks live here; a small number of Worker-side debugging episodes also recorded so future projects don't re-discover them.

  ## Summary

  | Phase | What happened | Time | Result |
  |---|---|---|---|
  | 1. Anthropic account | Sign up, spend cap, payment, alerts, key | ~15 min | Key live in 3 locations |
  | 2. Wrangler local install | Bypass `npx`-cache `&` path bug (KB-0015) | ~5 min | wrangler 4.85 in worker/ |
  | 3. Wrangler login | OAuth via browser | ~2 min | Cloudflare auth ✅ |
  | 4. Worker secret + deploy | First Cloudflare Worker | ~10 min | Live at pickleball-daily-api.jjmgladden.workers.dev |
  | 5. Subdomain registration | jjmgladden.workers.dev (one-time per account) | ~1 min | Permanent CF Workers home |
  | 6. Key value mistyped as secret name (incident) | Plaintext exposure → rotation | ~5 min | KB-0044 logged, rotated |
  | 7. Browser smoke test | First Anthropic 400 with empty body | ~30 min debug | Found root cause via Node script |
  | 8. Windows cmd paste mangling (incident) | `wrangler secret put` only captured 1 char | ~5 min | Recovery via Cloudflare dashboard |
  | 9. OAuth refresh trap (incident) | Cancelled silent refresh popup | ~2 min | Recovery via fresh `wrangler login` |
  | 10. First real Anthropic answer | $0.008 charged | — | KB-0008 closed |
  | 11. UX cleanup pass | Markdown stripping + URL autolink | ~10 min | Polished output |

  Net: ~90 min wall clock; ~10 of those minutes were debugging unanticipated Windows + wrangler quirks. Estimated cost during build: ~$0.05.

  ---

  ## Phase 1 — Anthropic account setup

  **Why:** the AI backend is the Anthropic Messages API. This is a paid service separate from the Claude.ai chat subscription. API usage is metered per token; the Claude.ai Pro/Max plan does NOT cover API usage.

  **Steps owner took (in order):**

  1. **Sign up** at https://console.anthropic.com using `jjmgladden@gmail.com` (matches existing project identity)
  2. **Verify email** via the link Anthropic sent
  3. **Workspace** auto-created as "Default" — owner did NOT need to create a new one. Display name doesn't matter; the system uses it for grouping resources.
  4. **Spend cap set FIRST** (before adding payment method): `Organization settings → Limits → Spend limits → Monthly limit → Change limit → 20 → Save`. Initial default was $100; reduced to $20.
  5. **Payment method + prepaid credit purchase:** `Billing → Buy credits → $20 ("Trying it out", the lowest tier)`. Anthropic's lowest credit tier increased from $5 to $20 sometime in 2026. Filled in billing address (required for tax purposes), entered credit card, confirmed.
  6. **Auto-reload:** when prompted "Turn on auto-reload" with default values $10 trigger / $50 refill, owner clicked **"Skip for now"**. Auto-reload OFF means the spend cap is a true hard ceiling — without it, runaway use cases would silently refill the balance past the visible cap.
  7. **Notification alerts:** `Limits → Spend limits → Email notifications → Add notification`. Set THREE thresholds:
     - **$1** — build-phase canary (will fire during initial development testing)
     - **$5** — confirms first month of production looks normal
     - **$15** — pre-cap warning (75% of $20 — gives time to react before cap fires)
  8. **API key creation:** `API keys → + button → Create in Workspace = Default → Name = pickleball-daily-prod → Add`. The key value (`sk-ant-api03-...`, 108 characters) displays ONCE — must copy immediately to LastPass.

  **Critical lessons from Phase 1:**
  - **Anthropic's prepaid minimum is $20** (was $5 in older docs). Don't budget for $5.
  - **Auto-reload is a trap if you want a real spend ceiling.** Skip it.
  - **Multi-threshold notifications are valuable** during early build — $1 catches anomalies fast.
  - **One key per project rule:** name keys like `pickleball-daily-prod`, not `general-key`. Per-key Anthropic dashboard analytics show per-project spend; rotation can affect just one project.

  **Cost posture set by Phase 1:**
  - Hard ceiling: $20/month at the API level (Anthropic enforces)
  - Prepaid balance: $20 (covers ~5 months at expected usage)
  - Email visibility: alerts at $1/$5/$15 monthly thresholds
  - Auto-reload: OFF
  - First charge of any kind: only when actual API call is made

  ---

  ## Phase 2 — Distribute the key to three locations

  Per `docs/credentials.md` § Storage locations, the key needs to live in three places:

  1. **LastPass** — owner's password manager (canonical home)
  2. **Local `.env`** at project root — for local test scripts (e.g., `scripts/test-anthropic.js`)
  3. **GitHub Secret named `ANTHROPIC_API_KEY`** — at https://github.com/jjmgladden/pickleball-daily/settings/secrets/actions → "New repository secret" → exact-name match (case-sensitive, including the underscore)

  Cloudflare Worker secret comes later (Phase 4) — owner action gated on Worker existing.

  **Process safety pattern — Option A vs Option B (from KB-0042):**
  - **Option A (preferred):** owner adds the secret to GitHub themselves via the web UI. Key value never passes through the Claude conversation transcript.
  - **Option B (faster):** owner pastes key into chat; Claude adds via `gh secret set` from the CLI. Risk: key sits in conversation history.

  Owner chose Option A (correctly). Key never appeared in the transcript via this path.

  ---

  ## Phase 3 — Local wrangler install (work around KB-0015 `&`-in-path)

  **Why local install instead of `npx wrangler`:**

  KB-0015 documents the bug: Windows username `John & Cindy Gladden` contains `&`, which `npx`'s cache fetcher mangles when trying to launch the cached binary. The error looks like `'Cindy' is not recognized as an internal or external command` (cmd interprets `&` as a command separator).

  **Workaround:** install wrangler into `worker/node_modules/` and invoke it via direct `node` path:

  ```
  cd "C:\Users\John & Cindy Gladden\Desktop\AI\Claude\Pickleball Project\worker"
  npm install
  ```

  This populated `node_modules/wrangler/` from `worker/package.json`'s `devDependencies`. Initial install gave wrangler 3.114.17.

  **Wrangler 3 → 4 upgrade (separate problem):** wrangler 3.x has a libuv assertion crash on Node 24.x (`Assertion failed: !(handle->flags & UV_HANDLE_CLOSING), file src\win\async.c, line 76`) that prevented OAuth login from completing. Upgraded:

  ```
  npm install --save-dev wrangler@latest
  ```

  Result: wrangler 4.85.0 in `worker/node_modules/`. `worker/package.json` `devDependencies.wrangler` was bumped from `^3.0.0` to `^4.85.0` and committed.

  **All wrangler commands from this point on use the direct-node pattern:**

  ```
  node ./node_modules/wrangler/bin/wrangler.js <command>
  ```

  This works because:
  - `node` accepts paths with `&` natively (unlike `npx`'s wrapper)
  - The relative path `./node_modules/wrangler/bin/wrangler.js` doesn't trigger any shell substitution

  **Critical lesson from Phase 3:**
  - **Never use `npx wrangler` on this machine.** Always direct-node-invocation. KB-0015 codifies this.
  - **Wrangler 3.x is broken on Node 24+.** Always pin `^4.x` or later.

  ---

  ## Phase 4 — Wrangler OAuth login

  ```
  node ./node_modules/wrangler/bin/wrangler.js login
  ```

  Opens browser to `dash.cloudflare.com/oauth2/auth?...` with a 2-page consent flow:
  1. **Page 1:** Sign in confirmation + account selection. Owner kept "Grant access to all accounts" toggle **OFF** (limits wrangler to the single Cloudflare account, not future accounts). Clicked "Review permissions."
  2. **Page 2:** 14 permissions across "Overall Roles," "Developer Platform," "App Performance" categories. Clicked "Authorize."
  3. Browser shows "Authorization granted to Wrangler — You can close this window."
  4. Terminal shows "Successfully logged in."

  **Auth state stored at:** `C:\Users\John & Cindy Gladden\AppData\Roaming\xdg.config\.wrangler\config\` (token file). Persists across terminal sessions until expiry (typically days/weeks).

  **Critical lesson from Phase 4 (added later in session):**
  - **If a Cloudflare consent popup appears unprompted while wrangler-related work is open, click through it (Authorize), do NOT click Cancel.** That popup is wrangler trying to silently refresh an expiring OAuth token in the background. Cancelling kills the refresh and leaves wrangler with an expired token. Recovery is another full `wrangler login` cycle. (Owner hit this trap in this session — Claude advised "click Cancel, looks unrelated"; that was wrong; cost ~5 min recovery.)

  ---

  ## Phase 5 — Set the Anthropic key as a Worker secret

  ```
  node ./node_modules/wrangler/bin/wrangler.js secret put ANTHROPIC_API_KEY
  ```

  **Critical syntax rule:** the secret NAME goes on the command line (`ANTHROPIC_API_KEY`), then wrangler prompts `Enter a secret value:` and the VALUE is pasted at the prompt (masked input — shows only `*`). Pasting the value as the command-line argument exposes it in plaintext (KB-0044 incident).

  **The first attempt this session was a typo:** owner accidentally typed the full `sk-ant-api03-...` value as the supposed secret name instead of the literal string `ANTHROPIC_API_KEY`. The full key value was visible in the terminal scroll buffer + shell history + chat transcript. **Recovery: rotate immediately** (see Phase 6).

  After the second (correct) attempt, wrangler asks: *"There doesn't seem to be a Worker called pickleball-daily-api. Do you want to create a new Worker with that name and add secrets to it?"* Answer **`y`** — first-time secret-put creates a placeholder Worker shell that the next deploy fills with code.

  **Output on success:** `✨ Success! Uploaded secret ANTHROPIC_API_KEY to <worker-name>`

  ---

  ## Phase 6 — First key rotation incident (KB-0044 + KB-0008 closure log)

  **Trigger:** the mistyped command exposed the key value in the conversation transcript.

  **Recovery procedure (from `docs/credentials.md` § Lost / leaked):**

  1. **Anthropic Console** → API keys → trash icon next to `pickleball-daily-prod` → confirm delete. Old key dies instantly; any process using it gets a 401 next request.
  2. **Create replacement** with the same name (Anthropic does allow same-name reuse if the predecessor is deleted).
  3. **Update three locations:**
     - LastPass — overwrite the old entry's value
     - Local `.env` line — replace `ANTHROPIC_API_KEY=sk-ant-...` value
     - GitHub Secret at the secrets page — pencil icon → paste new value → "Update secret"
  4. **Worker secret update** then proceeded as planned (Phase 5 flow).

  **Critical lessons from Phase 6:**
  - **Rotation is the universal recovery.** Don't try to "un-leak" a key — just kill it and replace.
  - **Always type the secret NAME on the command line, paste the VALUE at the masked prompt.** Never reverse them.
  - **Same-name reuse is fine** — Anthropic allows it once the predecessor is deleted.

  ---

  ## Phase 7 — First Worker deploy

  ```
  node ./node_modules/wrangler/bin/wrangler.js deploy
  ```

  **What this does:** uploads `worker/src/index.js` (and any imports) to Cloudflare's edge as a new version of the named Worker, attaches all `[vars]` from `wrangler.toml` as plaintext env vars, and binds previously-set secrets (e.g., `ANTHROPIC_API_KEY`) at runtime.

  **First-deploy side prompt — workers.dev subdomain registration:**

  ```
  WARNING  You need to register a workers.dev subdomain before publishing to workers.dev
  Would you like to register a workers.dev subdomain now? » (Y/n)
  ```

  Owner pressed **`y`**. Then prompted *"What would you like your workers.dev subdomain to be?"* — entered `jjmgladden`. **Once-per-Cloudflare-account decision; permanent.** All future Workers across all projects on this account live at `<worker-name>.jjmgladden.workers.dev`.

  Subdomain naming rules: lowercase letters + numbers + hyphens; must be globally unique across all Cloudflare customers. (Owner had a brief invalid-subdomain warning that was actually a typo — `i=` and `=` characters slipped in via stray keystrokes; retyping `jjmgladden` cleanly worked.)

  **Output on success:**
  ```
  Deployed pickleball-daily-api triggers (X.XX sec)
    https://pickleball-daily-api.jjmgladden.workers.dev
  Current Version ID: <UUID>
  ```

  Copy that URL — it goes into `data/master/ai-config.json` `workerBaseUrl` field.

  ---

  ## Phase 8 — The empty-400 mystery & debugging methodology

  **Symptom:** Browser Ask tab → ask question → Worker logs `(error) Anthropic non-200: 400` with no body. Browser shows "Anthropic 400. Try again later."

  **Standard culprits ruled out FAST (5 min):**
  - Model ID `claude-haiku-4-5` (short alias) → bumped to dated `claude-haiku-4-5-20251001` → still 400. Not the model.
  - Worker secret value differs from `.env` → re-pasted via `wrangler secret put` → still 400. Hmm.

  **Key debugging tool — the local Node test script.** When the Worker fails opaquely, isolate by hitting Anthropic directly from a different runtime (Node) using the SAME key + payload shape. If Node succeeds, the bug is Worker-specific (not key, not request). If Node also fails, the request itself is bad.

  Created `scripts/test-anthropic.js`:
  - Loads `ANTHROPIC_API_KEY` from `.env`
  - Logs key length + prefix + whitespace check (sanity)
  - Mirrors the Worker's exact payload — system prompt + cache_control + same model
  - Prints full response status + headers + body (zero suppression)

  ```
  cd "C:\Users\John & Cindy Gladden\Desktop\AI\Claude\Pickleball Project"
  node scripts/test-anthropic.js
  ```

  **Result:** `200 OK` + real answer ("Pickleball was invented in 1965"). Bug confirmed Worker-specific.

  **Adding diagnostic logging to the Worker** (KB-0042's "tighter posture" idea applied):
  ```js
  console.log('DEBUG-AI keyLen=' + keyLen + ' keyPrefix=' + keyPrefix + ' keyHasWs=' + keyHasWs);
  ```
  Plus a second `tail` terminal:
  ```
  node ./node_modules/wrangler/bin/wrangler.js tail
  ```
  (`tail` streams Worker `console.log`/`console.error` lines in near-real-time.)

  **Smoking gun:** `keyLen=1 keyPrefix=▬`. The Worker's copy of `ANTHROPIC_API_KEY` was a single weird block character. The Windows cmd terminal had eaten the entire 108-char paste during `wrangler secret put`'s masked-input prompt — only one character registered.

  **Recovery:** **paste the key via the Cloudflare dashboard browser UI**, NOT the terminal. Browser inputs handle paste correctly:
  - https://dash.cloudflare.com → Workers & Pages → pickleball-daily-api → Settings → Variables and Secrets section → ANTHROPIC_API_KEY → click **"Rotate"** (the placeholder text is a clickable link) → paste full key → **Deploy** button at bottom-right.

  Worker picks up new value in ~5 seconds. No `wrangler deploy` needed for secret-only changes.

  **Critical lessons from Phase 8:**
  - **When Anthropic returns 400 with empty body, suspect the API key.** Anthropic doesn't always return JSON for malformed/revoked keys.
  - **Direct-call diagnostics in a different runtime** (Node script) is the single most powerful technique for isolating Worker-vs-request bugs.
  - **Windows cmd masked-input prompts can silently truncate pasted secrets.** Future practice: paste secrets into Cloudflare dashboard via browser, not into terminal.
  - **`wrangler tail` is essential.** Without it the Worker's `console.log/error` lines never reach the developer.
  - **wrangler tail can suppress console.error 3rd argument** — combine multi-arg logs into a single string: `console.error('foo: ' + bar + ' baz: ' + qux)` not `console.error('foo:', bar, 'baz:', qux)`.

  ---

  ## Phase 9 — The OAuth refresh trap

  **Symptom:** mid-debugging, owner saw an unprompted Cloudflare consent page appear in the browser. Claude advised "click Cancel, looks unrelated." Cancel clicked.

  **Result:** next `wrangler secret put` failed with `ERROR: A request to the Cloudflare API ... failed. Authentication error [code: 10000] / Invalid access token [code: 9109]`. Wrangler's OAuth token was now dead.

  **Diagnosis:** the unprompted popup WAS wrangler trying to silently refresh an about-to-expire OAuth token. By clicking Cancel, owner killed the refresh. The old token then expired naturally a few minutes later, leaving wrangler unauthenticated.

  **Recovery:** another full `wrangler login` cycle from `worker/`:
  ```
  node ./node_modules/wrangler/bin/wrangler.js login
  ```
  This time, owner clicked through the consent flow (Review permissions → Authorize). Auth restored. Subsequent commands worked.

  **Critical lesson from Phase 9 — recorded as feedback memory:**
  - **Unprompted Cloudflare consent popups during wrangler work are silent token refreshes. Always Authorize, never Cancel.**

  ---

  ## Phase 10 — First successful Anthropic answer + cost telemetry

  After all the above, browser → Ask tab → ask question → real answer appears. Per-message metadata at the bottom of each answer shows: `claude-haiku-4-5-20251001 · cache hit · context: 2026-04-27`.

  **First call cost (per Anthropic dashboard):**
  - 6,176 cache_creation tokens × ~$1.25/Mtok = $0.0077
  - ~13 fresh input tokens × $1/Mtok = ~$0
  - 58 output tokens × $5/Mtok = $0.0003
  - **Total: ~$0.008**

  **Subsequent calls within 5-min cache TTL:** ~5,000 cached input × $0.10/Mtok (90% discount) + ~500 fresh + ~500 output = **~$0.003**.

  **Real production cost projection** (3 readers × 3 questions/day): ~**$1/month**. Well within $20/month spend cap.

  **Verification flow that proved end-to-end success:**
  1. Browser tab on https://jjmgladden.github.io/pickleball-daily/ Ask tab
  2. Type question, press Enter
  3. Worker logs in tail: `POST .../ai - Ok` + `(log) DEBUG-AI keyLen=108 keyPrefix=sk-ant-api03-E4 ...`
  4. Browser response appears with model ID + cache-hit indicator
  5. Anthropic dashboard at https://console.anthropic.com/settings/usage ticks up by ~$0.008

  ---

  ## Phase 11 — UX cleanup pass (markdown + URL handling)

  **Issues observed by owner during smoke test:**
  1. AI returned `# Pickleball Butt` as a heading — rendered as literal `# Pickleball Butt` text (no parsing)
  2. AI used `**Management**` for bold — rendered as literal asterisks (looked like a glitch)
  3. AI included `https://pickleballunion.com/...` URL — not clickable

  **Two-part fix:**

  **Server-side (Worker system prompt):** added explicit instruction "Do NOT use markdown formatting of any kind — no asterisks for bold, no underscores for italics, no hash marks for headings, no bullet markers, no code fences. Plain prose only." Plus a hint that http URLs in plain prose will be auto-linked.

  **Client-side (`app/js/tabs/ask.js`):**
  - `stripMarkdown()` defensive helper — strips `# heading`, `**bold**`, `_italic_`, `- bullet`, ``` `code` ``` even if the model ignores the system prompt
  - `autolink()` — finds `http(s)://` URLs in escaped HTML and wraps in `<a target="_blank" rel="noopener">`. XSS-safe because URL pattern excludes the chars escapeHtml encodes.
  - `renderHistoryItem` AI branch reordered: stripMarkdown → split paragraphs → escapeHtml → autolink → wrap in `<p>`.

  Owner action after the fix: one final `wrangler deploy` from `worker/` to push the new system prompt to Cloudflare.

  ---

  ## Cumulative session summary

  - **Files added** (this Phase 4 work alone): 4 — `worker/src/index.js` (rewritten), `ingestion/build-ai-context.js`, `app/js/tabs/ask.js`, `data/master/ai-config.json`, `data/snapshots/ai-context.json`, `scripts/test-anthropic.js` (debug tool kept for future)
  - **Files modified:** 9 — `worker/wrangler.toml` (renamed pickleball-daily-submit → pickleball-daily-api, added AI vars), `worker/package.json` (wrangler 3 → 4), `worker/package-lock.json` (new), `app/index.html`, `app/js/app.js` (Ask renderer + APP_VERSION v9 → v12), `app/sw.js` (CACHE v9 → v12, ask.js in SHELL_FILES), `app/styles/main.css` (Ask CSS), `ingestion/fetch-daily.js` (calls buildAiContext), `docs/credentials.md` (ANTHROPIC_API_KEY full entry + maintenance log), `docs/knowledge-base.md` (KB-0008 closed; KB-0044 + KB-0045 + KB-0046 added)
  - **Commits this Phase 4 work:** ~10 across the build + cleanup + enhancement passes
  - **Owner-action steps total:** ~15 (Anthropic account setup + key distribution + wrangler login + secret put + deploy + dashboard recovery + OAuth refresh recovery + final deploy)
  - **Cumulative real Anthropic spend during build + verification:** ~$0.05 (well within $1 first-alert threshold)

  ---

  ## "Things that bit us" — anti-checklist for the next AI integration in any project

  1. **`npx <tool>` on a Windows username with `&`** → always install locally + invoke via `node ./node_modules/.../bin/<tool>.js` (KB-0015)
  2. **wrangler 3.x on Node 24+** → libuv crash; pin `^4`
  3. **Pasting full secret value as the secret name argument** → exposes in transcript; rotate
  4. **Pasting secrets into Windows cmd masked-input prompts** → can silently truncate; use Cloudflare dashboard browser UI instead
  5. **Cancelling unprompted Cloudflare consent popups** → kills wrangler OAuth refresh; always Authorize
  6. **`anthropic-version: '2023-06-01'`** is the correct stable header for cache_control + standard messages — don't speculate it's the bug; it isn't
  7. **wrangler tail's multi-arg `console.error()`** suppresses 3rd+ args — combine into single-string log
  8. **Anthropic 400 with empty body** = almost certainly key-related (truncated, malformed, revoked) — not request-shape
  9. **Anthropic prepaid minimum is $20** (was $5; 2026 raised it)
  10. **Auto-reload off** is mandatory if you want the spend cap to be a real ceiling
  11. **Default model alias `claude-haiku-4-5`** doesn't work for Haiku (must be dated `claude-haiku-4-5-20251001`); Sonnet 4.6 + Opus 4.7 work without dates — inconsistent. Always test the model ID early.
  12. **Subdomain registration is once-per-account, not per-Worker** — pick the name carefully because it's permanent
  13. **`wrangler secret put` does NOT redeploy the Worker** — for code changes use `wrangler deploy`; secret changes alone are picked up automatically within seconds, no redeploy needed
  14. **Worker code changes are not observable via local browser preview** — Worker runs on Cloudflare's edge. Verification requires `wrangler deploy` + a real browser hit.

  ---

  ## Reverse playbook — checklist for the NEXT project that wants this AI pattern

  **Pre-requisites:** Node 18+, GitHub account, Cloudflare account, ~$20 Anthropic credit, a public-static-site frontend (e.g., GitHub Pages).

  **Hour 1 (no code yet):**
  1. Create Anthropic account; set spend cap; buy $20 credit; set $1/$5/$15 alerts; auto-reload OFF
  2. Generate API key (one per project — name it `<project>-prod`)
  3. Add key to LastPass + local `.env` + GitHub Secret

  **Hour 2 (Worker scaffolding):**
  4. `cd worker && npm install && npm install --save-dev wrangler@latest`
  5. `node ./node_modules/wrangler/bin/wrangler.js login` (Authorize, don't cancel)
  6. Adapt the worker/src/index.js handleAi pattern from this project
  7. wrangler.toml: AI_MODEL = `claude-haiku-4-5-20251001` (dated), AI_DISABLED = "false", AI_CONTEXT_URL pointing at your hosted JSON bundle
  8. `wrangler secret put ANTHROPIC_API_KEY` — paste at the prompt, NOT on the command line. **If paste fails silently (Windows cmd), fall back to Cloudflare dashboard.**
  9. `wrangler deploy` — register subdomain when prompted, copy the deploy URL

  **Hour 3 (frontend wiring):**
  10. Build the curated context bundle script (start small — title + summary fields work for most cases)
  11. Build the chat UI (input + history + send + loading states)
  12. Browser-side `ai-config.json` with workerBaseUrl + aiEnabled flag
  13. Smoke test: ask one question, confirm Anthropic dashboard ticks up by ~$0.01

  **Hour 4 (debug tools — build them BEFORE you need them):**
  14. `scripts/test-anthropic.js` direct-call diagnostic
  15. Worker `console.log('DEBUG-AI keyLen=...')` ready behind a debug-mode flag
  16. `wrangler tail` workflow documented for when things break

  **Total greenfield: ~4 hours if no surprises; budget 6–8 with surprises.**
- **Status:** Closed (reference content; ready to feed into the planned Help feature)
- **Cross-ref:** KB-0008 (parent — AI Q&A) · KB-0042 (cost dialog) · KB-0044 (key rotation) · KB-0045 (news enhancement) · KB-0015 (npx + `&` path bug) · KB-0012 (Worker scaffolding origin) · KB-0026 (Worker dormant — superseded by this work) · KB-0041 (future Ollama backend) · `docs/credentials.md` § ANTHROPIC_API_KEY · `worker/src/index.js` · `worker/wrangler.toml` · `scripts/test-anthropic.js` · `ingestion/build-ai-context.js` · `app/js/tabs/ask.js`

---

### KB-0047 | KB-0040 Phase L1 launched — Learn tab TOC + accordion restructure
- **Type:** Action
- **Date:** 2026-04-28 (Session 9)
- **Category:** Build / Phase 2 / Learn / UI / KB-0040 sub-task
- **Tags:** kb-0040, learn, toc, accordion, details-summary, ui, phase-l1, generic-css, kb-0039-prep
- **Finding:** Phase L1 of the KB-0040 Learn-tab restructure plan shipped on commit `89eed8e` to `main`, live at v13. Three numbered sections under a TOC jump-nav, each as a `<details>` accordion. Section 1 (Rules & Authority) re-shelves the existing Governance + 2026 Rule Changes blocks; Section 2 (History) wraps the existing milestone timeline; Section 3 (More coming) teases the L2+ content plan. First section is `<details open>` by default. Custom rotating ▶ marker via CSS `summary::before` transform; `scroll-margin-top: 12px` on each section for clean anchor-jump landings.

  **CSS classes are deliberately generic** (`.tab-toc`, `.tab-section`, `.tab-section-body`, `.tab-callout` + `.info` / `.tip` variants, `.tab-callout-label`, `.tab-toc-title`) rather than `.learn-`-prefixed. This is per the KB-0040 design rationale — the same pattern is reusable for the future Help feature anticipated in KB-0039 (Help-prefix #1) without a CSS rename pass.

  **Files touched (4):**
  - `app/js/tabs/learn.js` — rewritten; `renderLearn` now builds a sections array, generates TOC + accordion HTML; per-section body builders for rules+governance / history / "more coming"
  - `app/styles/main.css` — appended ~104 lines of new classes
  - `app/sw.js` — `CACHE` v12 → v13
  - `app/js/app.js` — `APP_VERSION` v12 → v13

  **Verification (DOM-level via preview eval, screenshot tool was hanging but page itself was fine):**
  - APP_VERSION pill = v13 ✓
  - 3 sections rendered with correct numbered titles ✓
  - 10 rule cards + governance dl + USAP rulebook header in Section 1 ✓
  - 22 history milestones in Section 2 ✓
  - 3 callouts (1 info in Sec 1, 1 standard in Sec 2, 1 tip in Sec 3) ✓
  - TOC jump-link tested (`hash=#learn-history`, `windowScrollY=4698`) ✓
  - Section 1 `<details open>` by default ✓
  - Accordion toggle cycle works ✓
  - `scroll-margin-top: 12px` applied ✓
  - Mobile (375px viewport) → content fits at 343px wide, summary 16.8px, no horizontal overflow ✓
  - Zero console errors ✓
  - Verification gates passed: secrets ✓, ESM 26/26 ✓
  - Race-with-rebase recovery against this morning's daily snapshot commit (`e2f19ea`) was clean

  **What L1 deliberately did NOT do:** any new content. L1 is structural-only. New hand-curated content (Glossary, Court Etiquette, DUPR Explainer, Tournament Prep, Equipment) lands in L2/L3.
- **Status:** Closed (shipped + verified)
- **Cross-ref:** KB-0040 (parent plan — L2/L3/L4 still Open) · KB-0039 (Help feature prep — same CSS pattern) · KB-0036 (predecessor Learn tab) · app/js/tabs/learn.js · app/styles/main.css · Project Travel `Glacier_RV_Trip_Planner.html` (TOC+accordion design source)

---

### KB-0048 | KB-0040 Phase L2 launched — Glossary + Court Etiquette + DUPR Explainer + Tournament Prep
- **Type:** Action
- **Date:** 2026-05-01 (Session 10)
- **Category:** Build / Phase 2 / Learn / Content / KB-0040 sub-task
- **Tags:** kb-0040, learn, glossary, etiquette, dupr, tournament-prep, content, phase-l2
- **Finding:** Phase L2 of the KB-0040 Learn-tab plan shipped on commit `7ee1504` to `main`, live at v14. Four hand-curated content sections added under the L1 TOC + accordion shell shipped in Session 9. Final Learn-tab section order: Rules & Authority (1) → History (2) → Glossary (3) → Court Etiquette (4) → DUPR Explainer (5) → Tournament Prep (6) → More coming (7).

  **New content (~14 KB total prose + structured data):**
  - **Glossary** — JSON-backed (`data/master/glossary.json`, 37 terms across 7 categories: Court & Lines, Serve & Return, Foundational Shots, Advanced Shots, Strategy & Movement, Scoring & Format, Open Play). Structured term/definition pairs render as `<dl>` lists with bold terms + 2px left-border on definitions. JSON format chosen (vs inline prose) for the Glossary specifically because it is structured term/def data, easier to extend, and AI-context-bundle-extensible for future Phase 4 use. Other three sections are inline prose in `learn.js` body builders.
  - **Court Etiquette** — open-play queueing (paddle stack, paddle-up rotation), kitchen-line conventions (don't volley in NVZ, momentum counts), calling lines (benefit-of-doubt rule, partner-disagreement = in), crossing-courts safety, partner conduct. ~2.3 KB prose.
  - **DUPR Explainer** — what DUPR is (rating, not ranking), what it isn't (NOT a PPA Tour ranking, NOT a USAP self-rating, NOT UTR-P/PickleWave ELO), practical numbers tier (2.0–8.0+ with rec/tournament/pro mappings), how it moves (margin matters, recent matches weighted, reliability score), how to find your rating. Preserves KB-0009 (Ratings vs Rankings must not merge) explicitly. ~3 KB prose.
  - **Tournament Prep** — registration platforms (PickleballTournaments + PickleballBrackets), sanctioned vs unsanctioned, picking your bracket, format conventions, what to bring, day-of expectations. ~3.3 KB prose.

  **Files touched (5):**
  - `data/master/glossary.json` (NEW) — schemaVersion 1, 7 categories + 37 terms
  - `app/js/tabs/learn.js` — added `glossaryBodyHtml` (loads JSON + renders by category), `etiquetteBodyHtml`, `duprExplainerBodyHtml`, `tournamentPrepBodyHtml`; sections array grew 3 → 7; "More coming" stub shrunk to L3+ teasers
  - `app/styles/main.css` — added `.glossary-list` dt/dd styling
  - `app/sw.js` — `CACHE` v13 → v14
  - `app/js/app.js` — `APP_VERSION` v13 → v14

  **Verification (DOM-level via preview eval — screenshot tool hung again, same transient harness issue as Session 9):**
  - 7 sections render in correct order with correct TOC ✓
  - TOC anchor-jump tested for DUPR section, scrolls cleanly ✓
  - Glossary loaded all 37 terms across 7 categories (37 dd elements counted) ✓
  - Etiquette: 5 subsections / 17 list items ✓
  - DUPR: 5 subsections / 20 list items ✓
  - Tournament Prep: 6 subsections / 23 list items ✓
  - All callouts render (4 total — 1 per L2 section) ✓
  - Console clean ✓
  - check-secrets clean, check-esm clean (26 modules) ✓

  **Owner-decided in this session:**
  - JSON extraction for Glossary (vs inline) — recommended and approved
  - Inline prose for Etiquette + DUPR + Tournament Prep — approved
  - Section order: existing 1+2 first (no renumber), L2 sections inserted at 3-6, "More coming" pushed to 7 — approved
  - All 4 sections under the SINGLE existing Learn tab (no new top-level tab) — approved at session start
- **Status:** Closed (shipped + verified)
- **Cross-ref:** KB-0040 (parent — L3 also done this session, L4 still Open) · KB-0009 (Ratings vs Rankings boundary preserved) · KB-0047 (L1 launch) · KB-0049 (L3 launch — same session) · `app/js/tabs/learn.js` · `data/master/glossary.json` · `app/styles/main.css`

---

### KB-0049 | KB-0040 Phase L3 launched — Gear & Courts tab + Equipment sub-tab (paddles + balls + nets)
- **Type:** Action
- **Date:** 2026-05-02 (Session 10)
- **Category:** Build / Phase 2 / Equipment / Tab Architecture / KB-0040 sub-task
- **Tags:** kb-0040, gear-courts, equipment, paddles, balls, nets, sub-tabs, phase-l3, usap, scraper, github-actions, quarterly-cron
- **Finding:** Phase L3 of the KB-0040 Learn-tab plan shipped on commit `6f9133a` to `main`, live at v15. **L3 deviated from the original "all under Learn" plan after a mid-session architecture review** — Equipment is structurally a 5,000+ row searchable database, which is a bad fit for Learn's accordion shell. Owner ATP'd a redesign mid-session: Equipment lives in a NEW top-level "Gear & Courts" tab (10 → 11 nav tabs) hosting an Equipment sub-tab. The sub-tab strip is suppressed at L3 launch (only one sub-tab) and will auto-render at L4 when Courts joins.

  **Architecture (Option γ in mid-session redesign):**
  - **New top-level tab:** "Gear & Courts" — name chosen because "Find" alone hides the noun, "Equipment" alone forces a rename at L4. Survives L4 unchanged.
  - **Sub-tab strip:** built but auto-hidden when sub-tab count <2. Enables L4 Courts to plug in by adding one entry to a sub-tabs array — no rework.
  - **Sub-tab visual style** (when shown at L4): pill segmented control. CSS in `main.css` already shipped.
  - **Inner Equipment layout:** flat scrollable view with TOC at top — Paddles → Balls → Nets sections (same pattern as Learn, but no accordion since Paddles already has its own internal search + pagination).

  **Data (~2.51 MB total committed):**
  - **`data/master/paddles.json`** — 5,080 USAP-approved paddles (NEW). Fields per entry: brand, model, addedDate (ISO), imageUrl (USAP CDN link), detailUrl (USAP entry page link), status, shape, depth, coreMaterial, faceMaterial, finish. ~12.7% of (older) entries have null detail-page fields — USAP didn't record those specs back then. UI gracefully degrades.
  - **`data/master/balls.json`** — 365 USAP-approved balls (NEW). Fields: brand, model, ballType (Out/Ind/I&O/null), listedDate (ISO).
  - **`data/master/nets-spec.json`** — written specification + buyer notes (NEW). USAP doesn't publish a product list for nets — only a written spec. 8 spec rows + 3 buyer-note callouts.

  **UI files (5 new + 4 modified):**
  - `app/js/tabs/gear-courts.js` (NEW) — top-level orchestrator
  - `app/js/components/sub-tab-strip.js` (NEW) — reusable pill segmented control with localStorage active-tab memory
  - `app/js/tabs/equipment.js` (NEW) — Paddles search-driven (brand + model typeahead) + paginated (25/page) + sortable (newest / oldest / brand). Balls grouped by Outdoor / Indoor / Indoor & Outdoor / Other. Nets section
  - `app/index.html` — added "Gear & Courts" nav button + section panel
  - `app/js/app.js` — registered new tab; APP_VERSION v14 → v15
  - `app/styles/main.css` — paddle card grid, pill segmented control, ball list grouping, net spec rows + buyer notes
  - `app/sw.js` — added new files to SHELL_FILES; CACHE v14 → v15

  **Ingestion files (2 new):**
  - `ingestion/fetch-usap-equipment.js` (NEW) — Playwright scraper (~85 min for 5,080 entries with detail-page enrichment); supports `--paddles-only`, `--balls-only`, `--limit N`, `--skip-details` flags
  - `.github/workflows/equipment-refresh.yml` (NEW) — quarterly cron (1st of Jan/Apr/Jul/Oct, 06:00 UTC) + manual `workflow_dispatch`

  **Refresh cadence (per owner ATP — A2+A3):**
  - **Quarterly schedule:** automatic, no owner action required
  - **Manual escape hatch:** owner can click "Run workflow" on https://github.com/jjmgladden/pickleball-daily/actions/workflows/equipment-refresh.yml to refresh anytime
  - **Failure notification:** GitHub's default failure-email to repo owner (no extra Resend integration — daily cron's failure-email path has been clean)
  - **Cost:** GitHub Actions free tier is unlimited for public repos; no concern

  **Verification at launch (preview, full data):**
  - 11-tab nav with "Gear & Courts" between Learn and Ask ✓
  - APP_VERSION pill = v15 ✓
  - Sub-tab strip correctly hidden (single sub-tab) ✓
  - 3 equipment sections (Paddles · Balls · Nets) with TOC ✓
  - 5,080 paddles loaded; "Page 1 of 204" pagination ✓
  - Search "Selkirk" → 164 matching paddles ✓
  - Sort by brand → first paddle "11NIL" ✓
  - Ball groups: Outdoor (228) · Indoor (40) · Indoor & Outdoor (68) · Other (29) = 365 ✓
  - 8 net spec rows ✓
  - Console clean ✓
  - check-secrets clean ✓ · check-esm clean (29 modules — was 26, added sub-tab-strip + gear-courts + equipment) ✓

  **Mid-session redesign rationale (recorded for future architecture decisions):**
  Owner asked "do we have too much under a single tab?" — well-timed challenge. Honest assessment: L1+L2 sections are prose-style reference (good fit for accordion), but L3 Equipment is a 5,000+ row searchable database (poor fit). Burying database UX inside an accordion creates real problems: heavy lazy-load on accordion-open, search results scrolling inside a body context, anchor-jumping losing place mid-search. L4 was already planned as a standalone tab anyway, so we'd hit 11 tabs eventually. The "Gear & Courts" parent tab + sub-tab pattern caps the navbar at 11 forever (Equipment + future Courts share a parent), provides a reusable sub-tab pattern for any future "find a thing" features, and matches each content type to its right container.

  **Owner-decided in this session (chronologically):**
  - L3 ATP itself
  - Decertification handling: drop entries from JSON when removed from USAP list (no preserved history field; git log is the audit trail)
  - Image strategy: link to USAP CDN (no images committed locally)
  - Mobile UX: card-per-paddle (no responsive table)
  - File packaging: single `paddles.json` (not split — 2.51 MB is fine)
  - Cron-failure notification: GitHub default email
  - Refresh cadence: A2+A3 (scheduled + manual escape hatch)
  - Field set: paddles → Brand/Model/Added/Shape/Core/Face/Finish/Depth · balls → Brand/Model/Type/Listed · nets → spec text
  - Mid-session: tab placement → standalone "Gear & Courts" tab with sub-tab pattern (NOT under Learn)
  - Mid-session: tab name → "Gear & Courts" (over "Find," "Browse," "Equipment-then-rename")
  - Mid-session: sub-tab strip behavior at L3 launch → hidden until ≥2 sub-tabs (Option (i))
  - Mid-session: sub-tab visual style → pill segmented control
- **Status:** Closed (shipped + verified)
- **Cross-ref:** KB-0040 (parent — L4 still Open) · KB-0048 (L2 launch — same session) · KB-0050 (USAP scraping lessons from this build) · `app/js/tabs/gear-courts.js` · `app/js/tabs/equipment.js` · `app/js/components/sub-tab-strip.js` · `ingestion/fetch-usap-equipment.js` · `.github/workflows/equipment-refresh.yml`

---

### KB-0050 | USAP equipment scraping lessons — pagination, parser graceful-degradation, ball column shift, resumability
- **Type:** Reference
- **Date:** 2026-05-02 (Session 10)
- **Category:** Ingestion / Scraping / USAP / Lessons-Learned
- **Tags:** usap, scraping, playwright, gravityview, pagination, resumability, checkpointing, parser-resilience, lessons-learned
- **Finding:** Reference for the next quarterly USAP equipment refresh (or any future GravityView-based scrape). Captures four gotchas the Session 10 build hit during the L3 ingestion script.

  **1. USAP uses GravityView, NOT a `<table>`.**
  Initial scraper assumption was `table tbody tr`. Real selector is `div.gv-grid-row` containing 4 `div.gv-grid-value` columns. Detail-page links: `a[href*="/paddle-list/entry/"]` (note: no trailing slash on detail URLs from the index — strip it during scrape so dedupe works).

  **2. Pagination URL is `?pagenum=N`, NOT `/page/N/`.**
  First scrape attempt used `/page/N/` because that's the most common WordPress convention. USAP's plugin (GravityView) uses a `?pagenum=N` query parameter instead. The `/page/N/` path silently returned page 1 every time — the scraper found 25 valid rows on every "page" and processed 6,250 entries that turned out to be 25 entries × 250 duplicates. Detection: the URL pattern matters; verify by clicking through the live UI's pagination links and capturing the resulting URL.

  **3. Stop-on-duplicate-page defense.**
  Even with the right URL pattern, future paginators may silent-loop. The corrected script now tracks `seenUrls` (paddle detail URLs) or `seenKeys` (composite brand+model+type+date for balls) per page, and stops when an entire fetched page has zero new entries. Belt-and-suspenders against silent-loop pagination quirks.

  **4. Older paddles have sparser detail pages — 12.7% missing shape/material/finish.**
  Probed several missing-detail entries (e.g., Franklin Sports "Activator" approved 2019). USAP didn't capture shape/material/finish/depth back then; the detail page only has Brand/Model/Image/Status/Added. **Not a parser bug — the data simply doesn't exist.** UI handles this via per-field `if (val) renderRow()` so older paddles render fewer spec rows. Don't waste time "fixing" the parser.

  **5. Older balls have a 3-column index row, not 4.**
  ~29 of the 365 balls are older entries with only Brand/Model/Listed Date in the index page (no Ball Type column). The naive `cols[2]` read grabs the listed date and labels it as ballType. Fix: detect date-shaped value (`/^\d{2}\/\d{2}\/\d{4}$/`) in column 3 and shift it to listedRaw, leaving ballType blank. Now in the live scraper.

  **6. Resumability + 250-entry checkpoints.**
  The detail-enrichment phase (5,080 paddles × 1s/entry = ~85 min) is a fragile single-point-of-failure if interrupted. Pattern adopted: `loadCachedPaddles()` reads the existing `paddles.json` at startup; entries with shape data are flagged `alreadyDone` and skipped on re-run. `writeCheckpoint()` flushes the in-memory paddles array to `paddles.json` every 250 entries (~4 min). On any future interruption, re-running the script resumes from the last checkpoint with at most ~4 min of lost work. Critical for long-running ingestion jobs in general — apply to any future scrape that runs >15 min.

  **7. Crash with no error logged → suspect external interruption.**
  Session 10 had one mysterious failure: detail enrichment started successfully ("[paddles] enriching 5080 entries…" printed) then the process exited with code 4 and zero further output. No error message in the log — strongly suggests an OS-level kill (sleep, AV, OOM). Mitigation is the resumability + checkpoint pattern above; rather than debugging the exact crash cause, design the workload to recover. The same code path completed cleanly on a subsequent run.

  **8. Polite delays.**
  USAP doesn't publish a `Crawl-delay` in robots.txt. Used 1.5s between index pages and 1.0s between detail pages — conservative for an unfamiliar host. Adjust upward if any 429/503 ever appears (none observed in this build).

  **What this means for the next quarterly run:**
  The first cron-fired refresh runs ~Jul 1 2026 if not manually triggered earlier. The script now handles all four gotchas correctly. If USAP changes their plugin or HTML structure, the most likely break points are the GravityView selectors (`.gv-grid-row`, `.gv-grid-value`); the `?pagenum=N` URL pattern is plugin-dependent and could change. A defensive probe is included via the existing scraper's `process.stdout.write` per-page logs — a sudden switch to "0 rows" on page 1 indicates a structural change requiring re-investigation.
- **Status:** Closed (reference for future ingestion sessions)
- **Cross-ref:** KB-0049 (L3 launch — context for these lessons) · KB-0040 (parent restructure plan) · `ingestion/fetch-usap-equipment.js` · `.github/workflows/equipment-refresh.yml` · `data/master/paddles.json` · `data/master/balls.json`

---

**End of KB. Entry count: 50. Next ID: KB-0051.**
