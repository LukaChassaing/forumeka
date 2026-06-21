const VOYAGE_URL = 'https://api.voyageai.com/v1/embeddings';
const MODEL = 'voyage-3-lite';
export const EMBEDDING_DIMENSIONS = 512;

interface VoyageResponse {
  data: { embedding: number[] }[];
}

const MAX_RETRIES = 5;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Embed un batch de textes via Voyage `voyage-3-lite` (§11 architecture). */
export async function embed(
  texts: string[],
  apiKey = process.env.VOYAGE_API_KEY,
): Promise<number[][]> {
  if (!apiKey) throw new Error('VOYAGE_API_KEY manquant');
  if (texts.length === 0) return [];

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch(VOYAGE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ input: texts, model: MODEL }),
    });
    if (res.ok) {
      const body = (await res.json()) as VoyageResponse;
      return body.data.map((d) => d.embedding);
    }
    // Le tier gratuit Voyage limite à 3 req/min sans moyen de paiement : on retente avec backoff.
    if (res.status === 429 && attempt < MAX_RETRIES) {
      const retryAfter = Number(res.headers.get('retry-after'));
      const waitMs = retryAfter > 0 ? retryAfter * 1000 : 20_000 * (attempt + 1);
      await sleep(waitMs);
      continue;
    }
    throw new Error(`Voyage API ${res.status}: ${await res.text()}`);
  }
  throw new Error('Voyage API: nombre maximal de tentatives atteint');
}

export async function embedOne(text: string, apiKey?: string): Promise<number[]> {
  const [vector] = await embed([text], apiKey);
  if (!vector) throw new Error('Voyage API: réponse vide');
  return vector;
}
