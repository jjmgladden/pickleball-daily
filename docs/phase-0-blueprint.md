# Phase 0 Product Blueprint — Ozark Joe's Pickleball Daily Intelligence Report

**Date:** 2026-04-22 · **Status:** Phase 0 · **Companion:** `docs/phase-0-research.md` · **Structured data:** `data/master/ui-modules.json`

This document defines the product-level design. Three-structural-facts drive everything: (1) two parallel pro models (PPA tour-event + MLP team-franchise), (2) ratings ≠ rankings (DUPR vs PPA), (3) no single pinnable institution.

---

## 1. Information Architecture

```
Ozark Joe's Pickleball Daily Intelligence Report
│
├── Daily Report  ← landing page, first-load, home modules
│   ├── Daily Briefing (one-paragraph synthesis)
│   ├── Live Now (collapses when empty)
│   ├── Today's Tournaments (PPA + MLP)
│   ├── MLP Standings Snapshot (top 10)
│   ├── Trending Players
│   ├── PPA Rankings Movers ←─── separate from...
│   ├── DUPR Ratings Movers  ←─── ...this (Phase 2)
│   ├── Latest Results
│   ├── New Highlights (YouTube, thumbnail + click-out)
│   ├── Rule of the Day (rotating 2026 changes)
│   └── On This Day in Pickleball (sparse, Phase 2)
│
├── Live         ← currently in-progress matches (real-time-ish)
├── Tournaments  ← upcoming/past across PPA + MLP, filterable
├── MLP Teams    ← team-centric: standings + rosters + schedules
├── Players      ← universal search, ★ favorites, ⇄ comparison (P2)
├── Rankings     ← PPA Tour rankings (52-Week + Race)   ←─── NOT merged
├── Ratings      ← DUPR public leaderboards              ←─── NOT merged
├── Highlights   ← YouTube ingestion, curated channels
├── News         ← Phase 2 — curated feed, developing-vs-confirmed
└── Learn        ← Phase 2 — rules, history, governance, 2026 changes
```

**Tab count:** 8 tabs in Phase 1 (Daily through Highlights); 10 total with News + Learn in Phase 2.

**Design principle — parallelism:** `Tournaments` is event-centric. `MLP Teams` is team-centric. `Players` is player-centric. `Rankings` shows PPA. `Ratings` shows DUPR. These are all different lenses on the same underlying entity graph; they should not be merged into a single "Standings" tab.

---

## 2. Home-Screen Modules (Daily Report Tab)

Per `data/master/ui-modules.json § homeScreenModules`. Priority order = top-to-bottom display order.

| # | Module | Phase | Purpose |
|---|---|---|---|
| 1 | Daily Briefing | 1 | One-paragraph morning synthesis. "Today Anna Leigh Waters faces Kate Fahey in the Atlanta Championships QF; MLP week 2 in Columbus." |
| 2 | Live Now | 1 | Currently in-progress matches. Collapses when no live events. Links to Live tab. |
| 3 | Today's Tournaments | 1 | PPA + MLP events active today with day-of-event context (R32 / QF / Finals). |
| 4 | MLP Standings Snapshot | 1 | Top 10 MLP teams by standings points. Click-through to full standings. |
| 5 | Trending Players | 1 | Notable recent activity (win, upset, deep run). |
| 6 | PPA Rankings Movers | 1 | 7-day jumps/drops on 52-week. Separate from Ratings Movers. |
| 7 | DUPR Ratings Movers | 2 | Monthly Risers (Reliability ≥80). Phase 2 because DUPR needs login/partner API. |
| 8 | Latest Results | 1 | Gold-medal matches from the last 48h. |
| 9 | Top News | 2 | Curated headlines with developing/confirmed labels. |
| 10 | New Highlights | 1 | 48-hour YouTube highlights from official channels. |
| 11 | Rule of the Day | 1 | Rotating one-rule explainer. 2026 changes prioritized early in season. |
| 12 | On This Day in Pickleball | 2 | Sparse — collapses on empty days. |

**Pinning (per-user favorites):**
- Favorite MLP team (one, optional) → pinned at top of Daily Report above Daily Briefing.
- Favorite players (many, optional) → ★ list in Players tab + pinned card on Daily Report.
- Storage: `localStorage` under `pickleball-daily.favoriteTeam.v1` and `pickleball-daily.favoritePlayers.v1`.

**Rationale for configurable pinning, not hard-coded:** no single institution anchors the sport. Owner and brother may favor different MLP teams.

---

## 3. Entity Page Templates

Per `ui-modules.json § entityPageTemplates`.

### 3.1 Tournament Page (Phase 1)

```
/tournament/:eventId
├── Header: circuit badge (PPA/MLP) · tier · dates · venue · city/state/country
├── Purse (when known)
├── Sanctioning body (USAP? none? UPA?)
├── Draw / bracket (iframe if permitted + JS hydrated; otherwise click-out)
├── Live scoreboard (during event)
├── Past winners (Phase 2)
├── Highlights (YouTube, when available)
└── News feed (Phase 2)
```

**Data sources:** `tournaments-2026.json`, `snapshots/latest.json`, `pickleball-brackets` scrape.

