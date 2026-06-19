import * as cheerio from 'cheerio';
import type { ParsedThread, ThreadPost } from '../types.js';

/**
 * Parser Caradisiac (forum.caradisiac.com — moteur vBulletin).
 * Squelette à affiner sur des threads réels au Sprint 0.
 */
export function parseCaradisiac(html: string, url: string): ParsedThread {
  const $ = cheerio.load(html);

  const titre =
    $('h1.threadtitle, h1[class*="title"]').first().text().trim() ||
    $('title').text().split(/[-|]/)[0]?.trim() ||
    'Sans titre';

  const posts: ThreadPost[] = [];
  $('li.postbit, div.post, .postcontainer').each((_, el) => {
    const $el = $(el);
    const author =
      $el.find('.username, .author, [class*="user"]').first().text().trim() || 'anonyme';
    const date =
      $el.find('.date, .postdate, time').first().attr('datetime') ??
      $el.find('.date, .postdate, time').first().text().trim() ??
      null;
    const content = $el
      .find('.postcontent, .content, blockquote.postcontent')
      .first()
      .text()
      .replace(/\s+/g, ' ')
      .trim();
    if (content.length > 20) posts.push({ author, date: date || null, content });
  });

  const nb_pages = (() => {
    const pager = $('.pagination a, .pagenav a').last().text().trim();
    const n = Number.parseInt(pager, 10);
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
