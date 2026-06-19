import { fetch } from 'undici';
import robotsParser from 'robots-parser';
import pRetry from 'p-retry';

const DEFAULT_UA = 'Forumeka/0.1 (+https://forumeka.fr/bot)';
const DEFAULT_RATE_LIMIT_MS = 2000;

let lastFetchAt = 0;

async function rateLimit(minIntervalMs: number): Promise<void> {
  const wait = lastFetchAt + minIntervalMs - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastFetchAt = Date.now();
}

const robotsCache = new Map<string, ReturnType<typeof robotsParser>>();

async function getRobots(origin: string, ua: string) {
  const cached = robotsCache.get(origin);
  if (cached) return cached;
  const robotsUrl = `${origin}/robots.txt`;
  let body = '';
  try {
    const res = await fetch(robotsUrl, { headers: { 'User-Agent': ua } });
    if (res.ok) body = await res.text();
  } catch {
    // robots.txt absent: on traite comme permissif
  }
  const parser = robotsParser(robotsUrl, body);
  robotsCache.set(origin, parser);
  return parser;
}

export function buildPageUrl(url: string, page: number): string {
  if (page <= 1) return url;
  const base = url.endsWith('/') ? url.slice(0, -1) : url;
  return `${base}/page/${page}/`;
}

export interface FetchOptions {
  userAgent?: string;
  rateLimitMs?: number;
}

export async function fetchAllowed(url: string, opts: FetchOptions = {}): Promise<string> {
  const ua = opts.userAgent ?? process.env.EXTRACTOR_USER_AGENT ?? DEFAULT_UA;
  const envRate = Number(process.env.EXTRACTOR_RATE_LIMIT_MS);
  const rateLimitMs =
    opts.rateLimitMs ?? (Number.isFinite(envRate) && envRate > 0 ? envRate : DEFAULT_RATE_LIMIT_MS);
  const parsed = new URL(url);
  const robots = await getRobots(parsed.origin, ua);
  if (!robots.isAllowed(url, ua)) {
    throw new Error(`robots.txt interdit ${url} pour UA "${ua}"`);
  }
  await rateLimit(rateLimitMs);
  return pRetry(
    async () => {
      const res = await fetch(url, {
        headers: {
          'User-Agent': ua,
          Accept: 'text/html,application/xhtml+xml',
          'Accept-Language': 'fr-FR,fr;q=0.9',
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} sur ${url}`);
      return res.text();
    },
    { retries: 3, minTimeout: 2000, factor: 2 },
  );
}
