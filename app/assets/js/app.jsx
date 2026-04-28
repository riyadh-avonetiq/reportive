// Reportive · App Shell
// ─────────────────────────────────────────────────────────────────
// Wires chrome (sidebar, top bar with account switcher + date picker + edit
// toggle + PDF export), Tweaks panel for slot swap, slot persistence to
// localStorage per-account, and a tiny view router (?view=library|canvas).
//
// Replaces the prototype's hard-coded RSidebar / RTopBar with context-driven
// versions so the sidebar footer shows the current admin and the topbar
// shows the live period / account.

const { useState, useEffect, useMemo, useCallback, useRef } = React;
const { LiveProvider, useLive, fmt } = window.LIVE;

// ── Auth gate (re-check) ────────────────────────────────────────
const ROLE = sessionStorage.getItem('avo_role') || 'guest';
const IS_ADMIN = ROLE === 'admin';

// ── Slot-swap persistence ───────────────────────────────────────
// Keyed per-account so each workspace can have its own dashboard layout.
const slotsKey = account => `avo_slots:${account || '__all__'}`;
const loadSlots = account => {
  try {
    const raw = localStorage.getItem(slotsKey(account));
    if (raw) return { ...window.DASHBOARD_SLOT_DEFAULTS, ...JSON.parse(raw) };
  } catch {}
  return { ...window.DASHBOARD_SLOT_DEFAULTS };
};
const saveSlots = (account, slots) => {
  try { localStorage.setItem(slotsKey(account), JSON.stringify(slots)); } catch {}
};

// ─────────────────────────────────────────────────────────────────
// Top bar: account switcher · date picker · edit · export
// ─────────────────────────────────────────────────────────────────
const Caret = () => <svg width="9" height="9" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 12 12"><path d="M2 4l4 4 4-4"/></svg>;

function AccountSwitcher() {
  const live = useLive();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const close = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);
  if (!live) return null;
  const cur = live.account || 'All accounts';
  const opts = ['', ...(live.accounts || [])];
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={pillBtn}>
        <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M3 21v-2a6 6 0 0118 0v2"/></svg>
        {cur}
        <Caret/>
      </button>
      {open && (
        <div style={dropdown}>
          <div style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', borderBottom: '1px solid var(--navy-edge)' }}>Account</div>
          {opts.map(o => (
            <button key={o || '__all__'} onClick={() => { live.setAccount(o); setOpen(false); }} style={dropdownItem(o === live.account)}>
              {o || 'All accounts'}
              {o === live.account && <span style={{ marginLeft: 'auto', color: '#00C2B8' }}>✓</span>}
            </button>
          ))}
          {opts.length === 1 && <div style={{ padding: 12, fontSize: 11, color: 'var(--text-muted)' }}>No additional accounts found in ads_data.</div>}
        </div>
      )}
    </div>
  );
}

