// Reportive — Access Management screen
// User & admin management: roles, permissions, invite, revoke.
// Loaded as an artboard on the design canvas.

const ACCESS_USERS = [
  { id: 'u1', name: 'Rizki Anindita', email: 'rizki.anindita@avonetiq.id', role: 'admin', avatar: 'RA', grad: 'linear-gradient(135deg,#00C2B8,#7000FF)', joined: '12 Jan 2026', lastActive: 'Just now', clients: ['kopi-senja','batik-nusa','tekno-pintar','properti-indah','herbal-nusa','resto-archipelago'], status: 'active' },
  { id: 'u2', name: 'Sinta Maharani', email: 'sinta.maharani@avonetiq.id', role: 'editor', avatar: 'SM', grad: 'linear-gradient(135deg,#F8B400,#E3170A)', joined: '3 Feb 2026', lastActive: '2 hr ago', clients: ['kopi-senja','batik-nusa'], status: 'active' },
  { id: 'u3', name: 'Budi Hartono', email: 'budi.hartono@avonetiq.id', role: 'editor', avatar: 'BH', grad: 'linear-gradient(135deg,#4285F4,#00C2B8)', joined: '17 Feb 2026', lastActive: 'Yesterday', clients: ['tekno-pintar','herbal-nusa'], status: 'active' },
  { id: 'u4', name: 'Dimas Pratama', email: 'dimas@kopisenja.id', role: 'viewer', avatar: 'DP', grad: 'linear-gradient(135deg,#00C2B8,#16A34A)', joined: '1 Mar 2026', lastActive: '5 days ago', clients: ['kopi-senja'], status: 'active', isClient: true },
  { id: 'u5', name: 'Laila Putri', email: 'laila.putri@avonetiq.id', role: 'editor', avatar: 'LP', grad: 'linear-gradient(135deg,#7000FF,#4285F4)', joined: '20 Mar 2026', lastActive: '3 hr ago', clients: ['properti-indah','resto-archipelago'], status: 'active' },
  { id: 'u6', name: 'Andi Kurniawan', email: 'andi@teknopintar.id', role: 'viewer', avatar: 'AK', grad: 'linear-gradient(135deg,#4285F4,#00C2B8)', joined: '5 Apr 2026', lastActive: '12 days ago', clients: ['tekno-pintar'], status: 'pending', isClient: true },
  { id: 'u7', name: 'Hendra Wijaya', email: 'hendra@archipelago.id', role: 'viewer', avatar: 'HW', grad: 'linear-gradient(135deg,#E3170A,#F8B400)', joined: '10 Apr 2026', lastActive: 'Never', clients: ['resto-archipelago'], status: 'pending', isClient: true },
];

const ROLES = {
  admin:  { label: 'Admin',  color: '#00C2B8', desc: 'Full access — manage users, clients, all reports' },
  editor: { label: 'Editor', color: '#F8B400', desc: 'Create & edit reports for assigned clients' },
  viewer: { label: 'Viewer', color: '#7000FF', desc: 'Read-only access to assigned client reports' },
};

const CLIENT_NAMES = {
  'kopi-senja': 'PT Kopi Senja',
  'batik-nusa': 'CV Batik Nusa',
  'tekno-pintar': 'PT Teknologi Pintar',
  'properti-indah': 'PT Properti Indah',
  'herbal-nusa': 'CV Herbal Nusa',
  'resto-archipelago': 'Resto Archipelago',
};

// Per-client visual identity (mirrors Home avatar gradients) ──────
const CLIENT_VIS = {
  'kopi-senja':        { initials: 'KS', grad: 'linear-gradient(135deg,#F8B400,#E3170A)' },
  'batik-nusa':        { initials: 'BN', grad: 'linear-gradient(135deg,#7000FF,#4285F4)' },
  'tekno-pintar':      { initials: 'TP', grad: 'linear-gradient(135deg,#4285F4,#00C2B8)' },
  'properti-indah':    { initials: 'PI', grad: 'linear-gradient(135deg,#00C2B8,#16A34A)' },
  'herbal-nusa':       { initials: 'HN', grad: 'linear-gradient(135deg,#16A34A,#F8B400)' },
  'resto-archipelago': { initials: 'RA', grad: 'linear-gradient(135deg,#E3170A,#F8B400)' },
};

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

