// Reportive — Card Properties Editor Panel
// Full 3-tab panel: Setup (context-aware per card category), Style, Pages.
// Usage: <CardEditorPanel cardId="chart-area" onClose={fn} />
// Exported to window for use in the main app.

// ─── Shared micro-components ─────────────────────────────────────

const EP = {
  bg: 'rgba(10,18,34,.97)',
  surface: 'var(--navy-surface)',
  elevated: 'var(--navy-elevated)',
  edge: 'var(--navy-edge)',
  teal: '#00C2B8',
  gold: '#F8B400',
  violet: '#7000FF',
  fg: '#FCFCFC',
  sec: '#94A3B8',
  muted: '#64748B',
  green: '#16A34A',
  red: '#DC2626',
};

const ELabel = ({ children, hint }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: EP.muted, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600 }}>{children}</span>
    {hint && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: EP.muted, letterSpacing: '0.06em' }}>{hint}</span>}
  </div>
);

const ESection = ({ label, hint, children, style = {} }) => (
  <div style={{ marginBottom: 18, ...style }}>
    {label && <ELabel hint={hint}>{label}</ELabel>}
    {children}
  </div>
);

const EInput = ({ value, onChange, placeholder, mono }) => (
  <input
    value={value}
    onChange={e => onChange && onChange(e.target.value)}
    placeholder={placeholder}
    style={{
      width: '100%', boxSizing: 'border-box',
      padding: '8px 10px',
      background: EP.elevated,
      border: `1px solid ${EP.edge}`,
      borderRadius: 6, color: EP.fg,
      fontFamily: mono ? 'var(--font-mono)' : 'var(--font-body)',
      fontSize: mono ? 11 : 12.5, outline: 'none',
    }}
  />
);

const ESelect = ({ value, onChange, options, groups }) => (
  <select
    value={value}
    onChange={e => onChange && onChange(e.target.value)}
    style={{
      width: '100%', boxSizing: 'border-box',
      padding: '7px 10px',
      background: EP.surface,
      border: `1px solid ${EP.edge}`,
      borderRadius: 6, color: EP.fg,
      fontFamily: 'var(--font-body)', fontSize: 12, outline: 'none',
      appearance: 'none',
      backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='7' viewBox='0 0 10 7' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2364748B' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
      backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center',
    }}
  >
    {groups ? groups.map(g => (
      <optgroup key={g.label} label={g.label}>
        {g.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </optgroup>
    )) : options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
);

const EToggle = ({ value, onChange, label }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    {label && <span style={{ fontFamily: 'var(--font-body)', fontSize: 12.5, color: EP.fg }}>{label}</span>}
    <div
      onClick={() => onChange && onChange(!value)}
      style={{
        width: 36, height: 20, borderRadius: 10, cursor: 'pointer',
        background: value ? EP.teal : EP.elevated,
        border: `1px solid ${value ? EP.teal : EP.edge}`,
        position: 'relative', transition: 'background .15s, border-color .15s',
        flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute', top: 2, left: value ? 17 : 2,
        width: 14, height: 14, borderRadius: 7,
        background: value ? '#0C182C' : EP.muted,
        transition: 'left .15s',
      }}/>
    </div>
  </div>
);

const ESizeButtons = ({ value, onChange, label }) => (
  <ESection label={label}>
    <div style={{ display: 'flex', gap: 4 }}>
      {['S', 'M', 'L'].map(s => (
        <button key={s} onClick={() => onChange && onChange(s)}
          style={{
            flex: 1, padding: '6px 0', border: 'none', borderRadius: 6, cursor: 'pointer',
            background: value === s ? EP.teal : EP.elevated,
            color: value === s ? '#0C182C' : EP.sec,
            fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700,
            transition: 'background .12s',
          }}>{s}</button>
      ))}
    </div>
  </ESection>
);

const EColorDot = ({ color, selected, onClick }) => (
  <div onClick={onClick} style={{
    width: 22, height: 22, borderRadius: '50%', background: color, cursor: 'pointer',
    border: selected ? `2px solid ${EP.fg}` : '2px solid transparent',
    boxShadow: selected ? `0 0 0 2px ${color}` : 'none',
    transition: 'box-shadow .12s', flexShrink: 0,
  }}/>
);

const EColorSwatch = ({ label, value, colors, onChange }) => (
  <ESection label={label}>
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {colors.map(c => <EColorDot key={c} color={c} selected={value === c} onClick={() => onChange && onChange(c)}/>)}
    </div>
  </ESection>
);

const EChip = ({ children, color = EP.teal }) => (
  <span style={{
    padding: '3px 9px', borderRadius: 5,
    background: `${color}22`, color, border: `1px solid ${color}55`,
    fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, letterSpacing: '0.06em',
  }}>{children}</span>
);

const EDivider = () => (
  <div style={{ height: 1, background: EP.edge, margin: '14px -16px', opacity: 0.7 }}/>
);

// ─── Chart type icon picker ───────────────────────────────────────
const CHART_TYPES = [
  { id: 'kpi',     label: 'KPI',     icon: 'M4 20h16M4 20V8l4-4 4 4 4-4 4 4v12' },
  { id: 'line',    label: 'Line',    icon: 'M3 17l4-6 4 4 4-8 4 6' },
  { id: 'area',    label: 'Area',    icon: 'M3 20 L7 12 L12 16 L17 6 L21 12 L21 20 Z' },
  { id: 'bar',     label: 'Bar',     icon: 'M3 20h18M5 20V12h4v8M11 20V8h4v12M17 20V4h4v16' },
  { id: 'donut',   label: 'Donut',   icon: 'M12 2a10 10 0 100 20A10 10 0 0012 2zm0 6a4 4 0 110 8 4 4 0 010-8z' },
  { id: 'heatmap', label: 'Heat',    icon: 'M3 3h4v4H3zM9 3h4v4H9zM15 3h4v4h-4zM3 9h4v4H3zM9 9h4v4H9zM15 9h4v4h-4zM3 15h4v4H3zM9 15h4v4H9zM15 15h4v4h-4z' },
  { id: 'table',   label: 'Table',   icon: 'M3 3h18v4H3zM3 9h18v4H3zM3 15h18v4H3zM8 3v18M14 3v18' },
  { id: 'text',    label: 'Text',    icon: 'M4 6h16M4 10h10M4 14h12M4 18h8' },
];

const ChartTypePicker = ({ value, onChange }) => (
  <ESection label="Chart type">
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 5 }}>
      {CHART_TYPES.map(ct => {
        const active = value === ct.id;
        return (
          <button key={ct.id} onClick={() => onChange && onChange(ct.id)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '8px 4px 5px', border: `1.5px solid ${active ? EP.teal : EP.edge}`,
              borderRadius: 7, background: active ? `rgba(0,194,184,.1)` : EP.elevated,
              cursor: 'pointer', gap: 3, transition: 'border-color .12s, background .12s',
            }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? EP.teal : EP.muted} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d={ct.icon}/>
            </svg>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: active ? EP.teal : EP.muted, letterSpacing: '0.06em' }}>{ct.label}</span>
          </button>
        );
      })}
    </div>
  </ESection>
);

