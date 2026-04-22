/**
 * Reportive by Avonetiq — Google Ads Script (v3.0 — Multi-Channel + Segments)
 *
 * Setup:
 * 1. Google Ads → Tools & Settings → Scripts → + → paste script ini
 * 2. Klik Preview untuk test (cek Logger apakah muncul baris untuk semua channel)
 * 3. Authorize → Run
 * 4. Set schedule: Daily, jam 07:00
 *
 * Pertama kali: set DAYS_BACK = 365 untuk backfill historis
 * Selanjutnya:  set DAYS_BACK = 1 untuk sync harian
 *
 * Tabel yang diisi:
 *   google_ads      — data utama per keyword/campaign/device (semua channel)
 *   google_ads_seg  — breakdown gender, age, geo (country/city), conversion action
 *
 * Channel di-pull via AWQL CAMPAIGN_PERFORMANCE_REPORT (semua channel didukung):
 *   - Search      → keyword-level (KEYWORDS_PERFORMANCE_REPORT)
 *   - Display     → campaign-level
 *   - YouTube     → campaign-level
 *   - Demand Gen  → campaign-level
 *   - Pmax        → campaign-level
 *   - Shopping    → campaign-level
 *
 * Segmen di-pull via GAQL (AdsApp.search):
 *   - Gender      → gender_view
 *   - Age         → age_range_view
 *   - Country     → geographic_view (country level)
 *   - City        → geographic_view (city level)
 *   - Conv action → campaign (dengan segments.conversion_action_name)
 */

var SUPABASE_URL         = 'https://qmzgincouzpbyfxfddxt.supabase.co';
var SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtemdpbmNvdXpwYnlmeGZkZHh0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjA1ODc1MCwiZXhwIjoyMDkxNjM0NzUwfQ.jNZHwuIgYafn8s2GKkmapeinYD7khedjICd3oIo1TKs';

var DAYS_BACK = 1; // ganti ke 365 untuk backfill pertama kali

// ── MAIN ──────────────────────────────────────────────────────
function main() {
  var range = getDateRange(DAYS_BACK);
  Logger.log('Date range: ' + range.from + ' → ' + range.to);

  var totalMainRows = 0;
  var totalSegRows  = 0;

  var accountIter = MccApp.accounts().get();
  while (accountIter.hasNext()) {
    var account = accountIter.next();
    MccApp.select(account);

    var accountName = account.getName();
    Logger.log('Processing: ' + accountName);

    // Ambil campaign type map: campaignId → rawType string dari Google Ads
    var campTypeMap = getCampaignTypeMap();
    Logger.log('  Campaigns found: ' + Object.keys(campTypeMap).length);

    // Klasifikasi campaign IDs berdasarkan channel (case-insensitive)
    var searchIds   = [];
    var otherIds    = [];  // Display, YouTube, Pmax, Demand Gen, Shopping → campaign-level

    Object.keys(campTypeMap).forEach(function(id) {
      var t = (campTypeMap[id] || '').toLowerCase().trim();
      if (t === 'search') {
        searchIds.push(id);
      } else if (t !== '') {
        otherIds.push(id);
      }
    });

    Logger.log('  Search IDs: ' + searchIds.length + ', Other IDs: ' + otherIds.length);

    var mainRows = [];

    // 1. Search → keyword-level (dengan device breakdown)
    if (searchIds.length > 0) {
      var kRows = fetchKeywordData(range.from, range.to, accountName, campTypeMap);
      Logger.log('  Search rows: ' + kRows.length);
      mainRows = mainRows.concat(kRows);
    }

    // 2. Semua channel lain → campaign-level (Display, YouTube, Pmax, DemandGen, Shopping)
    if (otherIds.length > 0) {
      var cRows = fetchCampaignLevelData(range.from, range.to, accountName, campTypeMap, otherIds);
      Logger.log('  Other channel rows: ' + cRows.length);
      mainRows = mainRows.concat(cRows);
    }

    Logger.log('  Total main rows (before dedup): ' + mainRows.length);

    // Dedup — cegah error 21000 jika ada baris dengan key identik dalam batch
    mainRows = deduplicateRows(mainRows, function(r) {
      return [r.day, r.account_name, r.campaign_name,
              r.ad_group, r.keyword, r.match_type, r.device].join('|');
    });
    Logger.log('  Total main rows (after dedup): ' + mainRows.length);

    if (mainRows.length > 0) {
      pushToSupabase('google_ads', mainRows, 'day,account_name,campaign_name,ad_group,keyword,match_type,device');
      totalMainRows += mainRows.length;
    }

    // 3. Segmen (GAQL) — hanya push jika ada campaign
    if (Object.keys(campTypeMap).length > 0) {
      var segRows = [];

      var genderRows = fetchGenderData(range.from, range.to, accountName, campTypeMap);
      Logger.log('  Gender rows: ' + genderRows.length);
      segRows = segRows.concat(genderRows);

      var ageRows = fetchAgeData(range.from, range.to, accountName, campTypeMap);
      Logger.log('  Age rows: ' + ageRows.length);
      segRows = segRows.concat(ageRows);

      var geoRows = fetchGeoData(range.from, range.to, accountName, campTypeMap);
      Logger.log('  Geo rows: ' + geoRows.length);
      segRows = segRows.concat(geoRows);

      var convRows = fetchConversionActionData(range.from, range.to, accountName, campTypeMap);
      Logger.log('  Conversion action rows: ' + convRows.length);
      segRows = segRows.concat(convRows);

      if (segRows.length > 0) {
        segRows = deduplicateSegRows(segRows);
        Logger.log('  Segment rows (after dedup): ' + segRows.length);
        pushToSupabase('google_ads_seg', segRows, 'day,account_name,campaign_name,segment_type,segment_value');
        totalSegRows += segRows.length;
      }
    }
  }

  Logger.log('=== Done: ' + totalMainRows + ' main rows, ' + totalSegRows + ' segment rows ===');
}

