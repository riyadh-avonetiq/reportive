# Widget Copy-Paste & Marquee Block-Select Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Ctrl+C/V widget duplication and left-mouse-drag marquee block-select to the dashboard report canvas.

**Architecture:** Three sequential tasks, all in `screen-report.jsx`. Task 1 migrates the single-selection model to an array (foundation). Task 2 adds clipboard state and Ctrl+C/V handlers. Task 3 adds the marquee drag overlay inside `DragCanvas`. No new files needed.

**Tech Stack:** Vanilla React (no build step), JSX via Babel browser transform. All state is in-memory React state — nothing persists to localStorage.

---

### Task 1: Migrate selectedWidget → selectedWidgets (array)

**Files:**
- Modify: `app/assets/components/screen-report.jsx`

This is a pure refactor — no visible behaviour change. It replaces the `selectedWidget: string|null` state with `selectedWidgets: string[]` so the rest of the plan has multi-selection to work with.

- [ ] **Step 1: Change the state declaration**

Find line ~4091:
```javascript
const [selectedWidget, setSelectedWidget] = useState(null);
```
Replace with:
```javascript
const [selectedWidgets, setSelectedWidgets] = useState([]);
```

- [ ] **Step 2: Replace handleSelectWidget**

Find (line ~4178):
```javascript
const handleSelectWidget = useCallback((id, cardId) => {
  setSelectedWidget(id);
  setEditorCardId(cardId);
}, []);
```
Replace with:
```javascript
const handleSelectWidget = useCallback((id, cardId) => {
  setSelectedWidgets([id]);
  setEditorCardId(cardId);
}, []);
```

- [ ] **Step 3: Replace handleDeleteWidget with handleDeleteWidgets (multi) + handleDeleteWidget (single wrapper)**

Find (line ~4183):
```javascript
const handleDeleteWidget = useCallback((id) => {
  updateWidgetLayouts(prev => {
    const rows = prev.rows
      .map(row => {
        const filtered = row.filter(w => w.id !== id);
        if (filtered.length === row.length) return row;
        if (filtered.length === 0) return filtered;
        const count = filtered.length;
        const base = Math.floor(12 / count);
        const rem = 12 - base * count;
        return filtered.map((w, i) => ({ ...w, span: base + (i < rem ? 1 : 0) }));
      })
      .filter(row => row.length > 0);
    return { ...prev, rows };
  });
  setSelectedWidget(prev => prev === id ? null : prev);
}, [updateWidgetLayouts]);
```
Replace with:
```javascript
const handleDeleteWidgets = useCallback((ids) => {
  updateWidgetLayouts(prev => {
    const rows = prev.rows
      .map(row => {
        const filtered = row.filter(w => !ids.includes(w.id));
        if (filtered.length === row.length) return row;
        if (filtered.length === 0) return [];
        const count = filtered.length;
        const base = Math.floor(12 / count);
        const rem = 12 - base * count;
        return filtered.map((w, i) => ({ ...w, span: base + (i < rem ? 1 : 0) }));
      })
      .filter(row => row.length > 0);
    return { ...prev, rows };
  });
  setSelectedWidgets([]);
}, [updateWidgetLayouts]);

const handleDeleteWidget = useCallback((id) => {
  handleDeleteWidgets([id]);
}, [handleDeleteWidgets]);
```

- [ ] **Step 4: Update the Delete key useEffect**

Find (line ~4202):
```javascript
useEffect(() => {
  const handler = (e) => {
    if (!selectedWidget || !showEditor || _IS_VIEWER) return;
    if (e.key !== 'Delete' && e.key !== 'Backspace') return;
    const tag = e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) return;
    e.preventDefault();
    handleDeleteWidget(selectedWidget);
  };
  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}, [selectedWidget, showEditor, handleDeleteWidget]);
```
Replace with:
```javascript
useEffect(() => {
  const handler = (e) => {
    if (!selectedWidgets.length || !showEditor || _IS_VIEWER) return;
    if (e.key !== 'Delete' && e.key !== 'Backspace') return;
    const tag = e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) return;
    e.preventDefault();
    handleDeleteWidgets(selectedWidgets);
  };
  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}, [selectedWidgets, showEditor, handleDeleteWidgets]);
```

- [ ] **Step 5: Update editState object**

Find (line ~4233):
```javascript
const editState = showEditor && !_IS_VIEWER ? {
  selected: selectedWidget,
  onSelect: handleSelectWidget,
  onDelete: handleDeleteWidget,
  onDeselect: () => setSelectedWidget(null),
} : null;
```
Replace with:
```javascript
const editState = showEditor && !_IS_VIEWER ? {
  selected: selectedWidgets,
  onSelect: handleSelectWidget,
  onDelete: handleDeleteWidget,
  onDeselect: () => setSelectedWidgets([]),
  onMultiSelect: (ids) => setSelectedWidgets(ids),
} : null;
```

