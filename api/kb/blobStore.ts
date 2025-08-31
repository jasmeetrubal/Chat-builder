// blobStore.ts
import { list, put } from '@vercel/blob';

export type KBIndex = {
  chunks: Array<{ id: string; url: string; title: string; text: string; embedding: number[] }>;
  sources: string[];
  bytes?: number;
};

export async function loadIndex(botId: string): Promise<KBIndex> {
  const key = `kb/${botId}.json`;
  const { blobs } = await list({ prefix: key });
  if (!blobs.length) return { chunks: [], sources: [] };
  const kb = await fetch(blobs[0].url).then(r => r.json()).catch(() => null);
  return (kb && typeof kb === 'object')
    ? { chunks: kb.chunks || [], sources: kb.sources || [], bytes: kb.bytes }
    : { chunks: [], sources: [] };
}

export async function saveIndex(botId: string, index: KBIndex) {
  const key = `kb/${botId}.json`;
  await put(
    key,
    JSON.stringify(index),
    {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false,           // keep same key
      cacheControlMaxAge: 0
    }
  );
  return key;
}
