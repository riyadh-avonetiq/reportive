# Pointer Drag Zone System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 5-zone drop detection (left/right/above/below/center) to existing widget pointer drag in the report canvas, and remove the 12-column grid overlay shown during drag.

**Architecture:** All changes are inside the `DragCanvas` function in `screen-report.jsx`. Zone detection moves from `onPointerEnter` (coarse swap only) to `handlePointerMove` (precise zone from cursor position relative to target widget bounding rect). A `widgetEls` ref map tracks each widget's DOM element + row index. `applyDrop` is extended with `before`/`after`/`above`/`below` types alongside the existing `swap` and `new-row`.

**Tech Stack:** Vanilla React (no build step). `teal = '#00C2B8'` is a module-level constant. No automated tests — manual browser verification only.

---

## File Map

- **Modify:** `app/assets/components/screen-report.jsx` — `DragCanvas` function only (lines ~1933–2477)

---

### Task 1: Remove 12-column grid overlay and add widgetEls ref

**Files:**
- Modify: `app/assets/components/screen-report.jsx:1940-1943` (add ref)
- Modify: `app/assets/components/screen-report.jsx:2247-2253` (delete grid overlay)

- [ ] **Step 1: Add `widgetEls` ref after existing refs**

Find this block (around line 1940–1943):
```javascript
  const pendingDrag  = React.useRef(null);
  const dragIdRef    = React.useRef(null);   // mirrors dragId for doc-level handlers
  const containerRef = React.useRef(null);   // ref to the outer canvas div
  const justDropped  = React.useRef(false);
```

Add one line after `justDropped`:
```javascript
  const pendingDrag  = React.useRef(null);
  const dragIdRef    = React.useRef(null);   // mirrors dragId for doc-level handlers
  const containerRef = React.useRef(null);   // ref to the outer canvas div
  const justDropped  = React.useRef(false);
  const widgetEls    = React.useRef({});     // id -> { el, rowIdx } for zone detection
```

- [ ] **Step 2: Delete the 12-column grid overlay**

Find and delete this entire block (around lines 2247–2253):
```javascript
      {/* 12-column grid overlay during pointer drag */}
      {dragId && (
        <div style={{
          position: 'absolute', inset: -4, zIndex: 1, pointerEvents: 'none', borderRadius: 6,
          background: 'repeating-linear-gradient(to right, rgba(0,194,184,.06) 0, rgba(0,194,184,.06) calc(100%/12 - 14px * 11/12), transparent calc(100%/12 - 14px * 11/12), transparent calc(100%/12))',
          border: '1px solid rgba(0,194,184,.1)',
        }}/>
      )}
```

Delete all 8 lines (comment + JSX block).

- [ ] **Step 3: Verify**

Read the modified file. Confirm:
- `widgetEls = React.useRef({})` is present after `justDropped`
- The `repeating-linear-gradient` string is gone from the file
- No other changes were made

- [ ] **Step 4: Commit**

```bash
git add app/assets/components/screen-report.jsx
git commit -m "feat: remove 12-col grid overlay; add widgetEls ref for zone detection"
```

---

### Task 2: Replace handlePointerMove with zone-detecting version

**Files:**
- Modify: `app/assets/components/screen-report.jsx:2029-2040` (handlePointerMove)
- Modify: `app/assets/components/screen-report.jsx:2301` (remove onPointerEnter swap detection)

- [ ] **Step 1: Replace handlePointerMove**

Find the current `handlePointerMove` (around lines 2029–2040):
```javascript
  const handlePointerMove = (e) => {
    if (pendingDrag.current && !dragId) {
      const dx = e.clientX - pendingDrag.current.startX;
      const dy = e.clientY - pendingDrag.current.startY;
      if (Math.sqrt(dx * dx + dy * dy) > 6) {
        setDragId(pendingDrag.current.id);
        setGhostPos({ x: e.clientX, y: e.clientY });
        pendingDrag.current = null;
      }
    }
    if (dragId) setGhostPos({ x: e.clientX, y: e.clientY });
  };
```

