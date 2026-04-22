-- ============================================================
--  Reportive by Avonetiq — PSI Supabase Schema
--  Project : https://dpthobkylyuajaleykyf.supabase.co
--
--  Jalankan di: Supabase Dashboard → SQL Editor → New query
--  Paste semua → Run
-- ============================================================

-- ── Tabel: pagespeed ─────────────────────────────────────────
DROP TABLE IF EXISTS pagespeed CASCADE;

CREATE TABLE pagespeed (
  id                   BIGSERIAL PRIMARY KEY,

  -- Identitas
  url                  TEXT    NOT NULL,
  strategy             TEXT    NOT NULL DEFAULT 'mobile',  -- 'mobile' | 'desktop'
  day                  DATE    NOT NULL,

  -- Skor Lighthouse (0–100)
  performance_score    SMALLINT,
  accessibility_score  SMALLINT,
  seo_score            SMALLINT,
  best_practices_score SMALLINT,

  -- Core Web Vitals — lab data (Lighthouse)
  lcp                  NUMERIC(10,2),   -- Largest Contentful Paint  (ms)
  fcp                  NUMERIC(10,2),   -- First Contentful Paint    (ms)
  cls                  NUMERIC(8,4),    -- Cumulative Layout Shift   (skor)
  tbt                  NUMERIC(10,2),   -- Total Blocking Time       (ms)
  si                   NUMERIC(10,2),   -- Speed Index               (ms)
  tti                  NUMERIC(10,2),   -- Time to Interactive       (ms)
  inp                  NUMERIC(10,2),   -- Interaction to Next Paint (ms)

  -- CrUX field data — real user experience (jika tersedia)
  crux_lcp_ms          NUMERIC(10,2),
  crux_cls             NUMERIC(8,4),
  crux_inp_ms          NUMERIC(10,2),

  -- Status CWV: 'good' | 'needs-improvement' | 'poor'
  lcp_status           TEXT,
  cls_status           TEXT,
  inp_status           TEXT,

  synced_at            TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(url, strategy, day)
);

-- Row Level Security
ALTER TABLE pagespeed ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_read"     ON pagespeed FOR SELECT USING (true);
CREATE POLICY "service_write" ON pagespeed FOR ALL    USING (true) WITH CHECK (true);

-- Index
CREATE INDEX idx_psi_day      ON pagespeed (day DESC);
CREATE INDEX idx_psi_url      ON pagespeed (url);
CREATE INDEX idx_psi_strategy ON pagespeed (strategy);

-- ── Verifikasi ────────────────────────────────────────────────
-- Jalankan query ini untuk cek tabel berhasil dibuat:
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'pagespeed' ORDER BY ordinal_position;
