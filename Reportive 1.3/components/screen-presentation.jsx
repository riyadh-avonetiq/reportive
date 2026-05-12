// Reportive — Presentation page preview
// Full-screen presentation mode showing the report as if presenting to client

const PS = {
  display: 'var(--font-display)',
  body: 'var(--font-body)',
  mono: 'var(--font-mono)'
};

// ─── Top bar ──────────────────────────────────────────────────────
const PresTopBar = ({ clientName, currentSection, totalSections }) => (
  <div style={{
    height: 52,
    background: 'rgba(10,18,34,.88)',
    backdropFilter: 'blur(16px)',
    borderBottom: '1px solid var(--navy-edge)',
    display: 'flex',
    alignItems: 'center',
    padding: '0 24px',
    gap: 14,
    flexShrink: 0
  }}>
    <img src="assets/logo-mark.png" alt="" style={{ width: 26, height: 26, opacity: 0.9 }} />
    <div style={{
      fontFamily: PS.display,
      fontSize: 13.5,
      fontWeight: 700,
      color: '#FCFCFC',
      letterSpacing: '-.01em',
      flex: 1
    }}>{clientName} · April 2026 Report</div>

    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <button style={{
        width: 30, height: 30,
        background: 'var(--navy-surface)',
        border: '1px solid var(--navy-edge)',
        borderRadius: 7,
        color: 'var(--text-secondary)',
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
      </button>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 7,
        padding: '5px 12px',
        background: 'var(--navy-surface)',
        border: '1px solid var(--navy-edge)',
        borderRadius: 7,
        fontFamily: PS.mono,
        fontSize: 11,
        color: '#FCFCFC'
      }}>
        <span style={{ width: 5, height: 5, background: 'var(--avo-teal)', borderRadius: '50%' }}/>
        {currentSection} / {totalSections}
      </div>
      <button style={{
        width: 30, height: 30,
        background: 'var(--navy-surface)',
        border: '1px solid var(--navy-edge)',
        borderRadius: 7,
        color: 'var(--text-secondary)',
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
      </button>
    </div>
  </div>
);

// ─── Section eyebrow ──────────────────────────────────────────────
const SecEyebrow = ({ index, title, chips = [] }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
    <span style={{
      fontFamily: PS.mono,
      fontSize: 10,
      color: 'var(--avo-teal)',
      background: 'rgba(0,194,184,.1)',
      padding: '3px 10px',
      borderRadius: 4,
      letterSpacing: '.12em',
      textTransform: 'uppercase',
      fontWeight: 600
    }}>{index}</span>
    <span style={{
      fontFamily: PS.mono,
      fontSize: 10,
      color: 'var(--text-muted)',
      textTransform: 'uppercase',
      letterSpacing: '.12em',
      fontWeight: 600
    }}>{title}</span>
    <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
      {chips.map((chip, i) => (
        <span key={i} style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '3px 9px',
          borderRadius: 5,
          fontFamily: PS.display,
          fontSize: 10,
          fontWeight: 600,
          background: chip.bg,
          color: chip.color,
          border: chip.border
        }}>{chip.label}</span>
      ))}
    </div>
  </div>
);