Replace it entirely with:
```javascript
  const handlePointerMove = (e) => {
    if (pendingDrag.current && !dragId) {
      const dx = e.clientX - pendingDrag.current.startX;
      const dy = e.clientY - pendingDrag.current.startY;
      if (Math.sqrt(dx * dx + dy * dy) > 6) {
        setDragId(pendingDrag.current.id);
        setGhostPos({ x: e.clientX, y: e.clientY });
        pendingDrag.current = null;
      }
    }
    if (dragId) {
      setGhostPos({ x: e.clientX, y: e.clientY });
      // Zone detection: find which sibling the cursor is over and which zone
      let found = null;
      for (const [wid, meta] of Object.entries(widgetEls.current)) {
        if (wid === dragId) continue;
        const r = meta.el.getBoundingClientRect();
        if (e.clientX >= r.left && e.clientX <= r.right &&
            e.clientY >= r.top  && e.clientY <= r.bottom) {
          found = { id: wid, rowIdx: meta.rowIdx, r };
          break;
        }
      }
      if (found) {
        const { id: tid, rowIdx, r } = found;
        const relX = (e.clientX - r.left) / r.width;
        const relY = (e.clientY - r.top)  / r.height;
        let type;
        if      (relX < 0.25) type = 'before';
        else if (relX > 0.75) type = 'after';
        else if (relY < 0.25) type = 'above';
        else if (relY > 0.75) type = 'below';
        else                  type = 'swap';
        setDropTarget({ type, targetId: tid, rowIdx });
      } else {
        setDropTarget(null);
      }
    }
  };
```

- [ ] **Step 2: Remove onPointerEnter swap detection from widget div**

Find this line on the widget `<div>` (around line 2301):
```javascript
                    onPointerEnter={() => { if (dragId && dragId !== id) setDropTarget({ type: 'swap', targetId: id }); }}
```

Delete this entire line. Zone detection is now handled by `handlePointerMove`.

- [ ] **Step 3: Verify**

Read the modified area. Confirm:
- `handlePointerMove` now contains the zone detection loop using `widgetEls.current`
- The `onPointerEnter` line is gone from the widget div
- `onPointerDown` is still present on the widget div
- No other changes were made

- [ ] **Step 4: Commit**

```bash
git add app/assets/components/screen-report.jsx
git commit -m "feat: zone detection in handlePointerMove; remove coarse onPointerEnter swap"
```

---

### Task 3: Update applyDrop for before/after/above/below zone types

**Files:**
- Modify: `app/assets/components/screen-report.jsx:2044-2101` (applyDrop function)

**Context:** The current `applyDrop` has two branches:
- `target.type === 'swap'` → removes dragged widget, inserts it BEFORE the target widget in the target's row
- `target.type === 'new-row'` → removes dragged widget, inserts it as a new full-width row at `target.insertAt`

