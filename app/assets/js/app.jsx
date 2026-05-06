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
  if (h === 'access') return { route: 'access' };
  return { route: h };
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
    return <ScreenAccess onNavigate={navigate}/>;
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
    <LiveProvider>
      <App/>
    </LiveProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<Root/>);