function PeriodPicker() {
  const live = useLive();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const close = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);
  if (!live || !live.periods.length) {
    return <div style={pillBtn}><span style={{ color: 'var(--text-muted)' }}>No data</span></div>;
  }
  const current = live.periods.find(p => p.key === live.period) || live.periods[0];
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={pillBtn}>
        <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
        {current.labelLong}
        <Caret/>
      </button>
      {open && (
        <div style={dropdown}>
          <div style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', borderBottom: '1px solid var(--navy-edge)' }}>Period</div>
          {live.periods.map(p => (
            <button key={p.key} onClick={() => { live.setPeriod(p.key); setOpen(false); }} style={dropdownItem(p.key === live.period)}>
              {p.labelLong}
              {p.key === live.period && <span style={{ marginLeft: 'auto', color: '#00C2B8' }}>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const pillBtn = {
  padding: '6px 12px', background: 'var(--navy-surface)', border: '1px solid var(--navy-edge)', borderRadius: 8,
  fontFamily: 'var(--font-mono)', fontSize: 11, color: '#FCFCFC',
  display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer',
};
const dropdown = {
  position: 'absolute', top: 'calc(100% + 6px)', right: 0, minWidth: 240, maxWidth: 360, maxHeight: 320, overflow: 'auto',
  background: 'rgba(12,24,44,.97)', border: '1px solid var(--navy-edge)', borderRadius: 10, zIndex: 50,
  boxShadow: '0 16px 40px rgba(0,0,0,.5)', backdropFilter: 'blur(20px)', padding: '4px 0',
};
const dropdownItem = active => ({
  display: 'flex', alignItems: 'center', width: '100%', padding: '8px 12px', background: active ? 'rgba(0,194,184,.08)' : 'transparent',
  border: 'none', color: active ? '#FCFCFC' : 'var(--text-secondary)', fontFamily: 'var(--font-body)', fontSize: 12.5,
  cursor: 'pointer', textAlign: 'left',
});

// ─────────────────────────────────────────────────────────────────
// Top bar (replaces RTopBar mock with live + functional buttons)
// ─────────────────────────────────────────────────────────────────
const PAGE_TITLES = {
  home:         ['Home',                  'Client workspaces · Avonetiq'],
  dashboard:    ['Marketing Performance', 'Overview · all channels'],
  campaigns:    ['Campaigns',             'Paid media · Google Ads & Meta'],
  seo:          ['SEO & Organic',         'Search Console · organic traffic'],
  audience:     ['Audience',              'GA4 · users & behaviour'],
  reports:      ['Reports',              'Scheduled & exported reports'],
  integrations: ['Integrations',         'Data sources · Supabase sync'],
  access:       ['Access Control',        'Team members & permissions'],
  templates:    ['Report Templates',      'Reusable report designs'],
};

function LiveTopBar({ editMode, onToggleEdit, view }) {
  const live = useLive();
  const [pageTitle, pageSub] = PAGE_TITLES[view] || PAGE_TITLES.dashboard;
  const subtitle = live?.account ? `${live.account} · ${pageSub}` : `Client workspace · Avonetiq`;
  const onExport = useCallback(() => { window.print(); }, []);
  return (
    <header style={{ height: 80, minHeight: 80, borderBottom: '1px solid var(--navy-edge)', background: 'rgba(12,24,44,.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', padding: '0 24px', gap: 12, position: 'relative', zIndex: 30 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: '#FCFCFC' }}>{pageTitle}</div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)' }}>{subtitle}</div>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <AccountSwitcher/>
        <PeriodPicker/>
        {IS_ADMIN && (
          <button onClick={onToggleEdit} title="Edit dashboard layout (admin)" style={{
            padding: '6px 12px', background: editMode ? 'rgba(0,194,184,.18)' : 'var(--navy-surface)', border: `1px solid ${editMode ? '#00C2B8' : 'var(--navy-edge)'}`, borderRadius: 8,
            fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 600, color: editMode ? '#00C2B8' : '#FCFCFC',
            cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
          }}>
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            {editMode ? 'Editing' : 'Edit'}
          </button>
        )}
        <button onClick={onExport} style={{ padding: '6px 14px', background: 'linear-gradient(135deg,#00C2B8,#009E96)', color: '#0C182C', border: 'none', borderRadius: 8, fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,194,184,.25)' }}>Export PDF</button>
        <div style={{ width: 1, height: 20, background: 'var(--navy-edge)' }} />
        <div title={ROLE} style={{ width: 32, height: 32, borderRadius: '50%', background: IS_ADMIN ? 'linear-gradient(135deg,#00C2B8,#7000FF)' : 'linear-gradient(135deg,#475569,#1F2937)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, color: '#0C182C' }}>{IS_ADMIN ? 'AD' : 'GU'}</div>
      </div>
    </header>
  );
}

// ─────────────────────────────────────────────────────────────────
// Sidebar (extends RSidebar style; footer reflects role and lets you sign out)
// ─────────────────────────────────────────────────────────────────
function LiveSidebar({ active, onNavigate }) {
  const mainItems = [
    ['home',          'Home',          'M3 12l9-9 9 9v9a2 2 0 01-2 2h-4v-7h-6v7H5a2 2 0 01-2-2z'],
    ['dashboard',     'Dashboard',     'M4 6h16M4 12h16M4 18h7'],
    ['campaigns',     'Campaigns',     'M3 3h18v4H3zM3 10h18v4H3zM3 17h18v4H3z'],
    ['seo',           'SEO & Organic', 'M11 4a7 7 0 107 7M21 21l-4-4'],
    ['audience',      'Audience',      'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75'],
    ['reports',       'Reports',       'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8'],
    ['integrations',  'Integrations',  'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z'],
  ];
  const bottomItems = IS_ADMIN ? [
    ['access',        'Access',        'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'],
    ['templates',     'Templates',     'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z'],
  ] : [];
  const items = mainItems;
  const signOut = () => { sessionStorage.removeItem('avo_role'); window.location.replace('login.html'); };
  return (
    <aside style={{ width: 240, minWidth: 240, background: 'rgba(10,20,38,.93)', borderRight: '1px solid var(--navy-edge)', display: 'flex', flexDirection: 'column', height: '100%', backdropFilter: 'blur(24px)' }}>
      <div style={{ height: 80, minHeight: 80, padding: '0 20px', borderBottom: '1px solid var(--navy-edge)', display: 'flex', alignItems: 'center', gap: 10, boxSizing: 'border-box' }}>
        <img src="assets/logo-mark-new.png" style={{ width: 62, height: 62 }} />
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: '#FCFCFC', letterSpacing: '-0.01em' }}>Reportive</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>by Avonetiq</div>
        </div>
      </div>
      <div style={{ padding: 12, flex: 1, overflow: 'auto' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', padding: '8px 8px 6px' }}>Workspace</div>
        {items.map(([k, label, d]) => (
          <button key={k} onClick={() => onNavigate(k)} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 8, marginBottom: 2, width: '100%',
            background: k === active ? 'linear-gradient(90deg,rgba(0,194,184,.14),rgba(0,194,184,.02))' : 'transparent',
            borderTop: 'none', borderRight: 'none', borderBottom: 'none',
            borderLeft: k === active ? '2px solid #00C2B8' : '2px solid transparent',
            color: k === active ? '#FCFCFC' : 'var(--text-secondary)',
            fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: k === active ? 600 : 500, cursor: 'pointer', textAlign: 'left',
          }}>
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d={d}/></svg>
            {label}
          </button>
        ))}
        {bottomItems.length > 0 && (
          <>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', padding: '12px 8px 6px', marginTop: 8, borderTop: '1px solid var(--navy-edge)' }}>Admin</div>
            {bottomItems.map(([k, label, d]) => (
              <button key={k} onClick={() => onNavigate(k)} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 8, marginBottom: 2, width: '100%',
                background: k === active ? 'linear-gradient(90deg,rgba(0,194,184,.14),rgba(0,194,184,.02))' : 'transparent',
                borderTop: 'none', borderRight: 'none', borderBottom: 'none',
                borderLeft: k === active ? '2px solid #00C2B8' : '2px solid transparent',
                color: k === active ? '#FCFCFC' : 'var(--text-secondary)',
                fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: k === active ? 600 : 500, cursor: 'pointer', textAlign: 'left',
              }}>
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d={d}/></svg>
                {label}
              </button>
            ))}
          </>
        )}
      </div>
      <div style={{ padding: 12, borderTop: '1px solid var(--navy-edge)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 8px', borderRadius: 8, background: 'var(--navy-surface)' }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: IS_ADMIN ? 'linear-gradient(135deg,#00C2B8,#7000FF)' : 'linear-gradient(135deg,#475569,#1F2937)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, color: '#0C182C' }}>{IS_ADMIN ? 'AD' : 'GU'}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: '#FCFCFC', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{IS_ADMIN ? 'Admin' : 'Guest'}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{IS_ADMIN ? 'Account Manager' : 'Read-only'}</div>
          </div>
          <button onClick={signOut} title="Sign out" style={{ padding: 6, background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
          </button>
        </div>
      </div>
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────────
// Tweaks panel (slot swap)
// ─────────────────────────────────────────────────────────────────
function TweaksPanel({ slots, setSlots, onClose, onResetAll }) {
  const byCat = window.CATS.map(c => ({ ...c, items: window.CARDS.filter(x => x.cat === c.id) }));
  const set = (k, id) => setSlots({ ...slots, [k]: id });
  return (
    <div style={{
      position: 'fixed', right: 20, bottom: 20, width: 290,
      background: 'rgba(12,24,44,.97)', border: '1px solid var(--navy-edge)', borderRadius: 12,
      backdropFilter: 'blur(20px)', zIndex: 100, overflow: 'hidden',
      boxShadow: '0 24px 60px rgba(0,0,0,.5), 0 0 0 1px rgba(0,194,184,.12)',
      fontFamily: 'var(--font-body)', color: '#FCFCFC',
    }}>
      <div style={{ padding: 12, borderBottom: '1px solid var(--navy-edge)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 12.5, fontWeight: 700 }}>Tweaks · Slots</h3>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', marginTop: 2, letterSpacing: '0.07em' }}>{window.CARDS.length} variants · 6 slots</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={onResetAll} style={twBtn}>Reset</button>
          <button onClick={onClose} style={twBtn}>Close</button>
        </div>
      </div>
      <div style={{ padding: '10px 14px', maxHeight: 380, overflow: 'auto' }}>
        {['slotA', 'slotB', 'slotC', 'slotD', 'slotE', 'slotF'].map(k => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 7 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#00C2B8', width: 42, flexShrink: 0 }}>{k.replace('slot', 'Slot ')}</span>
            <select value={slots[k]} onChange={e => set(k, e.target.value)} style={{ flex: 1, minWidth: 0, background: 'var(--navy-surface)', border: '1px solid var(--navy-edge)', borderRadius: 6, color: '#FCFCFC', padding: '5px 7px', fontFamily: 'var(--font-body)', fontSize: 11, outline: 'none' }}>
              {byCat.map(cat => (
                <optgroup key={cat.id} label={cat.title}>
                  {cat.items.map(it => <option key={it.id} value={it.id}>{it.title}{it.live ? ' · live' : ''}</option>)}
                </optgroup>
              ))}
            </select>
          </div>
        ))}
        <div style={{ paddingTop: 10, borderTop: '1px solid var(--navy-edge)', fontFamily: 'var(--font-body)', fontSize: 10.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>
          Layout saves automatically per account. <span style={{ color: '#00C2B8' }}>Live</span> cards read from Supabase.
        </div>
      </div>
    </div>
  );
}
const twBtn = { padding: '5px 10px', background: 'var(--navy-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--navy-edge)', borderRadius: 6, fontFamily: 'var(--font-display)', fontSize: 10.5, fontWeight: 600, cursor: 'pointer' };

// ─────────────────────────────────────────────────────────────────
// Dashboard (a context-aware ScreenDashboard, replaces the prototype shell)
// ─────────────────────────────────────────────────────────────────
function DashboardView({ slots, editMode, editorCardId, setEditorCardId }) {
  const live = useLive();
  const byId = useMemo(() => Object.fromEntries(window.CARDS.map(c => [c.id, c])), []);
  const render = (slotKey) => {
    const card = byId[slots[slotKey]] || byId[window.DASHBOARD_SLOT_DEFAULTS[slotKey]];
    return card ? card.render() : null;
  };

  const SlotShell = ({ label, slotKey, children }) => {
    const cardId = slots[slotKey];
    const isActive = editMode && editorCardId === cardId;
    return (
      <div
        style={{ position: 'relative', cursor: editMode ? 'pointer' : 'default' }}
        onClick={editMode ? () => setEditorCardId(isActive ? null : cardId) : undefined}
      >
        {editMode && (
          <div style={{ position: 'absolute', top: -10, left: 12, zIndex: 5, display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ padding: '2px 8px', background: '#00C2B8', color: '#0C182C', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</span>
            <span style={{ padding: '2px 8px', background: 'rgba(12,24,44,.95)', color: '#FCFCFC', border: '1px solid var(--navy-edge)', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.05em' }}>{cardId}</span>
          </div>
        )}
        <div style={{
          outline: editMode ? `1px dashed ${isActive ? '#00C2B8' : 'rgba(0,194,184,.35)'}` : 'none',
          outlineOffset: 4, borderRadius: 12,
          boxShadow: isActive ? '0 0 0 3px rgba(0,194,184,.15)' : 'none',
          transition: 'box-shadow .15s',
        }}>
          {children}
        </div>
      </div>
    );
  };

  return (
    <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>
      {/* Main scroll area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
        <RFlare intensity={0.35}/>
        <div style={{ position: 'relative', zIndex: 1, flex: 1, overflow: 'auto', padding: 24 }}>
          {live?.loading && (
            <div style={{ marginBottom: 16, padding: '8px 12px', background: 'rgba(0,194,184,.08)', border: '1px solid rgba(0,194,184,.2)', borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 10.5, color: '#00C2B8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Syncing data…</div>
          )}
          <div style={{ marginBottom: 16 }}><SlotShell label="Slot A" slotKey="slotA">{render('slotA')}</SlotShell></div>
          <div style={{ marginBottom: 16 }}><SlotShell label="Slot B" slotKey="slotB">{render('slotB')}</SlotShell></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14, marginBottom: 16 }}>
            <SlotShell label="Slot C" slotKey="slotC">{render('slotC')}</SlotShell>
            <SlotShell label="Slot D" slotKey="slotD">{render('slotD')}</SlotShell>
          </div>
          <div style={{ marginBottom: 16 }}><SlotShell label="Slot E" slotKey="slotE">{render('slotE')}</SlotShell></div>
          <div><SlotShell label="Slot F" slotKey="slotF">{render('slotF')}</SlotShell></div>
        </div>
      </div>

      {/* Card Properties panel — slides in from right */}
      {editMode && editorCardId && window.CardEditorPanel && (
        <div style={{
          width: 320, minWidth: 320, height: '100%', overflow: 'auto',
          borderLeft: '1px solid var(--navy-edge)',
          background: 'rgba(10,18,34,.97)',
          backdropFilter: 'blur(20px)',
          animation: 'slideInRight .18s ease',
        }}>
          <CardEditorPanel cardId={editorCardId} onClose={() => setEditorCardId(null)}/>
        </div>
      )}
      <style>{`@keyframes slideInRight { from { transform: translateX(20px); opacity: 0 } to { transform: translateX(0); opacity: 1 } }`}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// View router (?view=dashboard|library|canvas)
// ─────────────────────────────────────────────────────────────────
function getView() {
  const u = new URL(window.location.href);
  const v = u.searchParams.get('view') || 'home';
  const valid = ['home', 'dashboard', 'campaigns', 'seo', 'audience', 'reports', 'integrations', 'access', 'templates', 'library', 'canvas'];
  return valid.includes(v) ? v : 'home';
}
function setView(v) {
  const u = new URL(window.location.href);
  u.searchParams.set('view', v);
  window.history.replaceState(null, '', u);
}

// ─────────────────────────────────────────────────────────────────
// Root App
// ─────────────────────────────────────────────────────────────────
function App() {
  const [view, setViewState] = useState(getView());
  const [editMode, setEditMode] = useState(false);
  const [editorCardId, setEditorCardId] = useState(null);
  const live = useLive();
  const account = live?.account || '';

  // Slots are keyed per account so each workspace has its own layout
  const [slots, setSlotsRaw] = useState(() => loadSlots(account));
  useEffect(() => { setSlotsRaw(loadSlots(account)); }, [account]);
  const setSlots = useCallback((next) => {
    setSlotsRaw(next);
    saveSlots(account, next);
  }, [account]);

  const navigate = useCallback((v) => { setView(v); setViewState(v); }, []);

  // Close editor panel when leaving dashboard or edit mode
  useEffect(() => { if (!editMode || view !== 'dashboard') setEditorCardId(null); }, [editMode, view]);

  // Page placeholders for nav items that don't have a dedicated view yet
  const PlaceholderPage = ({ title, icon }) => (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20, position: 'relative', overflow: 'hidden' }}>
      <RFlare intensity={0.2}/>
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: 40, background: 'var(--navy-surface)', border: '1px solid var(--navy-edge)', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,.25)' }}>
        <div style={{ width: 56, height: 56, background: 'rgba(0,194,184,.1)', border: '1px solid rgba(0,194,184,.2)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="26" height="26" fill="none" stroke="#00C2B8" strokeWidth="1.6" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d={icon}/></svg>
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: '#FCFCFC', textAlign: 'center' }}>{title}</div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)', marginTop: 6, textAlign: 'center' }}>This section is under development</div>
        </div>
        <div style={{ padding: '6px 14px', background: 'rgba(0,194,184,.1)', border: '1px solid rgba(0,194,184,.25)', borderRadius: 20, fontFamily: 'var(--font-mono)', fontSize: 10, color: '#00C2B8', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Coming soon</div>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', height: '100%', background: 'var(--navy-base)', fontFamily: 'var(--font-body)' }}>
      {view !== 'home' && <LiveSidebar active={view} onNavigate={navigate}/>}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        {/* LiveTopBar only for workspace views — home/access/templates have their own headers */}
        {!['home', 'access', 'templates'].includes(view) && (
          <LiveTopBar editMode={editMode && view === 'dashboard'} onToggleEdit={() => setEditMode(e => !e)} view={view}/>
        )}
        {(() => {
          const HomeScreen = window.ScreenHome;
          const AccessScreen = window.ScreenAccess;
          const TemplatesScreen = window.ScreenTemplates;
          return <>
            {view === 'home'         && (HomeScreen      ? <HomeScreen onOpenClient={() => navigate('dashboard')} onNavigate={navigate}/> : <PlaceholderPage title="Home"          icon="M3 12l9-9 9 9v9a2 2 0 01-2 2h-4v-7h-6v7H5a2 2 0 01-2-2z"/>)}
            {view === 'dashboard'    && <DashboardView slots={slots} editMode={editMode} editorCardId={editorCardId} setEditorCardId={setEditorCardId}/>}
            {view === 'campaigns'    && <PlaceholderPage title="Campaigns"     icon="M3 3h18v4H3zM3 10h18v4H3zM3 17h18v4H3z"/>}
            {view === 'seo'          && <PlaceholderPage title="SEO & Organic" icon="M11 4a7 7 0 107 7M21 21l-4-4"/>}
            {view === 'audience'     && <PlaceholderPage title="Audience"      icon="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>}
            {view === 'reports'      && <PlaceholderPage title="Reports"       icon="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6"/>}
            {view === 'integrations' && <PlaceholderPage title="Integrations"  icon="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"/>}
            {view === 'access'       && (AccessScreen    ? <AccessScreen/>    : <PlaceholderPage title="Access Control" icon="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>)}
            {view === 'templates'    && (TemplatesScreen ? <TemplatesScreen/> : <PlaceholderPage title="Templates"      icon="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/>)}
          </>;
        })()}
      </div>
      {view === 'dashboard' && editMode && IS_ADMIN && (
        <TweaksPanel
          slots={slots}
          setSlots={setSlots}
          onClose={() => { setEditMode(false); setEditorCardId(null); }}
          onResetAll={() => setSlots({ ...window.DASHBOARD_SLOT_DEFAULTS })}
        />
      )}
    </div>
  );
}

// Lightweight canvas view: lays out the prototype's design-canvas content
// using DesignCanvas + DCSection + DCArtboard from the handoff. Heavier than
// the dashboard, so we render it lazily.
function CanvasView() {
  if (!window.DesignCanvas) return <div style={{ padding: 32, color: 'var(--text-muted)' }}>Loading design canvas…</div>;
  const DC  = window.DesignCanvas;
  const DCS = window.DCSection;
  const DCA = window.DCArtboard;
  return (
    <div style={{ flex: 1, overflow: 'hidden' }}>
      <DC>
        <DCS id="main" title="Main · Dashboard" subtitle="Live shell with 6 swappable slots.">
          <DCA id="dashboard" label="01 · Dashboard (live)" width={1360} height={1180}>
            <DashboardArtboard/>
          </DCA>
        </DCS>
        <DCS id="library" title="Card Library" subtitle="26 variants across 7 categories">
          <DCA id="sticker-sheet" label="Sticker sheet · All variants" width={1400} height={2800}>
            <StickerSheet/>
          </DCA>
        </DCS>
        <DCS id="categories" title="Category deep-dives">
          {window.CATS.map((cat, i) => (
            <DCA key={cat.id} id={`cat-${cat.id}`} label={`${String(i+1).padStart(2,'0')} · ${cat.title}`} width={1400} height={1100}>
              <CategorySheet catId={cat.id}/>
            </DCA>
          ))}
        </DCS>
        <DCS id="auth" title="Reference · Authentication">
          <DCA id="login" label="Login · Welcome back" width={520} height={720}>
            <ScreenLogin/>
          </DCA>
        </DCS>
      </DC>
    </div>
  );
}
function DashboardArtboard() {
  // Used inside the canvas view — stand-in dashboard with default slots, no edit mode chrome
  const slots = window.DASHBOARD_SLOT_DEFAULTS;
  const byId = Object.fromEntries(window.CARDS.map(c => [c.id, c]));
  const render = k => byId[slots[k]]?.render?.() ?? null;
  return (
    <div style={{ display: 'flex', height: '100%', background: 'var(--navy-base)' }}>
      <RSidebar active="dashboard"/>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
        <RFlare intensity={0.35}/>
        <RTopBar title="Marketing Performance" subtitle="Sample workspace" period="Mar 2025"/>
        <div style={{ flex: 1, overflow: 'auto', padding: 24, position: 'relative', zIndex: 1 }}>
          <div style={{ marginBottom: 16 }}>{render('slotA')}</div>
          <div style={{ marginBottom: 16 }}>{render('slotB')}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14, marginBottom: 16 }}>
            {render('slotC')}{render('slotD')}
          </div>
          <div style={{ marginBottom: 16 }}>{render('slotE')}</div>
          <div>{render('slotF')}</div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Mount
// ─────────────────────────────────────────────────────────────────
function Root() {
  // Hide the boot splash on first paint
  useEffect(() => {
    const el = document.getElementById('boot-splash');
    if (!el) return;
    requestAnimationFrame(() => {
      el.classList.add('gone');
      setTimeout(() => el.remove(), 400);
    });
  }, []);
  return (
    <LiveProvider>
      <App/>
    </LiveProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<Root/>);
