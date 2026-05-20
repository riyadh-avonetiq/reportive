// Reportive · App Shell
// ─────────────────────────────────────────────────────────────────
// Post-login entry point.
//   #home         → ScreenHome (client list)
//   #client/<id>  → ScreenReport (per-client reporting dashboard)
//   #access       → ScreenAccess (team management)
//
// LiveProvider wraps everything so Supabase data is available
// throughout the entire tree.

const { useState, useEffect, useCallback } = React;
const { LiveProvider, useLive } = window.LIVE;

// ── Auth gate (re-check) ────────────────────────────────────────
const ROLE     = sessionStorage.getItem('avo_role') || 'guest';
const IS_ADMIN = ROLE === 'admin';

// ─────────────────────────────────────────────────────────────────
// Tiny in-app router (URL hash). Defaults to "home".
// ─────────────────────────────────────────────────────────────────
function parseHash() {
  const h = window.location.hash.replace(/^#/, '') || 'home';
  if (h.startsWith('client/')) return { route: 'client', clientId: h.slice('client/'.length) };
  if (h.startsWith('share/'))  return { route: 'share',  shareToken: h.slice('share/'.length) };
  if (h === 'access') return { route: 'access' };
  return { route: h };
}

// ─────────────────────────────────────────────────────────────────
// Top-level error boundary — catches crashes in any screen
// ─────────────────────────────────────────────────────────────────
class AppErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) return (
      <div style={{
        height: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: '#060E1A', color: '#FCFCFC',
        fontFamily: 'monospace', padding: 40,
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#E3170A', marginBottom: 12 }}>
          Application Error
        </div>
        <div style={{ fontSize: 11, color: '#FCFCFC', marginBottom: 8, maxWidth: 600, wordBreak: 'break-word' }}>
          {this.state.error.message}
        </div>
        <pre style={{ fontSize: 9, color: '#64748B', maxWidth: 700, overflow: 'auto', whiteSpace: 'pre-wrap', marginTop: 12 }}>
          {this.state.error.stack}
        </pre>
        <button
          onClick={() => { this.setState({ error: null }); window.location.hash = 'home'; }}
          style={{ marginTop: 20, padding: '8px 20px', background: '#00C2B8', border: 'none', borderRadius: 7, color: '#0C182C', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>
          ← Back to Home
        </button>
      </div>
    );
    return this.props.children;
  }
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
    return <ScreenReport clientId={route.clientId} onBack={() => navigate('home')}/>;
  }

  if (route.route === 'access') {
    if (ROLE === 'viewer') return <ScreenHome onOpenClient={onOpenClient} onNavigate={navigate}/>;
    return <ScreenAccess onNavigate={navigate}/>;
  }

  if (route.route === 'share') {
    return <ShareView shareToken={route.shareToken} />;
  }

  // Default: Home
  return <ScreenHome onOpenClient={onOpenClient} onNavigate={navigate}/>;
}

// ── Auth Supabase client (clients table) ───────────────────────
const _AUTH_SUPA = (window.supabase && window.supabase.createClient)
  ? window.supabase.createClient(
      'https://swklfolveiilajdmuenu.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3a2xmb2x2ZWlpbGFqZG11ZW51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NDEwMDAsImV4cCI6MjA5MzAxNzAwMH0.ZuxBQkHGwpY82XwA0NQzjqnvCeJH0WUIcp0Bux2K-84'
    )
  : null;
window._layoutSupa = _AUTH_SUPA;

function ShareView({ shareToken }) {
  const [clientId, setClientId] = React.useState(null);
  const [notFound, setNotFound] = React.useState(false);

  React.useEffect(() => {
    if (!shareToken || !_AUTH_SUPA) { setNotFound(true); return; }
    let mounted = true;
    _AUTH_SUPA.from('clients').select('id').eq('share_token', shareToken).single()
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error || !data) { setNotFound(true); return; }
        setClientId(data.id);
      });
    return () => { mounted = false; };
  }, [shareToken]);

  if (notFound) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#060E1A' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
        Link not found or expired.
      </div>
    </div>
  );

  if (!clientId) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#060E1A' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
        Loading…
      </div>
    </div>
  );

  return <ScreenReport clientId={clientId} onBack={() => {}} hideBack={true} />;
}

function Root() {
  // Fetch clients globally so any route can look up a client by ID
  useEffect(() => {
    if (!_AUTH_SUPA) return;
    _AUTH_SUPA.from('clients').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { if (data && data.length > 0) window._avo_clients = data; });
  }, []);

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
    <AppErrorBoundary>
      <LiveProvider>
        <App/>
      </LiveProvider>
    </AppErrorBoundary>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<Root/>);