- [ ] **Step 6: Update downstream consumers of selectedWidget**

Find (line ~4242):
```javascript
const sharedWidgetCount = (selectedWidget && editorCardId && _layouts)
  ? _layouts.rows.flat().filter(w => w.type === editorCardId || WIDGET_CARD_TYPES[w.id] === editorCardId).length
  : 0;
const _selectedInstance = selectedWidget && _layouts
  ? _layouts.rows.flat().find(w => w.id === selectedWidget)
  : null;
```
Replace with:
```javascript
const _primarySelected = selectedWidgets[0] || null;
const sharedWidgetCount = (_primarySelected && editorCardId && _layouts)
  ? _layouts.rows.flat().filter(w => w.type === editorCardId || WIDGET_CARD_TYPES[w.id] === editorCardId).length
  : 0;
const _selectedInstance = _primarySelected && _layouts
  ? _layouts.rows.flat().find(w => w.id === _primarySelected)
  : null;
```

Find (line ~4451):
```javascript
widgetId={selectedWidget}
widgetConfig={selectedWidget ? (widgetConfigs[selectedWidget] || {}) : {}}
```
Replace with:
```javascript
widgetId={_primarySelected}
widgetConfig={_primarySelected ? (widgetConfigs[_primarySelected] || {}) : {}}
```

- [ ] **Step 7: Update SelectableWidget to use array**

Find `SelectableWidget` function (line ~648):
```javascript
const isSelected = editState.selected === id;
```
Replace with:
```javascript
const isSelected = editState.selected.includes(id);
```

- [ ] **Step 8: Update the floating toolbar visibility condition in DragCanvas**

Find (line ~2518):
```javascript
{editState && editState.selected === id && !dragId && !browseDragActive && (
```
Replace with:
```javascript
{editState && editState.selected.length === 1 && editState.selected[0] === id && !dragId && !browseDragActive && (
```

- [ ] **Step 9: Verify in browser**

Open Edit Mode. Click a widget — it should still show the teal outline and EDITING badge, and the floating toolbar should appear. Click another widget — first deselects, second selects. Press Delete — widget is removed. Nothing visually changed from the user's perspective.

- [ ] **Step 10: Commit**

```bash
git add app/assets/components/screen-report.jsx
git commit -m "refactor: migrate selectedWidget→selectedWidgets array for multi-select foundation"
```

---

### Task 2: Clipboard state + Ctrl+C copy + Ctrl+V paste

**Files:**
- Modify: `app/assets/components/screen-report.jsx`

Adds in-memory clipboard (lost on refresh, by design). Ctrl+C copies all selected widgets and their configs grouped by original row. Ctrl+V inserts new rows below the last selected widget's row.

- [ ] **Step 1: Add clipboardWidgets state**

After the `selectedWidgets` state declaration, add:
```javascript
const [clipboardWidgets, setClipboardWidgets] = useState(null);
```
`clipboardWidgets` shape: `{ rows: Array<Array<widget>>, configs: { [originalId]: config } }` — where `rows` preserves the original row grouping of the copied widgets.

- [ ] **Step 2: Add handleCopy**

Add after `handleDeleteWidget`:
```javascript
const handleCopy = useCallback(() => {
  if (!selectedWidgets.length) return;
  const layouts = widgetLayouts || getSmartDefaultLayout(client?.connected);
  const rowGroups = [];
  layouts.rows.forEach(row => {
    const inRow = row.filter(w => selectedWidgets.includes(w.id));
    if (inRow.length) rowGroups.push(inRow);
  });
  const configs = {};
  selectedWidgets.forEach(id => { configs[id] = widgetConfigs[id] || {}; });
  setClipboardWidgets({ rows: rowGroups, configs });
}, [selectedWidgets, widgetLayouts, widgetConfigs]);
```

- [ ] **Step 3: Add handlePaste**

