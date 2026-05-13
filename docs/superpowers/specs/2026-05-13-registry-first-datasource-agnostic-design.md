# Registry-First: Datasource-Agnostic Widget System

**Date:** 2026-05-13  
**Status:** Approved  
**Scope:** `widget-registry.js`, `data-bridge.jsx`, `screen-report.jsx`, `card-editor.jsx`

---

## Problem

When improvements are made to the table widget for Google Ads, they only apply to Google Ads. Meta, GA4, and GSC are left behind because `screen-report.jsx` has:

1. Hardcoded metric/dimension constants per datasource (`GOOGLE_TABLE_METRICS`, `META_TABLE_METRICS`, `SEARCH_TABLE_METRICS`, and their corresponding `*_DIMS` variants)
2. Explicit `if (src === 'google') ... else if (src === 'meta') ... else if (src === 'search')` branching inside `UniversalTableWidget`
3. `DIM_REGISTRY` in `widget-registry.js` lists dimensions that don't match actual Supabase columns (GA4 lists `source`, `channel`, `device`, `country` — none of which exist in `ga4_totals`)
4. `TABLE_DATA_REGISTRY` for GA4 returns `[]` — no table data available for GA4 at all
5. Editor panel section order is inconsistent across widget types

---

## Principle

**`widget-registry.js` is the single source of truth.** `screen-report.jsx` and `card-editor.jsx` only read from the registry — they define nothing themselves.

---

## Architecture

### What is removed

From `screen-report.jsx`:
- `GOOGLE_TABLE_METRICS`, `META_TABLE_METRICS`, `SEARCH_TABLE_METRICS`
- `GOOGLE_TABLE_DIMS`, `META_TABLE_DIMS`, `SEARCH_TABLE_DIMS`
- The `if (src === 'google') / else if (src === 'meta') / else if (src === 'search')` block inside `UniversalTableWidget`

### What changes

| File | Change |
|------|--------|
| `widget-registry.js` | Add `TABLE_METRICS_REGISTRY`; correct `DIM_REGISTRY` for GA4; update `TABLE_DATA_REGISTRY` for GA4 |
| `data-bridge.jsx` | Expose `ga4Rows` (raw daily rows) in `buildData` return value |
| `screen-report.jsx` | `UniversalTableWidget` becomes fully registry-driven; remove hardcoded constants |
| `card-editor.jsx` | Standardize Setup/Style tab section order via slot system |

---

## Registry Schema

### `TABLE_METRICS_REGISTRY` (new, in `widget-registry.js`)

Defines metrics available at the **row level** in tables (per campaign / per date / per query). Separate from `DATA_REGISTRY` which is for aggregated KPI totals.

```js
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
```

### `DIM_REGISTRY` — corrected

GA4 previously listed `source`, `channel`, `device`, `country` which do not exist in `ga4_totals`. Corrected to reflect actual Supabase columns:

```js
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
    { key: 'name', label: 'Campaign' },
  ],
  ga4: [
    { key: 'date',          label: 'Date' },
    { key: 'property_name', label: 'Property' },
  ],
  search: [
    { key: 'query', label: 'Query' },
    { key: 'page',  label: 'Page URL', fmtCell: 'url' },
  ],
};
```

### `TABLE_DATA_REGISTRY` — GA4 added

GA4 `bounce_rate` and `engagement_rate` are stored as decimals (0–1) in Supabase. The `DataTable` `pct` formatter only appends `%` — it does not multiply. So the values are normalized to 0–100 here before being passed to the table.

```js
window.TABLE_DATA_REGISTRY = {
  google: p => p?.campaigns || [],
  meta:   p => p?.metaChannels || [],
  ga4:    p => (p?.ga4Rows || []).map(r => ({
    ...r,
    bounce_rate:     (+(r.bounce_rate)     || 0) * 100,
    engagement_rate: (+(r.engagement_rate) || 0) * 100,
  })),
  search: p => p?.gsc?.queries || [],    // default; routing to pages stays in widget
};
```

---

## data-bridge.jsx Changes

`buildData` must return raw `ga4Rows` so the GA4 table can display daily rows:

```js
// Inside buildData return value, add:
ga4Rows: ga4Rows,   // raw rows from ga4_totals: date, property_name, sessions, total_users, new_users, bounce_rate, engaged_sessions, engagement_rate, avg_session_duration, event_count
```

---

## screen-report.jsx Changes

### `UniversalTableWidget` — fully registry-driven

