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
