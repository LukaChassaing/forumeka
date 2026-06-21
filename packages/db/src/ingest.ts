import { sql } from 'drizzle-orm';
import type { ExtractionRun } from '@forumeka/extractor/types';
import type { Db } from './client.js';
import { problemes, pistes, pisteAliases, threads, threadPisteMentions } from './schema.js';
import { embed } from './embeddings.js';

/** Similarité cosine minimale pour rattacher à une entité existante plutôt que d'en créer une (§9 architecture). */
const DEDUP_SIMILARITY_THRESHOLD = 0.85;
const DEDUP_DISTANCE_THRESHOLD = 1 - DEDUP_SIMILARITY_THRESHOLD;

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

/** Retrouve le post phpBB dont le contenu correspond à l'extrait cité par l'extraction, pour lier au bon message plutôt qu'à la page 1 du thread. */
function findPostUrl(
  threadUrl: string,
  posts: { content: string; post_id?: string | null }[],
  extrait: string | null | undefined,
): string | undefined {
  if (!extrait) return undefined;
  const needle = normalize(extrait);
  const post = posts.find((p) => p.post_id && normalize(p.content).includes(needle));
  if (!post?.post_id) return undefined;
  const u = new URL(threadUrl);
  u.searchParams.set('p', post.post_id.replace(/^p/, ''));
  u.hash = post.post_id;
  return u.toString();
}

function slugify(titre: string): string {
  return (
    titre
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'probleme'
  );
}

async function uniqueSlug(db: Db, titre: string): Promise<string> {
  const base = slugify(titre);
  let candidate = base;
  let attempt = 1;
  while (await db.query.problemes.findFirst({ where: (p, { eq }) => eq(p.slug, candidate) })) {
    attempt += 1;
    candidate = `${base}-${attempt}`;
  }
  return candidate;
}

export interface IngestResult {
  threadId: string;
  problemeIds: string[];
  pisteIds: string[];
  created: { problemes: number; pistes: number };
}

async function findClosest(
  db: Db,
  table: typeof problemes | typeof pistes,
  embedding: number[],
  scope?: { column: 'problemeId'; value: string },
): Promise<{ id: string; distance: number } | undefined> {
  const vectorLiteral = `[${embedding.join(',')}]`;
  const scopeClause = table === pistes && scope ? sql` AND probleme_id = ${scope.value}` : sql``;
  const tableName = table === problemes ? 'problemes' : 'pistes';
  const rows = await db.execute<{ id: string; distance: number }>(sql`
    SELECT id, embedding <=> ${vectorLiteral}::vector AS distance
    FROM ${sql.identifier(tableName)}
    WHERE embedding IS NOT NULL${scopeClause}
    ORDER BY distance ASC
    LIMIT 1
  `);
  const row = rows[0];
  if (!row || row.distance > DEDUP_DISTANCE_THRESHOLD) return undefined;
  return row;
}

/** Ingère un ExtractionRun (sortie de l'extracteur Sprint 0) avec déduplication par similarité (v1). */
export async function ingestExtractionRun(db: Db, run: ExtractionRun): Promise<IngestResult> {
  let createdProblemes = 0;
  let createdPistes = 0;

  const existingThread = await db.query.threads.findFirst({
    where: (t, { eq }) => eq(t.url, run.thread.url),
  });
  const threadId =
    existingThread?.id ??
    (
      await db
        .insert(threads)
        .values({
          url: run.thread.url,
          forum: run.thread.forum,
          titre: run.thread.titre,
          dateThread: run.thread.date_thread,
          nbPages: run.thread.nb_pages,
          resolvedInThread: run.extraction.problemes.some((p) => p.resolved_in_thread),
          langueOrigine: run.thread.langue_origine,
          traduit: run.thread.langue_origine !== 'fr',
        })
        .returning({ id: threads.id })
    )[0]!.id;

  const problemeIds: string[] = [];
  const pisteIds: string[] = [];

  // Un seul appel batché à Voyage pour tout le run (le tier gratuit limite à 3 req/min).
  const problemeTexts = run.extraction.problemes.map(
    (item) => `${item.probleme.titre} — ${item.probleme.symptomes.join(', ')}`,
  );
  const pisteTexts = run.extraction.problemes.flatMap((item) =>
    item.pistes.map((piste) => piste.titre),
  );
  const allEmbeddings = await embed([...problemeTexts, ...pisteTexts]);
  const problemeEmbeddings = allEmbeddings.slice(0, problemeTexts.length);
  const pisteEmbeddings = allEmbeddings.slice(problemeTexts.length);
  let pisteEmbeddingIndex = 0;

  for (const [itemIndex, item] of run.extraction.problemes.entries()) {
    const problemeEmbedding = problemeEmbeddings[itemIndex]!;
    const closestProbleme = await findClosest(db, problemes, problemeEmbedding);

    const problemeId =
      closestProbleme?.id ??
      (
        await db
          .insert(problemes)
          .values({
            slug: await uniqueSlug(db, item.probleme.titre),
            titre: item.probleme.titre,
            vehicules: item.probleme.vehicules,
            symptomes: item.probleme.symptomes,
            embedding: problemeEmbedding,
            sourceType: 'llm',
            sourceModel: run.source_model,
          })
          .returning({ id: problemes.id })
      )[0]!.id;
    if (!closestProbleme) createdProblemes++;
    problemeIds.push(problemeId);

    let causeFinalePisteId: string | undefined;

    for (const piste of item.pistes) {
      const pisteEmbedding = pisteEmbeddings[pisteEmbeddingIndex++]!;
      const closestPiste = await findClosest(db, pistes, pisteEmbedding, {
        column: 'problemeId',
        value: problemeId,
      });

      const pisteId =
        closestPiste?.id ??
        (
          await db
            .insert(pistes)
            .values({
              problemeId,
              titre: piste.titre,
              embedding: pisteEmbedding,
              sourceType: 'llm',
              sourceModel: run.source_model,
            })
            .returning({ id: pistes.id })
        )[0]!.id;
      if (!closestPiste) {
        createdPistes++;
      } else {
        await db.insert(pisteAliases).values({ pisteId, alias: piste.titre }).onConflictDoNothing();
      }
      pisteIds.push(pisteId);

      await db
        .insert(threadPisteMentions)
        .values({
          threadId,
          pisteId,
          statutDansThread: piste.statut,
          extrait: piste.extrait,
          confidence: piste.confidence,
          postUrl: findPostUrl(run.thread.url, run.thread.posts, piste.extrait),
        })
        .onConflictDoNothing();

      if (item.resolved_in_thread && item.cause_finale === piste.titre) {
        causeFinalePisteId = pisteId;
      }
    }

    if (causeFinalePisteId) {
      await db
        .update(threads)
        .set({ causeFinaleId: causeFinalePisteId })
        .where(sql`id = ${threadId}`);
    }
  }

  return {
    threadId,
    problemeIds,
    pisteIds,
    created: { problemes: createdProblemes, pistes: createdPistes },
  };
}
