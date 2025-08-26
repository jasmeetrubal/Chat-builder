// lib/embeddings.ts
import { OpenAI } from "openai";

const EMB_MODEL = process.env.EMBED_MODEL || "text-embedding-3-small";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE,        // e.g. https://openrouter.ai/api/v1 (optional)
  organization: process.env.OPENAI_ORG_ID, // optional
  defaultHeaders: {
    ...(process.env.SITE_URL ? { "HTTP-Referer": process.env.SITE_URL } : {}),
    "X-Title": "YourBot",
  },
});

function formatErr(err: any) {
  return (
    err?.response?.data?.error?.message ||
    err?.response?.data?.message ||
    err?.message ||
    "embedding_error"
  );
}

export async function embedTexts(texts: string[], batchSize = 64): Promise<number[][]> {
  const vectors: number[][] = [];
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    try {
      const res = await client.embeddings.create({ model: EMB_MODEL, input: batch });
      const data = res?.data;
      if (!Array.isArray(data) || data.length !== batch.length) {
        throw new Error(`no embedding array returned for ${batch.length} inputs`);
      }
      for (const d of data) vectors.push(d.embedding as number[]);
    } catch (e) {
      throw new Error(`embedTexts failed (${EMB_MODEL}): ${formatErr(e)}`);
    }
  }
  return vectors;
}

export async function embedQuery(q: string): Promise<number[]> {
  try {
    const res = await client.embeddings.create({ model: EMB_MODEL, input: q });
    const vec = res?.data?.[0]?.embedding;
    if (!vec) throw new Error("no embedding returned from provider");
    return vec as number[];
  } catch (e) {
    throw new Error(`embedQuery failed (${EMB_MODEL}): ${formatErr(e)}`);
  }
}
