# Ozark Joe's Pickleball Daily Intelligence Report — Claude Code Project Instructions

**Version:** 1 | **Date:** April 22, 2026 | **Previous:** stub (archived)

---

## Project Context

Personal tool maintained by the project owner. Directive working style — delegates execution after go/no-go, pushes back on overcomplication, wants results not explanation.

**Purpose:** Long-term daily-use tool. Automated pickleball intelligence with universal player search, tournament tracking (PPA Tour, MLP), live scoring/brackets, DUPR ratings vs PPA rankings distinction, governance/rules reference (USA Pickleball), curated history, highlights, and influencer/media monitoring. Built to be used every morning by the owner and a secondary reader (eastern-time-zone family member).

**Three structural facts** that distinguish pickleball from the sibling Baseball Project pattern:
1. **Two parallel pro structures** — PPA Tour (tour-event model) and MLP (team-franchise model). UI renders them as parallel models, not flattened.
2. **Ratings vs Rankings** — DUPR (skill rating, 2.0–8.0+) is structurally distinct from PPA rankings (recent-results leaderboard). Users routinely conflate them; UI keeps them in separate, visually-distinct components.
3. **No single pinnable institution** — pickleball has no "hometown franchise" analog. Favorites (team + player) are per-user configurable from day one.

**Pattern lineage:** This project mirrors the architecture of a proven sibling project using the same tech stack (vanilla ES modules + JSON + PWA + GitHub Actions cron + Resend email + Cloudflare Worker submissions + MODR knowledge-base format). Cross-reference details are deliberately not public-repo-coupled per Phase 0 decision.

---

## Critical Rules — Read These First

### Authorization
**Do not proceed with significant changes until receiving Authorization to Proceed (ATP).** Confirm scope first; execute on go.

### Versioning
**All document and schema versioning uses whole numbers ONLY (v1, v2, v10).** No decimals, no underscores. ANY change — no matter how small — rolls the whole number. Applies to CLAUDE.md, JSON schemas, HTML shell, ingestion libraries, docs. Previous versions archive to the parent's `archive/` subfolder.

### Data Flow Architecture

```
ingestion/ (Node scripts — local or GitHub Actions)
    ↓ scrapes + API calls (PPA, MLP, DUPR, USAP, YouTube)
data/snapshots/YYYY-MM-DD.json   ← daily cache (grows over time)
data/master/*.json               ← reference data (sources, tournaments, teams,
                                     players, rules, history, media, video,
                                     entities, ui-modules)
    ↓
app/ (static PWA — SW + SVG icon; consumes JSON only at runtime)
```

JSON is the single source of truth. **The browser NEVER hits a live API.** All external calls happen in `ingestion/`.

### Secret Safety (non-negotiable)
1. API keys NEVER enter the repo. `.env` is gitignored.
2. YouTube Data API v3 key, Resend API key, and any future AI-provider key used ONLY in ingestion scripts (Node.js, local or GitHub Actions Secrets), never in the browser.
3. `scripts/check-secrets.js` scans for common key patterns. Run before every commit.
4. Files NEVER committed: `.env`, `credentials*.json`, `*.key`, `*.pem`, `secrets/`, any file containing `AIza`, `ghp_`, `AKIA`, `re_`, `sk-ant-`, etc.
5. Violations are treated as stop-work items.

### Flag Unrequested Features Before Building
Do not add features, behaviors, or capabilities beyond the current spec or a documented decision. When an enhancement opportunity appears: **flag, do not build.** State the idea, wait for direction.

### Don't Break Working Tools
Work deliberately. Never chase architecture at the cost of a functional tool. Prototype before full build — confirm framing before large investments.

