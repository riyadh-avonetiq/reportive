// Reportive — Templates · Library of customizable report templates
// User can browse, preview, and use templates created by users

const TEMPLATES_DATA = [
  {
    id: 'seo-overview',
    name: 'SEO Performance Overview',
    category: 'SEO',
    author: 'Sarah Chen',
    authorRole: 'SEO Specialist',
    description: 'Track organic traffic, rankings, and Core Web Vitals in one view',
    cards: ['narrative-hero', 'chart-area', 'table-rankings', 'progress-score', 'list-keywords'],
    uses: 48,
    rating: 4.8,
    updated: '2 weeks ago',
    image: 'linear-gradient(135deg,#00C2B8,#0EA5E9)',
    featured: true
  },
  {
    id: 'paid-media-dash',
    name: 'Paid Media Dashboard',
    category: 'Ads',
    author: 'Marcus Johnson',
    authorRole: 'Performance Marketer',
    description: 'Real-time ad spend, ROAS, and campaign performance across channels',
    cards: ['kpi-strip', 'chart-bar', 'table-campaigns', 'kpi-compare', 'chart-sparkrow'],
    uses: 156,
    rating: 4.9,
    updated: '1 week ago',
    image: 'linear-gradient(135deg,#4285F4,#F8B400)',
    featured: true
  },
  {
    id: 'social-growth',
    name: 'Social Media Growth Tracker',
    category: 'Social',
    author: 'Jessica Liu',
    authorRole: 'Content Manager',
    description: 'Monitor followers, engagement rates, and content performance',
    cards: ['kpi-stacked', 'chart-area-dual', 'list-pages', 'progress-goals'],
    uses: 92,
    rating: 4.6,
    updated: '3 days ago',
    image: 'linear-gradient(135deg,#0866FF,#E3170A)',
    featured: false
  },
  {
    id: 'ecom-analytics',
    name: 'E-commerce Analytics',
    category: 'Analytics',
    author: 'David Park',
    authorRole: 'Data Analyst',
    description: 'Revenue, conversion rate, product performance, and customer metrics',
    cards: ['narrative-hero', 'kpi-strip', 'chart-donut', 'table-channels', 'progress-pacing'],
    uses: 73,
    rating: 4.7,
    updated: '5 days ago',
    image: 'linear-gradient(135deg,#16A34A,#F8B400)',
    featured: false
  },
  {
    id: 'blog-insights',
    name: 'Blog & Content Performance',
    category: 'Content',
    author: 'Emily Rodriguez',
    authorRole: 'Content Strategist',
    description: 'Page views, time on page, bounce rate, and reader engagement',
    cards: ['chart-area', 'list-pages', 'table-rankings', 'kpi-compare'],
    uses: 41,
    rating: 4.5,
    updated: '1 week ago',
    image: 'linear-gradient(135deg,#7000FF,#0EA5E9)',
    featured: false
  },
  {
    id: 'email-campaign',
    name: 'Email Campaign Metrics',
    category: 'Email',
    author: 'Alex Thompson',
    authorRole: 'Email Marketer',
    description: 'Open rate, click rate, conversion, and segment performance',
    cards: ['kpi-single', 'chart-heatmap', 'table-campaigns', 'progress-score'],
    uses: 28,
    rating: 4.4,
    updated: '2 weeks ago',
    image: 'linear-gradient(135deg,#F8B400,#E3170A)',
    featured: false
  }
];

const TS = {
  display: 'var(--font-display)',
  body: 'var(--font-body)',
  mono: 'var(--font-mono)'
};

