# Neon Migration — Plan C: Frontend Cutover

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all Supabase calls in the frontend with fetch() calls to Neon API endpoints. Remove Supabase CDN dependency. Keep all aggregate/display logic (`buildData`, `aggregateAds`, etc.) unchanged — only the data-fetching layer changes.

**Architecture:** `data-bridge.jsx` gains a new `fetchAll(clientId, from, to)` using `Promise.allSettled` against the 4 Neon GET endpoints. `LiveProvider` is scoped to one client at a time (accepts `clientId` prop), removing the global account/property filter state. `app.jsx` removes `_AUTH_SUPA` and uses `/api/app/client` for share-token lookups and client list loading.

**Tech Stack:** Fetch API (browser native), Neon API endpoints from Plan A, no Supabase SDK.

**Spec:** `docs/superpowers/specs/2026-05-21-neon-migration-design.md`

---

## File Map

```
app/assets/js/data-bridge.jsx     MODIFY — replace fetchAll + LiveProvider; remove Supabase clients
app/assets/js/app.jsx             MODIFY — remove _AUTH_SUPA; fix ShareView and Root
app/index.html                    MODIFY — remove Supabase CDN script; bump versions
```

---

## Task 1: Replace Supabase Clients and fetchAll in data-bridge.jsx

**Files:**
- Modify: `app/assets/js/data-bridge.jsx`

The current file has four Supabase clients (lines 18–33), a 295-line `fetchPaged`+`fetchAll` block (lines 771–1080), and `loadAppSetting`/`saveAppSetting` (lines 1082–1110). Replace all three with a lean Neon-based fetcher.

- [ ] **Step 1: Remove Supabase client declarations**

In `app/assets/js/data-bridge.jsx`, locate the block starting at line 18:
```js
const SUPA_URL    = 'https://qmzgincouzpbyfxfddxt.supabase.co';
```
...through line 33:
```js
const _metaSupa = (window.supabase && window.supabase.createClient) ? window.supabase.createClient(META_URL,  META_KEY)  : null;
```

Delete those 16 lines entirely (the header comment on line 17 about `── Supabase clients ──` too).

- [ ] **Step 2: Remove fetchPaged and old fetchAll**

Locate the comment `// Fetch all rows from a Supabase query` at approximately line 770 and delete from there through the closing `}` of `fetchAll` (~line 1080).

Also delete `loadAppSetting` and `saveAppSetting` functions (~lines 1082–1110).

- [ ] **Step 3: Insert new fetchAll in their place**

Insert the following block at the same location (after the `mockData()` closing `}` and before `// ── React context`):

```js
async function _get(path, params) {
  const qs = Object.entries(params)
    .filter(([, v]) => v != null)
    .map(([k, v]) => encodeURIComponent(k) + '=' + encodeURIComponent(v))
    .join('&');
  const res = await fetch(path + (qs ? '?' + qs : ''));
  if (!res.ok) throw new Error(path + ': HTTP ' + res.status);
  return res.json();
}

const _addDay = rows => rows.map(r => ({ ...r, day: r.day || r.date }));

async function fetchAll(clientId, from, to) {
  if (!clientId) return null;
  const { prevFrom, prevTo } = computePrevRange(from, to);
  const params = { client_id: clientId };
  if (from) params.from = from;
  if (to) params.to = to;
  if (prevFrom) params.prevFrom = prevFrom;
  if (prevTo) params.prevTo = prevTo;

  const [gadsR, ga4R, gscR, metaR] = await Promise.allSettled([
    _get('/api/gads', params),
    _get('/api/ga4', params),
    _get('/api/gsc', params),
    _get('/api/meta', params),
  ]);

  const safe = (r, key) => (r.status === 'fulfilled' && r.value?.[key]) ? r.value[key] : {};
  const arr = (r, period, key) => safe(r, period)?.[key] || [];

  return {
    ads:            _addDay(arr(gadsR, 'current', 'totals')),
    adsDetail:      _addDay(arr(gadsR, 'current', 'detail')),
    adsGender:      arr(gadsR, 'current', 'gender'),
    adsConversions: arr(gadsR, 'current', 'conversions'),
    prevAds:            _addDay(arr(gadsR, 'previous', 'totals')),
    prevAdsDetail:      _addDay(arr(gadsR, 'previous', 'detail')),
    prevAdsGender:      arr(gadsR, 'previous', 'gender'),
    prevAdsConversions: arr(gadsR, 'previous', 'conversions'),
    ga4:            arr(ga4R, 'current', 'totals'),
    ga4Acquisition: arr(ga4R, 'current', 'acquisition'),
    ga4Audience:    arr(ga4R, 'current', 'audience'),
    ga4Page:        arr(ga4R, 'current', 'pages'),
    prevGa4:            arr(ga4R, 'previous', 'totals'),
    prevGa4Acquisition: arr(ga4R, 'previous', 'acquisition'),
    prevGa4Audience:    arr(ga4R, 'previous', 'audience'),
    prevGa4Page:        arr(ga4R, 'previous', 'pages'),
    gscSummary:   arr(gscR, 'current', 'totals'),
    gscQueries:   arr(gscR, 'current', 'queries'),
    gscPages:     arr(gscR, 'current', 'pages'),
    gscCountries: arr(gscR, 'current', 'countries'),
    gscDevices:   arr(gscR, 'current', 'devices'),
    prevGscSummary: arr(gscR, 'previous', 'totals'),
    prevGscQueries: arr(gscR, 'previous', 'queries'),
    prevGscPages:   arr(gscR, 'previous', 'pages'),
    meta:       arr(metaR, 'current', 'totals'),
    metaDetail: arr(metaR, 'current', 'detail'),
    prevMeta:       arr(metaR, 'previous', 'totals'),
    prevMetaDetail: arr(metaR, 'previous', 'detail'),
    _errors: [gadsR, ga4R, gscR, metaR]
      .filter(r => r.status === 'rejected')
      .map(r => r.reason?.message || 'Fetch error'),
  };
}
```

