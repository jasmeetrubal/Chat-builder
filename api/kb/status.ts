// api/kb/status.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { list } from '@vercel/blob';

function setCors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }

  try {
    const botId = String(req.query.botId || 'DEMO_BOT');
    const key = `kb/${botId}.json`;

    const { blobs } = await list({ prefix: key });
    if (!blobs.length) {
      res.status(200).json({
        exists: false, key, chunks: [], sources: [], bytes: 0,
        note: 'No KB file yet. Ingest URLs first.'
      });
      return;
    }
    const url = blobs[0].url;
    const kb = await fetch(url).then(r => r.json());

    res.status(200).json({ exists: true, key, ...kb });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'status failed' });
  }
}
