# Universal Widget System — Phase 1 Design Spec

**Date:** 2026-05-12
**Status:** Approved

---

## Goal

Replace the current data-source-coupled widget system (where widget identity is tied to a specific source like Google Ads or Meta Ads) with a universal widget architecture where each widget instance is independently configured with its own visual type, data source, and metric/dimension selections. Changes made to one widget instance never affect any other widget.

---

## Problem with Current Architecture

1. **Widget IDs encode data source** — `google-kpi`, `meta-trend`, `ga4-sessions` are hardcoded to specific sources. A "KPI Strip" widget for Google Ads is a completely different object from a "KPI Strip" for Meta Ads.
2. **Config is per-card-type, not per-instance** — All `table-campaigns` widgets share one config. Changing columns on the Campaigns Table also changes the Ad Groups Table and Keywords Table.
3. **Rendering is hardcoded by section** — `GoogleAdsSection`, `MetaAdsSection`, `GA4Section`, `SearchSection` each hardcode which data fields they read. There is no way to render a Meta Ads metric inside a Google Ads widget slot.
4. **Widget browser shows source-specific labels** — "Google Ads KPI", "Meta KPI" instead of just "KPI Strip".

---

## Architecture Overview

```
Layout Row Entry (new)
  { id: 'w_abc123', type: 'kpi-strip', source: 'google', span: 12 }
          │                │                  │
          │                │                  └── DATA_REGISTRY[source] → metric values
          │                └── UniversalWidget dispatcher
          └── widgetConfigs['w_abc123'] → per-instance config
```

Three new building blocks:
1. **Widget Instance Model** — new layout entry format with `type` + `source` + unique `id`
2. **DATA_REGISTRY** — lookup table mapping `(source, metricKey)` → value extractor from `p`
3. **UniversalWidget** — single dispatcher that renders any widget type from instance + data + config

---

## Section 1: Widget Instance Model

### Layout Entry Format

**Old:**
```js
{ id: 'google-kpi', span: 12 }
```

**New:**
```js
{ id: 'w_1716500000_abc', type: 'kpi-strip', source: 'google', span: 12 }
```

Fields:
- `id` — unique instance ID, generated as `'w_' + Date.now() + '_' + Math.random().toString(36).slice(2,6)`
- `type` — visual type, one of: `'kpi-strip'`, `'single-stat'`, `'chart-area'`, `'chart-bar'`, `'chart-donut'`, `'chart-heatmap'`, `'table'`, `'text'`
- `source` — data source, one of: `'google'`, `'meta'`, `'ga4'`, `'search'`; `null` for `'text'` type
- `span` — column width 1–12, unchanged

### Widget Config Storage

**Old key:** `widgetConfigs[WIDGET_CARD_TYPES[widgetId]]` — e.g. `widgetConfigs['table-campaigns']`

**New key:** `widgetConfigs[instance.id]` — e.g. `widgetConfigs['w_1716500000_abc']`

Config shape per type:

| Type | Config Keys |
|------|-------------|
| `kpi-strip` | `name`, `metrics: string[]`, `metricLabels: {}`, `fontSize: 'S'\|'M'\|'L'` |
| `single-stat` | `name`, `metric: string`, `label: string`, `fontSize: 'S'\|'M'\|'L'` |
| `chart-area` | `name`, `metric: string`, `fontSize: 'S'\|'M'\|'L'` |
| `chart-bar` | `name`, `metric: string`, `fontSize: 'S'\|'M'\|'L'` |
| `chart-donut` | `name`, `metric: string`, `dimension: string` |
| `chart-heatmap` | `name` |
| `table` | `name`, `dimensions: string[]`, `metrics: string[]`, `metricLabels: {}`, `filters: Filter[]`, `pageSize: number`, `fontSize: 'S'\|'M'\|'L'` |
| `text` | `title: string`, `body: string` |

Default configs are applied when a widget instance has no saved config yet. Defaults are defined per `(type, source)` pair in `widget-registry.js`.

---

## Section 2: DATA_REGISTRY

**File:** `app/assets/components/widget-registry.js`