// ── Ambil campaign type map ────────────────────────────────────
function getCampaignTypeMap() {
  var map = {};
  var report = AdsApp.report(
    'SELECT CampaignId, CampaignName, AdvertisingChannelType ' +
    'FROM CAMPAIGN_PERFORMANCE_REPORT ' +
    'DURING LAST_30_DAYS'
  );
  var iter = report.rows();
  while (iter.hasNext()) {
    var r = iter.next();
    map[r['CampaignId']] = r['AdvertisingChannelType'] || '';
  }
  return map;
}

// Konversi raw channel type → label yang tampil di dashboard
function channelLabel(rawType) {
  var t = (rawType || '').toLowerCase().trim();
  if (t === 'search')                                    return 'Search';
  if (t === 'display')                                   return 'Display';
  if (t === 'video')                                     return 'YouTube';
  if (t === 'multi channel' || t === 'multi_channel')    return 'Performance Max';
  if (t === 'discovery')                                 return 'Demand Gen';
  if (t === 'shopping')                                  return 'Shopping';
  if (t === 'smart')                                     return 'Smart';
  return rawType || '';
}

// Normalisasi device string dari Google Ads
function normalizeDevice(raw) {
  var t = (raw || '').toLowerCase().trim();
  if (t === 'computers' || t === 'desktop')  return 'Desktop';
  if (t === 'mobile' || t === 'high_end_mobile' || t === 'mobile devices with full browsers') return 'Mobile';
  if (t === 'tablet' || t === 'tablet with full browser') return 'Tablet';
  if (t === 'connected_tv' || t === 'connectedtv') return 'Connected TV';
  return 'Other';
}

