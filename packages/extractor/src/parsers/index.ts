import type { ParsedThread } from '../types.js';
import { parseCaradisiac } from './caradisiac.js';

export function parseThread(html: string, url: string): ParsedThread {
  const host = new URL(url).hostname.replace(/^www\./, '');
  if (host.endsWith('caradisiac.com')) return parseCaradisiac(html, url);
  throw new Error(`Aucun parser disponible pour ${host}`);
}

/** Fusionne les pages d'un même thread parsées séparément (page 1 fournit titre/date/nb_pages). */
export function mergeThreadPages(pages: ParsedThread[]): ParsedThread {
  const [first, ...rest] = pages;
  if (!first) throw new Error('mergeThreadPages: aucune page fournie');
  return {
    ...first,
    posts: [first, ...rest].flatMap((p) => p.posts),
  };
}
