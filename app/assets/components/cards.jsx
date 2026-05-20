// Reportive — Card library
// 7 categories × multiple variants. Every card is a self-contained surface
// that fits in a grid cell and uses AVQ tokens. Cards accept no data props
// by default — each variant is a concrete example with real copy, so the
// dashboard can swap by ID and get a pre-wired card.
//
// Registration: each card is `{ id, cat, title, w (grid spans, 1..4), render }`
// → exposed as window.CARDS so the dashboard and sticker sheet can index by id.

// ─── small utilities ─────────────────────────────────────────────
const T = {
  display: 'var(--font-display)',
  body:    'var(--font-body)',
  mono:    'var(--font-mono)',
};
const muted = 'var(--text-muted)';
const sec   = 'var(--text-secondary)';
const fg    = '#FCFCFC';
const teal  = '#00C2B8';
const gold  = '#F8B400';
const violet = '#7000FF';

const Eyebrow = ({ children, color = muted }) => (
  <div style={{ fontFamily: T.mono, fontSize: 11, color, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600 }}>{children}</div>
);
const CardTitle = ({ children, size = 14 }) => (
  <div style={{ fontFamily: T.display, fontSize: size, fontWeight: 700, color: fg, letterSpacing: '-0.01em' }}>{children}</div>
);
const CardSub = ({ children }) => (
  <div style={{ fontFamily: T.body, fontSize: 12, color: muted, marginTop: 2 }}>{children}</div>
);
const Num = ({ children, size = 26, color = fg }) => (
  <div style={{ fontFamily: T.display, fontSize: size, fontWeight: 800, color, letterSpacing: '-0.02em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{children}</div>
);
const MonoCell = ({ children, color = fg, size = 11, align = 'right' }) => (
  <span style={{ fontFamily: T.mono, fontSize: size, color, textAlign: align, fontVariantNumeric: 'tabular-nums' }}>{children}</span>
);

// ═════════════════════════════════════════════════════════════════
// 1 · TEXT / NARRATIVE
// ═════════════════════════════════════════════════════════════════

// hero banner with analyst summary + CTAs
const NarrativeHero = () => (
  <RCard padding={20} style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg,rgba(0,194,184,.06),rgba(248,180,0,.04))' }}>
    <div style={{ position: 'absolute', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle,rgba(248,180,0,.18),transparent 70%)', filter: 'blur(60px)', top: -120, right: -60 }}/>
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <RStatus type="connected" label="4 sources live"/>
        <Eyebrow>Last sync 2 min ago</Eyebrow>
      </div>
      <div style={{ fontFamily: T.display, fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: fg, lineHeight: 1.2 }}>Marketing performance March 2025 <span style={{ color: teal }}>up 19.7%</span></div>
      <p style={{ fontFamily: T.body, fontSize: 12.5, color: sec, margin: '8px 0 12px', maxWidth: 560, lineHeight: 1.5 }}>Conversions increased as budget shifted to Google Ads. Organic SEO grew 8.1% without additional spend. Recommend continuing current strategy.</p>
      <div style={{ display: 'flex', gap: 6 }}>
        <button style={{ padding: '7px 12px', background: 'transparent', color: sec, border: '1px solid var(--navy-edge)', borderRadius: 8, fontFamily: T.display, fontSize: 11.5, fontWeight: 600, cursor: 'pointer' }}>Share with client</button>
        <button style={{ padding: '7px 12px', background: 'var(--navy-elevated)', color: fg, border: '1px solid var(--navy-edge)', borderRadius: 8, fontFamily: T.display, fontSize: 11.5, fontWeight: 600, cursor: 'pointer' }}>View details →</button>
      </div>
    </div>
  </RCard>
);

// 3-beat analyst note
const AnalystNote = () => (
  <RCard padding={16} style={{ background: 'linear-gradient(135deg,rgba(0,194,184,.04),rgba(248,180,0,.02))' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
      <div style={{ width: 22, height: 22, background: 'rgba(0,194,184,.14)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="12" height="12" fill="none" stroke={teal} strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      </div>
      <Eyebrow color={teal}>Analyst note · March 2025</Eyebrow>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
      {[
        ['📊', 'What happened', 'Total spend up 12.4% MoM, offset by a 19.7% increase in conversions.'],
        ['💡', 'Why it matters', 'Google Ads remains the top ROAS contributor (4.1x). SEO grew without additional budget.'],
        ['🎯', 'Next action', 'Shift 15% of retargeting budget to Google Ads brand awareness for Q2.'],
      ].map(([e, t, b]) => (
        <div key={t} style={{ display: 'flex', gap: 10 }}>
          <span style={{ fontSize: 14 }}>{e}</span>
          <div>
            <div style={{ fontFamily: T.display, fontSize: 12, fontWeight: 700, color: fg }}>{t}</div>
            <div style={{ fontFamily: T.body, fontSize: 11.5, color: sec, lineHeight: 1.5, marginTop: 2 }}>{b}</div>
          </div>
        </div>
      ))}
    </div>
  </RCard>
);

// single-column callout
const Callout = () => (
  <RCard padding={16} style={{ borderLeft: `3px solid ${gold}` }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
      <div style={{ width: 22, height: 22, background: 'rgba(248,180,0,.14)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="12" height="12" fill="none" stroke={gold} strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2l2.35 7.24h7.61l-6.16 4.47 2.35 7.24L12 16.48l-6.16 4.47 2.35-7.24L2.04 9.24h7.61z"/></svg>
      </div>
      <Eyebrow color={gold}>Opportunity</Eyebrow>
    </div>
    <CardTitle>3 pages at positions #4–#7 could move to top-3</CardTitle>
    <p style={{ fontFamily: T.body, fontSize: 11.5, color: sec, margin: '6px 0 0', lineHeight: 1.5 }}>"Specialty Coffee Guide" (#4), "V60 Brewing" (#5), "Bold Brew" (#7) can be lifted with internal linking + 2 backlinks. Estimated +3,200 sessions/month.</p>
    <button style={{ marginTop: 10, padding: '7px 12px', background: 'linear-gradient(135deg,#F8B400,#FFCA3A)', color: '#0C182C', border: 'none', borderRadius: 8, fontFamily: T.display, fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}>Create action plan →</button>
  </RCard>
);

// quote / testimonial style
const QuoteCard = () => (
  <RCard padding={18}>
    <svg width="22" height="16" viewBox="0 0 22 16" fill={teal} style={{ opacity: 0.5 }}><path d="M0 16V8c0-4.4 3.6-8 8-8v3c-2.8 0-5 2.2-5 5h5v8H0zm12 0V8c0-4.4 3.6-8 8-8v3c-2.8 0-5 2.2-5 5h5v8h-8z"/></svg>
    <p style={{ fontFamily: T.body, fontSize: 13, color: fg, margin: '10px 0 12px', lineHeight: 1.55, fontWeight: 500 }}>"Monthly reports are now prepared so much faster. Clients get insights directly, not raw tables."</p>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#00C2B8,#7000FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.display, fontWeight: 700, fontSize: 12, color: '#0C182C' }}>DP</div>
      <div>
        <div style={{ fontFamily: T.display, fontSize: 12, fontWeight: 700, color: fg }}>Dimas Pratama</div>
        <div style={{ fontFamily: T.mono, fontSize: 10, color: muted }}>Client · PT Kopi Senja Nusantara</div>
      </div>
    </div>
  </RCard>
);

// ═════════════════════════════════════════════════════════════════
// 2 · DATA / KPI
// ═════════════════════════════════════════════════════════════════

// single-stat (replica of RMetric but standalone variant)
const KpiSingle = ({ label = 'Conversions', value = '1.284', delta = 19.7, compare = 'vs Feb 2025', accent = teal, spark = [10, 11, 13, 12, 15, 17, 22] }) => (
  <RCard accent={accent} padding={16}>
    <Eyebrow>{label}</Eyebrow>
    <div style={{ marginTop: 6 }}><Num>{value}</Num></div>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <RDelta value={delta}/>
        <span style={{ fontFamily: T.body, fontSize: 10, color: muted }}>{compare}</span>
      </div>
      <Spark data={spark} color={accent}/>
    </div>
  </RCard>
);

// compact KPI strip (4 stats on one card, no sparks)
const KpiStrip = () => (
  <RCard padding={0}>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)' }}>
      {[
        ['Spend', 'Rp 48,5 Jt', 12.4, gold],
        ['Conv.', '1.284', 19.7, teal],
        ['ROAS', '3,82x', 4.1, teal],
        ['Sessions', '24.830', 8.1, violet],
      ].map(([l, v, d, c], i) => (
        <div key={l} style={{ padding: '14px 16px', borderLeft: i ? '1px solid var(--navy-edge)' : 'none' }}>
          <Eyebrow>{l}</Eyebrow>
          <Num size={20}>{v}</Num>
          <div style={{ marginTop: 6 }}><RDelta value={d}/></div>
          <div style={{ marginTop: 2, height: 2, background: c, width: 28, borderRadius: 1 }}/>
        </div>
      ))}
    </div>
  </RCard>
);

// comparison side-by-side (two periods)
const _MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const _autoKpiLabel = () => {
  const dr = window._reportDateRange;
  if (!dr || !dr.to) return null;
  const toD   = new Date(dr.to + 'T00:00:00');
  const cur   = _MONTHS[toD.getMonth()] + ' ' + toD.getFullYear();
  const prevD = new Date(toD.getFullYear(), toD.getMonth() - 1, 1);
  const prev  = _MONTHS[prevD.getMonth()] + ' ' + prevD.getFullYear();
  return cur + ' vs ' + prev;
};

const KpiCompare = ({ instance, p, cfg = {}, overrideLabel, overrideCurrentVal, overridePrevVal, overrideFormat }) => {
  const reg = (instance && p) ? (window.DATA_REGISTRY?.[instance.source] || {}) : {};
  const key = cfg.metric;
  const def = key ? (reg[key] || {}) : {};

  const isOverride  = overrideCurrentVal != null;
  const currentVal  = isOverride ? overrideCurrentVal : (def.value ? def.value(p) : 1284);
  const prevVal     = isOverride ? overridePrevVal    : (def.prev  ? def.prev(p)  : 1073);
  const label       = cfg.name || overrideLabel || def.label || key || 'Conversions';
  const periodLabel = _autoKpiLabel() || 'Current vs Previous';
  const customGoal  = cfg.goalValue != null ? Number(cfg.goalValue) : null;
  const goalVal     = customGoal != null ? customGoal : (prevVal || null);
  const goalIsCustom = customGoal != null;
  const delta       = (prevVal != null && currentVal != null && prevVal > 0)
    ? ((currentVal - prevVal) / prevVal) * 100 : null;
  const goalPct     = goalVal > 0 ? Math.round((currentVal / goalVal) * 100) : null;
  const barFill     = goalVal > 0 ? Math.min(100, (currentVal / goalVal) * 100) : 100;

  const isDetail = cfg.numberFormat === 'detail';
  const fmt = isOverride ? overrideFormat : (def.format || 'num');
  const fmtN = n => {
    if (n == null || isNaN(n)) return '—';
    if (fmt === 'pct') return (n >= 0 && n <= 1 ? (n * 100) : n).toFixed(1) + '%';
    if (fmt === 'rupiah') {
      if (isDetail) return 'Rp ' + Math.round(n).toLocaleString('en-US');
      if (n >= 1000000) return 'Rp ' + (n/1000000).toFixed(1).replace(/\.0$/,'') + 'M';
      if (n >= 1000)    return 'Rp ' + (n/1000).toFixed(1).replace(/\.0$/,'') + 'K';
      return 'Rp ' + Math.round(n).toLocaleString('en-US');
    }
    if (isDetail) return Math.round(n).toLocaleString('en-US');
    if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1000)    return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return String(Math.round(n));
  };
  const fmtDiff = d => {
    if (d == null || isNaN(d)) return '—';
    const sign = d > 0 ? '+' : d < 0 ? '-' : '';
    return sign + fmtN(Math.abs(d));
  };
  const diffVsGoal = (goalVal != null && currentVal != null) ? currentVal - goalVal : null;
  return (
    <RCard padding={18}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div>
          <CardTitle size={13}>{label}</CardTitle>
          <CardSub>{periodLabel}</CardSub>
        </div>
        {delta != null && <RDelta value={Math.round(delta * 10) / 10}/>}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 18 }}>
        <div>
          <Eyebrow>Current</Eyebrow>
          <Num size={32} color={teal}>{fmtN(currentVal)}</Num>
        </div>
        <div style={{ flex: 1, height: 1, background: 'var(--navy-edge)' }}/>
        <div style={{ textAlign: 'right' }}>
          <Eyebrow>Previous</Eyebrow>
          <Num size={22} color={sec}>{fmtN(prevVal)}</Num>
        </div>
      </div>
      {goalVal != null && goalVal > 0 && (
        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, height: 6, background: 'var(--navy-deep)', borderRadius: 3, overflow: 'hidden', display: 'flex' }}>
            <div style={{ width: `${barFill}%`, background: `linear-gradient(90deg, ${teal}, ${gold})` }}/>
          </div>
          <MonoCell color={muted} size={10}>{goalIsCustom ? 'vs goal' : 'vs prev'} {fmtDiff(diffVsGoal)}</MonoCell>
        </div>
      )}
    </RCard>
  );
};

// ═════════════════════════════════════════════════════════════════
// 3 · CHARTS
// ═════════════════════════════════════════════════════════════════

// Dual-area trend: gold + teal overlapping areas, KPI callouts per series
const ChartAreaDual = () => (
  <RCard padding={18}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
      <div>
        <Eyebrow>Paid channels · March 2025</Eyebrow>
        <CardTitle size={13}>Spend vs Conversions</CardTitle>
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: T.mono, fontSize: 9, color: gold, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Spend</div>
          <div style={{ fontFamily: T.display, fontSize: 15, fontWeight: 800, color: fg, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>Rp 38M</div>
          <div style={{ fontFamily: T.mono, fontSize: 9, color: '#16A34A' }}>▲ 12.4%</div>
        </div>
        <div style={{ width: 1, height: 32, background: 'var(--navy-edge)' }}/>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: T.mono, fontSize: 9, color: teal, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Conv.</div>
          <div style={{ fontFamily: T.display, fontSize: 15, fontWeight: 800, color: fg, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>1,284</div>
          <div style={{ fontFamily: T.mono, fontSize: 9, color: '#16A34A' }}>▲ 19.7%</div>
        </div>
      </div>
    </div>
    <div style={{ display: 'flex', gap: 14, marginBottom: 8 }}>
      <span style={{ fontFamily: T.mono, fontSize: 9, color: muted, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
        <span style={{ display: 'inline-block', width: 16, height: 2, background: gold, borderRadius: 1 }}/>SPEND
      </span>
      <span style={{ fontFamily: T.mono, fontSize: 9, color: muted, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
        <span style={{ display: 'inline-block', width: 16, height: 2, background: teal, borderRadius: 1 }}/>CONVERSIONS
      </span>
    </div>
    <MultiArea
      seriesA={[14, 17, 22, 19, 28, 25, 33, 36, 38]}
      seriesB={[10, 13, 16, 14, 20, 22, 26, 30, 34]}
      labelsX={['Feb 3', 'Feb 10', 'Feb 17', 'Feb 24', 'Mar 3', 'Mar 10', 'Mar 17', 'Mar 24', 'Mar 31']}
      colorA={gold}
      colorB={teal}
      w={520}
      h={130}
    />
  </RCard>
);

// Violet area chart with full X/Y axes — visually distinct from the dual-area above
const ChartAreaWithAxes = () => {
  const data = [8, 12, 14, 18, 22, 25, 28, 31, 29, 26, 24];
  const axMax = 35, axMin = 0;
  const w = 480, h = 220;
  const pxF = (i) => 52 + (i / (data.length - 1)) * (w - 72);
  const pyF = (v) => (h - 44) - ((v - axMin) / (axMax - axMin)) * (h - 80);
  const linePath = data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${pxF(i).toFixed(1)} ${pyF(v).toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L ${pxF(data.length - 1).toFixed(1)} ${h - 44} L ${pxF(0).toFixed(1)} ${h - 44} Z`;
  const xLabels = ['Mar 1','Mar 2','Mar 3','Mar 4','Mar 5','Mar 6','Mar 7','Mar 8','Mar 9','Mar 10','Mar 11'];
  return (
    <RCard padding={18}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <Eyebrow>Daily revenue · March 1–11, 2025</Eyebrow>
          <CardTitle size={13}>Revenue Trend</CardTitle>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: T.mono, fontSize: 9, color: violet, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Peak</div>
          <div style={{ fontFamily: T.display, fontSize: 15, fontWeight: 800, color: fg, letterSpacing: '-0.02em' }}>Rp 31M</div>
          <div style={{ fontFamily: T.mono, fontSize: 9, color: '#16A34A' }}>▲ Day 8</div>
        </div>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', display: 'block' }}>
        <defs>
          <linearGradient id="ax-grad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={violet} stopOpacity="0.3"/>
            <stop offset="100%" stopColor={violet} stopOpacity="0"/>
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
          <line key={i} x1="52" x2={w - 20} y1={36 + (h - 80) * t} y2={36 + (h - 80) * t} stroke="#1e2d44" strokeDasharray="3,4" strokeWidth="0.8"/>
        ))}
        <line x1="52" y1={h - 44} x2={w - 20} y2={h - 44} stroke="#334155" strokeWidth="1"/>
        <line x1="52" y1="36" x2="52" y2={h - 44} stroke="#334155" strokeWidth="1"/>
        {[0, 10, 20, 30].map((val) => (
          <g key={val}>
            <text x="44" y={pyF(val) + 4} fontFamily="DM Mono" fontSize="9" fill={muted} textAnchor="end">{val}</text>
            <line x1="50" y1={pyF(val)} x2="52" y2={pyF(val)} stroke="#334155" strokeWidth="1"/>
          </g>
        ))}
        {data.map((_, i) => i % 2 === 0 && (
          <text key={i} x={pxF(i)} y={h - 28} fontFamily="DM Mono" fontSize="9" fill={muted} textAnchor="middle">{xLabels[i]}</text>
        ))}
        <text x="22" y={h / 2} fontFamily="DM Mono" fontSize="9" fill={muted} textAnchor="middle" letterSpacing="0.08em" transform={`rotate(-90 22 ${h / 2})`}>REVENUE</text>
        <path d={areaPath} fill="url(#ax-grad)"/>
        <path d={linePath} fill="none" stroke={violet} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
        {data.map((v, i) => (
          <circle key={i} cx={pxF(i)} cy={pyF(v)} r="3" fill={violet} stroke="#0C182C" strokeWidth="1.5"/>
        ))}
      </svg>
    </RCard>
  );
};

// Solo line with large KPI — clean thin line (no fill) on dark bg, fully responsive
const ChartLineSolo = () => {
  const data = [15.2, 16.1, 15.4, 17.3, 17.9, 18.6, 19.4, 20.2, 21.5, 22.9, 23.6, 24.8];
  const labels = ['J','F','M','A','M','J','J','A','S','O','N','D'];
  const w = 400, h = 88;
  const pL = 6, pR = 6, pT = 8, pB = 16;
  const dmax = Math.max(...data), dmin = Math.min(...data) - 0.8;
  const px = (i) => pL + (i / (data.length - 1)) * (w - pL - pR);
  const py = (v) => pT + (1 - (v - dmin) / (dmax - dmin + 0.8)) * (h - pT - pB);
  const linePath = data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${px(i).toFixed(1)} ${py(v).toFixed(1)}`).join(' ');
  return (
    <RCard padding={18}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <Eyebrow>Organic Traffic</Eyebrow>
          <Num size={30}>24.830</Num>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5 }}>
            <RDelta value={8.1}/>
            <span style={{ fontFamily: T.mono, fontSize: 9, color: muted }}>vs last year</span>
          </div>
        </div>
        <div style={{ fontFamily: T.mono, fontSize: 9, color: muted, textAlign: 'right', lineHeight: 1.6, marginTop: 2 }}>
          <div style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>12-month</div>
          <div style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>trend</div>
        </div>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', display: 'block' }}>
        {[0.33, 0.66].map((t, i) => (
          <line key={i} x1={pL} x2={w - pR} y1={pT + (h - pT - pB) * t} y2={pT + (h - pT - pB) * t}
            stroke="#1e2d44" strokeWidth="0.8" strokeDasharray="2,4"/>
        ))}
        <path d={linePath} fill="none" stroke={teal} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx={px(data.length - 1)} cy={py(data[data.length - 1])} r="4" fill={teal} stroke="#0A1222" strokeWidth="1.5"/>
        {data.map((_, i) => i % 3 === 0 && (
          <text key={i} x={px(i)} y={h - 2} fontFamily="DM Mono" fontSize="8.5" fill="#475569" textAnchor="middle">{labels[i]}</text>
        ))}
      </svg>
    </RCard>
  );
};

// Budget pacing bar chart — responsive inline SVG, target line, color-coded status
const ChartBarPacing = () => {
  const rawData = Array.from({ length: 12 }, (_, i) => parseFloat((0.75 + Math.sin(i * 0.6) * 0.22 + (i / 12) * 0.18).toFixed(2)));
  const weeks = ['W1','W2','W3','W4','W5','W6','W7','W8','W9','W10','W11','W12'];
  const doneUntil = 9;
  const target = 1.0;
  const w = 400, h = 96;
  const gap = 5, n = rawData.length;
  const bw = (w - gap * (n - 1)) / n;
  const chartMax = 1.25;
  const bH = (v) => ((v / chartMax) * (h - 18));
  const bX = (i) => i * (bw + gap);
  const bY = (v) => h - 12 - bH(v);
  const targetY = h - 12 - ((target / chartMax) * (h - 18));
  return (
    <RCard padding={18}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <Eyebrow>Weekly spend · March 2025</Eyebrow>
          <CardTitle size={13}>Budget Pacing</CardTitle>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: T.mono, fontSize: 9, color: muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Week</div>
          <div style={{ fontFamily: T.display, fontSize: 15, fontWeight: 800, color: '#4285F4', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>{doneUntil}/{n}</div>
          <div style={{ fontFamily: T.mono, fontSize: 9, color: '#16A34A' }}>on track</div>
        </div>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', display: 'block' }}>
        <line x1="0" x2={w} y1={targetY} y2={targetY} stroke={gold} strokeWidth="1.2" strokeDasharray="5,4" opacity="0.7"/>
        <text x={w - 2} y={targetY - 4} fontFamily="DM Mono" fontSize="8" fill={gold} textAnchor="end" opacity="0.8">TARGET</text>
        {rawData.map((v, i) => {
          const done = i < doneUntil;
          const over = v >= target;
          const fill = !done ? '#1e2d44' : over ? '#16A34A' : '#4285F4';
          return (
            <rect key={i} x={bX(i)} y={bY(v)} width={bw} height={bH(v)} rx="2.5"
              fill={fill} opacity={done ? 0.85 : 0.35}/>
          );
        })}
        {rawData.map((_, i) => i % 3 === 0 && (
          <text key={i} x={bX(i) + bw / 2} y={h - 1} fontFamily="DM Mono" fontSize="8" fill="#475569" textAnchor="middle">{weeks[i]}</text>
        ))}
      </svg>
      <div style={{ display: 'flex', gap: 14, marginTop: 7 }}>
        <span style={{ fontFamily: T.mono, fontSize: 9, color: muted, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <span style={{ display: 'inline-block', width: 8, height: 8, background: '#4285F4', borderRadius: 2 }}/>Under target
        </span>
        <span style={{ fontFamily: T.mono, fontSize: 9, color: muted, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <span style={{ display: 'inline-block', width: 8, height: 8, background: '#16A34A', borderRadius: 2 }}/>Over target
        </span>
        <span style={{ fontFamily: T.mono, fontSize: 9, color: muted, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <span style={{ display: 'inline-block', width: 8, height: 8, background: '#1e2d44', borderRadius: 2, opacity: 0.9 }}/>Upcoming
        </span>
      </div>
    </RCard>
  );
};

const ChartDonutMix = () => (
  <RCard padding={18}>
    <CardTitle>Spend mix</CardTitle>
    <div style={{ display: 'flex', gap: 18, alignItems: 'center', marginTop: 14 }}>
      <MiniDonut
        size={140} thickness={10}
        segments={[
          { value: 48, color: gold },
          { value: 34, color: teal },
          { value: 18, color: violet },
        ]}
        centerLabel="48,5" centerSub="Jt IDR"
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[['Google Ads', gold, '48%', 'Rp 23,3 Jt'], ['Meta Ads', teal, '34%', 'Rp 16,5 Jt'], ['Retargeting', violet, '18%', 'Rp 8,7 Jt']].map(([l, c, p, rp]) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5 }}>
            <span style={{ width: 8, height: 8, background: c, borderRadius: 2 }}/>
            <span style={{ flex: 1, fontFamily: T.body, color: sec }}>{l}</span>
            <MonoCell color={fg}>{p}</MonoCell>
            <MonoCell color={muted} size={10}>{rp}</MonoCell>
          </div>
        ))}
      </div>
    </div>
  </RCard>
);

const ChartHeatmap = () => (
  <RCard padding={18}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
      <div><CardTitle>Traffic by hour × day</CardTitle><CardSub>GA4 · last 7 days</CardSub></div>
      <MonoCell color={muted} size={10} align="right">Peak Sat 20:00</MonoCell>
    </div>
    {(() => {
      const rows = 7, cols = 12;
      const rng = (r, c) => {
        const peak = (c >= 6 && c <= 9) + (r === 5 || r === 6 ? 0.4 : 0);
        return Math.max(0, Math.min(1, 0.15 + peak * 0.5 + Math.sin(r + c) * 0.15));
      };
      const vals = Array.from({ length: rows }, (_, r) => Array.from({ length: cols }, (_, c) => rng(r, c)));
      return <MiniHeatmap rows={rows} cols={cols} values={vals} labelsRow={['M', 'T', 'W', 'T', 'F', 'S', 'S']} labelsCol={['0', '2', '4', '6', '8', '10', '12', '14', '16', '18', '20', '22']} cell={22} color={teal}/>;
    })()}
  </RCard>
);

const ChartSparkRow = () => (
  <RCard padding={0}>
    <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--navy-edge)' }}>
      <CardTitle size={13}>Channel momentum</CardTitle>
    </div>
    {[
      ['Google Ads', 'google', [12, 14, 13, 16, 18, 17, 19], 8.2, gold],
      ['Meta Ads', 'meta', [10, 11, 13, 12, 14, 14, 15], 5.6, teal],
      ['GA4 Direct', 'ga4', [8, 9, 9, 10, 11, 11, 12], 2.4, gold],
      ['Search Console', 'search', [6, 7, 8, 8, 9, 10, 12], 12.1, teal],
    ].map(([label, ch, data, d, c], i) => (
      <div key={label} style={{ display: 'grid', gridTemplateColumns: '24px 1fr 80px 50px', alignItems: 'center', gap: 10, padding: '8px 16px', borderTop: i ? '1px solid rgba(51,71,102,.4)' : 'none' }}>
        <ChannelLogo channel={ch} size={16}/>
        <span style={{ fontFamily: T.body, fontSize: 12, color: fg }}>{label}</span>
        <Spark data={data} color={c} w={80} h={20}/>
        <div style={{ textAlign: 'right' }}><RDelta value={d}/></div>
      </div>
    ))}
  </RCard>
);

// ═════════════════════════════════════════════════════════════════
// 4 · TABLES
// ═════════════════════════════════════════════════════════════════

const TableChannels = () => (
  <RCard padding={0} style={{ overflow: 'hidden' }}>
    <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--navy-edge)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div><CardTitle>Channel Summary</CardTitle><CardSub>Performance by integration source</CardSub></div>
      <a style={{ fontFamily: T.display, fontSize: 11.5, color: teal, fontWeight: 600 }}>Manage integrations →</a>
    </div>
    <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.body, fontSize: 12 }}>
      <thead>
        <tr style={{ background: 'var(--navy-deep)' }}>
          {['Channel', 'Status', 'Spend', 'Impr.', 'Clicks', 'CTR', 'Conv.', 'ROAS', 'Trend'].map(h => (
            <th key={h} style={{ padding: '8px 14px', textAlign: h === 'Channel' ? 'left' : 'right', fontFamily: T.mono, fontSize: 9.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: muted }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {[
          ['google', 'Google Ads', 'active', 'Rp 23,3 Jt', '482.300', '18.240', '3,78%', '628', '4,1x', [12, 14, 13, 16, 18, 17, 19]],
          ['meta', 'Meta Ads', 'active', 'Rp 16,5 Jt', '612.400', '22.130', '3,61%', '489', '3,4x', [10, 11, 13, 12, 14, 14, 15]],
          ['ga4', 'GA4 · Direct', 'connected', '—', '—', '8.210', '—', '142', '—', [8, 9, 9, 10, 11, 11, 12]],
          ['search', 'Search Console', 'connected', '—', '94.600', '3.120', '3,30%', '25', '—', [6, 7, 8, 8, 9, 10, 12]],
        ].map((r, i) => (
          <tr key={i} style={{ borderTop: '1px solid rgba(51,71,102,.5)' }}>
            <td style={{ padding: '10px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 28, height: 28, background: 'var(--navy-deep)', border: '1px solid var(--navy-edge)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChannelLogo channel={r[0]} size={16}/></div>
                <span style={{ fontFamily: T.display, fontWeight: 600, color: fg }}>{r[1]}</span>
              </div>
            </td>
            <td style={{ padding: '10px 14px', textAlign: 'right' }}><RStatus type={r[2]}/></td>
            <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: T.mono, color: fg }}>{r[3]}</td>
            <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: T.mono, color: sec }}>{r[4]}</td>
            <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: T.mono, color: sec }}>{r[5]}</td>
            <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: T.mono, color: fg }}>{r[6]}</td>
            <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: T.mono, color: fg }}>{r[7]}</td>
            <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: T.mono, color: teal }}>{r[8]}</td>
            <td style={{ padding: '10px 14px', textAlign: 'right' }}><Spark data={r[9]} w={70} h={18}/></td>
          </tr>
        ))}
      </tbody>
    </table>
  </RCard>
);

const TableCampaigns = () => (
  <RCard padding={0} style={{ overflow: 'hidden' }}>
    <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--navy-edge)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div><CardTitle>Top Campaigns</CardTitle><CardSub>Google Ads · all types</CardSub></div>
      <div style={{ display: 'flex', gap: 6 }}>
        {['All', 'Search', 'Display'].map((t, i) => (
          <span key={t} style={{ padding: '3px 9px', fontFamily: T.display, fontSize: 11, fontWeight: 600, borderRadius: 6, background: i === 0 ? 'rgba(0,194,184,.12)' : 'transparent', color: i === 0 ? teal : muted }}>{t}</span>
        ))}
      </div>
    </div>
    {[
      ['Brand Awareness Q1', 'Search', 'active', 'Rp 8,4 Jt', '3,78%', '4,1x'],
      ['Retargeting · Cart', 'Display', 'active', 'Rp 4,2 Jt', '3,38%', '5,2x'],
      ['Product Launch · Bold Brew', 'Search', 'active', 'Rp 6,1 Jt', '3,76%', '3,8x'],
      ['Ramadan Promo', 'Display', 'paused', 'Rp 2,9 Jt', '3,20%', '2,9x'],
    ].map((r, i) => (
      <div key={i} style={{ padding: '10px 16px', borderTop: '1px solid rgba(51,71,102,.4)', display: 'grid', gridTemplateColumns: '1.7fr 60px 80px 1fr 60px 50px', gap: 8, alignItems: 'center' }}>
        <span style={{ fontFamily: T.display, fontSize: 12, fontWeight: 600, color: fg }}>{r[0]}</span>
        <RChip color={{ Search: '#4285F4', Display: gold }[r[1]]}>{r[1]}</RChip>
        <RStatus type={r[2]}/>
        <MonoCell color={fg}>{r[3]}</MonoCell>
        <MonoCell color={sec}>{r[4]}</MonoCell>
        <MonoCell color={teal}>{r[5]}</MonoCell>
      </div>
    ))}
  </RCard>
);

const TableRankings = () => (
  <RCard padding={0} style={{ overflow: 'hidden' }}>
    <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--navy-edge)', display: 'flex', justifyContent: 'space-between' }}>
      <div><CardTitle>Keyword rankings</CardTitle><CardSub>Search Console · 28 days</CardSub></div>
      <ChannelLogo channel="search" size={20}/>
    </div>
    {[
      ['kopi specialty jakarta', 2, 1, '8.240', '4,15%'],
      ['roaster arabika', 3, 0, '5.120', '3,87%'],
      ['biji kopi senja', 2, 2, '4.680', '4,70%'],
      ['cold brew delivery', 5, -1, '3.240', '2,84%'],
      ['house of senja menu', 1, 3, '2.120', '7,36%'],
    ].map((r, i) => (
      <div key={i} style={{ padding: '8px 16px', borderTop: '1px solid rgba(51,71,102,.4)', display: 'grid', gridTemplateColumns: '40px 1fr 60px 70px 50px', gap: 10, alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontFamily: T.display, fontWeight: 700, fontSize: 14, color: fg }}>#{r[1]}</span>
          {r[2] !== 0 && <span style={{ fontFamily: T.mono, fontSize: 9.5, color: r[2] > 0 ? '#16A34A' : '#DC2626' }}>{r[2] > 0 ? '▲' : '▼'}{Math.abs(r[2])}</span>}
        </div>
        <span style={{ fontFamily: T.body, fontSize: 11.5, color: fg }}>{r[0]}</span>
        <MonoCell color={sec}>{r[3]}</MonoCell>
        <MonoCell color={fg}>{r[4]}</MonoCell>
        <div style={{ textAlign: 'right' }}><Spark data={[5, 4, 3, 3, 2, 2, r[1]].reverse()} color={teal} w={42} h={16}/></div>
      </div>
    ))}
  </RCard>
);

// ═════════════════════════════════════════════════════════════════
// 5 · PROGRESS / SCORES
// ═════════════════════════════════════════════════════════════════
// Persist live measurement data across:
//   - Editor-mode remounts (_psiLive in-memory)
//   - Page reloads          (localStorage)
// Data is overwritten on each new measurement run.
const _psiLive = {};
const _psiLsKey = url => 'avo_psi_live_' + (url || 'default');
const _psiLsLoad = url => {
  try { const s = localStorage.getItem(_psiLsKey(url)); return s ? JSON.parse(s) : null; } catch { return null; }
};
const _psiLsSave = (url, data) => {
  try { localStorage.setItem(_psiLsKey(url), JSON.stringify(data)); } catch {}
};

const PageSpeedInsights = ({ p, cfg = {}, psiUrl, psiApiKey, savePsiApiKey, isEditor = false }) => {
  const cacheKey = psiUrl || '__default__';
  const [activeTab,    setActiveTab]    = React.useState('mobile');
  const [liveData,     _setLiveDataRaw] = React.useState(() => {
    if (_psiLive[cacheKey]) return _psiLive[cacheKey];
    const stored = _psiLsLoad(cacheKey);
    if (stored) _psiLive[cacheKey] = stored;
    return stored;
  });
  const setLiveData = d => { _psiLive[cacheKey] = d; _psiLsSave(cacheKey, d); _setLiveDataRaw(d); };
  const [measuring,    setMeasuring]    = React.useState(false);
  const [measureError, setMeasureError] = React.useState(null);
  const [retryIn,      setRetryIn]      = React.useState(0);
  const [lastMeasured, setLastMeasured] = React.useState(() => {
    const d = _psiLive[cacheKey] || _psiLsLoad(cacheKey);
    return d?.mobile?.latestDay || d?.desktop?.latestDay || null;
  });
  const [expandedInsight,  setExpandedInsight]  = React.useState(null);
  const autoRetryCount = React.useRef(0);
  const runRef         = React.useRef(null);

  React.useEffect(() => {
    if (retryIn <= 0) return;
    const t = setTimeout(() => {
      if (retryIn <= 1) { setRetryIn(0); runRef.current?.(true); }
      else { setRetryIn(s => s - 1); }
    }, 1000);
    return () => clearTimeout(t);
  }, [retryIn]);

  // Register controls for the editor panel to call via window._psiControl
  React.useEffect(() => {
    if (!isEditor) return;
    window._psiControl = {
      run: () => runRef.current?.(),
      measuring, measureError, lastMeasured, psiApiKey, savePsiApiKey,
      clearError: () => setMeasureError(null),
      retryIn,
    };
    window.dispatchEvent(new CustomEvent('psiControlUpdate'));
    return () => {
      window._psiControl = null;
      window.dispatchEvent(new CustomEvent('psiControlUpdate'));
    };
  }, [isEditor, measuring, measureError, lastMeasured, psiApiKey, retryIn]);

  function _parseCats(cats) {
    return {
      performance_score:    Math.round((cats.performance?.score       || 0) * 100),
      seo_score:            Math.round((cats.seo?.score               || 0) * 100),
      accessibility_score:  Math.round((cats.accessibility?.score     || 0) * 100),
      best_practices_score: Math.round((cats['best-practices']?.score || 0) * 100),
    };
  }

  function _parseCwv(audits) {
    if (!audits) return {};
    const nv = key => { const v = audits[key]?.numericValue; return (v != null && !isNaN(+v)) ? +v : null; };
    return {
      lcp_ms:  nv('largest-contentful-paint'),
      fcp_ms:  nv('first-contentful-paint'),
      cls:     nv('cumulative-layout-shift'),
      inp_ms:  nv('interaction-to-next-paint'),
      tbt_ms:  nv('total-blocking-time'),
      ttfb_ms: nv('server-response-time'),
    };
  }

  function _parseInsights(audits) {
    if (!audits) return [];
    const skip = new Set([
      'largest-contentful-paint','first-contentful-paint','cumulative-layout-shift',
      'interaction-to-next-paint','total-blocking-time','server-response-time',
      'first-meaningful-paint','speed-index','interactive','performance-budget','timing-budget',
    ]);
    const stripHtml = s => (s || '').replace(/<[^>]+>/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    return Object.values(audits)
      .filter(a => {
        if (skip.has(a.id)) return false;
        if (['notApplicable','manual','informative','error'].includes(a.scoreDisplayMode)) return false;
        if (a.score == null) return false;
        return a.score < 0.9;
      })
      .sort((a, b) => (a.score ?? 1) - (b.score ?? 1))
      .slice(0, 12)
      .map(a => ({ id: a.id, title: a.title, displayValue: a.displayValue || null, description: stripHtml(a.description), score: a.score }));
  }

  async function runMeasurement(isAutoRetry = false) {
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
      if (mResp.status === 429 || mResp.status === 403) {
        setMeasuring(false);
        let errBody = null;
        try { errBody = await mResp.json(); } catch {}
        const errDetail = errBody?.error?.message || '';
        if (errDetail.includes('per day') || errDetail.includes('Queries per day')) { setMeasureError('quota_exceeded'); return; }
        if (isAutoRetry && autoRetryCount.current >= 3) { setMeasureError('quota_exceeded'); autoRetryCount.current = 0; return; }
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
      const mCats = mJson.lighthouseResult?.categories;
      if (!mCats) throw new Error('No category data in PSI response.');
      autoRetryCount.current = 0;
      const mScores   = _parseCats(mCats);
      const mCwv      = _parseCwv(mJson.lighthouseResult?.audits);
      const mInsights = _parseInsights(mJson.lighthouseResult?.audits);

      let dScores = null, dCwv = {}, dInsights = [];
      try {
        if (dResp.ok) {
          const dJson = await dResp.json();
          const dCats = dJson.lighthouseResult?.categories;
          if (dCats) {
            dScores   = _parseCats(dCats);
            dCwv      = _parseCwv(dJson.lighthouseResult?.audits);
            dInsights = _parseInsights(dJson.lighthouseResult?.audits);
          }
        }
      } catch (_) {}

      // Preserve accumulated history — read existing before overwriting
      const prevLive  = _psiLive[cacheKey] || _psiLsLoad(cacheKey);
      const prevMHist = prevLive?.mobile?.history  || [];
      const prevDHist = prevLive?.desktop?.history || [];

      // Each measurement run = one point; keep last 16
      const buildHistory = (prev, performance, day) =>
        [...(prev || []), { day, performance }].slice(-16);

      const toData = (s, cwv, insights, prevHist) => s ? {
        performance: s.performance_score, seo: s.seo_score,
        accessibility: s.accessibility_score, best_practices: s.best_practices_score,
        ...cwv, latestDay: today,
        history: buildHistory(prevHist, s.performance_score, today),
        insights: insights || [],
      } : null;
      setLiveData({ mobile: toData(mScores, mCwv, mInsights, prevMHist), desktop: toData(dScores, dCwv, dInsights, prevDHist) });
      setLastMeasured(today);

    } catch (e) {
      setMeasureError(e.message || 'Measurement failed. Please try again.');
    } finally {
      setMeasuring(false);
    }
  }
  runRef.current = runMeasurement;

  // ── Font scale (S/M/L from cfg.fontSize) — ring size is always fixed ────
  const fScale        = { S: 0.82, M: 1, L: 1.2 }[cfg.fontSize || 'M'] || 1;
  const scoreStatusFs = Math.round(11 * fScale);   // "Excellent" / "Needs work"
  const cwvValFs      = Math.round(12 * fScale);   // CWV metric value
  const cwvStatusFs   = Math.round(9  * fScale);   // "Good" / "Improve" / "Poor"
  const insightTitleFs  = Math.round(11 * fScale); // insight item title
  const insightDetailFs = Math.round(10 * fScale); // displayValue + description

  // ── Helpers ──────────────────────────────────────────────────────
  const ns         = v => { const n = +(v) || 0; return n > 0 && n <= 1 ? Math.round(n * 100) : Math.round(n); };
  const scoreColor = v => v >= 90 ? '#16A34A' : v >= 50 ? teal : gold;
  const scoreLabel = v => v >= 90 ? 'Excellent' : v >= 50 ? 'Needs work' : 'Poor';

  const fmtMs = ms => {
    if (ms == null) return '—';
    return ms >= 1000 ? (ms / 1000).toFixed(1) + 's' : Math.round(ms) + 'ms';
  };
  const fmtCls = v => v == null ? '—' : (+v).toFixed(2);

  const cwvStatus = (metric, val) => {
    if (val == null) return null;
    const thresholds = {
      lcp_ms:  [2500, 4000], fcp_ms: [1800, 3000],
      cls:     [0.1,  0.25], inp_ms: [200,  500],
      tbt_ms:  [200,  600],  ttfb_ms:[800,  1800],
    };
    const [good, poor] = thresholds[metric] || [0, 0];
    if (val <= good) return { label: 'Good',              color: '#16A34A', bg: 'rgba(22,163,74,.08)',   border: 'rgba(22,163,74,.2)'   };
    if (val <= poor) return { label: 'Needs improvement', color: gold,      bg: 'rgba(248,180,0,.08)',  border: 'rgba(248,180,0,.25)'  };
    return               { label: 'Poor',              color: '#E3170A', bg: 'rgba(227,23,10,.08)',  border: 'rgba(227,23,10,.2)'   };
  };

  // ── Data resolution ───────────────────────────────────────────────
  const psiData = liveData
    ? (activeTab === 'desktop' ? liveData.desktop : liveData.mobile)
    : (activeTab === 'desktop' ? p?.psiDesktop    : p?.psi);

  const scores = psiData ? [
    { label: 'Performance',    value: ns(psiData.performance)    },
    { label: 'Accessibility',  value: ns(psiData.accessibility)  },
    { label: 'Best Practices', value: ns(psiData.best_practices) },
    { label: 'SEO',            value: ns(psiData.seo)            },
  ] : null;
  const overall     = scores ? Math.round(scores.reduce((s, sc) => s + sc.value, 0) / scores.length) : null;
  const latestLabel = psiData?.latestDay
    ? new Date(psiData.latestDay + 'T00:00:00').toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  // CWV — use INP if available, else TBT as proxy
  const inpVal    = psiData?.inp_ms != null ? { key: 'inp_ms', val: psiData.inp_ms, label: 'INP' }
                  : psiData?.tbt_ms != null ? { key: 'tbt_ms', val: psiData.tbt_ms, label: 'TBT' }
                  : null;
  const cwvItems  = [
    { key: 'lcp_ms',  label: 'LCP',  display: fmtMs(psiData?.lcp_ms),  st: cwvStatus('lcp_ms',  psiData?.lcp_ms)  },
    { key: 'fcp_ms',  label: 'FCP',  display: fmtMs(psiData?.fcp_ms),  st: cwvStatus('fcp_ms',  psiData?.fcp_ms)  },
    { key: 'cls',     label: 'CLS',  display: fmtCls(psiData?.cls),    st: cwvStatus('cls',     psiData?.cls)     },
    { key: 'inp',     label: inpVal?.label || 'INP', display: fmtMs(inpVal?.val), st: cwvStatus(inpVal?.key || 'inp_ms', inpVal?.val) },
    { key: 'ttfb_ms', label: 'TTFB', display: fmtMs(psiData?.ttfb_ms), st: cwvStatus('ttfb_ms', psiData?.ttfb_ms) },
  ];

  const liveTab = activeTab === 'desktop' ? liveData?.desktop : liveData?.mobile;

  // ── Sub-components ───────────────────────────────────────────────
  const TabToggle = () => (
    <div style={{ display: 'flex', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(51,71,102,.5)', borderRadius: 20, padding: 3 }}>
      {['mobile', 'desktop'].map(tab => (
        <div key={tab} onClick={() => setActiveTab(tab)} style={{
          padding: '4px 14px', borderRadius: 20, cursor: 'pointer',
          background: activeTab === tab ? teal : 'transparent',
          color: activeTab === tab ? '#0C182C' : muted,
          fontFamily: T.display, fontSize: 11, fontWeight: 700,
          textTransform: 'capitalize', transition: 'all .15s',
        }}>{tab}</div>
      ))}
    </div>
  );

  // ── Empty state ───────────────────────────────────────────────────
  if (!scores) {
    return (
      <RCard padding={0}>
        <div style={{ padding: '12px 16px 10px', borderBottom: '1px solid var(--navy-edge)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><CardTitle>{cfg.name || 'PageSpeed'}</CardTitle><CardSub>Lighthouse</CardSub></div>
          <TabToggle/>
        </div>
        <div style={{ padding: 24, textAlign: 'center', fontFamily: T.mono, fontSize: 11, color: muted, lineHeight: 1.7 }}>
          {psiUrl
            ? <>No data yet · <span style={{ opacity: 0.7 }}>Run a measurement from the editor panel</span></>
            : <>No data yet<br/><span style={{ opacity: 0.6 }}>Configure a Page URL in report settings</span></>}
        </div>
      </RCard>
    );
  }

  // ── Full widget ───────────────────────────────────────────────────
  return (
    <RCard padding={0} style={{ background: 'linear-gradient(145deg,rgba(12,24,44,.8),rgba(0,194,184,.04))' }}>

      {/* Header */}
      <div style={{ padding: '12px 16px 10px', borderBottom: '1px solid var(--navy-edge)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <CardTitle>{cfg.name || 'PageSpeed'}</CardTitle>
          <CardSub>Lighthouse{latestLabel ? ' · ' + latestLabel : ''}</CardSub>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
          <TabToggle/>
          <Eyebrow color={scoreColor(overall)}>{scoreLabel(overall)}</Eyebrow>
        </div>
      </div>

      {/* Two-column body: scores/CWV/trend on left, insights on right.
          Left panel is in normal flow (determines widget height).
          Right panel is absolutely positioned so it never adds height — insights scroll within. */}
      <div style={{ display: 'flex', minHeight: 0, position: 'relative' }}>

        {/* ── Left panel — drives container height ── */}
        <div style={{ flex: 1, minWidth: 0, maxWidth: '50%' }}>

          {/* Score Rings 2×2 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
            {scores.map(({ label, value }, i) => (
              <div key={i} style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, borderRight: i % 2 === 0 ? '1px solid rgba(51,71,102,.4)' : 'none', borderTop: i >= 2 ? '1px solid rgba(51,71,102,.4)' : 'none' }}>
                <Ring value={value} size={76} thickness={6} color={scoreColor(value)}/>
                <div>
                  <Eyebrow>{label}</Eyebrow>
                  <div style={{ fontFamily: T.body, fontSize: scoreStatusFs, color: muted, marginTop: 2 }}>{scoreLabel(value)}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Core Web Vitals */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(51,71,102,.4)' }}>
            <Eyebrow style={{ marginBottom: 8 }}>Core Web Vitals</Eyebrow>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 6, marginTop: 8 }}>
              {cwvItems.map(({ key, label, display, st }) => (
                <div key={key} style={{ background: st ? st.bg : 'rgba(51,71,102,.1)', border: `1px solid ${st ? st.border : 'rgba(51,71,102,.3)'}`, borderRadius: 8, padding: '7px 6px', textAlign: 'center' }}>
                  <Eyebrow>{label}</Eyebrow>
                  <div style={{ fontFamily: T.display, fontSize: cwvValFs, fontWeight: 800, color: st ? st.color : muted, lineHeight: 1.2, marginTop: 3 }}>{display}</div>
                  {st && <div style={{ fontFamily: T.body, fontSize: cwvStatusFs, color: st.color, marginTop: 2, opacity: .8 }}>{st.label === 'Needs improvement' ? 'Improve' : st.label}</div>}
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ── Right panel — Insights — absolutely positioned, fills left-panel height exactly, scrolls internally ── */}
        <div style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: '50%', display: 'flex', flexDirection: 'column', overflow: 'hidden', borderLeft: '1px solid rgba(51,71,102,.4)' }}>
          <div style={{ padding: '10px 14px 8px', borderBottom: '1px solid rgba(51,71,102,.3)' }}>
            <Eyebrow>Insights</Eyebrow>
          </div>
          {(() => {
            const insights = liveTab?.insights;
            if (!insights) return (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px 14px', fontFamily: T.mono, fontSize: 11, color: muted, textAlign: 'center', lineHeight: 1.7 }}>
                Run a measurement to see optimization insights
              </div>
            );
            if (insights.length === 0) return (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px 14px', fontFamily: T.mono, fontSize: 11, color: teal, textAlign: 'center', lineHeight: 1.7 }}>
                No issues found — all audits passed!
              </div>
            );
            return (
              <div style={{ overflow: 'auto', flex: 1 }}>
                {insights.map(item => {
                  const isOpen = expandedInsight === item.id;
                  const dotColor = item.score < 0.5 ? '#E3170A' : gold;
                  return (
                    <div key={item.id} style={{ borderBottom: '1px solid rgba(51,71,102,.25)' }}>
                      <div onClick={() => setExpandedInsight(isOpen ? null : item.id)}
                        style={{ padding: '8px 14px', display: 'flex', alignItems: 'flex-start', gap: 7, cursor: 'pointer', userSelect: 'none' }}>
                        <svg width="9" height="9" viewBox="0 0 16 16" fill={dotColor} style={{ flexShrink: 0, marginTop: 1 }}>
                          <path d="M7.08 2.17L1.12 12a1 1 0 00.87 1.5h11.94A1 1 0 0014.88 12L8.92 2.17a1 1 0 00-1.74 0z"/>
                        </svg>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: T.body, fontSize: insightTitleFs, color: sec, lineHeight: 1.4 }}>{item.title}</div>
                          {item.displayValue && (
                            <div style={{ fontFamily: T.mono, fontSize: insightDetailFs, color: dotColor, marginTop: 2 }}>{item.displayValue}</div>
                          )}
                        </div>
                        <svg width="9" height="9" fill="none" stroke={muted} strokeWidth="2.5" viewBox="0 0 24 24"
                          style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform .15s', flexShrink: 0, marginTop: 2 }}>
                          <path d="M6 9l6 6 6-6"/>
                        </svg>
                      </div>
                      {isOpen && item.description && (
                        <div style={{ padding: '0 14px 9px 30px', fontFamily: T.body, fontSize: insightDetailFs, color: muted, lineHeight: 1.6 }}>
                          {item.description}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>

      </div>

    </RCard>
  );
};


const GoalProgress = () => (
  <RCard padding={16}>
    <CardTitle size={13}>Monthly goals</CardTitle>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
      {[
        ['Revenue', 198.4, 220, gold, 'Jt IDR'],
        ['Conversions', 1284, 1200, teal, 'orders'],
        ['Organic Sessions', 24830, 30000, violet, 'sessions'],
      ].map(([l, cur, goal, c, u]) => {
        const pct = Math.min(100, (cur / goal) * 100);
        const over = cur >= goal;
        return (
          <div key={l}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontFamily: T.body, fontSize: 11.5, color: fg }}>{l}</span>
              <MonoCell color={over ? '#16A34A' : sec} size={10}>{cur.toLocaleString('id-ID')} / {goal.toLocaleString('id-ID')} {u}</MonoCell>
            </div>
            <div style={{ height: 6, background: 'var(--navy-deep)', borderRadius: 3, overflow: 'hidden', position: 'relative' }}>
              <div style={{ width: pct + '%', height: '100%', background: c }}/>
              {over && <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 2, background: '#16A34A' }}/>}
            </div>
          </div>
        );
      })}
    </div>
  </RCard>
);

const BudgetPacing = () => (
  <RCard padding={16}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
      <div><CardTitle size={13}>Budget pacing</CardTitle><CardSub>Mar 2025 · 22 of 31 days</CardSub></div>
      <RChip color={gold}>On track</RChip>
    </div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 4 }}>
      <Num size={24} color={fg}>Rp 33,8 Jt</Num>
      <span style={{ fontFamily: T.mono, fontSize: 11, color: muted }}>/ Rp 48,5 Jt</span>
    </div>
    <div style={{ height: 8, background: 'var(--navy-deep)', borderRadius: 4, overflow: 'hidden', position: 'relative', marginTop: 10 }}>
      <div style={{ width: '70%', height: '100%', background: `linear-gradient(90deg, ${teal}, ${gold})` }}/>
      <div style={{ position: 'absolute', left: '71%', top: -2, bottom: -2, width: 1.5, background: fg }}/>
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontFamily: T.mono, fontSize: 9.5, color: muted }}>
      <span>Spent 70%</span><span>Expected 71%</span><span>Remaining Rp 14,7 Jt</span>
    </div>
  </RCard>
);


// ═════════════════════════════════════════════════════════════════
// 6 · LISTS
// ═════════════════════════════════════════════════════════════════

const ListTopKeywords = () => (
  <RCard padding={0}>
    <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--navy-edge)' }}><CardTitle size={13}>Top Keywords</CardTitle><CardSub>Driving most impressions</CardSub></div>
    {[
      ['kopi specialty jakarta', '1.240', '4,82%'],
      ['roaster arabika premium', '892', '3,60%'],
      ['biji kopi senja', '640', '4,12%'],
      ['cold brew delivery', '412', '2,98%'],
      ['house of senja menu', '320', '7,36%'],
    ].map(([k, imp, ctr], i) => (
      <div key={i} style={{ padding: '9px 16px', borderTop: '1px solid rgba(51,71,102,.4)', display: 'grid', gridTemplateColumns: '20px 1fr 60px 55px', gap: 10, alignItems: 'center' }}>
        <span style={{ fontFamily: T.mono, fontSize: 10, color: muted }}>{i + 1}</span>
        <span style={{ fontFamily: T.body, fontSize: 11.5, color: fg }}>{k}</span>
        <MonoCell color={sec}>{imp}</MonoCell>
        <MonoCell color={teal}>{ctr}</MonoCell>
      </div>
    ))}
  </RCard>
);

const ListTopPages = () => (
  <RCard padding={0}>
    <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--navy-edge)', display: 'flex', justifyContent: 'space-between' }}>
      <div><CardTitle size={13}>Landing Pages</CardTitle><CardSub>GA4 · organic entries</CardSub></div>
      <ChannelLogo channel="ga4" size={18}/>
    </div>
    {[
      ['/blog/panduan-kopi-specialty', '6.430', 92],
      ['/produk/bold-brew-blend', '4.180', 88],
      ['/', '3.920', 65],
      ['/blog/cara-seduh-v60', '2.890', 90],
      ['/tentang-kami', '1.740', 42],
    ].map(([p, s, q], i) => (
      <div key={i} style={{ padding: '9px 16px', borderTop: '1px solid rgba(51,71,102,.4)', display: 'grid', gridTemplateColumns: '1fr 60px 70px', gap: 10, alignItems: 'center' }}>
        <span style={{ fontFamily: T.mono, fontSize: 10.5, color: fg, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p}</span>
        <MonoCell color={sec}>{s}</MonoCell>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 32, height: 4, background: 'var(--navy-deep)', borderRadius: 2, overflow: 'hidden' }}><div style={{ width: q + '%', height: '100%', background: q >= 80 ? '#16A34A' : q >= 60 ? gold : '#DC2626' }}/></div>
          <MonoCell color={fg} size={10}>{q}</MonoCell>
        </div>
      </div>
    ))}
  </RCard>
);

const ListCountries = () => (
  <RCard padding={16}>
    <CardTitle size={13}>Top countries</CardTitle>
    <div style={{ marginTop: 12 }}>
      {[['🇮🇩 Indonesia', 94, '23.340'], ['🇸🇬 Singapore', 3, '742'], ['🇲🇾 Malaysia', 2, '498'], ['🇺🇸 United States', 1, '250']].map(([l, v, n]) => (
        <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
          <span style={{ flex: 1, fontFamily: T.body, fontSize: 11.5, color: fg }}>{l}</span>
          <div style={{ width: 70, height: 3, background: 'var(--navy-deep)', borderRadius: 2, overflow: 'hidden' }}><div style={{ width: v + '%', height: '100%', background: teal }}/></div>
          <MonoCell color={sec} size={10.5}>{n}</MonoCell>
        </div>
      ))}
    </div>
  </RCard>
);

const ListDeviceSplit = ({ cfg = {} }) => {
  const title = cfg.title || 'Device split';
  const rows = [
    { label: cfg.label1 || 'Mobile',  value: cfg.pct1 != null ? Number(cfg.pct1) : 72, color: teal },
    { label: cfg.label2 || 'Desktop', value: cfg.pct2 != null ? Number(cfg.pct2) : 22, color: gold },
    { label: cfg.label3 || 'Tablet',  value: cfg.pct3 != null ? Number(cfg.pct3) : 6,  color: violet },
  ];
  return (
    <RCard padding={16}>
      <CardTitle size={13}>{title}</CardTitle>
      <div style={{ marginTop: 10 }}>
        {rows.map(({ label, value, color }) => (
          <div key={label} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: T.body, fontSize: 11.5, marginBottom: 4 }}>
              <span style={{ color: fg }}>{label}</span>
              <MonoCell color={sec}>{value}%</MonoCell>
            </div>
            <div style={{ height: 5, background: 'var(--navy-deep)', borderRadius: 2.5, overflow: 'hidden' }}>
              <div style={{ width: Math.min(100, value) + '%', height: '100%', background: color }}/>
            </div>
          </div>
        ))}
      </div>
    </RCard>
  );
};

// ═════════════════════════════════════════════════════════════════
// 7 · PERFORMANCE HIGHLIGHT CAROUSEL
// ═════════════════════════════════════════════════════════════════
// Featured wins, horizontally scrolling. Three "slides" shown inline with
// carousel controls. Each slide is a mini feature card.

const HighlightCarousel = () => {
  const [idx, setIdx] = React.useState(0);
  const items = [
    { tag: '🏆 Top performer', chip: gold, title: 'Retargeting · Cart', channel: 'Display', copy: 'Highest ROAS this month (5.2x), driven by "7-day cart-abandoner" audience.', metrics: [['ROAS', '5.2x'], ['Conv.', '218'], ['CPA', 'Rp 19.2K']] },
    { tag: '⚡ Biggest mover', chip: teal, title: 'House of Senja Menu', channel: 'Organic', copy: 'Organic clicks up 212% MoM after title tag + FAQ schema optimization.', metrics: [['Clicks', '2,120'], ['CTR', '7.36%'], ['Position', '#1.2']] },
    { tag: '💰 Best efficiency', chip: violet, title: 'YouTube · House of Senja', channel: 'Video', copy: 'Most efficient at CPV Rp 280/view with 68% completion rate.', metrics: [['Views', '34,900'], ['CPV', 'Rp 280'], ['Compl.', '68%']] },
  ];
  const cur = items[idx];
  return (
    <RCard padding={0} style={{ borderTop: `2px solid ${cur.chip}` }}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--navy-edge)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <CardTitle>Performance highlights</CardTitle>
          <Eyebrow>{idx + 1} / {items.length}</Eyebrow>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setIdx((i) => (i - 1 + items.length) % items.length)} style={{ width: 26, height: 26, background: 'var(--navy-elevated)', border: '1px solid var(--navy-edge)', borderRadius: 6, color: sec, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6.5 2L3 5l3.5 3"/></svg>
          </button>
          <button onClick={() => setIdx((i) => (i + 1) % items.length)} style={{ width: 26, height: 26, background: 'var(--navy-elevated)', border: '1px solid var(--navy-edge)', borderRadius: 6, color: sec, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3.5 2L7 5 3.5 8"/></svg>
          </button>
        </div>
      </div>
      <div style={{ padding: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
            <RChip color={cur.chip}>{cur.tag}</RChip>
            <Eyebrow>{cur.channel}</Eyebrow>
          </div>
          <CardTitle size={17}>{cur.title}</CardTitle>
          <p style={{ fontFamily: T.body, fontSize: 12, color: sec, margin: '6px 0 0', lineHeight: 1.5, maxWidth: 480 }}>{cur.copy}</p>
        </div>
        <div style={{ display: 'flex', gap: 18 }}>
          {cur.metrics.map(([l, v]) => (
            <div key={l} style={{ textAlign: 'right' }}>
              <Eyebrow>{l}</Eyebrow>
              <Num size={20}>{v}</Num>
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding: '0 18px 14px', display: 'flex', gap: 6 }}>
        {items.map((_, i) => (
          <button key={i} onClick={() => setIdx(i)} style={{ flex: 1, height: 3, border: 'none', padding: 0, borderRadius: 2, background: i === idx ? cur.chip : 'var(--navy-edge)', cursor: 'pointer', transition: 'background .15s' }}/>
        ))}
      </div>
    </RCard>
  );
};

// ═════════════════════════════════════════════════════════════════
// REGISTRY
// ═════════════════════════════════════════════════════════════════
// Each card: { id, cat, title, w, h, render }. `w` = preferred grid span
// (of 4 columns). `h` = preferred row span in 140px units. Used for both
// the sticker sheet and the dashboard swap slots.

const CARDS = [
  // narrative
  { id: 'narrative-hero', cat: 'narrative', title: 'Hero summary banner', w: 4, h: 1.2, render: NarrativeHero },
  { id: 'narrative-note', cat: 'narrative', title: '3-beat analyst note', w: 4, h: 1.1, render: AnalystNote },
  // kpi
  { id: 'kpi-single', cat: 'kpi', title: 'Single stat', w: 1, h: 0.9, render: () => <KpiSingle/> },
  { id: 'kpi-compare', cat: 'kpi', title: 'Period comparison', w: 2, h: 1.1, render: KpiCompare },
  // charts
  { id: 'chart-area', cat: 'charts', title: 'Dual-area trend', w: 3, h: 1.7, render: ChartAreaDual },
  { id: 'chart-area-axes', cat: 'charts', title: 'Area with X/Y axes', w: 3, h: 1.8, render: ChartAreaWithAxes },
  { id: 'chart-line', cat: 'charts', title: 'Solo line with KPI', w: 2, h: 1.4, render: ChartLineSolo },
  { id: 'chart-bar', cat: 'charts', title: 'Bar chart', w: 2, h: 1.5, render: ChartBarPacing },
  { id: 'chart-donut', cat: 'charts', title: 'Donut with legend', w: 2, h: 1.6, render: ChartDonutMix },
  // tables
  { id: 'table-rankings', cat: 'tables', title: 'Position ranking table', w: 2, h: 1.8, render: TableRankings },
  // progress
  { id: 'progress-psi', cat: 'progress', title: 'PageSpeed', w: 3, h: 2.6, render: PageSpeedInsights },
  // lists
  { id: 'list-pages', cat: 'lists', title: 'URL list with quality bar', w: 2, h: 1.7, render: ListTopPages },
  { id: 'list-devices', cat: 'lists', title: 'Category split bars', w: 2, h: 1.2, render: ListDeviceSplit },
  // carousel
  { id: 'carousel-highlights', cat: 'carousel', title: 'Highlight carousel', w: 4, h: 1.4, render: HighlightCarousel },
];

const CATS = [
  { id: 'narrative', title: 'Text & Narrative',  desc: 'Hero banners, analyst notes, callouts, testimonials' },
  { id: 'kpi',       title: 'Data & KPI',        desc: 'Single stats, strips, comparisons, stacked deltas' },
  { id: 'charts',    title: 'Charts',            desc: 'Area, line, bar, donut, heatmap, sparklines' },
  { id: 'tables',    title: 'Tables',            desc: 'Channel summary, campaign list, rankings' },
  { id: 'progress',  title: 'Progress & Scores', desc: 'Authority score, goals, budget pacing, page health' },
  { id: 'lists',     title: 'Lists',             desc: 'Top keywords, pages, countries, device split' },
  { id: 'carousel',  title: 'Highlights',        desc: 'Featured wins carousel' },
];

Object.assign(window, { CARDS, CATS });
