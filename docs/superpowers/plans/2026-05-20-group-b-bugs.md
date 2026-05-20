# Group B Bug Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix three production bugs — loading flash on report open, present mode ignoring canvas layout, and new member status stuck at "pending".

**Architecture:** All three fixes are isolated changes in two files. Bug 2 and 3 are in `screen-report.jsx`; bug 5 is a one-line fix in `screen-access.jsx`. No new dependencies, no new tables, no new components.

**Tech Stack:** React (Babel standalone), existing `buildUniversalMap` widget renderer, Supabase JS v2

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `app/assets/components/screen-report.jsx` | Modify | Bug 2: loading state; Bug 3: present mode |
| `app/assets/components/screen-access.jsx` | Modify | Bug 5: status fix |
| `app/index.html` | Modify | Bump version strings |

---

### Task 1: Bug 2 — Show loading state instead of "Client tidak ditemukan" during retry

**Files:**
- Modify: `app/assets/components/screen-report.jsx` (~line 5444)

The component retries `window._avo_clients` lookup every 300ms up to 10 times. During retry, `retry < 10`. After retry is exhausted, `retry >= 10`. The fix splits the `if (!client)` block into two cases.

- [ ] **Step 1: Replace the `if (!client)` block**

Find this exact block (lines 5444–5460):

```jsx
  if (!client) {
    return (
      <div style={{
        height: '100%', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'var(--navy-base)', gap: 14,
      }}>
        <div style={{ fontFamily: T.display, fontSize: 18, color: fg }}>Client tidak ditemukan</div>
        <div style={{ fontFamily: T.mono, fontSize: 12, color: muted }}>ID: {clientId}</div>
        <button onClick={onBack} style={{
          padding: '9px 18px', background: 'linear-gradient(135deg,#00C2B8,#009E96)',
          border: 'none', borderRadius: 8, color: '#0C182C',
          fontFamily: T.display, fontSize: 14, fontWeight: 700, cursor: 'pointer',
        }}>← Kembali ke Home</button>
      </div>
    );
  }
```

Replace with:

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
      <div style={{
        height: '100%', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'var(--navy-base)', gap: 14,
      }}>
        <div style={{ fontFamily: T.display, fontSize: 18, color: fg }}>Client tidak ditemukan</div>
        <div style={{ fontFamily: T.mono, fontSize: 12, color: muted }}>ID: {clientId}</div>
        <button onClick={onBack} style={{
          padding: '9px 18px', background: 'linear-gradient(135deg,#00C2B8,#009E96)',
          border: 'none', borderRadius: 8, color: '#0C182C',
          fontFamily: T.display, fontSize: 14, fontWeight: 700, cursor: 'pointer',
        }}>← Kembali ke Home</button>
      </div>
    );
  }