// ─── Template Card ────────────────────────────────────────────────
const TemplateCard = ({ template, onUse, onPreview }) => {
  const [hovered, setHovered] = React.useState(false);
  
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'var(--navy-surface)',
        border: '1px solid var(--navy-edge)',
        borderRadius: 14,
        overflow: 'hidden',
        transition: 'box-shadow .2s, border-color .2s',
        boxShadow: hovered ? '0 12px 40px rgba(0,0,0,.3), 0 0 0 1px rgba(0,194,184,.2)' : '0 4px 16px rgba(0,0,0,.15)',
        borderColor: hovered ? 'rgba(0,194,184,.3)' : 'var(--navy-edge)',
        cursor: 'pointer'
      }}
    >
      {/* Image */}
      <div style={{
        height: 140,
        background: template.image,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {template.featured && (
          <div style={{
            position: 'absolute',
            top: 10,
            right: 10,
            background: 'rgba(248,180,0,.9)',
            color: '#0C182C',
            padding: '4px 10px',
            borderRadius: 6,
            fontFamily: TS.mono,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '.08em',
            textTransform: 'uppercase'
          }}>★ Featured</div>
        )}
        {hovered && (
          <button onClick={onPreview} style={{
            padding: '8px 14px',
            background: 'rgba(255,255,255,.95)',
            border: 'none',
            borderRadius: 8,
            fontFamily: TS.display,
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            color: '#0C182C'
          }}>Preview</button>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '16px 18px' }}>
        {/* Category tag */}
        <div style={{
          display: 'inline-block',
          background: 'rgba(0,194,184,.1)',
          color: '#00C2B8',
          padding: '3px 8px',
          borderRadius: 5,
          fontFamily: TS.mono,
          fontSize: 9,
          fontWeight: 600,
          letterSpacing: '.08em',
          textTransform: 'uppercase',
          marginBottom: 8
        }}>{template.category}</div>

        {/* Title */}
        <div style={{
          fontFamily: TS.display,
          fontSize: 14,
          fontWeight: 700,
          color: '#FCFCFC',
          marginBottom: 6,
          lineHeight: 1.3
        }}>{template.name}</div>

        {/* Description */}
        <div style={{
          fontFamily: TS.body,
          fontSize: 11,
          color: 'var(--text-muted)',
          marginBottom: 12,
          lineHeight: 1.4
        }}>{template.description}</div>

        {/* Author */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 12,
          paddingBottom: 12,
          borderBottom: '1px solid var(--navy-edge)'
        }}>
          <div style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: 'linear-gradient(135deg,#00C2B8,#7000FF)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: TS.display,
            fontSize: 10,
            fontWeight: 700,
            color: '#0C182C',
            flexShrink: 0
          }}>
            {template.author.split(' ').map(n => n[0]).join('')}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: TS.display,
              fontSize: 10.5,
              fontWeight: 600,
              color: '#FCFCFC'
            }}>{template.author}</div>
            <div style={{
              fontFamily: TS.mono,
              fontSize: 9,
              color: 'var(--text-muted)',
              marginTop: 1
            }}>{template.authorRole}</div>
          </div>
        </div>

        {/* Stats */}
        <div style={{
          display: 'flex',
          gap: 12,
          marginBottom: 12,
          fontSize: 11
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)' }}>
            <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M9 11l3 3L22 4M11 20H5a2 2 0 01-2-2V7a2 2 0 012-2h14a2 2 0 012 2v9" /></svg>
            {template.uses} uses
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#F8B400' }}>
            <svg width="11" height="11" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
            {template.rating}
          </div>
          <div style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>
            Updated {template.updated}
          </div>
        </div>

        {/* Use button */}
        <button onClick={onUse} style={{
          width: '100%',
          padding: '9px 0',
          background: 'linear-gradient(135deg,#00C2B8,#009E96)',
          border: 'none',
          borderRadius: 8,
          color: '#0C182C',
          fontFamily: TS.display,
          fontSize: 12,
          fontWeight: 700,
          cursor: 'pointer',
          transition: 'box-shadow .15s',
          boxShadow: hovered ? '0 4px 14px rgba(0,194,184,.3)' : '0 2px 8px rgba(0,194,184,.15)'
        }}>
          Use Template
        </button>
      </div>
    </div>
  );
};

