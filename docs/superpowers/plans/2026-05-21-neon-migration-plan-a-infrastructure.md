# Neon Migration — Plan A: Infrastructure (Schema + Vercel API)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the Neon database schema and all Vercel API Function endpoints that replace the 4 Supabase clients, fully testable via Postman before any frontend or AppScript changes.

**Architecture:** Neon PostgreSQL (single DB, 18 tables) accessed server-side only via Vercel API Functions. Browser GET endpoints return current + previous period data. AppScript POST endpoints accept SYNC_KEY-authenticated batch upserts using unnest for efficiency. Static site served from `app/` directory, API functions from `api/` directory.

**Tech Stack:** Neon PostgreSQL, `@neondatabase/serverless` (HTTP mode), Vercel Serverless Functions (Node.js 20, ES modules), no ORM.

**Spec:** `docs/superpowers/specs/2026-05-21-neon-migration-design.md`

---

## File Map

```
neon_schema.sql                     CREATE — 18 tables + indexes
package.json                        CREATE — ES module config + @neondatabase/serverless
vercel.json                         CREATE — output dir + function runtime
api/
  _db.js                            CREATE — Neon sql client singleton
  _auth.js                          CREATE — SYNC_KEY validator
  gads.js                           CREATE — GET Google Ads data
  ga4.js                            CREATE — GET GA4 data
  gsc.js                            CREATE — GET Search Console data
  meta.js                           CREATE — GET Meta Ads data
  app/
    client.js                       CREATE — GET+PATCH clients + datasource_config
    team.js                         CREATE — GET team_members
  sync/
    gads.js                         CREATE — POST upsert Google Ads tables
    ga4.js                          CREATE — POST upsert GA4 tables
    gsc.js                          CREATE — POST upsert GSC tables
    meta.js                         CREATE — POST upsert Meta tables
```

---

## Task 1: Neon Database Schema

**Files:**
- Create: `neon_schema.sql`

- [ ] **Step 1: Create schema file**

Create `/Users/sleepanatomy/Documents/GitHub/reportive-dashboard/neon_schema.sql`:

```sql
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
```

- [ ] **Step 2: Run schema against Neon**

In Neon console (console.neon.tech) → SQL Editor, paste and run the full SQL above.

Expected: all 19 tables visible in Tables panel. No errors.

- [ ] **Step 3: Verify table count**

Run in Neon SQL Editor:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' ORDER BY table_name;
```

Expected output — exactly 18 rows:
```
clients, datasource_config, ga4_acquisition, ga4_audience, ga4_pages, ga4_totals,
gads_conversions, gads_detail, gads_gender, gads_totals,
gsc_countries, gsc_devices, gsc_pages, gsc_queries, gsc_totals,
meta_detail, meta_totals, team_members
```

- [ ] **Step 4: Commit**

```bash
git add neon_schema.sql
git commit -m "feat: add Neon database schema (19 tables)"
```

---

## Task 2: Vercel Project Setup

**Files:**
- Create: `package.json`
- Create: `vercel.json`
- Create: `api/_db.js`
- Create: `api/_auth.js`

- [ ] **Step 1: Verify curl returns 404 (no API yet)**

```bash
curl -s -o /dev/null -w "%{http_code}" https://reportive.avonetiq.com/api/gads
```

Expected: `404` or connection error — confirms endpoint does not exist yet.

- [ ] **Step 2: Create package.json**

Create `/Users/sleepanatomy/Documents/GitHub/reportive-dashboard/package.json`:

```json
{
  "type": "module",
  "dependencies": {
    "@neondatabase/serverless": "^0.10.4"
  }
}
```

- [ ] **Step 3: Install dependency**

```bash
cd /Users/sleepanatomy/Documents/GitHub/reportive-dashboard && npm install
```

Expected: `node_modules/` created, `package-lock.json` created.

- [ ] **Step 4: Create vercel.json**

Create `/Users/sleepanatomy/Documents/GitHub/reportive-dashboard/vercel.json`:

```json
{
  "outputDirectory": "app",
  "functions": {
    "api/**/*.js": {
      "runtime": "nodejs20.x"
    }
  }
}
```

- [ ] **Step 5: Create api/_db.js**

Create `/Users/sleepanatomy/Documents/GitHub/reportive-dashboard/api/_db.js`:

```js
import { neon } from '@neondatabase/serverless';
export const sql = neon(process.env.NEON_DATABASE_URL);
```

- [ ] **Step 6: Create api/_auth.js**

Create `/Users/sleepanatomy/Documents/GitHub/reportive-dashboard/api/_auth.js`:

```js
export function requireSyncKey(req, res) {
  const auth = req.headers['authorization'] || '';
  if (auth !== `Bearer ${process.env.SYNC_KEY}`) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}
