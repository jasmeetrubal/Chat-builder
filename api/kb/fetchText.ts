// fetchText.ts
export async function fetchText(url: string): Promise<string> {
  const r = await fetch(url, { redirect: 'follow' });
  if (!r.ok) throw new Error(`fetch ${url} -> ${r.status}`);
  let html = await r.text();

  // quick & dirty cleanup (strip scripts/styles; collapse whitespace)
  html = html.replace(/<script[\s\S]*?<\/script>/gi, ' ')
             .replace(/<style[\s\S]*?<\/style>/gi, ' ');
  const txt = html.replace(/<[^>]+>/g, ' ')
                  .replace(/\s+/g, ' ')
                  .trim();
  return txt;
}
