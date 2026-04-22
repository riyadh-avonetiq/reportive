-- ============================================================
--  Reportive by Avonetiq — Client Profiles Schema
--  Project : https://dpthobkylyuajaleykyf.supabase.co
--
--  Menyimpan mapping: nama akun → URL website (untuk PSI)
--  Data diakses dari dashboard tanpa perlu konfigurasi ulang
--  di setiap device.
--
--  Jalankan di: Supabase Dashboard → SQL Editor → New query
-- ============================================================

DROP TABLE IF EXISTS client_profiles CASCADE;

CREATE TABLE client_profiles (
  id           BIGSERIAL PRIMARY KEY,
  account_name TEXT    NOT NULL,                -- nama akun / klien
  psi_urls     TEXT    NOT NULL DEFAULT '',     -- URL website, satu per baris
  ga4_property TEXT             DEFAULT '',     -- GA4 Property ID (opsional)
  notes        TEXT             DEFAULT '',     -- catatan tambahan
  updated_at   TIMESTAMPTZ      DEFAULT NOW(),

  UNIQUE(account_name)
);

-- Row Level Security — anon bisa read & write (dashboard private)
ALTER TABLE client_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_read"  ON client_profiles FOR SELECT USING (true);
CREATE POLICY "anon_write" ON client_profiles FOR ALL    USING (true) WITH CHECK (true);

CREATE INDEX idx_profiles_account ON client_profiles (account_name);

-- ── Verifikasi ────────────────────────────────────────────────
-- SELECT * FROM client_profiles;
