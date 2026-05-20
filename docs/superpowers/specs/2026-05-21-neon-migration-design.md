# Neon Migration Design Spec

## Goal

Migrate all Reportive data infrastructure from 4 separate Supabase free-tier projects to a single Neon paid PostgreSQL database, accessed via Vercel API Functions. Result: consistent table naming, unified schema, standardized AppScripts, no data errors, and reduced complexity.

---

## Architecture

Browser never touches Neon directly. All data access goes through Vercel API Functions (server-side), which hold the Neon connection string. AppScripts POST to Vercel sync endpoints using a `SYNC_KEY`. Browser fetches data via GET endpoints scoped by `client_id`.

Supabase Realtime is replaced with 30-second polling. PSI historical storage is removed — measurements run on-demand in the browser using a stored API key.

---

## Section 1: Database Schema

### Naming conventions

- `*_totals` — aggregated daily totals per datasource (for KPI cards and charts)
- `*_detail` — most granular breakdown (ad group, keyword, ad level)
- `*_{dimension}` — breakdown by a specific dimension (pages, sessions, audience, queries, countries, devices, gender, conversions)
- App-level tables — no source prefix: `clients`, `datasource_config`, `team_members`
- Date column — always `date DATE` (not `day`, not `created_at`)
- Client identifier — always `client_id TEXT` FK to `clients.id` (replaces `account_name`, `property_name`, `property`)

### All 19 tables

**Google Ads (4 tables)**

| Table | Primary Key | Source |
|---|---|---|
| `gads_totals` | `(client_id, date, campaign_name, campaign_type)` | CAMPAIGN_PERFORMANCE_REPORT — accurate totals |
| `gads_detail` | `(client_id, date, campaign_name, ad_group, keyword, match_type, device)` | KEYWORDS_PERFORMANCE_REPORT + campaign-level for non-Search |
| `gads_conversions` | `(client_id, date, campaign_name, segment_value)` | conversion_action segment |
| `gads_gender` | `(client_id, date, campaign_name, segment_value)` | gender segment |

**GA4 (4 tables)**

| Table | Primary Key | Source |
|---|---|---|
| `ga4_totals` | `(client_id, date, property_id)` | GA4 date dimension only — exact totals, no double-count |
| `ga4_acquisition` | `(client_id, date, channel_group, medium, source, device, country, region, city)` | Session acquisition dimensions |
| `ga4_audience` | `(client_id, date, age, gender, country)` | userAgeBracket + userGender + country |
| `ga4_pages` | `(client_id, date, page_path, device)` | pagePath + deviceCategory |

**Search Console (5 tables)**

| Table | Primary Key | Source |
|---|---|---|
| `gsc_totals` | `(client_id, date)` | Property-level daily totals — accurate for chart |
| `gsc_queries` | `(client_id, date, query)` | Query-level breakdown |
| `gsc_pages` | `(client_id, date, page)` | Page-level breakdown |
| `gsc_countries` | `(client_id, date, country)` | Country-level breakdown |
| `gsc_devices` | `(client_id, date, device)` | Device-level breakdown |

**Meta Ads (2 tables)**

| Table | Primary Key | Source |
|---|---|---|
| `meta_totals` | `(client_id, date, campaign_name)` | Campaign-level daily aggregates |
| `meta_detail` | `(client_id, date, campaign_name, adset_name, ad_name)` | Ad set + ad level detail |

**App (3 tables)**

| Table | Primary Key | Notes |
|---|---|---|
| `clients` | `id TEXT` | Identity + share_token + layouts JSONB + configs JSONB |
| `datasource_config` | `client_id TEXT` | GA4 property_id, GSC site, Ads account, Meta account, PSI key + URLs |
| `team_members` | `(id)` | Admin users |

### Indexes

All date-based tables: composite index on `(client_id, date)` minimum. Dimension tables: composite index on full primary key.

### Data retention

Default query range: 180 days. AppScripts sync last 3 days daily (catch late API updates). `to` date is always yesterday — today's data is incomplete.

### Key column notes

- `ga4_totals.event_count` = `screenPageViews` (not GA4 eventCount — intentional proxy)
- `ga4_pages` includes `new_users`, `engagement_rate`, `avg_session_duration` — AppScript must write these (current repo version is outdated)
- `gads_detail`: drop `week`, `month`, `ctr`, `avg_cpc`, `conv_rate`, `cost_per_conversion` — computed at query time
- `datasource_config.ga4_property_id` is numeric (e.g. `123456789`), not display name

---

## Section 2: Vercel API Functions

### File structure

