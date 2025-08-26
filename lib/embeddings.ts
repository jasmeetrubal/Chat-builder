// lib/embeddings.ts
import { OpenAI } from "openai";

const EMB_MODEL = process.env.EMBED_MODEL || "text-embedding-3-small";

// Support alternate providers (e.g., OpenRouter) + org header
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE,                 // e.g. https://openrouter.ai/api/v1
  organization: process.env.OPENAI_ORG_ID,          // optional
  // Helpful for OpenRouter rate-limits/analytics (optional, safe to keep)
  defaultHeaders: {
    ...(process.env.SITE_URL ? { "HTTP-Referer": process.env.SITE_URL } : {}),
    "X-Title": "YourBot",
  },
});

function chunk<T>(arr: T[], size: number) {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function formatErr(err: any) {
  // Try to bubble up the real reason (invalid key, insufficient_quota, etc.)
  return (
    err?.response?.data?.error?.message ||
    err?.response?.data?.message ||
    err?.message ||
    "embedding_error"
  );
}

/**
 * Embed multiple texts with simple batching to avoid provider limits.
 * Batches sequentially to reduce 429s on free/low-quota keys.
 */
export async function embedTexts(texts: string[], batchSize = 64): Promise<number[][]> {
  const batches = chunk(texts, batchSize);
  const vectors: number[][] = [];
  for (const b of batches) {
    try {
      const res = await client.embeddings.create({ model: EMB_MODEL, input: b });
      for (const d of res.data) vectors.push(d.embedding as number[]);
    } catch (e) {
      const msg = formatErr(e);
      // Throw with context so the caller can log/return a clear error
      throw new Error(`embedTexts failed (${EMB_MODEL}): ${msg}`);
    }
  }
  return vectors;
}

export async function embedQuery(q: string): Promise<number[]> {
  try {
    const res = await client.embeddings.create({ model: EMB_MODEL, input: q });
    return res.data[0].embedding as number[];
  } catch (e) {
    const msg = formatErr(e);
    throw new Error(`embedQuery failed (${EMB_MODEL}): ${msg}`);
  }
}
