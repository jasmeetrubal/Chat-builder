
# Vercel API — SSE Chat + URL Knowledge Base (Blob)

Endpoints:
- `GET /api/chat/stream?botId=DEMO_BOT&q=hello` — SSE stream (token-by-token)
- `POST /api/chat` — non-stream fallback `{ botId, message }`
- `POST /api/kb/add-urls` — body: `{ botId, urls: ["https://..."] }`
- `GET /api/kb/status?botId=...` — returns chunk count
- `GET /api/kb/search?botId=...&q=...` — debug top-k

Storage:
- Uses **Vercel Blob** to store the index per bot at `kb/<botId>.json` (public for MVP).
- Requires `BLOB_READ_WRITE_TOKEN` env var (auto-added when you create a Blob store in the Vercel project).

Env vars:
- `OPENAI_API_KEY` (Required)
- `MODEL` (default `gpt-4o-mini`)
- `EMBED_MODEL` (default `text-embedding-3-small`)
- `BLOB_READ_WRITE_TOKEN` (auto)

## Deploy
1) Create a Vercel project (import GitHub or Upload).
2) In the project, go to **Storage → Connect → Blob** (adds token).
3) Add `OPENAI_API_KEY` in **Settings → Environment Variables**.
4) Deploy.

## Test
curl -X POST https://<app>.vercel.app/api/kb/add-urls \
  -H "Content-Type: application/json" \
  -d '{"botId":"DEMO_BOT","urls":["https://example.com"]}'

curl "https://<app>.vercel.app/api/kb/status?botId=DEMO_BOT"

curl "https://<app>.vercel.app/api/kb/search?botId=DEMO_BOT&q=pricing"

curl -N "https://<app>.vercel.app/api/chat/stream?botId=DEMO_BOT&q=What+does+it+say?"