// ─── Data source section ──────────────────────────────────────────
const DataSourceSection = ({ state, setState }) => {
  const sources = [
    { id: 'google', label: 'Google Ads', color: '#4285F4' },
    { id: 'meta', label: 'Meta Ads', color: '#0866FF' },
    { id: 'ga4', label: 'GA4', color: '#F9AB00' },
    { id: 'search', label: 'Search Console', color: '#00C2B8' },
  ];
  const src = state.source || 'google';
  return (
    <ESection label="Data source">
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
        {sources.map(s => (
          <button key={s.id} onClick={() => setState({ ...state, source: s.id })}
            style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '5px 9px',
              border: `1px solid ${src === s.id ? s.color + 'AA' : EP.edge}`,
              borderRadius: 6, background: src === s.id ? s.color + '18' : EP.elevated,
              color: src === s.id ? s.color : EP.sec, cursor: 'pointer',
              fontFamily: 'var(--font-display)', fontSize: 10.5, fontWeight: 600,
              transition: 'border-color .12s, background .12s',
            }}>
            <ChannelLogo channel={s.id} size={13}/>
            {s.label}
          </button>
        ))}
      </div>
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
    </ESection>
  );
};

// ─── Filter builder ───────────────────────────────────────────────
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

// ─── Category-specific Setup fields ──────────────────────────────

