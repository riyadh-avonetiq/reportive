CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT,
  share_token TEXT UNIQUE,
  layouts JSONB DEFAULT '{}',
  configs JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS datasource_config (
  client_id TEXT PRIMARY KEY REFERENCES clients(id) ON DELETE CASCADE,
  ga4_property_id TEXT,
  gads_account_name TEXT,
  gsc_site_url TEXT,
  meta_account_name TEXT,
  psi_api_key TEXT,
  psi_urls TEXT[] DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gads_totals (
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  campaign_name TEXT NOT NULL DEFAULT '',
  campaign_type TEXT NOT NULL DEFAULT '',
  spend NUMERIC(14,2) DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions NUMERIC(10,2) DEFAULT 0,
  PRIMARY KEY (client_id, date, campaign_name, campaign_type)
);

CREATE TABLE IF NOT EXISTS gads_detail (
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  campaign_name TEXT NOT NULL DEFAULT '',
  campaign_type TEXT NOT NULL DEFAULT '',
  ad_group TEXT NOT NULL DEFAULT '',
  keyword TEXT NOT NULL DEFAULT '',
  match_type TEXT NOT NULL DEFAULT '',
  device TEXT NOT NULL DEFAULT '',
  spend NUMERIC(14,2) DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions NUMERIC(10,2) DEFAULT 0,
  PRIMARY KEY (client_id, date, campaign_name, ad_group, keyword, match_type, device)
);

CREATE TABLE IF NOT EXISTS gads_gender (
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  campaign_name TEXT NOT NULL DEFAULT '',
  campaign_type TEXT NOT NULL DEFAULT '',
  segment_value TEXT NOT NULL DEFAULT '',
  spend NUMERIC(14,2) DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions NUMERIC(10,2) DEFAULT 0,
  PRIMARY KEY (client_id, date, campaign_name, segment_value)
);

CREATE TABLE IF NOT EXISTS gads_conversions (
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  campaign_name TEXT NOT NULL DEFAULT '',
  campaign_type TEXT NOT NULL DEFAULT '',
  segment_value TEXT NOT NULL DEFAULT '',
  conversions NUMERIC(10,2) DEFAULT 0,
  cost_per_conversion NUMERIC(14,2) DEFAULT 0,
  PRIMARY KEY (client_id, date, campaign_name, segment_value)
);

CREATE TABLE IF NOT EXISTS ga4_totals (
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  property_id TEXT NOT NULL DEFAULT '',
  property_name TEXT NOT NULL DEFAULT '',
  total_users INTEGER DEFAULT 0,
  new_users INTEGER DEFAULT 0,
  sessions INTEGER DEFAULT 0,
  engaged_sessions INTEGER DEFAULT 0,
  bounce_rate NUMERIC(8,6) DEFAULT 0,
  engagement_rate NUMERIC(8,6) DEFAULT 0,
  avg_session_duration NUMERIC(10,2) DEFAULT 0,
  event_count INTEGER DEFAULT 0,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (client_id, date, property_id)
);

CREATE TABLE IF NOT EXISTS ga4_acquisition (
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  property_id TEXT NOT NULL DEFAULT '',
  property_name TEXT NOT NULL DEFAULT '',
  channel_group TEXT NOT NULL DEFAULT '',
  medium TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT '',
  device TEXT NOT NULL DEFAULT '',
  country TEXT NOT NULL DEFAULT '',
  region TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  total_users INTEGER DEFAULT 0,
  new_users INTEGER DEFAULT 0,
  returning_users INTEGER DEFAULT 0,
  sessions INTEGER DEFAULT 0,
  engaged_sessions INTEGER DEFAULT 0,
  bounce_rate NUMERIC(8,6) DEFAULT 0,
  engagement_rate NUMERIC(8,6) DEFAULT 0,
  avg_session_duration NUMERIC(10,2) DEFAULT 0,
  user_engagement_duration NUMERIC(10,2) DEFAULT 0,
  event_count INTEGER DEFAULT 0,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (client_id, date, property_id, channel_group, medium, source, device, country, region, city)
);

CREATE TABLE IF NOT EXISTS ga4_audience (
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  property_id TEXT NOT NULL DEFAULT '',
  property_name TEXT NOT NULL DEFAULT '',
  age TEXT NOT NULL DEFAULT '',
  gender TEXT NOT NULL DEFAULT '',
  country TEXT NOT NULL DEFAULT '',
  total_users INTEGER DEFAULT 0,
  sessions INTEGER DEFAULT 0,
  new_users INTEGER DEFAULT 0,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (client_id, date, property_id, age, gender, country)
);

CREATE TABLE IF NOT EXISTS ga4_pages (
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  property_id TEXT NOT NULL DEFAULT '',
  property_name TEXT NOT NULL DEFAULT '',
  page_path TEXT NOT NULL DEFAULT '',
  device TEXT NOT NULL DEFAULT '',
  total_users INTEGER DEFAULT 0,
  new_users INTEGER DEFAULT 0,
  sessions INTEGER DEFAULT 0,
  engaged_sessions INTEGER DEFAULT 0,
  bounce_rate NUMERIC(8,6) DEFAULT 0,
  engagement_rate NUMERIC(8,6) DEFAULT 0,
  avg_session_duration NUMERIC(10,2) DEFAULT 0,
  event_count INTEGER DEFAULT 0,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (client_id, date, property_id, page_path, device)
);

CREATE TABLE IF NOT EXISTS gsc_totals (
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  ctr NUMERIC(8,4) DEFAULT 0,
  position NUMERIC(8,2) DEFAULT 0,
  PRIMARY KEY (client_id, date)
);

CREATE TABLE IF NOT EXISTS gsc_queries (
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  query TEXT NOT NULL DEFAULT '',
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  position NUMERIC(8,2) DEFAULT 0,
  PRIMARY KEY (client_id, date, query)
);

CREATE TABLE IF NOT EXISTS gsc_pages (
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  page TEXT NOT NULL DEFAULT '',
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  position NUMERIC(8,2) DEFAULT 0,
  PRIMARY KEY (client_id, date, page)
);

CREATE TABLE IF NOT EXISTS gsc_countries (
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  country TEXT NOT NULL DEFAULT '',
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  position NUMERIC(8,2) DEFAULT 0,
  PRIMARY KEY (client_id, date, country)
);

CREATE TABLE IF NOT EXISTS gsc_devices (
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  device TEXT NOT NULL DEFAULT '',
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  position NUMERIC(8,2) DEFAULT 0,
  PRIMARY KEY (client_id, date, device)
);

CREATE TABLE IF NOT EXISTS meta_totals (
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  campaign_name TEXT NOT NULL DEFAULT '',
  spend NUMERIC(14,2) DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  link_clicks INTEGER DEFAULT 0,
  landing_page_views INTEGER DEFAULT 0,
  leads INTEGER DEFAULT 0,
  complete_registrations INTEGER DEFAULT 0,
  messaging_conv_started INTEGER DEFAULT 0,
  contacts INTEGER DEFAULT 0,
  ig_profile_visits INTEGER DEFAULT 0,
  post_engagements INTEGER DEFAULT 0,
  content_views INTEGER DEFAULT 0,
  purchases INTEGER DEFAULT 0,
  purchase_value NUMERIC(14,2) DEFAULT 0,
  add_to_carts INTEGER DEFAULT 0,
  add_to_cart_value NUMERIC(14,2) DEFAULT 0,
  currency TEXT DEFAULT 'IDR',
  PRIMARY KEY (client_id, date, campaign_name)
);

CREATE TABLE IF NOT EXISTS meta_detail (
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  campaign_name TEXT NOT NULL DEFAULT '',
  adset_name TEXT NOT NULL DEFAULT '',
  ad_name TEXT NOT NULL DEFAULT '',
  spend NUMERIC(14,2) DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  link_clicks INTEGER DEFAULT 0,
  landing_page_views INTEGER DEFAULT 0,
  leads INTEGER DEFAULT 0,
  complete_registrations INTEGER DEFAULT 0,
  messaging_conv_started INTEGER DEFAULT 0,
  contacts INTEGER DEFAULT 0,
  ig_profile_visits INTEGER DEFAULT 0,
  post_engagements INTEGER DEFAULT 0,
  content_views INTEGER DEFAULT 0,
  purchases INTEGER DEFAULT 0,
  purchase_value NUMERIC(14,2) DEFAULT 0,
  add_to_carts INTEGER DEFAULT 0,
  add_to_cart_value NUMERIC(14,2) DEFAULT 0,
  PRIMARY KEY (client_id, date, campaign_name, adset_name, ad_name)
);

CREATE INDEX IF NOT EXISTS idx_gads_totals_client_date ON gads_totals (client_id, date);
CREATE INDEX IF NOT EXISTS idx_gads_detail_client_date ON gads_detail (client_id, date);
CREATE INDEX IF NOT EXISTS idx_gads_gender_client_date ON gads_gender (client_id, date);
CREATE INDEX IF NOT EXISTS idx_gads_conversions_client_date ON gads_conversions (client_id, date);
CREATE INDEX IF NOT EXISTS idx_ga4_totals_client_date ON ga4_totals (client_id, date);
CREATE INDEX IF NOT EXISTS idx_ga4_acquisition_client_date ON ga4_acquisition (client_id, date);
CREATE INDEX IF NOT EXISTS idx_ga4_audience_client_date ON ga4_audience (client_id, date);
CREATE INDEX IF NOT EXISTS idx_ga4_pages_client_date ON ga4_pages (client_id, date);
CREATE INDEX IF NOT EXISTS idx_gsc_totals_client_date ON gsc_totals (client_id, date);
CREATE INDEX IF NOT EXISTS idx_gsc_queries_client_date ON gsc_queries (client_id, date);
CREATE INDEX IF NOT EXISTS idx_gsc_pages_client_date ON gsc_pages (client_id, date);
CREATE INDEX IF NOT EXISTS idx_gsc_countries_client_date ON gsc_countries (client_id, date);
CREATE INDEX IF NOT EXISTS idx_gsc_devices_client_date ON gsc_devices (client_id, date);
CREATE INDEX IF NOT EXISTS idx_meta_totals_client_date ON meta_totals (client_id, date);
CREATE INDEX IF NOT EXISTS idx_meta_detail_client_date ON meta_detail (client_id, date);
