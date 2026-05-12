// ── Widget Registry ──────────────────────────────────────────────────
// DATA_REGISTRY: (source, metricKey) → { label, format, value(p), prev(p), series(p) }
// DIM_REGISTRY:  source → [{ key, label }]
// TABLE_DATA_REGISTRY: source → (p) => rows[]
// WIDGET_DEFAULTS: (type, source) → default config object

window.DATA_REGISTRY = {
  google: {
    spend:       { label: 'Total Spend',   format: 'rupiah', value: p => p?.ads?.spend,             prev: p => p?.adsPrev?.spend,             series: p => p?.series?.spend },
    clicks:      { label: 'Clicks',        format: 'num',    value: p => p?.ads?.clicks,            prev: p => p?.adsPrev?.clicks,            series: p => p?.series?.clicks },
    impressions: { label: 'Impressions',   format: 'num',    value: p => p?.ads?.impressions,       prev: p => p?.adsPrev?.impressions },
    conversions: { label: 'Conversions',   format: 'num',    value: p => p?.ads?.conversions,       prev: p => p?.adsPrev?.conversions },
    ctr:         { label: 'CTR',           format: 'pct',    value: p => p?.ads?.ctr,               prev: p => p?.adsPrev?.ctr },
    cpc:         { label: 'Avg CPC',       format: 'rupiah', value: p => p?.ads?.cpc },
    cpa:         { label: 'CPA',           format: 'rupiah', value: p => p?.ads?.cpa,               prev: p => p?.adsPrev?.cpa },
    roas:        { label: 'ROAS',          format: 'roas',   value: p => p?.ads?.roas,              prev: p => p?.adsPrev?.roas },
  },
  meta: {
    spend:       { label: 'Total Spend',   format: 'rupiah', value: p => p?.meta?.spend,            prev: p => p?.metaPrev?.spend,            series: p => p?.metaSeries?.spend },
    impressions: { label: 'Impressions',   format: 'num',    value: p => p?.meta?.impressions,      prev: p => p?.metaPrev?.impressions,      series: p => p?.metaSeries?.impressions },
    clicks:      { label: 'Link Clicks',   format: 'num',    value: p => p?.meta?.clicks,           prev: p => p?.metaPrev?.clicks,           series: p => p?.metaSeries?.clicks },
    conversions: { label: 'Conversions',   format: 'num',    value: p => p?.meta?.conversions,      prev: p => p?.metaPrev?.conversions },
    cpm:         { label: 'CPM',           format: 'rupiah', value: p => p?.meta?.cpm },
    ctr:         { label: 'CTR',           format: 'pct',    value: p => p?.meta?.ctr,              prev: p => p?.metaPrev?.ctr },
    cpa:         { label: 'CPA',           format: 'rupiah', value: p => p?.meta?.cpa },
  },
  ga4: {
    sessions:    { label: 'Sessions',      format: 'num',    value: p => p?.ga4?.sessions,          prev: p => p?.ga4Prev?.sessions,          series: p => p?.series?.impressions },
    users:       { label: 'Users',         format: 'num',    value: p => p?.ga4?.users,             prev: p => p?.ga4Prev?.users },
    pageviews:   { label: 'Pageviews',     format: 'num',    value: p => p?.ga4?.pageviews,         prev: p => p?.ga4Prev?.pageviews },
    engaged:     { label: 'Engaged Sess.', format: 'num',    value: p => p?.ga4?.engaged,           prev: p => p?.ga4Prev?.engaged },
    bounce_rate: { label: 'Bounce Rate',   format: 'pct',    value: p => p?.ga4?.bounce_rate,       prev: p => p?.ga4Prev?.bounce_rate },
  },
  search: {
    impressions: { label: 'Impressions',   format: 'num',    value: p => p?.gsc?.impressions,       prev: p => p?.gscPrev?.impressions,       series: p => p?.gsc?.series?.impressions },
    clicks:      { label: 'Organic Clicks',format: 'num',    value: p => p?.gsc?.clicks,            prev: p => p?.gscPrev?.clicks,            series: p => p?.gsc?.series?.clicks },
    ctr:         { label: 'CTR',           format: 'pct',    value: p => p?.gsc?.ctr,               prev: p => p?.gscPrev?.ctr },
    position:    { label: 'Avg Position',  format: 'num',    value: p => p?.gsc?.position,          prev: p => p?.gscPrev?.position },
  },
};

