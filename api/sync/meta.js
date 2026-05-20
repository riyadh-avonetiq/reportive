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