// ── 1. Search: KEYWORDS_PERFORMANCE_REPORT (dengan Device) ─────
function fetchKeywordData(dateFrom, dateTo, accountName, campTypeMap) {
  var awqlFrom = dateFrom.replace(/-/g, '');
  var awqlTo   = dateTo.replace(/-/g, '');

  var report = AdsApp.report(
    'SELECT ' +
      'Date, CampaignId, CampaignName, AdGroupName, ' +
      'Criteria, KeywordMatchType, Device, ' +
      'Cost, Impressions, Ctr, Clicks, AverageCpc, ' +
      'ConversionRate, Conversions, CostPerConversion ' +
    'FROM KEYWORDS_PERFORMANCE_REPORT ' +
    'WHERE CampaignStatus IN [ENABLED, PAUSED] ' +
    'DURING ' + awqlFrom + ',' + awqlTo
  );

  var rows = [];
  var iter = report.rows();
  while (iter.hasNext()) {
    var r      = iter.next();
    var day    = r['Date'];
    var campId = r['CampaignId'];
    rows.push({
      day:                 day,
      week:                getWeek(day),
      month:               day.substring(0, 7),
      account_name:        accountName,
      campaign_name:       r['CampaignName'],
      campaign_type:       channelLabel(campTypeMap[campId] || 'Search'),
      ad_group:            r['AdGroupName'],
      keyword:             r['Criteria'],
      match_type:          r['KeywordMatchType'],
      device:              normalizeDevice(r['Device']),
      spend:               parseMoney(r['Cost']),
      impressions:         parseInt(r['Impressions']) || 0,
      ctr:                 parsePct(r['Ctr']),
      clicks:              parseInt(r['Clicks']) || 0,
      avg_cpc:             parseMoney(r['AverageCpc']),
      conv_rate:           parsePct(r['ConversionRate']),
      conversions:         parseFloat(r['Conversions']) || 0,
      cost_per_conversion: parseMoney(r['CostPerConversion']),
    });
  }
  return rows;
}

// ── 2. Semua non-Search: CAMPAIGN_PERFORMANCE_REPORT (dengan Device) ──
function fetchCampaignLevelData(dateFrom, dateTo, accountName, campTypeMap, allowedIds) {
  var awqlFrom = dateFrom.replace(/-/g, '');
  var awqlTo   = dateTo.replace(/-/g, '');

  var allowed = {};
  allowedIds.forEach(function(id) { allowed[id] = true; });

  var report = AdsApp.report(
    'SELECT ' +
      'Date, CampaignId, CampaignName, Device, ' +
      'Cost, Impressions, Ctr, Clicks, AverageCpc, ' +
      'ConversionRate, Conversions, CostPerConversion ' +
    'FROM CAMPAIGN_PERFORMANCE_REPORT ' +
    'WHERE CampaignStatus IN [ENABLED, PAUSED] ' +
    'DURING ' + awqlFrom + ',' + awqlTo
  );

  var rows = [];
  var iter = report.rows();
  while (iter.hasNext()) {
    var r      = iter.next();
    var campId = r['CampaignId'];
    if (!allowed[campId]) continue;

    var day = r['Date'];
    rows.push({
      day:                 day,
      week:                getWeek(day),
      month:               day.substring(0, 7),
      account_name:        accountName,
      campaign_name:       r['CampaignName'],
      campaign_type:       channelLabel(campTypeMap[campId] || ''),
      ad_group:            '',
      keyword:             '',
      match_type:          '',
      device:              normalizeDevice(r['Device']),
      spend:               parseMoney(r['Cost']),
      impressions:         parseInt(r['Impressions']) || 0,
      ctr:                 parsePct(r['Ctr']),
      clicks:              parseInt(r['Clicks']) || 0,
      avg_cpc:             parseMoney(r['AverageCpc']),
      conv_rate:           parsePct(r['ConversionRate']),
      conversions:         parseFloat(r['Conversions']) || 0,
      cost_per_conversion: parseMoney(r['CostPerConversion']),
    });
  }
  return rows;
}

