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
  <div style={{ fontFamily: T.mono, fontSize: 9.5, color, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600 }}>{children}</div>
);
const CardTitle = ({ children, size = 14 }) => (
  <div style={{ fontFamily: T.display, fontSize: size, fontWeight: 700, color: fg, letterSpacing: '-0.01em' }}>{children}</div>
);
const CardSub = ({ children }) => (
  <div style={{ fontFamily: T.body, fontSize: 11, color: muted, marginTop: 2 }}>{children}</div>
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
      <div style={{ fontFamily: T.display, fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: fg, lineHeight: 1.2 }}>Performa marketing Maret 2025 <span style={{ color: teal }}>naik 19,7%</span></div>
      <p style={{ fontFamily: T.body, fontSize: 12.5, color: sec, margin: '8px 0 12px', maxWidth: 560, lineHeight: 1.5 }}>Konversi meningkat seiring shift anggaran ke Google Ads. SEO organik tumbuh 8,1% tanpa tambahan budget. Rekomendasikan lanjutkan strategi current.</p>
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
        ['📊', 'What happened', 'Total spend naik 12,4% MoM, diimbangi kenaikan konversi 19,7%.'],
        ['💡', 'Why it matters', 'Google Ads tetap kontributor ROAS terbesar (4,1x). SEO tumbuh tanpa budget.'],
        ['🎯', 'Next action', 'Geser 15% budget retargeting ke brand awareness Google Ads untuk Q2.'],
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
    <CardTitle>3 halaman di posisi #4–#7 berpotensi naik ke top-3</CardTitle>
    <p style={{ fontFamily: T.body, fontSize: 11.5, color: sec, margin: '6px 0 0', lineHeight: 1.5 }}>"Panduan Kopi Specialty" (#4), "V60 Brewing" (#5), "Bold Brew" (#7) dapat diangkat dengan internal linking + 2 backlink. Estimasi +3.200 sessions/bulan.</p>
    <button style={{ marginTop: 10, padding: '7px 12px', background: 'linear-gradient(135deg,#F8B400,#FFCA3A)', color: '#0C182C', border: 'none', borderRadius: 8, fontFamily: T.display, fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}>Create action plan →</button>
  </RCard>
);

// quote / testimonial style
const QuoteCard = () => (
  <RCard padding={18}>
    <svg width="22" height="16" viewBox="0 0 22 16" fill={teal} style={{ opacity: 0.5 }}><path d="M0 16V8c0-4.4 3.6-8 8-8v3c-2.8 0-5 2.2-5 5h5v8H0zm12 0V8c0-4.4 3.6-8 8-8v3c-2.8 0-5 2.2-5 5h5v8h-8z"/></svg>
    <p style={{ fontFamily: T.body, fontSize: 13, color: fg, margin: '10px 0 12px', lineHeight: 1.55, fontWeight: 500 }}>"Laporan bulanan jadi jauh lebih cepat disiapkan. Tim klien langsung dapat insight, bukan tabel mentah."</p>
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
const KpiCompare = () => (
  <RCard padding={18}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
      <div>
        <CardTitle size={13}>Conversions</CardTitle>
        <CardSub>Mar 2025 vs Feb 2025</CardSub>
      </div>
      <RDelta value={19.7}/>
    </div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 18 }}>
      <div>
        <Eyebrow>Current</Eyebrow>
        <Num size={32} color={teal}>1.284</Num>
      </div>
      <div style={{ flex: 1, height: 1, background: 'var(--navy-edge)' }}/>
      <div style={{ textAlign: 'right' }}>
        <Eyebrow>Previous</Eyebrow>
        <Num size={22} color={sec}>1.073</Num>
      </div>
    </div>
    <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: 'var(--navy-deep)', borderRadius: 3, overflow: 'hidden', display: 'flex' }}>
        <div style={{ width: '100%', background: `linear-gradient(90deg, ${teal}, ${gold})` }}/>
      </div>
      <MonoCell color={muted} size={10}>vs goal 1.200 (107%)</MonoCell>
    </div>
  </RCard>
);