```

- [ ] **Step 7: Set Vercel environment variables**

In Vercel dashboard → Project Settings → Environment Variables, add:

| Key | Value | Environment |
|---|---|---|
| `NEON_DATABASE_URL` | `postgresql://...` (from Neon dashboard → Connection string) | Production, Preview |
| `SYNC_KEY` | Generate a secure random string (e.g. `openssl rand -hex 32`) | Production, Preview |

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json vercel.json api/_db.js api/_auth.js
git commit -m "feat: setup Vercel API Functions infrastructure"
```

---

## Task 3: Google Ads GET Endpoint

**Files:**
- Create: `api/gads.js`

- [ ] **Step 1: Create api/gads.js**

Create `/Users/sleepanatomy/Documents/GitHub/reportive-dashboard/api/gads.js`:

```js
import { sql } from './_db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { client_id, from, to, prevFrom, prevTo } = req.query;
  if (!client_id) return res.status(400).json({ error: 'client_id required' });

  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const d180 = new Date(Date.now() - 180 * 86400000).toISOString().split('T')[0];
  const f = from || d180;
  const t = to || yesterday;

  const [totals, detail, gender, conversions] = await Promise.all([
    sql`SELECT date, campaign_name, campaign_type, spend, impressions, clicks, conversions FROM gads_totals WHERE client_id = ${client_id} AND date >= ${f} AND date <= ${t} ORDER BY date`,
    sql`SELECT date, campaign_name, campaign_type, ad_group, keyword, match_type, device, spend, impressions, clicks, conversions FROM gads_detail WHERE client_id = ${client_id} AND date >= ${f} AND date <= ${t} ORDER BY date`,
    sql`SELECT date, campaign_name, campaign_type, segment_value, spend, impressions, clicks, conversions FROM gads_gender WHERE client_id = ${client_id} AND date >= ${f} AND date <= ${t} ORDER BY date`,
    sql`SELECT date, campaign_name, campaign_type, segment_value, conversions, cost_per_conversion FROM gads_conversions WHERE client_id = ${client_id} AND date >= ${f} AND date <= ${t} ORDER BY date`,
  ]);

  let prev = { totals: [], detail: [], gender: [], conversions: [] };
  if (prevFrom && prevTo) {
    const [pt, pd, pg, pc] = await Promise.all([
      sql`SELECT date, campaign_name, campaign_type, spend, impressions, clicks, conversions FROM gads_totals WHERE client_id = ${client_id} AND date >= ${prevFrom} AND date <= ${prevTo} ORDER BY date`,
      sql`SELECT date, campaign_name, campaign_type, ad_group, keyword, match_type, device, spend, impressions, clicks, conversions FROM gads_detail WHERE client_id = ${client_id} AND date >= ${prevFrom} AND date <= ${prevTo} ORDER BY date`,
      sql`SELECT date, campaign_name, campaign_type, segment_value, spend, impressions, clicks, conversions FROM gads_gender WHERE client_id = ${client_id} AND date >= ${prevFrom} AND date <= ${prevTo} ORDER BY date`,
      sql`SELECT date, campaign_name, campaign_type, segment_value, conversions, cost_per_conversion FROM gads_conversions WHERE client_id = ${client_id} AND date >= ${prevFrom} AND date <= ${prevTo} ORDER BY date`,
    ]);
    prev = { totals: pt, detail: pd, gender: pg, conversions: pc };
  }

  res.json({ current: { totals, detail, gender, conversions }, previous: prev });
}
```

- [ ] **Step 2: Deploy to Vercel**

```bash
git add api/gads.js && git commit -m "feat: add GET /api/gads endpoint"
```

Push to trigger Vercel deploy (or `vercel --prod` if CLI installed).

- [ ] **Step 3: Test endpoint returns 400 without client_id**

```bash
curl -s "https://reportive.avonetiq.com/api/gads" | python3 -m json.tool
```

Expected:
```json
{ "error": "client_id required" }
```

- [ ] **Step 4: Test endpoint returns data**

```bash
curl -s "https://reportive.avonetiq.com/api/gads?client_id=avonetiq&from=2026-04-01&to=2026-04-30" | python3 -m json.tool
```

Expected: JSON with `current.totals`, `current.detail`, `current.gender`, `current.conversions` arrays (may be empty if no data yet — that's fine). No 500 error.

---

## Task 4: Google Ads Sync Endpoint

**Files:**
- Create: `api/sync/gads.js`

- [ ] **Step 1: Create api/sync/gads.js**

Create `/Users/sleepanatomy/Documents/GitHub/reportive-dashboard/api/sync/gads.js`:

```js
import { sql } from '../_db.js';
import { requireSyncKey } from '../_auth.js';

async function upsertGadsTotals(rows) {
  if (!rows.length) return;
  await sql`
    INSERT INTO gads_totals (client_id, date, campaign_name, campaign_type, spend, impressions, clicks, conversions)
    SELECT * FROM unnest(
      ${rows.map(r => r.client_id)}::text[],
      ${rows.map(r => r.date)}::date[],
      ${rows.map(r => r.campaign_name || '')}::text[],
      ${rows.map(r => r.campaign_type || '')}::text[],
      ${rows.map(r => Number(r.spend) || 0)}::numeric[],
      ${rows.map(r => parseInt(r.impressions) || 0)}::integer[],
      ${rows.map(r => parseInt(r.clicks) || 0)}::integer[],
      ${rows.map(r => Number(r.conversions) || 0)}::numeric[]
    ) AS t(client_id, date, campaign_name, campaign_type, spend, impressions, clicks, conversions)
    ON CONFLICT (client_id, date, campaign_name, campaign_type)
    DO UPDATE SET spend = EXCLUDED.spend, impressions = EXCLUDED.impressions,
      clicks = EXCLUDED.clicks, conversions = EXCLUDED.conversions
  `;
}

async function upsertGadsDetail(rows) {
  if (!rows.length) return;
  await sql`
    INSERT INTO gads_detail (client_id, date, campaign_name, campaign_type, ad_group, keyword, match_type, device, spend, impressions, clicks, conversions)
    SELECT * FROM unnest(
      ${rows.map(r => r.client_id)}::text[],
      ${rows.map(r => r.date)}::date[],
      ${rows.map(r => r.campaign_name || '')}::text[],
      ${rows.map(r => r.campaign_type || '')}::text[],
      ${rows.map(r => r.ad_group || '')}::text[],
      ${rows.map(r => r.keyword || '')}::text[],
      ${rows.map(r => r.match_type || '')}::text[],
      ${rows.map(r => r.device || '')}::text[],
      ${rows.map(r => Number(r.spend) || 0)}::numeric[],
      ${rows.map(r => parseInt(r.impressions) || 0)}::integer[],
      ${rows.map(r => parseInt(r.clicks) || 0)}::integer[],
      ${rows.map(r => Number(r.conversions) || 0)}::numeric[]
    ) AS t(client_id, date, campaign_name, campaign_type, ad_group, keyword, match_type, device, spend, impressions, clicks, conversions)
    ON CONFLICT (client_id, date, campaign_name, ad_group, keyword, match_type, device)
    DO UPDATE SET campaign_type = EXCLUDED.campaign_type, spend = EXCLUDED.spend,
      impressions = EXCLUDED.impressions, clicks = EXCLUDED.clicks, conversions = EXCLUDED.conversions
  `;
}

async function upsertGadsGender(rows) {
  if (!rows.length) return;
  await sql`
    INSERT INTO gads_gender (client_id, date, campaign_name, campaign_type, segment_value, spend, impressions, clicks, conversions)
    SELECT * FROM unnest(
      ${rows.map(r => r.client_id)}::text[],
      ${rows.map(r => r.date)}::date[],
      ${rows.map(r => r.campaign_name || '')}::text[],
      ${rows.map(r => r.campaign_type || '')}::text[],
      ${rows.map(r => r.segment_value || '')}::text[],
      ${rows.map(r => Number(r.spend) || 0)}::numeric[],
      ${rows.map(r => parseInt(r.impressions) || 0)}::integer[],
      ${rows.map(r => parseInt(r.clicks) || 0)}::integer[],
      ${rows.map(r => Number(r.conversions) || 0)}::numeric[]
    ) AS t(client_id, date, campaign_name, campaign_type, segment_value, spend, impressions, clicks, conversions)
    ON CONFLICT (client_id, date, campaign_name, segment_value)
    DO UPDATE SET campaign_type = EXCLUDED.campaign_type, spend = EXCLUDED.spend,
      impressions = EXCLUDED.impressions, clicks = EXCLUDED.clicks, conversions = EXCLUDED.conversions
  `;
}

async function upsertGadsConversions(rows) {
  if (!rows.length) return;
  await sql`
    INSERT INTO gads_conversions (client_id, date, campaign_name, campaign_type, segment_value, conversions, cost_per_conversion)
    SELECT * FROM unnest(
      ${rows.map(r => r.client_id)}::text[],
      ${rows.map(r => r.date)}::date[],
      ${rows.map(r => r.campaign_name || '')}::text[],
      ${rows.map(r => r.campaign_type || '')}::text[],
      ${rows.map(r => r.segment_value || '')}::text[],
      ${rows.map(r => Number(r.conversions) || 0)}::numeric[],
      ${rows.map(r => Number(r.cost_per_conversion) || 0)}::numeric[]
    ) AS t(client_id, date, campaign_name, campaign_type, segment_value, conversions, cost_per_conversion)
    ON CONFLICT (client_id, date, campaign_name, segment_value)
    DO UPDATE SET campaign_type = EXCLUDED.campaign_type, conversions = EXCLUDED.conversions,
      cost_per_conversion = EXCLUDED.cost_per_conversion
  `;
}

