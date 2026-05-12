// Reportive · Screen Report
// ─────────────────────────────────────────────────────────────────
// Per-client reporting dashboard.
// Features: date picker, real Supabase data per client,
//           card editor panel, design-system cards, Present mode.

const { useState, useEffect, useCallback, useMemo } = React;
const { useLive, fmt } = window.LIVE;

const _IS_VIEWER = sessionStorage.getItem('avo_role') === 'viewer';

// ─── Design tokens ────────────────────────────────────────────────
const teal   = '#00C2B8';
const gold   = '#F8B400';
const violet = '#7000FF';
const blue   = '#4285F4';
const fg     = '#FCFCFC';
const sec    = 'var(--text-secondary)';
const muted  = 'var(--text-muted)';
const T = { display: 'var(--font-display)', body: 'var(--font-body)', mono: 'var(--font-mono)' };

// ─── Color helpers ────────────────────────────────────────────────
function scoreColor(v) {
  if (v == null || isNaN(v)) return '#64748B';
  if (v >= 90) return '#16A34A';
  if (v >= 70) return '#F8B400';
  return '#E3170A';
}
function deltaColor(v) {
  return v == null ? '#64748B' : v >= 0 ? '#16A34A' : '#E3170A';
}

// ─── Eyebrow label ────────────────────────────────────────────────
function Eyebrow({ children, color = muted }) {
  return (
    <div style={{ fontFamily: T.mono, fontSize: 9.5, color, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600 }}>
      {children}
    </div>
  );
}

// ─── KPI tile (design-system aligned) ────────────────────────────
function Kpi({ label, value, delta, sub, compare, accent = teal, spark, scale = 1 }) {
  return (
    <RCard accent={accent} padding={16} style={{ flex: '1 1 140px', minWidth: 128 }}>
      <Eyebrow>{label}</Eyebrow>
      <div style={{ marginTop: 6, fontFamily: T.display, fontSize: Math.round(22 * scale), fontWeight: 800, color: fg, letterSpacing: '-0.02em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {delta != null && <RDelta value={Math.round(delta * 10) / 10}/>}
          {compare && delta != null && <span style={{ fontFamily: T.body, fontSize: 10, color: muted }}>{compare}</span>}
          {sub && delta == null && <span style={{ fontFamily: T.mono, fontSize: 9, color: muted }}>{sub}</span>}
        </div>
        {spark && <Spark data={spark} color={accent} w={56} h={18}/>}
      </div>
    </RCard>
  );
}

// ─── Chart card (design-system aligned) ──────────────────────────
function ChartCard({ title, sub, children, style }) {
  return (
    <RCard padding={16} style={style}>
      {title && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontFamily: T.display, fontSize: 13, fontWeight: 700, color: fg }}>{title}</div>
          {sub && <div style={{ fontFamily: T.body, fontSize: 11, color: muted, marginTop: 2 }}>{sub}</div>}
        </div>
      )}
      {children}
    </RCard>
  );
}

// ─── Section wrapper ───────────────────────────────────────────────
function Section({ children }) {
  return <div style={{ marginBottom: 36 }}>{children}</div>;
}

// ─── Section header ────────────────────────────────────────────────
function SectionHead({ channel, title, subtitle }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, paddingBottom: 14, borderBottom: '1px solid rgba(255,255,255,.06)' }}>
      {channel && <ChannelLogo channel={channel} size={26}/>}
      <div>
        <div style={{ fontFamily: T.display, fontSize: 15, fontWeight: 700, color: fg }}>{title}</div>
        {subtitle && (
          <div style={{ fontFamily: T.mono, fontSize: 9, color: muted, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{subtitle}</div>
        )}
      </div>
    </div>
  );
}

// ─── Inline legend dot ─────────────────────────────────────────────
function LegendDot({ color, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <div style={{ width: 8, height: 2, background: color, borderRadius: 1 }}/>
      <span style={{ fontFamily: T.mono, fontSize: 9, color: muted }}>{label}</span>
    </div>
  );
}

// ─── Date-range utilities ─────────────────────────────────────────
function _drDs(d) {
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');
}
function _drPd(s) { return new Date(s + 'T00:00:00'); }

const DR_PRESETS = [
  {
    label: 'Today',
    fn() { const t = _drDs(new Date()); return { from: t, to: t }; },
  },
  {
    label: 'Yesterday',
    fn() { const d = new Date(); d.setDate(d.getDate() - 1); const s = _drDs(d); return { from: s, to: s }; },
  },
  {
    label: 'This Week',
    fn() {
      const d = new Date();
      const mon = new Date(d);
      mon.setDate(d.getDate() - ((d.getDay() + 6) % 7));
      return { from: _drDs(mon), to: _drDs(d) };
    },
  },
  {
    label: 'Last Week',
    fn() {
      const d = new Date();
      const mon = new Date(d);
      mon.setDate(d.getDate() - ((d.getDay() + 6) % 7) - 7);
      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);
      return { from: _drDs(mon), to: _drDs(sun) };
    },
  },
  {
    label: 'This Month',
    fn() {
      const d = new Date();
      const s = new Date(d.getFullYear(), d.getMonth(), 1);
      return { from: _drDs(s), to: _drDs(d) };
    },
  },
  {
    label: 'Last Month',
    fn() {
      const d = new Date();
      const s = new Date(d.getFullYear(), d.getMonth() - 1, 1);
      const e = new Date(d.getFullYear(), d.getMonth(), 0);
      return { from: _drDs(s), to: _drDs(e) };
    },
  },
  {
    label: 'This Quarter',
    fn() {
      const d = new Date();
      const q = Math.floor(d.getMonth() / 3);
      const s = new Date(d.getFullYear(), q * 3, 1);
      return { from: _drDs(s), to: _drDs(d) };
    },
  },
  {
    label: 'This Year',
    fn() {
      const d = new Date();
      const s = new Date(d.getFullYear(), 0, 1);
      return { from: _drDs(s), to: _drDs(d) };
    },
  },
  {
    label: 'Last Year',
    fn() {
      const d = new Date();
      const s = new Date(d.getFullYear() - 1, 0, 1);
      const e = new Date(d.getFullYear() - 1, 11, 31);
      return { from: _drDs(s), to: _drDs(e) };
    },
  },
  {
    label: 'Last 7 Days',
    fn() { const t = new Date(); const s = new Date(t); s.setDate(t.getDate() - 6); return { from: _drDs(s), to: _drDs(t) }; },
  },
  {
    label: 'Last 30 Days',
    fn() { const t = new Date(); const s = new Date(t); s.setDate(t.getDate() - 29); return { from: _drDs(s), to: _drDs(t) }; },
  },
  {
    label: 'Last 60 Days',
    fn() { const t = new Date(); const s = new Date(t); s.setDate(t.getDate() - 59); return { from: _drDs(s), to: _drDs(t) }; },
  },
  {
    label: 'Last 90 Days',
    fn() { const t = new Date(); const s = new Date(t); s.setDate(t.getDate() - 89); return { from: _drDs(s), to: _drDs(t) }; },
  },
  {
    label: 'Last 180 Days',
    fn() { const t = new Date(); const s = new Date(t); s.setDate(t.getDate() - 179); return { from: _drDs(s), to: _drDs(t) }; },
  },
  {
    label: 'Last 365 Days',
    fn() { const t = new Date(); const s = new Date(t); s.setDate(t.getDate() - 364); return { from: _drDs(s), to: _drDs(t) }; },
  },
  {
    label: 'All Time',
    fn() { return { from: null, to: null }; },
  },
];

// ─── CalendarMonth ────────────────────────────────────────────────
const CAL_DAYS  = ['Mo','Tu','We','Th','Fr','Sa','Su'];
const CAL_MONTH = ['January','February','March','April','May','June',
                   'July','August','September','October','November','December'];