Add after `handleCopy`:
```javascript
const handlePaste = useCallback(() => {
  if (!clipboardWidgets) return;
  const layouts = widgetLayouts || getSmartDefaultLayout(client?.connected);
  // Find row index of the last selected widget; fall back to last row
  let insertAfterRowIdx = layouts.rows.length - 1;
  if (selectedWidgets.length) {
    const lastId = selectedWidgets[selectedWidgets.length - 1];
    const ri = layouts.rows.findIndex(row => row.some(w => w.id === lastId));
    if (ri >= 0) insertAfterRowIdx = ri;
  }
  // Generate new IDs upfront so layout + configs share the same mapping
  const idMap = {}; // oldId → newId
  const newRowGroups = clipboardWidgets.rows.map(row =>
    row.map(w => {
      const newId = 'w_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
      idMap[w.id] = newId;
      return { ...w, id: newId };
    })
  );
  updateWidgetLayouts(prev => {
    const rows = [...prev.rows];
    newRowGroups.forEach((row, i) => rows.splice(insertAfterRowIdx + 1 + i, 0, row));
    return { ...prev, rows };
  });
  setWidgetConfigs(prev => {
    const next = { ...prev };
    Object.entries(idMap).forEach(([oldId, newId]) => {
      if (clipboardWidgets.configs[oldId]) next[newId] = { ...clipboardWidgets.configs[oldId] };
    });
    return next;
  });
  setSelectedWidgets(Object.values(idMap));
}, [clipboardWidgets, selectedWidgets, widgetLayouts, updateWidgetLayouts]);
```

- [ ] **Step 4: Add Ctrl+C / Ctrl+V keyboard effect**

Add a new `useEffect` alongside the existing Ctrl+Z handler:
```javascript
useEffect(() => {
  const handler = (e) => {
    if (!showEditor || _IS_VIEWER) return;
    const tag = e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) return;
    if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
      e.preventDefault();
      handleCopy();
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
      e.preventDefault();
      handlePaste();
    }
  };
  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}, [showEditor, handleCopy, handlePaste]);
```

- [ ] **Step 5: Update hint strip text**

Find the hint strip text (line ~2431):
```javascript
Edit Mode · Klik widget untuk pilih · Drag untuk pindahkan · Gunakan toolbar di atas widget yang dipilih · Ctrl+Z untuk undo
```
Replace with:
```javascript
Edit Mode · Klik untuk pilih · Ctrl+C/V copy-paste · Drag area kosong untuk block-select · Delete hapus · Ctrl+Z undo
```

- [ ] **Step 6: Verify in browser**

In Edit Mode: click a widget → press Ctrl+C → press Ctrl+V. A new row should appear below the selected widget's row containing a clone of the widget with the same configuration. The new widget should be selected (teal outline). Pressing Ctrl+V again should paste another copy below the first paste. Check the browser console — no errors.

- [ ] **Step 7: Commit**

```bash
git add app/assets/components/screen-report.jsx
git commit -m "feat: add Ctrl+C/V widget copy-paste — clones widget + config as new row below selection"
```

---

### Task 3: Marquee block-select

**Files:**
- Modify: `app/assets/components/screen-report.jsx` — inside `DragCanvas` component

Adds a visual marquee rectangle that appears when the user drags from empty canvas space. Widgets whose bounding rects intersect the marquee are selected as the drag proceeds.

- [ ] **Step 1: Add marquee state and refs inside DragCanvas**

In `DragCanvas`, after the existing state declarations (line ~2092–2103), add:
```javascript
const [marquee, setMarquee] = React.useState(null); // { startX, startY, curX, curY } or null
const pendingMarquee = React.useRef(null);           // { startX, startY } before threshold
const marqueeRef     = React.useRef(null);           // mirrors marquee for doc-level cleanup
const justMarqueed   = React.useRef(false);          // suppresses onClick deselect after marquee
```

After line `dragIdRef.current = dragId;` (line ~2104), add:
```javascript
marqueeRef.current = marquee;
```

- [ ] **Step 2: Expand the document-level pointer cleanup to cover marquee**

Find the existing `cancelIfOutside` effect (line ~2137):
```javascript
const cancelIfOutside = e => {
  pendingDrag.current = null;
  if (!dragIdRef.current) return;
  if (containerRef.current && containerRef.current.contains(e.target)) return;
  setDragId(null);
  setDropTarget(null);
};
```
Replace with:
```javascript
const cancelIfOutside = e => {
  pendingDrag.current = null;
  pendingMarquee.current = null;
  if (marqueeRef.current) setMarquee(null);
  if (!dragIdRef.current) return;
  if (containerRef.current && containerRef.current.contains(e.target)) return;
  setDragId(null);
  setDropTarget(null);
};
```

- [ ] **Step 3: Add onPointerDown to the container div**