### Be Accurate (critical for pickleball data)
- Only claim what the data says. Never fabricate stats, ratings, rankings, tournament results, biographical facts.
- If a value is missing from a source, render "—", not a guess.
- Stories, history, rules content must cite verifiable public sources.
- Pickleball is a young sport with fragmented data. Some "facts" are folklore (e.g., the 1965 Bainbridge Island origin has documented variants — pickle-boat vs dog "Pickles"). Cite the strongest source and flag uncertainty rather than suppress variants.
- **Developing vs confirmed gate:** social-only posts from T2/T3 handles trigger "developing" status; promote to "confirmed" only when echoed by a T1 official handle or site. Codified in `data/master/sources.json § sourceConflictHierarchy.developingVsConfirmed`.

### Service Worker Cache — MUST bump on shell changes
**Any commit that modifies a file listed in `app/sw.js`'s `SHELL_FILES` array (or `app/index.html`, `app/styles/main.css`, any file under `app/js/`, `app/manifest.webmanifest`, `app/icon.svg`) MUST also bump the `CACHE` constant in `app/sw.js` in the same commit.**

Sibling-project incident: "Refresh data" button addition was invisible to the user's browser until the cache was rolled. Same rule applies here.

### Pre-Push JS Syntax Verification
**Any commit that modifies JS files in `app/js/` MUST be verified via runtime import check before push.** `node --check` misses ES-module-specific errors (template literals, imports). Required check:

```
for f in app/js/.../*.js; do
  node -e "import('./$f').then(() => console.log('OK: $f')).catch(e => console.log('FAIL: $f -- '+e.message));"
done
```

Sibling-project incident: a `\\'s` escape passed `node --check` but crashed the ESM import, blanking the deployed site until fixed. Same rule applies here.

### Ratings vs Rankings must not merge (UX Critical Rule)
DUPR ratings and PPA rankings answer different questions ("how good?" vs "winning on tour?"). They must render in separate UI components with explicit labels, different visual treatments (numeric chips for Ratings, ordinal position chips for Rankings), and separate "Movers" widgets. See `docs/phase-0-blueprint.md § 2` and `docs/knowledge-base.md KB-0009`.

### Headless-browser ingestion is an accepted dependency for PPA rankings
Unlike the sibling Baseball Project (which uses only `fetch`), pickleball's PPA rankings table is JavaScript-hydrated. Phase 1 onward uses Playwright (preferred) or Puppeteer for the rankings scrape. This is a documented tooling addition; respect `robots.txt`'s `Crawl-delay: 3` and cache aggressively.

### YouTube embed policy: thumbnail + click-out default
The sibling project learned that MLB's official YouTube channel disables third-party embedding (Error 153). PPA and MLP embed behavior is **unverified** as of 2026-04-22. Default rendering is thumbnail + click-out; iframe is a progressive enhancement conditional on a Phase 1 live test that documents results in a KB entry.

---

## Project File Structure