window.DIM_REGISTRY = {
  google: [
    { key: 'name',      label: 'Campaign' },
    { key: 'ad_group',  label: 'Ad Group' },
    { key: 'keyword',   label: 'Keyword' },
    { key: 'type',      label: 'Campaign Type' },
    { key: 'device',    label: 'Device' },
  ],
  meta: [
    { key: 'campaign',  label: 'Campaign' },
    { key: 'ad_set',    label: 'Ad Set' },
    { key: 'ad',        label: 'Ad' },
    { key: 'placement', label: 'Placement' },
    { key: 'device',    label: 'Device' },
  ],
  ga4: [
    { key: 'source',    label: 'Source' },
    { key: 'medium',    label: 'Medium' },
    { key: 'channel',   label: 'Channel' },
    { key: 'device',    label: 'Device' },
    { key: 'country',   label: 'Country' },
  ],
  search: [
    { key: 'query',     label: 'Query' },
    { key: 'page',      label: 'Page' },
    { key: 'country',   label: 'Country' },
    { key: 'device',    label: 'Device' },
  ],
};

window.TABLE_DATA_REGISTRY = {
  google: p => p?.campaigns || [],
  meta:   p => p?.metaChannels || [],
  ga4:    p => [],
  search: p => [...(p?.gsc?.queries || []), ...(p?.gsc?.pages || [])],
};

window.WIDGET_DEFAULTS = {
  'kpi-strip': {
    google: { metrics: ['spend','clicks','impressions','ctr'],        fontSize: 'M' },
    meta:   { metrics: ['spend','impressions','clicks','ctr'],        fontSize: 'M' },
    ga4:    { metrics: ['sessions','users','pageviews','bounce_rate'],fontSize: 'M' },
    search: { metrics: ['impressions','clicks','ctr','position'],     fontSize: 'M' },
  },
  'single-stat': {
    google: { metric: 'spend',      fontSize: 'L' },
    meta:   { metric: 'spend',      fontSize: 'L' },
    ga4:    { metric: 'sessions',   fontSize: 'L' },
    search: { metric: 'clicks',     fontSize: 'L' },
  },
  'chart-area': {
    google: { metric: 'spend' },
    meta:   { metric: 'impressions' },
    ga4:    { metric: 'sessions' },
    search: { metric: 'clicks' },
  },
  'chart-bar': {
    google: { metric: 'clicks' },
    meta:   { metric: 'clicks' },
    ga4:    { metric: 'pageviews' },
    search: { metric: 'impressions' },
  },
  'chart-donut': {
    google: { metric: 'spend',    groupBy: 'type' },
    meta:   { metric: 'spend',    groupBy: 'placement' },
    ga4:    { metric: 'sessions', groupBy: 'channel' },
    search: { metric: 'clicks',   groupBy: 'device' },
  },
  'chart-heatmap': {
    google: {}, meta: {}, ga4: {}, search: {},
  },
  'table': {
    google: { dimensions: ['name'],     metrics: ['spend','clicks','impressions','ctr','cpa'], pageSize: 10, fontSize: 'M' },
    meta:   { dimensions: ['campaign'], metrics: ['spend','impressions','clicks','ctr'],       pageSize: 10, fontSize: 'M' },
    ga4:    { dimensions: ['source'],   metrics: ['sessions','users','pageviews'],             pageSize: 10, fontSize: 'M' },
    search: { dimensions: ['query'],    metrics: ['impressions','clicks','ctr','position'],    pageSize: 10, fontSize: 'M' },
  },
  'text': {
    _: { title: '', body: '' },
  },
};

// Helper: get resolved config for a widget instance (defaults merged with saved config)
window.getWidgetCfg = function(type, source, savedConfig) {
  const defaults = (window.WIDGET_DEFAULTS[type] || {})[source]
    || (window.WIDGET_DEFAULTS[type] || {})['_']
    || {};
  return { ...defaults, ...(savedConfig || {}) };
};

// Helper: generate unique widget instance ID
window.genWidgetId = function() {
  return 'w_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
};