A global registry mapping each source to its available metrics and table data.

### Metric Registry

```js
window.DATA_REGISTRY = {
  google: {
    spend:       { label: 'Total Spend',   format: 'rupiah', value: p => p?.ads?.spend,       prev: p => p?.adsPrev?.spend,       series: p => p?.series?.spend },
    clicks:      { label: 'Clicks',        format: 'num',    value: p => p?.ads?.clicks,      prev: p => p?.adsPrev?.clicks,      series: p => p?.series?.clicks },
    impressions: { label: 'Impressions',   format: 'num',    value: p => p?.ads?.impressions, prev: p => p?.adsPrev?.impressions },
    conversions: { label: 'Conversions',   format: 'num',    value: p => p?.ads?.conversions, prev: p => p?.adsPrev?.conversions },
    ctr:         { label: 'CTR',           format: 'pct',    value: p => p?.ads?.ctr,         prev: p => p?.adsPrev?.ctr },
    cpc:         { label: 'Avg CPC',       format: 'rupiah', value: p => p?.ads?.cpc },
    cpa:         { label: 'CPA',           format: 'rupiah', value: p => p?.ads?.cpa,         prev: p => p?.adsPrev?.cpa },
    roas:        { label: 'ROAS',          format: 'roas',   value: p => p?.ads?.roas,        prev: p => p?.adsPrev?.roas },
  },
  meta: {
    spend:       { label: 'Total Spend',   format: 'rupiah', value: p => p?.meta?.spend,       prev: p => p?.metaPrev?.spend,       series: p => p?.metaSeries?.spend },
    impressions: { label: 'Impressions',   format: 'num',    value: p => p?.meta?.impressions, prev: p => p?.metaPrev?.impressions, series: p => p?.metaSeries?.impressions },
    clicks:      { label: 'Link Clicks',   format: 'num',    value: p => p?.meta?.clicks,      prev: p => p?.metaPrev?.clicks,      series: p => p?.metaSeries?.clicks },
    conversions: { label: 'Conversions',   format: 'num',    value: p => p?.meta?.conversions, prev: p => p?.metaPrev?.conversions },
    cpm:         { label: 'CPM',           format: 'rupiah', value: p => p?.meta?.cpm },
    ctr:         { label: 'CTR',           format: 'pct',    value: p => p?.meta?.ctr,         prev: p => p?.metaPrev?.ctr },
    cpa:         { label: 'CPA',           format: 'rupiah', value: p => p?.meta?.cpa },
  },
  ga4: {
    sessions:    { label: 'Sessions',      format: 'num',    value: p => p?.ga4?.sessions,    prev: p => p?.ga4Prev?.sessions,    series: p => p?.series?.impressions },
    users:       { label: 'Users',         format: 'num',    value: p => p?.ga4?.users,       prev: p => p?.ga4Prev?.users },
    pageviews:   { label: 'Pageviews',     format: 'num',    value: p => p?.ga4?.pageviews,   prev: p => p?.ga4Prev?.pageviews },
    engaged:     { label: 'Engaged',       format: 'num',    value: p => p?.ga4?.engaged,     prev: p => p?.ga4Prev?.engaged },
    bounce_rate: { label: 'Bounce Rate',   format: 'pct',    value: p => p?.ga4?.bounce_rate, prev: p => p?.ga4Prev?.bounce_rate },
  },
  search: {
    impressions: { label: 'Impressions',   format: 'num',    value: p => p?.gsc?.impressions, prev: p => p?.gscPrev?.impressions, series: p => p?.gsc?.series?.impressions },
    clicks:      { label: 'Clicks',        format: 'num',    value: p => p?.gsc?.clicks,      prev: p => p?.gscPrev?.clicks,      series: p => p?.gsc?.series?.clicks },
    ctr:         { label: 'CTR',           format: 'pct',    value: p => p?.gsc?.ctr,         prev: p => p?.gscPrev?.ctr },
    position:    { label: 'Avg Position',  format: 'num',    value: p => p?.gsc?.position,    prev: p => p?.gscPrev?.position },
  },
};
```

### Dimension Registry

