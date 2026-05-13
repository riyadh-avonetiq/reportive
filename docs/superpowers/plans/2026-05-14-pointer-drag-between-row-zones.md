# Pointer Drag Between-Row Zones Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the top/bottom card border strip highlights during existing-widget pointer drag with expanding between-row `PointerRowZone` slots — identical in look and feel to the `RowDropZone` used during browse drag.

**Architecture:** Three tasks, each leaving the code in a working state. Task 1 adds `PointerRowZone` component + `pointerRowZoneRefs` map + updates `handlePointerMove`. Task 2 renders `PointerRowZone` between rows and at the bottom. Task 3 removes the now-superseded `above`/`below` card overlay system. All changes in one file: `app/assets/components/screen-report.jsx`.

**Tech Stack:** Vanilla React (no build step). No automated tests — manual browser verification only. `teal = '#00C2B8'` is a module-level constant.

---

## File Map

- **Modify:** `app/assets/components/screen-report.jsx`
  - Add: `PointerRowZone` component after `RowDropZone` (after line 1912)
  - Modify: ref declarations (~line 1945) — replace `bottomZoneRef` with `pointerRowZoneRefs`
  - Modify: `handlePointerMove` else branch (~lines 2065–2073)
  - Modify: `rows.map` between-row block (~lines 2303–2311) — add pointer zone
  - Modify: bottom zone block (~lines 2509–2535) — replace hand-rolled div with `PointerRowZone`
  - Modify: zone variable declarations (~lines 2318–2324) — remove `isPointerAbove`/`isPointerBelow`
  - Modify: `handlePointerMove` zone detection (~lines 2058–2063) — remove `above`/`below`
  - Modify: widget card overlay block (~lines 2418–2458) — remove top/bottom overlay divs
  - Modify: `applyDrop` (~lines 2119–2135) — simplify condition and `insertAt`

---

### Task 1: Add `PointerRowZone` component and `pointerRowZoneRefs` ref map

**Files:**
- Modify: `app/assets/components/screen-report.jsx:1912` (add component after `RowDropZone`)
- Modify: `app/assets/components/screen-report.jsx:1945` (replace `bottomZoneRef`)
- Modify: `app/assets/components/screen-report.jsx:2065-2073` (update `handlePointerMove` else branch)

- [ ] **Step 1: Add `PointerRowZone` component after `RowDropZone`**

Find line 1912 (the closing `}` of `RowDropZone`). After it, insert:

```javascript
// Module-level — same reason as RowDropZone: prevents remount/flicker across re-renders
function PointerRowZone({ insertAt, active, onPointerEnter, onPointerLeave, innerRef }) {
  return (
    <div
      ref={innerRef}
      style={{
        height: active ? 56 : 20, borderRadius: 6, marginBottom: 4,
        transition: 'height .15s ease, background .15s, border-color .15s',
        border: `1.5px dashed ${active ? teal : 'rgba(0,194,184,.25)'}`,
        background: active ? 'rgba(0,194,184,.08)' : 'rgba(0,194,184,.02)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      {active
        ? <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: teal }}>+ new row</span>
        : <div style={{ width: 40, height: 2, borderRadius: 1, background: 'rgba(0,194,184,.25)' }}/>
      }
    </div>
  );
}
```

- [ ] **Step 2: Replace `bottomZoneRef` with `pointerRowZoneRefs`**

Find line 1945:
```javascript
  const bottomZoneRef = React.useRef(null);  // ref to bottom drop zone, for flicker-free detection
```

Replace it with:
```javascript
  const pointerRowZoneRefs = React.useRef({});  // insertAt -> DOM element, for flicker-free detection
```

- [ ] **Step 3: Update `handlePointerMove` else branch**

Find the current else branch (approximately lines 2065–2073):
```javascript
      } else {
        // Don't clear a new-row dropTarget while cursor is still within the bottom zone
        const bz = bottomZoneRef.current;
        if (bz) {
          const r = bz.getBoundingClientRect();
          if (e.clientX >= r.left && e.clientX <= r.right &&
              e.clientY >= r.top  && e.clientY <= r.bottom) return;
        }
        setDropTarget(null);
      }
```