const MetricsSelect = () => (
  <ESection label="Primary metric">
    <ESelect value="spend" options={[
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

const ComparisonSection = ({ state, setState }) => (
  <ESection label="Comparison">
    <div style={{ marginBottom: 8 }}>
      <EToggle value={state.showComparison} onChange={v => setState({ ...state, showComparison: v })} label="Show comparison"/>
    </div>
    {state.showComparison && (
      <ESelect value={state.compPeriod || 'prev'} onChange={v => setState({ ...state, compPeriod: v })}
        options={[{value:'prev',label:'Previous period'},{value:'prev-year',label:'Previous year'},{value:'custom',label:'Custom range'}]}/>
    )}
  </ESection>
);

const DateRangeSection = ({ state, setState }) => (
  <ESection label="Default date range">
    {[{val:'report',label:'Follow report period'},{val:'fixed',label:'Fixed range'}].map(o => (
      <label key={o.val} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, cursor: 'pointer' }}>
        <div style={{
          width: 14, height: 14, borderRadius: '50%', border: `1.5px solid ${state.dateRange === o.val ? EP.teal : EP.edge}`,
          background: state.dateRange === o.val ? EP.teal : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }} onClick={() => setState({ ...state, dateRange: o.val })}>
          {state.dateRange === o.val && <div style={{ width: 5, height: 5, background: '#0C182C', borderRadius: '50%' }}/>}
        </div>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: EP.fg }} onClick={() => setState({ ...state, dateRange: o.val })}>{o.label}</span>
      </label>
    ))}
  </ESection>
);

// ─── Per-category Setup bodies ────────────────────────────────────

const SetupKPI = ({ state, setState }) => (
  <>
    <ChartTypePicker value={state.chartType || 'kpi'} onChange={v => setState({ ...state, chartType: v })}/>
    <EDivider/>
    <DataSourceSection state={state} setState={setState}/>
    <EDivider/>
    <MetricsSelect/>
    <ComparisonSection state={state} setState={setState}/>
    <EDivider/>
    <FilterSection filters={state.filters || []} setFilters={f => setState({ ...state, filters: f })}/>
    <EDivider/>
    <DateRangeSection state={state} setState={setState}/>
  </>
);

const SetupChart = ({ state, setState }) => (
  <>
    <ChartTypePicker value={state.chartType || 'area'} onChange={v => setState({ ...state, chartType: v })}/>
    <EDivider/>
    <DataSourceSection state={state} setState={setState}/>
    <EDivider/>
    <MetricsSelect/>
    <ESection label="Secondary metric">
      <ESelect value={state.secMetric || 'conversions'} onChange={v => setState({ ...state, secMetric: v })}
        options={[{value:'none',label:'None'},{value:'conversions',label:'Conversions'},{value:'clicks',label:'Clicks'},{value:'impressions',label:'Impressions'}]}/>
    </ESection>
    <ComparisonSection state={state} setState={setState}/>
    <ESection label="X-axis">
      <ESelect value={state.xAxis || 'week'} options={[{value:'day',label:'Daily'},{value:'week',label:'Weekly'},{value:'month',label:'Monthly'}]}/>
    </ESection>
    <EDivider/>
    <FilterSection filters={state.filters || []} setFilters={f => setState({ ...state, filters: f })}/>
    <EDivider/>
    <DateRangeSection state={state} setState={setState}/>
  </>
);

const SetupTable = ({ state, setState }) => {
  const allCols = ['Channel','Status','Spend','Impressions','Clicks','CTR','Conversions','ROAS','Trend','CPA','CPC'];
  const active = state.cols || ['Channel','Status','Spend','Clicks','CTR','ROAS','Trend'];
  const toggle = (c) => setState({ ...state, cols: active.includes(c) ? active.filter(x=>x!==c) : [...active, c] });
  return (
    <>
      <ESection label="Visible columns">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {allCols.map(c => (
            <button key={c} onClick={() => toggle(c)}
              style={{ padding: '4px 9px', border: `1px solid ${active.includes(c) ? EP.teal+'88' : EP.edge}`, borderRadius: 5, background: active.includes(c) ? 'rgba(0,194,184,.1)' : EP.elevated, color: active.includes(c) ? EP.teal : EP.muted, fontFamily: 'var(--font-display)', fontSize: 10.5, fontWeight: 600, cursor: 'pointer' }}>{c}</button>
          ))}
        </div>
      </ESection>
      <ESection label="Row limit">
        <ESelect value={state.rowLimit || '10'} onChange={v => setState({ ...state, rowLimit: v })}
          options={[{value:'5',label:'5 rows'},{value:'10',label:'10 rows'},{value:'20',label:'20 rows'},{value:'all',label:'All rows'}]}/>
      </ESection>
      <ESection label="Sort by">
        <div style={{ display: 'flex', gap: 5 }}>
          <ESelect value={state.sortCol || 'spend'} options={[{value:'spend',label:'Spend'},{value:'roas',label:'ROAS'},{value:'clicks',label:'Clicks'},{value:'conv',label:'Conversions'}]}/>
          <button onClick={() => setState({ ...state, sortDir: state.sortDir === 'asc' ? 'desc' : 'asc' })}
            style={{ padding: '6px 10px', background: EP.elevated, border: `1px solid ${EP.edge}`, borderRadius: 6, color: EP.sec, cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600 }}>
            {state.sortDir === 'asc' ? '↑ ASC' : '↓ DESC'}
          </button>
        </div>
      </ESection>
      <EDivider/>
      <DataSourceSection state={state} setState={setState}/>
      <EDivider/>
      <FilterSection filters={state.filters || []} setFilters={f => setState({ ...state, filters: f })}/>
      <EDivider/>
      <DateRangeSection state={state} setState={setState}/>
    </>
  );
};