function CalendarMonth({ year, month, pendingFrom, pendingTo, hoverDate, onDateClick, onDateHover }) {
  const todayDs = _drDs(new Date());

  // Effective range to highlight
  const selStart = pendingFrom;
  let selEnd = pendingTo;
  if (!pendingTo && pendingFrom && hoverDate) {
    selEnd = hoverDate >= pendingFrom ? hoverDate : pendingFrom;
  }
  const effectiveStart = (!pendingTo && pendingFrom && hoverDate && hoverDate < pendingFrom)
    ? hoverDate : pendingFrom;

  const firstDow = new Date(year, month, 1).getDay(); // 0=Sun
  const offset   = (firstDow + 6) % 7;                // Mon-first
  const totalDays = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(d);

  return (
    <div>
      <div style={{ textAlign: 'center', fontFamily: T.display, fontSize: 12, fontWeight: 700, color: fg, marginBottom: 8 }}>
        {CAL_MONTH[month]} {year}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', rowGap: 2, columnGap: 0 }}>
        {CAL_DAYS.map(d => (
          <div key={d} style={{ fontFamily: T.mono, fontSize: 8, color: muted, textAlign: 'center', padding: '2px 0 5px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{d}</div>
        ))}
        {cells.map((d, i) => {
          if (d === null) return <div key={'e' + i}/>;
          const ds = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
          const isFuture  = ds > todayDs;
          const isStart   = ds === selStart;
          const isEnd     = ds === selEnd && pendingTo;
          const inRange   = effectiveStart && selEnd && ds > effectiveStart && ds < selEnd;
          const isToday   = ds === todayDs;
          const isHovered = ds === hoverDate;

          const highlighted = isStart || isEnd;

          return (
            <div
              key={d}
              onClick={!isFuture ? () => onDateClick(ds) : undefined}
              onMouseEnter={() => !isFuture && onDateHover(ds)}
              onMouseLeave={() => onDateHover(null)}
              title={isFuture ? '' : ds}
              style={{
                position: 'relative',
                textAlign: 'center', lineHeight: '28px', fontSize: 11,
                fontFamily: T.mono, borderRadius: 6, cursor: isFuture ? 'default' : 'pointer',
                background: highlighted
                  ? teal
                  : inRange
                    ? 'rgba(0,194,184,.13)'
                    : isHovered && !isFuture
                      ? 'rgba(255,255,255,.08)'
                      : 'transparent',
                color: highlighted
                  ? '#0C182C'
                  : isFuture
                    ? 'rgba(255,255,255,.18)'
                    : isToday
                      ? teal
                      : fg,
                fontWeight: highlighted ? 700 : isToday ? 600 : 400,
                outline: isToday && !highlighted ? '1px solid rgba(0,194,184,.35)' : 'none',
                outlineOffset: '-1px',
                userSelect: 'none',
                transition: 'background .1s',
              }}
            >{d}</div>
          );
        })}
      </div>
    </div>
  );
}

// ─── DateRangePicker overlay ──────────────────────────────────────
function DateRangePicker({ dateRange, onApply, onCancel }) {
  const _today = new Date();
  const [pendingFrom, setPendingFrom] = useState(dateRange.from || null);
  const [pendingTo,   setPendingTo]   = useState(dateRange.to   || null);
  const [phase,       setPhase]       = useState('start');  // 'start' | 'end'
  const [hoverDate,   setHoverDate]   = useState(null);
  const [viewYear,    setViewYear]    = useState(_today.getFullYear());
  const [viewMonth,   setViewMonth]   = useState(_today.getMonth());
  const [activePreset, setActivePreset] = useState(null);

  // Left calendar = one month before viewMonth
  const rightMonth = viewMonth;
  const rightYear  = viewYear;
  const leftMonth  = viewMonth === 0 ? 11 : viewMonth - 1;
  const leftYear   = viewMonth === 0 ? viewYear - 1 : viewYear;

  const navMonth = dir => {
    let m = viewMonth + dir, y = viewYear;
    if (m < 0)  { m = 11; y--; }
    if (m > 11) { m = 0;  y++; }
    setViewMonth(m); setViewYear(y);
  };

  const handleDateClick = ds => {
    if (phase === 'start') {
      setPendingFrom(ds);
      setPendingTo(null);
      setPhase('end');
      setActivePreset(null);
    } else {
      if (ds >= pendingFrom) {
        setPendingTo(ds);
        setPhase('start');
      } else {
        // clicked before start → start over from this date
        setPendingFrom(ds);
        setPendingTo(null);
        // stay in 'end' phase
      }
      setActivePreset(null);
    }
  };

  const handlePreset = preset => {
    const range = preset.fn();
    setPendingFrom(range.from);
    setPendingTo(range.to);
    setPhase('start');
    setActivePreset(preset.label);
    if (range.to) {
      const d = _drPd(range.to);
      setViewYear(d.getFullYear()); setViewMonth(d.getMonth());
    } else if (!range.from && !range.to) {
      setViewYear(_today.getFullYear()); setViewMonth(_today.getMonth());
    }
  };

  const triggerLabel = () => {
    if (activePreset) return activePreset;
    if (!pendingFrom && !pendingTo) return 'Pilih rentang tanggal…';
    if (phase === 'end' && pendingFrom && !pendingTo)
      return pendingFrom + '  →  pilih tanggal akhir';
    if (pendingFrom && pendingTo) return pendingFrom + '  →  ' + pendingTo;
    return pendingFrom || '—';
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 300 }}
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        style={{
          position: 'absolute', top: 60, right: 20,
          background: '#0C1A2E',
          border: '1px solid rgba(255,255,255,.12)',
          borderRadius: 14, overflow: 'hidden',
          display: 'flex', width: 680, maxHeight: 'calc(100vh - 80px)',
          boxShadow: '0 24px 64px rgba(0,0,0,.65)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Preset sidebar ── */}
        <div style={{
          width: 154, flexShrink: 0,
          borderRight: '1px solid rgba(255,255,255,.07)',
          padding: '12px 0', overflowY: 'auto',
          background: 'rgba(255,255,255,.02)',
        }}>
          <div style={{
            fontFamily: T.mono, fontSize: 8.5, color: muted,
            textTransform: 'uppercase', letterSpacing: '0.13em', fontWeight: 700,
            padding: '0 12px 8px',
          }}>Quick Select</div>
          {DR_PRESETS.map(p => {
            const active = activePreset === p.label;
            return (
              <button key={p.label} onClick={() => handlePreset(p)} style={{
                width: '100%', textAlign: 'left', padding: '7px 14px 7px 12px',
                background: active ? 'rgba(0,194,184,.1)' : 'transparent',
                border: 'none',
                borderLeft: `2px solid ${active ? teal : 'transparent'}`,
                color: active ? teal : sec,
                fontFamily: T.body, fontSize: 11.5, cursor: 'pointer',
                transition: 'background .1s, color .1s',
                display: 'block',
              }}>{p.label}</button>
            );
          })}
        </div>

        {/* ── Calendar area ── */}
        <div style={{ flex: 1, padding: '14px 18px 16px', display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>

          {/* Range display + navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              flex: 1, fontFamily: T.mono, fontSize: 10, padding: '6px 10px', borderRadius: 7,
              background: 'rgba(255,255,255,.05)',
              border: `1px solid ${phase === 'end' ? 'rgba(0,194,184,.35)' : 'rgba(255,255,255,.09)'}`,
              color: phase === 'end' ? teal : sec, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{triggerLabel()}</div>

            <button onClick={() => navMonth(-1)} style={{
              width: 28, height: 28, flexShrink: 0,
              border: '1px solid rgba(255,255,255,.1)', borderRadius: 6,
              background: 'transparent', color: sec, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <button onClick={() => navMonth(1)} style={{
              width: 28, height: 28, flexShrink: 0,
              border: '1px solid rgba(255,255,255,.1)', borderRadius: 6,
              background: 'transparent', color: sec, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>

          {/* Two-month grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22, flex: 1 }}>
            <CalendarMonth
              year={leftYear} month={leftMonth}
              pendingFrom={pendingFrom} pendingTo={pendingTo}
              hoverDate={hoverDate}
              onDateClick={handleDateClick}
              onDateHover={setHoverDate}
            />
            <CalendarMonth
              year={rightYear} month={rightMonth}
              pendingFrom={pendingFrom} pendingTo={pendingTo}
              hoverDate={hoverDate}
              onDateClick={handleDateClick}
              onDateHover={setHoverDate}
            />
          </div>

          {/* Phase hint */}
          {phase === 'end' && pendingFrom && !pendingTo && (
            <div style={{ fontFamily: T.mono, fontSize: 9.5, color: teal, textAlign: 'center', opacity: 0.85 }}>
              Klik tanggal akhir untuk menyelesaikan pilihan
            </div>
          )}

          {/* Footer actions */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            paddingTop: 12, borderTop: '1px solid rgba(255,255,255,.07)',
          }}>
            <button onClick={() => { setPendingFrom(null); setPendingTo(null); setPhase('start'); setActivePreset(null); }} style={{
              padding: '5px 12px', background: 'transparent',
              border: '1px solid rgba(255,255,255,.1)', borderRadius: 7,
              color: muted, fontFamily: T.mono, fontSize: 10, cursor: 'pointer',
            }}>Reset</button>

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={onCancel} style={{
                padding: '6px 14px', background: 'rgba(255,255,255,.06)',
                border: '1px solid rgba(255,255,255,.1)', borderRadius: 7,
                color: sec, fontFamily: T.display, fontSize: 11, fontWeight: 600, cursor: 'pointer',
              }}>Batal</button>
              <button
                onClick={() => onApply({ from: pendingFrom, to: pendingTo })}
                disabled={!!(pendingFrom && !pendingTo && phase === 'end')}
                style={{
                  padding: '6px 20px',
                  background: (pendingFrom && !pendingTo && phase === 'end')
                    ? 'rgba(0,194,184,.25)'
                    : 'linear-gradient(135deg,#00C2B8,#009E96)',
                  border: 'none', borderRadius: 7,
                  color: '#0C182C', fontFamily: T.display, fontSize: 11, fontWeight: 700,
                  cursor: (pendingFrom && !pendingTo && phase === 'end') ? 'not-allowed' : 'pointer',
                  transition: 'background .15s',
                }}
              >Terapkan</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Top bar ──────────────────────────────────────────────────────
function ReportTopBar({ client, dateRange, setDateRange, onBack, isMock, onPresent, onEdit, showEditor }) {
  const [showPicker, setShowPicker] = useState(false);

  const rangeLabel = useMemo(() => {
    const from = dateRange && dateRange.from;
    const to   = dateRange && dateRange.to;
    if (!from && !to) return 'All Time';
    if (from === to) return from;
    if (from && to) {
      const MN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const f = _drPd(from), t = _drPd(to);
      if (f.getFullYear() === t.getFullYear() && f.getMonth() === t.getMonth()) {
        return MN[f.getMonth()] + ' ' + f.getDate() + '–' + t.getDate() + ', ' + t.getFullYear();
      }
      if (f.getFullYear() === t.getFullYear()) {
        return MN[f.getMonth()] + ' ' + f.getDate() + ' – ' + MN[t.getMonth()] + ' ' + t.getDate() + ', ' + t.getFullYear();
      }
      return from + ' – ' + to;
    }
    return from || 'Select range';
  }, [dateRange]);

  return (
    <>
      <div style={{
        height: 56, display: 'flex', alignItems: 'center', gap: 12,
        padding: '0 24px', flexShrink: 0,
        borderBottom: '1px solid rgba(255,255,255,.06)',
        background: 'rgba(12,24,44,.9)', backdropFilter: 'blur(12px)',
      }}>
        <button onClick={onBack} style={{
          background: 'none', border: '1px solid rgba(255,255,255,.12)',
          borderRadius: 7, color: sec, fontFamily: T.mono, fontSize: 10,
          padding: '5px 12px', cursor: 'pointer',
          textTransform: 'uppercase', letterSpacing: '0.1em',
          display: 'flex', alignItems: 'center', gap: 5,
        }}>← Home</button>

        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,.08)' }}/>

        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: client.avatarGrad || 'linear-gradient(135deg,#00C2B8,#7000FF)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: T.display, fontSize: 9, fontWeight: 800, color: '#fff', flexShrink: 0,
        }}>{client.initials || '?'}</div>

        <div>
          <div style={{ fontFamily: T.display, fontSize: 13, fontWeight: 700, color: fg, lineHeight: 1.2 }}>{client.name}</div>
          <div style={{ fontFamily: T.mono, fontSize: 9, color: muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{client.industry}</div>
        </div>

        <div style={{ flex: 1 }}/>

        {isMock && (
          <div style={{
            fontFamily: T.mono, fontSize: 9, color: gold,
            background: 'rgba(248,180,0,.1)', border: '1px solid rgba(248,180,0,.2)',
            borderRadius: 5, padding: '3px 9px', textTransform: 'uppercase', letterSpacing: '0.1em',
          }}>Demo Data</div>
        )}

        {/* Date range picker trigger */}
        <button onClick={() => setShowPicker(v => !v)} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '5px 12px', borderRadius: 7, cursor: 'pointer',
          background: showPicker ? 'rgba(0,194,184,.1)' : 'rgba(255,255,255,.06)',
          border: `1px solid ${showPicker ? 'rgba(0,194,184,.32)' : 'rgba(255,255,255,.12)'}`,
          color: showPicker ? teal : fg, fontFamily: T.mono, fontSize: 10,
          transition: 'background .15s, color .15s', maxWidth: 260, overflow: 'hidden',
        }}>
          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" strokeLinecap="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
          </svg>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>{rangeLabel}</span>
          <svg width="8" height="8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </button>

        {/* Edit / Editor toggle — hidden for viewers */}
        {!_IS_VIEWER && (
          <button onClick={onEdit} style={{
            padding: '6px 12px', borderRadius: 7, cursor: 'pointer',
            fontFamily: T.display, fontSize: 10, fontWeight: 600,
            background: showEditor ? 'rgba(0,194,184,.15)' : 'rgba(255,255,255,.06)',
            border: `1px solid ${showEditor ? 'rgba(0,194,184,.4)' : 'rgba(255,255,255,.12)'}`,
            color: showEditor ? teal : sec,
            display: 'flex', alignItems: 'center', gap: 5,
            transition: 'background .15s, color .15s',
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
            Edit
          </button>
        )}

        {/* Present */}
        <button onClick={onPresent} style={{
          padding: '6px 14px', borderRadius: 7, cursor: 'pointer',
          background: 'linear-gradient(135deg,#00C2B8,#009E96)', border: 'none',
          color: '#0C182C', fontFamily: T.display, fontSize: 10, fontWeight: 700,
          display: 'flex', alignItems: 'center', gap: 5,
          boxShadow: '0 2px 10px rgba(0,194,184,.3)',
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          Present
        </button>
      </div>

      {showPicker && (
        <DateRangePicker
          dateRange={dateRange || { from: null, to: null }}
          onApply={range => { setDateRange(range); setShowPicker(false); }}
          onCancel={() => setShowPicker(false)}
        />
      )}
    </>
  );
}

// ─── Reusable sortable table header cell ──────────────────────────
function SortTh({ label, sortKey, active, dir, onSort, align = 'right' }) {
  return (
    <th
      onClick={() => onSort(sortKey)}
      style={{
        padding: '8px 14px', textAlign: align,
        fontFamily: T.mono, fontSize: 9.5, fontWeight: 600,
        textTransform: 'uppercase', letterSpacing: '0.1em',
        color: active ? teal : muted, cursor: 'pointer',
        userSelect: 'none', whiteSpace: 'nowrap',
      }}
    >
      {label}{active ? (dir === 'desc' ? ' ↓' : ' ↑') : ''}
    </th>
  );
}

// ─── Selectable widget wrapper ─────────────────────────────────────
function SelectableWidget({ id, cardId, editState, children }) {
  if (!editState) return children;
  const isSelected = editState.selected === id;
  return (
    <div
      onClick={e => {
        e.stopPropagation();
        editState.onSelect(id, cardId);
      }}
      style={{
        position: 'relative',
        flex: 1, display: 'flex', flexDirection: 'column',
        outline: `2px solid ${isSelected ? teal : 'rgba(0,194,184,.12)'}`,
        outlineOffset: 3,
        borderRadius: 12,
        cursor: 'pointer',
        transition: 'outline-color .15s',
      }}
    >
      {isSelected && (
        <div style={{
          position: 'absolute', top: -14, left: 8, zIndex: 20,
          background: teal, color: '#0C182C',
          fontFamily: T.mono, fontSize: 8, fontWeight: 700,
          padding: '2px 7px', borderRadius: 4, letterSpacing: '0.08em',
          pointerEvents: 'none',
        }}>EDITING</div>
      )}
      {children}
    </div>
  );
}

// ─── Table dimension / metric schemas ─────────────────────────────
const FONT_SCALES = { S: 0.85, M: 1, L: 1.15 };

// ─── Universal widget → card-type map ─────────────────────────────
// widgetConfigs is keyed by card type so all widgets of the same type
// share one config (font size, name, metrics, etc.)
const WIDGET_CARD_TYPES = {
  'google-kpi':       'kpi-strip',
  'meta-kpi':         'kpi-strip',
  'ga4-kpi':          'kpi-strip',
  'search-kpi':       'kpi-strip',
  'google-spend':     'chart-area',
  'google-clicks':    'chart-bar',
  'google-budget':    'chart-donut',
  'google-campaigns': 'table-campaigns',
  'google-adgroups':  'table-campaigns',
  'google-keywords':  'table-campaigns',
  'meta-trend':       'chart-area',
  'meta-donut':       'chart-donut',
  'ga4-sessions':     'chart-area',
  'ga4-heatmap':      'chart-heatmap',
  'ga4-conversion':   'chart-area',
  'search-position':  'chart-donut',
  'search-ctr':       'chart-area',
  'search-clicks':    'chart-bar',
  'search-queries':   'table-rankings',
  'search-pages':     'table-rankings',
};

const WIDGET_DISPLAY_NAMES = {
  'google-kpi':       'Google Ads KPI',
  'meta-kpi':         'Meta Ads KPI',
  'ga4-kpi':          'GA4 KPI',
  'search-kpi':       'Search Console KPI',
  'google-spend':     'Spend Trend',
  'google-clicks':    'Clicks Chart',
  'google-budget':    'Budget Donut',
  'google-campaigns': 'Campaigns Table',
  'google-adgroups':  'Ad Groups Table',
  'google-keywords':  'Keywords Table',
  'meta-trend':       'Meta Trend',
  'meta-donut':       'Meta Donut',
  'ga4-sessions':     'Sessions Trend',
  'ga4-heatmap':      'Traffic Heatmap',
  'ga4-conversion':   'Conversion Chart',
  'search-position':  'Position Donut',
  'search-ctr':       'CTR Trend',
  'search-clicks':    'Search Clicks',
  'search-queries':   'Top Queries',
  'search-pages':     'Top Pages',
};

// ─── Default drag layout ──────────────────────────────────────────
const DEFAULT_DRAG_LAYOUT = {
  rows: [
    [{ id: 'google-kpi', span: 12 }],
    [{ id: 'google-spend', span: 4 }, { id: 'google-clicks', span: 4 }, { id: 'google-budget', span: 4 }],
    [{ id: 'google-campaigns', span: 12 }],
    [{ id: 'google-adgroups', span: 12 }],
    [{ id: 'google-keywords', span: 12 }],
    [{ id: 'meta-kpi', span: 12 }],
    [{ id: 'meta-trend', span: 7 }, { id: 'meta-donut', span: 5 }],
    [{ id: 'ga4-kpi', span: 12 }],
    [{ id: 'ga4-sessions', span: 7 }, { id: 'ga4-heatmap', span: 5 }],
    [{ id: 'ga4-conversion', span: 12 }],
    [{ id: 'search-kpi', span: 12 }],
    [{ id: 'search-position', span: 4 }, { id: 'search-ctr', span: 4 }, { id: 'search-clicks', span: 4 }],
    [{ id: 'search-queries', span: 12 }],
    [{ id: 'search-pages', span: 12 }],
  ]
};

const LEGACY_ID_MAP = {
  'google-kpi':      { type: 'kpi-strip',     source: 'google' },
  'google-spend':    { type: 'chart-area',    source: 'google' },
  'google-clicks':   { type: 'chart-bar',     source: 'google' },
  'google-budget':   { type: 'chart-donut',   source: 'google' },
  'google-campaigns':{ type: 'table',         source: 'google' },
  'google-adgroups': { type: 'table',         source: 'google' },
  'google-keywords': { type: 'table',         source: 'google' },
  'meta-kpi':        { type: 'kpi-strip',     source: 'meta'   },
  'meta-trend':      { type: 'chart-area',    source: 'meta'   },
  'meta-donut':      { type: 'chart-donut',   source: 'meta'   },
  'ga4-kpi':         { type: 'kpi-strip',     source: 'ga4'    },
  'ga4-sessions':    { type: 'chart-area',    source: 'ga4'    },
  'ga4-heatmap':     { type: 'chart-heatmap', source: 'ga4'    },
  'ga4-conversion':  { type: 'chart-bar',     source: 'ga4'    },
  'search-kpi':      { type: 'kpi-strip',     source: 'search' },
  'search-position': { type: 'chart-donut',   source: 'search' },
  'search-ctr':      { type: 'chart-area',    source: 'search' },
  'search-clicks':   { type: 'chart-bar',     source: 'search' },
  'search-queries':  { type: 'table',         source: 'search' },
  'search-pages':    { type: 'table',         source: 'search' },
};

function migrateLegacyLayout(layout) {
  if (!layout?.rows) return layout;
  const isLegacy = layout.rows.flat().some(w => !w.type);
  if (!isLegacy) return layout;
  return {
    rows: layout.rows.map(row =>
      row.map(w => {
        if (w.type) return w;
        const mapped = LEGACY_ID_MAP[w.id];
        if (!mapped) return null;
        return { id: 'w_' + w.id, ...mapped, span: w.span };
      }).filter(Boolean)
    ).filter(row => row.length > 0)
  };
}

function shortUrlFmt(url) {
  if (!url) return '—';
  try {
    const u = new URL(url.startsWith('http') ? url : 'https://' + url);
    return u.pathname === '/' ? u.hostname : u.pathname;
  } catch { return url; }
}

function fmtMetricVal(val, fmt_) {
  if (val == null) return '—';
  switch (fmt_) {
    case 'rupiah': return fmt.rupiahShort(val);
    case 'pct':    return fmt.pct ? fmt.pct(val) : val.toFixed(2) + '%';
    case 'roas':   return fmt.roas ? fmt.roas(val) : val.toFixed(2) + 'x';
    default:       return fmt.num ? fmt.num(val) : String(val);
  }
}

const GOOGLE_TABLE_DIMS = [
  { key: 'name',       label: 'Campaign' },
  { key: 'ad_group',   label: 'Ad Group' },
  { key: 'keyword',    label: 'Keyword' },
  { key: 'match_type', label: 'Match Type' },
  { key: 'type',       label: 'Campaign Type' },
  { key: 'device',     label: 'Device' },
];
const GOOGLE_TABLE_METRICS = [
  { key: 'spend',       label: 'Spend',       fmt: 'rupiah' },
  { key: 'clicks',      label: 'Clicks',      fmt: 'num' },
  { key: 'impressions', label: 'Impressions', fmt: 'num' },
  { key: 'conversions', label: 'Conversions', fmt: 'num' },
  { key: 'ctr',         label: 'CTR',         fmt: 'pct' },
  { key: 'cvr',         label: 'CVR',         fmt: 'pct' },
  { key: 'cpa',         label: 'CPA',         fmt: 'rupiah' },
  { key: 'roas',        label: 'ROAS',        fmt: 'roas' },
];
const SEARCH_TABLE_DIMS = [
  { key: 'query',   label: 'Query' },
  { key: 'page',    label: 'Page',    fmtCell: 'url' },
  { key: 'country', label: 'Country' },
  { key: 'device',  label: 'Device' },
];
const SEARCH_TABLE_METRICS = [
  { key: 'impressions', label: 'Impressions', fmt: 'num' },
  { key: 'clicks',      label: 'Clicks',      fmt: 'num' },
  { key: 'ctr',         label: 'CTR',         fmt: 'pct' },
  { key: 'position',    label: 'Avg Position', fmt: 'num' },
];

// ─── Universal configurable data table ────────────────────────────
function DataTable({ widgetId, widgetConfig, rows, availDims, availMetrics, defaultDims, defaultMetrics, defaultName }) {
  const cfg = {
    name: '',
    dimensions: defaultDims || availDims.slice(0, 1).map(d => d.key),
    metrics: defaultMetrics || availMetrics.slice(0, 4).map(m => m.key),
    metricLabels: {},
    filters: [],
    sortMetric: (defaultMetrics || availMetrics.slice(0, 1).map(m => m.key))[0] || '',
    sortDir: 'desc',
    fontSize: 'M',
    pageSize: 10,
    ...(widgetConfig || {}),
  };

  const [search,  setSearch]  = useState('');
  const [sortKey, setSortKey] = useState(cfg.sortMetric);
  const [sortDir, setSortDir] = useState(cfg.sortDir);
  const [pageNum, setPageNum] = useState(1);

  useEffect(() => { setPageNum(1); }, [search]);
  useEffect(() => { setPageNum(1); }, [cfg.pageSize]);
  useEffect(() => { setSortKey(cfg.sortMetric || ''); }, [cfg.sortMetric]);

  const fScale  = FONT_SCALES[cfg.fontSize] || 1;
  const fs      = n => Math.round(n * fScale);
  const dims    = cfg.dimensions.map(k => availDims.find(d => d.key === k)).filter(Boolean);
  const metrics = cfg.metrics.map(k => availMetrics.find(m => m.key === k)).filter(Boolean);
  const pgSize  = Math.max(1, cfg.pageSize || 10);

  const toggleSort = key => {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortKey(key); setSortDir('desc'); setPageNum(1); }
  };

  const filtered = useMemo(() => {
    let r = rows || [];
    (cfg.filters || []).forEach(f => {
      if (!f.val) return;
      const v = (f.val || '').toLowerCase();
      r = r.filter(row => {
        const rv = String(row[f.dim] || '').toLowerCase();
        if (f.op === 'is')     return rv === v;
        if (f.op === 'not')    return rv !== v;
        if (f.op === 'starts') return rv.startsWith(v);
        return rv.includes(v);
      });
    });
    if (search) {
      const s = search.toLowerCase();
      r = r.filter(row => dims.some(d => String(row[d.key] || '').toLowerCase().includes(s)));
    }
    return r;
  }, [rows, cfg.filters, search, dims]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const mul = sortDir === 'desc' ? -1 : 1;
      return mul * ((+(a[sortKey]) || 0) - (+(b[sortKey]) || 0));
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pgSize));
  const curPage    = Math.min(pageNum, totalPages);
  const pageRows   = sorted.slice((curPage - 1) * pgSize, curPage * pgSize);
  const displayName = cfg.name || defaultName || 'Table';

  return (
    <RCard padding={0} style={{ overflow: 'hidden' }}>
      <div style={{ padding: `${fs(10)}px ${fs(16)}px`, borderBottom: '1px solid var(--navy-edge)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontFamily: T.display, fontSize: fs(13), fontWeight: 700, color: fg }}>{displayName}</div>
          <div style={{ fontFamily: T.body, fontSize: fs(10), color: muted, marginTop: 2 }}>{sorted.length} baris</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: `${fs(5)}px ${fs(9)}px`, background: 'var(--navy-elevated)', border: '1px solid var(--navy-edge)', borderRadius: 7, minWidth: 160 }}>
          <svg width="10" height="10" fill="none" stroke={muted} strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: fg, fontFamily: T.body, fontSize: fs(11) }}/>
          {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: muted, cursor: 'pointer', padding: 0, fontSize: 13, lineHeight: 1 }}>×</button>}
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.body, fontSize: fs(12) }}>
          <thead>
            <tr style={{ background: 'var(--navy-deep)' }}>
              {dims.map(d => (
                <th key={d.key} style={{ padding: `${fs(7)}px ${fs(12)}px`, textAlign: 'left', fontFamily: T.mono, fontSize: fs(9), fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: muted, whiteSpace: 'nowrap' }}>
                  {d.label}
                </th>
              ))}
              {metrics.map(m => (
                <SortTh key={m.key} label={cfg.metricLabels?.[m.key] || m.label} sortKey={m.key} active={sortKey === m.key} dir={sortDir} onSort={toggleSort}/>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 && (
              <tr><td colSpan={dims.length + metrics.length} style={{ padding: fs(20), textAlign: 'center', fontFamily: T.mono, fontSize: fs(10), color: muted }}>No results</td></tr>
            )}
            {pageRows.map((r, i) => (
              <tr key={i} style={{ borderTop: '1px solid rgba(51,71,102,.5)' }}>
                {dims.map((d, di) => {
                  const raw  = r[d.key];
                  const disp = d.fmtCell === 'url' ? shortUrlFmt(raw) : (raw || '—');
                  return (
                    <td key={d.key} title={d.fmtCell === 'url' ? (raw || '') : undefined}
                      style={{ padding: `${fs(8)}px ${fs(12)}px`, fontFamily: di === 0 ? T.display : T.body, fontWeight: di === 0 ? 600 : 400, color: di === 0 ? fg : muted, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: fs(di === 0 ? 12 : 11) }}>
                      {disp}
                    </td>
                  );
                })}
                {metrics.map(m => (
                  <td key={m.key} style={{ padding: `${fs(8)}px ${fs(12)}px`, textAlign: 'right', fontFamily: T.mono, color: sec, fontSize: fs(11), whiteSpace: 'nowrap' }}>
                    {fmtMetricVal(r[m.key], m.fmt)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ padding: `${fs(7)}px ${fs(14)}px`, borderTop: '1px solid var(--navy-edge)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--navy-deep)', flexWrap: 'wrap', gap: 6 }}>
          <div style={{ fontFamily: T.mono, fontSize: fs(9), color: muted }}>
            {(curPage - 1) * pgSize + 1}–{Math.min(curPage * pgSize, sorted.length)} / {sorted.length}
          </div>
          <div style={{ display: 'flex', gap: 3 }}>
            <button onClick={() => setPageNum(p => Math.max(1, p - 1))} disabled={curPage === 1}
              style={{ width: fs(26), height: fs(26), border: '1px solid var(--navy-edge)', borderRadius: 5, background: 'var(--navy-elevated)', color: curPage === 1 ? muted : fg, cursor: curPage === 1 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: curPage === 1 ? 0.4 : 1 }}>
              <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let p = totalPages <= 5 ? i + 1 : curPage <= 3 ? i + 1 : curPage >= totalPages - 2 ? totalPages - 4 + i : curPage - 2 + i;
              return (
                <button key={p} onClick={() => setPageNum(p)}
                  style={{ width: fs(26), height: fs(26), border: `1px solid ${p === curPage ? teal : 'var(--navy-edge)'}`, borderRadius: 5, background: p === curPage ? 'rgba(0,194,184,.15)' : 'var(--navy-elevated)', color: p === curPage ? teal : sec, cursor: 'pointer', fontFamily: T.mono, fontSize: fs(10), fontWeight: p === curPage ? 700 : 400 }}>
                  {p}
                </button>
              );
            })}
            <button onClick={() => setPageNum(p => Math.min(totalPages, p + 1))} disabled={curPage === totalPages}
              style={{ width: fs(26), height: fs(26), border: '1px solid var(--navy-edge)', borderRadius: 5, background: 'var(--navy-elevated)', color: curPage === totalPages ? muted : fg, cursor: curPage === totalPages ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: curPage === totalPages ? 0.4 : 1 }}>
              <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>
        </div>
      )}
    </RCard>
  );
}

// ─── Campaigns table with search + sort ───────────────────────────
function CampaignsTable({ campaigns }) {
  const [search,  setSearch]  = useState('');
  const [sortKey, setSortKey] = useState('spend');
  const [sortDir, setSortDir] = useState('desc');

  const toggleSort = key => {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const rows = campaigns
    .filter(c => !search || (c.name || '').toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sortDir === 'desc' ? (b[sortKey] || 0) - (a[sortKey] || 0) : (a[sortKey] || 0) - (b[sortKey] || 0));

  const cols = [
    { key: 'spend',  label: 'Spend' },
    { key: 'clicks', label: 'Clicks' },
    { key: 'ctr',    label: 'CTR' },
    { key: 'cvr',    label: 'CVR' },
    { key: 'cpa',    label: 'CPA' },
    { key: 'roas',   label: 'ROAS' },
  ];

  return (
    <RCard padding={0} style={{ overflow: 'hidden' }}>
      <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--navy-edge)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div>
          <div style={{ fontFamily: T.display, fontSize: 13, fontWeight: 700, color: fg }}>Campaigns</div>
          <div style={{ fontFamily: T.body, fontSize: 11, color: muted, marginTop: 2 }}>{rows.length} kampanye · periode ini</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 10px', background: 'var(--navy-elevated)', border: '1px solid var(--navy-edge)', borderRadius: 7, minWidth: 180 }}>
          <svg width="11" height="11" fill="none" stroke={muted} strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Cari kampanye…"
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: fg, fontFamily: T.body, fontSize: 11.5 }}
          />
          {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: muted, cursor: 'pointer', padding: 0, lineHeight: 1, fontSize: 14 }}>×</button>}
        </div>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.body, fontSize: 12 }}>
        <thead>
          <tr style={{ background: 'var(--navy-deep)' }}>
            <th style={{ padding: '8px 14px', textAlign: 'left', fontFamily: T.mono, fontSize: 9.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: muted }}>Kampanye</th>
            <th style={{ padding: '8px 14px', textAlign: 'left', fontFamily: T.mono, fontSize: 9.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: muted }}>Tipe</th>
            {cols.map(c => <SortTh key={c.key} label={c.label} sortKey={c.key} active={sortKey === c.key} dir={sortDir} onSort={toggleSort}/>)}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td colSpan={8} style={{ padding: '20px 14px', textAlign: 'center', fontFamily: T.mono, fontSize: 10, color: muted }}>Tidak ada kampanye yang cocok</td></tr>
          )}
          {rows.map((c, i) => (
            <tr key={i} style={{ borderTop: '1px solid rgba(51,71,102,.5)' }}>
              <td style={{ padding: '10px 14px', fontFamily: T.display, fontWeight: 600, color: fg, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</td>
              <td style={{ padding: '10px 14px' }}><RChip color={c.type === 'Search' ? blue : c.type === 'Display' ? gold : teal}>{c.type || '—'}</RChip></td>
              <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: T.mono, color: fg }}>{fmt.rupiahShort(c.spend)}</td>
              <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: T.mono, color: sec }}>{fmt.num(c.clicks)}</td>
              <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: T.mono, color: c.ctr > 3 ? '#16A34A' : sec }}>{fmt.pct(c.ctr)}</td>
              <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: T.mono, color: sec }}>{c.cvr != null ? fmt.pct(c.cvr) : '—'}</td>
              <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: T.mono, color: sec }}>{fmt.rupiahShort(c.cpa)}</td>
              <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: T.mono, color: c.roas >= 2 ? '#16A34A' : sec }}>{c.roas != null ? fmt.roas(c.roas) : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </RCard>
  );
}

// ─── Universal sub-renderers ───────────────────────────────────────

function KpiStripWidget({ instance, p, cfg }) {
  const d   = fmt.pctChange;
  const reg = window.DATA_REGISTRY?.[instance.source] || {};
  const scale = FONT_SCALES[cfg.fontSize] || 1;
  const metrics = cfg.metrics || [];
  const ACCENT_COLORS = [teal, blue, gold, '#A78BFA', '#F87171'];
  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
      {metrics.map((key, i) => {
        const def = reg[key];
        if (!def) return null;
        const val  = def.value ? def.value(p) : null;
        const prev = def.prev  ? def.prev(p)  : null;
        const label = (cfg.metricLabels?.[key]) || def.label;
        const spark = def.series ? def.series(p) : null;
        return (
          <Kpi key={key}
            label={label}
            value={fmtMetricVal(val, def.format)}
            delta={prev != null && val != null ? d(val, prev) : null}
            accent={ACCENT_COLORS[i % ACCENT_COLORS.length]}
            spark={i === 0 && spark?.length >= 2 ? spark.slice(-7) : null}
            scale={scale}
          />
        );
      })}
    </div>
  );
}

function SingleStatWidget({ instance, p, cfg }) {
  const d   = fmt.pctChange;
  const reg = window.DATA_REGISTRY?.[instance.source] || {};
  const scale = FONT_SCALES[cfg.fontSize] || 1;
  const key = cfg.metric;
  const def = reg[key] || {};
  const val  = def.value ? def.value(p) : null;
  const prev = def.prev  ? def.prev(p)  : null;
  const label = cfg.label || def.label || key;
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      <Kpi
        label={label}
        value={fmtMetricVal(val, def.format)}
        delta={prev != null && val != null ? d(val, prev) : null}
        accent={teal}
        scale={scale * 1.4}
      />
    </div>
  );
}

function ChartAreaWidget({ instance, p, cfg }) {
  const reg = window.DATA_REGISTRY?.[instance.source] || {};
  const key = cfg.metric;
  const def = reg[key] || {};
  const series = def.series ? (def.series(p) || []) : [];
  const safeSeries = series.length >= 2 ? series : [0, 0];
  const title = cfg.name || def.label || key;
  const totalVal = def.value ? def.value(p) : null;
  const sub = totalVal != null ? `Total: ${fmtMetricVal(totalVal, def.format)}` : null;
  return (
    <ChartCard title={title} sub={sub}>
      <MiniLine data={safeSeries} w={300} h={72} color={teal} fill id={`uni-area-${instance.id}`}/>
    </ChartCard>
  );
}

function ChartBarWidget({ instance, p, cfg }) {
  const reg = window.DATA_REGISTRY?.[instance.source] || {};
  const key = cfg.metric;
  const def = reg[key] || {};
  const series = def.series ? (def.series(p) || []) : [];
  const safeSeries = series.length >= 2 ? series : [0, 0];
  const title = cfg.name || def.label || key;
  return (
    <ChartCard title={title}>
      <MiniBar data={safeSeries} w={300} h={72} color={blue}/>
    </ChartCard>
  );
}

