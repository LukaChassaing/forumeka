import { fetchAllowed, buildPageUrl } from './fetch.js';
import { parseThread, mergeThreadPages } from './parsers/index.js';
import { extractFromThread } from './extract.js';
import type { ExtractionRun, ParsedThread } from './types.js';

/** Récupère et parse toutes les pages d'un thread (rate-limit déjà géré par fetchAllowed). */
export async function fetchAndParseThread(url: string): Promise<ParsedThread> {
  const firstHtml = await fetchAllowed(url);
  const firstPage = parseThread(firstHtml, url);
  if (firstPage.nb_pages <= 1) return firstPage;

  const pages: ParsedThread[] = [firstPage];
  for (let page = 2; page <= firstPage.nb_pages; page++) {
    const pageUrl = buildPageUrl(url, page);
    const html = await fetchAllowed(pageUrl);
    pages.push(parseThread(html, url));
  }
  return mergeThreadPages(pages);
}

export async function runPipeline(url: string): Promise<ExtractionRun> {
  const thread = await fetchAndParseThread(url);
  const { model, extraction } = await extractFromThread(thread);
  return {
    schema_version: 1,
    source_model: model,
    extracted_at: new Date().toISOString(),
    thread,
    extraction,
  };
}
