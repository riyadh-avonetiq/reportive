// ===========================================================================
// Google Search Console -> Supabase Sync
// ===========================================================================
// Tabel yang diisi:
//   search_console_summary - 1 baris per (property, date) -> dashboard utama
//   search_console_daily   - per (property, date, query)  -> top queries table
//
// Kunci akurasi vs GSC dashboard:
//   searchType: 'web'  -> hanya Web search (bukan Image/Video/News)
//   dimensions: ['date'] untuk summary -> angka tepat, tidak ada double-count
//
// Trigger:
//   syncSummaryDaily()  -> setiap hari jam 08:00 (critical)
//   syncQueriesDaily()  -> setiap hari jam 08:30
//
// Setup:
//   1. Paste ke script.google.com
//   2. Jalankan testConnection() -> authorize
//   3. Jalankan syncHistoricalSummary() untuk backfill 3 bulan
//   4. Jalankan createAllTriggers()
// ===========================================================================

var CFG = {
  supaUrl     : 'https://dmnnscedufbsphvrrors.supabase.co',
  supaKey     : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtbm5zY2VkdWZic3BodnJyb3JzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2OTg5NTEsImV4cCI6MjA5MjI3NDk1MX0.CDkwYfwi6h8DqNOZL8d9MPoBYUJmc77tOrubobM4vrg',
  gscSites    : 'https://www.googleapis.com/webmasters/v3/sites',
  gscAnalytics: 'https://www.googleapis.com/webmasters/v3/sites/',
  maxRuntimeMs: 300000
};

// -- Time guard ---------------------------------------------------------------
var _startTime;
function _startTimer() { _startTime = Date.now(); }
function _isTimeSafe()  { return (Date.now() - _startTime) < CFG.maxRuntimeMs; }

// -- Ambil semua verified sites -----------------------------------------------
function _getSites() {
  var token = ScriptApp.getOAuthToken();
  var res   = UrlFetchApp.fetch(CFG.gscSites, {
    headers           : { Authorization: 'Bearer ' + token },
    muteHttpExceptions: true
  });
  if (res.getResponseCode() !== 200) {
    Logger.log('Sites API error: ' + res.getContentText().slice(0, 300));
    return [];
  }
  var body  = JSON.parse(res.getContentText());
  var sites = (body.siteEntry || [])
    .filter(function(s) { return s.permissionLevel !== 'siteUnverifiedUser'; })
    .map(function(s)    { return { url: s.siteUrl }; });
  Logger.log('Sites ditemukan: ' + sites.length);
  sites.forEach(function(s) { Logger.log('  ' + s.url); });
  return sites;
}

