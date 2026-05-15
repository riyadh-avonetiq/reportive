// Reportive — Login screen
// Two entry modes:
//   1. Continue without login  → name + workspace code (guest viewer)
//   2. Admin login             → email + password (full access)

const LS = {
  display: 'var(--font-display)',
  body: 'var(--font-body)',
  mono: 'var(--font-mono)',
};

const TabBtn = ({ active, onClick, icon, label, sublabel }) => (
  <button onClick={onClick}
    style={{
      flex: 1, padding: '12px 12px', borderRadius: 10,
      background: active ? 'linear-gradient(140deg,rgba(0,194,184,.18),rgba(0,194,184,.04))' : 'transparent',
      border: `1.5px solid ${active ? 'rgba(0,194,184,.5)' : 'var(--navy-edge)'}`,
      cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4,
      textAlign: 'left', transition: 'all .15s',
      boxShadow: active ? '0 0 0 3px rgba(0,194,184,.08)' : 'none',
    }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
      <span style={{
        width: 22, height: 22, borderRadius: 6,
        background: active ? 'rgba(0,194,184,.2)' : 'var(--navy-elevated)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: active ? '#00C2B8' : 'var(--text-muted)',
      }}>
        <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
      </span>
      <span style={{ fontFamily: LS.display, fontSize: 12, fontWeight: 700, color: active ? '#FCFCFC' : 'var(--text-secondary)', letterSpacing: '-.01em' }}>{label}</span>
    </div>
    <div style={{ fontFamily: LS.mono, fontSize: 9, color: active ? 'var(--avo-teal)' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.1em', paddingLeft: 29 }}>{sublabel}</div>
  </button>
);

const InputField = ({ label, type = 'text', defaultValue, focus, placeholder, mono, right }) => (
  <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
      <span style={{ fontFamily: LS.mono, fontSize: 9.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.1em' }}>{label}</span>
      {right}
    </div>
    <input type={type} defaultValue={defaultValue} placeholder={placeholder}
      style={{
        width: '100%', boxSizing: 'border-box', padding: '11px 14px',
        background: 'var(--navy-elevated)',
        border: `1.5px solid ${focus ? 'rgba(0,194,184,.6)' : 'var(--navy-edge)'}`,
        borderRadius: 8, color: '#FCFCFC',
        fontFamily: mono ? LS.mono : LS.body, fontSize: 13, outline: 'none',
        boxShadow: focus ? '0 0 0 3px rgba(0,194,184,.1)' : 'none',
        letterSpacing: mono ? '.08em' : 'normal',
      }}/>
  </div>
);

const ScreenLogin = () => {
  const [mode, setMode] = React.useState('guest'); // 'guest' | 'admin'
  const [guestStep, setGuestStep] = React.useState('email'); // 'email' | 'verify'
  const [email, setEmail] = React.useState('');

  return (
    <div style={{ height: '100%', background: 'var(--navy-base)', fontFamily: LS.body, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <RFlare intensity={0.8}/>

      <div style={{
        position: 'relative', zIndex: 1, width: 420, padding: 32, borderRadius: 20,
        background: 'linear-gradient(145deg,rgba(12,24,44,.85),rgba(28,42,63,.75))',
        border: '1px solid rgba(255,255,255,.08)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 40px 120px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.1)',
      }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 22, paddingBottom: 16, borderBottom: '1.5px solid var(--navy-edge)' }}>
          <img src="assets/logo-mark-new.png" style={{ height: 80, marginBottom: 12 }}/>
          <div style={{ fontFamily: LS.display, fontSize: 18, fontWeight: 700, color: '#FCFCFC', letterSpacing: '-.01em' }}>
            {mode === 'guest' ? (guestStep === 'email' ? 'Sign In' : 'Enter verification code') : 'Sign In'}
          </div>
          <div style={{ fontFamily: LS.body, fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
            {mode === 'guest' 
              ? (guestStep === 'email' ? 'View performance reports in real time' : 'Verification code sent to your inbox')
              : 'Manage clients, members, and reports'}
          </div>
        </div>

        {/* Mode tabs (only show in email step) */}
        {guestStep === 'email' && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 22 }}>
            <TabBtn active={mode === 'guest'} onClick={() => setMode('guest')}
              icon={<><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 1116 0"/></>}
              label="Guest Login" sublabel="View access"/>
            <TabBtn active={mode === 'admin'} onClick={() => setMode('admin')}
              icon={<><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></>}
              label="Admin login" sublabel="Full access"/>
          </div>
        )}

        {/* Guest Magic Link Flow */}
        {mode === 'guest' ? (
          guestStep === 'email' ? (
            // Email input step
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <InputField label="Email address" type="email" placeholder="you@example.com" defaultValue="" 
                value={email}
              />

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, background: 'rgba(0,194,184,.06)', border: '1px solid rgba(0,194,184,.2)' }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, background: 'rgba(0,194,184,.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="12" height="12" fill="none" stroke="#00C2B8" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
                </div>
                <div style={{ fontFamily: LS.body, fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  A 6-digit OTP code will be sent to your email. Valid for 10 minutes.
                </div>
              </div>

              <button 
                onClick={() => setGuestStep('verify')}
                style={{ marginTop: 4, padding: '13px 18px', background: 'linear-gradient(135deg,#00C2B8,#009E96)', color: '#0C182C', border: 'none', borderRadius: 8, fontFamily: LS.display, fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 24px rgba(0,194,184,.25)', letterSpacing: '.01em' }}>
                Send OTP code →
              </button>
            </div>
          ) : (
            // Verification step
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: 'rgba(0,194,184,.06)', border: '1px solid rgba(0,194,184,.2)', borderRadius: 12, padding: 14, marginBottom: 2 }}>
                <div style={{ fontFamily: LS.mono, fontSize: 10.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Code sent to</div>
                <div style={{ fontFamily: LS.display, fontSize: 13.5, fontWeight: 700, color: '#FCFCFC', wordBreak: 'break-all' }}>
                  you@example.com
                </div>
              </div>

              <div>
                <div style={{ fontFamily: LS.mono, fontSize: 9.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 8 }}>Enter 6-digit code</div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
                  {[0,1,2,3,4,5].map(i => (
                    <input key={i} type="text" maxLength={1} defaultValue=""
                      style={{
                        width: 48, height: 56, textAlign: 'center', boxSizing: 'border-box',
                        background: 'var(--navy-elevated)',
                        border: `1.5px solid ${i === 3 ? 'rgba(0,194,184,.6)' : 'var(--navy-edge)'}`,
                        borderRadius: 10, color: '#FCFCFC',
                        fontFamily: LS.mono, fontSize: 22, fontWeight: 700, outline: 'none',
                        boxShadow: i === 3 ? '0 0 0 3px rgba(0,194,184,.1)' : 'none',
                      }}/>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: LS.body, fontSize: 11.5, color: 'var(--text-muted)' }}>
                <span>Didn't receive it?</span>
                <a style={{ color: 'var(--avo-teal)', fontWeight: 600, cursor: 'pointer', fontFamily: LS.display, fontSize: 11.5 }}>Resend code (00:42)</a>
              </div>

              <button style={{ padding: '13px 18px', background: 'linear-gradient(135deg,#00C2B8,#009E96)', color: '#0C182C', border: 'none', borderRadius: 8, fontFamily: LS.display, fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 24px rgba(0,194,184,.25)', letterSpacing: '.01em' }}>
                Verify code →
              </button>

              <button 
                onClick={() => setGuestStep('email')}
                style={{ padding: '11px 18px', background: 'transparent', color: 'var(--avo-teal)', border: '1px solid var(--navy-edge)', borderRadius: 8, fontFamily: LS.display, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}>
                ← Back
              </button>
            </div>
          )
        ) : (
          // Admin login form
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <InputField label="Email" defaultValue="rizki.anindita@avonetiq.id"/>
            <InputField label="Password" type="password" defaultValue="••••••••••" focus
              right={<a style={{ fontFamily: LS.display, fontSize: 10.5, color: 'var(--avo-teal)', fontWeight: 600 }}>Forgot?</a>}/>

            <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 2, fontFamily: LS.body, fontSize: 12, color: 'var(--text-secondary)' }}>
              <span style={{ width: 16, height: 16, background: 'var(--avo-teal)', borderRadius: 4, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#0C182C" strokeWidth="3"><path d="M5 13l4 4L19 7"/></svg>
              </span>
              Keep me signed in for 30 days
            </label>

            <button style={{ marginTop: 4, padding: '13px 18px', background: 'linear-gradient(135deg,#00C2B8,#009E96)', color: '#0C182C', border: 'none', borderRadius: 8, fontFamily: LS.display, fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 24px rgba(0,194,184,.25)', letterSpacing: '.01em' }}>
              Sign in as admin →
            </button>
          </div>
        )}

        <div style={{ marginTop: 22, paddingTop: 16, borderTop: '1px solid var(--navy-edge)', textAlign: 'center', fontFamily: LS.body, fontSize: 11.5, color: 'var(--text-muted)', display: 'none' }}>
          {mode === 'guest'
            ? <>Are you the workspace owner? <a onClick={() => setMode('admin')} style={{ color: 'var(--avo-teal)', fontWeight: 600, cursor: 'pointer' }}>Switch to admin login</a></>
            : <>New to Reportive? <a style={{ color: 'var(--avo-teal)', fontWeight: 600, cursor: 'pointer' }}>Request workspace access</a></>
          }
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 20, left: 0, right: 0, textAlign: 'center', fontFamily: LS.mono, fontSize: 9.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.15em', zIndex: 1 }}>
        Reportive by Avonetiq
      </div>
    </div>
  );
};

Object.assign(window, { ScreenLogin });
