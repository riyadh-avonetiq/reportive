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
    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: EP.muted, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600 }}>{children}</span>
    {hint && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: EP.muted, letterSpacing: '0.06em' }}>{hint}</span>}
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
      fontFamily: 'var(--font-body)', fontSize: 14, outline: 'none',
      appearance: 'none',
      backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='7' viewBox='0 0 10 7' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2364748B' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
      backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center',
    }}
  >
    {groups ? groups.map(g => (
      <optgroup key={g.label} label={g.label}>
        {g.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </optgroup>
    )) : options?.map(o => <option key={o.value} value={o.value} disabled={!!o.disabled}>{o.label}</option>)}
  </select>
);

const EToggle = ({ value, onChange, label }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    {label && <span style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: EP.fg }}>{label}</span>}
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
            fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700,
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
    fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, letterSpacing: '0.06em',
  }}>{children}</span>
);

const EDivider = () => (
  <div style={{ height: 1, background: EP.edge, margin: '14px -16px', opacity: 0.7 }}/>
);

const FormattingToolbar = () => {
  const [fmt, setFmt] = React.useState({ bold: false, italic: false, underline: false, ul: false, ol: false });
  React.useEffect(() => {
    const update = () => {
      try {
        setFmt({
          bold:      document.queryCommandState('bold'),
          italic:    document.queryCommandState('italic'),
          underline: document.queryCommandState('underline'),
          ul:        document.queryCommandState('insertUnorderedList'),
          ol:        document.queryCommandState('insertOrderedList'),
        });
      } catch (_) {}
    };
    document.addEventListener('selectionchange', update);
    return () => document.removeEventListener('selectionchange', update);
  }, []);
  const btnStyle = (active, fs = 13) => ({
    minWidth: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: active ? EP.fg : EP.elevated,
    border: `1px solid ${active ? EP.fg : EP.edge}`,
    borderRadius: 5, color: active ? EP.bg : EP.fg,
    cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: fs,
  });
  // For inline formatting (bold/italic/underline): if no text is selected, select all first
  // so the format applies to the whole field without drag-selecting.
  // For list commands: always apply at cursor position only — pre-selecting all would convert
  // every paragraph to a list item instead of just the current one.
  const applyCmd = (cmd) => {
    const isListCmd = cmd === 'insertUnorderedList' || cmd === 'insertOrderedList';
    if (!isListCmd) {
      const sel = window.getSelection();
      const el = document.activeElement;
      if (sel && sel.isCollapsed && el && el.isContentEditable) {
        const r = document.createRange();
        r.selectNodeContents(el);
        sel.removeAllRanges();
        sel.addRange(r);
      }
    }
    document.execCommand(cmd);
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <button onMouseDown={e => { e.preventDefault(); applyCmd('bold'); }} title="Bold (Ctrl+B)" style={btnStyle(fmt.bold)}><strong>B</strong></button>
      <button onMouseDown={e => { e.preventDefault(); applyCmd('italic'); }} title="Italic (Ctrl+I)" style={btnStyle(fmt.italic)}><em>I</em></button>
      <button onMouseDown={e => { e.preventDefault(); applyCmd('underline'); }} title="Underline (Ctrl+U)" style={btnStyle(fmt.underline)}><u>U</u></button>
      <div style={{ width: 1, height: 20, background: EP.edge, margin: '0 2px' }}/>
      <button onMouseDown={e => { e.preventDefault(); applyCmd('insertUnorderedList'); }} title="Bullet list" style={btnStyle(fmt.ul, 11)}>
        <svg width="15" height="12" viewBox="0 0 15 12" fill="currentColor">
          <circle cx="1.5" cy="2" r="1.5"/>
          <rect x="4.5" y="1" width="10.5" height="2" rx="1"/>
          <circle cx="1.5" cy="6" r="1.5"/>
          <rect x="4.5" y="5" width="10.5" height="2" rx="1"/>
          <circle cx="1.5" cy="10" r="1.5"/>
          <rect x="4.5" y="9" width="10.5" height="2" rx="1"/>
        </svg>
      </button>
      <button onMouseDown={e => { e.preventDefault(); applyCmd('insertOrderedList'); }} title="Numbered list" style={btnStyle(fmt.ol, 11)}>
        <svg width="15" height="13" viewBox="0 0 15 13" fill="currentColor" fontFamily="monospace" fontWeight="800" fontSize="4.5">
          <text x="0.5" y="4.5">1</text>
          <rect x="5" y="2.5" width="10" height="2" rx="1"/>
          <text x="0.5" y="9">2</text>
          <rect x="5" y="7" width="10" height="2" rx="1"/>
          <text x="0.5" y="13.5">3</text>
          <rect x="5" y="11.5" width="10" height="2" rx="1"/>
        </svg>
      </button>
    </div>
  );
};

// ─── Drag-and-drop column/metric editor ──────────────────────────
const ColumnsEditor = ({ columns, metrics, maxCols = 6, addLabel = 'Add column', onColumnsChange }) => {
  const [dragIdx,  setDragIdx]  = React.useState(null);
  const [dragOver, setDragOver] = React.useState(null);

  const update = (i, val) => { const next = [...columns]; next[i] = val; onColumnsChange(next); };
  const remove = (i) => onColumnsChange(columns.filter((_, j) => j !== i));
  const add = () => {
    const used = new Set(columns);
    const first = metrics.find(m => !used.has(m.key));
    if (first) onColumnsChange([...columns, first.key]);
  };
  const canAdd = columns.length < maxCols && metrics.some(m => !columns.includes(m.key));

  const onDragEnd = () => {
    if (dragIdx !== null && dragOver !== null && dragIdx !== dragOver) {
      const next = [...columns];
      const [moved] = next.splice(dragIdx, 1);
      next.splice(dragOver, 0, moved);
      onColumnsChange(next);
    }
    setDragIdx(null);
    setDragOver(null);
  };

  return (
    <div>
      {columns.map((col, i) => (
        <div
          key={i}
          draggable
          onDragStart={() => setDragIdx(i)}
          onDragEnter={() => setDragOver(i)}
          onDragEnd={onDragEnd}
          onDragOver={e => e.preventDefault()}
          style={{
            display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6,
            opacity: dragIdx === i ? 0.4 : 1,
            borderTop: dragOver === i && dragIdx !== i ? `2px solid ${EP.teal}` : '2px solid transparent',
            transition: 'opacity .15s',
          }}
        >
          <div title="Drag to reorder" style={{ cursor: 'grab', color: EP.muted, display: 'flex', alignItems: 'center', flexShrink: 0, padding: '0 2px' }}>
            <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor">
              <circle cx="3" cy="2.5" r="1.2"/><circle cx="7" cy="2.5" r="1.2"/>
              <circle cx="3" cy="7" r="1.2"/><circle cx="7" cy="7" r="1.2"/>
              <circle cx="3" cy="11.5" r="1.2"/><circle cx="7" cy="11.5" r="1.2"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <ESelect
              value={col}
              onChange={v => update(i, v)}
              options={metrics.map(m => ({ value: m.key, label: m.label, disabled: m.key !== col && columns.includes(m.key) }))}
            />
          </div>
          <button
            onClick={() => remove(i)}
            title="Remove"
            style={{
              width: 30, height: 30, border: `1px solid rgba(220,38,38,.3)`,
              borderRadius: 6, background: 'rgba(220,38,38,.08)',
              color: EP.red, cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', flexShrink: 0, padding: 0,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>
            </svg>
          </button>
        </div>
      ))}
      <button
        onClick={add}
        disabled={!canAdd}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 10px', background: 'transparent',
          border: `1px dashed ${canAdd ? EP.teal + '66' : EP.edge}`,
          borderRadius: 6, color: canAdd ? EP.teal : EP.muted,
          cursor: canAdd ? 'pointer' : 'default',
          fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600,
          width: '100%', justifyContent: 'center', marginTop: columns.length ? 2 : 0,
          opacity: canAdd ? 1 : 0.45,
        }}
      >
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M5.5 1v9M1 5.5h9"/>
        </svg>
        {addLabel}
      </button>
    </div>
  );
};

// ─── Variant-aware setup form (uses window.VARIANT_CONFIG_FIELDS) ─
const VariantSetupForm = ({ variant, channel, config, onConfigChange }) => {
  const schemas = (window.VARIANT_CONFIG_FIELDS || {})[variant] || [];
  const metrics = (window.CHANNEL_METRICS || {})[channel] || [];

  if (!schemas.length) return (
    <div style={{ padding: '12px 0', fontFamily: 'var(--font-mono)', fontSize: 12, color: EP.muted, lineHeight: 1.6, textAlign: 'center' }}>
      No configurable fields for this variant.<br/>
      <span style={{ fontSize: 11 }}>Use Browse to pick a different variant.</span>
    </div>
  );

  return (
    <>
      {schemas.map(field => (
        <ESection key={field.key} label={field.label}>
          {field.type === 'enum' && (
            <ESelect
              value={config[field.key] ?? field.default}
              onChange={v => onConfigChange({ ...config, [field.key]: v })}
              options={field.options || []}
            />
          )}
          {field.type === 'columns' && (
            <ColumnsEditor
              columns={Array.isArray(config[field.key]) ? config[field.key] : (Array.isArray(field.default) ? field.default : [])}
              metrics={metrics.length ? metrics : [{ key: field.default, label: field.default }]}
              maxCols={field.maxCols || 6}
              onColumnsChange={cols => onConfigChange({ ...config, [field.key]: cols })}
            />
          )}
          {field.type === 'dimensions' && (
            <ColumnsEditor
              columns={Array.isArray(config[field.key]) ? config[field.key] : (Array.isArray(field.default) ? field.default : [])}
              metrics={((window.CHANNEL_DIMENSIONS || {})[channel] || []).length
                ? (window.CHANNEL_DIMENSIONS[channel] || [])
                : [{ key: Array.isArray(field.default) ? field.default[0] : field.default, label: field.default }]}
              maxCols={field.maxCols || 4}
              onColumnsChange={cols => onConfigChange({ ...config, [field.key]: cols })}
            />
          )}
        </ESection>
      ))}
    </>
  );
};

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
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: active ? EP.teal : EP.muted, letterSpacing: '0.06em' }}>{ct.label}</span>
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
              fontFamily: 'var(--font-display)', fontSize: 12.5, fontWeight: 600,
              transition: 'border-color .12s, background .12s',
            }}>
            <ChannelLogo channel={s.id} size={13}/>
            {s.label}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: EP.muted, padding: '6px 10px', background: EP.elevated, border: `1px solid ${EP.edge}`, borderRadius: 6 }}>
          Semua akun terhubung
        </div>
        {(src === 'google' || src === 'meta') && (
          <ESelect value={state.campaignType || 'all'} onChange={v => setState({ ...state, campaignType: v })}
            options={[{value:'all',label:'All Types'},{value:'search',label:'Search'},{value:'display',label:'Display'},{value:'video',label:'Video'}]}/>
        )}
      </div>
    </ESection>
  );
};

// ─── Filter builder ───────────────────────────────────────────────
const FilterSection = ({ filters, setFilters }) => (
  <ESection label="Filter">
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: EP.muted, padding: '8px 10px', background: EP.elevated, border: `1px dashed ${EP.edge}`, borderRadius: 6, lineHeight: 1.5 }}>
      Per-widget filters are available in the new Setup panel (click a widget directly in the report).
    </div>
  </ESection>
);

// ─── Category-specific Setup fields ──────────────────────────────

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
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: EP.fg }} onClick={() => setState({ ...state, dateRange: o.val })}>{o.label}</span>
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
    <MetricsSelect state={state} setState={setState}/>
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
    <MetricsSelect state={state} setState={setState}/>
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
              style={{ padding: '4px 9px', border: `1px solid ${active.includes(c) ? EP.teal+'88' : EP.edge}`, borderRadius: 5, background: active.includes(c) ? 'rgba(0,194,184,.1)' : EP.elevated, color: active.includes(c) ? EP.teal : EP.muted, fontFamily: 'var(--font-display)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>{c}</button>
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
            style={{ padding: '6px 10px', background: EP.elevated, border: `1px solid ${EP.edge}`, borderRadius: 6, color: EP.sec, cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600 }}>
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
      <textarea value={state.headline || 'Marketing performance March 2025 up 19.7%'} onChange={e => setState({ ...state, headline: e.target.value })}
        rows={2}
        style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', background: EP.elevated, border: `1px solid ${EP.edge}`, borderRadius: 6, color: EP.fg, fontFamily: 'var(--font-display)', fontSize: 15, outline: 'none', resize: 'vertical' }}/>
    </ESection>
    <ESection label="Body copy">
      <textarea value={state.body || 'Conversions increased as budget shifted to Google Ads. Organic SEO grew 8.1% without additional spend.'} onChange={e => setState({ ...state, body: e.target.value })}
        rows={3}
        style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', background: EP.elevated, border: `1px solid ${EP.edge}`, borderRadius: 6, color: EP.sec, fontFamily: 'var(--font-body)', fontSize: 14, outline: 'none', resize: 'vertical', lineHeight: 1.5 }}/>
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

const SetupPageSpeed = () => {
  const [ctrl, setCtrl] = React.useState(() => window._psiControl || null);
  const [keyDraft, setKeyDraft] = React.useState('');
  const [showKey, setShowKey] = React.useState(false);

  React.useEffect(() => {
    const update = () => { const c = window._psiControl; setCtrl(c ? { ...c } : null); };
    window.addEventListener('psiControlUpdate', update);
    update();
    return () => window.removeEventListener('psiControlUpdate', update);
  }, []);

  if (!ctrl) return (
    <div style={{ padding: '12px 0', fontFamily: 'var(--font-mono)', fontSize: 11, color: EP.muted, lineHeight: 1.6 }}>
      Select the PageSpeed widget in the report to enable measurement controls.
    </div>
  );

  const { run, measuring, measureError, lastMeasured, psiApiKey, savePsiApiKey, clearError, retryIn = 0 } = ctrl;
  const teal = '#00C2B8';
  const gold = '#F8B400';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <button onClick={() => run()} disabled={measuring || retryIn > 0} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 14px',
        background: measuring ? 'rgba(0,194,184,.12)' : 'linear-gradient(135deg,#00C2B8,#009E96)',
        border: measuring ? '1px solid rgba(0,194,184,.3)' : 'none',
        borderRadius: 7, cursor: (measuring || retryIn > 0) ? 'not-allowed' : 'pointer',
        color: measuring ? teal : '#0C182C',
        fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700,
        boxShadow: measuring ? 'none' : '0 3px 10px rgba(0,194,184,.22)',
        opacity: retryIn > 0 ? 0.5 : 1, transition: 'all .2s',
      }}>
        {measuring
          ? <><span style={{ width: 10, height: 10, border: '2px solid rgba(0,194,184,.3)', borderTopColor: teal, borderRadius: '50%', display: 'inline-block', animation: 'bootPulse 0.8s linear infinite' }}/> Measuring…</>
          : <><svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.3" viewBox="0 0 24 24" strokeLinecap="round"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg> Run Measurement</>}
      </button>

      {lastMeasured && !measuring && (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: teal }}>✓ Last measured · {lastMeasured}</div>
      )}
      {measuring && (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: EP.muted }}>Contacting Google API… (~10–30s)</div>
      )}
      {retryIn > 0 && !measuring && (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: gold }}>Rate limited · auto-retry in {retryIn}s</div>
      )}

      {/* API Key */}
      <div style={{ borderTop: `1px solid ${EP.edge}`, paddingTop: 8, marginTop: 2 }}>
        <button onClick={() => { setKeyDraft(psiApiKey || ''); setShowKey(v => !v); }}
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', background: 'transparent', border: `1px solid ${showKey ? teal : EP.edge}`, borderRadius: 6, cursor: 'pointer', color: psiApiKey ? teal : EP.muted, fontFamily: 'var(--font-mono)', fontSize: 11 }}>
          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
          </svg>
          {psiApiKey ? 'API Key saved' : 'Set Google API Key'}
        </button>
        {showKey && (
          <div style={{ display: 'flex', gap: 5, marginTop: 6 }}>
            <input value={keyDraft} onChange={e => setKeyDraft(e.target.value)} placeholder="AIza…"
              style={{ flex: 1, padding: '5px 8px', background: EP.elevated, border: `1px solid ${EP.edge}`, borderRadius: 5, color: EP.fg, fontFamily: 'var(--font-mono)', fontSize: 11, outline: 'none' }}/>
            <button onClick={() => { savePsiApiKey?.(keyDraft.trim()); setShowKey(false); clearError?.(); }}
              style={{ padding: '5px 10px', background: 'linear-gradient(135deg,#00C2B8,#009E96)', border: 'none', borderRadius: 5, color: '#0C182C', fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              Save
            </button>
          </div>
        )}
      </div>

      {/* Error states */}
      {measureError === 'rate_limited' && (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: gold, background: 'rgba(248,180,0,.08)', border: '1px solid rgba(248,180,0,.2)', borderRadius: 6, padding: '7px 10px' }}>
          Google PSI is rate-limited.{retryIn > 0 ? ` Auto-retry in ${retryIn}s…` : ' Retrying…'}
        </div>
      )}
      {measureError === 'quota_exceeded' && (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#E3170A', background: 'rgba(227,23,10,.08)', border: '1px solid rgba(227,23,10,.2)', borderRadius: 6, padding: '7px 10px' }}>
          Daily quota exceeded. {!psiApiKey ? 'Add a personal API Key.' : 'Try again tomorrow.'}
        </div>
      )}
      {measureError && measureError !== 'rate_limited' && measureError !== 'quota_exceeded' && (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#E3170A', background: 'rgba(227,23,10,.08)', border: '1px solid rgba(227,23,10,.2)', borderRadius: 6, padding: '7px 10px', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <span style={{ flex: 1 }}>{measureError.includes('Lighthouse returned error') ? 'Google Lighthouse failed to analyze this page. Please try again.' : measureError}</span>
          <button onClick={() => { clearError?.(); run(); }} style={{ padding: '2px 8px', background: 'rgba(227,23,10,.15)', border: '1px solid rgba(227,23,10,.3)', borderRadius: 4, color: '#E3170A', fontFamily: 'var(--font-mono)', fontSize: 10, cursor: 'pointer', flexShrink: 0 }}>Retry</button>
        </div>
      )}
    </div>
  );
};

