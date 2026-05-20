// Shared chrome for Reportive dashboard artboards.
// Exposes: Sidebar, TopBar, PageFrame, FlareBackdrop, Chip, StatusDot,
// MetricCard, Card, Button, ChannelLogo, SparkLine, Donut, Bar.

const RSidebar = ({ active = 'dashboard' }) => {
  const items = [
    ['dashboard', 'Dashboard', 'M3 12l9-9 9 9v9a2 2 0 01-2 2h-4v-7h-6v7H5a2 2 0 01-2-2z'],
  ];
  return (
    <aside style={{ width: 240, minWidth: 240, background: 'rgba(10,20,38,.93)', borderRight: '1px solid var(--navy-edge)', display: 'flex', flexDirection: 'column', height: '100%', backdropFilter: 'blur(24px)', boxSizing: 'border-box' }}>
      <div style={{ height: 80, minHeight: 80, padding: '0 16px', borderBottom: '1px solid var(--navy-edge)', display: 'flex', alignItems: 'center', gap: 10, boxSizing: 'border-box', flexShrink: 0 }}>
        <img src="assets/logo-mark.png" style={{ width: 100, height: 100 }} />
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: '#FCFCFC', letterSpacing: '-0.01em' }}>Reportive</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>by Avonetiq</div>
        </div>
      </div>
      <div style={{ padding: 12, flex: 1 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', padding: '8px 8px 6px' }}>Workspace</div>
        {items.map(([k, label, d]) => (
          <div key={k} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 8, marginBottom: 2,
            background: k === active ? 'linear-gradient(90deg,rgba(0,194,184,.14),rgba(0,194,184,.02))' : 'transparent',
            borderLeft: k === active ? '2px solid var(--avo-teal)' : '2px solid transparent',
            color: k === active ? '#FCFCFC' : 'var(--text-secondary)',
            fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: k === active ? 600 : 500, cursor: 'pointer',
          }}>
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d={d}/></svg>
            {label}
          </div>
        ))}
      </div>
      <div style={{ padding: 12, borderTop: '1px solid var(--navy-edge)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 8px', borderRadius: 8, background: 'var(--navy-surface)' }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#00C2B8,#7000FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, color: '#0C182C' }}>RA</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: '#FCFCFC', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Rizki Anindita</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Account Manager</div>
          </div>
        </div>
      </div>
    </aside>
  );
};

const RTopBar = ({ title, subtitle, period = 'Mar 2025' }) => (
  <header style={{ height: 80, minHeight: 80, borderBottom: '1px solid var(--navy-edge)', background: 'rgba(12,24,44,.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16, position: 'relative', zIndex: 2, boxSizing: 'border-box' }}>
    <div style={{ flex: 1 }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: '#FCFCFC' }}>{title}</div>
      {subtitle && <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)' }}>{subtitle}</div>}
    </div>
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <div style={{ padding: '6px 12px', background: 'var(--navy-surface)', border: '1px solid var(--navy-edge)', borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 11, color: '#FCFCFC', display: 'flex', alignItems: 'center', gap: 8 }}>
        <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
        {period}
        <svg width="9" height="9" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 12 12"><path d="M2 4l4 4 4-4"/></svg>
      </div>
      <button style={{ padding: '6px 14px', background: 'transparent', color: '#FCFCFC', border: '1px solid var(--navy-edge)', borderRadius: 8, fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'background .15s, border-color .15s' }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,194,184,.08)'; e.currentTarget.style.borderColor = 'rgba(0,194,184,.4)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--navy-edge)'; }}>
        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="6 4 20 12 6 20 6 4" fill="currentColor"/></svg>
        Present
      </button>
      <button style={{ padding: '6px 14px', background: 'linear-gradient(135deg,#00C2B8,#009E96)', color: '#0C182C', border: 'none', borderRadius: 8, fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,194,184,.25)' }}>Export PDF</button>
      <div style={{ width: 1, height: 20, background: 'var(--navy-edge)' }} />
      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#00C2B8,#7000FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, color: '#0C182C' }}>RA</div>
    </div>
  </header>
);

const RFlare = ({ intensity = 0.5 }) => (
  <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
    <div style={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%', background: `radial-gradient(circle,rgba(248,180,0,${0.22 * intensity}) 0%,transparent 70%)`, filter: 'blur(80px)', top: -200, left: -100 }} />
    <div style={{ position: 'absolute', width: 550, height: 550, borderRadius: '50%', background: `radial-gradient(circle,rgba(0,194,184,${0.2 * intensity}) 0%,transparent 70%)`, filter: 'blur(80px)', bottom: -200, right: -100 }} />
    <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: `radial-gradient(circle,rgba(112,0,255,${0.12 * intensity}) 0%,transparent 70%)`, filter: 'blur(80px)', top: '35%', right: '28%' }} />
  </div>
);

