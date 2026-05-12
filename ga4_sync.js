// ===========================================================================
// GA4 -> Supabase Sync - Final
// ===========================================================================
// Tabel yang diisi:
//   ga4_totals       - 1 baris per (property, date) -> dipakai dashboard utama
//   ga4_sessions     - granular per (channel/medium/source/device/country/city)
//   ga4_demographics - breakdown usia & gender
//   ga4_pages        - breakdown per halaman
//
// Trigger (pisah agar tidak timeout):
//   syncTotalsDaily()        -> setiap hari jam 07:00  (cepat, critical)
//   syncSessionsDaily()      -> setiap hari jam 07:30  (granular, lebih lambat)
//   syncDemographicsWeekly() -> setiap Senin jam 08:00 (opsional)
//   syncPagesWeekly()        -> setiap Senin jam 08:30 (opsional)
//
// Setup:
//   1. Paste script ini ke script.google.com
//   2. Jalankan testConnection() -> authorize
//   3. Jalankan syncHistoricalTotals() untuk backfill 3 bulan
//   4. Jalankan createAllTriggers() untuk setup trigger otomatis
// ===========================================================================

var CFG = {
  supaUrl     : 'https://dpthobkylyuajaleykyf.supabase.co',
  supaKey     : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwdGhvYmt5bHl1YWphbGV5a3lmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4MzkxMDYsImV4cCI6MjA5MjQxNTEwNn0.eGomVe5yQDecapanuMG08LdXRrw0Z5vkZdJyVgEQlE8',
  ga4Data     : 'https://analyticsdata.googleapis.com/v1beta/properties/',
  ga4Admin    : 'https://analyticsadmin.googleapis.com/v1beta/accountSummaries',
  maxRuntimeMs: 300000  // Apps Script limit 6 menit; stop di 5 menit
};

// -- Time guard ---------------------------------------------------------------
var _startTime;
function _startTimer() { _startTime = Date.now(); }
function _isTimeSafe()  { return (Date.now() - _startTime) < CFG.maxRuntimeMs; }

// -- Ambil semua property {id, name} -----------------------------------------
function _getPropertyIds() {
  var token     = ScriptApp.getOAuthToken();
  var props     = [];
  var pageToken = null;

  do {
    var url = CFG.ga4Admin + (pageToken ? '?pageToken=' + pageToken : '');
    var res = UrlFetchApp.fetch(url, {
      headers           : { Authorization: 'Bearer ' + token },
      muteHttpExceptions: true
    });
    var code = res.getResponseCode();
    if (code !== 200) {
      Logger.log('Admin API error (' + code + '): ' + res.getContentText().slice(0, 300));
      break;
    }
    var body = JSON.parse(res.getContentText());
    (body.accountSummaries || []).forEach(function(acc) {
      (acc.propertySummaries || []).forEach(function(p) {
        props.push({ id: p.property.replace('properties/', ''), name: p.displayName });
      });
    });
    pageToken = body.nextPageToken || null;
  } while (pageToken);

  Logger.log('Properties ditemukan: ' + props.length);
  props.forEach(function(p) { Logger.log('  [' + p.id + '] ' + p.name); });
  return props;
}