const SetupNarrative = ({ state, setState }) => (
  <>
    <ESection label="Headline text">
      <textarea value={state.headline || 'Performa marketing Maret 2025 naik 19,7%'} onChange={e => setState({ ...state, headline: e.target.value })}
        rows={2}
        style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', background: EP.elevated, border: `1px solid ${EP.edge}`, borderRadius: 6, color: EP.fg, fontFamily: 'var(--font-display)', fontSize: 12.5, outline: 'none', resize: 'vertical' }}/>
    </ESection>
    <ESection label="Body copy">
      <textarea value={state.body || 'Konversi meningkat seiring shift anggaran ke Google Ads. SEO organik tumbuh 8,1% tanpa tambahan budget.'} onChange={e => setState({ ...state, body: e.target.value })}
        rows={3}
        style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', background: EP.elevated, border: `1px solid ${EP.edge}`, borderRadius: 6, color: EP.sec, fontFamily: 'var(--font-body)', fontSize: 12, outline: 'none', resize: 'vertical', lineHeight: 1.5 }}/>
    </ESection>
    <EDivider/>
    <ESection label="Show elements">
      {[['showStatus','Status badge'],['showCTA','CTA buttons'],['showAnalystNote','Analyst note'],['showEmoji','Emoji icons']].map(([k,l]) => (
        <div key={k} style={{ marginBottom: 8 }}>
          <EToggle value={state[k] !== false} onChange={v => setState({ ...state, [k]: v })} label={l}/>
        </div>
      ))}
    </ESection>
    <ESection label="CTA link">
      <EInput value={state.ctaLink || 'View details'} onChange={v => setState({ ...state, ctaLink: v })}/>
    </ESection>
  </>
);

const SetupProgress = ({ state, setState }) => (
  <>
    <ESection label="Tracked metric">
      <ESelect value={state.metric || 'conversions'} onChange={v => setState({ ...state, metric: v })}
        options={[{value:'conversions',label:'Conversions'},{value:'revenue',label:'Revenue'},{value:'spend',label:'Spend'},{value:'sessions',label:'Organic Sessions'},{value:'authority',label:'Authority Score'}]}/>
    </ESection>
    <ESection label="Goal value">
      <div style={{ display: 'flex', gap: 6 }}>
        <EInput value={state.goalValue || '1200'} onChange={v => setState({ ...state, goalValue: v })}/>
        <ESelect value={state.goalUnit || 'count'} onChange={v => setState({ ...state, goalUnit: v })}
          options={[{value:'count',label:'#'},{value:'idr',label:'IDR'},{value:'pct',label:'%'}]}/>
      </div>
    </ESection>
    <ESection label="Goal label">
      <EInput value={state.goalLabel || 'Monthly target'} onChange={v => setState({ ...state, goalLabel: v })}/>
    </ESection>
    <ComparisonSection state={state} setState={setState}/>
    <EDivider/>
    <DataSourceSection state={state} setState={setState}/>
    <EDivider/>
    <DateRangeSection state={state} setState={setState}/>
  </>
);

const SetupList = ({ state, setState }) => (
  <>
    <ESection label="List source">
      <ESelect value={state.listSource || 'keywords'} onChange={v => setState({ ...state, listSource: v })}
        options={[{value:'keywords',label:'Top Keywords'},{value:'pages',label:'Landing Pages'},{value:'campaigns',label:'Campaigns'},{value:'countries',label:'Countries'}]}/>
    </ESection>
    <ESection label="Sort metric">
      <ESelect value={state.sortMetric || 'impressions'} onChange={v => setState({ ...state, sortMetric: v })}
        options={[{value:'impressions',label:'Impressions'},{value:'clicks',label:'Clicks'},{value:'ctr',label:'CTR'},{value:'sessions',label:'Sessions'},{value:'spend',label:'Spend'}]}/>
    </ESection>
    <ESection label="Items to show">
      <ESelect value={state.itemCount || '5'} onChange={v => setState({ ...state, itemCount: v })}
        options={[{value:'3',label:'Top 3'},{value:'5',label:'Top 5'},{value:'10',label:'Top 10'},{value:'all',label:'All'}]}/>
    </ESection>
    <EDivider/>
    <DataSourceSection state={state} setState={setState}/>
    <EDivider/>
    <FilterSection filters={state.filters || []} setFilters={f => setState({ ...state, filters: f })}/>
    <EDivider/>
    <DateRangeSection state={state} setState={setState}/>
  </>
);

