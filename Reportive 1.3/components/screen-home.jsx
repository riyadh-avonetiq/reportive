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
  alert: { type: 'warning', msg: 'Budget 92% terpakai' },
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


// ─── shared micro styles ───────────────────────────────────────────
const HS = {
  display: 'var(--font-display)',
  body: 'var(--font-body)',
  mono: 'var(--font-mono)'
};

// ─── New Report Modal ─────────────────────────────────────────────
const NewReportModal = ({ onClose, onCreate }) => {
  const [form, setForm] = React.useState({
    clientName: '',
    url: '',
    sources: {
      google: false,
      search: false,
      ga4: false,
      meta: false
    }
  });
  const [step, setStep] = React.useState(1); // 1: basic, 2: configure

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleSource = (src) => setForm(f => ({ ...f, sources: { ...f.sources, [src]: !f.sources[src] } }));

  const SOURCES = [
    { id: 'google', label: 'Google Ads', desc: 'Search, Display & Video campaigns', color: '#4285F4', icon: 'M21.6 12.23c0-.78-.07-1.53-.2-2.25H12v4.26h5.38a4.6 4.6 0 01-2 3.02v2.51h3.24c1.9-1.75 2.99-4.33 2.99-7.54z M12 22c2.7 0 4.96-.9 6.62-2.43l-3.24-2.51c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H3.07v2.59A10 10 0 0012 22z M6.41 13.9a6 6 0 010-3.8V7.51H3.07a10 10 0 000 8.98l3.34-2.6z M12 5.98c1.47 0 2.78.5 3.82 1.5l2.86-2.87A10 10 0 003.07 7.51l3.34 2.6C7.2 7.74 9.4 5.98 12 5.98z' },
    { id: 'search', label: 'Google Search Console', desc: 'Organic search performance & keywords', color: '#00C2B8', icon: 'M10 3a7 7 0 100 14 7 7 0 000-14zM21 21l-4.35-4.35' },
    { id: 'ga4', label: 'Google Analytics 4', desc: 'Website traffic, conversions & events', color: '#F9AB00', icon: 'M17 3a2 2 0 012 2v14a2 2 0 01-4 0V5a2 2 0 012-2z M11 11a2 2 0 012 2v6a2 2 0 01-4 0v-6a2 2 0 012-2z M5 19a2 2 0 110-4 2 2 0 010 4z' },
    { id: 'meta', label: 'Meta Ads', desc: 'Facebook & Instagram advertising', color: '#0866FF', icon: 'M12 2a10 10 0 00-1.56 19.88v-7H8v-3h2.44V9.75c0-2.42 1.44-3.75 3.65-3.75 1.06 0 2.16.19 2.16.19v2.38h-1.22c-1.2 0-1.57.75-1.57 1.51V12h2.67l-.43 3h-2.24v7A10 10 0 0012 2z' }
  ];

  const canCreate = form.clientName.trim().length > 0;
  const sourcesSelected = Object.values(form.sources).filter(Boolean).length;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,.92)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
    onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ width: '100%', maxWidth: 700, background: 'rgba(14,24,42,.99)', border: '1px solid var(--navy-edge)', borderRadius: 20, boxShadow: '0 60px 140px rgba(0,0,0,.8), 0 0 0 1px rgba(0,194,184,.2)', overflow: 'hidden' }}>

        {/* Header with gradient */}
        <div style={{ padding: '32px 40px', background: 'linear-gradient(135deg,rgba(0,194,184,.08),rgba(112,0,255,.04))', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: HS.display, fontSize: 24, fontWeight: 800, color: '#FCFCFC', letterSpacing: '-.02em', marginBottom: 6 }}>Create New Report</div>
            <div style={{ fontFamily: HS.body, fontSize: 13, color: 'var(--text-muted)' }}>
              {step === 1 ? 'Enter client information to get started' : 'Select data sources to connect'}
            </div>
          </div>
          <button onClick={(e) => { e.stopPropagation(); onClose(); }} style={{ width: 36, height: 36, border: 'none', background: 'rgba(0,194,184,.1)', borderRadius: 10, color: '#00C2B8', cursor: 'pointer', fontSize: 22, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .15s' }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,194,184,.15)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,194,184,.1)'}>×</button>
        </div>

        {/* Body */}
        <div style={{ padding: '32px 40px', overflow: 'auto', maxHeight: 'calc(100vh - 220px)' }}>

          {step === 1 ? (
            <>
              {/* Client name - Required */}
              <div style={{ marginBottom: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                  <label style={{ fontFamily: HS.display, fontSize: 13, fontWeight: 700, color: '#FCFCFC' }}>Client Name</label>
                  <span style={{ fontFamily: HS.mono, fontSize: 9, color: '#DC2626', fontWeight: 700 }}>Required</span>
                </div>
                <input 
                  value={form.clientName} 
                  onChange={(e) => set('clientName', e.target.value)}
                  placeholder="e.g. PT Kopi Senja Nusantara"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '14px 16px', background: 'var(--navy-elevated)', border: `1.5px solid ${form.clientName ? 'rgba(0,194,184,.5)' : 'var(--navy-edge)'}`, borderRadius: 12, color: '#FCFCFC', fontFamily: HS.body, fontSize: 14, outline: 'none', transition: 'border-color .15s, box-shadow .15s', boxShadow: form.clientName ? '0 0 0 3px rgba(0,194,184,.1)' : 'none' }}
                  onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(0,194,184,.5)'}
                  onBlur={(e) => e.currentTarget.style.borderColor = form.clientName ? 'rgba(0,194,184,.5)' : 'var(--navy-edge)'}
                />
              </div>

              {/* Website URL - Optional */}
              <div style={{ marginBottom: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                  <label style={{ fontFamily: HS.display, fontSize: 13, fontWeight: 700, color: '#FCFCFC' }}>Website URL</label>
                  <span style={{ fontFamily: HS.mono, fontSize: 9, color: 'var(--text-muted)' }}>Optional</span>
                </div>
                <input 
                  value={form.url} 
                  onChange={(e) => set('url', e.target.value)}
                  placeholder="example.com"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '14px 16px', background: 'var(--navy-elevated)', border: '1.5px solid var(--navy-edge)', borderRadius: 12, color: '#FCFCFC', fontFamily: HS.mono, fontSize: 13, outline: 'none', transition: 'border-color .15s' }}
                  onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(0,194,184,.4)'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--navy-edge)'}
                />
              </div>
            </>
          ) : (
            <>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: HS.display, fontSize: 13, fontWeight: 700, color: '#FCFCFC', marginBottom: 12 }}>Connect Data Sources</div>
                <div style={{ fontFamily: HS.body, fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.6 }}>Select the marketing platforms and analytics tools to connect. You can configure more sources later.</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {SOURCES.map(src => (
                  <label key={src.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '16px 18px', background: form.sources[src.id] ? `${src.color}12` : 'var(--navy-deep)', border: `1.5px solid ${form.sources[src.id] ? src.color + '55' : 'var(--navy-edge)'}`, borderRadius: 12, cursor: 'pointer', transition: 'all .15s' }}>
                    <input 
                      type="checkbox" 
                      checked={form.sources[src.id]} 
                      onChange={() => toggleSource(src.id)}
                      style={{ width: 20, height: 20, cursor: 'pointer', accentColor: src.color, marginTop: 2, flexShrink: 0 }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: HS.display, fontSize: 13, fontWeight: 700, color: '#FCFCFC', marginBottom: 3 }}>{src.label}</div>
                      <div style={{ fontFamily: HS.body, fontSize: 12, color: 'var(--text-muted)' }}>{src.desc}</div>
                    </div>
                    <div style={{ width: 32, height: 32, background: `${src.color}18`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill={src.color}><path d={src.icon}/></svg>
                    </div>
                  </label>
                ))}
              </div>

              <div style={{ marginTop: 24, padding: '16px', background: 'rgba(0,194,184,.08)', border: '1px solid rgba(0,194,184,.2)', borderRadius: 10 }}>
                <div style={{ fontFamily: HS.mono, fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>Selected</div>
                <div style={{ fontFamily: HS.display, fontSize: 18, fontWeight: 800, color: '#00C2B8' }}>{sourcesSelected} {sourcesSelected === 1 ? 'source' : 'sources'}</div>
              </div>
            </>
          )}

        </div>

        {/* Footer */}
        <div style={{ padding: '20px 40px', display: 'flex', gap: 12, background: 'rgba(10,18,34,.6)' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '12px 0', background: 'var(--navy-elevated)', border: '1px solid var(--navy-edge)', borderRadius: 10, color: 'var(--text-secondary)', fontFamily: HS.display, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all .15s' }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(148,163,184,.3)'}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--navy-edge)'}>
            {step === 2 ? 'Back' : 'Cancel'}
          </button>
          {step === 1 ? (
            <button onClick={() => setStep(2)} 
            style={{ flex: 2, padding: '12px 0', background: canCreate ? 'linear-gradient(135deg,#00C2B8,#009E96)' : 'rgba(0,194,184,.2)', border: 'none', borderRadius: 10, color: canCreate ? '#0C182C' : 'rgba(0,194,184,.4)', fontFamily: HS.display, fontSize: 13, fontWeight: 700, cursor: canCreate ? 'pointer' : 'not-allowed', boxShadow: canCreate ? '0 4px 14px rgba(0,194,184,.25)' : 'none', transition: 'all .15s' }}>
              Continue to Data Sources
            </button>
          ) : (
            <button onClick={() => { if (canCreate) { onCreate(form); onClose(); } }} 
            style={{ flex: 2, padding: '12px 0', background: canCreate ? 'linear-gradient(135deg,#00C2B8,#009E96)' : 'rgba(0,194,184,.2)', border: 'none', borderRadius: 10, color: canCreate ? '#0C182C' : 'rgba(0,194,184,.4)', fontFamily: HS.display, fontSize: 13, fontWeight: 700, cursor: canCreate ? 'pointer' : 'not-allowed', boxShadow: canCreate ? '0 4px 14px rgba(0,194,184,.25)' : 'none', transition: 'all .15s' }}>
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
      <div style={{ fontFamily: HS.mono, fontSize: 9.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 6 }}>{label}</div>
      {textarea ?
    <textarea value={form[k]} onChange={(e) => set(k, e.target.value)} rows={3} placeholder={placeholder}
    style={{ width: '100%', boxSizing: 'border-box', padding: '9px 11px', background: 'var(--navy-elevated)', border: '1px solid var(--navy-edge)', borderRadius: 7, color: '#FCFCFC', fontFamily: HS.body, fontSize: 12.5, outline: 'none', resize: 'vertical', lineHeight: 1.5 }} /> :
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
            <div style={{ fontFamily: HS.body, fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>Update logo, name, and client information</div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, border: 'none', background: 'var(--navy-elevated)', borderRadius: 7, color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', overflow: 'auto', maxHeight: '65vh' }}>

          {/* Logo upload */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: HS.mono, fontSize: 9.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 8 }}>Client logo</div>
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
                    <div style={{ fontFamily: HS.display, fontSize: 12.5, fontWeight: 600, color: '#FCFCFC' }}>Upload logo</div>
                    <div style={{ fontFamily: HS.body, fontSize: 10.5, color: 'var(--text-muted)', marginTop: 1 }}>PNG, SVG, JPG · max 2 MB</div>
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
          <button onClick={onClose} style={{ flex: 1, padding: '9px 0', background: 'var(--navy-elevated)', border: '1px solid var(--navy-edge)', borderRadius: 8, color: 'var(--text-secondary)', fontFamily: HS.display, fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          <button onClick={() => {onSave(form);onClose();}} style={{ flex: 2, padding: '9px 0', background: 'linear-gradient(135deg,#00C2B8,#009E96)', border: 'none', borderRadius: 8, color: '#0C182C', fontFamily: HS.display, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(0,194,184,.25)' }}>Save changes</button>
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


const ConfigurePanel = ({ client, onClose }) => {
  const [connected, setConnected] = React.useState({ ...client.connected });
  const [connecting, setConnecting] = React.useState(null);

  const toggle = (id) => {
    if (connecting) return;
    if (!connected[id]) {
      setConnecting(id);
      setTimeout(() => {
        setConnected((c) => ({ ...c, [id]: true }));
        setConnecting(null);
      }, 1400);
    } else {
      setConnected((c) => ({ ...c, [id]: false }));
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(5,10,22,.7)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ width: 560, background: 'rgba(14,24,42,.98)', border: '1px solid var(--navy-edge)', borderRadius: 16, boxShadow: '0 40px 100px rgba(0,0,0,.6), 0 0 0 1px rgba(0,194,184,.1)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--navy-edge)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: client.avatarGrad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: HS.display, fontWeight: 800, fontSize: 14, color: '#0C182C' }}>{client.initials}</div>
            <div>
              <div style={{ fontFamily: HS.display, fontSize: 15, fontWeight: 700, color: '#FCFCFC', letterSpacing: '-.01em' }}>Configure · {client.name}</div>
              <div style={{ fontFamily: HS.body, fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>Connect or manage data sources for this client</div>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, border: 'none', background: 'var(--navy-elevated)', borderRadius: 7, color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>

        {/* Sources */}
        <div style={{ padding: '20px 24px' }}>
          <div style={{ fontFamily: HS.mono, fontSize: 9.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 14 }}>Data sources</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {SOURCES_DEF.map((src) => {
              const isOn = connected[src.id];
              const isConnecting = connecting === src.id;
              return (
                <div key={src.id} style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                  background: isOn ? 'rgba(0,194,184,.05)' : 'var(--navy-surface)',
                  border: `1px solid ${isOn ? 'rgba(0,194,184,.3)' : 'var(--navy-edge)'}`,
                  borderRadius: 11, transition: 'border-color .2s, background .2s'
                }}>
                  {/* Icon */}
                  <div style={{ width: 40, height: 40, background: 'var(--navy-elevated)', border: '1px solid var(--navy-edge)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="22" height="22" viewBox="0 0 24 24">{src.icon}</svg>
                  </div>
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: HS.display, fontSize: 13.5, fontWeight: 700, color: '#FCFCFC' }}>{src.label}</div>
                    {isOn && (
                      <>
                        <div style={{ fontFamily: HS.mono, fontSize: 10.5, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.5 }}>
                          {src.needsUrl ? 'https://kopisenja.id' : (
                            src.id === 'google' ? <>Kopi Senja Ads · <span style={{ color: 'var(--text-muted)' }}>CID 472-389-1056</span></> :
                            src.id === 'meta' ? <>Kopi Senja Nusantara · <span style={{ color: 'var(--text-muted)' }}>act_8829473162</span></> :
                            src.id === 'ga4' ? 'GA4 - Kopi Senja (G-X9K2P4)' :
                            src.id === 'search' ? 'sc-domain:kopisenja.id' : ''
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5 }}>
                          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#16A34A' }} />
                          <span style={{ fontFamily: HS.mono, fontSize: 9.5, color: '#16A34A', letterSpacing: '.08em' }}>CONNECTED</span>
                        </div>
                      </>
                    )}
                  </div>
                  {/* Action */}
                  <button onClick={() => toggle(src.id)}
                  disabled={isConnecting}
                  style={{
                    padding: '7px 16px', borderRadius: 8, cursor: isConnecting ? 'default' : 'pointer',
                    border: isOn ? `1px solid rgba(220,38,38,.4)` : `1px solid rgba(0,194,184,.55)`,
                    background: isOn ? 'rgba(220,38,38,.1)' : 'rgba(0,194,184,.12)',
                    color: isOn ? '#DC2626' : '#00C2B8',
                    fontFamily: HS.display, fontSize: 12, fontWeight: 700,
                    transition: 'all .15s', flexShrink: 0,
                    opacity: isConnecting ? .7 : 1,
                    display: 'flex', alignItems: 'center', gap: 6, minWidth: 110, justifyContent: 'center'
                  }}>
                    {isConnecting ?
                    <>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 1s linear infinite' }}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" /></svg>
                        Connecting…
                      </> :
                    isOn ?
                    <>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                        Disconnect
                      </> :

                    <>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" /></svg>
                        Connect
                      </>
                    }
                  </button>
                </div>);

            })}
          </div>

          {/* Sync settings note */}
          <div style={{ marginTop: 16, padding: '12px 14px', background: 'rgba(0,194,184,.06)', border: '1px solid rgba(0,194,184,.18)', borderRadius: 9, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <svg width="14" height="14" fill="none" stroke="#00C2B8" strokeWidth="1.8" viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
            <div style={{ fontFamily: HS.body, fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Koneksi baru akan langsung menarik data historis 90 hari ke belakang. Pastikan akun memiliki akses <b style={{ color: '#FCFCFC' }}>read-only</b> sebelum melanjutkan.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--navy-edge)', display: 'flex', justifyContent: 'flex-end', background: 'rgba(10,18,34,.5)' }}>
          <button onClick={onClose} style={{ padding: '9px 24px', background: 'linear-gradient(135deg,#00C2B8,#009E96)', border: 'none', borderRadius: 8, color: '#0C182C', fontFamily: HS.display, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(0,194,184,.25)' }}>Done</button>
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
      <p style={{ fontFamily: HS.body, fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.55, margin: '0 0 20px' }}>
        <b style={{ color: '#FCFCFC' }}>{client.name}</b> dan seluruh konfigurasi data source-nya akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
      </p>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onClose} style={{ flex: 1, padding: '9px 0', background: 'var(--navy-elevated)', border: '1px solid var(--navy-edge)', borderRadius: 8, color: 'var(--text-secondary)', fontFamily: HS.display, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
        <button onClick={() => {onConfirm(client.id);onClose();}} style={{ flex: 1, padding: '9px 0', background: 'rgba(220,38,38,.9)', border: 'none', borderRadius: 8, color: '#fff', fontFamily: HS.display, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Yes, delete</button>
      </div>
    </div>
  </div>;



// ─── Quick Rename Modal ───────────────────────────────────────────
const QuickRenameModal = ({ client, onSave, onClose }) => {
  const [name, setName] = React.useState(client.name);
  const [industry, setIndustry] = React.useState(client.industry);
  const ref = React.useRef(null);
  React.useEffect(() => {ref.current && ref.current.focus();}, []);
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(5,10,22,.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ width: 420, background: 'rgba(14,24,42,.98)', border: '1px solid var(--navy-edge)', borderRadius: 14, boxShadow: '0 32px 80px rgba(0,0,0,.55), 0 0 0 1px rgba(0,194,184,.1)', overflow: 'hidden' }}>
        <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid var(--navy-edge)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 9, background: client.avatarGrad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: HS.display, fontWeight: 800, fontSize: 13, color: '#0C182C', flexShrink: 0 }}>{client.initials}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: HS.display, fontSize: 14, fontWeight: 700, color: '#FCFCFC' }}>Quick rename</div>
            <div style={{ fontFamily: HS.body, fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>Update client name and category</div>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, border: 'none', background: 'var(--navy-elevated)', borderRadius: 6, color: 'var(--text-muted)', cursor: 'pointer', fontSize: 17, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>
        <div style={{ padding: '18px 22px' }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: HS.mono, fontSize: 9.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 6 }}>Client name</div>
            <input ref={ref} value={name} onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {if (e.key === 'Enter') {onSave(name, industry);onClose();}if (e.key === 'Escape') onClose();}}
            style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', background: 'var(--navy-elevated)', border: '1.5px solid rgba(0,194,184,.4)', borderRadius: 7, color: '#FCFCFC', fontFamily: HS.display, fontSize: 13, fontWeight: 600, outline: 'none', boxShadow: '0 0 0 3px rgba(0,194,184,.08)' }} />
          </div>
          <div>
            <div style={{ fontFamily: HS.mono, fontSize: 9.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 6 }}>Business category</div>
            <input value={industry} onChange={(e) => setIndustry(e.target.value)}
            onKeyDown={(e) => {if (e.key === 'Enter') {onSave(name, industry);onClose();}if (e.key === 'Escape') onClose();}}
            style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', background: 'var(--navy-elevated)', border: '1px solid var(--navy-edge)', borderRadius: 7, color: '#FCFCFC', fontFamily: HS.body, fontSize: 12.5, outline: 'none' }} />
          </div>
        </div>
        <div style={{ padding: '12px 22px', borderTop: '1px solid var(--navy-edge)', display: 'flex', gap: 7, background: 'rgba(10,18,34,.5)' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '8px 0', background: 'var(--navy-elevated)', border: '1px solid var(--navy-edge)', borderRadius: 7, color: 'var(--text-secondary)', fontFamily: HS.display, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          <button onClick={() => {onSave(name, industry);onClose();}} style={{ flex: 2, padding: '8px 0', background: 'linear-gradient(135deg,#00C2B8,#009E96)', border: 'none', borderRadius: 7, color: '#0C182C', fontFamily: HS.display, fontSize: 12, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,194,184,.25)' }}>Save</button>
        </div>
      </div>
    </div>);

};

// ─── Client row ────────────────────────────────────────────────────
const ClientRow = ({ client, onOpen, onEdit, onConfigure, onDuplicate, onDelete, featured, idx, onQuickRename }) => {
  const [hovered, setHovered] = React.useState(false);
  const [nameHovered, setNameHovered] = React.useState(false);
  const connectedCount = Object.values(client.connected).filter(Boolean).length;

  const handlePDF = (e) => {
    e.stopPropagation();
    const el = e.currentTarget;
    const orig = el.innerHTML;
    const origBorder = el.style.borderColor;
    const origColor = el.style.color;
    el.disabled = true;
    el.style.borderColor = 'rgba(248,180,0,.5)';
    el.style.color = '#F8B400';
    el.innerHTML = '<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="animation:spin .8s linear infinite"><path d="M21 12a9 9 0 11-6.22-8.55"/></svg>';
    setTimeout(() => {
      el.innerHTML = orig;
      el.disabled = false;
      el.style.borderColor = origBorder;
      el.style.color = origColor;
    }, 1800);
  };

  const IconBtn = ({ title, icon, onClick, danger }) =>
  <button onClick={(e) => {e.stopPropagation();onClick();}} title={title}
  style={{ width: 26, height: 26, border: `1px solid ${danger ? 'rgba(220,38,38,.3)' : 'var(--navy-edge)'}`, borderRadius: 6, background: 'var(--navy-elevated)', color: danger ? 'rgba(220,38,38,.6)' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .12s', flexShrink: 0 }}
  onMouseEnter={(e) => {e.currentTarget.style.background = danger ? 'rgba(220,38,38,.1)' : 'rgba(0,194,184,.1)';e.currentTarget.style.color = danger ? '#DC2626' : '#00C2B8';e.currentTarget.style.borderColor = danger ? 'rgba(220,38,38,.5)' : 'rgba(0,194,184,.4)';}}
  onMouseLeave={(e) => {e.currentTarget.style.background = 'var(--navy-elevated)';e.currentTarget.style.color = danger ? 'rgba(220,38,38,.6)' : 'var(--text-muted)';e.currentTarget.style.borderColor = danger ? 'rgba(220,38,38,.3)' : 'var(--navy-edge)';}}>
      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.9" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d={icon} /></svg>
    </button>;


  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ borderTop: `1px solid ${idx === 0 ? 'var(--navy-edge)' : 'rgba(51,71,102,.45)'}`, transition: 'background .15s', background: hovered ? 'rgba(36,51,80,.3)' : 'transparent', position: 'relative' }}>

      {/* Teal accent — hover only */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, background: 'var(--avo-teal)', opacity: hovered ? 1 : 0, transition: 'opacity .15s' }} />

      {/* Main row: avatar | name | dup+del | sources | last edited | actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 88px 180px 110px 220px', alignItems: 'center', gap: 18, padding: '13px 20px', paddingLeft: 26 }}>

        {/* Avatar */}
        <div style={{ width: 40, height: 40, borderRadius: 10, background: client.avatarGrad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: HS.display, fontWeight: 800, fontSize: 14, color: '#0C182C', flexShrink: 0 }}>
          {client.logo ? <img src={client.logo} style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'contain' }} /> : client.initials}
        </div>

        {/* Name + industry + pencil */}
        <div style={{ minWidth: 0 }}
        onMouseEnter={() => setNameHovered(true)}
        onMouseLeave={() => setNameHovered(false)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
            <span style={{ fontFamily: HS.display, fontSize: 13.5, fontWeight: 700, color: '#FCFCFC', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{client.name}</span>
            <button onClick={(e) => {e.stopPropagation();onQuickRename(client);}}
            title="Rename"
            style={{ width: 20, height: 20, border: 'none', borderRadius: 5, background: nameHovered ? 'rgba(0,194,184,.15)' : 'transparent', color: nameHovered ? '#00C2B8' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background .12s, color .12s', padding: 0 }}>
              <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.9" viewBox="0 0 24 24" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4z" /></svg>
            </button>
          </div>
          <div style={{ fontFamily: HS.body, fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{client.industry}</div>
        </div>

        {/* Dup + Delete icons */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center', opacity: hovered ? 1 : 0, transition: 'opacity .15s' }}>
          <IconBtn title="Duplicate" icon="M8 17H5a2 2 0 01-2-2V5a2 2 0 012-2h8a2 2 0 012 2v3M11 21h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" onClick={() => onDuplicate(client)} />
          <IconBtn title="Delete" icon="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" onClick={() => onDelete(client)} danger />
        </div>

        {/* Sources */}
        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          {SOURCES_DEF.map((s) => {
            const on = client.connected[s.id];
            return (
              <div key={s.id} title={`${s.label} ${on ? '(connected)' : '(not connected)'}`}
              style={{ width: 26, height: 26, background: on ? `${s.color}18` : 'var(--navy-deep)', border: `1px solid ${on ? s.color + '55' : 'var(--navy-edge)'}`, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: on ? 1 : 0.3 }}>
                <svg width="14" height="14" viewBox="0 0 24 24">{s.icon}</svg>
              </div>);

          })}
        </div>

        {/* Last edited */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <svg width="11" height="11" fill="none" stroke="var(--text-muted)" strokeWidth="1.8" viewBox="0 0 24 24" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
          <span style={{ fontFamily: HS.mono, fontSize: 10, color: 'var(--text-muted)' }}>{client.lastEdited || '—'}</span>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-end' }}>
          <button onClick={handlePDF}
          style={{ padding: '6px 10px', background: 'var(--navy-elevated)', border: '1px solid var(--navy-edge)', borderRadius: 7, color: 'var(--text-secondary)', fontFamily: HS.display, fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, transition: 'border-color .15s, color .15s', minWidth: 62, whiteSpace: 'nowrap', flexShrink: 0 }}
          onMouseEnter={(e) => {e.currentTarget.style.borderColor = 'rgba(248,180,0,.5)';e.currentTarget.style.color = '#F8B400';}}
          onMouseLeave={(e) => {e.currentTarget.style.borderColor = 'var(--navy-edge)';e.currentTarget.style.color = 'var(--text-secondary)';}}>
            <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.9" viewBox="0 0 24 24" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6M9 13h6M9 17h4" /></svg>
            PDF
          </button>
          <button onClick={() => onConfigure(client)}
          style={{ padding: '6px 10px', background: 'var(--navy-elevated)', border: '1px solid var(--navy-edge)', borderRadius: 7, color: 'var(--text-secondary)', fontFamily: HS.display, fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, transition: 'border-color .15s, color .15s' }}
          onMouseEnter={(e) => {e.currentTarget.style.borderColor = 'rgba(0,194,184,.5)';e.currentTarget.style.color = '#00C2B8';}}
          onMouseLeave={(e) => {e.currentTarget.style.borderColor = 'var(--navy-edge)';e.currentTarget.style.color = 'var(--text-secondary)';}}>
            <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.9" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" /></svg>
            Configure
          </button>
          <button onClick={() => onOpen(client)}
          style={{ padding: '6px 12px', background: 'linear-gradient(135deg,#00C2B8,#009E96)', border: 'none', borderRadius: 7, color: '#0C182C', fontFamily: HS.display, fontSize: 11.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, boxShadow: '0 3px 10px rgba(0,194,184,.2)' }}>
            Open
            <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>
    </div>);

};

// ─── Top bar ───────────────────────────────────────────────────────
const HomeTopBar = ({ count }) =>
<header style={{ height: 80, minHeight: 80, background: 'rgba(10,18,34,.9)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--navy-edge)', display: 'flex', alignItems: 'center', padding: '0 28px', gap: 14, position: 'relative', zIndex: 10, boxSizing: 'border-box' }}>
    <img src="assets/logo-mark.png" style={{ width: 62, height: 62 }} />
    <div>
      <div style={{ fontFamily: HS.display, fontSize: 14, fontWeight: 700, color: '#FCFCFC', letterSpacing: '-.01em' }}>Reportive</div>
      <div style={{ fontFamily: HS.mono, fontSize: 8.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.1em' }}>by Avonetiq</div>
    </div>
    <div style={{ width: 1, height: 20, background: 'var(--navy-edge)' }} />
    {[['Home', 'active'], ['Templates', ''], ['Access', '']].map(([l, a]) =>
  <div key={l} style={{ padding: '6px 12px', borderRadius: 7, cursor: 'pointer', background: a ? 'rgba(0,194,184,.1)' : 'transparent', color: a ? '#00C2B8' : 'var(--text-secondary)', fontFamily: HS.display, fontSize: 12.5, fontWeight: a ? 700 : 500 }}>{l}</div>
  )}
    <div style={{ flex: 1 }} />
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: 'var(--navy-surface)', border: '1px solid var(--navy-edge)', borderRadius: 8, width: 200 }}>
      <svg width="13" height="13" fill="none" stroke="var(--text-muted)" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
      <span style={{ fontFamily: HS.body, fontSize: 12, color: 'var(--text-muted)' }}>Search clients…</span>
      <span style={{ marginLeft: 'auto', fontFamily: HS.mono, fontSize: 9, color: 'var(--text-muted)', background: 'var(--navy-elevated)', padding: '1px 5px', borderRadius: 3 }}>⌘K</span>
    </div>
    <div style={{ width: 1, height: 20, background: 'var(--navy-edge)' }} />
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#00C2B8,#7000FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: HS.display, fontWeight: 700, fontSize: 12, color: '#0C182C' }}>RA</div>
      <div>
        <div style={{ fontFamily: HS.display, fontSize: 12, fontWeight: 600, color: '#FCFCFC' }}>Rizki Anindita</div>
        <div style={{ fontFamily: HS.mono, fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Admin</div>
      </div>
    </div>
  </header>;


// ─── Filter bar ───────────────────────────────────────────────────
const FilterBar = ({ filter, setFilter, count }) =>
<div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
    <div style={{ display: 'flex', gap: 3, background: 'var(--navy-deep)', borderRadius: 8, padding: 3 }}>
      {['All', 'Active', 'Paused'].map((f) =>
    <button key={f} onClick={() => setFilter(f)}
    style={{ padding: '5px 14px', border: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: HS.display, fontSize: 11.5, fontWeight: 600, background: filter === f ? 'var(--navy-elevated)' : 'transparent', color: filter === f ? '#FCFCFC' : 'var(--text-muted)', transition: 'background .12s' }}>
          {f}
        </button>
    )}
    </div>
    <div style={{ flex: 1 }} />
    <span style={{ fontFamily: HS.mono, fontSize: 10.5, color: 'var(--text-muted)' }}>{count} client{count !== 1 ? 's' : ''}</span>
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
            <div style={{ fontFamily: HS.mono, fontSize: 9.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 2 }}>{l}</div>
            <div style={{ fontFamily: HS.display, fontSize: 22, fontWeight: 800, color: '#FCFCFC', letterSpacing: '-.02em', fontVariantNumeric: 'tabular-nums' }}>{v}</div>
          </div>
        </div>
      )}
    </div>);

};

// ─── ScreenHome ────────────────────────────────────────────────────
const ScreenHome = ({ onOpenClient }) => {
  const [clients, setClients] = React.useState(HOME_CLIENTS);
  const [editTarget, setEditTarget] = React.useState(null);
  const [configTarget, setConfigTarget] = React.useState(null);
  const [deleteTarget, setDeleteTarget] = React.useState(null);
  const [quickRenameTarget, setQuickRenameTarget] = React.useState(null);
  const [newReportOpen, setNewReportOpen] = React.useState(false);

  const filtered = clients;

  const handleQuickRename = (id, name, industry) => setClients((prev) => prev.map((c) => c.id === id ? { ...c, name, industry } : c));

  const handleDuplicate = (c) => {
    const dup = { ...c, id: c.id + '-copy', name: c.name + ' (copy)', featured: false };
    setClients((prev) => [...prev, dup]);
  };
  const handleDelete = (id) => setClients((prev) => prev.filter((c) => c.id !== id));
  const handleSaveEdit = (id, form) => setClients((prev) => prev.map((c) => c.id === id ? { ...c, name: form.name, industry: form.industry, period: form.period, info: { pic: form.pic, email: form.email, website: form.website, notes: form.notes } } : c));
  
  const handleCreateReport = (form) => {
    const newClient = {
      id: `client-${Date.now()}`,
      name: form.clientName,
      industry: 'New Client',
      initials: form.clientName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2),
      logo: null,
      avatarGrad: 'linear-gradient(135deg,#00C2B8,#7000FF)',
      period: 'Apr 2026',
      sources: Object.keys(form.sources).filter(k => form.sources[k]),
      alert: null,
      featured: false,
      info: { pic: '', email: '', website: form.url, notes: '' },
      connected: form.sources,
      lastEdited: 'Just now'
    };
    setClients((prev) => [newClient, ...prev]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--navy-base)', position: 'relative' }}>
      <RFlare intensity={0.18} />
      <HomeTopBar count={filtered.length} />

      <div style={{ flex: 1, overflow: 'auto', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '26px 32px 48px' }}>

          {/* Heading */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
            <h1 style={{ margin: 0, fontFamily: HS.display, fontSize: 26, fontWeight: 700, color: '#FCFCFC', letterSpacing: '-.02em' }}>Selamat pagi, Rizki</h1>
            <button onClick={() => setNewReportOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', background: 'linear-gradient(135deg,#00C2B8,#009E96)', color: '#0C182C', border: 'none', borderRadius: 8, fontFamily: HS.display, fontSize: 12, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(0,194,184,.25)' }}>
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>
              New Report
            </button>
          </div>


          {/* List */}
          <div style={{ background: 'var(--navy-surface)', border: '1px solid var(--navy-edge)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,.15)' }}>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 88px 180px 110px 220px', gap: 18, padding: '8px 20px', paddingLeft: 26, background: 'var(--navy-deep)', borderBottom: '1px solid var(--navy-edge)' }}>
              {['', 'Client', '', 'Sources', 'Last edited', ''].map((h, i) =>
              <div key={i} style={{ fontFamily: HS.mono, fontSize: 9.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.1em' }}>{h}</div>
              )}
            </div>

            {filtered.map((c, i) =>
            <ClientRow
              key={c.id} client={c} idx={i} featured={c.featured}
              onOpen={onOpenClient || (() => {})}
              onEdit={() => setEditTarget(c)}
              onConfigure={() => setConfigTarget(c)}
              onDuplicate={handleDuplicate}
              onDelete={() => setDeleteTarget(c)}
              onQuickRename={setQuickRenameTarget} />

            )}
          </div>

        </div>
      </div>

      {/* Modals */}
      {newReportOpen && <NewReportModal onClose={() => setNewReportOpen(false)} onCreate={handleCreateReport} />}
      {quickRenameTarget && <QuickRenameModal client={quickRenameTarget} onSave={(name, industry) => handleQuickRename(quickRenameTarget.id, name, industry)} onClose={() => setQuickRenameTarget(null)} />}
      {editTarget && <EditModal client={editTarget} onSave={(form) => handleSaveEdit(editTarget.id, form)} onClose={() => setEditTarget(null)} />}
      {configTarget && <ConfigurePanel client={configTarget} onClose={() => setConfigTarget(null)} />}
      {deleteTarget && <DeleteConfirm client={deleteTarget} onConfirm={handleDelete} onClose={() => setDeleteTarget(null)} />}

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