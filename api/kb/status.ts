// api/kb/status.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { head, get } from "@vercel/blob";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS for browser calls
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(204).end();

  try {
    const botId = (req.query.botId as string) || "DEMO_BOT";
    const key = `kb/${botId}.json`;

    // Check if file exists
    const meta = await head(key).catch(() => null);
    if (!meta) {
      return res.status(200).json({
        exists: false,
        key,
        chunks: [],
        sources: [],
        bytes: 0,
        note: "No KB file yet. Ingest URLs first.",
      });
    }

    // Read file
    const { body } = await get(key);
    const text = await body?.text?.() ?? "";
    let data: any = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch (e) {
      console.error("kb-status: JSON parse failed", e);
      return res.status(200).json({
        exists: true,
        key,
        bytes: Number(meta.size ?? text.length ?? 0),
        chunks: [],
        sources: [],
        error: "KB file is corrupted / not valid JSON",
      });
    }

    return res.status(200).json({
      exists: true,
      key,
      bytes: Number(meta.size ?? text.length ?? 0),
      chunks: Array.isArray(data.chunks) ? data.chunks : [],
      sources: Array.isArray(data.sources) ? data.sources : [],
    });
  } catch (e: any) {
    console.error("kb-status crash", e);
    return res.status(200).json({ error: e?.message || String(e) });
  }
}