Find the container div (line ~2416):
```jsx
<div ref={containerRef} style={{ position: 'relative' }}
  onPointerMove={editState ? handlePointerMove : undefined}
  onPointerUp={editState ? handlePointerUp : undefined}
  onDragOver={e => { if (isBrowseDrag(e)) e.preventDefault(); }}
  onClick={e => { if (e.target === e.currentTarget && editState?.onDeselect) editState.onDeselect(); }}
>
```
Replace with:
```jsx
<div ref={containerRef} style={{ position: 'relative' }}
  onPointerDown={editState && !browseDragActive ? (e) => {
    // Widget onPointerDown calls stopPropagation, so this only fires on empty canvas space
    if (!e.isPrimary || dragId) return;
    e.preventDefault(); // prevent browser text-selection during drag
    pendingMarquee.current = { startX: e.clientX, startY: e.clientY };
  } : undefined}
  onPointerMove={editState ? handlePointerMove : undefined}
  onPointerUp={editState ? handlePointerUp : undefined}
  onDragOver={e => { if (isBrowseDrag(e)) e.preventDefault(); }}
  onClick={e => {
    if (justMarqueed.current) { justMarqueed.current = false; return; }
    if (e.target === e.currentTarget && editState?.onDeselect) editState.onDeselect();
  }}
>
```

- [ ] **Step 4: Extend handlePointerMove to drive marquee**

Find `handlePointerMove` (line ~2189). Add the following block **at the end** of the function body, after the existing drag logic:
```javascript
// Marquee: activate after threshold
if (pendingMarquee.current && !marquee && !dragId) {
  const dx = e.clientX - pendingMarquee.current.startX;
  const dy = e.clientY - pendingMarquee.current.startY;
  if (Math.sqrt(dx * dx + dy * dy) > 6) {
    setMarquee({
      startX: pendingMarquee.current.startX,
      startY: pendingMarquee.current.startY,
      curX: e.clientX,
      curY: e.clientY,
    });
  }
}
// Marquee: update rectangle and compute selection
if (marquee && !dragId) {
  const updated = { ...marquee, curX: e.clientX, curY: e.clientY };
  setMarquee(updated);
  const mLeft   = Math.min(updated.startX, updated.curX);
  const mRight  = Math.max(updated.startX, updated.curX);
  const mTop    = Math.min(updated.startY, updated.curY);
  const mBottom = Math.max(updated.startY, updated.curY);
  const hit = [];
  for (const [wid, meta] of Object.entries(widgetEls.current)) {
    const r = meta.el.getBoundingClientRect();
    if (r.right > mLeft && r.left < mRight && r.bottom > mTop && r.top < mBottom) {
      hit.push(wid);
    }
  }
  _es?.onMultiSelect(hit);
}
```

- [ ] **Step 5: Extend handlePointerUp to finalize marquee**

Find `handlePointerUp` (line ~2297):
```javascript
const handlePointerUp = () => {
  pendingDrag.current = null;
  if (!dragId) return;
  applyDrop(dragId, dropTarget);
  setDragId(null);
  setDropTarget(null);
};
```
Replace with:
```javascript
const handlePointerUp = () => {
  pendingDrag.current = null;
  pendingMarquee.current = null;
  if (marquee) {
    justMarqueed.current = true;
    setMarquee(null);
    return;
  }
  if (!dragId) return;
  applyDrop(dragId, dropTarget);
  setDragId(null);
  setDropTarget(null);
};
```

- [ ] **Step 6: Render the marquee overlay**

Find the closing `</div>` of the container (after the last row zone render, line ~2675 area). Just before the closing `</div>` of the container, add:
```jsx
{/* Marquee selection rectangle */}
{marquee && (
  <div style={{
    position: 'fixed',
    left:   Math.min(marquee.startX, marquee.curX),
    top:    Math.min(marquee.startY, marquee.curY),
    width:  Math.abs(marquee.curX - marquee.startX),
    height: Math.abs(marquee.curY - marquee.startY),
    background: 'rgba(0,194,184,.07)',
    border: '1.5px solid rgba(0,194,184,.45)',
    borderRadius: 4,
    pointerEvents: 'none',
    zIndex: 9999,
  }} />
)}
```

- [ ] **Step 7: Verify `_es.onMultiSelect` is wired through**

`_es` in DragCanvas is derived from `editState` (line ~2107). Confirm `_es` has `onMultiSelect` — it does, because Task 1 Step 5 added `onMultiSelect` to `editState`, and `_es` spreads `editState`. No changes needed here.

- [ ] **Step 8: Verify in browser**

In Edit Mode: click a widget to select it (teal outline shows). Now click and drag from the empty space between/outside widgets. A teal-tinted rectangle should appear and follow the mouse. Widgets that overlap the rectangle should show teal outlines. Release — selected widgets stay highlighted. Press Delete — all are removed. Press Ctrl+C then Ctrl+V — all selected widgets are cloned as new rows.

Also verify no regressions:
- Dragging a single widget to reorder still works
- Clicking empty space without dragging (small movement) still deselects
- Browse drag (from sidebar) still works

- [ ] **Step 9: Commit**

```bash
git add app/assets/components/screen-report.jsx
git commit -m "feat: add marquee block-select — drag empty canvas space to multi-select widgets"
```
