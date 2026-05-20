# Neon Migration — Plan B: AppScript Rewrites

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite all 4 data-sync scripts to push to Neon via Vercel API endpoints instead of Supabase. Add parallel write safety net (`_syncBoth`) during migration window. Delete obsolete scripts.

**Architecture:** Each script reads `CLIENT_ID`, `SYNC_KEY`, and `NEON_ENDPOINT` from Apps Script Properties Service (PropertiesService). All scripts share the same standard function interface. `gads_sync.js` runs in Google Ads Scripts (MccApp context) — all others run in Google Apps Script. One daily trigger per script, all at 02:00 UTC = 09:00 WIB. `to` date is always yesterday.

**Tech Stack:** Google Apps Script (V8 runtime), Google Ads Scripts (MccApp), UrlFetchApp, ScriptApp.getOAuthToken(), Vercel API endpoints from Plan A.

**Spec:** `docs/superpowers/specs/2026-05-21-neon-migration-design.md`

---

## File Map

```
ga4_sync.js           REWRITE — GA4 → Neon via /api/sync/ga4
gsc_sync.js           REWRITE — GSC → Neon via /api/sync/gsc
gads_sync.js          REWRITE (was google_ads_script.js) — Google Ads → Neon via /api/sync/gads
meta_sync.js          CREATE — Meta Ads → Neon via /api/sync/meta
google_apps_script.js DELETE — obsolete
psi_sync.js           DELETE — obsolete
```

---

## Standard Function Interface (all scripts)

Every script must implement these exact function names:

| Function | Purpose |
|---|---|
| `getConfig()` | Read CLIENT_ID, SYNC_KEY, NEON_ENDPOINT from PropertiesService |
| `syncAll()` | Main daily trigger function — syncs last 3 days, to = yesterday |
| `syncPeriod(from, to)` | Sync any date range — used for backfill |
| `pushRows(table, rows)` | POST batch to /api/sync/{source} via Neon endpoint |
| `testConnection()` | Verify API access; logs property/site/account list |
| `setupTrigger()` | Delete existing triggers, create one daily at 02:00 UTC |

---

## Task 1: Delete Obsolete Scripts

**Files:**
- Delete: `google_apps_script.js`
- Delete: `psi_sync.js`

- [ ] **Step 1: Delete files**

```bash
rm /Users/sleepanatomy/Documents/GitHub/reportive-dashboard/google_apps_script.js
rm /Users/sleepanatomy/Documents/GitHub/reportive-dashboard/psi_sync.js
```

- [ ] **Step 2: Commit**

```bash
git rm google_apps_script.js psi_sync.js
git commit -m "chore: delete obsolete google_apps_script.js and psi_sync.js"
```

---

## Task 2: Rewrite ga4_sync.js

**Files:**
- Rewrite: `ga4_sync.js`

Key changes from current version:
- `ga4_sessions` → `ga4_acquisition` (table rename + add returning_users)
- `ga4_demographics` → `ga4_audience`
- `ga4_pages` now includes `new_users`, `engagement_rate`, `avg_session_duration`
- Push to `/api/sync/ga4` instead of Supabase
- Single daily trigger at 02:00 UTC (not 4 separate triggers)
- `to` = yesterday (not `daysBack` calculated from today)
- `client_id` required in every row

- [ ] **Step 1: Overwrite ga4_sync.js**

Create `/Users/sleepanatomy/Documents/GitHub/reportive-dashboard/ga4_sync.js`:

```js
var GA4_DATA_API  = 'https://analyticsdata.googleapis.com/v1beta/properties/';
var GA4_ADMIN_API = 'https://analyticsadmin.googleapis.com/v1beta/accountSummaries';
var MAX_RUNTIME_MS = 300000;
var _startTime;

function getConfig() {
  var p = PropertiesService.getScriptProperties().getProperties();
  return {
    clientId    : p.CLIENT_ID    || '',
    syncKey     : p.SYNC_KEY     || '',
    neonEndpoint: p.NEON_ENDPOINT || 'https://reportive.avonetiq.com'
  };
}

function _startTimer()  { _startTime = Date.now(); }
function _isTimeSafe()  { return (Date.now() - _startTime) < MAX_RUNTIME_MS; }
function _isoDate(s)    { return s.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'); }
function _fmt(d)        { return Utilities.formatDate(d, 'UTC', 'yyyy-MM-dd'); }

function _yesterday() {
  var d = new Date();
  d.setDate(d.getDate() - 1);
  return _fmt(d);
}

function _dateFrom(daysBack) {
  var d = new Date();
  d.setDate(d.getDate() - daysBack);
  return _fmt(d);
}

function pushRows(table, rows) {
  if (!rows.length) return;
  var cfg = getConfig();
  for (var i = 0; i < rows.length; i += 500) {
    var res = UrlFetchApp.fetch(cfg.neonEndpoint + '/api/sync/ga4', {
      method            : 'POST',
      headers           : {
        'Content-Type' : 'application/json',
        'Authorization': 'Bearer ' + cfg.syncKey
      },
      payload           : JSON.stringify({ client_id: cfg.clientId, table: table, rows: rows.slice(i, i + 500) }),
      muteHttpExceptions: true
    });
    if (res.getResponseCode() >= 400)
      Logger.log('Sync error [' + table + ']: ' + res.getContentText().slice(0, 200));
  }
}

function _getPropertyIds() {
  var token     = ScriptApp.getOAuthToken();
  var props     = [];
  var pageToken = null;
  do {
    var url = GA4_ADMIN_API + (pageToken ? '?pageToken=' + pageToken : '');
    var res = UrlFetchApp.fetch(url, {
      headers: { Authorization: 'Bearer ' + token }, muteHttpExceptions: true
    });
    if (res.getResponseCode() !== 200) { Logger.log('Admin API error: ' + res.getContentText().slice(0, 200)); break; }
    var body = JSON.parse(res.getContentText());
    (body.accountSummaries || []).forEach(function(acc) {
      (acc.propertySummaries || []).forEach(function(p) {
        props.push({ id: p.property.replace('properties/', ''), name: p.displayName });
      });
    });
    pageToken = body.nextPageToken || null;
  } while (pageToken);
  return props;
}

function _report(propertyId, from, to, dimensions, metrics) {
  var token   = ScriptApp.getOAuthToken();
  var allRows = [];
  var offset  = 0;
  while (true) {
    var res = UrlFetchApp.fetch(GA4_DATA_API + propertyId + ':runReport', {
      method : 'POST',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      payload: JSON.stringify({
        dateRanges   : [{ startDate: from, endDate: to }],
        dimensions   : dimensions.map(function(n) { return { name: n }; }),
        metrics      : metrics.map(function(n)    { return { name: n }; }),
        limit        : 10000,
        offset       : offset,
        keepEmptyRows: false
      }),
      muteHttpExceptions: true
    });
    if (res.getResponseCode() !== 200) { Logger.log('Data API error [' + propertyId + ']: ' + res.getContentText().slice(0, 200)); break; }
    var body = JSON.parse(res.getContentText());
    if (!body.rows || !body.rows.length) break;
    body.rows.forEach(function(row) {
      var obj = {};
      dimensions.forEach(function(n, i) { obj[n] = row.dimensionValues[i].value; });
      metrics.forEach(function(n, i)    { obj[n] = row.metricValues[i].value; });
      allRows.push(obj);
    });
    offset += 10000;
    if (offset >= (body.rowCount || 0) || body.rows.length < 10000) break;
  }
  return allRows;
}

function _syncTotals(prop, from, to) {
  var clientId = getConfig().clientId;
  var rows = _report(prop.id, from, to,
    ['date'],
    ['activeUsers', 'newUsers', 'sessions', 'engagedSessions', 'bounceRate', 'engagementRate', 'averageSessionDuration', 'screenPageViews']
  ).map(function(r) {
    return {
      client_id           : clientId,
      property_id         : prop.id,
      property_name       : prop.name,
      date                : _isoDate(r.date),
      total_users         : parseInt(r.activeUsers)              || 0,
      new_users           : parseInt(r.newUsers)                 || 0,
      sessions            : parseInt(r.sessions)                 || 0,
      engaged_sessions    : parseInt(r.engagedSessions)          || 0,
      bounce_rate         : parseFloat(r.bounceRate)             || 0,
      engagement_rate     : parseFloat(r.engagementRate)         || 0,
      avg_session_duration: parseFloat(r.averageSessionDuration) || 0,
      event_count         : parseInt(r.screenPageViews)          || 0
    };
  });
  pushRows('ga4_totals', rows);
  Logger.log('[' + prop.id + '] totals: ' + rows.length);
}

function _syncAcquisition(prop, from, to) {
  var clientId = getConfig().clientId;
  var rows = _report(prop.id, from, to,
    ['date', 'sessionPrimaryChannelGroup', 'sessionMedium', 'sessionSource', 'deviceCategory', 'country', 'region', 'city'],
    ['activeUsers', 'newUsers', 'sessions', 'engagedSessions', 'bounceRate', 'engagementRate', 'averageSessionDuration', 'userEngagementDuration', 'eventCount']
  ).map(function(r) {
    var active = parseInt(r.activeUsers) || 0;
    var newU   = parseInt(r.newUsers)    || 0;
    return {
      client_id               : clientId,
      property_id             : prop.id,
      property_name           : prop.name,
      date                    : _isoDate(r.date),
      channel_group           : r.sessionPrimaryChannelGroup || '',
      medium                  : r.sessionMedium              || '',
      source                  : r.sessionSource              || '',
      device                  : r.deviceCategory             || '',
      country                 : r.country                    || '',
      region                  : r.region                     || '',
      city                    : r.city                       || '',
      total_users             : active,
      new_users               : newU,
      returning_users         : Math.max(0, active - newU),
      sessions                : parseInt(r.sessions)                 || 0,
      engaged_sessions        : parseInt(r.engagedSessions)          || 0,
      bounce_rate             : parseFloat(r.bounceRate)             || 0,
      engagement_rate         : parseFloat(r.engagementRate)         || 0,
      avg_session_duration    : parseFloat(r.averageSessionDuration) || 0,
      user_engagement_duration: parseFloat(r.userEngagementDuration) || 0,
      event_count             : parseInt(r.eventCount)               || 0
    };
  });
  pushRows('ga4_acquisition', rows);
  Logger.log('[' + prop.id + '] acquisition: ' + rows.length);
}

function _syncAudience(prop, from, to) {
  var clientId = getConfig().clientId;
  var rows = _report(prop.id, from, to,
    ['date', 'userAgeBracket', 'userGender', 'country'],
    ['activeUsers', 'sessions', 'newUsers']
  ).map(function(r) {
    return {
      client_id    : clientId,
      property_id  : prop.id,
      property_name: prop.name,
      date         : _isoDate(r.date),
      age          : r.userAgeBracket || '',
      gender       : r.userGender     || '',
      country      : r.country        || '',
      total_users  : parseInt(r.activeUsers) || 0,
      sessions     : parseInt(r.sessions)    || 0,
      new_users    : parseInt(r.newUsers)    || 0
    };
  });
  pushRows('ga4_audience', rows);
  Logger.log('[' + prop.id + '] audience: ' + rows.length);
}

function _syncPages(prop, from, to) {
  var clientId = getConfig().clientId;
  var rows = _report(prop.id, from, to,
    ['date', 'pagePath', 'deviceCategory'],
    ['activeUsers', 'newUsers', 'sessions', 'engagedSessions', 'bounceRate', 'engagementRate', 'averageSessionDuration', 'screenPageViews']
  ).map(function(r) {
    return {
      client_id           : clientId,
      property_id         : prop.id,
      property_name       : prop.name,
      date                : _isoDate(r.date),
      page_path           : r.pagePath       || '',
      device              : r.deviceCategory || '',
      total_users         : parseInt(r.activeUsers)     || 0,
      new_users           : parseInt(r.newUsers)        || 0,
      sessions            : parseInt(r.sessions)        || 0,
      engaged_sessions    : parseInt(r.engagedSessions) || 0,
      bounce_rate         : parseFloat(r.bounceRate)    || 0,
      engagement_rate     : parseFloat(r.engagementRate)         || 0,
      avg_session_duration: parseFloat(r.averageSessionDuration) || 0,
      event_count         : parseInt(r.screenPageViews) || 0
    };
  });
  pushRows('ga4_pages', rows);
  Logger.log('[' + prop.id + '] pages: ' + rows.length);
}

function syncPeriod(from, to) {
  _startTimer();
  var props = _getPropertyIds();
  Logger.log('syncPeriod: ' + from + ' -> ' + to + ' (' + props.length + ' properties)');
  for (var i = 0; i < props.length; i++) {
    if (!_isTimeSafe()) { Logger.log('Time limit reached — rerun syncPeriod to continue'); break; }
    try { _syncTotals(props[i], from, to); }      catch(e) { Logger.log('ERR totals [' + props[i].id + ']: ' + e); }
    try { _syncAcquisition(props[i], from, to); } catch(e) { Logger.log('ERR acquisition [' + props[i].id + ']: ' + e); }
    try { _syncAudience(props[i], from, to); }    catch(e) { Logger.log('ERR audience [' + props[i].id + ']: ' + e); }
    try { _syncPages(props[i], from, to); }       catch(e) { Logger.log('ERR pages [' + props[i].id + ']: ' + e); }
  }
  Logger.log('syncPeriod done');
}

function syncAll() {
  syncPeriod(_dateFrom(3), _yesterday());
}

function testConnection() {
  var props = _getPropertyIds();
  Logger.log('Properties: ' + props.length);
  props.forEach(function(p) { Logger.log('  [' + p.id + '] ' + p.name); });
}

function setupTrigger() {
  ScriptApp.getProjectTriggers().forEach(function(t) { ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('syncAll').timeBased().everyDays(1).atHour(2).create();
  Logger.log('Trigger set: syncAll daily at 02:00 UTC');
}
```