### 3.2 MLP Team Page (Phase 1)

```
/team/:teamId
├── Header: team name · home market · 2026 record
├── Owners (when known; ownersCaveat flag if third-party-reported)
├── Roster (6 players, 3M/3W; headlinePlayers prioritized)
├── Season standing (points + finish position)
├── Recent match results
├── Upcoming events
└── Team news (Phase 2)
```

**Data sources:** `mlp-teams.json`, `snapshots/latest.json`.

### 3.3 Player Page (Phase 1)

```
/player/:playerId
├── Header: displayName · country · handedness · primaryCategories
├── MLP team affiliation (click-through)
├── PPA rank (per discipline)   ←── Ranking widget
├── DUPR doubles + DUPR singles ←── Rating widget (distinct visual)
├── Recent results (last 30 days)
├── Upcoming events (PPA + MLP)
├── Highlights (YouTube by player-name search, Phase 2)
└── Bio (when available; Phase 2)
```

**Data sources:** `players-seed.json`, `snapshots/latest.json`, YouTube API.

### 3.4 Match Page (Phase 2)

```
/match/:matchId
├── Participants (playerId / teamId)
├── Event context (round, discipline)
├── Score (current or final, set-by-set)
├── Court + start time
└── Replay link (if any)
```

**Data sources:** `snapshots/latest.json § matches`, `pickleball-brackets` scrape.

### 3.5 Rule Explainer Page (Phase 2)

```
/rule/:ruleId
├── Section number (from USAP 2026 rulebook)
├── Rule summary
├── Effective date
├── Change history
└── Link to primary USAP PDF
```

**Data sources:** `rules-changes-2026.json`, USAP PDF link-out.

### 3.6 History Timeline Page (Phase 2)

Chronological cards from `history-seed.json` with category filters (founding / governance / professional / growth / accessibility).

---

## 4. Live Coverage Model

The Live tab is the differentiating feature.

**Data ingestion strategy (per research report §7):**

| Source | Role | Refresh cadence during event |
|---|---|---|
| `pickleball-brackets` | Primary — powers PPA draws, courtside score entry | Every 60-120 sec |
| `ppa-tour` live widget | Cross-check; sometimes surfaces court-mapping info | Every 120 sec |
| `majorleaguepickleball.co` | Primary for MLP match state | Every 120 sec |
| Official YouTube streams | Linkout reference, not scraped | N/A |

**Refresh strategy:**
- Live ingestion runs only when at least one event has `status: in-progress` per the tournaments-2026 schedule + snapshot cross-check.
- Outside event hours, live ingestion is skipped to stay under scrape Crawl-delay budgets.
- During mid-summer when PPA + MLP overlap, ingestion may hit multiple concurrent events.

**Fallback when sources stale:**
- If last live poll is >5 min old and the event is still in its scheduled window → "Connecting…" banner.
- If >30 min stale → render last known state with a "Last updated N min ago" footer.
- Never fabricate score state. Missing fields render "—".

**Edge cases explicitly handled:**
- Walkovers, retirements, withdrawals, weather delays, mid-event bracket changes — see research report §7 for schema fields and `status` enum.

---

## 5. Source Confidence Model (on-card visibility)

Every card rendered from snapshot or master data carries a confidence tier based on its source. Rendering rules from `ui-modules.json § confidenceRendering`:

| Confidence | Visual | Label |
|---|---|---|
| **T1** | Normal | No badge |
| **T2** | Normal | Subtle "via `sourceName`" footer |
| **T3** | Yellow-tint | Explicit "Editorial / unverified" badge |
| **developing** | Yellow dot | "Developing" label until confirmed |

**Confidence aggregation rule:** a card that aggregates multiple data points takes the lowest confidence of its inputs. If a player's rank (T2) is shown beside their DUPR (T1), the card's aggregate badge is T2.

**Why this matters:** Pickleball's T3 editorial lists (The Kitchen "ranked by anonymous pro") are useful context but should not look identical to an official PPA rank. The visual distinction protects the brother in Virginia from reading opinion as fact.

---

## 6. Source-Conflict Policy

Encoded in `sources.json § sourceConflictHierarchy`. Runtime rules:

