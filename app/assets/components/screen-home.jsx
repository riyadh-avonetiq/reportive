// Reportive — Home · Client List (revised)
// Changes: sub-actions (Edit / Duplicate / Delete) below each row,
// Edit modal (logo, name, info), Configure panel (connect data sources).
// Removed: status badge, last synced indicator.

const HOME_CLIENTS = [
{
  id: 'kopi-senja',
  name: 'PT Kopi Senja Nusantara',
  industry: 'F&B · Specialty Coffee',
  initials: 'KS',
  logo: null,
  avatarGrad: 'linear-gradient(135deg,#00C2B8,#7000FF)',
  period: 'Apr 2026',
  sources: ['google', 'meta', 'ga4', 'search'],
  alert: null,
  featured: true,
  info: { pic: 'Dimas Pratama', email: 'dimas@kopisenja.id', website: 'kopisenja.id', notes: '' },
  connected: { google: true, meta: true, ga4: true, search: true, pagespeed: true },
  lastEdited: '2 hours ago'
},
{
  id: 'batik-nusa',
  name: 'CV Batik Nusa Indah',
  industry: 'Fashion · Batik & Textile',
  initials: 'BN',
  logo: null,
  avatarGrad: 'linear-gradient(135deg,#F8B400,#E3170A)',
  period: 'Apr 2026',
  sources: ['google', 'meta'],
  alert: { type: 'warning', msg: 'Budget 92% used' },
  featured: false,
  info: { pic: 'Sari Dewi', email: 'sari@batiknusa.co.id', website: 'batiknusa.co.id', notes: '' },
  connected: { google: true, meta: true, ga4: false, search: false },
  lastEdited: 'Yesterday'
},
{
  id: 'tekno-pintar',
  name: 'PT Teknologi Pintar',
  industry: 'SaaS · EdTech',
  initials: 'TP',
  logo: null,
  avatarGrad: 'linear-gradient(135deg,#4285F4,#00C2B8)',
  period: 'Apr 2026',
  sources: ['google', 'ga4', 'search'],
  alert: null,
  featured: false,
  info: { pic: 'Andi Kurniawan', email: 'andi@teknopintar.id', website: 'teknopintar.id', notes: '' },
  connected: { google: true, meta: false, ga4: true, search: true },
  lastEdited: '3 days ago'
},
{
  id: 'properti-indah',
  name: 'PT Properti Indah Lestari',
  industry: 'Property · Real Estate',
  initials: 'PI',
  logo: null,
  avatarGrad: 'linear-gradient(135deg,#16A34A,#0EA5E9)',
  period: 'Mar 2026',
  sources: ['meta', 'ga4'],
  alert: { type: 'error', msg: 'Reauthorize Meta Ads token' },
  featured: false,
  info: { pic: 'Budi Santoso', email: 'budi@propertiindah.id', website: 'propertiindah.id', notes: '' },
  connected: { google: false, meta: true, ga4: true, search: false },
  lastEdited: '1 week ago'
},
{
  id: 'herbal-nusa',
  name: 'CV Herbal Nusa Sejati',
  industry: 'Health · Herbal & Wellness',
  initials: 'HN',
  logo: null,
  avatarGrad: 'linear-gradient(135deg,#16A34A,#F8B400)',
  period: 'Apr 2026',
  sources: ['google', 'meta', 'ga4'],
  alert: null,
  featured: false,
  info: { pic: 'Rina Pertiwi', email: 'rina@herbalnusa.id', website: 'herbalnusa.id', notes: '' },
  connected: { google: true, meta: true, ga4: true, search: false },
  lastEdited: '5 days ago'
},
{
  id: 'resto-archipelago',
  name: 'Resto Archipelago Group',
  industry: 'F&B · Restaurant Chain',
  initials: 'RA',
  logo: null,
  avatarGrad: 'linear-gradient(135deg,#E3170A,#F8B400)',
  period: 'Apr 2026',
  sources: ['meta', 'ga4'],
  alert: null,
  featured: false,
  info: { pic: 'Hendra Wijaya', email: 'hendra@archipelago.id', website: 'archipelago.id', notes: '' },
  connected: { google: false, meta: true, ga4: true, search: false },
  lastEdited: '4 days ago'
}];

// ── Deterministic gradient from name ─────────────────────────────
const _GRADS = [
  ['#00C2B8','#7000FF'],
  ['#4285F4','#00C2B8'],
  ['#F8B400','#E3170A'],
  ['#16A34A','#0EA5E9'],
  ['#E3170A','#F8B400'],
  ['#16A34A','#F8B400'],
  ['#7000FF','#4285F4'],
  ['#0EA5E9','#16A34A'],
  ['#F8B400','#00C2B8'],
  ['#E3170A','#7000FF'],
  ['#4285F4','#F8B400'],
  ['#00C2B8','#16A34A'],
];
function _nameGrad(name) {
  const s = (name || '').trim();
  if (!s) return `linear-gradient(135deg,#00C2B8,#7000FF)`;
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  const [a, b] = _GRADS[h % _GRADS.length];
  return `linear-gradient(135deg,${a},${b})`;
}

// ── Supabase app client — clients CRUD + Realtime ─────────────────
const _APP_SUPA = (window.supabase && window.supabase.createClient)
  ? window.supabase.createClient(
      'https://swklfolveiilajdmuenu.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3a2xmb2x2ZWlpbGFqZG11ZW51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NDEwMDAsImV4cCI6MjA5MzAxNzAwMH0.ZuxBQkHGwpY82XwA0NQzjqnvCeJH0WUIcp0Bux2K-84'
    )
  : null;

function _relTime(ts) {
  if (!ts) return '—';
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 2) return 'Just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return h === 1 ? '1 hour ago' : `${h} hours ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'Yesterday';
  if (d < 7) return `${d} days ago`;
  return `${Math.floor(d / 7)} week${d >= 14 ? 's' : ''} ago`;
}

function _mapRow(row) {
  return {
    id: row.id,
    name: row.name,
    logo: row.logo || null,
    initials: row.initials || row.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2),
    avatarGrad: row.avatar_grad || _nameGrad(row.name),
    status: row.status || 'active',
    period: row.period || 'Apr 2026',
    featured: row.featured || false,
    connected: row.connected || {},
    info: row.info || {},
    alert: row.alert || null,
    lastEdited: _relTime(row.last_edited),
    lastEditedTs: row.last_edited ? new Date(row.last_edited).getTime() : 0,
    _ts: row.last_edited,
    _createdAt: row.created_at,
  };
}

async function _seedClients() {
  if (!_APP_SUPA) return;
  const rows = HOME_CLIENTS.map((c, i) => ({
    id: c.id,
    name: c.name,
    logo: c.logo || null,
    initials: c.initials,
    avatar_grad: c.avatarGrad,
    status: c.status || 'active',
    period: c.period,
    featured: c.featured || false,
    connected: c.connected || {},
    info: c.info || {},
    alert: c.alert || null,
    last_edited: new Date(Date.now() - (i + 1) * 7200000).toISOString(),
    created_at: new Date(Date.now() - (i + 1) * 7200000).toISOString(),
  }));
  await _APP_SUPA.from('clients').insert(rows);
}

// ─── Viewer role helpers ──────────────────────────────────────────
const _VIEWER_ROLE = sessionStorage.getItem('avo_role') === 'viewer';
const _VIEWER_CLIENTS = (() => {
  try { return JSON.parse(sessionStorage.getItem('avo_clients') || '[]'); } catch { return []; }
})();
async function _homeHashPw(pw) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pw));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ─── shared micro styles ───────────────────────────────────────────
const HS = {
  display: 'var(--font-display)',
  body: 'var(--font-body)',
  mono: 'var(--font-mono)'
};

// ─── Session user ─────────────────────────────────────────────────
const _USER_MAP = {
  'optimize@avonetiq.com':      { name: 'Avonetiq Owner', first: 'Owner',  initials: 'AO', grad: 'linear-gradient(135deg,#00C2B8,#7000FF)' },
  'riyadh@avonetiq.id':         { name: 'Riyadh Nasrin',  first: 'Riyadh', initials: 'RN', grad: 'linear-gradient(135deg,#4285F4,#00C2B8)' },
  'riyadhnasrin96@gmail.com':   { name: 'Riyadh Nasrin',  first: 'Riyadh', initials: 'RN', grad: 'linear-gradient(135deg,#7000FF,#4285F4)' },
  'rizki.anindita@avonetiq.id': { name: 'Rizki Anindita', first: 'Rizki',  initials: 'RA', grad: 'linear-gradient(135deg,#00C2B8,#7000FF)' },
};
function _getSessionUser() {
  const email = sessionStorage.getItem('avo_email') || '';
  const role  = sessionStorage.getItem('avo_role')  || 'admin';
  const roleLabel = ({ owner:'Owner', admin:'Admin', editor:'Editor', viewer:'Viewer' })[role] || 'User';
  const u = _USER_MAP[email] || {
    name:     email ? email.split('@')[0].replace(/[._]/g,' ').replace(/\b\w/g,c=>c.toUpperCase()) : 'User',
    first:    email ? email.split('@')[0].split(/[._]/)[0].replace(/\b\w/g,c=>c.toUpperCase()) : 'User',
    initials: email ? email.slice(0,2).toUpperCase() : 'U',
    grad:     'linear-gradient(135deg,#00C2B8,#7000FF)',
  };
  return { ...u, roleLabel };
}
const _hour = new Date().getHours();
const _timeGreeting = _hour < 12 ? 'Good morning' : _hour < 17 ? 'Good afternoon' : _hour < 20 ? 'Good evening' : 'Good night';

// ─── Supabase configs (3 projects) ───────────────────────────────
const _SUPA = {
  google: {
    url: 'https://qmzgincouzpbyfxfddxt.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtemdpbmNvdXpwYnlmeGZkZHh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNTg3NTAsImV4cCI6MjA5MTYzNDc1MH0.cm0NcefIhlvim2dWSJOcTpVyajiYrqsX2uy-35PqMuY',
  },
  gsc: {
    url: 'https://dmnnscedufbsphvrrors.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtbm5zY2VkdWZic3BodnJyb3JzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2OTg5NTEsImV4cCI6MjA5MjI3NDk1MX0.CDkwYfwi6h8DqNOZL8d9MPoBYUJmc77tOrubobM4vrg',
  },
  ga4: {
    url: 'https://dpthobkylyuajaleykyf.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwdGhvYmt5bHl1YWphbGV5a3lmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4MzkxMDYsImV4cCI6MjA5MjQxNTEwNn0.eGomVe5yQDecapanuMG08LdXRrw0Z5vkZdJyVgEQlE8',
  },
  meta: {
    url: 'https://swklfolveiilajdmuenu.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3a2xmb2x2ZWlpbGFqZG11ZW51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NDEwMDAsImV4cCI6MjA5MzAxNzAwMH0.ZuxBQkHGwpY82XwA0NQzjqnvCeJH0WUIcp0Bux2K-84',
  },
};