const SetupCarousel = ({ state, setState }) => (
  <>
    <ESection label="Featured items">
      {[['Top ROAS campaign','chart-sparks'],['Biggest traffic mover','list-pages'],['Monthly goal status','progress-goals']].map(([l, id], i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, padding: '7px 10px', background: EP.elevated, borderRadius: 6, border: `1px solid ${EP.edge}` }}>
          <svg width="9" height="13" viewBox="0 0 9 13" fill={EP.muted}><circle cx="2" cy="2" r="1.1"/><circle cx="7" cy="2" r="1.1"/><circle cx="2" cy="6.5" r="1.1"/><circle cx="7" cy="6.5" r="1.1"/><circle cx="2" cy="11" r="1.1"/><circle cx="7" cy="11" r="1.1"/></svg>
          <span style={{ flex: 1, fontFamily: 'var(--font-body)', fontSize: 13.5, color: EP.fg }}>{l}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: EP.muted }}>{id}</span>
        </div>
      ))}
      <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: 'transparent', border: `1px dashed ${EP.edge}`, borderRadius: 6, color: EP.muted, cursor: 'pointer', fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600, width: '100%', justifyContent: 'center' }}>
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

const CARD_DISPLAY_NAMES = {
  'kpi-strip':       'KPI Strip',
  'chart-area':      'Area Chart',
  'chart-bar':       'Bar Chart',
  'chart-donut':     'Donut Chart',
  'chart-heatmap':   'Heatmap',
  'table-campaigns': 'Campaigns Table',
  'table-rankings':  'Rankings Table',
};
const SRC_DISPLAY = { google: 'Google Ads', meta: 'Meta Ads', ga4: 'GA4', search: 'Search Console' };
const SRC_COLORS  = { google: '#4285F4', meta: '#0866FF', ga4: '#F9AB00', search: '#00C2B8' };

// Per-card widget limits: how many metrics and dimensions make sense
const WIDGET_LIMITS = {
  'kpi-strip':      { maxMetrics: 6, maxDims: 0 },
  'kpi-single':     { maxMetrics: 1, maxDims: 0 },
  'chart-area':     { maxMetrics: 2, maxDims: 0 },
  'chart-bar':      { maxMetrics: 2, maxDims: 0 },
  'chart-donut':    { maxMetrics: 1, maxDims: 1 },
  'chart-heatmap':  { maxMetrics: 0, maxDims: 0 },
  'table-rankings': { maxMetrics: 8, maxDims: 3 },
  'table-campaigns':{ maxMetrics: 8, maxDims: 3 },
};

// Extract human-readable account name from a connected source value
const getSrcAccountLabel = (srcKey, connectedSources) => {
  const src = (connectedSources || {})[srcKey];
  if (!src) return null;
  const name = typeof src === 'object' ? (src.name || src.id || '') : (typeof src === 'string' ? src : '');
  return name ? `${SRC_DISPLAY[srcKey]}: ${name}` : SRC_DISPLAY[srcKey];
};

const getDefaultWidgetName = (cardId, srcKey) =>
  `${CARD_DISPLAY_NAMES[cardId] || cardId} · ${SRC_DISPLAY[srcKey] || srcKey}`;

// ─── Drag handle icon ─────────────────────────────────────────────
const DragDots = () => (
  <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor" style={{ display: 'block' }}>
    <circle cx="3" cy="2.5" r="1.2"/><circle cx="7" cy="2.5" r="1.2"/>
    <circle cx="3" cy="7" r="1.2"/><circle cx="7" cy="7" r="1.2"/>
    <circle cx="3" cy="11.5" r="1.2"/><circle cx="7" cy="11.5" r="1.2"/>
  </svg>
);