```
api/
  _db.js            — Neon serverless driver (@neondatabase/serverless, HTTP mode)
  _auth.js          — SYNC_KEY validation for POST endpoints
  gads.js           — GET: gads_totals + gads_detail + gads_conversions + gads_gender
  ga4.js            — GET: ga4_totals + ga4_acquisition + ga4_audience + ga4_pages
  gsc.js            — GET: gsc_totals + gsc_queries + gsc_pages + gsc_countries + gsc_devices
  meta.js           — GET: meta_totals + meta_detail
  app/
    client.js       — GET + PATCH: clients + datasource_config
    team.js         — GET: team_members
  sync/
    gads.js         — POST: upsert gads tables
    ga4.js          — POST: upsert ga4 tables
    gsc.js          — POST: upsert gsc tables
    meta.js         — POST: upsert meta tables
```

### GET endpoints (browser → Vercel)

All accept `client_id`, `from`, `to`, `prevFrom`, `prevTo`. Default `from` = `CURRENT_DATE - 180 days`, `to` = yesterday.

Each returns `{ current: {...}, previous: {...} }` — both periods in one response.

```
GET /api/gads?client_id=X&from=Y&to=Z&prevFrom=A&prevTo=B
GET /api/ga4?client_id=X&from=Y&to=Z&prevFrom=A&prevTo=B
GET /api/gsc?client_id=X&from=Y&to=Z&prevFrom=A&prevTo=B
GET /api/meta?client_id=X&from=Y&to=Z&prevFrom=A&prevTo=B
GET /api/app/client?client_id=X
GET /api/app/client?share_token=X
GET /api/app/team
PATCH /api/app/client
```

Response shape example (`/api/gads`):
```json
{
  "current":  { "totals": [...], "detail": [...], "conversions": [...], "gender": [...] },
  "previous": { "totals": [...], "detail": [...], "conversions": [...], "gender": [...] }
}
```

### POST endpoints (AppScript → Vercel)

Auth: `Authorization: Bearer {SYNC_KEY}` header.

```
POST /api/sync/gads
POST /api/sync/ga4
POST /api/sync/gsc
POST /api/sync/meta
```

Payload:
```json
{ "client_id": "avonetiq", "table": "gads_totals", "rows": [...] }
```

Upsert: `ON CONFLICT (...primary key...) DO UPDATE SET ...`

### Auth model

GET endpoints: security via Neon credentials never leaving Vercel server. Browser never has DB access. `client_id` scopes all data. Equivalent to current Supabase anon key model.

POST endpoints: `SYNC_KEY` stored in Vercel env var + AppScript Properties Service. Never in source code.

### Neon connection

`_db.js` uses `@neondatabase/serverless` HTTP mode — no persistent TCP connections, safe for serverless cold starts, no connection pool exhaustion.

### Clients realtime

Screen-home polls `GET /api/app/client` every 30 seconds. Replaces Supabase Realtime. SSE not used (incompatible with Vercel Serverless Function timeout limits).

### Layout save

`PATCH /api/app/client` — body: `{ client_id, layouts, configs }`. Postgres trigger on `clients` table only fires SSE/NOTIFY on identity column changes (name, logo_url, share_token), not on layouts/configs changes.

### Endpoint not found / datasource not configured

If `datasource_config` has null for a source (e.g., no GA4 property configured), endpoint returns `{ current: null, previous: null }` without querying Neon.

---

## Section 3: Frontend Refactor

### Files changed

```
app/index.html
app/assets/js/data-bridge.jsx       — major rewrite
app/assets/js/app.jsx               — remove _AUTH_SUPA
app/assets/components/screen-home.jsx — remove Realtime, add polling
```

### What is removed

- `<script src="supabase-js@2">` from index.html
- 4 Supabase client constants and `createClient()` calls
- `fetchPaged()` helper
- All `.from().select().eq().gte().lte()` Supabase query chains
- `_AUTH_SUPA`, `_APP_SUPA`, `window._layoutSupa`
- Supabase Realtime subscription in screen-home

### What is preserved unchanged

- All aggregate functions (`aggregateAds`, `aggregateGa4`, `aggregateMeta`, `aggregateGsc`)
- `buildData()` logic — only its parameters change
- `window.LIVE` public API — `useLive()`, `LiveProvider`, `fmt`
- All components — no changes outside data-bridge, app, screen-home

### New fetchAll