// stacked delta card (3 vertical metrics)
const KpiStacked = () => (
  <RCard padding={0}>
    <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--navy-edge)' }}>
      <CardTitle size={13}>Month-to-date</CardTitle>
      <CardSub>29 / 31 days</CardSub>
    </div>
    {[
      ['Revenue', 'Rp 198,4 Jt', 22.1, gold],
      ['Orders', '3.214', 11.8, teal],
      ['Avg Order Value', 'Rp 61,7 Rb', 9.2, violet],
    ].map(([l, v, d, c], i) => (
      <div key={l} style={{ padding: '10px 16px', borderTop: i ? '1px solid rgba(51,71,102,.4)' : 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ width: 4, alignSelf: 'stretch', background: c, borderRadius: 2 }}/>
        <div style={{ flex: 1 }}>
          <Eyebrow>{l}</Eyebrow>
          <Num size={18}>{v}</Num>
        </div>
        <RDelta value={d}/>
      </div>
    ))}
  </RCard>
);

// ═════════════════════════════════════════════════════════════════
// 3 · CHARTS
// ═════════════════════════════════════════════════════════════════

const ChartAreaDual = () => (
  <RCard padding={18}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
      <div>
        <CardTitle>Spend vs Conversions · Weekly</CardTitle>
        <CardSub>All paid channels · March 2025</CardSub>
      </div>
      <div style={{ display: 'flex', gap: 10, fontFamily: T.mono, fontSize: 10, color: sec }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><span style={{ width: 8, height: 2, background: gold }}/>Spend</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><span style={{ width: 8, height: 2, background: teal }}/>Conv.</span>
      </div>
    </div>
    <MultiArea
      seriesA={[18, 22, 28, 33, 38]}
      seriesB={[12, 16, 24, 29, 34]}
      labelsX={['W1', 'W2', 'W3', 'W4', 'W5']}
      colorA={gold}
      colorB={teal}
      w={500}
      h={170}
    />
  </RCard>
);

const ChartAreaWithAxes = () => {
  const data = [8, 12, 14, 18, 22, 25, 28, 31, 29, 26, 24];
  const max = 35, min = 0;
  const w = 480, h = 240;
  const px = (i) => 50 + (i / (data.length - 1)) * (w - 70);
  const py = (v) => (h - 50) - ((v - min) / (max - min)) * (h - 70);
  const line = data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${px(i)} ${py(v)}`).join(' ');
  const area = `${line} L ${px(data.length - 1)} ${h - 50} L ${px(0)} ${h - 50} Z`;
  
  return (
    <RCard padding={18}>
      <div style={{ marginBottom: 12 }}>
        <CardTitle>Revenue trend · With axes</CardTitle>
        <CardSub>Daily revenue · March 1–11, 2025</CardSub>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', display: 'block' }}>
        <defs>
          <linearGradient id="ax-grad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={teal} stopOpacity="0.25"/>
            <stop offset="100%" stopColor={teal} stopOpacity="0"/>
          </linearGradient>
        </defs>
        
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
          <line key={i} x1="50" x2={w - 20} y1={50 + (h - 120) * (1 - t)} y2={50 + (h - 120) * (1 - t)} stroke="var(--navy-edge)" strokeDasharray="2,3" strokeWidth="0.5"/>
        ))}
        
        {/* X-axis */}
        <line x1="50" y1={h - 50} x2={w - 20} y2={h - 50} stroke="var(--navy-edge)" strokeWidth="1"/>
        {/* Y-axis */}
        <line x1="50" y1="50" x2="50" y2={h - 50} stroke="var(--navy-edge)" strokeWidth="1"/>
        
        {/* Y-axis labels */}
        {[0, 10, 20, 30].map((val, i) => (
          <g key={`y-${i}`}>
            <text x="42" y={h - 50 - (val / max) * (h - 120) + 4} fontFamily={T.mono} fontSize="10" fill={muted} textAnchor="end">{val}</text>
            <line x1="48" y1={h - 50 - (val / max) * (h - 120)} x2="50" y2={h - 50 - (val / max) * (h - 120)} stroke="var(--navy-edge)" strokeWidth="1"/>
          </g>
        ))}
        
        {/* X-axis labels */}
        {data.map((_, i) => {
          const label = ['Mar 1', 'Mar 2', 'Mar 3', 'Mar 4', 'Mar 5', 'Mar 6', 'Mar 7', 'Mar 8', 'Mar 9', 'Mar 10', 'Mar 11'][i];
          return (
            <text key={`x-${i}`} x={px(i)} y={h - 30} fontFamily={T.mono} fontSize="10" fill={muted} textAnchor="middle">{label}</text>
          );
        })}
        
        {/* Data area and line */}
        <path d={area} fill="url(#ax-grad)"/>
        <path d={line} fill="none" stroke={teal} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        
        {/* Data points */}
        {data.map((v, i) => (
          <circle key={`pt-${i}`} cx={px(i)} cy={py(v)} r="3" fill={teal} stroke="#0C182C" strokeWidth="1.5"/>
        ))}
        
        {/* Axis labels */}
        <text x={w / 2} y={h - 5} fontFamily={T.mono} fontSize="10" fill={muted} textAnchor="middle" letterSpacing="0.08em">DATE</text>
        <text x="18" y={h / 2} fontFamily={T.mono} fontSize="10" fill={muted} textAnchor="middle" letterSpacing="0.08em" transform={`rotate(-90 18 ${h / 2})`}>REVENUE</text>
      </svg>
    </RCard>
  );
};

const ChartLineSolo = () => (
  <RCard padding={18}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
      <div>
        <Eyebrow>Organic Sessions</Eyebrow>
        <Num size={26}>24.830</Num>
        <div style={{ marginTop: 4 }}><RDelta value={8.1}/></div>
      </div>
      <div style={{ fontFamily: T.mono, fontSize: 10, color: muted }}>12-month trend</div>
    </div>
    <MiniLine data={[15, 16, 15, 17, 18, 18, 19, 20, 21, 22, 23, 24.8]} w={440} h={100} color={teal}/>
  </RCard>
);

const ChartBarPacing = () => (
  <RCard padding={18}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
      <div><CardTitle>Daily Spend · Budget pacing</CardTitle><CardSub>Target Rp 1 Jt/day</CardSub></div>
      <MonoCell color={gold} size={11} align="right">22 / 31 days</MonoCell>
    </div>
    <MiniBar
      data={Array.from({ length: 31 }, (_, i) => 0.7 + Math.sin(i * 0.35) * 0.25 + (i / 31) * 0.15)}
      w={440} h={110} color="#4285F4" activeUntil={22}
    />
    <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: T.mono, fontSize: 9.5, color: muted, marginTop: 6 }}>
      <span>Mar 1</span><span>Mar 31</span>
    </div>
  </RCard>
);

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

const PageSpeedInsights = () => (
  <RCard padding={18} style={{ background: 'linear-gradient(145deg,rgba(12,24,44,.8),rgba(0,194,184,.05))' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
      <div>
        <CardTitle>Page Speed Insights</CardTitle>
        <CardSub>Core Web Vitals · Mobile</CardSub>
      </div>
      <Eyebrow color={teal}>Needs improvement</Eyebrow>
    </div>
    
    {/* Main metric scores grid */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
      {[
        ['Performance', 68, gold],
        ['Accessibility', 92, '#16A34A'],
        ['Best Practices', 85, teal],
        ['SEO', 94, '#16A34A'],
      ].map(([label, score, color]) => (
        <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: 70, height: 70, borderRadius: '50%', background: `conic-gradient(${color} ${score * 3.6}deg, var(--navy-deep) 0deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `inset 0 0 0 3px var(--navy-surface)` }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: T.display, fontSize: 18, fontWeight: 800, color: color }}>{score}</div>
            </div>
          </div>
          <div style={{ fontFamily: T.body, fontSize: 11, color: sec, marginTop: 8, textAlign: 'center' }}>{label}</div>
        </div>
      ))}
    </div>

    {/* Core Web Vitals section */}
    <div style={{ padding: 12, background: 'rgba(0,194,184,.08)', border: '1px solid rgba(0,194,184,.2)', borderRadius: 10, marginBottom: 12 }}>
      <Eyebrow color={teal}>Core Web Vitals</Eyebrow>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 10 }}>
        {[
          ['LCP', '2.8s', 'Needs work', '#DC2626'],
          ['FID', '45ms', 'Good', '#16A34A'],
          ['CLS', '0.12', 'Good', '#16A34A'],
        ].map(([metric, val, status, color]) => (
          <div key={metric}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
              <span style={{ fontFamily: T.mono, fontSize: 10, fontWeight: 600, color: muted, textTransform: 'uppercase' }}>{metric}</span>
              <span style={{ width: 6, height: 6, background: color, borderRadius: '50%' }}/>
            </div>
            <div style={{ fontFamily: T.display, fontSize: 16, fontWeight: 700, color: fg }}>{val}</div>
            <div style={{ fontFamily: T.body, fontSize: 9.5, color: muted, marginTop: 2 }}>{status}</div>
          </div>
        ))}
      </div>
    </div>

    {/* Recommendations */}
    <div>
      <Eyebrow>Top improvements</Eyebrow>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
        {[
          ['Minify JavaScript', 'Save 0.8s', gold],
          ['Defer unused CSS', 'Save 0.3s', teal],
          ['Optimize images', 'Save 0.5s', violet],
        ].map(([rec, saving, color]) => (
          <div key={rec} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: 'rgba(51,71,102,.3)', borderLeft: `3px solid ${color}`, borderRadius: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M12 2v20M2 12h20"/></svg>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: T.body, fontSize: 11, color: fg }}>{rec}</div>
              <div style={{ fontFamily: T.mono, fontSize: 9.5, color: muted, marginTop: 1 }}>{saving}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </RCard>
);

const ScoreRing = () => (
  <RCard padding={18} style={{ background: 'linear-gradient(145deg,rgba(12,24,44,.8),rgba(0,194,184,.05))' }}>
    <Eyebrow>Authority Score</Eyebrow>
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 10 }}>
      <Ring value={85} size={110} thickness={8} color={teal} label="OF 100"/>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: T.body, fontSize: 12, color: sec, lineHeight: 1.5 }}>Domain authority tumbuh konsisten 4 bulan terakhir.</div>
        <div style={{ marginTop: 10 }}><RDelta value={4.2} suffix=" pts"/></div>
      </div>
    </div>
    <div style={{ display: 'flex', gap: 12, marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--navy-edge)' }}>
      {[['Keywords', '2.480'], ['Backlinks', '14,7K'], ['Ref. domains', '342']].map(([l, v]) => (
        <div key={l} style={{ flex: 1 }}><Eyebrow>{l}</Eyebrow><Num size={15}>{v}</Num></div>
      ))}
    </div>
  </RCard>
);

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