Replace it with:
```javascript
      } else {
        // Don't clear drop target while cursor is still within a between-row zone
        for (const el of Object.values(pointerRowZoneRefs.current)) {
          const r = el.getBoundingClientRect();
          if (e.clientX >= r.left && e.clientX <= r.right &&
              e.clientY >= r.top  && e.clientY <= r.bottom) return;
        }
        setDropTarget(null);
      }
```

- [ ] **Step 4: Verify**

Read the three modified areas. Confirm:
- `PointerRowZone` function is defined at module level, after `RowDropZone` closing `}`
- `pointerRowZoneRefs = React.useRef({})` is present; `bottomZoneRef` is gone
- `handlePointerMove` else branch loops over `pointerRowZoneRefs.current` values
- No other changes were made

- [ ] **Step 5: Commit**

```bash
git add app/assets/components/screen-report.jsx
git commit -m "feat: add PointerRowZone component; replace bottomZoneRef with pointerRowZoneRefs map"
```

---

### Task 2: Render `PointerRowZone` between rows and at the bottom

**Files:**
- Modify: `app/assets/components/screen-report.jsx:2303-2311` (between-row block in `rows.map`)
- Modify: `app/assets/components/screen-report.jsx:2509-2535` (bottom zone block)

**Context:** Inside `rows.map((row, rowIdx) => ...)`, the current between-row block (lines 2303–2311) renders a `RowDropZone` only during `browseDragActive`. We add a parallel `PointerRowZone` for `dragId`. At the bottom of the canvas (lines 2509–2535), the existing hand-rolled `dragId &&` div is replaced by a `PointerRowZone`.

- [ ] **Step 1: Add `PointerRowZone` in the between-row block**

Find this block (approximately lines 2303–2311):
```javascript
          <React.Fragment key={rowIdx}>
            {/* Between-row zone: only during Browse drag */}
            {browseDragActive && <RowDropZone
              insertAt={rowIdx}
              active={browseDropTarget?.type === 'row' && browseDropTarget.insertAt === rowIdx}
              onDragOver={e => { e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = 'copy'; }}
              onDragEnter={i => setBrowseDropTarget({ type: 'row', insertAt: i })}
              onDrop={(i, e) => handleNewRowDrop(i, e)}
            />}
```

Replace it with:
```javascript
          <React.Fragment key={rowIdx}>
            {/* Between-row zone: Browse drag */}
            {browseDragActive && <RowDropZone
              insertAt={rowIdx}
              active={browseDropTarget?.type === 'row' && browseDropTarget.insertAt === rowIdx}
              onDragOver={e => { e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = 'copy'; }}
              onDragEnter={i => setBrowseDropTarget({ type: 'row', insertAt: i })}
              onDrop={(i, e) => handleNewRowDrop(i, e)}
            />}
            {/* Between-row zone: pointer drag (existing widget reorder) */}
            {dragId && <PointerRowZone
              insertAt={rowIdx}
              active={!browseDragActive && dropTarget?.type === 'new-row' && dropTarget.insertAt === rowIdx}
              onPointerEnter={() => setDropTarget({ type: 'new-row', insertAt: rowIdx })}
              onPointerLeave={() => setDropTarget(null)}
              innerRef={el => el ? (pointerRowZoneRefs.current[rowIdx] = el) : delete pointerRowZoneRefs.current[rowIdx]}
            />}
```

- [ ] **Step 2: Replace the bottom zone hand-rolled div with `PointerRowZone`**

