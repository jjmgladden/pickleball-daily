# Phase 0 Research — Ozark Joe's Pickleball Daily Intelligence Report

**Date:** 2026-04-22
**Author:** Phase 0 research session (Session 1)
**Status:** Awaiting ATP for Phase 1
**Companion files:** `data/master/*.json` (structured seeds), `docs/phase-0-blueprint.md` (product blueprint), `CLAUDE.md` v1

---

## 0. Executive Summary

Pickleball's data infrastructure is **fundamentally less mature than MLB's**, and that single fact reshapes every downstream decision.

Where the Baseball Project consumes a single stable authoritative API (`statsapi.mlb.com`) for nearly all snapshot content, the pickleball equivalent does not exist. Instead, the data surface is split across four uncoordinated official properties (PPA Tour, MLP, DUPR, USA Pickleball), each of which controls a different slice of the truth, each of which uses a different automation profile, and which are actively **consolidating under a commercial holding company (UPA) that is simultaneously in governance conflict with USA Pickleball** as of April 2026. No public developer API exists for PPA rankings, MLP standings, or DUPR ratings. Official PPA rankings tables are JavaScript-hydrated and require a headless browser to scrape. The 2026 tournament calendar has 44 PPA events and 13 MLP events with substantial mid-summer overlap.

Three structural facts drive the product design:

1. **Two parallel pro structures (PPA + MLP) demand two parallel information models.** PPA is tour-event based (players earn points by winning events). MLP is team-based (players are drafted to franchises; results are aggregated as team standings). Flattening them into one UI creates user confusion.

2. **DUPR (skill rating) is structurally distinct from PPA ranking (results leaderboard)** and users routinely conflate them. They answer different questions: "how good is this player?" vs. "how much has this player earned on tour in the last 52 weeks?" The UI must render them in separate, visually-distinguished components with explicit labels.

3. **No single institution has a "Cardinals-equivalent" pinning role.** Baseball pins to a team the owner has followed since childhood; pickleball has no such anchor. Favorites (team + player) must be configurable per user from day one.

The research that follows details how each domain works, where the official source is most reliable, where secondary sources fill gaps, where data is scrape-hostile or paywalled, and how the app should adjudicate when sources disagree. Nine data domains are covered. Ten structured JSON seeds have been produced in `data/master/`. A product blueprint and a draft `CLAUDE.md` v1 accompany this report.

**Bottom line:** a daily pickleball intelligence product is achievable at roughly the scope of the Baseball Project, but Phase 1 ingestion will be meaningfully harder — headless-browser scraping, multi-source reconciliation, and manual-curation fallbacks for DUPR ratings. Phase 0 decisions captured below make Phase 1 a tractable build rather than a research project.

---

## 1. Source Map — The Nine Data Domains

The source map below is the winner-source per domain when sources disagree. Reasoning is in subsequent sections. Full machine-readable registry in `data/master/sources.json`.

| Domain | Primary (T1) | Secondary (T2) | Tertiary | Notes |
|---|---|---|---|---|
| **Tournament schedules** | `ppa-tour` (ppatour.com) | `mlp-official` (majorleaguepickleball.co) | `pbt` (pickleballtournaments.com) | Official event pages are stable + deep-linkable. |
| **Live match scoring** | `pickleball-brackets` (pickleballbrackets.com) | `ppa-tour` | — | PickleballBrackets powers the PPA draw system — typically ahead of ppatour.com for in-progress state. Reconcile final results against ppatour.com within 24h. |
| **Live brackets (state, seeds)** | `pickleball-brackets` | `ppa-tour` | — | Same reasoning. |
| **Final results** | `ppa-tour` | `pbt` | `pickleball-com-results` | PPA publishes canonical winner/runner-up/points. |
| **MLP teams + standings** | `mlp-official` | `the-dink` (trade tracker) | — | MLP team pages authoritative on roster; The Dink often breaks trades first. |
| **DUPR ratings** | `dupr-official` (dupr.com) | — | — | No substitute. No public API. Partner API or scrape-with-login. |
| **PPA Tour rankings** | `ppa-tour` | — | — | PickleWave ELO is NOT a substitute. |
| **Rules / rulebook** | `usap-rulebook-2026-pdf` | `usap-official` | `selkirk-summary`, `the-dink-rules` | Annual PDF is canonical. Phase 1 pulls change-doc once/year. |
| **History / founding** | `usap-official` | `bainbridge-history-museum`, `historylink` | — | Official USAP position is pickle-boat origin. Dog-"Pickles" variant is flagged, not substituted. |
| **Player bios** | `ppa-tour` (athlete pages) | `mlp-official` | — | `/athlete/{slug}/` URLs are stable. |
| **Video highlights** | `youtube-ppa-tour`, `youtube-mlp` | `youtube-the-kitchen`, creator channels | — | See §8 — **iframe embed policy unverified for both official channels; Phase 1 live-test required.** |