```js
async function fetchAll(clientId, from, to, prevFrom, prevTo) {
  const q = `client_id=${clientId}&from=${from}&to=${to}&prevFrom=${prevFrom}&prevTo=${prevTo}`;
  const results = await Promise.allSettled([
    fetch(`/api/gads?${q}`).then(r => r.json()),
    fetch(`/api/ga4?${q}`).then(r => r.json()),
    fetch(`/api/gsc?${q}`).then(r => r.json()),
    fetch(`/api/meta?${q}`).then(r => r.json()),
    fetch(`/api/app/client?client_id=${clientId}`).then(r => r.json()),
  ]);
  const [gads, ga4, gsc, meta, app] = results.map(r =>
    r.status === 'fulfilled' ? r.value : null
  );
  return buildData(gads, ga4, gsc, meta, app, from, to, prevFrom, prevTo);
}
```

`Promise.allSettled` — partial failure safe. One datasource down does not break the others.

### client_id source

`clientId` comes from selected client in `clients` table, loaded via `/api/app/client`. Exposed through `useLive()` as `clientId` + `setClientId`. Replaces separate `account`, `ga4Property`, `gscProperty` state variables.

### PSI flow

PSI API key from `appRes.datasource_config.psi_api_key`. Browser calls PSI API directly. No database storage of PSI results.

### Share token

`GET /api/app/client?share_token={token}` — endpoint supports both `client_id` and `share_token` as lookup params.

---

## Section 4: AppScript Standardization

### File changes

```
DELETE:  psi_sync.js
DELETE:  google_apps_script.js
RENAME:  google_ads_script.js → gads_sync.js  (full rewrite)
REWRITE: ga4_sync.js
REWRITE: gsc_sync.js
CREATE:  meta_sync.js
```

### Two runtime environments

| Script | Runtime | SYNC_KEY storage |
|---|---|---|
| `gads_sync.js` | Google Ads Scripts (MccApp) | Plain variable in script |
| `ga4_sync.js` | Google Apps Script | `PropertiesService.getScriptProperties()` |
| `gsc_sync.js` | Google Apps Script | `PropertiesService.getScriptProperties()` |
| `meta_sync.js` | Google Apps Script | `PropertiesService.getScriptProperties()` |

### Standard CFG (Apps Script)

```js
var CFG = {
  vercelUrl: 'https://reportive.avonetiq.com',
  syncKey: PropertiesService.getScriptProperties().getProperty('SYNC_KEY'),
};
```

### Standard _sync function (Apps Script)

```js
function _sync(source, table, rows, clientId) {
  if (!rows.length) return;
  var url = CFG.vercelUrl + '/api/sync/' + source;
  for (var i = 0; i < rows.length; i += 500) {
    var res = UrlFetchApp.fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + CFG.syncKey
      },
      payload: JSON.stringify({ client_id: clientId, table: table, rows: rows.slice(i, i + 500) }),
      muteHttpExceptions: true
    });
    if (res.getResponseCode() >= 400)
      Logger.log('Sync error [' + table + ']: ' + res.getContentText().slice(0, 200));
  }
}
```

### Standard date range function (all scripts)

```js
function _range(daysBack) {
  var yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  var from = new Date(yesterday);
  from.setDate(from.getDate() - (daysBack - 1));
  return { from: _fmt(from), to: _fmt(yesterday) };
}
```

Daily sync: `_range(3)`. Backfill: `_range(180)`. `to` is always yesterday.

### Code style

No comments, no section titles, no inline explanations. Pure functional code only.

### Trigger schedule — all scripts daily 07:00 WIB

```js
function createAllTriggers() {
  ScriptApp.getProjectTriggers().forEach(function(t) { ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('syncDaily').timeBased().everyDays(1).atHour(7).create();
}
```

Google Ads Script: set schedule daily 07:00 via Google Ads → Tools → Scripts → Schedule.

### gads_sync.js changes vs current script

- ADD: `fetchCampaignTotals()` using `CAMPAIGN_PERFORMANCE_REPORT` → writes to `gads_totals`
- KEEP: keyword + campaign-level detail → writes to `gads_detail`
- SPLIT segments: gender only → `gads_gender`; conversion_action only → `gads_conversions`
- DROP: age segments, geo segments (not read by frontend)
- DROP: `week`, `month`, `ctr`, `avg_cpc`, `conv_rate`, `cost_per_conversion` columns
- RENAME: `day` → `date`
- ADD: `CLIENT_MAP` object mapping account name → `client_id`

### ga4_sync.js changes

- RENAME: `ga4_totals` stays, `ga4_sessions` → `ga4_acquisition`, `ga4_demographics` → `ga4_audience`
- ADD: missing metrics to `ga4_pages` (`new_users`, `engagement_rate`, `avg_session_duration`)
- ADD: `client_id` to all rows (mapped from `property_id` via config)
- RENAME: `day` → `date` in all rows