const SetupPageSpeed = ({ state, setState }) => (
  <>
    <ESection label="Data source">
      <ESelect value={state.dataSource || 'pagespeed'} onChange={v => setState({ ...state, dataSource: v })}
        options={[{value:'pagespeed',label:'Google PageSpeed Insights'},{value:'lighthouse',label:'Lighthouse'},{value:'webvitals',label:'Web Vitals (CrUX)'}]}/>
    </ESection>
    <EDivider/>
    <ESection label="Page URL">
      <EInput value={state.pageUrl || 'kopisenjanusantara.com'} onChange={v => setState({ ...state, pageUrl: v })} placeholder="e.g. example.com/page"/>
    </ESection>
    <EDivider/>
    <ESection label="Device strategy">
      {['mobile','desktop','both'].map(d => (
        <label key={d} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, cursor: 'pointer' }}>
          <div style={{
            width: 14, height: 14, borderRadius: '50%', border: `1.5px solid ${state.device === d ? EP.teal : EP.edge}`,
            background: state.device === d ? EP.teal : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }} onClick={() => setState({ ...state, device: d })}>
            {state.device === d && <div style={{ width: 5, height: 5, background: '#0C182C', borderRadius: '50%' }}/>}
          </div>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: EP.fg, textTransform: 'capitalize' }}>{d}</span>
        </label>
      ))}
    </ESection>
    <EDivider/>
    <ESection label="Metrics to display">
      {[['Performance', 'perf'],['Accessibility', 'a11y'],['Best Practices', 'practices'],['SEO', 'seo']].map(([label, key]) => (
        <div key={key} style={{ marginBottom: 8 }}>
          <EToggle value={state['show' + key.charAt(0).toUpperCase() + key.slice(1)] !== false} onChange={v => setState({ ...state, ['show' + key.charAt(0).toUpperCase() + key.slice(1)]: v })} label={label}/>
        </div>
      ))}
    </ESection>
    <EDivider/>
    <ESection label="Core Web Vitals">
      <div style={{ marginBottom: 8 }}>
        <EToggle value={state.showCWV !== false} onChange={v => setState({ ...state, showCWV: v })} label="Show Core Web Vitals"/>
      </div>
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
    </ESection>
    <EDivider/>
    <ESection label="Recommendations">
      <ESelect value={state.recCount || '3'} onChange={v => setState({ ...state, recCount: v })}
        options={[{value:'2',label:'Top 2'},{value:'3',label:'Top 3'},{value:'5',label:'Top 5'},{value:'all',label:'All recommendations'}]}/>
    </ESection>
  </>
);

const SetupCarousel = ({ state, setState }) => (
  <>
    <ESection label="Featured items">
      {[['Top ROAS campaign','chart-sparks'],['Biggest traffic mover','list-pages'],['Monthly goal status','progress-goals']].map(([l, id], i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, padding: '7px 10px', background: EP.elevated, borderRadius: 6, border: `1px solid ${EP.edge}` }}>
          <svg width="9" height="13" viewBox="0 0 9 13" fill={EP.muted}><circle cx="2" cy="2" r="1.1"/><circle cx="7" cy="2" r="1.1"/><circle cx="2" cy="6.5" r="1.1"/><circle cx="7" cy="6.5" r="1.1"/><circle cx="2" cy="11" r="1.1"/><circle cx="7" cy="11" r="1.1"/></svg>
          <span style={{ flex: 1, fontFamily: 'var(--font-body)', fontSize: 11.5, color: EP.fg }}>{l}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: EP.muted }}>{id}</span>
        </div>
      ))}
      <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: 'transparent', border: `1px dashed ${EP.edge}`, borderRadius: 6, color: EP.muted, cursor: 'pointer', fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 600, width: '100%', justifyContent: 'center' }}>
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5.5 1v9M1 5.5h9"/></svg>
        Add item
      </button>
    </ESection>
    <EDivider/>
    <ESection label="Behaviour">
      <div style={{ marginBottom: 8 }}><EToggle value={state.autoAdvance !== false} onChange={v => setState({ ...state, autoAdvance: v })} label="Auto-advance"/></div>
      {state.autoAdvance !== false && (
        <ESelect value={state.interval || '5'} onChange={v => setState({ ...state, interval: v })}
          options={[{value:'3',label:'3 seconds'},{value:'5',label:'5 seconds'},{value:'8',label:'8 seconds'},{value:'12',label:'12 seconds'}]}/>
      )}
    </ESection>
  </>
);