const HANDLERS = {
  gads_totals: upsertGadsTotals,
  gads_detail: upsertGadsDetail,
  gads_gender: upsertGadsGender,
  gads_conversions: upsertGadsConversions,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!requireSyncKey(req, res)) return;

  const { client_id, table, rows } = req.body;
  if (!client_id || !table || !Array.isArray(rows)) {
    return res.status(400).json({ error: 'client_id, table, rows required' });
  }
  if (!HANDLERS[table]) return res.status(400).json({ error: `Unknown table: ${table}` });

  const tagged = rows.map(r => ({ ...r, client_id }));
  await HANDLERS[table](tagged);
  res.json({ ok: true, count: rows.length });
}
```

- [ ] **Step 2: Commit and deploy**

```bash
git add api/sync/gads.js && git commit -m "feat: add POST /api/sync/gads endpoint"
```

- [ ] **Step 3: Test unauthorized request is rejected**

```bash
curl -s -X POST "https://reportive.avonetiq.com/api/sync/gads" \
  -H "Content-Type: application/json" \
  -d '{"client_id":"avonetiq","table":"gads_totals","rows":[]}' | python3 -m json.tool
```

Expected:
```json
{ "error": "Unauthorized" }
```

- [ ] **Step 4: Test sync with valid key**

Replace `YOUR_SYNC_KEY` with the value set in Vercel env:

```bash
curl -s -X POST "https://reportive.avonetiq.com/api/sync/gads" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SYNC_KEY" \
  -d '{
    "client_id": "avonetiq",
    "table": "gads_totals",
    "rows": [{"date":"2026-05-01","campaign_name":"Test","campaign_type":"Search","spend":100000,"impressions":5000,"clicks":120,"conversions":3}]
  }' | python3 -m json.tool
```

Expected:
```json
{ "ok": true, "count": 1 }
```

- [ ] **Step 5: Verify row in Neon**

Run in Neon SQL Editor:
```sql
SELECT * FROM gads_totals WHERE client_id = 'avonetiq' LIMIT 5;
```

Expected: 1 row with the test data. Delete it after verifying:
```sql
DELETE FROM gads_totals WHERE client_id = 'avonetiq' AND campaign_name = 'Test';
```

---

## Task 5: GA4 GET Endpoint

**Files:**
- Create: `api/ga4.js`

- [ ] **Step 1: Create api/ga4.js**

Create `/Users/sleepanatomy/Documents/GitHub/reportive-dashboard/api/ga4.js`:

```js
import { sql } from './_db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { client_id, from, to, prevFrom, prevTo } = req.query;
  if (!client_id) return res.status(400).json({ error: 'client_id required' });

  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const d180 = new Date(Date.now() - 180 * 86400000).toISOString().split('T')[0];
  const f = from || d180;
  const t = to || yesterday;

  const [totals, acquisition, audience, pages] = await Promise.all([
    sql`SELECT date, property_id, property_name, total_users, new_users, sessions, engaged_sessions, bounce_rate, engagement_rate, avg_session_duration, event_count FROM ga4_totals WHERE client_id = ${client_id} AND date >= ${f} AND date <= ${t} ORDER BY date`,
    sql`SELECT date, property_id, channel_group, medium, source, device, country, region, city, total_users, new_users, returning_users, sessions, engaged_sessions, bounce_rate, engagement_rate, avg_session_duration, user_engagement_duration, event_count FROM ga4_acquisition WHERE client_id = ${client_id} AND date >= ${f} AND date <= ${t} ORDER BY date`,
    sql`SELECT date, property_id, age, gender, country, total_users, sessions, new_users FROM ga4_audience WHERE client_id = ${client_id} AND date >= ${f} AND date <= ${t} ORDER BY date`,
    sql`SELECT date, property_id, page_path, device, total_users, new_users, sessions, engaged_sessions, bounce_rate, engagement_rate, avg_session_duration, event_count FROM ga4_pages WHERE client_id = ${client_id} AND date >= ${f} AND date <= ${t} ORDER BY date DESC`,
  ]);

  let prev = { totals: [], acquisition: [], audience: [], pages: [] };
  if (prevFrom && prevTo) {
    const [pt, pa, pau, pp] = await Promise.all([
      sql`SELECT date, property_id, property_name, total_users, new_users, sessions, engaged_sessions, bounce_rate, engagement_rate, avg_session_duration, event_count FROM ga4_totals WHERE client_id = ${client_id} AND date >= ${prevFrom} AND date <= ${prevTo} ORDER BY date`,
      sql`SELECT date, property_id, channel_group, medium, source, device, country, region, city, total_users, new_users, returning_users, sessions, engaged_sessions, bounce_rate, engagement_rate, avg_session_duration, user_engagement_duration, event_count FROM ga4_acquisition WHERE client_id = ${client_id} AND date >= ${prevFrom} AND date <= ${prevTo} ORDER BY date`,
      sql`SELECT date, property_id, age, gender, country, total_users, sessions, new_users FROM ga4_audience WHERE client_id = ${client_id} AND date >= ${prevFrom} AND date <= ${prevTo} ORDER BY date`,
      sql`SELECT date, property_id, page_path, device, total_users, new_users, sessions, engaged_sessions, bounce_rate, engagement_rate, avg_session_duration, event_count FROM ga4_pages WHERE client_id = ${client_id} AND date >= ${prevFrom} AND date <= ${prevTo} ORDER BY date DESC`,
    ]);
    prev = { totals: pt, acquisition: pa, audience: pau, pages: pp };
  }

  res.json({ current: { totals, acquisition, audience, pages }, previous: prev });
}
```

- [ ] **Step 2: Commit and test**

```bash
git add api/ga4.js && git commit -m "feat: add GET /api/ga4 endpoint"
```

```bash
curl -s "https://reportive.avonetiq.com/api/ga4?client_id=avonetiq" | python3 -m json.tool
```

Expected: JSON with `current.totals`, `current.acquisition`, `current.audience`, `current.pages` arrays. No 500.

---

## Task 6: GA4 Sync Endpoint

**Files:**
- Create: `api/sync/ga4.js`

- [ ] **Step 1: Create api/sync/ga4.js**

Create `/Users/sleepanatomy/Documents/GitHub/reportive-dashboard/api/sync/ga4.js`:

```js
import { sql } from '../_db.js';
import { requireSyncKey } from '../_auth.js';