- [ ] **Step 4: Update the `window.LIVE` export**

Locate the `window.LIVE` export near the bottom:
```js
window.LIVE = {
  LiveProvider,
  useLive,
  _ga4Supa,
  fmt: { rupiahShort: fmtRupiahShort, num: fmtNum, pct: fmtPct, roas: fmtRoas, pctChange },
};
```

Replace with (removing the `_ga4Supa` export since Supabase is gone):
```js
window.LIVE = {
  LiveProvider,
  useLive,
  fmt: { rupiahShort: fmtRupiahShort, num: fmtNum, pct: fmtPct, roas: fmtRoas, pctChange },
};
```

- [ ] **Step 5: Verify no Supabase references remain**

```bash
grep -n "supabase\|_supa\|SUPA_\|_ga4Supa\|_gscSupa\|_metaSupa\|loadAppSetting\|saveAppSetting\|fetchPaged" app/assets/js/data-bridge.jsx
```

Expected: no matches.

- [ ] **Step 6: Commit**

```bash
git add app/assets/js/data-bridge.jsx
git commit -m "feat: replace Supabase data fetching with Neon API in data-bridge.jsx"
```

---

## Task 2: Update LiveProvider in data-bridge.jsx

**Files:**
- Modify: `app/assets/js/data-bridge.jsx`

The current `LiveProvider` maintains `account`, `metaAccount`, `ga4Property`, `gscProperty`, `psiUrl` states and calls `fetchAll` with two separate requests (current + previous). In the Neon version, `fetchAll` handles both periods internally, `clientId` drives the fetch, and property-filter states are no-ops (kept for backward compatibility with callers that destructure `useLive()`).

- [ ] **Step 1: Locate the current LiveProvider**

Find `function LiveProvider({ children })` — it starts around line 1115 after the previous deletions.

- [ ] **Step 2: Replace LiveProvider with the Neon version**

Replace the entire `LiveProvider` function body:

```jsx
function LiveProvider({ clientId, children }) {
  const [state, setState] = React.useState({
    loading: true, error: null, data: null, _isMock: false, fetchError: null,
  });
  const [dateRange, setDateRange] = React.useState({ from: null, to: null });
  const [psiUrl, setPsiUrl] = React.useState('');

  React.useEffect(() => {
    if (!clientId) return;
    let cancelled = false;
    setState(s => ({ ...s, loading: true }));
    (async () => {
      const { from, to } = dateRange;
      const { prevFrom, prevTo } = computePrevRange(from, to);
      const raw = await fetchAll(clientId, from, to);
      if (cancelled) return;

      let data, isMock = false;
      const hasData = raw && (
        raw.ads.length || raw.ga4.length || raw.gscSummary.length || raw.meta.length
      );
      if (!raw || !hasData) {
        data = mockData(); isMock = true;
      } else {
        const segRows = [
          ...(raw.adsGender      || []).map(r => ({ ...r, segment_type: 'gender' })),
          ...(raw.adsConversions || []).map(r => ({ ...r, segment_type: 'conversion_action' })),
        ];
        data = buildData(
          raw.ads, raw.ga4, [],
          raw.gscSummary, raw.gscQueries,
          raw.prevAds, raw.prevGa4,
          raw.prevGscSummary, raw.prevGscQueries,
          from, to, prevFrom, prevTo,
          raw.meta, raw.prevMeta,
          raw.gscPages, raw.prevGscPages,
          raw.adsDetail, segRows, null,
          raw.gscCountries, raw.gscDevices,
          raw.metaDetail,
          raw.ga4Audience, raw.ga4Page, raw.ga4Acquisition,
        );
      }
      const fetchError = (raw && raw._errors && raw._errors.length) ? raw._errors : null;
      setState({ loading: false, error: null, data, _isMock: isMock, fetchError });
    })();
    return () => { cancelled = true; };
  }, [clientId, dateRange]);

  const ctx = React.useMemo(() => ({
    ...state,
    currentPeriod: state.data,
    accounts: [],
    account: '', setAccount: () => {},
    metaAccount: null, setMetaAccount: () => {},
    ga4Property: null, setGa4Property: () => {},
    gscProperty: null, setGscProperty: () => {},
    psiUrl, setPsiUrl,
    psiApiKey: '', savePsiApiKey: () => {},
    dateRange, setDateRange,
    _anySourceConnected: true, _setAnySourceConnected: () => {},
  }), [state, psiUrl, dateRange]);

  return <DataCtx.Provider value={ctx}>{children}</DataCtx.Provider>;
}
```

- [ ] **Step 3: Verify LiveProvider compiles**

```bash
node -e "const s = require('fs').readFileSync('app/assets/js/data-bridge.jsx','utf8'); console.log('lines:', s.split('\n').length);"
```

Expected: file still exists and has reasonable line count (~900 or so after deletions).

- [ ] **Step 4: Commit**

```bash
git add app/assets/js/data-bridge.jsx
git commit -m "feat: simplify LiveProvider — clientId-scoped, no Supabase property filters"
```

---

## Task 3: Update app.jsx

**Files:**
- Modify: `app/assets/js/app.jsx`

Changes:
1. Remove `_AUTH_SUPA` (Supabase client for clients table)
2. `ShareView` currently calls `_AUTH_SUPA.from('clients')` — replace with fetch to `/api/app/client?share_token=X`
3. `Root` currently preloads clients via `_AUTH_SUPA.from('clients')` — replace with fetch to `/api/app/client?client_id=all` or just remove (screen-home loads clients itself)
4. Move `LiveProvider` to wrap only the client route (pass `clientId` prop)

- [ ] **Step 1: Remove _AUTH_SUPA and window._layoutSupa**

Locate:
```js
const _AUTH_SUPA = (window.supabase && window.supabase.createClient)
  ? window.supabase.createClient(
      'https://swklfolveiilajdmuenu.supabase.co',
      '...'
    )
  : null;
window._layoutSupa = _AUTH_SUPA;
```

Delete those 7 lines entirely.

- [ ] **Step 2: Replace ShareView**

Locate `function ShareView({ shareToken }) { ... }` and replace with:

```jsx
function ShareView({ shareToken }) {
  const [clientId, setClientId] = React.useState(null);
  const [notFound, setNotFound] = React.useState(false);

  React.useEffect(() => {
    if (!shareToken) { setNotFound(true); return; }
    let mounted = true;
    fetch('/api/app/client?share_token=' + encodeURIComponent(shareToken))
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!mounted) return;
        if (!d || !d.client) { setNotFound(true); return; }
        setClientId(d.client.id);
      })
      .catch(() => { if (mounted) setNotFound(true); });
    return () => { mounted = false; };
  }, [shareToken]);

  if (notFound) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#060E1A' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
        Link not found or expired.
      </div>
    </div>
  );

  if (!clientId) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#060E1A' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
        Loading…
      </div>
    </div>
  );

  return (
    <LiveProvider clientId={clientId}>
      <ScreenReport clientId={clientId} onBack={() => {}} hideBack={true} />
    </LiveProvider>
  );
}
```

