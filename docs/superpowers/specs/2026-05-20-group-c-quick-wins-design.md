# Group C Quick Wins Design

## Goal

Two isolated production-readiness fixes: remove the unfinished template page, and add `regex` / `not_regex` operators to the report canvas filter.

## Architecture

Both changes are independent. No new dependencies, no new tables, no new components.

**Tech Stack:** React (Babel standalone), existing `applyKpiFilters` function, existing filter editor UI in `screen-report.jsx`.

---

## Item 1 — Remove Template Page

### What Changes

| File | Action |
|---|---|
| `app/assets/components/screen-templates.jsx` | Delete |
| `app/index.html` | Remove `<script>` tag for `screen-templates.jsx` |
| `app/assets/components/screen-home.jsx` | Remove `Templates` from nav |

### Detail

`screen-home.jsx` defines:
```js
const NAV_ROUTES = { Home: 'home', Templates: 'templates', Access: 'access' };
```
And renders the nav conditionally:
```jsx
{(_VIEWER_ROLE ? [['Home','active']] : [['Home','active'],['Templates',''],['Access','']]).map(...)}
```

Both references to `'Templates'` must be removed so the tab never appears.

### What Does NOT Change

- `screen-access.jsx` — unaffected
- `screen-home.jsx` routing logic for `home` and `access` — unaffected
- No user data is lost (template page had no Supabase table)

---

## Item 2 — Add `regex` and `not_regex` Filter Operators

### What Changes

| File | Action |
|---|---|
| `app/assets/components/screen-report.jsx` | Add two operators to `applyKpiFilters` and to the operator dropdown UI |

### `applyKpiFilters` — `matchRow()` function

Current operators: `is`, `not`, `starts`, (default) `includes`.

Add after the `starts` branch:

```js
if (f.op === 'regex') {
  try { return new RegExp(f.val, 'i').test(rv); } catch { return false; }
}
if (f.op === 'not_regex') {
  try { return !new RegExp(f.val, 'i').test(rv); } catch { return true; }
}
```

Rules:
- Both are case-insensitive (`'i'` flag)
- Invalid regex pattern → `regex` returns `false` (row excluded), `not_regex` returns `true` (row included) — safe, no crash

### Operator Dropdown UI

The filter editor panel has a dropdown with operator options. Add two entries after `includes`:

| `op` value | Display label |
|---|---|
| `regex` | `matches /regex/` |
| `not_regex` | `not /regex/` |

When operator is `regex` or `not_regex`, the value input placeholder changes to `Pattern…` instead of the default `Value…`.

### What Does NOT Change

- Existing operators (`is`, `not`, `starts`, `includes`) — untouched
- Filter data structure — `{ dim, op, val }` unchanged, `op` just gets two new valid values
- `applyKpiFilters` behavior for all existing operators — unchanged
- No Supabase schema change

---

## Version Bumps

| File | Change |
|---|---|
| `screen-home.jsx` | `?v=27` → `?v=28` |
| `screen-report.jsx` | `?v=109` → `?v=110` |
| `screen-templates.jsx` | remove tag entirely |
