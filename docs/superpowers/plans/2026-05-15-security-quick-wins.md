# Security Quick Wins Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the non-auth security issues found in the code review — plaintext password in invite modal, server binding to all interfaces, real PII in fallback seed data, OTP debug artifact, and orphaned script that fires duplicate queries.

**Architecture:** All fixes are isolated to individual files with no cross-file dependencies. Each task can be done and committed independently.

**Tech Stack:** Vanilla React (no build step), JSX via Babel browser transform, Python `http.server` dev server.

---

### Task 1: Clear password from state after invite — stop showing plaintext in DOM

**Files:**
- Modify: `app/assets/components/screen-access.jsx` — `InviteMemberModal` component, success state (around line 271–301)

The invite success modal renders the plaintext password in the DOM (`{password}` at line 291). The password remains in component state and visible in the DOM for the entire lifetime of the modal, including during screen-share sessions and screenshots.

- [ ] **Step 1: Find `InviteMemberModal` in screen-access.jsx**

Search for the `done` success state rendering:
```bash
grep -n "Member ditambahkan\|done.*return\|{password}" app/assets/components/screen-access.jsx | head -20
```

- [ ] **Step 2: Find the `handleSend` (or equivalent submit) function inside `InviteMemberModal`**

It's the function that sets `done` to `true` after a successful insert. It currently looks like:

```javascript
setDone(true);
```

After `setDone(true)`, copy the password to a separate ref before clearing state:

```javascript
savedPasswordRef.current = password;
setPassword('');
setDone(true);
```

Add the ref declaration at the top of `InviteMemberModal`:

```javascript
const savedPasswordRef = React.useRef('');
```

- [ ] **Step 3: Replace `{password}` in the success modal with the ref value**

Change line 291 from:

```jsx
<span style={{ fontFamily: AS.mono, fontSize: 11, color: '#00C2B8', fontWeight: 600 }}>{password}</span>
```

To:

```jsx
<span style={{ fontFamily: AS.mono, fontSize: 11, color: '#00C2B8', fontWeight: 600 }}>{savedPasswordRef.current}</span>
```

- [ ] **Step 4: Clear the ref when the modal closes**

In the `onClose` handler (the button at line 298):

```jsx
<button onClick={() => { savedPasswordRef.current = ''; onClose(); }} ...>Selesai</button>
```

- [ ] **Step 5: Verify in browser**

Open the Access screen → click "Tambah member" → fill in a name, email, and password → submit. The success modal should show the password. Click "Selesai" to close. Inspect React DevTools — the `password` state should be empty string `''` while the modal is showing, and the ref should clear on close.

- [ ] **Step 6: Commit**

```bash
git add app/assets/components/screen-access.jsx
git commit -m "fix: clear password state after invite — store display copy in ref only"
```

---

### Task 2: Bind server.py to localhost only

**Files:**
- Modify: `app/server.py:16`

`TCPServer(("", PORT), ...)` binds to `0.0.0.0` — any machine on the same Wi-Fi network can reach the server and download all JSX source files including hardcoded Supabase keys.

- [ ] **Step 1: Open server.py**

Current content:
```python
with socketserver.TCPServer(("", PORT), NoCacheHandler) as httpd:
    print(f"Serving at http://localhost:{PORT}")
    httpd.serve_forever()
```

- [ ] **Step 2: Change the bind address to localhost**

```python
with socketserver.TCPServer(("127.0.0.1", PORT), NoCacheHandler) as httpd:
    print(f"Serving at http://localhost:{PORT}")
    httpd.serve_forever()
```

- [ ] **Step 3: Also log errors (4xx, 5xx) while suppressing successful requests**

Replace the silent `log_message` override:

```python
def log_message(self, format, *args):
    pass  # suppress logs
```

With one that shows errors only:

```python
def log_message(self, format, *args):
    if args and len(args) > 1 and not str(args[1]).startswith('2'):
        super().log_message(format, *args)
```

- [ ] **Step 4: Verify**

Stop and restart the server:
```bash
python3 app/server.py
```

From another device on the same network, try to reach `http://<your-machine-ip>:3100`. It should time out or refuse connection. From your own machine, `http://localhost:3100` should still work.

- [ ] **Step 5: Commit**

```bash
git add app/server.py
git commit -m "fix: bind dev server to 127.0.0.1 only — prevent LAN exposure of source files"
```

---

### Task 3: Replace real PII in ACCESS_USERS fallback seed

**Files:**
- Modify: `app/assets/components/screen-access.jsx:47–51`

Real email addresses (`riyadh@avonetiq.id`, `riyadhnasrin96@gmail.com`) are hardcoded in the fallback `ACCESS_USERS` array that is shipped in a publicly-served JS file. Anyone who views source can see them.

