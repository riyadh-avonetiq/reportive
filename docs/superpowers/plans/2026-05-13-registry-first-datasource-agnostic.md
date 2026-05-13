# Registry-First: Datasource-Agnostic Widget System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make widget improvements (especially tables) apply to all datasources automatically by making `widget-registry.js` the single source of truth, eliminating hardcoded per-source constants from `screen-report.jsx` and `card-editor.jsx`.

**Architecture:** Add `TABLE_METRICS_REGISTRY` to `widget-registry.js` for row-level table metrics; expose raw `ga4Rows` from `data-bridge.jsx`; replace `UniversalTableWidget`'s per-source branches with pure registry reads; standardize editor Setup tab order and use `TABLE_METRICS_REGISTRY` for table widgets in the editor.

**Tech Stack:** Vanilla React (JSX, no build step), served statically. All JS loaded via `<script>` tags. Browser console is the only test runner.

---

## File Map

| File | What Changes |
|------|-------------|
| `app/assets/components/widget-registry.js` | Add `TABLE_METRICS_REGISTRY`; fix GA4 in `DIM_REGISTRY`; update GA4 in `TABLE_DATA_REGISTRY` |
| `app/assets/js/data-bridge.jsx` | Add `ga4Rows` to `buildData` return value |
| `app/assets/components/screen-report.jsx` | Delete 6 hardcoded constants; update `UniversalTableWidget`; update 10 inline `DataTable` call sites |
| `app/assets/components/card-editor.jsx` | Use `TABLE_METRICS_REGISTRY` for table `availM`; fix donut dim/metric order; remove `SOURCE_METRICS`/`SOURCE_DIMS` |

---

## Task 1: Add `TABLE_METRICS_REGISTRY` to `widget-registry.js`

**Files:**
- Modify: `app/assets/components/widget-registry.js:47-77` (`DIM_REGISTRY` and `TABLE_DATA_REGISTRY`)

### Context

`widget-registry.js` currently has no `TABLE_METRICS_REGISTRY`. The GA4 `DIM_REGISTRY` entry lists columns that don't exist in `ga4_totals` (`source`, `channel`, `device`, `country`). The GA4 `TABLE_DATA_REGISTRY` entry returns `[]`.

- [ ] **Step 1: Add `TABLE_METRICS_REGISTRY` after `DIM_REGISTRY` in `widget-registry.js`**

In `app/assets/components/widget-registry.js`, after the closing `};` of `window.DIM_REGISTRY` (currently ends around line 70), insert:

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

- [ ] **Step 2: Fix GA4 in `DIM_REGISTRY`**

In `widget-registry.js`, replace the existing `ga4` entry inside `window.DIM_REGISTRY`:

Old:
```js
  ga4: [
    { key: 'source',     label: 'Source / Medium' },
    { key: 'channel',    label: 'Channel' },
    { key: 'device',     label: 'Device' },
    { key: 'country',    label: 'Country' },
  ],
```

New:
```js
  ga4: [
    { key: 'date',          label: 'Date' },
    { key: 'property_name', label: 'Property' },
  ],
```

- [ ] **Step 3: Fix GA4 in `TABLE_DATA_REGISTRY`**

In `widget-registry.js`, replace the existing `ga4` entry inside `window.TABLE_DATA_REGISTRY`:

Old:
```js
  ga4:    p => [],
```

New:
```js
  ga4:    p => (p?.ga4Rows || []).map(r => ({
    ...r,
    bounce_rate:     (+(r.bounce_rate)     || 0) * 100,
    engagement_rate: (+(r.engagement_rate) || 0) * 100,
  })),
```

Note: GA4 stores `bounce_rate` and `engagement_rate` as decimals (0–1) from the API. The `DataTable` `pct` formatter appends `%` without multiplying, so we normalize to 0–100 here.

- [ ] **Step 4: Verify in browser console**

Open the app in a browser, open DevTools console, and run:

```js
console.log(Object.keys(window.TABLE_METRICS_REGISTRY));
// Expected: ["google", "meta", "ga4", "search"]

console.log(window.DIM_REGISTRY.ga4);
// Expected: [{key: "date", label: "Date"}, {key: "property_name", label: "Property"}]

console.log(window.TABLE_DATA_REGISTRY.ga4({ ga4Rows: [{date:'2025-01-01', bounce_rate: 0.38, engagement_rate: 0.62}] }));
// Expected: [{date:'2025-01-01', bounce_rate: 38, engagement_rate: 62}]
```