Find this entire block (approximately lines 2509–2535):
```javascript
      {/* Bottom zone */}
      {browseDragActive
        ? <RowDropZone
            insertAt={layouts.rows.length}
            active={browseDropTarget?.type === 'row' && browseDropTarget.insertAt === layouts.rows.length}
            onDragOver={e => { e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = 'copy'; }}
            onDragEnter={i => setBrowseDropTarget({ type: 'row', insertAt: i })}
            onDrop={(i, e) => handleNewRowDrop(i, e)}
          />
        : dragId && (
          <div
            ref={bottomZoneRef}
            onPointerEnter={() => setDropTarget({ type: 'new-row', insertAt: layouts.rows.length })}
            onPointerLeave={() => setDropTarget(null)}
            style={{
              height: 40, borderRadius: 6,
              border: `1px dashed ${dropTarget?.type === 'new-row' && dropTarget.insertAt === layouts.rows.length ? teal : 'rgba(255,255,255,.1)'}`,
              background: dropTarget?.type === 'new-row' && dropTarget.insertAt === layouts.rows.length ? 'rgba(0,194,184,.1)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: dropTarget?.type === 'new-row' && dropTarget.insertAt === layouts.rows.length ? teal : 'rgba(255,255,255,.2)' }}>
              + Drop here → new row at bottom
            </span>
          </div>
        )
      }
```

Replace it with:
```javascript
      {/* Bottom zone */}
      {browseDragActive
        ? <RowDropZone
            insertAt={layouts.rows.length}
            active={browseDropTarget?.type === 'row' && browseDropTarget.insertAt === layouts.rows.length}
            onDragOver={e => { e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = 'copy'; }}
            onDragEnter={i => setBrowseDropTarget({ type: 'row', insertAt: i })}
            onDrop={(i, e) => handleNewRowDrop(i, e)}
          />
        : dragId && (
          <PointerRowZone
            insertAt={layouts.rows.length}
            active={dropTarget?.type === 'new-row' && dropTarget.insertAt === layouts.rows.length}
            onPointerEnter={() => setDropTarget({ type: 'new-row', insertAt: layouts.rows.length })}
            onPointerLeave={() => setDropTarget(null)}
            innerRef={el => el ? (pointerRowZoneRefs.current[layouts.rows.length] = el) : delete pointerRowZoneRefs.current[layouts.rows.length]}
          />
        )
      }
```

- [ ] **Step 3: Verify**

Read the two modified areas. Confirm:
- `PointerRowZone` appears inside the `React.Fragment`, after the `RowDropZone` block, gated on `dragId`
- The bottom zone's `dragId &&` branch now renders `<PointerRowZone>` — the hand-rolled `<div>` is gone
- `ref={bottomZoneRef}` does not appear anywhere in the file (search for it)
- `RowDropZone` blocks are unchanged

- [ ] **Step 4: Manual test in browser — zones appear**

Open `127.0.0.1:5500`. Enter edit mode on a report with at least 2 rows of widgets. Start dragging an existing widget. Verify:
- A thin dashed teal line appears before each row and at the bottom
- Moving the ghost over a between-row slot causes it to expand to ~56px with a `+ new row` label
- Dropping on a slot inserts the dragged widget as a new full-width row at that position
- The top/bottom border strips on cards still appear (they will be removed in Task 3 — this is expected for now)

- [ ] **Step 5: Commit**

```bash
git add app/assets/components/screen-report.jsx
git commit -m "feat: render PointerRowZone between rows and at bottom during pointer drag"
```

---

### Task 3: Remove `above`/`below` card overlay system and simplify `applyDrop`

**Files:**
- Modify: `app/assets/components/screen-report.jsx:2058-2063` (`handlePointerMove` zone detection)
- Modify: `app/assets/components/screen-report.jsx:2119-2135` (`applyDrop` second branch)
- Modify: `app/assets/components/screen-report.jsx:2318-2324` (zone variable declarations)
- Modify: `app/assets/components/screen-report.jsx:2437-2452` (top/bottom overlay divs)

**Context:** With `PointerRowZone` now handling all above/below drops, the old `above`/`below` zone type system is obsolete. This task removes all traces of it.

- [ ] **Step 1: Remove `above`/`below` from `handlePointerMove` zone detection**

Find these lines inside `handlePointerMove` (approximately lines 2058–2063):
```javascript
        if      (relX < 0.25) type = 'before';
        else if (relX > 0.75) type = 'after';
        else if (relY < 0.25) type = 'above';
        else if (relY > 0.75) type = 'below';
        else                  type = 'swap';
```

Replace with:
```javascript
        if      (relX < 0.25) type = 'before';
        else if (relX > 0.75) type = 'after';
        else                  type = 'swap';
```

