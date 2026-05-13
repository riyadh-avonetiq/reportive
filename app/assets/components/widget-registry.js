// ── Widget Registry ──────────────────────────────────────────────────
// DATA_REGISTRY: (source, metricKey) → { label, format, value(p), prev(p), series(p) }
// DIM_REGISTRY:  source → [{ key, label }]
// TABLE_DATA_REGISTRY: source → (p) => rows[]
// WIDGET_DEFAULTS: (type, source) → default config object

window.DATA_REGISTRY = {
  google: {
    spend:       { label: 'Total Spend',  format: 'rupiah', value: p => p?.ads?.spend,       prev: p => p?.adsPrev?.spend,       series: p => p?.series?.spend },
    impressions: { label: 'Impressions',  format: 'num',    value: p => p?.ads?.impressions, prev: p => p?.adsPrev?.impressions, series: p => p?.series?.impressions },
    clicks:      { label: 'Clicks',       format: 'num',    value: p => p?.ads?.clicks,      prev: p => p?.adsPrev?.clicks,      series: p => p?.series?.clicks },
    conversions: { label: 'Conversions',  format: 'num',    value: p => p?.ads?.conversions, prev: p => p?.adsPrev?.conversions, series: p => p?.series?.conversions },
  },
  meta: {
    spend:               { label: 'Total Spend',        format: 'rupiah', value: p => p?.meta?.spend,               prev: p => p?.metaPrev?.spend,               series: p => p?.metaSeries?.spend },
    impressions:         { label: 'Impressions',        format: 'num',    value: p => p?.meta?.impressions,         prev: p => p?.metaPrev?.impressions,         series: p => p?.metaSeries?.impressions },
    reach:               { label: 'Reach',              format: 'num',    value: p => p?.meta?.reach,               prev: p => p?.metaPrev?.reach },
    clicks:              { label: 'Link Clicks',        format: 'num',    value: p => p?.meta?.clicks,              prev: p => p?.metaPrev?.clicks,              series: p => p?.metaSeries?.clicks },
    landing_page_views:  { label: 'Landing Page Views', format: 'num',    value: p => p?.meta?.landing_page_views,  prev: p => p?.metaPrev?.landing_page_views },
    conversions:         { label: 'Conversions',        format: 'num',    value: p => p?.meta?.conversions,         prev: p => p?.metaPrev?.conversions,         series: p => p?.metaSeries?.conversions },
    purchases:           { label: 'Purchases',          format: 'num',    value: p => p?.meta?.purchases,           prev: p => p?.metaPrev?.purchases },
    purchase_value:      { label: 'Purchase Value',     format: 'rupiah', value: p => p?.meta?.purchase_value,      prev: p => p?.metaPrev?.purchase_value },
    add_to_carts:        { label: 'Add to Carts',       format: 'num',    value: p => p?.meta?.add_to_carts,        prev: p => p?.metaPrev?.add_to_carts },
    ctr:                 { label: 'CTR',                format: 'pct',    value: p => p?.meta?.ctr,                 prev: p => p?.metaPrev?.ctr },
    cpc:                 { label: 'Avg CPC',            format: 'rupiah', value: p => p?.meta?.cpc,                 prev: p => p?.metaPrev?.cpc },
    cpa:                 { label: 'CPA',                format: 'rupiah', value: p => p?.meta?.cpa,                 prev: p => p?.metaPrev?.cpa },
    roas:                { label: 'ROAS',               format: 'roas',   value: p => p?.meta?.roas,                prev: p => p?.metaPrev?.roas },
  },
  ga4: {
    sessions:             { label: 'Sessions',          format: 'num', value: p => p?.ga4?.sessions,             prev: p => p?.ga4Prev?.sessions },
    users:                { label: 'Total Users',        format: 'num', value: p => p?.ga4?.users,                prev: p => p?.ga4Prev?.users },
    new_users:            { label: 'New Users',          format: 'num', value: p => p?.ga4?.new_users,            prev: p => p?.ga4Prev?.new_users },
    pageviews:            { label: 'Events',             format: 'num', value: p => p?.ga4?.pageviews,            prev: p => p?.ga4Prev?.pageviews },
    engaged:              { label: 'Engaged Sessions',   format: 'num', value: p => p?.ga4?.engaged,              prev: p => p?.ga4Prev?.engaged },
    engagement_rate:      { label: 'Engagement Rate',    format: 'pct', value: p => p?.ga4?.engagement_rate,      prev: p => p?.ga4Prev?.engagement_rate },
    bounce_rate:          { label: 'Bounce Rate',        format: 'pct', value: p => p?.ga4?.bounce_rate,          prev: p => p?.ga4Prev?.bounce_rate },
    avg_session_duration: { label: 'Avg Duration (s)',   format: 'num', value: p => p?.ga4?.avg_session_duration, prev: p => p?.ga4Prev?.avg_session_duration },
  },
  search: {
    impressions: { label: 'Impressions',     format: 'num',    value: p => p?.gsc?.impressions,       prev: p => p?.gscPrev?.impressions,    series: p => p?.gsc?.series?.impressions },
    clicks:      { label: 'Organic Clicks',  format: 'num',    value: p => p?.gsc?.clicks,            prev: p => p?.gscPrev?.clicks,         series: p => p?.gsc?.series?.clicks },
    ctr:         { label: 'CTR',             format: 'pct',    value: p => p?.gsc?.ctr,               prev: p => p?.gscPrev?.ctr },
    position:    { label: 'Avg Position',    format: 'num',    value: p => p?.gsc?.position,          prev: p => p?.gscPrev?.position },
  },
};

