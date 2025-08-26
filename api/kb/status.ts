import type { VercelRequest, VercelResponse } from "@vercel/node";
import { countChunks } from "../../lib/blobStore.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") { res.status(204).end(); return; }

  const botId = (req.query.botId as string) || "";
  if (!botId) return res.status(400).json({ error: "botId required" });
  const n = await countChunks(botId);
  res.json({ ok: true, chunks: n });
}