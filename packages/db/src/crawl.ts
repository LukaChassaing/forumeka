import { eq, sql } from 'drizzle-orm';
import { discoverThreads, runPipeline, SOURCES } from '@forumeka/extractor';
import type { Db } from './client.js';
import { crawlQueue } from './schema.js';
import { ingestExtractionRun } from './ingest.js';

/** Parcourt SOURCES, découvre les threads de chaque sous-forum et les ajoute à la file (idempotent). */
export async function discoverAll(db: Db): Promise<{ found: number; added: number }> {
  let found = 0;
  let added = 0;
  for (const source of SOURCES) {
    for (const subforum of source.subforums) {
      const urls = await discoverThreads(subforum.url);
      found += urls.length;
      for (const url of urls) {
        const result = await db
          .insert(crawlQueue)
          .values({ threadUrl: url, forum: source.forum, subForumLabel: subforum.label })
          .onConflictDoNothing()
          .returning({ id: crawlQueue.id });
        if (result.length > 0) added++;
      }
    }
  }
  return { found, added };
}

export interface ProcessResult {
  threadUrl: string;
  status: 'ingested' | 'failed';
  error?: string;
}

/** Traite le prochain thread en attente (discovered, ou failed avec <3 tentatives). Null si la file est vide. */
export async function processNext(db: Db): Promise<ProcessResult | null> {
  const [row] = await db.execute<{ id: string; thread_url: string }>(sql`
    SELECT id, thread_url FROM crawl_queue
    WHERE status = 'discovered' OR (status = 'failed' AND attempts < 3)
    ORDER BY discovered_at ASC
    LIMIT 1
  `);
  if (!row) return null;

  await db
    .update(crawlQueue)
    .set({ status: 'processing', attempts: sql`${crawlQueue.attempts} + 1` })
    .where(eq(crawlQueue.id, row.id));

  try {
    const run = await runPipeline(row.thread_url);
    await ingestExtractionRun(db, run);
    await db
      .update(crawlQueue)
      .set({ status: 'ingested', processedAt: new Date(), error: null })
      .where(eq(crawlQueue.id, row.id));
    return { threadUrl: row.thread_url, status: 'ingested' };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await db
      .update(crawlQueue)
      .set({ status: 'failed', processedAt: new Date(), error: message })
      .where(eq(crawlQueue.id, row.id));
    return { threadUrl: row.thread_url, status: 'failed', error: message };
  }
}

export interface QueueStats {
  status: string;
  count: number;
}

export async function getQueueStats(db: Db): Promise<QueueStats[]> {
  const rows = await db.execute<{ status: string; count: string }>(sql`
    SELECT status, count(*) AS count FROM crawl_queue GROUP BY status ORDER BY status
  `);
  return rows.map((r) => ({ status: r.status, count: Number(r.count) }));
}