async function upsertGa4Totals(rows) {
  if (!rows.length) return;
  await sql`
    INSERT INTO ga4_totals (client_id, date, property_id, property_name, total_users, new_users, sessions, engaged_sessions, bounce_rate, engagement_rate, avg_session_duration, event_count, synced_at)
    SELECT * FROM unnest(
      ${rows.map(r => r.client_id)}::text[],
      ${rows.map(r => r.date)}::date[],
      ${rows.map(r => r.property_id || '')}::text[],
      ${rows.map(r => r.property_name || '')}::text[],
      ${rows.map(r => parseInt(r.total_users) || 0)}::integer[],
      ${rows.map(r => parseInt(r.new_users) || 0)}::integer[],
      ${rows.map(r => parseInt(r.sessions) || 0)}::integer[],
      ${rows.map(r => parseInt(r.engaged_sessions) || 0)}::integer[],
      ${rows.map(r => Number(r.bounce_rate) || 0)}::numeric[],
      ${rows.map(r => Number(r.engagement_rate) || 0)}::numeric[],
      ${rows.map(r => Number(r.avg_session_duration) || 0)}::numeric[],
      ${rows.map(r => parseInt(r.event_count) || 0)}::integer[],
      ${rows.map(() => new Date().toISOString())}::timestamptz[]
    ) AS t(client_id, date, property_id, property_name, total_users, new_users, sessions, engaged_sessions, bounce_rate, engagement_rate, avg_session_duration, event_count, synced_at)
    ON CONFLICT (client_id, date, property_id)
    DO UPDATE SET property_name = EXCLUDED.property_name, total_users = EXCLUDED.total_users,
      new_users = EXCLUDED.new_users, sessions = EXCLUDED.sessions,
      engaged_sessions = EXCLUDED.engaged_sessions, bounce_rate = EXCLUDED.bounce_rate,
      engagement_rate = EXCLUDED.engagement_rate, avg_session_duration = EXCLUDED.avg_session_duration,
      event_count = EXCLUDED.event_count, synced_at = EXCLUDED.synced_at
  `;
}

async function upsertGa4Acquisition(rows) {
  if (!rows.length) return;
  await sql`
    INSERT INTO ga4_acquisition (client_id, date, property_id, property_name, channel_group, medium, source, device, country, region, city, total_users, new_users, returning_users, sessions, engaged_sessions, bounce_rate, engagement_rate, avg_session_duration, user_engagement_duration, event_count, synced_at)
    SELECT * FROM unnest(
      ${rows.map(r => r.client_id)}::text[],
      ${rows.map(r => r.date)}::date[],
      ${rows.map(r => r.property_id || '')}::text[],
      ${rows.map(r => r.property_name || '')}::text[],
      ${rows.map(r => r.channel_group || '')}::text[],
      ${rows.map(r => r.medium || '')}::text[],
      ${rows.map(r => r.source || '')}::text[],
      ${rows.map(r => r.device || '')}::text[],
      ${rows.map(r => r.country || '')}::text[],
      ${rows.map(r => r.region || '')}::text[],
      ${rows.map(r => r.city || '')}::text[],
      ${rows.map(r => parseInt(r.total_users) || 0)}::integer[],
      ${rows.map(r => parseInt(r.new_users) || 0)}::integer[],
      ${rows.map(r => parseInt(r.returning_users) || 0)}::integer[],
      ${rows.map(r => parseInt(r.sessions) || 0)}::integer[],
      ${rows.map(r => parseInt(r.engaged_sessions) || 0)}::integer[],
      ${rows.map(r => Number(r.bounce_rate) || 0)}::numeric[],
      ${rows.map(r => Number(r.engagement_rate) || 0)}::numeric[],
      ${rows.map(r => Number(r.avg_session_duration) || 0)}::numeric[],
      ${rows.map(r => Number(r.user_engagement_duration) || 0)}::numeric[],
      ${rows.map(r => parseInt(r.event_count) || 0)}::integer[],
      ${rows.map(() => new Date().toISOString())}::timestamptz[]
    ) AS t(client_id, date, property_id, property_name, channel_group, medium, source, device, country, region, city, total_users, new_users, returning_users, sessions, engaged_sessions, bounce_rate, engagement_rate, avg_session_duration, user_engagement_duration, event_count, synced_at)
    ON CONFLICT (client_id, date, property_id, channel_group, medium, source, device, country, region, city)
    DO UPDATE SET total_users = EXCLUDED.total_users, new_users = EXCLUDED.new_users,
      returning_users = EXCLUDED.returning_users, sessions = EXCLUDED.sessions,
      engaged_sessions = EXCLUDED.engaged_sessions, bounce_rate = EXCLUDED.bounce_rate,
      engagement_rate = EXCLUDED.engagement_rate, avg_session_duration = EXCLUDED.avg_session_duration,
      user_engagement_duration = EXCLUDED.user_engagement_duration, event_count = EXCLUDED.event_count,
      synced_at = EXCLUDED.synced_at
  `;
}

async function upsertGa4Audience(rows) {
  if (!rows.length) return;
  await sql`
    INSERT INTO ga4_audience (client_id, date, property_id, property_name, age, gender, country, total_users, sessions, new_users, synced_at)
    SELECT * FROM unnest(
      ${rows.map(r => r.client_id)}::text[],
      ${rows.map(r => r.date)}::date[],
      ${rows.map(r => r.property_id || '')}::text[],
      ${rows.map(r => r.property_name || '')}::text[],
      ${rows.map(r => r.age || '')}::text[],
      ${rows.map(r => r.gender || '')}::text[],
      ${rows.map(r => r.country || '')}::text[],
      ${rows.map(r => parseInt(r.total_users) || 0)}::integer[],
      ${rows.map(r => parseInt(r.sessions) || 0)}::integer[],
      ${rows.map(r => parseInt(r.new_users) || 0)}::integer[],
      ${rows.map(() => new Date().toISOString())}::timestamptz[]
    ) AS t(client_id, date, property_id, property_name, age, gender, country, total_users, sessions, new_users, synced_at)
    ON CONFLICT (client_id, date, property_id, age, gender, country)
    DO UPDATE SET total_users = EXCLUDED.total_users, sessions = EXCLUDED.sessions,
      new_users = EXCLUDED.new_users, synced_at = EXCLUDED.synced_at
  `;
}