- [ ] **Step 5: Commit**

```bash
git add app/assets/components/widget-registry.js
git commit -m "feat: add TABLE_METRICS_REGISTRY; fix GA4 dims and TABLE_DATA_REGISTRY"
```

---

## Task 2: Expose `ga4Rows` in `data-bridge.jsx`

**Files:**
- Modify: `app/assets/js/data-bridge.jsx:501-508` (`buildData` return value)

### Context

`buildData` (line 278) receives `ga4Rows` as its second parameter but does not include it in the returned object. `TABLE_DATA_REGISTRY.ga4` needs `p.ga4Rows` to display daily rows in GA4 tables.

- [ ] **Step 1: Add `ga4Rows` to `buildData` return value**

In `app/assets/js/data-bridge.jsx`, find the `return {` at line 501 and add `ga4Rows` to the returned object:

Old:
```js
  return {
    key: `${from || 'all'}:${to || 'all'}`,
    labelShort, labelLong,
    prevKey: prevLabel || null,
    ads, adsPrev, meta, metaPrev, ga4, ga4Prev, psi, gsc, gscPrev,
    series, channels, campaigns, metaSeries, metaChannels,
    adGroups, keywords, keywordDeviceRows, adGroupDeviceRows, deviceRows, genderRows, conversionActions,
  };
```

New:
```js
  return {
    key: `${from || 'all'}:${to || 'all'}`,
    labelShort, labelLong,
    prevKey: prevLabel || null,
    ads, adsPrev, meta, metaPrev, ga4, ga4Prev, psi, gsc, gscPrev,
    series, channels, campaigns, metaSeries, metaChannels,
    adGroups, keywords, keywordDeviceRows, adGroupDeviceRows, deviceRows, genderRows, conversionActions,
    ga4Rows,
  };
```

- [ ] **Step 2: Verify in browser console**

With a GA4 property connected, open DevTools and run:

```js
const ctx = window.__LIVE_CTX__;  // or use React DevTools to find the DataCtx value
// Easier: check that ga4Rows exists in the data object
// Navigate to a report, open React DevTools → find LiveProvider context → data.ga4Rows
// Expected: an array of raw daily rows with keys: date, property_name, sessions, total_users, etc.
```

If no GA4 is connected, `ga4Rows` will be `[]` (empty array) — that is correct.

- [ ] **Step 3: Commit**

```bash
git add app/assets/js/data-bridge.jsx
git commit -m "feat: expose ga4Rows in buildData for GA4 table support"
```

---

## Task 3: Update `screen-report.jsx` — delete hardcoded constants and update DataTable call sites

**Files:**
- Modify: `app/assets/components/screen-report.jsx:867-911` (delete constants)
- Modify: `app/assets/components/screen-report.jsx:1375-1430` (`UniversalTableWidget`)
- Modify: `app/assets/components/screen-report.jsx:1668,1679,1690` (Google DataTable calls)
- Modify: `app/assets/components/screen-report.jsx:1928,1939` (Search DataTable calls)
- Modify: `app/assets/components/screen-report.jsx:2621,2630,2639` (Google DataTable calls duplicate set)
- Modify: `app/assets/components/screen-report.jsx:3176,3185` (Search DataTable calls duplicate set)

### Context

`GOOGLE_TABLE_DIMS`, `GOOGLE_TABLE_METRICS`, `META_TABLE_DIMS`, `META_TABLE_METRICS`, `SEARCH_TABLE_DIMS`, `SEARCH_TABLE_METRICS` are hardcoded constants at lines 867–911. They are used in `UniversalTableWidget` and in 10 inline `DataTable` call sites. All of these will be replaced with reads from `window.DIM_REGISTRY` and `window.TABLE_METRICS_REGISTRY`.

- [ ] **Step 1: Delete the 6 hardcoded constants (lines 867–911)**

Remove the entire block from `screen-report.jsx`:

```js
const GOOGLE_TABLE_DIMS = [
  { key: 'name',       label: 'Campaign' },
  { key: 'type',       label: 'Campaign Type' },
  { key: 'ad_group',   label: 'Ad Group' },
  { key: 'keyword',    label: 'Keyword' },
  { key: 'match_type', label: 'Match Type' },
];
const GOOGLE_TABLE_METRICS = [
  { key: 'spend',       label: 'Spend',       fmt: 'rupiah' },
  { key: 'clicks',      label: 'Clicks',      fmt: 'num' },
  { key: 'impressions', label: 'Impressions', fmt: 'num' },
  { key: 'conversions', label: 'Conversions', fmt: 'num' },
  { key: 'ctr',         label: 'CTR',         fmt: 'pct' },
  { key: 'cpc',         label: 'Avg CPC',     fmt: 'rupiah' },
  { key: 'cvr',         label: 'Conv. Rate',  fmt: 'pct' },
  { key: 'cpa',         label: 'CPA',         fmt: 'rupiah' },
];
const META_TABLE_DIMS = [
  { key: 'name', label: 'Campaign' },
];
const META_TABLE_METRICS = [
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
];
const SEARCH_TABLE_DIMS = [
  { key: 'query', label: 'Query' },
  { key: 'page',  label: 'Page URL', fmtCell: 'url' },
];
const SEARCH_TABLE_METRICS = [
  { key: 'impressions', label: 'Impressions',  fmt: 'num' },
  { key: 'clicks',      label: 'Clicks',       fmt: 'num' },
  { key: 'ctr',         label: 'CTR',          fmt: 'pct' },
  { key: 'position',    label: 'Avg Position', fmt: 'num' },
];
```

- [ ] **Step 2: Rewrite `UniversalTableWidget` (lines 1375–1430)**

Replace the entire `UniversalTableWidget` function with:

```js
function UniversalTableWidget({ instance, p, cfg }) {
  const src          = instance.source;
  const availDims    = window.DIM_REGISTRY?.[src] || [];
  const availMetrics = window.TABLE_METRICS_REGISTRY?.[src] || [];
  const selectedDims = cfg.dimensions || availDims.slice(0, 1).map(d => d.key);

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

- [ ] **Step 3: Update 3 Google `DataTable` call sites (around lines 1668, 1679, 1690)**

These are in the pre-built widget map function. Replace each one:

**google-campaigns** (around line 1667–1671):

Old:
```js
          <DataTable widgetId="google-campaigns" widgetConfig={wcfg('google-campaigns')}
            rows={campaigns} availDims={GOOGLE_TABLE_DIMS} availMetrics={GOOGLE_TABLE_METRICS}
            defaultDims={['name']} defaultMetrics={['spend','clicks','impressions','ctr','cpa']}
            defaultName="Campaigns · Google Ads"/>
```

New:
```js
          <DataTable widgetId="google-campaigns" widgetConfig={wcfg('google-campaigns')}
            rows={campaigns} availDims={window.DIM_REGISTRY?.google || []} availMetrics={window.TABLE_METRICS_REGISTRY?.google || []}
            defaultDims={['name']} defaultMetrics={['spend','clicks','impressions','ctr','cpa']}
            defaultName="Campaigns · Google Ads"/>
```

**google-adgroups** (around line 1678–1682):

Old:
```js
          <DataTable widgetId="google-adgroups" widgetConfig={wcfg('google-adgroups')}
            rows={p.adGroups} availDims={GOOGLE_TABLE_DIMS} availMetrics={GOOGLE_TABLE_METRICS}
            defaultDims={['ad_group','name']} defaultMetrics={['spend','clicks','ctr','cpa']}
            defaultName="Ad Groups · Google Ads"/>
```

New:
```js
          <DataTable widgetId="google-adgroups" widgetConfig={wcfg('google-adgroups')}
            rows={p.adGroups} availDims={window.DIM_REGISTRY?.google || []} availMetrics={window.TABLE_METRICS_REGISTRY?.google || []}
            defaultDims={['ad_group','name']} defaultMetrics={['spend','clicks','ctr','cpa']}
            defaultName="Ad Groups · Google Ads"/>
