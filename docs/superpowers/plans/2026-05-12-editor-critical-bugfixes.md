# Editor Critical Bug Fixes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 5 critical bugs in the Card Editor panel that cause broken UI, non-functional controls, and misleading hardcoded data.

**Architecture:** All changes are isolated to `card-editor.jsx`. No new files needed. Each fix is an independent, self-contained edit. No backend or data-bridge changes required — these are all pure UI/state bugs.

**Tech Stack:** React (browser-based JSX via Babel), no build step, live in `app/assets/components/card-editor.jsx`.

---

## File Map

| File | Changes |
|------|---------|
| `app/assets/components/card-editor.jsx` | All 5 bug fixes |

---

### Task 1: Fix label "HALUS" → "AKTIF" di Pages Tab

**Files:**
- Modify: `app/assets/components/card-editor.jsx:1105`

**Context:** `PagesTab` renders a badge on the currently-active page. The badge reads `HALUS` (Indonesian: fine/smooth) — a typo that should be `AKTIF` (active).

- [ ] **Step 1: Locate dan fix typo**

Di [`card-editor.jsx:1105`](app/assets/components/card-editor.jsx#L1105), ubah:

```jsx
// BEFORE
? <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: EP.teal, padding: '2px 7px', background: 'rgba(0,194,184,.1)', borderRadius: 4, letterSpacing: '0.08em' }}>HALUS</span>
```

menjadi:

```jsx
// AFTER
? <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: EP.teal, padding: '2px 7px', background: 'rgba(0,194,184,.1)', borderRadius: 4, letterSpacing: '0.08em' }}>AKTIF</span>
```

- [ ] **Step 2: Verifikasi di browser**

Buka report → Edit → klik tab CardEditor → tab "Pages". Badge halaman aktif sekarang menampilkan `AKTIF`.

- [ ] **Step 3: Commit**

```bash
git add app/assets/components/card-editor.jsx
git commit -m "fix: correct Pages tab badge label from HALUS to AKTIF"
```

---

### Task 2: Fix MetricsSelect — tambah state dan onChange

**Files:**
- Modify: `app/assets/components/card-editor.jsx:400-413` dan tempat `MetricsSelect` dipanggil

**Context:** `MetricsSelect` adalah stateless component dengan `value="spend"` hardcoded dan tidak ada `onChange`. Dropdown metric tidak melakukan apa-apa saat diubah.

`MetricsSelect` digunakan di: `SetupKPI` (line ~446) dan `SetupChart` (line ~461).

- [ ] **Step 1: Ubah MetricsSelect menjadi controlled component**

Di [`card-editor.jsx:400-413`](app/assets/components/card-editor.jsx#L400), ganti seluruh `MetricsSelect` dengan:

```jsx
const MetricsSelect = ({ state, setState }) => (
  <ESection label="Primary metric">
    <ESelect value={state.primaryMetric || 'spend'} onChange={v => setState({ ...state, primaryMetric: v })}
      options={[
        {value:'spend',label:'Total Spend'},
        {value:'impressions',label:'Impressions'},
        {value:'clicks',label:'Clicks'},
        {value:'ctr',label:'CTR'},
        {value:'conversions',label:'Conversions'},
        {value:'roas',label:'ROAS'},
        {value:'sessions',label:'Organic Sessions'},
        {value:'revenue',label:'Revenue'},
      ]}/>
  </ESection>
);
```

- [ ] **Step 2: Update pemanggil SetupKPI**

Di [`card-editor.jsx`](app/assets/components/card-editor.jsx) pada `SetupKPI`, ubah baris `<MetricsSelect/>` menjadi:

```jsx
<MetricsSelect state={state} setState={setState}/>
```

- [ ] **Step 3: Update pemanggil SetupChart**

Di `SetupChart`, ubah baris `<MetricsSelect/>` menjadi:

```jsx
<MetricsSelect state={state} setState={setState}/>
```

- [ ] **Step 4: Verifikasi di browser**

Buka editor → pilih widget KPI → Setup tab → ubah dropdown "Primary metric" → verifikasi nilai berubah (tidak kembali ke "Total Spend").

- [ ] **Step 5: Commit**

```bash
git add app/assets/components/card-editor.jsx
git commit -m "fix: make MetricsSelect a controlled component with state and onChange"
```

---

### Task 3: Fix Core Web Vitals checkboxes — uncontrolled → controlled

**Files:**
- Modify: `app/assets/components/card-editor.jsx:631-640`

**Context:** Checkboxes LCP, FID, CLS menggunakan `defaultChecked` (uncontrolled). Perubahan tidak tersimpan ke `state`, sehingga setiap re-render mengembalikan checkbox ke kondisi checked.

- [ ] **Step 1: Ganti `defaultChecked` dengan controlled state**

Di [`card-editor.jsx:631-640`](app/assets/components/card-editor.jsx#L631), ubah blok `{state.showCWV !== false && ...}` dari:

```jsx
{state.showCWV !== false && (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    {[['LCP', 'lcp'],['FID', 'fid'],['CLS', 'cls']].map(([label, key]) => (
      <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
        <input type="checkbox" defaultChecked style={{ width: 16, height: 16, cursor: 'pointer' }}/>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: EP.fg }}>{label}</span>
      </label>
    ))}
  </div>
)}
```

menjadi:

```jsx
{state.showCWV !== false && (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    {[['LCP', 'lcp'],['FID', 'fid'],['CLS', 'cls']].map(([label, key]) => (
      <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={state['cwv_' + key] !== false}
          onChange={e => setState({ ...state, ['cwv_' + key]: e.target.checked })}
          style={{ width: 16, height: 16, cursor: 'pointer' }}
        />
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: EP.fg }}>{label}</span>
      </label>
    ))}
  </div>
)}
```

State keys yang digunakan: `cwv_lcp`, `cwv_fid`, `cwv_cls` — default `true` (checked) karena `!== false`.

- [ ] **Step 2: Verifikasi di browser**

Buka editor → PageSpeed widget → Setup tab → uncheck "LCP" → tutup editor, buka lagi → verifikasi LCP tetap unchecked.

- [ ] **Step 3: Commit**

```bash
git add app/assets/components/card-editor.jsx
git commit -m "fix: convert Core Web Vitals checkboxes to controlled state"
```

---

### Task 4: Hapus akun hardcoded di DataSourceSection

**Files:**
- Modify: `app/assets/components/card-editor.jsx:352-364`

**Context:** `DataSourceSection` menampilkan dropdown "account" dengan 2 akun demo hardcoded (`PT Kopi Senja Nusantara`, `Brand Baru Co.`). Ini adalah bagian dari **old `CardEditorPanel`** (3-tab) yang masih tampil pada beberapa card type. Karena tidak ada akses ke `connectedSources` dari sini, solusi terbaik adalah ganti dropdown dengan teks informasi dan hanya tampilkan "All Accounts".

- [ ] **Step 1: Sederhanakan dropdown account**

Di [`card-editor.jsx:352-364`](app/assets/components/card-editor.jsx#L352), ganti blok `<div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>` dari:

```jsx
<div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
  <ESelect value={state.account || 'all'} onChange={v => setState({ ...state, account: v })}
    options={[{value:'all',label:'All Accounts'},{value:'kopi-senja',label:'PT Kopi Senja Nusantara'},{value:'baru',label:'Brand Baru Co.'}]}/>
  {(src === 'google' || src === 'meta') && (
    <>
      <ESelect value={state.campaignType || 'all'} onChange={v => setState({ ...state, campaignType: v })}
        options={[{value:'all',label:'All Types'},{value:'search',label:'Search'},{value:'display',label:'Display'},{value:'video',label:'Video'}]}/>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: EP.muted }}>
        ● {src === 'google' ? '8 active campaigns · 50.469 rows' : '5 active ad sets · 24.100 rows'}
      </div>
    </>
  )}
</div>
```

menjadi:

```jsx
<div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: EP.muted, padding: '6px 10px', background: EP.elevated, border: `1px solid ${EP.edge}`, borderRadius: 6 }}>
    Semua akun terhubung
  </div>
  {(src === 'google' || src === 'meta') && (
    <ESelect value={state.campaignType || 'all'} onChange={v => setState({ ...state, campaignType: v })}
      options={[{value:'all',label:'All Types'},{value:'search',label:'Search'},{value:'display',label:'Display'},{value:'video',label:'Video'}]}/>
  )}
</div>
```

- [ ] **Step 2: Verifikasi di browser**

Buka editor → pilih widget KPI → Setup tab → bagian "Data source" tidak lagi menampilkan akun demo hardcoded.

- [ ] **Step 3: Commit**

```bash
git add app/assets/components/card-editor.jsx
git commit -m "fix: remove hardcoded demo accounts from DataSourceSection"
```

---

### Task 5: Tandai FilterSection lama sebagai non-functional

**Files:**
- Modify: `app/assets/components/card-editor.jsx:369-396`

**Context:** `FilterSection` (old 3-tab CardEditorPanel) menerima `filters`/`setFilters` props dan merender UI filter yang tampak fungsional, tapi tidak ter-wire ke data rendering aktual. Menghapusnya sepenuhnya berisiko memecah kontrak props. Solusi: tambahkan label "Coming soon" dan disable aksi tambah filter, sehingga editor tidak mengira filter ini bekerja.

- [ ] **Step 1: Disable FilterSection dan tambah keterangan**

Di [`card-editor.jsx:369-396`](app/assets/components/card-editor.jsx#L369), ubah seluruh `FilterSection` dari:

```jsx
const FilterSection = ({ filters, setFilters }) => {
  const add = () => setFilters([...filters, { field: 'campaign', op: 'contains', val: '' }]);
  const remove = (i) => setFilters(filters.filter((_, j) => j !== i));
  return (
    <ESection label="Filter">
      <ELabel hint="active">Active filters</ELabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
        {filters.map((f, i) => (
          <div key={i} style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            <ESelect value={f.field} onChange={v => { const nf = [...filters]; nf[i] = { ...f, field: v }; setFilters(nf); }}
              options={[{value:'campaign',label:'Campaign'},{value:'device',label:'Device'},{value:'country',label:'Country'},{value:'status',label:'Status'}]}/>
            <ESelect value={f.op} onChange={v => { const nf = [...filters]; nf[i] = { ...f, op: v }; setFilters(nf); }}
              options={[{value:'contains',label:'contains'},{value:'is',label:'is'},{value:'not',label:'is not'}]}/>
            <input value={f.val} onChange={e => { const nf = [...filters]; nf[i] = { ...f, val: e.target.value }; setFilters(nf); }}
              placeholder="value"
              style={{ flex: 1, minWidth: 0, padding: '6px 8px', background: EP.elevated, border: `1px solid ${EP.edge}`, borderRadius: 5, color: EP.fg, fontFamily: 'var(--font-body)', fontSize: 11, outline: 'none' }}/>
            <button onClick={() => remove(i)} style={{ padding: '5px 6px', background: 'transparent', border: `1px solid ${EP.edge}`, borderRadius: 5, color: EP.muted, cursor: 'pointer', lineHeight: 1 }}>×</button>
          </div>
        ))}
      </div>
      <button onClick={add} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: 'transparent', border: `1px dashed ${EP.edge}`, borderRadius: 6, color: EP.muted, cursor: 'pointer', fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 600, width: '100%', justifyContent: 'center' }}>
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5.5 1v9M1 5.5h9"/></svg>
        Add filter
      </button>
    </ESection>
  );
};
```

menjadi:

```jsx
const FilterSection = ({ filters, setFilters }) => (
  <ESection label="Filter">
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: EP.muted, padding: '8px 10px', background: EP.elevated, border: `1px dashed ${EP.edge}`, borderRadius: 6, lineHeight: 1.5 }}>
      Filter per-widget tersedia di panel Setup baru (klik widget langsung di report).
    </div>
  </ESection>
);
```

- [ ] **Step 2: Verifikasi di browser**

Buka editor lama → Setup tab → bagian Filter tidak lagi menampilkan form filter yang tidak berfungsi, digantikan pesan informatif.

- [ ] **Step 3: Commit**

```bash
git add app/assets/components/card-editor.jsx
git commit -m "fix: replace non-functional FilterSection with informational message"
```

---

## Self-Review Checklist

- [x] **Semua 5 bug kritis** dari audit ter-cover dalam 5 task terpisah
- [x] **Tidak ada placeholder** — setiap step berisi kode aktual yang siap di-paste
- [x] **Konsistensi nama**: `state`/`setState` konsisten di semua task; key `cwv_lcp`, `cwv_fid`, `cwv_cls` konsisten antara write dan read (keduanya menggunakan `'cwv_' + key`)
- [x] **YAGNI**: Tidak ada refactoring di luar scope; tidak ada fitur baru
- [x] **Setiap task independent**: Task 1–5 bisa dikerjakan dalam urutan apapun
