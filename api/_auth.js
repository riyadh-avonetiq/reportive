export function requireSyncKey(req, res) {
  const auth = req.headers['authorization'] || '';
  if (auth !== `Bearer ${process.env.SYNC_KEY}`) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}