```

**google-keywords** (around line 1689–1693):

Old:
```js
          <DataTable widgetId="google-keywords" widgetConfig={wcfg('google-keywords')}
            rows={p.keywords} availDims={GOOGLE_TABLE_DIMS} availMetrics={GOOGLE_TABLE_METRICS}
            defaultDims={['keyword']} defaultMetrics={['spend','clicks','ctr','cpa']}
            defaultName="Keywords · Google Ads"/>
```

New:
```js
          <DataTable widgetId="google-keywords" widgetConfig={wcfg('google-keywords')}
            rows={p.keywords} availDims={window.DIM_REGISTRY?.google || []} availMetrics={window.TABLE_METRICS_REGISTRY?.google || []}
            defaultDims={['keyword']} defaultMetrics={['spend','clicks','ctr','cpa']}
            defaultName="Keywords · Google Ads"/>
```

- [ ] **Step 4: Update 2 Search `DataTable` call sites (around lines 1928, 1939)**

**search-queries** (around line 1927–1931):

Old:
```js
          <DataTable widgetId="search-queries" widgetConfig={wcfg('search-queries')}
            rows={queries} availDims={SEARCH_TABLE_DIMS} availMetrics={SEARCH_TABLE_METRICS}
            defaultDims={['query']} defaultMetrics={['impressions','clicks','ctr','position']}
            defaultName="Top Queries · Search Console"/>
```

New:
```js
          <DataTable widgetId="search-queries" widgetConfig={wcfg('search-queries')}
            rows={queries} availDims={window.DIM_REGISTRY?.search || []} availMetrics={window.TABLE_METRICS_REGISTRY?.search || []}
            defaultDims={['query']} defaultMetrics={['impressions','clicks','ctr','position']}
            defaultName="Top Queries · Search Console"/>
```

**search-pages** (around line 1938–1942):

Old:
```js
          <DataTable widgetId="search-pages" widgetConfig={wcfg('search-pages')}
            rows={gsc.pages} availDims={SEARCH_TABLE_DIMS} availMetrics={SEARCH_TABLE_METRICS}
            defaultDims={['page']} defaultMetrics={['impressions','clicks','ctr','position']}
            defaultName="Top Pages · Search Console"/>
```

New:
```js
          <DataTable widgetId="search-pages" widgetConfig={wcfg('search-pages')}
            rows={gsc.pages} availDims={window.DIM_REGISTRY?.search || []} availMetrics={window.TABLE_METRICS_REGISTRY?.search || []}
            defaultDims={['page']} defaultMetrics={['impressions','clicks','ctr','position']}
            defaultName="Top Pages · Search Console"/>