window.DIM_REGISTRY = {
  google: [
    { key: 'name',          label: 'Campaign' },
    { key: 'type',          label: 'Campaign Type' },
    { key: 'ad_group',      label: 'Ad Group' },
    { key: 'keyword',       label: 'Keyword' },
    { key: 'match_type',    label: 'Match Type' },
    { key: 'device',        label: 'Device' },
    { key: 'segment_value', label: 'Gender' },
  ],
  meta: [
    { key: 'name',       label: 'Campaign' },
  ],
  ga4: [
    { key: 'date',          label: 'Date' },
    { key: 'property_name', label: 'Property' },
  ],
  search: [
    { key: 'query',      label: 'Query' },
    { key: 'page',       label: 'Page URL' },
  ],
};

window.TABLE_METRICS_REGISTRY = {
  google: [
    { key: 'spend',       label: 'Spend',       fmt: 'rupiah' },
    { key: 'impressions', label: 'Impressions',  fmt: 'num' },
    { key: 'clicks',      label: 'Clicks',       fmt: 'num' },
    { key: 'conversions', label: 'Conversions',  fmt: 'num' },
    { key: 'ctr',         label: 'CTR',          fmt: 'pct' },
    { key: 'cpc',         label: 'Avg CPC',      fmt: 'rupiah' },
    { key: 'cvr',         label: 'Conv. Rate',   fmt: 'pct' },
    { key: 'cpa',         label: 'CPA',          fmt: 'rupiah' },
  ],
  meta: [
    { key: 'spend',              label: 'Spend',              fmt: 'rupiah' },
    { key: 'impressions',        label: 'Impressions',        fmt: 'num' },
    { key: 'reach',              label: 'Reach',              fmt: 'num' },
    { key: 'clicks',             label: 'Link Clicks',        fmt: 'num' },
    { key: 'landing_page_views', label: 'Landing Page Views', fmt: 'num' },
    { key: 'conversions',        label: 'Conversions',        fmt: 'num' },
    { key: 'purchases',          label: 'Purchases',          fmt: 'num' },
    { key: 'purchase_value',     label: 'Purchase Value',     fmt: 'rupiah' },
    { key: 'add_to_carts',       label: 'Add to Carts',       fmt: 'num' },
    { key: 'ctr',                label: 'CTR',                fmt: 'pct' },
    { key: 'cpc',                label: 'Avg CPC',            fmt: 'rupiah' },
    { key: 'cpa',                label: 'CPA',                fmt: 'rupiah' },
    { key: 'roas',               label: 'ROAS',               fmt: 'roas' },
  ],
  ga4: [
    { key: 'sessions',             label: 'Sessions',         fmt: 'num' },
    { key: 'total_users',          label: 'Users',            fmt: 'num' },
    { key: 'new_users',            label: 'New Users',        fmt: 'num' },
    { key: 'event_count',          label: 'Events',           fmt: 'num' },
    { key: 'engaged_sessions',     label: 'Engaged Sessions', fmt: 'num' },
    { key: 'engagement_rate',      label: 'Engagement Rate',  fmt: 'pct' },
    { key: 'bounce_rate',          label: 'Bounce Rate',      fmt: 'pct' },
    { key: 'avg_session_duration', label: 'Avg Duration (s)', fmt: 'num' },
  ],
  search: [
    { key: 'impressions', label: 'Impressions',  fmt: 'num' },
    { key: 'clicks',      label: 'Clicks',       fmt: 'num' },
    { key: 'ctr',         label: 'CTR',          fmt: 'pct' },
    { key: 'position',    label: 'Avg Position', fmt: 'num' },
  ],
};

