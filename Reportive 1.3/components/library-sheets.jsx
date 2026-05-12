// Reportive — Card library presentation surfaces.
// Two exports:
//   StickerSheet   — overview wall: all cards tiled, grouped by category header.
//   CategorySheet  — deep-dive: one category, larger preview per card + meta.

const LibChrome = ({ title, subtitle, children, style = {} }) => (
  <div style={{ background: 'var(--navy-base)', height: '100%', overflow: 'auto', fontFamily: 'var(--font-body)', position: 'relative', ...style }}>
    <RFlare intensity={0.25}/>
    <div style={{ position: 'relative', zIndex: 1 }}>
      <header style={{ padding: '28px 32px 20px', borderBottom: '1px solid var(--navy-edge)', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', background: 'rgba(12,24,44,.6)', backdropFilter: 'blur(12px)' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--avo-teal)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 6 }}>Card Library · Reportive</div>
          <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: '#FCFCFC', letterSpacing: '-0.02em' }}>{title}</h1>
          {subtitle && <p style={{ margin: '6px 0 0', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-secondary)' }}>{subtitle}</p>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="assets/logo-mark.png" style={{ width: 32, height: 32 }} />
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: '#FCFCFC' }}>Avonetiq</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Design System</div>
          </div>
        </div>
      </header>
      <div style={{ padding: 32 }}>{children}</div>
    </div>
  </div>
);

const CardTile = ({ card, showId = true }) => {
  // Wrap each card at its "natural" width so tiles don't stretch unevenly.
  const natural = { 1: 280, 2: 420, 3: 640, 4: 880 }[card.w] || 420;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: natural, maxWidth: '100%' }}>
      {showId && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, color: '#FCFCFC' }}>{card.title}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>{card.id} · w{card.w}</div>
          </div>
          <span style={{ padding: '1px 7px', background: 'var(--navy-deep)', border: '1px solid var(--navy-edge)', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{card.cat}</span>
        </div>
      )}
      <div>{card.render()}</div>
    </div>
  );
};

const StickerSheet = () => (
  <LibChrome title="All card variants" subtitle="Every component at a glance — 7 categories, 26 variants. Click a category for deeper examples.">
    {window.CATS.map(cat => {
      const items = window.CARDS.filter(c => c.cat === cat.id);
      return (
        <section key={cat.id} style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid var(--navy-edge)' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--avo-teal)', background: 'rgba(0,194,184,.1)', padding: '3px 10px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600 }}>
              {String(window.CATS.findIndex(c => c.id === cat.id) + 1).padStart(2, '0')}
            </div>
            <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: '#FCFCFC', letterSpacing: '-0.01em' }}>{cat.title}</h2>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)' }}>{cat.desc}</div>
            <div style={{ flex: 1 }}/>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>{items.length} variant{items.length !== 1 ? 's' : ''}</div>
          </div>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            {items.map(c => <CardTile key={c.id} card={c}/>)}
          </div>
        </section>
      );
    })}
  </LibChrome>
);

const CategorySheet = ({ catId }) => {
  const cat = window.CATS.find(c => c.id === catId);
  const items = window.CARDS.filter(c => c.cat === catId);
  return (
    <LibChrome title={cat.title} subtitle={cat.desc}>
      <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {items.map(c => (
          <div key={c.id} style={{ display: 'flex', flexDirection: 'column', gap: 10, width: ({ 1: 300, 2: 440, 3: 660, 4: 920 })[c.w] || 440 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', borderBottom: '1px solid var(--navy-edge)', paddingBottom: 6 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: '#FCFCFC' }}>{c.title}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>{c.id}</div>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--avo-teal)', padding: '2px 8px', background: 'rgba(0,194,184,.1)', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>span-{c.w}</span>
            </div>
            {c.render()}
          </div>
        ))}
      </div>
    </LibChrome>
  );
};

Object.assign(window, { StickerSheet, CategorySheet });