// ─── TAB: Setup (simplified) ─────────────────────────────────────────
const SimpleSetupTab = ({ widgetId, cardId, widgetConfig, onConfigChange, connectedSources, sharedWidgetCount = 0, instanceSource, onSourceChange, pageData, onConnectedChange = null, layoutRows = null }) => {
  const [dragMetIdx,  setDragMetIdx]  = React.useState(null);
  const [dragMetOver, setDragMetOver] = React.useState(null);
  const dragAllIdxRef  = React.useRef(null);
  const dragAllOverRef = React.useRef(null);
  const [dragDimIdx,  setDragDimIdx]  = React.useState(null);
  const [dragDimOver, setDragDimOver] = React.useState(null);
  const [metPickerOpen, setMetPickerOpen] = React.useState(false);
  const [customModal,   setCustomModal]   = React.useState(null); // null | {mode:'new'} | {mode:'edit',metric}
  const [customDraft,   setCustomDraft]   = React.useState({ name: '', formula: '', format: 'num' });
  const metPickerRef = React.useRef(null);
  const [addOpen,          setAddOpen]          = React.useState(false);
  const [connectingFor,    setConnectingFor]    = React.useState(null);
  const [accountsFor,      setAccountsFor]      = React.useState({});
  const [loadingFor,       setLoadingFor]       = React.useState(null);
  const [disconnectPending, setDisconnectPending] = React.useState(null);

  React.useEffect(() => {
    if (!metPickerOpen) return;
    const handler = e => { if (metPickerRef.current && !metPickerRef.current.contains(e.target)) setMetPickerOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [metPickerOpen]);

  const openNewCustom = () => {
    setCustomDraft({ name: '', formula: '', format: 'num' });
    setCustomModal({ mode: 'new' });
    setMetPickerOpen(false);
  };
  const openEditCustom = m => {
    setCustomDraft({ name: m.name, formula: m.formula, format: m.format });
    setCustomModal({ mode: 'edit', metric: m });
  };
  const saveCustomMetric = draft => {
    const trimmed = { ...draft, name: draft.name.trim(), formula: draft.formula.trim() };
    if (customModal.mode === 'new') {
      const id = 'cm_' + Math.random().toString(36).slice(2, 8);
      up({ customMetrics: [...(cfg.customMetrics || []), { id, ...trimmed }], metricOrder: [..._metricOrder, id] });
    } else {
      up({ customMetrics: (cfg.customMetrics || []).map(m => m.id === customModal.metric.id ? { ...m, ...trimmed } : m) });
    }
    setCustomModal(null);
  };

  // ── Data derivation (must be before any early return) ────────────
  const widgetType = cardId;
  const srcKey     = instanceSource || (widgetId || '').split('-')[0];
  const dimValMap  = React.useMemo(
    () => (window.DIM_VALUES_EXTRACTOR?.[srcKey] || (() => ({})))(pageData || {}),
    [srcKey, pageData]
  );

  // Must be before any early return (Rules of Hooks).
  const [activeField, setActiveField] = React.useState(null);
  React.useEffect(() => { setActiveField(null); }, [widgetId]);
  React.useEffect(() => {
    if (widgetType !== 'narrative-hero') return;
    const handler = e => setActiveField(e.detail);
    window.addEventListener('narrativeHeroFocus', handler);
    return () => window.removeEventListener('narrativeHeroFocus', handler);
  }, [widgetType]);
  React.useEffect(() => {
    if (widgetType !== 'narrative-note') return;
    const handler = e => setActiveField(e.detail);
    window.addEventListener('narrativeNoteFocus', handler);
    return () => window.removeEventListener('narrativeNoteFocus', handler);
  }, [widgetType]);

  if (!widgetId) {
    return (
      <div style={{ padding: '24px 0', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 12, color: EP.muted, lineHeight: 1.7 }}>
        Select a widget in the report<br/>to edit its settings.
      </div>
    );
  }

  const sharedBanner = null;

  const isTable     = widgetType === 'table' || (widgetType || '').startsWith('table-');

  const regSrc  = window.DATA_REGISTRY?.[srcKey] || {};
  const regKeys = Object.keys(regSrc);
  const availM  = isTable
    ? (window.TABLE_METRICS_REGISTRY?.[srcKey] || [])
    : (regKeys.length > 0
        ? regKeys.map(key => ({ key, label: regSrc[key].label }))
        : []);
  const availD  = window.DIM_REGISTRY?.[srcKey] || [];

  // Widget type flags
  // filterableD — dims valid as filter fields given the current dimension selection
  // Computed inline (not memoized) since it depends on cfg.dimensions which changes with edits
  const isText      = widgetType === 'text';
  const isKpiStrip  = widgetType === 'kpi-strip';
  const isSingleM   = ['single-stat', 'chart-area', 'chart-bar'].includes(widgetType);
  const isDonut     = widgetType === 'chart-donut';
  const isHeatmap   = widgetType === 'chart-heatmap';
  const isNarrHero    = widgetType === 'narrative-hero';
  const isNarrNote    = widgetType === 'narrative-note';
  const isNarrCall    = widgetType === 'narrative-callout';
  const isNarrQuote   = widgetType === 'narrative-quote';
  const isNarrative   = isNarrHero || isNarrNote || isNarrCall || isNarrQuote;
  const isKpiCompare    = widgetType === 'kpi-compare';
  const isListDevices   = widgetType === 'list-devices';

  const DESIGN_ONLY_TYPES = ['carousel-highlights','chart-sparks',
    'progress-psi','progress-goals','progress-pacing',
    'list-keywords','list-pages','list-countries'];
  const isDesignOnly = DESIGN_ONLY_TYPES.includes(widgetType);

  // Merged config — WIDGET_DEFAULTS → saved config
  const typeDefaults = (window.WIDGET_DEFAULTS?.[widgetType]?.[srcKey]) || {};
  const legacyLimits = WIDGET_LIMITS[cardId] || { maxMetrics: 6, maxDims: 5 };
  const cfg = {
    name: '', metrics: availM.slice(0, 4).map(m => m.key), metric: availM[0]?.key || '',
    metricLabels: {}, dimension: availD[0]?.key || '',
    dimensions: availD.slice(0, 1).map(d => d.key),
    filters: [], fontSize: 'M', pageSize: 10, title: '', body: '',
    ...typeDefaults, ...(widgetConfig || {}),
  };

  const up = changes => onConfigChange && onConfigChange(widgetId, changes);
  const connectedList = ['google','meta','ga4','search'].filter(s => connectedSources?.[s]);

  const showCust = !isText && !isNarrative && !isDesignOnly;
  const _validMetricKeys = new Set(cfg.metrics || []);
  const _validCustomMap  = new Map((cfg.customMetrics || []).map(cm => [cm.id, cm]));
  const _metricDefaultOrder = [
    ...(cfg.metrics || []),
    ...(showCust ? (cfg.customMetrics || []).map(cm => cm.id) : []),
  ];
  const _metricOrder = (() => {
    const base = (cfg.metricOrder || _metricDefaultOrder).filter(
      id => _validMetricKeys.has(id) || _validCustomMap.has(id)
    );
    const existing = [...base];
    _metricDefaultOrder.forEach(id => { if (!existing.includes(id)) existing.push(id); });
    return existing;
  })();

  const reorderAllMetrics = (from, to) => {
    const order = [..._metricOrder];
    const [moved] = order.splice(from, 1);
    order.splice(to, 0, moved);
    up({ metricOrder: order });
  };
  const reorderDims = (from, to) => {
    const nx = [...cfg.dimensions]; const [m] = nx.splice(from, 1); nx.splice(to, 0, m); up({ dimensions: nx });
  };

  // Source connect/disconnect helpers
  const handleConnectClick = (s) => {
    if (connectingFor === s) { setConnectingFor(null); return; }
    setConnectingFor(s);
    if (accountsFor[s] !== undefined) return;
    setLoadingFor(s);
    (window._fetchAccounts ? window._fetchAccounts(s) : Promise.resolve([])).then(rows => {
      setAccountsFor(a => ({ ...a, [s]: rows || [] }));
      setLoadingFor(null);
    });
  };
  const handleSelectAccount = (s, acc) => {
    const newConnected = { ...(connectedSources || {}), [s]: acc };
    setConnectingFor(null);
    setAddOpen(false);
    onConnectedChange && onConnectedChange(newConnected);
  };
  const handleDisconnectSource = (s) => {
    const newConnected = { ...(connectedSources || {}) };
    delete newConnected[s];
    onConnectedChange && onConnectedChange(newConnected);
  };

  // Reusable source selector block
  const ALL_SOURCES = ['google', 'meta', 'ga4', 'search'];
  const connectedList2 = ALL_SOURCES.filter(s => connectedSources?.[s]);
  const unconnectedList = ALL_SOURCES.filter(s => !connectedSources?.[s]);
  const SourceSection = (
    <ESection label="Data source">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {/* Connected sources */}
        {connectedList2.map(s => {
          const label = getSrcAccountLabel(s, connectedSources);
          const isCurrent = s === srcKey;
          return (
            <div key={s}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 10px', border: `1px solid ${isCurrent ? SRC_COLORS[s] : SRC_COLORS[s]+'44'}`, borderRadius: 7, background: isCurrent ? SRC_COLORS[s]+'18' : 'transparent', transition: 'background .12s' }}>
              <ChannelLogo channel={s} size={13}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 12.5, fontWeight: 700, color: isCurrent ? SRC_COLORS[s] : EP.sec, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
                {isCurrent && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: EP.muted, marginTop: 1 }}>Active source for this widget</div>}
              </div>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
                {isCurrent && <div style={{ width: 6, height: 6, borderRadius: '50%', background: SRC_COLORS[s] }}/>}
                {onSourceChange && !isCurrent && (
                  <button onClick={() => onSourceChange(widgetId, s)}
                    style={{ padding: '3px 8px', borderRadius: 5, border: `1px solid ${SRC_COLORS[s]}55`, background: `${SRC_COLORS[s]}11`, color: SRC_COLORS[s], fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, cursor: 'pointer', lineHeight: 1.2 }}>
                    Use
                  </button>
                )}
                {onConnectedChange && (
                  <button onClick={e => { e.stopPropagation(); setDisconnectPending(s); }}
                    style={{ padding: '3px 7px', borderRadius: 5, border: '1px solid rgba(220,38,38,.4)', background: 'rgba(220,38,38,.08)', color: '#DC2626', fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, cursor: 'pointer', lineHeight: 1.2 }}>
                    Disconnect
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {connectedList2.length === 0 && !onConnectedChange && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: EP.muted, lineHeight: 1.6 }}>
            No data source connected. Add one in Configure.
          </span>
        )}

        {/* Add Data Source */}
        {onConnectedChange && unconnectedList.length > 0 && (
          <div style={{ position: 'relative', marginTop: connectedList2.length > 0 ? 2 : 0 }}>
            <button onClick={() => { setAddOpen(o => !o); setConnectingFor(null); }}
              style={{ width: '100%', padding: '7px 10px', border: `1px dashed ${addOpen ? EP.teal : EP.edge}`, borderRadius: 7, background: addOpen ? EP.teal+'0D' : 'transparent', color: addOpen ? EP.teal : EP.muted, fontFamily: 'var(--font-display)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, transition: 'all .15s' }}>
              <span style={{ fontSize: 16, lineHeight: 1, marginTop: -1 }}>{addOpen ? '×' : '+'}</span>
              {addOpen ? 'Cancel' : 'Add Data Source'}
            </button>

            {/* Dropdown list — stays open while addOpen, independent of connectingFor */}
            {addOpen && (
              <div style={{ marginTop: 4, border: `1px solid ${EP.edge}`, borderRadius: 8, background: EP.bg, maxHeight: 260, overflowY: 'auto' }}>
                {/* Platform rows */}
                {unconnectedList.map((s, i) => {
                  const isActive = connectingFor === s;
                  const isLoadingThis = loadingFor === s;
                  const accs = accountsFor[s];
                  return (
                    <div key={s} style={{ borderTop: i > 0 ? `1px solid ${EP.edge}` : 'none' }}>
                      <div onClick={() => handleConnectClick(s)}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', cursor: 'pointer', background: isActive ? SRC_COLORS[s]+'11' : 'transparent', transition: 'background .1s' }}
                        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = EP.elevated; }}
                        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}>
                        <ChannelLogo channel={s} size={13}/>
                        <span style={{ flex: 1, fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: isActive ? SRC_COLORS[s] : EP.fg }}>{SRC_DISPLAY[s]}</span>
                        {isActive && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={SRC_COLORS[s]} strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>}
                      </div>
                      {/* Account list for this platform */}
                      {isActive && (
                        <div style={{ borderTop: `1px solid ${EP.edge}`, background: 'rgba(5,10,22,.4)' }}>
                          {isLoadingThis ? (
                            <div style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: 12, color: EP.muted }}>Loading accounts…</div>
                          ) : !accs || accs.length === 0 ? (
                            <div style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: 12, color: EP.muted, lineHeight: 1.6 }}>No accounts in database.</div>
                          ) : (
                            <div style={{ maxHeight: 150, overflowY: 'auto' }}>
                              {accs.map((acc, ai) => (
                                <div key={acc.id} onClick={() => handleSelectAccount(s, acc)}
                                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderTop: ai > 0 ? `1px solid ${EP.edge}` : 'none', cursor: 'pointer', background: 'transparent', transition: 'background .1s' }}
                                  onMouseEnter={e => { e.currentTarget.style.background = SRC_COLORS[s]+'18'; }}
                                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600, color: EP.fg, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{acc.name}</div>
                                    {acc.sub && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: EP.muted, marginTop: 1 }}>{acc.sub}</div>}
                                  </div>
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={EP.muted} strokeWidth="2.2" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </ESection>
  );

  const DisconnectModal = disconnectPending ? (
    <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 320, zIndex: 9999, background: 'rgba(5,10,22,.78)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: EP.bg, border: `1px solid ${EP.edge}`, borderRadius: 10, padding: '20px 18px', width: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: EP.fg }}>
          Disconnect {SRC_DISPLAY[disconnectPending]}?
        </div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 13.5, color: EP.sec, lineHeight: 1.65 }}>
          This will disconnect {SRC_DISPLAY[disconnectPending]} from this client. All widgets using this source will stop displaying data.
        </div>
        {(() => {
          const count = layoutRows ? layoutRows.filter(e => e.source === disconnectPending).length : 0;
          return count > 0 ? (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, color: '#F59E0B', background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.2)', borderRadius: 6, padding: '7px 10px' }}>
              {count} widget(s) in this report are using this source.
            </div>
          ) : null;
        })()}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setDisconnectPending(null)}
            style={{ flex: 1, padding: '9px 0', background: EP.elevated, border: `1px solid ${EP.edge}`, borderRadius: 7, color: EP.sec, fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={() => { handleDisconnectSource(disconnectPending); setDisconnectPending(null); }}
            style={{ flex: 1, padding: '9px 0', background: 'rgba(220,38,38,.12)', border: '1px solid rgba(220,38,38,.4)', borderRadius: 7, color: '#DC2626', fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            Yes, Disconnect
          </button>
        </div>
      </div>
    </div>
  ) : null;

  // ── TEXT WIDGET ──────────────────────────────────────────────────
  if (isText) {
    return (
      <>
        {sharedBanner}
        <ESection label="Title">
          <EInput value={cfg.title || ''} onChange={v => up({ title: v })} placeholder="Judul widget..."/>
        </ESection>
        <EDivider/>
        <ESection label="Body">
          <textarea
            value={cfg.body || ''}
            onChange={e => up({ body: e.target.value })}
            placeholder="Tulis narasi atau penjelasan di sini..."
            rows={7}
            style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', background: EP.elevated, border: `1px solid ${EP.edge}`, borderRadius: 6, color: EP.fg, fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.6, resize: 'vertical', outline: 'none' }}
          />
        </ESection>
      </>
    );
  }

  // ── NARRATIVE HERO ───────────────────────────────────────────────
  if (isNarrHero) {
    const heroBlocks = cfg.blocks && cfg.blocks.length
      ? cfg.blocks
      : [{ headline: cfg.title || '', body: cfg.body || '', headlineColor: '', bodyColor: '' }];
    const upBlock = (i, patch) => {
      const next = heroBlocks.map((b, idx) => idx === i ? { ...b, ...patch } : b);
      up({ blocks: next });
    };
    const addBlock = () => { if (heroBlocks.length < 4) up({ blocks: [...heroBlocks, { headline: '', body: '', headlineColor: '', bodyColor: '' }] }); };
    const removeBlock = (i) => { if (heroBlocks.length > 1) up({ blocks: heroBlocks.filter((_, idx) => idx !== i) }); };
    const hColors = ['', '#FCFCFC', '#00C2B8', '#F8B400', '#F87171'];
    const bColors = ['', '#9BABBF', '#FCFCFC', '#00C2B8', '#F8B400'];
    const colorSwatch = { '': 'Default', '#FCFCFC': 'White', '#00C2B8': 'Teal', '#F8B400': 'Gold', '#F87171': 'Red', '#9BABBF': 'Muted' };

    // Derive the color config from whatever field is currently active
    const af = activeField;
    const afBlock = af ? heroBlocks[af.bi] : null;
    const afColors = af?.field === 'body' ? bColors : hColors;
    const afColorKey = af?.field === 'body' ? 'bodyColor' : 'headlineColor';
    const afCurrentColor = afBlock ? afBlock[afColorKey] : null;
    const afDefaultBg = af?.field === 'body' ? 'rgba(155,171,191,0.6)' : 'rgba(255,255,255,0.85)';
    const afLabel = af ? (af.field === 'body' ? 'Body color' : 'Headline color') : 'Text color';
    const afSublabel = af ? `Section ${af.bi + 1}` : null;

    return (
      <>
        <ESizeButtons label="Font size" value={cfg.fontSize || 'M'} onChange={v => up({ fontSize: v })}/>
        <EDivider/>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <ELabel>Sections ({heroBlocks.length} / 4)</ELabel>
          <div style={{ display: 'flex', gap: 6 }}>
            {heroBlocks.length > 1 && (
              <button
                onMouseDown={e => e.preventDefault()}
                onClick={() => removeBlock(heroBlocks.length - 1)}
                style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 5, color: '#F87171', cursor: 'pointer', padding: '4px 8px' }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14"/></svg>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700 }}>Remove</span>
              </button>
            )}
            {heroBlocks.length < 4 && (
              <button
                onMouseDown={e => e.preventDefault()}
                onClick={addBlock}
                style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'rgba(0,194,184,0.12)', border: '1px solid rgba(0,194,184,0.3)', borderRadius: 5, color: '#00C2B8', cursor: 'pointer', padding: '4px 8px' }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700 }}>Add</span>
              </button>
            )}
          </div>
        </div>
        {af && (
          <ESection label="Formatting">
            <FormattingToolbar/>
          </ESection>
        )}
        {af && afBlock && (
          <ESection label={afLabel}>
            {afSublabel && heroBlocks.length > 1 && (
              <p style={{ margin: '0 0 6px', fontFamily: 'var(--font-body)', fontSize: 12, color: EP.muted }}>{afSublabel}</p>
            )}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              {afColors.map(c => (
                <div key={c} title={colorSwatch[c]}
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => upBlock(af.bi, { [afColorKey]: c })}
                  style={{ width: 22, height: 22, borderRadius: '50%', cursor: 'pointer',
                    background: c || afDefaultBg,
                    border: afCurrentColor === c ? `2px solid ${EP.fg}` : '2px solid transparent',
                    boxShadow: afCurrentColor === c ? `0 0 0 2px ${c || EP.fg}` : 'none',
                    flexShrink: 0 }}/>
              ))}
            </div>
          </ESection>
        )}
      </>
    );
  }

  // ── NARRATIVE NOTE (analyst note, 3 beats) ───────────────────────
  if (isNarrNote) {
    const af = activeField;
    const beatCount = Math.min(6, Math.max(2, cfg.beatCount || 3));
    const tColors = ['', '#FCFCFC', '#00C2B8', '#F8B400', '#F87171'];
    const bColors = ['', '#9BABBF', '#FCFCFC', '#00C2B8', '#F8B400'];
    const colorSwatch = { '': 'Default', '#FCFCFC': 'White', '#00C2B8': 'Teal', '#F8B400': 'Gold', '#F87171': 'Red', '#9BABBF': 'Muted' };
    const afColors     = af?.field === 'body' ? bColors : tColors;
    const afColorKey   = af ? `beat${af.bi + 1}_${af.field}Color` : null;
    const afCurrentColor = afColorKey ? (cfg[afColorKey] || '') : null;
    const afDefaultBg  = af?.field === 'body' ? 'rgba(155,171,191,0.6)' : 'rgba(255,255,255,0.85)';
    const afLabel      = af ? (af.field === 'body' ? 'Body color' : 'Title color') : 'Text color';
    return (
      <>
        <ESizeButtons label="Font size" value={cfg.fontSize || 'M'} onChange={v => up({ fontSize: v })}/>
        <EDivider/>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <ELabel>Sections ({beatCount} / 6)</ELabel>
          <div style={{ display: 'flex', gap: 6 }}>
            {beatCount > 2 && (
              <button
                onMouseDown={e => e.preventDefault()}
                onClick={() => up({ beatCount: beatCount - 1 })}
                style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 5, color: '#F87171', cursor: 'pointer', padding: '4px 8px' }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14"/></svg>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700 }}>Remove</span>
              </button>
            )}
            {beatCount < 6 && (
              <button
                onMouseDown={e => e.preventDefault()}
                onClick={() => up({ beatCount: beatCount + 1 })}
                style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'rgba(0,194,184,0.12)', border: '1px solid rgba(0,194,184,0.3)', borderRadius: 5, color: '#00C2B8', cursor: 'pointer', padding: '4px 8px' }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700 }}>Add</span>
              </button>
            )}
          </div>
        </div>
        {af && (
          <>
            <ESection label="Formatting">
              <FormattingToolbar/>
            </ESection>
            <ESection label={afLabel}>
              <p style={{ margin: '0 0 6px', fontFamily: 'var(--font-body)', fontSize: 12, color: EP.muted }}>Beat {af.bi + 1}</p>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                {afColors.map(c => (
                  <div key={c} title={colorSwatch[c]}
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => up({ [afColorKey]: c })}
                    style={{ width: 22, height: 22, borderRadius: '50%', cursor: 'pointer',
                      background: c || afDefaultBg,
                      border: afCurrentColor === c ? `2px solid ${EP.fg}` : '2px solid transparent',
                      boxShadow: afCurrentColor === c ? `0 0 0 2px ${c || EP.fg}` : 'none',
                      flexShrink: 0 }}/>
                ))}
              </div>
            </ESection>
          </>
        )}
      </>
    );
  }

  // ── NARRATIVE CALLOUT ────────────────────────────────────────────
  if (isNarrCall) {
    return (
      <>
        {sharedBanner}
        <ESection label="Title">
          <EInput value={cfg.title || ''} onChange={v => up({ title: v })} placeholder="3 pages could move to top-3"/>
        </ESection>
        <EDivider/>
        <ESection label="Body text">
          <textarea value={cfg.body || ''} onChange={e => up({ body: e.target.value })}
            placeholder="Detailed explanation of this opportunity..."
            rows={4} style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', background: EP.elevated, border: `1px solid ${EP.edge}`, borderRadius: 6, color: EP.fg, fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.6, resize: 'vertical', outline: 'none' }}/>
        </ESection>
        <EDivider/>
        <ESection label="CTA button">
          <EInput value={cfg.cta || ''} onChange={v => up({ cta: v })} placeholder="Create action plan →"/>
        </ESection>
      </>
    );
  }

  // ── NARRATIVE QUOTE ──────────────────────────────────────────────
  if (isNarrQuote) {
    return (
      <>
        {sharedBanner}
        <ESection label="Quote text">
          <textarea value={cfg.quote || ''} onChange={e => up({ quote: e.target.value })}
            placeholder='"Monthly reports are now prepared so much faster..."'
            rows={4} style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', background: EP.elevated, border: `1px solid ${EP.edge}`, borderRadius: 6, color: EP.fg, fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.6, resize: 'vertical', outline: 'none' }}/>
        </ESection>
        <EDivider/>
        <ESection label="Author">
          <EInput value={cfg.author || ''} onChange={v => up({ author: v })} placeholder="Dimas Pratama"/>
        </ESection>
        <ESection label="Role / company">
          <EInput value={cfg.role || ''} onChange={v => up({ role: v })} placeholder="Client · PT Kopi Senja Nusantara"/>
        </ESection>
      </>
    );
  }

  // ── Shared filter section for all Data & KPI widgets ────────────
  const KPI_FILTER_OPS = [
    { value: 'contains',   label: 'Contains' },
    { value: 'is',         label: 'Equals' },
    { value: 'not',        label: 'Not equal' },
    { value: 'starts',     label: 'Starts with' },
    { value: 'regex',      label: 'Matches /regex/' },
    { value: 'not_regex',  label: 'Not /regex/' },
  ];
  function renderFilterRows(filtersArr, onChange, dims) {
    const defaultDim = dims[0]?.key;
    return filtersArr.map(function(f, fi) {
      return (
        <div key={fi} style={{ background: EP.elevated, border: `1px solid ${EP.edge}`, borderRadius: 6, padding: '7px 8px', display: 'flex', flexDirection: 'column', gap: 5 }}>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <ESelect value={f.dim || defaultDim} onChange={function(v) { var nf = filtersArr.slice(); nf[fi] = Object.assign({}, f, { dim: v, val: '' }); onChange(nf); }}
                options={dims.map(function(d) { return { value: d.key, label: d.label }; })}/>
            </div>
            <div style={{ width: 100, flexShrink: 0 }}>
              <ESelect value={f.op || 'contains'} onChange={function(v) { var nf = filtersArr.slice(); nf[fi] = Object.assign({}, f, { op: v }); onChange(nf); }}
                options={KPI_FILTER_OPS}/>
            </div>
            <button onClick={function() { onChange(filtersArr.filter(function(_, j) { return j !== fi; })); }}
              style={{ width: 24, height: 24, border: `1px solid ${EP.edge}`, borderRadius: 4, background: 'transparent', color: EP.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16, lineHeight: 1 }}>×</button>
          </div>
          {(dimValMap[f.dim || defaultDim] || []).length > 0 && f.op !== 'regex' && f.op !== 'not_regex' ? (
            <select value={f.val || ''} onChange={function(e) { var nf = filtersArr.slice(); nf[fi] = Object.assign({}, f, { val: e.target.value }); onChange(nf); }}
              style={{ width: '100%', boxSizing: 'border-box', padding: '6px 10px', background: EP.surface, border: `1px solid ${EP.edge}`, borderRadius: 5, color: f.val ? EP.fg : EP.muted, fontFamily: 'var(--font-body)', fontSize: 13.5, outline: 'none' }}>
              <option value="">— pilih nilai —</option>
              {(dimValMap[f.dim || defaultDim] || []).map(function(v) { return <option key={v} value={v}>{v}</option>; })}
            </select>
          ) : (
            <input value={f.val || ''} onChange={function(e) { var nf = filtersArr.slice(); nf[fi] = Object.assign({}, f, { val: e.target.value }); onChange(nf); }}
              placeholder={(f.op === 'regex' || f.op === 'not_regex') ? 'Pattern… e.g. brand|toko' : 'nilai filter…'}
              style={{ width: '100%', boxSizing: 'border-box', padding: '6px 10px', background: EP.surface, border: `1px solid ${EP.edge}`, borderRadius: 5, color: EP.fg, fontFamily: 'var(--font-body)', fontSize: 13.5, outline: 'none' }}/>
          )}
        </div>
      );
    });
  }
  function renderKpiFilterSection() {
    if (!availD.length) return null;
    const defaultDim = availD[0]?.key;
    const filtersArr = cfg.filters || [];
    return (
      <>
        <EDivider/>
        <ESection label="Filters">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 6 }}>
            {renderFilterRows(filtersArr, function(nf) { up({ filters: nf }); }, availD)}
          </div>
          <button onClick={() => up({ filters: [...filtersArr, { dim: defaultDim, op: 'contains', val: '' }] })}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 8px', background: 'transparent', border: `1px dashed ${EP.edge}`, borderRadius: 5, color: EP.muted, cursor: 'pointer', fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 600 }}>
            <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4.5 1v7M1 4.5h7"/></svg>
            Add filter
          </button>
        </ESection>
      </>
    );
  }

  // ── KPI COMPARE (period comparison widget) ───────────────────────
  if (isKpiCompare) {
    const nfmt = cfg.numberFormat || 'compact';
    return (
      <>
        {sharedBanner}
        <ESection label="Widget name">
          <EInput value={cfg.name || ''} onChange={v => up({ name: v })} placeholder={availM.find(m => m.key === (cfg.metric || availM[0]?.key))?.label || 'Widget name...'}/>
        </ESection>
        <EDivider/>
        {SourceSection}
        {DisconnectModal}
        {availM.length > 0 && (
          <>
            <EDivider/>
            <ESection label="Metric">
              {(() => {
                const activeCm  = (cfg.customMetrics || [])[0] || null;
                const activeKey = activeCm ? null : (cfg.metric || availM[0]?.key);
                const isOpen    = metPickerOpen === 'single';
                const btnLabel  = activeCm ? activeCm.name : (availM.find(m => m.key === activeKey)?.label || activeKey || '—');
                const toggle    = () => setMetPickerOpen(isOpen ? null : 'single');
                return (
                  <div style={{ position: 'relative' }}>
                    <div style={{ display: 'flex', width: '100%', background: EP.elevated, border: `1px solid ${EP.edge}`, borderRadius: 6, overflow: 'hidden' }}>
                      <button onClick={toggle}
                        style={{ flex: 1, minWidth: 0, padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: 'none', cursor: 'pointer' }}>
                        {activeCm && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: EP.teal, background: `${EP.teal}22`, padding: '1px 5px', borderRadius: 3, flexShrink: 0 }}>fx</span>}
                        <span style={{ flex: 1, fontFamily: 'var(--font-body)', fontSize: 14, color: EP.fg, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{btnLabel}</span>
                      </button>
                      {activeCm && (
                        <>
                          <div style={{ width: 1, background: EP.edge, alignSelf: 'stretch' }}/>
                          <button onClick={() => openEditCustom(activeCm)}
                            style={{ width: 36, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: EP.muted }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                        </>
                      )}
                      <div style={{ width: 1, background: EP.edge, alignSelf: 'stretch' }}/>
                      <button onClick={toggle}
                        style={{ width: 32, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={EP.muted} strokeWidth="2" strokeLinecap="round"><path d="M6 9l6 6 6-6"/></svg>
                      </button>
                    </div>
                    {isOpen && (
                      <>
                        <div style={{ position: 'fixed', inset: 0, zIndex: 1999 }} onClick={() => setMetPickerOpen(null)}/>
                        <MetricPickerDropdown
                          availMetrics={availM}
                          selectedKeys={activeKey ? [activeKey] : []}
                          showCustom={true}
                          singleSelect={true}
                          onAdd={key => { up({ metric: key, customMetrics: [] }); setMetPickerOpen(null); }}
                          onCustom={() => { up({ metric: null, customMetrics: [] }); setMetPickerOpen(null); openNewCustom(); }}
                          onClose={() => setMetPickerOpen(null)}
                        />
                      </>
                    )}
                    {customModal && (
                      <CustomMetricModal draft={customDraft} setDraft={setCustomDraft} availMetrics={availM}
                        mode={customModal.mode} onSave={saveCustomMetric} onClose={() => setCustomModal(null)}/>
                    )}
                  </div>
                );
              })()}
            </ESection>
          </>
        )}
        <EDivider/>
        <ESection label="Number format">
          <div style={{ display: 'flex', gap: 6 }}>
            {[['compact', 'Compact', '7.6K'], ['detail', 'Detail', '7,600']].map(([val, label, hint]) => (
              <button key={val} onClick={() => up({ numberFormat: val })}
                style={{ flex: 1, padding: '6px 4px', background: nfmt === val ? EP.teal + '22' : 'transparent', border: `1px solid ${nfmt === val ? EP.teal : EP.edge}`, borderRadius: 6, color: nfmt === val ? EP.teal : EP.muted, cursor: 'pointer', fontFamily: 'var(--font-display)', fontSize: 12.5, fontWeight: 600, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <span>{label}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, opacity: 0.7 }}>{hint}</span>
              </button>
            ))}
          </div>
        </ESection>
        {renderKpiFilterSection()}
      </>
    );
  }


  // ── LIST DEVICES (category split bars) ───────────────────────────
  if (isListDevices) {
    const LABEL_DEFAULTS = ['Mobile', 'Desktop', 'Tablet'];
    const PCT_DEFAULTS   = ['72', '22', '6'];
    const numInp = (key, placeholder) => (
      <input value={cfg[key] != null ? String(cfg[key]) : ''} onChange={e => { const v = e.target.value; up({ [key]: v === '' ? null : (isNaN(Number(v)) ? v : Number(v)) }); }}
        placeholder={placeholder}
        style={{ width: '70px', flexShrink: 0, padding: '8px 10px', background: EP.elevated, border: `1px solid ${EP.edge}`, borderRadius: 6, color: EP.fg, fontFamily: 'var(--font-mono)', fontSize: 13, outline: 'none' }}
      />
    );
    return (
      <>
        {sharedBanner}
        <ESection label="Title">
          <EInput value={cfg.title || ''} onChange={v => up({ title: v })} placeholder="Device split"/>
        </ESection>
        {[1, 2, 3].map(i => (
          <React.Fragment key={i}>
            <EDivider/>
            <ESection label={`Row ${i}`}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <EInput value={cfg[`label${i}`] || ''} onChange={v => up({ [`label${i}`]: v })} placeholder={LABEL_DEFAULTS[i-1]}/>
                </div>
                {numInp(`pct${i}`, PCT_DEFAULTS[i-1])}
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: EP.muted }}>%</span>
              </div>
            </ESection>
          </React.Fragment>
        ))}
      </>
    );
  }

  // ── DESIGN-ONLY WIDGETS (carousel, progress-*, list-*) ───────────
  if (isDesignOnly) {
    if (widgetType === 'progress-psi') {
      return (
        <>
          <ESection label="Widget name">
            <EInput value={cfg.name || ''} onChange={v => up({ name: v })} placeholder="Widget name..."/>
          </ESection>
          <EDivider/>
          <ESizeButtons label="Font size" value={cfg.fontSize || 'M'} onChange={v => up({ fontSize: v })}/>
          <EDivider/>
          <ESection label="Run Measurement">
            <SetupPageSpeed/>
          </ESection>
        </>
      );
    }
    return (
      <>
        {sharedBanner}
        <ESection label="Widget name">
          <EInput value={cfg.name || ''} onChange={v => up({ name: v })} placeholder="Widget name..."/>
        </ESection>
        <EDivider/>
        <div style={{ display: 'flex', gap: 8, padding: '10px 12px', background: EP.elevated, border: `1px solid ${EP.edge}`, borderRadius: 8 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={EP.muted} strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: EP.muted, lineHeight: 1.5 }}>
            This is a <strong style={{ color: EP.sec }}>design template</strong> widget with built-in content. Additional content settings are not yet available.
          </div>
        </div>
      </>
    );
  }

  // ── Searchable metric picker trigger (ESelect-style button → MetricPickerDropdown) ──
  function renderMetricPickerTrigger(selectedKey, pickerKey, onAdd, disabledKeys) {
    const isOpen = metPickerOpen === pickerKey;
    const label = availM.find(m => m.key === selectedKey)?.label || selectedKey || '—';
    return (
      <div style={{ position: 'relative' }}>
        <button onClick={() => setMetPickerOpen(isOpen ? null : pickerKey)}
          style={{ width: '100%', padding: '8px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: EP.elevated, border: `1px solid ${EP.edge}`, borderRadius: 6, cursor: 'pointer', textAlign: 'left' }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: EP.fg }}>{label}</span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={EP.muted} strokeWidth="2" strokeLinecap="round"><path d="M6 9l6 6 6-6"/></svg>
        </button>
        {isOpen && (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 1999 }} onClick={() => setMetPickerOpen(null)}/>
            <MetricPickerDropdown
              availMetrics={availM}
              selectedKeys={disabledKeys || [selectedKey].filter(Boolean)}
              showCustom={true}
              singleSelect={true}
              onAdd={key => { onAdd(key); setMetPickerOpen(null); }}
              onCustom={() => { setMetPickerOpen(null); openNewCustom(); }}
              onClose={() => setMetPickerOpen(null)}
            />
          </>
        )}
      </div>
    );
  }

  // ── Custom metrics body — list (+ optional add button) + modal, no section wrapper ──
  function renderCustomMetricsBody(showAdd) { return (
    <>
      {(cfg.customMetrics || []).length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 6 }}>
          {(cfg.customMetrics || []).map(cm => (
            <div key={cm.id} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px', background: `${EP.teal}0C`, border: `1px solid ${EP.teal}30`, borderRadius: 5 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: EP.teal, background: `${EP.teal}22`, padding: '1px 4px', borderRadius: 3, flexShrink: 0 }}>fx</span>
                <span style={{ flex: 1, fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: EP.teal, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cm.name}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: EP.muted, flexShrink: 0 }}>{cm.format === 'rupiah' ? 'Rp' : cm.format === 'pct' ? '%' : '#'}</span>
              </div>
              <button onClick={() => openEditCustom(cm)} title="Edit formula"
                style={{ width: 24, height: 24, border: `1px solid ${EP.edge}`, borderRadius: 5, background: 'transparent', color: EP.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button onClick={() => up({ customMetrics: (cfg.customMetrics || []).filter(m => m.id !== cm.id) })}
                style={{ width: 24, height: 24, border: `1px solid rgba(220,38,38,.3)`, borderRadius: 5, background: 'rgba(220,38,38,.08)', color: EP.red, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
          ))}
        </div>
      )}
      {showAdd && (
        <button onClick={openNewCustom}
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', background: 'transparent', border: `1px dashed ${EP.teal}66`, borderRadius: 5, color: EP.teal, cursor: 'pointer', fontFamily: 'var(--font-display)', fontSize: 12.5, fontWeight: 600, width: '100%', justifyContent: 'center', marginTop: 6 }}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 1v8M1 5h8"/></svg>
          Add custom metric
        </button>
      )}
      {customModal && (
        <CustomMetricModal
          draft={customDraft}
          setDraft={setCustomDraft}
          availMetrics={availM}
          mode={customModal.mode}
          onSave={saveCustomMetric}
          onClose={() => setCustomModal(null)}
        />
      )}
    </>
  ); }

  // ── Shared custom-metrics block — with its own section header (heatmap, donut, etc.) ──
  function renderCustomMetrics() { return (
    <>
      <EDivider/>
      <ESection label={`Custom Metrics${(cfg.customMetrics || []).length ? ` (${(cfg.customMetrics || []).length})` : ''}`}>
        {renderCustomMetricsBody(true)}
      </ESection>
    </>
  ); }

  // ── HEATMAP WIDGET ───────────────────────────────────────────────
  if (isHeatmap) {
    return (
      <>
        {sharedBanner}
        <ESection label="Widget name">
          <EInput value={cfg.name} onChange={v => up({ name: v })} placeholder="Traffic Intensity"/>
        </ESection>
        <EDivider/>
        {SourceSection}
        {DisconnectModal}
        {renderKpiFilterSection()}
        {renderCustomMetrics()}
      </>
    );
  }

  // ── SINGLE-METRIC WIDGETS (single-stat, chart-area, chart-bar) ───
  if (isSingleM) {
    return (
      <>
        {sharedBanner}
        <ESection label="Widget name">
          <EInput value={cfg.name} onChange={v => up({ name: v })} placeholder={getDefaultWidgetName(cardId, srcKey)}/>
        </ESection>
        <EDivider/>
        {SourceSection}
        {DisconnectModal}
        {availM.length > 0 && (
          <>
            <EDivider/>
            <ESection label="Metric">
              {(() => {
                const activeCm  = (cfg.customMetrics || [])[0] || null;
                const activeKey = activeCm ? null : (cfg.metric || availM[0]?.key);
                const isOpen    = metPickerOpen === 'single';
                const btnLabel  = activeCm ? activeCm.name : (availM.find(m => m.key === activeKey)?.label || activeKey || '—');
                const toggle    = () => setMetPickerOpen(isOpen ? null : 'single');
                return (
                  <div style={{ position: 'relative' }}>
                    <div style={{ display: 'flex', width: '100%', background: EP.elevated, border: `1px solid ${EP.edge}`, borderRadius: 6, overflow: 'hidden' }}>
                      <button onClick={toggle}
                        style={{ flex: 1, minWidth: 0, padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: 'none', cursor: 'pointer' }}>
                        {activeCm && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: EP.teal, background: `${EP.teal}22`, padding: '1px 5px', borderRadius: 3, flexShrink: 0 }}>fx</span>}
                        <span style={{ flex: 1, fontFamily: 'var(--font-body)', fontSize: 14, color: EP.fg, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{btnLabel}</span>
                      </button>
                      {activeCm && (
                        <>
                          <div style={{ width: 1, background: EP.edge, alignSelf: 'stretch' }}/>
                          <button onClick={() => openEditCustom(activeCm)}
                            style={{ width: 36, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: EP.muted }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                        </>
                      )}
                      <div style={{ width: 1, background: EP.edge, alignSelf: 'stretch' }}/>
                      <button onClick={toggle}
                        style={{ width: 32, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={EP.muted} strokeWidth="2" strokeLinecap="round"><path d="M6 9l6 6 6-6"/></svg>
                      </button>
                    </div>
                    {isOpen && (
                      <>
                        <div style={{ position: 'fixed', inset: 0, zIndex: 1999 }} onClick={() => setMetPickerOpen(null)}/>
                        <MetricPickerDropdown
                          availMetrics={availM}
                          selectedKeys={activeKey ? [activeKey] : []}
                          showCustom={true}
                          singleSelect={true}
                          onAdd={key => { up({ metric: key, customMetrics: [] }); setMetPickerOpen(null); }}
                          onCustom={() => { up({ metric: null, customMetrics: [] }); setMetPickerOpen(null); openNewCustom(); }}
                          onClose={() => setMetPickerOpen(null)}
                        />
                      </>
                    )}
                    {customModal && (
                      <CustomMetricModal draft={customDraft} setDraft={setCustomDraft} availMetrics={availM}
                        mode={customModal.mode} onSave={saveCustomMetric} onClose={() => setCustomModal(null)}/>
                    )}
                  </div>
                );
              })()}
            </ESection>
          </>
        )}
        {availM.length === 0 && renderCustomMetrics()}
        {widgetType === 'chart-area' && availM.length > 0 && (
          <>
            <EDivider/>
            <ESection label="Second metric (B)">
              {(() => {
                const activeKeyB = cfg.metricB || null;
                const isOpen = metPickerOpen === 'single-b';
                const btnLabel = activeKeyB ? (availM.find(m => m.key === activeKeyB)?.label || activeKeyB) : 'None — single series';
                const toggle = () => setMetPickerOpen(isOpen ? null : 'single-b');
                return (
                  <div style={{ position: 'relative' }}>
                    <div style={{ display: 'flex', width: '100%', background: EP.elevated, border: `1px solid ${EP.edge}`, borderRadius: 6, overflow: 'hidden' }}>
                      <button onClick={toggle}
                        style={{ flex: 1, minWidth: 0, padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: 'none', cursor: 'pointer' }}>
                        <span style={{ flex: 1, fontFamily: 'var(--font-body)', fontSize: 14, color: activeKeyB ? EP.fg : EP.muted, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{btnLabel}</span>
                      </button>
                      {activeKeyB && (
                        <>
                          <div style={{ width: 1, background: EP.edge, alignSelf: 'stretch' }}/>
                          <button onClick={() => up({ metricB: null })}
                            style={{ width: 32, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: EP.muted }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                          </button>
                        </>
                      )}
                      <div style={{ width: 1, background: EP.edge, alignSelf: 'stretch' }}/>
                      <button onClick={toggle}
                        style={{ width: 32, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={EP.muted} strokeWidth="2" strokeLinecap="round"><path d="M6 9l6 6 6-6"/></svg>
                      </button>
                    </div>
                    {isOpen && (
                      <>
                        <div style={{ position: 'fixed', inset: 0, zIndex: 1999 }} onClick={() => setMetPickerOpen(null)}/>
                        <MetricPickerDropdown
                          availMetrics={availM.filter(m => window.DATA_REGISTRY?.[srcKey]?.[m.key]?.series)}
                          selectedKeys={activeKeyB ? [activeKeyB] : []}
                          showCustom={false}
                          singleSelect={true}
                          onAdd={key => { up({ metricB: key }); setMetPickerOpen(null); }}
                          onClose={() => setMetPickerOpen(null)}
                        />
                      </>
                    )}
                  </div>
                );
              })()}
            </ESection>
          </>
        )}
        {widgetType === 'chart-area' && (
          <>
            <EDivider/>
            <ESection label="Number format">
              <div style={{ display: 'flex', background: EP.elevated, borderRadius: 100, padding: 3, border: `1px solid ${EP.edge}` }}>
                {[['auto', 'Auto'], ['detail', 'Detail']].map(([val, label]) => (
                  <button key={val} onClick={() => up({ numFmt: val })}
                    style={{ flex: 1, padding: '5px 8px', border: 'none', borderRadius: 100, cursor: 'pointer', textAlign: 'center',
                      background: (cfg.numFmt||'auto') === val ? EP.teal : 'transparent',
                      color: (cfg.numFmt||'auto') === val ? '#0C182C' : EP.muted,
                      fontFamily: 'var(--font-display)', fontSize: 12.5, fontWeight: 600,
                      transition: 'background .12s, color .12s' }}>
                    {label}
                  </button>
                ))}
              </div>
            </ESection>
            <EDivider/>
            <ESection label="Chart size">
              <div style={{ display: 'flex', background: EP.elevated, borderRadius: 100, padding: 3, border: `1px solid ${EP.edge}` }}>
                {['S', 'M', 'L'].map(s => (
                  <button key={s} onClick={() => up({ fontSize: s })}
                    style={{ flex: 1, padding: '5px 0', border: 'none', borderRadius: 100, cursor: 'pointer', textAlign: 'center',
                      background: (cfg.fontSize || 'M') === s ? EP.teal : 'transparent',
                      color: (cfg.fontSize || 'M') === s ? '#0C182C' : EP.sec,
                      fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700,
                      transition: 'background .12s, color .12s' }}>
                    {s}
                  </button>
                ))}
              </div>
            </ESection>
          </>
        )}
        {widgetType === 'single-stat' && (
          <>
            <EDivider/>
            <ESection label="Number format">
              <div style={{ display: 'flex', gap: 6 }}>
                {[['compact', 'Compact', '7.6K'], ['detail', 'Detail', '7,600']].map(([val, label, hint]) => (
                  <button key={val} onClick={() => up({ numberFormat: val })}
                    style={{ flex: 1, padding: '6px 4px', background: (cfg.numberFormat||'compact') === val ? EP.teal + '22' : 'transparent', border: `1px solid ${(cfg.numberFormat||'compact') === val ? EP.teal : EP.edge}`, borderRadius: 6, color: (cfg.numberFormat||'compact') === val ? EP.teal : EP.muted, cursor: 'pointer', fontFamily: 'var(--font-display)', fontSize: 12.5, fontWeight: 600, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <span>{label}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, opacity: 0.7 }}>{hint}</span>
                  </button>
                ))}
              </div>
            </ESection>
          </>
        )}
        {renderKpiFilterSection()}
      </>
    );
  }

  // ── DONUT CHART ──────────────────────────────────────────────────
  if (isDonut) {
    return (
      <>
        {sharedBanner}
        <ESection label="Widget name">
          <EInput value={cfg.name} onChange={v => up({ name: v })} placeholder={getDefaultWidgetName(cardId, srcKey)}/>
        </ESection>
        <EDivider/>
        {SourceSection}
        {DisconnectModal}
        {availD.length > 0 && (
          <>
            <EDivider/>
            <ESection label="Group by">
              <ESelect value={cfg.dimension || availD[0]?.key} onChange={v => up({ dimension: v })}
                options={availD.map(d => ({ value: d.key, label: d.label }))}/>
            </ESection>
          </>
        )}
        {availM.length > 0 && (
          <>
            <EDivider/>
            <ESection label="Metric">
              <ESelect value={cfg.metric || availM[0]?.key} onChange={v => up({ metric: v })}
                options={availM.map(m => ({ value: m.key, label: m.label }))}/>
            </ESection>
          </>
        )}
        {renderKpiFilterSection()}
        {renderCustomMetrics()}
      </>
    );
  }

  // ── KPI STRIP + TABLE (multi-metric / multi-dim) ─────────────────
  const maxMetrics = isKpiStrip ? 6 : legacyLimits.maxMetrics;
  const maxDims    = isTable ? Math.min(3, legacyLimits.maxDims || 3) : legacyLimits.maxDims;

  return (
    <>
      {sharedBanner}
      <ESection label="Widget name">
        <EInput value={cfg.name} onChange={v => up({ name: v })} placeholder={getDefaultWidgetName(cardId, srcKey)}/>
      </ESection>
      {isTable && (
        <>
          <EDivider/>
          <ESizeButtons label="Font size" value={cfg.fontSize || 'M'} onChange={v => up({ fontSize: v })}/>
        </>
      )}
      <EDivider/>
      {SourceSection}
      {DisconnectModal}

      {isTable && availD.length > 0 && srcKey !== 'search' && (
        <>
          <EDivider/>
          <ESection label={`Dimensions (${(cfg.dimensions || []).length}/${maxDims})`}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 6 }}>
              {(cfg.dimensions || []).map((key, i) => (
                <div key={i}
                  draggable
                  onDragStart={() => setDragDimIdx(i)}
                  onDragEnter={() => setDragDimOver(i)}
                  onDragOver={e => e.preventDefault()}
                  onDragEnd={() => { if (dragDimIdx !== null && dragDimOver !== null && dragDimIdx !== dragDimOver) reorderDims(dragDimIdx, dragDimOver); setDragDimIdx(null); setDragDimOver(null); }}
                  style={{ display: 'flex', gap: 4, alignItems: 'center', opacity: dragDimIdx === i ? 0.4 : 1, borderTop: dragDimOver === i && dragDimIdx !== i ? `2px solid ${EP.teal}` : '2px solid transparent' }}
                >
                  <div title="Drag to reorder" style={{ cursor: 'grab', color: EP.muted, display: 'flex', alignItems: 'center', flexShrink: 0 }}><DragDots/></div>
                  <div style={{ flex: 1 }}>
                    <ESelect value={key} onChange={v => { const nx = [...cfg.dimensions]; nx[i] = v; up({ dimensions: nx }); }}
                      options={availD.map(d => ({ value: d.key, label: d.label, disabled: d.key !== key && cfg.dimensions.includes(d.key) }))}/>
                  </div>
                  <button onClick={() => up({ dimensions: cfg.dimensions.filter((_, j) => j !== i) })}
                    disabled={cfg.dimensions.length <= 1}
                    style={{ width: 24, height: 24, border: `1px solid rgba(220,38,38,.3)`, borderRadius: 5, background: 'rgba(220,38,38,.08)', color: EP.red, cursor: cfg.dimensions.length <= 1 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: cfg.dimensions.length <= 1 ? 0.3 : 1 }}>
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  </button>
                </div>
              ))}
            </div>
            {cfg.dimensions.length < maxDims && availD.some(d => !cfg.dimensions.includes(d.key)) && (
              <button onClick={() => { const f = availD.find(d => !cfg.dimensions.includes(d.key)); if (f) up({ dimensions: [...cfg.dimensions, f.key] }); }}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', background: 'transparent', border: `1px dashed ${EP.teal}66`, borderRadius: 5, color: EP.teal, cursor: 'pointer', fontFamily: 'var(--font-display)', fontSize: 12.5, fontWeight: 600, width: '100%', justifyContent: 'center' }}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 1v8M1 5h8"/></svg>
                Add dimension
              </button>
            )}
          </ESection>
        </>
      )}

      {availM.length > 0 && (
        <>
          <EDivider/>
          <ESection label={`Metrics (${(cfg.metrics || []).length + (cfg.customMetrics || []).length}/${maxMetrics})`}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 6 }}>
              {(() => {
                const items = _metricOrder.map(id => {
                  if (_validMetricKeys.has(id)) {
                    const origI = (cfg.metrics || []).indexOf(id);
                    return { type: 'metric', key: id, origI };
                  }
                  const cm = _validCustomMap.get(id);
                  if (cm) return { type: 'custom', cm };
                  return null;
                }).filter(Boolean);
                const dragHandlers = i => ({
                  draggable: true,
                  onDragStart: () => { dragAllIdxRef.current = i; setDragMetIdx(i); },
                  onDragEnter: () => { dragAllOverRef.current = i; setDragMetOver(i); },
                  onDragOver: e => e.preventDefault(),
                  onDragEnd: () => {
                    const from = dragAllIdxRef.current; const to = dragAllOverRef.current;
                    if (from !== null && to !== null && from !== to) reorderAllMetrics(from, to);
                    dragAllIdxRef.current = null; dragAllOverRef.current = null;
                    setDragMetIdx(null); setDragMetOver(null);
                  },
                });
                const dragStyle = i => ({
                  display: 'flex', gap: 4, alignItems: 'center',
                  opacity: dragMetIdx === i ? 0.4 : 1,
                  borderTop: dragMetOver === i && dragMetIdx !== i ? `2px solid ${EP.teal}` : '2px solid transparent',
                });
                return items.map((item, i) => {
                  if (item.type === 'metric') {
                    const { key, origI } = item;
                    const meta = availM.find(m => m.key === key) || { key, label: key };
                    return (
                      <div key={`m_${key}`} {...dragHandlers(i)} style={dragStyle(i)}>
                        <div title="Drag to reorder" style={{ cursor: 'grab', color: EP.muted, display: 'flex', alignItems: 'center', flexShrink: 0 }}><DragDots/></div>
                        <div style={{ flex: 1 }}>
                          <ESelect value={key} onChange={v => { const nx = [...cfg.metrics]; nx[origI] = v; up({ metrics: nx }); }}
                            options={availM.map(m => ({ value: m.key, label: m.label, disabled: m.key !== key && cfg.metrics.includes(m.key) }))}/>
                        </div>
                        <input value={cfg.metricLabels?.[key] ?? meta.label}
                          onChange={e => up({ metricLabels: { ...(cfg.metricLabels || {}), [key]: e.target.value } })}
                          placeholder={meta.label}
                          style={{ width: 72, padding: '6px 7px', background: EP.elevated, border: `1px solid ${EP.edge}`, borderRadius: 5, color: EP.fg, fontFamily: 'var(--font-body)', fontSize: 13, outline: 'none' }}
                        />
                        <button onClick={() => { const newMet = cfg.metrics.filter((_, j) => j !== origI); up({ metrics: newMet, metricOrder: _metricOrder.filter(id => id !== key) }); }}
                          disabled={cfg.metrics.length <= 1}
                          style={{ width: 24, height: 24, border: `1px solid rgba(220,38,38,.3)`, borderRadius: 5, background: 'rgba(220,38,38,.08)', color: EP.red, cursor: cfg.metrics.length <= 1 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: cfg.metrics.length <= 1 ? 0.3 : 1 }}>
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                        </button>
                      </div>
                    );
                  } else {
                    const { cm } = item;
                    return (
                      <div key={`c_${cm.id}`} {...dragHandlers(i)} style={dragStyle(i)}>
                        <div style={{ cursor: 'grab', color: EP.muted, display: 'flex', alignItems: 'center', flexShrink: 0 }}><DragDots/></div>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px', background: `${EP.teal}0C`, border: `1px solid ${EP.teal}30`, borderRadius: 5 }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: EP.teal, background: `${EP.teal}22`, padding: '1px 4px', borderRadius: 3, flexShrink: 0 }}>fx</span>
                          <span style={{ flex: 1, fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: EP.teal, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cm.name}</span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: EP.muted, flexShrink: 0 }}>{cm.format === 'rupiah' ? 'Rp' : cm.format === 'pct' ? '%' : '#'}</span>
                        </div>
                        <button onClick={() => openEditCustom(cm)} title="Edit formula"
                          style={{ width: 24, height: 24, border: `1px solid ${EP.edge}`, borderRadius: 5, background: 'transparent', color: EP.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button onClick={() => up({ customMetrics: (cfg.customMetrics || []).filter(m => m.id !== cm.id), metricOrder: _metricOrder.filter(id => id !== cm.id) })}
                          style={{ width: 24, height: 24, border: `1px solid rgba(220,38,38,.3)`, borderRadius: 5, background: 'rgba(220,38,38,.08)', color: EP.red, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                        </button>
                      </div>
                    );
                  }
                });
              })()}
            </div>

            {/* Add metric — picker trigger */}
            {((cfg.metrics || []).length + (cfg.customMetrics || []).length) < maxMetrics && (
              <div style={{ position: 'relative' }} ref={metPickerRef}>
                <button onClick={() => setMetPickerOpen(o => !o)}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', background: 'transparent', border: `1px dashed ${EP.teal}66`, borderRadius: 5, color: EP.teal, cursor: 'pointer', fontFamily: 'var(--font-display)', fontSize: 12.5, fontWeight: 600, width: '100%', justifyContent: 'center' }}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 1v8M1 5h8"/></svg>
                  Add metric
                </button>
                {metPickerOpen && (
                  <MetricPickerDropdown
                    availMetrics={availM}
                    selectedKeys={cfg.metrics || []}
                    showCustom={!isText && !isNarrative && !isDesignOnly}
                    onAdd={key => { up({ metrics: [...(cfg.metrics || []), key], metricOrder: [..._metricOrder, key] }); setMetPickerOpen(false); }}
                    onCustom={openNewCustom}
                    onClose={() => setMetPickerOpen(false)}
                  />
                )}
              </div>
            )}
          </ESection>
        </>
      )}

      {isKpiStrip && renderKpiFilterSection()}

      {isTable && (
        <>
          <EDivider/>
          <ESection label="Filters">
            {(() => {
              const validFilterKeys = (window.FILTER_DIM_REGISTRY?.[srcKey] || (() => availD.map(d => d.key)))(cfg.dimensions || []);
              const filterableD = availD.filter(d => validFilterKeys.includes(d.key));
              const defaultFilterDim = filterableD[0]?.key || availD[0]?.key || 'name';
              const filtersArr = cfg.filters || [];
              return (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 6 }}>
                    {renderFilterRows(filtersArr, function(nf) { up({ filters: nf }); }, filterableD)}
                  </div>
                  <button onClick={() => up({ filters: [...filtersArr, { dim: defaultFilterDim, op: 'contains', val: '' }] })}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 8px', background: 'transparent', border: `1px dashed ${EP.edge}`, borderRadius: 5, color: EP.muted, cursor: 'pointer', fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 600 }}>
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4.5 1v7M1 4.5h7"/></svg>
                    Add filter
                  </button>
                </>
              );
            })()}
          </ESection>
        </>
      )}

      {/* Custom metric formula modal */}
      {customModal && (
        <CustomMetricModal
          draft={customDraft}
          setDraft={setCustomDraft}
          availMetrics={availM}
          mode={customModal.mode}
          onSave={saveCustomMetric}
          onClose={() => setCustomModal(null)}
        />
      )}

    </>
  );
};

// ─── Metric picker dropdown ───────────────────────────────────────

const MetricPickerDropdown = ({ availMetrics, selectedKeys, showCustom, onAdd, onCustom, onClose, singleSelect }) => {
  const [search, setSearch] = React.useState('');
  const filtered = availMetrics.filter(m =>
    !search || m.label.toLowerCase().includes(search.toLowerCase()) || m.key.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 2000, background: EP.bg, border: `1px solid ${EP.edge}`, borderRadius: 8, boxShadow: '0 10px 30px rgba(0,0,0,.5)', overflow: 'hidden' }}>
      <div style={{ padding: '7px 8px', borderBottom: `1px solid ${EP.edge}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px', background: EP.elevated, border: `1px solid ${EP.edge}`, borderRadius: 5 }}>
          <svg width="10" height="10" fill="none" stroke={EP.muted} strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari metric…" autoFocus
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: EP.fg, fontFamily: 'var(--font-body)', fontSize: 13 }}/>
        </div>
      </div>
      <div style={{ maxHeight: 200, overflowY: 'auto' }}>
        {filtered.map(m => {
          const picked = selectedKeys.includes(m.key);
          const disabled = picked && !singleSelect;
          return (
            <button key={m.key} disabled={disabled} onClick={() => { onAdd(m.key); onClose(); }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '8px 12px', background: 'none', border: 'none', textAlign: 'left', cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.38 : 1 }}>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: EP.fg }}>{m.label}</span>
              {picked && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={EP.teal} strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>}
            </button>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ padding: '12px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 12, color: EP.muted }}>No match</div>
        )}
      </div>
      {showCustom && (
        <div style={{ borderTop: `1px solid ${EP.edge}`, padding: '6px' }}>
          <button onClick={onCustom}
            style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 10px', background: `${EP.teal}0D`, border: `1px solid ${EP.teal}33`, borderRadius: 6, cursor: 'pointer', textAlign: 'left' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, fontWeight: 700, color: EP.teal, background: `${EP.teal}25`, padding: '2px 5px', borderRadius: 3 }}>fx</span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600, color: EP.teal }}>Custom Metric</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: EP.muted, marginLeft: 'auto' }}>Buat formula sendiri →</span>
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Custom metric formula modal ──────────────────────────────────

const CustomMetricModal = ({ draft, setDraft, availMetrics, mode, onSave, onClose }) => {
  const formulaRef = React.useRef(null);

  const insert = text => {
    const el = formulaRef.current;
    if (!el) { setDraft(d => ({ ...d, formula: d.formula + text })); return; }
    const s = el.selectionStart, e = el.selectionEnd;
    setDraft(d => ({ ...d, formula: d.formula.slice(0, s) + text + d.formula.slice(e) }));
    setTimeout(() => { el.focus(); el.setSelectionRange(s + text.length, s + text.length); }, 0);
  };

  const OPERATORS = ['+', '-', '×', '÷', '(', ')'];
  const OP_MAP = { '+': ' + ', '-': ' - ', '×': ' * ', '÷': ' / ', '(': '(', ')': ')' };
  const FORMAT_OPTS = [
    { value: 'num',    label: '# Numeric' },
    { value: 'pct',    label: '% Percent' },
    { value: 'rupiah', label: 'Rp Currency' },
  ];
  const canSave = draft.name.trim() && draft.formula.trim();

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()}
        style={{ width: 400, maxHeight: '90vh', overflowY: 'auto', background: EP.bg, border: `1px solid ${EP.edge}`, borderRadius: 12, boxShadow: '0 24px 64px rgba(0,0,0,.7)' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', borderBottom: `1px solid ${EP.edge}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: EP.teal, background: `${EP.teal}22`, padding: '2px 6px', borderRadius: 3 }}>fx</span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: EP.fg }}>{mode === 'new' ? 'Custom Metric' : 'Edit Metric'}</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: EP.muted, cursor: 'pointer', padding: 4, display: 'flex' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 13 }}>

          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: EP.muted, letterSpacing: '0.08em', marginBottom: 5 }}>LABEL</div>
            <input value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} placeholder="e.g. CPM"
              style={{ width: '100%', boxSizing: 'border-box', padding: '7px 9px', background: EP.elevated, border: `1px solid ${EP.edge}`, borderRadius: 6, color: EP.fg, fontFamily: 'var(--font-body)', fontSize: 14, outline: 'none' }}/>
          </div>

          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: EP.muted, letterSpacing: '0.08em', marginBottom: 5 }}>FORMULA</div>
            <textarea ref={formulaRef} value={draft.formula} onChange={e => setDraft(d => ({ ...d, formula: e.target.value }))}
              placeholder="e.g. (spend / impressions) * 1000" rows={2}
              style={{ width: '100%', boxSizing: 'border-box', padding: '7px 9px', background: EP.elevated, border: `1px solid ${EP.edge}`, borderRadius: 6, color: EP.teal, fontFamily: 'var(--font-mono)', fontSize: 14, outline: 'none', resize: 'none', lineHeight: 1.55 }}/>
          </div>

          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: EP.muted, letterSpacing: '0.08em', marginBottom: 6 }}>VARIABLES</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {availMetrics.map(m => (
                <button key={m.key} onClick={() => insert(m.key)}
                  style={{ padding: '3px 8px', background: `${EP.teal}0E`, border: `1px solid ${EP.teal}30`, borderRadius: 4, color: EP.teal, cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.5 }}>
                  {m.key}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: EP.muted, letterSpacing: '0.08em', marginBottom: 6 }}>OPERATORS</div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {OPERATORS.map(op => (
                <button key={op} onClick={() => insert(OP_MAP[op])}
                  style={{ width: 34, height: 30, background: EP.elevated, border: `1px solid ${EP.edge}`, borderRadius: 5, color: EP.fg, cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {op}
                </button>
              ))}
              {[1000, 100].map(n => (
                <button key={n} onClick={() => insert(String(n))}
                  style={{ padding: '0 10px', height: 30, background: EP.elevated, border: `1px solid ${EP.edge}`, borderRadius: 5, color: EP.muted, cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 12.5, display: 'flex', alignItems: 'center' }}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: EP.muted, letterSpacing: '0.08em', marginBottom: 6 }}>FORMAT HASIL</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {FORMAT_OPTS.map(f => (
                <button key={f.value} onClick={() => setDraft(d => ({ ...d, format: f.value }))}
                  style={{ flex: 1, padding: '6px 4px', background: draft.format === f.value ? `${EP.teal}1A` : 'transparent', border: `1px solid ${draft.format === f.value ? EP.teal : EP.edge}`, borderRadius: 6, color: draft.format === f.value ? EP.teal : EP.muted, cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 11.5, fontWeight: draft.format === f.value ? 700 : 400, textAlign: 'center' }}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', gap: 8, padding: '12px 16px', borderTop: `1px solid ${EP.edge}` }}>
          <button onClick={onClose}
            style={{ flex: 1, padding: '7px 0', background: 'transparent', border: `1px solid ${EP.edge}`, borderRadius: 6, color: EP.muted, cursor: 'pointer', fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600 }}>
            Cancel
          </button>
          <button onClick={() => canSave && onSave(draft)} disabled={!canSave}
            style={{ flex: 2, padding: '7px 0', background: canSave ? EP.teal : EP.elevated, border: 'none', borderRadius: 6, color: canSave ? '#0B1628' : EP.muted, cursor: canSave ? 'pointer' : 'default', fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700 }}>
            {mode === 'new' ? 'Add Metric' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── TAB: Style ───────────────────────────────────────────────────

const ACCENT_COLORS = ['#F8B400', '#00C2B8', '#7000FF', '#4285F4', '#16A34A', '#E3170A', '#0EA5E9', '#EC4899'];

const StyleTab = ({ state, setState, widgetConfig, widgetId, cardId, onConfigChange }) => {
  const wcfg = widgetConfig || {};
  const wup  = changes => onConfigChange && onConfigChange(widgetId, changes);
  const isTableStyle = cardId === 'table' || (cardId || '').startsWith('table-');
  return (
  <>
    <ESection label="Font size">
      <ESizeButtons value={wcfg.fontSize || 'M'} onChange={v => wup({ fontSize: v })}/>
    </ESection>
    <EDivider/>
    {isTableStyle && (
      <>
        <ESection label="Rows per page">
          <div style={{ display: 'flex', gap: 5 }}>
            {[5, 10, 20, 50].map(n => (
              <button key={n} onClick={() => wup({ pageSize: n })}
                style={{ flex: 1, padding: '6px 0', fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, borderRadius: 6, cursor: 'pointer', border: `1px solid ${(wcfg.pageSize || 10) === n ? EP.teal : EP.edge}`, background: (wcfg.pageSize || 10) === n ? EP.teal + '22' : 'transparent', color: (wcfg.pageSize || 10) === n ? EP.teal : EP.muted }}
              >{n}</button>
            ))}
          </div>
        </ESection>
        <EDivider/>
      </>
    )}
    <ESection label="Card title">
      <EToggle value={state.showTitle !== false} onChange={v => setState({ ...state, showTitle: v })} label="Show title"/>
    </ESection>
    <EDivider/>
    <ESection label="Text size">
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
          <input value={r.val} style={{ width: 42, padding: '5px 6px', background: EP.elevated, border: `1px solid ${EP.edge}`, borderRadius: 5, color: EP.fg, fontFamily: 'var(--font-mono)', fontSize: 13, outline: 'none' }}/>
          <div style={{ width: 20, height: 20, borderRadius: '50%', background: r.color || EP.green, cursor: 'pointer', border: `1.5px solid ${EP.edge}`, flexShrink: 0 }}/>
        </div>
      ))}
      <button onClick={() => setState({ ...state, fmtRules: [...(state.fmtRules||[]), {metric:'delta',op:'gt',val:'0',color:EP.green}]})}
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: 'transparent', border: `1px dashed ${EP.edge}`, borderRadius: 6, color: EP.muted, cursor: 'pointer', fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600, width: '100%', justifyContent: 'center' }}>
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
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: EP.muted }}>{state.posColor || EP.green}</span>
        </div>
      </div>
      <div style={{ marginBottom: 10 }}>
        <ELabel>Negative change color</ELabel>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {[EP.red, '#F8B400', EP.muted].map(c => <EColorDot key={c} color={c} selected={(state.negColor||EP.red)===c} onClick={() => setState({ ...state, negColor: c })}/>)}
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: EP.muted }}>{state.negColor || EP.red}</span>
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
};

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
              <span style={{ flex: 1, fontFamily: 'var(--font-body)', fontSize: 15, color: EP.fg }}>{p.label}</span>
              {p.current
                ? <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: EP.teal, padding: '2px 7px', background: 'rgba(0,194,184,.1)', borderRadius: 4, letterSpacing: '0.08em' }}>ACTIVE</span>
                : <button onClick={() => remove(p.id)} style={{ padding: '3px 7px', background: 'rgba(220,38,38,.12)', border: '1px solid rgba(220,38,38,.3)', borderRadius: 5, color: EP.red, cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 12 }}>×</button>
              }
            </div>
          ))}
        </div>
        <button onClick={add} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px', background: 'transparent', border: `1px dashed ${EP.edge}`, borderRadius: 6, color: EP.muted, cursor: 'pointer', fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600, width: '100%', justifyContent: 'center', marginTop: 6 }}>
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5.5 1v9M1 5.5h9"/></svg>
          Add New Page
        </button>
      </ESection>
      <EDivider/>
      <ESection label="Website profiles">
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 13.5, color: EP.sec, lineHeight: 1.5, margin: '0 0 10px' }}>Link a secondary name to a website URL. When the account is selected, the PA bar automatically filters by URL.</p>
        {profiles.map((p, i) => (
          <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 5, alignItems: 'center' }}>
            <EInput value={p.name} onChange={v => { const np = [...profiles]; np[i] = { ...p, name: v }; setState({ ...state, profiles: np }); }} placeholder="Profile name"/>
            <EInput value={p.url} onChange={v => { const np = [...profiles]; np[i] = { ...p, url: v }; setState({ ...state, profiles: np }); }} placeholder="URL" mono/>
          </div>
        ))}
        <button onClick={() => setState({ ...state, profiles: [...profiles, { name: '', url: '' }]})}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px', background: 'rgba(0,194,184,.08)', border: `1px solid rgba(0,194,184,.3)`, borderRadius: 6, color: EP.teal, cursor: 'pointer', fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, width: '100%', justifyContent: 'center', marginTop: 4 }}>
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5.5 1v9M1 5.5h9"/></svg>
          Add Profile
        </button>
      </ESection>
    </>
  );
};

