// api/kb/search.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { list } from '@vercel/blob';
import { embedQuery } from '../../embeddings';

function setCors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
}

function cosine(a: number[], b: number[]) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { const x = a[i], y = b[i]; dot += x*y; na += x*x; nb += y*y; }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-8);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'GET') { res.status(405).json({ error: 'GET only' }); return; }

  try {
    const botId = String(req.query.botId || 'DEMO_BOT');
    const q = String(req.query.q || '').trim();
    if (!q) { res.status(400).json({ error: 'q required' }); return; }

    const key = `kb/${botId}.json`;
    const { blobs } = await list({ prefix: key });
    if (!blobs.length) { res.status(200).json({ hits: [] }); return; }

    const kb = await fetch(blobs[0].url).then(r => r.json());
    const chunks = Array.isArray(kb?.chunks) ? kb.chunks : [];

    const qvec = await embedQuery(q);
    const scored = chunks.map((c: any) => ({
      url: c.url, title: c.title, text: c.text,
      score: cosine(qvec, c.embedding || []),
    })).sort((a, b) => b.score - a.score).slice(0, 10);

    res.status(200).json({ hits: scored });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'search failed' });
  }
}
