import * as cheerio from 'cheerio';
import { fetchAllowed } from './fetch.js';

const PHPBB_HOSTS = ['forum4x4.org'];
const TOPICS_PER_PHPBB_LISTING_PAGE = 50;

/** Construit l'URL de la page N d'un listing de sous-forum (style ?page=N, ou ?start=N pour phpBB). */
function buildListingPageUrl(url: string, page: number): string {
  if (page <= 1) return url;
  const host = new URL(url).hostname.replace(/^www\./, '');
  if (PHPBB_HOSTS.some((h) => host.endsWith(h))) {
    const u = new URL(url);
    u.searchParams.set('start', String((page - 1) * TOPICS_PER_PHPBB_LISTING_PAGE));
    return u.toString();
  }
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}page=${page}`;
}

function extractCaradisiacThreadLinks(html: string, baseUrl: string): string[] {
  const $ = cheerio.load(html);
  const urls = new Set<string>();
  $('a[href*="/topic/"]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href) return;
    urls.add(new URL(href, baseUrl).toString());
  });
  return [...urls];
}

function extractBimmerforumsThreadLinks(html: string, baseUrl: string): string[] {
  const $ = cheerio.load(html);
  const urls = new Set<string>();
  $('a[href*="showthread.php"], a.title').each((_, el) => {
    const href = $(el).attr('href');
    if (!href) return;
    urls.add(new URL(href, baseUrl).toString());
  });
  return [...urls];
}

/** Threads phpBB ressortent en doublon (lien titre + lien dernier message) avec un fragment `#pN` ; on normalise. */
function extractPhpbbThreadLinks(html: string, baseUrl: string): string[] {
  const $ = cheerio.load(html);
  const urls = new Set<string>();
  $('a[href*="viewtopic.php"]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href) return;
    const u = new URL(href, baseUrl);
    u.hash = '';
    u.searchParams.delete('sid');
    urls.add(u.toString());
  });
  return [...urls];
}

export interface DiscoverOptions {
  /** Nombre max de pages de listing à parcourir (borne le crawl, §12 architecture). */
  maxPages?: number;
}

/**
 * Découverte bornée de threads sur un sous-forum (Caradisiac ou Bimmerforums).
 * Respecte robots.txt + rate-limit via fetchAllowed. Ne suit jamais les liens hors du listing fourni.
 */
export async function discoverThreads(
  listingUrl: string,
  opts: DiscoverOptions = {},
): Promise<string[]> {
  const maxPages = opts.maxPages ?? 5;
  const host = new URL(listingUrl).hostname.replace(/^www\./, '');
  const extractor = host.endsWith('caradisiac.com')
    ? extractCaradisiacThreadLinks
    : host.endsWith('bimmerforums.com')
      ? extractBimmerforumsThreadLinks
      : PHPBB_HOSTS.some((h) => host.endsWith(h))
        ? extractPhpbbThreadLinks
        : null;
  if (!extractor) throw new Error(`Aucune découverte disponible pour ${host}`);

  const found = new Set<string>();
  for (let page = 1; page <= maxPages; page++) {
    const pageUrl = buildListingPageUrl(listingUrl, page);
    const html = await fetchAllowed(pageUrl);
    const links = extractor(html, pageUrl);
    if (links.length === 0) break;
    for (const link of links) found.add(link);
  }
  return [...found];
}
