// api/kb/_list.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { list } from "@vercel/blob";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(204).end();

  try {
    const out = await list({ prefix: "kb/" }); // lists files starting with kb/
    res.status(200).json({ ok: true, files: out.blobs });
  } catch (e: any) {
    res.status(200).json({ ok: false, error: e?.message || String(e) });
  }
}
