import { fetchAllowed } from './fetch.js';
import { parseThread } from './parsers/index.js';
import { extractFromThread } from './extract.js';
import type { ExtractionRun } from './types.js';

export async function runPipeline(url: string): Promise<ExtractionRun> {
  const html = await fetchAllowed(url);
  const thread = parseThread(html, url);
  const { model, extraction } = await extractFromThread(thread);
  return {
    schema_version: 1,
    source_model: model,
    extracted_at: new Date().toISOString(),
    thread,
    extraction,
  };
}
