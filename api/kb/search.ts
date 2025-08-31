import type { VercelRequest, VercelResponse } from "@vercel/node";
import { loadIndex } from "../../lib/blobStore.js";
import { embedQuery } from "../../lib/embeddings.js";
import { topK } from "../../lib/search.js";
// CORS
res.setHeader("Access-Control-Allow-Origin", "*");
res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
if (req.method === "OPTIONS") { res.status(204).end(); return; }


export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") { res.status(204).end(); return; }

  const botId = (req.query.botId as string) || "";
  const q = (req.query.q as string) || "";
  const k = Number(req.query.k || 5);
  if (!botId || !q) return res.status(400).json({ error: "botId and q required" });

  const idx = await loadIndex(botId);
  const qv = await embedQuery(q);
  const hits = topK(idx.chunks || [], qv, k);
  res.json({ ok: true, hits });
}