async function upsertGa4Pages(rows) {
  if (!rows.length) return;
  await sql`
    INSERT INTO ga4_pages (client_id, date, property_id, property_name, page_path, device, total_users, new_users, sessions, engaged_sessions, bounce_rate, engagement_rate, avg_session_duration, event_count, synced_at)
    SELECT * FROM unnest(
      ${rows.map(r => r.client_id)}::text[],
      ${rows.map(r => r.date)}::date[],
      ${rows.map(r => r.property_id || '')}::text[],
      ${rows.map(r => r.property_name || '')}::text[],
      ${rows.map(r => r.page_path || '')}::text[],
      ${rows.map(r => r.device || '')}::text[],
      ${rows.map(r => parseInt(r.total_users) || 0)}::integer[],
      ${rows.map(r => parseInt(r.new_users) || 0)}::integer[],
      ${rows.map(r => parseInt(r.sessions) || 0)}::integer[],
      ${rows.map(r => parseInt(r.engaged_sessions) || 0)}::integer[],
      ${rows.map(r => Number(r.bounce_rate) || 0)}::numeric[],
      ${rows.map(r => Number(r.engagement_rate) || 0)}::numeric[],
      ${rows.map(r => Number(r.avg_session_duration) || 0)}::numeric[],
      ${rows.map(r => parseInt(r.event_count) || 0)}::integer[],
      ${rows.map(() => new Date().toISOString())}::timestamptz[]
    ) AS t(client_id, date, property_id, property_name, page_path, device, total_users, new_users, sessions, engaged_sessions, bounce_rate, engagement_rate, avg_session_duration, event_count, synced_at)
    ON CONFLICT (client_id, date, property_id, page_path, device)
    DO UPDATE SET total_users = EXCLUDED.total_users, new_users = EXCLUDED.new_users,
      sessions = EXCLUDED.sessions, engaged_sessions = EXCLUDED.engaged_sessions,
      bounce_rate = EXCLUDED.bounce_rate, engagement_rate = EXCLUDED.engagement_rate,
      avg_session_duration = EXCLUDED.avg_session_duration, event_count = EXCLUDED.event_count,
      synced_at = EXCLUDED.synced_at
  `;
}

const HANDLERS = {
  ga4_totals: upsertGa4Totals,
  ga4_acquisition: upsertGa4Acquisition,
  ga4_audience: upsertGa4Audience,
  ga4_pages: upsertGa4Pages,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!requireSyncKey(req, res)) return;

  const { client_id, table, rows } = req.body;
  if (!client_id || !table || !Array.isArray(rows)) {
    return res.status(400).json({ error: 'client_id, table, rows required' });
  }
  if (!HANDLERS[table]) return res.status(400).json({ error: `Unknown table: ${table}` });

  const tagged = rows.map(r => ({ ...r, client_id }));
  await HANDLERS[table](tagged);
  res.json({ ok: true, count: rows.length });
}
```

- [ ] **Step 2: Commit and test**

```bash
git add api/sync/ga4.js && git commit -m "feat: add POST /api/sync/ga4 endpoint"
```

```bash
curl -s -X POST "https://reportive.avonetiq.com/api/sync/ga4" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SYNC_KEY" \
  -d '{"client_id":"avonetiq","table":"ga4_totals","rows":[{"date":"2026-05-01","property_id":"123456789","property_name":"Test","total_users":1000,"new_users":800,"sessions":1200,"engaged_sessions":900,"bounce_rate":0.25,"engagement_rate":0.75,"avg_session_duration":130,"event_count":4800}]}' | python3 -m json.tool
```

Expected: `{ "ok": true, "count": 1 }`. Verify and delete test row in Neon SQL Editor.

---

## Task 7: GSC GET + Sync Endpoints

**Files:**
- Create: `api/gsc.js`
- Create: `api/sync/gsc.js`

- [ ] **Step 1: Create api/gsc.js**

Create `/Users/sleepanatomy/Documents/GitHub/reportive-dashboard/api/gsc.js`:

```js
import { sql } from './_db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { client_id, from, to, prevFrom, prevTo } = req.query;
  if (!client_id) return res.status(400).json({ error: 'client_id required' });

  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const d180 = new Date(Date.now() - 180 * 86400000).toISOString().split('T')[0];
  const f = from || d180;
  const t = to || yesterday;

  const [totals, queries, pages, countries, devices] = await Promise.all([
    sql`SELECT date, impressions, clicks, ctr, position FROM gsc_totals WHERE client_id = ${client_id} AND date >= ${f} AND date <= ${t} ORDER BY date`,
    sql`SELECT date, query, impressions, clicks, position FROM gsc_queries WHERE client_id = ${client_id} AND date >= ${f} AND date <= ${t} ORDER BY clicks DESC`,
    sql`SELECT date, page, impressions, clicks, position FROM gsc_pages WHERE client_id = ${client_id} AND date >= ${f} AND date <= ${t} ORDER BY clicks DESC`,
    sql`SELECT date, country, impressions, clicks, position FROM gsc_countries WHERE client_id = ${client_id} AND date >= ${f} AND date <= ${t} ORDER BY clicks DESC`,
    sql`SELECT date, device, impressions, clicks, position FROM gsc_devices WHERE client_id = ${client_id} AND date >= ${f} AND date <= ${t} ORDER BY clicks DESC`,
  ]);

  let prev = { totals: [], queries: [], pages: [], countries: [], devices: [] };
  if (prevFrom && prevTo) {
    const [pt, pq, pp, pc, pd] = await Promise.all([
      sql`SELECT date, impressions, clicks, ctr, position FROM gsc_totals WHERE client_id = ${client_id} AND date >= ${prevFrom} AND date <= ${prevTo} ORDER BY date`,
      sql`SELECT date, query, impressions, clicks, position FROM gsc_queries WHERE client_id = ${client_id} AND date >= ${prevFrom} AND date <= ${prevTo} ORDER BY clicks DESC`,
      sql`SELECT date, page, impressions, clicks, position FROM gsc_pages WHERE client_id = ${client_id} AND date >= ${prevFrom} AND date <= ${prevTo} ORDER BY clicks DESC`,
      sql`SELECT date, country, impressions, clicks, position FROM gsc_countries WHERE client_id = ${client_id} AND date >= ${prevFrom} AND date <= ${prevTo} ORDER BY clicks DESC`,
      sql`SELECT date, device, impressions, clicks, position FROM gsc_devices WHERE client_id = ${client_id} AND date >= ${prevFrom} AND date <= ${prevTo} ORDER BY clicks DESC`,
    ]);
    prev = { totals: pt, queries: pq, pages: pp, countries: pc, devices: pd };
  }

  res.json({ current: { totals, queries, pages, countries, devices }, previous: prev });
}
```

- [ ] **Step 2: Create api/sync/gsc.js**

Create `/Users/sleepanatomy/Documents/GitHub/reportive-dashboard/api/sync/gsc.js`:

```js
import { sql } from '../_db.js';
import { requireSyncKey } from '../_auth.js';

async function upsertGscTotals(rows) {
  if (!rows.length) return;
  await sql`
    INSERT INTO gsc_totals (client_id, date, impressions, clicks, ctr, position)
    SELECT * FROM unnest(
      ${rows.map(r => r.client_id)}::text[],
      ${rows.map(r => r.date)}::date[],
      ${rows.map(r => parseInt(r.impressions) || 0)}::integer[],
      ${rows.map(r => parseInt(r.clicks) || 0)}::integer[],
      ${rows.map(r => Number(r.ctr) || 0)}::numeric[],
      ${rows.map(r => Number(r.position) || 0)}::numeric[]
    ) AS t(client_id, date, impressions, clicks, ctr, position)
    ON CONFLICT (client_id, date)
    DO UPDATE SET impressions = EXCLUDED.impressions, clicks = EXCLUDED.clicks,
      ctr = EXCLUDED.ctr, position = EXCLUDED.position
  `;
}

