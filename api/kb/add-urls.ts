// api/kb/add-urls.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { loadIndex, saveIndex } from '../../blobStore';
import { fetchText } from '../../fetchText';
import { chunkText } from '../../chunker';
import { embedTexts } from '../../embeddings';

function setCors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'POST only' }); return; }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const botId: string = body.botId;
  const urls: string[] = Array.isArray(body.urls) ? body.urls : [];

  if (!botId || !urls.length) {
    res.status(400).json({ error: 'botId and urls[] required' });
    return;
  }

  try {
    const index = await loadIndex(botId);
    const added: Array<{ url: string; chunks: number }> = [];

    for (const url of urls) {
      try {
        const fullText = await fetchText(url);
        const chunks = chunkText(fullText, 1200, 200).map((t, i) => ({
          id: `url:${url}#${i}`,
          url,
          title: url,
          text: t,
        }));

        const vecs = await embedTexts(chunks.map(c => c.text));
        for (let i = 0; i < chunks.length; i++) (chunks[i] as any).embedding = vecs[i];

        (index.chunks ||= []);
        // drop old chunks of the same url
        index.chunks = index.chunks.filter((c: any) => !(String(c.id || '').startsWith(`url:${url}#`)));
        index.chunks.push(...chunks);

        // track source urls
        index.sources = Array.from(new Set([...(index.sources || []), url]));

        added.push({ url, chunks: chunks.length });
      } catch (e: any) {
        console.error('ingest failed for', url, e?.message);
      }
    }

    index.bytes = Buffer.byteLength(JSON.stringify(index), 'utf8');
    await saveIndex(botId, index);
    res.json({ ok: true, added, stats: { chunks: (index.chunks || []).length, bytes: index.bytes } });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'server_error' });
  }
}
