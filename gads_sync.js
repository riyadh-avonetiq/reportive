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
