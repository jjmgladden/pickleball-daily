# Monetization Plan — Paid Daily Email Subscription

**Status:** ❌ NOT PURSUING (decided 2026-04-25, Session 8)
**Reason:** Owner concluded the project would need a defensible unique value proposition to justify charging, and the pickleball-news space is already crowded with strong free competitors (The Dink, Pickleball Magazine, PickleballBrackets). Owner does not see a path to building that differentiator at this time.
**Future trigger to revisit:** if/when a clearly-paid-worthy feature emerges organically (e.g., favorite-player personalization with deep stats, court-finder with saved locations, tournament prep packets, or AI Q&A from Phase 4) AND there's external evidence of demand.

---

This document preserves the detailed plan that was built during Session 8 dialog so the analysis isn't lost if monetization is reconsidered later. **Do not act on this plan without a fresh owner ATP** — most numbers and tier prices will be stale within 6 months.

---

## 0. Honest framing

Today the app is a personal tool serving 3 family recipients — no PII handling beyond the immediate circle, no payment processing, no compliance burden, no SLA, no customer support. Charging money flips most of those:

- Owner becomes **legally liable** for delivery failures, refund requests, billing disputes
- Incurs **business obligations** — sales-tax registration in some states, CAN-SPAM + GDPR + CCPA compliance, ToS + Privacy Policy that mean what they say
- Takes on **ongoing costs** that grow with subscribers — Resend tier upgrade, Stripe fees, possible domain spend, possible Worker D1 spend
- Inherits **a customer-support load** — even 50 paying subscribers will produce 1–3 support emails a week (refunds, "didn't get my email today," "change my address")

None of that is a reason not to do it. It's a reason to scope the **pre-launch** work as seriously as the tech work.

---

## 1. Pre-launch foundations (non-technical, do these FIRST)

### 1A. Business structure

| Option | Fit | Notes |
|---|---|---|
| **Personal / sole proprietor** | Easiest start | Income flows to personal taxes (Schedule C); personal liability |
| **Single-member LLC** | Recommended once revenue is real | Liability shield; ~$50–500 to file depending on state; pass-through taxes |
| **S-corp** | Don't bother yet | Only matters once net-profiting >$40k/yr |

**Recommendation at time of plan:** start sole-prop for the soft launch (friends-and-family paid beta). If it crosses ~$500/mo recurring or any complaint smells legal, form an LLC before public launch.

### 1B. Brand + domain

`glad-fam.com` is personal-family branded — fine for the email *sender* but not the marketing/signup site. Options:

- **Buy a product domain** — `ozarkjoespickleball.com`, `pbdaily.com` (likely taken), `dailydink.com` (likely taken)
- **Subdomain off `glad-fam.com`** — `pickleball.glad-fam.com` (free, but ties product to family domain forever)
- **Stick with `jjmgladden.github.io/pickleball-daily`** — works technically, looks like a hobby project, will hurt conversion

Recommendation: buy a product domain (~$10–15/yr at Cloudflare). Brand name decision becomes a prerequisite.

### 1C. Legal docs

Three documents required before accepting payment from a stranger:

1. **Terms of Service** — what they're buying, refund policy, right to terminate, dispute resolution
2. **Privacy Policy** — what PII collected (email + payment email + IP at signup), where stored (Resend, Stripe), how to request deletion (GDPR/CCPA)
3. **Refund Policy** — usually a subsection of ToS but called out separately for clarity

Don't write from scratch. Use **Termly** (~$10/mo) or **Iubenda** (~$30/yr) for templated docs. Real lawyer is overkill at this stage but worth $300–500 once across ~100 paying subs.

### 1D. Sales tax

Digital subscriptions are taxable in some US states (about 25 states tax SaaS/digital goods). Don't need to collect from day 1, but **nexus** in home state immediately. Strongest argument for using **Paddle** instead of Stripe (see §2.2).

### 1E. CAN-SPAM + GDPR compliance

Required even for free subscribers, mandatory for paid:

- **Visible unsubscribe link** in every email
- **Physical mailing address** in every email footer (PO box ~$80/yr is privacy-respecting option)
- **Double opt-in** for new subscribers (reduces spam complaints, required for some EU compliance)
- **Right to deletion** workflow (GDPR Art. 17 / CCPA equivalent)

---

## 2. Technical architecture

### 2.1. What stays the same