```
Pickleball Project/ (also git repo root)
├── CLAUDE.md                        ← This file (auto-loaded by Claude Code)
├── README.md
├── index.html                       ← Root redirect → app/index.html (for GitHub Pages)
├── .nojekyll
├── package.json
├── .gitignore
├── .env.example
│
├── .github/workflows/
│   ├── daily.yml                    ← 07:00 UTC — commits fresh snapshot, sends email (Phase 3)
│   └── weekly-batch.yml             ← Monday 08:00 UTC — curation backlog review Issue (Phase 2)
│
├── app/                             ← Static PWA (Phase 1+)
│   ├── index.html                   ← All asset paths RELATIVE for portability
│   ├── icon.svg
│   ├── manifest.webmanifest
│   ├── sw.js                        ← Service worker (scope: /app/, shell-only cache)
│   ├── styles/main.css
│   └── js/
│       ├── app.js                   ← Bootstrap + tab routing + SW registration + splash
│       ├── data-loader.js           ← Loads JSON from ../data/... (relative)
│       ├── components/
│       │   ├── favorites.js         ← localStorage favorite team + players
│       │   ├── ranking-card.js      ← PPA ranking widget (separate from rating-card)
│       │   ├── rating-card.js       ← DUPR rating widget (separate from ranking-card)
│       │   ├── live-scoreboard.js   ← In-progress match card
│       │   ├── highlights.js        ← YouTube thumbnails + click-out
│       │   ├── confidence-badge.js  ← T1/T2/T3/developing visual tier
│       │   └── splash.js            ← Once-per-session intro animation (Phase 3)
│       └── tabs/
│           ├── daily.js             ← Home modules per ui-modules.json
│           ├── live.js              ← Currently in-progress matches
│           ├── tournaments.js       ← PPA + MLP event calendar
│           ├── teams.js             ← MLP team-centric view
│           ├── players.js           ← Universal search + favorites ★
│           ├── rankings.js          ← PPA Tour rankings
│           ├── ratings.js           ← DUPR leaderboards
│           ├── highlights.js        ← YouTube highlights
│           ├── news.js              ← Phase 2
│           └── learn.js             ← Phase 2 — rules + history + governance
│
├── ingestion/
│   ├── fetch-daily.js               ← Orchestrator
│   ├── fetch-ppa-rankings.js        ← Headless-browser scraper (Playwright)
│   ├── fetch-ppa-events.js          ← Schedule + event state
│   ├── fetch-mlp.js                 ← Teams + rosters + standings + events
│   ├── fetch-dupr-leaderboard.js    ← Public top-50 scrape (weekly)
│   ├── fetch-highlights.js          ← YouTube Data API from channel allowlist
│   ├── fetch-results.js             ← PBT + PickleballBrackets reconciliation
│   └── lib/
│       ├── ppa-api.js               ← PPA ppatour.com wrapper
│       ├── mlp-api.js               ← MLP scraper
│       ├── dupr-api.js              ← DUPR public scraper
│       ├── youtube-api.js           ← YouTube Data API wrapper
│       ├── env.js                   ← Tiny .env loader (no deps)
│       ├── cache.js                 ← Per-source cache-and-diff
│       └── reconcile.js             ← Multi-source conflict resolution
│
├── data/
│   ├── master/                      ← Stable reference data (Phase 0 seeds)
│   │   ├── sources.json
│   │   ├── tournaments-2026.json
│   │   ├── mlp-teams.json
│   │   ├── players-seed.json
│   │   ├── rules-changes-2026.json
│   │   ├── history-seed.json
│   │   ├── media-sources.json
│   │   ├── video-sources.json
│   │   ├── entities-to-track.json
│   │   ├── ui-modules.json
│   │   └── curation-backlog.json    ← (Phase 2)
│   ├── snapshots/                   ← YYYY-MM-DD.json + latest.json (Phase 1+)
│   └── archive/
│
├── scripts/
│   ├── serve.js                     ← Local static server (port 1965 — Bainbridge origin year)
│   ├── check-secrets.js
│   └── build-player-index.js        ← Phase 2+
│
├── worker/                          ← Cloudflare Worker (Phase 3)
│   ├── src/index.js                 ← POST handler → GitHub Issue
│   ├── wrangler.toml
│   ├── package.json
│   └── README.md                    ← Deployment walkthrough
│
├── sessions/                        ← Handoff + Kickoff prompts per session
│   ├── PICKLEBALL_Handoff_Prompt_V{N}.md
│   └── PICKLEBALL_Kickoff_Prompt_Session{N+1}.md
│
├── docs/
│   ├── knowledge-base.md
│   ├── phase-0-research.md          ← Phase 0 narrative
│   ├── phase-0-blueprint.md         ← Phase 0 product design
│   ├── data-sources.md              ← Phase 1+
│   ├── ingestion.md                 ← Phase 1+
│   ├── deployment.md                ← Phase 3
│   ├── youtube-api-setup.md         ← Phase 1 (mirror sibling-project pattern)
│   └── pwa-platform-reference.md    ← Phase 1+
│
├── logs/                            ← Ingestion logs (gitignored)
├── archive/                         ← Retired CLAUDE.md versions
└── PICKLEBALL_Session1_KickoffPrompt.md  ← Session 1 kickoff (historical reference)
```

---

## URL Structure (deployed — Phase 3+)

