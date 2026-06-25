import * as cheerio from 'cheerio';
import type { ParsedThread, ThreadPost } from '../types.js';

/**
 * Parser Bimmerforums (bimmerforums.com — moteur vBulletin).
 */
export function parseBimmerforums(html: string, url: string): ParsedThread {
  const $ = cheerio.load(html);

  const titre =
    $('h1.threadtitle, h1[id^="thread_title"]').first().text().replace(/\s+/g, ' ').trim() ||
    $('title').text().split(/[-|]/)[0]?.trim() ||
    'Untitled';

  const posts: ThreadPost[] = [];
  $('li.postbit, div.postbit, div[id^="post_message_"]').each((_, el) => {
    const $el = $(el);
    const author =
      $el.find('.username, a.username').first().text().replace(/\s+/g, ' ').trim() || 'anonymous';
    const date =
      $el.find('span.date, .postdate time[datetime]').first().attr('datetime') ??
      $el.find('span.date').first().text().replace(/\s+/g, ' ').trim() ??
      null;
    const content = $el
      .find('div.postcontent, blockquote.postcontent, [id^="post_message_"]')
      .first()
      .text()
      .replace(/\s+/g, ' ')
      .trim();
    if (content.length > 20) posts.push({ author, date: date || null, content });
  });

  const nb_pages = (() => {
    const lastPageHref = $('span.first_last a, a[rel="last"]').first().attr('href') ?? '';
    const match = lastPageHref.match(/page(\d+)/);
    const n = match ? Number.parseInt(match[1]!, 10) : 1;
    return Number.isFinite(n) && n > 0 ? n : 1;
  })();

  const date_thread = posts[0]?.date ?? null;

  return {
    url,
    forum: 'bimmerforums.com',
    titre,
    date_thread,
    nb_pages,
    posts,
    langue_origine: 'en',
  };
}
