// chunker.ts
export function chunkText(s: string, maxLen = 1200, overlap = 200): string[] {
  const out: string[] = [];
  s = (s || '').trim();
  if (!s) return out;

  // split on sentence-ish boundaries
  const parts = s.split(/(?<=[\.!?])\s+/g);
  let buf: string[] = [];

  const flush = (force = false) => {
    const joined = buf.join(' ').trim();
    if (joined && (force || joined.length >= maxLen)) out.push(joined.slice(0, maxLen));
    if (force) buf = []; else {
      // keep overlap from end
      const keep = joined.slice(Math.max(0, joined.length - overlap));
      buf = keep ? [keep] : [];
    }
  };

  for (const p of parts) {
    buf.push(p);
    const length = buf.join(' ').length;
    if (length >= maxLen) flush(false);
  }
  flush(true);
  return out;
}
