# Group C Quick Wins Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the unfinished template page entirely and add `regex` / `not_regex` filter operators to the report canvas widget filter.

**Architecture:** Three isolated file changes. Template removal touches `screen-home.jsx`, `index.html`, and deletes `screen-templates.jsx`. Regex filter touches `card-editor.jsx` (dropdown UI) and `screen-report.jsx` (filter logic — two locations).

**Tech Stack:** React (Babel standalone), no new dependencies.

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `app/assets/components/screen-templates.jsx` | Delete | Remove template page entirely |
| `app/assets/components/screen-home.jsx` | Modify ~lines 1269, 1286 | Remove Templates from nav |
| `app/assets/components/card-editor.jsx` | Modify ~lines 1325–1358 | Add regex ops to dropdown + fix input |
| `app/assets/components/screen-report.jsx` | Modify ~lines 929–936, 1116–1121 | Add regex logic in two filter functions |
| `app/index.html` | Modify | Remove script tag, bump versions |

---

### Task 1: Remove template page

**Files:**
- Delete: `app/assets/components/screen-templates.jsx`
- Modify: `app/assets/components/screen-home.jsx` (~lines 1269, 1286)
- Modify: `app/index.html`

- [ ] **Step 1: Delete the template component file**

```bash
rm app/assets/components/screen-templates.jsx
```

- [ ] **Step 2: Remove Templates from NAV_ROUTES in screen-home.jsx**

Find line ~1269:
```js
  const NAV_ROUTES = { Home: 'home', Templates: 'templates', Access: 'access' };
```

Replace with:
```js
  const NAV_ROUTES = { Home: 'home', Access: 'access' };
```

- [ ] **Step 3: Remove Templates from the nav render in screen-home.jsx**

Find line ~1286:
```jsx
      {(_VIEWER_ROLE ? [['Home','active']] : [['Home','active'],['Templates',''],['Access','']]).map(([l,a]) =>
```

Replace with:
```jsx
      {(_VIEWER_ROLE ? [['Home','active']] : [['Home','active'],['Access','']]).map(([l,a]) =>
```

- [ ] **Step 4: Remove the script tag from index.html**

Find:
```html
<script type="text/babel" src="assets/components/screen-templates.jsx"></script>
```

Delete that entire line.

- [ ] **Step 5: Commit**

```bash
git add app/assets/components/screen-home.jsx app/index.html
git commit -m "feat: remove template page"
```

---

### Task 2: Add regex operators to the filter UI (card-editor.jsx)

**Files:**
- Modify: `app/assets/components/card-editor.jsx` (~lines 1325–1358)

The filter editor has a `KPI_FILTER_OPS` array that populates the operator dropdown, and a `renderFilterRows` function that renders the value input. Two changes needed.

- [ ] **Step 1: Add regex ops to KPI_FILTER_OPS**

Find (~line 1325):
```js
  const KPI_FILTER_OPS = [
    { value: 'contains', label: 'Contains' },
    { value: 'is',       label: 'Equals' },
    { value: 'not',      label: 'Not equal' },
    { value: 'starts',   label: 'Starts with' },
  ];
```

Replace with:
```js
  const KPI_FILTER_OPS = [
    { value: 'contains',   label: 'Contains' },
    { value: 'is',         label: 'Equals' },
    { value: 'not',        label: 'Not equal' },
    { value: 'starts',     label: 'Starts with' },
    { value: 'regex',      label: 'Matches /regex/' },
    { value: 'not_regex',  label: 'Not /regex/' },
  ];
```

- [ ] **Step 2: Force text input and update placeholder for regex operators**

In `renderFilterRows` (~line 1348), find the value input block:
```jsx
          {(dimValMap[f.dim || defaultDim] || []).length > 0 ? (
            <select value={f.val || ''} onChange={function(e) { var nf = filtersArr.slice(); nf[fi] = Object.assign({}, f, { val: e.target.value }); onChange(nf); }}
              style={{ width: '100%', boxSizing: 'border-box', padding: '6px 10px', background: EP.surface, border: `1px solid ${EP.edge}`, borderRadius: 5, color: f.val ? EP.fg : EP.muted, fontFamily: 'var(--font-body)', fontSize: 13.5, outline: 'none' }}>
              <option value="">— pilih nilai —</option>
              {(dimValMap[f.dim || defaultDim] || []).map(function(v) { return <option key={v} value={v}>{v}</option>; })}
            </select>
          ) : (
            <input value={f.val || ''} onChange={function(e) { var nf = filtersArr.slice(); nf[fi] = Object.assign({}, f, { val: e.target.value }); onChange(nf); }}
              placeholder="nilai filter…"
              style={{ width: '100%', boxSizing: 'border-box', padding: '6px 10px', background: EP.surface, border: `1px solid ${EP.edge}`, borderRadius: 5, color: EP.fg, fontFamily: 'var(--font-body)', fontSize: 13.5, outline: 'none' }}/>
          )}
```

