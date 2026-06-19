import * as cheerio from 'cheerio';
import type { ParsedThread, ThreadPost } from '../types.js';

/**
 * Parser Caradisiac (forum.caradisiac.com — moteur Invision Power Board).
 */
export function parseCaradisiac(html: string, url: string): ParsedThread {
  const $ = cheerio.load(html);

  const titre =
    $('h1.ipsType_pageTitle').first().text().replace(/\s+/g, ' ').trim() ||
    $('title').text().split(/[-|]/)[0]?.trim() ||
    'Sans titre';

  const posts: ThreadPost[] = [];
  $('article.cPost').each((_, el) => {
    const $el = $(el);
    const author =
      $el.find('aside.cAuthorPane .cAuthorPane_author').first().text().replace(/\s+/g, ' ').trim() ||
      'anonyme';
    const date = $el.find('.ipsComment_meta time, time[datetime]').first().attr('datetime') ?? null;
    const content = $el
      .find('[data-role="commentContent"]')
      .first()
      .text()
      .replace(/\s+/g, ' ')
      .trim();
    if (content.length > 20) posts.push({ author, date: date || null, content });
  });

  const nb_pages = (() => {
    const pages = $('ul.ipsPagination[data-pages]').first().attr('data-pages');
    const n = Number.parseInt(pages ?? '', 10);
    return Number.isFinite(n) && n > 0 ? n : 1;
  })();

  const date_thread = posts[0]?.date ?? null;

  return {
    url,
    forum: 'forum.caradisiac.com',
    titre,
    date_thread,
    nb_pages,
    posts,
  };
}