// ─── TAB: Style ───────────────────────────────────────────────────

const ACCENT_COLORS = ['#F8B400', '#00C2B8', '#7000FF', '#4285F4', '#16A34A', '#E3170A', '#0EA5E9', '#EC4899'];

const StyleTab = ({ state, setState }) => (
  <>
    <ESection label="Card title">
      <EToggle value={state.showTitle !== false} onChange={v => setState({ ...state, showTitle: v })} label="Show title"/>
    </ESection>
    <EDivider/>
    <ESection label="Font size">
      <ESizeButtons label="Card title" value={state.titleSize || 'M'} onChange={v => setState({ ...state, titleSize: v })}/>
      <ESizeButtons label="Metric value" value={state.valueSize || 'M'} onChange={v => setState({ ...state, valueSize: v })}/>
    </ESection>
    <EDivider/>
    <EColorSwatch label="Accent color" value={state.accent || '#00C2B8'} colors={ACCENT_COLORS} onChange={v => setState({ ...state, accent: v })}/>
    <EDivider/>
    <ESection label="Conditional formatting">
      {(state.fmtRules || []).map((r, i) => (
        <div key={i} style={{ display: 'flex', gap: 5, marginBottom: 6, alignItems: 'center' }}>
          <ESelect value={r.metric} options={[{value:'delta',label:'Delta %'},{value:'roas',label:'ROAS'},{value:'ctr',label:'CTR'}]}/>
          <ESelect value={r.op} options={[{value:'gt',label:'>'},{value:'lt',label:'<'},{value:'gte',label:'≥'}]}/>
          <input value={r.val} style={{ width: 42, padding: '5px 6px', background: EP.elevated, border: `1px solid ${EP.edge}`, borderRadius: 5, color: EP.fg, fontFamily: 'var(--font-mono)', fontSize: 11, outline: 'none' }}/>
          <div style={{ width: 20, height: 20, borderRadius: '50%', background: r.color || EP.green, cursor: 'pointer', border: `1.5px solid ${EP.edge}`, flexShrink: 0 }}/>
        </div>
      ))}
      <button onClick={() => setState({ ...state, fmtRules: [...(state.fmtRules||[]), {metric:'delta',op:'gt',val:'0',color:EP.green}]})}
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: 'transparent', border: `1px dashed ${EP.edge}`, borderRadius: 6, color: EP.muted, cursor: 'pointer', fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 600, width: '100%', justifyContent: 'center' }}>
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5.5 1v9M1 5.5h9"/></svg>
        Add formatting rule
      </button>
    </ESection>
    <EDivider/>
    <ESection label="Primary metric">
      <div style={{ marginBottom: 8 }}><EToggle value={state.compact !== false} onChange={v => setState({ ...state, compact: v })} label="Compact numbers"/></div>
      <ESection label="Decimal precision">
        <ESelect value={String(state.precision ?? 0)} onChange={v => setState({ ...state, precision: Number(v) })}
          options={[{value:'0',label:'0'},{value:'1',label:'1'},{value:'2',label:'2'}]}/>
      </ESection>
    </ESection>
    <EDivider/>
    <ESection label="Comparison fields">
      <div style={{ marginBottom: 10 }}>
        <ELabel>Positive change color</ELabel>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {[EP.green, EP.teal, EP.gold].map(c => <EColorDot key={c} color={c} selected={(state.posColor||EP.green)===c} onClick={() => setState({ ...state, posColor: c })}/>)}
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: EP.muted }}>{state.posColor || EP.green}</span>
        </div>
      </div>
      <div style={{ marginBottom: 10 }}>
        <ELabel>Negative change color</ELabel>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {[EP.red, '#F8B400', EP.muted].map(c => <EColorDot key={c} color={c} selected={(state.negColor||EP.red)===c} onClick={() => setState({ ...state, negColor: c })}/>)}
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: EP.muted }}>{state.negColor || EP.red}</span>
        </div>
      </div>
      <EToggle value={state.showAbsolute || false} onChange={v => setState({ ...state, showAbsolute: v })} label="Show absolute change"/>
    </ESection>
    <EDivider/>
    <ESection label="Background & border">
      <ELabel hint={`${Math.round((state.bgOpacity ?? 1) * 100)}%`}>Background opacity</ELabel>
      <input type="range" min="0" max="100" value={Math.round((state.bgOpacity ?? 1) * 100)}
        onChange={e => setState({ ...state, bgOpacity: Number(e.target.value) / 100 })}
        style={{ width: '100%', accentColor: EP.teal, margin: '4px 0 10px' }}/>
      <ESection label="Border radius">
        <ESelect value={state.radius || '12'} onChange={v => setState({ ...state, radius: v })}
          options={[{value:'0',label:'0px (None)'},{value:'4',label:'4px'},{value:'8',label:'8px (Small)'},{value:'12',label:'12px (Default)'},{value:'16',label:'16px (Large)'},{value:'20',label:'20px (Extra large)'}]}/>
      </ESection>
    </ESection>
  </>
);