### Table mapping summary

| Old table | New table | Script |
|---|---|---|
| `google_ads` | `gads_detail` | gads_sync |
| *(none)* | `gads_totals` | gads_sync |
| `google_ads_seg` (gender) | `gads_gender` | gads_sync |
| `google_ads_seg` (conv) | `gads_conversions` | gads_sync |
| `ga4_totals` | `ga4_totals` | ga4_sync |
| `ga4_sessions` | `ga4_acquisition` | ga4_sync |
| `ga4_demographics` | `ga4_audience` | ga4_sync |
| `ga4_pages` | `ga4_pages` | ga4_sync |
| `search_console_summary` | `gsc_totals` | gsc_sync |
| `search_console_daily` | `gsc_queries` | gsc_sync |
| `search_console_pages` | `gsc_pages` | gsc_sync |
| `search_console_countries` | `gsc_countries` | gsc_sync |
| `search_console_devices` | `gsc_devices` | gsc_sync |
| `meta_ads_daily` | `meta_totals` | meta_sync |
| `meta_ads_insights` | `meta_detail` | meta_sync |
| `pagespeed` | *(removed)* | — |
| `ads_data` | *(removed)* | — |

---

## Section 5: Migration Strategy

### Approach

Big bang with parallel write safety net. Frontend switches all at once after data is verified in Neon. No hybrid data-bridge required.

### Phase 1: Infrastructure setup

1. Create Neon database
2. Run schema SQL — 19 tables with indexes
3. Deploy Vercel API Functions
4. Set env vars: `NEON_DATABASE_URL`, `SYNC_KEY` in Vercel dashboard
5. Test all GET and POST endpoints via Postman before touching frontend

### Phase 2: AppScript parallel write

Rewrite all 4 scripts to write to both Supabase (legacy) and Neon via Vercel simultaneously. Frontend unchanged — dashboard continues running on Supabase.

```js
function _syncBoth(source, table, rows, clientId) {
  _syncLegacy(table, rows);   // existing Supabase REST POST — unchanged from current script
  _sync(source, table, rows, clientId);
}
```

### Phase 3: Historical backfill (180 days)

Run once per script with `_range(180)`. Order: gads → ga4 → gsc → meta.

Apps Script 6-minute limit handled by existing `_isTimeSafe()` guards — run multiple times until complete.

After backfill: verify row counts. Neon must have ≥ Supabase rows per table.

### Phase 3b: App data migration

| Data | Method |
|---|---|
| `clients` | CSV export Supabase → import Neon |
| `report_layouts` / layouts+configs in clients | CSV export → import |
| `team_members` | CSV export → import |
| `datasource_config` | Re-enter manually (GA4 property ID, GSC site, Meta account, PSI key) |

### Phase 4: Frontend cutover

Single Vercel deploy with new data-bridge, index.html, app.jsx, screen-home.jsx.

Post-deploy monitoring (30 minutes):
- All KPI cards load correctly
- Layout save/load works
- Polling clients works
- Share token links work

### Phase 5: Cleanup (2 weeks after cutover)

- Remove parallel write from AppScripts — `_syncBoth` → `_sync` only
- Close 4 Supabase projects
- Remove all Supabase constants from codebase

### Rollback plan

If critical issue post-cutover: `git revert` data-bridge → Vercel deploy → dashboard back on Supabase in < 2 minutes. No data loss — AppScripts were writing to both during transition.

---

## Decisions Log

| Decision | Rationale |
|---|---|
| Vercel API Functions as proxy | Browser never touches Neon; credentials server-side only |
| Polling (30s) over SSE | Vercel Serverless incompatible with persistent SSE connections |
| Big bang cutover | Hybrid data-bridge more complex than the risk it mitigates |
| `*_totals` naming | Clearly communicates aggregated data vs dimension breakdowns |
| `gads_totals` separate from `gads_detail` | Google Ads campaign-level ≠ SUM(keyword-level) due to DSA |
| `meta_totals` + `meta_detail` | Consistent pattern; same API call aggregated two ways |
| `ga4_audience` (not `ga4_demographics`) | Contains age + gender + country — broader than demographics |
| `ga4_acquisition` (not `ga4_sessions`) | Content is channel/source breakdown, not session totals |
| PSI removed from DB | Measurements are on-demand; API key stored in datasource_config |
| 180-day default window | Storage efficiency on paid Neon; covers all meaningful analysis ranges |
| No comments in scripts | Professional clean code standard for this project |
| All triggers daily 07:00 WIB | Consistent schedule; yesterday cutoff ensures complete data |
