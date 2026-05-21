import { sql } from '../_db.js';
import { requireSyncKey } from '../_auth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!requireSyncKey(req, res)) return;

  const { client_id } = req.query;
  if (!client_id) return res.status(400).json({ error: 'client_id required' });

  const [totals, acquisition, audience, pages] = await Promise.all([
    sql`SELECT MAX(date)::text AS d FROM ga4_totals      WHERE client_id = ${client_id}`,
    sql`SELECT MAX(date)::text AS d FROM ga4_acquisition WHERE client_id = ${client_id}`,
    sql`SELECT MAX(date)::text AS d FROM ga4_audience    WHERE client_id = ${client_id}`,
    sql`SELECT MAX(date)::text AS d FROM ga4_pages       WHERE client_id = ${client_id}`,
  ]);

  res.json({
    client_id,
    last_sync: {
      ga4_totals     : totals[0]?.d      || null,
      ga4_acquisition: acquisition[0]?.d || null,
      ga4_audience   : audience[0]?.d    || null,
      ga4_pages      : pages[0]?.d       || null,
    }
  });
}