async function upsertGscQueries(rows) {
  if (!rows.length) return;
  await sql`
    INSERT INTO gsc_queries (client_id, date, query, impressions, clicks, position)
    SELECT * FROM unnest(
      ${rows.map(r => r.client_id)}::text[],
      ${rows.map(r => r.date)}::date[],
      ${rows.map(r => r.query || '')}::text[],
      ${rows.map(r => parseInt(r.impressions) || 0)}::integer[],
      ${rows.map(r => parseInt(r.clicks) || 0)}::integer[],
      ${rows.map(r => Number(r.position) || 0)}::numeric[]
    ) AS t(client_id, date, query, impressions, clicks, position)
    ON CONFLICT (client_id, date, query)
    DO UPDATE SET impressions = EXCLUDED.impressions, clicks = EXCLUDED.clicks, position = EXCLUDED.position
  `;
}

async function upsertGscPages(rows) {
  if (!rows.length) return;
  await sql`
    INSERT INTO gsc_pages (client_id, date, page, impressions, clicks, position)
    SELECT * FROM unnest(
      ${rows.map(r => r.client_id)}::text[],
      ${rows.map(r => r.date)}::date[],
      ${rows.map(r => r.page || '')}::text[],
      ${rows.map(r => parseInt(r.impressions) || 0)}::integer[],
      ${rows.map(r => parseInt(r.clicks) || 0)}::integer[],
      ${rows.map(r => Number(r.position) || 0)}::numeric[]
    ) AS t(client_id, date, page, impressions, clicks, position)
    ON CONFLICT (client_id, date, page)
    DO UPDATE SET impressions = EXCLUDED.impressions, clicks = EXCLUDED.clicks, position = EXCLUDED.position
  `;
}

async function upsertGscCountries(rows) {
  if (!rows.length) return;
  await sql`
    INSERT INTO gsc_countries (client_id, date, country, impressions, clicks, position)
    SELECT * FROM unnest(
      ${rows.map(r => r.client_id)}::text[],
      ${rows.map(r => r.date)}::date[],
      ${rows.map(r => r.country || '')}::text[],
      ${rows.map(r => parseInt(r.impressions) || 0)}::integer[],
      ${rows.map(r => parseInt(r.clicks) || 0)}::integer[],
      ${rows.map(r => Number(r.position) || 0)}::numeric[]
    ) AS t(client_id, date, country, impressions, clicks, position)
    ON CONFLICT (client_id, date, country)
    DO UPDATE SET impressions = EXCLUDED.impressions, clicks = EXCLUDED.clicks, position = EXCLUDED.position
  `;
}

async function upsertGscDevices(rows) {
  if (!rows.length) return;
  await sql`
    INSERT INTO gsc_devices (client_id, date, device, impressions, clicks, position)
    SELECT * FROM unnest(
      ${rows.map(r => r.client_id)}::text[],
      ${rows.map(r => r.date)}::date[],
      ${rows.map(r => r.device || '')}::text[],
      ${rows.map(r => parseInt(r.impressions) || 0)}::integer[],
      ${rows.map(r => parseInt(r.clicks) || 0)}::integer[],
      ${rows.map(r => Number(r.position) || 0)}::numeric[]
    ) AS t(client_id, date, device, impressions, clicks, position)
    ON CONFLICT (client_id, date, device)
    DO UPDATE SET impressions = EXCLUDED.impressions, clicks = EXCLUDED.clicks, position = EXCLUDED.position
  `;
}

const HANDLERS = {
  gsc_totals: upsertGscTotals,
  gsc_queries: upsertGscQueries,
  gsc_pages: upsertGscPages,
  gsc_countries: upsertGscCountries,
  gsc_devices: upsertGscDevices,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!requireSyncKey(req, res)) return;

  const { client_id, table, rows } = req.body;
  if (!client_id || !table || !Array.isArray(rows)) {
    return res.status(400).json({ error: 'client_id, table, rows required' });
  }
  if (!HANDLERS[table]) return res.status(400).json({ error: `Unknown table: ${table}` });

  const tagged = rows.map(r => ({ ...r, client_id }));
  await HANDLERS[table](tagged);
  res.json({ ok: true, count: rows.length });
}
```

- [ ] **Step 3: Commit and test**

```bash
git add api/gsc.js api/sync/gsc.js && git commit -m "feat: add GET /api/gsc and POST /api/sync/gsc endpoints"
```

```bash
curl -s "https://reportive.avonetiq.com/api/gsc?client_id=avonetiq" | python3 -m json.tool
```

Expected: JSON with `current.totals`, `current.queries`, `current.pages`, `current.countries`, `current.devices`. No 500.

---

## Task 8: Meta GET + Sync Endpoints

**Files:**
- Create: `api/meta.js`
- Create: `api/sync/meta.js`

- [ ] **Step 1: Create api/meta.js**

Create `/Users/sleepanatomy/Documents/GitHub/reportive-dashboard/api/meta.js`:

```js
import { sql } from './_db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { client_id, from, to, prevFrom, prevTo } = req.query;
  if (!client_id) return res.status(400).json({ error: 'client_id required' });

  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const d180 = new Date(Date.now() - 180 * 86400000).toISOString().split('T')[0];
  const f = from || d180;
  const t = to || yesterday;

  const [totals, detail] = await Promise.all([
    sql`SELECT date, campaign_name, spend, impressions, reach, link_clicks, landing_page_views, leads, complete_registrations, messaging_conv_started, contacts, ig_profile_visits, post_engagements, content_views, purchases, purchase_value, add_to_carts, add_to_cart_value, currency FROM meta_totals WHERE client_id = ${client_id} AND date >= ${f} AND date <= ${t} ORDER BY date`,
    sql`SELECT date, campaign_name, adset_name, ad_name, spend, impressions, reach, link_clicks, landing_page_views, leads, complete_registrations, messaging_conv_started, contacts, ig_profile_visits, post_engagements, content_views, purchases, purchase_value, add_to_carts, add_to_cart_value FROM meta_detail WHERE client_id = ${client_id} AND date >= ${f} AND date <= ${t} ORDER BY date`,
  ]);

  let prev = { totals: [], detail: [] };
  if (prevFrom && prevTo) {
    const [pt, pd] = await Promise.all([
      sql`SELECT date, campaign_name, spend, impressions, reach, link_clicks, landing_page_views, leads, complete_registrations, messaging_conv_started, contacts, ig_profile_visits, post_engagements, content_views, purchases, purchase_value, add_to_carts, add_to_cart_value, currency FROM meta_totals WHERE client_id = ${client_id} AND date >= ${prevFrom} AND date <= ${prevTo} ORDER BY date`,
      sql`SELECT date, campaign_name, adset_name, ad_name, spend, impressions, reach, link_clicks, landing_page_views, leads, complete_registrations, messaging_conv_started, contacts, ig_profile_visits, post_engagements, content_views, purchases, purchase_value, add_to_carts, add_to_cart_value FROM meta_detail WHERE client_id = ${client_id} AND date >= ${prevFrom} AND date <= ${prevTo} ORDER BY date`,
    ]);
    prev = { totals: pt, detail: pd };
  }

  res.json({ current: { totals, detail }, previous: prev });
}
```

- [ ] **Step 2: Create api/sync/meta.js**

Create `/Users/sleepanatomy/Documents/GitHub/reportive-dashboard/api/sync/meta.js`:

```js
import { sql } from '../_db.js';
import { requireSyncKey } from '../_auth.js';