- **Local dev:** `http://localhost:1965/` → redirects to `/app/index.html`
- **GitHub Pages:** `https://jjmgladden.github.io/pickleball-daily/` → redirects to `pickleball-daily/app/index.html`
- All asset paths in `app/index.html` are relative (`styles/main.css`, `js/app.js`, etc.)
- All data fetches are relative (`../data/snapshots/latest.json` from `app/` context)
- Single build works identically local or on Pages.

---

## Data Sources

Machine-readable registry: `data/master/sources.json`. Narrative research: `docs/phase-0-research.md`.

**Primary (T1 official):**

| Source | URL | Use | Key |
|---|---|---|---|
| PPA Tour | `ppatour.com` | Schedules, events, rankings, player pages | None (scrape-friendly; JS-hydrated rankings require headless browser) |
| Major League Pickleball | `majorleaguepickleball.co` | Teams, rosters, standings, events, news | None (scrape-friendly) |
| USA Pickleball | `usapickleball.org` | Rules, rulebook (annual PDF), history, governance, paddle approval | None |
| DUPR | `dupr.com` | Player ratings, leaderboards, risers | Partner API for per-player (Phase 2); public scrape for top-50 leaderboard |
| Pickleball.com | `pickleball.com` | UPA-consolidated results hub | API token-gated (`PB-API-TOKEN` — partner/approval) |
| PickleballTournaments (PBT) | `pickleballtournaments.com` | Finalized results, brackets, registration | None (scrape-friendly) |
| PickleballBrackets | `pickleballbrackets.com` | Live brackets, live scoring | None (scrape-friendly; auto-feeds DUPR) |
| YouTube Data API v3 | `googleapis.com/youtube/v3` | Highlight ingestion from channel allowlist | **Required — shared with sibling project** (one Google Cloud project, one key, separate repo Secret `YOUTUBE_API_KEY`) |

**Secondary (T2):** The Dink (`thedinkpickleball.com`), PickleWave (`picklewave.com`), Pickleball Magazine (USAP-affiliated monthly).

**Tertiary (T3, editorial/opinion):** The Kitchen Pickle (`thekitchenpickle.com`).

**Source-conflict hierarchy per domain:** see `data/master/sources.json § sourceConflictHierarchy`. Summary: PPA Tour wins for rankings + prize money + authoritative results; PickleballBrackets wins for in-progress live scoring; DUPR is unopposed for ratings; USAP is unopposed for rules + governance.

---

## Coding Standards

### JavaScript
- `const` by default, `let` when needed, never `var`.
- `camelCase` variables/functions, `UPPER_SNAKE_CASE` constants, `PascalCase` classes.
- ES modules in `app/`; CommonJS in `ingestion/` and `scripts/`.
- Wrap `fetch()` in try/catch; never swallow errors silently.
- Node 18+ (native `fetch`).
- Playwright (preferred) or Puppeteer for headless-browser scraping in ingestion. Respect `Crawl-delay: 3` on `ppatour.com`.
- Escape all user-visible strings via the `escapeHtml` helper in every tab module.
- **Pre-push import check on any `app/js/` change** (see Critical Rules).

### HTML/CSS
Dark-theme CSS variables defined once in `app/styles/main.css`. Never use dim/off-white text on dark backgrounds. All interactive elements need descriptive text or `aria-label`.

**Ratings vs Rankings visual treatment:** rankings use ordinal position chips (`#1`, `#2`, …); ratings use numeric value chips (`7.09`, `7.01`, …). Different CSS classes; do not share.

### No Hardcoded Credentials
API keys ONLY in `.env` (gitignored) or GitHub Actions Secrets.

### Confidence tier rendering
Every card carries a confidence tier (T1 / T2 / T3 / developing). Render per `data/master/ui-modules.json § confidenceRendering`: T1 normal, T2 subtle footer, T3 explicit "editorial/unverified" badge, developing yellow-dot "Developing" label.

---

## Behavioral Rules

