# Pointer Drag Between-Row Zones Design

## Goal

Replace the top/bottom card border strip highlights (used when dragging an existing widget to above/below another) with expanding between-row drop zones — identical in appearance and behavior to the `RowDropZone` slots used during browse drag (new widget from sidebar).

---

## Scope

One file: `app/assets/components/screen-report.jsx` — `DragCanvas` function and `PointerRowZone` component.

No changes to layout state format, `onLayoutChange`, or any other file.

---

## Section 1 — New `PointerRowZone` Component

Add a `PointerRowZone` function component near `RowDropZone` (line ~1892).

**Props:** `{ insertAt, active, onPointerEnter, onPointerLeave }`

**Visual:** Identical to `RowDropZone`:
- Inactive: `height: 20px`, dashed border `rgba(0,194,184,.25)`, background `rgba(0,194,184,.02)`, centered pill `width:40, height:2`
- Active: `height: 56px`, border `teal`, background `rgba(0,194,184,.08)`, label `+ new row` in teal mono font
- Transition: `height .15s ease, background .15s, border-color .15s`

**Events:** `onPointerEnter` and `onPointerLeave` (pointer events, not HTML5 drag events).

**Drop target emitted:** `{ type: 'new-row', insertAt }` — same shape as `RowDropZone` emits for browse drag, already handled by `applyDrop`.

---

## Section 2 — Ref Map for Zone Preservation

Replace the single `bottomZoneRef = React.useRef(null)` with:

```javascript
const pointerRowZoneRefs = React.useRef({});  // insertAt -> DOM element
```

Each `PointerRowZone` registers its DOM element in this map via a ref callback:
```javascript
ref={el => el ? (pointerRowZoneRefs.current[insertAt] = el) : delete pointerRowZoneRefs.current[insertAt]}
```

In `handlePointerMove`, the `else` branch (no widget under cursor) checks all entries in `pointerRowZoneRefs.current` before calling `setDropTarget(null)`:
```javascript
} else {
  for (const el of Object.values(pointerRowZoneRefs.current)) {
    const r = el.getBoundingClientRect();
    if (e.clientX >= r.left && e.clientX <= r.right &&
        e.clientY >= r.top  && e.clientY <= r.bottom) return;
  }
  setDropTarget(null);
}
```

---

## Section 3 — Rendering Between-Row Zones

Inside `rows.map((row, rowIdx) => ...)`, before each row, render a `PointerRowZone` during pointer drag (mirroring the existing `browseDragActive && <RowDropZone .../>` pattern):

```javascript
{dragId && <PointerRowZone
  insertAt={rowIdx}
  active={dropTarget?.type === 'new-row' && dropTarget.insertAt === rowIdx}
  onPointerEnter={() => setDropTarget({ type: 'new-row', insertAt: rowIdx })}
  onPointerLeave={() => setDropTarget(null)}
  ref callback → pointerRowZoneRefs.current[rowIdx]
/>}
{browseDragActive && <RowDropZone ... />}
```

At the bottom of the canvas (after all rows), the existing hand-rolled pointer bottom zone div is **replaced** by a final `PointerRowZone`:
```javascript
{dragId && <PointerRowZone
  insertAt={layouts.rows.length}
  active={dropTarget?.type === 'new-row' && dropTarget.insertAt === layouts.rows.length}
  onPointerEnter={() => setDropTarget({ type: 'new-row', insertAt: layouts.rows.length })}
  onPointerLeave={() => setDropTarget(null)}
  ref callback → pointerRowZoneRefs.current[layouts.rows.length]
/>}
```

---

## Section 4 — Removals

The following are deleted:

**From `handlePointerMove` zone detection:**
- `else if (relY < 0.25) type = 'above';`
- `else if (relY > 0.75) type = 'below';`
- The `bottomZoneRef` check in the `else` branch (replaced by the `pointerRowZoneRefs` loop)

**From widget card render loop:**
- `isPointerAbove` variable declaration
- `isPointerBelow` variable declaration
- Top overlay `<div>` (the one with `borderTop`, `height: '25%'`, `left: '25%'`, `right: '25%'`)
- Bottom overlay `<div>` (the one with `borderBottom`, `height: '25%'`, `left: '25%'`, `right: '25%'`)

**Ref declarations:**
- `const bottomZoneRef = React.useRef(null)` (replaced by `pointerRowZoneRefs`)

**Bottom zone hand-rolled div** (the current `dragId && !browseDragActive` div with `onPointerEnter`, `onPointerLeave`, `ref={bottomZoneRef}`):
- Deleted entirely; replaced by the last `PointerRowZone`

**From `applyDrop`:**
- The `above`/`below` branch condition becomes unreachable after this change (no code path sets those types). Simplify the condition to:
```javascript
} else if (target.type === 'new-row') {
```
The logic inside the branch is unchanged.

---

## Section 5 — What Does NOT Change

- `RowDropZone` component — untouched
- Browse drag zones (`browseDragActive` branches) — untouched
- Left/right/center (`before`/`after`/`swap`) zone detection in `handlePointerMove` — untouched
- Left, right, center overlay divs on widget cards — untouched
- `applyDrop` logic for `before`/`after`/`swap`/`new-row` — new-row branch condition simplified, logic unchanged
- Layout state format — unchanged

---

## Out of Scope

- Cross-row drag of widgets into specific positions within a target row (would require redesigning the between-row zone to accept columns)
- Animated row reordering or live preview during drag
