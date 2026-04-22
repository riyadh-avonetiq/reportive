-- ============================================================
--  Reportive by Avonetiq — Supabase Schema (v3)
--  Jalankan di Supabase SQL Editor
--  v3: nama tabel google_ads + google_ads_seg
-- ============================================================

-- ── Tabel utama: google_ads ───────────────────────────────────
DROP TABLE IF EXISTS google_ads CASCADE;

CREATE TABLE google_ads (
  id                   BIGSERIAL PRIMARY KEY,

  -- Waktu
  day                  DATE    NOT NULL,
  week                 TEXT    NOT NULL,   -- format: '2026-W15'
  month                TEXT    NOT NULL,   -- format: '2026-04'

  -- Dimensi
  account_name         TEXT    NOT NULL DEFAULT '',
  campaign_name        TEXT    NOT NULL DEFAULT '',
  campaign_type        TEXT             DEFAULT '',
  ad_group             TEXT    NOT NULL DEFAULT '',
  keyword              TEXT    NOT NULL DEFAULT '',
  match_type           TEXT    NOT NULL DEFAULT '',
  device               TEXT    NOT NULL DEFAULT '',  -- Desktop / Mobile / Tablet / Other

  -- Metrics
  spend                NUMERIC(15,2) DEFAULT 0,
  impressions          BIGINT        DEFAULT 0,
  ctr                  NUMERIC(8,4)  DEFAULT 0,   -- persen, contoh: 3.45
  clicks               BIGINT        DEFAULT 0,
  avg_cpc              NUMERIC(12,2) DEFAULT 0,
  conv_rate            NUMERIC(8,4)  DEFAULT 0,   -- persen, contoh: 2.10
  conversions          NUMERIC(10,2) DEFAULT 0,
  cost_per_conversion  NUMERIC(12,2) DEFAULT 0,

  synced_at            TIMESTAMPTZ   DEFAULT NOW(),

  UNIQUE(day, account_name, campaign_name, ad_group, keyword, match_type, device)
);

-- Row Level Security
ALTER TABLE google_ads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read"   ON google_ads FOR SELECT USING (true);
CREATE POLICY "service_write" ON google_ads FOR ALL    USING (true) WITH CHECK (true);

-- Index
CREATE INDEX idx_google_ads_day      ON google_ads (day);
CREATE INDEX idx_google_ads_month    ON google_ads (month);
CREATE INDEX idx_google_ads_account  ON google_ads (account_name);
CREATE INDEX idx_google_ads_device   ON google_ads (device);

-- ── Tabel segmentasi: google_ads_seg ─────────────────────────
--  Menyimpan breakdown per gender, age, location, conversion action
--  Diisi oleh GAQL queries di Google Ads Script
DROP TABLE IF EXISTS google_ads_seg CASCADE;

CREATE TABLE google_ads_seg (
  id                   BIGSERIAL PRIMARY KEY,

  -- Waktu
  day                  DATE    NOT NULL,
  week                 TEXT    NOT NULL,
  month                TEXT    NOT NULL,

  -- Dimensi utama
  account_name         TEXT    NOT NULL DEFAULT '',
  campaign_name        TEXT    NOT NULL DEFAULT '',
  campaign_type        TEXT             DEFAULT '',

  -- Tipe segmen & nilai
  -- segment_type: 'gender' | 'age' | 'country' | 'city' | 'conversion_action'
  segment_type         TEXT    NOT NULL,
  segment_value        TEXT    NOT NULL DEFAULT '',

  -- Metrics
  spend                NUMERIC(15,2) DEFAULT 0,
  impressions          BIGINT        DEFAULT 0,
  clicks               BIGINT        DEFAULT 0,
  conversions          NUMERIC(10,2) DEFAULT 0,
  cost_per_conversion  NUMERIC(12,2) DEFAULT 0,

  synced_at            TIMESTAMPTZ   DEFAULT NOW(),

  UNIQUE(day, account_name, campaign_name, segment_type, segment_value)
);

-- Row Level Security
ALTER TABLE google_ads_seg ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read"   ON google_ads_seg FOR SELECT USING (true);
CREATE POLICY "service_write" ON google_ads_seg FOR ALL    USING (true) WITH CHECK (true);

-- Index
CREATE INDEX idx_google_ads_seg_day      ON google_ads_seg (day);
CREATE INDEX idx_google_ads_seg_account  ON google_ads_seg (account_name);
CREATE INDEX idx_google_ads_seg_type     ON google_ads_seg (segment_type);

