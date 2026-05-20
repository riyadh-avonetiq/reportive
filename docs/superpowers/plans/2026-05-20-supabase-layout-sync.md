# Supabase Layout Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all `localStorage` reads and writes for widget layouts and configs with Supabase `report_layouts` table so every user sees the same canvas for each client report.

**Architecture:** `app.jsx` exposes its existing `_AUTH_SUPA` Supabase client as `window._layoutSupa`. `screen-report.jsx` uses that client to load on client switch (async fetch) and save on change (debounced 1500ms upsert). Both old `localStorage` save effects are replaced with one combined debounced effect.

**Tech Stack:** Supabase JS v2 (already loaded), React hooks (useState/useEffect/useRef), `report_layouts` table (already created in Supabase instance `swklfolveiilajdmuenu`)

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `app/assets/js/app.jsx` | Modify line 105 | Expose `_AUTH_SUPA` as `window._layoutSupa` |
| `app/assets/components/screen-report.jsx` | Modify ~lines 4948, 5037–5083 | Replace localStorage load/save with Supabase fetch/upsert |
| `app/index.html` | Modify version strings | Force browsers to load updated files |

---

### Task 1: Expose `_AUTH_SUPA` globally from `app.jsx`

**Files:**
- Modify: `app/assets/js/app.jsx` (after line 105)
- Modify: `app/index.html` (bump `app.jsx?v=3` → `?v=4`)

- [ ] **Step 1: Add `window._layoutSupa` assignment**

In `app/assets/js/app.jsx`, after line 105 (the closing `): null;` of the `_AUTH_SUPA` declaration), add one line:

```js
// ── Auth Supabase client (clients table) ───────────────────────
const _AUTH_SUPA = (window.supabase && window.supabase.createClient)
  ? window.supabase.createClient(
      'https://swklfolveiilajdmuenu.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3a2xmb2x2ZWlpbGFqZG11ZW51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NDEwMDAsImV4cCI6MjA5MzAxNzAwMH0.ZuxBQkHGwpY82XwA0NQzjqnvCeJH0WUIcp0Bux2K-84'
    )
  : null;
window._layoutSupa = _AUTH_SUPA;
```

- [ ] **Step 2: Bump `app.jsx` version in `app/index.html`**

Change:
```html
<script type="text/babel" src="assets/js/app.jsx?v=3"></script>
```
To:
```html
<script type="text/babel" src="assets/js/app.jsx?v=4"></script>
```

- [ ] **Step 3: Commit**

```bash
git add app/assets/js/app.jsx app/index.html
git commit -m "feat: expose _layoutSupa globally for Supabase layout sync"
```

---

### Task 2: Replace load effect — localStorage → Supabase fetch

**Files:**
- Modify: `app/assets/components/screen-report.jsx` lines 4948, 5037–5057

- [ ] **Step 1: Add `saveTimerRef`**

In `screen-report.jsx`, find this block (around line 4947–4948):

```js
  // Effective layout ref — always the displayed layout (state OR smart default)
  const effectiveLayoutsRef = React.useRef(null);
  const [historyLen, setHistoryLen] = useState(0);
```

Add `saveTimerRef` on the line immediately after `effectiveLayoutsRef`:

```js
  // Effective layout ref — always the displayed layout (state OR smart default)
  const effectiveLayoutsRef = React.useRef(null);
  const saveTimerRef = React.useRef(null);
  const [historyLen, setHistoryLen] = useState(0);
```

- [ ] **Step 2: Replace the load effect**

Find and replace the entire load effect (lines 5037–5057):

**Remove this:**
```js
  // Load persisted configs + layouts when switching clients
  useEffect(() => {
    setSelectedWidgets([]);
    setClipboard(null);
    setMarquee(null);
    let configs = {};
    try {
      const saved = localStorage.getItem('widgetConfigs_' + clientId);
      configs = saved ? JSON.parse(saved) : {};
    } catch {}
    initConfigRef.current = configs;
    setWidgetConfigs(configs);
    let layouts = null;
    try {
      const savedLayouts = localStorage.getItem('widgetLayouts_' + clientId);
      const parsed = savedLayouts ? JSON.parse(savedLayouts) : null;
      layouts = parsed ? migrateLegacyLayout(parsed) : null;
    } catch {}
    initLayoutRef.current = layouts;
    setWidgetLayouts(layouts);
  }, [clientId]);
```