async function upsertMetaTotals(rows) {
  if (!rows.length) return;
  await sql`
    INSERT INTO meta_totals (client_id, date, campaign_name, spend, impressions, reach, link_clicks, landing_page_views, leads, complete_registrations, messaging_conv_started, contacts, ig_profile_visits, post_engagements, content_views, purchases, purchase_value, add_to_carts, add_to_cart_value, currency)
    SELECT * FROM unnest(
      ${rows.map(r => r.client_id)}::text[],
      ${rows.map(r => r.date)}::date[],
      ${rows.map(r => r.campaign_name || '')}::text[],
      ${rows.map(r => Number(r.spend) || 0)}::numeric[],
      ${rows.map(r => parseInt(r.impressions) || 0)}::integer[],
      ${rows.map(r => parseInt(r.reach) || 0)}::integer[],
      ${rows.map(r => parseInt(r.link_clicks) || 0)}::integer[],
      ${rows.map(r => parseInt(r.landing_page_views) || 0)}::integer[],
      ${rows.map(r => parseInt(r.leads) || 0)}::integer[],
      ${rows.map(r => parseInt(r.complete_registrations) || 0)}::integer[],
      ${rows.map(r => parseInt(r.messaging_conv_started) || 0)}::integer[],
      ${rows.map(r => parseInt(r.contacts) || 0)}::integer[],
      ${rows.map(r => parseInt(r.ig_profile_visits) || 0)}::integer[],
      ${rows.map(r => parseInt(r.post_engagements) || 0)}::integer[],
      ${rows.map(r => parseInt(r.content_views) || 0)}::integer[],
      ${rows.map(r => parseInt(r.purchases) || 0)}::integer[],
      ${rows.map(r => Number(r.purchase_value) || 0)}::numeric[],
      ${rows.map(r => parseInt(r.add_to_carts) || 0)}::integer[],
      ${rows.map(r => Number(r.add_to_cart_value) || 0)}::numeric[],
      ${rows.map(r => r.currency || 'IDR')}::text[]
    ) AS t(client_id, date, campaign_name, spend, impressions, reach, link_clicks, landing_page_views, leads, complete_registrations, messaging_conv_started, contacts, ig_profile_visits, post_engagements, content_views, purchases, purchase_value, add_to_carts, add_to_cart_value, currency)
    ON CONFLICT (client_id, date, campaign_name)
    DO UPDATE SET spend = EXCLUDED.spend, impressions = EXCLUDED.impressions, reach = EXCLUDED.reach,
      link_clicks = EXCLUDED.link_clicks, landing_page_views = EXCLUDED.landing_page_views,
      leads = EXCLUDED.leads, complete_registrations = EXCLUDED.complete_registrations,
      messaging_conv_started = EXCLUDED.messaging_conv_started, contacts = EXCLUDED.contacts,
      ig_profile_visits = EXCLUDED.ig_profile_visits, post_engagements = EXCLUDED.post_engagements,
      content_views = EXCLUDED.content_views, purchases = EXCLUDED.purchases,
      purchase_value = EXCLUDED.purchase_value, add_to_carts = EXCLUDED.add_to_carts,
      add_to_cart_value = EXCLUDED.add_to_cart_value, currency = EXCLUDED.currency
  `;
}

async function upsertMetaDetail(rows) {
  if (!rows.length) return;
  await sql`
    INSERT INTO meta_detail (client_id, date, campaign_name, adset_name, ad_name, spend, impressions, reach, link_clicks, landing_page_views, leads, complete_registrations, messaging_conv_started, contacts, ig_profile_visits, post_engagements, content_views, purchases, purchase_value, add_to_carts, add_to_cart_value)
    SELECT * FROM unnest(
      ${rows.map(r => r.client_id)}::text[],
      ${rows.map(r => r.date)}::date[],
      ${rows.map(r => r.campaign_name || '')}::text[],
      ${rows.map(r => r.adset_name || '')}::text[],
      ${rows.map(r => r.ad_name || '')}::text[],
      ${rows.map(r => Number(r.spend) || 0)}::numeric[],
      ${rows.map(r => parseInt(r.impressions) || 0)}::integer[],
      ${rows.map(r => parseInt(r.reach) || 0)}::integer[],
      ${rows.map(r => parseInt(r.link_clicks) || 0)}::integer[],
      ${rows.map(r => parseInt(r.landing_page_views) || 0)}::integer[],
      ${rows.map(r => parseInt(r.leads) || 0)}::integer[],
      ${rows.map(r => parseInt(r.complete_registrations) || 0)}::integer[],
      ${rows.map(r => parseInt(r.messaging_conv_started) || 0)}::integer[],
      ${rows.map(r => parseInt(r.contacts) || 0)}::integer[],
      ${rows.map(r => parseInt(r.ig_profile_visits) || 0)}::integer[],
      ${rows.map(r => parseInt(r.post_engagements) || 0)}::integer[],
      ${rows.map(r => parseInt(r.content_views) || 0)}::integer[],
      ${rows.map(r => parseInt(r.purchases) || 0)}::integer[],
      ${rows.map(r => Number(r.purchase_value) || 0)}::numeric[],
      ${rows.map(r => parseInt(r.add_to_carts) || 0)}::integer[],
      ${rows.map(r => Number(r.add_to_cart_value) || 0)}::numeric[]
    ) AS t(client_id, date, campaign_name, adset_name, ad_name, spend, impressions, reach, link_clicks, landing_page_views, leads, complete_registrations, messaging_conv_started, contacts, ig_profile_visits, post_engagements, content_views, purchases, purchase_value, add_to_carts, add_to_cart_value)
    ON CONFLICT (client_id, date, campaign_name, adset_name, ad_name)
    DO UPDATE SET spend = EXCLUDED.spend, impressions = EXCLUDED.impressions, reach = EXCLUDED.reach,
      link_clicks = EXCLUDED.link_clicks, landing_page_views = EXCLUDED.landing_page_views,
      leads = EXCLUDED.leads, complete_registrations = EXCLUDED.complete_registrations,
      messaging_conv_started = EXCLUDED.messaging_conv_started, contacts = EXCLUDED.contacts,
      ig_profile_visits = EXCLUDED.ig_profile_visits, post_engagements = EXCLUDED.post_engagements,
      content_views = EXCLUDED.content_views, purchases = EXCLUDED.purchases,
      purchase_value = EXCLUDED.purchase_value, add_to_carts = EXCLUDED.add_to_carts,
      add_to_cart_value = EXCLUDED.add_to_cart_value
  `;
}

