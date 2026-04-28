// Reportive · App Shell
// ─────────────────────────────────────────────────────────────────
// Post-login entry point. Currently mounts the Home screen (client list).
// Dashboard / Templates / Access / Editor are NOT wired yet — the user is
// implementing screens incrementally and Home is what's in scope right now.
//
// LiveProvider stays in place so when the dashboard is wired later, live
// Supabase data is already available throughout the tree.

const { useState, useEffect, useCallback } = React;
const { LiveProvider, useLive } = window.LIVE;

// ── Auth gate (re-check) ────────────────────────────────────────
const ROLE     = sessionStorage.getItem('avo_role') || 'guest';
const IS_ADMIN = ROLE === 'admin';

// ─────────────────────────────────────────────────────────────────
// Tiny in-app router (URL hash). Defaults to "home".
//   #home    → Home (client list)
//   #client/<id> → placeholder; dashboard not yet implemented
// ─────────────────────────────────────────────────────────────────
function parseHash() {
  const h = window.location.hash.replace(/^#/, '') || 'home';
  if (h.startsWith('client/')) return { route: 'client', clientId: h.slice('client/'.length) };
  return { route: h };
}

function ClientPlaceholder({ clientId, onBack }) {
  return (
    <div style={{
      height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--navy-base)', position: 'relative', overflow: 'hidden',
      flexDirection: 'column', gap: 14, padding: 32,
    }}>
      {window.RFlare && <RFlare intensity={0.25}/>}
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 480 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--avo-teal)', textTransform: 'uppercase', letterSpacing: '0.16em', marginBottom: 8 }}>Client · {clientId}</div>
        <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: '#FCFCFC', letterSpacing: '-0.02em' }}>Dashboard not wired yet</h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-secondary)', marginTop: 10, lineHeight: 1.6 }}>
          The home screen is in scope right now. The per-client dashboard will be wired next.
        </p>
        <button onClick={onBack} style={{
          marginTop: 18, padding: '10px 18px', background: 'linear-gradient(135deg,#00C2B8,#009E96)',
          color: '#0C182C', border: 'none', borderRadius: 8,
          fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, cursor: 'pointer',
          boxShadow: '0 4px 14px rgba(0,194,184,.25)',
        }}>← Back to Home</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Root App
// ─────────────────────────────────────────────────────────────────
function App() {
  const [route, setRoute] = useState(parseHash());

  useEffect(() => {
    const onHash = () => setRoute(parseHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const navigate = useCallback((hash) => {
    window.location.hash = hash;
  }, []);

  const onOpenClient = useCallback((clientId) => {
    navigate(`client/${clientId}`);
  }, [navigate]);

  if (route.route === 'client') {
    return <ClientPlaceholder clientId={route.clientId} onBack={() => navigate('home')}/>;
  }

  // Default: Home
  return <ScreenHome onOpenClient={onOpenClient}/>;
}

function Root() {
  // Hide the boot splash on first paint
  useEffect(() => {
    const el = document.getElementById('boot-splash');
    if (!el) return;
    requestAnimationFrame(() => {
      el.classList.add('gone');
      setTimeout(() => el.remove(), 400);
    });
  }, []);
  return (
    <LiveProvider>
      <App/>
    </LiveProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<Root/>);
