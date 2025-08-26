import type { VercelRequest, VercelResponse } from "@vercel/node";
import { OpenAI } from "openai";
import { embedQuery } from "../../lib/embeddings.js";
import { loadIndex } from "../../lib/blobStore.js";
import { topK } from "../../lib/search.js";

const MODEL = process.env.MODEL || "gpt-4o-mini";

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
  const { botId, message } = (req.body as any) || {};
  if (!botId || !message) {
    res.status(400).json({ error: "botId and message required" });
    return;
  }
  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const index = await loadIndex(botId);
    const queryVec = await embedQuery(message);
    const hits = topK(index.chunks || [], queryVec, 6);
    const context = hits.map((h: any) => `Source: ${h.url}\n${h.text}`).join("\n\n---\n\n");

    const completion = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: "You are a helpful assistant. If the knowledge is relevant, cite the source URLs inline." },
        { role: "system", content: `Knowledge:\n${context}` },
        { role: "user", content: message },
      ],
    });

    res.json({ ok: true, answer: completion.choices?.[0]?.message?.content || "", sources: hits });
  } catch (e: any) {
    res.status(500).json({ error: "server_error" });
  }
}