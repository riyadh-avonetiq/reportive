# Neon Migration — Plan D: Migration Execution & Cutover

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Execute the live cutover — migrate app data from Supabase to Neon, backfill 180 days of analytics data, deploy the new frontend, configure all AppScripts, and verify end-to-end.

**Architecture:** Big-bang cutover. AppScripts switch from Supabase to Neon in a single coordinated step. No parallel-write phase — Supabase remains read-only after cutover and is closed after a 30-day observation window.

**Tech Stack:** Neon SQL Editor, Supabase Dashboard (export), Google Apps Script editor, Google Ads Scripts UI, Vercel dashboard, curl.

**Prerequisites:** Plan A complete and deployed (Neon schema + API endpoints live). Plans B and C merged to main branch. Vercel deploy triggered.

**Spec:** `docs/superpowers/specs/2026-05-21-neon-migration-design.md`

---

## File Map

```
neon_schema.sql           Already applied (from Plan A Task 1)
app/index.html            Already updated (from Plan C Task 5)
ga4_sync.js               Updated (from Plan B) — paste to Apps Script
gsc_sync.js               Updated (from Plan B) — paste to Apps Script
gads_sync.js              Updated (from Plan B) — paste to Google Ads Scripts
meta_sync.js              Created (from Plan B) — paste to Apps Script
```

---

## Task 1: Export App Data from Supabase

Export `clients`, `team_members`, and `datasource_config` (if exists) from each Supabase project for manual import into Neon.

- [ ] **Step 1: Export clients from Supabase meta/app project**

In Supabase dashboard → project `swklfolveiilajdmuenu` → Table Editor → `clients`:

Click **Export CSV**. Save as `clients_export.csv`.

Note every column: `id`, `name`, `logo_url`, `share_token`, `layouts` (JSONB), `configs` (JSONB), `created_at`.

- [ ] **Step 2: Export team_members**

Same project → `team_members` table → Export CSV. Save as `team_members_export.csv`.

- [ ] **Step 3: Verify exported data**

```bash
head -5 clients_export.csv
head -5 team_members_export.csv
```

Expected: headers + at least 1 data row each. Count the rows so you know what to expect after import.

---

## Task 2: Import App Data into Neon

- [ ] **Step 1: Insert clients**

For each row in `clients_export.csv`, run in Neon SQL Editor:

```sql
INSERT INTO clients (id, name, logo_url, share_token, layouts, configs, created_at)
VALUES
  ('your_client_id', 'Client Name', 'https://...logo.png', 'share_token_value',
   '{}', '{}', '2025-01-01T00:00:00Z')
ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name, logo_url = EXCLUDED.logo_url,
      share_token = EXCLUDED.share_token, layouts = EXCLUDED.layouts,
      configs = EXCLUDED.configs;
```

Repeat for each client row. Use the actual values from the CSV (copy `layouts` and `configs` JSON as-is).

- [ ] **Step 2: Insert team_members**

```sql
INSERT INTO team_members (email, name, role, created_at)
VALUES
  ('user@example.com', 'User Name', 'admin', '2025-01-01T00:00:00Z')
ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
```

Repeat for each team member.

- [ ] **Step 3: Verify counts match exports**

```sql
SELECT 'clients' AS t, COUNT(*) FROM clients
UNION ALL SELECT 'team_members', COUNT(*) FROM team_members;
```

Expected: counts match row counts from CSV exports.

- [ ] **Step 4: Insert datasource_config for each client**

For each client, insert their API config (GA4 property ID, Google Ads account name, GSC site URL, Meta account ID). These values come from the existing AppScript `CFG` objects and Supabase records.

```sql
INSERT INTO datasource_config (client_id, ga4_property_id, gads_account_name, gsc_site_url, meta_account_id)
VALUES ('your_client_id', '123456789', 'Client Account Name', 'https://www.site.com/', '123456')
ON CONFLICT (client_id) DO UPDATE
  SET ga4_property_id = EXCLUDED.ga4_property_id,
      gads_account_name = EXCLUDED.gads_account_name,
      gsc_site_url = EXCLUDED.gsc_site_url;
```

- [ ] **Step 5: Commit nothing — this is all in Neon console**

No git changes in this task. Verify via:

```bash
curl -s "https://reportive.avonetiq.com/api/app/client" | python3 -c "import sys,json; d=json.load(sys.stdin); print('Clients:', len(d.get('clients', [])))"
```

Expected: matches the count inserted.

---

## Task 3: Configure AppScript Properties

Each AppScript (GA4, GSC, Meta) needs these properties set in **Project Settings → Script Properties**:

| Key | Value |
|---|---|
| `CLIENT_ID` | The client ID string (e.g. `avonetiq`) |
| `SYNC_KEY` | The `SYNC_KEY` value from Vercel env vars |
| `NEON_ENDPOINT` | `https://reportive.avonetiq.com` |
| `META_TOKEN` | Long-lived Meta access token (for meta_sync.js only) |
| `AD_ACCOUNT_ID` | Meta ad account ID without `act_` prefix (for meta_sync.js only) |

