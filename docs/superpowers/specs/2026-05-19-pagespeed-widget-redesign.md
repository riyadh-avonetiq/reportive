# PageSpeed Widget Redesign — Design Spec

## Goal

Redesign the existing "Score ring 4-up" canvas widget into a comprehensive, self-contained **PageSpeed** widget that displays Lighthouse scores, Core Web Vitals, a weekly performance trend, and an inline measurement trigger — all within a single card.

## Approved Layout (C v2)

```
┌─────────────────────────────────────────────────────┐
│ PageSpeed                    [Mobile] [Desktop]       │  ← Header + toggle
│ Lighthouse · 19 Mei 2026            EXCELLENT        │
├─────────────────────────────────────────────────────┤
│ ⚡ Run Measurement   ✓ Saved · date   kabuki….id/   │  ← Measure bar
├──────────────────────┬──────────────────────────────┤
│ ●96  PERFORMANCE     │ ●87  ACCESSIBILITY            │  ← Score rings 2×2
│      Excellent       │      Needs work               │
├──────────────────────┼──────────────────────────────┤
│ ●100 BEST PRACTICES  │ ●100 SEO                      │
│      Excellent       │      Excellent                │
├─────────────────────────────────────────────────────┤
│ CORE WEB VITALS                                      │  ← CWV row
│ [LCP 1.2s ✅] [FCP 0.8s ✅] [CLS 0.05 ✅] [INP 120ms ✅] [TTFB 0.4s ✅] │
├─────────────────────────────────────────────────────┤
│ PERFORMANCE TREND · 8 WEEKS                         │  ← Trend chart
│ ▁▂▃▃▄▅▆▇  W1 → W8                                   │
└─────────────────────────────────────────────────────┘
```

## Section Specifications

### 1. Header
- Title: **"PageSpeed"** (renamed from "Score ring 4-up")
- Subtitle: `Lighthouse · <latestDay formatted>`
- Right: Mobile/Desktop pill toggle (view filter only — measurements always capture both)
- Far right bottom: overall status badge (`Excellent` / `Needs work` / `Poor`)

### 2. Run Measurement Bar
- Positioned immediately below header, before any data
- Contains: **⚡ Run Measurement** button + `✓ Saved · <date>` confirmation + truncated URL
- States:
  - **Idle**: teal gradient button, saved date if available, URL
  - **Measuring**: spinner + "Measuring… (~10–30 sec)" text, button disabled
  - **Rate limited**: amber warning + auto-retry countdown
  - **Quota exceeded**: red error + "Masukkan Google API Key" inline input
- API key is persisted in Supabase `app_settings` table (already implemented); no re-entry needed between sessions
- Measures **both mobile and desktop simultaneously** via `Promise.all`; toggle does not affect what gets measured

### 3. Score Rings (2×2 Grid)
- Performance, Accessibility, Best Practices, SEO
- Each cell: `Ring` SVG component + score number + label (`Excellent` / `Needs work` / `Poor`)
- Color thresholds: ≥90 green `#16A34A`, ≥50 teal `#00C2B8`, <50 gold `#F8B400`
- Data source: `p?.psi` (mobile) or `p?.psiDesktop` (desktop) based on active tab, OR `liveData` immediately after a fresh measurement

### 4. Core Web Vitals Row
Five metric tiles displayed horizontally:

| Metric | Field | Good | Needs Improvement | Poor |
|--------|-------|------|-------------------|------|
| LCP | `lcp_ms` (ms) | < 2500ms | 2500–4000ms | > 4000ms |
| FCP | `fcp_ms` (ms) | < 1800ms | 1800–3000ms | > 3000ms |
| CLS | `cls` (raw float) | < 0.1 | 0.1–0.25 | > 0.25 |
| INP | `inp_ms` (ms), fallback `tbt_ms` | < 200ms | 200–500ms | > 500ms |
| TTFB | `ttfb_ms` (ms) | < 800ms | 800–1800ms | > 1800ms |

Each tile: metric label + value formatted (ms → `1.2s`, float → `0.05`) + status word + background color coded to threshold.

