# Canvas Drag-and-Drop Zone System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the existing proximity-based widget reorder in `design-canvas.jsx` with a ghost + 5-zone drop system (left/right/top/bottom/center) and remove the SVG grid background.

**Architecture:** Pure DOM manipulation during drag — no React state updates mid-drag. On drag start: clone slot as fixed-position ghost, inject zone `<div>`s into siblings, fade source slot. On `pointermove`: move ghost, detect hover target via bounding rect, highlight active zone. On `pointerup`: compute new order from zone, call `onReorder`, clean up DOM.

**Tech Stack:** Vanilla React (no build step), plain DOM APIs (`cloneNode`, `createElement`, `getBoundingClientRect`, `classList`). No test framework — tests are manual browser steps.

---

## File Map

- **Modify:** `app/assets/components/design-canvas.jsx`
  - Lines 36–38: remove unused `.dc-dragging` CSS rules
  - Lines 295, 323: remove grid SVG background
  - Lines 33–53: extend CSS injection with ghost/zone/source-slot classes
  - Lines 382–439: replace `onGripDown` with ghost + zone implementation

---

### Task 1: Remove grid background and update CSS

**Files:**
- Modify: `app/assets/components/design-canvas.jsx:33-55` (CSS injection block)
- Modify: `app/assets/components/design-canvas.jsx:295` (gridSvg variable)
- Modify: `app/assets/components/design-canvas.jsx:323` (grid background div)

- [ ] **Step 1: Replace the CSS injection array**

In `design-canvas.jsx`, find the `s.textContent = [` block (lines 33–53) and replace the entire array with the version below. This removes the now-unused `.dc-dragging` rules (lines 37–38) and adds the new ghost/zone/source-slot classes at the end.

```javascript
  s.textContent = [
  '.dc-editable{cursor:text;outline:none;white-space:nowrap;border-radius:3px;padding:0 2px;margin:0 -2px}',
  '.dc-editable:focus{background:#fff;box-shadow:0 0 0 1.5px #c96442}',
  '.dc-card{transition:box-shadow .15s,transform .15s}',
  '.dc-card *{scrollbar-width:none}',
  '.dc-card *::-webkit-scrollbar{display:none}',
  '.dc-labelrow{display:flex;align-items:center;gap:4px;height:24px}',
  '.dc-grip{cursor:grab;display:flex;align-items:center;padding:5px 4px;border-radius:4px;transition:background .12s}',
  '.dc-grip:hover{background:rgba(0,0,0,.08)}',
  '.dc-grip:active{cursor:grabbing}',
  '.dc-labeltext{cursor:pointer;border-radius:4px;padding:3px 6px;display:flex;align-items:center;transition:background .12s}',
  '.dc-labeltext:hover{background:rgba(0,0,0,.05)}',
  '.dc-expand{position:absolute;bottom:100%;right:0;margin-bottom:5px;z-index:2;opacity:0;transition:opacity .12s,background .12s;',
  '  width:22px;height:22px;border-radius:5px;border:none;cursor:pointer;padding:0;',
  '  background:transparent;color:rgba(60,50,40,.7);display:flex;align-items:center;justify-content:center}',
  '.dc-expand:hover{background:rgba(0,0,0,.06);color:#2a251f}',
  '[data-dc-slot]:hover .dc-expand{opacity:1}',
  '.dc-ghost{position:fixed;pointer-events:none;z-index:1000;opacity:.85;transform:scale(1.03);transition:none;box-shadow:0 12px 40px rgba(0,0,0,.25),0 0 0 2px #c96442}',
  '.dc-source-slot{opacity:.25;outline:2px dashed rgba(201,100,66,.4);outline-offset:-2px}',
  '.dc-zone{position:absolute;pointer-events:none;z-index:5;transition:background 80ms ease}',
  '.dc-zone.left{top:20%;left:0;width:20%;height:60%}',
  '.dc-zone.right{top:20%;right:0;width:20%;height:60%}',
  '.dc-zone.top{top:0;left:0;width:100%;height:20%}',
  '.dc-zone.bottom{bottom:0;left:0;width:100%;height:20%}',
  '.dc-zone.center{top:20%;left:20%;width:60%;height:60%}',
  '.dc-zone.active.left{background:rgba(201,100,66,.18);border-left:2px solid #c96442}',
  '.dc-zone.active.right{background:rgba(201,100,66,.18);border-right:2px solid #c96442}',
  '.dc-zone.active.top{background:rgba(201,100,66,.18);border-top:2px solid #c96442}',
  '.dc-zone.active.bottom{background:rgba(201,100,66,.18);border-bottom:2px solid #c96442}',
  '.dc-zone.active.center{background:rgba(201,100,66,.10);outline:2px solid #c96442;outline-offset:-2px}',
  ].join('\n');
```