// ── 3. Gender (GAQL) ──────────────────────────────────────────
function fetchGenderData(dateFrom, dateTo, accountName, campTypeMap) {
  var gaql =
    'SELECT ' +
      'segments.date, campaign.id, campaign.name, ' +
      'ad_group_criterion.gender.type, ' +
      'metrics.cost_micros, metrics.impressions, metrics.clicks, ' +
      'metrics.conversions, metrics.cost_per_conversion ' +
    'FROM gender_view ' +
    'WHERE segments.date BETWEEN \'' + dateFrom + '\' AND \'' + dateTo + '\' ' +
    'AND campaign.status IN (\'ENABLED\', \'PAUSED\')';

  var rows = [];
  try {
    var iter = AdsApp.search(gaql);
    while (iter.hasNext()) {
      var r        = iter.next();
      var day      = r.segments.date;
      var campId   = String(r.campaign.id);
      var rawGender = (r.adGroupCriterion && r.adGroupCriterion.gender)
                       ? r.adGroupCriterion.gender.type : 'UNKNOWN';
      var gender = normalizeGender(rawGender);
      if (!gender) continue;

      rows.push(buildSegRow(day, accountName, r.campaign.name, campTypeMap[campId] || '',
                            'gender', gender, r.metrics));
    }
  } catch(e) {
    Logger.log('  [WARN] fetchGenderData: ' + e.message);
  }
  return rows;
}

function normalizeGender(raw) {
  var t = (raw || '').toUpperCase();
  if (t === 'MALE')    return 'Male';
  if (t === 'FEMALE')  return 'Female';
  if (t === 'UNDETERMINED') return 'Unknown';
  return null; // skip UNSPECIFIED
}

// ── 4. Age (GAQL) ─────────────────────────────────────────────
function fetchAgeData(dateFrom, dateTo, accountName, campTypeMap) {
  var gaql =
    'SELECT ' +
      'segments.date, campaign.id, campaign.name, ' +
      'ad_group_criterion.age_range.type, ' +
      'metrics.cost_micros, metrics.impressions, metrics.clicks, ' +
      'metrics.conversions, metrics.cost_per_conversion ' +
    'FROM age_range_view ' +
    'WHERE segments.date BETWEEN \'' + dateFrom + '\' AND \'' + dateTo + '\' ' +
    'AND campaign.status IN (\'ENABLED\', \'PAUSED\')';

  var rows = [];
  try {
    var iter = AdsApp.search(gaql);
    while (iter.hasNext()) {
      var r      = iter.next();
      var day    = r.segments.date;
      var campId = String(r.campaign.id);
      var rawAge = (r.adGroupCriterion && r.adGroupCriterion.ageRange)
                   ? r.adGroupCriterion.ageRange.type : 'UNKNOWN';
      var age = normalizeAge(rawAge);
      if (!age) continue;

      rows.push(buildSegRow(day, accountName, r.campaign.name, campTypeMap[campId] || '',
                            'age', age, r.metrics));
    }
  } catch(e) {
    Logger.log('  [WARN] fetchAgeData: ' + e.message);
  }
  return rows;
}

function normalizeAge(raw) {
  var map = {
    'AGE_RANGE_18_24': '18-24',
    'AGE_RANGE_25_34': '25-34',
    'AGE_RANGE_35_44': '35-44',
    'AGE_RANGE_45_54': '45-54',
    'AGE_RANGE_55_64': '55-64',
    'AGE_RANGE_65_UP': '65+',
    'AGE_RANGE_UNDETERMINED': 'Unknown',
  };
  return map[(raw || '').toUpperCase()] || null; // skip UNSPECIFIED
}