// -- GA4 Data API (dengan pagination) ----------------------------------------
function _report(propertyId, dateRange, dimensions, metrics) {
  var token    = ScriptApp.getOAuthToken();
  var allRows  = [];
  var pageSize = 10000;
  var offset   = 0;

  while (true) {
    var res = UrlFetchApp.fetch(CFG.ga4Data + propertyId + ':runReport', {
      method            : 'POST',
      headers           : { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      payload           : JSON.stringify({
        dateRanges   : [{ startDate: dateRange.startDate, endDate: dateRange.endDate }],
        dimensions   : dimensions.map(function(n) { return { name: n }; }),
        metrics      : metrics.map(function(n)    { return { name: n }; }),
        limit        : pageSize,
        offset       : offset,
        keepEmptyRows: false
      }),
      muteHttpExceptions: true
    });

    if (res.getResponseCode() !== 200) {
      Logger.log('Data API error [' + propertyId + ']: ' + res.getContentText().slice(0, 300));
      break;
    }

    var body = JSON.parse(res.getContentText());
    if (!body.rows || body.rows.length === 0) break;

    body.rows.forEach(function(row) {
      var obj = {};
      dimensions.forEach(function(n, i) { obj[n] = row.dimensionValues[i].value; });
      metrics.forEach(function(n, i)    { obj[n] = row.metricValues[i].value; });
      allRows.push(obj);
    });

    offset += pageSize;
    if (offset >= (body.rowCount || 0) || body.rows.length < pageSize) break;
  }

  return allRows;
}

// -- Upsert ke Supabase -------------------------------------------------------
function _upsert(table, rows) {
  if (!rows.length) return;
  var conflictKeys = {
    'ga4_totals'      : 'property_id,date',
    'ga4_sessions'    : 'property_id,date,channel_group,medium,source,device,country,region,city',
    'ga4_demographics': 'property_id,date,age,gender,country',
    'ga4_pages'       : 'property_id,date,page_path,device'
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
function _isoDate(s) { return s.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'); }
function _fmt(d)     { return Utilities.formatDate(d, 'UTC', 'yyyy-MM-dd'); }

function _range(daysBack) {
  var today     = new Date();
  var yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  var start     = new Date(today); start.setDate(today.getDate() - daysBack);
  return { startDate: _fmt(start), endDate: _fmt(yesterday) };
}

// -- Sync ga4_totals ----------------------------------------------------------
// Fetch tanpa dimensi breakdown -> angka TEPAT seperti GA4 dashboard.
// SUM dari data granular akan double-count user multi-device/channel.
function _syncTotals(prop, range) {
  var rows = _report(prop.id, range,
    ['date'],
    ['activeUsers', 'newUsers', 'sessions', 'engagedSessions',
     'bounceRate', 'engagementRate', 'averageSessionDuration', 'screenPageViews']
  ).map(function(r) {
    return {
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
      event_count         : parseInt(r.screenPageViews)          || 0,
      synced_at           : new Date().toISOString()
    };
  });
  _upsert('ga4_totals', rows);
  Logger.log('[' + prop.id + '] ' + prop.name + ' -> totals: ' + rows.length + ' rows');
}

// -- Sync ga4_sessions --------------------------------------------------------
function _syncSessions(prop, range) {
  var rows = _report(prop.id, range,
    ['date', 'sessionPrimaryChannelGroup', 'sessionMedium', 'sessionSource',
     'deviceCategory', 'country', 'region', 'city'],
    ['activeUsers', 'newUsers', 'bounceRate', 'sessions',
     'averageSessionDuration', 'engagedSessions', 'engagementRate',
     'userEngagementDuration', 'eventCount']
  ).map(function(r) {
    var active = parseInt(r.activeUsers) || 0;
    var newU   = parseInt(r.newUsers)    || 0;
    return {
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
      bounce_rate             : parseFloat(r.bounceRate)             || 0,
      sessions                : parseInt(r.sessions)                 || 0,
      avg_session_duration    : parseFloat(r.averageSessionDuration) || 0,
      engaged_sessions        : parseInt(r.engagedSessions)          || 0,
      engagement_rate         : parseFloat(r.engagementRate)         || 0,
      user_engagement_duration: parseFloat(r.userEngagementDuration) || 0,
      event_count             : parseInt(r.eventCount)               || 0,
      synced_at               : new Date().toISOString()
    };
  });
  _upsert('ga4_sessions', rows);
  Logger.log('[' + prop.id + '] ' + prop.name + ' -> sessions: ' + rows.length + ' rows');
}

// -- Sync ga4_demographics ----------------------------------------------------
function _syncDemographics(prop, range) {
  var rows = _report(prop.id, range,
    ['date', 'userAgeBracket', 'userGender', 'country'],
    ['activeUsers', 'sessions', 'newUsers']
  ).map(function(r) {
    return {
      property_id  : prop.id,
      property_name: prop.name,
      date         : _isoDate(r.date),
      age          : r.userAgeBracket || '',
      gender       : r.userGender     || '',
      country      : r.country        || '',
      total_users  : parseInt(r.activeUsers) || 0,
      sessions     : parseInt(r.sessions)    || 0,
      new_users    : parseInt(r.newUsers)    || 0,
      synced_at    : new Date().toISOString()
    };
  });
  _upsert('ga4_demographics', rows);
  Logger.log('[' + prop.id + '] ' + prop.name + ' -> demographics: ' + rows.length + ' rows');
}

// -- Sync ga4_pages -----------------------------------------------------------
function _syncPages(prop, range) {
  var rows = _report(prop.id, range,
    ['date', 'pagePath', 'deviceCategory'],
    ['activeUsers', 'sessions', 'engagedSessions', 'bounceRate', 'screenPageViews']
  ).map(function(r) {
    return {
      property_id     : prop.id,
      property_name   : prop.name,
      date            : _isoDate(r.date),
      page_path       : r.pagePath       || '',
      device          : r.deviceCategory || '',
      total_users     : parseInt(r.activeUsers)     || 0,
      sessions        : parseInt(r.sessions)        || 0,
      engaged_sessions: parseInt(r.engagedSessions) || 0,
      bounce_rate     : parseFloat(r.bounceRate)    || 0,
      event_count     : parseInt(r.screenPageViews) || 0,
      synced_at       : new Date().toISOString()
    };
  });
  _upsert('ga4_pages', rows);
  Logger.log('[' + prop.id + '] ' + prop.name + ' -> pages: ' + rows.length + ' rows');
}

// ===========================================================================
// ENTRY POINTS
// ===========================================================================

function testConnection() {
  Logger.log('Testing Admin API...');
  _getPropertyIds();
}

// Totals: critical untuk dashboard, cepat (tidak ada breakdown dimensi)
function syncTotalsDaily() {
  _startTimer();
  var props = _getPropertyIds();
  var range = _range(3);
  Logger.log('syncTotalsDaily: ' + range.startDate + ' -> ' + range.endDate);
  for (var i = 0; i < props.length; i++) {
    if (!_isTimeSafe()) { Logger.log('WARNING: Time limit approaching, stopping.'); break; }
    try { _syncTotals(props[i], range); } catch(e) { Logger.log('ERR totals [' + props[i].id + ']: ' + e); }
  }
  Logger.log('OK: syncTotalsDaily selesai');
}

// Sessions: granular, trigger terpisah agar tidak timeout
function syncSessionsDaily() {
  _startTimer();
  var props = _getPropertyIds();
  var range = _range(3);
  Logger.log('syncSessionsDaily: ' + range.startDate + ' -> ' + range.endDate);
  for (var i = 0; i < props.length; i++) {
    if (!_isTimeSafe()) { Logger.log('WARNING: Time limit approaching, stopping.'); break; }
    try { _syncSessions(props[i], range); } catch(e) { Logger.log('ERR sessions [' + props[i].id + ']: ' + e); }
  }
  Logger.log('OK: syncSessionsDaily selesai');
}

// Demographics: mingguan
function syncDemographicsWeekly() {
  _startTimer();
  var props = _getPropertyIds();
  var range = _range(7);
  Logger.log('syncDemographicsWeekly: ' + range.startDate + ' -> ' + range.endDate);
  for (var i = 0; i < props.length; i++) {
    if (!_isTimeSafe()) { Logger.log('WARNING: Time limit approaching, stopping.'); break; }
    try { _syncDemographics(props[i], range); } catch(e) { Logger.log('ERR demographics [' + props[i].id + ']: ' + e); }
  }
  Logger.log('OK: syncDemographicsWeekly selesai');
}

// Pages: mingguan
function syncPagesWeekly() {
  _startTimer();
  var props = _getPropertyIds();
  var range = _range(7);
  Logger.log('syncPagesWeekly: ' + range.startDate + ' -> ' + range.endDate);
  for (var i = 0; i < props.length; i++) {
    if (!_isTimeSafe()) { Logger.log('WARNING: Time limit approaching, stopping.'); break; }
    try { _syncPages(props[i], range); } catch(e) { Logger.log('ERR pages [' + props[i].id + ']: ' + e); }
  }
  Logger.log('OK: syncPagesWeekly selesai');
}

// Backfill 3 bulan untuk totals (jalankan sekali)
function syncHistoricalTotals() {
  _startTimer();
  var props = _getPropertyIds();
  var range = _range(90);
  Logger.log('syncHistoricalTotals: ' + range.startDate + ' -> ' + range.endDate);
  for (var i = 0; i < props.length; i++) {
    if (!_isTimeSafe()) {
      Logger.log('WARNING: Time limit approaching. Jalankan ulang syncHistoricalTotals() untuk lanjutkan.');
      break;
    }
    try { _syncTotals(props[i], range); } catch(e) { Logger.log('ERR totals [' + props[i].id + ']: ' + e); }
  }
  Logger.log('OK: syncHistoricalTotals selesai');
}

// Backfill 3 bulan untuk sessions (jalankan sekali, mungkin perlu beberapa kali run)
function syncHistoricalSessions() {
  _startTimer();
  var props = _getPropertyIds();
  var range = _range(90);
  Logger.log('syncHistoricalSessions: ' + range.startDate + ' -> ' + range.endDate);
  for (var i = 0; i < props.length; i++) {
    if (!_isTimeSafe()) {
      Logger.log('WARNING: Time limit approaching. Jalankan ulang syncHistoricalSessions() untuk lanjutkan.');
      break;
    }
    try { _syncSessions(props[i], range); } catch(e) { Logger.log('ERR sessions [' + props[i].id + ']: ' + e); }
  }
  Logger.log('OK: syncHistoricalSessions selesai');
}

// Setup semua trigger otomatis (jalankan sekali)
function createAllTriggers() {
  ScriptApp.getProjectTriggers().forEach(function(t) { ScriptApp.deleteTrigger(t); });

  ScriptApp.newTrigger('syncTotalsDaily')
    .timeBased().everyDays(1).atHour(7).create();

  ScriptApp.newTrigger('syncSessionsDaily')
    .timeBased().everyDays(1).atHour(7).nearMinute(30).create();

  ScriptApp.newTrigger('syncDemographicsWeekly')
    .timeBased().onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(8).create();

  ScriptApp.newTrigger('syncPagesWeekly')
    .timeBased().onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(8).nearMinute(30).create();

  Logger.log('OK: Semua trigger aktif:');
  Logger.log('  syncTotalsDaily        -> setiap hari 07:00');
  Logger.log('  syncSessionsDaily      -> setiap hari 07:30');
  Logger.log('  syncDemographicsWeekly -> setiap Senin 08:00');
  Logger.log('  syncPagesWeekly        -> setiap Senin 08:30');
}
