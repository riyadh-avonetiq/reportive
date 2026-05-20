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
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
