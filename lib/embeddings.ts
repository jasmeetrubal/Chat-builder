import { OpenAI } from "openai";

const EMB_MODEL = process.env.EMBED_MODEL || "text-embedding-3-small";
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const res = await client.embeddings.create({ model: EMB_MODEL, input: texts });
  return res.data.map((d) => d.embedding as number[]);
}

export async function embedQuery(q: string): Promise<number[]> {
  const res = await client.embeddings.create({ model: EMB_MODEL, input: q });
  return res.data[0].embedding as number[];
}