import { fetchAllowed, buildPageUrl } from './fetch.js';
import { parseThread, mergeThreadPages } from './parsers/index.js';
import { detectPostsPerPageFromHtml } from './parsers/phpbb.js';
import { extractFromThread } from './extract.js';
import type { ExtractionRun, ParsedThread } from './types.js';

const PHPBB_HOSTS = ['forum4x4.org'];

/** Récupère et parse toutes les pages d'un thread (rate-limit déjà géré par fetchAllowed). */
export async function fetchAndParseThread(url: string): Promise<ParsedThread> {
  const firstHtml = await fetchAllowed(url);
  const firstPage = parseThread(firstHtml, url);
  if (firstPage.nb_pages <= 1) return firstPage;

  const host = new URL(firstPage.url).hostname.replace(/^www\./, '');
  const isPhpbb = PHPBB_HOSTS.some((h) => host.endsWith(h));

  if (isPhpbb) {
    // L'URL d'origine (souvent `?p=<post>`) peut rediriger phpBB vers n'importe quelle page du
    // thread : on ignore son contenu et on refetch proprement les pages 1..N depuis l'URL canonique.
    const postsPerPage = detectPostsPerPageFromHtml(firstHtml);
    const pages: ParsedThread[] = [];
    for (let page = 1; page <= firstPage.nb_pages; page++) {
      const pageUrl = buildPageUrl(firstPage.url, page, postsPerPage);
      const html = await fetchAllowed(pageUrl);
      pages.push(parseThread(html, firstPage.url));
    }
    return mergeThreadPages(pages);
  }

  const pages: ParsedThread[] = [firstPage];
  for (let page = 2; page <= firstPage.nb_pages; page++) {
    const pageUrl = buildPageUrl(firstPage.url, page);
    const html = await fetchAllowed(pageUrl);
    pages.push(parseThread(html, firstPage.url));
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