New types to support:
- `'before'` → same as current `'swap'` (insert before target in target's row)
- `'after'` → same but insert AFTER target
- `'above'` → insert as new row at `target.rowIdx` (above target's row)
- `'below'` → insert as new row at `target.rowIdx + 1` (below target's row)
- `'swap'` still works as before (center zone = insert-before, kept for backward compat)
- `'new-row'` still works as before (bottom drop zone)

- [ ] **Step 1: Replace the applyDrop body**

Find the current `applyDrop` function body. It starts with `const applyDrop = (id, target) => {` and ends with `};` before `const handlePointerUp`. Replace the entire function with:

```javascript
  const applyDrop = (id, target) => {
    if (!target) return;
    onLayoutChange(prev => {
      let rows = prev.rows.map(r => [...r]);

      const redistributeRow = (row) => {
        if (!row || row.length === 0) return row;
        const count = row.length;
        const base = Math.floor(12 / count);
        const rem = 12 - base * count;
        return row.map((w, i) => ({ ...w, span: base + (i < rem ? 1 : 0) }));
      };

      if (target.type === 'before' || target.type === 'after' || target.type === 'swap') {
        // Remove dragged widget from its source row
        let dragEntry = null;
        const srcRowIdxBefore = rows.findIndex(row => row.some(w => w.id === id));
        rows = rows.map(row => {
          const idx = row.findIndex(w => w.id === id);
          if (idx !== -1) { dragEntry = row[idx]; return row.filter((_, i) => i !== idx); }
          return row;
        });
        if (srcRowIdxBefore >= 0 && rows[srcRowIdxBefore]?.length > 0) {
          rows[srcRowIdxBefore] = redistributeRow(rows[srcRowIdxBefore]);
        }
        rows = rows.filter(row => row.length > 0);
        if (dragEntry) {
          // Find target widget in updated rows
          let targetRowIdx = -1, targetPosIdx = -1;
          rows.forEach((row, ri) => row.forEach((w, pi) => {
            if (w.id === target.targetId) { targetRowIdx = ri; targetPosIdx = pi; }
          }));
          if (targetRowIdx >= 0) {
            const insertIdx = target.type === 'after' ? targetPosIdx + 1 : targetPosIdx;
            rows[targetRowIdx].splice(insertIdx, 0, dragEntry);
            rows[targetRowIdx] = redistributeRow(rows[targetRowIdx]);
          }
        }

      } else if (target.type === 'above' || target.type === 'below' || target.type === 'new-row') {
        // Remove dragged widget from its source row, insert as new full-width row
        let dragEntry = null;
        const srcRowIdx = rows.findIndex(row => row.some(w => w.id === id));
        const srcWillBeEmpty = srcRowIdx >= 0 && rows[srcRowIdx].length === 1;
        rows = rows.map(row => {
          const idx = row.findIndex(w => w.id === id);
          if (idx !== -1) { dragEntry = row[idx]; return row.filter((_, i) => i !== idx); }
          return row;
        });
        if (!srcWillBeEmpty && srcRowIdx >= 0 && rows[srcRowIdx]?.length > 0) {
          rows[srcRowIdx] = redistributeRow(rows[srcRowIdx]);
        }
        rows = rows.filter(row => row.length > 0);
        let insertAt = target.type === 'new-row' ? target.insertAt
                     : target.type === 'above'   ? target.rowIdx
                     :                              target.rowIdx + 1;  // 'below'
        if (srcWillBeEmpty && srcRowIdx < insertAt) insertAt = Math.max(0, insertAt - 1);
        if (dragEntry) rows.splice(insertAt, 0, [{ ...dragEntry, span: 12 }]);
      }

      return { ...prev, rows };
    });
  };
```

- [ ] **Step 2: Verify**

Read the modified `applyDrop`. Confirm:
- `'before' || 'after' || 'swap'` are handled in the first branch
- `'above' || 'below' || 'new-row'` are handled in the second branch
- `redistributeRow` helper is still inline at the top
- `handlePointerUp` immediately follows the function

- [ ] **Step 3: Commit**

```bash
git add app/assets/components/screen-report.jsx
git commit -m "feat: applyDrop handles before/after/above/below zone types"
```

---

### Task 4: Add widget ref, update zone variables, render zone overlays

**Files:**
- Modify: `app/assets/components/screen-report.jsx:2282-2430` (widget div rendering)

**Context:** Inside the `{visible.map((entry, colIdx) => { ... })}` loop, each widget has:
- Zone variables (`isDragging`, `isSwap`, `isBefore`, `isAfter`, `isReplace`) at the top of the map callback
- A `<div key={id} ...>` with `onPointerDown` and `onPointerEnter`
- Inside: drag indicator pill, floating toolbar, swap highlight (`{isSwap && ...}`), browse zone overlays (`{browseDragActive && ...}`)

- [ ] **Step 1: Update zone variable declarations**

Find these lines (around line 2282–2289):
```javascript
                const isDragging = dragId === id;
                const isSwap     = !browseDragActive && dropTarget?.type === 'swap' && dropTarget.targetId === id;
                const isBefore   = browseDragActive && browseDropTarget?.type === 'before' && browseDropTarget.id === id;
                const isAfter    = browseDragActive && browseDropTarget?.type === 'after'  && browseDropTarget.id === id;
                const isReplace  = browseDragActive && browseDropTarget?.type === 'replace' && browseDropTarget.id === id;
```

Replace with:
```javascript
                const isDragging       = dragId === id;
                // Pointer drag zones (existing widget reorder)
                const isPointerBefore  = !browseDragActive && dropTarget?.type === 'before' && dropTarget.targetId === id;
                const isPointerAfter   = !browseDragActive && dropTarget?.type === 'after'  && dropTarget.targetId === id;
                const isPointerAbove   = !browseDragActive && dropTarget?.type === 'above'  && dropTarget.targetId === id;
                const isPointerBelow   = !browseDragActive && dropTarget?.type === 'below'  && dropTarget.targetId === id;
                const isSwap           = !browseDragActive && dropTarget?.type === 'swap'   && dropTarget.targetId === id;
                // Browse drag zones (new widgets from sidebar)
                const isBefore   = browseDragActive && browseDropTarget?.type === 'before' && browseDropTarget.id === id;
                const isAfter    = browseDragActive && browseDropTarget?.type === 'after'  && browseDropTarget.id === id;
                const isReplace  = browseDragActive && browseDropTarget?.type === 'replace' && browseDropTarget.id === id;
```

- [ ] **Step 2: Add ref to widget div**

Find the opening `<div key={id}` (around line 2292). It currently starts:
```javascript
                  <div key={id}
                    style={{
```

Add a `ref` prop after `key={id}`:
```javascript
                  <div key={id}
                    ref={el => el ? (widgetEls.current[id] = { el, rowIdx }) : delete widgetEls.current[id]}
                    style={{
```

- [ ] **Step 3: Add pointer drag zone overlays**

Find the existing swap highlight block (around line 2379–2382):
```javascript
                    {/* Pointer swap highlight */}
                    {isSwap && (
                      <div style={{ position: 'absolute', inset: 0, borderRadius: 12, border: '2px dashed #00C2B8', background: 'rgba(0,194,184,.08)', zIndex: 5, pointerEvents: 'none' }}/>
                    )}
```

Replace it with the full pointer drag zone overlay block:
```javascript
                    {/* Pointer drag zone overlays */}
                    {dragId && !isDragging && (
                      <>
                        {/* Left zone: insert before in row */}
                        <div style={{
                          position: 'absolute', top: 0, left: 0, bottom: 0, width: '25%',
                          zIndex: 10, pointerEvents: 'none', borderRadius: '10px 0 0 10px',
                          background: isPointerBefore ? 'rgba(0,194,184,.14)' : 'transparent',
                          borderLeft: `3px solid ${isPointerBefore ? teal : 'transparent'}`,
                          transition: 'background .08s, border-color .08s',
                        }}/>
                        {/* Right zone: insert after in row */}
                        <div style={{
                          position: 'absolute', top: 0, right: 0, bottom: 0, width: '25%',
                          zIndex: 10, pointerEvents: 'none', borderRadius: '0 10px 10px 0',
                          background: isPointerAfter ? 'rgba(0,194,184,.14)' : 'transparent',
                          borderRight: `3px solid ${isPointerAfter ? teal : 'transparent'}`,
                          transition: 'background .08s, border-color .08s',
                        }}/>
                        {/* Top zone: new row above */}
                        <div style={{
                          position: 'absolute', top: 0, left: '25%', right: '25%', height: '25%',
                          zIndex: 10, pointerEvents: 'none',
                          background: isPointerAbove ? 'rgba(0,194,184,.14)' : 'transparent',
                          borderTop: `3px solid ${isPointerAbove ? teal : 'transparent'}`,
                          transition: 'background .08s, border-color .08s',
                        }}/>
                        {/* Bottom zone: new row below */}
                        <div style={{
                          position: 'absolute', bottom: 0, left: '25%', right: '25%', height: '25%',
                          zIndex: 10, pointerEvents: 'none',
                          background: isPointerBelow ? 'rgba(0,194,184,.14)' : 'transparent',
                          borderBottom: `3px solid ${isPointerBelow ? teal : 'transparent'}`,
                          transition: 'background .08s, border-color .08s',
                        }}/>
                        {/* Center zone: swap positions */}
                        {isSwap && (
                          <div style={{ position: 'absolute', inset: 0, borderRadius: 12, border: '2px dashed #00C2B8', background: 'rgba(0,194,184,.08)', zIndex: 5, pointerEvents: 'none' }}/>
                        )}
                      </>
                    )}
```

- [ ] **Step 4: Verify**

Read the widget div rendering block. Confirm:
- `ref` callback is on the widget div
- Zone variable declarations include `isPointerBefore/After/Above/Below` and `isSwap`
- The new zone overlay block replaces the old `{isSwap && ...}` block
- Browse drag overlays (`{browseDragActive && ...}`) are still present and unchanged
- `widgetMap[id]` is still the last child of the widget div

- [ ] **Step 5: Manual test in browser**

Open the app at `127.0.0.1:5500`. Enter edit mode on a report with at least 2 widgets.

**Test: Grid gone** — Start dragging a widget. Confirm the teal 12-column grid overlay no longer appears on the canvas background.

**Test: Zone overlays** — While dragging, hover over a sibling widget:
- Cursor in left 25%: teal left border strip on that widget
- Cursor in right 25%: teal right border strip
- Cursor in top 25% (center-left-right): teal top border strip
- Cursor in bottom 25% (center-left-right): teal bottom border strip
- Cursor in center: dashed teal full-border outline

**Test: Drop actions** — Drop on each zone:
- Left zone: dragged widget inserts to the LEFT of target in the same row
- Right zone: dragged widget inserts to the RIGHT of target in the same row
- Top zone: dragged widget becomes its own row ABOVE target's row
- Bottom zone: dragged widget becomes its own row BELOW target's row
- Center zone: dragged widget inserts at target's position (target shifts right)

**Test: Browse drag still works** — Drag a new widget from the sidebar. Left/right/center/between-row zones should still work as before.

- [ ] **Step 6: Commit**

```bash
git add app/assets/components/screen-report.jsx
git commit -m "feat: add 5-zone overlays to existing widget pointer drag"
```