window.TABLE_DATA_REGISTRY = {
  google: p => p?.campaigns || [],
  meta:   p => p?.metaChannels || [],
  ga4:    p => (p?.ga4Rows || []).map(r => ({
    ...r,
    bounce_rate:     (+(r.bounce_rate)     || 0) * 100,
    engagement_rate: (+(r.engagement_rate) || 0) * 100,
  })),
  search: p => [...(p?.gsc?.queries || []), ...(p?.gsc?.pages || [])],
};

// DIM_VALUES_EXTRACTOR: source → (p) → { dimKey: [val, ...] }
// Used by the editor to populate filter value dropdowns.
window.DIM_VALUES_EXTRACTOR = {
  google: p => {
    const uniq = (rows, key) => [...new Set((rows || []).map(r => r[key]).filter(v => v != null && v !== ''))].sort();
    return {
      name:          uniq(p?.campaigns,  'name'),
      type:          uniq(p?.campaigns,  'type'),
      ad_group:      uniq(p?.adGroups,   'ad_group'),
      keyword:       uniq(p?.keywords,   'keyword'),
      match_type:    uniq(p?.keywords,   'match_type'),
      device:        uniq(p?.deviceRows, 'device'),
      segment_value: uniq(p?.genderRows, 'segment_value'),
    };
  },
  meta: p => {
    const uniq = (rows, key) => [...new Set((rows || []).map(r => r[key]).filter(v => v != null && v !== ''))].sort();
    const rows = p?.metaChannels || [];
    return { name: uniq(rows, 'name') };
  },
  ga4: p => {
    const uniq = (rows, key) => [...new Set((rows || []).map(r => r[key]).filter(v => v != null && v !== ''))].sort();
    const rows = p?.ga4Rows || [];
    return {
      source:  uniq(rows, 'source'),
      channel: uniq(rows, 'channel'),
      device:  uniq(rows, 'device'),
      country: uniq(rows, 'country'),
    };
  },
  search: p => {
    const uniq = (rows, key) => [...new Set((rows || []).map(r => r[key]).filter(v => v != null && v !== ''))].sort();
    return {
      query: uniq(p?.gsc?.queries, 'query'),
      page:  uniq(p?.gsc?.pages,   'page'),
    };
  },
};

// FILTER_DIM_REGISTRY: source → (selectedDims) → [valid filter dim keys]
// Restricts filter dropdown to dims that exist in the routed row source.
window.FILTER_DIM_REGISTRY = {
  google: (selectedDims) => {
    const dims = selectedDims || [];
    if (dims.includes('keyword') || dims.includes('match_type'))
      // keywordDeviceRows or keywords: has name, type, ad_group, keyword, match_type, device
      return ['name', 'type', 'ad_group', 'keyword', 'match_type', 'device'];
    if (dims.includes('ad_group'))
      // adGroupDeviceRows or adGroups: has name, type, ad_group, device
      return ['name', 'type', 'ad_group', 'device'];
    if (dims.includes('device'))
      // deviceRows: has name, type, device
      return ['name', 'type', 'device'];
    if (dims.includes('segment_value'))
      // genderRows: has name, segment_value
      return ['name', 'segment_value'];
    // Default campaign level: has name, type + can pivot to device or gender
    return ['name', 'type', 'device', 'segment_value'];
  },
  meta:   (_dims) => ['name'],
  ga4:    (_dims) => ['source', 'channel', 'device', 'country'],
  search: (selectedDims) => (selectedDims || []).includes('page') ? ['page'] : ['query'],
};

window.WIDGET_DEFAULTS = {
  'kpi-strip': {
    google: { metrics: ['spend','impressions','clicks','conversions'], fontSize: 'M' },
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
    google: { metric: 'impressions' },
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
    google: { dimensions: ['name'],    metrics: ['spend','impressions','clicks','conversions'],      pageSize: 10, fontSize: 'M' },
    meta:   { dimensions: ['name'],    metrics: ['spend','impressions','clicks','ctr','cpa'],        pageSize: 10, fontSize: 'M' },
    ga4:    { dimensions: ['source'],  metrics: ['sessions','users','new_users','engaged'],          pageSize: 10, fontSize: 'M' },
    search: { dimensions: ['query'],   metrics: ['impressions','clicks','ctr','position'],           pageSize: 10, fontSize: 'M' },
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