- [ ] **Step 1: Find `ACCESS_USERS` in screen-access.jsx**

Lines 47–51:

```javascript
const ACCESS_USERS = [
  { id: 'u1', name: 'Avonetiq Owner', email: 'optimize@avonetiq.com', role: 'owner', ... },
  { id: 'u2', name: 'Riyadh Nasrin', email: 'riyadh@avonetiq.id', role: 'editor', ... },
  { id: 'u3', name: 'Riyadh Nasrin', email: 'riyadhnasrin96@gmail.com', role: 'viewer', ... },
];
```

- [ ] **Step 2: Replace real PII with placeholder data**

```javascript
const ACCESS_USERS = [
  { id: 'u1', name: 'Workspace Owner', email: 'owner@example.com', role: 'owner', avatar: 'WO', grad: 'linear-gradient(135deg,#00C2B8,#7000FF)', joined: '28 Apr 2026', lastActive: 'Just now', clients: [], status: 'active' },
  { id: 'u2', name: 'Editor User', email: 'editor@example.com', role: 'editor', avatar: 'EU', grad: 'linear-gradient(135deg,#4285F4,#00C2B8)', joined: '28 Apr 2026', lastActive: 'Just now', clients: [], status: 'active' },
  { id: 'u3', name: 'Viewer User', email: 'viewer@example.com', role: 'viewer', avatar: 'VU', grad: 'linear-gradient(135deg,#7000FF,#4285F4)', joined: '28 Apr 2026', lastActive: 'Never', clients: [], status: 'active' },
];
```

- [ ] **Step 3: Verify in browser**

Open the Access screen while disconnected from the internet (so `_ACCESS_SUPA` fails). Confirm placeholder names and emails appear in the fallback list instead of real names.

- [ ] **Step 4: Commit**

```bash
git add app/assets/components/screen-access.jsx
git commit -m "fix: replace real PII in ACCESS_USERS fallback with example.com placeholders"
```

---

### Task 4: Remove OTP debug artifact — pre-filled digits "472"

**Files:**
- Modify: `app/assets/components/screen-login.jsx:136`

The OTP verification screen pre-fills the first three boxes with `4`, `7`, `2`. This was a debugging artifact that was never removed. It looks unprofessional and could confuse users.

- [ ] **Step 1: Find the OTP input map in screen-login.jsx**

Line 136:

```jsx
{[0,1,2,3,4,5].map(i => (
  <input key={i} type="text" maxLength={1} defaultValue={i < 3 ? ['4','7','2'][i] : ''}
```

- [ ] **Step 2: Remove the pre-filled values**

```jsx
{[0,1,2,3,4,5].map(i => (
  <input key={i} type="text" maxLength={1} defaultValue=""
```

- [ ] **Step 3: Verify in browser**

Open the login screen → click "Guest Login" → click "Send OTP code →". All 6 OTP boxes should be empty.

- [ ] **Step 4: Commit**

```bash
git add app/assets/components/screen-login.jsx
git commit -m "fix: remove OTP debug artifact — clear pre-filled '472' digits from verification screen"
```

---

### Task 5: Remove orphaned supabase-client.js

**Files:**
- Modify: `app/index.html` — remove the `<script>` tag
- Delete: `app/assets/js/supabase-client.js`

`supabase-client.js` is a legacy file that registers a `window.addEventListener('load', ...)` which fires a duplicate `ads_data` query on every page load. All its functions (`fetchSupabaseData`, `buildPeriodData`, `initSupabaseData`) are completely superseded by `data-bridge.jsx`. This file adds wasted network requests.

- [ ] **Step 1: Confirm nothing in the codebase imports or calls these functions**

```bash
grep -rn "initSupabaseData\|fetchSupabaseData\|buildPeriodData\|supabase-client" app/
```

If any results appear outside of `supabase-client.js` itself and `index.html`, do not delete — investigate first. If results are only from those two files, proceed.

- [ ] **Step 2: Remove the script tag from index.html**

Search for the `supabase-client.js` script tag in `app/index.html`:

```bash
grep -n "supabase-client" app/index.html
```

Delete that `<script>` line from `index.html`.

- [ ] **Step 3: Delete the file**

```bash
rm app/assets/js/supabase-client.js
```

- [ ] **Step 4: Verify in browser**

Reload the app. Open Network tab in DevTools. Confirm no request to `ads_data` fires on load (before any account is selected). The dashboard should work exactly as before.

- [ ] **Step 5: Commit**

```bash
git add app/index.html
git rm app/assets/js/supabase-client.js
git commit -m "fix: remove orphaned supabase-client.js — eliminates duplicate ads_data query on load"
```
