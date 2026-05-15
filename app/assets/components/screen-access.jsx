// Reportive — Access Management screen
// User & admin management: roles, permissions, invite, revoke.
// Loaded as an artboard on the design canvas.

// ─── Current session ─────────────────────────────────────────────
const _CURRENT_EMAIL = sessionStorage.getItem('avo_email') || '';

// ─── Supabase client (same project as clients table) ──────────────
const _ACCESS_SUPA = (window.supabase && window.supabase.createClient)
  ? window.supabase.createClient(
      'https://swklfolveiilajdmuenu.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3a2xmb2x2ZWlpbGFqZG11ZW51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NDEwMDAsImV4cCI6MjA5MzAxNzAwMH0.ZuxBQkHGwpY82XwA0NQzjqnvCeJH0WUIcp0Bux2K-84'
    )
  : null;

function _relTime(ts) {
  if (!ts) return 'Never';
  const date = new Date(ts);
  if (isNaN(date.getTime())) return 'Never';
  const diff = Date.now() - date.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7)  return `${d}d ago`;
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
}

function _rowToUser(r) {
  return {
    id         : r.id,
    name       : r.name,
    email      : r.email,
    role       : r.role,
    avatar     : r.avatar || (r.name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2),
    grad       : r.grad || r.avatar_grad || 'linear-gradient(135deg,#4285F4,#00C2B8)',
    joined     : r.joined_at,
    lastActive : _relTime(r.last_active),
    lastActiveRaw: r.last_active,
    clients    : Array.isArray(r.clients) ? r.clients : [],
    status     : r.status || 'active',
  };
}

const ACCESS_USERS = [
  { id: 'u1', name: 'Workspace Owner', email: 'owner@example.com', role: 'owner', avatar: 'WO', grad: 'linear-gradient(135deg,#00C2B8,#7000FF)', joined: '28 Apr 2026', lastActive: 'Just now', clients: [], status: 'active' },
  { id: 'u2', name: 'Editor User', email: 'editor@example.com', role: 'editor', avatar: 'EU', grad: 'linear-gradient(135deg,#4285F4,#00C2B8)', joined: '28 Apr 2026', lastActive: 'Just now', clients: [], status: 'active' },
  { id: 'u3', name: 'Viewer User', email: 'viewer@example.com', role: 'viewer', avatar: 'VU', grad: 'linear-gradient(135deg,#7000FF,#4285F4)', joined: '28 Apr 2026', lastActive: 'Never', clients: [], status: 'active' },
];

const ROLES = {
  owner:  { label: 'Owner',  color: '#F43F5E', desc: 'Workspace owner — full control including billing and settings' },
  editor: { label: 'Editor', color: '#F8B400', desc: 'Create & edit reports for assigned clients' },
  viewer: { label: 'Viewer', color: '#7000FF', desc: 'Read-only access to assigned client reports' },
};

const GRAD_PRESETS = [
  'linear-gradient(135deg,#4285F4,#00C2B8)',
  'linear-gradient(135deg,#16A34A,#0EA5E9)',
  'linear-gradient(135deg,#F8B400,#E3170A)',
  'linear-gradient(135deg,#7000FF,#4285F4)',
  'linear-gradient(135deg,#00C2B8,#7000FF)',
  'linear-gradient(135deg,#F43F5E,#F8B400)',
  'linear-gradient(135deg,#0EA5E9,#7000FF)',
  'linear-gradient(135deg,#16A34A,#F8B400)',
];

// CLIENT_NAMES / CLIENT_VIS are now derived dynamically from Supabase `clients` table
// inside ScreenAccess so the filter stays in sync with Home's live client list.

// ─── Micro components ─────────────────────────────────────────────
const AS = {
  display: 'var(--font-display)',
  body: 'var(--font-body)',
  mono: 'var(--font-mono)',
};

const RoleBadge = ({ role }) => {
  const r = ROLES[role] || ROLES.viewer;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 9px', background: `${r.color}18`, border: `1px solid ${r.color}44`, borderRadius: 5, fontFamily: AS.mono, fontSize: 10, fontWeight: 600, color: r.color, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
      {r.label}
    </span>
  );
};

// ─── Toast system ─────────────────────────────────────────────────
const ToastContainer = ({ toasts }) => (
  <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }}>
    {toasts.map(t => (
      <div key={t.id} style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '11px 16px',
        background: t.type === 'error' ? 'rgba(220,38,38,.95)' : t.type === 'undo' ? 'rgba(14,24,42,.98)' : 'rgba(14,24,42,.98)',
        border: `1px solid ${t.type === 'error' ? 'rgba(220,38,38,.4)' : t.type === 'undo' ? 'rgba(248,180,0,.4)' : 'rgba(0,194,184,.35)'}`,
        borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,.5)',
        fontFamily: 'var(--font-display)', fontSize: 12.5, color: '#FCFCFC',
        pointerEvents: 'all', minWidth: 240, maxWidth: 340,
        animation: 'toastIn .2s ease',
      }}>
        {/* Icon */}
        <div style={{ width: 20, height: 20, borderRadius: '50%', background: t.type === 'error' ? 'rgba(255,255,255,.2)' : t.type === 'undo' ? 'rgba(248,180,0,.2)' : 'rgba(0,194,184,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {t.type === 'error'
            ? <svg width="10" height="10" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
            : t.type === 'undo'
            ? <svg width="10" height="10" fill="none" stroke="#F8B400" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 9v4l2.5 2.5M12 3a9 9 0 100 18A9 9 0 0012 3z"/></svg>
            : <svg width="10" height="10" fill="none" stroke="#00C2B8" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>
          }
        </div>
        <span style={{ flex: 1, fontWeight: 600 }}>{t.msg}</span>
        {t.onUndo && (
          <button onClick={t.onUndo} style={{ padding: '4px 10px', border: '1px solid rgba(248,180,0,.5)', borderRadius: 6, background: 'rgba(248,180,0,.12)', color: '#F8B400', fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
            Undo
          </button>
        )}
      </div>
    ))}
    <style>{`@keyframes toastIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }`}</style>
  </div>
);

const StatusDot = ({ status }) => {
  const c = status === 'active' ? '#16A34A' : status === 'pending' ? '#F8B400' : '#64748B';
  const l = status === 'active' ? 'Active' : status === 'pending' ? 'Pending' : 'Inactive';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: AS.mono, fontSize: 9.5, color: c, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: c, flexShrink: 0 }}/>
      {l}
    </span>
  );
};

// ─── Password Strength Bar ────────────────────────────────────────
function _pwStrength(pw) {
  if (!pw) return { score: 0, label: '', color: '' };
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  const clamp = Math.min(s, 4);
  const map = ['', 'Lemah', 'Cukup', 'Kuat', 'Sangat kuat'];
  const colors = ['', '#DC2626', '#F8B400', '#0EA5E9', '#16A34A'];
  return { score: clamp, label: map[clamp], color: colors[clamp] };
}

const PasswordStrengthBar = ({ password }) => {
  const { score, label, color } = _pwStrength(password);
  if (!password) return null;
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: 'flex', gap: 3, marginBottom: 3 }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= score ? color : 'var(--navy-edge)', transition: 'background .2s' }}/>
        ))}
      </div>
      <div style={{ fontFamily: AS.mono, fontSize: 9, color, letterSpacing: '.06em' }}>{label}</div>
    </div>
  );
};