```

- [ ] **Step 2: Commit**

```bash
git add app/assets/components/screen-report.jsx
git commit -m "fix: show loading state during client retry instead of not-found error"
```

---

### Task 2: Bug 3 — Present mode reads canvas widget layout

**Files:**
- Modify: `app/assets/components/screen-report.jsx` (~lines 4592, 4708–4769, 5698–5703)

Three sub-changes: (a) update `PresentMode` signature, (b) replace hardcoded source slides with canvas widgets, (c) pass new props at call site.

- [ ] **Step 1: Update `PresentMode` signature**

Find line 4592:
```jsx
function PresentMode({ client, p, isMock, onExit }) {
```

Replace with:
```jsx
function PresentMode({ client, p, isMock, onExit, layouts, widgetConfigs, psiUrl, psiApiKey }) {
```

- [ ] **Step 2: Replace hardcoded source slides with canvas rendering**

Find this block inside `renderSlide()` — everything from the `if (cur.id === 'google')` block through the generic fallback (lines ~4708–4769):

```jsx
    if (cur.id === 'google') {
      const safeSpend = p.series.spend.length >= 2 ? p.series.spend : [0, 0];
      return (
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
            <span style={{ fontFamily: T.mono, fontSize: 12, color: blue, background: 'rgba(66,133,244,.1)', padding: '3px 10px', borderRadius: 4, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 600 }}>02 Google Ads</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
            <KpiCard acc={gold} label="Total Spend" value={fmt.rupiahShort(ads.spend)} delta={d(ads.spend, adsPrev.spend) != null ? Math.abs(d(ads.spend, adsPrev.spend)).toFixed(1) + '%' : '—'} deltaUp={(d(ads.spend, adsPrev.spend) || 0) >= 0} comparison="vs prev"/>
            <KpiCard acc={blue} label="Clicks" value={fmt.num(ads.clicks)} delta={d(ads.clicks, adsPrev.clicks) != null ? Math.abs(d(ads.clicks, adsPrev.clicks)).toFixed(1) + '%' : '—'} deltaUp={(d(ads.clicks, adsPrev.clicks) || 0) >= 0} comparison="vs prev"/>
            <KpiCard acc={teal} label="Conversions" value={fmt.num(ads.conversions)} delta={d(ads.conversions, adsPrev.conversions) != null ? Math.abs(d(ads.conversions, adsPrev.conversions)).toFixed(1) + '%' : '—'} deltaUp={(d(ads.conversions, adsPrev.conversions) || 0) >= 0} comparison="vs prev"/>
            <KpiCard acc={gold} label="ROAS" value={fmt.roas(ads.roas)} delta={d(ads.roas, adsPrev.roas) != null ? Math.abs(d(ads.roas, adsPrev.roas)).toFixed(1) + '%' : '—'} deltaUp={(d(ads.roas, adsPrev.roas) || 0) >= 0} comparison="vs prev"/>
          </div>
          <div style={{ background: 'var(--navy-surface)', border: '1px solid var(--navy-edge)', borderRadius: 14, padding: '18px 20px' }}>
            <div style={{ fontFamily: T.display, fontSize: 15, fontWeight: 700, color: fg, marginBottom: 12 }}>Spend Trend · {p.labelShort}</div>
            <MiniLine data={safeSpend} w={800} h={100} color={blue} fill id="pres-gads"/>
          </div>
        </div>
      );
    }

    if (cur.id === 'ga4') {
      const safeA = p.series.impressions.length >= 2 ? p.series.impressions.map(v => Math.round(v / 25)) : [ga4.sessions];
      const safeB = p.series.clicks.length >= 2 ? p.series.clicks.map(v => Math.round(v * 1.3)) : [ga4.total_users];
      return (
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
            <span style={{ fontFamily: T.mono, fontSize: 12, color: gold, background: 'rgba(248,180,0,.1)', padding: '3px 10px', borderRadius: 4, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 600 }}>GA4 Analytics</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
            <KpiCard acc={gold} label="Sessions" value={fmt.num(ga4.sessions)} delta={d(ga4.sessions, ga4Prev.sessions) != null ? Math.abs(d(ga4.sessions, ga4Prev.sessions)).toFixed(1) + '%' : '—'} deltaUp={(d(ga4.sessions, ga4Prev.sessions) || 0) >= 0} comparison="vs prev"/>
            <KpiCard acc={gold} label="Users" value={fmt.num(ga4.total_users)} delta={d(ga4.total_users, ga4Prev.total_users) != null ? Math.abs(d(ga4.total_users, ga4Prev.total_users)).toFixed(1) + '%' : '—'} deltaUp={(d(ga4.total_users, ga4Prev.total_users) || 0) >= 0} comparison="vs prev"/>
            <KpiCard acc={teal} label="Pageviews" value={fmt.num(ga4.event_count)} delta={d(ga4.event_count, ga4Prev.event_count) != null ? Math.abs(d(ga4.event_count, ga4Prev.event_count)).toFixed(1) + '%' : '—'} deltaUp={(d(ga4.event_count, ga4Prev.event_count) || 0) >= 0} comparison="vs prev"/>
            <KpiCard acc={teal} label="Engaged Sessions" value={fmt.num(ga4.engaged_sessions)} delta={d(ga4.engaged_sessions, ga4Prev.engaged_sessions) != null ? Math.abs(d(ga4.engaged_sessions, ga4Prev.engaged_sessions)).toFixed(1) + '%' : '—'} deltaUp={(d(ga4.engaged_sessions, ga4Prev.engaged_sessions) || 0) >= 0} comparison="vs prev"/>
          </div>
          <div style={{ background: 'var(--navy-surface)', border: '1px solid var(--navy-edge)', borderRadius: 14, padding: '18px 20px' }}>
            <div style={{ fontFamily: T.display, fontSize: 15, fontWeight: 700, color: fg, marginBottom: 12 }}>Sessions vs Users</div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
              <LegendDot color={gold} label="Sessions"/>
              <LegendDot color={teal} label="Users"/>
            </div>
            <MultiArea
              seriesA={safeA.length >= 2 ? safeA : [100, 120]}
              seriesB={safeB.length >= 2 ? safeB : [80, 95]}
              colorA={gold} colorB={teal}
              labelsX={safeA.length >= 4 ? ['W1', 'W2', 'W3', 'W4'] : []}
              w={800} h={130}
            />
          </div>
        </div>
      );
    }

    // Generic slide for meta, search, psi
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: T.display, fontSize: 22, color: fg, marginBottom: 8 }}>{cur.title}</div>
          <div style={{ fontFamily: T.body, fontSize: 15, color: muted }}>See details on the report page.</div>
        </div>
      </div>
    );
  };
