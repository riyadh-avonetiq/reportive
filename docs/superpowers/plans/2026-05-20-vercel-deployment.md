# Vercel Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy Reportive to Vercel via GitHub integration so any invited user can access the dashboard from a public URL.

**Architecture:** The app is a pure static site living in `app/`. Vercel is configured to serve `app/` as the web root by setting Root Directory in the project settings. A single `vercel.json` file handles routing and cache headers. No build step, no environment variables, no code changes beyond the config file.

**Tech Stack:** Vercel static hosting, GitHub integration, `vercel.json` configuration

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `app/vercel.json` | **Create** | Vercel routing + cache-control headers |
| `app/serve.json` | **Leave untouched** | Local dev server config (unrelated to Vercel) |

---

### Task 1: Create `app/vercel.json`

**Files:**
- Create: `app/vercel.json`

- [ ] **Step 1: Create the file**

Create `app/vercel.json` with the following exact content:

```json
{
  "cleanUrls": false,
  "trailingSlash": false,
  "rewrites": [
    { "source": "/", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/(index|login)\\.html",
      "headers": [
        { "key": "Cache-Control", "value": "no-cache, no-store, must-revalidate" },
        { "key": "Pragma",        "value": "no-cache" },
        { "key": "Expires",       "value": "0" }
      ]
    },
    {
      "source": "/assets/(.*)\\.(?:js|jsx|css)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}
```

What each section does:
- `rewrites` → `/` maps to `index.html` so the root URL opens the app
- HTML headers → `no-cache` so users always get the latest HTML after a deploy
- Asset headers → `immutable` 1-year cache; safe because every JS/CSS change already bumps `?v=N` query strings

- [ ] **Step 2: Verify `serve.json` is untouched**

Run:
```bash
cat app/serve.json
```

Expected output (no changes):
```json
{
  "cleanUrls": false,
  "trailingSlash": false,
  "rewrites": [
    { "source": "/", "destination": "/index.html" }
  ]
}
```

- [ ] **Step 3: Commit**

```bash
git add app/vercel.json
git commit -m "feat: add vercel.json for static site deployment"
```

- [ ] **Step 4: Push to GitHub**

```bash
git push origin main
```

---

### Task 2: Connect GitHub Repo to Vercel

This task is done entirely in the Vercel web dashboard. No code changes.

- [ ] **Step 1: Create a new Vercel project**

Go to [vercel.com/new](https://vercel.com/new). Click **"Import Git Repository"**. Select the `reportive-dashboard` GitHub repo.

- [ ] **Step 2: Configure project settings**

On the "Configure Project" screen, set these values exactly:

| Field | Value |
|---|---|
| **Project Name** | `reportive-dashboard` (or any name you prefer) |
| **Framework Preset** | `Other` |
| **Root Directory** | `app` ← **critical, do not skip** |
| **Build Command** | *(leave blank)* |
| **Output Directory** | *(leave blank)* |
| **Install Command** | *(leave blank)* |

To set Root Directory: click **"Edit"** next to the field, type `app`, confirm.

- [ ] **Step 3: Deploy**

Click **"Deploy"**. Vercel will pull the repo and deploy in ~30 seconds.

Expected result: a green "Congratulations!" screen with a URL like `reportive-dashboard.vercel.app`.

- [ ] **Step 4: Open the deployed URL and verify**

Open the URL Vercel provides. Expected behavior:
- You see the Reportive login page (not a 404 or blank screen)
- Login with your credentials → dashboard loads
- Data appears (Google Ads, GA4, etc.)

If the login page doesn't appear, check that Root Directory is set to `app` in Vercel project settings: go to the project → Settings → General → Root Directory.

---

### Task 3: Configure a Custom Domain (optional)

Skip this task if you're happy with the `*.vercel.app` URL.

- [ ] **Step 1: Add domain in Vercel**

Go to your Vercel project → **Settings → Domains** → type your domain (e.g. `reportive.avonetiq.id`) → **Add**.

- [ ] **Step 2: Update DNS at your domain registrar**

Vercel will show the DNS records to add (either a CNAME or A record). Add them at your domain registrar (Cloudflare, GoDaddy, etc.).

- [ ] **Step 3: Wait for propagation and verify SSL**

DNS propagation takes 1–30 minutes. Vercel auto-provisions an SSL certificate once DNS resolves. Verify by opening `https://your-domain.com` — login page should appear with a valid padlock.

---

### Task 4: Verify Sync Script Triggers

The dashboard shows live data only if the Google Apps Script / Google Ads triggers are active. Check each one before sharing the URL with clients.

- [ ] **Step 1: Check GA4 sync**

1. Go to [script.google.com](https://script.google.com)
2. Open the GA4 sync project (paste from `ga4_sync.js` if not yet created)
3. Click the **clock icon** (Triggers) in the left sidebar
4. Verify these triggers exist:

| Function | Frequency | Time |
|---|---|---|
| `syncTotalsDaily` | Day timer | 07:00–08:00 |
| `syncSessionsDaily` | Day timer | 07:30–08:30 |

If missing, run `createAllTriggers()` from the script editor.

- [ ] **Step 2: Check GSC sync**

Same as Step 1 but for the GSC sync project (from `gsc_sync.js`). Expected triggers:

| Function | Frequency | Time |
|---|---|---|
| `syncSummaryDaily` | Day timer | 08:00–09:00 |
| `syncQueriesDaily` | Day timer | 08:30–09:30 |

If missing, run `createAllTriggers()`.

- [ ] **Step 3: Check PSI sync**

Same process for the PSI sync project (from `psi_sync.js`). Expected trigger:

| Function | Frequency | Time |
|---|---|---|
| `runDailySync` (or similar) | Day timer | 06:00–07:00 |

If missing, run `setupDailyTrigger()`.

- [ ] **Step 4: Check Google Ads script**

1. In Google Ads, go to **Tools & Settings → Bulk Actions → Scripts**
2. Find the Reportive sync script (from `google_ads_script.js`)
3. Verify frequency is **Daily** and time is **07:00**

If not set, click the script → Edit → set schedule to Daily, 07:00 → Save.

- [ ] **Step 5: Check Google Sheets sync**

1. Open the Google Sheet that contains the ADS_DATA tab
2. Go to **Extensions → Apps Script**
3. Click the **clock icon** (Triggers)
4. Verify a trigger exists for `syncToSupabase` (or similar) — time-driven or on edit

If missing, run `setupTrigger()` from the script editor.

- [ ] **Step 6: Confirm data is fresh in the deployed app**

Open the deployed Vercel URL, log in, and check that:
- Google Ads data shows recent dates (within the last 1–2 days)
- GA4 sessions data is current
- Search Console data is current

If data is stale but triggers are active, wait until the next trigger fires (typically by 09:00 the next day) and refresh.
