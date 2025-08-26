import type { VercelRequest, VercelResponse } from "@vercel/node";
import { OpenAI } from "openai";
import { embedQuery } from "../../lib/embeddings.js";
import { loadIndex } from "../../lib/blobStore.js";
import { topK } from "../../lib/search.js";

const MODEL = process.env.MODEL || "openrouter/auto";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const { botId, message } = (req.body as any) || {};
  if (!botId || !message) return res.status(400).json({ error: "botId and message required" });

  try {
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE,           // <-- important
      organization: process.env.OPENAI_ORG_ID,
      defaultHeaders: {
        ...(process.env.SITE_URL ? { "HTTP-Referer": process.env.SITE_URL } : {}),
        "X-Title": "YourBot",
      },
    });

    const index = await loadIndex(botId);

    let context = "";
    let hits: any[] = [];
    try {
      if (Array.isArray(index.chunks) && index.chunks.length > 0) {
        const qv = await embedQuery(message);
        hits = topK(index.chunks || [], qv, 6);
        context = hits.map((h: any) => `Source: ${h.url}\n${h.text}`).join("\n\n---\n\n");
      }
    } catch (e: any) {
      console.error("context-build-fail", e?.message || e);
      context = "";
      hits = [];
    }

    const completion = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: "You are a helpful assistant. If knowledge is relevant, cite source URLs inline." },
        ...(context ? [{ role: "system", content: `Knowledge:\n${context}` } as const] : []),
        { role: "user", content: message },
      ],
    });

    res.json({ ok: true, answer: completion.choices?.[0]?.message?.content || "", sources: hits });
  } catch (e: any) {
    const msg =
      e?.response?.data?.error?.message ||
      e?.response?.data?.message ||
      e?.message || "server_error";
    res.status(500).json({ error: msg });
  }
}