```

Replace with:

```jsx
    // Non-summary slides: render widgets from canvas layout filtered by source
    const SLIDE_COLORS = {
      google: { accent: blue,      bg: 'rgba(66,133,244,.1)'  },
      meta:   { accent: violet,    bg: 'rgba(112,0,255,.1)'   },
      ga4:    { accent: gold,      bg: 'rgba(248,180,0,.1)'   },
      search: { accent: '#0EA5E9', bg: 'rgba(14,165,233,.1)'  },
      psi:    { accent: '#16A34A', bg: 'rgba(22,163,74,.1)'   },
    };
    const { accent = teal, bg = 'rgba(0,194,184,.1)' } = SLIDE_COLORS[cur.id] || {};
    const sourceId = cur.id === 'psi' ? 'pagespeed' : cur.id; // slide id 'psi' maps to widget source 'pagespeed'
    const slideWidgets = (layouts?.rows || []).flat().filter(w => w.source === sourceId);
    const widgetMap = buildUniversalMap(p, widgetConfigs, layouts, null, psiUrl, psiApiKey, null);

    if (slideWidgets.length === 0) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: T.display, fontSize: 18, color: fg, marginBottom: 8 }}>Belum ada widget</div>
            <div style={{ fontFamily: T.body, fontSize: 14, color: muted }}>Tambahkan widget {cur.title} dari editor laporan.</div>
          </div>
        </div>
      );
    }

    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <span style={{ fontFamily: T.mono, fontSize: 12, color: accent, background: bg, padding: '3px 10px', borderRadius: 4, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 600 }}>{cur.title}</span>
          <span style={{ fontFamily: T.mono, fontSize: 12, color: muted, textTransform: 'uppercase', letterSpacing: '.12em', fontWeight: 600 }}>Periode · {p.labelLong}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {slideWidgets.map(w => (
            <div key={w.id}>{widgetMap[w.id]}</div>
          ))}
        </div>
      </div>
    );
  };
```

- [ ] **Step 3: Pass new props at the `PresentMode` call site**

Find (lines 5697–5703):
```jsx
      {showPresent && p && (
        <PresentMode
          client={client}
          p={p}
          isMock={_isMock}
          onExit={() => setShowPresent(false)}
        />
      )}
```

Replace with:
```jsx
      {showPresent && p && (
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
      )}
```

- [ ] **Step 4: Commit**

```bash
git add app/assets/components/screen-report.jsx
git commit -m "fix: present mode reads canvas widget layout instead of hardcoded slides"
```

---

### Task 3: Bug 5 — New member status stays "pending" after invite

**Files:**
- Modify: `app/assets/components/screen-access.jsx` (~line 1070)

The Supabase `team_members` table has a column DEFAULT of `'pending'` which overrides the `'active'` value sent in the insert. The response from Supabase contains the stored value (`'pending'`), which the UI then displays. Fix: force `status: 'active'` when building the local user object from the Supabase response.

- [ ] **Step 1: Force `status: 'active'` in the invite response handler**

Find (line ~1070):
```js
      if (data) { addedUser = _rowToUser(data); setUsers(prev => [...prev, addedUser]); }
```

Replace with:
```js
      if (data) { addedUser = _rowToUser({ ...data, status: 'active' }); setUsers(prev => [...prev, addedUser]); }
```

- [ ] **Step 2: Commit**

```bash
git add app/assets/components/screen-access.jsx
git commit -m "fix: force status active on invite instead of using Supabase default"
```

---

### Task 4: Bump versions and push

**Files:**
- Modify: `app/index.html`

- [ ] **Step 1: Bump version strings**

In `app/index.html`, make these two changes:

Change:
```html
<script type="text/babel" src="assets/components/screen-report.jsx?v=107"></script>
```
To:
```html
<script type="text/babel" src="assets/components/screen-report.jsx?v=108"></script>
```

Change:
```html
<script type="text/babel" src="assets/components/screen-access.jsx?v=8"></script>
```
To:
```html
<script type="text/babel" src="assets/components/screen-access.jsx?v=9"></script>
```

- [ ] **Step 2: Commit and push**

```bash
git add app/index.html
git commit -m "chore: bump screen-report v108, screen-access v9"
git push origin main
```

Expected: Vercel auto-deploys within ~30 seconds.