- [ ] **Step 2: Simplify `applyDrop` second branch**

Find this condition and `insertAt` line in `applyDrop` (approximately lines 2119–2135):
```javascript
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
```

Replace the condition line and the `insertAt` line only (the rest stays):
```javascript
      } else if (target.type === 'new-row') {
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
        let insertAt = target.insertAt;
        if (srcWillBeEmpty && srcRowIdx < insertAt) insertAt = Math.max(0, insertAt - 1);
        if (dragEntry) rows.splice(insertAt, 0, [{ ...dragEntry, span: 12 }]);
      }
```

- [ ] **Step 3: Remove `isPointerAbove` and `isPointerBelow` variable declarations**

Find these two lines (approximately lines 2322–2323):
```javascript
                const isPointerAbove   = !browseDragActive && dropTarget?.type === 'above'  && dropTarget.targetId === id;
                const isPointerBelow   = !browseDragActive && dropTarget?.type === 'below'  && dropTarget.targetId === id;
```

Delete both lines entirely.

- [ ] **Step 4: Remove top and bottom overlay divs from widget card**

Find the top zone overlay block (approximately lines 2437–2444):
```javascript
                        {/* Top zone: new row above */}
                        <div style={{
                          position: 'absolute', top: 0, left: '25%', right: '25%', height: '25%',
                          zIndex: 10, pointerEvents: 'none',
                          background: isPointerAbove ? 'rgba(0,194,184,.14)' : 'transparent',
                          borderTop: `3px solid ${isPointerAbove ? teal : 'transparent'}`,
                          transition: 'background .08s, border-color .08s',
                        }}/>
```

Delete it entirely.

Find the bottom zone overlay block (approximately lines 2445–2452):
```javascript
                        {/* Bottom zone: new row below */}
                        <div style={{
                          position: 'absolute', bottom: 0, left: '25%', right: '25%', height: '25%',
                          zIndex: 10, pointerEvents: 'none',
                          background: isPointerBelow ? 'rgba(0,194,184,.14)' : 'transparent',
                          borderBottom: `3px solid ${isPointerBelow ? teal : 'transparent'}`,
                          transition: 'background .08s, border-color .08s',
                        }}/>
```

Delete it entirely.

- [ ] **Step 5: Verify**

Read the modified areas. Confirm:
- `handlePointerMove` zone detection has only `before`/`after`/`swap` (no `above` or `below`)
- `applyDrop` second branch condition is `target.type === 'new-row'` only; `insertAt = target.insertAt`
- `isPointerAbove` and `isPointerBelow` do not appear anywhere in the file (search for them)
- The top zone and bottom zone overlay `<div>`s are gone from the widget card block
- Left, right, and center overlays and the `{dragId && !isDragging && (...)}` wrapper are still present

- [ ] **Step 6: Manual test in browser — full system**

Open `127.0.0.1:5500`. Enter edit mode on a report with at least 2 rows.

**Test: No top/bottom border strips** — Drag a widget. Hover over the top or bottom area of a sibling card. Confirm no teal border strip appears on the card.

**Test: Between-row slots expand** — While dragging, move into the gap between rows. Confirm the slot expands and shows `+ new row`. Move away — slot collapses.

**Test: Drop above a row** — Drag card A. Hover the slot just above card B's row until it expands. Release. Card A should now be its own full-width row directly above B's row.

**Test: Drop below a row** — Drag card A. Hover the slot just below card B's row. Release. Card A should be its own row directly below B's row.

**Test: Left/right still work** — Drag card A over the left 25% of card B. Teal left border strip appears on B. Release — A inserts before B in the same row.

**Test: Center swap still works** — Drag card A over the center of card B. Dashed teal outline appears on B. Release — A inserts at B's position.

**Test: Browse drag unchanged** — Drag a new widget from the sidebar. Left/right/center/between-row zones all work as before.

- [ ] **Step 7: Commit**

```bash
git add app/assets/components/screen-report.jsx
git commit -m "feat: remove above/below card overlays; pointer drag uses expanding between-row zones"
```
