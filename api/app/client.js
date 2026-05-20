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

    if (!client_id) {
      const clients = await sql`SELECT id, name, logo_url, share_token, layouts, configs, created_at FROM clients ORDER BY name`;
      return res.json({ clients });
    }

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