- [ ] **Step 2: Verify file saved**

```bash
wc -l ga4_sync.js
```

Expected: ~150+ lines. No error.

- [ ] **Step 3: Commit**

```bash
git add ga4_sync.js
git commit -m "feat: rewrite ga4_sync.js for Neon (ga4_acquisition, ga4_audience, new pages columns)"
```

---

## Task 3: Rewrite gsc_sync.js

**Files:**
- Rewrite: `gsc_sync.js`

Key changes from current version:
- `search_console_summary` → `gsc_totals`
- `search_console_daily` → `gsc_queries`
- `search_console_pages` → `gsc_pages`
- Add `gsc_countries` and `gsc_devices` (new tables)
- Remove `ctr` from breakdown tables (not in schema — only in `gsc_totals`)
- Push to `/api/sync/gsc` instead of Supabase
- `client_id` from PropertiesService
- `to` = yesterday (GSC data has 2-3 day lag, use `from = 4 days ago`)

- [ ] **Step 1: Overwrite gsc_sync.js**

Create `/Users/sleepanatomy/Documents/GitHub/reportive-dashboard/gsc_sync.js`:

```js
var GSC_SITES_API     = 'https://www.googleapis.com/webmasters/v3/sites';
var GSC_ANALYTICS_API = 'https://www.googleapis.com/webmasters/v3/sites/';
var MAX_RUNTIME_MS = 300000;
var _startTime;

function getConfig() {
  var p = PropertiesService.getScriptProperties().getProperties();
  return {
    clientId    : p.CLIENT_ID    || '',
    syncKey     : p.SYNC_KEY     || '',
    neonEndpoint: p.NEON_ENDPOINT || 'https://reportive.avonetiq.com'
  };
}

function _startTimer()  { _startTime = Date.now(); }
function _isTimeSafe()  { return (Date.now() - _startTime) < MAX_RUNTIME_MS; }
function _fmt(d)        { return Utilities.formatDate(d, 'UTC', 'yyyy-MM-dd'); }

function _yesterday() {
  var d = new Date();
  d.setDate(d.getDate() - 1);
  return _fmt(d);
}

function _dateFrom(daysBack) {
  var d = new Date();
  d.setDate(d.getDate() - daysBack);
  return _fmt(d);
}

function pushRows(table, rows) {
  if (!rows.length) return;
  var cfg = getConfig();
  for (var i = 0; i < rows.length; i += 500) {
    var res = UrlFetchApp.fetch(cfg.neonEndpoint + '/api/sync/gsc', {
      method            : 'POST',
      headers           : {
        'Content-Type' : 'application/json',
        'Authorization': 'Bearer ' + cfg.syncKey
      },
      payload           : JSON.stringify({ client_id: cfg.clientId, table: table, rows: rows.slice(i, i + 500) }),
      muteHttpExceptions: true
    });
    if (res.getResponseCode() >= 400)
      Logger.log('Sync error [' + table + ']: ' + res.getContentText().slice(0, 200));
  }
}

function _getSites() {
  var token = ScriptApp.getOAuthToken();
  var res   = UrlFetchApp.fetch(GSC_SITES_API, {
    headers: { Authorization: 'Bearer ' + token }, muteHttpExceptions: true
  });
  if (res.getResponseCode() !== 200) { Logger.log('Sites API error: ' + res.getContentText().slice(0, 200)); return []; }
  var body = JSON.parse(res.getContentText());
  return (body.siteEntry || [])
    .filter(function(s) { return s.permissionLevel !== 'siteUnverifiedUser'; })
    .map(function(s)    { return s.siteUrl; });
}

function _fetchAnalytics(siteUrl, from, to, dimensions) {
  var token    = ScriptApp.getOAuthToken();
  var allRows  = [];
  var startRow = 0;
  while (true) {
    var res = UrlFetchApp.fetch(GSC_ANALYTICS_API + encodeURIComponent(siteUrl) + '/searchAnalytics/query', {
      method            : 'POST',
      headers           : { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      payload           : JSON.stringify({ startDate: from, endDate: to, dimensions: dimensions, searchType: 'web', rowLimit: 25000, startRow: startRow }),
      muteHttpExceptions: true
    });
    if (res.getResponseCode() !== 200) { Logger.log('GSC API error [' + siteUrl + ']: ' + res.getContentText().slice(0, 200)); break; }
    var body = JSON.parse(res.getContentText());
    if (!body.rows || !body.rows.length) break;
    allRows = allRows.concat(body.rows);
    startRow += 25000;
    if (body.rows.length < 25000) break;
  }
  return allRows;
}

function _syncTotals(siteUrl, from, to) {
  var clientId = getConfig().clientId;
  var rows = _fetchAnalytics(siteUrl, from, to, ['date']).map(function(r) {
    return {
      client_id  : clientId,
      date       : r.keys[0],
      impressions: Math.round(r.impressions || 0),
      clicks     : Math.round(r.clicks      || 0),
      ctr        : parseFloat(r.ctr         || 0),
      position   : parseFloat(r.position    || 0)
    };
  });
  pushRows('gsc_totals', rows);
  Logger.log('[' + siteUrl + '] totals: ' + rows.length);
}

function _syncQueries(siteUrl, from, to) {
  var clientId = getConfig().clientId;
  var rows = _fetchAnalytics(siteUrl, from, to, ['date', 'query']).map(function(r) {
    return {
      client_id  : clientId,
      date       : r.keys[0],
      query      : r.keys[1],
      impressions: Math.round(r.impressions || 0),
      clicks     : Math.round(r.clicks      || 0),
      position   : parseFloat(r.position    || 0)
    };
  });
  pushRows('gsc_queries', rows);
  Logger.log('[' + siteUrl + '] queries: ' + rows.length);
}

function _syncPages(siteUrl, from, to) {
  var clientId = getConfig().clientId;
  var rows = _fetchAnalytics(siteUrl, from, to, ['date', 'page']).map(function(r) {
    return {
      client_id  : clientId,
      date       : r.keys[0],
      page       : r.keys[1],
      impressions: Math.round(r.impressions || 0),
      clicks     : Math.round(r.clicks      || 0),
      position   : parseFloat(r.position    || 0)
    };
  });
  pushRows('gsc_pages', rows);
  Logger.log('[' + siteUrl + '] pages: ' + rows.length);
}

function _syncCountries(siteUrl, from, to) {
  var clientId = getConfig().clientId;
  var rows = _fetchAnalytics(siteUrl, from, to, ['date', 'country']).map(function(r) {
    return {
      client_id  : clientId,
      date       : r.keys[0],
      country    : r.keys[1],
      impressions: Math.round(r.impressions || 0),
      clicks     : Math.round(r.clicks      || 0),
      position   : parseFloat(r.position    || 0)
    };
  });
  pushRows('gsc_countries', rows);
  Logger.log('[' + siteUrl + '] countries: ' + rows.length);
}

function _syncDevices(siteUrl, from, to) {
  var clientId = getConfig().clientId;
  var rows = _fetchAnalytics(siteUrl, from, to, ['date', 'device']).map(function(r) {
    return {
      client_id  : clientId,
      date       : r.keys[0],
      device     : r.keys[1],
      impressions: Math.round(r.impressions || 0),
      clicks     : Math.round(r.clicks      || 0),
      position   : parseFloat(r.position    || 0)
    };
  });
  pushRows('gsc_devices', rows);
  Logger.log('[' + siteUrl + '] devices: ' + rows.length);
}

function syncPeriod(from, to) {
  _startTimer();
  var sites = _getSites();
  Logger.log('syncPeriod: ' + from + ' -> ' + to + ' (' + sites.length + ' sites)');
  for (var i = 0; i < sites.length; i++) {
    if (!_isTimeSafe()) { Logger.log('Time limit reached — rerun syncPeriod to continue'); break; }
    try { _syncTotals(sites[i], from, to);    } catch(e) { Logger.log('ERR totals [' + sites[i] + ']: ' + e); }
    try { _syncQueries(sites[i], from, to);   } catch(e) { Logger.log('ERR queries [' + sites[i] + ']: ' + e); }
    try { _syncPages(sites[i], from, to);     } catch(e) { Logger.log('ERR pages [' + sites[i] + ']: ' + e); }
    try { _syncCountries(sites[i], from, to); } catch(e) { Logger.log('ERR countries [' + sites[i] + ']: ' + e); }
    try { _syncDevices(sites[i], from, to);   } catch(e) { Logger.log('ERR devices [' + sites[i] + ']: ' + e); }
  }
  Logger.log('syncPeriod done');
}

function syncAll() {
  syncPeriod(_dateFrom(4), _yesterday());
}

function testConnection() {
  var sites = _getSites();
  Logger.log('Sites: ' + sites.length);
  sites.forEach(function(s) { Logger.log('  ' + s); });
}

function setupTrigger() {
  ScriptApp.getProjectTriggers().forEach(function(t) { ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('syncAll').timeBased().everyDays(1).atHour(2).create();
  Logger.log('Trigger set: syncAll daily at 02:00 UTC');
}
```