`gads_sync.js` uses a `CONFIG` object at the top of the script — edit the file directly:
```js
var CONFIG = {
  clientId    : 'avonetiq',     // ← set this
  syncKey     : 'YOUR_SYNC_KEY',  // ← set this
  neonEndpoint: 'https://reportive.avonetiq.com',
  ...
};
```

- [ ] **Step 1: Set Properties for ga4_sync.js**

Open script.google.com → GA4 sync project → Project Settings → Script Properties.

Add: `CLIENT_ID`, `SYNC_KEY`, `NEON_ENDPOINT`.

- [ ] **Step 2: Set Properties for gsc_sync.js**

Open script.google.com → GSC sync project → Project Settings → Script Properties.

Add: `CLIENT_ID`, `SYNC_KEY`, `NEON_ENDPOINT`.

- [ ] **Step 3: Set Properties for meta_sync.js**

Open script.google.com → Meta sync project → Project Settings → Script Properties.

Add: `CLIENT_ID`, `SYNC_KEY`, `NEON_ENDPOINT`, `META_TOKEN`, `AD_ACCOUNT_ID`.

- [ ] **Step 4: Set CONFIG in gads_sync.js**

In Google Ads Scripts editor → `gads_sync.js`, update lines 1-7:

```js
var CONFIG = {
  clientId    : 'avonetiq',
  syncKey     : 'PASTE_ACTUAL_SYNC_KEY_HERE',
  neonEndpoint: 'https://reportive.avonetiq.com',
  maxRuntimeMs: 25 * 60 * 1000
};
```

---

## Task 4: Update AppScript Code in Editors

Paste the new script content into each editor.

- [ ] **Step 1: Update ga4_sync.js in Apps Script**

Open the GA4 sync Apps Script project. Replace ALL existing code with the content of `ga4_sync.js` from this repo. Save (Ctrl+S).

- [ ] **Step 2: Test GA4 connection**

In the Apps Script editor, run `testConnection()`.

Expected log: lists all GA4 properties. No authorization errors.

- [ ] **Step 3: Update gsc_sync.js in Apps Script**

Open the GSC sync Apps Script project. Replace ALL existing code with `gsc_sync.js`. Save.

Run `testConnection()`. Expected: lists all verified GSC sites.

- [ ] **Step 4: Update meta_sync.js in Apps Script**

Open the Meta sync Apps Script project. Replace ALL existing code with `meta_sync.js`. Save.

Run `testConnection()`. Expected: Meta ad account name and currency appear in log.

- [ ] **Step 5: Update gads_sync.js in Google Ads Scripts**

Open Google Ads Scripts → Scripts list → gads script. Replace code with `gads_sync.js`. Save.

Run preview mode. Expected: logs account list, no errors.

---

## Task 5: Backfill 180 Days of Data

Run `syncPeriod` on each script to populate Neon with 180 days of historical data.

**Note:** Apps Script has a 6-minute execution limit. For 180-day backfill, you may need to run multiple times with shorter windows (e.g., 30 days at a time).

- [ ] **Step 1: Backfill GA4 (30-day chunks)**

In the GA4 sync Apps Script editor, run `syncPeriod` with 30-day chunks:

```js
function backfill() {
  // Run each manually, one at a time
  syncPeriod('2025-11-23', '2025-12-22'); // chunk 1
  // If it finishes, run chunk 2 in a new execution:
  // syncPeriod('2025-12-23', '2026-01-21'); // chunk 2
  // ...etc until today
}
```

Approximate date windows for 180 days back from 2026-05-21:
- `2025-11-23` → `2025-12-22` (30 days)
- `2025-12-23` → `2026-01-21` (30 days)
- `2026-01-22` → `2026-02-20` (30 days)
- `2026-02-21` → `2026-03-22` (30 days)
- `2026-03-23` → `2026-04-21` (30 days)
- `2026-04-22` → `2026-05-20` (28 days, yesterday)

Run each chunk, wait for completion before running next.

- [ ] **Step 2: Verify GA4 backfill in Neon**

In Neon SQL Editor:
```sql
SELECT MIN(date), MAX(date), COUNT(*) FROM ga4_totals WHERE client_id = 'avonetiq';
```

Expected: `MIN(date)` ≈ 2025-11-23, `MAX(date)` = yesterday, `COUNT(*)` > 0.

- [ ] **Step 3: Backfill GSC (same chunk approach)**

Same 6 chunks as GA4. Run `syncPeriod('2025-11-23', '2025-12-22')` etc.

Verify:
```sql
SELECT MIN(date), MAX(date), COUNT(*) FROM gsc_totals WHERE client_id = 'avonetiq';
```

- [ ] **Step 4: Backfill Google Ads**

In Google Ads Scripts, run with the same 6 date windows using the GAQL date range approach.