async function _supaFetch(project, table, select, extra = '') {
  const { url, key } = _SUPA[project];
  try {
    const res = await fetch(
      `${url}/rest/v1/${table}?select=${encodeURIComponent(select)}${extra}&limit=1000`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } }
    );
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

// Source → { project, table, nameCol, sub } — null means not configured yet
const _SRC_TABLE = {
  google: { project: 'google', table: 'google_ads',     nameCol: 'account_name',  sub: 'Google Ads account'          },
  meta:   { project: 'meta', table: 'meta_ads_insights', nameCol: 'account_name', sub: 'Meta Ads account' },
  ga4:    { project: 'ga4',    table: 'ga4_sessions',   nameCol: 'property_name', sub: 'Google Analytics 4 property' },
  search: { project: 'gsc',    table: 'search_console', nameCol: 'property',      sub: 'Search Console property'     },
};

// Cursor-based scan: each call jumps past the last-seen value, so it finds
// every distinct name regardless of how many data rows each account has.
async function _fetchAccounts(srcId) {
  const cfg = _SRC_TABLE[srcId];
  if (!cfg) return null;

  const results = [];
  let cursor = null;
  const MAX_ACCOUNTS = 200;

  while (results.length < MAX_ACCOUNTS) {
    const filter = cursor
      ? `&order=${cfg.nameCol}&${cfg.nameCol}=gt.${encodeURIComponent(cursor)}`
      : `&order=${cfg.nameCol}`;

    const rows = await _supaFetch(cfg.project, cfg.table, cfg.nameCol, filter);
    if (!rows || rows.length === 0) break;

    const name = rows[0][cfg.nameCol];
    if (!name) break;

    results.push({ id: name, name, sub: cfg.sub });
    cursor = name;
  }

  return results;
}

window._fetchAccounts = _fetchAccounts;

window._saveClientConnected = async function(clientId, newConnected) {
  if (!_APP_SUPA) return { error: null };
  const { error } = await _APP_SUPA.from('clients').update({
    connected: newConnected,
    last_edited: new Date().toISOString()
  }).eq('id', clientId);
  return { error };
};