| Rule | Description |
|---|---|
| ✅ Be accurate | Only answers grounded in verifiable data |
| 🔍 Search before answering | Check KB and source files first |
| ⚠️ Flag speculation | Say "I am speculating" when inferring |
| ❌ Do not fabricate | Never invent stats, players, dates, quotes, ratings, rankings |
| 📚 Cite sources | Reference KB entry, source ID from `sources.json`, or file used |
| 🔔 Flag context limits | Notify when approaching context window limits |
| 🎯 Separate ratings from rankings | DUPR ratings and PPA rankings are not interchangeable |
| 🟡 "Developing" means unconfirmed | Social-only T2/T3 posts carry "developing" tag until T1 echo |

---

## Knowledge Base Format

Adopted from the MODR convention. Every KB entry in `docs/knowledge-base.md`:

```markdown
### KB-XXXX | [Short descriptive title]
- **Type:** [Reference / Decision / Limitation / Action / Issue / Concept]
- **Tier:** [T1 / T2 / T3 — dynamic types only (Action / Issue / Concept); omit for static]
- **Dependency:** [Owner / Claude / External / Blocked (cite KB) — dynamic types only; omit when Closed]
- **Date:** YYYY-MM-DD
- **Source:** [Chat session, test result, external reference]
- **Category:** [Primary / Subcategory]
- **Tags:** [lowercase, comma-separated]
- **Finding:** [Specific, complete description]
- **Status:** [Open / Closed / Blocked (cite blocker)]
- **Cross-ref:** [Related KBs or files]
```

**Tier definitions (dynamic types only):**
- **T1** — *Critical / Production-impacting.* Something user-facing is broken or a security boundary is in question. Fix first.
- **T2** — *Near-Term.* Planned enhancement or non-critical gap. Address in an upcoming session.
- **T3** — *Deferred.* Nice-to-have or someday / research. No active commitment.

Static types (Reference, Decision, Limitation) omit Tier and Dependency.

Entry IDs continue sequentially. This project starts at KB-0001 (independent of sibling-project KB numbering).

---

## Session-Start Protocol (MANDATORY)

Every session must begin with:

1. **Read this CLAUDE.md** (auto-loaded by Claude Code)
2. **Read the latest Handoff** — `sessions/PICKLEBALL_Handoff_Prompt_V{latest}.md`
3. **Read the Kickoff** — `sessions/PICKLEBALL_Kickoff_Prompt_Session{this}.md`
4. **Read `docs/knowledge-base.md`** — list ALL open entries with tier + status
5. **Dump OPEN items to screen**: every Action / Issue / Concept not Closed — show ID, title, tier, dependency. Format example:
   ```
   OPEN (dynamic):
     KB-0004  T2  Claude   Player index scope — needs Phase 2 expansion plan
     KB-0007  T2  Claude   Daily morning email — awaiting Phase 3 activation
   OPEN (static awaiting trigger):
     KB-0011  —   Owner    Repo creation pending
   ```
6. **Check `data/snapshots/latest.json`** — confirm morning ingestion ran; report timestamp (Phase 1+)
7. **Check for open weekly-batch Issues** — `gh issue list --repo jjmgladden/pickleball-daily --label weekly-batch --state open` (Phase 2+)
8. **Check for open submission Issues** — `gh issue list --repo jjmgladden/pickleball-daily --label submission --state open` (Phase 3+)
9. **Confirm no stale files need archiving** per versioning rules
10. **Report session health** — one line: context load (light / moderate / heavy), outstanding KB items, what's next

### Session-start specific to compacted sessions
If resumed from a compacted summary, add: `[SESSION HEALTH] Compacted: Yes | Context Load: Heavy | Risk: recommend fresh session for any large build`.

---

## Session-End Protocol (MANDATORY — never skip any)

Every session must end with these steps, in order:

1. **Update `docs/knowledge-base.md`** — add new entries, close completed items, flip statuses, bump "Last updated" date. This is a full merged file, never a delta.
2. **Archive any previous versions** if a whole number rolled this session (CLAUDE.md, data schemas, etc. → `archive/`). Never delete.
3. **Write the Handoff Prompt** — `sessions/PICKLEBALL_Handoff_Prompt_V{N+1}.md`. Full session record:
   - Session number, date range, predecessor chain
   - Current-versions table with changes bolded
   - "What Happened" — work tracks chronologically
   - Decisions committed (table)
   - System state at end
   - Known issues / tech debt
   - Open KB items — dumped with tier