```js
window.DIM_REGISTRY = {
  google: [
    { key: 'name',     label: 'Campaign' },
    { key: 'ad_group', label: 'Ad Group' },
    { key: 'keyword',  label: 'Keyword' },
    { key: 'type',     label: 'Campaign Type' },
    { key: 'device',   label: 'Device' },
  ],
  meta: [
    { key: 'campaign', label: 'Campaign' },
    { key: 'ad_set',   label: 'Ad Set' },
    { key: 'ad',       label: 'Ad' },
    { key: 'placement',label: 'Placement' },
    { key: 'device',   label: 'Device' },
  ],
  ga4: [
    { key: 'source',   label: 'Source' },
    { key: 'medium',   label: 'Medium' },
    { key: 'channel',  label: 'Channel' },
    { key: 'device',   label: 'Device' },
    { key: 'country',  label: 'Country' },
  ],
  search: [
    { key: 'query',    label: 'Query' },
    { key: 'page',     label: 'Page' },
    { key: 'country',  label: 'Country' },
    { key: 'device',   label: 'Device' },
  ],
};
```

### Table Row Data Registry

```js
window.TABLE_DATA_REGISTRY = {
  google: p => p?.campaigns || [],
  meta:   p => p?.metaChannels || [],
  ga4:    p => [],   // GA4 table rows TBD based on available data
  search: p => [...(p?.gsc?.queries || []), ...(p?.gsc?.pages || [])],
};
```

### Default Configs Registry

```js
window.WIDGET_DEFAULTS = {
  'kpi-strip': {
    google: { metrics: ['spend','clicks','impressions','ctr'], fontSize: 'M' },
    meta:   { metrics: ['spend','impressions','clicks','ctr'], fontSize: 'M' },
    ga4:    { metrics: ['sessions','users','pageviews','bounce_rate'], fontSize: 'M' },
    search: { metrics: ['impressions','clicks','ctr','position'], fontSize: 'M' },
  },
  'single-stat': {
    google: { metric: 'spend', fontSize: 'L' },
    meta:   { metric: 'spend', fontSize: 'L' },
    ga4:    { metric: 'sessions', fontSize: 'L' },
    search: { metric: 'clicks', fontSize: 'L' },
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
    google: { metric: 'spend',      dimension: 'type' },
    meta:   { metric: 'spend',      dimension: 'placement' },
    ga4:    { metric: 'sessions',   dimension: 'channel' },
    search: { metric: 'clicks',     dimension: 'device' },
  },
  'chart-heatmap': {
    google: {}, meta: {}, ga4: {}, search: {},
  },
  'table': {
    google: { dimensions: ['name'], metrics: ['spend','clicks','impressions','ctr','cpa'], pageSize: 10, fontSize: 'M' },
    meta:   { dimensions: ['campaign'], metrics: ['spend','impressions','clicks','ctr'], pageSize: 10, fontSize: 'M' },
    ga4:    { dimensions: ['source'], metrics: ['sessions','users','pageviews'], pageSize: 10, fontSize: 'M' },
    search: { dimensions: ['query'], metrics: ['impressions','clicks','ctr','position'], pageSize: 10, fontSize: 'M' },
  },
  'text': { title: '', body: '' },
};
```

---

## Section 3: UniversalWidget Dispatcher

**File:** `app/assets/components/screen-report.jsx`

Replace the four section functions (`GoogleAdsSection`, `MetaAdsSection`, `GA4Section`, `SearchSection`) and `buildWidgetMap` with a single `UniversalWidget` component and a new `buildUniversalMap` function.

