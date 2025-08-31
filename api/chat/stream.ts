// api/chat/stream.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import OpenAI from "openai";

function cors(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);
  if (req.method === "OPTIONS") { res.status(204).end(); return; }

  // Support GET (?q=) for easy browser testing and POST {message}
  const q = (req.query.q as string) || (req.body && (req.body as any).message) || "";
  if (!q) { res.status(400).json({ error: "q or message required" }); return; }

  // SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");

  try {
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
      baseURL: process.env.OPENAI_BASE || undefined, // set to https://openrouter.ai/api/v1 if using OpenRouter
      defaultHeaders: {
        ...(process.env.SITE_URL ? { "HTTP-Referer": process.env.SITE_URL } : {}),
        "X-Title": "YourBot"
      }
    });

    const model = process.env.MODEL || "gpt-4o-mini";
    const stream = await client.chat.completions.create({
      model,
      stream: true,
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: q }
      ]
    });

    for await (const part of stream) {
      const token = part.choices?.[0]?.delta?.content || "";
      if (token) res.write(`data: ${JSON.stringify({ token })}\n\n`);
    }
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (e: any) {
    const msg =
      e?.response?.data?.error?.message ||
      e?.response?.data?.message ||
      e?.message || "unknown";
    try {
      res.write(`data: ${JSON.stringify({ token: `\n[stream-error:${msg}]` })}\n\n`);
      res.write("data: [DONE]\n\n");
      res.end();
    } catch {}
  }
}
