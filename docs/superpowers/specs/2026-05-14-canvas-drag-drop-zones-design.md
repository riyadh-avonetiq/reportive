# Canvas Drag-and-Drop Zone System Design

## Goal

Apply the same 5-zone drop system (top / bottom / left / right / replace) to existing widgets being reordered on the canvas — currently only supported when adding new widgets from the sidebar. Also remove the green SVG grid guideline background, which is visual noise.

---

## Scope

One file: `app/assets/components/design-canvas.jsx`

- Remove grid background (2 lines deleted)
- Replace `onGripDown` in `DCArtboardFrame` with a ghost + zone-overlay drag system

No changes to any other file. No layout model changes. All operations remain within-section (horizontal row).

---

## Section 1 — Grid Removal

Delete:
- Line 295: `const gridSvg = ...` variable
- Line 323: the `<div>` with `backgroundImage: gridSvg`

The canvas background color (`DC.bg = '#f0eee9'`) remains unchanged.

---

## Section 2 — Ghost Card

On drag start (`onGripDown`):

1. Measure grab offset: `grabX = e.clientX - cardRect.left`, `grabY = e.clientY - cardRect.top`
2. Clone the slot DOM node (`ref.current`): `ghost = me.cloneNode(true)`
3. Apply ghost styles:
   - `position: fixed`
   - `pointer-events: none`
   - `z-index: 1000`
   - `opacity: 0.85`
   - `transform: scale(1.03)`
   - `box-shadow: 0 12px 40px rgba(0,0,0,.25), 0 0 0 2px #c96442`
   - `width` and `height` locked to original card pixel dimensions
   - `left: e.clientX - grabX`, `top: e.clientY - grabY`
4. Append ghost to `document.body`
5. Add `dc-source-slot` class to the source card element (fades it, shows dashed outline)

On `pointermove`: update `ghost.style.left = ev.clientX - grabX` and `ghost.style.top = ev.clientY - grabY`.

On `pointerup`: remove ghost from body.

---

## Section 3 — Source Slot

When dragging begins, the source card gets class `dc-source-slot`:

```css
.dc-source-slot { opacity: 0.25; outline: 2px dashed rgba(201,100,66,0.4); outline-offset: -2px; }
```

The source card stays in place — siblings do **not** shift during drag. The source slot is only a visual marker showing the card's origin. On drop, the class is removed.

---

## Section 4 — Zone Overlays

On drag start, inject 5 absolutely-positioned `<div>` zone elements into every sibling card (not the source card). These are plain DOM nodes, not React state.

Zone layout within each target card:

```
┌──────────────────────────────┐
│         [  TOP 20%  ]        │
│  [LEFT] [  CENTER   ] [RIGHT]│
│         [ BOTTOM 20%]        │
└──────────────────────────────┘
```

Base zone CSS (`.dc-zone`): `position: absolute; pointer-events: none; transition: background 80ms ease; z-index: 5`

Dimensions per zone:
- `left`: `top:20%, left:0, width:20%, height:60%`
- `right`: `top:20%, right:0, width:20%, height:60%`
- `top`: `top:0, left:0, width:100%, height:20%`
- `bottom`: `bottom:0, left:0, width:100%, height:20%`
- `center`: `top:20%, left:20%, width:60%, height:60%`

Active zone border colors:
- `left` active: `background: rgba(201,100,66,0.18); border-left: 2px solid #c96442`
- `right` active: `background: rgba(201,100,66,0.18); border-right: 2px solid #c96442`
- `top` active: `background: rgba(201,100,66,0.18); border-top: 2px solid #c96442`
- `bottom` active: `background: rgba(201,100,66,0.18); border-bottom: 2px solid #c96442`
- `center` active: `background: rgba(201,100,66,0.10); outline: 2px solid #c96442; outline-offset: -2px`

Inactive zones: `background: transparent; border: none`

On `pointerup`: remove all zone divs from all cards.

---

## Section 5 — Zone Detection

On every `pointermove`, find which sibling card the cursor is over:

```
for each sibling card (excluding source):
  if cursor is within card bounding rect:
    hoverCard = this card
    break
```

Then compute active zone from cursor position within `hoverCard`:

```
r = hoverCard.getBoundingClientRect()
relX = (ev.clientX - r.left) / r.width   // 0..1
relY = (ev.clientY - r.top)  / r.height  // 0..1

if relX < 0.20        → zone = 'left'
else if relX > 0.80   → zone = 'right'
else if relY < 0.20   → zone = 'top'
else if relY > 0.80   → zone = 'bottom'
else                  → zone = 'center'
```

Left/right take priority over top/bottom in corners (evaluated first).

Apply `.dc-zone-active` to the matching zone div on `hoverCard`. Clear `.dc-zone-active` from all other zone divs.

---

## Section 6 — Drop Action

On `pointerup`, read `activeZone` and `hoverSlotId`:

| Zone | Action |
|------|--------|
| `left` or `top` | Insert dragged id **before** `hoverSlotId` in the order array |
| `right` or `bottom` | Insert dragged id **after** `hoverSlotId` in the order array |
| `center` | Swap dragged id and `hoverSlotId` in the order array |
| none (no hover) | Keep original order (no-op) |

Then call `onReorder(newOrder)` — same as before.

---

## Section 7 — CSS Additions

Appended to the existing `dc-styles` injection in `design-canvas.jsx`:

```css
.dc-ghost { position:fixed; pointer-events:none; z-index:1000; opacity:.85; transform:scale(1.03); transition:none; box-shadow:0 12px 40px rgba(0,0,0,.25),0 0 0 2px #c96442; }
.dc-source-slot { opacity:.25; outline:2px dashed rgba(201,100,66,.4); outline-offset:-2px; }
.dc-zone { position:absolute; pointer-events:none; z-index:5; transition:background 80ms ease; }
.dc-zone.left  { top:20%; left:0;    width:20%; height:60%; }
.dc-zone.right { top:20%; right:0;   width:20%; height:60%; }
.dc-zone.top   { top:0;   left:0;    width:100%; height:20%; }
.dc-zone.bottom{ bottom:0; left:0;   width:100%; height:20%; }
.dc-zone.center{ top:20%; left:20%;  width:60%; height:60%; }
.dc-zone.active.left  { background:rgba(201,100,66,.18); border-left:2px solid #c96442; }
.dc-zone.active.right { background:rgba(201,100,66,.18); border-right:2px solid #c96442; }
.dc-zone.active.top   { background:rgba(201,100,66,.18); border-top:2px solid #c96442; }
.dc-zone.active.bottom{ background:rgba(201,100,66,.18); border-bottom:2px solid #c96442; }
.dc-zone.active.center{ background:rgba(201,100,66,.10); outline:2px solid #c96442; outline-offset:-2px; }
```

---

## Section 8 — What Does NOT Change

- `DCSection`, `DesignCanvas`, `DCViewport`, `DCFocusOverlay`, `DCEditable` — untouched
- `onReorder` callback interface — unchanged
- Persisted state format (`.design-canvas.state.json`) — unchanged
- Cross-section membership — not supported; all zones operate within the same section row
- The grip handle (`dc-grip`) remains the drag trigger

---

## Out of Scope

- Cross-section drag (moving artboards between rows) — requires layout model changes, deferred
- Animated live-preview (siblings shifting during drag) — current behavior removed in favor of the ghost system; siblings are static during drag