const HANDLERS = {
  meta_totals: upsertMetaTotals,
  meta_detail: upsertMetaDetail,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!requireSyncKey(req, res)) return;

  const { client_id, table, rows } = req.body;
  if (!client_id || !table || !Array.isArray(rows)) {
    return res.status(400).json({ error: 'client_id, table, rows required' });
  }
  if (!HANDLERS[table]) return res.status(400).json({ error: `Unknown table: ${table}` });

  const tagged = rows.map(r => ({ ...r, client_id }));
  await HANDLERS[table](tagged);
  res.json({ ok: true, count: rows.length });
}
```

- [ ] **Step 3: Commit and test**

```bash
git add api/meta.js api/sync/meta.js && git commit -m "feat: add GET /api/meta and POST /api/sync/meta endpoints"
```

```bash
curl -s "https://reportive.avonetiq.com/api/meta?client_id=avonetiq" | python3 -m json.tool
```

Expected: JSON with `current.totals`, `current.detail`. No 500.

---

## Task 9: App Endpoints

**Files:**
- Create: `api/app/client.js`
- Create: `api/app/team.js`

- [ ] **Step 1: Create api/app/client.js**

Create `/Users/sleepanatomy/Documents/GitHub/reportive-dashboard/api/app/client.js`:

```js
import { sql } from '../_db.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { client_id, share_token } = req.query;

    if (share_token) {
      const rows = await sql`SELECT id, name, logo_url, layouts, configs FROM clients WHERE share_token = ${share_token} LIMIT 1`;
      if (!rows.length) return res.status(404).json({ error: 'Invalid share token' });
      const client = rows[0];
      const [config] = await sql`SELECT * FROM datasource_config WHERE client_id = ${client.id}`;
      return res.json({ client, datasource_config: config || null });
    }

    if (!client_id) return res.status(400).json({ error: 'client_id or share_token required' });

    const [clients, configs] = await Promise.all([
      sql`SELECT id, name, logo_url, share_token, layouts, configs, created_at FROM clients WHERE id = ${client_id}`,
      sql`SELECT * FROM datasource_config WHERE client_id = ${client_id}`,
    ]);

    if (!clients.length) return res.status(404).json({ error: 'Client not found' });
    return res.json({ client: clients[0], datasource_config: configs[0] || null });
  }

  if (req.method === 'PATCH') {
    const { client_id, layouts, configs, name, logo_url, share_token } = req.body;
    if (!client_id) return res.status(400).json({ error: 'client_id required' });

    if (layouts !== undefined) await sql`UPDATE clients SET layouts = ${JSON.stringify(layouts)} WHERE id = ${client_id}`;
    if (configs !== undefined) await sql`UPDATE clients SET configs = ${JSON.stringify(configs)} WHERE id = ${client_id}`;
    if (name !== undefined) await sql`UPDATE clients SET name = ${name} WHERE id = ${client_id}`;
    if (logo_url !== undefined) await sql`UPDATE clients SET logo_url = ${logo_url} WHERE id = ${client_id}`;
    if (share_token !== undefined) await sql`UPDATE clients SET share_token = ${share_token} WHERE id = ${client_id}`;

    return res.json({ ok: true });
  }

  if (req.method === 'POST') {
    const { id, name, logo_url } = req.body;
    if (!id || !name) return res.status(400).json({ error: 'id and name required' });
    await sql`INSERT INTO clients (id, name, logo_url) VALUES (${id}, ${name}, ${logo_url || null}) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, logo_url = EXCLUDED.logo_url`;
    return res.json({ ok: true });
  }

  if (req.method === 'DELETE') {
    const { client_id } = req.body;
    if (!client_id) return res.status(400).json({ error: 'client_id required' });
    await sql`DELETE FROM clients WHERE id = ${client_id}`;
    return res.json({ ok: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
```

- [ ] **Step 2: Create api/app/team.js**

Create `/Users/sleepanatomy/Documents/GitHub/reportive-dashboard/api/app/team.js`:

```js
import { sql } from '../_db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const members = await sql`SELECT id, email, name, role, created_at FROM team_members ORDER BY created_at`;
  res.json({ members });
}
```

- [ ] **Step 3: Commit and test**

```bash
git add api/app/client.js api/app/team.js && git commit -m "feat: add app endpoints (client GET/PATCH/POST/DELETE, team GET)"
```

Insert a test client first:
```bash
curl -s -X POST "https://reportive.avonetiq.com/api/app/client" \
  -H "Content-Type: application/json" \
  -d '{"id":"avonetiq","name":"Avonetiq","logo_url":null}' | python3 -m json.tool
```

Expected: `{ "ok": true }`

Then test GET:
```bash
curl -s "https://reportive.avonetiq.com/api/app/client?client_id=avonetiq" | python3 -m json.tool
```

Expected: JSON with `client.id = "avonetiq"` and `datasource_config = null`.

---

## Task 10: Final Verification

- [ ] **Step 1: Test all GET endpoints return valid JSON**

```bash
for endpoint in gads ga4 gsc meta; do
  echo "=== /api/$endpoint ===" && \
  curl -s "https://reportive.avonetiq.com/api/$endpoint?client_id=avonetiq" | python3 -c "import sys,json; d=json.load(sys.stdin); print('OK - keys:', list(d.keys()))"
done
```

Expected for each: `OK - keys: ['current', 'previous']`

- [ ] **Step 2: Test all sync endpoints reject without key**

```bash
for source in gads ga4 gsc meta; do
  code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "https://reportive.avonetiq.com/api/sync/$source" -H "Content-Type: application/json" -d '{}')
  echo "/api/sync/$source → $code (expect 401)"
done
```

Expected: all return `401`.

- [ ] **Step 3: Test app endpoints**

```bash
curl -s "https://reportive.avonetiq.com/api/app/team" | python3 -m json.tool
```

Expected: `{ "members": [] }` — no error.

- [ ] **Step 4: Verify Neon table row counts are all zero except clients**

Run in Neon SQL Editor:
```sql
SELECT 'clients' as t, COUNT(*) FROM clients
UNION ALL SELECT 'gads_totals', COUNT(*) FROM gads_totals
UNION ALL SELECT 'ga4_totals', COUNT(*) FROM ga4_totals
UNION ALL SELECT 'gsc_totals', COUNT(*) FROM gsc_totals
UNION ALL SELECT 'meta_totals', COUNT(*) FROM meta_totals;
```

Expected: `clients` = 1 (avonetiq), all others = 0. Plan A is complete.

- [ ] **Step 5: Final commit**

```bash
git add -A && git status
```

Ensure no untracked files are accidentally staged. Then:
```bash
git commit -m "feat: Plan A complete — Neon schema + all Vercel API endpoints deployed"
```
