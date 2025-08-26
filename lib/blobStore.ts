import { put, head, del, list } from "@vercel/blob";

const FOLDER = "kb";

export async function saveIndex(botId: string, index: any) {
  const pathname = `${FOLDER}/${botId}.json`;
  try { await del(pathname); } catch {}
  const blob = await put(pathname, JSON.stringify(index), {
    access: "public",
    contentType: "application/json",
  });
  return { url: blob.url, pathname };
}

export async function loadIndex(botId: string) {
  const pathname = `${FOLDER}/${botId}.json`;
  try {
    const meta = await head(pathname);
    const res = await fetch(meta.downloadUrl || meta.url);
    const json = await res.json();
    return json;
  } catch {
    return { chunks: [] };
  }
}

export async function countChunks(botId: string) {
  const idx = await loadIndex(botId);
  return Array.isArray(idx.chunks) ? idx.chunks.length : 0;
}

export async function listIndexes(prefix = FOLDER) {
  const { blobs } = await list({ prefix });
  return blobs.map(b => ({ pathname: b.pathname, size: b.size, uploadedAt: b.uploadedAt }));
}