1. **When two sources disagree on the same value** (e.g., Fahey's women's singles rank is #2 per Kitchen but #5 per PPA Race), render the T1 value and suppress the T2/T3 value. Do not show both unless they have the same confidence tier.
2. **When in-progress state disagrees with final state** (e.g., PickleballBrackets shows a match as in-progress while ppatour.com shows it as final), prefer the fresher source — normally PickleballBrackets live, then reconciled against ppatour.com within 24h.
3. **When a news source differs from official site on a fact** (trade, contract termination, roster change), render "developing" until echoed by a T1 handle or site.

---

## 7. Alerts Model (Phase 1 → Phase 4)

**Phase 1:** no alerts. Daily morning email (Phase 3) + check-when-you-want web.

**Phase 3:** morning email via Resend (mirrors Baseball Project pattern):
- Triggered after daily ingestion completes (GitHub Actions cron `0 7 * * *` UTC).
- Rich HTML: today's live events, top movers, new highlights, rule-of-the-day, CTA link.
- Recipients managed via `EMAIL_RECIPIENTS` GitHub Secret (comma-separated).
- Deeper in-app or push alerts deferred to Phase 4 or beyond.

**Phase 4+ (speculative, not committed):** per-player alerts ("alert me when Anna Leigh Waters wins gold"), per-team alerts ("alert me when my MLP team moves up in standings"), breaking-news alerts for "confirmed" tier only.

---

## 8. MVP vs Phase 2+ Feature Map

**Phase 1 — Foundations (next session after ATP):**
- Static PWA shell with 8 tabs.
- Local ingestion (Node 18+ CommonJS) hitting PPA + MLP + DUPR + USAP → snapshot JSON.
- Daily Report tab renders home modules 1-6, 8, 10, 11 (skips Ratings Movers, News, On-This-Day).
- Live tab skeleton.
- Tournament, Team, Player entity pages.
- Headless-browser PPA rankings scraper (Playwright or Puppeteer).
- YouTube API highlight ingestion, shared Baseball key.
- Local dev server on port 1965.
- `check-secrets.js` script + `.gitignore`.
- No public deploy yet.

**Phase 2 — Depth:**
- DUPR login or partner API for per-player ratings + Risers module.
- News tab with curated feed, developing-vs-confirmed UI.
- Learn tab with rules + history + governance deep content.
- On-This-Day module (sparse — date-matched history).
- Player comparison widget (⇄).
- Highlight player-name search (reserved `search.list` quota).
- Seed content expansion via curation backlog (mirrors Baseball weekly-batch).

**Phase 3 — Polish + Deployment:**
- Splash screen (brother "wow" moment).
- Public GitHub repo + GitHub Pages deploy.
- Daily morning email via Resend.
- Cloudflare Worker for public submissions.
- `pwa-platform-reference.md` + PNG icon set for iOS install.
- Public on-demand refresh (Worker proxy).
- Deploy verification via `gh api repos/.../pages/builds/latest`.

**Phase 4 — AI Q&A + Content Expansion:**
- Natural-language Q&A layer over the JSON corpus (Claude API or similar).
- Uses the stable-ID + displayName + summary + structured-source-citation fields already in Phase 0 schemas.
- Auto-reload on SW update (eliminates manual cache clear).
- Ongoing content expansion.
- Actions Node deprecation hardening.

---

## 9. Critical Phase 1 Gates (carried from Phase 0)

Before any Phase 1 user-facing work ships to a deploy:

1. **SW cache rule** — any file in `SHELL_FILES` changing requires `CACHE` constant bump in same commit. (Baseball Critical Rule §4.8.)
2. **ESM import check** — any `app/js/` change verified via `node -e "import('./file.js').then(...)..."` before push. (Baseball Critical Rule §4.9.)
3. **YouTube iframe embed test** — ship a single iframe against PPA + MLP channels on staging; document Error 153 or success in a KB entry.
4. **PPA rankings headless-browser fetcher** — build + verify scraped numbers against PPA Race / 52-Week values.
5. **Rulebook section-number verification** — compare rules-changes-2026.json section numbers against primary USAP PDF.
6. **MLP Trade Window #2 roster diff** — re-fetch majorleaguepickleball.co/mlp-teams/ before any user-facing rendering.

---

## 10. Non-Goals for This Project

Explicit scope exclusions so Phase 1+ don't drift:

- **We do not build a full bracket draw engine.** We display PickleballBrackets state; we don't recompute.
- **We do not mirror video content.** We surface YouTube thumbnails + click-outs. Paid OTT is link-out only.
- **We do not compete with DUPR or the tours on accuracy.** We aggregate + render; T1 sources are authoritative.
- **We do not attempt paid X / IG / TikTok API ingestion.** Link-out is fine.
- **We do not build a coaching/training product.** Learn tab is reference + history, not a curriculum.
- **We do not shadow USAP governance.** We report what USAP says; we don't editorialize on the UPA–USAP rift.
- **We do not publish user-generated content without moderation.** Public submission Worker is review-then-approve, same as Baseball.

---

## 11. Open Questions for Owner (Phase 1 ATP)

1. Local dev port confirmation: **1965** (Bainbridge Island origin year) — accepted at kickoff. Confirming here.
2. Repo name: **`jjmgladden/pickleball-daily`** — accepted at kickoff. Confirming here.
3. Brand name: **"Ozark Joe's Pickleball Daily Intelligence Report"** — accepted at kickoff. Confirming here.
4. Headless-browser dependency (Playwright or Puppeteer) for PPA rankings scraping: acceptable addition to the Node stack? Baseline preference: **Playwright** (better modern-browser fidelity).
5. DUPR login-based scraping risk posture: **do not ship login-based scrape in Phase 1** is the safe default. Confirm before Phase 2 exploration.
6. Phase 1 scope from §8 — any features to add or drop?

---

## 12. End of Blueprint

This blueprint, the research report, the ten JSON seeds, the CLAUDE.md v1, and the KB together comprise Phase 0. Recommend proceeding to Phase 1 on owner ATP.