```js
function UniversalWidget({ instance, p, widgetConfig, editState }) {
  const src    = instance.source;
  const type   = instance.type;
  const reg    = window.DATA_REGISTRY?.[src] || {};
  const dims   = window.DIM_REGISTRY?.[src]  || [];
  const rows   = (window.TABLE_DATA_REGISTRY?.[src] || (() => []))(p);
  const cfg    = { ...(window.WIDGET_DEFAULTS?.[type]?.[src] || {}), ...(widgetConfig || {}) };

  switch (type) {
    case 'kpi-strip':    return <KpiStripWidget    reg={reg} p={p} cfg={cfg} />;
    case 'single-stat':  return <SingleStatWidget  reg={reg} p={p} cfg={cfg} />;
    case 'chart-area':   return <ChartAreaWidget   reg={reg} p={p} cfg={cfg} />;
    case 'chart-bar':    return <ChartBarWidget    reg={reg} p={p} cfg={cfg} />;
    case 'chart-donut':  return <ChartDonutWidget  reg={reg} p={p} cfg={cfg} dims={dims} />;
    case 'chart-heatmap':return <ChartHeatmapWidget p={p} src={src} cfg={cfg} />;
    case 'table':        return <UniversalTableWidget rows={rows} reg={reg} dims={dims} cfg={cfg} />;
    case 'text':         return <TextWidget        cfg={cfg} />;
    default:             return null;
  }
}
```

### Sub-renderer Contracts

**KpiStripWidget** — renders up to 6 `<Kpi>` components from `cfg.metrics[]`. Each metric looked up in `reg[metricKey]` to get `value(p)`, `prev(p)`, `series(p)`, label, and format. Custom label from `cfg.metricLabels[key]` overrides registry label.

**SingleStatWidget** — renders one large `<Kpi>` from `cfg.metric`. Same lookup pattern.

**ChartAreaWidget / ChartBarWidget** — renders `ChartCard` with `series = reg[cfg.metric].series(p)`. Title from `cfg.name || reg[cfg.metric].label`.

**ChartDonutWidget** — groups `rows` by `cfg.dimension`, sums `cfg.metric` per group. Falls back to static `metaChannels` / campaign types if no row data.

**ChartHeatmapWidget** — renders the 28-day heatmap grid. For GA4, uses existing heatmap data. For other sources, uses daily series data normalized 0–1 across a 4×7 grid.

**UniversalTableWidget** — replaces `DataTable`. Accepts `rows`, `reg` (metric definitions), `dims` (dimension definitions), and `cfg`. Column rendering and sorting logic identical to current `DataTable`.

**TextWidget** — renders `cfg.title` as a heading and `cfg.body` as body text inside a card.

---

## Section 4: Smart Default Layout Generator

**File:** `app/assets/components/screen-report.jsx`

Replace current `getDefaultLayout(connected)` with:

```js
function getSmartDefaultLayout(connected) {
  const uid = () => 'w_' + Date.now() + '_' + Math.random().toString(36).slice(2,6);
  const rows = [];

  if (connected?.google) {
    rows.push(
      [{ id: uid(), type: 'kpi-strip',   source: 'google', span: 12 }],
      [{ id: uid(), type: 'chart-area',  source: 'google', span: 7  },
       { id: uid(), type: 'chart-donut', source: 'google', span: 5  }],
      [{ id: uid(), type: 'chart-bar',   source: 'google', span: 12 }],
      [{ id: uid(), type: 'table',       source: 'google', span: 12 }],
    );
  }
  if (connected?.meta) {
    rows.push(
      [{ id: uid(), type: 'kpi-strip',   source: 'meta',   span: 12 }],
      [{ id: uid(), type: 'chart-area',  source: 'meta',   span: 7  },
       { id: uid(), type: 'chart-donut', source: 'meta',   span: 5  }],
    );
  }
  if (connected?.ga4) {
    rows.push(
      [{ id: uid(), type: 'kpi-strip',    source: 'ga4',   span: 12 }],
      [{ id: uid(), type: 'chart-area',   source: 'ga4',   span: 7  },
       { id: uid(), type: 'chart-heatmap',source: 'ga4',   span: 5  }],
    );
  }
  if (connected?.search) {
    rows.push(
      [{ id: uid(), type: 'kpi-strip',   source: 'search', span: 12 }],
      [{ id: uid(), type: 'chart-donut', source: 'search', span: 5  },
       { id: uid(), type: 'chart-area',  source: 'search', span: 7  }],
      [{ id: uid(), type: 'table',       source: 'search', span: 12 }],
    );
  }
  return { rows };
}
```

---

## Section 5: Legacy Migration