const MiniScoreGrid = () => (
  <RCard padding={0}>
    <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--navy-edge)' }}><CardTitle size={13}>Page health</CardTitle></div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid rgba(51,71,102,.4)' }}>
      {[
        ['Performance', 92, '#16A34A'],
        ['SEO', 88, teal],
        ['Accessibility', 76, gold],
        ['Best Practices', 94, '#16A34A'],
      ].map(([l, v, c], i) => (
        <div key={l} style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12, borderRight: i % 2 === 0 ? '1px solid rgba(51,71,102,.4)' : 'none', borderTop: i >= 2 ? '1px solid rgba(51,71,102,.4)' : 'none' }}>
          <Ring value={v} size={56} thickness={5} color={c}/>
          <div>
            <Eyebrow>{l}</Eyebrow>
            <div style={{ fontFamily: T.body, fontSize: 10.5, color: muted, marginTop: 2 }}>{v >= 90 ? 'Excellent' : v >= 75 ? 'Good' : 'Needs work'}</div>
          </div>
        </div>
      ))}
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

const ListDeviceSplit = () => (
  <RCard padding={16}>
    <CardTitle size={13}>Device split</CardTitle>
    <div style={{ marginTop: 10 }}>
      {[['Mobile', 72, teal], ['Desktop', 22, gold], ['Tablet', 6, violet]].map(([l, v, c]) => (
        <div key={l} style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: T.body, fontSize: 11.5, marginBottom: 4 }}>
            <span style={{ color: fg }}>{l}</span>
            <MonoCell color={sec}>{v}%</MonoCell>
          </div>
          <div style={{ height: 5, background: 'var(--navy-deep)', borderRadius: 2.5, overflow: 'hidden' }}><div style={{ width: v + '%', height: '100%', background: c }}/></div>
        </div>
      ))}
    </div>
  </RCard>
);

