import type { VercelRequest, VercelResponse } from "@vercel/node";
import { OpenAI } from "openai";
import { embedQuery } from "../../lib/embeddings.js";
import { loadIndex } from "../../lib/blobStore.js";
import { topK } from "../../lib/search.js";

const MODEL = process.env.MODEL || "gpt-4o-mini";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const q = (req.query.q as string) || "";
  const botId = (req.query.botId as string) || "DEMO_BOT";

  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") { res.status(204).end(); return; }

  if (!q) {
    res.status(400).json({ error: "q required" });
    return;
  }

  // SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  // @ts-ignore
  res.flushHeaders?.();

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const index = await loadIndex(botId);
    const queryVec = await embedQuery(q);
    const hits = topK(index.chunks || [], queryVec, 6);
    const context = hits.map((h: any) => `Source: ${h.url}\n${h.text}`).join("\n\n---\n\n");

    const stream = await client.chat.completions.create({
      model: MODEL,
      stream: true,
      messages: [
        { role: "system", content: "You are a helpful assistant. If the knowledge is relevant, cite the source URLs inline." },
        { role: "system", content: `Knowledge:\n${context}` },
        { role: "user", content: q },
      ],
    });

    for await (const part of stream) {
      const token = part.choices?.[0]?.delta?.content || "";
      if (token) {
        res.write(`data: ${JSON.stringify({ token })}\n\n`);
      }
    }
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err: any) {
  const msg =
    err?.response?.data?.error?.message ||
    err?.message ||
    'unknown';
  console.error('stream-fail', msg);
  try {
    res.write(`data: ${JSON.stringify({ token: `\n[stream-error:${msg}]` })}\n\n`);
    res.write("data: [DONE]\n\n");
    res.end();
  } catch {}
}