- [ ] **Step 3: Update App to pass clientId to LiveProvider**

Locate the `if (route.route === 'client')` block:
```jsx
if (route.route === 'client') {
  return <ScreenReport clientId={route.clientId} onBack={() => navigate('home')}/>;
}
```

Replace with:
```jsx
if (route.route === 'client') {
  return (
    <LiveProvider clientId={route.clientId}>
      <ScreenReport clientId={route.clientId} onBack={() => navigate('home')}/>
    </LiveProvider>
  );
}
```

- [ ] **Step 4: Update Root — remove _AUTH_SUPA client preload, remove LiveProvider wrapper**

Locate `function Root()`:
```jsx
function Root() {
  useEffect(() => {
    if (!_AUTH_SUPA) return;
    _AUTH_SUPA.from('clients').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { if (data && data.length > 0) window._avo_clients = data; });
  }, []);

  useEffect(() => {
    const el = document.getElementById('boot-splash');
    if (!el) return;
    requestAnimationFrame(() => {
      el.classList.add('gone');
      setTimeout(() => el.remove(), 400);
    });
  }, []);
  return (
    <AppErrorBoundary>
      <LiveProvider>
        <App/>
      </LiveProvider>
    </AppErrorBoundary>
  );
}
```

Replace with:
```jsx
function Root() {
  useEffect(() => {
    const el = document.getElementById('boot-splash');
    if (!el) return;
    requestAnimationFrame(() => {
      el.classList.add('gone');
      setTimeout(() => el.remove(), 400);
    });
  }, []);
  return (
    <AppErrorBoundary>
      <App/>
    </AppErrorBoundary>
  );
}
```

- [ ] **Step 5: Verify no Supabase references in app.jsx**

```bash
grep -n "supabase\|_AUTH_SUPA\|_layoutSupa" app/assets/js/app.jsx
```

Expected: no matches.

- [ ] **Step 6: Commit**

```bash
git add app/assets/js/app.jsx
git commit -m "feat: remove _AUTH_SUPA from app.jsx; move LiveProvider to per-client scope"
```

---

## Task 4: Update screen-home.jsx to Load Clients from Neon

**Files:**
- Modify: `app/assets/components/screen-home.jsx`

`screen-home.jsx` currently uses `window._layoutSupa` (set from `_AUTH_SUPA` in app.jsx) to load and save clients. Since `_layoutSupa` is removed, replace all direct Supabase calls with fetch to `/api/app/client`.

- [ ] **Step 1: Find all Supabase usages**

```bash
grep -n "_layoutSupa\|supabase\|\.from(" app/assets/components/screen-home.jsx | head -40
```

Note the line numbers for each occurrence.

- [ ] **Step 2: Replace client fetch (load clients list)**

Find the pattern that loads clients from Supabase (typically inside a `useEffect`):
```js
window._layoutSupa.from('clients').select('*').order('created_at', { ascending: false })
  .then(({ data, error }) => { ... });
```

Replace with:
```js
fetch('/api/app/client?client_id=all')
  .then(r => r.ok ? r.json() : { clients: [] })
  .then(d => {
    const data = Array.isArray(d) ? d : (d.clients || []);
    // ... same handling as before
  })
  .catch(() => { /* silent */ });
```

Wait — `/api/app/client` doesn't have a `client_id=all` endpoint. The GET endpoint requires either `client_id` or `share_token`. To load all clients for the home screen, we need a different approach.

Add a new endpoint to Plan A's `api/app/client.js` OR load all clients from screen-home by checking `window._avo_clients` which was preloaded. Since we removed that preload, screen-home needs its own load.

The correct fix: in `api/app/client.js`, add handling for GET without `client_id` or `share_token` — return all clients:

In `api/app/client.js` GET handler, add before the existing `if (!client_id)` check:
```js
if (!client_id && !share_token) {
  const clients = await sql`SELECT id, name, logo_url, share_token, layouts, configs, created_at FROM clients ORDER BY created_at DESC`;
  return res.json({ clients });
}
```

Make this change in `api/app/client.js`:

```bash
# Find the line: if (!client_id) return res.status(400).json({ error: 'client_id or share_token required' });
```

Insert before it:
```js
if (!client_id && !share_token) {
  const clients = await sql`SELECT id, name, logo_url, share_token, layouts, configs, created_at FROM clients ORDER BY created_at DESC`;
  return res.json({ clients });
}
```

Commit this first:
```bash
git add api/app/client.js
git commit -m "feat: GET /api/app/client with no params returns all clients"
```

- [ ] **Step 3: Replace all _layoutSupa usages in screen-home.jsx**

For each pattern, replace as follows:

**Load all clients:**
```js
// OLD:
window._layoutSupa.from('clients').select('*').order('created_at', { ascending: false })
  .then(({ data }) => setClients(data || []));

// NEW:
fetch('/api/app/client')
  .then(r => r.json())
  .then(d => setClients(d.clients || []));
```

**Save layouts/configs (PATCH):**
```js
// OLD:
window._layoutSupa.from('clients').update({ layouts: newLayouts }).eq('id', clientId);

// NEW:
fetch('/api/app/client', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ client_id: clientId, layouts: newLayouts }),
});
```

**Create client (POST):**
```js
// OLD:
window._layoutSupa.from('clients').insert({ id, name, logo_url });

// NEW:
fetch('/api/app/client', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ id, name, logo_url }),
});
```

**Delete client (DELETE):**
```js
// OLD:
window._layoutSupa.from('clients').delete().eq('id', clientId);

// NEW:
fetch('/api/app/client', {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ client_id: clientId }),
});
```

Apply all replacements. Run:
```bash
grep -n "_layoutSupa" app/assets/components/screen-home.jsx
```

Expected: no matches.

- [ ] **Step 4: Commit**

```bash
git add app/assets/components/screen-home.jsx
git commit -m "feat: remove _layoutSupa from screen-home.jsx; use fetch to /api/app/client"
```

---

## Task 5: Update index.html

**Files:**
- Modify: `app/index.html`

Remove the Supabase CDN script tag. Bump version numbers for modified files.

- [ ] **Step 1: Remove Supabase CDN**

Locate:
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

Delete that line.

- [ ] **Step 2: Bump version numbers for modified files**

Find each script tag for files modified in Plans B and C, increment their `?v=N` query string by 1:

```html
<!-- Current — change these: -->
<script type="text/babel" src="assets/js/data-bridge.jsx?v=40"></script>
<script type="text/babel" src="assets/js/app.jsx?v=6"></script>
<script type="text/babel" src="assets/components/screen-home.jsx?v=30"></script>
```

Increment each version by 1 (data-bridge: v40→v41, app: v6→v7, screen-home: v30→v31).

- [ ] **Step 3: Verify Supabase CDN is gone**

```bash
grep -n "supabase" app/index.html
```

Expected: no matches.

- [ ] **Step 4: Commit**

```bash
git add app/index.html
git commit -m "feat: remove Supabase CDN from index.html; bump component versions"
```

---

## Task 6: Integration Test

- [ ] **Step 1: Start local dev server**

```bash
cd /Users/sleepanatomy/Documents/GitHub/reportive-dashboard && python3 -m http.server 3100 --directory app
```

Open `http://localhost:3100` in a browser.

- [ ] **Step 2: Verify app loads without console errors**

Open DevTools → Console. Expected: no `supabase` errors, no `_AUTH_SUPA` reference errors, no `_layoutSupa` undefined errors.

Expected: app loads, home screen shows (either real clients or empty list).

- [ ] **Step 3: Verify no 404 for Supabase CDN**

In DevTools → Network tab, filter by "supabase". Expected: no requests to `cdn.jsdelivr.net/npm/@supabase`.

- [ ] **Step 4: Verify a client report loads**

Click on a client (if any). Expected: loading spinner shows, then data loads from `/api/gads`, `/api/ga4`, `/api/gsc`, `/api/meta`. Check Network tab for these requests.

- [ ] **Step 5: Verify mock data shows if no client data**

If tables are empty in Neon (Plan A not yet run in prod), the dashboard should show mock data (grey banner with "Demo Mode" or similar). Expected: no crash, mock data displayed.

- [ ] **Step 6: Final commit**

```bash
git status
git commit -m "feat: Plan C complete — frontend fully migrated from Supabase to Neon API" --allow-empty
```