// ─── Client Access Picker (scrollable, scales to any number) ─────
const ClientAccessPicker = ({ clientList = [], selected = [], onChange }) => {
  const [search, setSearch] = React.useState('');
  const allSelected = clientList.length > 0 && clientList.every(c => selected.includes(c.id));
  const filtered = search
    ? clientList.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    : clientList;

  const toggle = (id) => onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]);
  const toggleAll = () => onChange(allSelected ? [] : clientList.map(c => c.id));

  return (
    <div>
      {/* Search + select all */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, padding: '5px 9px', background: 'var(--navy-deep)', border: '1px solid var(--navy-edge)', borderRadius: 6 }}>
          <svg width="10" height="10" fill="none" stroke="var(--text-muted)" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects…"
            style={{ border: 'none', background: 'transparent', color: '#FCFCFC', fontFamily: AS.body, fontSize: 11.5, outline: 'none', width: '100%' }}/>
        </div>
        <button onClick={toggleAll}
          style={{ padding: '5px 10px', background: 'transparent', border: `1px solid ${allSelected ? 'rgba(0,194,184,.5)' : 'var(--navy-edge)'}`, borderRadius: 6, color: allSelected ? '#00C2B8' : 'var(--text-muted)', fontFamily: AS.display, fontSize: 10.5, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all .12s' }}>
          {allSelected ? 'Clear all' : 'Select all'}
        </button>
      </div>

      {/* Scrollable list */}
      <div style={{ maxHeight: 160, overflowY: 'auto', border: '1px solid var(--navy-edge)', borderRadius: 8, background: 'var(--navy-deep)' }}>
        {filtered.length === 0 && (
          <div style={{ padding: '12px 14px', fontFamily: AS.body, fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>No projects found</div>
        )}
        {filtered.map((c, i) => {
          const on = selected.includes(c.id);
          return (
            <div key={c.id} onClick={() => toggle(c.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderTop: i === 0 ? 'none' : '1px solid rgba(51,71,102,.35)', cursor: 'pointer', background: on ? 'rgba(0,194,184,.06)' : 'transparent', transition: 'background .1s' }}>
              {/* Checkbox */}
              <div style={{ width: 15, height: 15, borderRadius: 4, border: `1.5px solid ${on ? '#00C2B8' : 'var(--navy-edge)'}`, background: on ? '#00C2B8' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .1s' }}>
                {on && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#0C182C" strokeWidth="3.5" strokeLinecap="round"><path d="M5 13l4 4L19 7"/></svg>}
              </div>
              {/* Avatar */}
              <div style={{ width: 22, height: 22, borderRadius: 6, background: c.grad || 'linear-gradient(135deg,#475569,#334155)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: AS.display, fontWeight: 800, fontSize: 8, color: '#0C182C', flexShrink: 0 }}>
                {c.initials || c.name.slice(0,2).toUpperCase()}
              </div>
              <span style={{ fontFamily: AS.display, fontSize: 12, fontWeight: 600, color: on ? '#FCFCFC' : 'var(--text-secondary)' }}>{c.name}</span>
            </div>
          );
        })}
      </div>

      {/* Count badge */}
      {selected.length > 0 && (
        <div style={{ marginTop: 5, fontFamily: AS.mono, fontSize: 9.5, color: '#00C2B8', letterSpacing: '.06em' }}>
          {selected.length} project{selected.length > 1 ? 's' : ''} selected
        </div>
      )}
    </div>
  );
};

// ─── Invite Modal ─────────────────────────────────────────────────
async function _hashPw(pw) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pw));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Generate a secure random invite token
function _genToken() {
  const arr = new Uint8Array(24);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2,'0')).join('');
}

const InviteModal = ({ onClose, onInvite, clientList = [] }) => {
  const [name, setName]         = React.useState('');
  const [email, setEmail]       = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPw, setShowPw]     = React.useState(false);
  const [role, setRole]         = React.useState('editor');
  const [clients, setClients]   = React.useState([]);
  const [saving, setSaving]     = React.useState(false);
  const [done, setDone]         = React.useState(false);
  const [errMsg, setErrMsg]     = React.useState('');
  const savedPasswordRef = React.useRef('');

  const canSubmit = email.trim() && name.trim() && password.length >= 6;

  const handleSend = async () => {
    if (!canSubmit) return;
    setErrMsg('');
    setSaving(true);
    try {
      const hash = await _hashPw(password.trim());
      const result = await onInvite({ name: name.trim(), email: email.trim().toLowerCase(), role, clients, passwordHash: hash });
      if (!result) {
        setErrMsg('Gagal menyimpan. Email mungkin sudah terdaftar atau terjadi kesalahan — coba lagi.');
        setSaving(false);
        return;
      }
      savedPasswordRef.current = password;
      setPassword('');
      setDone(true);
    } catch (e) {
      setErrMsg('Error: ' + (e.message || 'Terjadi kesalahan tidak terduga'));
      setSaving(false);
    }
  };

  // ── Success state ─────────────────────────────────────────────
  if (done) return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(5,10,22,.75)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 440, background: 'rgba(14,24,42,.98)', border: '1px solid rgba(0,194,184,.2)', borderRadius: 16, boxShadow: '0 40px 100px rgba(0,0,0,.6)', padding: '32px 28px', textAlign: 'center' }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(22,163,74,.12)', border: '1px solid rgba(22,163,74,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <svg width="22" height="22" fill="none" stroke="#16A34A" strokeWidth="2.2" viewBox="0 0 24 24" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>
        </div>
        <div style={{ fontFamily: AS.display, fontSize: 18, fontWeight: 700, color: '#FCFCFC', marginBottom: 8 }}>Member ditambahkan!</div>
        <div style={{ fontFamily: AS.body, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>
          <strong style={{ color: '#FCFCFC' }}>{name}</strong> ({email}) sudah bisa login dengan password yang kamu set.
        </div>
        {/* Credential summary box */}
        <div style={{ background: 'var(--navy-deep)', border: '1px solid var(--navy-edge)', borderRadius: 10, padding: '12px 16px', textAlign: 'left', marginBottom: 20 }}>
          <div style={{ fontFamily: AS.mono, fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 8 }}>Info Login</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: AS.mono, fontSize: 10.5, color: 'var(--text-muted)' }}>Email</span>
              <span style={{ fontFamily: AS.mono, fontSize: 11, color: '#FCFCFC', fontWeight: 600 }}>{email}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: AS.mono, fontSize: 10.5, color: 'var(--text-muted)' }}>Password</span>
              <span style={{ fontFamily: AS.mono, fontSize: 11, color: '#00C2B8', fontWeight: 600 }}>{savedPasswordRef.current}</span>
            </div>
          </div>
        </div>
        <div style={{ padding: '9px 12px', background: 'rgba(248,180,0,.08)', border: '1px solid rgba(248,180,0,.2)', borderRadius: 8, fontFamily: AS.body, fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 16 }}>
          💡 Bagikan info login di atas kepada member secara langsung atau via pesan.
        </div>
        <button onClick={() => { savedPasswordRef.current = ''; onClose(); }} style={{ width: '100%', padding: '10px', background: 'linear-gradient(135deg,#00C2B8,#009E96)', border: 'none', borderRadius: 9, color: '#0C182C', fontFamily: AS.display, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Selesai</button>
      </div>
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(5,10,22,.75)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width: 520, background: 'rgba(14,24,42,.98)', border: '1px solid var(--navy-edge)', borderRadius: 16, boxShadow: '0 40px 100px rgba(0,0,0,.6)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--navy-edge)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: AS.display, fontSize: 16, fontWeight: 700, color: '#FCFCFC' }}>Tambah member baru</div>
            <div style={{ fontFamily: AS.body, fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>Isi data member — mereka langsung bisa login setelah disimpan</div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, border: 'none', background: 'var(--navy-elevated)', borderRadius: 7, color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>

        <div style={{ padding: '20px 24px', maxHeight: '60vh', overflowY: 'auto' }}>

          {/* Name + Email */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            <div>
              <div style={{ fontFamily: AS.mono, fontSize: 9.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 6 }}>Nama lengkap *</div>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Budi Santoso"
                style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', background: 'var(--navy-elevated)', border: '1px solid var(--navy-edge)', borderRadius: 7, color: '#FCFCFC', fontFamily: AS.body, fontSize: 12.5, outline: 'none' }}/>
            </div>
            <div>
              <div style={{ fontFamily: AS.mono, fontSize: 9.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 6 }}>Email *</div>
              <input value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" type="email"
                style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', background: 'var(--navy-elevated)', border: '1px solid var(--navy-edge)', borderRadius: 7, color: '#FCFCFC', fontFamily: AS.body, fontSize: 12.5, outline: 'none' }}/>
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: AS.mono, fontSize: 9.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 6 }}>Password sementara * <span style={{ fontFamily: AS.body, fontSize: 10, textTransform: 'none', letterSpacing: 0, color: 'var(--text-muted)' }}>(min. 6 karakter)</span></div>
            <div style={{ position: 'relative' }}>
              <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Buat password untuk member ini" type={showPw ? 'text' : 'password'}
                style={{ width: '100%', boxSizing: 'border-box', padding: '9px 38px 9px 12px', background: 'var(--navy-elevated)', border: '1px solid var(--navy-edge)', borderRadius: 7, color: '#FCFCFC', fontFamily: AS.body, fontSize: 12.5, outline: 'none' }}/>
              <button type="button" onClick={() => setShowPw(v => !v)}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2, display: 'flex', alignItems: 'center' }}>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" strokeLinecap="round">
                  {showPw
                    ? <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
                    : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
                  }
                </svg>
              </button>
            </div>
            <PasswordStrengthBar password={password}/>
          </div>

          {/* Role */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: AS.mono, fontSize: 9.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 8 }}>Role</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {Object.entries(ROLES).filter(([k]) => k !== 'owner').map(([k, r]) => (
                <button key={k} onClick={() => setRole(k)}
                  style={{ flex: 1, padding: '9px 6px', border: `1.5px solid ${role === k ? r.color : 'var(--navy-edge)'}`, borderRadius: 8, background: role === k ? `${r.color}14` : 'var(--navy-surface)', color: role === k ? r.color : 'var(--text-muted)', fontFamily: AS.display, fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all .12s' }}>
                  {r.label}
                  <div style={{ fontFamily: AS.body, fontSize: 9.5, fontWeight: 400, marginTop: 2, color: role === k ? r.color + 'cc' : 'var(--text-muted)', lineHeight: 1.3 }}>{r.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Client access */}
          <div>
            <div style={{ fontFamily: AS.mono, fontSize: 9.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 8 }}>Client access</div>
            <ClientAccessPicker clientList={clientList} selected={clients} onChange={setClients}/>
          </div>

          {errMsg && <div style={{ marginTop: 10, padding: '8px 12px', background: 'rgba(220,38,38,.1)', border: '1px solid rgba(220,38,38,.25)', borderRadius: 7, fontFamily: AS.body, fontSize: 11.5, color: '#FCA5A5' }}>{errMsg}</div>}
        </div>

        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--navy-edge)', display: 'flex', gap: 8, background: 'rgba(10,18,34,.5)' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px 0', background: 'var(--navy-elevated)', border: '1px solid var(--navy-edge)', borderRadius: 8, color: 'var(--text-secondary)', fontFamily: AS.display, fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>Batal</button>
          <button onClick={handleSend} disabled={saving || !canSubmit}
            style={{ flex: 2, padding: '10px 0', background: saving ? 'rgba(0,194,184,.4)' : 'linear-gradient(135deg,#00C2B8,#009E96)', border: 'none', borderRadius: 8, color: '#0C182C', fontFamily: AS.display, fontSize: 12.5, fontWeight: 700, cursor: (!canSubmit || saving) ? 'not-allowed' : 'pointer', opacity: !canSubmit ? 0.55 : 1, boxShadow: canSubmit ? '0 4px 14px rgba(0,194,184,.25)' : 'none', transition: 'all .15s' }}>
            {saving ? <><span style={{ display: 'inline-block', width: 12, height: 12, border: '2px solid rgba(12,24,44,.3)', borderTopColor: '#0C182C', borderRadius: '50%', animation: 'spin .6s linear infinite', verticalAlign: 'middle', marginRight: 6 }}></span>Menyimpan…</> : 'Tambah Member →'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Edit Role Modal ──────────────────────────────────────────────
const EditRoleModal = ({ user, onClose, onSave, clientList = [] }) => {
  const [role, setRole]         = React.useState(user.role);
  const [clients, setClients]   = React.useState([...user.clients]);
  const [grad, setGrad]         = React.useState(user.grad);
  const [newPassword, setNewPassword] = React.useState('');
  const [showPw, setShowPw]     = React.useState(false);
  const [saving, setSaving]     = React.useState(false);
  const toggleClient = (id) => setClients(c => c.includes(id) ? c.filter(x => x !== id) : [...c, id]);

  const roleChanged     = role !== user.role;
  const addedClients    = clients.filter(id => !user.clients.includes(id));
  const removedClients  = user.clients.filter(id => !clients.includes(id));
  const gradChanged     = grad !== user.grad;
  const hasChanges      = roleChanged || addedClients.length > 0 || removedClients.length > 0 || gradChanged || !!newPassword;

  const handleSave = async () => {
    setSaving(true);
    let passwordHash = undefined;
    if (newPassword) passwordHash = await _hashPw(newPassword);
    await onSave(user.id, { role, clients, passwordHash, grad });
    setSaving(false);
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(5,10,22,.75)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width: 480, background: 'rgba(14,24,42,.98)', border: '1px solid var(--navy-edge)', borderRadius: 16, boxShadow: '0 40px 100px rgba(0,0,0,.6)', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--navy-edge)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: user.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: AS.display, fontWeight: 800, fontSize: 14, color: '#0C182C' }}>{user.avatar}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: AS.display, fontSize: 15, fontWeight: 700, color: '#FCFCFC' }}>Edit access · {user.name}</div>
            <div style={{ fontFamily: AS.body, fontSize: 11.5, color: 'var(--text-muted)', marginTop: 1 }}>{user.email}</div>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, border: 'none', background: 'var(--navy-elevated)', borderRadius: 7, color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>

        <div style={{ padding: '18px 24px', maxHeight: '65vh', overflowY: 'auto' }}>

          {/* Change summary diff */}
          {hasChanges && (
            <div style={{ marginBottom: 16, padding: '10px 14px', background: 'rgba(0,194,184,.06)', border: '1px solid rgba(0,194,184,.2)', borderRadius: 9 }}>
              <div style={{ fontFamily: AS.mono, fontSize: 8.5, color: '#00C2B8', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 6 }}>Ringkasan perubahan</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {roleChanged && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: AS.display, fontSize: 11.5, color: 'var(--text-secondary)' }}>
                    <span style={{ color: ROLES[user.role]?.color || '#64748B', fontWeight: 700 }}>{ROLES[user.role]?.label || user.role}</span>
                    <svg width="10" height="10" fill="none" stroke="var(--text-muted)" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    <span style={{ color: ROLES[role]?.color || '#64748B', fontWeight: 700 }}>{ROLES[role]?.label || role}</span>
                  </div>
                )}
                {addedClients.length > 0 && (
                  <div style={{ fontFamily: AS.display, fontSize: 11, color: '#16A34A' }}>+{addedClients.length} client access ditambah</div>
                )}
                {removedClients.length > 0 && (
                  <div style={{ fontFamily: AS.display, fontSize: 11, color: '#DC2626' }}>−{removedClients.length} client access dihapus</div>
                )}
                {newPassword && <div style={{ fontFamily: AS.display, fontSize: 11, color: '#F8B400' }}>Password akan direset</div>}
                {gradChanged && !roleChanged && !addedClients.length && !removedClients.length && !newPassword && (
                  <div style={{ fontFamily: AS.display, fontSize: 11, color: 'var(--text-secondary)' }}>Avatar gradient diubah</div>
                )}
              </div>
            </div>
          )}

          {/* Avatar gradient picker */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: AS.mono, fontSize: 9.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 8 }}>Avatar color</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: AS.display, fontWeight: 800, fontSize: 13, color: '#0C182C', flexShrink: 0 }}>{user.avatar}</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {GRAD_PRESETS.map(g => (
                  <button key={g} onClick={() => setGrad(g)} title={g}
                    style={{ width: 24, height: 24, borderRadius: 7, background: g, border: `2px solid ${grad === g ? '#00C2B8' : 'transparent'}`, cursor: 'pointer', padding: 0, boxShadow: grad === g ? '0 0 0 1px rgba(0,194,184,.5)' : 'none', transition: 'border-color .12s', flexShrink: 0 }}/>
                ))}
              </div>
            </div>
          </div>

          <div style={{ fontFamily: AS.mono, fontSize: 9.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 8 }}>Role</div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
            {Object.entries(ROLES).map(([k, r]) => (
              <button key={k} onClick={() => setRole(k)}
                style={{ flex: 1, padding: '8px 4px', border: `1.5px solid ${role === k ? r.color : 'var(--navy-edge)'}`, borderRadius: 8, background: role === k ? `${r.color}14` : 'var(--navy-surface)', color: role === k ? r.color : 'var(--text-muted)', fontFamily: AS.display, fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all .12s' }}>
                {r.label}
              </button>
            ))}
          </div>

          {/* Reset password (optional) */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: AS.mono, fontSize: 9.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 6 }}>Reset password <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(kosongkan untuk tidak mengubah)</span></div>
            <div style={{ position: 'relative' }}>
              <input value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Password baru" type={showPw ? 'text' : 'password'}
                style={{ width: '100%', boxSizing: 'border-box', padding: '9px 36px 9px 12px', background: 'var(--navy-elevated)', border: '1px solid var(--navy-edge)', borderRadius: 7, color: '#FCFCFC', fontFamily: AS.body, fontSize: 12.5, outline: 'none' }}/>
              <button type="button" onClick={() => setShowPw(v => !v)}
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: 2 }}>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                  {showPw
                    ? <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
                    : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
                  }
                </svg>
              </button>
            </div>
            <PasswordStrengthBar password={newPassword}/>
          </div>

          {role !== 'admin' && (
            <>
              <div style={{ fontFamily: AS.mono, fontSize: 9.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 8 }}>Client access</div>
              <ClientAccessPicker clientList={clientList} selected={clients} onChange={setClients}/>
            </>
          )}
        </div>

        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--navy-edge)', display: 'flex', gap: 8, background: 'rgba(10,18,34,.5)' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '9px 0', background: 'var(--navy-elevated)', border: '1px solid var(--navy-edge)', borderRadius: 8, color: 'var(--text-secondary)', fontFamily: AS.display, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving}
            style={{ flex: 2, padding: '9px 0', background: saving ? 'rgba(0,194,184,.4)' : 'linear-gradient(135deg,#00C2B8,#009E96)', border: 'none', borderRadius: 8, color: '#0C182C', fontFamily: AS.display, fontSize: 12, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', boxShadow: '0 4px 14px rgba(0,194,184,.25)' }}>
            {saving ? 'Menyimpan…' : 'Simpan perubahan'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Client access cell — stacked avatars + count, hover for full list
const ClientAccessCell = ({ user, clientMap = {} }) => {
  const [open, setOpen] = React.useState(false);

  if (user.role === 'owner') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <div style={{ width: 22, height: 22, borderRadius: 6, background: 'rgba(0,194,184,.12)', border: '1px solid rgba(0,194,184,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="11" height="11" fill="none" stroke="#00C2B8" strokeWidth="2.2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        </div>
        <span style={{ fontFamily: AS.display, fontSize: 11.5, fontWeight: 700, color: '#00C2B8', letterSpacing: '.02em' }}>All clients</span>
      </div>
    );
  }

  const ids = user.clients;

  // Empty state — no client access
  if (ids.length === 0) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px', background: 'rgba(248,180,0,.1)', border: '1px solid rgba(248,180,0,.3)', borderRadius: 5, fontFamily: AS.mono, fontSize: 9.5, color: '#F8B400', letterSpacing: '.06em', textTransform: 'uppercase' }}>
        <svg width="9" height="9" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        No access
      </span>
    );
  }

  const visible = ids.slice(0, 3);
  const overflow = ids.length - visible.length;

  return (
    <div
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>

      {/* Avatar stack */}
      <div style={{ display: 'flex' }}>
        {visible.map((id, i) => {
          const v = clientMap[id] || { initials: '??', grad: 'linear-gradient(135deg,#475569,#334155)' };
          return (
            <div key={id}
              title={clientMap[id]?.name || id}
              style={{
                width: 24, height: 24, borderRadius: 7,
                background: v.grad,
                border: '2px solid var(--navy-surface)',
                marginLeft: i === 0 ? 0 : -7,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: AS.display, fontWeight: 800, fontSize: 9, color: '#0C182C',
                zIndex: 10 - i, position: 'relative',
              }}>
              {v.initials}
            </div>
          );
        })}
        {overflow > 0 && (
          <div style={{
            width: 24, height: 24, borderRadius: 7,
            background: 'var(--navy-deep)',
            border: '2px solid var(--navy-surface)',
            marginLeft: -7,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: AS.mono, fontWeight: 700, fontSize: 9.5, color: 'var(--text-secondary)',
            position: 'relative', zIndex: 1,
          }}>
            +{overflow}
          </div>
        )}
      </div>

      {/* Count label */}
      <span style={{ fontFamily: AS.mono, fontSize: 10, color: 'var(--text-muted)', letterSpacing: '.04em' }}>
        {ids.length} {ids.length === 1 ? 'client' : 'clients'}
      </span>

      {/* Hover popover with full list */}
      {open && ids.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 50,
          background: 'var(--navy-elevated)', border: '1px solid var(--navy-edge)', borderRadius: 10,
          padding: '8px 10px', minWidth: 200, maxWidth: 280,
          boxShadow: '0 12px 32px rgba(0,0,0,.5)',
          display: 'flex', flexDirection: 'column', gap: 5,
        }}>
          <div style={{ fontFamily: AS.mono, fontSize: 8.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 2 }}>Has access to</div>
          {ids.map(id => {
            const v = clientMap[id] || { initials: '??', grad: 'linear-gradient(135deg,#475569,#334155)' };
            return (
              <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 18, height: 18, borderRadius: 5, background: v.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: AS.display, fontWeight: 800, fontSize: 8, color: '#0C182C', flexShrink: 0 }}>
                  {v.initials}
                </div>
                <span style={{ fontFamily: AS.display, fontSize: 11.5, color: '#FCFCFC', fontWeight: 600 }}>{v.name || id}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── Self Password Modal ──────────────────────────────────────────
const SelfPasswordModal = ({ user, onClose }) => {
  const [currentPw, setCurrentPw] = React.useState('');
  const [newPw, setNewPw]         = React.useState('');
  const [showCurrent, setShowCurrent] = React.useState(false);
  const [showNew, setShowNew]     = React.useState(false);
  const [saving, setSaving]       = React.useState(false);
  const [errMsg, setErrMsg]       = React.useState('');
  const [done, setDone]           = React.useState(false);

  const EyeIcon = ({ show }) => (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" strokeLinecap="round">
      {show
        ? <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
        : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>}
    </svg>
  );

  const handleSave = async () => {
    if (!currentPw || newPw.length < 6) return;
    setSaving(true);
    setErrMsg('');
    try {
      const currentHash = await _hashPw(currentPw.trim());
      const { data, error } = await _ACCESS_SUPA
        .from('team_members').select('password_hash').eq('email', user.email).maybeSingle();
      if (error) throw error;
      if (!data || data.password_hash !== currentHash) {
        setErrMsg('Password saat ini salah. Coba lagi.');
        setSaving(false);
        return;
      }
      const newHash = await _hashPw(newPw.trim());
      const { error: upErr } = await _ACCESS_SUPA
        .from('team_members').update({ password_hash: newHash }).eq('email', user.email);
      if (upErr) throw upErr;
      setDone(true);
    } catch (e) {
      setErrMsg('Error: ' + (e.message || 'Terjadi kesalahan'));
      setSaving(false);
    }
  };

  if (done) return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(5,10,22,.75)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 380, background: 'rgba(14,24,42,.98)', border: '1px solid rgba(0,194,184,.2)', borderRadius: 16, boxShadow: '0 40px 100px rgba(0,0,0,.6)', padding: '32px 28px', textAlign: 'center' }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(22,163,74,.12)', border: '1px solid rgba(22,163,74,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <svg width="22" height="22" fill="none" stroke="#16A34A" strokeWidth="2.2" viewBox="0 0 24 24" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>
        </div>
        <div style={{ fontFamily: AS.display, fontSize: 17, fontWeight: 700, color: '#FCFCFC', marginBottom: 8 }}>Password diperbarui!</div>
        <div style={{ fontFamily: AS.body, fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.5 }}>Password baru kamu sudah aktif. Gunakan saat login berikutnya.</div>
        <button onClick={onClose} style={{ width: '100%', padding: '10px', background: 'linear-gradient(135deg,#00C2B8,#009E96)', border: 'none', borderRadius: 9, color: '#0C182C', fontFamily: AS.display, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Selesai</button>
      </div>
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(5,10,22,.75)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width: 420, background: 'rgba(14,24,42,.98)', border: '1px solid var(--navy-edge)', borderRadius: 16, boxShadow: '0 40px 100px rgba(0,0,0,.6)', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--navy-edge)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: AS.display, fontSize: 15, fontWeight: 700, color: '#FCFCFC' }}>Ganti password</div>
            <div style={{ fontFamily: AS.body, fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>Verifikasi password lama, lalu buat yang baru</div>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, border: 'none', background: 'var(--navy-elevated)', borderRadius: 7, color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>
        <div style={{ padding: '20px 24px' }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: AS.mono, fontSize: 9.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 6 }}>Password saat ini</div>
            <div style={{ position: 'relative' }}>
              <input value={currentPw} onChange={e => setCurrentPw(e.target.value)} type={showCurrent ? 'text' : 'password'} placeholder="••••••••"
                style={{ width: '100%', boxSizing: 'border-box', padding: '9px 36px 9px 12px', background: 'var(--navy-elevated)', border: '1px solid var(--navy-edge)', borderRadius: 7, color: '#FCFCFC', fontFamily: AS.body, fontSize: 12.5, outline: 'none' }}/>
              <button type="button" onClick={() => setShowCurrent(v => !v)} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: 2 }}>
                <EyeIcon show={showCurrent}/>
              </button>
            </div>
          </div>
          <div>
            <div style={{ fontFamily: AS.mono, fontSize: 9.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 6 }}>Password baru <span style={{ fontFamily: AS.body, fontSize: 10, textTransform: 'none', letterSpacing: 0 }}>(min. 6 karakter)</span></div>
            <div style={{ position: 'relative' }}>
              <input value={newPw} onChange={e => setNewPw(e.target.value)} type={showNew ? 'text' : 'password'} placeholder="Buat password baru"
                onKeyDown={e => { if (e.key === 'Enter') handleSave(); }}
                style={{ width: '100%', boxSizing: 'border-box', padding: '9px 36px 9px 12px', background: 'var(--navy-elevated)', border: '1px solid var(--navy-edge)', borderRadius: 7, color: '#FCFCFC', fontFamily: AS.body, fontSize: 12.5, outline: 'none' }}/>
              <button type="button" onClick={() => setShowNew(v => !v)} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: 2 }}>
                <EyeIcon show={showNew}/>
              </button>
            </div>
            <PasswordStrengthBar password={newPw}/>
          </div>
          {errMsg && <div style={{ marginTop: 10, padding: '8px 12px', background: 'rgba(220,38,38,.1)', border: '1px solid rgba(220,38,38,.25)', borderRadius: 7, fontFamily: AS.body, fontSize: 11.5, color: '#FCA5A5' }}>{errMsg}</div>}
        </div>
        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--navy-edge)', display: 'flex', gap: 8, background: 'rgba(10,18,34,.5)' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '9px 0', background: 'var(--navy-elevated)', border: '1px solid var(--navy-edge)', borderRadius: 8, color: 'var(--text-secondary)', fontFamily: AS.display, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Batal</button>
          <button onClick={handleSave} disabled={saving || !currentPw || newPw.length < 6}
            style={{ flex: 2, padding: '9px 0', background: saving ? 'rgba(0,194,184,.4)' : 'linear-gradient(135deg,#00C2B8,#009E96)', border: 'none', borderRadius: 8, color: '#0C182C', fontFamily: AS.display, fontSize: 12, fontWeight: 700, cursor: (saving || !currentPw || newPw.length < 6) ? 'not-allowed' : 'pointer', opacity: (!currentPw || newPw.length < 6) ? 0.55 : 1 }}>
            {saving ? 'Menyimpan…' : 'Simpan password baru'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── User Row ─────────────────────────────────────────────────────
const UserRow = ({ user, idx, onEditRole, onRevoke, isSelf, clientMap, isNew, isSelected, onToggleSelect, onEditName, onChangePassword }) => {
  const [hovered, setHovered]     = React.useState(false);
  const [expanded, setExpanded]   = React.useState(false);
  const [editingName, setEditingName] = React.useState(false);
  const [nameVal, setNameVal]     = React.useState(user.name);
  const nameInputRef              = React.useRef(null);

  React.useEffect(() => { setNameVal(user.name); }, [user.name]);

  const startNameEdit = (e) => {
    if (isSelf || !onEditName) return;
    e.stopPropagation();
    setEditingName(true);
    setTimeout(() => nameInputRef.current && nameInputRef.current.select(), 0);
  };
  const commitNameEdit = () => {
    setEditingName(false);
    const trimmed = nameVal.trim();
    if (trimmed && trimmed !== user.name) onEditName(user.id, trimmed);
    else setNameVal(user.name);
  };
  const cancelNameEdit = () => { setEditingName(false); setNameVal(user.name); };

  const joinedFormatted = user.joined
    ? new Date(user.joined).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ borderTop: `1px solid ${idx === 0 ? 'var(--navy-edge)' : 'rgba(51,71,102,.4)'}`, background: isNew ? 'rgba(0,194,184,.06)' : hovered ? 'rgba(36,51,80,.25)' : 'transparent', transition: 'background .15s', position: 'relative', animation: isNew ? 'rowGlow .6s ease' : 'none' }}>

      {/* Teal accent */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, background: isNew ? '#00C2B8' : 'var(--avo-teal)', opacity: isNew || hovered ? 1 : 0, transition: 'opacity .15s' }}/>

      <div style={{ display: 'grid', gridTemplateColumns: '24px 44px 1fr 110px 100px 1fr 180px', alignItems: 'center', gap: 14, padding: '14px 24px', paddingLeft: 14 }}>

        {/* Checkbox */}
        <div onClick={() => onToggleSelect(user.id)} style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${isSelected ? '#00C2B8' : 'var(--navy-edge)'}`, background: isSelected ? '#00C2B8' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all .1s', flexShrink: 0 }}>
          {isSelected && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#0C182C" strokeWidth="3.5" strokeLinecap="round"><path d="M5 13l4 4L19 7"/></svg>}
        </div>

        {/* Avatar */}
        <div style={{ position: 'relative' }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: user.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: AS.display, fontWeight: 800, fontSize: 13, color: '#0C182C' }}>
            {user.avatar}
          </div>
        </div>

        {/* Name + email */}
        <div>
          {editingName ? (
            <input ref={nameInputRef} value={nameVal} onChange={e => setNameVal(e.target.value)}
              onBlur={commitNameEdit}
              onKeyDown={e => { if (e.key === 'Enter') commitNameEdit(); if (e.key === 'Escape') cancelNameEdit(); }}
              style={{ width: '100%', boxSizing: 'border-box', padding: '3px 7px', background: 'var(--navy-elevated)', border: '1.5px solid rgba(0,194,184,.5)', borderRadius: 5, color: '#FCFCFC', fontFamily: AS.display, fontSize: 13.5, fontWeight: 700, outline: 'none' }}/>
          ) : (
            <div onDoubleClick={startNameEdit}
              title={(!isSelf && onEditName) ? 'Double-click to rename' : undefined}
              style={{ fontFamily: AS.display, fontSize: 13.5, fontWeight: 700, color: '#FCFCFC', display: 'flex', alignItems: 'center', gap: 6, cursor: (!isSelf && onEditName) ? 'text' : 'default' }}>
              {user.name}
              {isSelf && <span style={{ fontFamily: AS.mono, fontSize: 9, color: 'var(--avo-teal)', background: 'rgba(0,194,184,.1)', padding: '1px 6px', borderRadius: 3, letterSpacing: '.08em' }}>YOU</span>}
              {isNew && <span style={{ fontFamily: AS.mono, fontSize: 9, color: '#16A34A', background: 'rgba(22,163,74,.12)', padding: '1px 6px', borderRadius: 3, letterSpacing: '.08em' }}>NEW</span>}
            </div>
          )}
          <div style={{ fontFamily: AS.mono, fontSize: 10.5, color: 'var(--text-muted)', marginTop: 2 }}>{user.email}</div>
        </div>

        {/* Role */}
        <div><RoleBadge role={user.role}/></div>

        {/* Status */}
        <div><StatusDot status={user.status}/></div>

        {/* Client access */}
        <ClientAccessCell user={user} clientMap={clientMap}/>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-end', alignItems: 'center' }}>
          {/* Expand activity toggle */}
          <button onClick={() => setExpanded(v => !v)} title={expanded ? 'Hide activity' : 'Show activity'}
            style={{ width: 26, height: 26, border: '1px solid var(--navy-edge)', borderRadius: 6, background: expanded ? 'rgba(0,194,184,.1)' : 'transparent', color: expanded ? '#00C2B8' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .12s' }}>
            <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24" strokeLinecap="round" style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}><path d="M6 9l6 6 6-6"/></svg>
          </button>
          <div style={{ fontFamily: AS.mono, fontSize: 10, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{user.lastActive}</div>
          {isSelf && (
            <button onClick={onChangePassword}
              style={{ padding: '6px 10px', background: 'var(--navy-elevated)', border: '1px solid var(--navy-edge)', borderRadius: 6, color: 'var(--text-secondary)', fontFamily: AS.display, fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, transition: 'all .12s', whiteSpace: 'nowrap' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(248,180,0,.5)'; e.currentTarget.style.color = '#F8B400'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--navy-edge)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
              <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
              Change PW
            </button>
          )}
          {!isSelf && (
            <>
              <button onClick={() => onEditRole(user)}
                style={{ padding: '6px 11px', background: 'var(--navy-elevated)', border: '1px solid var(--navy-edge)', borderRadius: 6, color: 'var(--text-secondary)', fontFamily: AS.display, fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, transition: 'all .12s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,194,184,.5)'; e.currentTarget.style.color = '#00C2B8'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--navy-edge)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.9" viewBox="0 0 24 24" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4z"/></svg>
                Edit
              </button>
              <button onClick={() => onRevoke(user)}
                style={{ padding: '6px 11px', background: 'transparent', border: '1px solid rgba(220,38,38,.3)', borderRadius: 6, color: 'rgba(220,38,38,.7)', fontFamily: AS.display, fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all .12s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,38,38,.1)'; e.currentTarget.style.color = '#DC2626'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(220,38,38,.7)'; }}>
                Revoke
              </button>
            </>
          )}
        </div>
      </div>

      {/* Activity log (expandable) — only shows data not already in the row */}
      {expanded && (
        <div style={{ padding: '0 24px 14px 86px', display: 'flex', gap: 28, alignItems: 'center' }}>
          {[
            ['Joined', joinedFormatted, 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', '#4285F4'],
            ['Last active', user.lastActiveRaw
              ? new Date(user.lastActiveRaw).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
              : 'Belum pernah aktif',
              'M12 8v4l3 3M12 22a10 10 0 100-20 10 10 0 000 20z', '#00C2B8'],
          ].map(([label, value, iconPath, color]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{ width: 22, height: 22, borderRadius: 6, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="11" height="11" fill="none" stroke={color} strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d={iconPath}/></svg>
              </div>
              <div>
                <div style={{ fontFamily: AS.mono, fontSize: 8.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.1em' }}>{label}</div>
                <div style={{ fontFamily: AS.display, fontSize: 11.5, fontWeight: 600, color: '#FCFCFC', marginTop: 1 }}>{value}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Roles legend ─────────────────────────────────────────────────
const RolesCard = () => (
  <div style={{ background: 'var(--navy-surface)', border: '1px solid var(--navy-edge)', borderRadius: 14, padding: '20px 22px', boxShadow: '0 4px 14px rgba(0,0,0,.12)' }}>
    <div style={{ fontFamily: AS.display, fontSize: 14, fontWeight: 700, color: '#FCFCFC', marginBottom: 14 }}>Role permissions</div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {Object.entries(ROLES).map(([k, r]) => (
        <div key={k} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <RoleBadge role={k}/>
          <div style={{ fontFamily: AS.body, fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.5, paddingTop: 2 }}>{r.desc}</div>
        </div>
      ))}
    </div>
  </div>
);

// ─── Summary cards ────────────────────────────────────────────────
const SummaryCards = ({ users }) => {
  const stats = [
    ['Total members', users.length, '#00C2B8', 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 7a4 4 0 100 8 4 4 0 000-8 M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75'],
    ['Editors', users.filter(u => u.role === 'editor').length, '#F8B400', 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'],
    ['Pending invites', users.filter(u => u.status === 'pending').length, '#7000FF', 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6'],
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
      {stats.map(([l, v, c, d]) => (
        <div key={l} style={{ background: 'var(--navy-surface)', border: '1px solid var(--navy-edge)', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 36, height: 36, background: `${c}18`, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="16" height="16" fill="none" stroke={c} strokeWidth="1.8" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d={d}/></svg>
          </div>
          <div>
            <div style={{ fontFamily: AS.mono, fontSize: 9.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 2 }}>{l}</div>
            <div style={{ fontFamily: AS.display, fontSize: 24, fontWeight: 800, color: '#FCFCFC', letterSpacing: '-.02em', fontVariantNumeric: 'tabular-nums' }}>{v}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── ScreenAccess ─────────────────────────────────────────────────
const ScreenAccess = ({ onNavigate }) => {
  const NAV_ROUTES = { Home: 'home', Templates: 'templates', Access: 'access' };
  const [users, setUsers] = React.useState(ACCESS_USERS);
  const [loading, setLoading] = React.useState(true);
  const [clientList, setClientList] = React.useState([]);
  const [showInvite, setShowInvite] = React.useState(false);
  const [editUser, setEditUser] = React.useState(null);
  const [filterRole, setFilterRole] = React.useState('all');
  const [filterClient, setFilterClient] = React.useState('all');
  const [search, setSearch] = React.useState('');
  const [toasts, setToasts] = React.useState([]);
  const [sortField, setSortField] = React.useState(null);
  const [sortDir, setSortDir] = React.useState('asc');
  const [selected, setSelected] = React.useState([]);
  const [newMemberId, setNewMemberId] = React.useState(null);
  const [selfPwUser, setSelfPwUser] = React.useState(null);

  const showToast = React.useCallback((msg, type = 'success', onUndo = null) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type, onUndo }]);
    const delay = onUndo ? 5000 : 3000;
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), delay);
    return id;
  }, []);

  // ── Load from Supabase on mount + realtime ─────────────────────
  const _loadUsers = React.useCallback(async () => {
    if (!_ACCESS_SUPA) { setLoading(false); return; }
    const { data } = await _ACCESS_SUPA.from('team_members').select('*').order('joined_at', { ascending: true });
    if (data && data.length) setUsers(data.map(_rowToUser));
    setLoading(false);
  }, []);

  React.useEffect(() => {
    _loadUsers();
    if (!_ACCESS_SUPA) return;
    const ch = _ACCESS_SUPA
      .channel('team_members_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_members' }, _loadUsers)
      .subscribe();
    return () => _ACCESS_SUPA.removeChannel(ch);
  }, [_loadUsers]);

  // ── Load client list from same Supabase source as Home screen ─
  const _loadClients = React.useCallback(async () => {
    if (!_ACCESS_SUPA) {
      const fallback = (window.HOME_CLIENTS || []).map(c => ({ id: c.id, name: c.name, initials: c.initials, grad: c.avatarGrad }));
      setClientList(fallback);
      return;
    }
    const { data } = await _ACCESS_SUPA.from('clients').select('id, name, initials, avatar_grad').order('created_at', { ascending: true });
    if (data && data.length) {
      setClientList(data.map(c => ({
        id: c.id,
        name: c.name,
        initials: c.initials || c.name.slice(0, 2).toUpperCase(),
        grad: c.avatar_grad || 'linear-gradient(135deg,#475569,#334155)',
      })));
    }
  }, []);

  React.useEffect(() => {
    _loadClients();
    if (!_ACCESS_SUPA) return;
    const ch = _ACCESS_SUPA
      .channel('clients_access_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, _loadClients)
      .subscribe();
    return () => _ACCESS_SUPA.removeChannel(ch);
  }, [_loadClients]);

  const clientMap = React.useMemo(
    () => Object.fromEntries(clientList.map(c => [c.id, c])),
    [clientList]
  );

  const filtered = React.useMemo(() => {
    let list = users.filter(u => {
      const matchRole = filterRole === 'all' || u.role === filterRole;
      const matchClient = filterClient === 'all' || u.role === 'owner' || u.clients.includes(filterClient);
      const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
      return matchRole && matchClient && matchSearch;
    });
    if (sortField) {
      list = [...list].sort((a, b) => {
        let va = a[sortField] ?? '';
        let vb = b[sortField] ?? '';
        let cmp;
        if (sortField === 'clients') {
          // Sort by number of clients assigned
          cmp = (Array.isArray(va) ? va.length : 0) - (Array.isArray(vb) ? vb.length : 0);
        } else if (sortField === 'lastActiveRaw') {
          const ta = va ? new Date(va).getTime() : 0;
          const tb = vb ? new Date(vb).getTime() : 0;
          cmp = ta - tb;
        } else {
          cmp = String(va).localeCompare(String(vb), 'id', { numeric: true });
        }
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return list;
  }, [users, filterRole, filterClient, search, sortField, sortDir]);

  // ── CRUD ───────────────────────────────────────────────────────
  const handleRevoke = (user) => {
    if (!confirm(`Hapus akses untuk ${user.name} (${user.email})?\n\nMereka tidak akan bisa login lagi.`)) return;
    setUsers(prev => prev.filter(u => u.id !== user.id));
    setSelected(prev => prev.filter(id => id !== user.id));

    const deleteTimer = setTimeout(async () => {
      if (_ACCESS_SUPA) {
        const { error } = await _ACCESS_SUPA.from('team_members').delete().eq('id', user.id);
        if (error) {
          console.error('[handleRevoke]', error);
          setUsers(prev => [...prev, user]);
          showToast(`Gagal menghapus akses ${user.name}`, 'error');
        }
      }
    }, 5000);

    showToast(`Akses ${user.name} dihapus`, 'undo', () => {
      clearTimeout(deleteTimer);
      setUsers(prev => [...prev, user]);
      showToast(`Akses ${user.name} dipulihkan`);
    });
  };

  const handleLogout = () => {
    sessionStorage.removeItem('avo_role');
    sessionStorage.removeItem('avo_email');
    sessionStorage.removeItem('avo_name');
    window.location.href = 'login.html';
  };

  const handleInvite = async ({ name, email, role, clients, passwordHash }) => {
    const words = name.trim().split(/\s+/);
    const initials = words.length >= 2
      ? (words[0][0] + words[words.length - 1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase();
    const grads = ['linear-gradient(135deg,#4285F4,#00C2B8)','linear-gradient(135deg,#16A34A,#0EA5E9)','linear-gradient(135deg,#F8B400,#E3170A)','linear-gradient(135deg,#7000FF,#4285F4)'];
    const grad = grads[Math.floor(Math.random() * grads.length)];
    // Use crypto random ID to avoid collision
    const uid = 'u-' + Array.from(crypto.getRandomValues(new Uint8Array(8))).map(b => b.toString(16).padStart(2,'0')).join('');
    const newUser = {
      id: uid,
      name, email, role,
      avatar: initials, grad,
      joined_at: new Date().toISOString(),
      last_active: null,
      clients,
      status: 'active',
      password_hash: passwordHash,
      invite_token: null,
    };
    let addedUser;
    if (_ACCESS_SUPA) {
      const { data, error } = await _ACCESS_SUPA.from('team_members').insert(newUser).select().maybeSingle();
      if (error) {
        console.error('[handleInvite]', error);
        return false;
      }
      if (data) { addedUser = _rowToUser(data); setUsers(prev => [...prev, addedUser]); }
    } else {
      addedUser = _rowToUser(newUser);
      setUsers(prev => [...prev, addedUser]);
    }
    if (addedUser) {
      setNewMemberId(addedUser.id);
      setTimeout(() => setNewMemberId(null), 3000);
      showToast(`${name} berhasil ditambahkan`);
      return true;
    }
    return false;
  };

  const handleEditSave = async (userId, { role, clients, passwordHash, grad }) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role, clients, ...(grad ? { grad } : {}) } : u));
    if (_ACCESS_SUPA) {
      const update = { role, clients };
      if (passwordHash) update.password_hash = passwordHash;
      if (grad) update.grad = grad;
      await _ACCESS_SUPA.from('team_members').update(update).eq('id', userId);
    }
    showToast('Perubahan disimpan');
  };

  const handleInlineName = async (userId, newName) => {
    const words = newName.trim().split(/\s+/);
    const initials = words.length >= 2
      ? (words[0][0] + words[words.length - 1][0]).toUpperCase()
      : newName.slice(0, 2).toUpperCase();
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, name: newName, avatar: initials } : u));
    if (_ACCESS_SUPA) {
      await _ACCESS_SUPA.from('team_members').update({ name: newName, avatar: initials }).eq('id', userId);
    }
    showToast('Nama diperbarui');
  };

  // ── Sort ───────────────────────────────────────────────────────
  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  // ── Bulk ───────────────────────────────────────────────────────
  const toggleSelect = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleSelectAll = () => setSelected(prev => prev.length === filtered.length ? [] : filtered.map(u => u.id));
  const handleBulkRevoke = () => {
    const targets = users.filter(u => selected.includes(u.id));
    if (!confirm(`Hapus akses ${targets.length} member sekaligus?`)) return;
    targets.forEach(u => handleRevoke(u));
    setSelected([]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--navy-base)', fontFamily: AS.body, position: 'relative' }}>
      <RFlare intensity={0.15}/>

      {/* Top bar */}
      <header style={{ height: 80, minHeight: 80, background: 'rgba(10,18,34,.9)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--navy-edge)', display: 'flex', alignItems: 'center', padding: '0 28px', gap: 14, position: 'relative', zIndex: 10, flexShrink: 0, boxSizing: 'border-box' }}>
        <img src="assets/logo-mark.png" style={{ width: 62, height: 62 }}/>
        <div>
          <div style={{ fontFamily: AS.display, fontSize: 14, fontWeight: 700, color: '#FCFCFC', letterSpacing: '-.01em' }}>Reportive</div>
          <div style={{ fontFamily: AS.mono, fontSize: 8.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.1em' }}>by Avonetiq</div>
        </div>
        <div style={{ width: 1, height: 20, background: 'var(--navy-edge)' }}/>
        {[['Home',''],['Templates',''],['Access','active']].map(([l, a]) => (
          <div key={l} onClick={() => onNavigate && onNavigate(NAV_ROUTES[l])} style={{ padding: '6px 12px', borderRadius: 7, cursor: 'pointer', background: a ? 'rgba(0,194,184,.1)' : 'transparent', color: a ? '#00C2B8' : 'var(--text-secondary)', fontFamily: AS.display, fontSize: 12.5, fontWeight: a ? 700 : 500 }}>{l}</div>
        ))}
        <div style={{ flex: 1 }}/>
        <button onClick={handleLogout} style={{ padding: '6px 12px', background: 'transparent', border: '1px solid rgba(220,38,38,.35)', borderRadius: 7, color: 'rgba(220,38,38,.7)', fontFamily: AS.display, fontSize: 11.5, fontWeight: 600, cursor: 'pointer', transition: 'all .15s' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,38,38,.1)'; e.currentTarget.style.color = '#DC2626'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(220,38,38,.7)'; }}>
          Sign out
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#00C2B8,#7000FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: AS.display, fontWeight: 700, fontSize: 12, color: '#0C182C' }}>AO</div>
          <div>
            <div style={{ fontFamily: AS.display, fontSize: 12, fontWeight: 600, color: '#FCFCFC' }}>Avonetiq Owner</div>
            <div style={{ fontFamily: AS.mono, fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Owner</div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 32px 48px' }}>

          {/* Page heading */}
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ margin: 0, fontFamily: AS.display, fontSize: 26, fontWeight: 700, color: '#FCFCFC', letterSpacing: '-.02em' }}>Access management</h1>
          </div>

          {/* Summary cards */}
          <SummaryCards users={users}/>

          {/* Main content grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, alignItems: 'flex-start' }}>

            {/* User list */}
            <div>
              {/* Toolbar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                {/* Role filter */}
                <div style={{ display: 'flex', gap: 3, background: 'var(--navy-deep)', borderRadius: 8, padding: 3 }}>
                  {[['all','All'],['editor','Editor'],['viewer','Viewer']].map(([k, l]) => (
                    <button key={k} onClick={() => setFilterRole(k)}
                      style={{ padding: '5px 12px', border: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: AS.display, fontSize: 11.5, fontWeight: 600, background: filterRole === k ? 'var(--navy-elevated)' : 'transparent', color: filterRole === k ? '#FCFCFC' : 'var(--text-muted)', transition: 'background .12s' }}>
                      {l}
                    </button>
                  ))}
                </div>
                <div style={{ flex: 1 }}/>
                {/* Client filter dropdown */}
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: filterClient !== 'all' ? 'rgba(0,194,184,.08)' : 'var(--navy-surface)', border: `1px solid ${filterClient !== 'all' ? 'rgba(0,194,184,.4)' : 'var(--navy-edge)'}`, borderRadius: 8, transition: 'background .12s, border-color .12s' }}>
                  <svg width="12" height="12" fill="none" stroke={filterClient !== 'all' ? '#00C2B8' : 'var(--text-muted)'} strokeWidth="1.8" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M6 12h12M10 18h4"/></svg>
                  <span style={{ fontFamily: AS.mono, fontSize: 9.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.1em' }}>Project</span>
                  <select value={filterClient} onChange={e => setFilterClient(e.target.value)}
                    style={{ border: 'none', background: 'transparent', color: filterClient !== 'all' ? '#00C2B8' : '#FCFCFC', fontFamily: AS.display, fontSize: 11.5, fontWeight: 600, outline: 'none', cursor: 'pointer', appearance: 'none', paddingRight: 16, backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2'><path d='M6 9l6 6 6-6'/></svg>")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right center' }}>
                    <option value="all" style={{ background: '#0C182C' }}>All projects</option>
                    {clientList.map(({ id, name }) => (
                      <option key={id} value={id} style={{ background: '#0C182C' }}>{name}</option>
                    ))}
                  </select>
                  {filterClient !== 'all' && (
                    <button onClick={() => setFilterClient('all')} title="Clear filter" style={{ width: 16, height: 16, border: 'none', borderRadius: 4, background: 'rgba(0,194,184,.18)', color: '#00C2B8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                      <svg width="9" height="9" fill="none" stroke="currentColor" strokeWidth="2.4" viewBox="0 0 24 24" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    </button>
                  )}
                </div>
                {/* Search */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: 'var(--navy-surface)', border: '1px solid var(--navy-edge)', borderRadius: 8, width: 200 }}>
                  <svg width="12" height="12" fill="none" stroke="var(--text-muted)" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search members…"
                    style={{ border: 'none', background: 'transparent', color: '#FCFCFC', fontFamily: AS.body, fontSize: 12, outline: 'none', width: '100%' }}/>
                </div>
              </div>

              {/* Bulk action bar */}
              {selected.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', marginBottom: 8, background: 'rgba(0,194,184,.08)', border: '1px solid rgba(0,194,184,.25)', borderRadius: 9 }}>
                  <span style={{ fontFamily: AS.display, fontSize: 12, fontWeight: 700, color: '#00C2B8' }}>{selected.length} dipilih</span>
                  <div style={{ flex: 1 }}/>
                  <button onClick={() => setSelected([])} style={{ padding: '5px 10px', background: 'transparent', border: '1px solid var(--navy-edge)', borderRadius: 6, color: 'var(--text-muted)', fontFamily: AS.display, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Batal</button>
                  <button onClick={handleBulkRevoke} style={{ padding: '5px 12px', background: 'rgba(220,38,38,.1)', border: '1px solid rgba(220,38,38,.35)', borderRadius: 6, color: '#DC2626', fontFamily: AS.display, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                    Revoke {selected.length} member
                  </button>
                </div>
              )}

              {/* Table */}
              <div style={{ background: 'var(--navy-surface)', border: '1px solid var(--navy-edge)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,.12)' }}>
                {/* Table header */}
                <div style={{ display: 'grid', gridTemplateColumns: '24px 44px 1fr 110px 100px 1fr 180px', gap: 14, padding: '9px 24px', paddingLeft: 14, background: 'var(--navy-deep)', borderBottom: '1px solid var(--navy-edge)', alignItems: 'center' }}>
                  {/* Select all checkbox */}
                  <div onClick={toggleSelectAll} style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${selected.length === filtered.length && filtered.length > 0 ? '#00C2B8' : 'var(--navy-edge)'}`, background: selected.length === filtered.length && filtered.length > 0 ? '#00C2B8' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all .1s' }}>
                    {selected.length === filtered.length && filtered.length > 0 && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#0C182C" strokeWidth="3.5" strokeLinecap="round"><path d="M5 13l4 4L19 7"/></svg>}
                  </div>
                  <div/>
                  {[['name','Member'],['role','Role'],['status','Status'],['clients','Client access'],['lastActiveRaw','Last active']].map(([field, label]) => (
                    <div key={field} onClick={() => handleSort(field)} style={{ fontFamily: AS.mono, fontSize: 9.5, fontWeight: 600, color: sortField === field ? '#00C2B8' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.1em', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, userSelect: 'none' }}>
                      {label}
                      {sortField === field && <svg width="8" height="8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d={sortDir === 'asc' ? 'M18 15l-6-6-6 6' : 'M6 9l6 6 6-6'}/></svg>}
                    </div>
                  ))}
                </div>

                {filtered.map((u, i) => (
                  <UserRow key={u.id} user={u} idx={i}
                    isSelf={u.email === _CURRENT_EMAIL}
                    isNew={u.id === newMemberId}
                    isSelected={selected.includes(u.id)}
                    onToggleSelect={toggleSelect}
                    onEditRole={setEditUser}
                    onRevoke={handleRevoke}
                    clientMap={clientMap}
                    onEditName={handleInlineName}
                    onChangePassword={() => setSelfPwUser(u)}/>
                ))}

                {filtered.length === 0 && (
                  <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--text-muted)', fontFamily: AS.body, fontSize: 13 }}>No members match your filter.</div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <RolesCard/>

              {/* Quick invite */}
              <div style={{ background: 'linear-gradient(135deg,rgba(0,194,184,.08),rgba(248,180,0,.04))', border: '1px solid rgba(0,194,184,.2)', borderRadius: 14, padding: '18px 20px' }}>
                <div style={{ fontFamily: AS.display, fontSize: 14, fontWeight: 700, color: '#FCFCFC', marginBottom: 6 }}>Invite a teammate</div>
                <div style={{ fontFamily: AS.body, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 14 }}>Add colleagues as Editors to collaborate on client reports.</div>
                <button onClick={() => setShowInvite(true)} style={{ width: '100%', padding: '9px 0', background: 'linear-gradient(135deg,#00C2B8,#009E96)', border: 'none', borderRadius: 8, color: '#0C182C', fontFamily: AS.display, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(0,194,184,.2)' }}>
                  + Invite member
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showInvite && <InviteModal onClose={() => setShowInvite(false)} onInvite={handleInvite} clientList={clientList}/>}
      {editUser && <EditRoleModal user={editUser} onClose={() => setEditUser(null)} onSave={handleEditSave} clientList={clientList}/>}
      {selfPwUser && <SelfPasswordModal user={selfPwUser} onClose={() => setSelfPwUser(null)}/>}

      {/* Toast notifications */}
      <ToastContainer toasts={toasts}/>

      <style>{`
        @keyframes rowGlow {
          0%   { box-shadow: inset 0 0 0 1px rgba(0,194,184,.6), background: rgba(0,194,184,.12); }
          100% { box-shadow: none; }
        }
      `}</style>
    </div>
  );
};

Object.assign(window, { ScreenAccess });
