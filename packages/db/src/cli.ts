#!/usr/bin/env node
import { Command } from 'commander';
import { readFile } from 'node:fs/promises';
import { ExtractionRunSchema } from '@forumeka/extractor/types';
import { createDb } from './client.js';
import { ingestExtractionRun } from './ingest.js';
import { createBoss, enqueueExtractionRun, startWorker } from './worker.js';
import { discoverAll, processNext, getQueueStats } from './crawl.js';
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

program
  .command('discover-all')
  .description('Découvre les threads de tous les sous-forums configurés (packages/extractor/src/sources.ts) et les ajoute à la file (idempotent)')
  .action(async () => {
    const db = createDb();
    try {
      let lastLabel = '';
      const { found, added } = await discoverAll(db, {
        onProgress: ({ forum, label, page, totalFound }) => {
          if (label !== lastLabel) {
            lastLabel = label;
            console.log(`→ ${forum} — ${label}`);
          }
          console.log(`  page ${page} — ${totalFound} thread(s) trouvé(s) jusqu'ici`);
        },
      });
      console.log(`✓ ${found} thread(s) trouvé(s), ${added} nouveau(x) ajouté(s) à la file`);
    } finally {
      await db.$client.end();
    }
  });

program
  .command('crawl')
  .description('Traite la file de crawl séquentiellement (un thread à la fois) jusqu’à épuisement')
  .option('-n, --max <n>', 'Nombre maximum de threads à traiter', '0')
  .action(async (opts: { max: string }) => {
    const db = createDb();
    const max = Number(opts.max);
    let processed = 0;
    try {
      while (max === 0 || processed < max) {
        const result = await processNext(db);
        if (!result) {
          console.log('✓ file épuisée');
          break;
        }
        processed++;
        if (result.status === 'ingested') {
          console.log(`✓ [${processed}] ${result.threadUrl}`);
        } else {
          console.error(`✗ [${processed}] ${result.threadUrl} — ${result.error}`);
        }
        if (processed % 10 === 0) {
          await db.execute(REFRESH_PISTE_STATS_SQL);
          console.log('  (piste_stats rafraîchie)');
        }
      }
    } finally {
      await db.execute(REFRESH_PISTE_STATS_SQL);
      await db.$client.end();
    }
  });

program
  .command('queue-stats')
  .description('Affiche le nombre de threads par statut dans la file de crawl')
  .action(async () => {
    const db = createDb();
    try {
      const stats = await getQueueStats(db);
      for (const s of stats) console.log(`${s.status.padEnd(12)} ${s.count}`);
    } finally {
      await db.$client.end();
    }
  });

program.parseAsync().catch((err) => {
  console.error(`✗ ${err instanceof Error ? err.message : String(err)}`);
  process.exitCode = 1;
});
