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
    return (
      <LiveProvider clientId={route.clientId}>
        <ScreenReport clientId={route.clientId} onBack={() => navigate('home')}/>
      </LiveProvider>
    );
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

function ShareView({ shareToken }) {
  const [clientId, setClientId] = React.useState(null);
  const [notFound, setNotFound] = React.useState(false);

  React.useEffect(() => {
    if (!shareToken) { setNotFound(true); return; }
    let mounted = true;
    fetch('/api/app/client?share_token=' + encodeURIComponent(shareToken))
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!mounted) return;
        if (!d || !d.client) { setNotFound(true); return; }
        setClientId(d.client.id);
      })
      .catch(() => { if (mounted) setNotFound(true); });
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

  return (
    <LiveProvider clientId={clientId}>
      <ScreenReport clientId={clientId} onBack={() => {}} hideBack={true} />
    </LiveProvider>
  );
}

function Root() {
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
      <App/>
    </AppErrorBoundary>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<Root/>);