Source hierarchy for the "developing" vs "confirmed" news-velocity gate: a social-only post from a T2/T3 handle (The Dink, The Kitchen, PickleWave) triggers **developing** status in-app. It promotes to **confirmed** when echoed either by a T1 official handle (@PPAtour, @MLP_Pickleball, @USAPickleball) or by publication on the corresponding T1 site. This prevents the app from broadcasting unverified rumor as fact.

---

## 2. PPA Tour

**Site:** `ppatour.com` · Source registry: `data/master/sources.json` → `ppa-tour`

PPA Tour is the largest professional pickleball tour, running weekly events with standardized prize purses. The 2026 schedule has **44 events** we could verify from official `ppatour.com/tournament/2026/{slug}/` URLs — substantially expanded vs. 2025 because **PPA Tour Asia rankings unified globally starting 2026**, so Asia events now count toward the single PPA ranking. Full event list in `data/master/tournaments-2026.json`.

**Tier + points matrix (from ppatour.com/how-it-works/):**

| Tier | Winner Points | Runner-up (80%) | SF (60%) | QF (20%) | R16 (10%) | R32 (5%) |
|---|---|---|---|---|---|---|
| Worlds | 3000 | 2400 | 1800 | 600 | 300 | 150 |
| Slams | 2000 | 1600 | 1200 | 400 | 200 | 100 |
| Cups | 1500 | 1200 | 900 | 300 | 150 | 75 |
| Opens | 1000 | 800 | 600 | 200 | 100 | 50 |
| Challengers | 500/250/125 | scaled | scaled | scaled | scaled | scaled |

**Ranking methodology:** rolling 52-week window using each player's best 16 events. Published in two formats: "52 Week" (trailing 52 weeks) and "The Race" (calendar-year points for Finals qualification). Finals qualifies top 8 in singles and mixed doubles, top 16 in men's and women's doubles. Rankings are computed separately per discipline (men's singles, women's singles, men's doubles, women's doubles, mixed).

**Automation profile:**
- **robots.txt:** allows `/*.css`, `/*.js`, most paths; `Crawl-delay: 3`; disallows `/*?` (query strings), `/calendar/action*`, `/events/action*`. No declared sitemap.
- **Rankings tables are JavaScript-hydrated.** Static HTTP fetch returns "Loading..." — requires Playwright or Puppeteer for extraction. This is a meaningful Phase 1 cost: the Baseball Project never needed headless browsers.
- **Event URLs are stable + deep-linkable:** `/tournament/2026/{slug}/`.
- **Player URLs:** `/athlete/{slug}/`.
- **No public JSON API has been found** via public documentation search. Mobile app network traffic was not inspected in Phase 0.

**Conflict resolution within PPA ecosystem:**
- For **official rankings + prize money + authoritative results:** trust `ppatour.com`.
- For **live bracket state during a tournament:** `pickleballbrackets.com` usually leads because it powers the actual draw infrastructure.
- For **editorial top-N lists** (The Kitchen, The Dink): these are opinion, not official. Never substitute for a PPA number.
- PickleWave ELO is a third-party computed ranking based on 30k+ matches since 2016. It is useful as a trend signal and for cross-tour comparison, but it is NOT a PPA ranking.

**Per-player rank numbers** as of 2026-04-22 could not be fully verified via static fetch because of the JS-hydrated rankings page. Where The Kitchen and PickleWave snapshots could be cited, they are marked T2/T3 confidence in `players-seed.json` and must be re-verified against PPA's hydrated table in Phase 1.

---

## 3. Major League Pickleball (MLP)

**Site:** `majorleaguepickleball.co` · Source registry: `mlp-official`

MLP is a team-based league operating in parallel with PPA Tour. Founded 2021. As of 2026, MLP is under the UPA holding company umbrella (see §5), but retains a distinct format.

**2026 structural changes:**
- **20 teams unified at Premier level.** Challenger tier eliminated.
- **Palm Beach Royals** is the expansion franchise.
- **Nashville Chefs** and **DC Pickleball Team** sat out the 2026 season.
- **NY Hustlers merged** into Brooklyn Pickleball Team.
- **Season:** 2026-05-22 to 2026-08-30 — 13 events, including a mid-season tournament (Grand Rapids) and a three-weekend expanded playoff (Dallas → SoCal → NYC Championship Weekend).

**Match format (per MLP ABCs + FAQ pages):**
- Each team-vs-team matchup = **4 games**: Women's Doubles, Men's Doubles, Mixed Doubles #1, Mixed Doubles #2. Each to 11 points, win by 2.
- **2026 reverts to side-out (traditional) scoring** for doubles games, reversing a prior rally-scoring experiment.
- **DreamBreaker tiebreaker** (if 2-2 after four games): singles rally-scored to 21. Players rotate every 4 points. Home team locks singles lineup first; away team counter-picks — a meaningful strategic wrinkle.
- **Rosters:** 6 players (3 men, 3 women). Top 4 slots must include 2025 "keepers."

**Standings model:** **per-event finish, not per-match.** Event winner = 25 points, 2nd = X, …, 9th/10th = 1 point. Accumulated points across regular-season events determine playoff seed. This is structurally different from typical team-sports leagues and requires a custom data shape.