// ─── Widget thumbnail mockups ────────────────────────────────────
const CardThumbnail = ({ cardId }) => {
  const T = '#00C2B8', Td = 'rgba(0,194,184,.22)', Ts = 'rgba(0,194,184,.12)';
  const Au = '#F8B400', Gr = '#4ADE80', Pu = 'rgba(148,80,255,.8)';
  const sp = { width: '100%', viewBox: '0 0 110 62', fill: 'none',
               style: { display: 'block' } };
  // dark thumbnail bg that works on all card states
  const bg = <rect width="110" height="62" fill="rgba(5,12,28,.55)"/>;

  switch (cardId) {
    /* ── KPI ───────────────────────────────────────────────── */
    case 'kpi-single': return (
      <svg {...sp}>{bg}
        <text x="10" y="16" fontFamily="monospace" fontSize="5.5" fill="rgba(255,255,255,.3)" letterSpacing=".5">SESSIONS</text>
        <text x="10" y="34" fontFamily="monospace" fontSize="17" fontWeight="700" fill={T}>24.830</text>
        <text x="10" y="46" fontFamily="monospace" fontSize="7" fill={Gr}>▲ 8.1%</text>
        <polyline points="62,54 70,48 78,44 86,46 94,36 102,28 110,20" stroke={T} strokeWidth="1.5" opacity=".7"/>
        <path d="M62,54 70,48 78,44 86,46 94,36 102,28 110,20 110,62 62,62Z" fill={Ts} opacity=".6"/>
      </svg>);

    case 'kpi-strip': return (
      <svg {...sp}>{bg}
        {[0,1,2,3].map(i=>(
          <g key={i} transform={`translate(${i*27+2},7)`}>
            <rect width="24" height="48" rx="3" fill="rgba(255,255,255,.04)" stroke="rgba(255,255,255,.06)" strokeWidth=".5"/>
            <rect x="4" y="5" width="16" height="3" rx="1.5" fill="rgba(255,255,255,.18)"/>
            <text x="12" y="27" textAnchor="middle" fontFamily="monospace" fontSize="9" fontWeight="700" fill={T}>1.4K</text>
            <text x="12" y="38" textAnchor="middle" fontFamily="monospace" fontSize="5.5" fill={Gr}>▲ 5%</text>
            <rect x="4" y="43" width="16" height="2" rx="1" fill="rgba(255,255,255,.09)"/>
          </g>))}
      </svg>);

    case 'kpi-compare': return (
      <svg {...sp}>{bg}
        <line x1="55" y1="8" x2="55" y2="54" stroke="rgba(255,255,255,.07)" strokeWidth=".8"/>
        <text x="9" y="17" fontFamily="monospace" fontSize="5" fill="rgba(255,255,255,.3)">THIS PERIOD</text>
        <text x="9" y="33" fontFamily="monospace" fontSize="14" fontWeight="700" fill={T}>2.4K</text>
        <text x="9" y="45" fontFamily="monospace" fontSize="6.5" fill={Gr}>▲ 12.3%</text>
        <text x="60" y="17" fontFamily="monospace" fontSize="5" fill="rgba(255,255,255,.3)">PREV PERIOD</text>
        <text x="60" y="33" fontFamily="monospace" fontSize="14" fontWeight="700" fill="rgba(255,255,255,.45)">2.1K</text>
        <text x="60" y="45" fontFamily="monospace" fontSize="6.5" fill="rgba(255,255,255,.25)">Mar 2025</text>
      </svg>);

    /* ── Charts ────────────────────────────────────────────── */
    case 'chart-area': return (
      <svg {...sp}>{bg}
        {[16,30,44].map(y=><line key={y} x1="8" y1={y} x2="106" y2={y} stroke="rgba(255,255,255,.04)" strokeWidth=".5"/>)}
        <path d="M8,52 22,44 38,38 54,30 70,25 88,18 106,12 106,56 8,56Z" fill={Td} opacity=".7"/>
        <polyline points="8,52 22,44 38,38 54,30 70,25 88,18 106,12" stroke={T} strokeWidth="1.5"/>
        <path d="M8,56 22,52 38,48 54,44 70,40 88,36 106,32 106,56 8,56Z" fill="rgba(248,180,0,.13)" opacity=".7"/>
        <polyline points="8,56 22,52 38,48 54,44 70,40 88,36 106,32" stroke={Au} strokeWidth="1.2" strokeDasharray="3 2"/>
      </svg>);

    case 'chart-area-axes': return (
      <svg {...sp}>{bg}
        <line x1="18" y1="52" x2="106" y2="52" stroke="rgba(255,255,255,.2)" strokeWidth=".8"/>
        <line x1="18" y1="8"  x2="18"  y2="52" stroke="rgba(255,255,255,.2)" strokeWidth=".8"/>
        {[10,26,42].map((y,i)=><text key={i} x="15" y={y} textAnchor="end" fontFamily="monospace" fontSize="4.5" fill="rgba(255,255,255,.28)">{(3-i)*10}</text>)}
        {[36,58,80,100].map((x,i)=><text key={i} x={x} y="59" textAnchor="middle" fontFamily="monospace" fontSize="4.5" fill="rgba(255,255,255,.28)">W{i+1}</text>)}
        <path d="M20,46 38,38 56,30 74,23 92,18 106,13 106,52 20,52Z" fill={Td} opacity=".6"/>
        <polyline points="20,46 38,38 56,30 74,23 92,18 106,13" stroke={T} strokeWidth="1.5"/>
      </svg>);

    case 'chart-line': return (
      <svg {...sp}>{bg}
        <text x="9" y="16" fontFamily="monospace" fontSize="5.5" fill="rgba(255,255,255,.3)">SESSIONS</text>
        <text x="9" y="31" fontFamily="monospace" fontSize="14" fontWeight="700" fill={T}>24.830</text>
        <text x="9" y="41" fontFamily="monospace" fontSize="7" fill={Gr}>▲ 8.1%</text>
        <path d="M0,62 20,55 42,51 62,48 80,40 96,30 110,20 110,62Z" fill={Ts} opacity=".5"/>
        <polyline points="0,62 20,55 42,51 62,48 80,40 96,30 110,20" stroke={T} strokeWidth="1.5"/>
        <circle cx="96" cy="30" r="3" fill={T}/>
      </svg>);

    case 'chart-bar': return (
      <svg {...sp}>{bg}
        {[[10,36],[24,22],[38,30],[52,16],[66,28],[80,20],[94,34]].map(([x,y],i)=>(
          <rect key={i} x={x} y={y} width="12" height={54-y} rx="2"
            fill={i===3?T:Td} opacity={i===3?1:.75}/>))}
        <line x1="5" y1="54" x2="108" y2="54" stroke="rgba(255,255,255,.1)" strokeWidth=".7"/>
      </svg>);

    case 'chart-donut': return (
      <svg {...sp}>{bg}
        <circle cx="34" cy="31" r="21" stroke="rgba(255,255,255,.06)" strokeWidth="10" fill="none"/>
        <circle cx="34" cy="31" r="21" stroke={T}  strokeWidth="10" fill="none"
          strokeDasharray="83 48.8" strokeDashoffset="33"/>
        <circle cx="34" cy="31" r="21" stroke={Au} strokeWidth="10" fill="none"
          strokeDasharray="30 101.8" strokeDashoffset="-50"/>
        <circle cx="34" cy="31" r="21" stroke="rgba(148,80,255,.7)" strokeWidth="10" fill="none"
          strokeDasharray="18.8 113" strokeDashoffset="-80"/>
        <text x="34" y="34" textAnchor="middle" fontFamily="monospace" fontSize="8" fontWeight="700" fill={T}>65%</text>
        {[[T,'Search 63%'],[Au,'Display 23%'],[Pu,'Video 14%']].map(([c,l],i)=>(
          <g key={i} transform={`translate(66,${i*12+14})`}>
            <rect width="6" height="6" rx="1.5" fill={c}/>
            <text x="9" y="5.5" fontFamily="monospace" fontSize="6" fill="rgba(255,255,255,.45)">{l}</text>
          </g>))}
      </svg>);

    case 'chart-heatmap': return (
      <svg {...sp}>{bg}
        {Array.from({length:5},(_,r)=>Array.from({length:7},(_,c)=>{
          const v=Math.sin(r*1.3+c*0.9)*0.5+0.5;
          return <rect key={`${r}${c}`} x={c*14+8} y={r*10+5} width="12" height="8" rx="1.5"
            fill={`rgba(0,194,184,${(0.08+v*0.72).toFixed(2)})`}/>;
        }))}
      </svg>);

    case 'chart-sparks': return (
      <svg {...sp}>{bg}
        {[
          {y:7,  pts:"24,17 34,14 44,10 54,12 64,8  74,6  84,9"},
          {y:20, pts:"24,29 34,26 44,28 54,24 64,22 74,20 84,24"},
          {y:33, pts:"24,42 34,40 44,43 54,38 64,36 74,41 84,37"},
          {y:46, pts:"24,55 34,52 44,54 54,51 64,50 74,53 84,49"},
        ].map(({y,pts},i)=>(
          <g key={i}>
            <rect x="6"  y={y+2} width="15" height="2.5" rx="1.2" fill="rgba(255,255,255,.2)"/>
            <polyline points={pts} stroke={T} strokeWidth="1.2" opacity=".9"/>
            <rect x="88" y={y+2} width="16" height="2.5" rx="1.2" fill="rgba(255,255,255,.35)"/>
          </g>))}
      </svg>);

    /* ── Tables ────────────────────────────────────────────── */
    case 'table-channels': return (
      <svg {...sp}>{bg}
        <rect x="4" y="5" width="102" height="9" rx="2" fill="rgba(255,255,255,.07)"/>
        {[8,32,56,80].map((x,i)=><rect key={i} x={x} y="7.5" width={[18,16,16,16][i]} height="3.5" rx="1" fill="rgba(255,255,255,.22)"/>)}
        {[17,27,37,47].map((y,ri)=>(
          <g key={ri}>
            <rect x="4" y={y} width="102" height="8.5" rx="1" fill={ri%2===0?'rgba(255,255,255,.03)':'none'}/>
            {[0,1,2,3].map(ci=>(
              <rect key={ci} x={[8,32,56,80][ci]} y={y+2.5} width={[18,16,16,16][ci]} height="3" rx="1"
                fill={ci===0?'rgba(255,255,255,.22)':ci===1?`rgba(0,194,184,${0.18+ri*0.04})`:'rgba(255,255,255,.1)'}/>))}
          </g>))}
      </svg>);

    case 'table-campaigns': return (
      <svg {...sp}>{bg}
        {[0,1,2,3,4].map(i=>(
          <g key={i} transform={`translate(6,${i*11+6})`}>
            <circle cx="5" cy="4.5" r="4" fill={[T,Au,'#7C3AED','rgba(255,255,255,.3)',T][i]} opacity=".8"/>
            <rect x="14" y="2" width={[42,32,38,26,34][i]} height="3" rx="1.5" fill="rgba(255,255,255,.22)"/>
            <rect x="72" y="2" width="14" height="3" rx="1.5" fill="rgba(255,255,255,.14)"/>
            <rect x="90" y="2" width="12" height="3" rx="1.5" fill={i<3?Td:'rgba(255,255,255,.1)'}/>
          </g>))}
      </svg>);

    case 'table-rankings': return (
      <svg {...sp}>{bg}
        {[0,1,2,3,4].map(i=>(
          <g key={i} transform={`translate(6,${i*11+6})`}>
            <text x="7" y="7.5" textAnchor="middle" fontFamily="monospace" fontSize="6.5" fontWeight="700"
              fill={i<3?T:'rgba(255,255,255,.28)'}>{i+1}</text>
            <rect x="16" y="2" width={[50,42,36,28,20][i]} height="3" rx="1.5" fill="rgba(255,255,255,.22)"/>
            <rect x="72" y="2" width="14" height="3" rx="1.5" fill="rgba(255,255,255,.14)"/>
            <rect x="90" y="2" width={[28,22,16,10,6][i]} height="3" rx="1.5" fill={Td}/>
          </g>))}
      </svg>);

    /* ── Progress ──────────────────────────────────────────── */
    case 'progress-psi': return (
      <svg {...sp}>{bg}
        {[[26,22],[84,22],[26,48],[84,48]].map(([cx,cy],i)=>(
          <g key={i}>
            <circle cx={cx} cy={cy} r="13" stroke="rgba(255,255,255,.07)" strokeWidth="5" fill="none"/>
            <circle cx={cx} cy={cy} r="13" stroke={[T,T,Gr,Au][i]} strokeWidth="5" fill="none"
              strokeDasharray={`${[51,40,46,30][i]} 81.7`} strokeDashoffset="20.4" strokeLinecap="round"/>
            <text x={cx} y={cy+3} textAnchor="middle" fontFamily="monospace" fontSize="6" fontWeight="700"
              fill="rgba(255,255,255,.85)">{[90,78,86,65][i]}</text>
          </g>))}
      </svg>);


    case 'progress-goals': return (
      <svg {...sp}>{bg}
        {[[0.82,T],[0.55,Au],[0.91,Gr],[0.38,'rgba(255,255,255,.38)']].map(([pct,color],i)=>(
          <g key={i} transform={`translate(8,${i*13+7})`}>
            <rect x="0" y="0" width="18" height="3" rx="1.5" fill="rgba(255,255,255,.18)"/>
            <rect x="22" y="0" width="76" height="5" rx="2.5" fill="rgba(255,255,255,.07)"/>
            <rect x="22" y="0" width={76*pct} height="5" rx="2.5" fill={color} opacity=".8"/>
          </g>))}
      </svg>);

    case 'progress-pacing': return (
      <svg {...sp}>{bg}
        <text x="8" y="14" fontFamily="monospace" fontSize="5.5" fill="rgba(255,255,255,.3)">BUDGET PACING</text>
        <rect x="8" y="22" width="94" height="11" rx="5.5" fill="rgba(255,255,255,.07)"/>
        <rect x="8" y="22" width="66" height="11" rx="5.5" fill={T} opacity=".75"/>
        <line x1="74" y1="18" x2="74" y2="37" stroke="rgba(255,255,255,.55)" strokeWidth="1.5"/>
        <text x="8"  y="48" fontFamily="monospace" fontSize="7.5" fontWeight="700" fill={T}>1.5 Jt</text>
        <text x="52" y="48" fontFamily="monospace" fontSize="6.5" fill="rgba(255,255,255,.28)">of 2.0 Jt (70%)</text>
      </svg>);


    /* ── Lists ─────────────────────────────────────────────── */
    case 'list-keywords': return (
      <svg {...sp}>{bg}
        {[0,1,2,3,4].map(i=>(
          <g key={i} transform={`translate(6,${i*11+6})`}>
            <text x="7" y="7.5" textAnchor="middle" fontFamily="monospace" fontSize="6"
              fill={i<3?T:'rgba(255,255,255,.28)'}>{i+1}</text>
            <rect x="16" y="2.5" width={[52,44,58,36,48][i]} height="3" rx="1.5" fill="rgba(255,255,255,.22)"/>
          </g>))}
      </svg>);

    case 'list-pages': return (
      <svg {...sp}>{bg}
        {[0,1,2,3,4].map(i=>(
          <g key={i} transform={`translate(6,${i*11+6})`}>
            <rect x="0" y="2" width={[44,36,40,28,34][i]} height="3" rx="1.5" fill="rgba(255,255,255,.2)"/>
            <rect x="52" y="1" width="48" height="5" rx="2.5" fill="rgba(255,255,255,.07)"/>
            <rect x="52" y="1" width={[40,28,44,14,32][i]} height="5" rx="2.5" fill={Td} opacity=".9"/>
          </g>))}
      </svg>);

    case 'list-countries': return (
      <svg {...sp}>{bg}
        {[[0.88,'US'],[0.60,'ID'],[0.40,'AU'],[0.24,'SG']].map(([pct,lbl],i)=>(
          <g key={i} transform={`translate(6,${i*13+7})`}>
            <text x="9" y="7.5" textAnchor="middle" fontFamily="monospace" fontSize="5.5"
              fill="rgba(255,255,255,.38)">{lbl}</text>
            <rect x="20" y="2"  width="80"    height="6" rx="3" fill="rgba(255,255,255,.07)"/>
            <rect x="20" y="2"  width={80*pct} height="6" rx="3" fill={T} opacity=".7"/>
          </g>))}
      </svg>);

    case 'list-devices': return (
      <svg {...sp}>{bg}
        <text x="8" y="14" fontFamily="monospace" fontSize="5.5" fill="rgba(255,255,255,.3)">DEVICE SPLIT</text>
        <rect x="8"  y="22" width="58" height="11" rx="2" fill={T}  opacity=".75"/>
        <rect x="68" y="22" width="26" height="11" rx="2" fill={Au} opacity=".75"/>
        <rect x="96" y="22" width="10" height="11" rx="2" fill={Pu}/>
        {[[T,'Desktop 53%'],[Au,'Mobile 24%'],[Pu,'Tablet 9%']].map(([c,l],i)=>(
          <g key={i} transform={`translate(${i*36+8},42)`}>
            <rect width="5" height="5" rx="1.2" fill={c}/>
            <text x="8" y="4.5" fontFamily="monospace" fontSize="5" fill="rgba(255,255,255,.38)">{l}</text>
          </g>))}
      </svg>);

    /* ── Highlights ────────────────────────────────────────── */
    case 'carousel-highlights': return (
      <svg {...sp}>{bg}
        <rect x="6"  y="5"  width="92" height="52" rx="5" fill="rgba(255,255,255,.05)" stroke="rgba(255,255,255,.08)" strokeWidth=".5"/>
        <rect x="14" y="11" width="50" height="3" rx="1.5" fill={T} opacity=".7"/>
        <rect x="14" y="17" width="70" height="2.5" rx="1.25" fill="rgba(255,255,255,.22)"/>
        <rect x="14" y="22" width="58" height="2.5" rx="1.25" fill="rgba(255,255,255,.15)"/>
        <text x="14" y="40" fontFamily="monospace" fontSize="12" fontWeight="700" fill="rgba(255,255,255,.88)">24.830</text>
        <text x="14" y="50" fontFamily="monospace" fontSize="7" fill={Gr}>▲ 8.1%</text>
        {[0,1,2].map(i=><circle key={i} cx={50+i*6} cy="58" r={i===0?2:1.5} fill={i===0?T:'rgba(255,255,255,.22)'}/>)}
      </svg>);

    /* ── Narrative / Text ─────────────────────────────────── */
    case 'narrative-hero': return (
      <svg {...sp}>{bg}
        {/* top accent bar */}
        <rect x="0" y="0" width="110" height="5" fill={T} opacity=".55"/>
        {/* eyebrow label */}
        <rect x="9" y="11" width="28" height="3" rx="1.5" fill={T} opacity=".55"/>
        {/* headline — large */}
        <rect x="9" y="18" width="88" height="7" rx="2" fill="rgba(255,255,255,.55)"/>
        <rect x="9" y="28" width="68" height="7" rx="2" fill="rgba(255,255,255,.4)"/>
        {/* body copy lines */}
        <rect x="9" y="40" width="90" height="3" rx="1.5" fill="rgba(255,255,255,.18)"/>
        <rect x="9" y="46" width="76" height="3" rx="1.5" fill="rgba(255,255,255,.13)"/>
        <rect x="9" y="52" width="50" height="3" rx="1.5" fill="rgba(255,255,255,.1)"/>
      </svg>);

    case 'narrative-note': return (
      <svg {...sp}>{bg}
        {[0,1,2].map(i=>(
          <g key={i} transform={`translate(0,${i*19+4})`}>
            {i>0 && <line x1="8" y1="0" x2="102" y2="0" stroke="rgba(255,255,255,.07)" strokeWidth=".5"/>}
            {/* numbered bullet */}
            <circle cx="17" cy="10" r="6" fill={Td}/>
            <text x="17" y="13" textAnchor="middle" fontFamily="monospace" fontSize="7" fontWeight="700" fill={T}>{i+1}</text>
            {/* text lines */}
            <rect x="28" y="6"  width={[56,48,60][i]} height="3"   rx="1.5" fill="rgba(255,255,255,.45)"/>
            <rect x="28" y="12" width={[44,54,38][i]} height="2.5" rx="1.25" fill="rgba(255,255,255,.18)"/>
          </g>))}
      </svg>);

    case 'narrative-callout': return (
      <svg {...sp}>{bg}
        {/* thick left accent border */}
        <rect x="0" y="0" width="5" height="62" fill={T} opacity=".7"/>
        {/* inner box */}
        <rect x="8" y="5" width="97" height="52" rx="3" fill="rgba(0,194,184,.05)" stroke={Td} strokeWidth=".8"/>
        {/* icon circle */}
        <circle cx="22" cy="19" r="7" fill={Td}/>
        <text x="22" y="22" textAnchor="middle" fontFamily="monospace" fontSize="9" fill={T}>!</text>
        {/* heading */}
        <rect x="33" y="13" width="48" height="5" rx="2" fill="rgba(255,255,255,.5)"/>
        <rect x="33" y="21" width="36" height="3" rx="1.5" fill="rgba(255,255,255,.2)"/>
        {/* body lines */}
        <rect x="14" y="32" width="82" height="2.5" rx="1.25" fill="rgba(255,255,255,.18)"/>
        <rect x="14" y="37" width="70" height="2.5" rx="1.25" fill="rgba(255,255,255,.13)"/>
        {/* CTA button */}
        <rect x="14" y="44" width="36" height="9" rx="4.5" fill={T} opacity=".8"/>
        <rect x="54" y="44" width="42" height="9" rx="4.5" fill="rgba(255,255,255,.08)" stroke="rgba(255,255,255,.15)" strokeWidth=".5"/>
      </svg>);

    case 'narrative-quote': return (
      <svg {...sp}>{bg}
        {/* decorative quote marks */}
        <text x="10" y="22" fontFamily="serif" fontSize="28" fontWeight="700" fill={T} opacity=".35">"</text>
        {/* quote text lines */}
        <rect x="22" y="10" width="78" height="4.5" rx="2" fill="rgba(255,255,255,.45)"/>
        <rect x="22" y="17" width="72" height="4.5" rx="2" fill="rgba(255,255,255,.35)"/>
        <rect x="22" y="24" width="52" height="4.5" rx="2" fill="rgba(255,255,255,.28)"/>
        {/* closing quote */}
        <text x="92" y="38" fontFamily="serif" fontSize="22" fontWeight="700" fill={T} opacity=".3">"</text>
        {/* divider */}
        <line x1="22" y1="41" x2="88" y2="41" stroke="rgba(255,255,255,.1)" strokeWidth=".7"/>
        {/* attribution */}
        <circle cx="28" cy="51" r="5" fill="rgba(255,255,255,.12)"/>
        <rect x="36" y="47.5" width="32" height="3" rx="1.5" fill="rgba(255,255,255,.3)"/>
        <rect x="36" y="53" width="22" height="2.5" rx="1.25" fill="rgba(255,255,255,.15)"/>
      </svg>);

    /* ── Universal type aliases ───────────────────────────────── */
    case 'single-stat': return (
      <svg {...sp}>{bg}
        <text x="10" y="16" fontFamily="monospace" fontSize="5.5" fill="rgba(255,255,255,.3)" letterSpacing=".5">TOTAL SPEND</text>
        <text x="10" y="36" fontFamily="monospace" fontSize="18" fontWeight="700" fill={T}>1.4K</text>
        <text x="10" y="47" fontFamily="monospace" fontSize="7" fill={Gr}>▲ 8.1%</text>
        <polyline points="60,54 70,48 78,42 86,45 94,34 102,26 110,18" stroke={T} strokeWidth="1.5" opacity=".7"/>
        <path d="M60,54 70,48 78,42 86,45 94,34 102,26 110,18 110,62 60,62Z" fill={Ts} opacity=".5"/>
      </svg>);

    case 'table': return (
      <svg {...sp}>{bg}
        <rect x="6"  y="5"  width="98" height="7" rx="2" fill="rgba(255,255,255,.06)"/>
        {[0,1,2,3,4].map(i=>(
          <g key={i} transform={`translate(6,${i*10+15})`}>
            <rect width="98" height="8" rx="1.5" fill={i%2===0?'rgba(255,255,255,.03)':'transparent'}/>
            <rect x="3"  y="2.5" width={[38,30,44,26,34][i]} height="3" rx="1.5" fill="rgba(255,255,255,.2)"/>
            <rect x="55" y="2.5" width="18" height="3" rx="1.5" fill={Td} opacity=".8"/>
            <rect x="78" y="2.5" width="22" height="3" rx="1.5" fill="rgba(255,255,255,.12)"/>
          </g>))}
      </svg>);

    case 'text': return (
      <svg {...sp}>{bg}
        <rect x="9" y="8"  width="70" height="6" rx="2" fill="rgba(255,255,255,.5)"/>
        <rect x="9" y="18" width="90" height="2.5" rx="1.25" fill="rgba(255,255,255,.18)"/>
        <rect x="9" y="23" width="84" height="2.5" rx="1.25" fill="rgba(255,255,255,.14)"/>
        <rect x="9" y="28" width="88" height="2.5" rx="1.25" fill="rgba(255,255,255,.16)"/>
        <rect x="9" y="33" width="60" height="2.5" rx="1.25" fill="rgba(255,255,255,.11)"/>
        <rect x="9" y="42" width="90" height="2.5" rx="1.25" fill="rgba(255,255,255,.14)"/>
        <rect x="9" y="47" width="74" height="2.5" rx="1.25" fill="rgba(255,255,255,.11)"/>
        <rect x="9" y="52" width="50" height="2.5" rx="1.25" fill="rgba(255,255,255,.08)"/>
      </svg>);

    default: return (
      <svg {...sp}>{bg}
        <text x="55" y="34" textAnchor="middle" fontFamily="monospace" fontSize="8" fill="rgba(255,255,255,.2)">{cardId}</text>
      </svg>);
  }
};