Run once on app load, before any render. Detects old layout format (entry has no `type` field) and converts:

```js
const LEGACY_ID_MAP = {
  'google-kpi':      { type: 'kpi-strip',    source: 'google' },
  'google-spend':    { type: 'chart-area',   source: 'google' },
  'google-clicks':   { type: 'chart-bar',    source: 'google' },
  'google-budget':   { type: 'chart-donut',  source: 'google' },
  'google-campaigns':{ type: 'table',        source: 'google' },
  'google-adgroups': { type: 'table',        source: 'google' },
  'google-keywords': { type: 'table',        source: 'google' },
  'meta-kpi':        { type: 'kpi-strip',    source: 'meta'   },
  'meta-trend':      { type: 'chart-area',   source: 'meta'   },
  'meta-donut':      { type: 'chart-donut',  source: 'meta'   },
  'ga4-kpi':         { type: 'kpi-strip',    source: 'ga4'    },
  'ga4-sessions':    { type: 'chart-area',   source: 'ga4'    },
  'ga4-heatmap':     { type: 'chart-heatmap',source: 'ga4'    },
  'ga4-conversion':  { type: 'chart-bar',    source: 'ga4'    },
  'search-kpi':      { type: 'kpi-strip',    source: 'search' },
  'search-position': { type: 'chart-donut',  source: 'search' },
  'search-ctr':      { type: 'chart-area',   source: 'search' },
  'search-clicks':   { type: 'chart-bar',    source: 'search' },
  'search-queries':  { type: 'table',        source: 'search' },
  'search-pages':    { type: 'table',        source: 'search' },
};

function migrateLegacyLayout(layout) {
  if (!layout?.rows) return layout;
  const isLegacy = layout.rows.flat().some(w => !w.type);
  if (!isLegacy) return layout;
  return {
    rows: layout.rows.map(row =>
      row.map(w => {
        if (w.type) return w;
        const mapped = LEGACY_ID_MAP[w.id];
        if (!mapped) return null;
        return { id: 'w_' + w.id, ...mapped, span: w.span };
      }).filter(Boolean)
    )
  };
}
```

Old `widgetConfigs` (keyed by card type like `table-campaigns`) are discarded — per-instance config starts fresh. This is acceptable since the old config was shared and often incorrect.

---

## Section 6: Widget Browser Update

The Browse tab in `card-editor.jsx` currently shows hardcoded entries that include source names. Replace with universal type entries:

| Display Name | Type Key | Icon |
|---|---|---|
| KPI Strip | `kpi-strip` | grid-2x2 |
| Single Stat | `single-stat` | hash |
| Area Chart | `chart-area` | trending-up |
| Bar Chart | `chart-bar` | bar-chart |
| Donut Chart | `chart-donut` | pie-chart |
| Heatmap | `chart-heatmap` | calendar |
| Table | `table` | table |
| Text | `text` | type |

When a widget is dragged from the Browse tab onto the canvas, it creates a new instance with:
- `type` from the browser entry
- `source` defaulting to the first connected source in order: `google` → `meta` → `ga4` → `search`
- `id` freshly generated

---

## Files Changed

| File | Type | Change |
|------|------|--------|
| `app/assets/components/widget-registry.js` | **New** | DATA_REGISTRY, DIM_REGISTRY, TABLE_DATA_REGISTRY, WIDGET_DEFAULTS |
| `app/index.html` | Modify | Add `<script src="assets/components/widget-registry.js">` before screen-report |
| `app/assets/components/screen-report.jsx` | Modify | Replace 4 section functions + buildWidgetMap → UniversalWidget + sub-renderers; replace getDefaultLayout → getSmartDefaultLayout; add migrateLegacyLayout; update WIDGET_CARD_TYPES/WIDGET_DISPLAY_NAMES |
| `app/assets/components/card-editor.jsx` | Modify | Update Browse tab entries; update Setup tab to read/write instance-keyed config; add source selector |

---

## Out of Scope (Phase 2)

- Type-specific editor panels (per-widget Setup UI with source selector, metric picker, dimension picker)
- Text widget rich text editor
- Template system
