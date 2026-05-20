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