// ─── Invite Modal ─────────────────────────────────────────────────
const InviteModal = ({ onClose }) => {
  const [email, setEmail] = React.useState('');
  const [role, setRole] = React.useState('editor');
  const [clients, setClients] = React.useState([]);

  const toggleClient = (id) => setClients(c => c.includes(id) ? c.filter(x => x !== id) : [...c, id]);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(5,10,22,.75)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width: 520, background: 'rgba(14,24,42,.98)', border: '1px solid var(--navy-edge)', borderRadius: 16, boxShadow: '0 40px 100px rgba(0,0,0,.6), 0 0 0 1px rgba(0,194,184,.1)', overflow: 'hidden' }}>

        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--navy-edge)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: AS.display, fontSize: 16, fontWeight: 700, color: '#FCFCFC' }}>Invite member</div>
            <div style={{ fontFamily: AS.body, fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>Send an invite link via email</div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, border: 'none', background: 'var(--navy-elevated)', borderRadius: 7, color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>

        <div style={{ padding: '20px 24px' }}>
          {/* Email */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: AS.mono, fontSize: 9.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 6 }}>Email address</div>
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="colleague@avonetiq.id"
              style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', background: 'var(--navy-elevated)', border: '1px solid var(--navy-edge)', borderRadius: 7, color: '#FCFCFC', fontFamily: AS.body, fontSize: 12.5, outline: 'none' }}/>
          </div>

          {/* Role */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: AS.mono, fontSize: 9.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 8 }}>Role</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {Object.entries(ROLES).map(([k, r]) => (
                <div key={k} onClick={() => setRole(k)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', border: `1px solid ${role === k ? r.color + '66' : 'var(--navy-edge)'}`, borderRadius: 8, background: role === k ? `${r.color}0F` : 'var(--navy-surface)', cursor: 'pointer', transition: 'all .15s' }}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${role === k ? r.color : 'var(--navy-edge)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {role === k && <div style={{ width: 7, height: 7, borderRadius: '50%', background: r.color }}/>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: AS.display, fontSize: 12.5, fontWeight: 700, color: '#FCFCFC' }}>{r.label}</div>
                    <div style={{ fontFamily: AS.body, fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{r.desc}</div>
                  </div>
                  <RoleBadge role={k}/>
                </div>
              ))}
            </div>
          </div>

          {/* Client access */}
          {role !== 'admin' && (
            <div>
              <div style={{ fontFamily: AS.mono, fontSize: 9.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 8 }}>Client access</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {Object.entries(CLIENT_NAMES).map(([id, name]) => {
                  const on = clients.includes(id);
                  return (
                    <button key={id} onClick={() => toggleClient(id)}
                      style={{ padding: '5px 10px', border: `1px solid ${on ? 'rgba(0,194,184,.5)' : 'var(--navy-edge)'}`, borderRadius: 6, background: on ? 'rgba(0,194,184,.1)' : 'var(--navy-elevated)', color: on ? '#00C2B8' : 'var(--text-muted)', fontFamily: AS.display, fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all .12s' }}>
                      {name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--navy-edge)', display: 'flex', gap: 8, background: 'rgba(10,18,34,.5)' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '9px 0', background: 'var(--navy-elevated)', border: '1px solid var(--navy-edge)', borderRadius: 8, color: 'var(--text-secondary)', fontFamily: AS.display, fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          <button style={{ flex: 2, padding: '9px 0', background: 'linear-gradient(135deg,#00C2B8,#009E96)', border: 'none', borderRadius: 8, color: '#0C182C', fontFamily: AS.display, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(0,194,184,.25)' }}>Send invite</button>
        </div>
      </div>
    </div>
  );
};

// ─── Edit Role Modal ──────────────────────────────────────────────
const EditRoleModal = ({ user, onClose }) => {
  const [role, setRole] = React.useState(user.role);
  const [clients, setClients] = React.useState([...user.clients]);
  const toggleClient = (id) => setClients(c => c.includes(id) ? c.filter(x => x !== id) : [...c, id]);

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

        <div style={{ padding: '18px 24px' }}>
          <div style={{ fontFamily: AS.mono, fontSize: 9.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 8 }}>Role</div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
            {Object.entries(ROLES).map(([k, r]) => (
              <button key={k} onClick={() => setRole(k)}
                style={{ flex: 1, padding: '8px 4px', border: `1.5px solid ${role === k ? r.color : 'var(--navy-edge)'}`, borderRadius: 8, background: role === k ? `${r.color}14` : 'var(--navy-surface)', color: role === k ? r.color : 'var(--text-muted)', fontFamily: AS.display, fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all .12s' }}>
                {r.label}
              </button>
            ))}
          </div>

          {role !== 'admin' && (
            <>
              <div style={{ fontFamily: AS.mono, fontSize: 9.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 8 }}>Client access</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {Object.entries(CLIENT_NAMES).map(([id, name]) => {
                  const on = clients.includes(id);
                  return (
                    <button key={id} onClick={() => toggleClient(id)}
                      style={{ padding: '5px 10px', border: `1px solid ${on ? 'rgba(0,194,184,.5)' : 'var(--navy-edge)'}`, borderRadius: 6, background: on ? 'rgba(0,194,184,.1)' : 'var(--navy-elevated)', color: on ? '#00C2B8' : 'var(--text-muted)', fontFamily: AS.display, fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all .12s' }}>
                      {name}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--navy-edge)', display: 'flex', gap: 8, background: 'rgba(10,18,34,.5)' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '9px 0', background: 'var(--navy-elevated)', border: '1px solid var(--navy-edge)', borderRadius: 8, color: 'var(--text-secondary)', fontFamily: AS.display, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          <button onClick={onClose} style={{ flex: 2, padding: '9px 0', background: 'linear-gradient(135deg,#00C2B8,#009E96)', border: 'none', borderRadius: 8, color: '#0C182C', fontFamily: AS.display, fontSize: 12, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(0,194,184,.25)' }}>Save changes</button>
        </div>
      </div>
    </div>
  );
};

// ─── Client access cell — stacked avatars + count, hover for full list
const ClientAccessCell = ({ user }) => {
  const [open, setOpen] = React.useState(false);

  if (user.role === 'admin') {
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
  const visible = ids.slice(0, 3);
  const overflow = ids.length - visible.length;

  return (
    <div
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative', cursor: ids.length > 0 ? 'default' : 'default' }}>

      {/* Avatar stack */}
      <div style={{ display: 'flex' }}>
        {visible.map((id, i) => {
          const v = CLIENT_VIS[id] || { initials: '??', grad: 'linear-gradient(135deg,#475569,#334155)' };
          return (
            <div key={id}
              title={CLIENT_NAMES[id]}
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
            const v = CLIENT_VIS[id] || { initials: '??', grad: 'linear-gradient(135deg,#475569,#334155)' };
            return (
              <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 18, height: 18, borderRadius: 5, background: v.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: AS.display, fontWeight: 800, fontSize: 8, color: '#0C182C', flexShrink: 0 }}>
                  {v.initials}
                </div>
                <span style={{ fontFamily: AS.display, fontSize: 11.5, color: '#FCFCFC', fontWeight: 600 }}>{CLIENT_NAMES[id]}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── User Row ─────────────────────────────────────────────────────
const UserRow = ({ user, idx, onEditRole, onRevoke, isSelf }) => {
  const [hovered, setHovered] = React.useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ borderTop: `1px solid ${idx === 0 ? 'var(--navy-edge)' : 'rgba(51,71,102,.4)'}`, background: hovered ? 'rgba(36,51,80,.25)' : 'transparent', transition: 'background .15s', position: 'relative' }}>

      {/* Teal accent — hover only (matches Home) */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, background: 'var(--avo-teal)', opacity: hovered ? 1 : 0, transition: 'opacity .15s' }}/>

      <div style={{ display: 'grid', gridTemplateColumns: '44px 1fr 110px 100px 1fr 180px', alignItems: 'center', gap: 14, padding: '14px 24px', paddingLeft: 30 }}>

        {/* Avatar */}
        <div style={{ position: 'relative' }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: user.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: AS.display, fontWeight: 800, fontSize: 13, color: '#0C182C' }}>
            {user.avatar}
          </div>
          {/* External-client indicator removed per design request */}
        </div>

        {/* Name + email */}
        <div>
          <div style={{ fontFamily: AS.display, fontSize: 13.5, fontWeight: 700, color: '#FCFCFC', display: 'flex', alignItems: 'center', gap: 6 }}>
            {user.name}
            {isSelf && <span style={{ fontFamily: AS.mono, fontSize: 9, color: 'var(--avo-teal)', background: 'rgba(0,194,184,.1)', padding: '1px 6px', borderRadius: 3, letterSpacing: '.08em' }}>YOU</span>}
          </div>
          <div style={{ fontFamily: AS.mono, fontSize: 10.5, color: 'var(--text-muted)', marginTop: 2 }}>{user.email}</div>
        </div>

        {/* Role */}
        <div><RoleBadge role={user.role}/></div>

        {/* Status */}
        <div><StatusDot status={user.status}/></div>

        {/* Client access — compact: avatar stack + count, full list on hover */}
        <ClientAccessCell user={user}/>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
          <div style={{ fontFamily: AS.mono, fontSize: 10, color: 'var(--text-muted)', marginRight: 4, whiteSpace: 'nowrap' }}>{user.lastActive}</div>
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
    ['Admins & editors', users.filter(u => u.role !== 'viewer').length, '#F8B400', 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'],
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
const ScreenAccess = () => {
  const [users, setUsers] = React.useState(ACCESS_USERS);
  const [showInvite, setShowInvite] = React.useState(false);
  const [editUser, setEditUser] = React.useState(null);
  const [filterRole, setFilterRole] = React.useState('all');
  const [filterClient, setFilterClient] = React.useState('all');
  const [search, setSearch] = React.useState('');

  const filtered = users.filter(u => {
    const matchRole = filterRole === 'all' || u.role === filterRole;
    const matchClient = filterClient === 'all' || u.role === 'admin' || u.clients.includes(filterClient);
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchClient && matchSearch;
  });

  const handleRevoke = (user) => setUsers(prev => prev.filter(u => u.id !== user.id));

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
          <div key={l} style={{ padding: '6px 12px', borderRadius: 7, cursor: 'pointer', background: a ? 'rgba(0,194,184,.1)' : 'transparent', color: a ? '#00C2B8' : 'var(--text-secondary)', fontFamily: AS.display, fontSize: 12.5, fontWeight: a ? 700 : 500 }}>{l}</div>
        ))}
        <div style={{ flex: 1 }}/>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#00C2B8,#7000FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: AS.display, fontWeight: 700, fontSize: 12, color: '#0C182C' }}>RA</div>
          <div>
            <div style={{ fontFamily: AS.display, fontSize: 12, fontWeight: 600, color: '#FCFCFC' }}>Rizki Anindita</div>
            <div style={{ fontFamily: AS.mono, fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Admin</div>
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
                  {[['all','All'],['admin','Admin'],['editor','Editor'],['viewer','Viewer']].map(([k, l]) => (
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
                    {Object.entries(CLIENT_NAMES).map(([id, name]) => (
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

              {/* Table */}
              <div style={{ background: 'var(--navy-surface)', border: '1px solid var(--navy-edge)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,.12)' }}>
                {/* Table header */}
                <div style={{ display: 'grid', gridTemplateColumns: '44px 1fr 110px 100px 1fr 180px', gap: 14, padding: '9px 24px', background: 'var(--navy-deep)', borderBottom: '1px solid var(--navy-edge)' }}>
                  {['','Member','Role','Status','Client access','Last active'].map((h, i) => (
                    <div key={i} style={{ fontFamily: AS.mono, fontSize: 9.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.1em' }}>{h}</div>
                  ))}
                </div>

                {filtered.map((u, i) => (
                  <UserRow key={u.id} user={u} idx={i} isSelf={u.id === 'u1'} onEditRole={setEditUser} onRevoke={handleRevoke}/>
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
      {showInvite && <InviteModal onClose={() => setShowInvite(false)}/>}
      {editUser && <EditRoleModal user={editUser} onClose={() => setEditUser(null)}/>}
    </div>
  );
};

Object.assign(window, { ScreenAccess });
