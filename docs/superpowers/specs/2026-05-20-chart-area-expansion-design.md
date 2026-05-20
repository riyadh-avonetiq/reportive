# Chart-Area Widget: Data Source Expansion & UX Polish — Design Spec

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Expand which metrics and data sources can use the Dual-area trend chart, and polish the visual and interaction quality of the chart widget.

**Prerequisite:** `2026-05-20-chart-area-bugs-design.md` (Spec 1) must be merged before implementing this spec.

**Scope:** `widget-registry.js` (series wiring), `charts.jsx` (smooth lines, bubble clamp, scale prop), `screen-report.jsx` (color fix, scale wiring), `card-editor.jsx` (smooth toggle).

---

## Group C — Data Source Expansion (`widget-registry.js`)

### Available daily series by source (confirmed from data-bridge audit)

| Source | Chartable metrics | Not chartable (no daily fetch) |
|---|---|---|
| Google Ads | spend, clicks, impressions, conversions | ctr, cpc, cpa, roas |
| Meta Ads | spend, clicks, impressions, **conversions** *(unwired)* | reach, leads, purchases, and 9 others |
| GSC | impressions, clicks, **ctr** *(derivable)* | position |
| GA4 | **all 8** *(derivable from p.ga4Rows)* | — |

---

### C1 — GA4 series derivation from `p.ga4Rows`

**What exists:** `p.ga4Rows` is an array of daily objects with `date` (YYYY-MM-DD string) and all GA4 metric fields: `sessions`, `total_users`, `new_users`, `engaged_sessions`, `event_count`, `bounce_rate`, `engagement_rate`, `avg_session_duration`.

**Fix:** For each GA4 metric in `widget-registry.js`, add `series()` and `labels()` functions that sort `p.ga4Rows` by date and extract the relevant field:

```js
// Pattern for each GA4 metric:
series: p => (p?.ga4Rows || [])
  .slice().sort((a, b) => a.date < b.date ? -1 : 1)
  .map(r => r.sessions ?? 0),
labels: p => (p?.ga4Rows || [])
  .slice().sort((a, b) => a.date < b.date ? -1 : 1)
  .map(r => r.date),
```

Apply to: `sessions`, `total_users`, `new_users`, `engaged_sessions`, `event_count`.

For ratio metrics (`bounce_rate`, `engagement_rate`, `avg_session_duration`): same pattern, same format as their existing `format` field (`pct` or `num`). No rupiah scaling applies.

**Note:** `p.ga4DemoRows`, `p.ga4PageRows`, `p.ga4SessionRows` are dimension-based, not daily time-series — do not use them.

---

### C2 — Meta `conversions` series (already fetched, not wired)

`p.metaSeries.conversions` exists in the data-bridge (computed as `purchases + leads` per day) but the `widget-registry.js` Meta `conversions` entry has no `series()` or `labels()` function.

**Fix:** Add to Meta `conversions` entry:
```js
series: p => p?.metaSeries?.conversions,
labels: p => p?.metaSeries?.labels,
```

---

### C3 — GSC CTR derived series

`p.gsc.series.clicks` and `p.gsc.series.impressions` are available as daily arrays. CTR can be derived:

**Fix:** Add to GSC `ctr` entry:
```js
series: p => {
  const clicks = p?.gsc?.series?.clicks || [];
  const impr   = p?.gsc?.series?.impressions || [];
  return clicks.map((c, i) => impr[i] > 0 ? (c / impr[i]) * 100 : 0);
},
labels: p => p?.gsc?.series?.labels,
```

Format remains `pct` — the Y-axis will show `%` values (0–100 range), no rupiah scaling.

---

## Group D — UX & Polish (`charts.jsx` + `card-editor.jsx` + `screen-report.jsx`)

### D1 — Smooth vs Sharp line toggle

**Problem:** All lines are sharp/angular (linear SVG path segments). For noisy daily data (e.g., impressions spikes), this looks jagged and hard to read.

**Design:**

Add `smooth` boolean prop to `RichAreaChart` (default `false`).

When `smooth === true`, replace the linear path builder with a Catmull-Rom spline. For each segment between points i and i+1, use the previous and next points as control point anchors:

