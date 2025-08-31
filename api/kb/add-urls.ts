import type { VercelRequest, VercelResponse } from "@vercel/node";
import cheerio from "cheerio";
import { chunkText } from "../../lib/chunker.js";
import { embedTexts } from "../../lib/embeddings.js";
import { saveIndex, loadIndex } from "../../lib/blobStore.js";
// CORS
res.setHeader("Access-Control-Allow-Origin", "*");
res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
if (req.method === "OPTIONS") { res.status(204).end(); return; }

async function fetchText(url: string) {
  const html = await fetch(url).then((r) => r.text());
  const $ = cheerio.load(html);
  $("script,style,noscript,nav,footer,header").remove();
  const title = $("title").text() || url;
  const text = title + "\n\n" + $("body").text().replace(/\s+/g, " ").trim();
  return text;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") { res.status(204).end(); return; }

  if (req.method !== "POST") {
    res.status(405).json({ error: "POST only" });
    return;
  }
  const { botId, urls } = (req.body as any) || {};
  if (!botId || !Array.isArray(urls) || urls.length === 0) {
    res.status(400).json({ error: "botId and urls[] required" });
    return;
  }
  try {
    const index = await loadIndex(botId);
    const added: any[] = [];
    for (const url of urls) {
      try {
        const fullText = await fetchText(url);
        const chunks = chunkText(fullText, 1200, 200).map((t, i) => ({
          id: `url:${url}#${i}`,
          url,
          title: url,
          text: t,
        }));
        const vecs = await embedTexts(chunks.map((c) => c.text));
        for (let i = 0; i < chunks.length; i++) (chunks[i] as any).embedding = vecs[i];
        (index.chunks ||= []);
        index.chunks = index.chunks.filter((c: any) => !(c.id || "").startsWith(`url:${url}#`));
        index.chunks.push(...chunks);
        added.push({ url, chunks: chunks.length });
      } catch (e: any) {
        console.error("ingest failed for", url, e?.message);
      }
    }
    await saveIndex(botId, index);
    res.json({ ok: true, added, stats: { chunks: (index.chunks || []).length } });
  } catch (e: any) {
    res.status(500).json({ error: "server_error" });
  }
}