// ─── TAB: Pages ───────────────────────────────────────────────────

const PagesTab = ({ state, setState }) => {
  const pages = state.pages || [{ id: 'overview', label: 'Overview', current: true }, { id: 'testing', label: 'Testing', current: false }];
  const setPages = (p) => setState({ ...state, pages: p });
  const add = () => setPages([...pages, { id: `page-${Date.now()}`, label: 'New Page', current: false }]);
  const remove = (id) => setPages(pages.filter(p => p.id !== id));
  const profiles = state.profiles || [];
  return (
    <>
      <ESection label="Report pages">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {pages.map(p => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: EP.elevated, border: `1px solid ${EP.edge}`, borderRadius: 7 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={EP.muted} strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/></svg>
              <span style={{ flex: 1, fontFamily: 'var(--font-body)', fontSize: 12.5, color: EP.fg }}>{p.label}</span>
              {p.current
                ? <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: EP.teal, padding: '2px 7px', background: 'rgba(0,194,184,.1)', borderRadius: 4, letterSpacing: '0.08em' }}>HALUS</span>
                : <button onClick={() => remove(p.id)} style={{ padding: '3px 7px', background: 'rgba(220,38,38,.12)', border: '1px solid rgba(220,38,38,.3)', borderRadius: 5, color: EP.red, cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 10 }}>×</button>
              }
            </div>
          ))}
        </div>
        <button onClick={add} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px', background: 'transparent', border: `1px dashed ${EP.edge}`, borderRadius: 6, color: EP.muted, cursor: 'pointer', fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 600, width: '100%', justifyContent: 'center', marginTop: 6 }}>
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5.5 1v9M1 5.5h9"/></svg>
          Add New Page
        </button>
      </ESection>
      <EDivider/>
      <ESection label="Website profiles">
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 11.5, color: EP.sec, lineHeight: 1.5, margin: '0 0 10px' }}>Hubungkan nama sekunder ke URL website. Saat akun dipilih, PA bar otomatis difilter URL-nya.</p>
        {profiles.map((p, i) => (
          <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 5, alignItems: 'center' }}>
            <EInput value={p.name} onChange={v => { const np = [...profiles]; np[i] = { ...p, name: v }; setState({ ...state, profiles: np }); }} placeholder="Profile name"/>
            <EInput value={p.url} onChange={v => { const np = [...profiles]; np[i] = { ...p, url: v }; setState({ ...state, profiles: np }); }} placeholder="URL" mono/>
          </div>
        ))}
        <button onClick={() => setState({ ...state, profiles: [...profiles, { name: '', url: '' }]})}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px', background: 'rgba(0,194,184,.08)', border: `1px solid rgba(0,194,184,.3)`, borderRadius: 6, color: EP.teal, cursor: 'pointer', fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, width: '100%', justifyContent: 'center', marginTop: 4 }}>
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5.5 1v9M1 5.5h9"/></svg>
          Tambah Profile
        </button>
      </ESection>
    </>
  );
};

// ─── Main CardEditorPanel ─────────────────────────────────────────

const CAT_SETUP = {
  kpi:       SetupKPI,
  charts:    SetupChart,
  tables:    SetupTable,
  narrative: SetupNarrative,
  progress:  SetupProgress,
  lists:     SetupList,
  carousel:  SetupCarousel,
};

// Map specific card IDs to their setup components
const CARD_SETUP_OVERRIDE = {
  'progress-psi': SetupPageSpeed,
};

