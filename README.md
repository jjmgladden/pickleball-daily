# Ozark Joe's Pickleball Daily Intelligence Report

Personal daily-use pickleball intelligence tool. Universal player search, tournament tracking (PPA Tour + MLP), live scoring, DUPR ratings vs PPA rankings, governance + rules reference (USA Pickleball), highlights, and influencer/media monitoring.

## Stack

- Vanilla ES modules + CSS variables + JSON data layer (no build step, no React, no bundler)
- Service-worker PWA shell
- GitHub Actions cron for ingestion (Phase 3)
- Node 18+ for ingestion (CommonJS)
- Playwright for the PPA rankings scrape (JS-hydrated page)

## Local Dev

```
npm install
npx playwright install chromium   # for PPA rankings scraper
npm run fetch:daily               # writes data/snapshots/latest.json
npm run serve                     # http://localhost:1965
```

## Project Rules

See `CLAUDE.md` — full rules, data flow, versioning, session protocols.

## Data Flow

```
ingestion/ (Node — local or Actions)
    ↓ scrapes + API calls (PPA, MLP, DUPR, USAP, YouTube)
data/snapshots/YYYY-MM-DD.json   ← daily cache
data/master/*.json               ← reference seeds
    ↓
app/ (static PWA) — consumes JSON only at runtime, never hits a live API
```

## Phase Status

- **Phase 0** (2026-04-22) — Research + seeds + blueprint + rules. Complete.
- **Phase 1** (current) — Ingestion scaffolding + PWA shell + local build.
- **Phase 2** — News, Learn, curation backlog, player comparison.
- **Phase 3** — Splash, GH Pages deploy, daily Resend email, public submissions Worker.
- **Phase 4** — AI Q&A over JSON corpus.
