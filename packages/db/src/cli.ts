#!/usr/bin/env node
import { Command } from 'commander';
import { readFile } from 'node:fs/promises';
import { ExtractionRunSchema } from '@forumeka/extractor/types';
import { createDb } from './client.js';
import { ingestExtractionRun } from './ingest.js';
import { createBoss, enqueueExtractionRun, startWorker } from './worker.js';
import { REFRESH_PISTE_STATS_SQL } from './views.js';

const program = new Command();
program
  .name('forumeka-db')
  .description('Forumeka — admin DB & ingestion (Sprint 1)')
  .version('0.0.0');

async function loadRun(file: string) {
  const raw = await readFile(file, 'utf8');
  return ExtractionRunSchema.parse(JSON.parse(raw));
}

program
  .command('ingest')
  .description('Ingère un ExtractionRun JSON directement (dédup + insertion)')
  .argument('<fichier.json>')
  .action(async (file: string) => {
    const run = await loadRun(file);
    const db = createDb();
    try {
      const result = await ingestExtractionRun(db, run);
      console.log(
        `✓ thread ${result.threadId} — +${result.created.problemes} problème(s), +${result.created.pistes} piste(s)`,
      );
    } finally {
      await db.$client.end();
    }
  });

program
  .command('enqueue')
  .description('Pousse un ExtractionRun JSON sur la queue pg-boss pour ingestion asynchrone')
  .argument('<fichier.json>')
  .action(async (file: string) => {
    const run = await loadRun(file);
    const boss = createBoss();
    await boss.start();
    const jobId = await enqueueExtractionRun(boss, run);
    console.log(`✓ job ${jobId} mis en queue`);
    await boss.stop();
  });

program
  .command('worker')
  .description("Démarre le worker pg-boss qui consomme la queue d'ingestion")
  .action(async () => {
    const boss = createBoss();
    boss.on('error', (err) => console.error(err));
    await boss.start();
    await startWorker(boss);
    console.log('✓ worker démarré, en attente de jobs…');
  });

program
  .command('refresh-stats')
  .description('Rafraîchit la vue matérialisée piste_stats')
  .action(async () => {
    const db = createDb();
    try {
      await db.execute(REFRESH_PISTE_STATS_SQL);
      console.log('✓ piste_stats rafraîchie');
    } finally {
      await db.$client.end();
    }
  });

program.parseAsync().catch((err) => {
  console.error(`✗ ${err instanceof Error ? err.message : String(err)}`);
  process.exitCode = 1;
});