// ─── TAB: Browse ─────────────────────────────────────────────────
const UNIVERSAL_CATS = [
  { id: 'kpi',    title: 'KPI',    desc: 'Key performance indicators and summary numbers' },
  { id: 'charts', title: 'Charts', desc: 'Charts to visualize trends and comparisons' },
  { id: 'table',  title: 'Table',  desc: 'Data table with customizable dimensions and metrics' },
  { id: 'text',   title: 'Text',   desc: 'Text and narrative widgets for report commentary' },
];

const UNIVERSAL_WIDGET_TYPES = [
  { id: 'kpi-strip',     cat: 'kpi',    title: 'KPI Strip',    desc: '4–6 metrics in a single row', defaultSource: 'google' },
  { id: 'single-stat',   cat: 'kpi',    title: 'Single Stat',  desc: 'One large number with trend', defaultSource: 'google' },
  { id: 'chart-area',    cat: 'charts', title: 'Area Chart',   desc: 'Metric trend over time',      defaultSource: 'google' },
  { id: 'chart-bar',     cat: 'charts', title: 'Bar Chart',    desc: 'Value comparison by category', defaultSource: 'google' },
  { id: 'chart-donut',   cat: 'charts', title: 'Donut Chart',  desc: 'Percentage distribution',     defaultSource: 'google' },
  { id: 'chart-heatmap', cat: 'charts', title: 'Heatmap',      desc: 'Activity by day & hour',      defaultSource: 'ga4' },
  { id: 'table',         cat: 'table',  title: 'Data Table',   desc: 'Table with dimensions & metrics', defaultSource: 'google' },
  { id: 'text',          cat: 'text',   title: 'Text / Narrative', desc: 'Free-form title and paragraph', defaultSource: null },
];