Replace with:
```jsx
          {(dimValMap[f.dim || defaultDim] || []).length > 0 && f.op !== 'regex' && f.op !== 'not_regex' ? (
            <select value={f.val || ''} onChange={function(e) { var nf = filtersArr.slice(); nf[fi] = Object.assign({}, f, { val: e.target.value }); onChange(nf); }}
              style={{ width: '100%', boxSizing: 'border-box', padding: '6px 10px', background: EP.surface, border: `1px solid ${EP.edge}`, borderRadius: 5, color: f.val ? EP.fg : EP.muted, fontFamily: 'var(--font-body)', fontSize: 13.5, outline: 'none' }}>
              <option value="">— pilih nilai —</option>
              {(dimValMap[f.dim || defaultDim] || []).map(function(v) { return <option key={v} value={v}>{v}</option>; })}
            </select>
          ) : (
            <input value={f.val || ''} onChange={function(e) { var nf = filtersArr.slice(); nf[fi] = Object.assign({}, f, { val: e.target.value }); onChange(nf); }}
              placeholder={(f.op === 'regex' || f.op === 'not_regex') ? 'Pattern… e.g. brand|toko' : 'nilai filter…'}
              style={{ width: '100%', boxSizing: 'border-box', padding: '6px 10px', background: EP.surface, border: `1px solid ${EP.edge}`, borderRadius: 5, color: EP.fg, fontFamily: 'var(--font-body)', fontSize: 13.5, outline: 'none' }}/>
          )}
```

- [ ] **Step 3: Commit**

```bash
git add app/assets/components/card-editor.jsx
git commit -m "feat: add regex and not_regex operators to filter dropdown"
```

---

### Task 3: Add regex logic to screen-report.jsx (two locations)

**Files:**
- Modify: `app/assets/components/screen-report.jsx` (~lines 929–936, ~lines 1116–1121)

There are two independent filter functions that both need the same regex logic added.

- [ ] **Step 1: Add regex to applyKpiFilters (~line 929)**

Find in `applyKpiFilters` → `matchRow`:
```js
  var matchRow = function(row, f) {
    var rv = String(row[f.dim] || '').toLowerCase();
    var v  = (f.val || '').toLowerCase();
    if (!v) return true;
    if (f.op === 'is')     return rv === v;
    if (f.op === 'not')    return rv !== v;
    if (f.op === 'starts') return rv.startsWith(v);
    return rv.includes(v);
  };
```

Replace with:
```js
  var matchRow = function(row, f) {
    var rv = String(row[f.dim] || '').toLowerCase();
    var v  = (f.val || '').toLowerCase();
    if (!v) return true;
    if (f.op === 'is')        return rv === v;
    if (f.op === 'not')       return rv !== v;
    if (f.op === 'starts')    return rv.startsWith(v);
    if (f.op === 'regex')     { try { return new RegExp(f.val, 'i').test(rv); } catch { return false; } }
    if (f.op === 'not_regex') { try { return !new RegExp(f.val, 'i').test(rv); } catch { return true; } }
    return rv.includes(v);
  };
```

- [ ] **Step 2: Add regex to the table widget filter useMemo (~line 1116)**

Find inside the `filtered` useMemo:
```js
      r = r.filter(row => {
        const rv = String(row[f.dim] || '').toLowerCase();
        if (f.op === 'is')     return rv === v;
        if (f.op === 'not')    return rv !== v;
        if (f.op === 'starts') return rv.startsWith(v);
        return rv.includes(v);
      });
```

Replace with:
```js
      r = r.filter(row => {
        const rv = String(row[f.dim] || '').toLowerCase();
        if (f.op === 'is')        return rv === v;
        if (f.op === 'not')       return rv !== v;
        if (f.op === 'starts')    return rv.startsWith(v);
        if (f.op === 'regex')     { try { return new RegExp(f.val, 'i').test(rv); } catch { return false; } }
        if (f.op === 'not_regex') { try { return !new RegExp(f.val, 'i').test(rv); } catch { return true; } }
        return rv.includes(v);
      });
```

- [ ] **Step 3: Commit**

```bash
git add app/assets/components/screen-report.jsx
git commit -m "feat: add regex and not_regex filter operators to applyKpiFilters and table filter"
```

---

### Task 4: Bump versions in index.html

**Files:**
- Modify: `app/index.html`

- [ ] **Step 1: Apply version bumps**

Make these three changes:

Change `screen-home.jsx?v=27` → `screen-home.jsx?v=28`

Change `card-editor.jsx?v=55` → `card-editor.jsx?v=56`

Change `screen-report.jsx?v=109` → `screen-report.jsx?v=110`

- [ ] **Step 2: Commit**

```bash
git add app/index.html
git commit -m "chore: bump screen-home v28, card-editor v56, screen-report v110"
```