```

- [ ] **Step 5: Update the second set of Google DataTable calls (around lines 2621, 2630, 2639)**

Same replacement as Step 3 for the second occurrence of google-campaigns, google-adgroups, google-keywords. Apply the same pattern: replace `GOOGLE_TABLE_DIMS` → `window.DIM_REGISTRY?.google || []` and `GOOGLE_TABLE_METRICS` → `window.TABLE_METRICS_REGISTRY?.google || []`.

- [ ] **Step 6: Update the second set of Search DataTable calls (around lines 3176, 3185)**

Same replacement as Step 4 for the second occurrence of search-queries and search-pages. Apply the same pattern: replace `SEARCH_TABLE_DIMS` → `window.DIM_REGISTRY?.search || []` and `SEARCH_TABLE_METRICS` → `window.TABLE_METRICS_REGISTRY?.search || []`.

- [ ] **Step 7: Browser verification**

Open the app. Navigate to a report with a Google Ads datasource:
- Google Campaigns table should render with all columns: Spend, Impressions, Clicks, Conversions, CTR, Avg CPC, Conv. Rate, CPA
- Ad Groups table should render correctly
- Keywords table should render correctly
- Navigate to Search Console report: Top Queries and Top Pages tables should render

Open a Meta Ads report:
- The Meta table widget should now show metrics: Spend, Impressions, Reach, Link Clicks, Landing Page Views, Conversions, Purchases, Purchase Value, Add to Carts, CTR, Avg CPC, CPA, ROAS

Open a GA4 report:
- If ga4Rows is populated (GA4 connected), the GA4 table should show daily rows with columns: Sessions, Users, New Users, Events, Engaged Sessions, Engagement Rate, Bounce Rate, Avg Duration

In DevTools console, confirm no errors like `GOOGLE_TABLE_DIMS is not defined`.

- [ ] **Step 8: Commit**

```bash
git add app/assets/components/screen-report.jsx
git commit -m "refactor: UniversalTableWidget registry-driven; remove hardcoded table constants"
```

---

## Task 4: Update `card-editor.jsx` — use `TABLE_METRICS_REGISTRY`, fix donut order, remove local constants

**Files:**
- Modify: `app/assets/components/card-editor.jsx:660-726` (delete `SOURCE_METRICS` and `SOURCE_DIMS`)
- Modify: `app/assets/components/card-editor.jsx:844-850` (`availM` / `availD` derivation)
- Modify: `app/assets/components/card-editor.jsx:1163-1193` (donut setup order)
- Modify: `app/assets/components/card-editor.jsx:2438` (window export)

### Context

`card-editor.jsx` has its own local copies of metric/dim definitions (`SOURCE_METRICS` lines 660–703, `SOURCE_DIMS` lines 705–726). It also uses `DATA_REGISTRY` for `availM` but doesn't differentiate table vs. non-table widgets — table widgets should use `TABLE_METRICS_REGISTRY` (row-level) not `DATA_REGISTRY` (aggregated). The donut `SetupTab` shows Metric before Group By (dimension), which is slot 4 before slot 3.

- [ ] **Step 1: Delete `SOURCE_METRICS` and `SOURCE_DIMS` constants (lines 660–726)**

Remove this entire block from `card-editor.jsx`:

```js
const SOURCE_METRICS = {
  google: [
    ...
  ],
  meta: [...],
  ga4: [...],
  search: [...],
};

const SOURCE_DIMS = {
  google: [...],
  meta: [...],
  ga4: [...],
  search: [...],
};
```

(The exact content spans lines 660–726. Delete from `const SOURCE_METRICS = {` through the closing `};` of `SOURCE_DIMS`.)

- [ ] **Step 2: Update `availM` and `availD` derivation (around line 844)**

Find this block:

```js
  // Prefer DATA_REGISTRY (universal) over legacy SOURCE_METRICS
  const regSrc  = window.DATA_REGISTRY?.[srcKey] || {};
  const regKeys = Object.keys(regSrc);
  const availM  = regKeys.length > 0
    ? regKeys.map(key => ({ key, label: regSrc[key].label }))
    : (SOURCE_METRICS[srcKey] || []);
  const availD  = (window.DIM_REGISTRY?.[srcKey]) || (SOURCE_DIMS[srcKey] || []);
```

Replace with:

```js
  const regSrc  = window.DATA_REGISTRY?.[srcKey] || {};
  const regKeys = Object.keys(regSrc);
  const availM  = isTable
    ? (window.TABLE_METRICS_REGISTRY?.[srcKey] || [])
    : (regKeys.length > 0
        ? regKeys.map(key => ({ key, label: regSrc[key].label }))
        : []);
  const availD  = window.DIM_REGISTRY?.[srcKey] || [];
```

Note: `isTable` is already defined earlier in `SimpleSetupTab` as `widgetType === 'table' || (widgetType || '').startsWith('table-')`. This block appears after the `isTable` declaration so the reference is valid.

- [ ] **Step 3: Fix donut Setup section order (around line 1163)**

Find the `if (isDonut)` block:

```js
  // ── DONUT CHART ──────────────────────────────────────────────────
  if (isDonut) {
    return (
      <>
        {sharedBanner}
        <ESection label="Widget name">
          <EInput value={cfg.name} onChange={v => up({ name: v })} placeholder={getDefaultWidgetName(cardId, srcKey)}/>
        </ESection>
        <EDivider/>
        {SourceSection}
        {availM.length > 0 && (
          <>
            <EDivider/>
            <ESection label="Metric">
              <ESelect value={cfg.metric || availM[0]?.key} onChange={v => up({ metric: v })}
                options={availM.map(m => ({ value: m.key, label: m.label }))}/>
            </ESection>
          </>
        )}
        {availD.length > 0 && (
          <>
            <EDivider/>
            <ESection label="Group by">
              <ESelect value={cfg.dimension || availD[0]?.key} onChange={v => up({ dimension: v })}
                options={availD.map(d => ({ value: d.key, label: d.label }))}/>
            </ESection>
          </>
        )}
        {renderCustomMetrics()}
      </>
    );
  }
