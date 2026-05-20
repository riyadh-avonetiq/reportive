# Home Table Improvements Design

> **For agentic workers:** This spec is ready for implementation. Use `superpowers:writing-plans` to create the implementation plan.

**Date:** 2026-05-19
**File:** `app/assets/components/screen-home.jsx`

---

## Goal

Improve the client table on the home page with two focused enhancements:
1. **Sortable column headers** — CLIENT, SOURCES, LAST EDITED clickable to sort ASC/DESC
2. **`···` action menu** — consolidate PDF, Duplicate, Delete into a dropdown; Configure and Open remain directly on the row

---

## 1. Grid Layout Change

The current grid `'40px minmax(120px,1fr) 64px 160px 90px 200px'` with fixed pixel columns causes content to cluster on the right.

**New grid:** `'48px 1.8fr 1.4fr 1fr 1.6fr'`

| Column | Old | New |
|---|---|---|
| Avatar | `40px` | `48px` |
| Client name | `minmax(120px,1fr)` | `1.8fr` |
| Sources | `160px` | `1.4fr` |
| Last Edited | `90px` | `1fr` |
| Actions | `200px` | `1.6fr` |

The dedicated `64px` dup/delete icon column is removed — those actions move into `···`.

Gap is removed between columns (`gap:0`) — padding on each cell handles internal spacing instead.

---

## 2. Sortable Column Headers

### State