- [ ] **Step 2: Verify file saved**

```bash
wc -l gsc_sync.js
```

Expected: ~140+ lines.

- [ ] **Step 3: Commit**

```bash
git add gsc_sync.js
git commit -m "feat: rewrite gsc_sync.js for Neon (gsc_totals/queries/pages/countries/devices)"
```

---

## Task 4: Rewrite google_ads_script.js → gads_sync.js

**Files:**
- Delete: `google_ads_script.js`
- Create: `gads_sync.js`

Important: `gads_sync.js` runs in Google Ads Scripts (MccApp context), NOT Google Apps Script. This means:
- No `ScriptApp.getOAuthToken()` — use `AdsApp` / `MccApp`
- No `PropertiesService` — use a `CONFIG` object with values hardcoded (sync key and endpoint set directly in script, updated when deploying)
- No `ScriptApp.newTrigger()` — triggers are set in the Google Ads Scripts UI
- MccApp.accounts() iterates over all child accounts
- `UrlFetchApp` works the same

Key changes from `google_ads_script.js`:
- Write to `gads_totals` (CAMPAIGN_PERFORMANCE_REPORT) — this table had no writer before
- Write to `gads_detail` (KEYWORDS_PERFORMANCE_REPORT)
- Write to `gads_gender` (GENDER_PERFORMANCE_REPORT)
- Write to `gads_conversions` (CAMPAIGN_PERFORMANCE_REPORT with conversion segment)
- Remove derived fields (`ctr`, `avg_cpc`, `conv_rate`, `cost_per_conversion`) — computed from raw metrics
- `campaign_type` from `campaign.advertising_channel_type`

