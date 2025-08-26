export function chunkText(text: string, size = 1200, overlap = 200) {
  const out: string[] = [];
  let i = 0;
  while (i < text.length) {
    const end = Math.min(text.length, i + size);
    out.push(text.slice(i, end));
    i = end - overlap;
    if (i < 0) i = 0;
    if (i >= text.length) break;
  }
  return out;
}