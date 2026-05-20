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
    <div style={{ fontFamily: T.mono, fontSize: 11, color, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600 }}>
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
          {compare && delta != null && <span style={{ fontFamily: T.body, fontSize: 12, color: muted }}>{compare}</span>}
          {sub && delta == null && <span style={{ fontFamily: T.mono, fontSize: 11, color: muted }}>{sub}</span>}
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
          <div style={{ fontFamily: T.display, fontSize: 15, fontWeight: 700, color: fg }}>{title}</div>
          {sub && <div style={{ fontFamily: T.body, fontSize: 13, color: muted, marginTop: 2 }}>{sub}</div>}
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
          <div style={{ fontFamily: T.mono, fontSize: 11, color: muted, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{subtitle}</div>
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
      <span style={{ fontFamily: T.mono, fontSize: 11, color: muted }}>{label}</span>
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
    if (!pendingFrom && !pendingTo) return 'Select date range…';
    if (phase === 'end' && pendingFrom && !pendingTo)
      return pendingFrom + '  →  select end date';
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
            fontFamily: T.mono, fontSize: 10.5, color: muted,
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
                fontFamily: T.body, fontSize: 13.5, cursor: 'pointer',
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
              flex: 1, fontFamily: T.mono, fontSize: 12, padding: '6px 10px', borderRadius: 7,
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
            <div style={{ fontFamily: T.mono, fontSize: 11.5, color: teal, textAlign: 'center', opacity: 0.85 }}>
              Click end date to complete the selection
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
              color: muted, fontFamily: T.mono, fontSize: 12, cursor: 'pointer',
            }}>Reset</button>

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={onCancel} style={{
                padding: '6px 14px', background: 'rgba(255,255,255,.06)',
                border: '1px solid rgba(255,255,255,.1)', borderRadius: 7,
                color: sec, fontFamily: T.display, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>Cancel</button>
              <button
                onClick={() => onApply({ from: pendingFrom, to: pendingTo })}
                disabled={!!(pendingFrom && !pendingTo && phase === 'end')}
                style={{
                  padding: '6px 20px',
                  background: (pendingFrom && !pendingTo && phase === 'end')
                    ? 'rgba(0,194,184,.25)'
                    : 'linear-gradient(135deg,#00C2B8,#009E96)',
                  border: 'none', borderRadius: 7,
                  color: '#0C182C', fontFamily: T.display, fontSize: 13, fontWeight: 700,
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
function ReportTopBar({ client, dateRange, setDateRange, onBack, isMock, onPresent, onEdit, showEditor, savedFlash }) {
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
        position: 'relative',
      }}>
        <button onClick={onBack} style={{
          background: 'none', border: '1px solid rgba(255,255,255,.12)',
          borderRadius: 7, color: sec, fontFamily: T.mono, fontSize: 12,
          padding: '5px 12px', cursor: 'pointer',
          textTransform: 'uppercase', letterSpacing: '0.1em',
          display: 'flex', alignItems: 'center', gap: 5,
        }}>← Home</button>

        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,.08)' }}/>

        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: client.avatarGrad || 'linear-gradient(135deg,#00C2B8,#7000FF)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: T.display, fontSize: 11, fontWeight: 800, color: '#fff', flexShrink: 0,
        }}>{client.initials || '?'}</div>

        <div>
          <div style={{ fontFamily: T.display, fontSize: 14, fontWeight: 700, color: fg, lineHeight: 1.2 }}>{client.name}</div>
          <div style={{ fontFamily: T.mono, fontSize: 11, color: muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{client.industry}</div>
        </div>

        <div style={{ flex: 1 }}/>

        {isMock && (
          <div style={{
            fontFamily: T.mono, fontSize: 11, color: gold,
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
          color: showPicker ? teal : fg, fontFamily: T.mono, fontSize: 12,
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

        {/* Saved flash — centered in header, fades in then fades out */}
        {savedFlash && (
          <div style={{
            position: 'absolute', left: '50%', top: '50%', zIndex: 99,
            pointerEvents: 'none',
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 18px',
            background: 'rgba(8,16,34,.96)',
            border: '1px solid rgba(0,194,184,.45)',
            borderRadius: 10,
            boxShadow: '0 4px 24px rgba(0,0,0,.5), 0 0 0 1px rgba(0,194,184,.1)',
            backdropFilter: 'blur(12px)',
            fontFamily: T.mono, fontSize: 12, color: teal, letterSpacing: '0.06em',
            animation: 'savedFlashAnim 1.8s ease forwards',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={teal} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            Tersimpan
          </div>
        )}

        {/* Edit / Editor toggle — hidden for viewers */}
        {!_IS_VIEWER && (
          <button onClick={onEdit} style={{
            padding: '6px 12px', borderRadius: 7, cursor: 'pointer',
            fontFamily: T.display, fontSize: 12, fontWeight: 600,
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
          color: '#0C182C', fontFamily: T.display, fontSize: 12, fontWeight: 700,
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
  const isSelected = Array.isArray(editState.selected) ? editState.selected.includes(id) : editState.selected === id;
  return (
    <div
      onClick={e => {
        e.stopPropagation();
        if ((e.ctrlKey || e.metaKey) && Array.isArray(editState.selected) && editState.selected.length > 0) {
          // Ctrl+click: toggle this widget in/out of the current multi-selection
          const next = editState.selected.includes(id)
            ? editState.selected.filter(s => s !== id)
            : [...editState.selected, id];
          if (next.length === 0) editState.onDeselect();
          else editState.onMultiSelect(next);
        } else {
          editState.onSelect(id, cardId);
        }
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
const FONT_SCALES = { S: 1, M: 1.2, L: 1.35 };

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

const _gscCountryFmt = (() => {
  try {
    const dn = new Intl.DisplayNames(['en'], { type: 'region' });
    const a3a2 = {
      afg:'AF',alb:'AL',dza:'DZ',and:'AD',ago:'AO',arg:'AR',arm:'AM',aus:'AU',aut:'AT',
      aze:'AZ',bhs:'BS',bhr:'BH',bgd:'BD',blr:'BY',bel:'BE',blz:'BZ',ben:'BJ',btn:'BT',
      bol:'BO',bih:'BA',bwa:'BW',bra:'BR',brn:'BN',bgr:'BG',bfa:'BF',bdi:'BI',khm:'KH',
      cmr:'CM',can:'CA',cpv:'CV',caf:'CF',tcd:'TD',chl:'CL',chn:'CN',col:'CO',com:'KM',
      cod:'CD',cog:'CG',cri:'CR',hrv:'HR',cub:'CU',cyp:'CY',cze:'CZ',dnk:'DK',dji:'DJ',
      dom:'DO',ecu:'EC',egy:'EG',slv:'SV',gnq:'GQ',eri:'ER',est:'EE',eth:'ET',fji:'FJ',
      fin:'FI',fra:'FR',gab:'GA',gmb:'GM',geo:'GE',deu:'DE',gha:'GH',grc:'GR',gtm:'GT',
      gin:'GN',gnb:'GW',guy:'GY',hti:'HT',hnd:'HN',hkg:'HK',hun:'HU',isl:'IS',ind:'IN',
      idn:'ID',irn:'IR',irq:'IQ',irl:'IE',isr:'IL',ita:'IT',jam:'JM',jpn:'JP',jor:'JO',
      kaz:'KZ',ken:'KE',prk:'KP',kor:'KR',kwt:'KW',kgz:'KG',lao:'LA',lva:'LV',lbn:'LB',
      lso:'LS',lbr:'LR',lby:'LY',lie:'LI',ltu:'LT',lux:'LU',mac:'MO',mkd:'MK',mdg:'MG',
      mwi:'MW',mys:'MY',mdv:'MV',mli:'ML',mlt:'MT',mrt:'MR',mus:'MU',mex:'MX',mda:'MD',
      mco:'MC',mng:'MN',mne:'ME',mar:'MA',moz:'MZ',mmr:'MM',nam:'NA',npl:'NP',nld:'NL',
      nzl:'NZ',nic:'NI',ner:'NE',nga:'NG',nor:'NO',omn:'OM',pak:'PK',pan:'PA',png:'PG',
      pry:'PY',per:'PE',phl:'PH',pol:'PL',prt:'PT',qat:'QA',rou:'RO',rus:'RU',rwa:'RW',
      sau:'SA',sen:'SN',srb:'RS',sle:'SL',sgp:'SG',svk:'SK',svn:'SI',som:'SO',zaf:'ZA',
      ssd:'SS',esp:'ES',lka:'LK',sdn:'SD',sur:'SR',swz:'SZ',swe:'SE',che:'CH',syr:'SY',
      twn:'TW',tjk:'TJ',tza:'TZ',tha:'TH',tls:'TL',tgo:'TG',tto:'TT',tun:'TN',tur:'TR',
      tkm:'TM',uga:'UG',ukr:'UA',are:'AE',gbr:'GB',usa:'US',ury:'UY',uzb:'UZ',ven:'VE',
      vnm:'VN',yem:'YE',zmb:'ZM',zwe:'ZW',
    };
    return code => {
      if (!code) return '—';
      const a2 = a3a2[code.toLowerCase()];
      if (!a2) return code.toUpperCase();
      try { return dn.of(a2) || code.toUpperCase(); } catch { return code.toUpperCase(); }
    };
  } catch { return code => code ? code.toUpperCase() : '—'; }
})();

const _gscDateFmt = (() => {
  try {
    const df = new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
    return str => {
      if (!str) return '—';
      const [y, m, d] = str.split('-').map(Number);
      if (!y || !m || !d) return str;
      return df.format(new Date(y, m - 1, d));
    };
  } catch { return str => str || '—'; }
})();

function dimDisplayValue(dim, rawValue) {
  if (rawValue == null || rawValue === '') return '';
  const s = String(rawValue);
  if (!dim) return s;
  if (dim.fmtCell === 'gsc-date')    return _gscDateFmt(s);
  if (dim.fmtCell === 'gsc-country') return _gscCountryFmt(s);
  if (dim.fmtCell === 'gsc-device')  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  if (dim.fmtCell === 'url')         return shortUrlFmt(s);
  return s;
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

// Wrapper for custom metric display: if format is pct and the formula returned a raw
// ratio (0–1), multiply by 100 so conversions/clicks → 37.5% not 0.38%.
// Built-in metrics (ctr, bounce_rate) are already stored in pct scale (e.g. 3.78),
// so they pass through unchanged.
function fmtCustomMetricVal(val, fmt_) {
  if (val == null) return '—';
  const v = (fmt_ === 'pct' && val >= 0 && val <= 1) ? val * 100 : val;
  return fmtMetricVal(v, fmt_);
}

// Evaluate a custom metric formula against a values object (aggregated totals or a table row).
// Variables are metric keys; only numbers and basic math operators are allowed.
function evalFormula(formula, values) {
  if (!formula) return null;
  let expr = formula.trim();
  // Replace metric keys with their numeric values (longest keys first to avoid partial matches)
  Object.keys(values).sort((a, b) => b.length - a.length).forEach(k => {
    if (/^[a-z_][a-z0-9_]*$/.test(k))
      expr = expr.replace(new RegExp('\\b' + k + '\\b', 'g'), String(Number(values[k] ?? 0) || 0));
  });
  // Only allow digits, math operators, whitespace, parentheses, decimals
  if (!/^[\d\s+\-*/().,eE]+$/.test(expr)) return null;
  try {
    // eslint-disable-next-line no-new-func
    const result = Function('"use strict"; return (' + expr + ')')();
    return Number.isFinite(result) ? result : null;
  } catch { return null; }
}

// Build a flat values object from DATA_REGISTRY for aggregated (p) data
function applyKpiFilters(p, source, filters) {
  if (!p || !filters || !filters.length || filters.every(function(f) { return !f.val; })) return p;
  var matchRow = function(row, f) {
    var rv = String(row[f.dim] || '').toLowerCase();
    var v  = (f.val || '').toLowerCase();
    if (!v) return true;
    if (f.op === 'is')     return rv === v;
    if (f.op === 'not')    return rv !== v;
    if (f.op === 'starts') return rv.startsWith(v);
    return rv.includes(v);
  };
  var matchAll = function(row) { return filters.every(function(f) { return !f.val || matchRow(row, f); }); };

  if (source === 'google') {
    var rows = (p.campaigns || []).filter(matchAll);
    var s = rows.reduce(function(a, r) { return {
      spend: a.spend + (+r.spend || 0),
      impressions: a.impressions + (+r.impressions || 0),
      clicks: a.clicks + (+r.clicks || 0),
      conversions: a.conversions + (+r.conversions || 0),
    }; }, { spend: 0, impressions: 0, clicks: 0, conversions: 0 });
    var ads = Object.assign({}, s, {
      ctr: s.impressions > 0 ? (s.clicks / s.impressions) * 100 : 0,
      cpc: s.clicks > 0 ? s.spend / s.clicks : 0,
      cvr: s.clicks > 0 ? (s.conversions / s.clicks) * 100 : 0,
      cpa: s.conversions > 0 ? s.spend / s.conversions : 0,
      roas: null,
    });
    return Object.assign({}, p, { ads: ads });
  }
  if (source === 'meta') {
    var metaRows = ((p.metaInsightsRows && p.metaInsightsRows.length) ? p.metaInsightsRows : (p.metaRows || [])).filter(matchAll);
    var ms = metaRows.reduce(function(a, r) { return {
      spend: a.spend + (+r.spend || 0),
      impressions: a.impressions + (+r.impressions || 0),
      reach: a.reach + (+r.reach || 0),
      clicks: a.clicks + (+(r.link_clicks != null ? r.link_clicks : r.clicks) || 0),
      landing_page_views: a.landing_page_views + (+r.landing_page_views || 0),
      leads: a.leads + (+r.leads || 0),
      complete_registrations: a.complete_registrations + (+r.complete_registrations || 0),
      messaging_conv_started: a.messaging_conv_started + (+r.messaging_conv_started || 0),
      contacts: a.contacts + (+r.contacts || 0),
      ig_profile_visits: a.ig_profile_visits + (+r.ig_profile_visits || 0),
      post_engagements: a.post_engagements + (+r.post_engagements || 0),
      content_views: a.content_views + (+r.content_views || 0),
      purchases: a.purchases + (+r.purchases || 0),
      purchase_value: a.purchase_value + (+r.purchase_value || 0),
      add_to_carts: a.add_to_carts + (+r.add_to_carts || 0),
      add_to_cart_value: a.add_to_cart_value + (+r.add_to_cart_value || 0),
    }; }, { spend:0,impressions:0,reach:0,clicks:0,landing_page_views:0,leads:0,complete_registrations:0,messaging_conv_started:0,contacts:0,ig_profile_visits:0,post_engagements:0,content_views:0,purchases:0,purchase_value:0,add_to_carts:0,add_to_cart_value:0 });
    return Object.assign({}, p, { meta: ms });
  }
  if (source === 'ga4') {
    var ga4rows = (p.ga4Rows || []).filter(matchAll);
    var gs = { sessions:0,total_users:0,new_users:0,returning_users:0,event_count:0,engaged_sessions:0,bounceW:0,durationW:0,engagementW:0 };
    ga4rows.forEach(function(r) {
      var sess = +r.sessions || 0;
      gs.sessions += sess; gs.total_users += +r.total_users||0; gs.new_users += +r.new_users||0;
      gs.returning_users += +r.returning_users||0; gs.event_count += +r.event_count||0; gs.engaged_sessions += +r.engaged_sessions||0;
      if (r.bounce_rate != null && sess > 0) gs.bounceW += +r.bounce_rate * sess;
      if (r.avg_session_duration != null && sess > 0) gs.durationW += +r.avg_session_duration * sess;
      if (r.engagement_rate != null && sess > 0) gs.engagementW += +r.engagement_rate * sess;
    });
    var ga4 = {
      sessions: gs.sessions, total_users: gs.total_users, new_users: gs.new_users,
      returning_users: gs.returning_users, event_count: gs.event_count, engaged_sessions: gs.engaged_sessions,
      bounce_rate:          gs.sessions > 0 ? (gs.bounceW     / gs.sessions) * 100 : 0,
      avg_session_duration: gs.sessions > 0 ?  gs.durationW   / gs.sessions        : 0,
      engagement_rate:      gs.sessions > 0 ? (gs.engagementW / gs.sessions) * 100 : 0,
    };
    return Object.assign({}, p, { ga4: ga4 });
  }
  if (source === 'search') {
    var queries = (p.gsc && p.gsc.queries ? p.gsc.queries : []).filter(matchAll);
    var pages   = (p.gsc && p.gsc.pages   ? p.gsc.pages   : []).filter(matchAll);
    var allRows = queries.length ? queries : pages;
    var ss = allRows.reduce(function(a, r) { return {
      impressions: a.impressions + (+r.impressions||0),
      clicks: a.clicks + (+r.clicks||0),
      posW: a.posW + (+r.impressions||0) * (+r.position||0),
    }; }, { impressions:0, clicks:0, posW:0 });
    var gsc = Object.assign({}, p.gsc, {
      impressions: ss.impressions,
      clicks: ss.clicks,
      ctr: ss.impressions > 0 ? (ss.clicks / ss.impressions) * 100 : 0,
      position: ss.impressions > 0 ? ss.posW / ss.impressions : 0,
      queries: queries, pages: pages,
    });
    return Object.assign({}, p, { gsc: gsc });
  }
  return p;
}

function getAggValues(source, p) {
  const reg = window.DATA_REGISTRY?.[source] || {};
  const out = {};
  Object.entries(reg).forEach(([k, def]) => { out[k] = def.value ? (def.value(p) ?? 0) : 0; });
  return out;
}
function getAggValuesPrev(source, p) {
  const reg = window.DATA_REGISTRY?.[source] || {};
  const out = {};
  Object.entries(reg).forEach(([k, def]) => { out[k] = def.prev ? (def.prev(p) ?? 0) : 0; });
  return out;
}

function CustomMetricStrip({ instance, p, cfg, scale }) {
  const customMetrics = cfg.customMetrics || [];
  if (!customMetrics.length) return null;
  const aggVals = getAggValues(instance.source, p);
  const ACCENT_COLORS = [teal, blue, gold, '#A78BFA', '#F87171'];
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
      {customMetrics.map((cm, i) => (
        <Kpi key={cm.id}
          label={cm.name}
          value={fmtCustomMetricVal(evalFormula(cm.formula, aggVals), cm.format)}
          delta={null}
          accent={ACCENT_COLORS[i % ACCENT_COLORS.length]}
          scale={scale || 0.85}
        />
      ))}
    </div>
  );
}

// ─── Universal configurable data table ────────────────────────────
function DataTable({ widgetId, widgetConfig, rows, availDims, availMetrics, defaultDims, defaultMetrics, defaultName, customMetrics: customMetricsProp, tabBar }) {
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

  const [searches, setSearches] = useState({});
  const [sortKey,  setSortKey]  = useState(cfg.sortMetric);
  const [sortDir,  setSortDir]  = useState(cfg.sortDir);
  const [pageNum,  setPageNum]  = useState(1);

  useEffect(() => { setPageNum(1); }, [searches]);
  useEffect(() => { setPageNum(1); }, [cfg.pageSize]);
  useEffect(() => { setSortKey(cfg.sortMetric || ''); }, [cfg.sortMetric]);

  const fScale  = FONT_SCALES[cfg.fontSize] || 1;
  const fs      = n => Math.round(n * fScale);
  const dims = (() => {
    const resolved = (cfg.dimensions || []).map(k => availDims.find(d => d.key === k)).filter(Boolean);
    return resolved.length > 0 ? resolved : (availDims.length > 0 ? [availDims[0]] : []);
  })();
  const metrics = (() => {
    const resolved = (cfg.metrics || []).map(k => availMetrics.find(m => m.key === k)).filter(Boolean);
    return resolved.length > 0 ? resolved : availMetrics.slice(0, 4);
  })();
  const customMetrics = customMetricsProp || cfg.customMetrics || [];
  const pgSize  = Math.max(1, cfg.pageSize || 10);

  const metricCols = (() => {
    const regMap  = Object.fromEntries(metrics.map(m => [m.key, { type: 'regular', m }]));
    const custMap = Object.fromEntries(customMetrics.map(cm => [cm.id, { type: 'custom', cm }]));
    const order   = cfg.metricOrder;
    if (order && order.length) {
      const cols = order.map(id => regMap[id] || custMap[id]).filter(Boolean);
      metrics.forEach(m => { if (!cols.find(c => c.type === 'regular' && c.m.key === m.key)) cols.push(regMap[m.key]); });
      customMetrics.forEach(cm => { if (!cols.find(c => c.type === 'custom' && c.cm.id === cm.id)) cols.push(custMap[cm.id]); });
      return cols;
    }
    return [
      ...metrics.map(m => ({ type: 'regular', m })),
      ...customMetrics.map(cm => ({ type: 'custom', cm })),
    ];
  })();

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
    dims.forEach(d => {
      const s = (searches[d.key] || '').toLowerCase();
      if (s) r = r.filter(row => dimDisplayValue(d, row[d.key]).toLowerCase().includes(s));
    });
    return r;
  }, [rows, cfg.filters, searches, dims]);

  // Group rows with identical dimension values; sum additive metrics, avg rate metrics.
  // We accumulate ALL availMetrics (not just selected ones) so custom metric formulas
  // can reference any metric variable even if it isn't a visible column.
  const grouped = useMemo(() => {
    if (dims.length === 0) return filtered;
    const allM = availMetrics; // full list for formula evaluation
    const map = new Map();
    filtered.forEach(row => {
      const key = dims.map(d => String(row[d.key] ?? '')).join('\x00');
      if (!map.has(key)) {
        const entry = {};
        dims.forEach(d => { entry[d.key] = row[d.key]; });
        allM.forEach(m => { entry[m.key] = 0; entry['__n_' + m.key] = 0; });
        map.set(key, entry);
      }
      const entry = map.get(key);
      allM.forEach(m => {
        const v = parseFloat(row[m.key]);
        if (!isNaN(v)) { entry[m.key] += v; entry['__n_' + m.key]++; }
      });
    });
    // Average rate/ratio metrics instead of summing
    const result = Array.from(map.values());
    result.forEach(entry => {
      allM.forEach(m => {
        if ((m.fmt === 'pct' || m.fmt === 'roas') && entry['__n_' + m.key] > 0) {
          entry[m.key] = entry[m.key] / entry['__n_' + m.key];
        }
      });
    });
    return result;
  }, [filtered, dims, metrics, availMetrics]);

  // Augment grouped rows with pre-computed custom metric values keyed by cm.id
  const groupedWithCustom = useMemo(() => {
    if (!customMetrics || customMetrics.length === 0) return grouped;
    return grouped.map(r => {
      const extra = {};
      customMetrics.forEach(cm => { extra[cm.id] = evalFormula(cm.formula, r) ?? null; });
      return { ...r, ...extra };
    });
  }, [grouped, customMetrics]);

  const sorted = useMemo(() => {
    if (!sortKey) return groupedWithCustom;
    return [...groupedWithCustom].sort((a, b) => {
      const mul = sortDir === 'desc' ? -1 : 1;
      return mul * ((+(a[sortKey]) || 0) - (+(b[sortKey]) || 0));
    });
  }, [groupedWithCustom, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pgSize));
  const curPage    = Math.min(pageNum, totalPages);
  const pageRows   = sorted.slice((curPage - 1) * pgSize, curPage * pgSize);
  const displayName = cfg.name || defaultName || 'Table';

  return (
    <RCard padding={0} style={{ overflow: 'hidden' }}>
      {tabBar}
      <div style={{ padding: `${fs(10)}px ${fs(16)}px ${fs(8)}px`, borderBottom: '1px solid var(--navy-edge)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: fs(7) }}>
          <div>
            <div style={{ fontFamily: T.display, fontSize: fs(13), fontWeight: 700, color: fg }}>{displayName}</div>
            <div style={{ fontFamily: T.body, fontSize: fs(10), color: muted, marginTop: 2 }}>{sorted.length} baris</div>
          </div>
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
              {metricCols.map(col => col.type === 'regular'
                ? <SortTh key={col.m.key} label={cfg.metricLabels?.[col.m.key] || col.m.label} sortKey={col.m.key} active={sortKey === col.m.key} dir={sortDir} onSort={toggleSort}/>
                : <SortTh key={col.cm.id} label={col.cm.name} sortKey={col.cm.id} active={sortKey === col.cm.id} dir={sortDir} onSort={toggleSort}/>
              )}
            </tr>
            <tr style={{ background: 'var(--navy-deep)', borderBottom: '1px solid var(--navy-edge)' }}>
              {dims.map(d => {
                const val = searches[d.key] || '';
                return (
                  <th key={d.key} style={{ padding: `${fs(4)}px ${fs(8)}px` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: `${fs(3)}px ${fs(6)}px`, background: 'var(--navy-elevated)', border: `1px solid ${val ? teal + '60' : 'var(--navy-edge)'}`, borderRadius: 5, maxWidth: 220 }}>
                      <svg width="9" height="9" fill="none" stroke={muted} strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                      <input value={val} onChange={e => setSearches(prev => ({ ...prev, [d.key]: e.target.value }))} placeholder={`${d.label}…`}
                        style={{ flex: 1, minWidth: 0, background: 'none', border: 'none', outline: 'none', color: fg, fontFamily: T.body, fontSize: fs(10) }}/>
                      {val && <button onClick={() => setSearches(prev => ({ ...prev, [d.key]: '' }))} style={{ background: 'none', border: 'none', color: muted, cursor: 'pointer', padding: 0, fontSize: 11, lineHeight: 1 }}>×</button>}
                    </div>
                  </th>
                );
              })}
              {metricCols.map(col => <th key={col.type === 'regular' ? col.m.key : col.cm.id}/>)}
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 && (
              <tr><td colSpan={dims.length + metricCols.length} style={{ padding: fs(20), textAlign: 'center', fontFamily: T.mono, fontSize: fs(10), color: muted }}>No results</td></tr>
            )}
            {pageRows.map((r, i) => (
              <tr key={i} style={{ borderTop: '1px solid rgba(51,71,102,.5)' }}>
                {dims.map((d, di) => {
                  const raw  = r[d.key];
                  const disp = d.fmtCell === 'url'        ? shortUrlFmt(raw)
                             : d.fmtCell === 'gsc-country' ? _gscCountryFmt(raw)
                             : d.fmtCell === 'gsc-device'  ? (raw ? raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase() : '—')
                             : d.fmtCell === 'gsc-date'    ? _gscDateFmt(raw)
                             : (raw || '—');
                  return (
                    <td key={d.key} title={d.fmtCell === 'url' ? (raw || '') : undefined}
                      style={{ padding: `${fs(8)}px ${fs(12)}px`, fontFamily: T.display, fontWeight: di === 0 ? 600 : 400, color: fg, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: fs(12) }}>
                      {disp}
                    </td>
                  );
                })}
                {metricCols.map(col => col.type === 'regular'
                  ? <td key={col.m.key} style={{ padding: `${fs(8)}px ${fs(12)}px`, textAlign: 'right', fontFamily: T.mono, color: sec, fontSize: fs(11), whiteSpace: 'nowrap' }}>
                      {fmtMetricVal(r[col.m.key], col.m.fmt)}
                    </td>
                  : <td key={col.cm.id} style={{ padding: `${fs(8)}px ${fs(12)}px`, textAlign: 'right', fontFamily: T.mono, color: sec, fontSize: fs(11), whiteSpace: 'nowrap' }}>
                      {fmtCustomMetricVal(r[col.cm.id], col.cm.format)}
                    </td>
                )}
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
          <div style={{ fontFamily: T.display, fontSize: 15, fontWeight: 700, color: fg }}>Campaigns</div>
          <div style={{ fontFamily: T.body, fontSize: 12, color: muted, marginTop: 2 }}>{rows.length} campaigns · this period</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 10px', background: 'var(--navy-elevated)', border: '1px solid var(--navy-edge)', borderRadius: 7, minWidth: 180 }}>
          <svg width="11" height="11" fill="none" stroke={muted} strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search campaigns…"
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: fg, fontFamily: T.body, fontSize: 13 }}
          />
          {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: muted, cursor: 'pointer', padding: 0, lineHeight: 1, fontSize: 16 }}>×</button>}
        </div>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.body, fontSize: 13 }}>
        <thead>
          <tr style={{ background: 'var(--navy-deep)' }}>
            <th style={{ padding: '8px 14px', textAlign: 'left', fontFamily: T.mono, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: muted }}>Campaign</th>
            <th style={{ padding: '8px 14px', textAlign: 'left', fontFamily: T.mono, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: muted }}>Type</th>
            {cols.map(c => <SortTh key={c.key} label={c.label} sortKey={c.key} active={sortKey === c.key} dir={sortDir} onSort={toggleSort}/>)}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td colSpan={8} style={{ padding: '20px 14px', textAlign: 'center', fontFamily: T.mono, fontSize: 11, color: muted }}>No matching campaigns</td></tr>
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
  const customMetrics = cfg.customMetrics || [];
  const ACCENT_COLORS = [teal, blue, gold, '#A78BFA', '#F87171'];
  const aggVals = customMetrics.length > 0 ? getAggValues(instance.source, p) : {};
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
      {customMetrics.map((cm, i) => {
        const val = evalFormula(cm.formula, aggVals);
        return (
          <Kpi key={cm.id}
            label={cm.name}
            value={fmtCustomMetricVal(val, cm.format)}
            delta={null}
            accent={ACCENT_COLORS[(metrics.length + i) % ACCENT_COLORS.length]}
            scale={scale}
          />
        );
      })}
    </div>
  );
}

// Build a daily spark series for any metric key or custom-metric formula.
// Tries DATA_REGISTRY .series() first, then derives from raw daily rows.
function buildSparkSeries(source, p, metricKey, formula) {
  var reg = window.DATA_REGISTRY?.[source] || {};

  // Pre-computed series (google & search have these for main metrics)
  if (metricKey) {
    var def0 = reg[metricKey] || {};
    if (def0.series) { var s0 = def0.series(p); if (s0 && s0.length >= 2) return s0; }
  }

  // Derive per-day values from raw row data
  var rawRows = [];
  var aggregateDay;

  if (source === 'meta') {
    rawRows = (p?.metaInsightsRows && p.metaInsightsRows.length ? p.metaInsightsRows : p?.metaRows) || [];
    aggregateDay = function(rows) {
      var s = rows.reduce(function(a,r) { return {
        spend:a.spend+(+r.spend||0), impressions:a.impressions+(+r.impressions||0),
        reach:a.reach+(+r.reach||0),
        clicks:a.clicks+(+(r.link_clicks!=null?r.link_clicks:r.clicks)||0),
        landing_page_views:a.landing_page_views+(+r.landing_page_views||0),
        leads:a.leads+(+r.leads||0),
        complete_registrations:a.complete_registrations+(+r.complete_registrations||0),
        messaging_conv_started:a.messaging_conv_started+(+r.messaging_conv_started||0),
        contacts:a.contacts+(+r.contacts||0),
        ig_profile_visits:a.ig_profile_visits+(+r.ig_profile_visits||0),
        post_engagements:a.post_engagements+(+r.post_engagements||0),
        content_views:a.content_views+(+r.content_views||0),
        purchases:a.purchases+(+r.purchases||0),
        purchase_value:a.purchase_value+(+r.purchase_value||0),
        add_to_carts:a.add_to_carts+(+r.add_to_carts||0),
        add_to_cart_value:a.add_to_cart_value+(+r.add_to_cart_value||0),
      }; }, {spend:0,impressions:0,reach:0,clicks:0,landing_page_views:0,leads:0,complete_registrations:0,messaging_conv_started:0,contacts:0,ig_profile_visits:0,post_engagements:0,content_views:0,purchases:0,purchase_value:0,add_to_carts:0,add_to_cart_value:0});
      return { meta: s };
    };
  } else if (source === 'ga4') {
    rawRows = p?.ga4Rows || [];
    aggregateDay = function(rows) {
      var s = {sessions:0,total_users:0,new_users:0,returning_users:0,event_count:0,engaged_sessions:0,bounceW:0,durationW:0,engagementW:0};
      rows.forEach(function(r) {
        var sess=+r.sessions||0; s.sessions+=sess; s.total_users+=+r.total_users||0; s.new_users+=+r.new_users||0;
        s.returning_users+=+r.returning_users||0; s.event_count+=+r.event_count||0; s.engaged_sessions+=+r.engaged_sessions||0;
        if(r.bounce_rate!=null&&sess>0) s.bounceW+=+r.bounce_rate*sess;
        if(r.avg_session_duration!=null&&sess>0) s.durationW+=+r.avg_session_duration*sess;
        if(r.engagement_rate!=null&&sess>0) s.engagementW+=+r.engagement_rate*sess;
      });
      return {ga4:{sessions:s.sessions,total_users:s.total_users,new_users:s.new_users,returning_users:s.returning_users,event_count:s.event_count,engaged_sessions:s.engaged_sessions,bounce_rate:s.sessions>0?s.bounceW/s.sessions:0,avg_session_duration:s.sessions>0?s.durationW/s.sessions:0,engagement_rate:s.sessions>0?s.engagementW/s.sessions:0}};
    };
  } else {
    return null; // google/search: rely on pre-computed series only
  }

  if (!rawRows.length) return null;
  var byDate = {};
  rawRows.forEach(function(r) {
    var dt = r.date || r.Date || ''; if (!dt) return;
    if (!byDate[dt]) byDate[dt] = [];
    byDate[dt].push(r);
  });
  var dates = Object.keys(byDate).sort();
  if (dates.length < 2) return null;

  return dates.map(function(dt) {
    var dayP = aggregateDay(byDate[dt]);
    if (formula) {
      var dayVals = {};
      Object.keys(reg).forEach(function(k) { var d2 = reg[k]; dayVals[k] = d2.value ? (d2.value(dayP)||0) : 0; });
      return evalFormula(formula, dayVals) || 0;
    }
    var defD = reg[metricKey] || {};
    return defD.value ? (defD.value(dayP)||0) : 0;
  });
}

function SingleStatWidget({ instance, p, cfg }) {
  const d     = fmt.pctChange;
  const reg   = window.DATA_REGISTRY?.[instance.source] || {};
  const scale = FONT_SCALES[cfg.fontSize] || 1;
  const isDetail = cfg.numberFormat === 'detail';

  function fmtSingleVal(val, fmtKey) {
    if (val == null || isNaN(val)) return '—';
    if (fmtKey === 'pct')  return val.toFixed(2) + '%';
    if (fmtKey === 'roas') return val.toFixed(2) + 'x';
    if (fmtKey === 'rupiah') {
      if (isDetail) return 'Rp ' + Math.round(val).toLocaleString('en-US');
      if (val >= 1000000) return 'Rp ' + (val / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
      if (val >= 1000)    return 'Rp ' + (val / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
      return 'Rp ' + Math.round(val).toLocaleString('en-US');
    }
    if (isDetail) return Math.round(val).toLocaleString('en-US');
    if (val >= 1000000) return (val / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (val >= 1000)    return (val / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return String(Math.round(val));
  }

  // "vs Feb 2025" — derived from the active report date range
  const compareLabel = (function() {
    var MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var dr = window._reportDateRange;
    if (!dr || !dr.to) return null;
    var toD  = new Date(dr.to + 'T00:00:00');
    var prevD = new Date(toD.getFullYear(), toD.getMonth() - 1, 1);
    return 'vs ' + MONTHS[prevD.getMonth()] + ' ' + prevD.getFullYear();
  })();

  var numSize = Math.round(22 * scale * 1.4);

  const cm0 = (cfg.customMetrics || [])[0];
  if (cm0) {
    const aggVals  = getAggValues(instance.source, p);
    const aggPrev  = getAggValuesPrev(instance.source, p);
    const val      = evalFormula(cm0.formula, aggVals);
    const prevVal  = evalFormula(cm0.formula, aggPrev);
    const delta    = (val != null && prevVal != null) ? d(val, prevVal) : null;
    const scaledVal = (cm0.format === 'pct' && val != null && val >= 0 && val <= 1) ? val * 100 : val;
    const sparkData = buildSparkSeries(instance.source, p, null, cm0.formula);
    return (
      <RCard accent={teal} padding={16}>
        <Eyebrow>{cfg.name || cm0.name}</Eyebrow>
        <div style={{ marginTop: 6, fontFamily: T.display, fontSize: numSize, fontWeight: 800, color: fg, letterSpacing: '-0.02em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
          {fmtSingleVal(scaledVal, cm0.format)}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {delta != null && <RDelta value={Math.round(delta * 10) / 10}/>}
            {compareLabel && delta != null && <span style={{ fontFamily: T.body, fontSize: 11, color: muted }}>{compareLabel}</span>}
          </div>
          {sparkData && <Spark data={sparkData} color={teal} w={120} h={48}/>}
        </div>
      </RCard>
    );
  }

  const key     = cfg.metric;
  const def     = reg[key] || {};
  const val     = def.value ? def.value(p) : null;
  const prev    = def.prev  ? def.prev(p)  : null;
  const label   = cfg.name || cfg.label || def.label || key;
  const delta   = prev != null && val != null ? d(val, prev) : null;
  const sparkData = buildSparkSeries(instance.source, p, key, null);

  return (
    <RCard accent={teal} padding={16}>
      <Eyebrow>{label}</Eyebrow>
      <div style={{ marginTop: 6, fontFamily: T.display, fontSize: numSize, fontWeight: 800, color: fg, letterSpacing: '-0.02em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
        {fmtSingleVal(val, def.format)}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {delta != null && <RDelta value={Math.round(delta * 10) / 10}/>}
          {compareLabel && delta != null && <span style={{ fontFamily: T.body, fontSize: 10, color: muted }}>{compareLabel}</span>}
        </div>
        {sparkData && <Spark data={sparkData} color={teal} w={120} h={48}/>}
      </div>
    </RCard>
  );
}

function ChartAreaWidget({ instance, p, cfg }) {
  const reg = window.DATA_REGISTRY?.[instance.source] || {};
  const cm0 = (cfg.customMetrics || [])[0];
  if (cm0) {
    const aggVals = getAggValues(instance.source, p);
    const val = evalFormula(cm0.formula, aggVals);
    return (
      <ChartCard title={cm0.name}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 72 }}>
          <Kpi label={null} value={fmtCustomMetricVal(val, cm0.format)} delta={null} accent={teal} scale={1.6}/>
        </div>
      </ChartCard>
    );
  }
  const key = cfg.metric;
  const def = reg[key] || {};
  const series = def.series ? (def.series(p) || []) : [];
  const safeSeries = series.length >= 2 ? series : [0, 0];
  const title = cfg.name || def.label || key;
  const totalVal = def.value ? def.value(p) : null;
  const sub = totalVal != null ? `Total: ${fmtMetricVal(totalVal, def.format)}` : null;

  const n = safeSeries.length;
  const dmax = Math.max(...safeSeries) || 1;
  const dmin = Math.min(...safeSeries);
  const vw = 400, vh = 80;
  const pxF = (i) => (i / (n - 1)) * (vw - 8) + 4;
  const pyF = (v) => (vh - 6) - ((v - dmin) / (dmax - dmin || 1)) * (vh - 14);
  const linePath = safeSeries.map((v, i) => `${i === 0 ? 'M' : 'L'} ${pxF(i).toFixed(1)} ${pyF(v).toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L ${pxF(n - 1).toFixed(1)} ${vh} L ${pxF(0).toFixed(1)} ${vh} Z`;
  const gradId = `caw-${instance.id}`;

  return (
    <ChartCard title={title} sub={sub}>
      <svg viewBox={`0 0 ${vw} ${vh}`} style={{ width: '100%', display: 'block' }}>
        <defs>
          <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={teal} stopOpacity="0.28"/>
            <stop offset="100%" stopColor={teal} stopOpacity="0"/>
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#${gradId})`}/>
        <path d={linePath} fill="none" stroke={teal} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx={pxF(n - 1)} cy={pyF(safeSeries[n - 1])} r="3.5" fill={teal} stroke="#0A1222" strokeWidth="1.5"/>
      </svg>
    </ChartCard>
  );
}

function ChartBarWidget({ instance, p, cfg }) {
  const reg = window.DATA_REGISTRY?.[instance.source] || {};
  const cm0 = (cfg.customMetrics || [])[0];
  if (cm0) {
    const aggVals = getAggValues(instance.source, p);
    const val = evalFormula(cm0.formula, aggVals);
    return (
      <ChartCard title={cm0.name}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 72 }}>
          <Kpi label={null} value={fmtCustomMetricVal(val, cm0.format)} delta={null} accent={blue} scale={1.6}/>
        </div>
      </ChartCard>
    );
  }
  const key = cfg.metric;
  const def = reg[key] || {};
  const series = def.series ? (def.series(p) || []) : [];
  const safeSeries = series.length >= 2 ? series : [0, 0];
  const title = cfg.name || def.label || key;
  const totalVal = def.value ? def.value(p) : null;
  const sub = totalVal != null ? `Total: ${fmtMetricVal(totalVal, def.format)}` : null;

  const n = safeSeries.length;
  const dmax = Math.max(...safeSeries) || 1;
  const vw = 400, vh = 72;
  const gap = n > 20 ? 1 : n > 10 ? 2 : 3;
  const bw = (vw - gap * (n - 1)) / n;
  const bH = (v) => Math.max(2, (v / dmax) * (vh - 4));
  const bX = (i) => i * (bw + gap);

  return (
    <ChartCard title={title} sub={sub}>
      <svg viewBox={`0 0 ${vw} ${vh}`} style={{ width: '100%', display: 'block' }}>
        {safeSeries.map((v, i) => (
          <rect key={i}
            x={bX(i).toFixed(1)} y={(vh - bH(v) - 2).toFixed(1)} width={Math.max(1, bw).toFixed(1)} height={bH(v).toFixed(1)}
            rx={Math.min(2, bw / 2)}
            fill={blue} opacity="0.82"
          />
        ))}
      </svg>
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
                <span style={{ fontFamily: T.mono, fontSize: 11, color: sec }}>{label}</span>
              </div>
              <span style={{ fontFamily: T.mono, fontSize: 11, color: muted }}>
                {((val / total) * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
      <CustomMetricStrip instance={instance} p={p} cfg={cfg}/>
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
      <CustomMetricStrip instance={instance} p={p} cfg={cfg}/>
    </ChartCard>
  );
}

function UniversalTableWidget({ instance, p, cfg }) {
  const src          = instance.source;
  const availDims    = window.DIM_REGISTRY?.[src] || [];
  const availMetrics = window.TABLE_METRICS_REGISTRY?.[src] || [];
  const selectedDims = cfg.dimensions || availDims.slice(0, 1).map(d => d.key);
  const [gscTab, setGscTab] = React.useState('query');

  // GSC: tab-driven — tabs replace dimension selector
  if (src === 'search') {
    const GSC_TABS = [
      { key: 'query',   label: 'Queries',   rowsFn: p => p?.gsc?.queries   || [], name: 'Top Queries' },
      { key: 'page',    label: 'Pages',     rowsFn: p => p?.gsc?.pages     || [], name: 'Top Pages' },
      { key: 'country', label: 'Countries', rowsFn: p => p?.gsc?.countries || [], name: 'Countries' },
      { key: 'device',  label: 'Devices',   rowsFn: p => p?.gsc?.devices   || [], name: 'Devices' },
      { key: 'date',    label: 'Date',      rowsFn: p => p?.gsc?.dates     || [], name: 'Date' },
    ];
    const activeTab = GSC_TABS.find(t => t.key === gscTab) || GSC_TABS[0];
    const rows   = activeTab.rowsFn(p);
    const dimDef = availDims.find(d => d.key === activeTab.key);
    const tabBar = (
      <div style={{ display: 'flex', borderBottom: '1px solid var(--navy-edge)', paddingLeft: 4, overflowX: 'auto' }}>
        {GSC_TABS.map(t => (
          <button key={t.key} onClick={() => setGscTab(t.key)} style={{
            padding: '7px 14px', background: 'none', border: 'none', whiteSpace: 'nowrap',
            borderBottom: gscTab === t.key ? `2px solid ${teal}` : '2px solid transparent',
            marginBottom: -1,
            color: gscTab === t.key ? teal : sec,
            fontFamily: T.display, fontSize: 11, fontWeight: 600,
            cursor: 'pointer', transition: 'color .12s, border-color .12s',
          }}>{t.label}</button>
        ))}
      </div>
    );
    return (
      <DataTable
        widgetId={instance.id}
        widgetConfig={(() => { const { dimensions: _d, ...rest } = cfg; return rest; })()}
        rows={rows}
        availDims={dimDef ? [dimDef] : []}
        availMetrics={availMetrics}
        defaultDims={[activeTab.key]}
        defaultMetrics={cfg.metrics || availMetrics.slice(0, 4).map(m => m.key)}
        defaultName={cfg.name || activeTab.name}
        customMetrics={cfg.customMetrics || []}
        tabBar={tabBar}
      />
    );
  }

  let rows;
  if (src === 'google') {
    const filterKeys = new Set((cfg.filters || []).map(f => f.dim).filter(Boolean));
    const fKeyword   = filterKeys.has('keyword') || filterKeys.has('match_type');
    const fAdGroup   = filterKeys.has('ad_group');
    const fDevice    = filterKeys.has('device');
    const fGender    = filterKeys.has('segment_value');
    if (fDevice) {
      if (selectedDims.includes('keyword') || fKeyword) rows = p?.keywordDeviceRows || [];
      else if (selectedDims.includes('ad_group') || fAdGroup) rows = p?.adGroupDeviceRows || [];
      else                                              rows = p?.deviceRows        || [];
    } else if (fGender)                                rows = p?.genderRows        || [];
    else if (fKeyword)                                 rows = p?.keywords          || [];
    else if (fAdGroup)                                 rows = p?.adGroups          || [];
    else if (selectedDims.includes('device'))          rows = p?.deviceRows        || [];
    else if (selectedDims.includes('segment_value'))   rows = p?.genderRows        || [];
    else if (selectedDims.includes('keyword'))         rows = p?.keywords          || [];
    else if (selectedDims.includes('ad_group'))        rows = p?.adGroups          || [];
    else                                               rows = p?.campaigns         || [];
  } else if (src === 'ga4') {
    const ga4FilterKeys = new Set((cfg.filters || []).map(f => f.dim).filter(Boolean));
    const sessionKeys = new Set(['country', 'region', 'city', 'device', 'channel_group', 'medium', 'source']);
    const fGa4Gender   = selectedDims.includes('gender')    || ga4FilterKeys.has('gender');
    const fGa4Page     = selectedDims.includes('page_path') || ga4FilterKeys.has('page_path');
    const fGa4Session  = selectedDims.some(d => sessionKeys.has(d)) || [...ga4FilterKeys].some(k => sessionKeys.has(k));
    if      (fGa4Gender)   rows = p?.ga4DemoRows    || [];
    else if (fGa4Page)     rows = p?.ga4PageRows    || [];
    else if (fGa4Session)  rows = p?.ga4SessionRows || [];
    else                   rows = p?.ga4Rows        || [];
  } else {
    rows = (window.TABLE_DATA_REGISTRY?.[src] || (() => []))(p) || [];
  }

  return (
    <DataTable
      widgetId={instance.id}
      widgetConfig={cfg}
      rows={rows}
      availDims={availDims}
      availMetrics={availMetrics}
      defaultDims={selectedDims}
      defaultMetrics={cfg.metrics || availMetrics.slice(0, 5).map(m => m.key)}
      defaultName={cfg.name || 'Data Table'}
      customMetrics={cfg.customMetrics || []}
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

// ─── Paste sanitizer: keeps bold/italic/underline, strips source styling ──
function sanitizePastedHTML(html, allowLists) {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  function isBold(st) { const v = st.fontWeight || ''; return v === 'bold' || v === 'bolder' || parseInt(v, 10) >= 600; }
  function isItalic(st) { const v = st.fontStyle || ''; return v === 'italic' || v === 'oblique'; }
  function isUnder(st) { return (st.textDecoration || st.textDecorationLine || '').includes('underline'); }
  function applyStyles(inner, st) {
    if (isUnder(st)) inner = `<u>${inner}</u>`;
    if (isItalic(st)) inner = `<i>${inner}</i>`;
    if (isBold(st)) inner = `<b>${inner}</b>`;
    return inner;
  }
  function clean(node) {
    if (node.nodeType === 3) return node.textContent;
    if (node.nodeType !== 1) return '';
    const tag = node.tagName.toLowerCase();
    // Drop metadata / non-content elements entirely (macOS Pages/Notes put <style> in clipboard)
    if (['style','script','head','meta','link','title','noscript','svg','img'].includes(tag)) return '';
    const st  = node.style || {};
    let inner = Array.from(node.childNodes).map(clean).join('');
    if (['b', 'strong'].includes(tag)) {
      // Only strip bold if the inline style EXPLICITLY says non-bold (Google Docs wrapper fix).
      // Do NOT strip for CSS variables or unrecognised values — parseInt returns NaN for those,
      // which would cause isBold() to return false and wrongly eat the <b>/<strong>.
      const fw = st.fontWeight || '';
      const numFw = parseInt(fw, 10);
      const explicitNonBold = fw === 'normal' || fw === 'lighter' || (!isNaN(numFw) && numFw < 600);
      if (explicitNonBold) return applyStyles(inner, st);
      return `<b>${inner}</b>`;
    }
    if (['i', 'em'].includes(tag)) {
      // Only strip italic if the inline style explicitly says 'normal'
      if (st.fontStyle === 'normal') return applyStyles(inner, st);
      inner = `<i>${inner}</i>`;
      if (isBold(st)) inner = `<b>${inner}</b>`;
      if (isUnder(st)) inner = `<u>${inner}</u>`;
      return inner;
    }
    if (tag === 'u') {
      inner = `<u>${inner}</u>`;
      if (isBold(st)) inner = `<b>${inner}</b>`;
      if (isItalic(st)) inner = `<i>${inner}</i>`;
      return inner;
    }
    // All other elements: apply inline formatting (covers span, div, p, h1-h6, etc.)
    inner = applyStyles(inner, st);
    if (allowLists && ['ul', 'ol', 'li'].includes(tag)) return `<${tag}>${inner}</${tag}>`;
    if (tag === 'br') return allowLists ? '<br>' : ' ';
    if (['p','div','h1','h2','h3','h4','h5','h6','blockquote','section','article','header','li'].includes(tag))
      return inner + (inner.trim() ? ' ' : '');
    return inner;
  }
  return clean(tmp).trim().replace(/  +/g, ' ');
}

// Insert sanitized HTML at the cursor using direct DOM manipulation.
// Avoids execCommand('insertHTML') (deprecated, strips tags in some browsers) and
// createContextualFragment (can sanitize based on context, may block <b>/<i>).
function insertRichHTML(html) {
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return;
  const range = sel.getRangeAt(0);
  range.deleteContents();
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  const frag = document.createDocumentFragment();
  let last = null;
  while (tmp.firstChild) { last = tmp.firstChild; frag.appendChild(last); }
  range.insertNode(frag);
  if (last) {
    const r = document.createRange();
    r.setStartAfter(last);
    r.collapse(true);
    sel.removeAllRanges();
    sel.addRange(r);
  }
}

// ─── Editable narrative widget renderers ──────────────────────────
function NarrativeHeroWidget({ cfg, widgetId, onConfigChange, isEditing }) {
  const [editCell, setEditCell] = React.useState(null);
  const editorRef          = React.useRef(null); // body contenteditable
  const headlineRef        = React.useRef(null); // headline contenteditable
  const switchingRef       = React.useRef(false); // suppress onBlur commit when switching fields
  const onConfigChangeRef  = React.useRef(onConfigChange);
  React.useEffect(() => { onConfigChangeRef.current = onConfigChange; }, [onConfigChange]);

  const fs = cfg.fontSize || 'M';
  const headlinePx = { S: 16, M: 22, L: 30 }[fs] || 22;
  const bodyPx     = { S: 11, M: 12.5, L: 14 }[fs] || 12.5;
  const blocks = cfg.blocks && cfg.blocks.length
    ? cfg.blocks
    : [{ headline: cfg.title || 'Marketing performance up 19.7%', body: cfg.body || 'Conversions increased as budget shifted to Google Ads. Organic SEO grew 8.1% with no additional spend.', headlineColor: '', bodyColor: '' }];

  React.useEffect(() => {
    if (!isEditing) {
      const cb = onConfigChangeRef.current;
      if (editCell && cb && widgetId) {
        const ref = editCell.field === 'body' ? editorRef : headlineRef;
        if (ref.current) {
          const raw = ref.current.innerHTML || '';
          const value = editCell.field === 'body'
            ? raw.replace(/(<(div|p|li)[^>]*>\s*(<br\s*\/?>\s*)?<\/(div|p|li)>\s*)+$/, '').trim()
            : raw.replace(/<\/?div[^>]*>/gi, '').replace(/<\/?p[^>]*>/gi, '').replace(/<br\s*\/?>/gi, ' ').trim();
          const next = blocks.map((b, j) => j === editCell.bi ? { ...b, [editCell.field]: value } : b);
          cb(widgetId, { blocks: next });
        }
      }
      setEditCell(null);
    }
  }, [isEditing]); // eslint-disable-line react-hooks/exhaustive-deps

  // Broadcast active field to card-editor.jsx via custom event (no prop drilling needed).
  // Only clear activeField when widget is deselected (isEditing=false). When editCell=null but
  // isEditing=true (e.g. user clicked away from a contenteditable), keep the last activeField
  // so color swatches stay visible long enough for the swatch click to register.
  React.useEffect(() => {
    if (!isEditing) {
      window.dispatchEvent(new CustomEvent('narrativeHeroFocus', { detail: null }));
    } else if (editCell) {
      window.dispatchEvent(new CustomEvent('narrativeHeroFocus', {
        detail: { bi: editCell.bi, field: editCell.field },
      }));
    }
    // editCell=null but isEditing=true: don't dispatch — keep last activeField in card-editor
  }, [editCell?.bi, editCell?.field, isEditing]); // eslint-disable-line react-hooks/exhaustive-deps

  // Enter key: when widget is selected but not yet in edit mode, start editing block 0 headline
  React.useEffect(() => {
    if (!isEditing || editCell) return;
    const handleKey = (e) => {
      if (e.key !== 'Enter') return;
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.contentEditable === 'true') return;
      e.preventDefault();
      startEdit(0, 'headline');
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isEditing, editCell]); // eslint-disable-line react-hooks/exhaustive-deps

  // Initialize the active field's contenteditable whenever editCell changes
  React.useEffect(() => {
    if (!editCell) return;
    const ref = editCell.field === 'body' ? editorRef : headlineRef;
    if (!ref.current) return;
    const raw = blocks[editCell.bi]?.[editCell.field] || '';
    ref.current.innerHTML = editCell.field === 'headline' ? highlightNumsHtml(raw) : raw;
    ref.current.focus();
    const sel = window.getSelection();
    if (sel) {
      const range = document.createRange();
      range.selectNodeContents(ref.current);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }, [editCell?.bi, editCell?.field]); // eslint-disable-line react-hooks/exhaustive-deps

  const cleanBodyHTML = (html) =>
    html.replace(/(<(div|p|li)[^>]*>\s*(<br\s*\/?>\s*)?<\/(div|p|li)>\s*)+$/, '').trim();

  // Strip block-level browser wrappers from headline (div, p, br) but keep inline formatting
  const cleanHeadlineHTML = (html) =>
    html.replace(/<\/?div[^>]*>/gi, '').replace(/<\/?p[^>]*>/gi, '').replace(/<br\s*\/?>/gi, ' ').trim();

  const readValue = () => {
    if (!editCell) return '';
    if (editCell.field === 'body') return cleanBodyHTML(editorRef.current?.innerHTML || '');
    return cleanHeadlineHTML(headlineRef.current?.innerHTML || '');
  };

  const startEdit = (bi, field) => {
    if (!isEditing) return;
    // If switching fields: save current content first, suppress the onBlur commit
    if (editCell && !(editCell.bi === bi && editCell.field === field)) {
      switchingRef.current = true;
      if (onConfigChange) {
        const curValue = readValue();
        const next = blocks.map((b, j) => j === editCell.bi ? { ...b, [editCell.field]: curValue } : b);
        onConfigChange(widgetId, { blocks: next });
      }
    }
    setEditCell({ bi, field });
  };

  const commit = () => {
    if (switchingRef.current) { switchingRef.current = false; return; }
    if (!editCell || !onConfigChange) { setEditCell(null); return; }
    const value = readValue();
    const next = blocks.map((b, i) => i === editCell.bi ? { ...b, [editCell.field]: value } : b);
    onConfigChange(widgetId, { blocks: next });
    setEditCell(null);
  };

  const handleKeyDown = (field) => (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault();
      return; // do NOT stopPropagation — window undo handler fires
    }
    e.stopPropagation();
    if (e.key === 'Escape') { setEditCell(null); return; }
    if (field === 'headline' && e.key === 'Enter') { e.preventDefault(); commit(); return; }
    if (field === 'headline' && e.key === 'Tab') { e.preventDefault(); startEdit(editCell.bi, 'body'); return; }
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b') { e.preventDefault(); document.execCommand('bold'); }
      if (e.key === 'i') { e.preventDefault(); document.execCommand('italic'); }
      if (e.key === 'u') { e.preventDefault(); document.execCommand('underline'); }
    }
  };

  const highlightNums = (text) => {
    if (!text) return '';
    return text.split(/(\d[\d.,]*(?:[%x])?)/).map((p, i) =>
      /^\d[\d.,]*(?:[%x])?$/.test(p) ? <span key={i} style={{ color: '#F8B400' }}>{p}</span> : p
    );
  };

  // HTML-string version of highlightNums — used to init the contenteditable so numbers show gold while typing.
  // Skipped if text already contains HTML tags (bold/italic spans) to avoid nesting issues.
  const highlightNumsHtml = (text) => {
    if (!text || /<[a-z]/i.test(text)) return text;
    return text.replace(/(\d[\d.,]*(?:[%x])?)/g, '<span style="color:#F8B400">$1</span>');
  };

  // Render headline: use dangerouslySetInnerHTML when it contains inline HTML (b/i/u/strong/em/span)
  // Block-level wrappers (div/p) are stripped at commit time so will never appear here
  const renderHeadline = (block) => {
    if (!block.headline) return null;
    return /<(b|i|u|strong|em|span)\b/i.test(block.headline)
      ? <span dangerouslySetInnerHTML={{ __html: block.headline }}/>
      : highlightNums(block.headline);
  };

  // onClick fires after React re-renders from first click (isEditing flush), enabling double-click entry
  const editClick = (bi, field) => isEditing
    ? { onClick: e => { e.stopPropagation(); startEdit(bi, field); } }
    : {};

  // Stop drag-canvas from consuming pointer events inside widget content areas
  const stopDrag = isEditing ? { onPointerDown: e => e.stopPropagation() } : {};

  return (
    <RCard padding={24} style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg,rgba(0,194,184,.06),rgba(248,180,0,.04))' }}>
      <div style={{ position: 'absolute', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle,rgba(248,180,0,.18),transparent 70%)', filter: 'blur(60px)', top: -120, right: -60 }}/>
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 0 }}>
        {blocks.map((block, i) => {
          const accentColor = block.headlineColor || '#00C2B8';
          const isEditH = editCell?.bi === i && editCell?.field === 'headline';
          const isEditB = editCell?.bi === i && editCell?.field === 'body';
          const bodyStyle = { fontFamily: T.body, fontSize: bodyPx, color: block.bodyColor || sec, lineHeight: 1.7 };
          return (
            <React.Fragment key={i}>
              {i > 0 && <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '16px 0' }}/>}
              <div
                style={{ borderLeft: `3px solid ${accentColor}`, paddingLeft: 14, cursor: isEditing ? 'text' : 'default' }}
                {...(isEditing ? {
                  onPointerDown: e => e.stopPropagation(),
                  onClick: e => { e.stopPropagation(); startEdit(i, isEditB ? 'body' : 'headline'); },
                } : {})}
              >
                {isEditH ? (
                  <div
                    key={`edit-h-${i}`}
                    ref={headlineRef}
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={() => { if (!document.hasFocus()) return; commit(); }}
                    onKeyDown={handleKeyDown('headline')}
                    onPaste={e => { e.preventDefault(); const h = e.clipboardData.getData('text/html'); insertRichHTML((h ? sanitizePastedHTML(h, false) : '') || e.clipboardData.getData('text/plain')); }}
                    onPointerDown={e => e.stopPropagation()}
                    onClick={e => e.stopPropagation()}
                    style={{ outline: 'none', fontFamily: T.display, fontSize: headlinePx, fontWeight: 700, letterSpacing: '-0.02em', color: block.headlineColor || fg, lineHeight: 1.2, borderBottom: '1px solid rgba(255,255,255,0.25)', paddingBottom: 2, minHeight: headlinePx * 1.4, wordBreak: 'break-word' }}
                  />
                ) : (
                  <div
                    key={`display-h-${i}`}
                    {...editClick(i, 'headline')}
                    {...stopDrag}
                    style={{ fontFamily: T.display, fontSize: headlinePx, fontWeight: 700, letterSpacing: '-0.02em', color: block.headlineColor || fg, lineHeight: 1.2, cursor: isEditing ? 'text' : 'default', minHeight: headlinePx * 1.4 }}>
                    {block.headline
                      ? renderHeadline(block)
                      : isEditing && <span style={{ opacity: 0.28, fontStyle: 'italic', fontWeight: 400, fontSize: headlinePx * 0.65 }}>Click to add headline…</span>
                    }
                  </div>
                )}
                {isEditB ? (
                  <div
                    key={`edit-b-${i}`}
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={() => { if (!document.hasFocus()) return; commit(); }}
                    onKeyDown={handleKeyDown('body')}
                    onPaste={e => { e.preventDefault(); const h = e.clipboardData.getData('text/html'); insertRichHTML((h ? sanitizePastedHTML(h, true) : '') || e.clipboardData.getData('text/plain')); }}
                    onPointerDown={e => e.stopPropagation()}
                    onClick={e => e.stopPropagation()}
                    style={{ minHeight: 80, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, outline: 'none', padding: '8px 10px', marginTop: 8, fontFamily: T.body, fontSize: bodyPx, color: block.bodyColor || sec, lineHeight: 1.7, wordBreak: 'break-word' }}
                  />
                ) : (
                  <div
                    key={`display-b-${i}`}
                    {...editClick(i, 'body')}
                    {...stopDrag}
                    style={{ cursor: isEditing ? 'text' : 'default', minHeight: isEditing ? 40 : undefined, paddingBottom: isEditing ? 8 : undefined }}>
                    {block.body
                      ? <div style={bodyStyle} dangerouslySetInnerHTML={{ __html: block.body }}/>
                      : isEditing && <p style={{ ...bodyStyle, margin: '8px 0 0', opacity: 0.3, fontStyle: 'italic', padding: 0 }}>Click to add body…</p>
                    }
                  </div>
                )}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </RCard>
  );
}

function NarrativeNoteWidget({ cfg, widgetId, onConfigChange, isEditing }) {
  const [editCell, setEditCell] = React.useState(null);
  const [editEyebrow, setEditEyebrow] = React.useState(false);
  const titleRef         = React.useRef(null);
  const bodyRef          = React.useRef(null);
  const eyebrowRef       = React.useRef(null);
  const switchingRef     = React.useRef(false);
  const onConfigChangeRef = React.useRef(onConfigChange);
  React.useEffect(() => { onConfigChangeRef.current = onConfigChange; }, [onConfigChange]);

  const fs = cfg.fontSize || 'M';
  const titlePx = { S: 11, M: 12.5, L: 14 }[fs] || 12.5;
  const bodyPx  = { S: 10.5, M: 11.5, L: 13 }[fs] || 11.5;

  const beatCount = Math.min(6, Math.max(2, cfg.beatCount || 3));
  const beatDefaults = [
    { title: 'What happened',  body: 'Total spend up 12.4% MoM, offset by a 19.7% increase in conversions.' },
    { title: 'Why it matters', body: 'Google Ads remains the largest ROAS contributor (4.1x). SEO grew with no additional budget.' },
    { title: 'Next action',    body: 'Shift 15% of retargeting budget to Google Ads brand awareness for Q2.' },
    { title: 'Insight 4', body: '' },
    { title: 'Insight 5', body: '' },
    { title: 'Insight 6', body: '' },
  ];
  const beats = Array.from({ length: beatCount }, (_, i) => ({
    title:      cfg[`beat${i + 1}_title`]      || beatDefaults[i].title,
    body:       cfg[`beat${i + 1}_body`]       || beatDefaults[i].body,
    titleColor: cfg[`beat${i + 1}_titleColor`] || '',
    bodyColor:  cfg[`beat${i + 1}_bodyColor`]  || '',
  }));

  React.useEffect(() => {
    if (!isEditing) {
      const cb = onConfigChangeRef.current;
      // Flush any in-progress contenteditable edit before clearing state.
      // At this point editCell is still set and the contenteditable is still in the DOM.
      if (editCell && cb && widgetId) {
        const ref = editCell.field === 'body' ? bodyRef : titleRef;
        if (ref.current) {
          const raw = ref.current.innerHTML || '';
          const value = editCell.field === 'body'
            ? raw.replace(/(<(div|p|li)[^>]*>\s*(<br\s*\/?>\s*)?<\/(div|p|li)>\s*)+$/, '').trim()
            : raw.replace(/<\/?div[^>]*>/gi, '').replace(/<\/?p[^>]*>/gi, '').replace(/<br\s*\/?>/gi, ' ').trim();
          cb(widgetId, { [`beat${editCell.bi + 1}_${editCell.field}`]: value });
        }
      }
      if (editEyebrow && cb && widgetId && eyebrowRef.current) {
        cb(widgetId, { name: eyebrowRef.current.textContent?.trim() || '' });
      }
      setEditCell(null);
      setEditEyebrow(false);
    }
  }, [isEditing]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    if (!editEyebrow || !eyebrowRef.current) return;
    eyebrowRef.current.textContent = cfg.name || '';
    eyebrowRef.current.focus();
    const sel = window.getSelection();
    if (sel) {
      const range = document.createRange();
      range.selectNodeContents(eyebrowRef.current);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }, [editEyebrow]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    if (!isEditing) {
      window.dispatchEvent(new CustomEvent('narrativeNoteFocus', { detail: null }));
    } else if (editCell) {
      window.dispatchEvent(new CustomEvent('narrativeNoteFocus', {
        detail: { bi: editCell.bi, field: editCell.field },
      }));
    }
  }, [editCell?.bi, editCell?.field, isEditing]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    if (!editCell) return;
    const ref = editCell.field === 'body' ? bodyRef : titleRef;
    if (!ref.current) return;
    const raw = beats[editCell.bi]?.[editCell.field] || '';
    ref.current.innerHTML = editCell.field === 'title' ? highlightNumsHtml(raw) : raw;
    ref.current.focus();
    const sel = window.getSelection();
    if (sel) {
      const range = document.createRange();
      range.selectNodeContents(ref.current);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }, [editCell?.bi, editCell?.field]); // eslint-disable-line react-hooks/exhaustive-deps

  const highlightNumsHtml = (text) => {
    if (!text || /<[a-z]/i.test(text)) return text;
    return text.replace(/(\d[\d.,]*(?:[%x])?)/g, '<span style="color:#F8B400">$1</span>');
  };

  const cleanBodyHTML = (html) =>
    html.replace(/(<(div|p|li)[^>]*>\s*(<br\s*\/?>\s*)?<\/(div|p|li)>\s*)+$/, '').trim();

  const cleanTitleHTML = (html) =>
    html.replace(/<\/?div[^>]*>/gi, '').replace(/<\/?p[^>]*>/gi, '').replace(/<br\s*\/?>/gi, ' ').trim();

  const readValue = () => {
    if (!editCell) return '';
    if (editCell.field === 'body') return cleanBodyHTML(bodyRef.current?.innerHTML || '');
    return cleanTitleHTML(titleRef.current?.innerHTML || '');
  };

  const startEdit = (bi, field) => {
    if (!isEditing) return;
    if (editCell && !(editCell.bi === bi && editCell.field === field)) {
      switchingRef.current = true;
      if (onConfigChange) {
        const curValue = readValue();
        onConfigChange(widgetId, { [`beat${editCell.bi + 1}_${editCell.field}`]: curValue });
      }
    }
    setEditCell({ bi, field });
  };

  const commit = () => {
    if (switchingRef.current) { switchingRef.current = false; return; }
    if (!editCell || !onConfigChange) { setEditCell(null); return; }
    const value = readValue();
    onConfigChange(widgetId, { [`beat${editCell.bi + 1}_${editCell.field}`]: value });
    setEditCell(null);
  };

  const handleKeyDown = (field) => (e) => {
    // Let Ctrl+Z / Ctrl+Shift+Z bubble to the window-level undo handler
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault(); // suppress native contenteditable undo
      return;             // do NOT stopPropagation — window handler fires
    }
    e.stopPropagation();
    if (e.key === 'Escape') { setEditCell(null); return; }
    if (field === 'title' && e.key === 'Enter') { e.preventDefault(); commit(); return; }
    if (field === 'title' && e.key === 'Tab') { e.preventDefault(); startEdit(editCell.bi, 'body'); return; }
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b') { e.preventDefault(); document.execCommand('bold'); }
      if (e.key === 'i') { e.preventDefault(); document.execCommand('italic'); }
      if (e.key === 'u') { e.preventDefault(); document.execCommand('underline'); }
    }
  };

  const highlightNums = (text) => {
    if (!text) return '';
    return text.split(/(\d[\d.,]*(?:[%x])?)/).map((part, i) =>
      /^\d[\d.,]*(?:[%x])?$/.test(part) ? <span key={i} style={{ color: '#F8B400' }}>{part}</span> : part
    );
  };

  const renderTitle = (beat) => {
    if (!beat.title) return null;
    return /<(b|i|u|strong|em|span)\b/i.test(beat.title)
      ? <span dangerouslySetInnerHTML={{ __html: beat.title }}/>
      : highlightNums(beat.title);
  };

  const eyebrow = cfg.name || 'Analyst note';

  return (
    <RCard padding={16} style={{ background: 'linear-gradient(135deg,rgba(0,194,184,.04),rgba(248,180,0,.02))' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}
        {...(isEditing ? { onPointerDown: e => e.stopPropagation() } : {})}
      >
        <div style={{ width: 22, height: 22, background: 'rgba(0,194,184,.14)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="12" height="12" fill="none" stroke={teal} strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </div>
        {editEyebrow ? (
          <div
            ref={eyebrowRef}
            contentEditable
            suppressContentEditableWarning
            onBlur={() => {
              if (!document.hasFocus()) return;
              if (onConfigChange) onConfigChange(widgetId, { name: eyebrowRef.current?.textContent?.trim() || '' });
              setEditEyebrow(false);
            }}
            onKeyDown={e => {
              e.stopPropagation();
              if (e.key === 'Escape' || e.key === 'Enter') { e.preventDefault(); eyebrowRef.current?.blur(); }
            }}
            onPaste={e => { e.preventDefault(); document.execCommand('insertText', false, e.clipboardData.getData('text/plain')); }}
            onPointerDown={e => e.stopPropagation()}
            onClick={e => e.stopPropagation()}
            style={{ outline: 'none', fontFamily: T.mono, fontSize: 9.5, fontWeight: 600, color: teal, textTransform: 'uppercase', letterSpacing: '0.12em', borderBottom: '1px solid rgba(0,194,184,0.4)', minWidth: 40 }}
          />
        ) : (
          <div
            onClick={isEditing ? e => { e.stopPropagation(); setEditEyebrow(true); } : undefined}
            onPointerDown={isEditing ? e => e.stopPropagation() : undefined}
            style={{ fontFamily: T.mono, fontSize: 9.5, color: teal, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600, cursor: isEditing ? 'text' : 'default' }}>
            {eyebrow || (isEditing
              ? <span style={{ opacity: 0.28, fontStyle: 'italic', textTransform: 'none' }}>Click to add label…</span>
              : null)}
          </div>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: beatCount === 2 ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: 14 }}>
        {beats.map((beat, i) => {
          const isEditT = editCell?.bi === i && editCell?.field === 'title';
          const isEditB = editCell?.bi === i && editCell?.field === 'body';
          const accentColor = beat.titleColor || teal;
          return (
            <div key={i}
              style={{ cursor: isEditing ? 'text' : 'default' }}
              {...(isEditing ? { onPointerDown: e => e.stopPropagation() } : {})}
            >
              {isEditT ? (
                <div
                  key={`edit-t-${i}`}
                  ref={titleRef}
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={() => { if (!document.hasFocus()) return; commit(); }}
                  onKeyDown={handleKeyDown('title')}
                  onPaste={e => { e.preventDefault(); const h = e.clipboardData.getData('text/html'); insertRichHTML((h ? sanitizePastedHTML(h, false) : '') || e.clipboardData.getData('text/plain')); }}
                  onPointerDown={e => e.stopPropagation()}
                  onClick={e => e.stopPropagation()}
                  style={{ outline: 'none', fontFamily: T.display, fontSize: titlePx, fontWeight: 700, color: beat.titleColor || fg, lineHeight: 1.3, borderBottom: '1px solid rgba(255,255,255,0.25)', paddingBottom: 2, minHeight: titlePx * 1.4, wordBreak: 'break-word' }}
                />
              ) : (
                <div
                  key={`display-t-${i}`}
                  onClick={isEditing ? (e => { e.stopPropagation(); startEdit(i, 'title'); }) : undefined}
                  onPointerDown={isEditing ? (e => e.stopPropagation()) : undefined}
                  style={{ fontFamily: T.display, fontSize: titlePx, fontWeight: 700, color: beat.titleColor || fg, lineHeight: 1.3, cursor: isEditing ? 'text' : 'default', minHeight: titlePx * 1.4 }}>
                  {beat.title
                    ? renderTitle(beat)
                    : isEditing && <span style={{ opacity: 0.28, fontStyle: 'italic', fontWeight: 400, fontSize: titlePx * 0.85 }}>Click to add title…</span>
                  }
                </div>
              )}
              <div style={{ height: 2, background: accentColor, margin: '6px 0' }}/>
              {isEditB ? (
                <div
                  key={`edit-b-${i}`}
                  ref={bodyRef}
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={() => { if (!document.hasFocus()) return; commit(); }}
                  onKeyDown={handleKeyDown('body')}
                  onPaste={e => { e.preventDefault(); const h = e.clipboardData.getData('text/html'); insertRichHTML((h ? sanitizePastedHTML(h, true) : '') || e.clipboardData.getData('text/plain')); }}
                  onPointerDown={e => e.stopPropagation()}
                  onClick={e => e.stopPropagation()}
                  style={{ minHeight: 56, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, outline: 'none', padding: '6px 8px', marginTop: 0, fontFamily: T.body, fontSize: bodyPx, color: beat.bodyColor || sec, lineHeight: 1.5, wordBreak: 'break-word' }}
                />
              ) : (
                <div
                  key={`display-b-${i}`}
                  onClick={isEditing ? (e => { e.stopPropagation(); startEdit(i, 'body'); }) : undefined}
                  onPointerDown={isEditing ? (e => e.stopPropagation()) : undefined}
                  style={{ cursor: isEditing ? 'text' : 'default', minHeight: isEditing ? 32 : undefined }}>
                  {beat.body
                    ? <div style={{ fontFamily: T.body, fontSize: bodyPx, color: beat.bodyColor || sec, lineHeight: 1.5 }} dangerouslySetInnerHTML={{ __html: beat.body }}/>
                    : isEditing && <p style={{ fontFamily: T.body, fontSize: bodyPx, color: sec, lineHeight: 1.5, margin: 0, opacity: 0.3, fontStyle: 'italic', padding: 0 }}>Click to add body…</p>
                  }
                </div>
              )}
            </div>
          );
        })}
      </div>
    </RCard>
  );
}

function NarrativeCalloutWidget({ cfg }) {
  const title = cfg.title || '3 pages could reach top-3';
  const body  = cfg.body  || 'Pages ranked #4–#7 can be lifted with internal linking and backlinks.';
  const cta   = cfg.cta   || 'Create action plan →';
  return (
    <RCard padding={16} style={{ borderLeft: `3px solid ${gold}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div style={{ width: 22, height: 22, background: 'rgba(248,180,0,.14)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="12" height="12" fill="none" stroke={gold} strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2l2.35 7.24h7.61l-6.16 4.47 2.35 7.24L12 16.48l-6.16 4.47 2.35-7.24L2.04 9.24h7.61z"/></svg>
        </div>
        <Eyebrow color={gold}>Opportunity</Eyebrow>
      </div>
      <div style={{ fontFamily: T.display, fontSize: 15, fontWeight: 700, color: fg, lineHeight: 1.3 }}>{title}</div>
      {body && <p style={{ fontFamily: T.body, fontSize: 11.5, color: sec, margin: '6px 0 0', lineHeight: 1.5 }}>{body}</p>}
      <button style={{ marginTop: 10, padding: '7px 12px', background: `linear-gradient(135deg,${gold},#FFCA3A)`, color: '#0C182C', border: 'none', borderRadius: 8, fontFamily: T.display, fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}>{cta}</button>
    </RCard>
  );
}

function NarrativeQuoteWidget({ cfg }) {
  const quote  = cfg.quote  || '"Monthly reports are now prepared much faster. The client team gets insights right away."';
  const author = cfg.author || 'Dimas Pratama';
  const role   = cfg.role   || 'Client · PT Kopi Senja Nusantara';
  const initials = (author || '').split(' ').slice(0,2).map(w => w[0] || '').join('').toUpperCase() || 'DP';
  return (
    <RCard padding={18}>
      <svg width="22" height="16" viewBox="0 0 22 16" fill={teal} style={{ opacity: 0.5 }}><path d="M0 16V8c0-4.4 3.6-8 8-8v3c-2.8 0-5 2.2-5 5h5v8H0zm12 0V8c0-4.4 3.6-8 8-8v3c-2.8 0-5 2.2-5 5h5v8h-8z"/></svg>
      <p style={{ fontFamily: T.body, fontSize: 13, color: fg, margin: '10px 0 12px', lineHeight: 1.55, fontWeight: 500 }}>{quote}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#00C2B8,#7000FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.display, fontWeight: 700, fontSize: 12, color: '#0C182C' }}>{initials}</div>
        <div>
          <div style={{ fontFamily: T.display, fontSize: 12, fontWeight: 700, color: fg }}>{author}</div>
          <div style={{ fontFamily: T.mono, fontSize: 10, color: muted }}>{role}</div>
        </div>
      </div>
    </RCard>
  );
}

function UniversalWidget({ instance, p, widgetConfig, editState, psiUrl, psiApiKey, savePsiApiKey }) {
  const src  = instance.source;
  const type = instance.type;
  const cfg  = window.getWidgetCfg ? window.getWidgetCfg(type, src, widgetConfig) : (widgetConfig || {});
  const pf   = applyKpiFilters(p, src, cfg.filters);

  const inner = (() => {
    switch (type) {
      case 'kpi-strip':    return <KpiStripWidget    instance={instance} p={pf} cfg={cfg}/>;
      case 'single-stat':  return <SingleStatWidget  instance={instance} p={pf} cfg={cfg}/>;
      case 'chart-area':   return <ChartAreaWidget   instance={instance} p={pf} cfg={cfg}/>;
      case 'chart-bar':    return <ChartBarWidget    instance={instance} p={pf} cfg={cfg}/>;
      case 'chart-donut':  return <ChartDonutWidget  instance={instance} p={pf} cfg={cfg}/>;
      case 'chart-heatmap':return <ChartHeatmapWidget instance={instance} p={pf} cfg={cfg}/>;
      case 'table':             return <UniversalTableWidget  instance={instance} p={p} cfg={cfg}/>;
      case 'text':              return <TextWidget            cfg={cfg}/>;
      case 'narrative-hero':    return <NarrativeHeroWidget   cfg={cfg} widgetId={instance.id} isEditing={editState?.selected?.includes(instance.id)} onConfigChange={editState?.onConfigChange}/>;
      case 'narrative-note':    return <NarrativeNoteWidget   cfg={cfg} widgetId={instance.id} isEditing={editState?.selected?.includes(instance.id)} onConfigChange={editState?.onConfigChange}/>;
      case 'narrative-callout': return <NarrativeCalloutWidget cfg={cfg}/>;
      case 'narrative-quote':   return <NarrativeQuoteWidget  cfg={cfg}/>;
      case 'kpi-compare': {
        const cardDef = (window.CARDS || []).find(c => c.id === 'kpi-compare');
        if (!cardDef?.render) return null;
        const cm0 = (cfg.customMetrics || [])[0];
        let overrideProps = {};
        if (cm0) {
          const aggCur  = getAggValues(instance.source, pf);
          const aggPrev = getAggValuesPrev(instance.source, pf);
          overrideProps = {
            overrideLabel:      cm0.name,
            overrideCurrentVal: evalFormula(cm0.formula, aggCur),
            overridePrevVal:    evalFormula(cm0.formula, aggPrev),
            overrideFormat:     cm0.format,
          };
        }
        return React.createElement(cardDef.render, { instance, p: pf, cfg, ...overrideProps });
      }
      case 'progress-psi': {
        const cardDef = (window.CARDS || []).find(c => c.id === 'progress-psi');
        if (cardDef?.render) return React.createElement(cardDef.render, { p: pf, cfg, psiUrl, psiApiKey, savePsiApiKey, isEditor: !!editState });
        return null;
      }
      default: {
        const cardDef = (window.CARDS || []).find(c => c.id === type);
        if (cardDef?.render) return React.createElement(cardDef.render, { cfg });
        return <div style={{ padding: 20, color: muted, fontFamily: T.mono, fontSize: 11 }}>Unknown type: {type}</div>;
      }
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
        <ChartCard title={wn('google-clicks') || "Click Volume · Pacing"} sub="This month vs target">
          <MiniBar data={safeClicks} w={300} h={72} color={blue} activeUntil={paceIdx}/>
        </ChartCard>
      </SelectableWidget>
    );

    map['google-budget'] = (
      <SelectableWidget id="google-budget" cardId="chart-donut" editState={editState}>
        <ChartCard title={wn('google-budget') || "Budget by Campaign Type"}>
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
                    <span style={{ fontFamily: T.mono, fontSize: 11, color: sec }}>{ch.name}</span>
                  </div>
                  <span style={{ fontFamily: T.mono, fontSize: 11, color: muted }}>
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
            rows={campaigns} availDims={window.DIM_REGISTRY?.google || []} availMetrics={window.TABLE_METRICS_REGISTRY?.google || []}
            defaultDims={['name']} defaultMetrics={['spend','clicks','impressions','ctr','cpa']}
            defaultName="Campaigns · Google Ads"/>
        </SelectableWidget>
      );
    }

    if (p.adGroups && p.adGroups.length > 0) {
      map['google-adgroups'] = (
        <SelectableWidget id="google-adgroups" cardId="table-campaigns" editState={editState}>
          <DataTable widgetId="google-adgroups" widgetConfig={wcfg('google-adgroups')}
            rows={p.adGroups} availDims={window.DIM_REGISTRY?.google || []} availMetrics={window.TABLE_METRICS_REGISTRY?.google || []}
            defaultDims={['ad_group','name']} defaultMetrics={['spend','clicks','ctr','cpa']}
            defaultName="Ad Groups · Google Ads"/>
        </SelectableWidget>
      );
    }

    if (p.keywords && p.keywords.length > 0) {
      map['google-keywords'] = (
        <SelectableWidget id="google-keywords" cardId="table-campaigns" editState={editState}>
          <DataTable widgetId="google-keywords" widgetConfig={wcfg('google-keywords')}
            rows={p.keywords} availDims={window.DIM_REGISTRY?.google || []} availMetrics={window.TABLE_METRICS_REGISTRY?.google || []}
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
          <ChartCard title={wn('meta-donut') || "Impressions by Ad Type"}>
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
                      <span style={{ fontFamily: T.mono, fontSize: 11, color: sec }}>{ch.name}</span>
                    </div>
                    <span style={{ fontFamily: T.mono, fontSize: 11, color: muted }}>
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
      : [ga4.total_users];
    const safeConv = (series.conversions || []).length >= 2 ? series.conversions : [0, 0];
    const safeA7 = safeA.slice(-7);

    const pagesPerSession = ga4.sessions > 0 ? (ga4.event_count / ga4.sessions) : 0;
    const engageRate      = ga4.sessions > 0 ? (ga4.engaged_sessions / ga4.sessions) * 100 : 0;

    map['ga4-kpi'] = (
      <SelectableWidget id="ga4-kpi" cardId="kpi-strip" editState={editState}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
          <Kpi label="Sessions"          value={fmt.num(ga4.sessions)}  delta={d(ga4.sessions, ga4Prev.sessions)}   accent={gold} spark={safeA7} scale={kpiScale}/>
          <Kpi label="Users"             value={fmt.num(ga4.total_users)}     delta={d(ga4.total_users, ga4Prev.total_users)}         accent={gold} scale={kpiScale}/>
          <Kpi label="Pageviews"         value={fmt.num(ga4.event_count)} delta={d(ga4.event_count, ga4Prev.event_count)} accent={gold} scale={kpiScale}/>
          <Kpi label="Engaged Sessions"  value={fmt.num(ga4.engaged_sessions)}   delta={d(ga4.engaged_sessions, ga4Prev.engaged_sessions)}     accent={teal} scale={kpiScale}/>
          <Kpi label="Bounce Rate"       value={fmt.pct(ga4.bounce_rate)}
            delta={d(ga4.bounce_rate, ga4Prev.bounce_rate) != null ? -d(ga4.bounce_rate, ga4Prev.bounce_rate) : null}
            scale={kpiScale}/>
          <Kpi label="Pages / Session"   value={pagesPerSession.toFixed(1)} sub="rata-rata" scale={kpiScale}/>
          <Kpi label="Engagement Rate"   value={engageRate.toFixed(1) + '%'} sub="of total sessions" scale={kpiScale}/>
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
            {fmt.num(ga4.engaged_sessions)}{' '}
            <span style={{ fontFamily: T.mono, fontSize: 11, color: muted, fontWeight: 400 }}>engaged sessions</span>
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
    const posLabel = position <= 3 ? 'Excellent · Top 3' : position <= 7 ? 'Good · Page 1' : 'Needs Optimization';
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
            <span style={{ fontFamily: T.mono, fontSize: 11, color: muted, fontWeight: 400, marginLeft: 6 }}>avg CTR</span>
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
            rows={queries} availDims={window.DIM_REGISTRY?.search || []} availMetrics={window.TABLE_METRICS_REGISTRY?.search || []}
            defaultDims={['query']} defaultMetrics={['impressions','clicks','ctr','position']}
            defaultName="Top Queries · Search Console"/>
        </SelectableWidget>
      );
    }

    if (gsc.pages && gsc.pages.length > 0) {
      map['search-pages'] = (
        <SelectableWidget id="search-pages" cardId="table-rankings" editState={editState}>
          <DataTable widgetId="search-pages" widgetConfig={wcfg('search-pages')}
            rows={gsc.pages} availDims={window.DIM_REGISTRY?.search || []} availMetrics={window.TABLE_METRICS_REGISTRY?.search || []}
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

// Module-level — same reason as RowDropZone: prevents remount/flicker across re-renders
function PointerRowZone({ insertAt, active, onPointerEnter, onPointerLeave, innerRef }) {
  return (
    <div
      ref={innerRef}
      style={{
        height: active ? 52 : 8, borderRadius: 6, marginBottom: active ? 4 : 12,
        transition: 'height .12s ease, background .12s, border-color .12s, margin-bottom .12s',
        border: `1.5px dashed ${active ? teal : 'transparent'}`,
        background: active ? 'rgba(0,194,184,.08)' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'copy',
      }}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      {active && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: teal }}>+ new row</span>}
    </div>
  );
}

function buildUniversalMap(p, widgetConfigs, layouts, editState, psiUrl, psiApiKey, savePsiApiKey) {
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
          psiUrl={psiUrl}
          psiApiKey={psiApiKey}
          savePsiApiKey={savePsiApiKey}
        />
      );
    });
  });
  return map;
}

// ─── Drag canvas ───────────────────────────────────────────────────
function DragCanvas({ p, connected, widgetConfigs, editState, layouts, onLayoutChange, widgetElemRefs, scrollContainerRef, psiUrl, psiApiKey, savePsiApiKey }) {
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
  const widgetEls    = React.useRef({});     // id -> { el, rowIdx } for zone detection
  const pointerRowZoneRefs = React.useRef({});  // insertAt -> DOM element, for flicker-free detection
  const dragScrollRaf   = React.useRef(null);  // RAF handle for drag auto-scroll
  const dragScrollSpeed = React.useRef(0);     // px/frame; 0 = stopped
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
      dragScrollSpeed.current = 0;
      if (dragScrollRaf.current) { cancelAnimationFrame(dragScrollRaf.current); dragScrollRaf.current = null; }
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
  const widgetMap = buildUniversalMap(p, widgetConfigs, layouts, _es, psiUrl, psiApiKey, savePsiApiKey);
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

  // RAF loop: scrolls the canvas while the user drags near the top/bottom edge
  const scrollDragFrame = React.useCallback(() => {
    const speed  = dragScrollSpeed.current;
    const canvas = scrollContainerRef?.current;
    if (!canvas || speed === 0 || !dragIdRef.current) { dragScrollRaf.current = null; return; }
    canvas.scrollTop = Math.max(0, canvas.scrollTop + speed);
    dragScrollRaf.current = requestAnimationFrame(scrollDragFrame);
  }, []); // all state accessed via refs — no stale-closure risk

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
    if (dragId) {
      setGhostPos({ x: e.clientX, y: e.clientY });
      // Auto-scroll when cursor is within 80px of the canvas top/bottom edge
      const canvas = scrollContainerRef?.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const ZONE = 80, MAX_SPEED = 14;
        const relY = e.clientY - rect.top;
        let speed = 0;
        if (relY < ZONE)                    speed = -Math.round((ZONE - relY) / ZONE * MAX_SPEED);
        else if (relY > rect.height - ZONE) speed =  Math.round((relY - (rect.height - ZONE)) / ZONE * MAX_SPEED);
        dragScrollSpeed.current = speed;
        if (speed !== 0 && !dragScrollRaf.current) dragScrollRaf.current = requestAnimationFrame(scrollDragFrame);
      }
      // Zone detection: find which sibling the cursor is over and which zone
      let found = null;
      for (const [wid, meta] of Object.entries(widgetEls.current)) {
        if (wid === dragId) continue;
        const r = meta.el.getBoundingClientRect();
        if (e.clientX >= r.left && e.clientX <= r.right &&
            e.clientY >= r.top  && e.clientY <= r.bottom) {
          found = { id: wid, rowIdx: meta.rowIdx, r };
          break;
        }
      }
      if (found) {
        const { id: tid, rowIdx, r } = found;
        const relX = (e.clientX - r.left) / r.width;
        const relY = (e.clientY - r.top)  / r.height;
        let type;
        if      (relX < 0.25) type = 'before';
        else if (relX > 0.75) type = 'after';
        else                  type = 'swap';
        setDropTarget({ type, targetId: tid, rowIdx });
      } else {
        // Don't clear drop target while cursor is still within a between-row zone
        for (const el of Object.values(pointerRowZoneRefs.current)) {
          const r = el.getBoundingClientRect();
          if (e.clientX >= r.left && e.clientX <= r.right &&
              e.clientY >= r.top  && e.clientY <= r.bottom) return;
        }
        setDropTarget(null);
      }
    }
  };

  // Shared drop application — used by both onPointerUp (inside canvas) and
  // document-level cleanup (outside canvas, cancel only).
  const applyDrop = (id, target) => {
    if (!target) return;
    onLayoutChange(prev => {
      let rows = prev.rows.map(r => [...r]);

      const redistributeRow = (row) => {
        if (!row || row.length === 0) return row;
        const count = row.length;
        const base = Math.floor(12 / count);
        const rem = 12 - base * count;
        return row.map((w, i) => ({ ...w, span: base + (i < rem ? 1 : 0) }));
      };

      if (target.type === 'before' || target.type === 'after' || target.type === 'swap') {
        // Remove dragged widget from its source row
        let dragEntry = null;
        const srcRowIdxBefore = rows.findIndex(row => row.some(w => w.id === id));
        rows = rows.map(row => {
          const idx = row.findIndex(w => w.id === id);
          if (idx !== -1) { dragEntry = row[idx]; return row.filter((_, i) => i !== idx); }
          return row;
        });
        if (srcRowIdxBefore >= 0 && rows[srcRowIdxBefore]?.length > 0) {
          rows[srcRowIdxBefore] = redistributeRow(rows[srcRowIdxBefore]);
        }
        rows = rows.filter(row => row.length > 0);
        if (dragEntry) {
          // Find target widget in updated rows
          let targetRowIdx = -1, targetPosIdx = -1;
          rows.forEach((row, ri) => row.forEach((w, pi) => {
            if (w.id === target.targetId) { targetRowIdx = ri; targetPosIdx = pi; }
          }));
          if (targetRowIdx >= 0) {
            const insertIdx = target.type === 'after' ? targetPosIdx + 1 : targetPosIdx;
            rows[targetRowIdx].splice(insertIdx, 0, dragEntry);
            rows[targetRowIdx] = redistributeRow(rows[targetRowIdx]);
          }
        }

      } else if (target.type === 'new-row') {
        // Remove dragged widget from its source row, insert as new full-width row
        let dragEntry = null;
        const srcRowIdx = rows.findIndex(row => row.some(w => w.id === id));
        const srcWillBeEmpty = srcRowIdx >= 0 && rows[srcRowIdx].length === 1;
        rows = rows.map(row => {
          const idx = row.findIndex(w => w.id === id);
          if (idx !== -1) { dragEntry = row[idx]; return row.filter((_, i) => i !== idx); }
          return row;
        });
        if (!srcWillBeEmpty && srcRowIdx >= 0 && rows[srcRowIdx]?.length > 0) {
          rows[srcRowIdx] = redistributeRow(rows[srcRowIdx]);
        }
        rows = rows.filter(row => row.length > 0);
        let insertAt = target.insertAt;
        if (srcWillBeEmpty && srcRowIdx < insertAt) insertAt = Math.max(0, insertAt - 1);
        if (dragEntry) rows.splice(insertAt, 0, [{ ...dragEntry, span: 12 }]);
      }

      return { ...prev, rows };
    });
  };

  const handlePointerUp = () => {
    pendingDrag.current = null;
    dragScrollSpeed.current = 0;
    if (dragScrollRaf.current) { cancelAnimationFrame(dragScrollRaf.current); dragScrollRaf.current = null; }
    if (!dragId) return;
    applyDrop(dragId, dropTarget);
    setDragId(null);
    setDropTarget(null);
    justDropped.current = true;
    // Auto-clear so a subsequent click on empty canvas or a quick click
    // on any widget is not silently suppressed.
    setTimeout(() => { justDropped.current = false; }, 300);
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
        rows: prev.rows.map(r => r.map(w => w.id === widgetId ? { id: newId, type: def.type, source: def.source, span: w.span, ...(def._cardId ? { _cardId: def._cardId } : {}) } : w)),
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
    const _redist = row => {
      const count = row.length;
      const base = Math.floor(12 / count);
      const rem = 12 - base * count;
      return row.map((w, i) => ({ ...w, span: base + (i < rem ? 1 : 0) }));
    };
    const def = _parseBrowseDef(e);
    if (def) {
      e.preventDefault(); e.stopPropagation();
      const newId = window.genWidgetId ? window.genWidgetId() : 'w_' + Date.now();
      onLayoutChange(prev => {
        const rows = prev.rows.map(r => [...r]);
        rows[rowIdx].splice(insertPos, 0, { id: newId, type: def.type, source: def.source, span: 4, ...(def._cardId ? { _cardId: def._cardId } : {}) });
        rows[rowIdx] = _redist(rows[rowIdx]);
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
      rows[rowIdx] = _redist(rows[rowIdx]);
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
        rows.splice(insertAt, 0, [{ id: newId, type: def.type, source: def.source, span: 12, ...(def._cardId ? { _cardId: def._cardId } : {}) }]);
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
      {/* Edit mode hint strip — always visible while in edit mode */}
      {editState && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px',
          borderRadius: 8, marginBottom: 16,
          background: 'rgba(0,194,184,.05)', border: '1px solid rgba(0,194,184,.14)',
        }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={teal} strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          <span style={{ fontFamily: T.mono, fontSize: 9, color: teal, letterSpacing: '0.05em' }}>
            Edit Mode · Click to select · Ctrl+Click multi-select / deselect · Drag to move · Toolbar above widget · Ctrl+Z undo · Ctrl+Shift+Z redo
          </span>
        </div>
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
            {/* Between-row zone: Browse drag */}
            {browseDragActive && <RowDropZone
              insertAt={rowIdx}
              active={browseDropTarget?.type === 'row' && browseDropTarget.insertAt === rowIdx}
              onDragOver={e => { e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = 'copy'; }}
              onDragEnter={i => setBrowseDropTarget({ type: 'row', insertAt: i })}
              onDrop={(i, e) => handleNewRowDrop(i, e)}
            />}
            {/* Between-row zone: pointer drag (existing widget reorder) */}
            {dragId && <PointerRowZone
              insertAt={rowIdx}
              active={!browseDragActive && dropTarget?.type === 'new-row' && dropTarget.insertAt === rowIdx}
              onPointerEnter={() => setDropTarget({ type: 'new-row', insertAt: rowIdx })}
              innerRef={el => el ? (pointerRowZoneRefs.current[rowIdx] = el) : delete pointerRowZoneRefs.current[rowIdx]}
            />}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: 20, marginBottom: 20, position: 'relative', alignItems: 'stretch' }}>
              {visible.map((entry, colIdx) => {
                const { id } = entry;
                const entrySpan = entry.span || autoSpan;
                const actualIdx  = row.indexOf(entry);
                const isDragging       = dragId === id;
                // Pointer drag zones (existing widget reorder)
                const isPointerBefore  = !browseDragActive && dropTarget?.type === 'before' && dropTarget.targetId === id;
                const isPointerAfter   = !browseDragActive && dropTarget?.type === 'after'  && dropTarget.targetId === id;

                const isSwap           = !browseDragActive && dropTarget?.type === 'swap'   && dropTarget.targetId === id;
                // Browse drag zones (new widgets from sidebar)
                const isBefore   = browseDragActive && browseDropTarget?.type === 'before' && browseDropTarget.id === id;
                const isAfter    = browseDragActive && browseDropTarget?.type === 'after'  && browseDropTarget.id === id;
                const isReplace  = browseDragActive && browseDropTarget?.type === 'replace' && browseDropTarget.id === id;

                return (
                  <div key={id}
                    ref={el => {
                      if (el) { widgetEls.current[id] = { el, rowIdx }; if (widgetElemRefs) widgetElemRefs.current[id] = el; }
                      else { delete widgetEls.current[id]; if (widgetElemRefs) delete widgetElemRefs.current[id]; }
                    }}
                    style={{
                      gridColumn: `span ${entrySpan}`, position: 'relative',
                      display: 'flex', flexDirection: 'column',
                      opacity: isDragging ? 0.3 : 1,
                      cursor: editState && !browseDragActive ? (isDragging ? 'grabbing' : 'grab') : 'default',
                      userSelect: 'none',
                    }}
                    onPointerDown={editState && !browseDragActive ? e => handlePointerDown(id, e) : undefined}
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
                    {editState && editState.selected.length === 1 && editState.selected[0] === id && !dragId && !browseDragActive && (
                      <div
                        onPointerDown={e => e.stopPropagation()}
                        style={{
                          position: 'absolute',
                          ...(rowIdx < 2 ? { bottom: -44 } : { top: -44 }),
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
                          { title: 'Move left in row', disabled: colIdx === 0, onClick: () => swapInRow(rowIdx, id, visible[colIdx - 1].id), icon: <path d="M15 18l-6-6 6-6"/> },
                          { title: 'Move right in row', disabled: colIdx === visible.length - 1, onClick: () => swapInRow(rowIdx, id, visible[colIdx + 1].id), icon: <path d="M9 18l6-6-6-6"/> },
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

                        {/* Shrink / Expand span */}
                        {visible.length > 1 && (() => {
                          const curSpan = entrySpan;
                          const nbrIdx = colIdx < visible.length - 1 ? colIdx + 1 : colIdx - 1;
                          const nbrSpan = visible[nbrIdx]?.span || autoSpan;
                          const canShrink = curSpan > 1 && nbrSpan < 11;
                          const canExpand = curSpan < 11 && nbrSpan > 1;
                          return [
                            { title: 'Persempit widget', disabled: !canShrink, delta: -1, icon: <><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></> },
                            { title: 'Perlebar widget', disabled: !canExpand, delta: +1, icon: <><path d="M8 3H2v6"/><path d="M16 21h6v-6"/><path d="M2 3l7 7"/><path d="M22 21l-7-7"/></> },
                          ].map(({ title, disabled, delta, icon }) => (
                            <button key={title} title={title} disabled={disabled}
                              onClick={e => { e.stopPropagation(); if (!disabled) editState.onAdjustSpan(rowIdx, id, delta); }}
                              style={{ width: 26, height: 26, padding: 0, border: 'none', borderRadius: 6, cursor: disabled ? 'default' : 'pointer', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: disabled ? 'rgba(255,255,255,.18)' : teal, transition: 'background .1s' }}
                              onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = 'rgba(0,194,184,.1)'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                            >
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">{icon}</svg>
                            </button>
                          ));
                        })()}

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

                    {/* Pointer drag zone overlays */}
                    {dragId && !isDragging && (
                      <>
                        {/* Left zone: insert before in row */}
                        <div style={{
                          position: 'absolute', top: 0, left: 0, bottom: 0, width: '25%',
                          zIndex: 10, pointerEvents: 'none', borderRadius: '10px 0 0 10px',
                          background: isPointerBefore ? 'rgba(0,194,184,.14)' : 'transparent',
                          borderLeft: `3px solid ${isPointerBefore ? teal : 'transparent'}`,
                          transition: 'background .08s, border-color .08s',
                        }}/>
                        {/* Right zone: insert after in row */}
                        <div style={{
                          position: 'absolute', top: 0, right: 0, bottom: 0, width: '25%',
                          zIndex: 10, pointerEvents: 'none', borderRadius: '0 10px 10px 0',
                          background: isPointerAfter ? 'rgba(0,194,184,.14)' : 'transparent',
                          borderRight: `3px solid ${isPointerAfter ? teal : 'transparent'}`,
                          transition: 'background .08s, border-color .08s',
                        }}/>
                        {/* Center zone: swap positions */}
                        {isSwap && (
                          <div style={{ position: 'absolute', inset: 0, borderRadius: 12, border: `2px dashed ${teal}`, background: 'rgba(0,194,184,.08)', zIndex: 5, pointerEvents: 'none' }}/>
                        )}
                      </>
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
          <PointerRowZone
            insertAt={layouts.rows.length}
            active={dropTarget?.type === 'new-row' && dropTarget.insertAt === layouts.rows.length}
            innerRef={el => {
              if (el) pointerRowZoneRefs.current[layouts.rows.length] = el;
              else delete pointerRowZoneRefs.current[layouts.rows.length];
            }}
            onPointerEnter={() => setDropTarget({ type: 'new-row', insertAt: layouts.rows.length })}
          />
        )
      }

      {/* Empty-layout state: shown when all rows are deleted while in edit mode */}
      {editState && layouts.rows.filter(row => row.some(({ id }) => widgetMap[id])).length === 0 && !browseDragActive && (
        <div style={{
          minHeight: 220, borderRadius: 12, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 12,
          border: '1.5px dashed rgba(0,194,184,.2)', background: 'rgba(0,194,184,.02)',
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(0,194,184,.4)" strokeWidth="1.5" strokeLinecap="round">
            <rect x="3" y="3" width="18" height="18" rx="3"/><path d="M12 8v8M8 12h8"/>
          </svg>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(0,194,184,.5)', textAlign: 'center', lineHeight: 1.6 }}>
            No widgets yet.<br/>Drag a widget from the sidebar or use Ctrl+V to paste.
          </span>
        </div>
      )}

      {/* Ghost label follows pointer during canvas reorder drag */}
      {dragId && (
        <div style={{
          position: 'fixed', top: ghostPos.y - 16, left: ghostPos.x - 80, pointerEvents: 'none', zIndex: 999,
          width: 160, height: 32, background: 'rgba(10,18,34,.92)', border: '1px solid rgba(0,194,184,.5)',
          borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          boxShadow: '0 8px 32px rgba(0,0,0,.4)',
        }}>
          <svg width="12" height="8" viewBox="0 0 12 8" fill={teal}>
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
          <ChartCard title={wn('google-clicks') || "Click Volume · Pacing"} sub="This month vs target">
            <MiniBar data={safeClicks} w={300} h={72} color={blue} activeUntil={paceIdx}/>
          </ChartCard>
        </SelectableWidget>

        <SelectableWidget id="google-budget" cardId="chart-donut" editState={editState}>
          <ChartCard title={wn('google-budget') || "Budget by Campaign Type"}>
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
                      <span style={{ fontFamily: T.mono, fontSize: 11, color: sec }}>{ch.name}</span>
                    </div>
                    <span style={{ fontFamily: T.mono, fontSize: 11, color: muted }}>
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
            rows={campaigns} availDims={window.DIM_REGISTRY?.google || []} availMetrics={window.TABLE_METRICS_REGISTRY?.google || []}
            defaultDims={['name']} defaultMetrics={['spend','clicks','impressions','ctr','cpa']}
            defaultName="Campaigns · Google Ads"/>
        </SelectableWidget>
      )}

      {p.adGroups && p.adGroups.length > 0 && (
        <SelectableWidget id="google-adgroups" cardId="table-campaigns" editState={editState}>
          <DataTable widgetId="google-adgroups" widgetConfig={wcfg('google-adgroups')}
            rows={p.adGroups} availDims={window.DIM_REGISTRY?.google || []} availMetrics={window.TABLE_METRICS_REGISTRY?.google || []}
            defaultDims={['ad_group','name']} defaultMetrics={['spend','clicks','ctr','cpa']}
            defaultName="Ad Groups · Google Ads"/>
        </SelectableWidget>
      )}

      {p.keywords && p.keywords.length > 0 && (
        <SelectableWidget id="google-keywords" cardId="table-campaigns" editState={editState}>
          <DataTable widgetId="google-keywords" widgetConfig={wcfg('google-keywords')}
            rows={p.keywords} availDims={window.DIM_REGISTRY?.google || []} availMetrics={window.TABLE_METRICS_REGISTRY?.google || []}
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
          <div style={{ fontFamily: T.body, fontSize: 11, color: muted, marginTop: 2 }}>{adGroups.length} ad groups · click to {show ? 'hide' : 'show'}</div>
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
          <div style={{ fontFamily: T.body, fontSize: 11, color: muted, marginTop: 2 }}>{keywords.length} keywords · click to {show ? 'hide' : 'show'}</div>
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
          <ChartCard title={wn('meta-donut') || "Impressions by Ad Type"}>
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
                      <span style={{ fontFamily: T.mono, fontSize: 11, color: sec }}>{ch.name}</span>
                    </div>
                    <span style={{ fontFamily: T.mono, fontSize: 11, color: muted }}>
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
    : [ga4.total_users];
  const safeConv = series.conversions.length >= 2 ? series.conversions : [0, 0];

  const pagesPerSession = ga4.sessions > 0 ? (ga4.event_count / ga4.sessions) : 0;
  const engageRate      = ga4.sessions > 0 ? (ga4.engaged_sessions / ga4.sessions) * 100 : 0;
  const safeA7 = safeA.slice(-7);

  return (
    <Section>
      <SectionHead channel="ga4" title="Google Analytics 4" subtitle="Organic, Referral & Direct traffic"/>

      <SelectableWidget id="ga4-kpi" cardId="kpi-strip" editState={editState}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
          <Kpi label="Sessions"          value={fmt.num(ga4.sessions)}  delta={d(ga4.sessions, ga4Prev.sessions)}   accent={gold} spark={safeA7} scale={kpiScale}/>
          <Kpi label="Users"             value={fmt.num(ga4.total_users)}     delta={d(ga4.total_users, ga4Prev.total_users)}         accent={gold} scale={kpiScale}/>
          <Kpi label="Pageviews"         value={fmt.num(ga4.event_count)} delta={d(ga4.event_count, ga4Prev.event_count)} accent={gold} scale={kpiScale}/>
          <Kpi label="Engaged Sessions"  value={fmt.num(ga4.engaged_sessions)}   delta={d(ga4.engaged_sessions, ga4Prev.engaged_sessions)}     accent={teal} scale={kpiScale}/>
          <Kpi label="Bounce Rate"       value={fmt.pct(ga4.bounce_rate)}
            delta={d(ga4.bounce_rate, ga4Prev.bounce_rate) != null ? -d(ga4.bounce_rate, ga4Prev.bounce_rate) : null}
            scale={kpiScale}/>
          <Kpi label="Pages / Session"   value={pagesPerSession.toFixed(1)} sub="rata-rata" scale={kpiScale}/>
          <Kpi label="Engagement Rate"   value={engageRate.toFixed(1) + '%'} sub="of total sessions" scale={kpiScale}/>
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
            {fmt.num(ga4.engaged_sessions)}{' '}
            <span style={{ fontFamily: T.mono, fontSize: 11, color: muted, fontWeight: 400 }}>engaged sessions</span>
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
          {rows.length === 0 && <tr><td colSpan={5} style={{ padding: '20px', textAlign: 'center', fontFamily: T.mono, fontSize: 10, color: muted }}>No results</td></tr>}
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
          {rows.length === 0 && <tr><td colSpan={5} style={{ padding: '20px', textAlign: 'center', fontFamily: T.mono, fontSize: 10, color: muted }}>No results</td></tr>}
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
            No Search Console data for this period
          </div>
          <div style={{ fontFamily: T.body, fontSize: 12, color: sec, marginTop: 6 }}>
            Make sure the property is connected and data has been synced to the <strong style={{ color: fg }}>search_console</strong> table.
          </div>
        </RCard>
      </Section>
    );
  }

  const { impressions, clicks, ctr, position, queries, series } = gsc;
  const posColor = position <= 3 ? '#16A34A' : position <= 7 ? gold : '#E3170A';
  const posLabel = position <= 3 ? 'Excellent · Top 3' : position <= 7 ? 'Good · Page 1' : 'Needs Optimization';

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
              <span style={{ fontFamily: T.mono, fontSize: 11, color: muted, fontWeight: 400, marginLeft: 6 }}>avg CTR</span>
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
            rows={queries} availDims={window.DIM_REGISTRY?.search || []} availMetrics={window.TABLE_METRICS_REGISTRY?.search || []}
            defaultDims={['query']} defaultMetrics={['impressions','clicks','ctr','position']}
            defaultName="Top Queries · Search Console"/>
        </SelectableWidget>
      )}

      {gsc.pages && gsc.pages.length > 0 && (
        <SelectableWidget id="search-pages" cardId="table-rankings" editState={editState}>
          <DataTable widgetId="search-pages" widgetConfig={wcfg('search-pages')}
            rows={gsc.pages} availDims={window.DIM_REGISTRY?.search || []} availMetrics={window.TABLE_METRICS_REGISTRY?.search || []}
            defaultDims={['page']} defaultMetrics={['impressions','clicks','ctr','position']}
            defaultName="Top Pages · Search Console"/>
        </SelectableWidget>
      )}
    </Section>
  );
}

// ─── PageSpeed Section ─────────────────────────────────────────────
// Slim measurement control panel — scores are displayed via the progress-psi canvas widget
function PageSpeedSection({ psiUrl, psiApiKey, savePsiApiKey }) {
  const [measuring,    setMeasuring]    = useState(false);
  const [measureError, setMeasureError] = useState(null);
  const [retryIn,      setRetryIn]      = useState(0);
  const [lastMeasured, setLastMeasured] = useState(null);
  const autoRetryCount = React.useRef(0);
  const [keyDraft,     setKeyDraft]     = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);

  const runMeasurementRef = React.useRef(null);

  useEffect(() => {
    if (retryIn <= 0) return;
    const t = setTimeout(() => {
      if (retryIn <= 1) { setRetryIn(0); runMeasurementRef.current?.(true); }
      else { setRetryIn(s => s - 1); }
    }, 1000);
    return () => clearTimeout(t);
  }, [retryIn]);

  function _parseCats(cats) {
    return {
      performance_score:    Math.round((cats.performance       && cats.performance.score       || 0) * 100),
      seo_score:            Math.round((cats.seo               && cats.seo.score               || 0) * 100),
      accessibility_score:  Math.round((cats.accessibility     && cats.accessibility.score     || 0) * 100),
      best_practices_score: Math.round((cats['best-practices'] && cats['best-practices'].score || 0) * 100),
    };
  }
  function _scoresToPsi(s, today) {
    return { performance: s.performance_score, seo: s.seo_score, accessibility: s.accessibility_score, best_practices: s.best_practices_score, latestDay: today, recordCount: 1, history: [], _isLive: true };
  }

  async function runLiveMeasurement(isAutoRetry = false) {
    if (!psiUrl || measuring) return;
    setMeasuring(true);
    setMeasureError(null);
    setRetryIn(0);
    try {
      const base = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed'
        + '?url=' + encodeURIComponent(psiUrl)
        + '&category=performance&category=accessibility&category=best-practices&category=seo'
        + (psiApiKey ? '&key=' + encodeURIComponent(psiApiKey) : '');
      const [mResp, dResp] = await Promise.all([
        fetch(base + '&strategy=mobile'),
        fetch(base + '&strategy=desktop'),
      ]);
      // Rate-limit / quota check on mobile response (primary)
      if (mResp.status === 429 || mResp.status === 403) {
        setMeasuring(false);
        let errBody = null;
        try { errBody = await mResp.json(); } catch {}
        const errDetail = errBody?.error?.message || '';
        const isQuotaDaily = errDetail.includes('per day') || errDetail.includes('Queries per day');
        if (isQuotaDaily) { setMeasureError('quota_exceeded'); return; }
        if (isAutoRetry && autoRetryCount.current >= 3) {
          setMeasureError('quota_exceeded'); autoRetryCount.current = 0; return;
        }
        autoRetryCount.current += 1;
        setRetryIn(105);
        setMeasureError('rate_limited');
        return;
      }
      if (!mResp.ok) {
        let errMsg = 'HTTP ' + mResp.status + ' from Google API.';
        try { const j = await mResp.json(); errMsg = j?.error?.message || errMsg; } catch {}
        throw new Error(errMsg);
      }
      const today = new Date().toISOString().slice(0, 10);
      const mJson = await mResp.json();
      const mCats = mJson.lighthouseResult && mJson.lighthouseResult.categories;
      if (!mCats) throw new Error('No category data in PSI response.');
      autoRetryCount.current = 0;
      const mScores = _parseCats(mCats);

      // Parse desktop (best-effort; don't fail the whole measurement if it errors)
      let dScores = null;
      try {
        if (dResp.ok) {
          const dJson = await dResp.json();
          const dCats = dJson.lighthouseResult && dJson.lighthouseResult.categories;
          if (dCats) dScores = _parseCats(dCats);
        }
      } catch (_) {}

      setLastMeasured(today);
      // Persist both to Supabase
      try {
        const ga4Supa = window.LIVE._ga4Supa;
        if (ga4Supa) {
          const rows = [{ url: psiUrl, strategy: 'mobile', day: today, ...mScores }];
          if (dScores) rows.push({ url: psiUrl, strategy: 'desktop', day: today, ...dScores });
          await ga4Supa.from('pagespeed').insert(rows);
        }
      } catch (_) {}
    } catch (e) {
      setMeasureError(e.message || 'Measurement failed. Please try again.');
    } finally {
      setMeasuring(false);
    }
  }
  runMeasurementRef.current = runLiveMeasurement;

  if (!psiUrl) return null;

  return (
    <Section>
      <SectionHead title="PageSpeed Insights" subtitle="Measurement Control"/>
      <RCard padding={16}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontFamily: T.mono, fontSize: 10, color: sec }}>
            URL: <span style={{ color: fg }}>{psiUrl}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button onClick={runLiveMeasurement} disabled={measuring || retryIn > 0} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px',
              background: measuring ? 'rgba(0,194,184,.15)' : 'linear-gradient(135deg,#00C2B8,#009E96)',
              border: measuring ? '1px solid rgba(0,194,184,.3)' : 'none',
              borderRadius: 8, cursor: (measuring || retryIn > 0) ? 'not-allowed' : 'pointer',
              color: measuring ? teal : '#0C182C', fontFamily: T.display, fontSize: 12, fontWeight: 700,
              boxShadow: measuring ? 'none' : '0 4px 14px rgba(0,194,184,.25)',
              transition: 'all .2s', opacity: retryIn > 0 ? 0.5 : 1,
            }}>
              {measuring
                ? <><span style={{ width: 12, height: 12, border: '2px solid rgba(0,194,184,.3)', borderTopColor: teal, borderRadius: '50%', display: 'inline-block', animation: 'bootPulse 0.8s linear infinite' }}/> Measuring…</>
                : <><svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.3" viewBox="0 0 24 24" strokeLinecap="round"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg> Run Measurement</>}
            </button>
            {lastMeasured && !measuring && (
              <span style={{ fontFamily: T.mono, fontSize: 9, color: teal }}>
                Saved · {lastMeasured} · Refresh to update widget scores
              </span>
            )}
            {measuring && <span style={{ fontFamily: T.mono, fontSize: 9.5, color: muted }}>Contacting Google API… (~10–30 sec)</span>}
          </div>
          {measureError === 'rate_limited' && (
            <div style={{ fontFamily: T.mono, fontSize: 10, color: '#F8B400', background: 'rgba(248,180,0,.08)', border: '1px solid rgba(248,180,0,.25)', borderRadius: 6, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <svg width="13" height="13" fill="none" stroke="#F8B400" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              Google PSI is rate-limited.{' '}{retryIn > 0 ? <>Auto-retrying in <strong style={{ color: fg }}>{retryIn}s</strong>…</> : 'Retrying…'}
            </div>
          )}
          {measureError === 'quota_exceeded' && (
            <div style={{ background: 'rgba(227,23,10,.08)', border: '1px solid rgba(227,23,10,.2)', borderRadius: 6, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontFamily: T.mono, fontSize: 10, color: '#E3170A', display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="13" height="13" fill="none" stroke="#E3170A" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
                Daily Google PSI quota exceeded. Add an API Key to continue.
              </div>
              {!showKeyInput ? (
                <button onClick={() => { setKeyDraft(psiApiKey); setShowKeyInput(true); }}
                  style={{ alignSelf: 'flex-start', padding: '5px 12px', background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.15)', borderRadius: 6, color: fg, fontFamily: T.display, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  {psiApiKey ? 'Change API Key' : 'Enter Google API Key'}
                </button>
              ) : (
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input value={keyDraft} onChange={e => setKeyDraft(e.target.value)} placeholder="AIza..."
                    style={{ flex: 1, padding: '6px 10px', background: 'var(--navy-elevated)', border: '1px solid var(--navy-edge)', borderRadius: 6, color: fg, fontFamily: T.mono, fontSize: 11, outline: 'none' }}/>
                  <button onClick={() => { savePsiApiKey(keyDraft.trim()); setShowKeyInput(false); setMeasureError(null); }}
                    style={{ padding: '6px 12px', background: 'linear-gradient(135deg,#00C2B8,#009E96)', border: 'none', borderRadius: 6, color: '#0C182C', fontFamily: T.display, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Save</button>
                  <button onClick={() => setShowKeyInput(false)} style={{ padding: '6px 10px', background: 'transparent', border: '1px solid rgba(255,255,255,.12)', borderRadius: 6, color: sec, fontFamily: T.display, fontSize: 12, cursor: 'pointer' }}>Cancel</button>
                </div>
              )}
              <div style={{ fontFamily: T.mono, fontSize: 11, color: muted, lineHeight: 1.5 }}>
                Create an API key at <span style={{ color: teal }}>console.cloud.google.com</span> → APIs &amp; Services → PageSpeed Insights API → Credentials
              </div>
            </div>
          )}
          {measureError && measureError !== 'rate_limited' && measureError !== 'quota_exceeded' && (
            <div style={{ fontFamily: T.mono, fontSize: 10, color: '#E3170A', background: 'rgba(227,23,10,.08)', border: '1px solid rgba(227,23,10,.2)', borderRadius: 6, padding: '8px 12px' }}>{measureError}</div>
          )}
        </div>
      </RCard>
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
            First report for {client.name}
          </div>
          <div style={{ fontFamily: T.body, fontSize: 15, color: sec, lineHeight: 1.6 }}>
            No data sources connected yet. Connect at least one data source to automatically generate your report.
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        {[['1','Connect Data Sources'],['2','View Automatic Report']].map(([n, label], i) => (
          <React.Fragment key={n}>
            {i > 0 && <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.08)' }}/>}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%',
                background: i === 0 ? teal : 'rgba(255,255,255,.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: T.mono, fontSize: 12, fontWeight: 700,
                color: i === 0 ? '#0C182C' : muted,
              }}>{n}</div>
              <span style={{ fontFamily: T.mono, fontSize: 11, color: i === 0 ? fg : muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</span>
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
              <div style={{ fontFamily: T.display, fontSize: 14, fontWeight: 700, color: fg, marginBottom: 3 }}>{src.label}</div>
              <div style={{ fontFamily: T.mono, fontSize: 10.5, color: muted, lineHeight: 1.5, letterSpacing: '0.05em' }}>{src.desc}</div>
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
          <div style={{ fontFamily: T.display, fontSize: 15, fontWeight: 700, color: fg, marginBottom: 4 }}>
            Connect a data source now
          </div>
          <div style={{ fontFamily: T.body, fontSize: 13.5, color: muted, lineHeight: 1.5 }}>
            Go back to Home → click <strong style={{ color: gold }}>Configure</strong> on this project row,
            then click <strong style={{ color: teal }}>Save & Open Report</strong>.
          </div>
        </div>
        <button onClick={onBack} style={{
          padding: '10px 20px', background: 'linear-gradient(135deg,#00C2B8,#009E96)',
          border: 'none', borderRadius: 9, color: '#0C182C',
          fontFamily: T.display, fontSize: 14, fontWeight: 700,
          cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap',
          boxShadow: '0 4px 14px rgba(0,194,184,.25)',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.3" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Go to Home
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
      <div style={{ fontFamily: T.mono, fontSize: 12, color: muted, textTransform: 'uppercase', letterSpacing: '.1em', fontWeight: 600, marginBottom: 10 }}>{label}</div>
      <div style={{ fontFamily: T.display, fontSize: 30, fontWeight: 800, color: fg, letterSpacing: '-.025em', lineHeight: 1, marginBottom: 12, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: deltaUp ? '#16A34A' : '#DC2626', fontFamily: T.mono, fontSize: 13, fontWeight: 600 }}>
            {deltaUp ? '↑' : '↓'} {delta}
          </span>
          <span style={{ fontFamily: T.body, fontSize: 12, color: muted }}>{comparison}</span>
        </div>
        {progress != null && (
          <>
            <div style={{ height: 3, background: 'var(--navy-deep)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ width: `${progress}%`, height: '100%', background: acc }}/>
            </div>
            <div style={{ fontFamily: T.mono, fontSize: 11.5, color: muted, textAlign: 'right' }}>{progressLabel}</div>
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
            <span style={{ fontFamily: T.mono, fontSize: 12, color: teal, background: 'rgba(0,194,184,.1)', padding: '3px 10px', borderRadius: 4, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 600 }}>01 Executive Summary</span>
            <span style={{ fontFamily: T.mono, fontSize: 12, color: muted, textTransform: 'uppercase', letterSpacing: '.12em', fontWeight: 600 }}>Periode · {p.labelLong}</span>
            {sources.length > 0 && (
              <span style={{ marginLeft: 'auto', fontFamily: T.mono, fontSize: 12, color: teal, background: 'rgba(0,194,184,.1)', border: '1px solid rgba(0,194,184,.3)', padding: '3px 9px', borderRadius: 5 }}>
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
            <div style={{ fontFamily: T.mono, fontSize: 12, color: teal, textTransform: 'uppercase', letterSpacing: '.12em', fontWeight: 700, marginBottom: 12 }}>Analyst Note</div>
            <div style={{ fontFamily: T.display, fontSize: 20, fontWeight: 700, color: fg, lineHeight: 1.35, letterSpacing: '-.01em', marginBottom: 12 }}>
              {client.name} · {p.labelShort}
            </div>
            <div style={{ fontFamily: T.body, fontSize: 15, color: sec, lineHeight: 1.65 }}>
              Period {p.labelLong}. Total spend {fmt.rupiahShort(ads.spend)} with {fmt.num(ads.conversions)} conversions.
              ROAS reached {fmt.roas(ads.roas)}, organic sessions {fmt.num(ga4.sessions)}.
              {isMock && ' (Demo data — connect real data sources for actual insights.)'}
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
        <div style={{ fontFamily: T.display, fontSize: 16, fontWeight: 700, color: fg, letterSpacing: '-.01em', flex: 1 }}>
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
            borderRadius: 7, fontFamily: T.mono, fontSize: 13, color: fg,
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
          fontFamily: T.mono, fontSize: 13, color: fg,
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
          fontFamily: T.display, fontSize: 13, fontWeight: 600, cursor: 'pointer',
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
  const [selectedWidgets, setSelectedWidgets] = useState([]);
  const [clipboard, setClipboard] = useState(null);
  // clipboard: null | Array<{ layout: Widget, config: {} }>
  const [marquee, setMarquee] = useState(null);
  // marquee: null | { startX: number, startY: number, x: number, y: number, w: number, h: number }
  // coordinates are relative to the canvas scroll container
  const marqueeScrollRaf = React.useRef(null);
  const marqueeScrollSpeed = React.useRef(0);
  const marqueePointerRef = React.useRef(null);
  const canvasRef = React.useRef(null);
  const widgetElemRefs = React.useRef({});
  const [widgetConfigs, setWidgetConfigs] = useState({});
  const [widgetLayouts, setWidgetLayouts] = useState(null);
  const [savedFlash, setSavedFlash] = useState(false);
  // Refs used to suppress the saved-flash on initial load from localStorage
  const initConfigRef = React.useRef(null);
  const initLayoutRef = React.useRef(null);
  const clientIdRef   = React.useRef(clientId);
  // Unified undo/redo stacks — each entry: { configs: snapshot|null, layout: snapshot|null }
  // null means "this operation did not change that field".
  // Paste and source-change store both; config edits store only configs; layout-only ops store only layout.
  const undoHistory = React.useRef([]);
  const redoHistory = React.useRef([]);
  // Current-state refs — kept in sync so undoLast/redoLast can capture "now" inside useCallback
  const widgetConfigsRef = React.useRef({});
  const widgetLayoutsRef = React.useRef(null);
  // Effective layout ref — always the displayed layout (state OR smart default)
  const effectiveLayoutsRef = React.useRef(null);
  const saveTimerRef = React.useRef(null);
  const [historyLen, setHistoryLen] = useState(0);
  const [redoLen, setRedoLen] = useState(0);
  const [localConnected, setLocalConnected] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);
  const toastTimerRef = React.useRef(null);

  const updateWidgetConfig = useCallback((id, changes) => {
    setWidgetConfigs(prev => {
      undoHistory.current = [...undoHistory.current.slice(-19), { configs: prev, layout: null }];
      redoHistory.current = [];
      return { ...prev, [id]: { ...(prev[id] || {}), ...changes } };
    });
    setHistoryLen(l => l + 1);
    setRedoLen(0);
  }, []);

  const undoLast = useCallback(() => {
    if (undoHistory.current.length === 0) return;
    const entry = undoHistory.current[undoHistory.current.length - 1];
    undoHistory.current = undoHistory.current.slice(0, -1);
    // Save current state to redo stack (only the fields this entry touched)
    redoHistory.current = [...redoHistory.current.slice(-19), {
      configs: entry.configs !== null ? widgetConfigsRef.current : null,
      layout: entry.layout !== null ? widgetLayoutsRef.current : null,
    }];
    setHistoryLen(undoHistory.current.length);
    setRedoLen(redoHistory.current.length);
    if (entry.configs !== null) setWidgetConfigs(entry.configs);
    if (entry.layout !== null) setWidgetLayouts(entry.layout);
  }, []);

  const redoLast = useCallback(() => {
    if (redoHistory.current.length === 0) return;
    const entry = redoHistory.current[redoHistory.current.length - 1];
    redoHistory.current = redoHistory.current.slice(0, -1);
    // Save current state to undo stack before re-applying
    undoHistory.current = [...undoHistory.current.slice(-19), {
      configs: entry.configs !== null ? widgetConfigsRef.current : null,
      layout: entry.layout !== null ? widgetLayoutsRef.current : null,
    }];
    setRedoLen(redoHistory.current.length);
    setHistoryLen(undoHistory.current.length);
    if (entry.configs !== null) setWidgetConfigs(entry.configs);
    if (entry.layout !== null) setWidgetLayouts(entry.layout);
  }, []);

  // Auto-scroll loop during marquee drag — runs via raf while cursor is in the edge zone
  const scrollMarqueeFrame = useCallback(() => {
    const speed = marqueeScrollSpeed.current;
    const canvas = canvasRef.current;
    const ptr = marqueePointerRef.current;
    if (!canvas || !ptr || speed === 0) {
      marqueeScrollRaf.current = null;
      return;
    }
    canvas.scrollTop = Math.max(0, canvas.scrollTop + speed);
    setMarquee(prev => {
      if (!prev) return prev;
      const rect = canvas.getBoundingClientRect();
      const curX = ptr.clientX - rect.left;
      const curY = ptr.clientY - rect.top + canvas.scrollTop;
      return {
        ...prev,
        x: Math.min(curX, prev.startX),
        y: Math.min(curY, prev.startY),
        w: Math.abs(curX - prev.startX),
        h: Math.abs(curY - prev.startY),
      };
    });
    marqueeScrollRaf.current = requestAnimationFrame(scrollMarqueeFrame);
  }, []); // all deps are refs — no stale-closure risk

  const updateWidgetLayouts = useCallback((updater) => {
    setWidgetLayouts(prev => {
      const allClients = [...(window._avo_clients || []), ...(window.HOME_CLIENTS || [])];
      const _client = allClients.find(c => c.id === clientId);
      const current = prev || { rows: [] };
      undoHistory.current = [...undoHistory.current.slice(-19), { configs: null, layout: current }];
      redoHistory.current = [];
      return typeof updater === 'function' ? updater(current) : updater;
    });
    setHistoryLen(l => l + 1);
    setRedoLen(0);
  }, [clientId]);

  // Keep clientIdRef in sync so persist effects can read current clientId without it as a dep
  useEffect(() => { clientIdRef.current = clientId; }, [clientId]);

  // Load persisted configs + layouts from Supabase when switching clients
  useEffect(() => {
    setSelectedWidgets([]);
    setClipboard(null);
    setMarquee(null);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    // Reset immediately while fetch is in-flight
    initConfigRef.current = {};
    initLayoutRef.current = null;
    setWidgetConfigs({});
    setWidgetLayouts(null);
    if (!window._layoutSupa || !clientId) return;
    const capturedClientId = clientId;
    window._layoutSupa
      .from('report_layouts')
      .select('layouts, configs')
      .eq('client_id', capturedClientId)
      .maybeSingle()
      .then(({ data }) => {
        if (clientIdRef.current !== capturedClientId) return;
        const layouts = data?.layouts ? migrateLegacyLayout(data.layouts) : null;
        const configs = data?.configs || {};
        initConfigRef.current = configs;
        initLayoutRef.current = layouts;
        setWidgetConfigs(configs);
        setWidgetLayouts(layouts);
      });
  }, [clientId]);

  // Persist configs on every change (clientId intentionally excluded from deps — accessed via ref)
  useEffect(() => {
    if (!clientIdRef.current || Object.keys(widgetConfigs).length === 0) return;
    try {
      localStorage.setItem('widgetConfigs_' + clientIdRef.current, JSON.stringify(widgetConfigs));
      // Skip the flash when this is just the initial load from localStorage
      if (widgetConfigs !== initConfigRef.current) {
        setSavedFlash(true);
        setTimeout(() => setSavedFlash(false), 1800);
      }
    } catch {}
  }, [widgetConfigs]); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist layouts on every change (clientId intentionally excluded from deps — accessed via ref)
  useEffect(() => {
    if (!clientIdRef.current || !widgetLayouts) return;
    try {
      localStorage.setItem('widgetLayouts_' + clientIdRef.current, JSON.stringify(widgetLayouts));
      // Skip the flash when this is just the initial load from localStorage
      if (widgetLayouts !== initLayoutRef.current) {
        setSavedFlash(true);
        setTimeout(() => setSavedFlash(false), 1800);
      }
    } catch {}
  }, [widgetLayouts]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep current-state refs in sync so undo/redo can capture "now" without stale closures
  useEffect(() => { widgetConfigsRef.current = widgetConfigs; }, [widgetConfigs]);
  useEffect(() => { widgetLayoutsRef.current = widgetLayouts; }, [widgetLayouts]);

  // Jump-to-selected: detect when the primary selected widget scrolls out of the canvas viewport
  const [jumpDir, setJumpDir] = useState(null); // null | 'up' | 'down'
  useEffect(() => {
    if (!_primarySelected || !showEditor) { setJumpDir(null); return; }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const check = () => {
      const el = widgetElemRefs.current[_primarySelected];
      if (!el) { setJumpDir(null); return; }
      const canvasRect = canvas.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      if (elRect.bottom < canvasRect.top + 20) setJumpDir('up');
      else if (elRect.top > canvasRect.bottom - 20) setJumpDir('down');
      else setJumpDir(null);
    };
    check();
    canvas.addEventListener('scroll', check);
    return () => canvas.removeEventListener('scroll', check);
  }, [_primarySelected, showEditor]);

  // Ctrl+Z / Cmd+Z — undo; Ctrl+Shift+Z / Cmd+Shift+Z — redo
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undoLast();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        redoLast();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undoLast, redoLast]);

  const handleSelectWidget = useCallback((id, cardId) => {
    setSelectedWidgets([id]);
    setEditorCardId(cardId);
  }, []);

  const handleDeleteWidgets = useCallback((ids) => {
    updateWidgetLayouts(prev => {
      const rows = prev.rows
        .map(row => {
          const filtered = row.filter(w => !ids.includes(w.id));
          if (filtered.length === row.length) return row;
          if (filtered.length === 0) return [];
          const count = filtered.length;
          const base = Math.floor(12 / count);
          const rem = 12 - base * count;
          return filtered.map((w, i) => ({ ...w, span: base + (i < rem ? 1 : 0) }));
        })
        .filter(row => row.length > 0);
      return { ...prev, rows };
    });
    setSelectedWidgets([]);
  }, [updateWidgetLayouts]);

  const handleDeleteWidget = useCallback((id) => {
    handleDeleteWidgets([id]);
  }, [handleDeleteWidgets]);

  // Delete/Backspace removes selected widget(s) when editor is open
  useEffect(() => {
    const handler = (e) => {
      if (!selectedWidgets.length || !showEditor || _IS_VIEWER) return;
      if (e.key !== 'Delete' && e.key !== 'Backspace') return;
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) return;
      e.preventDefault();
      handleDeleteWidgets(selectedWidgets);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedWidgets, showEditor, handleDeleteWidgets]);

  // Ctrl+C / Cmd+C copy selected widgets; Ctrl+V / Cmd+V paste as new row
  useEffect(() => {
    const handler = (e) => {
      if (!showEditor || _IS_VIEWER) return;
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) return;
      if (!e.ctrlKey && !e.metaKey) return;

      if (e.key === 'c' || e.key === 'C') {
        if (!selectedWidgets.length) return;
        e.preventDefault();
        // Group by original row so paste can recreate the same row structure.
        // clipboard: Array<Array<{ layout, config }>> — one inner array per row.
        const rowGroups = (_layouts?.rows || [])
          .map(row => row
            .filter(w => selectedWidgets.includes(w.id))
            .map(w => ({ layout: { ...w }, config: { ...(widgetConfigs[w.id] || {}) } }))
          )
          .filter(group => group.length > 0);
        if (rowGroups.length) setClipboard(rowGroups);
      }

      if (e.key === 'v' || e.key === 'V') {
        if (!clipboard?.length) return;
        e.preventDefault();
        // Recreate each clipboard row as a separate new row with recalculated spans.
        const newRows = clipboard.map(rowGroup => {
          const count = rowGroup.length;
          const base = Math.floor(12 / count);
          const rem = 12 - base * count;
          return rowGroup.map((entry, i) => ({
            ...entry.layout,
            id: 'w_' + Math.random().toString(36).slice(2, 9),
            span: base + (i < rem ? 1 : 0),
          }));
        });
        const newConfigs = {};
        clipboard.forEach((rowGroup, ri) => {
          rowGroup.forEach((entry, i) => {
            newConfigs[newRows[ri][i].id] = { ...entry.config };
          });
        });
        // Push ONE combined undo entry covering both layout and config so a single Ctrl+Z
        // reverts the entire paste (bypassing updateWidgetLayouts/updateWidgetConfig to
        // avoid pushing two separate entries).
        undoHistory.current = [...undoHistory.current.slice(-19), { configs: widgetConfigs, layout: _layouts }];
        redoHistory.current = [];
        setHistoryLen(l => l + 1);
        setRedoLen(0);
        setWidgetLayouts(prev => {
          const cur = prev || _layouts;
          return { ...cur, rows: [...cur.rows, ...newRows] };
        });
        setWidgetConfigs(prev => ({ ...prev, ...newConfigs }));
        setSelectedWidgets(newRows.flat().map(w => w.id));
        // Scroll canvas to show the pasted rows (they're appended at the bottom)
        requestAnimationFrame(() => {
          canvasRef.current?.scrollTo({ top: canvasRef.current.scrollHeight, behavior: 'smooth' });
        });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showEditor, selectedWidgets, clipboard, _layouts, widgetConfigs, updateWidgetLayouts]);

  const handleWidgetConfigChange = useCallback((widgetId, changes) => {
    updateWidgetConfig(widgetId, changes);
  }, [updateWidgetConfig]);

  const adjustWidgetSpan = useCallback((rowIdx, id, delta) => {
    updateWidgetLayouts(prev => {
      const rows = prev.rows.map((row, ri) => {
        if (ri !== rowIdx) return row;
        const idx = row.findIndex(w => w.id === id);
        if (idx === -1) return row;
        const autoSpan = Math.floor(12 / row.length);
        const curSpan = row[idx].span || autoSpan;
        const newSpan = curSpan + delta;
        if (newSpan < 1 || newSpan > 11) return row;
        // Steal/give span from/to the nearest neighbour (prefer right, then left)
        const nbrIdx = idx < row.length - 1 ? idx + 1 : idx > 0 ? idx - 1 : -1;
        if (nbrIdx === -1) return row;
        const nbrSpan = row[nbrIdx].span || autoSpan;
        const newNbrSpan = nbrSpan - delta;
        if (newNbrSpan < 1) return row;
        return row.map((w, i) => {
          if (i === idx) return { ...w, span: newSpan };
          if (i === nbrIdx) return { ...w, span: newNbrSpan };
          return w;
        });
      });
      return { ...prev, rows };
    });
  }, [updateWidgetLayouts]);

  const handleSourceChange = useCallback((widgetId, newSource) => {
    // Always use the effective layout ref — handles the case where widgetLayouts is still null
    // (user hasn't dragged yet, smart default is in use) and avoids a null.rows crash.
    const baseLayouts = effectiveLayoutsRef.current;
    if (!baseLayouts) return;
    const widget = baseLayouts.rows.flat().find(w => w.id === widgetId);
    const widgetType = widget?.type || editorCardId;
    const defaults = window.WIDGET_DEFAULTS?.[widgetType]?.[newSource] || {};
    // Push ONE combined entry so Ctrl+Z reverts both the layout source and the config together.
    undoHistory.current = [...undoHistory.current.slice(-19), { configs: widgetConfigsRef.current, layout: baseLayouts }];
    redoHistory.current = [];
    setHistoryLen(l => l + 1);
    setRedoLen(0);
    setWidgetLayouts(() => ({
      ...baseLayouts,
      rows: baseLayouts.rows.map(row => row.map(w => w.id === widgetId ? { ...w, source: newSource } : w)),
    }));
    setWidgetConfigs(prev => ({ ...prev, [widgetId]: defaults }));
  }, [editorCardId]);
  const editState = showEditor && !_IS_VIEWER ? {
    selected: selectedWidgets,
    onSelect: handleSelectWidget,
    onDelete: handleDeleteWidget,
    onDeselect: () => setSelectedWidgets([]),
    onMultiSelect: (ids) => setSelectedWidgets(ids),
    onConfigChange: handleWidgetConfigChange,
    onAdjustSpan: adjustWidgetSpan,
  } : null;

  // Count how many widgets in the current layout share the same widget type as the selected widget
  const _layouts = widgetLayouts || getSmartDefaultLayout(client?.connected);
  effectiveLayoutsRef.current = _layouts; // keep ref fresh for callbacks (avoids stale-closure / null crash)
  const _primarySelected = selectedWidgets[0] || null;
  const sharedWidgetCount = (_primarySelected && editorCardId && _layouts)
    ? _layouts.rows.flat().filter(w => w.type === editorCardId || WIDGET_CARD_TYPES[w.id] === editorCardId).length
    : 0;
  const _selectedInstance = _primarySelected && _layouts
    ? _layouts.rows.flat().find(w => w.id === _primarySelected)
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
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--navy-base)', color: muted, fontFamily: T.mono, fontSize: 14 }}>
        Context not found — make sure data-bridge.jsx is loaded before screen-report.jsx.
      </div>
    );
  }

  const { currentPeriod, dateRange, setDateRange, loading, _isMock, fetchError, setAccount, setMetaAccount, setGa4Property, setGscProperty, psiUrl, setPsiUrl, psiApiKey, savePsiApiKey, _setAnySourceConnected } = live;
  const allClients = [...(window._avo_clients || []), ...(window.HOME_CLIENTS || [])];
  const client = allClients.find(c => c.id === clientId);
  const effectiveConnected = localConnected ?? client?.connected ?? {};

  // Reset localConnected when navigating to a different client
  useEffect(() => { setLocalConnected(null); }, [clientId]);

  const handleConnectedChange = useCallback(async (newConnected) => {
    const prev = localConnected ?? client?.connected ?? {};
    setLocalConnected(newConnected);
    if (clientId && window._saveClientConnected) {
      const { error } = await window._saveClientConnected(clientId, newConnected);
      if (error) {
        setLocalConnected(prev);
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        setToastMsg('Failed to save — changes were not saved.');
        toastTimerRef.current = setTimeout(() => setToastMsg(null), 4000);
      }
    }
  }, [clientId, localConnected, client?.connected]);

  // Expose current date range globally so widgets (e.g. KpiCompare) can read it
  useEffect(() => { window._reportDateRange = dateRange; }, [dateRange]);

  // Sync Google Ads account filter — re-fires via retry once _avo_clients loads
  useEffect(() => {
    if (!setAccount || !client) return;
    const g = effectiveConnected?.google;
    const accountName = (g && typeof g === 'object') ? (g.name || g.id) : (typeof g === 'string' ? g : '');
    setAccount(accountName || '');
  }, [clientId, retry, localConnected]);

  // Sync Meta Ads account filter
  // null → not connected (skip fetch); '' → connected, fetch all; 'name' → filtered
  useEffect(() => {
    if (!setMetaAccount || !client) return;
    const m = effectiveConnected?.meta;
    if (!m) { setMetaAccount(null); return; }
    const accountName = (typeof m === 'object') ? (m.name || m.id) : (typeof m === 'string' ? m : '');
    setMetaAccount(accountName || '');
  }, [clientId, retry, localConnected]);

  // Sync GA4 property filter
  // null → not connected (skip fetch); '' → connected, fetch all; 'name' → filtered
  useEffect(() => {
    if (!setGa4Property || !client) return;
    const g = effectiveConnected?.ga4;
    if (!g) { setGa4Property(null); return; }
    const prop = (typeof g === 'object') ? (g.name || g.id) : (typeof g === 'string' ? g : '');
    setGa4Property(prop || '');
  }, [clientId, retry, localConnected]);

  // Sync Search Console property filter
  // null → not connected (skip fetch); '' → connected, fetch all; 'prop' → filtered
  useEffect(() => {
    if (!setGscProperty || !client) return;
    const s = effectiveConnected?.search;
    if (!s) { setGscProperty(null); return; }
    const prop = (typeof s === 'object') ? (s.name || s.id) : (typeof s === 'string' ? s : '');
    setGscProperty(prop || '');
  }, [clientId, retry, localConnected]);

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
    const c = effectiveConnected;
    _setAnySourceConnected(!!(c.google || c.meta || c.ga4 || c.search || c.pagespeed));
  }, [clientId, client?.connected, localConnected]);

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
        <div style={{ fontFamily: T.mono, fontSize: 12, color: muted }}>ID: {clientId}</div>
        <button onClick={onBack} style={{
          padding: '9px 18px', background: 'linear-gradient(135deg,#00C2B8,#009E96)',
          border: 'none', borderRadius: 8, color: '#0C182C',
          fontFamily: T.display, fontSize: 14, fontWeight: 700, cursor: 'pointer',
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
        savedFlash={savedFlash}
      />

      {/* Main area: report + optional editor panel */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {/* Report content */}
        <div
          ref={canvasRef}
          style={{ flex: 1, overflowY: 'auto', padding: loading || !p ? 0 : '28px 36px 56px', position: 'relative' }}
          onPointerDown={editState ? (e) => {
            if (e.button !== 0) return;
            const isOnWidget = Object.values(widgetElemRefs.current).some(el => el && el.contains(e.target));
            if (isOnWidget) return;
            const rect = canvasRef.current.getBoundingClientRect();
            const scrollTop = canvasRef.current.scrollTop;
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top + scrollTop;
            marqueeScrollSpeed.current = 0;
            marqueePointerRef.current = { clientX: e.clientX, clientY: e.clientY };
            if (marqueeScrollRaf.current) { cancelAnimationFrame(marqueeScrollRaf.current); marqueeScrollRaf.current = null; }
            setMarquee({ startX: x, startY: y, x, y, w: 0, h: 0 });
            canvasRef.current.setPointerCapture(e.pointerId);
            e.preventDefault();
          } : undefined}
          onPointerMove={editState ? (e) => {
            if (!marquee) return;
            const rect = canvasRef.current.getBoundingClientRect();
            const scrollTop = canvasRef.current.scrollTop;
            const curX = e.clientX - rect.left;
            const curY = e.clientY - rect.top + scrollTop;
            const x = Math.min(curX, marquee.startX);
            const y = Math.min(curY, marquee.startY);
            const w = Math.abs(curX - marquee.startX);
            const h = Math.abs(curY - marquee.startY);
            setMarquee(prev => ({ ...prev, x, y, w, h }));
            // Auto-scroll when cursor is within 60px of the canvas top/bottom edge
            marqueePointerRef.current = { clientX: e.clientX, clientY: e.clientY };
            const ZONE = 60, MAX_SPEED = 12;
            const relY = e.clientY - rect.top;
            let speed = 0;
            if (relY < ZONE) speed = -Math.round((ZONE - relY) / ZONE * MAX_SPEED);
            else if (relY > rect.height - ZONE) speed = Math.round((relY - (rect.height - ZONE)) / ZONE * MAX_SPEED);
            marqueeScrollSpeed.current = speed;
            if (speed !== 0 && !marqueeScrollRaf.current) {
              marqueeScrollRaf.current = requestAnimationFrame(scrollMarqueeFrame);
            }
          } : undefined}
          onPointerUp={editState ? (e) => {
            marqueeScrollSpeed.current = 0;
            if (marqueeScrollRaf.current) { cancelAnimationFrame(marqueeScrollRaf.current); marqueeScrollRaf.current = null; }
            if (!marquee) return;
            const canvasRect = canvasRef.current.getBoundingClientRect();
            const scrollTop = canvasRef.current.scrollTop;
            const sel = { x: marquee.x, y: marquee.y, w: marquee.w, h: marquee.h };
            const hit = [];
            Object.entries(widgetElemRefs.current).forEach(([id, el]) => {
              if (!el) return;
              const r = el.getBoundingClientRect();
              const ex = r.left - canvasRect.left;
              const ey = r.top - canvasRect.top + scrollTop;
              const ew = r.width;
              const eh = r.height;
              const overlaps = ex < sel.x + sel.w && ex + ew > sel.x && ey < sel.y + sel.h && ey + eh > sel.y;
              if (overlaps) hit.push(id);
            });
            if (hit.length > 0) editState.onMultiSelect(hit);
            else editState.onDeselect();
            setMarquee(null);
          } : undefined}
          onPointerCancel={editState ? () => {
            marqueeScrollSpeed.current = 0;
            if (marqueeScrollRaf.current) { cancelAnimationFrame(marqueeScrollRaf.current); marqueeScrollRaf.current = null; }
            setMarquee(null);
          } : undefined}
        >

          {loading && (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#00C2B8,#009E96)', animation: 'bootPulse 1.4s ease-in-out infinite' }}/>
              <div style={{ fontFamily: T.mono, fontSize: 12, color: muted, textTransform: 'uppercase', letterSpacing: '0.14em' }}>Loading data…</div>
            </div>
          )}

          {!loading && !p && (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontFamily: T.mono, fontSize: 13, color: muted }}>No data for this period.</div>
            </div>
          )}

          {!loading && p && (
            <>
              {fetchError && fetchError.length > 0 && (
                <div style={{
                  margin: '8px 16px 0', padding: '8px 14px',
                  background: 'rgba(220,38,38,.1)', border: '1px solid rgba(220,38,38,.3)',
                  borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 13,
                  color: '#F87171', display: 'flex', gap: 8, alignItems: 'flex-start',
                }}>
                  <span>⚠</span>
                  <span>Data source error: {fetchError.join(' · ')} — showing partial data.</span>
                </div>
              )}

              {/* Page title */}
              <div style={{ marginBottom: 28 }}>
                <h1 style={{ margin: 0, fontFamily: T.display, fontSize: 24, fontWeight: 800, color: fg, letterSpacing: '-0.02em' }}>
                  Laporan Performa
                </h1>
                <div style={{ fontFamily: T.mono, fontSize: 12, color: muted, marginTop: 5, textTransform: 'uppercase', letterSpacing: '0.14em' }}>
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
                    widgetElemRefs={widgetElemRefs}
                    scrollContainerRef={canvasRef}
                    psiUrl={psiUrl}
                    psiApiKey={psiApiKey}
                    savePsiApiKey={savePsiApiKey}
                  />
                </>
              ) : null}
            </>
          )}

          {/* Marquee selection overlay */}
          {marquee && marquee.w > 4 && marquee.h > 4 && (
            <div style={{
              position: 'absolute',
              left: marquee.x,
              top: marquee.y,
              width: marquee.w,
              height: marquee.h,
              border: '1.5px solid #00C2B8',
              background: 'rgba(0,194,184,0.08)',
              borderRadius: 4,
              pointerEvents: 'none',
              zIndex: 9999,
            }} />
          )}
        </div>

        {/* Jump-to-selected floating button: appears when selected widget is off-screen */}
        {jumpDir && _primarySelected && showEditor && (
          <button
            onClick={() => {
              const el = widgetElemRefs.current[_primarySelected];
              el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
            style={{
              position: 'absolute',
              ...(jumpDir === 'up' ? { top: 16 } : { bottom: 16 }),
              left: 24, zIndex: 60,
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px 6px 10px',
              background: 'rgba(8,16,34,.95)', border: '1px solid rgba(0,194,184,.5)',
              borderRadius: 20, cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(0,0,0,.5)',
              fontFamily: 'var(--font-mono)', fontSize: 12, color: teal,
              letterSpacing: '0.04em', backdropFilter: 'blur(8px)',
            }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={teal} strokeWidth="2.5" strokeLinecap="round">
              {jumpDir === 'up'
                ? <><path d="M12 19V5"/><path d="M5 12l7-7 7 7"/></>
                : <><path d="M12 5v14"/><path d="M5 12l7 7 7-7"/></>
              }
            </svg>
            Loncat ke widget dipilih
          </button>
        )}

        {/* Card editor panel (slide in from right) */}
        {showEditor && window.CardEditorPanel && (
          <window.CardEditorPanel
            cardId={editorCardId}
            widgetId={_primarySelected}
            widgetConfig={_primarySelected ? (widgetConfigs[_primarySelected] || {}) : {}}
            onConfigChange={handleWidgetConfigChange}
            onUndo={historyLen > 0 ? undoLast : null}
            connectedSources={effectiveConnected}
            onClose={() => setShowEditor(false)}
            sharedWidgetCount={sharedWidgetCount}
            instanceSource={instanceSource}
            onSourceChange={handleSourceChange}
            onConnectedChange={handleConnectedChange}
            pageData={p}
            layoutRows={_layouts?.rows?.flat() || []}
            style={{ flexShrink: 0 }}
          />
        )}
        {showEditor && !window.CardEditorPanel && (
          <div style={{
            width: 320, flexShrink: 0,
            background: 'rgba(10,18,34,.97)', borderLeft: '1px solid var(--navy-edge)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12,
          }}>
            <div style={{ fontFamily: T.mono, fontSize: 12, color: muted, textAlign: 'center', padding: '0 24px', lineHeight: 1.6 }}>
              Card editor unavailable.<br/>Make sure card-editor.jsx is loaded.
            </div>
            <button onClick={() => setShowEditor(false)} style={{
              padding: '6px 16px', background: 'var(--navy-elevated)', border: '1px solid var(--navy-edge)',
              borderRadius: 6, color: sec, fontFamily: T.display, fontSize: 13, cursor: 'pointer',
            }}>Close</button>
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

      {/* Save-error toast */}
      {toastMsg && (
        <div style={{
          position: 'fixed', bottom: 24, right: showEditor ? 340 : 20, zIndex: 8000,
          background: '#DC2626', color: '#fff', borderRadius: 8, padding: '10px 16px',
          fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.4,
          boxShadow: '0 4px 16px rgba(0,0,0,.4)', maxWidth: 280,
        }}>
          {toastMsg}
        </div>
      )}

    </div>
  );
}

window.ScreenReport = ScreenReport;
