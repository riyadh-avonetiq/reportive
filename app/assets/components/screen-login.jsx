// Reportive — Login screen

const ScreenLogin = () => (
  <div style={{ height: '100%', background: 'var(--navy-base)', fontFamily: 'var(--font-body)', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <RFlare intensity={0.8}/>
    <div style={{ position: 'relative', zIndex: 1, width: 400, padding: 36, borderRadius: 20, background: 'linear-gradient(145deg,rgba(12,24,44,.85),rgba(28,42,63,.75))', border: '1px solid rgba(255,255,255,.08)', backdropFilter: 'blur(20px)', boxShadow: '0 40px 120px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.1)' }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <img src="assets/logo-vertical-on-dark.png" style={{ height: 70, marginBottom: 14 }}/>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: '#FCFCFC', letterSpacing: '-0.01em' }}>Welcome back</div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>Sign in to your Reportive workspace</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 5 }}>Email</div>
          <input defaultValue="rizki.anindita@avonetiq.id" style={{ width: '100%', boxSizing: 'border-box', padding: '11px 14px', background: 'var(--navy-elevated)', border: '1.5px solid var(--navy-edge)', borderRadius: 8, color: '#FCFCFC', fontFamily: 'var(--font-body)', fontSize: 13, outline: 'none' }}/>
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Password</span>
            <a style={{ fontFamily: 'var(--font-display)', fontSize: 10.5, color: 'var(--avo-teal)', fontWeight: 600 }}>Forgot?</a>
          </div>
          <input type="password" defaultValue="••••••••••" style={{ width: '100%', boxSizing: 'border-box', padding: '11px 14px', background: 'var(--navy-elevated)', border: '1.5px solid rgba(0,194,184,.6)', borderRadius: 8, color: '#FCFCFC', fontFamily: 'var(--font-body)', fontSize: 13, outline: 'none', boxShadow: '0 0 0 3px rgba(0,194,184,.1)' }}/>
        </div>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4, fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-secondary)' }}>
          <span style={{ width: 16, height: 16, background: 'var(--avo-teal)', borderRadius: 4, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#0C182C" strokeWidth="3"><path d="M5 13l4 4L19 7"/></svg>
          </span>
          Keep me signed in for 30 days
        </label>
        <button style={{ marginTop: 10, padding: '13px 18px', background: 'linear-gradient(135deg,#00C2B8,#009E96)', color: '#0C182C', border: 'none', borderRadius: 8, fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 24px rgba(0,194,184,.25)', letterSpacing: '0.01em' }}>Sign in →</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '8px 0 4px' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--navy-edge)' }}/>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>or</span>
          <div style={{ flex: 1, height: 1, background: 'var(--navy-edge)' }}/>
        </div>
        <button style={{ padding: '11px 14px', background: 'var(--navy-elevated)', color: '#FCFCFC', border: '1px solid var(--navy-edge)', borderRadius: 8, fontFamily: 'var(--font-display)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <ChannelLogo channel="google" size={16}/> Continue with Google
        </button>
      </div>
      <div style={{ marginTop: 22, paddingTop: 16, borderTop: '1px solid var(--navy-edge)', textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 11.5, color: 'var(--text-muted)' }}>
        New to Reportive? <a style={{ color: 'var(--avo-teal)', fontWeight: 600 }}>Request workspace access</a>
      </div>
    </div>
    <div style={{ position: 'absolute', bottom: 20, left: 0, right: 0, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', zIndex: 1 }}>© 2026 PT Avonetiq Digital Indonesia · Reportive v2.4</div>
  </div>
);

Object.assign(window, { ScreenLogin });
