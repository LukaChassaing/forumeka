import type { ParsedThread } from '../types.js';
import { parseCaradisiac } from './caradisiac.js';

export function parseThread(html: string, url: string): ParsedThread {
  const host = new URL(url).hostname.replace(/^www\./, '');
  if (host.endsWith('caradisiac.com')) return parseCaradisiac(html, url);
  throw new Error(`Aucun parser disponible pour ${host}`);
}
