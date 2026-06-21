const VOYAGE_URL = 'https://api.voyageai.com/v1/embeddings';
const MODEL = 'voyage-3-lite';
export const EMBEDDING_DIMENSIONS = 512;

interface VoyageResponse {
  data: { embedding: number[] }[];
}

/** Embed un batch de textes via Voyage `voyage-3-lite` (§11 architecture). */
export async function embed(
  texts: string[],
  apiKey = process.env.VOYAGE_API_KEY,
): Promise<number[][]> {
  if (!apiKey) throw new Error('VOYAGE_API_KEY manquant');
  if (texts.length === 0) return [];

  const res = await fetch(VOYAGE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ input: texts, model: MODEL }),
  });
  if (!res.ok) {
    throw new Error(`Voyage API ${res.status}: ${await res.text()}`);
  }
  const body = (await res.json()) as VoyageResponse;
  return body.data.map((d) => d.embedding);
}

export async function embedOne(text: string, apiKey?: string): Promise<number[]> {
  const [vector] = await embed([text], apiKey);
  if (!vector) throw new Error('Voyage API: réponse vide');
  return vector;
}
