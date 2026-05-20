# Vercel Deployment Design

## Goal

Deploy Reportive as a public-accessible static site on Vercel via GitHub integration, so any invited user can access the dashboard — not just the developer locally.

## Architecture

Reportive is a pure static site (HTML + Babel-transpiled JSX, no bundler). All data lives in Supabase (4 cloud instances). All sync scripts run in Google's cloud (Apps Script / Google Ads Scripts). Nothing in the app is local-only — only the configuration for Vercel hosting is missing.

The web app lives in `app/` inside the repo. Vercel will be configured to treat `app/` as the web root, keeping sync scripts (`ga4_sync.js`, etc.) and SQL schema files at the repo root completely separate from the public deployment.

## Tech Stack

- **Hosting:** Vercel (static site, no build step)
- **Auth:** Supabase `profiles` table → `sessionStorage` (unchanged)
- **Data:** 4 Supabase instances (unchanged)
- **Sync:** Google Apps Script + Google Ads Scripts (unchanged, run independently)

---

## What Changes

### 1. New file: `app/vercel.json`

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

- `/ → /index.html` rewrite handles the root route
- HTML files: `no-cache` so users always get the latest version
- JS/CSS assets: `immutable` long-term cache — safe because every release already bumps `?v=N` query strings
- `app/serve.json` stays untouched (used by local `serve` dev server)

### 2. Vercel Project Settings (one-time, in dashboard)

| Setting | Value |
|---|---|
| Framework Preset | Other |
| Root Directory | `app` |
| Build Command | *(empty)* |
| Output Directory | *(empty)* |
| Install Command | *(empty)* |
| Environment Variables | *(none needed)* |

Vercel auto-deploys on every push to `main`. Preview URLs are generated for each PR automatically.

---

## What Does NOT Change

- **`data-bridge.jsx`** — Supabase anon keys stay hardcoded. Anon keys are designed to be public (protected by RLS), and the repo is private.
- **`login.html`** — Auth mechanism works identically on Vercel.
- **All component files** — No code changes required.
- **Sync scripts** — They run in Google's cloud, completely independent of Vercel.

---

## Sync Script Verification (pre-launch checklist)

Before going live, verify all data pipelines are active:

| Script | Where | Expected trigger |
|---|---|---|
| `ga4_sync.js` | script.google.com | `syncTotalsDaily` 07:00, `syncSessionsDaily` 07:30 |
| `gsc_sync.js` | script.google.com | `syncSummaryDaily` 08:00, `syncQueriesDaily` 08:30 |
| `psi_sync.js` | script.google.com | Daily trigger 06:00 |
| `google_ads_script.js` | Google Ads → Tools → Scripts | Daily, 07:00 |
| `google_apps_script.js` | Google Sheets → Extensions → Apps Script | `setupTrigger` active |

If any trigger is missing, run `createAllTriggers()` inside that script.

---

## Out of Scope

- Moving Supabase anon keys to environment variables (unnecessary: private repo, anon keys are public by design)
- Adding server-side auth middleware (client-side sessionStorage auth is sufficient)
- Migrating sync scripts to Vercel Cron (they already run in Google's cloud)
