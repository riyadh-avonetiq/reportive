// Reportive · Live Card Overrides
// ─────────────────────────────────────────────────────────────────
// Replaces the render() of 6 default-slot cards in window.CARDS so they
// consume the LiveProvider context instead of the prototype's mock copy.
// Cards we don't override (callouts, rings, lists, carousels) keep their
// original mock content with a clear `TODO(data)` annotation in the
// rendered card so it's obvious which surfaces still need data wiring.

(function () {
  const { useLive, fmt } = window.LIVE;

  // ── Tiny helpers (mirror cards.jsx tokens) ─────────────────────
  const T = { display: 'var(--font-display)', body: 'var(--font-body)', mono: 'var(--font-mono)' };
  const muted = 'var(--text-muted)';
  const sec   = 'var(--text-secondary)';
  const fg    = '#FCFCFC';
  const teal  = '#00C2B8';
  const gold  = '#F8B400';
  const violet = '#7000FF';

  const Eyebrow   = ({ children, color = muted }) => <div style={{ fontFamily: T.mono, fontSize: 9.5, color, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600 }}>{children}</div>;
  const CardTitle = ({ children, size = 14 }) => <div style={{ fontFamily: T.display, fontSize: size, fontWeight: 700, color: fg, letterSpacing: '-0.01em' }}>{children}</div>;
  const CardSub   = ({ children }) => <div style={{ fontFamily: T.body, fontSize: 11, color: muted, marginTop: 2 }}>{children}</div>;
  const Num       = ({ children, size = 26, color = fg }) => <div style={{ fontFamily: T.display, fontSize: size, fontWeight: 800, color, letterSpacing: '-0.02em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{children}</div>;
  const MonoCell  = ({ children, color = fg, size = 11, align = 'right' }) => <span style={{ fontFamily: T.mono, fontSize: size, color, textAlign: align, fontVariantNumeric: 'tabular-nums' }}>{children}</span>;

  const Delta = ({ value, suffix = '%', muted: m = false }) => {
    if (value == null || isNaN(value)) return <span style={{ fontFamily: T.mono, fontSize: 11, color: muted }}>—</span>;
    const up = value >= 0;
    const c = m ? (up ? '#16A34A99' : '#DC262699') : (up ? '#16A34A' : '#DC2626');
    return <span style={{ fontFamily: T.mono, fontSize: 11, color: c, fontWeight: 500 }}>{up ? '▲' : '▼'} {Math.abs(value).toFixed(1)}{suffix}</span>;
  };

  // Sample 12 evenly from arr (for sparklines)
  const sample = (arr, n = 12) => {
    if (!arr || arr.length === 0) return Array(n).fill(0);
    if (arr.length <= n) return arr;
    const step = (arr.length - 1) / (n - 1);
    return Array.from({ length: n }, (_, i) => arr[Math.round(i * step)]);
  };

  // ─────────────────────────────────────────────────────────────
  // 1) NarrativeHero — top-of-dashboard summary banner (live KPIs)
  // ─────────────────────────────────────────────────────────────
  const LiveNarrativeHero = () => {
    const live = useLive();
    if (!live || !live.currentPeriod) return null;
    const p = live.currentPeriod;
    const conv     = p.ads.conversions;
    const convPrev = p.adsPrev.conversions;
    const change   = fmt.pctChange(conv, convPrev);
    const up       = change == null ? null : change >= 0;
    const headline = change == null
      ? `Performa marketing ${p.labelShort} siap ditinjau`
      : `Performa marketing ${p.labelShort} ${up ? 'naik' : 'turun'} ${Math.abs(change).toFixed(1)}%`;
    const acctLabel = live.account ? `Account · ${live.account}` : `${live.accounts.length || 'All'} accounts · ${live._isMock ? 'mock data' : 'live'}`;

    return (
      <RCard padding={20} style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg,rgba(0,194,184,.06),rgba(248,180,0,.04))' }}>
        <div style={{ position: 'absolute', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle,rgba(248,180,0,.18),transparent 70%)', filter: 'blur(60px)', top: -120, right: -60 }}/>
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <RStatus type={live._isMock ? 'paused' : 'connected'} label={live._isMock ? 'Demo data' : 'Live · Supabase'}/>
            <Eyebrow>{acctLabel}</Eyebrow>
          </div>
          <div style={{ fontFamily: T.display, fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: fg, lineHeight: 1.2 }}>
            {headline.split(/( naik | turun )/).map((part, i) =>
              /naik|turun/.test(part)
                ? <span key={i} style={{ color: up ? teal : '#DC2626' }}>{part}</span>
                : part
            )}
          </div>
          <p style={{ fontFamily: T.body, fontSize: 12.5, color: sec, margin: '8px 0 12px', maxWidth: 560, lineHeight: 1.5 }}>
            Total spend {fmt.rupiahShort(p.ads.spend)} dengan {fmt.num(p.ads.conversions)} konversi.
            CTR {fmt.pct(p.ads.ctr)} · {fmt.num(p.ga4.sessions || 0)} sessions tercatat di GA4.
          </p>
          <div style={{ display: 'flex', gap: 6 }}>
            <button style={{ padding: '7px 12px', background: 'transparent', color: sec, border: '1px solid var(--navy-edge)', borderRadius: 8, fontFamily: T.display, fontSize: 11.5, fontWeight: 600, cursor: 'pointer' }}>Share with client</button>
            <button onClick={() => window.print()} style={{ padding: '7px 12px', background: 'var(--navy-elevated)', color: fg, border: '1px solid var(--navy-edge)', borderRadius: 8, fontFamily: T.display, fontSize: 11.5, fontWeight: 600, cursor: 'pointer' }}>Export PDF →</button>
          </div>
        </div>
      </RCard>
    );
  };

  // ─────────────────────────────────────────────────────────────
  // 2) KpiStrip — 4 live stats in a row
  // ─────────────────────────────────────────────────────────────
  const LiveKpiStrip = () => {
    const live = useLive();
    if (!live || !live.currentPeriod) return null;
    const p = live.currentPeriod;
    const ads = p.ads, prev = p.adsPrev, ga4 = p.ga4, gPrev = p.ga4Prev;
    const items = [
      ['Spend',     fmt.rupiahShort(ads.spend),       fmt.pctChange(ads.spend, prev.spend),              gold],
      ['Conv.',     fmt.num(ads.conversions),         fmt.pctChange(ads.conversions, prev.conversions),  teal],
      ['ROAS',      fmt.roas(ads.roas),               fmt.pctChange(ads.roas, prev.roas),                teal],
      ['Sessions',  fmt.num(ga4.sessions || 0),       fmt.pctChange(ga4.sessions, gPrev.sessions),       violet],
    ];
    return (
      <RCard padding={0}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)' }}>
          {items.map(([l, v, d, c], i) => (
            <div key={l} style={{ padding: '14px 16px', borderLeft: i ? '1px solid var(--navy-edge)' : 'none' }}>
              <Eyebrow>{l}</Eyebrow>
              <Num size={20}>{v}</Num>
              <div style={{ marginTop: 6 }}><Delta value={d}/></div>
              <div style={{ marginTop: 2, height: 2, background: c, width: 28, borderRadius: 1 }}/>
            </div>
          ))}
        </div>
      </RCard>
    );
  };

  // ─────────────────────────────────────────────────────────────
  // 3) ChartAreaDual — Spend vs Conversions weekly
  // ─────────────────────────────────────────────────────────────
  // Reduce daily series → 5 weekly buckets for the prototype's W1..W5 layout.
  const weekly5 = arr => {
    if (!arr || !arr.length) return [0, 0, 0, 0, 0];
    const buckets = [0, 0, 0, 0, 0];
    arr.forEach((v, i) => {
      const idx = Math.min(4, Math.floor((i / arr.length) * 5));
      buckets[idx] += v;
    });
    return buckets;
  };

  const LiveChartAreaDual = () => {
    const live = useLive();
    if (!live || !live.currentPeriod) return null;
    const p = live.currentPeriod;
    const spendW = weekly5(p.series.spend).map(v => Math.round(v / 1_000_000)); // Jt
    const convW  = weekly5(p.series.conversions).map(v => Math.round(v));
    return (
      <RCard padding={18}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <CardTitle>Spend vs Conversions · Weekly</CardTitle>
            <CardSub>{live.account || 'All accounts'} · {p.labelLong}</CardSub>
          </div>
          <div style={{ display: 'flex', gap: 10, fontFamily: T.mono, fontSize: 10, color: sec }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><span style={{ width: 8, height: 2, background: gold }}/>Spend (Jt)</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><span style={{ width: 8, height: 2, background: teal }}/>Conv.</span>
          </div>
        </div>
        <MultiArea seriesA={spendW} seriesB={convW} labelsX={['W1','W2','W3','W4','W5']} colorA={gold} colorB={teal} w={500} h={170}/>
      </RCard>
    );
  };

  // ─────────────────────────────────────────────────────────────
  // 4) ChartDonutMix — Spend mix by campaign type (live)
  // ─────────────────────────────────────────────────────────────
  const LiveChartDonut = () => {
    const live = useLive();
    if (!live || !live.currentPeriod) return null;
    const p = live.currentPeriod;
    const top3 = (p.channels || []).slice(0, 3);
    const total = top3.reduce((s, c) => s + c.spend, 0) || 1;
    const palette = [gold, teal, violet];
    return (
      <RCard padding={18}>
        <CardTitle>Spend mix</CardTitle>
        <div style={{ display: 'flex', gap: 18, alignItems: 'center', marginTop: 14 }}>
          <MiniDonut
            size={140} thickness={10}
            segments={top3.length ? top3.map((c, i) => ({ value: c.spend, color: palette[i] })) : [{ value: 1, color: muted }]}
            centerLabel={(total / 1_000_000).toFixed(1).replace('.', ',')}
            centerSub="Jt IDR"
          />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {top3.length === 0 && <span style={{ fontFamily: T.body, fontSize: 11.5, color: muted }}>No campaign-type breakdown for this period.</span>}
            {top3.map((c, i) => {
              const pct = ((c.spend / total) * 100).toFixed(0) + '%';
              return (
                <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5 }}>
                  <span style={{ width: 8, height: 8, background: palette[i], borderRadius: 2 }}/>
                  <span style={{ flex: 1, fontFamily: T.body, color: sec }}>{c.name}</span>
                  <MonoCell color={fg}>{pct}</MonoCell>
                  <MonoCell color={muted} size={10}>{fmt.rupiahShort(c.spend)}</MonoCell>
                </div>
              );
            })}
          </div>
        </div>
      </RCard>
    );
  };

  // ─────────────────────────────────────────────────────────────
  // 5) TableChannels — by campaign type
  // ─────────────────────────────────────────────────────────────
  const channelLogoFor = (name) => {
    const n = (name || '').toLowerCase();
    if (n.includes('search')) return 'search';
    if (n.includes('display') || n.includes('performance')) return 'google';
    if (n.includes('meta') || n.includes('facebook')) return 'meta';
    return 'google';
  };

  const LiveTableChannels = () => {
    const live = useLive();
    if (!live || !live.currentPeriod) return null;
    const p = live.currentPeriod;
    const rows = p.channels.slice(0, 6);
    return (
      <RCard padding={0} style={{ overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--navy-edge)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><CardTitle>Channel Summary</CardTitle><CardSub>By campaign type · {p.labelShort}</CardSub></div>
          <span style={{ fontFamily: T.display, fontSize: 11.5, color: teal, fontWeight: 600 }}>{rows.length} channels</span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.body, fontSize: 12 }}>
          <thead>
            <tr style={{ background: 'var(--navy-deep)' }}>
              {['Channel', 'Status', 'Spend', 'Impr.', 'Clicks', 'CTR', 'Conv.', 'CPC', 'Trend'].map(h => (
                <th key={h} style={{ padding: '8px 14px', textAlign: h === 'Channel' ? 'left' : 'right', fontFamily: T.mono, fontSize: 9.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: muted }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={9} style={{ padding: 20, textAlign: 'center', color: muted, fontFamily: T.body, fontSize: 12 }}>No channel breakdown available for this period.</td></tr>
            )}
            {rows.map((r, i) => (
              <tr key={i} style={{ borderTop: '1px solid rgba(51,71,102,.5)' }}>
                <td style={{ padding: '10px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 28, height: 28, background: 'var(--navy-deep)', border: '1px solid var(--navy-edge)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ChannelLogo channel={channelLogoFor(r.name)} size={16}/>
                    </div>
                    <span style={{ fontFamily: T.display, fontWeight: 600, color: fg }}>{r.name}</span>
                  </div>
                </td>
                <td style={{ padding: '10px 14px', textAlign: 'right' }}><RStatus type="active"/></td>
                <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: T.mono, color: fg }}>{fmt.rupiahShort(r.spend)}</td>
                <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: T.mono, color: sec }}>{fmt.num(r.impressions)}</td>
                <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: T.mono, color: sec }}>{fmt.num(r.clicks)}</td>
                <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: T.mono, color: fg }}>{fmt.pct(r.ctr)}</td>
                <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: T.mono, color: fg }}>{fmt.num(r.conversions)}</td>
                <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: T.mono, color: teal }}>{fmt.rupiahShort(r.cpc)}</td>
                <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                  <Spark data={sample(p.series.spend, 7)} w={70} h={18}/>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </RCard>
    );
  };

  // ─────────────────────────────────────────────────────────────
  // 6) AnalystNote — 3-beat with live MoM deltas
  // ─────────────────────────────────────────────────────────────
  const LiveAnalystNote = () => {
    const live = useLive();
    if (!live || !live.currentPeriod) return null;
    const p = live.currentPeriod;
    const dSpend = fmt.pctChange(p.ads.spend, p.adsPrev.spend);
    const dConv  = fmt.pctChange(p.ads.conversions, p.adsPrev.conversions);
    const dSess  = fmt.pctChange(p.ga4.sessions, p.ga4Prev.sessions);
    const dStr = v => v == null ? '—' : `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`;
    const beats = [
      ['📊', 'What happened', `Spend ${dStr(dSpend)} MoM, conversions ${dStr(dConv)}.`],
      ['💡', 'Why it matters', `CTR ${fmt.pct(p.ads.ctr)} dengan CPC ${fmt.rupiahShort(p.ads.cpc)} — ${p.channels[0] ? `kontributor utama ${p.channels[0].name}` : 'cek channel breakdown di slot bawah'}.`],
      ['🎯', 'Next action',   dConv != null && dConv >= 0
        ? `Lanjutkan strategi current — konversi tumbuh konsisten.`
        : `Investigate channel mix — konversi turun, butuh re-allocation budget.`],
    ];

    return (
      <RCard padding={16} style={{ background: 'linear-gradient(135deg,rgba(0,194,184,.04),rgba(248,180,0,.02))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{ width: 22, height: 22, background: 'rgba(0,194,184,.14)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="12" height="12" fill="none" stroke={teal} strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </div>
          <Eyebrow color={teal}>Analyst note · {p.labelShort}</Eyebrow>
          <div style={{ flex: 1 }}/>
          <span style={{ fontFamily: T.mono, fontSize: 9.5, color: muted }}>Sessions {dStr(dSess)}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
          {beats.map(([e, t, b]) => (
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
  };

  // ─────────────────────────────────────────────────────────────
  // Optional bonus: live overrides for two more cards that map cleanly
  // ─────────────────────────────────────────────────────────────
  const LiveTableCampaigns = () => {
    const live = useLive();
    if (!live || !live.currentPeriod) return null;
    const p = live.currentPeriod;
    const rows = p.campaigns.slice(0, 5);
    return (
      <RCard padding={0} style={{ overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--navy-edge)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><CardTitle>Top Campaigns</CardTitle><CardSub>{live.account || 'All accounts'} · {p.labelShort}</CardSub></div>
        </div>
        {rows.length === 0 && <div style={{ padding: 20, textAlign: 'center', color: muted }}>No campaigns for this period.</div>}
        {rows.map((r, i) => (
          <div key={i} style={{ padding: '10px 16px', borderTop: '1px solid rgba(51,71,102,.4)', display: 'grid', gridTemplateColumns: '1.7fr 80px 80px 1fr 60px 70px', gap: 8, alignItems: 'center' }}>
            <span style={{ fontFamily: T.display, fontSize: 12, fontWeight: 600, color: fg, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
            <RChip color={r.type === 'Search' ? '#4285F4' : gold}>{r.type || '—'}</RChip>
            <RStatus type="active"/>
            <MonoCell color={fg}>{fmt.rupiahShort(r.spend)}</MonoCell>
            <MonoCell color={sec}>{fmt.pct(r.ctr)}</MonoCell>
            <MonoCell color={teal}>{fmt.rupiahShort(r.cpa)}</MonoCell>
          </div>
        ))}
      </RCard>
    );
  };

  const LiveScoreRing = () => {
    const live = useLive();
    if (!live || !live.currentPeriod) return null;
    const p = live.currentPeriod;
    const psi = p.psi || { performance: 78, seo: 82, accessibility: 70, best_practices: 88 };
    const score = Math.round((psi.performance + psi.seo + psi.accessibility + psi.best_practices) / 4);
    return (
      <RCard padding={18} style={{ background: 'linear-gradient(145deg,rgba(12,24,44,.8),rgba(0,194,184,.05))' }}>
        <Eyebrow>PageSpeed Score</Eyebrow>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 10 }}>
          <Ring value={score} size={110} thickness={8} color={teal} label="OF 100"/>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: T.body, fontSize: 12, color: sec, lineHeight: 1.5 }}>
              {p.psi ? 'Average Lighthouse score across audited pages.' : 'No PSI runs yet — sync via psi_sync.js.'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--navy-edge)' }}>
          {[['Perf', psi.performance], ['SEO', psi.seo], ['A11y', psi.accessibility], ['Best', psi.best_practices]].map(([l, v]) => (
            <div key={l} style={{ flex: 1 }}><Eyebrow>{l}</Eyebrow><Num size={15}>{v}</Num></div>
          ))}
        </div>
      </RCard>
    );
  };

  const LiveMiniScoreGrid = () => {
    const live = useLive();
    if (!live || !live.currentPeriod) return null;
    const psi = live.currentPeriod.psi || { performance: 78, seo: 82, accessibility: 70, best_practices: 88 };
    const items = [
      ['Performance', psi.performance, '#16A34A'],
      ['SEO', psi.seo, teal],
      ['Accessibility', psi.accessibility, gold],
      ['Best Practices', psi.best_practices, '#16A34A'],
    ];
    return (
      <RCard padding={0}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--navy-edge)' }}><CardTitle size={13}>Page health</CardTitle></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid rgba(51,71,102,.4)' }}>
          {items.map(([l, v, c], i) => (
            <div key={l} style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12, borderRight: i % 2 === 0 ? '1px solid rgba(51,71,102,.4)' : 'none', borderTop: i >= 2 ? '1px solid rgba(51,71,102,.4)' : 'none' }}>
              <Ring value={v} size={56} thickness={5} color={v >= 90 ? '#16A34A' : v >= 75 ? c : '#DC2626'}/>
              <div>
                <Eyebrow>{l}</Eyebrow>
                <div style={{ fontFamily: T.body, fontSize: 10.5, color: muted, marginTop: 2 }}>{v >= 90 ? 'Excellent' : v >= 75 ? 'Good' : 'Needs work'}</div>
              </div>
            </div>
          ))}
        </div>
      </RCard>
    );
  };

  // ─────────────────────────────────────────────────────────────
  // Patch the registry — replace render() for the cards we override
  // ─────────────────────────────────────────────────────────────
  const overrides = {
    'narrative-hero':  LiveNarrativeHero,
    'narrative-note':  LiveAnalystNote,
    'kpi-strip':       LiveKpiStrip,
    'chart-area':      LiveChartAreaDual,
    'chart-donut':     LiveChartDonut,
    'table-channels':  LiveTableChannels,
    'table-campaigns': LiveTableCampaigns,
    'progress-score':  LiveScoreRing,
    'progress-grid':   LiveMiniScoreGrid,
  };

  function applyOverrides() {
    if (!window.CARDS) { console.warn('[Reportive] CARDS registry not ready'); return; }
    Object.entries(overrides).forEach(([id, comp]) => {
      const c = window.CARDS.find(x => x.id === id);
      if (c) { c.render = comp; c.live = true; }
    });
  }

  // CARDS may not be registered yet (script order); re-try once.
  if (window.CARDS) applyOverrides();
  else setTimeout(applyOverrides, 0);

  window.LIVE_CARDS = { applyOverrides, overrides };
})();
