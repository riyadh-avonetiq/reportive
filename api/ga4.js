import { sql } from './_db.js';

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    const { client_id, from, to, prevFrom, prevTo } = req.query;
    if (!client_id) return res.status(400).json({ error: 'client_id required' });

    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const d180 = new Date(Date.now() - 180 * 86400000).toISOString().split('T')[0];
    const f = from || d180;
    const t = to || yesterday;

    const [totals, acquisition, audience, pages] = await Promise.all([
      sql`SELECT date, property_id, property_name, total_users, new_users, sessions, engaged_sessions, bounce_rate, engagement_rate, avg_session_duration, event_count, synced_at FROM ga4_totals WHERE client_id = ${client_id} AND date >= ${f} AND date <= ${t} ORDER BY date`,
      sql`SELECT date, property_id, property_name, channel_group, medium, source, device, country, region, city, total_users, new_users, returning_users, sessions, engaged_sessions, bounce_rate, engagement_rate, avg_session_duration, user_engagement_duration, event_count, synced_at FROM ga4_acquisition WHERE client_id = ${client_id} AND date >= ${f} AND date <= ${t} ORDER BY date`,
      sql`SELECT date, property_id, property_name, age, gender, country, total_users, sessions, new_users, synced_at FROM ga4_audience WHERE client_id = ${client_id} AND date >= ${f} AND date <= ${t} ORDER BY date`,
      sql`SELECT date, property_id, property_name, page_path, device, total_users, new_users, sessions, engaged_sessions, bounce_rate, engagement_rate, avg_session_duration, event_count, synced_at FROM ga4_pages WHERE client_id = ${client_id} AND date >= ${f} AND date <= ${t} ORDER BY date DESC`,
    ]);

    let prev = { totals: [], acquisition: [], audience: [], pages: [] };
    if (prevFrom && prevTo) {
      const [pt, pa, pau, pp] = await Promise.all([
        sql`SELECT date, property_id, property_name, total_users, new_users, sessions, engaged_sessions, bounce_rate, engagement_rate, avg_session_duration, event_count, synced_at FROM ga4_totals WHERE client_id = ${client_id} AND date >= ${prevFrom} AND date <= ${prevTo} ORDER BY date`,
        sql`SELECT date, property_id, property_name, channel_group, medium, source, device, country, region, city, total_users, new_users, returning_users, sessions, engaged_sessions, bounce_rate, engagement_rate, avg_session_duration, user_engagement_duration, event_count, synced_at FROM ga4_acquisition WHERE client_id = ${client_id} AND date >= ${prevFrom} AND date <= ${prevTo} ORDER BY date`,
        sql`SELECT date, property_id, property_name, age, gender, country, total_users, sessions, new_users, synced_at FROM ga4_audience WHERE client_id = ${client_id} AND date >= ${prevFrom} AND date <= ${prevTo} ORDER BY date`,
        sql`SELECT date, property_id, property_name, page_path, device, total_users, new_users, sessions, engaged_sessions, bounce_rate, engagement_rate, avg_session_duration, event_count, synced_at FROM ga4_pages WHERE client_id = ${client_id} AND date >= ${prevFrom} AND date <= ${prevTo} ORDER BY date DESC`,
      ]);
      prev = { totals: pt, acquisition: pa, audience: pau, pages: pp };
    }

    res.json({ current: { totals, acquisition, audience, pages }, previous: prev });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
