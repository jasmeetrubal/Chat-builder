import type { VercelRequest, VercelResponse } from '@vercel/node';
export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    ok: true,
    hasOpenAI: !!process.env.OPENAI_API_KEY,
    hasBlobToken: !!process.env.BLOB_READ_WRITE_TOKEN,
    model: process.env.MODEL || 'gpt-4o-mini',
    embedModel: process.env.EMBED_MODEL || 'text-embedding-3-small'
  });
}