const RCard = ({ children, accent, padding = 16, style = {} }) => (
  <div style={{
    flex: 1,
    background: 'var(--navy-surface)', border: '1px solid var(--navy-edge)', borderRadius: 12, padding,
    borderTop: accent ? `2px solid ${accent}` : '1px solid var(--navy-edge)',
    boxShadow: '0 4px 12px rgba(0,0,0,.15), inset 0 1px 0 rgba(255,255,255,.04)',
    ...style,
  }}>{children}</div>
);

const RChip = ({ color = '#00C2B8', bg, children }) => (
  <span style={{ padding: '2px 8px', background: bg || `${color}1F`, color, borderRadius: 4, fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 600, letterSpacing: 0.2 }}>{children}</span>
);

const RStatus = ({ type = 'active', label }) => {
  const m = {
    active: ['#16A34A', 'Active'],
    paused: ['#F8B400', 'Paused'],
    error: ['#E3170A', 'Error'],
    connected: ['#00C2B8', 'Connected'],
  }[type];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '2px 9px', border: `1px solid ${m[0]}4D`, background: `${m[0]}14`, color: m[0], borderRadius: 9999, fontFamily: 'var(--font-mono)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
      <span style={{ width: 5, height: 5, background: m[0], borderRadius: '50%' }}/>
      {label || m[1]}
    </span>
  );
};

const RDelta = ({ value, suffix = '%' }) => {
  const up = value >= 0;
  return <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: up ? '#16A34A' : '#DC2626', fontWeight: 500 }}>{up ? '▲' : '▼'} {Math.abs(value)}{suffix}</span>;
};

const RMetric = ({ label, value, delta, compare = 'vs Feb 2025', accent = 'var(--gold-base)', spark }) => (
  <RCard accent={accent}>
    <div style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 600, letterSpacing: 0.8, textTransform: 'uppercase', color: 'var(--text-muted)' }}>{label}</div>
    <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', color: '#FCFCFC', marginTop: 6, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <RDelta value={delta}/>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--text-muted)' }}>{compare}</span>
      </div>
      {spark && <Spark data={spark} color={accent}/>}
    </div>
  </RCard>
);

const Spark = ({ data, color = 'var(--avo-teal)', w = 60, h = 18 }) => {
  const max = Math.max(...data), min = Math.min(...data);
  const pts = data.map((v, i) => `${(i/(data.length-1))*w},${h - ((v-min)/(max-min||1))*h}`).join(' ');
  return <svg width={w} height={h}><polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round"/></svg>;
};

const ChannelLogo = ({ channel, size = 22 }) => {
  const defs = {
    google: ['#4285F4', <g key="g"><path fill="#4285F4" d="M21.6 12.23c0-.78-.07-1.53-.2-2.25H12v4.26h5.38a4.6 4.6 0 01-2 3.02v2.51h3.24c1.9-1.75 2.99-4.33 2.99-7.54z"/><path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.43l-3.24-2.51c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H3.07v2.59A10 10 0 0012 22z"/><path fill="#FBBC04" d="M6.41 13.9a6 6 0 010-3.8V7.51H3.07a10 10 0 000 8.98l3.34-2.6z"/><path fill="#EA4335" d="M12 5.98c1.47 0 2.78.5 3.82 1.5l2.86-2.87A10 10 0 003.07 7.51l3.34 2.6C7.2 7.74 9.4 5.98 12 5.98z"/></g>],
    meta: ['#0866FF', <path key="m" fill="#0866FF" d="M12 2a10 10 0 00-1.56 19.88v-7H8v-3h2.44V9.75c0-2.42 1.44-3.75 3.65-3.75 1.06 0 2.16.19 2.16.19v2.38h-1.22c-1.2 0-1.57.75-1.57 1.51V12h2.67l-.43 3h-2.24v7A10 10 0 0012 2z"/>],
    ga4: ['#F9AB00', <g key="ga"><path fill="#F9AB00" d="M17 3a2 2 0 012 2v14a2 2 0 01-4 0V5a2 2 0 012-2z"/><circle cx="5" cy="19" r="2" fill="#E37400"/><path fill="#E37400" d="M11 11a2 2 0 012 2v6a2 2 0 01-4 0v-6a2 2 0 012-2z"/></g>],
    search: ['#00C2B8', <g key="s"><circle cx="10" cy="10" r="6" fill="none" stroke="#00C2B8" strokeWidth="2.2"/><path stroke="#00C2B8" strokeWidth="2.2" strokeLinecap="round" d="M15 15l5 5"/></g>],
  };
  const [, node] = defs[channel] || defs.google;
  return <svg width={size} height={size} viewBox="0 0 24 24">{node}</svg>;
};

Object.assign(window, { RSidebar, RTopBar, RFlare, RCard, RChip, RStatus, RDelta, RMetric, Spark, ChannelLogo });
