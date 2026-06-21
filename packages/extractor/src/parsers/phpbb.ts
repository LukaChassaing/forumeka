import * as cheerio from 'cheerio';
import type { ParsedThread, ThreadPost } from '../types.js';

/** Nombre de messages par page phpBB (déduit du décalage entre les liens `start=`, 10 par défaut). */
export function detectPostsPerPage($: cheerio.CheerioAPI): number {
  const starts = $('div.pagination a[href*="start="]')
    .map((_, el) => {
      const href = $(el).attr('href') ?? '';
      const match = href.match(/start=(\d+)/);
      return match ? Number.parseInt(match[1]!, 10) : null;
    })
    .get()
    .filter((n): n is number => n !== null && n > 0);
  return starts.length > 0 ? Math.min(...starts) : 10;
}

/**
 * Parser phpBB3 (ex: forum4x4.org). Structure standard du moteur phpBB.
 */
export function parsePhpbb(html: string, url: string, forum: string): ParsedThread {
  const $ = cheerio.load(html);

  const titre =
    $('h2.topic-title').first().text().replace(/\s+/g, ' ').trim() ||
    $('title').text().split(/[-|]/)[0]?.trim() ||
    'Sans titre';

  // L'URL découverte pointe souvent vers un post précis (?p=...) ; on bascule sur l'URL
  // canonique du topic (?t=...) pour que la pagination (?start=N) fonctionne sur les pages suivantes.
  const canonicalUrl = (() => {
    const href = $('h2.topic-title a').first().attr('href');
    if (!href) return url;
    const u = new URL(href, url);
    u.searchParams.delete('sid');
    u.searchParams.delete('start');
    return u.toString();
  })();

  const posts: ThreadPost[] = [];
  $('div.post').each((_, el) => {
    const $el = $(el);
    const author =
      $el.find('.postprofile .username-coloured, .postprofile .username').first().text().trim() ||
      'anonyme';
    const date = $el.find('p.author time[datetime]').first().attr('datetime') ?? null;
    const content = $el.find('div.content').first().text().replace(/\s+/g, ' ').trim();
    if (content.length > 20) posts.push({ author, date: date || null, content });
  });

  const postsPerPage = detectPostsPerPage($);
  const totalMessages = (() => {
    const text = $('div.pagination').first().text();
    const match = text.match(/(\d+)\s*messages?/);
    return match ? Number.parseInt(match[1]!, 10) : posts.length;
  })();
  const nb_pages = Math.max(1, Math.ceil(totalMessages / postsPerPage));

  const date_thread = posts[0]?.date ?? null;

  return {
    url: canonicalUrl,
    forum,
    titre,
    date_thread,
    nb_pages,
    posts,
    langue_origine: 'fr',
  };
}

/** Nombre de messages par page, à partir du HTML brut (utilisé pour paginer sans re-parser tout le thread). */
export function detectPostsPerPageFromHtml(html: string): number {
  return detectPostsPerPage(cheerio.load(html));
}
