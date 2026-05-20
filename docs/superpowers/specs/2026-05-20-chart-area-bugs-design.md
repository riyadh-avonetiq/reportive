# Chart-Area Widget: Safety & Correctness — Design Spec

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Eliminate all silent failures, data misalignments, and rendering glitches in the Dual-area trend (`chart-area`) widget.

**Scope:** `charts.jsx` (RichAreaChart component) and `screen-report.jsx` (ChartAreaWidget) and `card-editor.jsx` (metricB picker filter). No new features — correctness only.

**Companion spec:** `2026-05-20-chart-area-expansion-design.md` (Groups C + D) should be implemented after this spec is merged.

---

## Group A — RichAreaChart Safety Fixes (`charts.jsx`)

### A1 — Division by zero on x-axis labels

**Problem:** `x={m.l + (i / (labelsX.length - 1)) * iw}` produces `Infinity` when `labelsX.length === 1`, silently placing the label off-screen.

**Fix:**
- Replace `(labelsX.length - 1)` with `Math.max(labelsX.length - 1, 1)` in the x-position formula.
- Also guard: skip x-axis label rendering entirely when `labelsX.length === 0`.

**Location:** `charts.jsx` — x-axis `labelsX.map(...)` block.

---

### A2 — Tooltip clipping at left and right edges

**Problem:** Current right-edge clamp `Math.min(hx - 8, m.l + iw - 128)` uses 128px but tooltip `width={124}`. At the left edge there is no guard at all — tooltip can render outside the SVG viewBox.

**Fix:**
Replace tooltip x-position calculation with a centered clamp:
```js
const tipX = Math.max(m.l, Math.min(hx - 62, m.l + iw - 128));
```
- Centers the tooltip on the hover point (`hx - 62` = half of 124px).
- Clamps to `m.l` on the left (never goes outside chart area).
- Clamps to `m.l + iw - 128` on the right (leaves 4px safety margin).

**Location:** `charts.jsx` — hover crosshair block, `tipX` constant.

---

### A3 — Empty data silent fallback to `[0, 0]`

**Problem:** When aggregated data has fewer than 2 points, `ChartAreaWidget` forces `safeSeries = [0, 0]`. The chart renders a flat zero-line, indistinguishable from a metric that is genuinely zero.

**Fix:** Remove the `[0, 0]` fallback in `ChartAreaWidget`. Instead, when `aggVals.length < 2`, render an empty-state block inside an `RCard`:

```jsx
<RCard padding={16}>
  <div style={{ height: chartH, display: 'flex', alignItems: 'center',
    justifyContent: 'center', border: '1px dashed rgba(255,255,255,.1)',
    borderRadius: 8 }}>
    <span style={{ fontFamily: T.mono, fontSize: 11, color: muted }}>
      Insufficient data for this period
    </span>
  </div>
</RCard>
```

The card title and stats footer still render above/below so the user sees which metric has no data.

**Location:** `screen-report.jsx` — `ChartAreaWidget`, after `aggregate()` calls, before `safeSeries` assignment.

---

## Group B — ChartAreaWidget Data Correctness (`screen-report.jsx` + `card-editor.jsx`)

### B1 — MetricB without `series()` silently drops to single-series

**Problem:** The editor allows selecting any metric as metricB, but most metrics have no `series()` function. The chart silently renders single-series with no indication the second metric couldn't be plotted.

**Fix — editor (`card-editor.jsx`):**
In the metricB `MetricPickerDropdown`, filter `availMetrics` to only include metrics where `window.DATA_REGISTRY?.[srcKey]?.[key]?.series` exists. Metrics without series remain available in the primary metric picker but are excluded from metricB.

**Fix — widget runtime (`screen-report.jsx`):**
If `defB` has no `series()` function at runtime (e.g., stale saved config after a data-bridge change), show an amber indicator in the legend entry: `"[MetricName] (no trend)"` instead of silently omitting the series.

**Location:**
- `card-editor.jsx` — metricB `MetricPickerDropdown` `availMetrics` prop.
- `screen-report.jsx` — ChartAreaWidget legend rendering block.

---

### B2 — Dual-series label alignment when series lengths differ

**Problem:** Both series use `rawLabels` derived from metricA. If metricB has a different number of data points (e.g., sparse or missing days), values and labels go out of sync after aggregation.

**Fix:**
After fetching `rawSeries` and `rawSeriesB`, compute the shared safe length:
```js
const sharedLen = rawSeriesB
  ? Math.min(rawSeries.length, rawSeriesB.length)
  : rawSeries.length;
const alignedSeries  = rawSeries.slice(0, sharedLen);
const alignedLabels  = rawLabels.slice(0, sharedLen);
const alignedSeriesB = rawSeriesB ? rawSeriesB.slice(0, sharedLen) : null;
```
Use `alignedSeries`, `alignedLabels`, `alignedSeriesB` for all downstream aggregation.

**Location:** `screen-report.jsx` — ChartAreaWidget, after `rawSeriesB` is set, before `aggregate()` calls.

---

### B3 — Monthly labels drop year across year boundaries

**Problem:** Monthly label format is `"Jan"`, `"Feb"`, etc. If data spans two calendar years, `"Dec"` followed by `"Jan"` is ambiguous — the user cannot tell if they're consecutive months or a year apart.

**Fix:**
When building monthly labels, check if the sorted keys span more than one distinct year:
```js
const years = new Set(ks.map(k => k.slice(0, 4)));
const multiYear = years.size > 1;
// Label: if multiYear → "Jan '25", else → "Jan"
labels: ks.map(k => {
  const pts = k.split('-');
  const mon = pts[1] ? MN[+pts[1] - 1] || k : k;
  return multiYear ? `${mon} '${pts[0].slice(2)}` : mon;
})
```

**Location:** `screen-report.jsx` — `aggregate()` function, monthly branch.

---

### B4 — Hover tooltip shows no date for unlabeled (sparse) ticks

**Problem:** The `sparseLabels` array leaves empty strings at non-labeled positions for visual de-cluttering. When hovering over a non-labeled data point, `labelsX[hoverIdx]` is `''` and the tooltip shows no date — even though the actual date is known.

**Fix:**
In `ChartAreaWidget`, maintain two label arrays:
- `sparseLabels` — the display array (with empty strings) passed to `labelsX` for axis rendering.
- `fullLabels` — the complete array of all dates, passed as a new `tooltipLabels` prop to `RichAreaChart`.

In `RichAreaChart`, use `tooltipLabels[hoverIdx]` (falling back to `labelsX[hoverIdx]`) for the tooltip date display.

**New prop on RichAreaChart:** `tooltipLabels = []` (default empty = falls back to `labelsX`).

**Location:**
- `screen-report.jsx` — `aggregate()` daily branch: return both `labels` (sparse) and `fullLabels` (complete).
- `charts.jsx` — RichAreaChart: accept `tooltipLabels` prop, use in tooltip date text.

---

## Files Changed

| File | Changes |
|---|---|
| `app/assets/components/charts.jsx` | A1 (x-axis guard), A2 (tooltip clamp), add `tooltipLabels` prop (B4) |
| `app/assets/components/screen-report.jsx` | A3 (empty state), B1 runtime warning, B2 (series alignment), B3 (multi-year labels), B4 (fullLabels) |
| `app/assets/components/card-editor.jsx` | B1 (metricB series filter) |
| `app/index.html` | Version bumps for all three files |

## Not in Scope

- Smooth line curves (Spec 2, Group D)
- GA4/Meta series expansion (Spec 2, Group C)
- Color semantics change (Spec 2, Group D)
- Font size proportional scaling (Spec 2, Group D)
