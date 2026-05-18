# Editor Panel Data Source Improvements — Design Spec

## Goal

Improve the data source management UI in the card editor panel with three targeted fixes: disconnect confirmation modal, explicit source-switch button, fixed-height account picker, and save-error toast.

## Architecture

All changes stay within existing files — no new files, no new global state patterns. The three improvement areas map to three files:

- `card-editor.jsx` — disconnect confirmation modal, switch button, picker height
- `screen-report.jsx` — awaited save with rollback + toast state
- `screen-home.jsx` — `_saveClientConnected` returns Supabase result for error detection

---

## Section 1: Disconnect Confirmation Modal

### Behaviour

When user clicks "Lepas" on a connected source, instead of immediately disconnecting, a confirmation modal appears inline within the editor panel.

### Modal content

- **Title:** "Lepas [Source Label]?" (e.g. "Lepas Google Ads?")
- **Warning body:** "Tindakan ini akan memutus koneksi [Source] dari klien ini. Semua widget yang menggunakan source ini akan berhenti menampilkan data."
- **Widget count line:** "N widget di report ini menggunakan source ini." — N is counted by scanning `widgetLayouts.rows.flat()` for entries where `entry.source === s`. If N = 0, line is omitted.
- **Buttons:** "Batalkan" (neutral, left) and "Ya, Lepas" (red, right)

### State

A single `disconnectPending` useState inside `SimpleSetupTab` — value is `null | srcId`. Set to `srcId` when "Lepas" is clicked; reset to `null` on cancel or confirm.

```
null         → no modal shown
'meta'       → modal shown for Meta Ads
```

### Implementation boundary

- Modal is a `<div>` absolutely positioned over the editor panel body (not a browser `confirm()` and not a full-screen overlay)
- `z-index` sits above the panel content but below everything else
- Actual disconnect call (`handleDisconnectSource(s)`) only fires on confirm
- No changes to `screen-report.jsx` or `screen-home.jsx` for this section

### Widget count source

`widgetLayouts` is not accessible inside `SimpleSetupTab`. The count is passed via a new prop `widgetLayouts` — OR computed from the existing `sharedWidgetCount` pattern. Simplest: pass `layoutRows` (the flat list of widget instances) as an optional prop from `CardEditorPanel`. If not provided, the count line is simply omitted.

---

## Section 2: Source Switch Button + Account Picker Height

### Source switch: "klik untuk ganti" → "Pakai" button

**Current:** A small muted text `klik untuk ganti` sits below the source name. It is clickable but has no button affordance.

**New:** Replace with a small button labelled **"Pakai"** styled consistently with the editor panel's other secondary buttons (thin border, subtle background, same font). Position: right side of the connected-source row, to the left of the "Lepas" button.

- On click: calls `onSourceChange(widgetId, s)` directly — no confirmation needed (non-destructive, only affects this widget's active source)
- Only shown when `onSourceChange` prop is provided and `s !== srcKey` (not already active)
- Active source (isCurrent) still shows the blue dot indicator, no "Pakai" button

### Account picker: fixed height

**Current:** When "Add Data Source" is expanded, the picker container grows to fit all platforms and their account lists, pushing Metric/Font Size sections below the viewport.

**New:** The picker container `<div>` gets `maxHeight: 260px; overflowY: auto`. The internal account list retains its existing `maxHeight: 150px`. This caps the total picker growth so it never displaces sibling sections.

No logic changes — purely CSS constraints.

---

## Section 3: Save Error Handling + Toast

### `window._saveClientConnected` (screen-home.jsx)

Currently returns `undefined` implicitly. Change to return the Supabase operation result:

```javascript
window._saveClientConnected = async function(clientId, newConnected) {
  if (!_APP_SUPA) return { error: null };
  const { error } = await _APP_SUPA
    .from('clients')
    .update({ connected: newConnected, last_edited: new Date().toISOString() })
    .eq('id', clientId);
  return { error };
};
```

### `handleConnectedChange` (screen-report.jsx)

Currently fire-and-forget. New behaviour:

1. Capture the previous `localConnected` value before updating
2. Optimistically set `localConnected` to `newConnected`
3. Await `_saveClientConnected`
4. On error: rollback `localConnected` to previous value + set toast message
5. On success: no action needed (optimistic update is already correct)

```javascript
const handleConnectedChange = useCallback(async (newConnected) => {
  const prev = localConnected ?? client?.connected ?? {};
  setLocalConnected(newConnected);
  if (clientId && window._saveClientConnected) {
    const { error } = await window._saveClientConnected(clientId, newConnected);
    if (error) {
      setLocalConnected(prev);           // rollback
      setToastMsg('Gagal menyimpan — perubahan tidak tersimpan.');
      setTimeout(() => setToastMsg(null), 4000);
    }
  }
}, [clientId, localConnected, client?.connected]);
```

### Toast UI (screen-report.jsx)

- New `useState`: `const [toastMsg, setToastMsg] = useState(null);`
- Rendered as a fixed-position element inside the report wrapper, bottom-right corner, above the editor panel
- Style: red background, white text, `border-radius: 8px`, `padding: 10px 16px`, `font-size: 12px`, fade-in/fade-out via CSS `opacity` transition
- Auto-dismisses after 4 seconds via `setTimeout` in the error handler
- If a second error fires before the first toast clears, the timeout resets (call `clearTimeout` on a ref before setting a new one)

---

## Files Changed

| File | Change |
|------|--------|
| `card-editor.jsx` | `disconnectPending` state + confirmation modal; "Pakai" button replacing text; account picker `maxHeight` |
| `screen-report.jsx` | `toastMsg` state + toast UI; awaited `handleConnectedChange` with rollback |
| `screen-home.jsx` | `_saveClientConnected` returns `{ error }` |

## Out of Scope

- Per-widget source filtering (deciding which connected sources are available per widget)
- Account picker search (already present in Configure panel but not needed here)
- Offline/retry logic for failed saves
