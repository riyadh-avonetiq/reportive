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
