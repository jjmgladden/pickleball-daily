# Concepts Primer

**Version:** 1 | **Last updated:** 2026-04-23 (Session 6 — initial)

A reference for the foundational concepts behind external services, deployment, and auth used in this project. Read once to build the mental model; come back when a term feels foggy.

This doc explains the *what* and the *why* — not the *how-to-do-it-step-by-step* (that lives in `worker/README.md` and `docs/credentials.md`). Plain language, cross-referenced.

> **Maintenance note:** Update this doc when a new major external service is introduced (e.g., a different cloud provider, a new auth pattern) OR when a concept here turns out to be inaccurate. Concepts don't change as often as credentials, so there's no mandatory session-end trigger. Just keep it current as new ones come up.

---

## Table of Contents

1. [Serverless functions — the general category](#1-serverless-functions--the-general-category)
2. [Cloudflare Workers — what we specifically use](#2-cloudflare-workers--what-we-specifically-use)
3. [The Worker code in this project](#3-the-worker-code-in-this-project)
4. [wrangler — the CLI tool that talks to Cloudflare](#4-wrangler--the-cli-tool-that-talks-to-cloudflare)
5. [`npx` — what it does and why we use it](#5-npx--what-it-does-and-why-we-use-it)
6. [The deployed Worker URL](#6-the-deployed-worker-url)
7. [Why Workers vs alternatives](#7-why-workers-vs-alternatives)
8. [Complete deployment walkthrough](#8-complete-deployment-walkthrough)
9. [Personal Access Tokens (PATs)](#9-personal-access-tokens-pats)
10. [GitHub auth methods — PAT vs browser vs git](#10-github-auth-methods--pat-vs-browser-vs-git)
11. [Related documents](#related-documents)

---

## 1. Serverless functions — the general category

Traditionally, if you wanted code to respond to internet requests, you had to:

- Rent a computer (a virtual machine, or "VM")
- Install an operating system on it
- Install a web server (nginx, Apache, etc.)
- Configure it to run your code
- Keep it running 24/7
- Monitor uptime, scaling, security, certificates, logging
- Pay for it whether anyone visited or not

A lot of work for a little bit of code.

**Serverless functions** invert that model. You upload just the function (a small bit of code). The cloud provider handles everything else:

- They run it only when someone makes a request — no server is "running" between requests
- They scale it automatically — one user or a million, you don't change anything
- They charge per request, not per hour — usually free at small scale
- They handle the operating system, web server, SSL certificates, scaling, monitoring

It's the smallest possible thing that can serve internet traffic. *"You write a function. We run it everywhere in the world."*

The term "serverless" is mildly misleading — there ARE servers, you just never think about them. The provider operates them; you just upload the function.

Major providers and their product names:

| Provider | Their name for serverless functions |
|---|---|
| **Cloudflare** | **Workers** ← what we use |
| Amazon Web Services (AWS) | Lambda functions (or just "Lambdas") |
| Google Cloud | Cloud Functions |
| Microsoft Azure | Azure Functions |
| Vercel | Edge Functions / Serverless Functions |
| Netlify | Functions / Edge Functions |

So "Worker" is Cloudflare's branded name within this category.

---

## 2. Cloudflare Workers — what we specifically use

**Cloudflare** is a company that runs one of the largest networks of data centers in the world — hundreds of locations across every continent. Their core business is internet infrastructure: protecting websites from attacks (DDoS protection), speeding up content delivery (CDN), hosting DNS records.

One of their products is **Cloudflare Workers** — the serverless-function service. Launched 2017. They named it "Workers" because each one is a small unit of code that "does work" on demand.

### Why Cloudflare Workers (specifically) for our use case

| Reason | Detail |
|---|---|
| **Free tier is generous** | 100,000 requests per day. We'd use ~10/day. ~10,000× headroom. |
| **No cold starts** | Other serverless platforms have a 1-3 second delay on the first request after idle. Workers don't — runs in <50ms always. |
| **Global by default** | Your Worker code is replicated to every Cloudflare data center worldwide. The nearest one to the requester runs it. |
| **One-command deploy** | `wrangler deploy` and 30 seconds later it's live everywhere. |
| **Zero infrastructure to babysit** | No servers, no patching, no certificates to renew. Cloudflare absorbs all of it. |

### The three things Cloudflare does for us

| Thing | How it works |
|---|---|
| **Hosts your Worker code** | After `wrangler deploy`, your code is uploaded to Cloudflare's vault and replicated to every edge data center. |
| **Runs your code on demand** | When someone POSTs to the Worker URL, Cloudflare's nearest edge data center wakes up your code, runs it, returns the response — all in milliseconds. |
| **Stores your secrets** | The `GITHUB_TOKEN` you `wrangler secret put` lives encrypted in Cloudflare's secrets vault, available to your Worker code at runtime, never visible from the dashboard or to anyone else. |

### What you don't pay / don't manage

- **Money:** $0 at our usage. Free tier covers everything we'd ever do.
- **Servers:** none to rent or manage.
- **Scaling:** automatic. If 1,000,000 people hit the Worker simultaneously, Cloudflare handles it. You change nothing.
- **DNS / SSL / certificates:** Cloudflare handles all of it. The Worker URL has a valid HTTPS cert from day one.
- **Uptime monitoring:** their network is more reliable than anything you'd run yourself.

---

## 3. The Worker code in this project

The Worker code already exists in your project — right now, on your computer. Specifically in the `worker/` subdirectory of the project root:

```
<project-root>/worker/
├── src/
│   └── index.js          ← the Worker code (~150 lines of JavaScript)
├── package.json          ← Node.js manifest, lists wrangler as a dep
├── wrangler.toml         ← Cloudflare Worker config
└── README.md             ← Owner deployment walkthrough
```

Four files. Also in your public GitHub repo (shipped in commit `fe6fd9c` during Session 6).

### The state matters

Right now, that code is **text on disk**. It's not running. Nothing on the internet uses it. It's like a recipe written on an index card — the recipe exists, but no one is cooking from it.

To go from "text on disk" to "actually running and answering requests on the internet," you need to **deploy it** to Cloudflare. That's a one-time setup process (see Section 8).

### Where it lives after deployment

After `wrangler deploy` runs successfully:

- A copy of your Worker code lives in **every Cloudflare data center worldwide** — hundreds of locations
- You don't pick which one runs it; Cloudflare picks the nearest data center to whoever made the request
- The code is identical at every location — Cloudflare keeps them in sync automatically
- Your Worker is **available 24/7 forever** until you delete it (`wrangler delete`)

You don't need to think about which server it's on, where in the world it's running, or how it got there. It just answers requests when they arrive.

---

## 4. wrangler — the CLI tool that talks to Cloudflare

**wrangler** is a command-line tool (CLI) made by Cloudflare. Think of it as your "remote control" for managing Workers from your local computer.

You type wrangler commands into your terminal; wrangler talks to Cloudflare's API on your behalf, behind the scenes.

### Common commands

| Command | What it does |
|---|---|
| `wrangler login` | One-time browser handshake to authenticate your machine with your Cloudflare account |
| `wrangler deploy` | Takes your local Worker code, uploads it to Cloudflare, makes it live (~30 seconds) |
| `wrangler secret put NAME` | Stores an encrypted secret in your Worker's environment on Cloudflare |
| `wrangler dev` | Runs the Worker locally on your machine for testing before deploying |
| `wrangler tail` | Streams live logs from your deployed Worker so you can see what's happening |
| `wrangler delete <name>` | Removes a deployed Worker entirely |

### Analogy

`git` is a CLI that lets you talk to GitHub from your terminal.
`wrangler` is a CLI that lets you talk to Cloudflare from your terminal.
Same shape, different service.

### Where it gets installed

Wrangler is listed in `worker/package.json` as a `devDependency`. When you run `cd worker && npm install`, npm downloads wrangler into a local `worker/node_modules/` folder.

Installing it locally means:
- It's tied to this specific project, not your whole machine
- The version is pinned — won't change unexpectedly
- Other projects on your machine can use a different wrangler version without conflict

---

## 5. `npx` — what it does and why we use it

**`npx`** is a small helper that comes bundled with Node.js. Its job: run a CLI tool that's installed locally to a project.

When wrangler is in `worker/node_modules/`, you can't just type `wrangler deploy` because your terminal doesn't know to look in that folder. You have two options:

1. Install wrangler **globally** on your machine: `npm install -g wrangler`. After that, `wrangler deploy` works directly. Downside: clutters your machine, no version pinning.
2. Use **`npx`** to find the locally-installed wrangler: `npx wrangler deploy`. No global install needed.

We use `npx`.

### What `npx wrangler deploy` literally means

> *"Find wrangler in this project's installed dependencies and run it with the argument `deploy`."*

`npx` does the lookup. `wrangler` is the tool. `deploy` is the wrangler subcommand.

### Why this pattern is good

- No "wrangler version installed on your machine" to keep updated
- The wrangler version is pinned in `worker/package.json` — every machine gets the same version
- Onboarding a new contributor is just `cd worker && npm install` — no separate global setup

---

## 6. The deployed Worker URL

A **deployed Worker URL** is the public address where your Worker code lives and runs after deployment. Think of it as the "phone number" for the Worker.

### How it gets created

When `npx wrangler deploy` runs, Cloudflare:
1. Uploads your code to their network
2. Assigns the Worker a URL based on (a) your Cloudflare account subdomain + (b) the Worker name from `wrangler.toml`
3. Makes it live globally — at every edge data center, simultaneously, in ~30 seconds
4. Prints the URL to your terminal

### URL pattern

```
https://<worker-name>.<your-cloudflare-subdomain>.workers.dev
```

For our project, after deployment it would look like:

```
https://pickleball-daily-submit.<your-subdomain>.workers.dev
```

Where `<your-subdomain>` is whatever Cloudflare assigned you when you created your account.

Concrete made-up example: `https://pickleball-daily-submit.ozarkjoe.workers.dev`

### What happens when someone POSTs to it

1. Their request hits the nearest Cloudflare data center (~10ms away from them)
2. Cloudflare runs your `worker/src/index.js` code
3. Your code reads the request body, validates it, calls GitHub's API to create an Issue using the stored secret
4. Your code returns a response: `{ ok: true, issueUrl: "...", issueNumber: 7 }`
5. The Issue appears in your GitHub repo

All of that happens in ~200ms. You don't have a server. You don't have a process running. You don't have a database. Cloudflare just runs your function on demand.

### Why we don't have one yet

Because the Worker isn't deployed. The code is in `worker/` but Cloudflare doesn't know about it. No URL exists. The URL only comes into being when you run `wrangler deploy` (after the one-time setup).

### How the site would use it (future session)

Once the URL exists, a future session would build a "Suggest" form on the site. The form's JavaScript would POST submissions to the Worker URL:

```js
const SUBMIT_URL = 'https://pickleball-daily-submit.<subdomain>.workers.dev';

await fetch(SUBMIT_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ type, name, reason, source })
});
```

The Worker receives that POST, validates + rate-limits + creates a GitHub Issue. The user sees a confirmation; you see a new Issue appear in the repo's Issues tab.

---

## 7. Why Workers vs alternatives

We need *somewhere on the internet* that can:
1. Receive a POST request from the browser
2. Make an authenticated API call to GitHub to create an Issue
3. Return a response

GitHub Pages can serve static HTML/CSS/JS but cannot do step 2 (it has no server-side code, no secrets storage). The Worker fills exactly that gap.

Alternatives we'd reject:

| Alternative | Why not |
|---|---|
| **Run your own server** | Hours of setup. Renting a VM, configuring web server, dealing with SSL, monitoring uptime, scaling under load, securing the server. Ongoing maintenance forever. |
| **Forms-as-a-Service** (Formspree, Netlify Forms) | Monthly fee. Less control. Locked into someone else's submission flow. Can't customize Issue formatting. |
| **Embedded Google Form** | Works but ugly, no validation, no auto-create-Issue path, not aesthetic. |
| **Vercel / Netlify serverless functions** | Comparable to Workers. Would work fine. We chose Cloudflare for free-tier generosity + no-cold-starts + sibling project precedent. |

Cloudflare Workers is the smallest possible thing that does what we need: ~150 lines of code, $0/month, deploys in 30 seconds, scales to millions if needed, gives us full control over validation/CORS/rate-limiting/Issue formatting.

---

## 8. Complete deployment walkthrough

The end-to-end process to go from "code in repo" to "live, callable Worker." This is what `worker/README.md` walks you through in detail; the bird's-eye view is here.

### Step 1 — Today (already done)
Your project repo has a `worker/` folder with `src/index.js`. The code is *defined* but *not running anywhere on the internet*.

### Step 2 — Sign up for Cloudflare (~2 min)
Visit https://dash.cloudflare.com/sign-up. Free account. They assign you a subdomain.

### Step 3 — Authenticate wrangler with Cloudflare (~1 min)
Open a terminal, navigate to the project's `worker/` folder:
```
npx wrangler login
```
A browser window opens, you log into Cloudflare, click **Allow**. Wrangler stores an OAuth token on your machine. Now your computer can talk to your Cloudflare account.

### Step 4 — Create a fine-grained GitHub PAT (~3 min)
Visit https://github.com/settings/personal-access-tokens. Create a token scoped to:
- Repository access: `jjmgladden/pickleball-daily` only (NOT "all repos")
- Permission: `Issues: Read and write`
- All other permissions: `No access`

Copy the value (`github_pat_...`). This token will let the Worker create Issues on your behalf.

### Step 5 — Give the PAT to the Worker (~1 min)
Still in `worker/`:
```
npx wrangler secret put GITHUB_TOKEN
```
Wrangler prompts for the value — paste the PAT. The PAT travels encrypted to Cloudflare and is stored in your Worker's secret vault. Never written to disk; never visible after this.

### Step 6 — Deploy (~30 seconds)
```
npx wrangler deploy
```
Wrangler bundles `src/index.js` + reads `wrangler.toml` for config + uploads everything to Cloudflare. Cloudflare distributes the code to all its edge data centers. Within ~30 seconds, the Worker is live.

Wrangler prints the URL:
```
✨ Successfully published your Worker
   https://pickleball-daily-submit.<your-subdomain>.workers.dev
```

### Step 7 — That URL is now a real, live endpoint
Anyone (any browser, any program) on the internet can POST to that URL. When they do, Cloudflare runs your code and your code creates a GitHub Issue.

### Step 8 — Future session: wire the URL into a Suggest form on the site
Once you have the URL from step 6, a future session adds a small form to the site that POSTs submissions to your Worker URL. End-to-end submission flow now exists.

**Total owner time:** ~15 minutes for steps 2-6, one-time only.

---

## 9. Personal Access Tokens (PATs)

**PAT** = **Personal Access Token.** A specific kind of credential that GitHub (and a few other services) lets you create. It's like a password substitute, designed for automated tools that need to act on your behalf without using your actual password.

### The core idea

You don't want to give a script your account password — that's the keys to the kingdom. Instead, you generate a **token** that:

- Identifies the request as coming from you
- Is scoped narrowly (only the specific things the script needs)
- Can be revoked individually without changing your password
- Has an expiration date

If the token leaks, you revoke it — your account is fine, the token just becomes inert.

### Where the term comes from

- **"Personal"** because it acts as YOU (your user account, not an organization or app)
- **"Access"** because it grants access to APIs
- **"Token"** because it's a string of characters, not a username/password pair

GitHub coined the specific term **PAT** around 2015 for their version. The general concept exists across many services under similar names:

| Service | Their name |
|---|---|
| **GitHub** | **Personal Access Token (PAT)** |
| GitLab | Personal Access Token (also PAT) |
| Bitbucket | App Password |
| Atlassian (Jira/Confluence) | API Token |
| AWS | Access Key (similar concept, different shape) |
| Most SaaS APIs | Just "API Key" or "API Token" |

So when someone says "PAT," they almost always mean GitHub specifically.

### GitHub's two flavors

GitHub offers two kinds of PATs, and the difference matters:

| Type | Scope | When to use |
|---|---|---|
| **Classic PAT** | Broad — by category. e.g. "all repo access" or "all gist access." Old design. | Avoid for new work. Created before 2022. Strongly discouraged because the scopes are too broad. |
| **Fine-grained PAT** | Narrow — per-repo, per-permission. e.g. "Issues:write on `pickleball-daily` only." Newer (2022+). | What you want. Minimum-permission posture. |

For our Worker, we'd create a **fine-grained PAT** with this scope:
- Repository access: `jjmgladden/pickleball-daily` only (NOT "all repos")
- Permission: `Issues: Read and write`
- Everything else: `No access`

Maximally narrow. If that token ever leaked, the worst an attacker could do is open spam Issues on that one repo. Annoying, easy to revoke, no other damage possible.

### What it looks like

A fine-grained PAT is a long string starting with `github_pat_`, like:

```
github_pat_11ABCDEFGH...about 80 characters total...
```

GitHub shows it ONCE on creation. Same rule as every other credential — copy immediately into your password manager, then paste into wherever it needs to live.

### Where it would be used in this project

The only PAT in your project (eventually) would be the **Worker's GitHub PAT**:
- Created at https://github.com/settings/personal-access-tokens
- Stored in Cloudflare Worker secrets (via `npx wrangler secret put GITHUB_TOKEN`)
- Read by `worker/src/index.js` to authenticate requests to GitHub's API when creating Issues from form submissions

Documented in `docs/credentials.md` under the "GITHUB_TOKEN (Worker — fine-grained PAT)" section, status currently ⏸ because the Worker isn't deployed yet.

---

## 10. GitHub auth methods — PAT vs browser vs git

There are three different ways your interactions with GitHub get authenticated, and they don't overlap:

| Auth method | Used by | What it is | When you set it up |
|---|---|---|---|
| **Browser login** (username + password + 2FA) | github.com website | Your account password. Lets you do anything as you. | Whenever you log in on a new device. |
| **Git Credential Manager** (Windows) | `git push` from terminal | OAuth token managed automatically by Windows. Lets git push commits as you. | First time you ran `git push` after Windows install (one-time browser handshake). Now invisible — `git push` just works. |
| **Personal Access Token (PAT)** | Automated tools (the future Worker, in our case) | A scoped credential string. Lets a tool act as you for narrow tasks. | When you create one explicitly at https://github.com/settings/personal-access-tokens. |

These three are completely separate. Losing one doesn't affect the others. Revoking one doesn't affect the others. Each has a different lifecycle:

- Your **browser login** is your everyday auth. Goes away if you log out.
- Your **Git Credential Manager** auth is forever (until your machine wipes or token expires after months of disuse). Re-prompts on next push if lost.
- Your **PATs** are explicit. You create them deliberately, you revoke them deliberately. Standard rotation cadence: 1 year, or any suspicion of leakage.

Side note on the name conflict: GitHub Actions has a built-in variable called `${{ secrets.GITHUB_TOKEN }}` (read in workflow YAML files) that is different from a PAT — it's an auto-generated, short-lived token GitHub creates for each workflow run. Our daily.yml workflow doesn't use it. The Worker's PAT happens to also be commonly named `GITHUB_TOKEN` in code (as in `env.GITHUB_TOKEN`), but it's a manually-created PAT, not the GitHub Actions auto-token.

---

## Related documents

- **`docs/credentials.md`** — the inventory of every credential, including the Worker's PAT (when created).
- **`worker/README.md`** — the step-by-step deployment walkthrough for the Worker. Use this when actually doing the deployment; this primer is for understanding what each step means.
- **`docs/knowledge-base.md`** — KB entries reference specific decisions (KB-0012 for the Worker design, KB-0006 for YouTube API setup, etc.).

## Maintenance log

- **2026-04-23 (Session 6)** — initial creation. Covers Cloudflare Workers, wrangler/npx, the Worker URL concept, deployment walkthrough, PATs, and GitHub auth methods. Built from a Session 6 dialog where these concepts were explained for the first time.