// ── 5. Geographic (GAQL) ──────────────────────────────────────
//  geographic_view: location_type = LOCATION_OF_PRESENCE (actual user location)
//  geo_target_constant.name = lokasi, geo_target_constant.resource_name untuk level
function fetchGeoData(dateFrom, dateTo, accountName, campTypeMap) {
  var gaql =
    'SELECT ' +
      'segments.date, campaign.id, campaign.name, ' +
      'geographic_view.location_type, ' +
      'geographic_view.country_criterion_id, ' +
      'segments.geo_target_country, ' +
      'segments.geo_target_city, ' +
      'metrics.cost_micros, metrics.impressions, metrics.clicks, ' +
      'metrics.conversions, metrics.cost_per_conversion ' +
    'FROM geographic_view ' +
    'WHERE segments.date BETWEEN \'' + dateFrom + '\' AND \'' + dateTo + '\' ' +
    'AND campaign.status IN (\'ENABLED\', \'PAUSED\') ' +
    'AND geographic_view.location_type = \'LOCATION_OF_PRESENCE\'';

  var rows = [];
  try {
    var iter = AdsApp.search(gaql);
    while (iter.hasNext()) {
      var r      = iter.next();
      var day    = r.segments.date;
      var campId = String(r.campaign.id);

      // Country
      var country = (r.segments && r.segments.geoTargetCountry) ? r.segments.geoTargetCountry : '';
      if (country) {
        rows.push(buildSegRow(day, accountName, r.campaign.name, campTypeMap[campId] || '',
                              'country', country, r.metrics));
      }

      // City
      var city = (r.segments && r.segments.geoTargetCity) ? r.segments.geoTargetCity : '';
      if (city && city !== country) {
        rows.push(buildSegRow(day, accountName, r.campaign.name, campTypeMap[campId] || '',
                              'city', city, r.metrics));
      }
    }
  } catch(e) {
    Logger.log('  [WARN] fetchGeoData: ' + e.message);
  }
  return rows;
}

// ── 6. Conversion Action (GAQL) ───────────────────────────────
function fetchConversionActionData(dateFrom, dateTo, accountName, campTypeMap) {
  var gaql =
    'SELECT ' +
      'segments.date, campaign.id, campaign.name, ' +
      'segments.conversion_action_name, ' +
      'metrics.cost_micros, metrics.impressions, metrics.clicks, ' +
      'metrics.conversions, metrics.cost_per_conversion ' +
    'FROM campaign ' +
    'WHERE segments.date BETWEEN \'' + dateFrom + '\' AND \'' + dateTo + '\' ' +
    'AND campaign.status IN (\'ENABLED\', \'PAUSED\') ' +
    'AND metrics.conversions > 0';

  var rows = [];
  try {
    var iter = AdsApp.search(gaql);
    while (iter.hasNext()) {
      var r          = iter.next();
      var day        = r.segments.date;
      var campId     = String(r.campaign.id);
      var convAction = (r.segments && r.segments.conversionActionName)
                       ? r.segments.conversionActionName : '';
      if (!convAction) continue;

      rows.push(buildSegRow(day, accountName, r.campaign.name, campTypeMap[campId] || '',
                            'conversion_action', convAction, r.metrics));
    }
  } catch(e) {
    Logger.log('  [WARN] fetchConversionActionData: ' + e.message);
  }
  return rows;
}

// ── Helper: build segment row ─────────────────────────────────
function buildSegRow(day, accountName, campaignName, rawType, segType, segValue, metrics) {
  var spendMicros = metrics.costMicros || 0;
  return {
    day:                 day,
    week:                getWeek(day),
    month:               day.substring(0, 7),
    account_name:        accountName,
    campaign_name:       campaignName,
    campaign_type:       channelLabel(rawType),
    segment_type:        segType,
    segment_value:       segValue,
    spend:               Math.round(spendMicros / 10000) / 100,  // micros → currency
    impressions:         parseInt(metrics.impressions) || 0,
    clicks:              parseInt(metrics.clicks) || 0,
    conversions:         parseFloat(metrics.conversions) || 0,
    cost_per_conversion: Math.round((metrics.costPerConversion || 0) / 10000) / 100,  // micros → currency
  };
}

