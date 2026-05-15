# Data Accuracy Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all data correctness bugs found in the code review — wrong ROAS calculation, GA4 field mismatches, UTC date bug, Supabase errors invisible to users, and ads_data silent truncation.

**Architecture:** All fixes are contained in `data-bridge.jsx`, `widget-registry.js`, and the legacy GA4 section in `screen-report.jsx`. No new files needed. Each task is a surgical edit to one file.

**Tech Stack:** Vanilla React (no build step), JSX via Babel browser transform, Supabase JS v2, no test framework — verification is done by inspecting the browser UI.

---

### Task 1: Fix ROAS — remove fabricated fallback value

**Files:**
- Modify: `app/assets/js/data-bridge.jsx:84–101`

The `aggregateAds` function currently fabricates a ROAS value (`3.82`) when no ROAS data is available. `google_ads_daily` does not include a `roas` column, so this fallback always triggers and always shows a fake number.

- [ ] **Step 1: Open data-bridge.jsx and find `aggregateAds`**

Locate lines 84–101. The current ROAS code looks like:

```javascript
const roasFromRows = rows.reduce((s, r) => s + (+r.roas || 0), 0);
t.roas = roasFromRows > 0
  ? roasFromRows / rows.filter(r => +r.roas > 0).length
  : (t.spend > 0 && t.conversions > 0 ? (t.conversions * t.cpa * 0.0000001) : 3.82);
```

- [ ] **Step 2: Replace the ROAS calculation with a safe zero**

Replace the three ROAS lines with:

```javascript
t.roas = 0;
```

- [ ] **Step 3: Verify in browser**

Open the dashboard, connect a Google Ads account, check a date range with real data. The ROAS KPI card should show `—` or `0x` instead of `3.82`. No fabricated value should appear.

- [ ] **Step 4: Commit**

```bash
git add app/assets/js/data-bridge.jsx
git commit -m "fix: remove fabricated ROAS fallback — show 0 when no roas data"
```

---

### Task 2: Fix ads_data silent truncation — use fetchPaged

**Files:**
- Modify: `app/assets/js/data-bridge.jsx:794–799`

`ads_data` uses a single `.limit(100000)` call. If the table has more than 100,000 rows, data is silently truncated and KPI totals are wrong. `fetchPaged` already exists and is used correctly for `google_ads` — use it here too.

- [ ] **Step 1: Find the `adsSheetQ` query in `fetchAll`**

Around line 794:

```javascript
let adsSheetQ = _supa.from('ads_data')
  .select('day, campaign_name, campaign_type, ad_group, keyword, match_type, spend, impressions, clicks, conversions')
  .order('day', { ascending: true })
  .limit(100000);
if (from) adsSheetQ = adsSheetQ.gte('day', from);
if (to)   adsSheetQ = adsSheetQ.lte('day', to);
```

- [ ] **Step 2: Convert to a deferred query builder (no `.limit`)**

Replace the `adsSheetQ` declaration with a function that `fetchPaged` can call:

```javascript
let adsSheetQ = _supa.from('ads_data')
  .select('day, campaign_name, campaign_type, ad_group, keyword, match_type, spend, impressions, clicks, conversions')
  .order('day', { ascending: true });
if (from) adsSheetQ = adsSheetQ.gte('day', from);
if (to)   adsSheetQ = adsSheetQ.lte('day', to);
```

- [ ] **Step 3: Update the `Promise.all` call to use `fetchPaged` for adsSheetQ**

Find the `Promise.all` line (around line 987):

```javascript
const [adsR, adsSheetR, adsDetailRows, adsSegR, ...] = await Promise.all([adsQ, adsSheetQ, fetchPaged(adsDetailQ), ...]);
```

Change `adsSheetQ` to `fetchPaged(adsSheetQ)`:

```javascript
const [adsR, adsSheetRaw, adsDetailRows, adsSegR, ...] = await Promise.all([adsQ, fetchPaged(adsSheetQ), fetchPaged(adsDetailQ), ...]);
```

- [ ] **Step 4: Update the result extraction**

The old code checked `adsSheetR.error` and `adsSheetR.data`. `fetchPaged` returns a plain array (not a Supabase response object). Update the extraction:

Find (around line 1039):
```javascript
const adsSheetRows = (!adsSheetR.error && adsSheetR.data && adsSheetR.data.length) ? adsSheetR.data : null;
```

Replace with:
```javascript
const adsSheetRows = (adsSheetRaw && adsSheetRaw.length) ? adsSheetRaw : null;
```

- [ ] **Step 5: Verify in browser**

Connect Google Ads. Open browser console — you should see `[Reportive] detail source: ads_data (N rows)`. Confirm N matches the row count you expect for the date range.

