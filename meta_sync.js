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