- [ ] **Step 2: Remove the gridSvg variable**

Find line 295 (inside `DCViewport`):
```javascript
  const gridSvg = `url("data:image/svg+xml,%3Csvg width='120' height='120' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M120 0H0v120' fill='none' stroke='${encodeURIComponent(DC.grid)}' stroke-width='1'/%3E%3C/svg%3E")`;
```
Delete this line entirely.

- [ ] **Step 3: Remove the grid background div**

Find line 323 (the first child of the `worldRef` div):
```javascript
        <div style={{ position: 'absolute', inset: -6000, backgroundImage: gridSvg, backgroundSize: '120px 120px', pointerEvents: 'none', zIndex: -1 }} />
```
Delete this line entirely.

- [ ] **Step 4: Verify in browser**

Open the app in a browser. The canvas background should be the plain warm gray (`#f0eee9`) with no grid lines visible. Open browser DevTools → Elements → `<head>` → find the `<style id="dc-styles">` element. Confirm it contains `.dc-ghost`, `.dc-source-slot`, `.dc-zone`, `.dc-zone.left`, `.dc-zone.active.center`.

- [ ] **Step 5: Commit**

```bash
git add app/assets/components/design-canvas.jsx
git commit -m "feat: remove canvas grid background; add ghost/zone CSS classes"
```

---

### Task 2: Replace onGripDown with ghost + zone drag system

**Files:**
- Modify: `app/assets/components/design-canvas.jsx:382-439` (`onGripDown` function inside `DCArtboardFrame`)

**Context:** `DCArtboardFrame` receives `{ sectionId, artboard, label, order, onRename, onReorder, onFocus }` as props. The `id` variable is `rawId ?? rawLabel` (defined a few lines above `onGripDown`). `ref` is `React.useRef(null)` pointing to the outer `[data-dc-slot]` div. `onReorder` expects a new array of slot id strings in the new desired order.

- [ ] **Step 1: Replace the entire onGripDown function**

Find the existing `onGripDown` function (starts at `const onGripDown = (e) => {`, ends at the closing `};` before the `return` statement of `DCArtboardFrame`). Replace it entirely with:

```javascript
  const onGripDown = (e) => {
    e.preventDefault(); e.stopPropagation();
    const me = ref.current;
    const meRect = me.getBoundingClientRect();
    const grabX = e.clientX - meRect.left;
    const grabY = e.clientY - meRect.top;

    // Ghost: cloned slot follows the cursor
    const ghost = me.cloneNode(true);
    ghost.className = 'dc-ghost';
    ghost.style.width = meRect.width + 'px';
    ghost.style.height = meRect.height + 'px';
    ghost.style.left = (e.clientX - grabX) + 'px';
    ghost.style.top = (e.clientY - grabY) + 'px';
    document.body.appendChild(ghost);

    // Fade the source slot in place
    me.classList.add('dc-source-slot');

    // All sibling slots in this section (not the dragged one)
    const siblings = Array.from(
      document.querySelectorAll(`[data-dc-section="${sectionId}"] [data-dc-slot]`)
    ).filter((el) => el.dataset.dcSlot !== id);

    // Inject 5 zone divs into each sibling card
    const zoneDivs = new Map(); // slotId -> { left, right, top, bottom, center }
    for (const sib of siblings) {
      const zones = {};
      for (const z of ['left', 'right', 'top', 'bottom', 'center']) {
        const d = document.createElement('div');
        d.className = `dc-zone ${z}`;
        sib.appendChild(d);
        zones[z] = d;
      }
      zoneDivs.set(sib.dataset.dcSlot, zones);
    }

    let hoverSlotId = null;
    let activeZone = null;

    const clearZones = () => {
      for (const zones of zoneDivs.values()) {
        for (const d of Object.values(zones)) d.classList.remove('active');
      }
    };

    const move = (ev) => {
      // Move ghost
      ghost.style.left = (ev.clientX - grabX) + 'px';
      ghost.style.top = (ev.clientY - grabY) + 'px';

      // Find which sibling the cursor is over
      let found = null;
      for (const sib of siblings) {
        const r = sib.getBoundingClientRect();
        if (ev.clientX >= r.left && ev.clientX <= r.right &&
            ev.clientY >= r.top  && ev.clientY <= r.bottom) {
          found = sib;
          break;
        }
      }

      clearZones();
      if (!found) { hoverSlotId = null; activeZone = null; return; }

      hoverSlotId = found.dataset.dcSlot;
      const r = found.getBoundingClientRect();
      const relX = (ev.clientX - r.left) / r.width;
      const relY = (ev.clientY - r.top) / r.height;

      // Left/right take priority over top/bottom in corners
      if      (relX < 0.20) activeZone = 'left';
      else if (relX > 0.80) activeZone = 'right';
      else if (relY < 0.20) activeZone = 'top';
      else if (relY > 0.80) activeZone = 'bottom';
      else                  activeZone = 'center';

      zoneDivs.get(hoverSlotId)[activeZone].classList.add('active');
    };

    const up = () => {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);

      // Clean up ghost and overlays
      ghost.remove();
      me.classList.remove('dc-source-slot');
      for (const zones of zoneDivs.values()) {
        for (const d of Object.values(zones)) d.remove();
      }

      // Compute new order from active zone
      if (hoverSlotId && activeZone) {
        let newOrder;
        if (activeZone === 'center') {
          // Swap dragged slot and target slot
          newOrder = order.slice();
          const srcIdx = newOrder.indexOf(id);
          const tgtIdx = newOrder.indexOf(hoverSlotId);
          newOrder[srcIdx] = hoverSlotId;
          newOrder[tgtIdx] = id;
        } else {
          // Insert before or after target
          newOrder = order.filter((k) => k !== id);
          const tgtIdx = newOrder.indexOf(hoverSlotId);
          if (activeZone === 'left' || activeZone === 'top') {
            newOrder.splice(tgtIdx, 0, id);
          } else {
            newOrder.splice(tgtIdx + 1, 0, id);
          }
        }
        if (newOrder.join('|') !== order.join('|')) onReorder(newOrder);
      }
    };

    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
  };
```

- [ ] **Step 2: Verify the file still has a valid return statement**

The `onGripDown` function is used in the `return` of `DCArtboardFrame` on the `<div className="dc-grip">` element:
```javascript
<div className="dc-grip" onPointerDown={onGripDown} title="Drag to reorder">
```
Confirm this line is still present and unchanged after your edit.

- [ ] **Step 3: Manual test — basic drag**

Open the app in a browser. Navigate to a canvas with at least 2 widgets in the same section. Grab the grip handle (the 6-dot icon above a widget) and drag. Verify:
- A ghost copy of the card appears and follows the cursor
- The source card fades (becomes 25% opacity with a dashed orange outline)
- Sibling cards remain in place (they do not slide during drag, unlike before)

- [ ] **Step 4: Manual test — zone highlighting**

While dragging, move the ghost over a sibling card. Verify:
- Hovering the left 20% of a card shows an orange left border on that card
- Hovering the right 20% shows an orange right border
- Hovering the top 20% (center horizontally) shows an orange top border
- Hovering the bottom 20% (center horizontally) shows an orange bottom border
- Hovering the center 60×60% area shows a full orange outline on that card
- Moving away from the card clears all zone highlights

- [ ] **Step 5: Manual test — drop actions**

Test each drop action:
1. **Insert before (left zone):** Drag card A over the left zone of card B → release. Card A should now appear immediately to the left of card B. Reload the page to confirm the new order persisted.
2. **Insert after (right zone):** Drag card A over the right zone of card B → release. Card A should now appear immediately to the right of card B.
3. **Swap (center zone):** Drag card A over the center of card B → release. Card A and card B should have swapped positions.
4. **No-op (release on empty canvas):** Drag a card and release it over the canvas background (not over any card). The order should not change.

- [ ] **Step 6: Manual test — single-card section edge case**

If a section contains only one widget, grab its grip and drag. Verify: a ghost appears and follows the cursor, but no zone overlays appear (there are no siblings), and releasing the card anywhere changes nothing.

- [ ] **Step 7: Commit**

```bash
git add app/assets/components/design-canvas.jsx
git commit -m "feat: replace canvas drag reorder with ghost + 5-zone drop system"
```