// ── Deduplikasi baris sebelum push ────────────────────────────
// Mencegah error 21000: "ON CONFLICT DO UPDATE cannot affect row a second time"
// Jika ada duplikat key, metrics dijumlahkan dan derived metrics dihitung ulang.
function deduplicateRows(rows, keyFn) {
  var map   = {};
  var order = [];
  rows.forEach(function(row) {
    var key = keyFn(row);
    if (!map[key]) {
      map[key] = JSON.parse(JSON.stringify(row));
      order.push(key);
    } else {
      var e = map[key];
      e.spend       = (e.spend       || 0) + (row.spend       || 0);
      e.impressions = (e.impressions  || 0) + (row.impressions  || 0);
      e.clicks      = (e.clicks       || 0) + (row.clicks       || 0);
      e.conversions = (e.conversions  || 0) + (row.conversions  || 0);
      // Recalculate derived metrics
      e.ctr                 = e.impressions > 0 ? e.clicks / e.impressions * 100 : 0;
      e.avg_cpc             = e.clicks > 0 ? e.spend / e.clicks : 0;
      e.conv_rate           = e.clicks > 0 ? e.conversions / e.clicks * 100 : 0;
      e.cost_per_conversion = e.conversions > 0 ? e.spend / e.conversions : 0;
    }
  });
  return order.map(function(k) { return map[k]; });
}

function deduplicateSegRows(rows) {
  var map   = {};
  var order = [];
  rows.forEach(function(row) {
    var key = [row.day, row.account_name, row.campaign_name,
               row.segment_type, row.segment_value].join('|');
    if (!map[key]) {
      map[key] = JSON.parse(JSON.stringify(row));
      order.push(key);
    } else {
      var e = map[key];
      e.spend       = (e.spend       || 0) + (row.spend       || 0);
      e.impressions = (e.impressions  || 0) + (row.impressions  || 0);
      e.clicks      = (e.clicks       || 0) + (row.clicks       || 0);
      e.conversions = (e.conversions  || 0) + (row.conversions  || 0);
      e.cost_per_conversion = e.conversions > 0 ? e.spend / e.conversions : 0;
    }
  });
  return order.map(function(k) { return map[k]; });
}

// ── Push ke Supabase ──────────────────────────────────────────
function pushToSupabase(tableName, rows, conflictCols) {
  var BATCH    = 500;
  var conflict = conflictCols.split(',').map(encodeURIComponent).join('%2C');
  var url      = SUPABASE_URL + '/rest/v1/' + tableName + '?on_conflict=' + conflict;

  for (var i = 0; i < rows.length; i += BATCH) {
    var resp = UrlFetchApp.fetch(url, {
      method:      'post',
      contentType: 'application/json',
      headers: {
        'apikey':        SUPABASE_SERVICE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_SERVICE_KEY,
        'Prefer':        'resolution=merge-duplicates,return=minimal',
      },
      payload:            JSON.stringify(rows.slice(i, i + BATCH)),
      muteHttpExceptions: true,
    });

    var code = resp.getResponseCode();
    if (code < 200 || code >= 300) {
      throw new Error('Supabase [' + tableName + '] HTTP ' + code + ': ' +
                      resp.getContentText().substring(0, 300));
    }
    Logger.log('  [' + tableName + '] Batch ' + (Math.floor(i / BATCH) + 1) + ' OK (' +
               Math.min(i + BATCH, rows.length) + '/' + rows.length + ')');
  }
}

// ── Helpers ───────────────────────────────────────────────────
function getDateRange(daysBack) {
  var to   = new Date(); to.setDate(to.getDate() - 1);
  var from = new Date(to); from.setDate(from.getDate() - (daysBack - 1));
  return { from: fmtDate(from), to: fmtDate(to) };
}

function fmtDate(d) {
  var m  = String(d.getMonth() + 1).padStart(2, '0');
  var dd = String(d.getDate()).padStart(2, '0');
  return d.getFullYear() + '-' + m + '-' + dd;
}

function getWeek(dateStr) {
  var d    = new Date(dateStr);
  var jan1 = new Date(d.getFullYear(), 0, 1);
  var week = Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
  return d.getFullYear() + '-W' + String(week).padStart(2, '0');
}

function parseMoney(v) {
  if (!v || v === '--') return 0;
  return parseFloat(String(v).replace(/,/g, '')) || 0;
}

function parsePct(v) {
  if (!v || v === '--') return 0;
  var s = String(v).replace('%', '').trim();
  var n = parseFloat(s) || 0;
  return (n < 1 && !String(v).includes('%')) ? n * 100 : n;
}