- Static PWA serving public site
- GitHub Actions cron generating daily snapshot
- Resend handles delivery
- Cloudflare for DNS

### 2.2. Payment processor

| Option | Pros | Cons |
|---|---|---|
| **Stripe** | Industry standard, lowest fees (2.9% + $0.30), best APIs, Customer Portal handles cancel/upgrade UI for free | Owner is merchant of record — owner calculates + remits sales tax; owner handles EU VAT |
| **Paddle** | Merchant of record — handles global sales tax + VAT + invoicing | Higher fees (~5% + $0.50); fewer integration tutorials |
| **Lemon Squeezy** | Like Paddle but more indie-friendly UI | Acquired by Stripe in 2024; future unclear |

**Recommendation at time of plan:** **Paddle** for soft launch — merchant-of-record means no tax compliance thinking for the first 100+ subscribers. Migrate to Stripe later if fees become meaningful.

### 2.3. Subscriber state — where does it live?

Today: 3 emails hard-coded as `EMAIL_RECIPIENTS` GitHub Secret (comma-separated).

Doesn't scale past ~20 subscribers. Need a real datastore.

| Option | Cost | Fit |
|---|---|---|
| **Cloudflare D1 (SQLite)** | Free tier: 5M reads/day, 100k writes/day; paid is $5/mo + $0.001/1k rows written | Best — already on Cloudflare; ties into Worker scaffolding from KB-0012 |
| **Cloudflare KV** | Free tier: 100k reads/day, 1k writes/day | Borderline — fine for <500 subs, painful past that |
| **External (Supabase, Neon)** | Free tier exists | Adds another vendor + another auth surface |

**Recommendation at time of plan:** D1. Worker scaffolding from KB-0012 already exists and was built precisely for this kind of write-path. Dormant Worker can be revived for both **public submissions** (original purpose) AND **subscriber management** — they share the same code path.

### 2.4. New tech components needed

```
1. Signup landing page                  ← new HTML/CSS, hosted on product domain
2. "Subscribe" button → Paddle Checkout ← Paddle hosted checkout, no code
3. Paddle webhook handler (Worker)      ← subscription.created, subscription.cancelled, payment.failed
4. D1 schema for subscribers            ← email, paddle_subscription_id, status, created_at, last_email_sent_at
5. Daily.yml workflow modification      ← read recipient list from D1 (via Worker API) instead of GitHub Secret
6. Subscriber self-service              ← Paddle's Customer Portal (free, no build)
7. Unsubscribe webhook                  ← syncs Paddle "cancelled" → D1 status update
8. Failed-payment email + dunning       ← Paddle handles
9. Send-email script changes            ← skip cancelled/expired subscribers; honor opt-outs
10. Admin dashboard (later)             ← simple Worker route w/ basic auth showing subscriber count + churn
```

### 2.5. Resend tier upgrade

Current free tier: **3,000 emails/month, 100/day, 1 verified domain**.

| Subscribers | Daily emails | Monthly | Tier needed |
|---|---|---|---|
| 3 (today) | 3 | 90 | Free |
| 30 | 30 | 900 | Free |
| 100 | 100 | 3,000 | Free (at the cap) |
| 500 | 500 | 15,000 | **Pro $20/mo** (50k/mo limit) |
| 3,000 | 3,000 | 90,000 | **Pro $90/mo** (100k/mo limit) |

Above 100k/mo, alternatives like Postmark or Amazon SES become more cost-effective.

---

## 3. Pricing model

### 3.1. Tier shape

| Model | Free tier | Paid tier | Pros | Cons |
|---|---|---|---|---|
| **A. Strictly paid** | None | $4/mo or $36/yr | Highest revenue per user; clearest value prop | Hardest to grow — no viral loop |
| **B. Freemium** | Weekly email summary | Daily email + bonus content | Largest funnel; some convert | Most subscribers stay free; complex template work |
| **C. Free trial → paid** | 14-day full access | $4/mo or $36/yr after | Industry-standard SaaS model; converts well | Requires trial-end automation |

**Recommendation at time of plan:** **C — 14-day free trial, then $4/mo or $36/yr** (annual = 25% discount). Paddle handles trial mechanics natively; conversion rates for daily-content services typically run 5–15%.

### 3.2. Price anchoring

