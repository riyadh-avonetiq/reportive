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
