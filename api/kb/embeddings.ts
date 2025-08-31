// embeddings.ts
import OpenAI from 'openai';

const API_KEY = process.env.OPENAI_API_KEY || '';
const BASE_URL = process.env.OPENAI_BASE || undefined;   // e.g. https://openrouter.ai/api/v1
const EMB_MODEL = process.env.EMBED_MODEL || 'text-embedding-3-small';

if (!API_KEY) console.warn('[embeddings] OPENAI_API_KEY missing');

const client = new OpenAI({ apiKey: API_KEY, baseURL: BASE_URL });

export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (!texts.length) return [];
  const res = await client.embeddings.create({ model: EMB_MODEL as any, input: texts });
  return res.data.map(d => (d as any).embedding as number[]);
}

export async function embedQuery(q: string): Promise<number[]> {
  const res = await client.embeddings.create({ model: EMB_MODEL as any, input: q });
  return (res.data[0] as any).embedding as number[];
}
