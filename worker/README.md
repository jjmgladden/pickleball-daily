# pickleball-daily-submit — Cloudflare Worker

A tiny Cloudflare Worker that receives submissions from the Pickleball Daily site's future "Suggest" form and turns them into labeled GitHub Issues on `jjmgladden/pickleball-daily`.

**Why:** the main site is static (GitHub Pages). To accept form submissions without a full backend, the Worker acts as a single-purpose adapter — browser → Worker → GitHub API.

**Why Cloudflare:** free tier covers 100,000 requests/day (we'll use ~10/day at most), no cold starts, one-command deploy, zero infrastructure to babysit.

**Reusable by design** (KB-0012): all project-specific values live in `wrangler.toml [vars]`. Porting to another project = edit `wrangler.toml` + new PAT + redeploy. See the "Porting to other projects" section at the bottom.

---

## First-time setup (one-time, ~15 min)

### 1. Create a Cloudflare account (if you don't have one)
- https://dash.cloudflare.com/sign-up
- Free tier is all you need

### 2. Install wrangler (the Cloudflare CLI)
```
npm install -g wrangler
```
Or use `npx wrangler …` without installing globally.

### 3. Authenticate wrangler with your Cloudflare account
```
cd worker
npx wrangler login
```
A browser window opens; click **Allow**. Closes automatically.

### 4. Create a fine-grained GitHub PAT for the Worker
The PAT the Worker uses to open Issues. **Narrowly scoped so it can do nothing but open Issues on this one repo.**

1. https://github.com/settings/personal-access-tokens/new
2. **Token name:** `pickleball-daily-submit-worker`
3. **Expiration:** 1 year (recommended)
4. **Repository access:** Only select repositories → choose `jjmgladden/pickleball-daily`
5. **Permissions → Repository permissions:**
   - **Issues:** Read and write
   - Leave everything else untouched
6. **Generate token** → copy the value (starts with `github_pat_`)

### 5. Set the token as a Worker secret
```
cd worker
npx wrangler secret put GITHUB_TOKEN
```
Paste the token when prompted.

### 6. Deploy the Worker
```
npx wrangler deploy
```

After ~30 seconds wrangler prints the Worker URL, which will look like:
```
https://pickleball-daily-submit.<your-subdomain>.workers.dev
```

**Copy this URL** — you'll wire it into the site's Suggest component in a future session when the suggest UI ships.

---

## Maintenance

### View live submissions
```
cd worker
npx wrangler tail
```
Streams live Worker logs. Ctrl+C to stop.

### Rotate the GitHub token
1. Create a new fine-grained PAT (same scope as before)
2. `npx wrangler secret put GITHUB_TOKEN` — paste new value
3. Revoke the old PAT at https://github.com/settings/personal-access-tokens

### Update the Worker code
1. Edit `worker/src/index.js`
2. `npx wrangler deploy`

### Remove the Worker entirely
```
npx wrangler delete pickleball-daily-submit
```

---

## What the Worker does

1. Accepts `POST` with JSON body:
   ```json
   {
     "type":  "player" | "event" | "moment" | "other",
     "name":  "Ben Johns",
     "reason": "Notable because …",
     "source": "https://ppatour.com/athlete/ben-johns/",
     "submitterName":  "Optional",
     "submitterEmail": "Optional"
   }
   ```
2. Validates fields and rate-limits (3 submissions per IP per 10 min)
3. Silently drops submissions where the `website` honeypot field is filled (bot protection)
4. Calls GitHub REST API to open an Issue titled `Submission: {type} — {name}` with labels `submission`, `submission:{type}`
5. Returns `{ ok: true, issueUrl, issueNumber }` on success

---

## Porting to other projects (~5 min)

The Worker is intentionally small and fully parameterized. To reuse on a new project:

1. Copy this entire `worker/` directory into the target project.
2. Edit `wrangler.toml`:
   - Change `name` to something unique (becomes the subdomain).
   - Update `GITHUB_REPO` to the target repo (e.g. `you/your-project`).
   - Update `ALLOWED_ORIGINS` to the target site's URLs (comma-separated).
   - Update `ALLOWED_TYPES` to the project-specific submission vocabulary (comma-separated; e.g. `author,book,other` for a books site).
   - Update `WORKER_NAME` (appears in GitHub Issue bodies + the API `User-Agent`).
3. Create a new fine-grained PAT for that repo (Issues:write only).
4. `npx wrangler secret put GITHUB_TOKEN`.
5. `npx wrangler deploy`.
6. Paste the new Worker URL into the target project's suggest component.

No code changes needed — `wrangler.toml` is the full surface area for per-project customization.

---

## Cost

- Worker requests: 100,000/day free, we use ~10/day. **$0**.
- Cloudflare account: free.
- GitHub PAT: free.

No hidden costs.