- $4/mo is the impulse-buy zone for content subscriptions
- $36/yr ≈ $3/mo — saves $12/yr, common SaaS pattern
- Founder/family tier: existing 3 recipients (owner, brother, brother's wife) stay free indefinitely, grandfathered. Honor commitments.
- Any new family additions before launch can also be grandfathered free — set a cutoff date

### 3.3. What's "premium" worth paying for — THE BLOCKING QUESTION

This is the actual question that ended the plan. Today the daily email is genuinely useful but doesn't have a clear "this is worth $4/mo" hook. Options to strengthen the value prop before charging:

- **Personalization** — favorite players' results highlighted, MLP team standings tracked, court-finder lookups for the subscriber's home zip
- **Earlier delivery** — paid subs get email at 5am ET local time vs free at 9am ET (manufactured urgency, common pattern)
- **Premium content** — analyst commentary, weekend recap deep-dive, tournament prep guides
- **Ad-free** — moot since there are no ads anyway, but if ads are ever added, paid removes them
- **Court-finder** unlimited lookups vs free 5/day (if Where-to-Play tab launches first)
- **AI Q&A access** (KB-0008 trigger if Phase 4 is built)

**Honest read:** today's email alone, at $4/mo, will struggle. The pickleball-news space is crowded with free competitors. The path to a real product probably means **building 1–2 paid-only features first**, then turning on payments. Owner concluded this is the "unique value" gap they don't currently see a path to filling — which is why this plan is being shelved.

---

## 4. Phased rollout (preserved for reference)

### Phase M1 — Foundation (no money yet)
- Buy product domain
- Set up Termly/Iubenda for ToS + Privacy + Refund
- Decide brand + tagline
- Build signup landing page (static, hosted on product domain)
- Wire up D1 + Worker subscriber API (revive KB-0012 work)
- Migrate `EMAIL_RECIPIENTS` from GitHub Secret → D1 query (existing 3 grandfathered)
- Add unsubscribe link to email footer
- Add physical address to email footer

**Exit criteria:** existing 3 emails still arrive every morning, sourced from D1; signup page exists but doesn't accept payment yet.

### Phase M2 — Free signup beta
- Open signup as **free beta** (no payment, just email collection + double opt-in)
- Run for 4–8 weeks to validate: do strangers actually want this?
- Target: 50–100 free signups via word-of-mouth, social, pickleball Reddit
- Track open rates (Resend exposes this) — if open rate is <40%, the product isn't compelling enough yet to charge for

**Exit criteria:** ≥50 active free subscribers with ≥40% open rate.

### Phase M3 — Build paid-only differentiator
- Pick ONE: favorite-player personalization OR court-finder OR tournament prep
- Build it as a free-tier-blocked feature (visible but locked)
- Soft launch as "coming soon for paying subscribers"

**Exit criteria:** paid feature works end-to-end for owner's test account.

### Phase M4 — Soft paid launch
- Wire up Paddle (test mode → live)
- Webhook handler on Worker
- Customer Portal link in account email
- Charge $4/mo with 14-day trial
- Soft launch to existing free beta list — "we're going paid in 30 days; lock in $36/yr now"
- Honor founder pricing: first 50 paying subs at $36/yr forever (anti-churn moat)

**Exit criteria:** 5–10 paying subscribers, payment + cancellation + dunning all verified.

### Phase M5 — Public launch
- Marketing push: pickleball Reddit, X/Twitter pickleball community, family member's network
- Possibly: a referral program (subscriber gets 1 month free for each new paid signup)
- Monitor: signup rate, trial-to-paid conversion, monthly churn

**Exit criteria:** 50 paying subscribers, churn <10%/mo.

### Phase M6 — Growth + retention
- Add second paid feature
- Annual review of pricing
- LLC formation if revenue is real
- Possible price increase for new subs (grandfather existing)

---

## 5. Operational concerns

### 5.1. Customer support
- Set up `support@<product-domain>` aliased to inbox
- Canned responses for top 3 issues: refund, didn't receive today's email, change email address
- Budget 2–4 hours/week at 50–100 subs, more as it grows

### 5.2. Delivery reliability
- Today's GitHub Actions cron has no SLA — runs are almost always green but a failed run = 0 emails sent that day = paying subscribers complain
- Add: automated alerting on failed daily run (push notification to phone via Pushover or similar)
- Add: a "we missed today's email" auto-apology flow

### 5.3. Backup ingestion
- If PPA/MLP/DUPR scrapers fail, the email today still ships with empty sections
- Paying subs notice. Either: graceful "no rankings update today" copy, OR a hold-and-retry mechanism

### 5.4. PII discipline
- Subscriber emails are PII; D1 storage must be encrypted at rest (Cloudflare default, fine)
- Backup strategy: nightly D1 export to R2 (~$0.015/GB/mo)
- Data deletion workflow: Paddle webhook for subscription deletion → cascade to D1 row deletion + Resend list removal

---

## 6. Estimated ongoing costs (at time of plan, 2026-04-25)

| Subscribers | Resend | Domain | Cloudflare | Paddle (~5%) | **Monthly cost** | Revenue @ $4 | **Net** |
|---|---|---|---|---|---|---|---|
| 10 | $0 | $1 | $0 | $2 | **$3** | $40 | $37 |
| 50 | $0 | $1 | $0 | $10 | **$11** | $200 | $189 |
| 100 | $0 | $1 | $5 (D1 paid) | $20 | **$26** | $400 | $374 |
| 500 | $20 | $1 | $5 | $100 | **$126** | $2,000 | $1,874 |
| 1,000 | $20 | $1 | $5 | $200 | **$226** | $4,000 | $3,774 |

Plus one-time costs: domain (~$15), Termly (~$10/mo), possible LLC filing (~$50–500), possible PO box (~$80/yr).

**Note:** does not include owner's time. Customer support + content curation + monitoring is the real cost.

---

## 7. Risks (in priority order)

1. **No one pays.** Most likely outcome. Mitigation: free beta validates demand before charging.
2. **Owner doesn't enjoy customer support.** Real risk for a personal-tool side project. Mitigation: strict ToS limiting obligations; auto-canned responses; honest "support response within 7 days" policy.
3. **The paid value prop isn't strong enough.** See §3.3. Mitigation: build the paid-differentiator BEFORE turning on payments. **This is the risk that ended the plan.**
4. **Compliance miss.** GDPR fines or sales-tax penalties scale fast. Mitigation: Paddle as merchant of record; templated ToS/Privacy from Termly.
5. **Scraper failures disproportionately hurt paid users.** Mitigation: monitoring + alerting + graceful degradation copy.
6. **Charge-backs.** Even legitimate ones cost $15 each at Stripe; reputation damage at high rates. Mitigation: clear refund policy, generous first-30-days no-questions refund.
7. **Content liability.** Pickleball betting now exists; published "developing" tier news being wrong could create liability. Mitigation: ToS explicitly disclaims fitness-for-purpose; tier badges remain visible.

---

## 8. Open questions that would need answers if revisited

1. **Real ambition or "see if it works"?** Different go/no-go thresholds.
2. **Brand name + product domain?** Plan can't move past Phase M1 without this.
3. **Free tier or strictly paid?** §3.1 model A vs B vs C.
4. **Which paid-only differentiator to build first?** §3.3 — personalization, court-finder, tournament prep, or AI Q&A.
5. **Founder pricing?** Confirm first-50-subscribers pricing-locked-forever as anti-churn moat.
6. **Family-member free tier?** Cap at current 3, or expand-as-asked, with a grandfather cutoff date.
7. **Support response SLA?** 24 hours / 72 hours / 7 days — sets expectations, affects how aggressive marketing can be.
8. **Geographic scope?** US-only is dramatically simpler (no GDPR, fewer tax regimes). Worth considering.

---

## 9. Decision log

| Date | Decision | Rationale |
|---|---|---|
| 2026-04-25 (Session 8) | Plan documented but **not pursuing** | Owner concluded the project lacks a defensible unique value proposition vs free competitors (The Dink, Pickleball Magazine, PickleballBrackets) and does not see a path to building one at this time. Project remains a personal tool serving 3 grandfathered family recipients. |

---

## 10. Revisit triggers

Reconsider this plan ONLY if one of the following occurs organically:

- A clearly paid-worthy feature gets built for other reasons (e.g., favorite-player personalization, court-finder with saved locations, AI Q&A from Phase 4) AND multiple non-family readers ask "would you charge for this?"
- An external party (pickleball org, club, league) inquires about white-labeling or licensing
- The free competitor landscape changes meaningfully (a major free competitor goes paid or shuts down)
- Owner's ambition for the project shifts from "personal tool" to "side business"

Until then, this plan is reference-only.