```

Replace with (swap Metric and Group by sections — Dimension comes before Metric per the spec):

```js
  // ── DONUT CHART ──────────────────────────────────────────────────
  if (isDonut) {
    return (
      <>
        {sharedBanner}
        <ESection label="Widget name">
          <EInput value={cfg.name} onChange={v => up({ name: v })} placeholder={getDefaultWidgetName(cardId, srcKey)}/>
        </ESection>
        <EDivider/>
        {SourceSection}
        {availD.length > 0 && (
          <>
            <EDivider/>
            <ESection label="Group by">
              <ESelect value={cfg.dimension || availD[0]?.key} onChange={v => up({ dimension: v })}
                options={availD.map(d => ({ value: d.key, label: d.label }))}/>
            </ESection>
          </>
        )}
        {availM.length > 0 && (
          <>
            <EDivider/>
            <ESection label="Metric">
              <ESelect value={cfg.metric || availM[0]?.key} onChange={v => up({ metric: v })}
                options={availM.map(m => ({ value: m.key, label: m.label }))}/>
            </ESection>
          </>
        )}
        {renderCustomMetrics()}
      </>
    );
  }
```

- [ ] **Step 4: Remove `SOURCE_METRICS` and `SOURCE_DIMS` from the `window` export (line 2438)**

Find:

```js
Object.assign(window, { CardEditorPanel, DashboardWithEditor, SOURCE_METRICS, SOURCE_DIMS });
```

Replace with:

```js
Object.assign(window, { CardEditorPanel, DashboardWithEditor });
```

- [ ] **Step 5: Browser verification**

Open the editor panel for a **table widget** with GA4 source:
- The Metrics section should now list: Sessions, Users, New Users, Events, Engaged Sessions, Engagement Rate, Bounce Rate, Avg Duration — not the aggregated KPI metrics from `DATA_REGISTRY`
- The Dimensions section should show: Date, Property (not the old source/channel/device/country)

Open the editor panel for a **table widget** with Meta source:
- The Metrics section should list all 13 Meta table metrics (Spend, Impressions, Reach, Link Clicks, etc.)

Open the editor panel for a **donut chart** widget:
- Group by (dimension) should appear **before** Metric in the Setup tab

Open DevTools console and confirm no errors like `SOURCE_METRICS is not defined`.

- [ ] **Step 6: Commit**

```bash
git add app/assets/components/card-editor.jsx
git commit -m "refactor: editor uses TABLE_METRICS_REGISTRY for tables; fix donut section order; remove SOURCE_METRICS/DIMS"
```

---

## Self-Review Checklist

- [x] **Spec coverage:**
  - Add `TABLE_METRICS_REGISTRY` → Task 1 Step 1
  - Fix GA4 `DIM_REGISTRY` → Task 1 Step 2
  - Update GA4 `TABLE_DATA_REGISTRY` → Task 1 Step 3
  - Expose `ga4Rows` in `buildData` → Task 2
  - Delete hardcoded constants from `screen-report.jsx` → Task 3 Step 1
  - Registry-driven `UniversalTableWidget` → Task 3 Step 2
  - All 10 inline `DataTable` call sites updated → Task 3 Steps 3–6
  - Card editor uses `TABLE_METRICS_REGISTRY` for tables → Task 4 Step 2
  - Card editor uses `DIM_REGISTRY` directly (no `SOURCE_DIMS` fallback) → Task 4 Steps 1–2
  - Donut section order fixed → Task 4 Step 3
  - `SOURCE_METRICS`/`SOURCE_DIMS` removed from window export → Task 4 Step 4
- [x] **No placeholders** — all steps have exact code
- [x] **Type consistency** — `TABLE_METRICS_REGISTRY` defined in Task 1, used as `window.TABLE_METRICS_REGISTRY?.google || []` in Tasks 3 and 4; `DIM_REGISTRY` consistent throughout