// Maps old window.CARDS card IDs → universal widget type + default source.
// Data-connected types (kpi-strip, single-stat, chart-*, table) map to universal types
// that read from DATA_REGISTRY. Design-only types keep their original ID so
// UniversalWidget can fall back to window.CARDS[id].render().
const CARD_TO_UNIVERSAL = {
  // narrative — design-only, no data source
  'narrative-hero':      { type: 'narrative-hero',    defaultSource: null },
  'narrative-note':      { type: 'narrative-note',    defaultSource: null },
  'narrative-callout':   { type: 'narrative-callout', defaultSource: null },
  'narrative-quote':     { type: 'narrative-quote',   defaultSource: null },
  // kpi — data-connected (universal) or design-only
  'kpi-single':          { type: 'single-stat',       defaultSource: 'google' },
  'kpi-strip':           { type: 'kpi-strip',         defaultSource: 'google' },
  'kpi-compare':         { type: 'kpi-compare',       defaultSource: 'google' },
  // charts — data-connected
  'chart-area':          { type: 'chart-area',        defaultSource: 'google' },
  'chart-area-axes':     { type: 'chart-area',        defaultSource: 'google' },
  'chart-line':          { type: 'chart-area',        defaultSource: 'google' },
  'chart-bar':           { type: 'chart-bar',         defaultSource: 'google' },
  'chart-donut':         { type: 'chart-donut',       defaultSource: 'google' },
  'chart-heatmap':       { type: 'chart-heatmap',     defaultSource: 'ga4' },
  'chart-sparks':        { type: 'chart-sparks',      defaultSource: 'google' },
  // tables — data-connected
  'table-channels':      { type: 'table',             defaultSource: 'google' },
  'table-campaigns':     { type: 'table',             defaultSource: 'google' },
  'table-rankings':      { type: 'table',             defaultSource: 'google' },
  // progress — design-only (data baked into components)
  'progress-psi':        { type: 'progress-psi',      defaultSource: 'ga4' },
  'progress-goals':      { type: 'progress-goals',    defaultSource: 'google' },
  'progress-pacing':     { type: 'progress-pacing',   defaultSource: 'google' },
  // lists — design-only
  'list-keywords':       { type: 'list-keywords',     defaultSource: 'google' },
  'list-pages':          { type: 'list-pages',        defaultSource: 'ga4' },
  'list-countries':      { type: 'list-countries',    defaultSource: 'google' },
  'list-devices':        { type: 'list-devices',      defaultSource: 'google' },
  // carousel — design-only
  'carousel-highlights': { type: 'carousel-highlights', defaultSource: null },
};