**Display formatting:**
- `lcp_ms`, `fcp_ms`, `ttfb_ms`, `inp_ms`: divide by 1000, show as `1.2s` if ≥1000ms, else `450ms`
- `cls`: show raw float rounded to 2 decimal places

### 5. Performance Trend Chart
- Area chart showing weekly Performance score over last 8 measurements
- X-axis: W1…W8 labels (oldest left, newest right)
- Y-axis: 0–100 implicit (no labels, just grid lines)
- Data: `history` array from `aggregatePsi` — last 8 records in chronological order (oldest → newest), labeled W1…W8. No date-based grouping: each entry = one measurement run, regardless of when it happened.
- Stroke: teal `#00C2B8`, filled area with gradient fade
- Dots on each data point, last dot filled solid

## Data Architecture

### Supabase Schema Change — `pagespeed` table
Add CWV columns (in `dpthobkylyuajaleykyf` database):

```sql
ALTER TABLE pagespeed
  ADD COLUMN IF NOT EXISTS lcp_ms    NUMERIC,
  ADD COLUMN IF NOT EXISTS fcp_ms    NUMERIC,
  ADD COLUMN IF NOT EXISTS cls       NUMERIC,
  ADD COLUMN IF NOT EXISTS inp_ms    NUMERIC,
  ADD COLUMN IF NOT EXISTS tbt_ms    NUMERIC,
  ADD COLUMN IF NOT EXISTS ttfb_ms   NUMERIC;
```

Existing rows without CWV data will have `NULL` — widget must handle `null` gracefully (show `—`).

### PSI API — CWV Extraction
From `lighthouseResult.audits` in the API response:

```js
lcp_ms:  audits['largest-contentful-paint']?.numericValue  || null
fcp_ms:  audits['first-contentful-paint']?.numericValue    || null
cls:     audits['cumulative-layout-shift']?.numericValue   || null
inp_ms:  audits['interaction-to-next-paint']?.numericValue || null  // may be absent
tbt_ms:  audits['total-blocking-time']?.numericValue       || null  // INP fallback
ttfb_ms: audits['server-response-time']?.numericValue      || null
```

INP display: use `inp_ms` if present and > 0, else fall back to `tbt_ms`.

### data-bridge.jsx — `aggregatePsi` updates
- Add CWV fields to the returned object from `latest` row
- Update `history` array to also include CWV snapshot per entry
- Update all three Supabase SELECT queries to include new columns

### Widget Registry — rename
In `cards.jsx` CARDS array:
```js
{ id: 'progress-psi', cat: 'progress', title: 'PageSpeed', ... }
```

## Component Changes

### `cards.jsx` — `PageSpeedInsights`
- Add `activeTab` state (`'mobile'` | `'desktop'`), replacing `cfg.strategy`
- Add `liveData` state for post-measurement immediate display
- Move Run Measurement bar to top (below header section)
- Add CWV row section
- Render trend chart from `psiData.history`
- Extract CWV from `liveData` or `psiData` (new fields)

### `card-editor.jsx` — `SetupPageSpeed`
- Remove the Mobile/Desktop radio selector (toggle is now inline in the widget itself)
- `SetupPageSpeed` can be removed entirely or left as an empty placeholder

### `data-bridge.jsx`
- `aggregatePsi`: add CWV fields, update history shape
- All three pagespeed SELECT queries: add new columns

### `screen-report.jsx`
- No structural changes needed (props already threaded through correctly)

### `index.html`
- Bump versions: `cards.jsx`, `card-editor.jsx`, `data-bridge.jsx`, `screen-report.jsx`

## Error & Empty States

| State | Display |
|-------|---------|
| No data, no psiUrl | "Configure a Page URL in report settings" |
| No data, psiUrl set | Run Measurement bar + "No data yet — run your first measurement" |
| CWV field is null | Show `—` in the tile instead of a value |
| History has < 2 points | Show trend chart with available points; hide if 0 points |
| INP absent, TBT present | Show TBT value with label "TBT (INP proxy)" |

## What Does NOT Change
- Supabase API key persistence (already in `app_settings`)
- Dual-strategy measurement (already `Promise.all`)
- Props threading through `DragCanvas` → `buildUniversalMap` → `UniversalWidget` (already fixed)
- `PageSpeedSection` already removed from layout
