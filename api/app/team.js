import { sql } from '../_db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const members = await sql`SELECT id, email, name, role, created_at FROM team_members ORDER BY created_at`;
  res.json({ members });
}