const BrowseTab = ({ onSelect, connectedSources }) => {
  const cats     = window.CATS  || UNIVERSAL_CATS;
  const allCards = window.CARDS || UNIVERSAL_WIDGET_TYPES;

  const [activeCat, setActiveCat] = React.useState(cats[0]?.id || 'kpi');
  const [hoveredId, setHoveredId] = React.useState(null);

  const filtered = allCards.filter(w => w.cat === activeCat);
  const catMeta   = cats.find(c => c.id === activeCat);

  return (
    <>
      {/* Category chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
        {cats.map(c => {
          const active = c.id === activeCat;
          return (
            <button key={c.id} onClick={() => setActiveCat(c.id)} style={{
              padding: '4px 10px', borderRadius: 20, border: `1px solid ${active ? EP.teal+'99' : EP.edge}`,
              background: active ? 'rgba(0,194,184,.12)' : EP.elevated,
              color: active ? EP.teal : EP.sec, cursor: 'pointer',
              fontFamily: 'var(--font-display)', fontSize: 12.5, fontWeight: 600,
              transition: 'background .12s, color .12s',
            }}>{c.title}</button>
          );
        })}
      </div>

      {catMeta && (
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: EP.muted, marginBottom: 10 }}>
          {catMeta.desc}
        </div>
      )}

      {/* Usage hint */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 7,
        padding: '7px 10px', borderRadius: 7, marginBottom: 12,
        background: 'rgba(0,194,184,.06)', border: '1px solid rgba(0,194,184,.18)',
      }}>
        <svg width="11" height="11" viewBox="0 0 9 12" fill="none" style={{ flexShrink: 0 }}>
          {[[1,1],[1,5],[1,9],[5,1],[5,5],[5,9]].map(([cx,cy],i)=>
            <circle key={i} cx={cx} cy={cy} r="1.3" fill="#00C2B8" opacity=".7"/>)}
        </svg>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: EP.teal, letterSpacing: '0.06em' }}>
          Drag a widget into the canvas to add it
        </span>
      </div>

      {/* Widget type grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {filtered.map(w => {
          const mapping = CARD_TO_UNIVERSAL[w.id];
          const uniType = mapping ? mapping.type : (w.id);
          const rawSrc  = mapping ? mapping.defaultSource : (w.defaultSource || null);
          const firstSrc = rawSrc
            ? (['google','meta','ga4','search'].find(s => connectedSources?.[s]) || rawSrc)
            : null;
          return (
            <div
              key={w.id}
              draggable
              onDragStart={e => {
                const def = { type: uniType, source: firstSrc, _cardId: w.id };
                e.dataTransfer.setData('browseCardId', w.id);
                e.dataTransfer.setData('browseWidgetDef', JSON.stringify(def));
                e.dataTransfer.effectAllowed = 'copy';
              }}
              onMouseEnter={() => setHoveredId(w.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                borderRadius: 8, cursor: 'grab', overflow: 'hidden',
                position: 'relative', transition: 'border-color .12s, background .12s',
                background: EP.elevated,
                border: `1.5px solid ${EP.edge}`,
              }}
            >
              {/* Thumbnail */}
              <div style={{ position: 'relative' }}>
                <CardThumbnail cardId={w.id} />
                {hoveredId === w.id && (
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    display: 'flex', alignItems: 'center', gap: 5, padding: '4px 7px',
                    background: 'linear-gradient(to top, rgba(5,12,28,.82) 60%, transparent)',
                  }}>
                    <svg width="9" height="12" viewBox="0 0 9 12" fill="none" style={{ flexShrink: 0 }}>
                      {[[1,1],[1,5],[1,9],[5,1],[5,5],[5,9]].map(([cx,cy],i)=>
                        <circle key={i} cx={cx} cy={cy} r="1.3" fill={EP.teal} opacity=".6"/>)}
                    </svg>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.04em', color: EP.teal, opacity: .65 }}>drag to canvas</span>
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none"
                      stroke={EP.teal} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                      style={{ marginLeft: 'auto', opacity: .55 }}>
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </div>
                )}
              </div>
              {/* Title + desc */}
              <div style={{ padding: '7px 9px 9px' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, lineHeight: 1.3, color: EP.fg }}>{w.title}</div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 11.5, color: EP.muted, marginTop: 2, lineHeight: 1.4 }}>{w.desc || ''}</div>
              </div>
            </div>
          );
        })}
      </div>
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

