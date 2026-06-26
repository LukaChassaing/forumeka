import { eq, sql } from 'drizzle-orm';
import { discoverThreads, runPipeline, SOURCES } from '@forumeka/extractor';
import type { Db } from './client.js';
import { crawlQueue, crawlBatches, discoverRuns } from './schema.js';
import { ingestExtractionRun } from './ingest.js';

/** Pas de vraie limite : discoverThreads s'arrête naturellement dès qu'une page de listing ne renvoie plus de nouveau thread. */
const NO_PAGE_CAP = 100_000;

/** Parcourt SOURCES, découvre les threads de chaque sous-forum et les ajoute à la file (idempotent). */
export async function discoverAll(
  db: Db,
  opts: { onProgress?: (info: { forum: string; label: string; page: number; totalFound: number }) => void } = {},
): Promise<{ found: number; added: number }> {
  let found = 0;
  let added = 0;
  for (const source of SOURCES) {
    for (const subforum of source.subforums) {
      let lastPage = 0;
      const urls = await discoverThreads(subforum.url, {
        maxPages: NO_PAGE_CAP,
        onPage: (info) => {
          lastPage = info.page;
          opts.onProgress?.({ forum: source.forum, label: subforum.label, ...info });
        },
      });
      found += urls.length;
      for (const url of urls) {
        const result = await db
          .insert(crawlQueue)
          .values({ threadUrl: url, forum: source.forum, subForumLabel: subforum.label })
          .onConflictDoNothing()
          .returning({ id: crawlQueue.id });
        if (result.length > 0) added++;
      }
      await db.insert(discoverRuns).values({
        forum: source.forum,
        subForumLabel: subforum.label,
        pagesScanned: lastPage,
        threadsFound: urls.length,
      });
    }
  }
  return { found, added };
}

export interface ProcessResult {
  threadUrl: string;
  status: 'ingested' | 'failed';
  error?: string;
  problemesCreated?: number;
  pistesCreatedNewProbleme?: number;
  pistesCreatedExistingProbleme?: number;
  inputTokens?: number;
  outputTokens?: number;
}

/** Ouvre un lot de traitement (un appel `crawl --max N`), pour le dashboard admin. */
export async function startBatch(db: Db, requestedMax: number): Promise<{ id: string }> {
  const [row] = await db.insert(crawlBatches).values({ requestedMax }).returning({ id: crawlBatches.id });
  return row!;
}

/** Ferme un lot et recalcule ses totaux à partir des threads qui lui sont rattachés (source de vérité unique). */
export async function finishBatch(db: Db, batchId: string): Promise<void> {
  await db.execute(sql`
    UPDATE crawl_batches SET
      finished_at = now(),
      threads_processed = (SELECT count(*) FROM crawl_queue WHERE batch_id = ${batchId}),
      problemes_created = (SELECT coalesce(sum(problemes_created), 0) FROM crawl_queue WHERE batch_id = ${batchId}),
      pistes_created = (SELECT coalesce(sum(pistes_created_new_probleme), 0) + coalesce(sum(pistes_created_existing_probleme), 0) FROM crawl_queue WHERE batch_id = ${batchId}),
      input_tokens = (SELECT coalesce(sum(input_tokens), 0) FROM crawl_queue WHERE batch_id = ${batchId}),
      output_tokens = (SELECT coalesce(sum(output_tokens), 0) FROM crawl_queue WHERE batch_id = ${batchId})
    WHERE id = ${batchId}
  `);
}