**Automation profile:**
- **No documented public API, no RSS.**
- Standard HTML pages on `/mlp-teams/`, `/events-2026/`, `/news/` — **scrape-friendly.**
- **Owner attribution is sparse** on official team pages. Third-party reporting (Sportico, The Dink) fills gaps for celebrity/business-media-worthy owners (Mahomes/Osaka/Kyrgios at Miami, Cuban at Dallas, etc.). These are flagged `ownersCaveat` in `mlp-teams.json`.
- **Captains are not publicly designated per team** for 2026 on the official site. Model keeps the field as nullable.
- **Venue data is thin** — most 2026 events list city only. ESPN Wide World of Sports (Orlando) is the lone named venue.

**Headline player movement captured in seeds:**
- **Anna Bright was the #1 overall MLP 2026 pick** at $1.23M — a record-setting start to the season — drafted by St. Louis Shock.
- **Jorja Johnson** (2025 MLP MVP) was #2 to New Jersey 5s.
- **Anna Leigh Waters** is on NJ 5s.
- **Ben Johns** is on LA Mad Drops.
- Full 20-team post-draft rosters in `data/master/mlp-teams.json` — may have shifted in Trade Window #2 (opened 2026-03-02).

**Why MLP cannot flatten into the PPA information model:** PPA pages describe a player-centric ranking. MLP pages describe a team-centric standing. The same Anna Leigh Waters has both a PPA rank (#1 across three disciplines) and an MLP team affiliation (NJ 5s) with its own standings. The UI needs one tab that shows teams and another that shows players, with cross-links between them.

---

## 4. DUPR (Skill Rating System)

**Site:** `dupr.com` · Source registry: `dupr-official`

DUPR (Dynamic / Dreamland Universal Pickleball Rating) is the dominant skill-rating system for pickleball, functionally analogous to chess Elo. As of 2024, DUPR is **USA Pickleball's official exclusive rating system** — a landmark partnership that replaced USAP's prior in-house rating and unified amateur sanctioning under DUPR.

**Methodology:**
- Elo-style algorithm. Scale **2.0 – 8.0+** (top pros approach 7.0+).
- Separate doubles and singles ratings per player (skill overlap is incomplete).
- Single gender-agnostic scale; men and women are rated on the same axis.
- Updated after every qualifying match. Expected outcome computed from team average ratings; actual outcome shifts the ratings.
- **Margin of victory matters** (an 11-2 win shifts more than 11-9).
- **Recency weighting** — older matches decay.
- **Opponent strength** weighted in.
- **Verified tournament / league results** weigh more than self-reported rec matches.
- **Reliability Score** rises with match volume; ≥ 80 is required for Power Rankings / Risers eligibility.
- **Matches ignored** when the two teams' average ratings differ by more than 1.0.

**Public data surface:**
- `dupr.com/rankings` — top-50 leaderboards by category (men's / women's × singles / doubles).
- `dupr.com/post/top-dupr-risers-*` — monthly Risers blog posts (not a live leaderboard).
- Per-player pages visible but require user authentication for full match history.
- Public leaderboard **refresh cadence is weekly** (observed refreshes 2026-04-13 and 2026-04-21).

**Automation profile:**
- **No public developer API.** `backend.mydupr.com/swagger-ui/` exists but is token-gated (partner-only).
- **`events.mydupr.com/docs`** exposes partner event endpoints.
- Community scraper `pkshiu/duprly` on GitHub uses user credentials.
- For Phase 1 ingestion, treat DUPR as **partner-or-scrape tier**:
  - **Phase 1 MVP:** scrape the public top-50 leaderboard weekly (small fetch, low TOS risk).
  - **Phase 2:** evaluate partner API access — request credentials if a use case justifies.
  - **Do not** ship login-based scraping to the ingestion pipeline without owner review — TOS risk.

**Top DUPR doubles snapshot** (as of 2026-04-21) is captured in `players-seed.json`. Representative data points:
- Ben Johns — 7.094 doubles / 7.098 singles
- Andrei Daescu — 7.012 / 7.022
- JW Johnson — 7.011
- Hayden Patriquin — 6.925 / 6.925
- Anna Leigh Waters — 6.889 doubles

**DUPR-related entity hierarchies:**
- **Collegiate Pickleball:** DUPR powers collegiate leagues and the Collegiate Nationals.
- **National Junior Pickleball:** DUPR ratings for ages 8-18 (Coach-Assigned entry path).
- **USAP amateur sanctioning:** ratings used for tournament bracket placement.

---

## 5. USA Pickleball, Governance, and the UPA–USAP Rift

**Site:** `usapickleball.org` · Source registry: `usap-official`

USA Pickleball (USAP) is the national governing body for the sport. It publishes the annual rulebook, certifies referees, approves paddles and balls, sanctions amateur tournaments, and coordinates the National Championships.

### 5.1 Governance actors

| Actor | Role | Under UPA umbrella? |
|---|---|---|
| **USA Pickleball (USAP)** | National governing body; publishes rulebook; certifies equipment; manages amateur ratings via DUPR partnership; oversees National Championships. Non-profit. | **No** — USAP is separate. |
| **PPA Tour** | Largest professional tour. Pros play under a PPA Pro Tour Rule & Disciplinary Code layered over USAP rules; amateurs at PPA events use USAP rules. | **Yes.** |
| **MLP** | Professional team-franchise league. | **Yes.** |
| **UPA (United Pickleball Association)** | Holding company unifying PPA + MLP since 2023-2024 merger. Coordinates schedules, player contracts, media rights. | Parent of PPA + MLP. |
| **UPA-Athletes (UPA-A)** | Rival governance body launched 2024 after UPA severed ties with USAP for pro events. | Yes — UPA's pro-governance track. |
| **DUPR** | Official exclusive rating partner of USAP since 2024. Also consolidation parent for PickleballBrackets + Pickleball.com + PickleballTournaments ecosystem. | Separate entity. |
| **IFP (International Federation of Pickleball)** | International coordinating body, 2008. Relatively dormant. | Separate. |

### 5.2 The UPA–USAP rift

In 2024, UPA announced it was severing ties with USAP sanctioning for its pro events. UPA launched **UPA-Athletes (UPA-A)** as a rival governance track for professional competition. USAP remains the amateur / rulebook authority.

**Implications for the app:**
- **USAP is the rulebook authority** for everything in the UI related to rules, amateur sanctioning, or equipment approval. Do not cite UPA-A on rule questions.
- **UPA (PPA + MLP) controls pro rankings, team structures, and player contracts.** When UPA announces a player contract termination for "unsanctioned events" (as happened to Vivian Glozman and Ryan Fu in 2026), that is UPA's internal decision — not a USAP governance action.
- **Historical continuity:** USAP was founded as USAPA in 1984, first formal rulebook published March 1984 in Tacoma. The 2020 rebrand to "USA Pickleball" is the current brand.

### 5.3 The 2026 Rulebook

**Published:** 2025-12-22 · **Effective:** 2026-01-01
**PDF:** `https://usapickleball.org/docs/rules/USAP-Official-Rulebook.pdf`
**Change-doc PDF:** `https://usapickleball.org/docs/rules/USAP-Rulebook-Change-Document.pdf`

Ten notable changes captured in `data/master/rules-changes-2026.json`. Highlights:

- **Section 2070 — Net Post Winner clarification:** a ball that legally crosses and bounces in, then contacts the net post, is not an automatic fault.
- **Section 2221 — Prompt line calls required:** delayed "out" calls after partner conferences are disallowed.
- **Section 2242 — Rally scoring formats formalized** (optional for many events; restricted in some championship-qualifying events).
- **Sections 2330-2334 — New Adaptive Standing Division:** eligibility, assistive-device rules, two-bounce allowance, hybrid mixed-ability play — a major inclusion milestone.
- **Volley serve "clearly" language:** the word "clearly" is added to all three volley-serve requirements. Borderline serves are now faulted.
- **Mandatory pre-match paddle inspection:** paddles must display "USA Pickleball Approved" marking. Notable for pros using prototypes.
- **Visible second ball fault:** a visible second ball during a live rally is now an explicit fault.
- **Legal multi-hit extension:** the legal double-hit rule extends to triple-plus hits within one continuous motion.

**Caveat:** section numbers were captured from secondary sources (Selkirk, The Dink). The 2026 rulebook uses 4-digit numbering (e.g., 2070, 2221) per Selkirk's summary. Phase 1 should verify section numbers against the primary USAP PDF before publishing user-facing rule citations.

### 5.4 Founding narrative

**Official position (USAP):** Joel Pritchard, Bill Bell, and Barney McCallum invented pickleball in July 1965 at Pritchard's summer cabin at Pleasant Beach on Bainbridge Island, WA. The game's name comes from **Joan Pritchard's pickle-boat metaphor** (leftover rowers from crew-racing).

**Flagged variant:** a widely circulated folk story credits the Pritchards' dog, "Pickles." USAP rejects this on chronology — the dog was born in 1968, after the name was already in use. See `hist-1965-name-origin` in `history-seed.json` for the flagged-variants record.

Primary source: [usapickleball.org — How Pickleball Got Its Name](https://usapickleball.org/news/how-pickleball-got-its-name/). Secondary corroboration: Bainbridge Island Historical Museum, HistoryLink, WSU Magazine.

Per Critical Rule §4.7 (Be Accurate), the UI will surface the pickle-boat origin as the canonical story and flag the dog variant rather than suppress it. This is an authenticity move, not a correctness compromise.

---

## 6. Tournament Platforms and Results Infrastructure

Post-2024, the pickleball tournament-management ecosystem has substantially consolidated under DUPR. See `hist-2024-dupr-consolidation` in `history-seed.json`.

**Primary platforms:**

| Platform | Role | API | Automation | Trust |
|---|---|---|---|---|
| `pickleballtournaments.com` (PBT) | Registration + draws + results. Hosts most PPA + USAP-sanctioned events. | Partner-only (third-party reseller at allpickleballtournaments.com for $25/mo). | Scrape-friendly static HTML. | T1 |
| `pickleballbrackets.com` | Full TD stack — registration, payments, check-in, court assignment, score entry. Auto-feeds DUPR since July 2024. | No public API. | Scrape-friendly. | T1 |
| `pickleball.com` | Unified post-DUPR-alignment results hub. | Documented API at `apidoc.pickleball.com` — requires `PB-API-TOKEN` (partner/approval path unclear). | API + scrape-friendly. | T1 |
| `ppatour.com` | Live scoring widget + bracket display during events. Hosts PPA pro draws. | No. | Scrape-friendly (JS-hydrated for rankings). | T1 |
| `picklewave.com` | Third-party ELO-based aggregator covering PPA + MLP + APP + USAPA + UPA pro draws since 2016. | No. | Scrape-friendly, but may block. | T2 |

**Results publishing hierarchy:**
- For **PPA pro events:** ppatour.com live-scoring widget updates first during play. PickleballTournaments posts official finalized results minutes-to-hours after the last gold-medal match. PickleWave lags 2-12 hours but enriches with ELO + historical context.
- For **amateur/sanctioned events:** PickleballBrackets is almost always first (scores entered courtside). DUPR updates automatically post-match. Pickleball.com is becoming a unified mirror post-2024 merger but lags primary sources.

**Recommendation for Phase 1 ingestion:**
- Poll `pbt` + `pickleball-brackets` for finalized results.
- Use `ppa-tour` only for in-progress live state and for authoritative rankings.
- Use `picklewave` as a cross-check enrichment source only — do not ingest its ELO as a ranking.

---

## 7. Live Scoring and Brackets (Mission-Critical for Same-Day Utility)

The "Live" tab is the differentiating feature for a daily pickleball tool. Below is what the data surface actually looks like.

**Live scoring sources (in order of real-time speed):**

1. **pickleballbrackets.com** — fastest. Scores are entered courtside by officials. Powers the PPA draw system.
2. **ppatour.com live widget** — during PPA pro events only. Updates within seconds of bracketsource updates.
3. **majorleaguepickleball.co live** — during MLP events. Less documented live infrastructure; YouTube stream tends to be the primary real-time surface.
4. **social media (X, IG)** — fast but unstructured. Not ingestible at scale without paid APIs.

**Recommended match schema fields (all ISO 8601 for timestamps; IDs stable per §10 of Session 1 kickoff):**

```
{
  "matchId": "ppa-2026-atlanta-championships-qf-2",
  "eventId": "ppa-2026-atlanta-championships",
  "participants": [{"playerId": "anna-leigh-waters"}, {"playerId": "kate-fahey"}],
  "discipline": "womens-singles",
  "round": "QF",
  "currentScore": {"set": 2, "side1": 11, "side2": 9, "sets": [[11, 4], [11, 9]]},
  "server": "anna-leigh-waters",
  "timeoutCount": {"side1": 1, "side2": 0},
  "status": "in-progress | final | walkover | retirement | delayed",
  "court": "Stadium Court",
  "startedAt": "2026-04-28T14:30:00Z",
  "finishedAt": null,
  "source": {"sourceId": "pickleball-brackets", "url": "..."},
  "confidence": "T1",
  "lastUpdated": "2026-04-28T15:12:00Z"
}
```

**Edge cases to handle explicitly:**
- **Walkovers:** mark `status: "walkover"`; show which side advanced.
- **Retirements:** mark `status: "retirement"`; show final score + retiring player.
- **Withdrawals:** appears as bracket-change; status `"withdrawn"`.
- **Weather delays:** status `"delayed"`; preserve current score; show resume time when known.
- **Bracket changes** (reseeding after withdrawals): version the bracket snapshot; retain history.

---

## 8. Video Highlights

Video ingestion mirrors the Baseball Project pattern: **YouTube Data API v3 pull from a curated channel allowlist**, using `channels.list` + `playlistItems.list` (1 unit/query) rather than keyword `search.list` (100 units/query). Shares the Baseball Project's single API key. Full registry in `data/master/video-sources.json`.

**Primary official channels:**
- `youtube.com/c/ppatour` — near-daily uploads during tour weeks; full telecasts + match highlights + docuseries.
- `youtube.com/MajorLeaguePickleball` — bursty around event weekends. Championship Court dual-streams to PickleballTV; Grandstand exclusive to MLP YouTube.

**Critical embed-policy caveat:** the Baseball Project learned that **MLB's official YouTube channel disables third-party embedding (Error 153)**, forcing the UI to render thumbnails + click-out rather than iframes. **PPA and MLP embed policies have not been verified as of 2026-04-22.** Phase 1 must ship a live iframe test against both channels on a staging URL and document the result in a KB entry. Default rendering should be thumbnail + click-out; iframe is a progressive enhancement conditional on the test passing.

**YouTube API quota strategy:**
- Default quota: 10,000 units/day.
- `search.list` is prohibitively expensive (100 units). 100 searches/day = exhaustion.
- Architect around `playlistItems.list` from the fixed allowlist: cache `videoId + publishedAt`; diff daily. 1 unit per channel per day.
- Filter new videos by `publishedAfter: last 48h` + title match against event/player tokens from `tournaments-2026.json` + `players-seed.json`.
- Reserve `search.list` for on-demand player-name queries (user-initiated), not daily ingestion.
- Daily pickleball job should stay under ~2000 units; if it doesn't, request a quota extension via the YT API audit form.

**Non-YouTube video surfaces** (link-out only; no scraping):
- **PickleballTV** — paid OTT; primary live broadcast home for PPA/MLP.
- **CBS Sports / ESPN+ / ESPN2 / Amazon Prime** — linear + streaming homes for select events. ESPN2 holds distribution for some MLP Premier-level Super Finals.
- **Instagram Reels @ppatour** — ~230K followers; primary short-form highlight surface. No sanctioned API for individual dev. Link-out.
- **X / Twitter** — clip posts during events; paid-API-only since 2023.
- **TikTok** — high-volume clips; no sanctioned API.

---

## 9. Media, Influencers, Creators

Full registry in `data/master/media-sources.json`. Tier definitions: T1 = official authoritative, T2 = reliable creator, T3 = editorial/opinion.

**Top newsletters:**
1. **The Dink** — Thomas Shields et al. 3x/week, free, T2. Trade tracker, previews, recaps.
2. **The Kitchen** — multi-weekly, free, T3. Editorial rankings + commentary.
3. **Pickleball Union** — weekly, free, T2.
4. **Love At First Dink** — weekly, free, T3.
5. **Pickleball Magazine** — USAP-affiliated monthly, paid, T1. Features + interviews.

**Top podcasts:**
1. **PicklePod** — Thomas Shields + Zane Navratil. The Dink's flagship audio. Pro interviews + news.
2. **The Pickleball Studio Podcast** — Chris Olson. Conversational news + gear.
3. **It Feels Right** — Rob Nunnery + Adam Stone. Veteran pro strategic depth.
4. **The Tennis Sucks Podcast** — Travis Rettenmaier + Graham D'Amico. Tour-insider banter.
5. **Pickleball Therapy** — Tony Roig. Mental game + 50+ improvement.

**Top YouTube channels** (see `data/master/video-sources.json` for full records):
- **The Kitchen** — ~240K subs, news breakdowns, T2.
- **PrimeTime Pickleball** — Nicole Havlicek, ~170K subs, tutorials.
- **Briones Pickleball** — Jordan Briones, 100K+ subs, tutorials.
- **Tyson McGuffin** — pro-player content.
- **Pickleball Studio** — Chris Olson, analysis + gear.
- **Selkirk TV** — brand channel, high production.
- **Pickleball Channel** — since 2014, tournament coverage.
- **Better Pickleball** — CJ Johnson, 50+ player instructional.

**Top social accounts** (news-velocity tier in `media-sources.json`):
- **Verified-authoritative (T1):** @PPAtour, @MLP_Pickleball, @USAPickleball, @ppatour on Instagram.
- **Fast-unverified (T2):** @Pickleball (The Dink), @PickleWave, @ZaneNavratil, @thedinkpickleball on Instagram, @thekitchenpickle on Instagram, @annaleighwaters on Instagram.

**News-velocity policy** (codified in `sources.json § sourceConflictHierarchy.developingVsConfirmed`):
- A T2/T3 social post triggers **"developing"** status in-app (yellow-dot treatment).
- Promotes to **"confirmed"** when echoed by a T1 handle or published on a T1 site.
- This protects the brother-in-Virginia from reading a rumor as fact.

---

## 10. Players and Movers

Full seed in `data/master/players-seed.json` (30 players). The seed is top-N, not all-time — per KB-0004 scope decision, the universal player index is bounded by currently-active pros + public DUPR holders. Phase 2+ may expand.

**Headline findings:**

- **Anna Leigh Waters** is the benchmark pro — #1 singles, #1 doubles, #1 mixed per PPA. ~40+ career Triple Crowns. On NJ 5s for MLP 2026.
- **Ben Johns** remains the men's doubles GOAT — top-5 across all disciplines. On LA Mad Drops.
- **Chris Haworth** is the first-time #1 men's singles PPA seed as of April 2026. On California Black Bears.
- **Federico Staksrud** (Argentina) is the top men's singles challenger — 2 PPA titles in early 2026. On Orlando Squeeze.
- **Anna Bright** was the MLP 2026 #1 overall draft pick ($1.23M — record-setting), signed by St. Louis Shock.
- **Jorja Johnson** was 2025 MLP MVP; 2026 MLP #2 pick to NJ 5s.
- **Hayden Patriquin** rose rapidly in 2025-2026 — #2 men's singles per The Kitchen editorial.
- **Kate Fahey** is the most consistent women's singles challenger to Waters.
- **Salome Devidze** (Georgia) is notable as the last player to beat Waters in singles (May 2024).
- **The Kawamoto twins** (Jackie and Jade) are a top-3 women's doubles team.

**UPA contract action 2026:** UPA terminated contracts for **Vivian Glozman** and **Ryan Fu** over unsanctioned-event participation. This is the 2026 equivalent of being released by a league and is worth surfacing as a narrative pattern — the UPA umbrella materially constrains player movement.

**Handedness is sparsely populated** in public bios. Phase 1 should verify per-player via `ppatour.com/athlete/{slug}/`.

---

## 11. Ratings vs Rankings — The UI Distinction That Matters Most

Per KB-0009:

**Two-sentence explainer for the UI:**

> A **DUPR rating** is a skill score on a 2.0–8.0+ scale, updated after every match, that estimates how well you play against any opponent — think of it like a chess Elo.
>
> A **PPA ranking** is a leaderboard position earned from recent pro tournament results, so it measures who is currently winning on tour, not overall skill.

**Why this distinction matters:**
- A player can be #1 DUPR (highest skill) without being #1 PPA ranking (because PPA ranks depend on event attendance + recent results).
- A player can be #1 PPA ranking after a hot streak without being #1 DUPR.
- Anna Leigh Waters is currently #1 on both — which makes the distinction harder to see in her case — but will not stay #1 on both forever.

**UI treatment:**
- Separate tabs: **Rankings** (PPA) and **Ratings** (DUPR). Do not merge.
- Different visual treatment: e.g., Rankings use ordinal position chips (#1, #2, …); Ratings use numeric value chips (7.09, 7.01, …).
- Explicit on-widget labels: "PPA Tour Ranking (52-Week)" vs "DUPR Doubles Rating" — never just "rank" or "rating" alone.
- Movers widgets are similarly separated: **Rankings Movers** (weekly PPA shifts) vs **Ratings Movers** (DUPR Risers, monthly).

---

## 12. MLP Team Ecosystem as a Separate Information Model

Per KB-0010:

MLP's team-centric model does not flatten into PPA's tour-event model. Attempting to merge them creates UI confusion.

**What each model requires in the UI:**

| Aspect | PPA (tour-event model) | MLP (team-franchise model) |
|---|---|---|
| **Primary entity** | Player | Team |
| **Secondary entity** | Event | Player (within team) |
| **Schedule displays** | Event calendar (tournaments.html) | Team calendar (teams.html) |
| **Leaderboard** | Player rankings | Team standings |
| **Movers** | Ranking changes per player | Standings-points changes per team |
| **Results** | Gold/silver/bronze per discipline per event | Team win/loss per event |
| **Live state** | Per-match court + score | Per-team-matchup (4 games + optional DreamBreaker) |

**Tab architecture implication:**
- Keep a dedicated **MLP Teams** tab parallel to (not a subset of) the **Players** and **Tournaments** tabs.
- Team pages list roster, standings, schedule, per-team news.
- Player pages cross-link to their current MLP team and show per-MLP-event participation.

This is captured in `ui-modules.json` and the Phase 0 blueprint.

---

## 13. Feeder Ecosystems and Juniors

**Decision:** deferred to Phase 2+ per owner judgment.

Scope when picked up:
- Collegiate Pickleball (DUPR-powered) — Collegiate Nationals + conference leagues.
- National Junior Pickleball (DUPR for ages 8-18).
- Senior / age-group — growing tournament circuit.
- USAPA Gold+ amateur tiers.

These are genuinely important for a full pickleball intelligence product but add scope that doesn't affect Phase 1 utility for the owner + brother. Seed only a pointer in `sources.json`; expand later.

---

## 14. Automation Tier Summary

| Source Cluster | Automation | Phase 1 Ingestion Cost |
|---|---|---|
| PPA Tour (schedules, event pages, player pages) | Scrape-friendly static HTML | Low — cron fetch + HTML parse. |
| PPA Tour rankings tables | **JS-hydrated — headless browser required** | **Medium — new dependency (Playwright or Puppeteer) not in Baseball stack.** |
| MLP (teams, events, news) | Scrape-friendly static HTML | Low. |
| USAP (rulebook, history) | Static PDF + HTML pages | Annual fetch; low volume. |
| DUPR public leaderboard | Scrape-friendly static HTML | Low (weekly). |
| DUPR per-player data | Scrape-with-login OR partner API | **High — defer to Phase 2.** |
| PickleballBrackets / PBT (live + finalized results) | Scrape-friendly | Medium — multiple templates. |
| Pickleball.com API | Token-gated | Defer to Phase 2. |
| YouTube API v3 | Public API with key | Low — shared with Baseball. |
| Newsletters / podcasts / social | Manual or paid APIs | Manual / link-out. |

**New Phase 1 infrastructure needed beyond Baseball's stack:**
- Headless-browser scraper (Playwright or Puppeteer) for PPA rankings tables.
- Multi-source reconciler (for live vs final-result hierarchy across PBT / PickleballBrackets / ppatour.com).
- Per-source cache-and-diff primitives (to minimize scrape load; respect `Crawl-delay: 3`).

---

## 15. Outstanding Unknowns and Phase 1 Verification Items

These are the items Phase 1 must resolve before the app can render user-facing data confidently.

1. **PPA and MLP YouTube iframe-embed behavior.** Ship a single iframe against each channel on staging; observe Error 153 or successful render. Document in KB.
2. **Rulebook section-number verification.** The 2026 section numbers (2070, 2221, etc.) come from Selkirk's summary. Verify against the primary USAP PDF.
3. **PPA rankings JS hydration** — build the Playwright fetcher; capture a clean nightly snapshot. Verify numbers against The Kitchen's T3 editorial references in `players-seed.json`.
4. **Pickleball.com API token** — attempt access request. If granted, it becomes a T1 unified source; if denied, Phase 1 proceeds with scrape-based ingestion.
5. **PickleballBrackets + PickleballTournaments robots.txt / TOS** — confirm scraping compliance per source. Respect any explicit blocks.
6. **MLP SoCal playoff venue** (2026-08-13 – 08-16) — conflicting reports (San Diego vs Newport Beach). Re-fetch closer to event.
7. **MLP Trade Window #2 roster diff** — opened 2026-03-02; rosters in `mlp-teams.json` reflect post-Window-#1 state. Re-fetch majorleaguepickleball.co/mlp-teams/ before Phase 1 deploy.
8. **Full top-20 men's and women's SINGLES rankings** — only top-4 men's singles verified in Phase 0. Complete via headless-browser scrape of ppatour.com/player-rankings/.
9. **Handedness for non-headliner players** — verify per-player via `ppatour.com/athlete/{slug}/`.
10. **Creator YouTube channel URL slugs** — SorryNotSorry Pickleball, Chris Cali — verify before Phase 1 ingestion.

---

## 16. Cross-Project Sharing Summary

Per Session 1 kickoff §6:

**Shared with Baseball Project:**
- Resend account + API key (separate repo Secret: `EMAIL_RECIPIENTS` is per-project; `RESEND_API_KEY` is shared value).
- YouTube Data API v3 key (one Google Cloud project, same key, separate repo Secret).

**Separate from Baseball Project:**
- GitHub repo (proposed `jjmgladden/pickleball-daily`).
- `EMAIL_RECIPIENTS` Secret (different list; manual sync if owner wants identical recipients).
- Cloudflare Worker for public submissions + its fine-grained GitHub PAT.
- CLAUDE.md (pickleball has its own v1).
- Knowledge Base (restarts at KB-0001).
- Memory store (per-project by design).
- Git history.

---

## 17. Recommended Phase 1 Scope

A Phase 1 that can ship to a local site in one session:

**Must have:**
1. Ingestion scaffolding (Node 18+ CommonJS in `ingestion/`).
2. Scrape PPA Tour event pages → `data/snapshots/latest.json` (schedule, event state).
3. Scrape MLP team + event pages → snapshot (teams, rosters, schedule).
4. Scrape DUPR public leaderboard weekly → snapshot (ratings).
5. Scrape PPA rankings with Playwright → snapshot (rankings).
6. Static PWA shell: **Daily / Live / Tournaments / Teams / Players / Rankings / Ratings / Highlights** tabs (modules per `ui-modules.json`).
7. YouTube Data API highlight ingestion (shared key, channel allowlist from `video-sources.json`).
8. Local dev server on port **1965** (Bainbridge Island origin year, per kickoff §14).

**Must NOT have in Phase 1:**
- News tab (curated feed) — Phase 2.
- Learn tab (rules + history deep) — Phase 2.
- Rating Movers widget (DUPR Risers) — Phase 2 (requires login or partner API).
- Splash screen — Phase 3 polish.
- Public submission Worker — Phase 3.
- Email delivery — Phase 3 (mirrors Baseball pattern).
- Auto-reload on SW update — Phase 4 (per Baseball KB-0021).
- AI Q&A layer — Phase 4 (schema decisions made in Phase 0 to enable it cheaply).

Phase 2-4 details in `docs/phase-0-blueprint.md`.

---

## 18. Closing

This report, the ten JSON seed files in `data/master/`, the blueprint in `docs/phase-0-blueprint.md`, the CLAUDE.md v1, and the KB in `docs/knowledge-base.md` together constitute the Phase 0 deliverable set per Session 1 kickoff §8.

The three structural findings at the top of this document — two parallel pro models, the ratings-vs-rankings distinction, and the lack of a single pinnable institution — should remain visible in every Phase 1 design decision. They are the differences that make pickleball not just "baseball without MLB Stats API."

**Recommendation:** proceed to Phase 1 on owner ATP. Phase 1 will ship a locally-running site consuming these seeds plus a headless-browser PPA rankings fetcher. Phase 2 layers in DUPR depth, curation workflow, News + Learn tabs. Phase 3 mirrors Baseball's deployment + email + public Worker. Phase 4 adds the AI Q&A layer over the accumulated snapshot corpus.

— End of Phase 0 research report.