// -- GSC Search Analytics API (dengan pagination) ----------------------------
function _fetchAnalytics(siteUrl, dateRange, dimensions) {
  var token    = ScriptApp.getOAuthToken();
  var allRows  = [];
  var startRow = 0;
  var rowLimit = 25000;

  while (true) {
    var encoded = encodeURIComponent(siteUrl);
    var res = UrlFetchApp.fetch(CFG.gscAnalytics + encoded + '/searchAnalytics/query', {
      method            : 'POST',
      headers           : { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      payload           : JSON.stringify({
        startDate : dateRange.startDate,
        endDate   : dateRange.endDate,
        dimensions: dimensions,
        searchType: 'web',   // cocok dengan default GSC dashboard
        rowLimit  : rowLimit,
        startRow  : startRow
      }),
      muteHttpExceptions: true
    });

    if (res.getResponseCode() !== 200) {
      Logger.log('GSC API error [' + siteUrl + ']: ' + res.getContentText().slice(0, 300));
      break;
    }

    var body = JSON.parse(res.getContentText());
    if (!body.rows || body.rows.length === 0) break;

    allRows = allRows.concat(body.rows);
    startRow += rowLimit;
    if (body.rows.length < rowLimit) break;
  }

  return allRows;
}

// -- Upsert ke Supabase -------------------------------------------------------
function _upsert(table, rows) {
  if (!rows.length) return;
  var conflictKeys = {
    'search_console_summary': 'property,date',
    'search_console_daily'  : 'property,date,query',
    'search_console_pages'  : 'property,date,page'
  };
  var qs = conflictKeys[table] ? '?on_conflict=' + conflictKeys[table] : '';

  for (var i = 0; i < rows.length; i += 500) {
    var res = UrlFetchApp.fetch(CFG.supaUrl + '/rest/v1/' + table + qs, {
      method            : 'POST',
      headers           : {
        apikey          : CFG.supaKey,
        Authorization   : 'Bearer ' + CFG.supaKey,
        'Content-Type'  : 'application/json',
        'Prefer'        : 'resolution=merge-duplicates,return=minimal'
      },
      payload           : JSON.stringify(rows.slice(i, i + 500)),
      muteHttpExceptions: true
    });
    if (res.getResponseCode() >= 400)
      Logger.log('Supabase error [' + table + ']: ' + res.getContentText().slice(0, 200));
  }
}

// -- Helpers ------------------------------------------------------------------
function _fmt(d)     { return Utilities.formatDate(d, 'UTC', 'yyyy-MM-dd'); }

function _range(daysBack) {
  var today     = new Date();
  // GSC data biasanya tersedia dengan delay 2-3 hari
  var endDate   = new Date(today); endDate.setDate(today.getDate() - 2);
  var startDate = new Date(today); startDate.setDate(today.getDate() - daysBack);
  return { startDate: _fmt(startDate), endDate: _fmt(endDate) };
}

// -- Sync search_console_summary ----------------------------------------------
// dimensions: ['date'] -> 1 baris per hari, angka TEPAT sama dengan GSC dashboard
// Ini source of truth untuk total clicks, impressions, CTR, position
function _syncSummary(site, range) {
  var rows = _fetchAnalytics(site.url, range, ['date']);
  var mapped = rows.map(function(r) {
    return {
      property   : site.url,
      date       : r.keys[0],
      clicks     : Math.round(r.clicks      || 0),
      impressions: Math.round(r.impressions || 0),
      ctr        : parseFloat(r.ctr         || 0),  // decimal 0-1
      position   : parseFloat(r.position    || 0),
      synced_at  : new Date().toISOString()
    };
  });
  _upsert('search_console_summary', mapped);
  Logger.log('[' + site.url + '] summary: ' + mapped.length + ' rows');
}

// -- Sync search_console_daily ------------------------------------------------
// dimensions: ['date', 'query'] -> top queries per hari
// Impressions di sini BERBEDA dari summary (bisa lebih besar karena 1 view bisa cocok banyak query)
// Hanya dipakai untuk tabel top queries, BUKAN untuk total impressions
function _syncQueries(site, range) {
  var rows = _fetchAnalytics(site.url, range, ['date', 'query']);
  var mapped = rows.map(function(r) {
    return {
      property   : site.url,
      date       : r.keys[0],
      query      : r.keys[1],
      clicks     : Math.round(r.clicks      || 0),
      impressions: Math.round(r.impressions || 0),
      ctr        : parseFloat(r.ctr         || 0),
      position   : parseFloat(r.position    || 0),
      synced_at  : new Date().toISOString()
    };
  });
  _upsert('search_console_daily', mapped);
  Logger.log('[' + site.url + '] queries: ' + mapped.length + ' rows');
}

// -- Sync search_console_pages ------------------------------------------------
// dimensions: ['date', 'page'] -> top landing pages per hari
function _syncPages(site, range) {
  var rows = _fetchAnalytics(site.url, range, ['date', 'page']);
  var mapped = rows.map(function(r) {
    return {
      property   : site.url,
      date       : r.keys[0],
      page       : r.keys[1],
      clicks     : Math.round(r.clicks      || 0),
      impressions: Math.round(r.impressions || 0),
      ctr        : parseFloat(r.ctr         || 0),
      position   : parseFloat(r.position    || 0),
      synced_at  : new Date().toISOString()
    };
  });
  _upsert('search_console_pages', mapped);
  Logger.log('[' + site.url + '] pages: ' + mapped.length + ' rows');
}

// ===========================================================================
// ENTRY POINTS
// ===========================================================================

function testConnection() {
  Logger.log('Testing GSC Sites API...');
  _getSites();
}

// Summary: critical untuk dashboard, sync setiap hari
function syncSummaryDaily() {
  _startTimer();
  var sites = _getSites();
  var range = _range(4);  // 4 hari untuk tangkap data yang telat masuk
  Logger.log('syncSummaryDaily: ' + range.startDate + ' -> ' + range.endDate);
  for (var i = 0; i < sites.length; i++) {
    if (!_isTimeSafe()) { Logger.log('WARNING: Time limit approaching, stopping.'); break; }
    try { _syncSummary(sites[i], range); } catch(e) { Logger.log('ERR summary [' + sites[i].url + ']: ' + e); }
  }
  Logger.log('OK: syncSummaryDaily selesai');
}

// Queries: untuk top queries table, sync setiap hari
function syncQueriesDaily() {
  _startTimer();
  var sites = _getSites();
  var range = _range(4);
  Logger.log('syncQueriesDaily: ' + range.startDate + ' -> ' + range.endDate);
  for (var i = 0; i < sites.length; i++) {
    if (!_isTimeSafe()) { Logger.log('WARNING: Time limit approaching, stopping.'); break; }
    try { _syncQueries(sites[i], range); } catch(e) { Logger.log('ERR queries [' + sites[i].url + ']: ' + e); }
  }
  Logger.log('OK: syncQueriesDaily selesai');
}

// Backfill 3 bulan summary (jalankan sekali)
function syncHistoricalSummary() {
  _startTimer();
  var sites = _getSites();
  var range = _range(90);
  Logger.log('syncHistoricalSummary: ' + range.startDate + ' -> ' + range.endDate);
  for (var i = 0; i < sites.length; i++) {
    if (!_isTimeSafe()) {
      Logger.log('WARNING: Time limit approaching. Jalankan ulang untuk lanjutkan.');
      break;
    }
    try { _syncSummary(sites[i], range); } catch(e) { Logger.log('ERR summary [' + sites[i].url + ']: ' + e); }
  }
  Logger.log('OK: syncHistoricalSummary selesai');
}

// Pages: untuk top landing pages table, sync setiap hari
function syncPagesDaily() {
  _startTimer();
  var sites = _getSites();
  var range = _range(4);
  Logger.log('syncPagesDaily: ' + range.startDate + ' -> ' + range.endDate);
  for (var i = 0; i < sites.length; i++) {
    if (!_isTimeSafe()) { Logger.log('WARNING: Time limit approaching, stopping.'); break; }
    try { _syncPages(sites[i], range); } catch(e) { Logger.log('ERR pages [' + sites[i].url + ']: ' + e); }
  }
  Logger.log('OK: syncPagesDaily selesai');
}

// Backfill 30 hari queries (lebih aman dari timeout)
function syncHistoricalQueriesShort() {
  _startTimer();
  var sites = _getSites();
  var range = _range(30);
  Logger.log('syncHistoricalQueriesShort: ' + range.startDate + ' -> ' + range.endDate);
  for (var i = 0; i < sites.length; i++) {
    if (!_isTimeSafe()) {
      Logger.log('WARNING: Time limit approaching. Jalankan ulang untuk lanjutkan.');
      break;
    }
    try { _syncQueries(sites[i], range); } catch(e) { Logger.log('ERR queries [' + sites[i].url + ']: ' + e); }
  }
  Logger.log('OK: syncHistoricalQueriesShort selesai');
}

// Backfill 3 bulan queries (jalankan sekali, mungkin perlu beberapa run)
function syncHistoricalQueries() {
  _startTimer();
  var sites = _getSites();
  var range = _range(90);
  Logger.log('syncHistoricalQueries: ' + range.startDate + ' -> ' + range.endDate);
  for (var i = 0; i < sites.length; i++) {
    if (!_isTimeSafe()) {
      Logger.log('WARNING: Time limit approaching. Jalankan ulang untuk lanjutkan.');
      break;
    }
    try { _syncQueries(sites[i], range); } catch(e) { Logger.log('ERR queries [' + sites[i].url + ']: ' + e); }
  }
  Logger.log('OK: syncHistoricalQueries selesai');
}

// Backfill 30 hari pages
function syncHistoricalPages() {
  _startTimer();
  var sites = _getSites();
  var range = _range(30);
  Logger.log('syncHistoricalPages: ' + range.startDate + ' -> ' + range.endDate);
  for (var i = 0; i < sites.length; i++) {
    if (!_isTimeSafe()) {
      Logger.log('WARNING: Time limit approaching. Jalankan ulang untuk lanjutkan.');
      break;
    }
    try { _syncPages(sites[i], range); } catch(e) { Logger.log('ERR pages [' + sites[i].url + ']: ' + e); }
  }
  Logger.log('OK: syncHistoricalPages selesai');
}

// Setup semua trigger otomatis (jalankan sekali)
function createAllTriggers() {
  ScriptApp.getProjectTriggers().forEach(function(t) { ScriptApp.deleteTrigger(t); });

  ScriptApp.newTrigger('syncSummaryDaily')
    .timeBased().everyDays(1).atHour(8).create();

  ScriptApp.newTrigger('syncQueriesDaily')
    .timeBased().everyDays(1).atHour(8).nearMinute(30).create();

  ScriptApp.newTrigger('syncPagesDaily')
    .timeBased().everyDays(1).atHour(9).create();

  Logger.log('OK: Trigger aktif:');
  Logger.log('  syncSummaryDaily  -> setiap hari 08:00');
  Logger.log('  syncQueriesDaily  -> setiap hari 08:30');
  Logger.log('  syncPagesDaily    -> setiap hari 09:00');
}