- [ ] **Step 6: Commit**

```bash
git add app/assets/js/data-bridge.jsx
git commit -m "fix: use fetchPaged for ads_data to prevent silent 100k-row truncation"
```

---

### Task 3: Fix date range UTC vs local time (Jakarta UTC+7 bug)

**Files:**
- Modify: `app/assets/js/data-bridge.jsx:51`

`_ds(d)` uses `toISOString()` which converts to UTC. At 11 PM in Jakarta (UTC+7), this returns tomorrow's date — so "Today" preset queries a future date and returns empty results.

- [ ] **Step 1: Find `_ds` in data-bridge.jsx**

Around line 51:

```javascript
function _ds(d) { return d.toISOString().slice(0, 10); }
```

- [ ] **Step 2: Replace with local-time formatter**

```javascript
function _ds(d) {
  return d.getFullYear() + '-'
    + String(d.getMonth() + 1).padStart(2, '0') + '-'
    + String(d.getDate()).padStart(2, '0');
}
```

- [ ] **Step 3: Verify in browser**

Set date range to "Today". Check that the date shown in the URL or console matches today's local date, not UTC date. Test at any time of day — result should be consistent.

- [ ] **Step 4: Commit**

```bash
git add app/assets/js/data-bridge.jsx
git commit -m "fix: use local time in _ds() — prevents UTC date shift for UTC+7 users"
```

---

### Task 4: Fix GA4 legacy section field names

**Files:**
- Modify: `app/assets/components/screen-report.jsx` — search for legacy GA4 section renderer

The legacy GA4 section renderer references `ga4.users`, `ga4.pageviews`, `ga4.engaged` — fields that don't exist in the `aggregateGa4` output. The real fields are `ga4.total_users`, `ga4.engaged_sessions`. This causes those KPI cards to always show `—` or 0.

- [ ] **Step 1: Search for wrong field names in screen-report.jsx**

Run:
```bash
grep -n "ga4\.users\|ga4\.pageviews\|ga4\.engaged[^_]" app/assets/components/screen-report.jsx
```

Note all matching line numbers.

- [ ] **Step 2: Fix each wrong field reference**

| Wrong field | Correct field |
|-------------|--------------|
| `ga4.users` | `ga4.total_users` |
| `ga4.engaged` | `ga4.engaged_sessions` |
| `ga4.pageviews` | remove or replace with `ga4.event_count` |

For each match, update the field name to the correct one. `aggregateGa4` returns: `sessions`, `total_users`, `new_users`, `returning_users`, `event_count`, `engaged_sessions`, `bounce_rate`, `engagement_rate`, `avg_session_duration`.

- [ ] **Step 3: Verify in browser**

Navigate to a report with GA4 connected. The legacy GA4 section (if present) should now show real numbers for users and engaged sessions instead of `—`.

- [ ] **Step 4: Commit**

```bash
git add app/assets/components/screen-report.jsx
git commit -m "fix: correct GA4 legacy section field names (users→total_users, engaged→engaged_sessions)"
```

---

### Task 5: Surface Supabase errors to the user

**Files:**
- Modify: `app/assets/js/data-bridge.jsx:1067–1148` (`LiveProvider`)
- Modify: `app/assets/components/screen-report.jsx` — find where the report content is rendered

Currently all Supabase errors are silently `console.warn`'d. Users see 0s and `—` with no indication that a query failed.

- [ ] **Step 1: Add `fetchError` to LiveProvider state**

Find the `useState` for `state` in `LiveProvider` (around line 1068):

```javascript
const [state, setState] = React.useState({
  loading: true, error: null, data: null, _isMock: false,
});
```

Add `fetchError`:

```javascript
const [state, setState] = React.useState({
  loading: true, error: null, data: null, _isMock: false, fetchError: null,
});
```

- [ ] **Step 2: Detect errors after the Promise.all in `fetchAll`**

At the point where errors are currently `console.warn`'d (around lines 991–1004), collect them. After the `Promise.all` returns, add:

```javascript
const fetchErrors = [];
if (metaR.error)       fetchErrors.push('Meta Ads: ' + metaR.error.message);
if (ga4R.error)        fetchErrors.push('GA4: ' + ga4R.error.message);
if (gscSumR.error)     fetchErrors.push('Search Console: ' + gscSumR.error.message);
if (adsR && adsR.error) fetchErrors.push('Google Ads: ' + adsR.error.message);
```

Return `fetchErrors` from `fetchAll` alongside the data:

```javascript
return {
  ads: ..., meta: ..., ga4: ..., ...,
  _errors: fetchErrors,
};
```

- [ ] **Step 3: Pass the error list into state in `LiveProvider`**