- [ ] **Step 1: Delete google_ads_script.js**

```bash
git rm google_ads_script.js
git commit -m "chore: remove google_ads_script.js (replaced by gads_sync.js)"
```

- [ ] **Step 2: Create gads_sync.js**

Create `/Users/sleepanatomy/Documents/GitHub/reportive-dashboard/gads_sync.js`:

```js
var CONFIG = {
  clientId    : 'avonetiq',
  syncKey     : '',
  neonEndpoint: 'https://reportive.avonetiq.com',
  maxRuntimeMs: 25 * 60 * 1000
};

var _startTime;

function getConfig() { return CONFIG; }

function _startTimer()  { _startTime = new Date().getTime(); }
function _isTimeSafe()  { return (new Date().getTime() - _startTime) < CONFIG.maxRuntimeMs; }

function _fmt(d) {
  var y = d.getFullYear();
  var m = ('0' + (d.getMonth() + 1)).slice(-2);
  var dd = ('0' + d.getDate()).slice(-2);
  return y + '-' + m + '-' + dd;
}

function _yesterday() {
  var d = new Date();
  d.setDate(d.getDate() - 1);
  return _fmt(d);
}

function _dateFrom(daysBack) {
  var d = new Date();
  d.setDate(d.getDate() - daysBack);
  return _fmt(d);
}

function pushRows(table, rows) {
  if (!rows.length) return;
  var cfg = getConfig();
  for (var i = 0; i < rows.length; i += 500) {
    var res = UrlFetchApp.fetch(cfg.neonEndpoint + '/api/sync/gads', {
      method            : 'POST',
      contentType       : 'application/json',
      headers           : { 'Authorization': 'Bearer ' + cfg.syncKey },
      payload           : JSON.stringify({ client_id: cfg.clientId, table: table, rows: rows.slice(i, i + 500) }),
      muteHttpExceptions: true
    });
    if (res.getResponseCode() >= 400)
      Logger.log('Sync error [' + table + ']: ' + res.getContentText().slice(0, 200));
  }
}

function _gaqlDateRange(from, to) {
  return "segments.date >= '" + from + "' AND segments.date <= '" + to + "'";
}

function _syncTotals(account, from, to) {
  var clientId = getConfig().clientId;
  var accountName = account.getName();
  var rows = [];
  var query = account.report(
    "SELECT campaign.name, campaign.advertising_channel_type, segments.date, " +
    "metrics.cost_micros, metrics.impressions, metrics.clicks, metrics.conversions " +
    "FROM campaign WHERE " + _gaqlDateRange(from, to) + " AND campaign.status != 'REMOVED'"
  );
  var report = query.rows();
  while (report.hasNext()) {
    var r = report.next();
    rows.push({
      client_id    : clientId,
      date         : r['segments.date'],
      campaign_name: r['campaign.name']                       || '',
      campaign_type: r['campaign.advertising_channel_type']   || '',
      spend        : Math.round(parseInt(r['metrics.cost_micros'] || 0) / 10000) / 100,
      impressions  : parseInt(r['metrics.impressions']  || 0),
      clicks       : parseInt(r['metrics.clicks']       || 0),
      conversions  : parseFloat(r['metrics.conversions'] || 0)
    });
  }
  pushRows('gads_totals', rows);
  Logger.log('[' + accountName + '] totals: ' + rows.length);
}

function _syncDetail(account, from, to) {
  var clientId = getConfig().clientId;
  var accountName = account.getName();
  var rows = [];
  var query = account.report(
    "SELECT campaign.name, campaign.advertising_channel_type, ad_group.name, " +
    "ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type, " +
    "segments.device, segments.date, " +
    "metrics.cost_micros, metrics.impressions, metrics.clicks, metrics.conversions " +
    "FROM keyword_view WHERE " + _gaqlDateRange(from, to) + " AND campaign.status != 'REMOVED'"
  );
  var report = query.rows();
  while (report.hasNext()) {
    var r = report.next();
    rows.push({
      client_id    : clientId,
      date         : r['segments.date'],
      campaign_name: r['campaign.name']                       || '',
      campaign_type: r['campaign.advertising_channel_type']   || '',
      ad_group     : r['ad_group.name']                       || '',
      keyword      : r['ad_group_criterion.keyword.text']      || '',
      match_type   : r['ad_group_criterion.keyword.match_type'] || '',
      device       : r['segments.device']                     || '',
      spend        : Math.round(parseInt(r['metrics.cost_micros'] || 0) / 10000) / 100,
      impressions  : parseInt(r['metrics.impressions']  || 0),
      clicks       : parseInt(r['metrics.clicks']       || 0),
      conversions  : parseFloat(r['metrics.conversions'] || 0)
    });
  }
  pushRows('gads_detail', rows);
  Logger.log('[' + accountName + '] detail: ' + rows.length);
}

function _syncGender(account, from, to) {
  var clientId = getConfig().clientId;
  var accountName = account.getName();
  var rows = [];
  var query = account.report(
    "SELECT campaign.name, campaign.advertising_channel_type, ad_group_criterion.gender.type, " +
    "segments.date, metrics.cost_micros, metrics.impressions, metrics.clicks, metrics.conversions " +
    "FROM gender_view WHERE " + _gaqlDateRange(from, to) + " AND campaign.status != 'REMOVED'"
  );
  var report = query.rows();
  while (report.hasNext()) {
    var r = report.next();
    rows.push({
      client_id    : clientId,
      date         : r['segments.date'],
      campaign_name: r['campaign.name']                       || '',
      campaign_type: r['campaign.advertising_channel_type']   || '',
      segment_value: r['ad_group_criterion.gender.type']      || '',
      spend        : Math.round(parseInt(r['metrics.cost_micros'] || 0) / 10000) / 100,
      impressions  : parseInt(r['metrics.impressions']  || 0),
      clicks       : parseInt(r['metrics.clicks']       || 0),
      conversions  : parseFloat(r['metrics.conversions'] || 0)
    });
  }
  pushRows('gads_gender', rows);
  Logger.log('[' + accountName + '] gender: ' + rows.length);
}

function _syncConversions(account, from, to) {
  var clientId = getConfig().clientId;
  var accountName = account.getName();
  var rows = [];
  var query = account.report(
    "SELECT campaign.name, campaign.advertising_channel_type, segments.conversion_action_name, " +
    "segments.date, metrics.conversions, metrics.cost_per_conversion " +
    "FROM campaign WHERE " + _gaqlDateRange(from, to) +
    " AND campaign.status != 'REMOVED' AND metrics.conversions > 0"
  );
  var report = query.rows();
  while (report.hasNext()) {
    var r = report.next();
    rows.push({
      client_id         : clientId,
      date              : r['segments.date'],
      campaign_name     : r['campaign.name']                     || '',
      campaign_type     : r['campaign.advertising_channel_type'] || '',
      segment_value     : r['segments.conversion_action_name']   || '',
      conversions       : parseFloat(r['metrics.conversions']         || 0),
      cost_per_conversion: Math.round(parseInt(r['metrics.cost_per_conversion'] || 0) / 10000) / 100
    });
  }
  pushRows('gads_conversions', rows);
  Logger.log('[' + accountName + '] conversions: ' + rows.length);
}

function syncPeriod(from, to) {
  _startTimer();
  var accountIterator = MccApp.accounts().get();
  Logger.log('syncPeriod: ' + from + ' -> ' + to);
  while (accountIterator.hasNext()) {
    if (!_isTimeSafe()) { Logger.log('Time limit reached — rerun syncPeriod to continue'); break; }
    var account = accountIterator.next();
    MccApp.select(account);
    try { _syncTotals(account, from, to);      } catch(e) { Logger.log('ERR totals [' + account.getName() + ']: ' + e); }
    try { _syncDetail(account, from, to);      } catch(e) { Logger.log('ERR detail [' + account.getName() + ']: ' + e); }
    try { _syncGender(account, from, to);      } catch(e) { Logger.log('ERR gender [' + account.getName() + ']: ' + e); }
    try { _syncConversions(account, from, to); } catch(e) { Logger.log('ERR conversions [' + account.getName() + ']: ' + e); }
  }
  Logger.log('syncPeriod done');
}

function syncAll() {
  syncPeriod(_dateFrom(3), _yesterday());
}

function testConnection() {
  var it = MccApp.accounts().get();
  var count = 0;
  while (it.hasNext()) {
    var acc = it.next();
    Logger.log('  [' + acc.getCustomerId() + '] ' + acc.getName());
    count++;
  }
  Logger.log('Accounts: ' + count);
}
```