function ChartDonutWidget({ instance, p, cfg }) {
  const reg  = window.DATA_REGISTRY?.[instance.source] || {};
  const rows = (window.TABLE_DATA_REGISTRY?.[instance.source] || (() => []))(p) || [];
  const metricKey = cfg.metric;
  const groupKey  = cfg.groupBy || cfg.dimension;
  const def = reg[metricKey] || {};
  const title = cfg.name || def.label || metricKey;
  const COLORS = [teal, blue, gold, '#A78BFA', '#F87171'];

  const grouped = {};
  rows.forEach(row => {
    const gKey = row[groupKey] || row.name || 'Other';
    grouped[gKey] = (grouped[gKey] || 0) + (Number(row[metricKey]) || 0);
  });
  const entries = Object.entries(grouped).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const total = entries.reduce((s, [, v]) => s + v, 0) || 1;
  const segments = entries.length
    ? entries.map(([, v], i) => ({ value: v, color: COLORS[i % COLORS.length] }))
    : [{ value: 1, color: '#243350' }];

  return (
    <ChartCard title={title}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <MiniDonut segments={segments} size={88} thickness={9}
          centerLabel={String(entries.length || '—')} centerSub="groups"/>
        <div style={{ flex: 1 }}>
          {entries.map(([label, val], i) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: COLORS[i % COLORS.length], flexShrink: 0 }}/>
                <span style={{ fontFamily: T.mono, fontSize: 9, color: sec }}>{label}</span>
              </div>
              <span style={{ fontFamily: T.mono, fontSize: 9, color: muted }}>
                {((val / total) * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </ChartCard>
  );
}

function ChartHeatmapWidget({ instance, p, cfg }) {
  const reg = window.DATA_REGISTRY?.[instance.source] || {};
  const firstMetric = Object.keys(reg)[0];
  const def = firstMetric ? (reg[firstMetric] || {}) : {};
  const rawSeries = def.series ? (def.series(p) || []) : [];
  const flat = rawSeries.slice(0, 28);
  const heatMax = Math.max(...flat) || 1;
  const heatValues = Array.from({ length: 4 }, (_, r) =>
    Array.from({ length: 7 }, (_, c) => (flat[r * 7 + c] || 0) / heatMax)
  );
  const title = cfg.name || 'Traffic Intensity';
  return (
    <ChartCard title={title} sub="4 Minggu × Hari">
      <MiniHeatmap
        rows={4} cols={7}
        values={heatValues}
        labelsRow={['W1','W2','W3','W4']}
        labelsCol={['Sen','Sel','Rab','Kam','Jum','Sab','Min']}
        cell={17} color={teal}
      />
    </ChartCard>
  );
}

function UniversalTableWidget({ instance, p, cfg }) {
  const reg  = window.DATA_REGISTRY?.[instance.source] || {};
  const dims = window.DIM_REGISTRY?.[instance.source]  || [];
  const rows = (window.TABLE_DATA_REGISTRY?.[instance.source] || (() => []))(p) || [];
  const availMetrics = Object.entries(reg).map(([key, def]) => ({
    key, label: def.label, fmt: def.format,
  }));
  return (
    <DataTable
      widgetId={instance.id}
      widgetConfig={cfg}
      rows={rows}
      availDims={dims}
      availMetrics={availMetrics}
      defaultDims={cfg.dimensions || dims.slice(0,1).map(d => d.key)}
      defaultMetrics={cfg.metrics  || availMetrics.slice(0,4).map(m => m.key)}
      defaultName={cfg.name || 'Data Table'}
    />
  );
}

function TextWidget({ cfg }) {
  return (
    <RCard padding={20}>
      {cfg.title && (
        <div style={{ fontFamily: T.display, fontSize: 18, fontWeight: 700, color: fg, marginBottom: cfg.body ? 10 : 0 }}>
          {cfg.title}
        </div>
      )}
      {cfg.body && (
        <div style={{ fontFamily: T.body, fontSize: 13, color: sec, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
          {cfg.body}
        </div>
      )}
      {!cfg.title && !cfg.body && (
        <div style={{ fontFamily: T.mono, fontSize: 11, color: muted, textAlign: 'center', padding: '16px 0' }}>
          Klik Edit → ketik judul dan teks
        </div>
      )}
    </RCard>
  );
}

function UniversalWidget({ instance, p, widgetConfig, editState }) {
  const src  = instance.source;
  const type = instance.type;
  const cfg  = window.getWidgetCfg ? window.getWidgetCfg(type, src, widgetConfig) : (widgetConfig || {});

  const inner = (() => {
    switch (type) {
      case 'kpi-strip':    return <KpiStripWidget    instance={instance} p={p} cfg={cfg}/>;
      case 'single-stat':  return <SingleStatWidget  instance={instance} p={p} cfg={cfg}/>;
      case 'chart-area':   return <ChartAreaWidget   instance={instance} p={p} cfg={cfg}/>;
      case 'chart-bar':    return <ChartBarWidget    instance={instance} p={p} cfg={cfg}/>;
      case 'chart-donut':  return <ChartDonutWidget  instance={instance} p={p} cfg={cfg}/>;
      case 'chart-heatmap':return <ChartHeatmapWidget instance={instance} p={p} cfg={cfg}/>;
      case 'table':        return <UniversalTableWidget instance={instance} p={p} cfg={cfg}/>;
      case 'text':         return <TextWidget        cfg={cfg}/>;
      default:             return <div style={{ padding: 20, color: muted, fontFamily: T.mono, fontSize: 11 }}>Unknown type: {type}</div>;
    }
  })();

  if (!editState) return inner;
  return (
    <SelectableWidget id={instance.id} cardId={type} editState={editState}>
      {inner}
    </SelectableWidget>
  );
}

// ─── Widget map builder ────────────────────────────────────────────
// Returns { [widgetId]: ReactNode } for all widgets across all sections.
function buildWidgetMap(p, connected, widgetConfigs, editState) {
  const d    = fmt.pctChange;
  const wcfg = id => widgetConfigs?.[WIDGET_CARD_TYPES[id] || id] || {};
  const wn   = id => wcfg(id).name || null;
  const map  = {};

  // ── Google Ads widgets ──
  if (connected?.google && p?.ads && p?.series) {
    const { ads, adsPrev, series, channels, campaigns } = p;
    const kpiScale = FONT_SCALES[wcfg('google-kpi').fontSize] || 1;

    const TYPE_COLORS = [blue, gold, '#16A34A', '#E3170A', violet];
    const totalSpend = (channels || []).reduce((s, c) => s + c.spend, 0) || 1;
    const donutSegs = (channels || []).slice(0, 5).map((ch, i) => ({
      value: ch.spend, color: TYPE_COLORS[i % TYPE_COLORS.length],
    }));

    const today = new Date().getDate();
    const safeSpend  = (series.spend  || []).length >= 2 ? series.spend  : [0, 0];
    const safeClicks = (series.clicks || []).length >= 2 ? series.clicks : [0, 0];
    const paceIdx = Math.min(today - 1, (safeSpend.length || 1) - 1);

    map['google-kpi'] = (
      <SelectableWidget id="google-kpi" cardId="kpi-strip" editState={editState}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
          <Kpi label="Total Spend"   value={fmt.rupiahShort(ads.spend)}       delta={d(ads.spend, adsPrev.spend)}             accent={gold} spark={safeSpend.slice(-7)} scale={kpiScale}/>
          <Kpi label="Clicks"        value={fmt.num(ads.clicks)}              delta={d(ads.clicks, adsPrev.clicks)}           accent={blue} scale={kpiScale}/>
          <Kpi label="Impressions"   value={fmt.num(ads.impressions)}         delta={d(ads.impressions, adsPrev.impressions)} accent={blue} scale={kpiScale}/>
          <Kpi label="Conversions"   value={fmt.num(ads.conversions)}         delta={d(ads.conversions, adsPrev.conversions)} accent={teal} scale={kpiScale}/>
          <Kpi label="CTR"           value={fmt.pct(ads.ctr)}                 delta={d(ads.ctr, adsPrev.ctr)}                 accent={teal} scale={kpiScale}/>
          <Kpi label="Avg CPC"       value={fmt.rupiahShort(ads.cpc)}         sub="per klik" scale={kpiScale}/>
          <Kpi label="CPA"           value={fmt.rupiahShort(ads.cpa)}         sub="per konversi" scale={kpiScale}/>
          <Kpi label="ROAS"          value={fmt.roas(ads.roas)}               delta={d(ads.roas, adsPrev.roas)}               accent={gold} scale={kpiScale}/>
        </div>
      </SelectableWidget>
    );

    map['google-spend'] = (
      <SelectableWidget id="google-spend" cardId="chart-area" editState={editState}>
        <ChartCard title={wn('google-spend') || "Spend Harian"} sub={`Total: ${fmt.rupiahShort(ads.spend)}`}>
          <MiniLine data={safeSpend} w={300} h={72} color={blue} fill id="gads-spend"/>
        </ChartCard>
      </SelectableWidget>
    );

    map['google-clicks'] = (
      <SelectableWidget id="google-clicks" cardId="chart-bar" editState={editState}>
        <ChartCard title={wn('google-clicks') || "Click Volume · Pacing"} sub="Bulan ini vs target">
          <MiniBar data={safeClicks} w={300} h={72} color={blue} activeUntil={paceIdx}/>
        </ChartCard>
      </SelectableWidget>
    );

    map['google-budget'] = (
      <SelectableWidget id="google-budget" cardId="chart-donut" editState={editState}>
        <ChartCard title={wn('google-budget') || "Budget per Tipe Kampanye"}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <MiniDonut
              segments={donutSegs.length ? donutSegs : [{ value: 1, color: '#243350' }]}
              size={88} thickness={9}
              centerLabel={String((channels || []).length)}
              centerSub="types"
            />
            <div style={{ flex: 1 }}>
              {(channels || []).slice(0, 5).map((ch, i) => (
                <div key={ch.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: TYPE_COLORS[i % TYPE_COLORS.length], flexShrink: 0 }}/>
                    <span style={{ fontFamily: T.mono, fontSize: 9, color: sec }}>{ch.name}</span>
                  </div>
                  <span style={{ fontFamily: T.mono, fontSize: 9, color: muted }}>
                    {((ch.spend / totalSpend) * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      </SelectableWidget>
    );

    if ((campaigns || []).length > 0) {
      map['google-campaigns'] = (
        <SelectableWidget id="google-campaigns" cardId="table-campaigns" editState={editState}>
          <DataTable widgetId="google-campaigns" widgetConfig={wcfg('google-campaigns')}
            rows={campaigns} availDims={GOOGLE_TABLE_DIMS} availMetrics={GOOGLE_TABLE_METRICS}
            defaultDims={['name']} defaultMetrics={['spend','clicks','impressions','ctr','cpa']}
            defaultName="Campaigns · Google Ads"/>
        </SelectableWidget>
      );
    }

    if (p.adGroups && p.adGroups.length > 0) {
      map['google-adgroups'] = (
        <SelectableWidget id="google-adgroups" cardId="table-campaigns" editState={editState}>
          <DataTable widgetId="google-adgroups" widgetConfig={wcfg('google-adgroups')}
            rows={p.adGroups} availDims={GOOGLE_TABLE_DIMS} availMetrics={GOOGLE_TABLE_METRICS}
            defaultDims={['ad_group','name']} defaultMetrics={['spend','clicks','ctr','cpa']}
            defaultName="Ad Groups · Google Ads"/>
        </SelectableWidget>
      );
    }

    if (p.keywords && p.keywords.length > 0) {
      map['google-keywords'] = (
        <SelectableWidget id="google-keywords" cardId="table-campaigns" editState={editState}>
          <DataTable widgetId="google-keywords" widgetConfig={wcfg('google-keywords')}
            rows={p.keywords} availDims={GOOGLE_TABLE_DIMS} availMetrics={GOOGLE_TABLE_METRICS}
            defaultDims={['keyword']} defaultMetrics={['spend','clicks','ctr','cpa']}
            defaultName="Keywords · Google Ads"/>
        </SelectableWidget>
      );
    }
  }

  // ── Meta Ads widgets ──
  if (connected?.meta && p) {
    const ads      = p.meta     || p.ads;
    const adsPrev  = p.metaPrev || p.adsPrev;
    const series   = (p.metaSeries && p.metaSeries.labels && p.metaSeries.labels.length) ? p.metaSeries : p.series;
    const channels = (p.metaChannels && p.metaChannels.length) ? p.metaChannels : (p.channels || []);
    const kpiScale = FONT_SCALES[wcfg('meta-kpi').fontSize] || 1;

    if (ads && adsPrev && series) {
      const META_COLORS = ['#0EA5E9', violet, '#F43F5E', gold];
      const totalImpr = channels.reduce((s, c) => s + c.impressions, 0) || 1;
      const donutSegs = channels.slice(0, 4).map((ch, i) => ({
        value: ch.impressions, color: META_COLORS[i % META_COLORS.length],
      }));

      const safeImpr   = (series.impressions || []).length >= 2 ? series.impressions : [0, 0];
      const safeClicks = (series.clicks || []).length >= 2 ? series.clicks : [0, 0];
      const imprScale  = safeImpr.map(v => Math.round(v / Math.max(...safeImpr) * Math.max(...safeClicks)));
      const cpm = ads.impressions > 0 ? (ads.spend / ads.impressions) * 1000 : 0;

      map['meta-kpi'] = (
        <SelectableWidget id="meta-kpi" cardId="kpi-strip" editState={editState}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
            <Kpi label="Total Spend"   value={fmt.rupiahShort(ads.spend)}       delta={d(ads.spend, adsPrev.spend)}             accent={gold} spark={safeClicks.slice(-7)} scale={kpiScale}/>
            <Kpi label="Reach (Impr.)" value={fmt.num(ads.impressions)}         delta={d(ads.impressions, adsPrev.impressions)} accent={'#0EA5E9'} scale={kpiScale}/>
            <Kpi label="Link Clicks"   value={fmt.num(ads.clicks)}              delta={d(ads.clicks, adsPrev.clicks)}           accent={'#0EA5E9'} scale={kpiScale}/>
            <Kpi label="Conversions"   value={fmt.num(ads.conversions)}         delta={d(ads.conversions, adsPrev.conversions)} accent={teal} scale={kpiScale}/>
            <Kpi label="CPM"           value={fmt.rupiahShort(cpm)}             sub="per 1k impresi" scale={kpiScale}/>
            <Kpi label="CTR"           value={fmt.pct(ads.ctr)}                 delta={d(ads.ctr, adsPrev.ctr)}                 accent={teal} scale={kpiScale}/>
            <Kpi label="CPA"           value={fmt.rupiahShort(ads.cpa)}         sub="per konversi" scale={kpiScale}/>
          </div>
        </SelectableWidget>
      );

      map['meta-trend'] = (
        <SelectableWidget id="meta-trend" cardId="chart-area" editState={editState}>
          <ChartCard title={wn('meta-trend') || "Reach vs Engagement Trend"}>
            <div style={{ display: 'flex', gap: 16, marginBottom: 10 }}>
              <LegendDot color="#0EA5E9" label="Impressions (scaled)"/>
              <LegendDot color={violet} label="Clicks"/>
            </div>
            <MultiArea
              seriesA={imprScale.length >= 2 ? imprScale : [10, 20]}
              seriesB={safeClicks.length >= 2 ? safeClicks : [5, 10]}
              colorA="#0EA5E9" colorB={violet}
              labelsX={safeImpr.length >= 4 ? ['W1', 'W2', 'W3', 'W4'] : []}
              w={480} h={130}
            />
          </ChartCard>
        </SelectableWidget>
      );

      map['meta-donut'] = (
        <SelectableWidget id="meta-donut" cardId="chart-donut" editState={editState}>
          <ChartCard title={wn('meta-donut') || "Impresi per Tipe Iklan"}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <MiniDonut
                segments={donutSegs.length ? donutSegs : [{ value: 1, color: '#243350' }]}
                size={88} thickness={9}
                centerLabel={fmt.num(Math.round(ads.impressions / 1000)) + 'k'}
                centerSub="reach"
              />
              <div style={{ flex: 1 }}>
                {channels.slice(0, 4).map((ch, i) => (
                  <div key={ch.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: META_COLORS[i % META_COLORS.length], flexShrink: 0 }}/>
                      <span style={{ fontFamily: T.mono, fontSize: 9, color: sec }}>{ch.name}</span>
                    </div>
                    <span style={{ fontFamily: T.mono, fontSize: 9, color: muted }}>
                      {((ch.impressions / totalImpr) * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </ChartCard>
        </SelectableWidget>
      );
    }
  }

  // ── GA4 widgets ──
  if (connected?.ga4 && p?.ga4 && p.ga4.sessions > 0) {
    const { ga4, ga4Prev, series } = p;
    const kpiScale = FONT_SCALES[wcfg('ga4-kpi').fontSize] || 1;

    const rawHeat = (series.impressions || []).length >= 28
      ? series.impressions
      : (series.clicks || []).length >= 7
        ? series.clicks
        : Array.from({ length: 28 }, (_, i) => Math.abs(Math.sin(i * 0.7 + 0.3)) * 100 + 30);

    const heatFlat = rawHeat.slice(0, 28);
    const heatMax  = Math.max(...heatFlat) || 1;
    const heatValues = Array.from({ length: 4 }, (_, r) =>
      Array.from({ length: 7 }, (_, c) => (heatFlat[r * 7 + c] || 0) / heatMax)
    );

    const safeA = (series.impressions || []).length >= 2
      ? series.impressions.map(v => Math.round(v / 25))
      : [ga4.sessions];
    const safeB = (series.clicks || []).length >= 2
      ? series.clicks.map(v => Math.round(v * 1.3))
      : [ga4.users];
    const safeConv = (series.conversions || []).length >= 2 ? series.conversions : [0, 0];
    const safeA7 = safeA.slice(-7);

    const pagesPerSession = ga4.sessions > 0 ? (ga4.pageviews / ga4.sessions) : 0;
    const engageRate      = ga4.sessions > 0 ? (ga4.engaged / ga4.sessions) * 100 : 0;

    map['ga4-kpi'] = (
      <SelectableWidget id="ga4-kpi" cardId="kpi-strip" editState={editState}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
          <Kpi label="Sessions"          value={fmt.num(ga4.sessions)}  delta={d(ga4.sessions, ga4Prev.sessions)}   accent={gold} spark={safeA7} scale={kpiScale}/>
          <Kpi label="Users"             value={fmt.num(ga4.users)}     delta={d(ga4.users, ga4Prev.users)}         accent={gold} scale={kpiScale}/>
          <Kpi label="Pageviews"         value={fmt.num(ga4.pageviews)} delta={d(ga4.pageviews, ga4Prev.pageviews)} accent={gold} scale={kpiScale}/>
          <Kpi label="Engaged Sessions"  value={fmt.num(ga4.engaged)}   delta={d(ga4.engaged, ga4Prev.engaged)}     accent={teal} scale={kpiScale}/>
          <Kpi label="Bounce Rate"       value={fmt.pct(ga4.bounce_rate)}
            delta={d(ga4.bounce_rate, ga4Prev.bounce_rate) != null ? -d(ga4.bounce_rate, ga4Prev.bounce_rate) : null}
            scale={kpiScale}/>
          <Kpi label="Pages / Session"   value={pagesPerSession.toFixed(1)} sub="rata-rata" scale={kpiScale}/>
          <Kpi label="Engagement Rate"   value={engageRate.toFixed(1) + '%'} sub="dari total sessions" scale={kpiScale}/>
        </div>
      </SelectableWidget>
    );

    map['ga4-sessions'] = (
      <SelectableWidget id="ga4-sessions" cardId="chart-area" editState={editState}>
        <ChartCard title={wn('ga4-sessions') || "Sessions vs Users Trend"}>
          <div style={{ display: 'flex', gap: 16, marginBottom: 10 }}>
            <LegendDot color={gold} label="Sessions"/>
            <LegendDot color={teal} label="Users"/>
          </div>
          <MultiArea
            seriesA={safeA.length >= 2 ? safeA : [100, 120]}
            seriesB={safeB.length >= 2 ? safeB : [80, 95]}
            colorA={gold} colorB={teal}
            labelsX={safeA.length >= 4 ? ['W1', 'W2', 'W3', 'W4'] : []}
            w={480} h={130}
          />
        </ChartCard>
      </SelectableWidget>
    );

    map['ga4-heatmap'] = (
      <SelectableWidget id="ga4-heatmap" cardId="chart-heatmap" editState={editState}>
        <ChartCard title={wn('ga4-heatmap') || "Traffic Intensity"} sub="4 Minggu × Hari">
          <MiniHeatmap
            rows={4} cols={7}
            values={heatValues}
            labelsRow={['W1', 'W2', 'W3', 'W4']}
            labelsCol={['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']}
            cell={17} color={teal}
          />
        </ChartCard>
      </SelectableWidget>
    );

    map['ga4-conversion'] = (
      <SelectableWidget id="ga4-conversion" cardId="chart-bar" editState={editState}>
        <ChartCard title={wn('ga4-conversion') || "Volume Konversi Harian"}>
          <div style={{ fontFamily: T.display, fontSize: 18, fontWeight: 700, color: fg, marginBottom: 8 }}>
            {fmt.num(ga4.engaged)}{' '}
            <span style={{ fontFamily: T.mono, fontSize: 10, color: muted, fontWeight: 400 }}>engaged sessions</span>
          </div>
          <MiniBar data={safeConv.length >= 2 ? safeConv : [1, 2]} w={800} h={56} color={teal} gap={3}/>
        </ChartCard>
      </SelectableWidget>
    );
  }

  // ── Search Console widgets ──
  if (connected?.search && p?.gsc) {
    const { gsc } = p;
    const { impressions, clicks, ctr, position, queries, series } = gsc;
    const posColor = position <= 3 ? '#16A34A' : position <= 7 ? gold : '#E3170A';
    const posLabel = position <= 3 ? 'Excellent · Top 3' : position <= 7 ? 'Good · Page 1' : 'Perlu Optimasi';
    const gscPrev  = p.gscPrev;
    const kpiScale = FONT_SCALES[wcfg('search-kpi').fontSize] || 1;

    const safeCtr = (series.clicks || []).length >= 2
      ? series.clicks.map((v, i) => {
          const im = (series.impressions || [])[i] || 1;
          return parseFloat(((v / im) * 100).toFixed(2));
        })
      : [ctr];
    const safeClicks = (series.clicks || []).length >= 2 ? series.clicks : [clicks];

    map['search-kpi'] = (
      <SelectableWidget id="search-kpi" cardId="kpi-strip" editState={editState}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
          <Kpi label="Total Impressions" value={fmt.num(impressions)}
            delta={gscPrev ? d(impressions, gscPrev.impressions) : null} accent={blue} scale={kpiScale}/>
          <Kpi label="Organic Clicks"    value={fmt.num(clicks)}
            delta={gscPrev ? d(clicks, gscPrev.clicks) : null} accent={teal} scale={kpiScale}/>
          <Kpi label="Avg CTR"           value={ctr.toFixed(2) + '%'}
            delta={gscPrev ? d(ctr, gscPrev.ctr) : null} accent={teal} scale={kpiScale}/>
          <Kpi label="Avg Position"      value={'#' + position.toFixed(1)} sub={posLabel} accent={posColor} scale={kpiScale}/>
        </div>
      </SelectableWidget>
    );

    map['search-ctr'] = (
      <SelectableWidget id="search-ctr" cardId="chart-area" editState={editState}>
        <ChartCard title={wn('search-ctr') || "CTR Organik Harian"}>
          <div style={{ fontFamily: T.display, fontSize: 20, fontWeight: 700, color: fg, marginBottom: 8 }}>
            {ctr.toFixed(2)}%
            <span style={{ fontFamily: T.mono, fontSize: 10, color: muted, fontWeight: 400, marginLeft: 6 }}>avg CTR</span>
          </div>
          <MiniLine data={safeCtr.length >= 2 ? safeCtr : [ctr, ctr]} w={260} h={66} color={blue} fill id="sc-ctr"/>
        </ChartCard>
      </SelectableWidget>
    );

    map['search-clicks'] = (
      <SelectableWidget id="search-clicks" cardId="chart-bar" editState={editState}>
        <ChartCard title={wn('search-clicks') || "Organic Clicks Harian"}>
          <div style={{ fontFamily: T.display, fontSize: 20, fontWeight: 700, color: fg, marginBottom: 8 }}>
            {fmt.num(clicks)}
          </div>
          <MiniBar data={safeClicks.length >= 2 ? safeClicks : [clicks, clicks]} w={260} h={66} color={blue}/>
        </ChartCard>
      </SelectableWidget>
    );

    if (queries && queries.length > 0) {
      map['search-queries'] = (
        <SelectableWidget id="search-queries" cardId="table-rankings" editState={editState}>
          <DataTable widgetId="search-queries" widgetConfig={wcfg('search-queries')}
            rows={queries} availDims={SEARCH_TABLE_DIMS} availMetrics={SEARCH_TABLE_METRICS}
            defaultDims={['query']} defaultMetrics={['impressions','clicks','ctr','position']}
            defaultName="Top Queries · Search Console"/>
        </SelectableWidget>
      );
    }

    if (gsc.pages && gsc.pages.length > 0) {
      map['search-pages'] = (
        <SelectableWidget id="search-pages" cardId="table-rankings" editState={editState}>
          <DataTable widgetId="search-pages" widgetConfig={wcfg('search-pages')}
            rows={gsc.pages} availDims={SEARCH_TABLE_DIMS} availMetrics={SEARCH_TABLE_METRICS}
            defaultDims={['page']} defaultMetrics={['impressions','clicks','ctr','position']}
            defaultName="Top Pages · Search Console"/>
        </SelectableWidget>
      );
    }
  }

  return map;
}

// ─── Between-row Browse drop zone ─────────────────────────────────
// Defined at module level (NOT inside DragCanvas) so React sees the same component
// type across re-renders — prevents unmount/remount that would generate spurious
// dragenter/dragleave events and cause flicker.
function RowDropZone({ insertAt, active, onDragOver, onDragEnter, onDrop }) {
  return (
    <div
      style={{
        height: active ? 56 : 20, borderRadius: 6, marginBottom: 4,
        transition: 'height .15s ease, background .15s, border-color .15s',
        border: `1.5px dashed ${active ? teal : 'rgba(0,194,184,.25)'}`,
        background: active ? 'rgba(0,194,184,.08)' : 'rgba(0,194,184,.02)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'copy',
      }}
      onDragOver={onDragOver}
      onDragEnter={() => onDragEnter(insertAt)}
      onDrop={e => onDrop(insertAt, e)}
    >
      {active
        ? <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: teal }}>+ new row</span>
        : <div style={{ width: 40, height: 2, borderRadius: 1, background: 'rgba(0,194,184,.25)' }}/>
      }
    </div>
  );
}

function buildUniversalMap(p, widgetConfigs, layouts, editState) {
  const map = {};
  (layouts?.rows || []).forEach(row => {
    row.forEach(entry => {
      if (!entry.type) return; // skip non-universal entries (handled inline)
      map[entry.id] = (
        <UniversalWidget
          instance={entry}
          p={p}
          widgetConfig={widgetConfigs?.[entry.id] || {}}
          editState={editState}
        />
      );
    });
  });
  return map;
}

// ─── Drag canvas ───────────────────────────────────────────────────
function DragCanvas({ p, connected, widgetConfigs, editState, layouts, onLayoutChange }) {
  const [dragId,           setDragId]           = React.useState(null);
  const [hintDismissed,    setHintDismissed]    = React.useState(false);
  const [dropTarget,       setDropTarget]        = React.useState(null);
  const [ghostPos,         setGhostPos]          = React.useState({ x: 0, y: 0 });
  const [browseDragActive, setBrowseDragActive]  = React.useState(false);
  const [browseDropTarget, setBrowseDropTarget]  = React.useState(null);
  const pendingDrag  = React.useRef(null);
  const dragIdRef    = React.useRef(null);   // mirrors dragId for doc-level handlers
  const containerRef = React.useRef(null);   // ref to the outer canvas div
  const justDropped  = React.useRef(false);
  dragIdRef.current  = dragId;               // keep in sync every render

  // Wrap onSelect so a click fired immediately after a drop is suppressed
  const _es = editState ? {
    ...editState,
    onSelect: (id, cardId) => {
      if (justDropped.current) { justDropped.current = false; return; }
      editState.onSelect(id, cardId);
    },
  } : null;

  // ── Document-level Browse drag detection ─────────────────────────
  // Uses dragstart/dragend (fire once per drag) instead of dragenter/dragleave
  // counting (which fires on every child element and causes flicker).
  React.useEffect(() => {
    const onDocDragStart = e => {
      if (Array.from(e.dataTransfer?.types || []).includes('browsecardid')) {
        setBrowseDragActive(true);
        setBrowseDropTarget(null);
      }
    };
    const onDocDragEnd = () => { setBrowseDragActive(false); setBrowseDropTarget(null); };
    document.addEventListener('dragstart', onDocDragStart);
    document.addEventListener('dragend',   onDocDragEnd);
    return () => {
      document.removeEventListener('dragstart', onDocDragStart);
      document.removeEventListener('dragend',   onDocDragEnd);
    };
  }, []);

  // ── Document-level pointer cleanup ───────────────────────────────
  // Cancels a stuck pointer drag if the user releases the pointer outside
  // the canvas boundary (where the container's onPointerUp won't fire).
  React.useEffect(() => {
    const cancelIfOutside = e => {
      pendingDrag.current = null;          // always clear on any pointer release
      if (!dragIdRef.current) return;
      if (containerRef.current && containerRef.current.contains(e.target)) return;
      setDragId(null);
      setDropTarget(null);
    };
    document.addEventListener('pointerup',     cancelIfOutside);
    document.addEventListener('pointercancel', cancelIfOutside);
    return () => {
      document.removeEventListener('pointerup',     cancelIfOutside);
      document.removeEventListener('pointercancel', cancelIfOutside);
    };
  }, []);

  // Build widget map from live data, then augment with Browse overrides / browse-* IDs
  const widgetMap = buildUniversalMap(p, widgetConfigs, layouts, _es);
  const _cards = window.CARDS || [];
  layouts.rows.forEach(row => row.forEach(entry => {
    if (entry.cardTypeOverride) {
      const c = _cards.find(c => c.id === entry.cardTypeOverride);
      if (c) {
        const content = React.createElement(c.render);
        widgetMap[entry.id] = _es
          ? React.createElement(SelectableWidget, { id: entry.id, cardId: entry.cardTypeOverride, editState: _es }, content)
          : content;
      }
    }
    if (entry.id && entry.id.startsWith('browse-')) {
      const wop   = entry.id.slice('browse-'.length);
      const tsIdx = wop.lastIndexOf('-');
      const cid   = wop.slice(0, tsIdx);
      const c     = _cards.find(c => c.id === cid);
      if (c && !widgetMap[entry.id]) {
        const content = React.createElement(c.render);
        widgetMap[entry.id] = _es
          ? React.createElement(SelectableWidget, { id: entry.id, cardId: cid, editState: _es }, content)
          : content;
      }
    }
  }));

  // ── Pointer drag (reorder existing widgets) ──────────────────────
  const handlePointerDown = (id, e) => {
    if (!editState || browseDragActive) return;
    e.stopPropagation();
    // Release implicit pointer capture so pointerenter fires on other widgets (enables cross-row drag)
    if (e.target.releasePointerCapture) e.target.releasePointerCapture(e.pointerId);
    pendingDrag.current = { id, startX: e.clientX, startY: e.clientY };
  };

  const handlePointerMove = (e) => {
    if (pendingDrag.current && !dragId) {
      const dx = e.clientX - pendingDrag.current.startX;
      const dy = e.clientY - pendingDrag.current.startY;
      if (Math.sqrt(dx * dx + dy * dy) > 6) {
        setDragId(pendingDrag.current.id);
        setGhostPos({ x: e.clientX, y: e.clientY });
        pendingDrag.current = null;
      }
    }
    if (dragId) setGhostPos({ x: e.clientX, y: e.clientY });
  };

  // Shared drop application — used by both onPointerUp (inside canvas) and
  // document-level cleanup (outside canvas, cancel only).
  const applyDrop = (id, target) => {
    if (!target) return;
    onLayoutChange(prev => {
      let rows = prev.rows.map(r => [...r]);

      if (target.type === 'swap') {
        // Move-before-target: remove drag entry, insert at target position.
        // Works same-row (horizontal) and cross-row (vertical).
        let dragEntry = null;
        rows = rows.map(row => {
          const idx = row.findIndex(w => w.id === id);
          if (idx !== -1) { dragEntry = row[idx]; return row.filter((_, i) => i !== idx); }
          return row;
        }).filter(row => row.length > 0);
        if (dragEntry) {
          let targetRowIdx = -1, targetPosIdx = -1;
          rows.forEach((row, ri) => row.forEach((w, pi) => {
            if (w.id === target.targetId) { targetRowIdx = ri; targetPosIdx = pi; }
          }));
          if (targetRowIdx >= 0) rows[targetRowIdx].splice(targetPosIdx, 0, dragEntry);
        }

      } else if (target.type === 'new-row') {
        let dragEntry = null;
        // Track source row index BEFORE removal to correct insertAt if that row is deleted
        const srcRowIdx = rows.findIndex(row => row.some(w => w.id === id));
        const srcWillBeEmpty = srcRowIdx >= 0 && rows[srcRowIdx].length === 1;
        rows = rows.map(row => {
          const idx = row.findIndex(w => w.id === id);
          if (idx !== -1) { dragEntry = row[idx]; return row.filter((_, i) => i !== idx); }
          return row;
        }).filter(row => row.length > 0);
        // If the source row was removed and was before the target, indices shifted by -1
        let insertAt = target.insertAt;
        if (srcWillBeEmpty && srcRowIdx < insertAt) insertAt = Math.max(0, insertAt - 1);
        if (dragEntry) rows.splice(insertAt, 0, [dragEntry]);
      }

      return { ...prev, rows };
    });
  };

  const handlePointerUp = () => {
    pendingDrag.current = null;
    if (!dragId) return;
    applyDrop(dragId, dropTarget);
    setDragId(null);
    setDropTarget(null);
    justDropped.current = true;
  };

  // ── Browse → Canvas drag helpers ─────────────────────────────────
  const isBrowseDrag = e => e.dataTransfer?.types && Array.from(e.dataTransfer.types).includes('browsecardid');

  const _parseBrowseDef = e => {
    try { const s = e.dataTransfer?.getData('browseWidgetDef'); return s ? JSON.parse(s) : null; } catch { return null; }
  };

  // Drop ON center of widget → replace it
  const handleWidgetBrowseDrop = (widgetId, e) => {
    const def = _parseBrowseDef(e);
    if (def) {
      e.preventDefault(); e.stopPropagation();
      const newId = window.genWidgetId ? window.genWidgetId() : 'w_' + Date.now();
      onLayoutChange(prev => ({
        ...prev,
        rows: prev.rows.map(r => r.map(w => w.id === widgetId ? { id: newId, type: def.type, source: def.source, span: w.span } : w)),
      }));
      return;
    }
    const cardId = e.dataTransfer?.getData('browseCardId');
    if (!cardId) return;
    e.preventDefault(); e.stopPropagation();
    onLayoutChange(prev => ({
      ...prev,
      rows: prev.rows.map(r => r.map(w => w.id === widgetId ? { ...w, cardTypeOverride: cardId } : w)),
    }));
  };

  // Drop on left/right edge of widget → insert before/after in the row
  const handleBetweenDrop = (rowIdx, insertPos, e) => {
    const def = _parseBrowseDef(e);
    if (def) {
      e.preventDefault(); e.stopPropagation();
      const newId = window.genWidgetId ? window.genWidgetId() : 'w_' + Date.now();
      onLayoutChange(prev => {
        const rows = prev.rows.map(r => [...r]);
        rows[rowIdx].splice(insertPos, 0, { id: newId, type: def.type, source: def.source, span: 4 });
        return { ...prev, rows };
      });
      return;
    }
    const cardId = e.dataTransfer?.getData('browseCardId');
    if (!cardId) return;
    e.preventDefault(); e.stopPropagation();
    const newId = `browse-${cardId}-${Date.now()}`;
    onLayoutChange(prev => {
      const rows = prev.rows.map(r => [...r]);
      rows[rowIdx].splice(insertPos, 0, { id: newId, span: 4 });
      return { ...prev, rows };
    });
  };

  // ── Widget toolbar actions ────────────────────────────────────────
  const swapInRow = (rowIdx, idA, idB) => {
    onLayoutChange(prev => {
      const rows = prev.rows.map((row, ri) => {
        if (ri !== rowIdx) return row;
        const newRow = [...row];
        const ia = newRow.findIndex(e => e.id === idA);
        const ib = newRow.findIndex(e => e.id === idB);
        if (ia < 0 || ib < 0) return row;
        [newRow[ia], newRow[ib]] = [newRow[ib], newRow[ia]];
        return newRow;
      });
      return { ...prev, rows };
    });
  };

  const swapRows = (riA, riB) => {
    if (riA < 0 || riB < 0 || riA >= layouts.rows.length || riB >= layouts.rows.length) return;
    onLayoutChange(prev => {
      const rows = [...prev.rows];
      [rows[riA], rows[riB]] = [rows[riB], rows[riA]];
      return { ...prev, rows };
    });
  };

  // Drop on between-row zone → insert new row
  const handleNewRowDrop = (insertAt, e) => {
    const def = _parseBrowseDef(e);
    if (def) {
      e.preventDefault(); e.stopPropagation();
      const newId = window.genWidgetId ? window.genWidgetId() : 'w_' + Date.now();
      onLayoutChange(prev => {
        const rows = [...prev.rows];
        rows.splice(insertAt, 0, [{ id: newId, type: def.type, source: def.source, span: 12 }]);
        return { ...prev, rows };
      });
      return;
    }
    const cardId = e.dataTransfer?.getData('browseCardId');
    if (!cardId) return;
    e.preventDefault(); e.stopPropagation();
    const newId = `browse-${cardId}-${Date.now()}`;
    onLayoutChange(prev => {
      const rows = [...prev.rows];
      rows.splice(insertAt, 0, [{ id: newId, span: 12 }]);
      return { ...prev, rows };
    });
  };

  return (
    <div ref={containerRef} style={{ position: 'relative' }}
      onPointerMove={editState ? handlePointerMove : undefined}
      onPointerUp={editState ? handlePointerUp : undefined}
      onDragOver={e => { if (isBrowseDrag(e)) e.preventDefault(); }}
      onClick={e => { if (e.target === e.currentTarget && editState?.onDeselect) editState.onDeselect(); }}
    >
      {/* Edit mode hint strip — shown once per editor session */}
      {editState && !hintDismissed && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px',
          borderRadius: 8, marginBottom: 16,
          background: 'rgba(0,194,184,.05)', border: '1px solid rgba(0,194,184,.14)',
        }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={teal} strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          <span style={{ fontFamily: T.mono, fontSize: 9, color: teal, letterSpacing: '0.05em', flex: 1 }}>
            Edit Mode · Klik widget untuk pilih · Drag untuk pindahkan · Gunakan toolbar di atas widget yang dipilih · Ctrl+Z untuk undo
          </span>
          <button
            onPointerDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); setHintDismissed(true); }}
            style={{ background: 'none', border: 'none', color: muted, cursor: 'pointer', padding: '0 2px', fontSize: 14, lineHeight: 1, flexShrink: 0 }}
          >×</button>
        </div>
      )}
      {/* 12-column grid overlay during pointer drag */}
      {dragId && (
        <div style={{
          position: 'absolute', inset: -4, zIndex: 1, pointerEvents: 'none', borderRadius: 6,
          background: 'repeating-linear-gradient(to right, rgba(0,194,184,.06) 0, rgba(0,194,184,.06) calc(100%/12 - 14px * 11/12), transparent calc(100%/12 - 14px * 11/12), transparent calc(100%/12))',
          border: '1px solid rgba(0,194,184,.1)',
        }}/>
      )}

      {/* Browse drag canvas hint border */}
      {browseDragActive && (
        <div style={{
          position: 'absolute', inset: -2, zIndex: 0, borderRadius: 10, pointerEvents: 'none',
          border: '2px dashed rgba(0,194,184,.3)',
        }}/>
      )}

      {/* Rows — always grid (no layout switch prevents flickering) */}
      {layouts.rows.map((row, rowIdx) => {
        const visible = row.filter(({ id }) => widgetMap[id]);
        if (!visible.length) return null;
        const autoSpan = Math.max(1, Math.floor(12 / visible.length));

        return (
          <React.Fragment key={rowIdx}>
            {/* Between-row zone: only during Browse drag */}
            {browseDragActive && <RowDropZone
              insertAt={rowIdx}
              active={browseDropTarget?.type === 'row' && browseDropTarget.insertAt === rowIdx}
              onDragOver={e => { e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = 'copy'; }}
              onDragEnter={i => setBrowseDropTarget({ type: 'row', insertAt: i })}
              onDrop={(i, e) => handleNewRowDrop(i, e)}
            />}

            {/* Pointer-drag new-row zone */}
            {dragId && !browseDragActive && (
              <div
                onPointerEnter={() => setDropTarget({ type: 'new-row', insertAt: rowIdx })}
                style={{
                  height: dropTarget?.type === 'new-row' && dropTarget.insertAt === rowIdx ? 40 : 20,
                  borderRadius: 6, transition: 'height .12s, background .12s',
                  border: `1px dashed ${dropTarget?.type === 'new-row' && dropTarget.insertAt === rowIdx ? teal : 'transparent'}`,
                  background: dropTarget?.type === 'new-row' && dropTarget.insertAt === rowIdx ? 'rgba(0,194,184,.1)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {dropTarget?.type === 'new-row' && dropTarget.insertAt === rowIdx && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: teal }}>Drop here → new row</span>
                )}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: 20, marginBottom: 20, position: 'relative', alignItems: 'stretch' }}>
              {visible.map((entry, colIdx) => {
                const { id } = entry;
                const entrySpan = entry.span || autoSpan;
                const actualIdx  = row.indexOf(entry);
                const isDragging = dragId === id;
                const isSwap     = !browseDragActive && dropTarget?.type === 'swap' && dropTarget.targetId === id;
                const isBefore   = browseDragActive && browseDropTarget?.type === 'before' && browseDropTarget.id === id;
                const isAfter    = browseDragActive && browseDropTarget?.type === 'after'  && browseDropTarget.id === id;
                const isReplace  = browseDragActive && browseDropTarget?.type === 'replace' && browseDropTarget.id === id;

                return (
                  <div key={id}
                    style={{
                      gridColumn: `span ${entrySpan}`, position: 'relative',
                      display: 'flex', flexDirection: 'column',
                      opacity: isDragging ? 0.3 : 1,
                      cursor: editState && !browseDragActive ? (isDragging ? 'grabbing' : 'grab') : 'default',
                      userSelect: 'none',
                    }}
                    onPointerDown={editState && !browseDragActive ? e => handlePointerDown(id, e) : undefined}
                    onPointerEnter={() => { if (dragId && dragId !== id) setDropTarget({ type: 'swap', targetId: id }); }}
                    onDragOver={e => {
                      if (!isBrowseDrag(e)) return;
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'copy';
                      setBrowseDropTarget({ type: 'replace', id });
                    }}
                    onDrop={e => isBrowseDrag(e) && handleWidgetBrowseDrop(id, e)}
                  >
                    {/* Drag indicator pill */}
                    {editState && !browseDragActive && (
                      <div style={{
                        position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)',
                        width: 36, height: 4, borderRadius: 2, zIndex: 20, pointerEvents: 'none',
                        background: isDragging ? teal : 'rgba(0,194,184,.3)', transition: 'background .15s',
                      }}/>
                    )}

                    {/* Floating action toolbar — visible when this widget is selected */}
                    {editState && editState.selected === id && !dragId && !browseDragActive && (
                      <div
                        onPointerDown={e => e.stopPropagation()}
                        style={{
                          position: 'absolute',
                          ...(rowIdx === 0 ? { bottom: -44 } : { top: -44 }),
                          left: '50%', transform: 'translateX(-50%)',
                          zIndex: 40, display: 'flex', alignItems: 'center', gap: 2,
                          background: 'rgba(8,16,34,.96)', border: '1px solid rgba(0,194,184,.3)',
                          borderRadius: 9, padding: '4px 6px',
                          boxShadow: '0 4px 20px rgba(0,0,0,.55)',
                          backdropFilter: 'blur(10px)', whiteSpace: 'nowrap',
                        }}
                      >
                        {/* Move left within row */}
                        {[
                          { title: 'Move left', disabled: colIdx === 0, onClick: () => swapInRow(rowIdx, id, visible[colIdx - 1].id), icon: <path d="M15 18l-6-6 6-6"/> },
                          { title: 'Move right', disabled: colIdx === visible.length - 1, onClick: () => swapInRow(rowIdx, id, visible[colIdx + 1].id), icon: <path d="M9 18l6-6-6-6"/> },
                        ].map(({ title, disabled, onClick, icon }) => (
                          <button key={title} title={title} disabled={disabled}
                            onClick={e => { e.stopPropagation(); if (!disabled) onClick(); }}
                            style={{ width: 26, height: 26, padding: 0, border: 'none', borderRadius: 6, cursor: disabled ? 'default' : 'pointer', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: disabled ? 'rgba(255,255,255,.18)' : teal, transition: 'background .1s' }}
                            onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = 'rgba(0,194,184,.1)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                          >
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">{icon}</svg>
                          </button>
                        ))}

                        <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,.1)', margin: '0 2px' }}/>

                        {/* Move row up / down */}
                        {[
                          { title: 'Move row up', disabled: rowIdx === 0, onClick: () => swapRows(rowIdx, rowIdx - 1), icon: <><path d="M12 19V5"/><path d="M5 12l7-7 7 7"/></> },
                          { title: 'Move row down', disabled: rowIdx === layouts.rows.length - 1, onClick: () => swapRows(rowIdx, rowIdx + 1), icon: <><path d="M12 5v14"/><path d="M5 12l7 7 7-7"/></> },
                        ].map(({ title, disabled, onClick, icon }) => (
                          <button key={title} title={title} disabled={disabled}
                            onClick={e => { e.stopPropagation(); if (!disabled) onClick(); }}
                            style={{ width: 26, height: 26, padding: 0, border: 'none', borderRadius: 6, cursor: disabled ? 'default' : 'pointer', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: disabled ? 'rgba(255,255,255,.18)' : teal, transition: 'background .1s' }}
                            onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = 'rgba(0,194,184,.1)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                          >
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">{icon}</svg>
                          </button>
                        ))}

                        <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,.1)', margin: '0 2px' }}/>

                        {/* Delete */}
                        <button title="Delete widget (Del)" onClick={e => { e.stopPropagation(); editState.onDelete(id); }}
                          style={{ width: 26, height: 26, padding: 0, border: 'none', borderRadius: 6, cursor: 'pointer', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E3170A', transition: 'background .1s' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(227,23,10,.12)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
                        </button>
                      </div>
                    )}

                    {/* Pointer swap highlight */}
                    {isSwap && (
                      <div style={{ position: 'absolute', inset: 0, borderRadius: 12, border: '2px dashed #00C2B8', background: 'rgba(0,194,184,.08)', zIndex: 5, pointerEvents: 'none' }}/>
                    )}

                    {/* Browse mode: left-edge zone (insert before), right-edge zone (insert after), center replace */}
                    {browseDragActive && (
                      <>
                        {/* Insert-before: left 30% */}
                        <div style={{
                          position: 'absolute', top: 0, left: 0, bottom: 0, width: '30%',
                          zIndex: 15, cursor: 'copy', borderRadius: '10px 0 0 10px',
                          background: isBefore ? 'rgba(0,194,184,.14)' : 'transparent',
                          borderLeft: `3px solid ${isBefore ? teal : 'rgba(0,194,184,.22)'}`,
                          transition: 'background .1s, border-color .1s',
                        }}
                          onDragOver={e => { e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = 'copy'; setBrowseDropTarget({ type: 'before', id }); }}
                          onDrop={e => { e.stopPropagation(); handleBetweenDrop(rowIdx, actualIdx, e); }}
                        >
                          {isBefore && <div style={{ position: 'absolute', left: -4, top: '50%', transform: 'translateY(-50%)', width: 8, height: 8, borderRadius: '50%', background: teal }}/>}
                        </div>

                        {/* Insert-after: right 30% */}
                        <div style={{
                          position: 'absolute', top: 0, right: 0, bottom: 0, width: '30%',
                          zIndex: 15, cursor: 'copy', borderRadius: '0 10px 10px 0',
                          background: isAfter ? 'rgba(0,194,184,.14)' : 'transparent',
                          borderRight: `3px solid ${isAfter ? teal : 'rgba(0,194,184,.22)'}`,
                          transition: 'background .1s, border-color .1s',
                        }}
                          onDragOver={e => { e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = 'copy'; setBrowseDropTarget({ type: 'after', id }); }}
                          onDrop={e => { e.stopPropagation(); handleBetweenDrop(rowIdx, actualIdx + 1, e); }}
                        >
                          {isAfter && <div style={{ position: 'absolute', right: -4, top: '50%', transform: 'translateY(-50%)', width: 8, height: 8, borderRadius: '50%', background: teal }}/>}
                        </div>

                        {/* Replace overlay (center) */}
                        {isReplace && (
                          <div style={{ position: 'absolute', inset: 0, borderRadius: 12, zIndex: 5, pointerEvents: 'none', border: '2px dashed #00C2B8', background: 'rgba(0,194,184,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: teal, background: 'rgba(10,18,34,.7)', padding: '2px 8px', borderRadius: 4 }}>Replace</span>
                          </div>
                        )}
                      </>
                    )}

                    {widgetMap[id]}
                  </div>
                );
              })}
            </div>
          </React.Fragment>
        );
      })}

      {/* Bottom zone */}
      {browseDragActive
        ? <RowDropZone
            insertAt={layouts.rows.length}
            active={browseDropTarget?.type === 'row' && browseDropTarget.insertAt === layouts.rows.length}
            onDragOver={e => { e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = 'copy'; }}
            onDragEnter={i => setBrowseDropTarget({ type: 'row', insertAt: i })}
            onDrop={(i, e) => handleNewRowDrop(i, e)}
          />
        : dragId && (
          <div
            onPointerEnter={() => setDropTarget({ type: 'new-row', insertAt: layouts.rows.length })}
            style={{
              height: 40, borderRadius: 6,
              border: `1px dashed ${dropTarget?.type === 'new-row' && dropTarget.insertAt === layouts.rows.length ? teal : 'rgba(255,255,255,.1)'}`,
              background: dropTarget?.type === 'new-row' && dropTarget.insertAt === layouts.rows.length ? 'rgba(0,194,184,.1)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: dropTarget?.type === 'new-row' && dropTarget.insertAt === layouts.rows.length ? teal : 'rgba(255,255,255,.2)' }}>
              + Drop here → new row at bottom
            </span>
          </div>
        )
      }

      {/* Ghost label follows pointer during canvas reorder drag */}
      {dragId && (
        <div style={{
          position: 'fixed', top: ghostPos.y - 16, left: ghostPos.x - 80, pointerEvents: 'none', zIndex: 999,
          width: 160, height: 32, background: 'rgba(10,18,34,.92)', border: '1px solid rgba(0,194,184,.5)',
          borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          boxShadow: '0 8px 32px rgba(0,0,0,.4)',
        }}>
          <svg width="12" height="8" viewBox="0 0 12 8" fill="#00C2B8">
            <rect y="0" width="12" height="2" rx="1"/><rect y="3" width="12" height="2" rx="1"/><rect y="6" width="12" height="2" rx="1"/>
          </svg>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: teal, letterSpacing: '0.06em' }}>
            {WIDGET_DISPLAY_NAMES[dragId] || dragId}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Google Ads Section ────────────────────────────────────────────
function GoogleAdsSection({ p, editState, widgetConfigs }) {
  const { ads, adsPrev, series, channels, campaigns } = p;
  const d    = fmt.pctChange;
  const wcfg = id => widgetConfigs?.[WIDGET_CARD_TYPES[id] || id] || {};
  const kpiScale = FONT_SCALES[wcfg('google-kpi').fontSize] || 1;
  const wn = id => wcfg(id).name || null;

  const TYPE_COLORS = [blue, gold, '#16A34A', '#E3170A', violet];
  const totalSpend = channels.reduce((s, c) => s + c.spend, 0) || 1;
  const donutSegs = channels.slice(0, 5).map((ch, i) => ({
    value: ch.spend, color: TYPE_COLORS[i % TYPE_COLORS.length],
  }));

  const today = new Date().getDate();
  const paceIdx = Math.min(today - 1, (series.spend.length || 1) - 1);

  const safeSpend  = series.spend.length  >= 2 ? series.spend  : [0, 0];
  const safeClicks = series.clicks.length >= 2 ? series.clicks : [0, 0];

  return (
    <Section>
      <SectionHead channel="google" title="Google Ads" subtitle={`${campaigns.length} kampanye · Search, Display, Performance Max`}/>

      <SelectableWidget id="google-kpi" cardId="kpi-strip" editState={editState}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
          <Kpi label="Total Spend"   value={fmt.rupiahShort(ads.spend)}       delta={d(ads.spend, adsPrev.spend)}             accent={gold} spark={safeSpend.slice(-7)} scale={kpiScale}/>
          <Kpi label="Clicks"        value={fmt.num(ads.clicks)}              delta={d(ads.clicks, adsPrev.clicks)}           accent={blue} scale={kpiScale}/>
          <Kpi label="Impressions"   value={fmt.num(ads.impressions)}         delta={d(ads.impressions, adsPrev.impressions)} accent={blue} scale={kpiScale}/>
          <Kpi label="Conversions"   value={fmt.num(ads.conversions)}         delta={d(ads.conversions, adsPrev.conversions)} accent={teal} scale={kpiScale}/>
          <Kpi label="CTR"           value={fmt.pct(ads.ctr)}                 delta={d(ads.ctr, adsPrev.ctr)}                 accent={teal} scale={kpiScale}/>
          <Kpi label="Avg CPC"       value={fmt.rupiahShort(ads.cpc)}         sub="per klik" scale={kpiScale}/>
          <Kpi label="CPA"           value={fmt.rupiahShort(ads.cpa)}         sub="per konversi" scale={kpiScale}/>
          <Kpi label="ROAS"          value={fmt.roas(ads.roas)}               delta={d(ads.roas, adsPrev.roas)}               accent={gold} scale={kpiScale}/>
        </div>
      </SelectableWidget>

      <div style={{ display: 'grid', gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 14, marginBottom: 14 }}>
        <SelectableWidget id="google-spend" cardId="chart-area" editState={editState}>
          <ChartCard title={wn('google-spend') || "Spend Harian"} sub={`Total: ${fmt.rupiahShort(ads.spend)}`}>
            <MiniLine data={safeSpend} w={300} h={72} color={blue} fill id="gads-spend"/>
          </ChartCard>
        </SelectableWidget>

        <SelectableWidget id="google-clicks" cardId="chart-bar" editState={editState}>
          <ChartCard title={wn('google-clicks') || "Click Volume · Pacing"} sub="Bulan ini vs target">
            <MiniBar data={safeClicks} w={300} h={72} color={blue} activeUntil={paceIdx}/>
          </ChartCard>
        </SelectableWidget>

        <SelectableWidget id="google-budget" cardId="chart-donut" editState={editState}>
          <ChartCard title={wn('google-budget') || "Budget per Tipe Kampanye"}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <MiniDonut
                segments={donutSegs.length ? donutSegs : [{ value: 1, color: '#243350' }]}
                size={88} thickness={9}
                centerLabel={String(channels.length)}
                centerSub="types"
              />
              <div style={{ flex: 1 }}>
                {channels.slice(0, 5).map((ch, i) => (
                  <div key={ch.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: TYPE_COLORS[i % TYPE_COLORS.length], flexShrink: 0 }}/>
                      <span style={{ fontFamily: T.mono, fontSize: 9, color: sec }}>{ch.name}</span>
                    </div>
                    <span style={{ fontFamily: T.mono, fontSize: 9, color: muted }}>
                      {((ch.spend / totalSpend) * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </ChartCard>
        </SelectableWidget>
      </div>

      {campaigns.length > 0 && (
        <SelectableWidget id="google-campaigns" cardId="table-campaigns" editState={editState}>
          <DataTable widgetId="google-campaigns" widgetConfig={wcfg('google-campaigns')}
            rows={campaigns} availDims={GOOGLE_TABLE_DIMS} availMetrics={GOOGLE_TABLE_METRICS}
            defaultDims={['name']} defaultMetrics={['spend','clicks','impressions','ctr','cpa']}
            defaultName="Campaigns · Google Ads"/>
        </SelectableWidget>
      )}

      {p.adGroups && p.adGroups.length > 0 && (
        <SelectableWidget id="google-adgroups" cardId="table-campaigns" editState={editState}>
          <DataTable widgetId="google-adgroups" widgetConfig={wcfg('google-adgroups')}
            rows={p.adGroups} availDims={GOOGLE_TABLE_DIMS} availMetrics={GOOGLE_TABLE_METRICS}
            defaultDims={['ad_group','name']} defaultMetrics={['spend','clicks','ctr','cpa']}
            defaultName="Ad Groups · Google Ads"/>
        </SelectableWidget>
      )}

      {p.keywords && p.keywords.length > 0 && (
        <SelectableWidget id="google-keywords" cardId="table-campaigns" editState={editState}>
          <DataTable widgetId="google-keywords" widgetConfig={wcfg('google-keywords')}
            rows={p.keywords} availDims={GOOGLE_TABLE_DIMS} availMetrics={GOOGLE_TABLE_METRICS}
            defaultDims={['keyword']} defaultMetrics={['spend','clicks','ctr','cpa']}
            defaultName="Keywords · Google Ads"/>
        </SelectableWidget>
      )}
    </Section>
  );
}

// ─── Ad Groups table ──────────────────────────────────────────────
function AdGroupsTable({ adGroups }) {
  const [search,  setSearch]  = useState('');
  const [sortKey, setSortKey] = useState('spend');
  const [sortDir, setSortDir] = useState('desc');
  const [show,    setShow]    = useState(false);

  const toggleSort = key => {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const rows = adGroups
    .filter(r => !search || (r.ad_group || '').toLowerCase().includes(search.toLowerCase()) || (r.campaign || '').toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sortDir === 'desc' ? (b[sortKey] || 0) - (a[sortKey] || 0) : (a[sortKey] || 0) - (b[sortKey] || 0))
    .slice(0, 50);

  return (
    <RCard padding={0} style={{ overflow: 'hidden', marginTop: 14 }}>
      <div
        onClick={() => setShow(v => !v)}
        style={{ padding: '12px 18px', borderBottom: show ? '1px solid var(--navy-edge)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
      >
        <div>
          <div style={{ fontFamily: T.display, fontSize: 13, fontWeight: 700, color: fg }}>Ad Groups</div>
          <div style={{ fontFamily: T.body, fontSize: 11, color: muted, marginTop: 2 }}>{adGroups.length} ad groups · klik untuk {show ? 'sembunyikan' : 'tampilkan'}</div>
        </div>
        <svg width="14" height="14" fill="none" stroke={muted} strokeWidth="2" viewBox="0 0 24 24" style={{ transform: show ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}><path d="M6 9l6 6 6-6"/></svg>
      </div>
      {show && (
        <>
          <div style={{ padding: '8px 18px', borderBottom: '1px solid var(--navy-edge)', display: 'flex', gap: 7, alignItems: 'center', background: 'var(--navy-deep)' }}>
            <svg width="11" height="11" fill="none" stroke={muted} strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari ad group / kampanye…"
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: fg, fontFamily: T.body, fontSize: 11.5 }}/>
            {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: muted, cursor: 'pointer', padding: 0, fontSize: 14, lineHeight: 1 }}>×</button>}
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.body, fontSize: 12 }}>
            <thead>
              <tr style={{ background: 'var(--navy-deep)' }}>
                <th style={{ padding: '8px 14px', textAlign: 'left', fontFamily: T.mono, fontSize: 9.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: muted }}>Ad Group</th>
                <th style={{ padding: '8px 14px', textAlign: 'left', fontFamily: T.mono, fontSize: 9.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: muted }}>Kampanye</th>
                <SortTh label="Spend"  sortKey="spend"       active={sortKey==='spend'}       dir={sortDir} onSort={toggleSort}/>
                <SortTh label="Clicks" sortKey="clicks"      active={sortKey==='clicks'}      dir={sortDir} onSort={toggleSort}/>
                <SortTh label="CTR"    sortKey="ctr"         active={sortKey==='ctr'}         dir={sortDir} onSort={toggleSort}/>
                <SortTh label="CVR"    sortKey="cvr"         active={sortKey==='cvr'}         dir={sortDir} onSort={toggleSort}/>
                <SortTh label="CPA"    sortKey="cpa"         active={sortKey==='cpa'}         dir={sortDir} onSort={toggleSort}/>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} style={{ borderTop: '1px solid rgba(51,71,102,.5)' }}>
                  <td style={{ padding: '9px 14px', fontFamily: T.display, fontWeight: 600, color: fg, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.ad_group}</td>
                  <td style={{ padding: '9px 14px', fontFamily: T.body, fontSize: 11, color: muted, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.campaign}</td>
                  <td style={{ padding: '9px 14px', textAlign: 'right', fontFamily: T.mono, color: fg }}>{fmt.rupiahShort(r.spend)}</td>
                  <td style={{ padding: '9px 14px', textAlign: 'right', fontFamily: T.mono, color: sec }}>{fmt.num(r.clicks)}</td>
                  <td style={{ padding: '9px 14px', textAlign: 'right', fontFamily: T.mono, color: r.ctr > 3 ? '#16A34A' : sec }}>{fmt.pct(r.ctr)}</td>
                  <td style={{ padding: '9px 14px', textAlign: 'right', fontFamily: T.mono, color: sec }}>{fmt.pct(r.cvr)}</td>
                  <td style={{ padding: '9px 14px', textAlign: 'right', fontFamily: T.mono, color: sec }}>{fmt.rupiahShort(r.cpa)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </RCard>
  );
}

// ─── Keywords table ────────────────────────────────────────────────
function KeywordsTable({ keywords }) {
  const [search,  setSearch]  = useState('');
  const [sortKey, setSortKey] = useState('spend');
  const [sortDir, setSortDir] = useState('desc');
  const [show,    setShow]    = useState(false);

  const toggleSort = key => {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const rows = keywords
    .filter(r => !search || (r.keyword || '').toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sortDir === 'desc' ? (b[sortKey] || 0) - (a[sortKey] || 0) : (a[sortKey] || 0) - (b[sortKey] || 0))
    .slice(0, 100);

  return (
    <RCard padding={0} style={{ overflow: 'hidden', marginTop: 14 }}>
      <div
        onClick={() => setShow(v => !v)}
        style={{ padding: '12px 18px', borderBottom: show ? '1px solid var(--navy-edge)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
      >
        <div>
          <div style={{ fontFamily: T.display, fontSize: 13, fontWeight: 700, color: fg }}>Keywords</div>
          <div style={{ fontFamily: T.body, fontSize: 11, color: muted, marginTop: 2 }}>{keywords.length} keywords · klik untuk {show ? 'sembunyikan' : 'tampilkan'}</div>
        </div>
        <svg width="14" height="14" fill="none" stroke={muted} strokeWidth="2" viewBox="0 0 24 24" style={{ transform: show ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}><path d="M6 9l6 6 6-6"/></svg>
      </div>
      {show && (
        <>
          <div style={{ padding: '8px 18px', borderBottom: '1px solid var(--navy-edge)', display: 'flex', gap: 7, alignItems: 'center', background: 'var(--navy-deep)' }}>
            <svg width="11" height="11" fill="none" stroke={muted} strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari keyword…"
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: fg, fontFamily: T.body, fontSize: 11.5 }}/>
            {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: muted, cursor: 'pointer', padding: 0, fontSize: 14, lineHeight: 1 }}>×</button>}
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.body, fontSize: 12 }}>
            <thead>
              <tr style={{ background: 'var(--navy-deep)' }}>
                <th style={{ padding: '8px 14px', textAlign: 'left', fontFamily: T.mono, fontSize: 9.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: muted }}>Keyword</th>
                <th style={{ padding: '8px 14px', textAlign: 'left', fontFamily: T.mono, fontSize: 9.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: muted }}>Match</th>
                <SortTh label="Spend"  sortKey="spend"  active={sortKey==='spend'}  dir={sortDir} onSort={toggleSort}/>
                <SortTh label="Clicks" sortKey="clicks" active={sortKey==='clicks'} dir={sortDir} onSort={toggleSort}/>
                <SortTh label="CTR"    sortKey="ctr"    active={sortKey==='ctr'}    dir={sortDir} onSort={toggleSort}/>
                <SortTh label="CVR"    sortKey="cvr"    active={sortKey==='cvr'}    dir={sortDir} onSort={toggleSort}/>
                <SortTh label="CPA"    sortKey="cpa"    active={sortKey==='cpa'}    dir={sortDir} onSort={toggleSort}/>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} style={{ borderTop: '1px solid rgba(51,71,102,.5)' }}>
                  <td style={{ padding: '9px 14px', fontFamily: T.display, fontWeight: 600, color: fg, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.keyword}</td>
                  <td style={{ padding: '9px 14px' }}>{r.match_type && <RChip color={muted}>{r.match_type}</RChip>}</td>
                  <td style={{ padding: '9px 14px', textAlign: 'right', fontFamily: T.mono, color: fg }}>{fmt.rupiahShort(r.spend)}</td>
                  <td style={{ padding: '9px 14px', textAlign: 'right', fontFamily: T.mono, color: sec }}>{fmt.num(r.clicks)}</td>
                  <td style={{ padding: '9px 14px', textAlign: 'right', fontFamily: T.mono, color: r.ctr > 3 ? '#16A34A' : sec }}>{fmt.pct(r.ctr)}</td>
                  <td style={{ padding: '9px 14px', textAlign: 'right', fontFamily: T.mono, color: sec }}>{fmt.pct(r.cvr)}</td>
                  <td style={{ padding: '9px 14px', textAlign: 'right', fontFamily: T.mono, color: sec }}>{fmt.rupiahShort(r.cpa)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </RCard>
  );
}

// ─── Meta Ads Section ──────────────────────────────────────────────
function MetaAdsSection({ p, editState, widgetConfigs }) {
  const ads      = p.meta     || p.ads;
  const adsPrev  = p.metaPrev || p.adsPrev;
  const series   = (p.metaSeries && p.metaSeries.labels && p.metaSeries.labels.length) ? p.metaSeries : p.series;
  const channels = (p.metaChannels && p.metaChannels.length) ? p.metaChannels : p.channels;
  const d = fmt.pctChange;
  const kpiScale = FONT_SCALES[(widgetConfigs?.['kpi-strip'] || {}).fontSize] || 1;
  const wn = id => widgetConfigs?.[WIDGET_CARD_TYPES[id] || id]?.name || null;

  const META_COLORS = ['#0EA5E9', violet, '#F43F5E', gold];
  const totalImpr = channels.reduce((s, c) => s + c.impressions, 0) || 1;
  const donutSegs = channels.slice(0, 4).map((ch, i) => ({
    value: ch.impressions, color: META_COLORS[i % META_COLORS.length],
  }));

  const safeImpr  = series.impressions.length >= 2 ? series.impressions : [0, 0];
  const safeClicks = series.clicks.length >= 2 ? series.clicks : [0, 0];
  const imprScale = safeImpr.map(v => Math.round(v / Math.max(...safeImpr) * Math.max(...safeClicks)));
  const cpm = ads.impressions > 0 ? (ads.spend / ads.impressions) * 1000 : 0;

  return (
    <Section>
      <SectionHead channel="meta" title="Meta Ads" subtitle="Facebook & Instagram · Reach, Traffic, Conversion"/>

      <SelectableWidget id="meta-kpi" cardId="kpi-strip" editState={editState}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
          <Kpi label="Total Spend"   value={fmt.rupiahShort(ads.spend)}       delta={d(ads.spend, adsPrev.spend)}             accent={gold} spark={safeClicks.slice(-7)} scale={kpiScale}/>
          <Kpi label="Reach (Impr.)" value={fmt.num(ads.impressions)}         delta={d(ads.impressions, adsPrev.impressions)} accent={'#0EA5E9'} scale={kpiScale}/>
          <Kpi label="Link Clicks"   value={fmt.num(ads.clicks)}              delta={d(ads.clicks, adsPrev.clicks)}           accent={'#0EA5E9'} scale={kpiScale}/>
          <Kpi label="Conversions"   value={fmt.num(ads.conversions)}         delta={d(ads.conversions, adsPrev.conversions)} accent={teal} scale={kpiScale}/>
          <Kpi label="CPM"           value={fmt.rupiahShort(cpm)}             sub="per 1k impresi" scale={kpiScale}/>
          <Kpi label="CTR"           value={fmt.pct(ads.ctr)}                 delta={d(ads.ctr, adsPrev.ctr)}                 accent={teal} scale={kpiScale}/>
          <Kpi label="CPA"           value={fmt.rupiahShort(ads.cpa)}         sub="per konversi" scale={kpiScale}/>
        </div>
      </SelectableWidget>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,3fr) minmax(0,2fr)', gap: 14 }}>
        <SelectableWidget id="meta-trend" cardId="chart-area" editState={editState}>
          <ChartCard title={wn('meta-trend') || "Reach vs Engagement Trend"}>
            <div style={{ display: 'flex', gap: 16, marginBottom: 10 }}>
              <LegendDot color="#0EA5E9" label="Impressions (scaled)"/>
              <LegendDot color={violet} label="Clicks"/>
            </div>
            <MultiArea
              seriesA={imprScale.length >= 2 ? imprScale : [10, 20]}
              seriesB={safeClicks.length >= 2 ? safeClicks : [5, 10]}
              colorA="#0EA5E9" colorB={violet}
              labelsX={safeImpr.length >= 4 ? ['W1', 'W2', 'W3', 'W4'] : []}
              w={480} h={130}
            />
          </ChartCard>
        </SelectableWidget>

        <SelectableWidget id="meta-donut" cardId="chart-donut" editState={editState}>
          <ChartCard title={wn('meta-donut') || "Impresi per Tipe Iklan"}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <MiniDonut
                segments={donutSegs.length ? donutSegs : [{ value: 1, color: '#243350' }]}
                size={88} thickness={9}
                centerLabel={fmt.num(Math.round(ads.impressions / 1000)) + 'k'}
                centerSub="reach"
              />
              <div style={{ flex: 1 }}>
                {channels.slice(0, 4).map((ch, i) => (
                  <div key={ch.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: META_COLORS[i % META_COLORS.length], flexShrink: 0 }}/>
                      <span style={{ fontFamily: T.mono, fontSize: 9, color: sec }}>{ch.name}</span>
                    </div>
                    <span style={{ fontFamily: T.mono, fontSize: 9, color: muted }}>
                      {((ch.impressions / totalImpr) * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </ChartCard>
        </SelectableWidget>
      </div>
    </Section>
  );
}

// ─── GA4 Analytics Section ────────────────────────────────────────
function GA4Section({ p, editState, widgetConfigs }) {
  const { ga4, ga4Prev, series } = p;
  const d = fmt.pctChange;
  const kpiScale = FONT_SCALES[(widgetConfigs?.['kpi-strip'] || {}).fontSize] || 1;
  const wn = id => widgetConfigs?.[WIDGET_CARD_TYPES[id] || id]?.name || null;

  const rawHeat = series.impressions.length >= 28
    ? series.impressions
    : series.clicks.length >= 7
      ? series.clicks
      : Array.from({ length: 28 }, (_, i) => Math.abs(Math.sin(i * 0.7 + 0.3)) * 100 + 30);

  const heatFlat = rawHeat.slice(0, 28);
  const heatMax  = Math.max(...heatFlat) || 1;
  const heatValues = Array.from({ length: 4 }, (_, r) =>
    Array.from({ length: 7 }, (_, c) => (heatFlat[r * 7 + c] || 0) / heatMax)
  );

  const safeA = series.impressions.length >= 2
    ? series.impressions.map(v => Math.round(v / 25))
    : [ga4.sessions];
  const safeB = series.clicks.length >= 2
    ? series.clicks.map(v => Math.round(v * 1.3))
    : [ga4.users];
  const safeConv = series.conversions.length >= 2 ? series.conversions : [0, 0];

  const pagesPerSession = ga4.sessions > 0 ? (ga4.pageviews / ga4.sessions) : 0;
  const engageRate      = ga4.sessions > 0 ? (ga4.engaged / ga4.sessions) * 100 : 0;
  const safeA7 = safeA.slice(-7);

  return (
    <Section>
      <SectionHead channel="ga4" title="Google Analytics 4" subtitle="Organic, Referral & Direct traffic"/>

      <SelectableWidget id="ga4-kpi" cardId="kpi-strip" editState={editState}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
          <Kpi label="Sessions"          value={fmt.num(ga4.sessions)}  delta={d(ga4.sessions, ga4Prev.sessions)}   accent={gold} spark={safeA7} scale={kpiScale}/>
          <Kpi label="Users"             value={fmt.num(ga4.users)}     delta={d(ga4.users, ga4Prev.users)}         accent={gold} scale={kpiScale}/>
          <Kpi label="Pageviews"         value={fmt.num(ga4.pageviews)} delta={d(ga4.pageviews, ga4Prev.pageviews)} accent={gold} scale={kpiScale}/>
          <Kpi label="Engaged Sessions"  value={fmt.num(ga4.engaged)}   delta={d(ga4.engaged, ga4Prev.engaged)}     accent={teal} scale={kpiScale}/>
          <Kpi label="Bounce Rate"       value={fmt.pct(ga4.bounce_rate)}
            delta={d(ga4.bounce_rate, ga4Prev.bounce_rate) != null ? -d(ga4.bounce_rate, ga4Prev.bounce_rate) : null}
            scale={kpiScale}/>
          <Kpi label="Pages / Session"   value={pagesPerSession.toFixed(1)} sub="rata-rata" scale={kpiScale}/>
          <Kpi label="Engagement Rate"   value={engageRate.toFixed(1) + '%'} sub="dari total sessions" scale={kpiScale}/>
        </div>
      </SelectableWidget>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,3fr) minmax(0,2fr)', gap: 14, marginBottom: 14 }}>
        <SelectableWidget id="ga4-sessions" cardId="chart-area" editState={editState}>
          <ChartCard title={wn('ga4-sessions') || "Sessions vs Users Trend"}>
            <div style={{ display: 'flex', gap: 16, marginBottom: 10 }}>
              <LegendDot color={gold} label="Sessions"/>
              <LegendDot color={teal} label="Users"/>
            </div>
            <MultiArea
              seriesA={safeA.length >= 2 ? safeA : [100, 120]}
              seriesB={safeB.length >= 2 ? safeB : [80, 95]}
              colorA={gold} colorB={teal}
              labelsX={safeA.length >= 4 ? ['W1', 'W2', 'W3', 'W4'] : []}
              w={480} h={130}
            />
          </ChartCard>
        </SelectableWidget>

        <SelectableWidget id="ga4-heatmap" cardId="chart-heatmap" editState={editState}>
          <ChartCard title={wn('ga4-heatmap') || "Traffic Intensity"} sub="4 Minggu × Hari">
            <MiniHeatmap
              rows={4} cols={7}
              values={heatValues}
              labelsRow={['W1', 'W2', 'W3', 'W4']}
              labelsCol={['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']}
              cell={17} color={teal}
            />
          </ChartCard>
        </SelectableWidget>
      </div>

      <SelectableWidget id="ga4-conversion" cardId="chart-bar" editState={editState}>
        <ChartCard title={wn('ga4-conversion') || "Volume Konversi Harian"}>
          <div style={{ fontFamily: T.display, fontSize: 18, fontWeight: 700, color: fg, marginBottom: 8 }}>
            {fmt.num(ga4.engaged)}{' '}
            <span style={{ fontFamily: T.mono, fontSize: 10, color: muted, fontWeight: 400 }}>engaged sessions</span>
          </div>
          <MiniBar data={safeConv.length >= 2 ? safeConv : [1, 2]} w={800} h={56} color={teal} gap={3}/>
        </ChartCard>
      </SelectableWidget>
    </Section>
  );
}

// ─── Queries table with search + sort ────────────────────────────
function QueriesTable({ queries }) {
  const [search,  setSearch]  = useState('');
  const [sortKey, setSortKey] = useState('clicks');
  const [sortDir, setSortDir] = useState('desc');

  const toggleSort = key => {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const rows = queries
    .filter(q => !search || (q.query || '').toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sortDir === 'desc' ? (b[sortKey] || 0) - (a[sortKey] || 0) : (a[sortKey] || 0) - (b[sortKey] || 0));

  return (
    <RCard padding={0} style={{ overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--navy-edge)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div>
          <div style={{ fontFamily: T.display, fontSize: 13, fontWeight: 700, color: fg }}>Top Queries · Organic</div>
          <div style={{ fontFamily: T.body, fontSize: 11, color: muted, marginTop: 2 }}>{rows.length} kata kunci</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 10px', background: 'var(--navy-elevated)', border: '1px solid var(--navy-edge)', borderRadius: 7, minWidth: 180 }}>
          <svg width="11" height="11" fill="none" stroke={muted} strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari query…"
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: fg, fontFamily: T.body, fontSize: 11.5 }}/>
          {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: muted, cursor: 'pointer', padding: 0, fontSize: 14, lineHeight: 1 }}>×</button>}
        </div>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.body, fontSize: 12 }}>
        <thead>
          <tr style={{ background: 'var(--navy-deep)' }}>
            <th style={{ padding: '8px 14px', textAlign: 'left', fontFamily: T.mono, fontSize: 9.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: muted }}>Query</th>
            <SortTh label="Posisi"  sortKey="position"    active={sortKey==='position'}    dir={sortDir} onSort={toggleSort}/>
            <SortTh label="Impresi" sortKey="impressions"  active={sortKey==='impressions'}  dir={sortDir} onSort={toggleSort}/>
            <SortTh label="Klik"    sortKey="clicks"       active={sortKey==='clicks'}       dir={sortDir} onSort={toggleSort}/>
            <SortTh label="CTR"     sortKey="ctr"          active={sortKey==='ctr'}          dir={sortDir} onSort={toggleSort}/>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={5} style={{ padding: '20px', textAlign: 'center', fontFamily: T.mono, fontSize: 10, color: muted }}>Tidak ada hasil</td></tr>}
          {rows.map((kw, i) => {
            const pc = kw.position;
            const pc_color = pc <= 3 ? '#16A34A' : pc <= 7 ? gold : '#E3170A';
            return (
              <tr key={i} style={{ borderTop: '1px solid rgba(51,71,102,.5)' }}>
                <td style={{ padding: '10px 14px', fontFamily: T.body, fontSize: 11, color: fg, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{kw.query}</td>
                <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: T.mono, fontSize: 10 }}><span style={{ color: pc_color, fontWeight: 700 }}>#{pc.toFixed(1)}</span></td>
                <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: T.mono, fontSize: 10, color: sec }}>{fmt.num(kw.impressions)}</td>
                <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: T.mono, fontSize: 10, color: fg }}>{fmt.num(kw.clicks)}</td>
                <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: T.mono, fontSize: 10, color: teal }}>{kw.ctr.toFixed(2)}%</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </RCard>
  );
}

// ─── Top Pages table ──────────────────────────────────────────────
function PagesTable({ pages }) {
  const [search,  setSearch]  = useState('');
  const [sortKey, setSortKey] = useState('clicks');
  const [sortDir, setSortDir] = useState('desc');

  const toggleSort = key => {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const rows = pages
    .filter(pg => !search || (pg.page || '').toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sortDir === 'desc' ? (b[sortKey] || 0) - (a[sortKey] || 0) : (a[sortKey] || 0) - (b[sortKey] || 0));

  const shortUrl = url => {
    try { return new URL(url.startsWith('http') ? url : 'https://' + url).pathname || url; }
    catch { return url; }
  };

  return (
    <RCard padding={0} style={{ overflow: 'hidden', marginTop: 14 }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--navy-edge)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div>
          <div style={{ fontFamily: T.display, fontSize: 13, fontWeight: 700, color: fg }}>Top Pages · Organic</div>
          <div style={{ fontFamily: T.body, fontSize: 11, color: muted, marginTop: 2 }}>{rows.length} halaman teratas</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 10px', background: 'var(--navy-elevated)', border: '1px solid var(--navy-edge)', borderRadius: 7, minWidth: 180 }}>
          <svg width="11" height="11" fill="none" stroke={muted} strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari URL…"
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: fg, fontFamily: T.body, fontSize: 11.5 }}/>
          {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: muted, cursor: 'pointer', padding: 0, fontSize: 14, lineHeight: 1 }}>×</button>}
        </div>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.body, fontSize: 12 }}>
        <thead>
          <tr style={{ background: 'var(--navy-deep)' }}>
            <th style={{ padding: '8px 14px', textAlign: 'left', fontFamily: T.mono, fontSize: 9.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: muted }}>URL</th>
            <SortTh label="Posisi"  sortKey="position"   active={sortKey==='position'}   dir={sortDir} onSort={toggleSort}/>
            <SortTh label="Impresi" sortKey="impressions" active={sortKey==='impressions'} dir={sortDir} onSort={toggleSort}/>
            <SortTh label="Klik"    sortKey="clicks"      active={sortKey==='clicks'}      dir={sortDir} onSort={toggleSort}/>
            <SortTh label="CTR"     sortKey="ctr"         active={sortKey==='ctr'}         dir={sortDir} onSort={toggleSort}/>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={5} style={{ padding: '20px', textAlign: 'center', fontFamily: T.mono, fontSize: 10, color: muted }}>Tidak ada hasil</td></tr>}
          {rows.map((pg, i) => {
            const pc = pg.position || 0;
            const pc_color = pc <= 3 ? '#16A34A' : pc <= 7 ? gold : '#E3170A';
            return (
              <tr key={i} style={{ borderTop: '1px solid rgba(51,71,102,.5)' }}>
                <td style={{ padding: '10px 14px', fontFamily: T.mono, fontSize: 10, color: teal, maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={pg.page}>{shortUrl(pg.page)}</td>
                <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: T.mono, fontSize: 10 }}><span style={{ color: pc_color, fontWeight: 700 }}>#{pc.toFixed(1)}</span></td>
                <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: T.mono, fontSize: 10, color: sec }}>{fmt.num(pg.impressions)}</td>
                <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: T.mono, fontSize: 10, color: fg }}>{fmt.num(pg.clicks)}</td>
                <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: T.mono, fontSize: 10, color: teal }}>{(pg.ctr || 0).toFixed(2)}%</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </RCard>
  );
}

// ─── Search Console Section ────────────────────────────────────────
function SearchSection({ p, editState, widgetConfigs }) {
  const gsc = p.gsc;

  // No GSC data yet for this period
  if (!gsc) {
    return (
      <Section>
        <SectionHead channel="search" title="Search Console" subtitle="Organic impressions, clicks & ranking"/>
        <RCard padding={20}>
          <div style={{ fontFamily: T.mono, fontSize: 10, color: muted, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
            Belum ada data Search Console untuk periode ini
          </div>
          <div style={{ fontFamily: T.body, fontSize: 12, color: sec, marginTop: 6 }}>
            Pastikan property sudah terhubung dan data sudah disinkronisasi ke tabel <strong style={{ color: fg }}>search_console</strong>.
          </div>
        </RCard>
      </Section>
    );
  }

  const { impressions, clicks, ctr, position, queries, series } = gsc;
  const posColor = position <= 3 ? '#16A34A' : position <= 7 ? gold : '#E3170A';
  const posLabel = position <= 3 ? 'Excellent · Top 3' : position <= 7 ? 'Good · Page 1' : 'Perlu Optimasi';

  const safeCtr    = series.clicks.length >= 2
    ? series.clicks.map((v, i) => {
        const im = series.impressions[i] || 1;
        return parseFloat(((v / im) * 100).toFixed(2));
      })
    : [ctr];

  const safeClicks = series.clicks.length >= 2 ? series.clicks : [clicks];
  const safeImpr   = series.impressions.length >= 2 ? series.impressions : [impressions];

  const gscPrev = p.gscPrev;
  const d    = fmt.pctChange;
  const wcfg = id => widgetConfigs?.[WIDGET_CARD_TYPES[id] || id] || {};
  const kpiScale = FONT_SCALES[wcfg('search-kpi').fontSize] || 1;
  const wn = id => wcfg(id).name || null;

  return (
    <Section>
      <SectionHead channel="search" title="Search Console" subtitle="Organic impressions, clicks & ranking"/>

      <SelectableWidget id="search-kpi" cardId="kpi-strip" editState={editState}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
          <Kpi label="Total Impressions" value={fmt.num(impressions)}
            delta={gscPrev ? d(impressions, gscPrev.impressions) : null} accent={blue} scale={kpiScale}/>
          <Kpi label="Organic Clicks"    value={fmt.num(clicks)}
            delta={gscPrev ? d(clicks, gscPrev.clicks) : null} accent={teal} scale={kpiScale}/>
          <Kpi label="Avg CTR"           value={ctr.toFixed(2) + '%'}
            delta={gscPrev ? d(ctr, gscPrev.ctr) : null} accent={teal} scale={kpiScale}/>
          <Kpi label="Avg Position"      value={'#' + position.toFixed(1)} sub={posLabel} accent={posColor} scale={kpiScale}/>
        </div>
      </SelectableWidget>

      <div style={{ display: 'grid', gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 14, marginBottom: 14 }}>
        <SelectableWidget id="search-position" cardId="chart-donut" editState={editState}>
          <ChartCard style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Eyebrow>Rata-rata Posisi</Eyebrow>
            <Ring value={parseFloat(Math.min(position, 10).toFixed(1))} max={10} size={96} thickness={8} color={posColor} label="AVG POS"/>
            <div style={{ fontFamily: T.mono, fontSize: 9, color: posColor, textAlign: 'center' }}>{posLabel}</div>
          </ChartCard>
        </SelectableWidget>

        <SelectableWidget id="search-ctr" cardId="chart-area" editState={editState}>
          <ChartCard title={wn('search-ctr') || "CTR Organik Harian"}>
            <div style={{ fontFamily: T.display, fontSize: 20, fontWeight: 700, color: fg, marginBottom: 8 }}>
              {ctr.toFixed(2)}%
              <span style={{ fontFamily: T.mono, fontSize: 10, color: muted, fontWeight: 400, marginLeft: 6 }}>avg CTR</span>
            </div>
            <MiniLine data={safeCtr.length >= 2 ? safeCtr : [ctr, ctr]} w={260} h={66} color={blue} fill id="sc-ctr"/>
          </ChartCard>
        </SelectableWidget>

        <SelectableWidget id="search-clicks" cardId="chart-bar" editState={editState}>
          <ChartCard title={wn('search-clicks') || "Organic Clicks Harian"}>
            <div style={{ fontFamily: T.display, fontSize: 20, fontWeight: 700, color: fg, marginBottom: 8 }}>
              {fmt.num(clicks)}
            </div>
            <MiniBar data={safeClicks.length >= 2 ? safeClicks : [clicks, clicks]} w={260} h={66} color={blue}/>
          </ChartCard>
        </SelectableWidget>
      </div>

      {queries && queries.length > 0 && (
        <SelectableWidget id="search-queries" cardId="table-rankings" editState={editState}>
          <DataTable widgetId="search-queries" widgetConfig={wcfg('search-queries')}
            rows={queries} availDims={SEARCH_TABLE_DIMS} availMetrics={SEARCH_TABLE_METRICS}
            defaultDims={['query']} defaultMetrics={['impressions','clicks','ctr','position']}
            defaultName="Top Queries · Search Console"/>
        </SelectableWidget>
      )}

      {gsc.pages && gsc.pages.length > 0 && (
        <SelectableWidget id="search-pages" cardId="table-rankings" editState={editState}>
          <DataTable widgetId="search-pages" widgetConfig={wcfg('search-pages')}
            rows={gsc.pages} availDims={SEARCH_TABLE_DIMS} availMetrics={SEARCH_TABLE_METRICS}
            defaultDims={['page']} defaultMetrics={['impressions','clicks','ctr','position']}
            defaultName="Top Pages · Search Console"/>
        </SelectableWidget>
      )}
    </Section>
  );
}

// ─── PageSpeed Section ─────────────────────────────────────────────
// psi  = aggregated PSI data from Supabase (may be null if no history)
// psiUrl = URL being tracked (for live measurement trigger)
function PageSpeedSection({ psi, psiUrl }) {
  const [liveData,     setLiveData]     = useState(null);
  const [measuring,    setMeasuring]    = useState(false);
  const [measureError, setMeasureError] = useState(null);
  const [retryIn,      setRetryIn]      = useState(0); // countdown seconds after 429

  const effectivePsi = liveData || psi;

  // Countdown tick when rate-limited
  useEffect(() => {
    if (retryIn <= 0) return;
    const t = setTimeout(() => {
      setRetryIn(s => {
        if (s <= 1) { runLiveMeasurement(); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearTimeout(t);
  }, [retryIn]);

  // Normalize: safety net in case DB stores 0-1 (Lighthouse format)
  const ns = v => {
    const n = +(v) || 0;
    return n > 0 && n <= 1 ? Math.round(n * 100) : Math.round(n);
  };

  async function runLiveMeasurement() {
    if (!psiUrl || measuring) return;
    setMeasuring(true);
    setMeasureError(null);
    setRetryIn(0);
    try {
      const apiEndpoint = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed'
        + '?url=' + encodeURIComponent(psiUrl)
        + '&strategy=mobile'
        + '&fields=lighthouseResult.categories';
      const resp = await fetch(apiEndpoint);
      if (resp.status === 429) {
        // Google PSI rate-limits to ~25 req/100 s; wait 65 s then auto-retry
        setMeasuring(false);
        setRetryIn(65);
        setMeasureError('rate_limited');
        return;
      }
      if (!resp.ok) throw new Error('HTTP ' + resp.status + ' dari Google API. Coba lagi beberapa saat.');
      const json = await resp.json();
      const cats = json.lighthouseResult && json.lighthouseResult.categories;
      if (!cats) throw new Error('Tidak ada data kategori dalam respons PSI.');
      setLiveData({
        performance:    Math.round((cats.performance    && cats.performance.score    || 0) * 100),
        seo:            Math.round((cats.seo            && cats.seo.score            || 0) * 100),
        accessibility:  Math.round((cats.accessibility  && cats.accessibility.score  || 0) * 100),
        best_practices: Math.round((cats['best-practices'] && cats['best-practices'].score || 0) * 100),
        latestDay: new Date().toISOString().slice(0, 10),
        recordCount: 1, history: [], _isLive: true,
      });
    } catch (e) {
      setMeasureError(e.message || 'Gagal menjalankan pengukuran.');
    } finally {
      setMeasuring(false);
    }
  }

  // ── Empty / no-data state ─────────────────────────────────────────
  if (!effectivePsi) {
    return (
      <Section>
        <SectionHead title="PageSpeed Insights" subtitle="Core Web Vitals · Mobile · Lighthouse"/>
        <RCard padding={24}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={{ fontFamily: T.mono, fontSize: 10, color: muted, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>
                Belum ada data pengukuran tersimpan
              </div>
              {psiUrl && (
                <div style={{ fontFamily: T.body, fontSize: 11.5, color: sec }}>
                  URL: <span style={{ color: fg, fontFamily: T.mono, fontSize: 10 }}>{psiUrl}</span>
                </div>
              )}
              {!psiUrl && (
                <div style={{ fontFamily: T.body, fontSize: 11.5, color: sec }}>
                  Hubungkan URL di Configure untuk memulai.
                </div>
              )}
            </div>

            {psiUrl && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <button
                  onClick={runLiveMeasurement}
                  disabled={measuring}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '9px 18px',
                    background: measuring ? 'rgba(0,194,184,.15)' : 'linear-gradient(135deg,#00C2B8,#009E96)',
                    border: measuring ? '1px solid rgba(0,194,184,.3)' : 'none',
                    borderRadius: 8, cursor: measuring ? 'not-allowed' : 'pointer',
                    color: measuring ? teal : '#0C182C',
                    fontFamily: T.display, fontSize: 12, fontWeight: 700,
                    boxShadow: measuring ? 'none' : '0 4px 14px rgba(0,194,184,.25)',
                    transition: 'all .2s',
                  }}
                >
                  {measuring
                    ? <>
                        <span style={{ width: 12, height: 12, border: '2px solid rgba(0,194,184,.3)', borderTopColor: teal, borderRadius: '50%', display: 'inline-block', animation: 'bootPulse 0.8s linear infinite' }}/>
                        Mengukur halaman…
                      </>
                    : <>
                        <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.3" viewBox="0 0 24 24" strokeLinecap="round">
                          <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                        </svg>
                        Jalankan Pengukuran Sekarang
                      </>
                  }
                </button>
                {measuring && (
                  <div style={{ fontFamily: T.mono, fontSize: 9.5, color: muted }}>
                    Menghubungi Google PageSpeed API… (~10–30 detik)
                  </div>
                )}
              </div>
            )}

            {measureError === 'rate_limited' ? (
              <div style={{
                fontFamily: T.mono, fontSize: 10, color: '#F8B400',
                background: 'rgba(248,180,0,.08)', border: '1px solid rgba(248,180,0,.25)',
                borderRadius: 6, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <svg width="13" height="13" fill="none" stroke="#F8B400" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                </svg>
                <span>
                  Google PSI membatasi permintaan.{' '}
                  {retryIn > 0
                    ? <>Mencoba ulang otomatis dalam <strong style={{ color: fg }}>{retryIn}s</strong>…</>
                    : 'Mencoba ulang…'
                  }
                </span>
              </div>
            ) : measureError ? (
              <div style={{
                fontFamily: T.mono, fontSize: 10, color: '#E3170A',
                background: 'rgba(227,23,10,.08)', border: '1px solid rgba(227,23,10,.2)',
                borderRadius: 6, padding: '8px 12px',
              }}>
                {measureError}
              </div>
            ) : null}
          </div>
        </RCard>
      </Section>
    );
  }

  // ── Full data display ─────────────────────────────────────────────
  const scores = [
    { key: 'performance',    label: 'Performance',    value: ns(effectivePsi.performance)    },
    { key: 'seo',            label: 'SEO',            value: ns(effectivePsi.seo)            },
    { key: 'accessibility',  label: 'Accessibility',  value: ns(effectivePsi.accessibility)  },
    { key: 'best_practices', label: 'Best Practices', value: ns(effectivePsi.best_practices) },
  ];

  const overall = Math.round(scores.reduce((s, sc) => s + sc.value, 0) / scores.length);

  const hist = effectivePsi.history && effectivePsi.history.length >= 2 ? effectivePsi.history : null;
  const heatRows = hist ? Math.min(hist.length, 4) : 4;
  const heatValues = hist
    ? Array.from({ length: heatRows }, (_, r) => scores.map(sc => {
        const row = hist[Math.floor(r * hist.length / heatRows)];
        const v = row ? ns(row[sc.key] !== undefined ? row[sc.key] : (row.performance || 0)) : sc.value;
        return v / 100;
      }))
    : [
        scores.map(s => Math.max(0, (s.value - 20) / 80)),
        scores.map(s => Math.max(0, (s.value - 5)  / 80)),
        scores.map(s => Math.max(0, (s.value - 10) / 80)),
        scores.map(s => s.value / 100),
      ];

  const perfSpark = hist ? hist.map(h => ns(h.performance) || 0) : [];

  const latestLabel = effectivePsi.latestDay
    ? new Date(effectivePsi.latestDay + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  return (
    <Section>
      <SectionHead title="PageSpeed Insights" subtitle="Core Web Vitals · Mobile · Lighthouse"/>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        {latestLabel && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontFamily: T.mono, fontSize: 9, color: muted,
            background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)',
            borderRadius: 5, padding: '4px 10px',
          }}>
            <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
            </svg>
            {effectivePsi._isLive ? 'Diukur sekarang' : 'Snapshot terbaru'}: {latestLabel}
            {!effectivePsi._isLive && effectivePsi.recordCount > 1 && ` · ${effectivePsi.recordCount} pengukuran`}
          </div>
        )}
        {effectivePsi._isLive && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            fontFamily: T.mono, fontSize: 9, color: teal,
            background: 'rgba(0,194,184,.08)', border: '1px solid rgba(0,194,184,.2)',
            borderRadius: 5, padding: '4px 10px',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: teal, display: 'inline-block' }}/>
            Live Measurement
          </div>
        )}
        {psiUrl && !measuring && retryIn <= 0 && (
          <button onClick={runLiveMeasurement} style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '4px 10px', borderRadius: 5, cursor: 'pointer',
            background: 'transparent', border: '1px solid rgba(255,255,255,.1)',
            color: muted, fontFamily: T.mono, fontSize: 9,
            transition: 'border-color .15s, color .15s',
          }}>
            <svg width="9" height="9" fill="none" stroke="currentColor" strokeWidth="2.3" viewBox="0 0 24 24" strokeLinecap="round"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            Ukur Ulang
          </button>
        )}
        {measureError === 'rate_limited' && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: T.mono, fontSize: 9, color: '#F8B400', background: 'rgba(248,180,0,.08)', border: '1px solid rgba(248,180,0,.25)', borderRadius: 5, padding: '4px 10px' }}>
            <svg width="10" height="10" fill="none" stroke="#F8B400" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            {retryIn > 0 ? `Retry dalam ${retryIn}s…` : 'Mencoba ulang…'}
          </div>
        )}
        {measureError && measureError !== 'rate_limited' && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: T.mono, fontSize: 9, color: '#E3170A', background: 'rgba(227,23,10,.08)', border: '1px solid rgba(227,23,10,.2)', borderRadius: 5, padding: '4px 10px' }}>
            {measureError}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr', gap: 14, alignItems: 'start' }}>
        <ChartCard style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <Eyebrow>Overall Score</Eyebrow>
          <Ring value={overall} max={100} size={108} thickness={9} color={scoreColor(overall)} label="SCORE"/>
          <div style={{ fontFamily: T.mono, fontSize: 9, color: scoreColor(overall) }}>
            {overall >= 90 ? 'Excellent' : overall >= 50 ? 'Needs Improvement' : 'Poor'}
          </div>
          {perfSpark.length >= 2 && (
            <div style={{ width: '100%', paddingTop: 8, borderTop: '1px solid rgba(255,255,255,.06)' }}>
              <div style={{ fontFamily: T.mono, fontSize: 8, color: muted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Tren Performance</div>
              <MiniLine data={perfSpark} w={120} h={32} color={scoreColor(effectivePsi.performance)} fill id="psi-perf-spark"/>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Skor per Kategori">
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'space-around', paddingTop: 8 }}>
            {scores.map(sc => (
              <div key={sc.key} style={{ textAlign: 'center' }}>
                <Ring value={sc.value} max={100} size={80} thickness={7} color={scoreColor(sc.value)}/>
                <div style={{ fontFamily: T.mono, fontSize: 8, color: muted, marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{sc.label}</div>
                <div style={{ fontFamily: T.display, fontSize: 13, fontWeight: 700, color: scoreColor(sc.value), marginTop: 2 }}>{sc.value}</div>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Score Consistency" sub={hist ? `${heatRows} snapshot terakhir` : (effectivePsi._isLive ? 'Live measurement' : 'Estimasi dari skor saat ini')}>
          <MiniHeatmap
            rows={heatRows} cols={4}
            values={heatValues}
            labelsRow={hist
              ? hist.slice(0, heatRows).map((h, i) => h.day ? h.day.slice(5) : ('S' + (i + 1)))
              : ['', '', '', '']}
            labelsCol={['Perf', 'SEO', 'A11y', 'BP']}
            cell={22} color={teal}
          />
        </ChartCard>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
        {[
          { range: '90–100', label: 'Fast',              color: '#16A34A' },
          { range: '50–89',  label: 'Needs Improvement', color: gold },
          { range: '0–49',   label: 'Slow',              color: '#E3170A' },
        ].map(item => (
          <div key={item.range} style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: T.mono, fontSize: 9, color: muted }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: item.color }}/>
            <span style={{ color: item.color, fontWeight: 600 }}>{item.range}</span>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ─── Section divider ──────────────────────────────────────────────
function SectionDivider() {
  return <div style={{ height: 1, background: 'rgba(255,255,255,.05)', margin: '0 0 32px' }}/>;
}

// ─── First-time setup empty state ─────────────────────────────────
const SOURCE_DEFS = [
  { id: 'google',     channel: 'google',  label: 'Google Ads',           desc: 'Spend, clicks, impressions, conversions, ROAS', color: blue },
  { id: 'meta',       channel: 'meta',    label: 'Meta Ads',             desc: 'Facebook & Instagram — reach, engagement, CPA',  color: '#0EA5E9' },
  { id: 'ga4',        channel: 'ga4',     label: 'Google Analytics 4',   desc: 'Sessions, users, bounce rate, traffic channels', color: gold },
  { id: 'search',     channel: 'search',  label: 'Search Console',       desc: 'Organic impressions, keyword rankings, CTR',     color: '#16A34A' },
  { id: 'pagespeed',  channel: null,      label: 'PageSpeed Insights',   desc: 'Performance, SEO, Accessibility, Best Practices', color: teal },
];

function FirstTimeEmptyState({ client, onBack }) {
  return (
    <div style={{ maxWidth: 680, margin: '0 auto', paddingTop: 8 }}>
      <div style={{
        background: 'rgba(0,194,184,.06)', border: '1px solid rgba(0,194,184,.18)',
        borderRadius: 16, padding: '28px 32px', marginBottom: 24,
        display: 'flex', alignItems: 'center', gap: 24,
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: client.avatarGrad || 'linear-gradient(135deg,#00C2B8,#7000FF)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: T.display, fontWeight: 800, fontSize: 18, color: '#fff', flexShrink: 0,
        }}>{client.initials || '?'}</div>
        <div>
          <div style={{ fontFamily: T.display, fontSize: 18, fontWeight: 800, color: fg, letterSpacing: '-0.02em', marginBottom: 4 }}>
            Report pertama untuk {client.name}
          </div>
          <div style={{ fontFamily: T.body, fontSize: 12.5, color: sec, lineHeight: 1.6 }}>
            Belum ada data source yang terhubung. Hubungkan minimal satu sumber data untuk generate report secara otomatis.
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        {[['1','Pilih & Hubungkan Data'],['2','Lihat Report Otomatis']].map(([n, label], i) => (
          <React.Fragment key={n}>
            {i > 0 && <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.08)' }}/>}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%',
                background: i === 0 ? teal : 'rgba(255,255,255,.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: T.mono, fontSize: 10, fontWeight: 700,
                color: i === 0 ? '#0C182C' : muted,
              }}>{n}</div>
              <span style={{ fontFamily: T.mono, fontSize: 9, color: i === 0 ? fg : muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</span>
            </div>
          </React.Fragment>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
        {SOURCE_DEFS.map(src => (
          <div key={src.id} style={{
            background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)',
            borderRadius: 12, padding: '16px 18px',
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 9, flexShrink: 0,
              background: src.color + '18', border: '1px solid ' + src.color + '30',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {src.channel
                ? <ChannelLogo channel={src.channel} size={20}/>
                : <svg width="18" height="18" fill="none" stroke={src.color} strokeWidth="1.8" viewBox="0 0 24 24" strokeLinecap="round"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
              }
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: T.display, fontSize: 12, fontWeight: 700, color: fg, marginBottom: 3 }}>{src.label}</div>
              <div style={{ fontFamily: T.mono, fontSize: 8.5, color: muted, lineHeight: 1.5, letterSpacing: '0.05em' }}>{src.desc}</div>
            </div>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,255,255,.12)', flexShrink: 0 }}/>
          </div>
        ))}
      </div>

      <div style={{
        background: 'rgba(255,255,255,.03)', border: '1px dashed rgba(255,255,255,.1)',
        borderRadius: 12, padding: '18px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
      }}>
        <div>
          <div style={{ fontFamily: T.display, fontSize: 13, fontWeight: 700, color: fg, marginBottom: 4 }}>
            Hubungkan data source sekarang
          </div>
          <div style={{ fontFamily: T.body, fontSize: 11.5, color: muted, lineHeight: 1.5 }}>
            Kembali ke Home → klik <strong style={{ color: gold }}>Configure</strong> di baris project ini,
            lalu klik <strong style={{ color: teal }}>Simpan & Buka Report</strong>.
          </div>
        </div>
        <button onClick={onBack} style={{
          padding: '10px 20px', background: 'linear-gradient(135deg,#00C2B8,#009E96)',
          border: 'none', borderRadius: 9, color: '#0C182C',
          fontFamily: T.display, fontSize: 12, fontWeight: 700,
          cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap',
          boxShadow: '0 4px 14px rgba(0,194,184,.25)',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.3" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Atur di Home
        </button>
      </div>
    </div>
  );
}

// ─── Present Mode Overlay ──────────────────────────────────────────
function PresentMode({ client, p, isMock, onExit }) {
  const [slide, setSlide] = useState(0);

  const connected = client.connected || {};
  const sources = [
    connected.google && 'google',
    connected.meta && 'meta',
    connected.ga4 && 'ga4',
    connected.search && 'search',
  ].filter(Boolean);

  // Build slides from available data
  const slides = useMemo(() => {
    const out = [{ id: 'summary', title: 'Executive Summary' }];
    if (connected.google) out.push({ id: 'google', title: 'Google Ads' });
    if (connected.meta)   out.push({ id: 'meta',   title: 'Meta Ads' });
    if (connected.ga4)    out.push({ id: 'ga4',    title: 'GA4 Analytics' });
    if (connected.search) out.push({ id: 'search', title: 'Search Console' });
    if (connected.pagespeed) out.push({ id: 'psi', title: 'PageSpeed' });
    return out;
  }, [connected, p]);

  const total = slides.length;
  const cur   = slides[slide] || slides[0];

  const prev = () => setSlide(i => Math.max(0, i - 1));
  const next = () => setSlide(i => Math.min(total - 1, i + 1));

  useEffect(() => {
    const onKey = e => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next();
      if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   prev();
      if (e.key === 'Escape') onExit();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [slide, total]);

  const KpiCard = ({ accent: acc, label, value, delta, deltaUp, comparison, progress, progressLabel }) => (
    <div style={{
      background: 'var(--navy-surface)', border: '1px solid var(--navy-edge)',
      borderRadius: 14, padding: '18px 20px 16px', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: acc }}/>
      <div style={{ fontFamily: T.mono, fontSize: 10, color: muted, textTransform: 'uppercase', letterSpacing: '.1em', fontWeight: 600, marginBottom: 10 }}>{label}</div>
      <div style={{ fontFamily: T.display, fontSize: 30, fontWeight: 800, color: fg, letterSpacing: '-.025em', lineHeight: 1, marginBottom: 12, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: deltaUp ? '#16A34A' : '#DC2626', fontFamily: T.mono, fontSize: 11, fontWeight: 600 }}>
            {deltaUp ? '↑' : '↓'} {delta}
          </span>
          <span style={{ fontFamily: T.body, fontSize: 10, color: muted }}>{comparison}</span>
        </div>
        {progress != null && (
          <>
            <div style={{ height: 3, background: 'var(--navy-deep)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ width: `${progress}%`, height: '100%', background: acc }}/>
            </div>
            <div style={{ fontFamily: T.mono, fontSize: 9.5, color: muted, textAlign: 'right' }}>{progressLabel}</div>
          </>
        )}
      </div>
    </div>
  );

  const { ads, adsPrev, ga4, ga4Prev } = p;
  const d = fmt.pctChange;

  const renderSlide = () => {
    if (cur.id === 'summary') {
      const spendDelta = d(ads.spend, adsPrev.spend);
      const convDelta  = d(ads.conversions, adsPrev.conversions);
      const roasDelta  = d(ads.roas, adsPrev.roas);
      const sessDelta  = d(ga4.sessions, ga4Prev.sessions);
      return (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <span style={{ fontFamily: T.mono, fontSize: 10, color: teal, background: 'rgba(0,194,184,.1)', padding: '3px 10px', borderRadius: 4, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 600 }}>01 Executive Summary</span>
            <span style={{ fontFamily: T.mono, fontSize: 10, color: muted, textTransform: 'uppercase', letterSpacing: '.12em', fontWeight: 600 }}>Periode · {p.labelLong}</span>
            {sources.length > 0 && (
              <span style={{ marginLeft: 'auto', fontFamily: T.mono, fontSize: 10, color: teal, background: 'rgba(0,194,184,.1)', border: '1px solid rgba(0,194,184,.3)', padding: '3px 9px', borderRadius: 5 }}>
                {sources.length} sources live
              </span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
            <KpiCard acc={teal} label="Total Spend" value={fmt.rupiahShort(ads.spend)}
              delta={spendDelta != null ? Math.abs(spendDelta).toFixed(1) + '%' : '—'}
              deltaUp={spendDelta == null ? true : spendDelta >= 0} comparison={`vs ${p.prevKey || 'prev'}`}/>
            <KpiCard acc={gold} label="Conversions" value={fmt.num(ads.conversions)}
              delta={convDelta != null ? Math.abs(convDelta).toFixed(1) + '%' : '—'}
              deltaUp={convDelta == null ? true : convDelta >= 0} comparison={`vs ${p.prevKey || 'prev'}`}/>
            <KpiCard acc={violet} label="ROAS" value={fmt.roas(ads.roas)}
              delta={roasDelta != null ? Math.abs(roasDelta).toFixed(1) + '%' : '—'}
              deltaUp={roasDelta == null ? true : roasDelta >= 0} comparison={`vs ${p.prevKey || 'prev'}`}/>
            <KpiCard acc="#0EA5E9" label="Organic Sessions" value={fmt.num(ga4.sessions)}
              delta={sessDelta != null ? Math.abs(sessDelta).toFixed(1) + '%' : '—'}
              deltaUp={sessDelta == null ? true : sessDelta >= 0} comparison="GA4"/>
          </div>

          <div style={{ background: 'var(--navy-surface)', border: '1px solid var(--navy-edge)', borderRadius: 14, padding: '24px 28px' }}>
            <div style={{ fontFamily: T.mono, fontSize: 10, color: teal, textTransform: 'uppercase', letterSpacing: '.12em', fontWeight: 700, marginBottom: 12 }}>Analyst Note</div>
            <div style={{ fontFamily: T.display, fontSize: 20, fontWeight: 700, color: fg, lineHeight: 1.35, letterSpacing: '-.01em', marginBottom: 12 }}>
              {client.name} · {p.labelShort}
            </div>
            <div style={{ fontFamily: T.body, fontSize: 13, color: sec, lineHeight: 1.65 }}>
              Periode {p.labelLong}. Total spend {fmt.rupiahShort(ads.spend)} dengan {fmt.num(ads.conversions)} konversi.
              ROAS mencapai {fmt.roas(ads.roas)}, organic sessions {fmt.num(ga4.sessions)}.
              {isMock && ' (Data demo — hubungkan sumber data nyata untuk insight aktual.)'}
            </div>
          </div>
        </div>
      );
    }

    if (cur.id === 'google') {
      const safeSpend = p.series.spend.length >= 2 ? p.series.spend : [0, 0];
      return (
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
            <span style={{ fontFamily: T.mono, fontSize: 10, color: blue, background: 'rgba(66,133,244,.1)', padding: '3px 10px', borderRadius: 4, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 600 }}>02 Google Ads</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
            <KpiCard acc={gold} label="Total Spend" value={fmt.rupiahShort(ads.spend)} delta={d(ads.spend, adsPrev.spend) != null ? Math.abs(d(ads.spend, adsPrev.spend)).toFixed(1) + '%' : '—'} deltaUp={(d(ads.spend, adsPrev.spend) || 0) >= 0} comparison="vs prev"/>
            <KpiCard acc={blue} label="Clicks" value={fmt.num(ads.clicks)} delta={d(ads.clicks, adsPrev.clicks) != null ? Math.abs(d(ads.clicks, adsPrev.clicks)).toFixed(1) + '%' : '—'} deltaUp={(d(ads.clicks, adsPrev.clicks) || 0) >= 0} comparison="vs prev"/>
            <KpiCard acc={teal} label="Conversions" value={fmt.num(ads.conversions)} delta={d(ads.conversions, adsPrev.conversions) != null ? Math.abs(d(ads.conversions, adsPrev.conversions)).toFixed(1) + '%' : '—'} deltaUp={(d(ads.conversions, adsPrev.conversions) || 0) >= 0} comparison="vs prev"/>
            <KpiCard acc={gold} label="ROAS" value={fmt.roas(ads.roas)} delta={d(ads.roas, adsPrev.roas) != null ? Math.abs(d(ads.roas, adsPrev.roas)).toFixed(1) + '%' : '—'} deltaUp={(d(ads.roas, adsPrev.roas) || 0) >= 0} comparison="vs prev"/>
          </div>
          <div style={{ background: 'var(--navy-surface)', border: '1px solid var(--navy-edge)', borderRadius: 14, padding: '18px 20px' }}>
            <div style={{ fontFamily: T.display, fontSize: 13, fontWeight: 700, color: fg, marginBottom: 12 }}>Spend Trend · {p.labelShort}</div>
            <MiniLine data={safeSpend} w={800} h={100} color={blue} fill id="pres-gads"/>
          </div>
        </div>
      );
    }

    if (cur.id === 'ga4') {
      const safeA = p.series.impressions.length >= 2 ? p.series.impressions.map(v => Math.round(v / 25)) : [ga4.sessions];
      const safeB = p.series.clicks.length >= 2 ? p.series.clicks.map(v => Math.round(v * 1.3)) : [ga4.users];
      return (
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
            <span style={{ fontFamily: T.mono, fontSize: 10, color: gold, background: 'rgba(248,180,0,.1)', padding: '3px 10px', borderRadius: 4, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 600 }}>GA4 Analytics</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
            <KpiCard acc={gold} label="Sessions" value={fmt.num(ga4.sessions)} delta={d(ga4.sessions, ga4Prev.sessions) != null ? Math.abs(d(ga4.sessions, ga4Prev.sessions)).toFixed(1) + '%' : '—'} deltaUp={(d(ga4.sessions, ga4Prev.sessions) || 0) >= 0} comparison="vs prev"/>
            <KpiCard acc={gold} label="Users" value={fmt.num(ga4.users)} delta={d(ga4.users, ga4Prev.users) != null ? Math.abs(d(ga4.users, ga4Prev.users)).toFixed(1) + '%' : '—'} deltaUp={(d(ga4.users, ga4Prev.users) || 0) >= 0} comparison="vs prev"/>
            <KpiCard acc={teal} label="Pageviews" value={fmt.num(ga4.pageviews)} delta={d(ga4.pageviews, ga4Prev.pageviews) != null ? Math.abs(d(ga4.pageviews, ga4Prev.pageviews)).toFixed(1) + '%' : '—'} deltaUp={(d(ga4.pageviews, ga4Prev.pageviews) || 0) >= 0} comparison="vs prev"/>
            <KpiCard acc={teal} label="Engaged Sessions" value={fmt.num(ga4.engaged)} delta={d(ga4.engaged, ga4Prev.engaged) != null ? Math.abs(d(ga4.engaged, ga4Prev.engaged)).toFixed(1) + '%' : '—'} deltaUp={(d(ga4.engaged, ga4Prev.engaged) || 0) >= 0} comparison="vs prev"/>
          </div>
          <div style={{ background: 'var(--navy-surface)', border: '1px solid var(--navy-edge)', borderRadius: 14, padding: '18px 20px' }}>
            <div style={{ fontFamily: T.display, fontSize: 13, fontWeight: 700, color: fg, marginBottom: 12 }}>Sessions vs Users</div>
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
          <div style={{ fontFamily: T.body, fontSize: 13, color: muted }}>Lihat detail di halaman report.</div>
        </div>
      </div>
    );
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'var(--navy-base)', color: fg,
      fontFamily: T.body, display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Flares */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', width: 900, height: 900, borderRadius: '50%', background: 'radial-gradient(circle, rgba(248,180,0,.22) 0%, transparent 68%)', filter: 'blur(110px)', top: '-20%', left: '-8%' }}/>
        <div style={{ position: 'absolute', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,194,184,.18) 0%, transparent 68%)', filter: 'blur(120px)', bottom: '-20%', right: '-8%' }}/>
      </div>

      {/* Top bar */}
      <div style={{
        height: 52, background: 'rgba(10,18,34,.88)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--navy-edge)',
        display: 'flex', alignItems: 'center', padding: '0 24px', gap: 14, flexShrink: 0, position: 'relative', zIndex: 1,
      }}>
        <img src="assets/img/logo-mark.png" alt="" style={{ width: 26, height: 26, opacity: 0.9 }}/>
        <div style={{ fontFamily: T.display, fontSize: 13.5, fontWeight: 700, color: fg, letterSpacing: '-.01em', flex: 1 }}>
          {client.name} · {p.labelShort} Report
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={prev} disabled={slide === 0} style={{
            width: 30, height: 30, background: 'var(--navy-surface)', border: '1px solid var(--navy-edge)',
            borderRadius: 7, color: sec, cursor: slide === 0 ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: slide === 0 ? 0.4 : 1,
          }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '5px 12px', background: 'var(--navy-surface)', border: '1px solid var(--navy-edge)',
            borderRadius: 7, fontFamily: T.mono, fontSize: 11, color: fg,
          }}>
            <span style={{ width: 5, height: 5, background: teal, borderRadius: '50%' }}/>
            {slide + 1} / {total}
          </div>
          <button onClick={next} disabled={slide === total - 1} style={{
            width: 30, height: 30, background: 'var(--navy-surface)', border: '1px solid var(--navy-edge)',
            borderRadius: 7, color: sec, cursor: slide === total - 1 ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: slide === total - 1 ? 0.4 : 1,
          }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>
      </div>

      {/* Slide content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '28px 32px 100px', position: 'relative', zIndex: 1 }}>
        {renderSlide()}
      </div>

      {/* Bottom nav */}
      <div style={{
        position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
        zIndex: 30, display: 'flex', alignItems: 'center', gap: 8,
        background: 'rgba(10,18,34,.92)', border: '1px solid var(--navy-edge)',
        borderRadius: 100, padding: '6px 8px',
        backdropFilter: 'blur(20px)', boxShadow: '0 8px 30px rgba(0,0,0,.4)',
      }}>
        <button onClick={prev} disabled={slide === 0} style={{
          width: 32, height: 32, border: 'none', borderRadius: 100,
          background: 'var(--navy-elevated)', color: sec, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: slide === 0 ? 0.35 : 1,
        }}>
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
        </button>

        <div style={{ display: 'flex', gap: 5, alignItems: 'center', padding: '0 8px' }}>
          {slides.map((s, i) => (
            <button key={i} onClick={() => setSlide(i)} title={s.title} style={{
              width: i === slide ? 20 : 6, height: 6, borderRadius: 3,
              background: i === slide ? teal : 'var(--navy-edge)',
              border: 'none', cursor: 'pointer', padding: 0,
              transition: 'width .2s, background .2s',
            }}/>
          ))}
        </div>

        <span style={{
          fontFamily: T.mono, fontSize: 11, color: fg,
          background: 'var(--navy-elevated)', borderRadius: 100,
          padding: '4px 10px', minWidth: 48, textAlign: 'center',
        }}>{slide + 1} / {total}</span>

        <button onClick={next} disabled={slide === total - 1} style={{
          width: 32, height: 32, border: 'none', borderRadius: 100,
          background: teal, color: '#0C182C', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: slide === total - 1 ? 0.35 : 1,
        }}>
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
        </button>

        <div style={{ width: 1, height: 20, background: 'var(--navy-edge)' }}/>

        <button onClick={onExit} style={{
          padding: '0 14px', height: 32, border: 'none', borderRadius: 100,
          background: 'var(--navy-elevated)', color: sec,
          fontFamily: T.display, fontSize: 11, fontWeight: 600, cursor: 'pointer',
        }}>Exit</button>
      </div>
    </div>
  );
}

// ─── Default layout filter ─────────────────────────────────────────
function getSmartDefaultLayout(connected) {
  if (!connected) return { rows: [] };
  const uid = window.genWidgetId || (() => 'w_' + Date.now() + '_' + Math.random().toString(36).slice(2,6));
  const rows = [];
  if (connected.google) {
    rows.push(
      [{ id: uid(), type: 'kpi-strip',   source: 'google', span: 12 }],
      [{ id: uid(), type: 'chart-area',  source: 'google', span: 7  }, { id: uid(), type: 'chart-donut', source: 'google', span: 5 }],
      [{ id: uid(), type: 'chart-bar',   source: 'google', span: 12 }],
      [{ id: uid(), type: 'table',       source: 'google', span: 12 }],
    );
  }
  if (connected.meta) {
    rows.push(
      [{ id: uid(), type: 'kpi-strip',   source: 'meta', span: 12 }],
      [{ id: uid(), type: 'chart-area',  source: 'meta', span: 7  }, { id: uid(), type: 'chart-donut', source: 'meta', span: 5 }],
    );
  }
  if (connected.ga4) {
    rows.push(
      [{ id: uid(), type: 'kpi-strip',    source: 'ga4', span: 12 }],
      [{ id: uid(), type: 'chart-area',   source: 'ga4', span: 7  }, { id: uid(), type: 'chart-heatmap', source: 'ga4', span: 5 }],
    );
  }
  if (connected.search) {
    rows.push(
      [{ id: uid(), type: 'kpi-strip',   source: 'search', span: 12 }],
      [{ id: uid(), type: 'chart-donut', source: 'search', span: 5  }, { id: uid(), type: 'chart-area', source: 'search', span: 7 }],
      [{ id: uid(), type: 'table',       source: 'search', span: 12 }],
    );
  }
  return { rows };
}

// ─── Main ScreenReport ─────────────────────────────────────────────
function ScreenReport({ clientId, onBack }) {
  const live = useLive();
  const [showPresent, setShowPresent] = useState(false);
  const [showEditor,  setShowEditor]  = useState(false);
  const [editorCardId, setEditorCardId] = useState('kpi-single');
  const [selectedWidget, setSelectedWidget] = useState(null);
  const [widgetConfigs, setWidgetConfigs] = useState({});
  const [widgetLayouts, setWidgetLayouts] = useState(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const undoHistory       = React.useRef([]);
  const layoutUndoHistory = React.useRef([]);
  const [historyLen, setHistoryLen] = useState(0);

  const updateWidgetConfig = useCallback((id, changes) => {
    setWidgetConfigs(prev => {
      undoHistory.current = [...undoHistory.current.slice(-19), prev];
      return { ...prev, [id]: { ...(prev[id] || {}), ...changes } };
    });
    setHistoryLen(l => l + 1);
  }, []);

  const undoWidgetConfig = useCallback(() => {
    if (undoHistory.current.length === 0) return;
    const prev = undoHistory.current[undoHistory.current.length - 1];
    undoHistory.current = undoHistory.current.slice(0, -1);
    setHistoryLen(undoHistory.current.length);
    setWidgetConfigs(prev);
  }, []);

  const updateWidgetLayouts = useCallback((updater) => {
    setWidgetLayouts(prev => {
      const allClients = [...(window._avo_clients || []), ...(window.HOME_CLIENTS || [])];
      const _client = allClients.find(c => c.id === clientId);
      const current = prev || getSmartDefaultLayout(_client?.connected);
      layoutUndoHistory.current = [...layoutUndoHistory.current.slice(-19), current];
      return typeof updater === 'function' ? updater(current) : updater;
    });
  }, [clientId]);

  const undoLayout = useCallback(() => {
    if (layoutUndoHistory.current.length === 0) return;
    const prev = layoutUndoHistory.current[layoutUndoHistory.current.length - 1];
    layoutUndoHistory.current = layoutUndoHistory.current.slice(0, -1);
    setWidgetLayouts(prev);
  }, []);

  // Load persisted configs + layouts when switching clients
  useEffect(() => {
    try {
      const saved = localStorage.getItem('widgetConfigs_' + clientId);
      setWidgetConfigs(saved ? JSON.parse(saved) : {});
    } catch { setWidgetConfigs({}); }
    try {
      const savedLayouts = localStorage.getItem('widgetLayouts_' + clientId);
      const parsed = savedLayouts ? JSON.parse(savedLayouts) : null;
      setWidgetLayouts(parsed ? migrateLegacyLayout(parsed) : null);
    } catch { setWidgetLayouts(null); }
  }, [clientId]);

  // Persist configs on every change
  useEffect(() => {
    if (!clientId || Object.keys(widgetConfigs).length === 0) return;
    try {
      localStorage.setItem('widgetConfigs_' + clientId, JSON.stringify(widgetConfigs));
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1800);
    } catch {}
  }, [widgetConfigs, clientId]);

  // Persist layouts on every change
  useEffect(() => {
    if (!clientId || !widgetLayouts) return;
    try {
      localStorage.setItem('widgetLayouts_' + clientId, JSON.stringify(widgetLayouts));
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1800);
    } catch {}
  }, [widgetLayouts, clientId]);

  // Ctrl+Z / Cmd+Z undo when editor is open (widget config first, then layout)
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (historyLen > 0) undoWidgetConfig();
        else undoLayout();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undoWidgetConfig, undoLayout, historyLen]);

  const handleSelectWidget = useCallback((id, cardId) => {
    setSelectedWidget(id);
    setEditorCardId(cardId);
  }, []);

  const handleDeleteWidget = useCallback((id) => {
    updateWidgetLayouts(prev => {
      const rows = prev.rows
        .map(row => row.filter(w => w.id !== id))
        .filter(row => row.length > 0);
      return { ...prev, rows };
    });
    setSelectedWidget(prev => prev === id ? null : prev);
  }, [updateWidgetLayouts]);

  // Delete/Backspace removes selected widget when editor is open
  useEffect(() => {
    const handler = (e) => {
      if (!selectedWidget || !showEditor || _IS_VIEWER) return;
      if (e.key !== 'Delete' && e.key !== 'Backspace') return;
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) return;
      e.preventDefault();
      handleDeleteWidget(selectedWidget);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedWidget, showEditor, handleDeleteWidget]);

  const handleWidgetConfigChange = useCallback((widgetId, changes) => {
    updateWidgetConfig(widgetId, changes);
  }, [updateWidgetConfig]);

  const handleSourceChange = useCallback((widgetId, newSource) => {
    updateWidgetLayouts(prev => ({
      ...prev,
      rows: prev.rows.map(row => row.map(w => w.id === widgetId ? { ...w, source: newSource } : w)),
    }));
  }, [updateWidgetLayouts]);
  const editState = showEditor && !_IS_VIEWER ? {
    selected: selectedWidget,
    onSelect: handleSelectWidget,
    onDelete: handleDeleteWidget,
    onDeselect: () => setSelectedWidget(null),
  } : null;

  // Count how many widgets in the current layout share the same widget type as the selected widget
  const _layouts = widgetLayouts || getSmartDefaultLayout(client?.connected);
  const sharedWidgetCount = (selectedWidget && editorCardId && _layouts)
    ? _layouts.rows.flat().filter(w => w.type === editorCardId || WIDGET_CARD_TYPES[w.id] === editorCardId).length
    : 0;
  const _selectedInstance = selectedWidget && _layouts
    ? _layouts.rows.flat().find(w => w.id === selectedWidget)
    : null;
  const instanceSource = _selectedInstance?.source || null;

  // Retry counter — increments every 300ms until client is found (max 10 tries)
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const allClients = [...(window._avo_clients || []), ...(window.HOME_CLIENTS || [])];
    const found = allClients.find(c => c.id === clientId);
    if (!found && retry < 10) {
      const t = setTimeout(() => setRetry(r => r + 1), 300);
      return () => clearTimeout(t);
    }
  }, [clientId, retry]);

  if (!live) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--navy-base)', color: muted, fontFamily: T.mono, fontSize: 12 }}>
        Context not found — pastikan data-bridge.jsx dimuat sebelum screen-report.jsx.
      </div>
    );
  }

  const { currentPeriod, dateRange, setDateRange, loading, _isMock, setAccount, setMetaAccount, setGa4Property, setGscProperty, psiUrl, setPsiUrl, _setAnySourceConnected } = live;
  const allClients = [...(window._avo_clients || []), ...(window.HOME_CLIENTS || [])];
  const client = allClients.find(c => c.id === clientId);

  // Sync Google Ads account filter — re-fires via retry once _avo_clients loads
  useEffect(() => {
    if (!setAccount || !client) return;
    const g = client.connected?.google;
    const accountName = (g && typeof g === 'object') ? (g.name || g.id) : (typeof g === 'string' ? g : '');
    setAccount(accountName || '');
  }, [clientId, retry]);

  // Sync Meta Ads account filter
  // null → not connected (skip fetch); '' → connected, fetch all; 'name' → filtered
  useEffect(() => {
    if (!setMetaAccount || !client) return;
    const m = client.connected?.meta;
    if (!m) { setMetaAccount(null); return; }
    const accountName = (typeof m === 'object') ? (m.name || m.id) : (typeof m === 'string' ? m : '');
    setMetaAccount(accountName || '');
  }, [clientId, retry]);

  // Sync GA4 property filter
  // null → not connected (skip fetch); '' → connected, fetch all; 'name' → filtered
  useEffect(() => {
    if (!setGa4Property || !client) return;
    const g = client.connected?.ga4;
    if (!g) { setGa4Property(null); return; }
    const prop = (typeof g === 'object') ? (g.name || g.id) : (typeof g === 'string' ? g : '');
    setGa4Property(prop || '');
  }, [clientId, retry]);

  // Sync Search Console property filter
  // null → not connected (skip fetch); '' → connected, fetch all; 'prop' → filtered
  useEffect(() => {
    if (!setGscProperty || !client) return;
    const s = client.connected?.search;
    if (!s) { setGscProperty(null); return; }
    const prop = (typeof s === 'object') ? (s.name || s.id) : (typeof s === 'string' ? s : '');
    setGscProperty(prop || '');
  }, [clientId, retry]);

  // Sync PageSpeed URL filter
  useEffect(() => {
    if (!setPsiUrl || !client) return;
    const ps = client.connected?.pagespeed;
    const url = (ps && typeof ps === 'object') ? (ps.name || ps.id) : (typeof ps === 'string' ? ps : '');
    setPsiUrl(url || '');
  }, [clientId, retry]);

  // Signal to LiveProvider that at least one source is connected for this client
  useEffect(() => {
    if (!_setAnySourceConnected || !client) return;
    const c = client.connected || {};
    _setAnySourceConnected(!!(c.google || c.meta || c.ga4 || c.search || c.pagespeed));
  }, [clientId, client?.connected]);

  // Default date: this month to yesterday
  useEffect(() => {
    if (!setDateRange) return;
    const today = new Date();
    const yest  = new Date(today); yest.setDate(today.getDate() - 1);
    const som   = new Date(today.getFullYear(), today.getMonth(), 1);
    setDateRange({ from: _drDs(som), to: _drDs(yest) });
  }, [clientId]);

  // Reset all filters when leaving this report
  useEffect(() => {
    return () => {
      if (setAccount)             setAccount('');
      if (setMetaAccount)         setMetaAccount(null);
      if (setGa4Property)         setGa4Property(null);
      if (setGscProperty)         setGscProperty(null);
      if (setPsiUrl)              setPsiUrl('');
      if (setDateRange)           setDateRange({ from: null, to: null });
      if (_setAnySourceConnected) _setAnySourceConnected(false);
    };
  }, []);

  if (!client) {
    return (
      <div style={{
        height: '100%', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'var(--navy-base)', gap: 14,
      }}>
        <div style={{ fontFamily: T.display, fontSize: 18, color: fg }}>Client tidak ditemukan</div>
        <div style={{ fontFamily: T.mono, fontSize: 10, color: muted }}>ID: {clientId}</div>
        <button onClick={onBack} style={{
          padding: '9px 18px', background: 'linear-gradient(135deg,#00C2B8,#009E96)',
          border: 'none', borderRadius: 8, color: '#0C182C',
          fontFamily: T.display, fontSize: 12, fontWeight: 700, cursor: 'pointer',
        }}>← Kembali ke Home</button>
      </div>
    );
  }

  const { connected } = client;
  const p = currentPeriod;
  const hasAnySource = connected && (connected.google || connected.meta || connected.ga4 || connected.search || connected.pagespeed);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--navy-base)', overflow: 'hidden' }}>
      <ReportTopBar
        client={client}
        dateRange={dateRange || { from: null, to: null }}
        setDateRange={setDateRange}
        onBack={onBack}
        isMock={_isMock}
        onPresent={() => setShowPresent(true)}
        onEdit={() => setShowEditor(v => !v)}
        showEditor={showEditor}
      />

      {/* Main area: report + optional editor panel */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Report content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: loading || !p ? 0 : '28px 36px 56px' }}>

          {loading && (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#00C2B8,#009E96)', animation: 'bootPulse 1.4s ease-in-out infinite' }}/>
              <div style={{ fontFamily: T.mono, fontSize: 10, color: muted, textTransform: 'uppercase', letterSpacing: '0.14em' }}>Memuat data…</div>
            </div>
          )}

          {!loading && !p && (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontFamily: T.mono, fontSize: 11, color: muted }}>Tidak ada data untuk periode ini.</div>
            </div>
          )}

          {!loading && p && (
            <>
              {/* Page title */}
              <div style={{ marginBottom: 28 }}>
                <h1 style={{ margin: 0, fontFamily: T.display, fontSize: 24, fontWeight: 800, color: fg, letterSpacing: '-0.02em' }}>
                  Laporan Performa
                </h1>
                <div style={{ fontFamily: T.mono, fontSize: 10, color: muted, marginTop: 5, textTransform: 'uppercase', letterSpacing: '0.14em' }}>
                  {p.labelLong} · {client.name}
                </div>
              </div>

              {!hasAnySource && <FirstTimeEmptyState client={client} onBack={onBack}/>}

              {hasAnySource ? (
                /* Universal canvas — same rendering in view mode and edit mode */
                <>
                  <DragCanvas
                    p={p}
                    connected={connected}
                    widgetConfigs={widgetConfigs}
                    editState={editState}
                    layouts={_layouts}
                    onLayoutChange={updateWidgetLayouts}
                  />
                  {connected && connected.pagespeed && (
                    <PageSpeedSection psi={p && p.psi} psiUrl={psiUrl}/>
                  )}
                </>
              ) : null}
            </>
          )}
        </div>

        {/* Card editor panel (slide in from right) */}
        {showEditor && window.CardEditorPanel && (
          <window.CardEditorPanel
            cardId={editorCardId}
            widgetId={selectedWidget}
            widgetConfig={selectedWidget ? (widgetConfigs[selectedWidget] || {}) : {}}
            onConfigChange={handleWidgetConfigChange}
            onUndo={historyLen > 0 ? undoWidgetConfig : null}
            connectedSources={client?.connected || {}}
            onClose={() => setShowEditor(false)}
            sharedWidgetCount={sharedWidgetCount}
            instanceSource={instanceSource}
            onSourceChange={handleSourceChange}
            style={{ flexShrink: 0 }}
          />
        )}
        {showEditor && !window.CardEditorPanel && (
          <div style={{
            width: 320, flexShrink: 0,
            background: 'rgba(10,18,34,.97)', borderLeft: '1px solid var(--navy-edge)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12,
          }}>
            <div style={{ fontFamily: T.mono, fontSize: 10, color: muted, textAlign: 'center', padding: '0 24px', lineHeight: 1.6 }}>
              Card editor tidak tersedia.<br/>Pastikan card-editor.jsx dimuat.
            </div>
            <button onClick={() => setShowEditor(false)} style={{
              padding: '6px 16px', background: 'var(--navy-elevated)', border: '1px solid var(--navy-edge)',
              borderRadius: 6, color: sec, fontFamily: T.display, fontSize: 11, cursor: 'pointer',
            }}>Tutup</button>
          </div>
        )}
      </div>

      {/* Present mode overlay */}
      {showPresent && p && (
        <PresentMode
          client={client}
          p={p}
          isMock={_isMock}
          onExit={() => setShowPresent(false)}
        />
      )}

      {savedFlash && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '7px 13px',
          background: 'rgba(0,194,184,.12)',
          border: '1px solid rgba(0,194,184,.3)',
          borderRadius: 8,
          fontFamily: 'var(--font-mono)', fontSize: 11,
          color: '#00C2B8',
          pointerEvents: 'none',
          animation: 'fadeIn .15s ease',
        }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          Tersimpan
        </div>
      )}
    </div>
  );
}

window.ScreenReport = ScreenReport;