const CardEditorPanel = ({
  cardId = 'kpi-single',
  widgetId = null,
  widgetConfig = {},
  onConfigChange = null,
  onUndo = null,
  connectedSources = {},
  onClose,
  defaultTab = 'browse',
  sharedWidgetCount = 0,
  instanceSource = null,
  onSourceChange = null,
  onConnectedChange = null,
  pageData = null,
  layoutRows = null,
  style = {},
}) => {
  const [tab, setTab] = React.useState(defaultTab);
  const [activeCardId, setActiveCardId] = React.useState(cardId);
  const [styleState, setStyleState] = React.useState({ showTitle: true, titleSize: 'M', valueSize: 'M', accent: '#00C2B8', compact: true, precision: 0, bgOpacity: 1, radius: '12' });

  const card = (window.CARDS || []).find(c => c.id === activeCardId) || { id: activeCardId, cat: 'kpi', title: 'Card' };

  const handleSelectCard = (id) => { setActiveCardId(id); setTab('setup'); };

  const _initialMount = React.useRef(true);
  React.useEffect(() => {
    if (_initialMount.current) { _initialMount.current = false; return; }
    setActiveCardId(cardId);
    setTab('setup');
  }, [cardId]);

  const TABS = [
    { id: 'browse', label: 'Browse' },
    { id: 'setup',  label: 'Setup' },
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
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: EP.fg, letterSpacing: '-0.01em' }}>Card Properties</span>
          </div>
          {onClose && (
            <button onClick={onClose} style={{ width: 26, height: 26, border: 'none', background: EP.elevated, borderRadius: 6, color: EP.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, lineHeight: 1 }}>×</button>
          )}
        </div>
        {/* Card meta */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0 10px' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: EP.teal, background: 'rgba(0,194,184,.1)', padding: '2px 8px', borderRadius: 4, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{card.cat}</span>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: EP.sec, flex: 1 }}>{card.title}</span>
        </div>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, marginBottom: -1 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{
                flex: 1, padding: '8px 0', border: 'none', background: 'transparent', cursor: 'pointer',
                fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: tab === t.id ? 700 : 500,
                color: tab === t.id ? EP.fg : EP.muted,
                borderBottom: `2px solid ${tab === t.id ? EP.teal : 'transparent'}`,
                transition: 'color .12s',
              }}>{t.label}</button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        {tab === 'browse' && <BrowseTab activeCardId={activeCardId} onSelect={handleSelectCard} connectedSources={connectedSources}/>}
        {tab === 'setup' && (
          <SimpleSetupTab
            widgetId={widgetId}
            cardId={activeCardId}
            widgetConfig={widgetConfig}
            onConfigChange={onConfigChange}
            connectedSources={connectedSources}
            sharedWidgetCount={sharedWidgetCount}
            instanceSource={instanceSource}
            onSourceChange={onSourceChange}
            onConnectedChange={onConnectedChange}
            pageData={pageData}
            layoutRows={layoutRows}
          />
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '10px 16px', borderTop: `1px solid ${EP.edge}`, display: 'flex', gap: 6, flexShrink: 0, background: 'rgba(10,18,34,.5)' }}>
        {onClose && <button onClick={onClose} style={{ flex: 1, padding: '8px 0', background: EP.elevated, border: `1px solid ${EP.edge}`, borderRadius: 7, color: EP.sec, fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Close</button>}
        {onUndo && (
          <button onClick={onUndo} title="Undo (Ctrl+Z)" style={{ flex: 1, padding: '8px 0', background: 'rgba(248,180,0,.08)', border: '1px solid rgba(248,180,0,.3)', borderRadius: 7, color: EP.gold, fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9h10a5 5 0 1 1 0 10H3"/><polyline points="3 9 7 5 3 9 7 13"/></svg>
            Undo
          </button>
        )}
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