// ─── KPI card ─────────────────────────────────────────────────────
const KpiCard = ({ accent, label, value, delta, deltaUp, comparison, progress, progressLabel }) => (
  <div style={{
    background: 'var(--navy-surface)',
    border: '1px solid var(--navy-edge)',
    borderRadius: 14,
    padding: '18px 20px 16px',
    position: 'relative',
    overflow: 'hidden'
  }}>
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0,
      height: 2,
      background: accent,
      borderRadius: '14px 14px 0 0'
    }}/>
    <div style={{
      fontFamily: PS.mono,
      fontSize: 10,
      color: 'var(--text-muted)',
      textTransform: 'uppercase',
      letterSpacing: '.1em',
      fontWeight: 600,
      marginBottom: 10
    }}>{label}</div>
    <div style={{
      fontFamily: PS.display,
      fontSize: 30,
      fontWeight: 800,
      color: '#FCFCFC',
      letterSpacing: '-.025em',
      lineHeight: 1,
      marginBottom: 12,
      fontVariantNumeric: 'tabular-nums'
    }}>{value}</div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          color: deltaUp ? '#16A34A' : '#DC2626',
          fontFamily: PS.mono,
          fontSize: 11,
          fontWeight: 600
        }}>{deltaUp ? '↑' : '↓'} {delta}</span>
        <span style={{ fontFamily: PS.body, fontSize: 10, color: 'var(--text-muted)' }}>{comparison}</span>
      </div>
      {progress != null && (
        <>
          <div style={{ height: 3, background: 'var(--navy-deep)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: accent, borderRadius: 2 }}/>
          </div>
          <div style={{ fontFamily: PS.mono, fontSize: 9.5, color: 'var(--text-muted)', textAlign: 'right' }}>{progressLabel}</div>
        </>
      )}
    </div>
  </div>
);

// ─── Section 1: Executive Summary ─────────────────────────────────
const Section1 = () => (
  <div>
    <SecEyebrow
      index="01 EXECUTIVE SUMMARY"
      title="Period · April 1–28, 2026"
      chips={[
        { label: 'Live data', bg: 'rgba(0,194,184,.1)', color: '#00C2B8', border: '1px solid rgba(0,194,184,.3)' }
      ]}
    />

    {/* KPI grid */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
      <KpiCard accent="#00C2B8" label="Revenue" value="Rp 487.2M" delta="+18.4%" deltaUp comparison="vs Mar" progress={78} progressLabel="78% of goal"/>
      <KpiCard accent="#F8B400" label="Conversions" value="2,341" delta="+12.1%" deltaUp comparison="vs Mar" progress={92} progressLabel="92% of goal"/>
      <KpiCard accent="#7000FF" label="ROAS" value="4.8x" delta="+0.6x" deltaUp comparison="vs Mar" progress={86} progressLabel="86% of target"/>
      <KpiCard accent="#0EA5E9" label="CAC" value="Rp 208K" delta="-8.2%" deltaUp comparison="lower is better" progress={64} progressLabel="below cap"/>
    </div>

    {/* Hero narrative */}
    <div style={{
      background: 'var(--navy-surface)',
      border: '1px solid var(--navy-edge)',
      borderRadius: 14,
      padding: '24px 28px',
      marginBottom: 20
    }}>
      <div style={{
        fontFamily: PS.mono,
        fontSize: 10,
        color: 'var(--avo-teal)',
        textTransform: 'uppercase',
        letterSpacing: '.12em',
        fontWeight: 700,
        marginBottom: 12
      }}>Analyst Note · Dimas P.</div>
      <div style={{
        fontFamily: PS.display,
        fontSize: 22,
        fontWeight: 700,
        color: '#FCFCFC',
        lineHeight: 1.35,
        letterSpacing: '-.01em',
        marginBottom: 14
      }}>
        Strong April performance driven by Ramadan campaign — revenue up 18.4% with ROAS hitting 4.8x.
      </div>
      <div style={{
        fontFamily: PS.body,
        fontSize: 13,
        color: 'var(--text-secondary)',
        lineHeight: 1.65
      }}>
        Paid Search remains our top channel at 42% of revenue. Meta Ads grew 28% MoM after creative refresh on April 8. Recommend reallocating 15% of Display budget to Search and increasing Meta video creative production for May.
      </div>
    </div>
  </div>
);

// ─── Section 2: Channel Summary ───────────────────────────────────
const ChannelRow = ({ icon, name, desc, spend, roas, mom, momUp }) => (
  <div style={{
    display: 'grid',
    gridTemplateColumns: '36px 1fr 120px 90px 80px',
    alignItems: 'center',
    gap: 14,
    padding: '14px 22px',
    borderTop: '1px solid rgba(51,71,102,.4)'
  }}>
    <div style={{
      width: 34, height: 34,
      background: 'var(--navy-deep)',
      border: '1px solid var(--navy-edge)',
      borderRadius: 8,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>{icon}</div>
    <div>
      <div style={{ fontFamily: PS.display, fontSize: 13, fontWeight: 700, color: '#FCFCFC' }}>{name}</div>
      <div style={{ fontFamily: PS.body, fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{desc}</div>
    </div>
    <div style={{ fontFamily: PS.mono, fontSize: 13, color: '#FCFCFC', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{spend}</div>
    <div style={{ fontFamily: PS.mono, fontSize: 13, color: '#FCFCFC', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{roas}</div>
    <div style={{
      fontFamily: PS.mono, fontSize: 12,
      color: momUp ? '#16A34A' : '#DC2626',
      textAlign: 'right',
      fontWeight: 600
    }}>{momUp ? '↑' : '↓'} {mom}</div>
  </div>
);

const Section2 = () => (
  <div>
    <SecEyebrow
      index="02 CHANNEL SUMMARY"
      title="Performance per marketing channel · April 2026"
      chips={[
        { label: '4 sources', bg: 'rgba(0,194,184,.1)', color: '#00C2B8' }
      ]}
    />

    <div style={{
      background: 'var(--navy-surface)',
      border: '1px solid var(--navy-edge)',
      borderRadius: 14,
      overflow: 'hidden',
      boxShadow: '0 4px 16px rgba(0,0,0,.15)'
    }}>
      <div style={{
        padding: '16px 22px 12px',
        borderBottom: '1px solid var(--navy-edge)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <div style={{ fontFamily: PS.display, fontSize: 14, fontWeight: 700, color: '#FCFCFC' }}>Channel Summary</div>
          <div style={{ fontFamily: PS.body, fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>All active integrations · April 2026</div>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '36px 1fr 120px 90px 80px',
        alignItems: 'center',
        gap: 14,
        padding: '8px 22px',
        background: 'var(--navy-deep)'
      }}>
        <div></div>
        <span style={{ fontFamily: PS.mono, fontSize: 9.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.1em' }}>Channel</span>
        <span style={{ fontFamily: PS.mono, fontSize: 9.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.1em', textAlign: 'right' }}>Spend</span>
        <span style={{ fontFamily: PS.mono, fontSize: 9.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.1em', textAlign: 'right' }}>ROAS</span>
        <span style={{ fontFamily: PS.mono, fontSize: 9.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.1em', textAlign: 'right' }}>MoM</span>
      </div>

      <ChannelRow
        icon={<svg width="17" height="17" viewBox="0 0 24 24"><path fill="#4285F4" d="M21.6 12.23c0-.78-.07-1.53-.2-2.25H12v4.26h5.38a4.6 4.6 0 01-2 3.02v2.51h3.24c1.9-1.75 2.99-4.33 2.99-7.54z"/><path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.43l-3.24-2.51c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H3.07v2.59A10 10 0 0012 22z"/><path fill="#FBBC04" d="M6.41 13.9a6 6 0 010-3.8V7.51H3.07a10 10 0 000 8.98l3.34-2.6z"/><path fill="#EA4335" d="M12 5.98c1.47 0 2.78.5 3.82 1.5l2.86-2.87A10 10 0 003.07 7.51l3.34 2.6C7.2 7.74 9.4 5.98 12 5.98z"/></svg>}
        name="Google Ads"
        desc="Search, Display & Video"
        spend="Rp 142.8M"
        roas="5.2x"
        mom="14%"
        momUp
      />
      <ChannelRow
        icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="#0866FF"><path d="M12 2a10 10 0 00-1.56 19.88v-7H8v-3h2.44V9.75c0-2.42 1.44-3.75 3.65-3.75 1.06 0 2.16.19 2.16.19v2.38h-1.22c-1.2 0-1.57.75-1.57 1.51V12h2.67l-.43 3h-2.24v7A10 10 0 0012 2z"/></svg>}
        name="Meta Ads"
        desc="Facebook & Instagram"
        spend="Rp 89.4M"
        roas="4.6x"
        mom="28%"
        momUp
      />
      <ChannelRow
        icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="#F9AB00"><path d="M17 3a2 2 0 012 2v14a2 2 0 01-4 0V5a2 2 0 012-2zM11 11a2 2 0 012 2v6a2 2 0 01-4 0v-6a2 2 0 012-2zM5 19a2 2 0 110-4 2 2 0 010 4z"/></svg>}
        name="Google Analytics 4"
        desc="Organic & direct traffic"
        spend="—"
        roas="—"
        mom="6%"
        momUp
      />
      <ChannelRow
        icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#00C2B8" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>}
        name="Search Console"
        desc="Organic search performance"
        spend="—"
        roas="—"
        mom="3%"
        momUp={false}
      />
    </div>
  </div>
);

// ─── Bottom nav ───────────────────────────────────────────────────
const PresBottomNav = ({ current, total }) => (
  <div style={{
    position: 'absolute',
    bottom: 20,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 30,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: 'rgba(10,18,34,.92)',
    border: '1px solid var(--navy-edge)',
    borderRadius: 100,
    padding: '6px 8px',
    backdropFilter: 'blur(20px)',
    boxShadow: '0 8px 30px rgba(0,0,0,.4)'
  }}>
    <button style={{
      width: 32, height: 32,
      border: 'none',
      borderRadius: 100,
      background: 'var(--navy-elevated)',
      color: 'var(--text-secondary)',
      cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
    </button>

    <div style={{ display: 'flex', gap: 5, alignItems: 'center', padding: '0 8px' }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          width: i === current ? 20 : 6,
          height: 6,
          borderRadius: 3,
          background: i === current ? 'var(--avo-teal)' : 'var(--navy-edge)',
          cursor: 'pointer',
          transition: 'width .2s, background .2s'
        }}/>
      ))}
    </div>

    <span style={{
      fontFamily: PS.mono,
      fontSize: 11,
      color: '#FCFCFC',
      background: 'var(--navy-elevated)',
      borderRadius: 100,
      padding: '4px 10px',
      minWidth: 48,
      textAlign: 'center'
    }}>{current + 1} / {total}</span>

    <button style={{
      width: 32, height: 32,
      border: 'none',
      borderRadius: 100,
      background: 'var(--avo-teal)',
      color: '#0C182C',
      cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
    </button>

    <div style={{ width: 1, height: 20, background: 'var(--navy-edge)' }}/>

    <button style={{
      padding: '0 14px',
      height: 32,
      border: 'none',
      borderRadius: 100,
      background: 'var(--navy-elevated)',
      color: 'var(--text-secondary)',
      fontFamily: PS.display,
      fontSize: 11,
      fontWeight: 600,
      cursor: 'pointer'
    }}>Exit</button>
  </div>
);

// ─── Main Presentation Screen ─────────────────────────────────────
const ScreenPresentation = () => {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: 'var(--navy-base)',
      color: 'var(--text-primary)',
      fontFamily: PS.body,
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Flares */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div style={{
          position: 'absolute',
          width: 900, height: 900,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(248,180,0,.32) 0%, rgba(166,105,0,.1) 40%, transparent 68%)',
          filter: 'blur(110px)',
          top: '-20%',
          left: '-8%'
        }}/>
        <div style={{
          position: 'absolute',
          width: 700, height: 700,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,194,184,.26) 0%, rgba(0,77,73,.1) 40%, transparent 68%)',
          filter: 'blur(120px)',
          bottom: '-20%',
          right: '-8%'
        }}/>
      </div>

      <PresTopBar clientName="PT Kopi Senja Nusantara" currentSection={1} totalSections={4}/>

      {/* Content */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '28px 32px 100px',
        position: 'relative',
        zIndex: 1
      }}>
        <Section1/>
        <div style={{ height: 28 }}/>
        <Section2/>
      </div>

      <PresBottomNav current={0} total={4}/>
    </div>
  );
};

Object.assign(window, { ScreenPresentation });
