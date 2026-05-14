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
    spend:                  { label: 'Spend',                   format: 'rupiah', value: p => p?.meta?.spend,                  prev: p => p?.metaPrev?.spend,                  series: p => p?.metaSeries?.spend },
    impressions:            { label: 'Impressions',             format: 'num',    value: p => p?.meta?.impressions,            prev: p => p?.metaPrev?.impressions,            series: p => p?.metaSeries?.impressions },
    reach:                  { label: 'Reach',                   format: 'num',    value: p => p?.meta?.reach,                  prev: p => p?.metaPrev?.reach },
    clicks:                 { label: 'Link Clicks',             format: 'num',    value: p => p?.meta?.clicks,                 prev: p => p?.metaPrev?.clicks,                 series: p => p?.metaSeries?.clicks },
    landing_page_views:     { label: 'Landing Page Views',      format: 'num',    value: p => p?.meta?.landing_page_views,     prev: p => p?.metaPrev?.landing_page_views },
    leads:                  { label: 'Leads',                   format: 'num',    value: p => p?.meta?.leads,                  prev: p => p?.metaPrev?.leads },
    complete_registrations: { label: 'Complete Registrations',  format: 'num',    value: p => p?.meta?.complete_registrations, prev: p => p?.metaPrev?.complete_registrations },
    messaging_conv_started: { label: 'Messaging Conv. Started', format: 'num',    value: p => p?.meta?.messaging_conv_started, prev: p => p?.metaPrev?.messaging_conv_started },
    contacts:               { label: 'Contacts',                format: 'num',    value: p => p?.meta?.contacts,               prev: p => p?.metaPrev?.contacts },
    ig_profile_visits:      { label: 'IG Profile Visits',       format: 'num',    value: p => p?.meta?.ig_profile_visits,      prev: p => p?.metaPrev?.ig_profile_visits },
    post_engagements:       { label: 'Post Engagements',        format: 'num',    value: p => p?.meta?.post_engagements,       prev: p => p?.metaPrev?.post_engagements },
    purchases:              { label: 'Purchases',               format: 'num',    value: p => p?.meta?.purchases,              prev: p => p?.metaPrev?.purchases },
    purchase_value:         { label: 'Purchase Value',          format: 'rupiah', value: p => p?.meta?.purchase_value,         prev: p => p?.metaPrev?.purchase_value },
    add_to_carts:           { label: 'Add to Carts',            format: 'num',    value: p => p?.meta?.add_to_carts,           prev: p => p?.metaPrev?.add_to_carts },
    add_to_cart_value:      { label: 'Add to Cart Value',       format: 'rupiah', value: p => p?.meta?.add_to_cart_value,      prev: p => p?.metaPrev?.add_to_cart_value },
  },
  ga4: {
    sessions:                 { label: 'Sessions',             format: 'num', value: p => p?.ga4?.sessions,                 prev: p => p?.ga4Prev?.sessions },
    total_users:              { label: 'Total Users',          format: 'num', value: p => p?.ga4?.total_users,              prev: p => p?.ga4Prev?.total_users },
    new_users:                { label: 'New Users',            format: 'num', value: p => p?.ga4?.new_users,                prev: p => p?.ga4Prev?.new_users },
    returning_users:          { label: 'Returning Users',      format: 'num', value: p => p?.ga4?.returning_users,          prev: p => p?.ga4Prev?.returning_users },
    engaged_sessions:         { label: 'Engaged Sessions',     format: 'num', value: p => p?.ga4?.engaged_sessions,         prev: p => p?.ga4Prev?.engaged_sessions },
    user_engagement_duration: { label: 'Engagement Duration',  format: 'num', value: p => p?.ga4?.user_engagement_duration, prev: p => p?.ga4Prev?.user_engagement_duration },
    event_count:              { label: 'Events',               format: 'num', value: p => p?.ga4?.event_count,              prev: p => p?.ga4Prev?.event_count },
    bounce_rate:              { label: 'Bounce Rate',          format: 'pct', value: p => p?.ga4?.bounce_rate,              prev: p => p?.ga4Prev?.bounce_rate },
    engagement_rate:          { label: 'Engagement Rate',      format: 'pct', value: p => p?.ga4?.engagement_rate,          prev: p => p?.ga4Prev?.engagement_rate },
    avg_session_duration:     { label: 'Avg Duration (s)',     format: 'num', value: p => p?.ga4?.avg_session_duration,     prev: p => p?.ga4Prev?.avg_session_duration },
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
    { key: 'adset_name', label: 'Ad Set' },
    { key: 'ad_name',    label: 'Ad' },
    { key: 'date',       label: 'Date' },
  ],
  ga4: [
    { key: 'property_name', label: 'Property' },
    { key: 'date',          label: 'Date' },
    { key: 'gender',        label: 'Gender' },
    { key: 'country',       label: 'Country' },
    { key: 'page_path',     label: 'Page Path' },
    { key: 'device',        label: 'Device' },
    { key: 'channel_group', label: 'Channel Group' },
    { key: 'medium',        label: 'Medium' },
    { key: 'source',        label: 'Source' },
    { key: 'region',        label: 'Region' },
    { key: 'city',          label: 'City' },
  ],
  search: [
    { key: 'query',   label: 'Query' },
    { key: 'page',    label: 'Page URL', fmtCell: 'url' },
    { key: 'date',    label: 'Date' },
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
    { key: 'spend',                  label: 'Spend',                   fmt: 'rupiah' },
    { key: 'impressions',            label: 'Impressions',             fmt: 'num' },
    { key: 'reach',                  label: 'Reach',                   fmt: 'num' },
    { key: 'clicks',                 label: 'Link Clicks',             fmt: 'num' },
    { key: 'landing_page_views',     label: 'Landing Page Views',      fmt: 'num' },
    { key: 'leads',                  label: 'Leads',                   fmt: 'num' },
    { key: 'complete_registrations', label: 'Complete Registrations',  fmt: 'num' },
    { key: 'messaging_conv_started', label: 'Messaging Conv. Started', fmt: 'num' },
    { key: 'contacts',               label: 'Contacts',                fmt: 'num' },
    { key: 'ig_profile_visits',      label: 'IG Profile Visits',       fmt: 'num' },
    { key: 'post_engagements',       label: 'Post Engagements',        fmt: 'num' },
    { key: 'purchases',              label: 'Purchases',               fmt: 'num' },
    { key: 'purchase_value',         label: 'Purchase Value',          fmt: 'rupiah' },
    { key: 'add_to_carts',           label: 'Add to Carts',            fmt: 'num' },
    { key: 'add_to_cart_value',      label: 'Add to Cart Value',       fmt: 'rupiah' },
  ],
  ga4: [
    { key: 'sessions',                 label: 'Sessions',             fmt: 'num' },
    { key: 'total_users',              label: 'Total Users',          fmt: 'num' },
    { key: 'new_users',                label: 'New Users',            fmt: 'num' },
    { key: 'returning_users',          label: 'Returning Users',      fmt: 'num' },
    { key: 'engaged_sessions',         label: 'Engaged Sessions',     fmt: 'num' },
    { key: 'user_engagement_duration', label: 'Engagement Duration',  fmt: 'num' },
    { key: 'event_count',              label: 'Events',               fmt: 'num' },
    { key: 'bounce_rate',              label: 'Bounce Rate',          fmt: 'pct' },
    { key: 'engagement_rate',          label: 'Engagement Rate',      fmt: 'pct' },
    { key: 'avg_session_duration',     label: 'Avg Duration (s)',     fmt: 'num' },
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
    return {
      name:       uniq(rows, 'name'),
      adset_name: [],
      ad_name:    [],
      date:       [],
    };
  },
  ga4: p => {
    const uniq = (rows, key) => [...new Set((rows || []).map(r => r[key]).filter(v => v != null && v !== ''))].sort();
    const rows = p?.ga4Rows || [];
    return {
      property_name:  uniq(rows, 'property_name'),
      date:           uniq(rows, 'date'),
      gender:         uniq(rows, 'gender'),
      country:        uniq(rows, 'country'),
      page_path:      uniq(rows, 'page_path'),
      device:         uniq(rows, 'device'),
      channel_group:  uniq(rows, 'channel_group'),
      medium:         uniq(rows, 'medium'),
      source:         uniq(rows, 'source'),
      region:         uniq(rows, 'region'),
      city:           uniq(rows, 'city'),
    };
  },
  search: p => {
    const uniq = (rows, key) => [...new Set((rows || []).map(r => r[key]).filter(v => v != null && v !== ''))].sort();
    return {
      date:  uniq([...(p?.gsc?.queries || []), ...(p?.gsc?.pages || [])], 'date'),
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
  meta:   (_dims) => ['name', 'adset_name', 'ad_name', 'date'],
  ga4:    (_dims) => ['property_name', 'date'],
  search: (_dims) => ['date', 'query', 'page'],
};

window.WIDGET_DEFAULTS = {
  'kpi-strip': {
    google: { metrics: ['spend','impressions','clicks','conversions'], fontSize: 'M' },
    meta:   { metrics: ['spend','impressions','clicks','leads'],      fontSize: 'M' },
    ga4:    { metrics: ['sessions','total_users','event_count','bounce_rate'], fontSize: 'M' },
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
    ga4:    { metric: 'event_count' },
    search: { metric: 'impressions' },
  },
  'chart-donut': {
    google: { metric: 'spend',    groupBy: 'type' },
    meta:   { metric: 'spend',    groupBy: 'name' },
    ga4:    { metric: 'sessions', groupBy: 'property_name' },
    search: { metric: 'clicks',   groupBy: 'query' },
  },
  'chart-heatmap': {
    google: {}, meta: {}, ga4: {}, search: {},
  },
  'table': {
    google: { dimensions: ['name'],    metrics: ['spend','impressions','clicks','conversions'],      pageSize: 10, fontSize: 'M' },
    meta:   { dimensions: ['name'],    metrics: ['spend','impressions','clicks','leads','purchases'], pageSize: 10, fontSize: 'M' },
    ga4:    { dimensions: ['date'], metrics: ['sessions','total_users','new_users','engaged_sessions'], pageSize: 10, fontSize: 'M' },
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
