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