// ═════════════════════════════════════════════════════════════════
// 7 · PERFORMANCE HIGHLIGHT CAROUSEL
// ═════════════════════════════════════════════════════════════════
// Featured wins, horizontally scrolling. Three "slides" shown inline with
// carousel controls. Each slide is a mini feature card.

const HighlightCarousel = () => {
  const [idx, setIdx] = React.useState(0);
  const items = [
    { tag: '🏆 Top performer', chip: gold, title: 'Retargeting · Cart', channel: 'Display', copy: 'ROAS tertinggi bulan ini (5,2x), didorong audience "cart-abandoner 7 hari".', metrics: [['ROAS', '5,2x'], ['Conv.', '218'], ['CPA', 'Rp 19,2K']] },
    { tag: '⚡ Biggest mover', chip: teal, title: 'House of Senja Menu', channel: 'Organic', copy: 'Klik organik naik 212% MoM setelah optimasi title tag + FAQ schema.', metrics: [['Clicks', '2.120'], ['CTR', '7,36%'], ['Position', '#1,2']] },
    { tag: '💰 Best efficiency', chip: violet, title: 'YouTube · House of Senja', channel: 'Video', copy: 'Paling efisien di CPV Rp 280/view dengan completion rate 68%.', metrics: [['Views', '34.900'], ['CPV', 'Rp 280'], ['Compl.', '68%']] },
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
  { id: 'kpi-stacked', cat: 'kpi', title: 'Stacked deltas', w: 2, h: 1.5, render: KpiStacked },
  // charts
  { id: 'chart-area', cat: 'charts', title: 'Dual-area trend', w: 3, h: 1.7, render: ChartAreaDual },
  { id: 'chart-area-axes', cat: 'charts', title: 'Area with X/Y axes', w: 3, h: 1.8, render: ChartAreaWithAxes },
  { id: 'chart-line', cat: 'charts', title: 'Solo line with KPI', w: 2, h: 1.4, render: ChartLineSolo },
  { id: 'chart-bar', cat: 'charts', title: 'Bar chart', w: 2, h: 1.5, render: ChartBarPacing },
  { id: 'chart-donut', cat: 'charts', title: 'Donut with legend', w: 2, h: 1.6, render: ChartDonutMix },
  // tables
  { id: 'table-rankings', cat: 'tables', title: 'Position ranking table', w: 2, h: 1.8, render: TableRankings },
  // progress
  { id: 'progress-psi', cat: 'progress', title: 'Score ring 4-up', w: 3, h: 2, render: PageSpeedInsights },
  { id: 'progress-score', cat: 'progress', title: 'Score ring with stats', w: 2, h: 1.5, render: ScoreRing },
  { id: 'progress-grid', cat: 'progress', title: 'Score grid 2×2', w: 2, h: 1.4, render: MiniScoreGrid },
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
