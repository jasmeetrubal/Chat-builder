import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    ok: true,
    message: "YourBot API is live",
    endpoints: [
      "/api/chat/stream?botId=...&q=...",
      "/api/chat   (POST { botId, message })",
      "/api/kb/add-urls   (POST { botId, urls: [...] })",
      "/api/kb/status?botId=...",
      "/api/kb/search?botId=...&q=..."
    ]
  });
}