Note: Google Ads data may only be available for 365 days in GAQL; 180 days is within the limit.

Verify:
```sql
SELECT MIN(date), MAX(date), COUNT(*) FROM gads_totals WHERE client_id = 'avonetiq';
```

- [ ] **Step 5: Backfill Meta**

Same chunk approach in Meta sync Apps Script.

Verify:
```sql
SELECT MIN(date), MAX(date), COUNT(*) FROM meta_totals WHERE client_id = 'avonetiq';
```

---

## Task 6: Setup Daily Triggers

Set daily triggers for all AppScripts. All scripts should trigger at the same time: **02:00 UTC** (= 09:00 WIB).

- [ ] **Step 1: Setup trigger for ga4_sync.js**

In Apps Script editor for GA4, run `setupTrigger()`.

Expected log: `Trigger set: syncAll daily at 02:00 UTC`.

Verify in Apps Script → Triggers panel: one daily `syncAll` trigger at 2am UTC.

- [ ] **Step 2: Setup trigger for gsc_sync.js**

In Apps Script editor for GSC, run `setupTrigger()`.

- [ ] **Step 3: Setup trigger for meta_sync.js**

In Apps Script editor for Meta, run `setupTrigger()`.

- [ ] **Step 4: Setup trigger for gads_sync.js**

In Google Ads Scripts UI → the script → Schedule → **Daily** → time: **02:00 UTC**.

Note: `setupTrigger()` is not available in Google Ads Scripts — set it manually in the UI.

---

## Task 7: Deploy Frontend (Plan C) to Production

- [ ] **Step 1: Verify all Plan B+C changes are committed**

```bash
git status
git log --oneline -10
```

Expected: all modified files committed, clean working tree.

- [ ] **Step 2: Get user approval to push**

This step requires explicit user permission. Do NOT push without confirmation.

Ask user: "Plans B and C are committed and ready. Should I push to origin/main to trigger the Vercel deploy?"

If approved:
```bash
git push origin main
```

- [ ] **Step 3: Monitor Vercel deploy**

In Vercel dashboard, watch the build complete. Expected build time: ~30-60 seconds.

Expected: build succeeds, no API route errors.

- [ ] **Step 4: Verify production endpoints**

```bash
for endpoint in gads ga4 gsc meta; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "https://reportive.avonetiq.com/api/$endpoint?client_id=avonetiq")
  echo "/api/$endpoint → $code"
done
```

Expected: all return `200`.

---

## Task 8: End-to-End Verification

- [ ] **Step 1: Open production dashboard**

Navigate to `https://reportive.avonetiq.com` → login → open a client report.

Expected: data loads for all 4 data sources. No "Script Error" or blank screens.

- [ ] **Step 2: Check data freshness**

In Neon SQL Editor:
```sql
SELECT 'gads' AS src, MAX(date) FROM gads_totals WHERE client_id = 'avonetiq'
UNION ALL SELECT 'ga4', MAX(date) FROM ga4_totals WHERE client_id = 'avonetiq'
UNION ALL SELECT 'gsc', MAX(date) FROM gsc_totals WHERE client_id = 'avonetiq'
UNION ALL SELECT 'meta', MAX(date) FROM meta_totals WHERE client_id = 'avonetiq';
```

Expected: all `MAX(date)` = yesterday (or at most 3-4 days ago for GSC, which has data lag).

- [ ] **Step 3: Manually trigger one syncAll to verify live write path**

In each Apps Script editor, run `syncAll()` manually once.

Expected: `syncPeriod done` in log, no auth errors.

Verify new rows appear in Neon:
```sql
SELECT date, COUNT(*) FROM ga4_totals WHERE client_id = 'avonetiq' AND date >= CURRENT_DATE - 3 GROUP BY date ORDER BY date DESC;
```

- [ ] **Step 4: Verify share links still work**

Open a share link (e.g. `https://reportive.avonetiq.com/#share/TOKEN`).

Expected: report loads without login, data shows.

---

## Task 9: Post-Cutover Cleanup (30 Days Later)

Wait at least 30 days after successful cutover before executing this task. This is a hard checkpoint — do not proceed early.

- [ ] **Step 1: Verify no traffic to old Supabase projects**

In each Supabase dashboard project → Logs → check if any API calls are coming in from the past 7 days.

Expected: zero traffic.

- [ ] **Step 2: Pause (not delete) each Supabase project**

In Supabase dashboard → each project → Settings → Danger Zone → **Pause project**.

Wait 7 days. If any issue surfaces, resume and investigate.

- [ ] **Step 3: Download full database backup**

Before deletion: Supabase → each project → Settings → Database → **Download backup**.

Store safely as `backups/supabase-{project-name}-{date}.sql`.

- [ ] **Step 4: Delete old Supabase projects**

After backup confirmed, delete each of the 4 Supabase projects.

- [ ] **Step 5: Final commit**

```bash
git commit -m "docs: Plan D complete — Supabase decommissioned, Neon fully live" --allow-empty
```
