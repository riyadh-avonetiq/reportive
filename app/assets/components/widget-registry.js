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
    content_views:          { label: 'Content Views',           format: 'num',    value: p => p?.meta?.content_views,          prev: p => p?.metaPrev?.content_views },
    purchases:              { label: 'Purchases',               format: 'num',    value: p => p?.meta?.purchases,              prev: p => p?.metaPrev?.purchases },
    purchase_value:         { label: 'Purchase Value',          format: 'rupiah', value: p => p?.meta?.purchase_value,         prev: p => p?.metaPrev?.purchase_value },
    add_to_carts:           { label: 'Add to Carts',            format: 'num',    value: p => p?.meta?.add_to_carts,           prev: p => p?.metaPrev?.add_to_carts },
    add_to_cart_value:      { label: 'Add to Cart Value',       format: 'rupiah', value: p => p?.meta?.add_to_cart_value,      prev: p => p?.metaPrev?.add_to_cart_value },
  },
  ga4: {
    sessions:                 { label: 'Sessions',             format: 'num', value: p => p?.ga4?.sessions,                 prev: p => p?.ga4Prev?.sessions },
    total_users:              { label: 'Total Users',          format: 'num', value: p => p?.ga4?.total_users,              prev: p => p?.ga4Prev?.total_users },
    new_users:                { label: 'New Users',            format: 'num', value: p => p?.ga4?.new_users,                prev: p => p?.ga4Prev?.new_users },
    engaged_sessions:         { label: 'Engaged Sessions',     format: 'num', value: p => p?.ga4?.engaged_sessions,         prev: p => p?.ga4Prev?.engaged_sessions },
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
    { key: 'campaign_name', label: 'Campaign' },
    { key: 'adset_name',    label: 'Ad Set' },
    { key: 'ad_name',       label: 'Ad' },
    { key: 'date',          label: 'Date' },
  ],
  ga4: [
    { key: 'property_name', label: 'Property' },
    { key: 'date',          label: 'Date' },
    { key: 'gender',        label: 'Gender' },
    { key: 'country',       label: 'Country' },
    { key: 'region',        label: 'Region' },
    { key: 'city',          label: 'City' },
    { key: 'page_path',     label: 'Page Path' },
    { key: 'device',        label: 'Device' },
    { key: 'channel_group', label: 'Channel Group' },
    { key: 'medium',        label: 'Medium' },
    { key: 'source',        label: 'Source' },
  ],
  search: [
    { key: 'query',   label: 'Query' },
    { key: 'page',    label: 'Page URL', fmtCell: 'url' },
    { key: 'date',    label: 'Date',    fmtCell: 'gsc-date' },
    { key: 'country', label: 'Country', fmtCell: 'gsc-country' },
    { key: 'device',  label: 'Device',  fmtCell: 'gsc-device' },
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
    { key: 'content_views',          label: 'Content Views',           fmt: 'num' },
    { key: 'purchases',              label: 'Purchases',               fmt: 'num' },
    { key: 'purchase_value',         label: 'Purchase Value',          fmt: 'rupiah' },
    { key: 'add_to_carts',           label: 'Add to Carts',            fmt: 'num' },
    { key: 'add_to_cart_value',      label: 'Add to Cart Value',       fmt: 'rupiah' },
  ],
  ga4: [
    { key: 'sessions',                 label: 'Sessions',             fmt: 'num' },
    { key: 'total_users',              label: 'Total Users',          fmt: 'num' },
    { key: 'new_users',                label: 'New Users',            fmt: 'num' },
    { key: 'engaged_sessions',         label: 'Engaged Sessions',     fmt: 'num' },
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
  meta:   p => {
    const insights = p?.metaInsightsRows || [];
    const daily    = p?.metaRows         || [];
    if (insights.length > 0) {
      return insights.map(r => ({
        ...r,
        campaign_name:          r.campaign_name || r.name || '',
        name:                   r.name || r.campaign_name || '',
        clicks:                 +(r.link_clicks ?? r.clicks) || 0,
        contacts:               +(r.contacts)               || 0,
        ig_profile_visits:      +(r.ig_profile_visits)      || 0,
        content_views:          +(r.content_views)          || 0,
        complete_registrations: +(r.complete_registrations) || 0,
        purchases:              +(r.purchases)              || 0,
        purchase_value:         +(r.purchase_value)         || 0,
        add_to_carts:           +(r.add_to_carts)           || 0,
        add_to_cart_value:      +(r.add_to_cart_value)      || 0,
      }));
    }
    return daily.map(r => ({
      ...r,
      campaign_name: r.campaign_name || r.name || '',
      name:          r.name || r.campaign_name || '',
      clicks:        +(r.link_clicks ?? r.clicks) || 0,
    }));
  },
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
    const rows = p?.metaInsightsRows || p?.metaRows || p?.metaChannels || [];
    return {
      campaign_name: uniq(rows, 'campaign_name'),
      adset_name:    uniq(rows, 'adset_name'),
      ad_name:       uniq(rows, 'ad_name'),
      date:          uniq(rows, 'date'),
    };
  },
  ga4: p => {
    const uniq = (rows, key) => [...new Set((rows || []).map(r => r[key]).filter(v => v != null && v !== ''))].sort();
    return {
      property_name:  uniq(p?.ga4Rows,        'property_name'),
      date:           uniq(p?.ga4Rows,        'date'),
      gender:         uniq(p?.ga4DemoRows,    'gender'),
      country:        uniq(p?.ga4SessionRows, 'country'),
      region:         uniq(p?.ga4SessionRows, 'region'),
      city:           uniq(p?.ga4SessionRows, 'city'),
      page_path:      uniq(p?.ga4PageRows,    'page_path'),
      device:         uniq(p?.ga4SessionRows, 'device'),
      channel_group:  uniq(p?.ga4SessionRows, 'channel_group'),
      medium:         uniq(p?.ga4SessionRows, 'medium'),
      source:         uniq(p?.ga4SessionRows, 'source'),
    };
  },
  search: p => {
    const uniq = (rows, key) => [...new Set((rows || []).map(r => r[key]).filter(v => v != null && v !== ''))].sort();
    return {
      query:   uniq(p?.gsc?.queries,   'query'),
      page:    uniq(p?.gsc?.pages,     'page'),
      date:    uniq(p?.gsc?.dates,     'date'),
      country: uniq(p?.gsc?.countries, 'country'),
      device:  uniq(p?.gsc?.devices,   'device'),
    };
  },
};

// FILTER_DIM_REGISTRY: source → (selectedDims) → [valid filter dim keys]
// Returns dims that actually exist in the routed row source for the given display dims.
window.FILTER_DIM_REGISTRY = {
  google: (_dims) => ['name', 'type', 'ad_group', 'keyword', 'match_type', 'device', 'segment_value'],
  meta:   (_dims) => ['campaign_name', 'adset_name', 'ad_name', 'date'],
  ga4:    (_dims) => ['property_name', 'date', 'gender', 'country', 'region', 'city', 'page_path', 'device', 'channel_group', 'medium', 'source'],
  search: (_dims) => ['query', 'page', 'country', 'device', 'date'],
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
