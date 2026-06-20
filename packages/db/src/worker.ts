import PgBoss from 'pg-boss';
import type { ExtractionRun } from '@forumeka/extractor/types';
import { createDb } from './client.js';
import { ingestExtractionRun } from './ingest.js';

export const INGEST_QUEUE = 'ingest-extraction-run';

export function createBoss(databaseUrl = process.env.DATABASE_URL) {
  if (!databaseUrl) throw new Error('DATABASE_URL manquant');
  return new PgBoss(databaseUrl);
}

export async function enqueueExtractionRun(
  boss: PgBoss,
  run: ExtractionRun,
): Promise<string | null> {
  await boss.createQueue(INGEST_QUEUE);
  return boss.send(INGEST_QUEUE, run);
}

/** Démarre le worker qui ingère les ExtractionRun poussés sur la queue (Sprint 1). */
export async function startWorker(boss: PgBoss): Promise<void> {
  const db = createDb();
  await boss.createQueue(INGEST_QUEUE);
  await boss.work<ExtractionRun>(INGEST_QUEUE, async (jobs) => {
    for (const job of jobs) {
      const result = await ingestExtractionRun(db, job.data);
      console.log(
        `✓ thread ${result.threadId} ingéré (+${result.created.problemes} problème(s), +${result.created.pistes} piste(s))`,
      );
    }
  });
}
