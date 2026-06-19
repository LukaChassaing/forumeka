#!/usr/bin/env node
import { Command } from 'commander';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { fetchAllowed } from './fetch.js';
import { fetchAndParseThread } from './pipeline.js';
import { extractFromThread } from './extract.js';
import type { ExtractionRun } from './types.js';

const program = new Command();
program.name('forumeka').description('Forumeka extractor — Sprint 0 CLI').version('0.0.0');

program
  .command('fetch')
  .description('Récupère un thread (respect robots.txt + rate limit) et dump le HTML')
  .argument('<url>')
  .option('-o, --out <dir>', 'Répertoire de sortie', 'out')
  .action(async (url: string, opts: { out: string }) => {
    const html = await fetchAllowed(url);
    await mkdir(opts.out, { recursive: true });
    const hash = createHash('sha1').update(url).digest('hex').slice(0, 10);
    const file = join(opts.out, `${hash}.html`);
    await writeFile(file, html, 'utf8');
    console.log(`✓ ${file} (${html.length} octets)`);
  });

program
  .command('parse')
  .description('Parse un thread depuis son URL et affiche le JSON normalisé')
  .argument('<url>')
  .action(async (url: string) => {
    const thread = await fetchAndParseThread(url);
    console.log(JSON.stringify(thread, null, 2));
  });

program
  .command('extract')
  .description('Pipeline complet : fetch → parse → LLM → JSON ExtractionRun')
  .argument('<url>')
  .option('-o, --out <dir>', 'Répertoire de sortie', 'out')
  .option('--no-save', 'Affiche sur stdout au lieu de sauvegarder')
  .action(async (url: string, opts: { out: string; save: boolean }) => {
    const thread = await fetchAndParseThread(url);
    console.error(`→ ${thread.posts.length} posts parsés (${thread.nb_pages} page(s)), appel LLM…`);
    const { model, extraction } = await extractFromThread(thread);
    const run: ExtractionRun = {
      schema_version: 1,
      source_model: model,
      extracted_at: new Date().toISOString(),
      thread,
      extraction,
    };
    if (!opts.save) {
      console.log(JSON.stringify(run, null, 2));
      return;
    }
    await mkdir(opts.out, { recursive: true });
    const hash = createHash('sha1').update(url).digest('hex').slice(0, 10);
    const file = join(opts.out, `${hash}.json`);
    await writeFile(file, JSON.stringify(run, null, 2), 'utf8');
    console.error(`✓ ${file}`);
    for (const item of extraction.problemes) {
      console.error(
        `  "${item.probleme.titre}" — ${item.pistes.length} piste(s) — ${item.resolved_in_thread ? 'résolu' : 'non résolu'}`,
      );
    }
  });

program.parseAsync().catch((err) => {
  console.error(`✗ ${err instanceof Error ? err.message : String(err)}`);
  process.exitCode = 1;
});
