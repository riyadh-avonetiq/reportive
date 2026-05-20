import { timingSafeEqual } from 'crypto';

export function requireSyncKey(req, res) {
  if (!process.env.SYNC_KEY) {
    res.status(500).json({ error: 'Server misconfigured' });
    return false;
  }
  const auth = req.headers['authorization'] || '';
  const expected = `Bearer ${process.env.SYNC_KEY}`;
  const a = Buffer.from(auth.padEnd(expected.length));
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}
