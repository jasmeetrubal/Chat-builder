export function cosine(a: number[], b: number[]) {
  let dot = 0, an = 0, bn = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i];
    an += a[i] * a[i];
    bn += b[i] * b[i];
  }
  return dot / (Math.sqrt(an) * Math.sqrt(bn) + 1e-8);
}

export function topK(chunks: any[], queryVec: number[], k = 6) {
  const scored = chunks.map((c) => ({ ...c, score: cosine(queryVec, c.embedding || []) }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k).map(({ embedding, ...rest }) => rest);
}