Add `sortKey` and `sortDir` to `ScreenHome` (or `ClientRow`'s parent):

```js
const [sortKey, setSortKey] = React.useState(null);   // 'name' | 'sources' | 'lastEdited' | null
const [sortDir, setSortDir] = React.useState('asc');  // 'asc' | 'desc'
```

### Sort logic

```js
const toggleSort = (key) => {
  if (sortKey === key) {
    if (sortDir === 'asc') setSortDir('desc');
    else { setSortKey(null); setSortDir('asc'); }  // third click resets
  } else {
    setSortKey(key);
    setSortDir('asc');
  }
};

const sorted = React.useMemo(() => {
  if (!sortKey) return filtered;
  return [...filtered].sort((a, b) => {
    let va, vb;
    if (sortKey === 'name') {
      va = a.name.toLowerCase(); vb = b.name.toLowerCase();
    } else if (sortKey === 'sources') {
      va = Object.values(a.connected).filter(Boolean).length;
      vb = Object.values(b.connected).filter(Boolean).length;
    } else if (sortKey === 'lastEdited') {
      va = a.lastEditedTs || 0; vb = b.lastEditedTs || 0;
    }
    if (va < vb) return sortDir === 'asc' ? -1 : 1;
    if (va > vb) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });
}, [filtered, sortKey, sortDir]);
```

`lastEditedTs` is a numeric timestamp derived from `client.last_edited` during `_mapRow`.

### Header UI

Replace the static header `<div>` cells with a `SortTh` component:

```jsx
const SortTh = ({ label, sortK, active, dir, onSort, align }) => (
  <div
    onClick={() => onSort(sortK)}
    style={{
      display: 'flex', alignItems: 'center', gap: 4,
      cursor: 'pointer', userSelect: 'none',
      justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
      fontFamily: HS.mono, fontSize: 11, fontWeight: 600,
      textTransform: 'uppercase', letterSpacing: '.12em',
      color: active ? '#FCFCFC' : 'var(--text-muted)',
    }}
  >
    {label}
    {active ? (
      <svg width="9" height="9" fill="none" stroke="#00C2B8" strokeWidth="2.2" viewBox="0 0 24 24">
        {dir === 'asc'
          ? <path d="M12 5v14M5 12l7-7 7 7"/>
          : <path d="M12 19V5M5 12l7 7 7-7"/>}
      </svg>
    ) : (
      <svg width="9" height="9" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24" style={{ opacity: 0.3 }}>
        <path d="M12 5v14M5 12l7-7 7 7"/>
      </svg>
    )}
  </div>
);
```

Sortable headers: CLIENT, SOURCES, LAST EDITED. The avatar column and Actions column have no sort header.

---

## 3. `···` Action Menu

### What moves in

| Action | Before | After |
|---|---|---|
| Export PDF | Button on row | Inside `···` |
| Duplicate | Hover icon on row | Inside `···` |
| Delete | Hover icon on row | Inside `···` |
| Configure | Button on row | **Stays on row** |
| Open → | Button on row | **Stays on row** |

The `64px` dup/delete column is fully removed.

### State

```js
const [menuOpen, setMenuOpen] = React.useState(false);
const menuRef = React.useRef(null);
```

Close on outside click:

```js
React.useEffect(() => {
  if (!menuOpen) return;
  const handler = (e) => {
    if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
  };
  document.addEventListener('mousedown', handler);
  return () => document.removeEventListener('mousedown', handler);
}, [menuOpen]);
```

### Menu JSX

```jsx
<div ref={menuRef} style={{ position: 'relative' }}>
  <button
    onClick={(e) => { e.stopPropagation(); setMenuOpen(v => !v); }}
    style={{
      padding: '6px 10px', background: menuOpen ? 'rgba(255,255,255,.1)' : 'rgba(255,255,255,.06)',
      border: '1px solid rgba(255,255,255,.1)', borderRadius: 7,
      color: 'var(--text-secondary)', fontFamily: HS.display, fontSize: 16,
      cursor: 'pointer', letterSpacing: 2, lineHeight: 1,
    }}
  >···</button>

  {menuOpen && (
    <div style={{
      position: 'absolute', right: 0, top: 'calc(100% + 6px)',
      background: 'var(--navy-surface)', border: '1px solid var(--navy-edge)',
      borderRadius: 9, padding: 6, width: 152,
      boxShadow: '0 8px 24px rgba(0,0,0,.5)', zIndex: 50,
    }}>
      {/* Export PDF */}
      <MenuItem icon="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z|M14 2v6h6M9 13h6M9 17h4"
        label="Export PDF" onClick={() => { handlePDF(); setMenuOpen(false); }} />
      <div style={{ height: 1, background: 'var(--navy-edge)', margin: '4px 0' }} />
      {/* Duplicate */}
      <MenuItem icon="M8 17H5a2 2 0 01-2-2V5a2 2 0 012-2h8a2 2 0 012 2v3M11 21h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
        label="Duplicate" onClick={() => { onDuplicate(client); setMenuOpen(false); }} />
      {/* Delete */}
      {!isViewer && (
        <MenuItem icon="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"
          label="Delete" onClick={() => { onDelete(client); setMenuOpen(false); }} danger />
      )}
    </div>
  )}
</div>
```

`MenuItem` helper:

```jsx
const MenuItem = ({ icon, label, onClick, danger }) => (
  <div
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    style={{
      padding: '7px 10px', borderRadius: 6,
      display: 'flex', alignItems: 'center', gap: 8,
      cursor: 'pointer', color: danger ? '#DC2626' : 'var(--text-secondary)',
      fontFamily: HS.display, fontSize: 13, fontWeight: 600,
      transition: 'background .1s',
    }}
    onMouseEnter={e => e.currentTarget.style.background = danger ? 'rgba(220,38,38,.1)' : 'rgba(255,255,255,.06)'}
    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
  >
    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.9"
         viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
      {icon.split('|').map((d, i) => <path key={i} d={d} />)}
    </svg>
    {label}
  </div>
);
```

---

## 4. `_mapRow` — Add `lastEditedTs`

In `_mapRow`, parse `last_edited` to a timestamp for numeric sort:

```js
lastEditedTs: row.last_edited ? new Date(row.last_edited).getTime() : 0,
```

---

## Out of Scope

- Sorting persistence across page refreshes (localStorage) — not needed now
- Keyboard navigation of `···` menu — not needed now
- Stats summary bar (improvement A) — separate initiative
- Data freshness indicator (improvement D) — separate initiative