```js
function UniversalTableWidget({ instance, p, cfg }) {
  const src = instance.source;
  const availDims    = window.DIM_REGISTRY?.[src] || [];
  const availMetrics = window.TABLE_METRICS_REGISTRY?.[src] || [];
  const selectedDims = cfg.dimensions || availDims.slice(0, 1).map(d => d.key);

  // Google advanced row-routing (dimension-driven, stays here because it depends on cfg)
  let rows;
  if (src === 'google') {
    const filterKeys = new Set((cfg.filters || []).map(f => f.dim).filter(Boolean));
    if (filterKeys.has('device')) {
      if (selectedDims.includes('keyword'))       rows = p?.keywordDeviceRows || [];
      else if (selectedDims.includes('ad_group')) rows = p?.adGroupDeviceRows || [];
      else                                        rows = p?.deviceRows        || [];
    } else if (filterKeys.has('segment_value')) {
      rows = p?.genderRows || [];
    } else if (selectedDims.includes('device'))        rows = p?.deviceRows   || [];
    else if (selectedDims.includes('segment_value'))   rows = p?.genderRows   || [];
    else if (selectedDims.includes('keyword'))         rows = p?.keywords     || [];
    else if (selectedDims.includes('ad_group'))        rows = p?.adGroups     || [];
    else                                               rows = p?.campaigns    || [];
  } else if (src === 'search') {
    // Search routing: queries vs pages based on selected dim
    rows = selectedDims.includes('page') ? (p?.gsc?.pages || []) : (p?.gsc?.queries || []);
  } else {
    rows = (window.TABLE_DATA_REGISTRY?.[src] || (() => []))(p) || [];
  }

  return (
    <DataTable
      widgetId={instance.id}
      widgetConfig={cfg}
      rows={rows}
      availDims={availDims}
      availMetrics={availMetrics}
      defaultDims={selectedDims}
      defaultMetrics={cfg.metrics || availMetrics.slice(0, 5).map(m => m.key)}
      defaultName={cfg.name || 'Data Table'}
      customMetrics={cfg.customMetrics || []}
    />
  );
}
```

Note: Google and Search advanced routing stays in-widget because it depends on `cfg.dimensions` and `cfg.filters` at render time. All other sources are fully registry-driven. This is the correct boundary — routing logic that depends on widget config belongs in the widget; static data shape belongs in the registry.

---

## card-editor.jsx Changes

### Setup tab slot system

```js
const WIDGET_HAS_DIMS    = new Set(['table', 'chart-donut']);
const WIDGET_HAS_METRICS = new Set(['table', 'kpi-strip', 'single-stat', 'chart-area', 'chart-bar', 'chart-donut']);

function SetupTab({ type, source, cfg, onChange }) {
  const hasDims    = WIDGET_HAS_DIMS.has(type);
  const hasMetrics = WIDGET_HAS_METRICS.has(type);
  return (
    <>
      {/* Slot 1 — always */}
      <WidgetNameSection cfg={cfg} onChange={onChange} />
      {/* Slot 2 — widgets with data source */}
      {source && <DataSourceSection source={source} cfg={cfg} onChange={onChange} />}
      {/* Slot 3 — widgets with dimensions */}
      {hasDims && <DimensionsSection source={source} cfg={cfg} onChange={onChange} />}
      {/* Slot 4 — widgets with metrics */}
      {hasMetrics && <MetricsSection source={source} cfg={cfg} onChange={onChange} />}
      {/* Slot 5 — widgets with dims or metrics */}
      {(hasDims || hasMetrics) && <FiltersSection source={source} cfg={cfg} onChange={onChange} />}
    </>
  );
}
```

### Style tab slot system

```js
function StyleTab({ type, source, cfg, onChange }) {
  return (
    <>
      {/* Slot 1 — always */}
      <FontSizeSection cfg={cfg} onChange={onChange} />
      {/* Slot 2 — widgets with data source */}
      {source && <SourceStyleSection type={type} source={source} cfg={cfg} onChange={onChange} />}
    </>
  );
}
```

---

## What This Solves

After this change, any improvement to the `DataTable` component automatically applies to all datasources — Google, Meta, GA4, and Search. Any new metric added to `TABLE_METRICS_REGISTRY` for a source immediately appears in that source's table editor. No more per-source branches to maintain.

To add a new datasource in the future: add entries to `DATA_REGISTRY`, `DIM_REGISTRY`, `TABLE_METRICS_REGISTRY`, `TABLE_DATA_REGISTRY`, `WIDGET_DEFAULTS`, and `DIM_VALUES_EXTRACTOR` in `widget-registry.js`. No changes needed in `screen-report.jsx` or `card-editor.jsx`.

---

## Out of Scope

- Adding new Supabase tables or columns
- Changing how data is fetched in `data-bridge.jsx` (only the return shape changes)
- Custom metrics system (already working correctly)
- Chart widgets (only table and editor panel hierarchy are in scope)
