-- ============================================================
--  Reportive by Avonetiq — GA4 Daily Schema
--  Project : https://qmzgincouzpbyfxfddxt.supabase.co
--
--  File ini hanya membuat tabel ga4_daily.
--  Aman dijalankan tanpa menghapus tabel google_ads yang sudah ada.
--
--  Jalankan di: Supabase Dashboard → SQL Editor → New query
--  Paste semua → Run
-- ============================================================

-- ── Tabel: ga4_daily ─────────────────────────────────────────
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
  total_revenue          NUMERIC(15,2) DEFAULT 0,  -- jika e-commerce

  synced_at              TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(property_id, day, channel)
);

-- Row Level Security
ALTER TABLE ga4_daily ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read"   ON ga4_daily FOR SELECT USING (true);
CREATE POLICY "service_write" ON ga4_daily FOR ALL    USING (true) WITH CHECK (true);

-- Index
CREATE INDEX idx_ga4_day        ON ga4_daily (day DESC);
CREATE INDEX idx_ga4_property   ON ga4_daily (property_id);
CREATE INDEX idx_ga4_channel    ON ga4_daily (channel);

-- ── Verifikasi ────────────────────────────────────────────────
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'ga4_daily' ORDER BY ordinal_position;