// ─── Templates Screen ─────────────────────────────────────────────
const ScreenTemplates = () => {
  const [filter, setFilter] = React.useState('All');
  const [searchQuery, setSearchQuery] = React.useState('');

  const categories = ['All', 'SEO', 'Ads', 'Social', 'Analytics', 'Content', 'Email'];
  
  const filtered = TEMPLATES_DATA.filter(t => {
    const matchFilter = filter === 'All' || t.category === filter;
    const matchSearch = searchQuery === '' || 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchFilter && matchSearch;
  });

  const featured = TEMPLATES_DATA.filter(t => t.featured);

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: 'var(--navy-base)',
      overflow: 'auto',
      position: 'relative'
    }}>
      {/* Flare */}
      <div style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          width: 900,
          height: 900,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(248,180,0,.32) 0%, rgba(166,105,0,.1) 40%, transparent 68%)',
          filter: 'blur(110px)',
          top: '-20%',
          left: '-8%'
        }} />
        <div style={{
          position: 'absolute',
          width: 700,
          height: 700,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,194,184,.26) 0%, rgba(0,77,73,.1) 40%, transparent 68%)',
          filter: 'blur(120px)',
          bottom: '-20%',
          right: '-8%'
        }} />
      </div>

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{
          padding: '28px 32px',
          borderBottom: '1px solid var(--navy-edge)',
          background: 'rgba(10,18,34,.6)',
          backdropFilter: 'blur(16px)'
        }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <h1 style={{
              fontFamily: TS.display,
              fontSize: 28,
              fontWeight: 700,
              color: '#FCFCFC',
              letterSpacing: '-.02em',
              marginBottom: 10
            }}>Templates</h1>
            <p style={{
              fontFamily: TS.body,
              fontSize: 13,
              color: 'var(--text-muted)',
              lineHeight: 1.5
            }}>Explore and customize templates created by the Reportive community. Start with a pre-built dashboard or use as inspiration.</p>
          </div>
        </div>

        {/* Search & Filter */}
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '24px 32px',
          display: 'flex',
          gap: 16,
          alignItems: 'center'
        }}>
          {/* Search */}
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 14px',
            background: 'var(--navy-surface)',
            border: '1px solid var(--navy-edge)',
            borderRadius: 10
          }}>
            <svg width="14" height="14" fill="none" stroke="var(--text-muted)" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates…"
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                color: '#FCFCFC',
                fontFamily: TS.body,
                fontSize: 13,
                outline: 'none'
              }}
            />
          </div>

          {/* Category filter */}
          <div style={{
            display: 'flex',
            gap: 6,
            background: 'var(--navy-deep)',
            borderRadius: 10,
            padding: 4
          }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                style={{
                  padding: '6px 12px',
                  border: 'none',
                  borderRadius: 7,
                  fontFamily: TS.display,
                  fontSize: 11.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: filter === cat ? 'var(--navy-elevated)' : 'transparent',
                  color: filter === cat ? '#FCFCFC' : 'var(--text-muted)',
                  transition: 'background .12s, color .12s'
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Featured section */}
        {filter === 'All' && featured.length > 0 && (
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px 28px' }}>
            <h2 style={{
              fontFamily: TS.display,
              fontSize: 16,
              fontWeight: 700,
              color: '#FCFCFC',
              marginBottom: 16
            }}>⭐ Featured Templates</h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 18
            }}>
              {featured.map(template => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onUse={() => console.log('Use template:', template.name)}
                  onPreview={() => console.log('Preview template:', template.name)}
                />
              ))}
            </div>
          </div>
        )}

        {/* All templates */}
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px 48px' }}>
          <h2 style={{
            fontFamily: TS.display,
            fontSize: 16,
            fontWeight: 700,
            color: '#FCFCFC',
            marginBottom: 16
          }}>
            {filter === 'All' ? 'All Templates' : `${filter} Templates`}
          </h2>
          {filtered.length > 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 18
            }}>
              {filtered.map(template => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onUse={() => console.log('Use template:', template.name)}
                  onPreview={() => console.log('Preview template:', template.name)}
                />
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '48px 32px',
              color: 'var(--text-muted)'
            }}>
              <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ margin: '0 auto 12px', opacity: 0.5 }}><path d="M9 12h6m-6 4h6m2-10H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V8a2 2 0 00-2-2z" /></svg>
              <p style={{ fontFamily: TS.body, fontSize: 13 }}>No templates found. Try adjusting your search or filter.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { ScreenTemplates, TEMPLATES_DATA });