Note: `setupTrigger()` is not available in Google Ads Scripts — set the daily trigger in the Google Ads Scripts UI (Schedule → Daily).

- [ ] **Step 3: Commit**

```bash
git add gads_sync.js
git commit -m "feat: add gads_sync.js (MccApp, gads_totals/detail/gender/conversions)"
```

---

## Task 5: Create meta_sync.js

**Files:**
- Create: `meta_sync.js`

Meta Ads uses the Marketing API via UrlFetchApp with a long-lived access token stored in PropertiesService. The script reads all ad accounts accessible to the token, syncs `meta_totals` (campaign-level) and `meta_detail` (ad set + ad level).

- [ ] **Step 1: Create meta_sync.js**

Create `/Users/sleepanatomy/Documents/GitHub/reportive-dashboard/meta_sync.js`:

```js
var META_API = 'https://graph.facebook.com/v19.0/';
var MAX_RUNTIME_MS = 300000;
var _startTime;

function getConfig() {
  var p = PropertiesService.getScriptProperties().getProperties();
  return {
    clientId    : p.CLIENT_ID     || '',
    syncKey     : p.SYNC_KEY      || '',
    neonEndpoint: p.NEON_ENDPOINT || 'https://reportive.avonetiq.com',
    metaToken   : p.META_TOKEN    || '',
    adAccountId : p.AD_ACCOUNT_ID || ''
  };
}

function _startTimer()  { _startTime = Date.now(); }
function _isTimeSafe()  { return (Date.now() - _startTime) < MAX_RUNTIME_MS; }
function _fmt(d)        { return Utilities.formatDate(d, 'UTC', 'yyyy-MM-dd'); }

function _yesterday() {
  var d = new Date();
  d.setDate(d.getDate() - 1);
  return _fmt(d);
}

function _dateFrom(daysBack) {
  var d = new Date();
  d.setDate(d.getDate() - daysBack);
  return _fmt(d);
}

function pushRows(table, rows) {
  if (!rows.length) return;
  var cfg = getConfig();
  for (var i = 0; i < rows.length; i += 500) {
    var res = UrlFetchApp.fetch(cfg.neonEndpoint + '/api/sync/meta', {
      method            : 'POST',
      headers           : {
        'Content-Type' : 'application/json',
        'Authorization': 'Bearer ' + cfg.syncKey
      },
      payload           : JSON.stringify({ client_id: cfg.clientId, table: table, rows: rows.slice(i, i + 500) }),
      muteHttpExceptions: true
    });
    if (res.getResponseCode() >= 400)
      Logger.log('Sync error [' + table + ']: ' + res.getContentText().slice(0, 200));
  }
}

var META_FIELDS_TOTAL = [
  'campaign_name', 'spend', 'impressions', 'reach',
  'clicks', 'actions', 'action_values'
].join(',');

var META_FIELDS_DETAIL = [
  'campaign_name', 'adset_name', 'ad_name', 'spend', 'impressions', 'reach',
  'clicks', 'actions', 'action_values'
].join(',');

function _getActionValue(actions, actionType) {
  if (!actions) return 0;
  for (var i = 0; i < actions.length; i++) {
    if (actions[i].action_type === actionType) return parseFloat(actions[i].value) || 0;
  }
  return 0;
}

function _mapMetaRow(r, clientId) {
  var actions      = r.actions      || [];
  var actionValues = r.action_values || [];
  return {
    client_id              : clientId,
    date                   : r.date_start,
    campaign_name          : r.campaign_name                                              || '',
    spend                  : parseFloat(r.spend || 0),
    impressions            : parseInt(r.impressions    || 0),
    reach                  : parseInt(r.reach          || 0),
    link_clicks            : _getActionValue(actions, 'link_click'),
    landing_page_views     : _getActionValue(actions, 'landing_page_view'),
    leads                  : _getActionValue(actions, 'lead'),
    complete_registrations : _getActionValue(actions, 'complete_registration'),
    messaging_conv_started : _getActionValue(actions, 'onsite_conversion.messaging_conversation_started_7d'),
    contacts               : _getActionValue(actions, 'contact'),
    ig_profile_visits      : _getActionValue(actions, 'ig_business_profile_visit'),
    post_engagements       : _getActionValue(actions, 'post_engagement'),
    content_views          : _getActionValue(actions, 'view_content'),
    purchases              : _getActionValue(actions, 'purchase'),
    purchase_value         : _getActionValue(actionValues, 'purchase'),
    add_to_carts           : _getActionValue(actions, 'add_to_cart'),
    add_to_cart_value      : _getActionValue(actionValues, 'add_to_cart')
  };
}

function _fetchInsights(level, fields, from, to) {
  var cfg      = getConfig();
  var allRows  = [];
  var url      = META_API + 'act_' + cfg.adAccountId + '/insights?' + [
    'access_token=' + cfg.metaToken,
    'level=' + level,
    'time_increment=1',
    'time_range=' + encodeURIComponent(JSON.stringify({ since: from, until: to })),
    'fields=' + fields,
    'limit=500'
  ].join('&');

  while (url) {
    var res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    if (res.getResponseCode() !== 200) { Logger.log('Meta API error: ' + res.getContentText().slice(0, 200)); break; }
    var body = JSON.parse(res.getContentText());
    allRows = allRows.concat(body.data || []);
    url = (body.paging && body.paging.next) ? body.paging.next : null;
  }
  return allRows;
}

function _syncTotals(from, to) {
  var clientId = getConfig().clientId;
  var raw  = _fetchInsights('campaign', META_FIELDS_TOTAL, from, to);
  var rows = raw.map(function(r) { return _mapMetaRow(r, clientId); });
  pushRows('meta_totals', rows);
  Logger.log('meta_totals: ' + rows.length);
}

function _syncDetail(from, to) {
  var clientId = getConfig().clientId;
  var raw  = _fetchInsights('ad', META_FIELDS_DETAIL, from, to);
  var rows = raw.map(function(r) {
    var base = _mapMetaRow(r, clientId);
    base.adset_name = r.adset_name || '';
    base.ad_name    = r.ad_name    || '';
    return base;
  });
  pushRows('meta_detail', rows);
  Logger.log('meta_detail: ' + rows.length);
}

function syncPeriod(from, to) {
  _startTimer();
  Logger.log('syncPeriod: ' + from + ' -> ' + to);
  try { _syncTotals(from, to); } catch(e) { Logger.log('ERR totals: ' + e); }
  try { _syncDetail(from, to); } catch(e) { Logger.log('ERR detail: ' + e); }
  Logger.log('syncPeriod done');
}

function syncAll() {
  syncPeriod(_dateFrom(3), _yesterday());
}

function testConnection() {
  var cfg = getConfig();
  var res = UrlFetchApp.fetch(META_API + 'act_' + cfg.adAccountId + '?fields=name,currency&access_token=' + cfg.metaToken, { muteHttpExceptions: true });
  Logger.log('Meta account: ' + res.getContentText().slice(0, 200));
}

function setupTrigger() {
  ScriptApp.getProjectTriggers().forEach(function(t) { ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('syncAll').timeBased().everyDays(1).atHour(2).create();
  Logger.log('Trigger set: syncAll daily at 02:00 UTC');
}
```

