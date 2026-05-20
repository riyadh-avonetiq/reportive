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
  try {
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
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