4. **Write the Kickoff Prompt** — `sessions/PICKLEBALL_Kickoff_Prompt_Session{N+2}.md`. Concise start-here for the next session:
   - "Read these first" (ordered list of files)
   - Session-start protocol reminders
   - What just happened (1-paragraph summary)
   - Top priorities — Options A / B / C for main-track choice
   - Side tasks interleaved
   - Expected deliverables
   - System state snapshot (one-pager)
   - Critical reminders (things that bit us this session)
   - Session-end reminders for next session
5. **List file changes** explicitly for the owner — what changed, what's new, what moved
6. **Release-readiness check** — if any user-facing change shipped, note it in CHANGELOG-compatible format (Added / Changed / Fixed / Security)
7. **Report to owner**: brief summary — what was done, what's next, any blockers

### Naming conventions
- Handoffs are versioned **monotonically** across all sessions: `V1`, `V2`, `V3` (no reset per session)
- Kickoffs reference the **session number they open**: `Session2`, `Session3`, etc.
- Never skip numbers. Never reuse numbers.

---

## AI-Retrievable Schema Constraints (Phase 4 Forward-Compat)

Phase 4 will add a natural-language Q&A layer over the JSON corpus. Phase 0+ schemas are designed so the retrofit is cheap:

1. **Every entity has a stable, unique ID.** `playerId`, `teamId`, `tournamentId`, `matchId`, `sourceId`. IDs never change once published.
2. **Cross-references use IDs, not names.** `match.participants: [{playerId}, {playerId}]`, not `match.participants: ["Anna Leigh Waters", ...]`.
3. **Timestamps are ISO 8601 with timezone.** No naked date strings.
4. **Denormalize human-readable fields for retrieval.** Each entity carries `displayName` and (where relevant) `summary`.
5. **Source citations are structured, not prose.** `{"sourceId": "ppa-tour", "url": "...", "retrievedAt": "..."}`.
6. **Confidence and freshness are first-class fields.** Every record carries `confidence: T1|T2|T3` and `lastUpdated`.
7. **Snapshot files are append-only history.** Daily snapshots accumulate in `data/snapshots/`.

---

## Current Phase

**Phase 0 — Research (complete, 2026-04-22)**
- Narrative research report: `docs/phase-0-research.md`
- 10 JSON seed files in `data/master/` (sources, tournaments-2026, mlp-teams, players-seed, rules-changes-2026, history-seed, media-sources, video-sources, entities-to-track, ui-modules)
- Product blueprint: `docs/phase-0-blueprint.md`
- This CLAUDE.md v1
- Knowledge base seeded with KB-0001 through KB-0012

Awaiting owner ATP for Phase 1.

**Phase 1 — Foundations (next session after ATP)**
- Ingestion scaffolding (Node 18+, Playwright for PPA rankings).
- Scrape PPA + MLP + DUPR + USAP → daily snapshot.
- Static PWA shell: 8 tabs (Daily, Live, Tournaments, Teams, Players, Rankings, Ratings, Highlights).
- YouTube Data API highlight ingestion (shared key from sibling project).
- Local dev on port 1965.
- No public deploy yet.

**Phase 2 — Depth**
- DUPR per-player access (login or partner API).
- News + Learn tabs.
- Curation backlog workflow.
- Player comparison.
- On-This-Day module.

**Phase 3 — Polish + Deployment**
- Splash screen, PNG icons for iOS.
- GitHub Pages deploy.
- Daily Resend email (shared Resend account with sibling project; independent recipient list).
- Cloudflare Worker for public submissions.

**Phase 4 — AI Q&A + Content Expansion**
- Natural-language Q&A over JSON corpus.
- Auto-reload on SW update.
- Ongoing content expansion.