const CardEditorPanel = ({ cardId = 'kpi-single', onClose, defaultTab = 'setup', style = {} }) => {
  const [tab, setTab] = React.useState(defaultTab);
  const [setupState, setSetupState] = React.useState({ showComparison: true, compPeriod: 'prev', dateRange: 'report', bgOpacity: 1 });
  const [styleState, setStyleState] = React.useState({ showTitle: true, titleSize: 'M', valueSize: 'M', accent: '#00C2B8', compact: true, precision: 0, bgOpacity: 1, radius: '12' });
  const [pagesState, setPagesState] = React.useState({});

  const card = (window.CARDS || []).find(c => c.id === cardId) || { id: cardId, cat: 'kpi', title: 'Card' };
  const SetupBody = CARD_SETUP_OVERRIDE[cardId] || CAT_SETUP[card.cat] || SetupKPI;

  const TABS = [
    { id: 'setup', label: 'Setup' },
    { id: 'style', label: 'Style' },
    { id: 'pages', label: 'Pages' },
  ];

  return (
    <div style={{
      width: 320, height: '100%', display: 'flex', flexDirection: 'column',
      background: EP.bg, borderLeft: `1px solid ${EP.edge}`,
      fontFamily: 'var(--font-body)', color: EP.fg,
      boxShadow: '-12px 0 40px rgba(0,0,0,.3)',
      ...style,
    }}>
      {/* Header */}
      <div style={{ padding: '14px 16px 0', borderBottom: `1px solid ${EP.edge}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={EP.teal} strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: EP.fg, letterSpacing: '-0.01em' }}>Card Properties</span>
          </div>
          {onClose && (
            <button onClick={onClose} style={{ width: 26, height: 26, border: 'none', background: EP.elevated, borderRadius: 6, color: EP.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, lineHeight: 1 }}>×</button>
          )}
        </div>
        {/* Card meta */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0 10px' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: EP.teal, background: 'rgba(0,194,184,.1)', padding: '2px 8px', borderRadius: 4, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{card.cat}</span>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 12.5, color: EP.sec, flex: 1 }}>{card.title}</span>
        </div>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, marginBottom: -1 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{
                flex: 1, padding: '8px 0', border: 'none', background: 'transparent', cursor: 'pointer',
                fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: tab === t.id ? 700 : 500,
                color: tab === t.id ? EP.fg : EP.muted,
                borderBottom: `2px solid ${tab === t.id ? EP.teal : 'transparent'}`,
                transition: 'color .12s',
              }}>{t.label}</button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        {tab === 'setup' && (
          <>
            <ESection label="Title & description">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <EInput value={card.title} placeholder="Card title"/>
                <EInput value={`${card.cat} card · March 2025`} placeholder="Description (optional)"/>
              </div>
            </ESection>
            <EDivider/>
            <SetupBody state={setupState} setState={setSetupState}/>
          </>
        )}
        {tab === 'style' && <StyleTab state={styleState} setState={setStyleState}/>}
        {tab === 'pages' && <PagesTab state={pagesState} setState={setPagesState}/>}
      </div>

      {/* Footer */}
      <div style={{ padding: '10px 16px', borderTop: `1px solid ${EP.edge}`, display: 'flex', gap: 6, flexShrink: 0, background: 'rgba(10,18,34,.5)' }}>
        {onClose && <button onClick={onClose} style={{ flex: 1, padding: '8px 0', background: EP.elevated, border: `1px solid ${EP.edge}`, borderRadius: 7, color: EP.sec, fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>}
        <button style={{ flex: 2, padding: '8px 0', background: 'linear-gradient(135deg,#00C2B8,#009E96)', border: 'none', borderRadius: 7, color: '#0C182C', fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(0,194,184,.25)' }}>Apply changes</button>
      </div>
    </div>
  );
};

// ─── Demo: Dashboard + Editor side by side ────────────────────────
// Used as an artboard on the canvas. Shows the dashboard constrained
// to its space, with the editor panel docked to the right.

const DashboardWithEditor = ({ cardId = 'kpi-single', editorTab = 'setup', slots }) => {
  const [openCard, setOpenCard] = React.useState(cardId);
  const [activeTab, setActiveTab] = React.useState(editorTab);
  const effectiveSlots = slots || {
    slotA: 'narrative-hero', slotB: 'kpi-strip',
    slotC: 'chart-area', slotD: 'chart-donut',
    slotE: 'table-channels', slotF: 'narrative-note',
  };
  return (
    <div style={{ display: 'flex', height: '100%', background: 'var(--navy-base)' }}>
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <ScreenDashboard slots={effectiveSlots} editMode={true}/>
      </div>
      <CardEditorPanel cardId={openCard} defaultTab={activeTab}/>
    </div>
  );
};

Object.assign(window, { CardEditorPanel, DashboardWithEditor });
