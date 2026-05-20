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