-- ============================================================
--  Tabel: pagespeed  (PageSpeed Insights / Core Web Vitals)
--  Diisi oleh psi_sync.js (Google Apps Script, jalan tiap hari)
-- ============================================================
DROP TABLE IF EXISTS pagespeed CASCADE;

CREATE TABLE pagespeed (
  id                 BIGSERIAL PRIMARY KEY,

  -- Identitas
  url                TEXT    NOT NULL,
  strategy           TEXT    NOT NULL DEFAULT 'mobile',  -- 'mobile' | 'desktop'
  day                DATE    NOT NULL,

  -- Skor Lighthouse (0-100)
  performance_score  SMALLINT,
  accessibility_score SMALLINT,
  seo_score          SMALLINT,
  best_practices_score SMALLINT,

  -- Core Web Vitals (semua dalam milidetik kecuali CLS)
  lcp                NUMERIC(10,2),   -- Largest Contentful Paint  (ms)
  fcp                NUMERIC(10,2),   -- First Contentful Paint     (ms)
  cls                NUMERIC(8,4),    -- Cumulative Layout Shift    (score, bukan ms)
  tbt                NUMERIC(10,2),   -- Total Blocking Time        (ms)
  si                 NUMERIC(10,2),   -- Speed Index                (ms)
  tti                NUMERIC(10,2),   -- Time to Interactive        (ms)
  inp                NUMERIC(10,2),   -- Interaction to Next Paint  (ms, jika ada)

  -- CrUX field data (real user, jika tersedia)
  crux_lcp_ms        NUMERIC(10,2),
  crux_cls           NUMERIC(8,4),
  crux_inp_ms        NUMERIC(10,2),

  -- Status CWV: 'good' | 'needs-improvement' | 'poor'
  lcp_status         TEXT,
  cls_status         TEXT,
  inp_status         TEXT,

  synced_at          TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(url, strategy, day)
);

ALTER TABLE pagespeed ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read"   ON pagespeed FOR SELECT USING (true);
CREATE POLICY "service_write" ON pagespeed FOR ALL    USING (true) WITH CHECK (true);

CREATE INDEX idx_psi_day      ON pagespeed (day);
CREATE INDEX idx_psi_url      ON pagespeed (url);
CREATE INDEX idx_psi_strategy ON pagespeed (strategy);

-- ============================================================
--  Tabel: ga4_daily  (Google Analytics 4 — agregasi harian)
--  Diisi oleh ga4_sync.js (Google Apps Script, jalan tiap hari)
-- ============================================================
DROP TABLE IF EXISTS ga4_daily CASCADE;

CREATE TABLE ga4_daily (
  id                     BIGSERIAL PRIMARY KEY,

  -- Identitas
  property_id            TEXT    NOT NULL,   -- format: '123456789'
  day                    DATE    NOT NULL,
  channel                TEXT    NOT NULL DEFAULT 'all',
  -- channel: 'all' | 'Organic Search' | 'Paid Search' | 'Direct' |
  --          'Referral' | 'Organic Social' | 'Email' | 'Unassigned'

  -- Traffic
  sessions               BIGINT  DEFAULT 0,
  users                  BIGINT  DEFAULT 0,
  new_users              BIGINT  DEFAULT 0,
  returning_users        BIGINT  DEFAULT 0,

  -- Engagement
  pageviews              BIGINT  DEFAULT 0,
  screen_pageviews       BIGINT  DEFAULT 0,
  engaged_sessions       BIGINT  DEFAULT 0,
  engagement_rate        NUMERIC(8,4) DEFAULT 0,   -- persen (0-100)
  bounce_rate            NUMERIC(8,4) DEFAULT 0,   -- persen (0-100)
  avg_session_duration   NUMERIC(12,2) DEFAULT 0,  -- detik
  pages_per_session      NUMERIC(8,4) DEFAULT 0,

  -- Konversi
  conversions            BIGINT  DEFAULT 0,
  conversion_rate        NUMERIC(8,4) DEFAULT 0,   -- persen (0-100)
  total_revenue          NUMERIC(15,2) DEFAULT 0,  -- Rp (jika e-commerce)

  synced_at              TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(property_id, day, channel)
);

ALTER TABLE ga4_daily ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read"   ON ga4_daily FOR SELECT USING (true);
CREATE POLICY "service_write" ON ga4_daily FOR ALL    USING (true) WITH CHECK (true);

CREATE INDEX idx_ga4_day        ON ga4_daily (day);
CREATE INDEX idx_ga4_property   ON ga4_daily (property_id);
CREATE INDEX idx_ga4_channel    ON ga4_daily (channel);