- [ ] **Step 2: Commit**

```bash
git add meta_sync.js
git commit -m "feat: add meta_sync.js (meta_totals + meta_detail via Meta Marketing API)"
```

---

## Task 6: Verify All Scripts Have Standard Interface

- [ ] **Step 1: Check all standard functions exist in each script**

```bash
for f in ga4_sync.js gsc_sync.js gads_sync.js meta_sync.js; do
  echo "=== $f ==="
  grep -E "^function (getConfig|syncAll|syncPeriod|pushRows|testConnection|setupTrigger)" $f
done
```

Expected for ga4/gsc/meta — all 6 functions listed. For gads_sync.js — all except `setupTrigger` (unavailable in Google Ads Scripts context).

- [ ] **Step 2: Check no Supabase references remain**

```bash
grep -r "supabase\|supaUrl\|supaKey" ga4_sync.js gsc_sync.js gads_sync.js meta_sync.js
```

Expected: no matches.

- [ ] **Step 3: Final commit**

```bash
git add -A && git status
```

Confirm only `ga4_sync.js`, `gsc_sync.js`, `gads_sync.js`, `meta_sync.js` are present (no `google_ads_script.js`, `google_apps_script.js`, `psi_sync.js`). Then:

```bash
git commit -m "feat: Plan B complete — all AppScripts rewritten for Neon"
```
