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
  if (req.method === "OPTIONS") { res.status(204).end(); return; }

  const q = (req.query.q as string) || "";
  const botId = (req.query.botId as string) || "DEMO_BOT";
  if (!q) return res.status(400).json({ error: "q required" });

  // SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");

  try {
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE,            // <-- important for OpenRouter
      organization: process.env.OPENAI_ORG_ID,
      defaultHeaders: {
        ...(process.env.SITE_URL ? { "HTTP-Referer": process.env.SITE_URL } : {}),
        "X-Title": "YourBot",
      },
    });

    const index = await loadIndex(botId);

    // build context only if we have KB; otherwise fall back to plain chat
    let context = "";
    try {
      if (Array.isArray(index.chunks) && index.chunks.length > 0) {
        const qv = await embedQuery(q);
        const hits = topK(index.chunks || [], qv, 6);
        context = hits.map((h: any) => `Source: ${h.url}\n${h.text}`).join("\n\n---\n\n");
      }
    } catch (e: any) {
      console.error("context-build-fail", e?.message || e);
      context = "";
    }

    const stream = await client.chat.completions.create({
      model: MODEL,
      stream: true,
      messages: [
        { role: "system", content: "You are a helpful assistant. If knowledge is relevant, cite the source URLs inline." },
        ...(context ? [{ role: "system", content: `Knowledge:\n${context}` } as const] : []),
        { role: "user", content: q },
      ],
    });

    for await (const part of stream) {
      const token = part.choices?.[0]?.delta?.content || "";
      if (token) res.write(`data: ${JSON.stringify({ token })}\n\n`);
    }
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err: any) {
    const msg =
      err?.response?.data?.error?.message ||
      err?.response?.data?.message ||
      err?.message || "unknown";
    try {
      res.write(`data: ${JSON.stringify({ token: `\n[stream-error:${msg}]` })}\n\n`);
      res.write("data: [DONE]\n\n");
      res.end();
    } catch {}
  }
}
