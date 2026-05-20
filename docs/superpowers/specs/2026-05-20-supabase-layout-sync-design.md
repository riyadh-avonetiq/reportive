# Supabase Layout Sync Design

## Goal

Migrate widget layouts and configs from `localStorage` (per-browser) to Supabase `report_layouts` table so all users share the same canvas layout for each client report.

## Architecture

Reportive is a pure static site. Widget layouts (`widgetLayouts`) and configs (`widgetConfigs`) are currently saved in `localStorage` keyed by `clientId`, making each user's canvas independent. This causes different users to see different layouts for the same client report. Moving both to Supabase makes layouts authoritative and shared.

**Supabase instance:** `swklfolveiilajdmuenu` (same as `clients` and `team_members`) — already has `_AUTH_SUPA` client in `app.jsx`.

## Tech Stack

- Supabase (existing META/AUTH instance) — `report_layouts` table (already created)
- `screen-report.jsx` — only file that reads/writes layout state

---

## Data Model

Table `report_layouts` (already created in Supabase):

| Column | Type | Notes |
|---|---|---|
| `client_id` | TEXT PRIMARY KEY | matches `clients.id` |
| `layouts` | JSONB | widget layout rows (`{ rows: [...] }`) |
| `configs` | JSONB | widget configs (colors, names, etc.) |
| `updated_at` | TIMESTAMPTZ | auto-set by Supabase default |

---

## What Changes

### 1. `app/assets/components/screen-report.jsx`

**Load flow** (replaces `localStorage.getItem` on client switch):
- On `clientId` change: fetch `report_layouts` where `client_id = clientId`
- Found → set `widgetLayouts` and `widgetConfigs` from Supabase record
- Not found → `widgetLayouts = null` (empty canvas), `widgetConfigs = {}`

**Save flow** (replaces `localStorage.setItem` on change):
- Debounce 1500ms after any layout or config change
- Upsert `{ client_id, layouts, configs, updated_at: new Date().toISOString() }`
- Show "Tersimpan" flash only after upsert resolves (success or error)
- On error: show brief error toast instead of saved flash

**Conflict resolution:** Last write wins — no locking needed.

**Undo/redo:** Unchanged — still in-memory. Supabase only receives the final committed state after debounce.

### 2. `app/index.html`

Bump `screen-report.jsx` version query string (`?v=N+1`).

---

## What Does NOT Change

- `app/assets/js/app.jsx` — `_AUTH_SUPA` client is reused as-is; no new Supabase client needed
- `_AUTH_SUPA` is already available globally via `window` — expose it as `window._layoutSupa` from `app.jsx` so `screen-report.jsx` can use it without importing
- All undo/redo logic — still in-memory
- All widget rendering logic
- `getSmartDefaultLayout()` — still used for passive display when no record exists in Supabase

---

## Migration

No migration of existing localStorage data. All clients start with an empty canvas in Supabase. Users rebuild layouts as needed.

Old `localStorage` keys (`widgetLayouts_*`, `widgetConfigs_*`) are abandoned in place — no cleanup needed.

---

## Out of Scope

- Real-time sync between users (no live subscription — reload to see another user's changes)
- Per-user layout variants
- Layout versioning or history
- RLS policies (anon key is sufficient; data is not user-sensitive)