**Replace with this:**
```js
  // Load persisted configs + layouts from Supabase when switching clients
  useEffect(() => {
    setSelectedWidgets([]);
    setClipboard(null);
    setMarquee(null);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    // Reset immediately while fetch is in-flight
    initConfigRef.current = {};
    initLayoutRef.current = null;
    setWidgetConfigs({});
    setWidgetLayouts(null);
    if (!window._layoutSupa || !clientId) return;
    window._layoutSupa
      .from('report_layouts')
      .select('layouts, configs')
      .eq('client_id', clientId)
      .maybeSingle()
      .then(({ data }) => {
        const layouts = data?.layouts ? migrateLegacyLayout(data.layouts) : null;
        const configs = data?.configs || {};
        initConfigRef.current = configs;
        initLayoutRef.current = layouts;
        setWidgetConfigs(configs);
        setWidgetLayouts(layouts);
      });
  }, [clientId]);
```

---

### Task 3: Replace save effects — localStorage → debounced Supabase upsert

**Files:**
- Modify: `app/assets/components/screen-report.jsx` lines 5059–5083

- [ ] **Step 1: Replace both save effects with one debounced upsert**

Find and remove both existing save effects (lines 5059–5083):

**Remove this:**
```js
  // Persist configs on every change (clientId intentionally excluded from deps — accessed via ref)
  useEffect(() => {
    if (!clientIdRef.current || Object.keys(widgetConfigs).length === 0) return;
    try {
      localStorage.setItem('widgetConfigs_' + clientIdRef.current, JSON.stringify(widgetConfigs));
      // Skip the flash when this is just the initial load from localStorage
      if (widgetConfigs !== initConfigRef.current) {
        setSavedFlash(true);
        setTimeout(() => setSavedFlash(false), 1800);
      }
    } catch {}
  }, [widgetConfigs]); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist layouts on every change (clientId intentionally excluded from deps — accessed via ref)
  useEffect(() => {
    if (!clientIdRef.current || !widgetLayouts) return;
    try {
      localStorage.setItem('widgetLayouts_' + clientIdRef.current, JSON.stringify(widgetLayouts));
      // Skip the flash when this is just the initial load from localStorage
      if (widgetLayouts !== initLayoutRef.current) {
        setSavedFlash(true);
        setTimeout(() => setSavedFlash(false), 1800);
      }
    } catch {}
  }, [widgetLayouts]); // eslint-disable-line react-hooks/exhaustive-deps
```

**Replace with this:**
```js
  // Debounced save to Supabase — fires 1500ms after last layout or config change
  useEffect(() => {
    const configsUnchanged = widgetConfigs === initConfigRef.current;
    const layoutsUnchanged = widgetLayouts === initLayoutRef.current;
    if (configsUnchanged && layoutsUnchanged) return;
    if (!clientIdRef.current) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      if (!window._layoutSupa) return;
      const { error } = await window._layoutSupa
        .from('report_layouts')
        .upsert({
          client_id: clientIdRef.current,
          layouts: widgetLayoutsRef.current,
          configs: widgetConfigsRef.current,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'client_id' });
      if (!error) {
        setSavedFlash(true);
        setTimeout(() => setSavedFlash(false), 1800);
      }
    }, 1500);
    return () => clearTimeout(saveTimerRef.current);
  }, [widgetConfigs, widgetLayouts]); // eslint-disable-line react-hooks/exhaustive-deps
```

- [ ] **Step 2: Bump `screen-report.jsx` version in `app/index.html`**

Change:
```html
<script type="text/babel" src="assets/components/screen-report.jsx?v=106"></script>
```
To:
```html
<script type="text/babel" src="assets/components/screen-report.jsx?v=107"></script>
```

- [ ] **Step 3: Verify manually**

1. Open `http://localhost:3100` in browser
2. Log in and open any client report
3. Open browser DevTools → Network tab → filter by `report_layouts`
4. Confirm a `GET` request fires to Supabase on report open
5. Add or move a widget on the canvas
6. Wait 1.5 seconds → confirm a `POST` (upsert) fires to Supabase
7. Open the same report in a second browser window (or incognito)
8. Confirm the layout you saved in step 6 appears in the second window
9. Confirm the "Tersimpan" flash only appears after the upsert, not on every keystroke

- [ ] **Step 4: Commit**

```bash
git add app/assets/components/screen-report.jsx app/index.html
git commit -m "feat: sync widget layouts and configs via Supabase report_layouts table"
```

---

### Task 4: Push to Vercel

- [ ] **Step 1: Push to GitHub**

```bash
git push origin main
```

Expected: Vercel auto-deploys within ~30 seconds.

- [ ] **Step 2: Verify on deployed URL**

1. Open `https://reportive.vercel.app` (or your custom domain)
2. Log in and open a client report
3. Add a widget and wait 1.5s for the "Tersimpan" flash
4. Open the same URL in a second browser / incognito window
5. Confirm the widget appears — layout is now shared across all users
