import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const base = process.env.OPENAI_BASE || "https://api.openai.com/v1";
  try {
    const r = await fetch(`${base}/models`, {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY || ""}`,
        ...(process.env.SITE_URL ? { "HTTP-Referer": process.env.SITE_URL } : {}),
        "X-Title": "YourBot"
      }
    });
    const text = await r.text();
    res.status(200).json({ ok: r.ok, status: r.status, base, sample: text.slice(0, 160) });
  } catch (e: any) {
    res.status(200).json({ ok: false, base, error: e?.message || "fetch failed" });
  }
}
