import { desc, eq, ilike, or, sql } from 'drizzle-orm';
import type { Db } from './client.js';
import { problemes, pisteAliases, threads, threadPisteMentions } from './schema.js';

export interface ProblemeSearchResult {
  id: string;
  slug: string;
  titre: string;
  vehicules: string[];
  symptomes: string[];
}

/** Recherche simple par correspondance texte (v1) — autocomplete véhicule + symptôme (§6 architecture). */
export async function searchProblemes(
  db: Db,
  query: string,
  limit = 10,
): Promise<ProblemeSearchResult[]> {
  const pattern = `%${query}%`;
  const rows = await db
    .select({
      id: problemes.id,
      slug: problemes.slug,
      titre: problemes.titre,
      vehicules: problemes.vehicules,
      symptomes: problemes.symptomes,
    })
    .from(problemes)
    .where(
      or(
        ilike(problemes.titre, pattern),
        sql`${problemes.vehicules}::text ILIKE ${pattern}`,
        sql`${problemes.symptomes}::text ILIKE ${pattern}`,
      ),
    )
    .limit(limit);
  return rows;
}

export async function getProblemeBySlug(db: Db, slug: string) {
  return db.query.problemes.findFirst({ where: (p, { eq: eqOp }) => eqOp(p.slug, slug) });
}

export interface PisteWithStats {
  id: string;
  titre: string;
  description: string | null;
  difficulte: number | null;
  threadsConfirmed: number;
  threadsTotal: number;
  appWorked: number;
  appTotal: number;
}

/** Pistes d'un problème, triées par taux de succès forum (signal app prioritaire au Sprint 3, §7 architecture). */
export async function getPistesForProbleme(db: Db, problemeId: string): Promise<PisteWithStats[]> {
  const rows = await db.execute<{
    id: string;
    titre: string;
    description: string | null;
    difficulte: number | null;
    threads_confirmed: string | null;
    threads_total: string | null;
    app_worked: string | null;
    app_total: string | null;
  }>(sql`
    SELECT
      p.id,
      p.titre,
      p.description,
      p.difficulte,
      coalesce(ps.threads_confirmed, 0) AS threads_confirmed,
      coalesce(ps.threads_total, 0) AS threads_total,
      coalesce(ps.app_worked, 0) AS app_worked,
      coalesce(ps.app_total, 0) AS app_total
    FROM pistes p
    LEFT JOIN piste_stats ps ON ps.piste_id = p.id
    WHERE p.probleme_id = ${problemeId}
    ORDER BY
      CASE WHEN coalesce(ps.threads_total, 0) = 0 THEN 0
           ELSE coalesce(ps.threads_confirmed, 0)::float / ps.threads_total END DESC
  `);

  return rows.map((r) => ({
    id: r.id,
    titre: r.titre,
    description: r.description,
    difficulte: r.difficulte,
    threadsConfirmed: Number(r.threads_confirmed ?? 0),
    threadsTotal: Number(r.threads_total ?? 0),
    appWorked: Number(r.app_worked ?? 0),
    appTotal: Number(r.app_total ?? 0),
  }));
}

export async function getPisteById(db: Db, pisteId: string) {
  return db.query.pistes.findFirst({ where: (p, { eq: eqOp }) => eqOp(p.id, pisteId) });
}

export interface ThreadMention {
  threadId: string;
  url: string;
  forum: string;
  titre: string;
  statutDansThread: 'confirmed' | 'tested_neutral' | 'tested_negative' | 'mentioned';
  extrait: string | null;
  confidence: number;
  traduit: boolean;
}

export async function getThreadMentionsForPiste(db: Db, pisteId: string): Promise<ThreadMention[]> {
  const rows = await db
    .select({
      threadId: threads.id,
      url: threads.url,
      forum: threads.forum,
      titre: threads.titre,
      statutDansThread: threadPisteMentions.statutDansThread,
      extrait: threadPisteMentions.extrait,
      confidence: threadPisteMentions.confidence,
      traduit: threads.traduit,
    })
    .from(threadPisteMentions)
    .innerJoin(threads, eq(threads.id, threadPisteMentions.threadId))
    .where(eq(threadPisteMentions.pisteId, pisteId))
    .orderBy(desc(threadPisteMentions.confidence));
  return rows;
}

export async function getAliasesForPiste(db: Db, pisteId: string): Promise<string[]> {
  const rows = await db
    .select({ alias: pisteAliases.alias })
    .from(pisteAliases)
    .where(eq(pisteAliases.pisteId, pisteId));
  return rows.map((r) => r.alias);
}