// ─── New Report Modal ─────────────────────────────────────────────
const NewReportModal = ({ onClose, onCreate }) => {
  const [step, setStep] = React.useState(1);
  const [clientName, setClientName] = React.useState('');
  const [logo, setLogo] = React.useState(null);
  const [logoHover, setLogoHover] = React.useState(false);
  const [connected, setConnected] = React.useState({});   // { srcId: { id, name, sub } }
  const [expanded, setExpanded] = React.useState(null);   // srcId currently showing picker
  const [loadingSrc, setLoadingSrc] = React.useState(null);
  const [accounts, setAccounts] = React.useState({});     // { srcId: [] | null }
  const [acctSearch, setAcctSearch] = React.useState('');
  const [psUrl, setPsUrl] = React.useState('');
  const fileRef = React.useRef(null);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setLogo(ev.target.result);
    reader.readAsDataURL(file);
  };

  const NRM_SOURCES = [
    { id: 'google',    label: 'Google Ads',             desc: 'Search, Display & Video campaigns',       color: '#4285F4',
      icon: <g key="g"><path fill="#4285F4" d="M21.6 12.23c0-.78-.07-1.53-.2-2.25H12v4.26h5.38a4.6 4.6 0 01-2 3.02v2.51h3.24c1.9-1.75 2.99-4.33 2.99-7.54z"/><path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.43l-3.24-2.51c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H3.07v2.59A10 10 0 0012 22z"/><path fill="#FBBC04" d="M6.41 13.9a6 6 0 010-3.8V7.51H3.07a10 10 0 000 8.98l3.34-2.6z"/><path fill="#EA4335" d="M12 5.98c1.47 0 2.78.5 3.82 1.5l2.86-2.87A10 10 0 003.07 7.51l3.34 2.6C7.2 7.74 9.4 5.98 12 5.98z"/></g> },
    { id: 'meta',      label: 'Meta Ads',               desc: 'Facebook & Instagram advertising',         color: '#0866FF',
      icon: <path key="m" fill="#0866FF" d="M12 2a10 10 0 00-1.56 19.88v-7H8v-3h2.44V9.75c0-2.42 1.44-3.75 3.65-3.75 1.06 0 2.16.19 2.16.19v2.38h-1.22c-1.2 0-1.57.75-1.57 1.51V12h2.67l-.43 3h-2.24v7A10 10 0 0012 2z"/> },
    { id: 'search',    label: 'Google Search Console',  desc: 'Organic search performance & indexing',    color: '#00C2B8',
      icon: <g key="s"><circle cx="10" cy="10" r="6" fill="none" stroke="#00C2B8" strokeWidth="2.2"/><path stroke="#00C2B8" strokeWidth="2.2" strokeLinecap="round" d="M15 15l5 5"/></g> },
    { id: 'ga4',       label: 'Google Analytics 4',     desc: 'Web & app traffic, conversions, events',   color: '#F9AB00',
      icon: <g key="ga"><path fill="#F9AB00" d="M17 3a2 2 0 012 2v14a2 2 0 01-4 0V5a2 2 0 012-2z"/><circle cx="5" cy="19" r="2" fill="#E37400"/><path fill="#E37400" d="M11 11a2 2 0 012 2v6a2 2 0 01-4 0v-6a2 2 0 012-2z"/></g> },
    { id: 'pagespeed', label: 'PageSpeed Insights',     desc: 'Core Web Vitals & site performance',       color: '#7000FF', needsUrl: true,
      icon: <g key="ps"><path fill="#7000FF" d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16z"/><path fill="#7000FF" d="M12 6l3 6h-2v4h-2v-4H9z"/></g> },
  ];

  const connectedCount = Object.keys(connected).filter(k => connected[k]).length;
  const canCreate = clientName.trim().length > 0;

  const handleConnectClick = (srcId) => {
    if (expanded === srcId) { setExpanded(null); setAcctSearch(''); return; }
    setExpanded(srcId);
    if (accounts[srcId] !== undefined) return; // already fetched
    setLoadingSrc(srcId);
    _fetchAccounts(srcId).then(rows => {
      setAccounts(a => ({ ...a, [srcId]: rows }));
      setLoadingSrc(null);
    });
  };

  const selectAccount = (srcId, acc) => {
    setConnected(c => ({ ...c, [srcId]: acc }));
    setExpanded(null);
  };

  const connectPageSpeed = () => {
    if (!psUrl.trim()) return;
    setConnected(c => ({ ...c, pagespeed: { id: 'ps', name: psUrl.trim(), sub: 'PageSpeed URL' } }));
    setExpanded(null);
    setPsUrl('');
  };

  const disconnect = (srcId, e) => {
    e.stopPropagation();
    setConnected(c => { const n = { ...c }; delete n[srcId]; return n; });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,.92)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
    onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ width: '100%', maxWidth: 700, background: 'rgba(14,24,42,.99)', border: '1px solid var(--navy-edge)', borderRadius: 20, boxShadow: '0 60px 140px rgba(0,0,0,.8), 0 0 0 1px rgba(0,194,184,.2)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '32px 40px', background: 'linear-gradient(135deg,rgba(0,194,184,.08),rgba(112,0,255,.04))', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: HS.display, fontSize: 24, fontWeight: 800, color: '#FCFCFC', letterSpacing: '-.02em', marginBottom: 6 }}>Create New Report</div>
            <div style={{ fontFamily: HS.body, fontSize: 15, color: 'var(--text-muted)' }}>
              {step === 1 ? 'Enter client information to get started' : 'Connect data sources for this client'}
            </div>
          </div>
          <button onClick={(e) => { e.stopPropagation(); onClose(); }} style={{ width: 36, height: 36, border: 'none', background: 'rgba(0,194,184,.1)', borderRadius: 10, color: '#00C2B8', cursor: 'pointer', fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .15s' }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,194,184,.15)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,194,184,.1)'}>×</button>
        </div>

        {/* Body */}
        <div style={{ padding: '32px 40px', overflow: 'auto', maxHeight: 'calc(100vh - 220px)' }}>

          {step === 1 ? (
            <>
              {/* Client Name */}
              <div style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                  <label style={{ fontFamily: HS.display, fontSize: 15, fontWeight: 700, color: '#FCFCFC' }}>Client Name</label>
                  <span style={{ fontFamily: HS.mono, fontSize: 11, color: '#DC2626', fontWeight: 700 }}>Required</span>
                </div>
                <input
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. PT Kopi Senja Nusantara"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '14px 16px', background: 'var(--navy-elevated)', border: `1.5px solid ${clientName ? 'rgba(0,194,184,.5)' : 'var(--navy-edge)'}`, borderRadius: 12, color: '#FCFCFC', fontFamily: HS.body, fontSize: 16, outline: 'none', transition: 'border-color .15s', boxShadow: clientName ? '0 0 0 3px rgba(0,194,184,.1)' : 'none' }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(0,194,184,.5)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,194,184,.1)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = clientName ? 'rgba(0,194,184,.5)' : 'var(--navy-edge)'; e.currentTarget.style.boxShadow = clientName ? '0 0 0 3px rgba(0,194,184,.1)' : 'none'; }}
                />
              </div>

              {/* Client Logo — Optional */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                  <label style={{ fontFamily: HS.display, fontSize: 15, fontWeight: 700, color: '#FCFCFC' }}>Client Logo</label>
                  <span style={{ fontFamily: HS.mono, fontSize: 11, color: 'var(--text-muted)' }}>Optional</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  {/* Preview avatar */}
                  <div style={{ width: 56, height: 56, borderRadius: 12, background: _nameGrad(clientName), display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: HS.display, fontWeight: 800, fontSize: 18, color: '#0C182C', flexShrink: 0, overflow: 'hidden' }}>
                    {logo
                      ? <img src={logo} style={{ width: 56, height: 56, objectFit: 'contain' }} />
                      : (clientName ? clientName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?')}
                  </div>
                  {/* Drop zone */}
                  <div
                    onClick={() => fileRef.current && fileRef.current.click()}
                    onMouseEnter={() => setLogoHover(true)}
                    onMouseLeave={() => setLogoHover(false)}
                    style={{ flex: 1, border: `1.5px dashed ${logoHover ? 'rgba(0,194,184,.5)' : 'var(--navy-edge)'}`, borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', background: 'var(--navy-deep)', transition: 'border-color .15s' }}>
                    <div style={{ width: 36, height: 36, background: 'rgba(0,194,184,.1)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="16" height="16" fill="none" stroke="#00C2B8" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>
                    </div>
                    <div>
                      <div style={{ fontFamily: HS.display, fontSize: 15, fontWeight: 600, color: '#FCFCFC' }}>{logo ? 'Replace logo' : 'Upload logo'}</div>
                      <div style={{ fontFamily: HS.body, fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>PNG, SVG, JPG · max 2 MB</div>
                    </div>
                    {logo && <button onClick={(e) => { e.stopPropagation(); setLogo(null); }} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 20, padding: 0, lineHeight: 1 }}>×</button>}
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Step 2: Data Sources */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontFamily: HS.display, fontSize: 15, fontWeight: 700, color: '#FCFCFC', marginBottom: 5 }}>Connect Data Sources</div>
                <div style={{ fontFamily: HS.body, fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.6 }}>Select the platforms to connect. You can add or change sources anytime later.</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {NRM_SOURCES.map(src => {
                  const isConnected = !!connected[src.id];
                  const isExpanded  = expanded === src.id;
                  const isLoading   = loadingSrc === src.id;
                  return (
                    <div key={src.id} style={{ background: isConnected ? 'rgba(0,194,184,.05)' : 'var(--navy-surface)', border: `1px solid ${isConnected ? 'rgba(0,194,184,.3)' : 'var(--navy-edge)'}`, borderRadius: 12, overflow: 'hidden', opacity: src.disabled ? .45 : 1, transition: 'border-color .2s, background .2s' }}>

                      {/* Source row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px' }}>
                        <div style={{ width: 42, height: 42, background: 'var(--navy-elevated)', border: '1px solid var(--navy-edge)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <svg width="22" height="22" viewBox="0 0 24 24">{src.icon}</svg>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: HS.display, fontSize: 16, fontWeight: 700, color: '#FCFCFC' }}>{src.label}</div>
                          {isConnected ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
                              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#16A34A', flexShrink: 0 }} />
                              <span style={{ fontFamily: HS.mono, fontSize: 11.5, color: '#16A34A', letterSpacing: '.06em' }}>CONNECTED</span>
                              <span style={{ fontFamily: HS.mono, fontSize: 11.5, color: 'var(--text-muted)' }}>· {connected[src.id].name}</span>
                            </div>
                          ) : (
                            <div style={{ fontFamily: HS.body, fontSize: 13.5, color: 'var(--text-muted)', marginTop: 2 }}>{src.desc}</div>
                          )}
                        </div>
                        {src.disabled ? (
                          <span style={{ fontFamily: HS.mono, fontSize: 11, color: 'var(--text-muted)', background: 'var(--navy-elevated)', border: '1px solid var(--navy-edge)', borderRadius: 5, padding: '3px 8px', letterSpacing: '.08em' }}>SOON</span>
                        ) : isConnected ? (
                          <button onClick={(e) => disconnect(src.id, e)}
                          style={{ padding: '7px 0', width: 120, borderRadius: 8, border: '1px solid rgba(220,38,38,.4)', background: 'rgba(220,38,38,.1)', color: '#DC2626', fontFamily: HS.display, fontSize: 14, fontWeight: 700, cursor: 'pointer', flexShrink: 0, textAlign: 'center' }}>
                            Disconnect
                          </button>
                        ) : (
                          <button onClick={() => handleConnectClick(src.id)}
                          style={{ padding: '7px 0', width: 120, borderRadius: 8, border: '1px solid rgba(0,194,184,.5)', background: 'rgba(0,194,184,.08)', color: '#00C2B8', fontFamily: HS.display, fontSize: 14, fontWeight: 700, cursor: 'pointer', flexShrink: 0, textAlign: 'center', transition: 'all .15s' }}>
                            Connect
                          </button>
                        )}
                      </div>

                      {/* Expanded picker */}
                      {isExpanded && (
                        <div style={{ borderTop: '1px solid rgba(0,194,184,.16)', background: 'rgba(5,10,22,.55)', padding: '14px 16px' }}>
                          {isLoading ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontFamily: HS.body, fontSize: 14 }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" /></svg>
                              Loading accounts…
                            </div>
                          ) : src.needsUrl ? (
                            /* PageSpeed: URL input */
                            <div>
                              <div style={{ fontFamily: HS.mono, fontSize: 11.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 8 }}>Website URL</div>
                              <div style={{ display: 'flex', gap: 8 }}>
                                <input
                                  value={psUrl}
                                  onChange={(e) => setPsUrl(e.target.value)}
                                  onKeyDown={(e) => e.key === 'Enter' && connectPageSpeed()}
                                  placeholder="https://example.com"
                                  autoFocus
                                  style={{ flex: 1, padding: '9px 12px', background: 'var(--navy-elevated)', border: '1.5px solid rgba(112,0,255,.4)', borderRadius: 8, color: '#FCFCFC', fontFamily: HS.mono, fontSize: 15, outline: 'none', boxShadow: '0 0 0 3px rgba(112,0,255,.08)' }}
                                />
                                <button onClick={connectPageSpeed} style={{ padding: '9px 18px', background: 'linear-gradient(135deg,#7000FF,#5500CC)', border: 'none', borderRadius: 8, color: '#fff', fontFamily: HS.display, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Add</button>
                              </div>
                            </div>
                          ) : accounts[src.id] === null ? (
                            /* No Supabase table configured yet */
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                              <svg width="14" height="14" fill="none" stroke="#F8B400" strokeWidth="1.8" viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: 1 }}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" /></svg>
                              <div style={{ fontFamily: HS.body, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                No {src.label} accounts registered in Supabase.<br />
                                <span style={{ fontFamily: HS.mono, fontSize: 12, color: 'var(--text-muted)' }}>Add data to the <b style={{ color: '#FCFCFC' }}>{src.id === 'meta' ? 'meta_ads' : 'search_console'}</b> table to start connecting accounts.</span>
                              </div>
                            </div>
                          ) : (
                            /* Account list from Supabase — with search */
                            (() => {
                              const allAccts = accounts[src.id] || [];
                              const q = acctSearch.toLowerCase();
                              const filtered = q ? allAccts.filter(a => a.name.toLowerCase().includes(q)) : allAccts;
                              return (
                                <div>
                                  {/* Search bar — only shown when ≥ 4 accounts */}
                                  {allAccts.length >= 4 && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: 'var(--navy-elevated)', border: '1px solid var(--navy-edge)', borderRadius: 7, marginBottom: 10 }}>
                                      <svg width="12" height="12" fill="none" stroke="var(--text-muted)" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                                      <input
                                        value={acctSearch}
                                        onChange={e => setAcctSearch(e.target.value)}
                                        placeholder={`Search ${src.label} accounts…`}
                                        autoFocus
                                        style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#FCFCFC', fontFamily: HS.body, fontSize: 14 }}
                                      />
                                      {acctSearch && <button onClick={() => setAcctSearch('')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16, padding: 0, lineHeight: 1 }}>×</button>}
                                    </div>
                                  )}
                                  <div style={{ fontFamily: HS.mono, fontSize: 11.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 8 }}>
                                    {allAccts.length === 0 ? 'No accounts found' : `Select account${allAccts.length > 1 ? ` · ${filtered.length}${q ? `/${allAccts.length}` : ''}` : ''}`}
                                  </div>
                                  {allAccts.length === 0 ? (
                                    <div style={{ fontFamily: HS.body, fontSize: 14, color: 'var(--text-muted)', fontStyle: 'italic' }}>No accounts in database.</div>
                                  ) : filtered.length === 0 ? (
                                    <div style={{ fontFamily: HS.body, fontSize: 14, color: 'var(--text-muted)', fontStyle: 'italic' }}>No match for "{acctSearch}".</div>
                                  ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 220, overflowY: 'auto' }}>
                                      {filtered.map(acc => (
                                        <div key={acc.id} onClick={() => { selectAccount(src.id, acc); setAcctSearch(''); }}
                                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--navy-elevated)', border: '1px solid var(--navy-edge)', borderRadius: 8, cursor: 'pointer', transition: 'border-color .12s, background .12s', flexShrink: 0 }}
                                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(0,194,184,.4)'; e.currentTarget.style.background = 'rgba(0,194,184,.06)'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--navy-edge)'; e.currentTarget.style.background = 'var(--navy-elevated)'; }}>
                                          <div style={{ minWidth: 0 }}>
                                            <div style={{ fontFamily: HS.display, fontSize: 15, fontWeight: 600, color: '#FCFCFC', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{acc.name}</div>
                                            {acc.sub && <div style={{ fontFamily: HS.mono, fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{acc.sub}</div>}
                                          </div>
                                          <svg width="14" height="14" fill="none" stroke="var(--text-muted)" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0, marginLeft: 8 }}><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })()
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Connected summary */}
              {connectedCount > 0 && (
                <div style={{ marginTop: 14, padding: '12px 16px', background: 'rgba(0,194,184,.06)', border: '1px solid rgba(0,194,184,.2)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width="14" height="14" fill="none" stroke="#00C2B8" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" /></svg>
                  <span style={{ fontFamily: HS.display, fontSize: 14, fontWeight: 700, color: '#00C2B8' }}>{connectedCount} source{connectedCount !== 1 ? 's' : ''} connected</span>
                </div>
              )}
            </>
          )}

        </div>

        {/* Footer */}
        <div style={{ padding: '20px 40px', display: 'flex', gap: 12, background: 'rgba(10,18,34,.6)' }}>
          <button
            onClick={() => step === 2 ? setStep(1) : onClose()}
            style={{ flex: 1, padding: '12px 0', background: 'var(--navy-elevated)', border: '1px solid var(--navy-edge)', borderRadius: 10, color: 'var(--text-secondary)', fontFamily: HS.display, fontSize: 15, fontWeight: 600, cursor: 'pointer', transition: 'all .15s' }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(148,163,184,.3)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--navy-edge)'}>
            {step === 2 ? 'Back' : 'Cancel'}
          </button>
          {step === 1 ? (
            <button onClick={() => canCreate && setStep(2)}
            style={{ flex: 2, padding: '12px 0', background: canCreate ? 'linear-gradient(135deg,#00C2B8,#009E96)' : 'rgba(0,194,184,.2)', border: 'none', borderRadius: 10, color: canCreate ? '#0C182C' : 'rgba(0,194,184,.4)', fontFamily: HS.display, fontSize: 15, fontWeight: 700, cursor: canCreate ? 'pointer' : 'not-allowed', boxShadow: canCreate ? '0 4px 14px rgba(0,194,184,.25)' : 'none', transition: 'all .15s' }}>
              Continue to Data Sources
            </button>
          ) : (
            <button onClick={() => { onCreate({ clientName, logo, sources: connected }); onClose(); }}
            style={{ flex: 2, padding: '12px 0', background: 'linear-gradient(135deg,#00C2B8,#009E96)', border: 'none', borderRadius: 10, color: '#0C182C', fontFamily: HS.display, fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(0,194,184,.25)', transition: 'all .15s' }}>
              Create Report
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Edit Modal ────────────────────────────────────────────────────
const EditModal = ({ client, onSave, onClose }) => {
  const [form, setForm] = React.useState({
    name: client.name,
    industry: client.industry,
    period: client.period,
    pic: client.info.pic,
    email: client.info.email,
    website: client.info.website,
    notes: client.info.notes
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const Field = ({ label, k, placeholder, mono, textarea }) =>
  <div style={{ marginBottom: 14 }}>
      <div style={{ fontFamily: HS.mono, fontSize: 11.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 6 }}>{label}</div>
      {textarea ?
    <textarea value={form[k]} onChange={(e) => set(k, e.target.value)} rows={3} placeholder={placeholder}
    style={{ width: '100%', boxSizing: 'border-box', padding: '9px 11px', background: 'var(--navy-elevated)', border: '1px solid var(--navy-edge)', borderRadius: 7, color: '#FCFCFC', fontFamily: HS.body, fontSize: 15, outline: 'none', resize: 'vertical', lineHeight: 1.5 }} /> :
    <input value={form[k]} onChange={(e) => set(k, e.target.value)} placeholder={placeholder}
    style={{ width: '100%', boxSizing: 'border-box', padding: '9px 11px', background: 'var(--navy-elevated)', border: '1px solid var(--navy-edge)', borderRadius: 7, color: '#FCFCFC', fontFamily: mono ? HS.mono : HS.body, fontSize: mono ? 11.5 : 12.5, outline: 'none' }} />
    }
    </div>;


  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(5,10,22,.7)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ width: 520, background: 'rgba(14,24,42,.98)', border: '1px solid var(--navy-edge)', borderRadius: 16, boxShadow: '0 40px 100px rgba(0,0,0,.6), 0 0 0 1px rgba(0,194,184,.1)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--navy-edge)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: HS.display, fontSize: 16, fontWeight: 700, color: '#FCFCFC', letterSpacing: '-.01em' }}>Edit client</div>
            <div style={{ fontFamily: HS.body, fontSize: 13.5, color: 'var(--text-muted)', marginTop: 2 }}>Update logo, name, and client information</div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, border: 'none', background: 'var(--navy-elevated)', borderRadius: 7, color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', overflow: 'auto', maxHeight: '65vh' }}>

          {/* Logo upload */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: HS.mono, fontSize: 11.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 8 }}>Client logo</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 56, height: 56, borderRadius: 12, background: client.avatarGrad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: HS.display, fontWeight: 800, fontSize: 18, color: '#0C182C', flexShrink: 0 }}>
                {client.initials}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ border: '1.5px dashed var(--navy-edge)', borderRadius: 9, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', background: 'var(--navy-deep)', transition: 'border-color .15s' }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(0,194,184,.5)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--navy-edge)'}>
                  <div style={{ width: 32, height: 32, background: 'rgba(0,194,184,.1)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="15" height="15" fill="none" stroke="#00C2B8" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>
                  </div>
                  <div>
                    <div style={{ fontFamily: HS.display, fontSize: 15, fontWeight: 600, color: '#FCFCFC' }}>Upload logo</div>
                    <div style={{ fontFamily: HS.body, fontSize: 12.5, color: 'var(--text-muted)', marginTop: 1 }}>PNG, SVG, JPG · max 2 MB</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ height: 1, background: 'var(--navy-edge)', margin: '0 0 18px' }} />

          {/* Form fields */}
          <Field label="Client name" k="name" placeholder="e.g. PT Kopi Senja Nusantara" />
          <Field label="Industry / category" k="industry" placeholder="e.g. F&B · Specialty Coffee" />
          <Field label="Report period" k="period" placeholder="e.g. Apr 2026" />

          <div style={{ height: 1, background: 'var(--navy-edge)', margin: '4px 0 18px' }} />

          <Field label="PIC / contact name" k="pic" placeholder="Person in charge" />
          <Field label="Email" k="email" placeholder="contact@client.com" mono />
          <Field label="Website" k="website" placeholder="client.com" mono />
          <Field label="Notes" k="notes" placeholder="Internal notes, context, reminders…" textarea />
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--navy-edge)', display: 'flex', gap: 8, background: 'rgba(10,18,34,.5)' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '9px 0', background: 'var(--navy-elevated)', border: '1px solid var(--navy-edge)', borderRadius: 8, color: 'var(--text-secondary)', fontFamily: HS.display, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          <button onClick={() => {onSave(form);onClose();}} style={{ flex: 2, padding: '9px 0', background: 'linear-gradient(135deg,#00C2B8,#009E96)', border: 'none', borderRadius: 8, color: '#0C182C', fontFamily: HS.display, fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(0,194,184,.25)' }}>Save changes</button>
        </div>
      </div>
    </div>);

};

// ─── Configure Panel ───────────────────────────────────────────────
const SOURCES_DEF = [
{ id: 'google', label: 'Google Ads', desc: 'Search, Display & Video campaigns', color: '#4285F4', icon: <g key="g"><path fill="#4285F4" d="M21.6 12.23c0-.78-.07-1.53-.2-2.25H12v4.26h5.38a4.6 4.6 0 01-2 3.02v2.51h3.24c1.9-1.75 2.99-4.33 2.99-7.54z" /><path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.43l-3.24-2.51c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H3.07v2.59A10 10 0 0012 22z" /><path fill="#FBBC04" d="M6.41 13.9a6 6 0 010-3.8V7.51H3.07a10 10 0 000 8.98l3.34-2.6z" /><path fill="#EA4335" d="M12 5.98c1.47 0 2.78.5 3.82 1.5l2.86-2.87A10 10 0 003.07 7.51l3.34 2.6C7.2 7.74 9.4 5.98 12 5.98z" /></g> },
{ id: 'meta', label: 'Meta Ads', desc: 'Facebook & Instagram advertising', color: '#0866FF', icon: <path key="m" fill="#0866FF" d="M12 2a10 10 0 00-1.56 19.88v-7H8v-3h2.44V9.75c0-2.42 1.44-3.75 3.65-3.75 1.06 0 2.16.19 2.16.19v2.38h-1.22c-1.2 0-1.57.75-1.57 1.51V12h2.67l-.43 3h-2.24v7A10 10 0 0012 2z" /> },
{ id: 'ga4', label: 'Google Analytics 4', desc: 'Web & app traffic, conversions, events', color: '#F9AB00', icon: <g key="ga"><path fill="#F9AB00" d="M17 3a2 2 0 012 2v14a2 2 0 01-4 0V5a2 2 0 012-2z" /><circle cx="5" cy="19" r="2" fill="#E37400" /><path fill="#E37400" d="M11 11a2 2 0 012 2v6a2 2 0 01-4 0v-6a2 2 0 012-2z" /></g> },
{ id: 'search', label: 'Google Search Console', desc: 'Organic search performance & indexing', color: '#00C2B8', icon: <g key="s"><circle cx="10" cy="10" r="6" fill="none" stroke="#00C2B8" strokeWidth="2.2" /><path stroke="#00C2B8" strokeWidth="2.2" strokeLinecap="round" d="M15 15l5 5" /></g> },
{ id: 'pagespeed', label: 'PageSpeed Insights', desc: 'Core Web Vitals & site performance', color: '#7000FF', needsUrl: true, icon: <g key="ps"><path fill="#7000FF" d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16z"/><path fill="#7000FF" d="M12 6l3 6h-2v4h-2v-4H9z"/></g> }];


const ConfigurePanel = ({ client, onClose, onSave, onOpenReport }) => {
  const [connected, setConnected] = React.useState({ ...client.connected });
  const [expanded, setExpanded] = React.useState(null);
  const [loadingSrc, setLoadingSrc] = React.useState(null);
  const [accounts, setAccounts] = React.useState({});
  const [acctSearch, setAcctSearch] = React.useState('');
  const [psUrl, setPsUrl] = React.useState('');

  const handleConnectClick = (srcId) => {
    if (expanded === srcId) { setExpanded(null); setAcctSearch(''); return; }
    setExpanded(srcId);
    if (accounts[srcId] !== undefined) return;
    setLoadingSrc(srcId);
    _fetchAccounts(srcId).then(rows => {
      setAccounts(a => ({ ...a, [srcId]: rows }));
      setLoadingSrc(null);
    });
  };

  const selectAccount = (srcId, acc) => {
    setConnected(c => ({ ...c, [srcId]: acc }));
    setExpanded(null);
    setAcctSearch('');
  };

  const connectPageSpeed = () => {
    if (!psUrl.trim()) return;
    setConnected(c => ({ ...c, pagespeed: { id: 'ps', name: psUrl.trim(), sub: 'PageSpeed URL' } }));
    setExpanded(null);
    setPsUrl('');
  };

  const disconnect = (srcId) => {
    setConnected(c => { const n = { ...c }; delete n[srcId]; return n; });
  };

  const handleDone = () => {
    onSave && onSave(connected);
    onClose();
  };

  const handleDoneAndOpen = () => {
    onSave && onSave(connected);
    onClose();
    onOpenReport && onOpenReport(client.id);
  };

  const hasConnected = Object.values(connected).some(v => !!v);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(5,10,22,.7)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ width: 560, maxHeight: '90vh', background: 'rgba(14,24,42,.98)', border: '1px solid var(--navy-edge)', borderRadius: 16, boxShadow: '0 40px 100px rgba(0,0,0,.6), 0 0 0 1px rgba(0,194,184,.1)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--navy-edge)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: client.avatarGrad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: HS.display, fontWeight: 800, fontSize: 16, color: '#0C182C' }}>{client.initials}</div>
            <div>
              <div style={{ fontFamily: HS.display, fontSize: 15, fontWeight: 700, color: '#FCFCFC', letterSpacing: '-.01em' }}>Configure · {client.name}</div>
              <div style={{ fontFamily: HS.body, fontSize: 13.5, color: 'var(--text-muted)', marginTop: 2 }}>Connect or manage data sources for this client</div>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, border: 'none', background: 'var(--navy-elevated)', borderRadius: 7, color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>

        {/* Sources — scrollable */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          <div style={{ fontFamily: HS.mono, fontSize: 11.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 14 }}>Data sources</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {SOURCES_DEF.map((src) => {
              const isOn = connected[src.id];
              const isExpanded = expanded === src.id;
              const isLoading = loadingSrc === src.id;
              return (
                <div key={src.id} style={{
                  background: isOn ? 'rgba(0,194,184,.05)' : 'var(--navy-surface)',
                  border: `1px solid ${isOn ? 'rgba(0,194,184,.3)' : 'var(--navy-edge)'}`,
                  borderRadius: 11, overflow: 'hidden', transition: 'border-color .2s, background .2s'
                }}>
                  {/* Source row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px' }}>
                    {/* Icon */}
                    <div style={{ width: 40, height: 40, background: 'var(--navy-elevated)', border: '1px solid var(--navy-edge)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="22" height="22" viewBox="0 0 24 24">{src.icon}</svg>
                    </div>
                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: HS.display, fontSize: 16, fontWeight: 700, color: '#FCFCFC' }}>{src.label}</div>
                      {isOn ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
                          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#16A34A', flexShrink: 0 }} />
                          <span style={{ fontFamily: HS.mono, fontSize: 11.5, color: '#16A34A', letterSpacing: '.06em' }}>CONNECTED</span>
                          {typeof isOn === 'object' && isOn.name && (
                            <span style={{ fontFamily: HS.mono, fontSize: 11.5, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>· {isOn.name}</span>
                          )}
                        </div>
                      ) : (
                        <div style={{ fontFamily: HS.body, fontSize: 13.5, color: 'var(--text-muted)', marginTop: 2 }}>{src.desc}</div>
                      )}
                    </div>
                    {/* Action button */}
                    {isOn ? (
                      <button onClick={() => disconnect(src.id)}
                      style={{ padding: '7px 0', width: 120, borderRadius: 8, border: '1px solid rgba(220,38,38,.4)', background: 'rgba(220,38,38,.1)', color: '#DC2626', fontFamily: HS.display, fontSize: 14, fontWeight: 700, cursor: 'pointer', flexShrink: 0, textAlign: 'center' }}>
                        Disconnect
                      </button>
                    ) : (
                      <button onClick={() => handleConnectClick(src.id)}
                      style={{ padding: '7px 0', width: 120, borderRadius: 8, border: `1px solid ${isExpanded ? 'rgba(0,194,184,.6)' : 'rgba(0,194,184,.55)'}`, background: isExpanded ? 'rgba(0,194,184,.15)' : 'rgba(0,194,184,.12)', color: '#00C2B8', fontFamily: HS.display, fontSize: 14, fontWeight: 700, cursor: 'pointer', flexShrink: 0, textAlign: 'center', transition: 'all .15s' }}>
                        {isExpanded ? 'Cancel' : 'Connect'}
                      </button>
                    )}
                  </div>

                  {/* Expanded account picker */}
                  {isExpanded && (
                    <div style={{ borderTop: '1px solid rgba(0,194,184,.16)', background: 'rgba(5,10,22,.55)', padding: '14px 16px' }}>
                      {isLoading ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontFamily: HS.body, fontSize: 14 }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" /></svg>
                          Loading accounts…
                        </div>
                      ) : src.needsUrl ? (
                        <div>
                          <div style={{ fontFamily: HS.mono, fontSize: 11.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 8 }}>Website URL</div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <input
                              value={psUrl}
                              onChange={(e) => setPsUrl(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && connectPageSpeed()}
                              placeholder="https://example.com"
                              autoFocus
                              style={{ flex: 1, padding: '9px 12px', background: 'var(--navy-elevated)', border: '1.5px solid rgba(112,0,255,.4)', borderRadius: 8, color: '#FCFCFC', fontFamily: HS.mono, fontSize: 15, outline: 'none', boxShadow: '0 0 0 3px rgba(112,0,255,.08)' }}
                            />
                            <button onClick={connectPageSpeed} style={{ padding: '9px 18px', background: 'linear-gradient(135deg,#7000FF,#5500CC)', border: 'none', borderRadius: 8, color: '#fff', fontFamily: HS.display, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Add</button>
                          </div>
                        </div>
                      ) : accounts[src.id] === null ? (
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                          <svg width="14" height="14" fill="none" stroke="#F8B400" strokeWidth="1.8" viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: 1 }}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" /></svg>
                          <div style={{ fontFamily: HS.body, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            No {src.label} accounts registered in Supabase.<br/>
                            <span style={{ fontFamily: HS.mono, fontSize: 12, color: 'var(--text-muted)' }}>Add data to the table to start connecting accounts.</span>
                          </div>
                        </div>
                      ) : (
                        (() => {
                          const allAccts = accounts[src.id] || [];
                          const q = acctSearch.toLowerCase();
                          const filtered = q ? allAccts.filter(a => a.name.toLowerCase().includes(q)) : allAccts;
                          return (
                            <div>
                              {allAccts.length >= 4 && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: 'var(--navy-elevated)', border: '1px solid var(--navy-edge)', borderRadius: 7, marginBottom: 10 }}>
                                  <svg width="12" height="12" fill="none" stroke="var(--text-muted)" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                                  <input
                                    value={acctSearch}
                                    onChange={e => setAcctSearch(e.target.value)}
                                    placeholder={`Search ${src.label} accounts…`}
                                    autoFocus
                                    style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#FCFCFC', fontFamily: HS.body, fontSize: 14 }}
                                  />
                                  {acctSearch && <button onClick={() => setAcctSearch('')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16, padding: 0, lineHeight: 1 }}>×</button>}
                                </div>
                              )}
                              <div style={{ fontFamily: HS.mono, fontSize: 11.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 8 }}>
                                {allAccts.length === 0 ? 'No accounts found' : `Select account${allAccts.length > 1 ? ` · ${filtered.length}${q ? `/${allAccts.length}` : ''}` : ''}`}
                              </div>
                              {allAccts.length === 0 ? (
                                <div style={{ fontFamily: HS.body, fontSize: 14, color: 'var(--text-muted)', fontStyle: 'italic' }}>No accounts in database.</div>
                              ) : filtered.length === 0 ? (
                                <div style={{ fontFamily: HS.body, fontSize: 14, color: 'var(--text-muted)', fontStyle: 'italic' }}>No match for "{acctSearch}".</div>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto' }}>
                                  {filtered.map(acc => (
                                    <div key={acc.id} onClick={() => selectAccount(src.id, acc)}
                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--navy-elevated)', border: '1px solid var(--navy-edge)', borderRadius: 8, cursor: 'pointer', transition: 'border-color .12s, background .12s' }}
                                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(0,194,184,.4)'; e.currentTarget.style.background = 'rgba(0,194,184,.06)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--navy-edge)'; e.currentTarget.style.background = 'var(--navy-elevated)'; }}>
                                      <div style={{ minWidth: 0 }}>
                                        <div style={{ fontFamily: HS.display, fontSize: 15, fontWeight: 600, color: '#FCFCFC', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{acc.name}</div>
                                        {acc.sub && <div style={{ fontFamily: HS.mono, fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{acc.sub}</div>}
                                      </div>
                                      <svg width="14" height="14" fill="none" stroke="var(--text-muted)" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0, marginLeft: 8 }}><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })()
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--navy-edge)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(10,18,34,.5)', flexShrink: 0, gap: 10 }}>
          <button onClick={handleDone} style={{ padding: '9px 18px', background: 'transparent', border: '1px solid var(--navy-edge)', borderRadius: 8, color: 'var(--text-secondary)', fontFamily: HS.display, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Save</button>
          <button onClick={handleDoneAndOpen} disabled={!hasConnected}
          style={{ padding: '9px 22px', background: hasConnected ? 'linear-gradient(135deg,#00C2B8,#009E96)' : 'rgba(255,255,255,.05)', border: hasConnected ? 'none' : '1px solid rgba(255,255,255,.08)', borderRadius: 8, color: hasConnected ? '#0C182C' : 'var(--text-muted)', fontFamily: HS.display, fontSize: 15, fontWeight: 700, cursor: hasConnected ? 'pointer' : 'not-allowed', boxShadow: hasConnected ? '0 4px 14px rgba(0,194,184,.25)' : 'none', display: 'flex', alignItems: 'center', gap: 7, transition: 'all .15s' }}>
            Save & Open Report
            <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.3" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
        </div>
      </div>
    </div>);

};

// ─── Delete confirm ────────────────────────────────────────────────
const DeleteConfirm = ({ client, onConfirm, onClose }) =>
<div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(5,10,22,.75)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
onClick={(e) => e.target === e.currentTarget && onClose()}>
    <div style={{ width: 400, background: 'rgba(14,24,42,.98)', border: '1px solid rgba(220,38,38,.35)', borderRadius: 14, boxShadow: '0 30px 80px rgba(0,0,0,.5)', padding: 28 }}>
      <div style={{ width: 44, height: 44, background: 'rgba(220,38,38,.12)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <svg width="20" height="20" fill="none" stroke="#DC2626" strokeWidth="1.8" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" /></svg>
      </div>
      <div style={{ fontFamily: HS.display, fontSize: 16, fontWeight: 700, color: '#FCFCFC', marginBottom: 8 }}>Delete client?</div>
      <p style={{ fontFamily: HS.body, fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.55, margin: '0 0 20px' }}>
        <b style={{ color: '#FCFCFC' }}>{client.name}</b> and all its data source configurations will be permanently deleted. This action cannot be undone.
      </p>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onClose} style={{ flex: 1, padding: '9px 0', background: 'var(--navy-elevated)', border: '1px solid var(--navy-edge)', borderRadius: 8, color: 'var(--text-secondary)', fontFamily: HS.display, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
        <button onClick={() => {onConfirm(client.id);onClose();}} style={{ flex: 1, padding: '9px 0', background: 'rgba(220,38,38,.9)', border: 'none', borderRadius: 8, color: '#fff', fontFamily: HS.display, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Yes, delete</button>
      </div>
    </div>
  </div>;



// ─── Quick Edit Modal ─────────────────────────────────────────────
const QuickEditModal = ({ client, onSave, onClose }) => {
  const [name, setName] = React.useState(client.name);
  const [logo, setLogo] = React.useState(client.logo || null);
  const [logoHover, setLogoHover] = React.useState(false);
  const nameRef = React.useRef(null);
  const fileRef = React.useRef(null);
  React.useEffect(() => { nameRef.current && nameRef.current.focus(); }, []);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setLogo(ev.target.result);
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(5,10,22,.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ width: 420, background: 'rgba(14,24,42,.98)', border: '1px solid var(--navy-edge)', borderRadius: 14, boxShadow: '0 32px 80px rgba(0,0,0,.55), 0 0 0 1px rgba(0,194,184,.1)', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid var(--navy-edge)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 9, background: client.avatarGrad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: HS.display, fontWeight: 800, fontSize: 15, color: '#0C182C', flexShrink: 0, overflow: 'hidden' }}>
            {logo ? <img src={logo} style={{ width: 38, height: 38, objectFit: 'contain' }} /> : client.initials}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: HS.display, fontSize: 16, fontWeight: 700, color: '#FCFCFC' }}>Quick edit</div>
            <div style={{ fontFamily: HS.body, fontSize: 13, color: 'var(--text-muted)', marginTop: 1 }}>Update client logo and name</div>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, border: 'none', background: 'var(--navy-elevated)', borderRadius: 6, color: 'var(--text-muted)', cursor: 'pointer', fontSize: 17, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>
        {/* Body */}
        <div style={{ padding: '18px 22px' }}>
          {/* Logo upload */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: HS.mono, fontSize: 11.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 8 }}>Client logo</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: client.avatarGrad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: HS.display, fontWeight: 800, fontSize: 15, color: '#0C182C', flexShrink: 0, overflow: 'hidden' }}>
                {logo ? <img src={logo} style={{ width: 44, height: 44, objectFit: 'contain' }} /> : client.initials}
              </div>
              <div
                onClick={() => fileRef.current && fileRef.current.click()}
                onMouseEnter={() => setLogoHover(true)}
                onMouseLeave={() => setLogoHover(false)}
                style={{ flex: 1, border: `1.5px dashed ${logoHover ? 'rgba(0,194,184,.5)' : 'var(--navy-edge)'}`, borderRadius: 9, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', background: 'var(--navy-deep)', transition: 'border-color .15s', position: 'relative' }}>
                <div style={{ width: 28, height: 28, background: 'rgba(0,194,184,.1)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="13" height="13" fill="none" stroke="#00C2B8" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>
                </div>
                <div>
                  <div style={{ fontFamily: HS.display, fontSize: 14, fontWeight: 600, color: '#FCFCFC' }}>{logo ? 'Replace logo' : 'Upload logo'}</div>
                  <div style={{ fontFamily: HS.body, fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>PNG, SVG, JPG · max 2 MB</div>
                </div>
                {logo && <button onClick={(e) => { e.stopPropagation(); setLogo(null); }} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 0 }}>×</button>}
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
            </div>
          </div>
          <div style={{ height: 1, background: 'var(--navy-edge)', margin: '0 0 14px' }} />
          {/* Name */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: HS.mono, fontSize: 11.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 6 }}>Client name</div>
            <input ref={nameRef} value={name} onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { onSave(name, logo); onClose(); } if (e.key === 'Escape') onClose(); }}
            style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', background: 'var(--navy-elevated)', border: '1.5px solid rgba(0,194,184,.4)', borderRadius: 7, color: '#FCFCFC', fontFamily: HS.display, fontSize: 15, fontWeight: 600, outline: 'none', boxShadow: '0 0 0 3px rgba(0,194,184,.08)' }} />
          </div>
        </div>
        {/* Footer */}
        <div style={{ padding: '12px 22px', borderTop: '1px solid var(--navy-edge)', display: 'flex', gap: 7, background: 'rgba(10,18,34,.5)' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '8px 0', background: 'var(--navy-elevated)', border: '1px solid var(--navy-edge)', borderRadius: 7, color: 'var(--text-secondary)', fontFamily: HS.display, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          <button onClick={() => { onSave(name, logo); onClose(); }} style={{ flex: 2, padding: '8px 0', background: 'linear-gradient(135deg,#00C2B8,#009E96)', border: 'none', borderRadius: 7, color: '#0C182C', fontFamily: HS.display, fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,194,184,.25)' }}>Save</button>
        </div>
      </div>
    </div>);

};

// ─── Client row ────────────────────────────────────────────────────
const MenuItem = ({ icon, label, onClick, danger }) => (
  <div
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    style={{
      padding: '7px 10px', borderRadius: 6,
      display: 'flex', alignItems: 'center', gap: 8,
      cursor: 'pointer', color: danger ? '#DC2626' : 'var(--text-secondary)',
      fontFamily: HS.display, fontSize: 13, fontWeight: 600,
      transition: 'background .1s',
    }}
    onMouseEnter={e => e.currentTarget.style.background = danger ? 'rgba(220,38,38,.1)' : 'rgba(255,255,255,.06)'}
    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
  >
    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.9"
         viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
      {icon.split('|').map((d, i) => <path key={i} d={d} />)}
    </svg>
    {label}
  </div>
);

const ClientRow = ({ client, onOpen, onEdit, onConfigure, onDuplicate, onDelete, featured, idx, onQuickRename, isViewer, isLast }) => {
  const [hovered, setHovered] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef(null);
  const leaveTimer = React.useRef(null);

  React.useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const handlePDF = () => {
    sessionStorage.setItem('_avo_print', client.id);
    window.location.hash = 'client/' + client.id;
  };

  const enter = () => { clearTimeout(leaveTimer.current); setHovered(true); };
  const leave = () => { leaveTimer.current = setTimeout(() => setHovered(false), 40); };
  const mx = { onMouseEnter: enter, onMouseLeave: leave };

  const bg = hovered ? 'rgba(36,51,80,.3)' : 'transparent';
  const bt = `1px solid ${idx === 0 ? 'var(--navy-edge)' : 'rgba(51,71,102,.45)'}`;
  const cell = (extra) => ({ display: 'flex', alignItems: 'center', padding: '13px 0', background: bg, borderTop: bt, transition: 'background .15s', ...extra });

  return (
    <>
      {/* Cell 1: Left gutter + teal accent */}
      <div {...mx} style={cell({ position: 'relative', borderRadius: isLast ? '0 0 0 14px' : 0 })}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, background: 'var(--avo-teal)', opacity: hovered ? 1 : 0, transition: 'opacity .15s' }} />
      </div>

      {/* Cell 2: Avatar */}
      <div {...mx} style={cell({})}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: client.avatarGrad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: HS.display, fontWeight: 800, fontSize: 16, color: '#0C182C', flexShrink: 0 }}>
          {client.logo ? <img src={client.logo} style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'contain' }} /> : client.initials}
        </div>
      </div>

      {/* Cell 3: Name + pencil */}
      <div {...mx} style={cell({ minWidth: 0, paddingRight: 12 })}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden', width: '100%' }}>
          <span style={{ fontFamily: HS.display, fontSize: 16, fontWeight: 700, color: '#FCFCFC', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{client.name}</span>
          {!isViewer && (
            <button onClick={(e) => { e.stopPropagation(); onQuickRename(client); }}
              title="Quick edit"
              style={{ width: 20, height: 20, border: 'none', borderRadius: 5, background: hovered ? 'rgba(0,194,184,.15)' : 'transparent', color: hovered ? '#00C2B8' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background .12s, color .12s', padding: 0 }}>
              <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.9" viewBox="0 0 24 24" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4z" /></svg>
            </button>
          )}
        </div>
      </div>

      {/* Cell 4: Sources */}
      <div {...mx} style={cell({})}>
        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          {SOURCES_DEF.map((s) => {
            const on = client.connected[s.id];
            return (
              <div key={s.id} title={`${s.label} ${on ? '(connected)' : '(not connected)'}`}
                style={{ width: 26, height: 26, background: on ? `${s.color}18` : 'var(--navy-deep)', border: `1px solid ${on ? s.color + '55' : 'var(--navy-edge)'}`, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: on ? 1 : 0.3 }}>
                <svg width="14" height="14" viewBox="0 0 24 24">{s.icon}</svg>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cell 5: Last edited */}
      <div {...mx} style={cell({})}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <svg width="11" height="11" fill="none" stroke="var(--text-muted)" strokeWidth="1.8" viewBox="0 0 24 24" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
          <span style={{ fontFamily: HS.mono, fontSize: 12, color: 'var(--text-muted)' }}>{client.lastEdited || '—'}</span>
        </div>
      </div>

      {/* Cell 6: Actions */}
      <div {...mx} style={cell({ justifyContent: 'flex-start', gap: 5 })}>
        {!isViewer && (
          <button onClick={() => onConfigure(client)}
            style={{ padding: '6px 10px', background: 'var(--navy-elevated)', border: '1px solid var(--navy-edge)', borderRadius: 7, color: 'var(--text-secondary)', fontFamily: HS.display, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, transition: 'border-color .15s, color .15s' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(0,194,184,.5)'; e.currentTarget.style.color = '#00C2B8'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--navy-edge)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
            <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.9" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" /></svg>
            Configure
          </button>
        )}
        {(() => {
          const hasData = client.connected && Object.values(client.connected).some(v => !!v);
          if (hasData) return (
            <button onClick={() => onOpen(client.id)}
              style={{ padding: '6px 12px', background: 'linear-gradient(135deg,#00C2B8,#009E96)', border: 'none', borderRadius: 7, color: '#0C182C', fontFamily: HS.display, fontSize: 13.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, boxShadow: '0 3px 10px rgba(0,194,184,.2)' }}>
              Open
              <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </button>
          );
          if (isViewer) return null;
          return (
            <button onClick={() => onConfigure(client)}
              style={{ padding: '6px 12px', background: 'rgba(248,180,0,.1)', border: '1px solid rgba(248,180,0,.4)', borderRadius: 7, color: '#F8B400', fontFamily: HS.display, fontSize: 13.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,180,0,.18)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(248,180,0,.1)'; }}>
              <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24" strokeLinecap="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
              Setup Data
            </button>
          );
        })()}
        {!isViewer && (
          <div ref={menuRef} style={{ position: 'relative' }}>
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(v => !v); }}
              style={{
                padding: '6px 10px', background: menuOpen ? 'rgba(255,255,255,.1)' : 'rgba(255,255,255,.06)',
                border: '1px solid rgba(255,255,255,.1)', borderRadius: 7,
                color: 'var(--text-secondary)', fontFamily: HS.display, fontSize: 16,
                cursor: 'pointer', letterSpacing: 2, lineHeight: 1,
              }}
            >···</button>
            {menuOpen && (
              <div style={{
                position: 'absolute', right: 0, top: 'calc(100% + 6px)',
                background: 'var(--navy-surface)', border: '1px solid var(--navy-edge)',
                borderRadius: 9, padding: 6, width: 152,
                boxShadow: '0 8px 24px rgba(0,0,0,.5)', zIndex: 50,
              }}>
                <MenuItem icon="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z|M14 2v6h6M9 13h6M9 17h4"
                  label="Export PDF" onClick={() => { handlePDF(); setMenuOpen(false); }} />
                <div style={{ height: 1, background: 'var(--navy-edge)', margin: '4px 0' }} />
                <MenuItem icon="M8 17H5a2 2 0 01-2-2V5a2 2 0 012-2h8a2 2 0 012 2v3M11 21h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  label="Duplicate" onClick={() => { onDuplicate(client); setMenuOpen(false); }} />
                {!isViewer && (
                  <MenuItem icon="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"
                    label="Delete" onClick={() => { onDelete(client); setMenuOpen(false); }} danger />
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cell 7: Right gutter */}
      <div {...mx} style={cell({ borderRadius: isLast ? '0 0 14px 0' : 0 })} />
    </>
  );

};

// ─── Viewer: Profile Settings Modal ──────────────────────────────
const ViewerProfileModal = ({ onClose }) => {
  const [name, setName]     = React.useState(sessionStorage.getItem('avo_name') || '');
  const [newPw, setNewPw]   = React.useState('');
  const [showPw, setShowPw] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [done, setDone]     = React.useState(false);
  const email = sessionStorage.getItem('avo_email') || '';
  const user  = _getSessionUser();

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    const update = { name: name.trim() };
    if (newPw.trim()) update.password_hash = await _homeHashPw(newPw.trim());
    if (_APP_SUPA) {
      await _APP_SUPA.from('team_members').update(update).eq('email', email);
    }
    sessionStorage.setItem('avo_name', name.trim());
    setSaving(false);
    setDone(true);
    setTimeout(onClose, 900);
  };

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position:'fixed', inset:0, zIndex:2000, background:'rgba(5,10,22,.75)', backdropFilter:'blur(10px)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:400, background:'rgba(14,24,42,.98)', border:'1px solid var(--navy-edge)', borderRadius:16, boxShadow:'0 40px 100px rgba(0,0,0,.6)', overflow:'hidden' }}>
        <div style={{ padding:'20px 24px 16px', borderBottom:'1px solid var(--navy-edge)', display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:40, height:40, borderRadius:10, background:user.grad, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:HS.display, fontWeight:800, fontSize:14, color:'#0C182C' }}>{user.initials}</div>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:HS.display, fontSize:15, fontWeight:700, color:'#FCFCFC' }}>My Profile</div>
            <div style={{ fontFamily:HS.body, fontSize:11.5, color:'var(--text-muted)', marginTop:1 }}>{email}</div>
          </div>
          <button onClick={onClose} style={{ width:28, height:28, border:'none', background:'var(--navy-elevated)', borderRadius:7, color:'var(--text-muted)', cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
        </div>
        <div style={{ padding:'18px 24px' }}>
          <div style={{ marginBottom:16 }}>
            <div style={{ fontFamily:HS.mono, fontSize:9.5, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'.12em', marginBottom:6 }}>Name</div>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Full name"
              style={{ width:'100%', boxSizing:'border-box', padding:'9px 12px', background:'var(--navy-elevated)', border:'1px solid var(--navy-edge)', borderRadius:7, color:'#FCFCFC', fontFamily:HS.body, fontSize:13, outline:'none' }}/>
          </div>
          <div>
            <div style={{ fontFamily:HS.mono, fontSize:9.5, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'.12em', marginBottom:6 }}>New password <span style={{ fontWeight:400, textTransform:'none', letterSpacing:0 }}>(leave blank to keep unchanged)</span></div>
            <div style={{ position:'relative' }}>
              <input value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="New password" type={showPw ? 'text' : 'password'}
                style={{ width:'100%', boxSizing:'border-box', padding:'9px 36px 9px 12px', background:'var(--navy-elevated)', border:'1px solid var(--navy-edge)', borderRadius:7, color:'#FCFCFC', fontFamily:HS.body, fontSize:13, outline:'none' }}/>
              <button type="button" onClick={() => setShowPw(v => !v)}
                style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', display:'flex', alignItems:'center', padding:2 }}>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                  {showPw
                    ? <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
                    : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
                  }
                </svg>
              </button>
            </div>
          </div>
        </div>
        <div style={{ padding:'14px 24px', borderTop:'1px solid var(--navy-edge)', display:'flex', gap:8, background:'rgba(10,18,34,.5)' }}>
          <button onClick={onClose} style={{ flex:1, padding:'9px 0', background:'var(--navy-elevated)', border:'1px solid var(--navy-edge)', borderRadius:7, color:'var(--text-secondary)', fontFamily:HS.display, fontSize:12, fontWeight:600, cursor:'pointer' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving || done}
            style={{ flex:2, padding:'9px 0', background: done ? 'rgba(22,163,74,.9)' : 'linear-gradient(135deg,#00C2B8,#009E96)', border:'none', borderRadius:7, color:'#0C182C', fontFamily:HS.display, fontSize:12, fontWeight:700, cursor:'pointer', boxShadow:'0 4px 12px rgba(0,194,184,.25)' }}>
            {done ? '✓ Saved' : saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Top bar ───────────────────────────────────────────────────────
const HomeTopBar = ({ count, onNavigate, onProfileClick }) => {
  const user = _getSessionUser();
  const NAV_ROUTES = { Home: 'home', Access: 'access' };
  const handleLogout = () => {
    sessionStorage.removeItem('avo_role');
    sessionStorage.removeItem('avo_email');
    sessionStorage.removeItem('avo_name');
    window.location.href = 'login.html';
  };
  return (
    <header style={{ height: 80, minHeight: 80, background: 'rgba(10,18,34,.9)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--navy-edge)', display: 'flex', alignItems: 'center', padding: '0 28px', gap: 14, position: 'relative', zIndex: 10, boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <img src="assets/logo-mark.png" style={{ width: 106, height: 106 }} />
      <div>
        <div style={{ fontFamily: HS.display, fontSize: 16, fontWeight: 700, color: '#FCFCFC', letterSpacing: '-.01em' }}>Reportive</div>
        <div style={{ fontFamily: HS.mono, fontSize: 10.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.1em' }}>by Avonetiq</div>
      </div>
      </div>
      <div style={{ width: 1, height: 20, background: 'var(--navy-edge)' }} />
      {(_VIEWER_ROLE ? [['Home','active']] : [['Home','active'],['Access','']]).map(([l,a]) =>
        <div key={l} onClick={() => onNavigate && onNavigate(NAV_ROUTES[l])} style={{ padding: '6px 12px', borderRadius: 7, cursor: 'pointer', background: a ? 'rgba(0,194,184,.1)' : 'transparent', color: a ? '#00C2B8' : 'var(--text-secondary)', fontFamily: HS.display, fontSize: 15, fontWeight: a ? 700 : 500 }}>{l}</div>
      )}
      <div style={{ flex: 1 }} />
      <button onClick={handleLogout} style={{ padding: '6px 14px', background: 'rgba(220,38,38,.12)', border: '1px solid rgba(220,38,38,.5)', borderRadius: 7, color: '#DC2626', fontFamily: HS.display, fontSize: 13.5, fontWeight: 700, cursor: 'pointer', transition: 'all .15s' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,38,38,.22)'; e.currentTarget.style.borderColor = '#DC2626'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(220,38,38,.12)'; e.currentTarget.style.borderColor = 'rgba(220,38,38,.5)'; }}>
        Sign out
      </button>
      <div style={{ width: 1, height: 20, background: 'var(--navy-edge)' }} />
      <div onClick={_VIEWER_ROLE ? onProfileClick : undefined} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: _VIEWER_ROLE ? 'pointer' : 'default' }} title={_VIEWER_ROLE ? 'Edit profil saya' : undefined}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: user.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: HS.display, fontWeight: 700, fontSize: 14, color: '#0C182C' }}>{user.initials}</div>
        <div>
          <div style={{ fontFamily: HS.display, fontSize: 14, fontWeight: 600, color: '#FCFCFC' }}>{user.name}</div>
          <div style={{ fontFamily: HS.mono, fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.08em' }}>{user.roleLabel}</div>
        </div>
      </div>
    </header>
  );
};


// ─── Filter bar ───────────────────────────────────────────────────
const FilterBar = ({ filter, setFilter, count }) =>
<div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
    <div style={{ display: 'flex', gap: 3, background: 'var(--navy-deep)', borderRadius: 8, padding: 3 }}>
      {['All', 'Active', 'Paused'].map((f) =>
    <button key={f} onClick={() => setFilter(f)}
    style={{ padding: '5px 14px', border: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: HS.display, fontSize: 13.5, fontWeight: 600, background: filter === f ? 'var(--navy-elevated)' : 'transparent', color: filter === f ? '#FCFCFC' : 'var(--text-muted)', transition: 'background .12s' }}>
          {f}
        </button>
    )}
    </div>
    <div style={{ flex: 1 }} />
    <span style={{ fontFamily: HS.mono, fontSize: 12.5, color: 'var(--text-muted)' }}>{count} client{count !== 1 ? 's' : ''}</span>
  </div>;


// ─── Stat strip ───────────────────────────────────────────────────
const StatStrip = ({ clients }) => {
  const active = clients.filter((c) => !c.alert || c.alert.type !== 'error').length;
  const alerts = clients.filter((c) => c.alert).length;
  const sources = clients.reduce((s, c) => s + Object.values(c.connected).filter(Boolean).length, 0);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
      {[
      ['Total clients', clients.length, '#00C2B8', 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 7a4 4 0 100 8 4 4 0 000-8 M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75'],
      ['Need attention', alerts, '#F8B400', 'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01'],
      ['Connected sources', sources, '#7000FF', 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z']].
      map(([l, v, c, d]) =>
      <div key={l} style={{ background: 'var(--navy-surface)', border: '1px solid var(--navy-edge)', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 36, height: 36, background: `${c}18`, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="16" height="16" fill="none" stroke={c} strokeWidth="1.8" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
          </div>
          <div>
            <div style={{ fontFamily: HS.mono, fontSize: 11.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 2 }}>{l}</div>
            <div style={{ fontFamily: HS.display, fontSize: 22, fontWeight: 800, color: '#FCFCFC', letterSpacing: '-.02em', fontVariantNumeric: 'tabular-nums' }}>{v}</div>
          </div>
        </div>
      )}
    </div>);

};

// ─── ScreenHome ────────────────────────────────────────────────────
const ScreenHome = ({ onOpenClient, onNavigate }) => {
  const user = _getSessionUser();
  const [clients, setClients] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  // Expose live clients globally so ScreenReport can look up by id
  React.useEffect(() => { window._avo_clients = clients; }, [clients]);
  const [editTarget, setEditTarget] = React.useState(null);
  const [configTarget, setConfigTarget] = React.useState(null);
  const [deleteTarget, setDeleteTarget] = React.useState(null);
  const [quickEditTarget, setQuickEditTarget] = React.useState(null);
  const [newReportOpen, setNewReportOpen] = React.useState(false);
  const [profileOpen, setProfileOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const searchRef = React.useRef(null);
  const [sortKey, setSortKey] = React.useState(null);
  const [sortDir, setSortDir] = React.useState('asc');

  // ── Fetch + Realtime ────────────────────────────────────────────
  React.useEffect(() => {
    let channel;
    async function init() {
      if (!_APP_SUPA) { setClients(HOME_CLIENTS); setLoading(false); return; }
      const { data, error } = await _APP_SUPA
        .from('clients').select('*').order('created_at', { ascending: false });
      if (error || !data) { setClients(HOME_CLIENTS); setLoading(false); return; }
      if (data.length === 0) {
        await _seedClients();
        const { data: seeded } = await _APP_SUPA.from('clients').select('*').order('created_at', { ascending: false });
        setClients((seeded || []).map(_mapRow));
      } else {
        setClients(data.map(_mapRow));
      }
      setLoading(false);
      // Subscribe to realtime changes so all users see updates instantly
      channel = _APP_SUPA
        .channel('clients-live')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, (payload) => {
          if (payload.eventType === 'INSERT') {
            setClients(prev => prev.find(c => c.id === payload.new.id) ? prev : [_mapRow(payload.new), ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setClients(prev => prev.map(c => c.id === payload.new.id ? _mapRow(payload.new) : c));
          } else if (payload.eventType === 'DELETE') {
            setClients(prev => prev.filter(c => c.id !== payload.old.id));
          }
        })
        .subscribe();
    }
    init();
    return () => { if (channel && _APP_SUPA) _APP_SUPA.removeChannel(channel); };
  }, []);

  // ── Keyboard shortcuts ──────────────────────────────────────────
  React.useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current && searchRef.current.focus();
      }
      if (e.key === 'Escape' && document.activeElement === searchRef.current) {
        setSearchQuery('');
        searchRef.current.blur();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const _visibleClients = _VIEWER_ROLE && _VIEWER_CLIENTS.length > 0
    ? clients.filter(c => _VIEWER_CLIENTS.includes(c.id))
    : clients;
  const filtered = searchQuery.trim()
    ? _visibleClients.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : _visibleClients;

  const toggleSort = (key) => {
    if (sortKey === key) {
      if (sortDir === 'asc') setSortDir('desc');
      else { setSortKey(null); setSortDir('asc'); }
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sorted = React.useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      let va, vb;
      if (sortKey === 'name') {
        va = a.name.toLowerCase(); vb = b.name.toLowerCase();
      } else if (sortKey === 'sources') {
        va = Object.values(a.connected).filter(Boolean).length;
        vb = Object.values(b.connected).filter(Boolean).length;
      } else if (sortKey === 'lastEdited') {
        va = a.lastEditedTs || 0; vb = b.lastEditedTs || 0;
      }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filtered, sortKey, sortDir]);

  // ── Handlers (optimistic update + Supabase persist) ─────────────
  const handleQuickEdit = async (id, name, logo) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, name, ...(logo !== undefined ? { logo } : {}), lastEdited: 'Just now' } : c));
    if (_APP_SUPA) await _APP_SUPA.from('clients').update({ name, ...(logo !== undefined ? { logo } : {}), last_edited: new Date().toISOString() }).eq('id', id);
  };

  const handleDuplicate = async (c) => {
    const newId = `${c.id}-copy-${Date.now()}`;
    const dup = { ...c, id: newId, name: c.name + ' (copy)', featured: false, lastEdited: 'Just now' };
    setClients(prev => [...prev, dup]);
    if (_APP_SUPA) await _APP_SUPA.from('clients').insert({
      id: newId, name: dup.name, logo: dup.logo || null, initials: dup.initials,
      avatar_grad: dup.avatarGrad, status: dup.status || 'active', period: dup.period,
      featured: false, connected: dup.connected || {}, info: dup.info || {}, alert: dup.alert || null,
      last_edited: new Date().toISOString(), created_at: new Date().toISOString(),
    });
  };

  const handleDelete = async (id) => {
    setClients(prev => prev.filter(c => c.id !== id));
    if (_APP_SUPA) await _APP_SUPA.from('clients').delete().eq('id', id);
  };

  const handleConfigureSave = async (id, newConnected) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, connected: newConnected, lastEdited: 'Just now' } : c));
    if (_APP_SUPA) await _APP_SUPA.from('clients').update({ connected: newConnected, last_edited: new Date().toISOString() }).eq('id', id);
  };

  const handleSaveEdit = async (id, form) => {
    const info = { pic: form.pic, email: form.email, website: form.website, notes: form.notes };
    setClients(prev => prev.map(c => c.id === id ? { ...c, name: form.name, period: form.period, info, lastEdited: 'Just now' } : c));
    if (_APP_SUPA) await _APP_SUPA.from('clients').update({ name: form.name, period: form.period, info, last_edited: new Date().toISOString() }).eq('id', id);
  };

  const handleCreateReport = async (form) => {
    const connectedMap = {};
    ['google','meta','ga4','search','pagespeed'].forEach(k => { connectedMap[k] = form.sources[k] || false; });
    const psEntry = form.sources.pagespeed;
    const newId = `client-${Date.now()}`;
    const initials = form.clientName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const grad = _nameGrad(form.clientName);
    const newClient = {
      id: newId, name: form.clientName, initials, logo: form.logo || null,
      avatarGrad: grad, period: 'Apr 2026',
      alert: null, featured: false, status: 'active',
      info: { pic: '', email: '', website: psEntry ? psEntry.name : '', notes: '' },
      connected: connectedMap, lastEdited: 'Just now',
    };
    setClients(prev => [newClient, ...prev]);
    if (_APP_SUPA) await _APP_SUPA.from('clients').insert({
      id: newId, name: form.clientName, logo: form.logo || null, initials,
      avatar_grad: grad, period: 'Apr 2026',
      status: 'active', featured: false, connected: connectedMap,
      info: { pic: '', email: '', website: psEntry ? psEntry.name : '', notes: '' },
      alert: null, last_edited: new Date().toISOString(), created_at: new Date().toISOString(),
    });
  };

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--navy-base)', position: 'relative' }}>
      <RFlare intensity={0.18} />
      <HomeTopBar count={0} onNavigate={onNavigate} onProfileClick={() => setProfileOpen(true)} />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
        <div style={{ width: 28, height: 28, border: '2.5px solid rgba(0,194,184,.25)', borderTopColor: '#00C2B8', borderRadius: '50%', animation: 'spin .7s linear infinite' }}/>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.12em' }}>Loading clients…</span>
      </div>
    </div>
  );

  const TH = { display: 'flex', alignItems: 'center', gap: 6, padding: '10px 0', background: 'var(--navy-deep)', borderBottom: '1px solid var(--navy-edge)', fontFamily: "'DM Mono','SF Mono',monospace", fontSize: 13, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--text-secondary)' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--navy-base)', position: 'relative' }}>
      <RFlare intensity={0.18} />
      <HomeTopBar count={filtered.length} onNavigate={onNavigate} onProfileClick={() => setProfileOpen(true)} />

      <div style={{ flex: 1, overflow: 'auto', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '26px 32px 48px' }}>

          {/* Heading */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
            <h1 style={{ margin: 0, fontFamily: HS.display, fontSize: 26, fontWeight: 700, color: '#FCFCFC', letterSpacing: '-.02em' }}>{_timeGreeting}, {user.first}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Search */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 13px', background: 'var(--navy-surface)', border: `1px solid ${searchQuery ? 'rgba(0,194,184,.4)' : 'var(--navy-edge)'}`, borderRadius: 8, width: 220, transition: 'border-color .15s' }}>
                <svg width="13" height="13" fill="none" stroke="var(--text-muted)" strokeWidth="1.8" viewBox="0 0 24 24" style={{ flexShrink: 0 }}><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
                <input
                  ref={searchRef}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search clients…"
                  style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontFamily: HS.body, fontSize: 14, color: '#FCFCFC', minWidth: 0 }}
                />
                {searchQuery ? (
                  <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16, lineHeight: 1, padding: 0, flexShrink: 0 }}>×</button>
                ) : (
                  <span style={{ marginLeft: 'auto', fontFamily: HS.mono, fontSize: 11, color: 'var(--text-muted)', background: 'var(--navy-elevated)', padding: '1px 5px', borderRadius: 3, flexShrink: 0 }}>⌘K</span>
                )}
              </div>
              {/* New Report — hidden for viewers */}
              {!_VIEWER_ROLE && (
                <button onClick={() => setNewReportOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', background: 'linear-gradient(135deg,#00C2B8,#009E96)', color: '#0C182C', border: 'none', borderRadius: 8, fontFamily: HS.display, fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(0,194,184,.25)', whiteSpace: 'nowrap' }}>
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>
                  New Report
                </button>
              )}
            </div>
          </div>


          {/* List — single shared grid so header and rows share the same fr columns */}
          <div style={{ display: 'grid', gridTemplateColumns: '26px 48px minmax(0,1.8fr) minmax(0,1.4fr) minmax(0,1fr) minmax(0,1.6fr) 20px', background: 'var(--navy-surface)', border: '1px solid var(--navy-edge)', borderRadius: 14, overflow: 'visible', boxShadow: '0 4px 20px rgba(0,0,0,.15)' }}>
            {/* Header — 7 cells: left-gutter | CLIENT(span 2) | SOURCES | LAST EDITED | ACTIONS | right-gutter */}
            <div style={{ ...TH, borderRadius: '14px 0 0 0' }} />
            <div style={{ ...TH, gridColumn: 'span 2', cursor: 'pointer', color: sortKey === 'name' ? '#FCFCFC' : 'var(--text-secondary)' }}
                 onClick={() => toggleSort('name')}>
              CLIENT
              {sortKey === 'name' && (
                <svg width="10" height="10" fill="none" stroke="#00C2B8" strokeWidth="2.2" viewBox="0 0 24 24">
                  {sortDir === 'asc' ? <path d="M12 5v14M5 12l7-7 7 7" /> : <path d="M12 19V5M5 12l7 7 7-7" />}
                </svg>
              )}
            </div>
            <div style={{ ...TH, cursor: 'pointer', color: sortKey === 'sources' ? '#FCFCFC' : 'var(--text-secondary)' }}
                 onClick={() => toggleSort('sources')}>
              SOURCES
              {sortKey === 'sources' && (
                <svg width="10" height="10" fill="none" stroke="#00C2B8" strokeWidth="2.2" viewBox="0 0 24 24">
                  {sortDir === 'asc' ? <path d="M12 5v14M5 12l7-7 7 7" /> : <path d="M12 19V5M5 12l7 7 7-7" />}
                </svg>
              )}
            </div>
            <div style={{ ...TH, cursor: 'pointer', color: sortKey === 'lastEdited' ? '#FCFCFC' : 'var(--text-secondary)' }}
                 onClick={() => toggleSort('lastEdited')}>
              LAST EDITED
              {sortKey === 'lastEdited' && (
                <svg width="10" height="10" fill="none" stroke="#00C2B8" strokeWidth="2.2" viewBox="0 0 24 24">
                  {sortDir === 'asc' ? <path d="M12 5v14M5 12l7-7 7 7" /> : <path d="M12 19V5M5 12l7 7 7-7" />}
                </svg>
              )}
            </div>
            <div style={TH}>ACTIONS</div>
            <div style={{ ...TH, borderRadius: '0 14px 0 0' }} />

            {sorted.map((c, i) =>
              <ClientRow
                key={c.id} client={c} idx={i} featured={c.featured}
                isLast={i === sorted.length - 1}
                isViewer={_VIEWER_ROLE}
                onOpen={onOpenClient || (() => {})}
                onEdit={() => setEditTarget(c)}
                onConfigure={() => setConfigTarget(c)}
                onDuplicate={handleDuplicate}
                onDelete={() => setDeleteTarget(c)}
                onQuickRename={setQuickEditTarget} />
            )}
          </div>

        </div>
      </div>

      {/* Modals */}
      {profileOpen && <ViewerProfileModal onClose={() => setProfileOpen(false)} />}
      {!_VIEWER_ROLE && newReportOpen && <NewReportModal onClose={() => setNewReportOpen(false)} onCreate={handleCreateReport} />}
      {!_VIEWER_ROLE && quickEditTarget && <QuickEditModal client={quickEditTarget} onSave={(name, logo) => handleQuickEdit(quickEditTarget.id, name, logo)} onClose={() => setQuickEditTarget(null)} />}
      {!_VIEWER_ROLE && editTarget && <EditModal client={editTarget} onSave={(form) => handleSaveEdit(editTarget.id, form)} onClose={() => setEditTarget(null)} />}
      {!_VIEWER_ROLE && configTarget && <ConfigurePanel client={configTarget} onClose={() => setConfigTarget(null)} onSave={(conn) => handleConfigureSave(configTarget.id, conn)} onOpenReport={(id) => { onOpenClient && onOpenClient(id); }} />}
      {!_VIEWER_ROLE && deleteTarget && <DeleteConfirm client={deleteTarget} onConfirm={handleDelete} onClose={() => setDeleteTarget(null)} />}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>);

};

// ─── ScreenNewReportPreview (untuk menampilkan modal saja) ──────────
const ScreenNewReportPreview = () => {
  return (
    <div style={{ width: '100%', height: '100%', background: 'var(--navy-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <NewReportModal onClose={() => {}} onCreate={() => {}} />
    </div>
  );
};

Object.assign(window, { ScreenHome, ScreenNewReportPreview, HOME_CLIENTS });