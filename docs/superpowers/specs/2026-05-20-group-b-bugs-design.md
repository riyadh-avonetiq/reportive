# Group B Bug Fixes Design

## Goal

Fix three production bugs: loading state flash on report open, present mode showing hardcoded layout instead of canvas widgets, and new member status staying "pending" after successful invite.

## Architecture

All fixes are isolated to two files: `screen-report.jsx` (bugs 2 and 3) and `screen-access.jsx` (bug 5). No new dependencies, no new tables, no new components.

**Tech Stack:** React hooks, existing Supabase clients, existing widget rendering infrastructure (`buildUniversalMap`)

---

## Bug 2 — "Client tidak ditemukan" loading flash

### Root Cause

`ScreenReport` has a retry mechanism that polls `window._avo_clients` every 300ms up to 10 times (3 seconds total). During the entire retry period, the component falls through to the "Client tidak ditemukan" error UI because `client` is `undefined`. The user sees a false error message while data is still loading.

### Fix

Add a loading state check before the "not found" render. If `retry < 10` and `client` is not yet found, render a loading spinner instead of the error. The "Client tidak ditemukan" message only appears after all 10 retries are exhausted.

**File:** `app/assets/components/screen-report.jsx`

Find the `if (!client)` block (around line 5444) and replace:

```jsx
if (!client) {
  return (
    <div style={{...}}>
      <div>Client tidak ditemukan</div>
      ...
    </div>
  );
}
```

With:

```jsx
if (!client) {
  if (retry < 10) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--navy-base)' }}>
        <div style={{ fontFamily: T.mono, fontSize: 13, color: muted }}>Memuat laporan…</div>
      </div>
    );
  }
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--navy-base)', gap: 14 }}>
      <div style={{ fontFamily: T.display, fontSize: 18, color: fg }}>Client tidak ditemukan</div>
      <div style={{ fontFamily: T.mono, fontSize: 12, color: muted }}>ID: {clientId}</div>
      <button onClick={onBack} style={{ padding: '9px 18px', background: 'linear-gradient(135deg,#00C2B8,#009E96)', border: 'none', borderRadius: 8, color: '#0C182C', fontFamily: T.display, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>← Kembali ke Home</button>
    </div>
  );
}
```

---

## Bug 3 — Present mode shows hardcoded layout instead of canvas

### Root Cause

`PresentMode` builds its slide content from scratch using hardcoded JSX per data source. It does not read `widgetLayouts` or `widgetConfigs` at all. Any custom canvas arrangement is ignored.

### Fix

Pass `layouts`, `widgetConfigs`, `psiUrl`, and `psiApiKey` from `ScreenReport` to `PresentMode`. For each source slide (google, meta, ga4, search, pagespeed), filter `layouts.rows.flat()` to find widgets where `w.source === slideId`, then render them using the existing `buildUniversalMap` infrastructure in a 3-column CSS grid (read-only, no edit state).

Executive Summary slide is kept as-is (hardcoded overview is appropriate for a summary).

**File:** `app/assets/components/screen-report.jsx`

**Changes:**

1. `PresentMode` signature: add `layouts`, `widgetConfigs`, `psiUrl`, `psiApiKey` props
2. `renderSlide()` for non-summary slides:
   - Call `buildUniversalMap(p, widgetConfigs, layouts, null, psiUrl, psiApiKey, null)` to get widget components
   - Filter `layouts.rows.flat()` for `w.source === cur.id`
   - Render in `display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px`
   - If no widgets for that source: show "Belum ada widget untuk sumber ini"
3. Pass the new props at call site (~line 5698):
   ```jsx
   <PresentMode
     client={client}
     p={p}
     isMock={_isMock}
     onExit={() => setShowPresent(false)}
     layouts={_layouts}
     widgetConfigs={widgetConfigs}
     psiUrl={psiUrl}
     psiApiKey={psiApiKey}
   />
   ```

**What does NOT change:**
- Slide structure (Summary + one per connected source)
- Keyboard navigation (arrow keys, Escape)
- Slide counter and dot indicators
- Top bar (logo, client name, period, exit button)
- Executive Summary slide content

---

## Bug 5 — New member status "pending" after invite

### Root Cause

`handleInvite` in `screen-access.jsx` inserts a new user with `status: 'active'`. However, the Supabase `team_members` table has a column DEFAULT of `'pending'` which overrides the inserted value. The `.insert().select()` response returns the row as stored by Supabase — with `status: 'pending'`. The UI then calls `_rowToUser(data)` on this response, so the user is shown as "Pending" in the Access screen.

### Fix

After the Supabase insert returns, force `status: 'active'` when constructing the local user object — regardless of what Supabase returned for that field.

**File:** `app/assets/components/screen-access.jsx`

Find (around line 1070):
```js
if (data) { addedUser = _rowToUser(data); setUsers(prev => [...prev, addedUser]); }
```

Replace with:
```js
if (data) { addedUser = _rowToUser({ ...data, status: 'active' }); setUsers(prev => [...prev, addedUser]); }
```

This ensures the local UI always reflects the intended status without requiring a Supabase schema change.

---

## What Does NOT Change

- Widget rendering logic, DragCanvas, undo/redo
- Retry count or timing (still 10 × 300ms)
- Invite flow, password hashing, role assignment
- Any Supabase table schema
- All other screens and components