/** Traite le prochain thread en attente (discovered, ou failed avec <3 tentatives). Null si la file est vide. */
export async function processNext(db: Db, batchId?: string): Promise<ProcessResult | null> {
  const [row] = await db.execute<{ id: string; thread_url: string }>(sql`
    SELECT id, thread_url FROM crawl_queue
    WHERE status = 'discovered' OR (status = 'failed' AND attempts < 3)
    ORDER BY discovered_at ASC
    LIMIT 1
  `);
  if (!row) return null;

  await db
    .update(crawlQueue)
    .set({
      status: 'processing',
      attempts: sql`${crawlQueue.attempts} + 1`,
      batchId: batchId ?? null,
    })
    .where(eq(crawlQueue.id, row.id));

  try {
    const run = await runPipeline(row.thread_url);
    const result = await ingestExtractionRun(db, run);
    await db
      .update(crawlQueue)
      .set({
        status: 'ingested',
        processedAt: new Date(),
        error: null,
        problemesCreated: result.created.problemes,
        pistesCreatedNewProbleme: result.created.pistesNewProbleme,
        pistesCreatedExistingProbleme: result.created.pistesExistingProbleme,
        inputTokens: run.input_tokens ?? null,
        outputTokens: run.output_tokens ?? null,
        createdDetail: result.createdDetail,
      })
      .where(eq(crawlQueue.id, row.id));
    return {
      threadUrl: row.thread_url,
      status: 'ingested',
      problemesCreated: result.created.problemes,
      pistesCreatedNewProbleme: result.created.pistesNewProbleme,
      pistesCreatedExistingProbleme: result.created.pistesExistingProbleme,
      inputTokens: run.input_tokens,
      outputTokens: run.output_tokens,
    };
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

export interface SubForumProgress {
  forum: string;
  subForumLabel: string;
  discovered: number;
  ingested: number;
  oldestThreadDate: string | null;
  lastDiscoverRun: { ranAt: string; pagesScanned: number; threadsFound: number } | null;
}

/** Progression par sous-forum, pour le dashboard admin (§ roadmap indexation). */
export async function getSubForumProgress(db: Db): Promise<SubForumProgress[]> {
  const rows = await db.execute<{
    forum: string;
    sub_forum_label: string;
    discovered: string;
    ingested: string;
    oldest_thread_date: string | null;
    last_ran_at: string | null;
    last_pages_scanned: number | null;
    last_threads_found: number | null;
  }>(sql`
    SELECT
      cq.forum,
      cq.sub_forum_label,
      count(*) AS discovered,
      count(*) FILTER (WHERE cq.status = 'ingested') AS ingested,
      min(t.date_thread)::text AS oldest_thread_date,
      last_run.ran_at::text AS last_ran_at,
      last_run.pages_scanned AS last_pages_scanned,
      last_run.threads_found AS last_threads_found
    FROM crawl_queue cq
    LEFT JOIN threads t ON t.url = cq.thread_url
    LEFT JOIN LATERAL (
      SELECT ran_at, pages_scanned, threads_found
      FROM discover_runs dr
      WHERE dr.forum = cq.forum AND dr.sub_forum_label = cq.sub_forum_label
      ORDER BY dr.ran_at DESC
      LIMIT 1
    ) last_run ON true
    GROUP BY cq.forum, cq.sub_forum_label, last_run.ran_at, last_run.pages_scanned, last_run.threads_found
    ORDER BY cq.forum, cq.sub_forum_label
  `);
  return rows.map((r) => ({
    forum: r.forum,
    subForumLabel: r.sub_forum_label,
    discovered: Number(r.discovered),
    ingested: Number(r.ingested),
    oldestThreadDate: r.oldest_thread_date,
    lastDiscoverRun: r.last_ran_at
      ? {
          ranAt: r.last_ran_at,
          pagesScanned: Number(r.last_pages_scanned),
          threadsFound: Number(r.last_threads_found),
        }
      : null,
  }));
}

export interface CrawledThread {
  threadUrl: string;
  status: string;
  discoveredAt: string;
  processedAt: string | null;
  error: string | null;
  problemesCreated: number | null;
  pistesCreatedNewProbleme: number | null;
  pistesCreatedExistingProbleme: number | null;
  inputTokens?: number | null;
  outputTokens?: number | null;
  createdDetail?: { problemes: { id: string; titre: string }[]; pistes: { id: string; titre: string }[] } | null;
}

/** Détail des threads scannés pour un sous-forum donné, pour le dashboard admin. */
export async function getThreadsForSubForum(
  db: Db,
  forum: string,
  subForumLabel: string,
): Promise<CrawledThread[]> {
  const rows = await db
    .select({
      threadUrl: crawlQueue.threadUrl,
      status: crawlQueue.status,
      discoveredAt: crawlQueue.discoveredAt,
      processedAt: crawlQueue.processedAt,
      error: crawlQueue.error,
      problemesCreated: crawlQueue.problemesCreated,
      pistesCreatedNewProbleme: crawlQueue.pistesCreatedNewProbleme,
      pistesCreatedExistingProbleme: crawlQueue.pistesCreatedExistingProbleme,
    })
    .from(crawlQueue)
    .where(sql`${crawlQueue.forum} = ${forum} AND ${crawlQueue.subForumLabel} = ${subForumLabel}`)
    .orderBy(sql`${crawlQueue.discoveredAt} desc`);
  return rows.map((r) => ({ ...r, discoveredAt: r.discoveredAt.toISOString(), processedAt: r.processedAt?.toISOString() ?? null }));
}

/** Tarif Claude Haiku 4.5 (le seul modèle utilisé pour l'extraction) au 2026-06 : $1/$5 par MTok in/out. */
const HAIKU_PRICE_PER_MTOK = { input: 1, output: 5 };

export function estimateCostUsd(inputTokens: number, outputTokens: number): number {
  return (inputTokens / 1_000_000) * HAIKU_PRICE_PER_MTOK.input +
    (outputTokens / 1_000_000) * HAIKU_PRICE_PER_MTOK.output;
}

export interface CrawlBatch {
  id: string;
  startedAt: string;
  finishedAt: string | null;
  requestedMax: number;
  threadsProcessed: number;
  problemesCreated: number;
  pistesCreated: number;
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
  forums: { forum: string; subForumLabel: string; count: number }[];
}

/** Liste des lots de traitement (un par appel `crawl --max N`), les plus récents en premier. */
export async function getBatches(db: Db, limit = 50): Promise<CrawlBatch[]> {
  const rows = await db.execute<{
    id: string;
    started_at: string;
    finished_at: string | null;
    requested_max: number;
    threads_processed: number;
    problemes_created: number;
    pistes_created: number;
    input_tokens: number;
    output_tokens: number;
  }>(sql`
    SELECT id, started_at::text, finished_at::text, requested_max, threads_processed,
           problemes_created, pistes_created, input_tokens, output_tokens
    FROM crawl_batches
    ORDER BY started_at DESC
    LIMIT ${limit}
  `);

  const batches: CrawlBatch[] = [];
  for (const r of rows) {
    const forums = await db.execute<{ forum: string; sub_forum_label: string; count: string }>(sql`
      SELECT forum, sub_forum_label, count(*) AS count
      FROM crawl_queue
      WHERE batch_id = ${r.id}
      GROUP BY forum, sub_forum_label
      ORDER BY count DESC
    `);
    batches.push({
      id: r.id,
      startedAt: r.started_at,
      finishedAt: r.finished_at,
      requestedMax: r.requested_max,
      threadsProcessed: r.threads_processed,
      problemesCreated: r.problemes_created,
      pistesCreated: r.pistes_created,
      inputTokens: r.input_tokens,
      outputTokens: r.output_tokens,
      estimatedCostUsd: estimateCostUsd(r.input_tokens, r.output_tokens),
      forums: forums.map((f) => ({
        forum: f.forum,
        subForumLabel: f.sub_forum_label,
        count: Number(f.count),
      })),
    });
  }
  return batches;
}

/** Détail des threads traités dans un lot donné, pour le dashboard admin. */
export async function getThreadsForBatch(db: Db, batchId: string): Promise<CrawledThread[]> {
  const rows = await db
    .select({
      threadUrl: crawlQueue.threadUrl,
      status: crawlQueue.status,
      discoveredAt: crawlQueue.discoveredAt,
      processedAt: crawlQueue.processedAt,
      error: crawlQueue.error,
      problemesCreated: crawlQueue.problemesCreated,
      pistesCreatedNewProbleme: crawlQueue.pistesCreatedNewProbleme,
      pistesCreatedExistingProbleme: crawlQueue.pistesCreatedExistingProbleme,
      inputTokens: crawlQueue.inputTokens,
      outputTokens: crawlQueue.outputTokens,
      createdDetail: crawlQueue.createdDetail,
    })
    .from(crawlQueue)
    .where(eq(crawlQueue.batchId, batchId))
    .orderBy(sql`${crawlQueue.processedAt} desc`);
  return rows.map((r) => ({
    ...r,
    discoveredAt: r.discoveredAt.toISOString(),
    processedAt: r.processedAt?.toISOString() ?? null,
  }));
}