```js
const catmullRom = (pts) => {
  if (pts.length < 2) return '';
  return pts.map(([x, y], i) => {
    if (i === 0) return `M ${x} ${y}`;
    const p0 = pts[Math.max(i - 2, 0)];
    const p1 = pts[i - 1];
    const p2 = pts[i];
    const p3 = pts[Math.min(i + 1, pts.length - 1)];
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;
    return `C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x} ${y}`;
  }).join(' ');
};
```

The area fill path uses the same smooth curve for the upper boundary, then closes with straight lines along the bottom.

**Wire in `ChartAreaWidget`:** pass `smooth={cfg.lineStyle === 'smooth'}` to `<RichArea>`.

**Wire in `card-editor.jsx`:** add a pill toggle after "Chart size":

```
Label: "Line style"
Options: Sharp | Smooth
cfg key: lineStyle ('sharp' | 'smooth', default 'sharp')
```

---

### D2 — Peak bubble overflow clamping

**Problem:** The peak bubble is positioned at `translate(${x} ${y - 6})` with no horizontal clamping. If the peak is the first or last data point, the bubble extends outside the SVG viewBox and is clipped.

**Fix:** Clamp the bubble's x position:
```js
const bx = Math.max(m.l + bw / 2, Math.min(x, m.l + iw - bw / 2));
// Use bx instead of x in the transform:
<g transform={`translate(${bx} ${y - 6})`}>
```

This keeps the entire bubble inside the chart area regardless of where the peak falls.

**Location:** `charts.jsx` — peak bubble rendering block inside `RichAreaChart`.

---

### D3 — Color consistency across single/dual mode

**Problem:** In single-metric mode `colorA = teal`. In dual-metric mode `colorA = gold`, `colorB = teal`. The switch is surprising — adding a second metric changes the color of the first.

**Fix:** Make color assignment consistent regardless of mode:
- `colorA` is always **teal** (`#00C2B8`)
- `colorB` is always **gold** (`#F8B400`)

In single-metric mode the single series is always teal. In dual-metric mode A=teal, B=gold. The legend and stats footer already use `colorA`/`colorB` variables, so they update automatically.

**Location:** `screen-report.jsx` — ChartAreaWidget, `colorA`/`colorB` constants.

```js
// Before: const colorA = hasDual ? gold : teal;
// After:
const colorA = teal;
const colorB = gold;
```

---

### D4 — Proportional scaling with font size S/M/L

**Problem:** S/M/L size toggle scales text but SVG margins are fixed. A "Large" chart has noticeably bigger title/stats but the same internal chart margins, making the axes feel cramped relative to the card.

**Fix:** Add a `scale` prop to `RichAreaChart` (default `1.0`). Apply it to the margin object:
```js
const m = {
  l: Math.round(40 * scale),
  r: Math.round(36 * scale),
  t: Math.round(18 * scale),
  b: Math.round(20 * scale),
};
```

Wire from `ChartAreaWidget`:
```js
const chartScale = { s: 0.85, m: 1.0, l: 1.15 }[sz] || 1.0;
// Pass: scale={chartScale} to <RichArea>
```

SVG font sizes inside `RichAreaChart` also multiply by `scale` (Y-axis ticks, X-axis labels, peak bubble, tooltip text).

---

## Files Changed

| File | Changes |
|---|---|
| `app/assets/components/widget-registry.js` | C1 (GA4 series), C2 (Meta conversions), C3 (GSC ctr) |
| `app/assets/components/charts.jsx` | D1 (smooth prop + Catmull-Rom), D2 (bubble clamp), D4 (scale prop) |
| `app/assets/components/screen-report.jsx` | D1 (lineStyle wire), D3 (color fix), D4 (scale wire) |
| `app/assets/components/card-editor.jsx` | D1 (line style toggle) |
| `app/index.html` | Version bumps for all changed files |

## Not in Scope

- GA4 reach, leads, purchases series (not fetched by data-bridge — would require backend changes)
- Meta metrics beyond spend/clicks/impressions/conversions (same reason)
- GSC position series (not derivable from available data)
- Any new data-bridge queries or Supabase schema changes