In the `useEffect` (around line 1107), after calling `fetchAll`:

```javascript
const fetchError = (raw && raw._errors && raw._errors.length) ? raw._errors : null;
setState({ loading: false, error: null, data, _isMock: isMock, fetchError });
```

- [ ] **Step 4: Expose `fetchError` from context**

In the `useMemo` ctx object (around line 1134):

```javascript
const ctx = React.useMemo(() => ({
  ...state,
  fetchError: state.fetchError,
  ...
}), [...]);
```

- [ ] **Step 5: Show error banner in ScreenReport**

In `screen-report.jsx`, find where the report content renders (after the loading check). Add a non-blocking error banner at the top of the report area:

```jsx
{fetchError && fetchError.length > 0 && (
  <div style={{
    margin: '8px 16px 0', padding: '8px 14px',
    background: 'rgba(220,38,38,.1)', border: '1px solid rgba(220,38,38,.3)',
    borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 11,
    color: '#F87171', display: 'flex', gap: 8, alignItems: 'flex-start',
  }}>
    <span>⚠</span>
    <span>Data source error: {fetchError.join(' · ')} — showing partial data.</span>
  </div>
)}
```

Get `fetchError` from the `useLive()` hook at the top of `ScreenReport`.

- [ ] **Step 6: Verify in browser**

Temporarily break a Supabase key (add a character) in data-bridge.jsx. Reload — the error banner should appear. Restore the key and reload — banner should disappear.

- [ ] **Step 7: Commit**

```bash
git add app/assets/js/data-bridge.jsx app/assets/components/screen-report.jsx
git commit -m "feat: surface Supabase query errors as visible banner in report screen"
```

---

### Task 6: Fix GA4 returning_users and user_engagement_duration always zero

**Files:**
- Modify: `app/assets/js/data-bridge.jsx:848–859` (`ga4Q` SELECT)

`ga4_totals` SELECT does not include `returning_users` or `user_engagement_duration`, so these are always 0 in KPI cards and table widgets.

- [ ] **Step 1: Find the `ga4Q` SELECT in `fetchAll`**

Around line 851:

```javascript
let q = _ga4Supa.from('ga4_totals')
  .select('date, property_name, sessions, total_users, new_users, bounce_rate, engaged_sessions, engagement_rate, avg_session_duration, event_count')
```

- [ ] **Step 2: Add the missing fields**

```javascript
let q = _ga4Supa.from('ga4_totals')
  .select('date, property_name, sessions, total_users, new_users, returning_users, bounce_rate, engaged_sessions, engagement_rate, avg_session_duration, user_engagement_duration, event_count')
```

**Note:** Only add these fields if the `ga4_totals` Supabase table actually has them. If not, skip adding the field that's missing — Supabase will return an error for unknown columns. Verify by checking the Supabase table schema first.

- [ ] **Step 3: Verify `aggregateGa4` handles the new fields**

In `aggregateGa4` (lines 129–154), confirm `returning_users` and `user_engagement_duration` are already accumulated:

```javascript
t.returning_users   += +r.returning_users          || 0;  // already present?
t.engageDurationWeighted += +r.user_engagement_duration * sess;  // already present?
```

If they're missing from the accumulation loop, add them following the same pattern as the other fields.

- [ ] **Step 4: Verify in browser**

Open a GA4 report. If `returning_users` is now non-zero, the fix worked. Check the browser console for any Supabase column errors.

- [ ] **Step 5: Commit**

```bash
git add app/assets/js/data-bridge.jsx
git commit -m "fix: add returning_users and user_engagement_duration to ga4_totals SELECT"
```

---

### Task 7: Increase ga4_sessions row limit

**Files:**
- Modify: `app/assets/js/data-bridge.jsx:892–902` (`ga4SessionQ`)

`ga4_sessions` is limited to 2000 rows. For high-traffic properties with many device/channel/country combinations, data is silently truncated.

- [ ] **Step 1: Find `ga4SessionQ` in `fetchAll`**

Around line 892:

```javascript
let q = _ga4Supa.from('ga4_sessions')
  .select(GA4_SESSION_COLS)
  .limit(2000);
```

- [ ] **Step 2: Raise the limit**

```javascript
let q = _ga4Supa.from('ga4_sessions')
  .select(GA4_SESSION_COLS)
  .limit(10000);
```

- [ ] **Step 3: Verify in browser**

Open a GA4 report with the Sessions dimension. Check console for row count: `[Reportive] rows — ... ga4Session: N`. If N was previously at 2000 and is now higher, the fix worked.

- [ ] **Step 4: Commit**

```bash
git add app/assets/js/data-bridge.jsx
git commit -m "fix: raise ga4_sessions row limit from 2000 to 10000"
```
