// Reportive — Dashboard with 4 swappable slots.
// Each slot picks a card from window.CARDS by id. Dashboard exposes the
// Tweaks panel via the host postMessage protocol so the user can cycle
// variants live; the tokens are stored in the EDITMODE block in
// Reportive.html so they persist across reloads.
//
// Slot taxonomy:
//   slotA → hero row           (prefers w:4)  — narrative hero / highlights / big chart
//   slotB → secondary row      (prefers w:4)  — KPI strip / compare / analyst note
//   slotC → left column chart  (prefers w:2/3)
//   slotD → right column card  (prefers w:2)

const DASHBOARD_SLOT_DEFAULTS = {
  slotA: 'narrative-hero',
  slotB: 'kpi-strip',
  slotC: 'chart-area',
  slotD: 'chart-donut',
  slotE: 'table-channels',
  slotF: 'narrative-note',
};

const SlotShell = ({ label, slotKey, cardId, onSwap, editMode, children }) => (
  <div style={{ position: 'relative' }}>
    {editMode && (
      <div style={{ position: 'absolute', top: -10, left: 12, zIndex: 5, display: 'flex', gap: 6, alignItems: 'center' }}>
        <span style={{ padding: '2px 8px', background: '#00C2B8', color: '#0C182C', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</span>
        <span style={{ padding: '2px 8px', background: 'rgba(12,24,44,.95)', color: '#FCFCFC', border: '1px solid var(--navy-edge)', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.05em' }}>{cardId}</span>
      </div>
    )}
    <div style={{ outline: editMode ? '1px dashed rgba(0,194,184,.45)' : 'none', outlineOffset: 4, borderRadius: 12 }}>
      {children}
    </div>
  </div>
);

const ScreenDashboard = ({ slots = DASHBOARD_SLOT_DEFAULTS, editMode = false, onSwap = () => {} }) => {
  const byId = React.useMemo(() => Object.fromEntries(window.CARDS.map(c => [c.id, c])), []);
  const render = (slotKey) => {
    const card = byId[slots[slotKey]] || byId[DASHBOARD_SLOT_DEFAULTS[slotKey]];
    return card ? card.render() : null;
  };
  return (
    <div style={{ display: 'flex', height: '100%', background: 'var(--navy-base)', fontFamily: 'var(--font-body)', position: 'relative' }}>
      <RSidebar active="dashboard"/>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
        <RFlare intensity={0.35}/>
        <RTopBar title="Marketing Performance" subtitle="PT Kopi Senja Nusantara · Client workspace" period="Mar 1 – 31, 2025"/>
        <div style={{ flex: 1, overflow: 'auto', padding: 24, position: 'relative', zIndex: 1 }}>

          <div style={{ marginBottom: 16 }}>
            <SlotShell label="Slot A" slotKey="slotA" cardId={slots.slotA} editMode={editMode}>{render('slotA')}</SlotShell>
          </div>

          <div style={{ marginBottom: 16 }}>
            <SlotShell label="Slot B" slotKey="slotB" cardId={slots.slotB} editMode={editMode}>{render('slotB')}</SlotShell>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14, marginBottom: 16 }}>
            <SlotShell label="Slot C" slotKey="slotC" cardId={slots.slotC} editMode={editMode}>{render('slotC')}</SlotShell>
            <SlotShell label="Slot D" slotKey="slotD" cardId={slots.slotD} editMode={editMode}>{render('slotD')}</SlotShell>
          </div>

          <div style={{ marginBottom: 16 }}>
            <SlotShell label="Slot E" slotKey="slotE" cardId={slots.slotE} editMode={editMode}>{render('slotE')}</SlotShell>
          </div>

          <div>
            <SlotShell label="Slot F" slotKey="slotF" cardId={slots.slotF} editMode={editMode}>{render('slotF')}</SlotShell>
          </div>

        </div>
      </div>
    </div>
  );
};

Object.assign(window, { ScreenDashboard, DASHBOARD_SLOT_DEFAULTS });
