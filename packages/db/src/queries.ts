import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import type { Db } from './client.js';
import {
  problemes,
  pistes,
  pisteAliases,
  threads,
  threadPisteMentions,
  unlocks,
  consultations,
  users,
} from './schema.js';

export type SubscriptionStatus = 'none' | 'active' | 'canceled' | 'past_due';

export interface ProblemeSearchResult {
  id: string;
  slug: string;
  titre: string;
  vehicules: string[];
  symptomes: string[];
  nbPistes: number;
}

/** Seuil de word_similarity (pg_trgm) sous lequel un mot n'est pas considéré comme une correspondance. */
const TRGM_SIMILARITY_THRESHOLD = 0.4;

/** Sous cette longueur, le trigramme est trop bruité (ex. "clio" matche des titres sans rapport) : on reste sur le substring exact. */
const MIN_WORD_LENGTH_FOR_FUZZY = 5;

/**
 * Recherche par mots (v1) — autocomplete véhicule + symptôme (§6 architecture).
 * La requête est découpée en mots ; chaque mot doit matcher (substring, et pour les mots de 5
 * caractères ou plus en plus du word_similarity trigramme) au moins une des colonnes (titre /
 * véhicules / symptômes) ou un extrait de thread cité pour une piste du problème, tous les mots
 * étant requis (AND). Permet à "kia esp" de matcher "Kia Sorento — voyant ESP" sans que la phrase
 * entière soit un substring. `word_similarity` (et non `similarity`) compare le mot à la meilleure
 * sous-séquence du texte plutôt qu'au texte entier, ce qui permet de matcher "allumé" dans "voyant
 * ESP OFF s'allume" malgré la conjugaison/accent différents.
 */
export async function searchProblemes(
  db: Db,
  query: string,
  limit = 10,
): Promise<ProblemeSearchResult[]> {
  const words = query.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const wordConditions = words.map((word) => {
    const pattern = `%${word}%`;
    const fuzzy = word.length >= MIN_WORD_LENGTH_FOR_FUZZY;
    return sql`(
      ${problemes.titre} ILIKE ${pattern}
      ${fuzzy ? sql`OR word_similarity(${word}, ${problemes.titre}) > ${TRGM_SIMILARITY_THRESHOLD}` : sql``}
      OR ${problemes.vehicules}::text ILIKE ${pattern}
      ${fuzzy ? sql`OR word_similarity(${word}, ${problemes.vehicules}::text) > ${TRGM_SIMILARITY_THRESHOLD}` : sql``}
      OR ${problemes.symptomes}::text ILIKE ${pattern}
      ${fuzzy ? sql`OR word_similarity(${word}, ${problemes.symptomes}::text) > ${TRGM_SIMILARITY_THRESHOLD}` : sql``}
      OR EXISTS (
        SELECT 1 FROM ${pistes}
        JOIN ${threadPisteMentions} ON ${threadPisteMentions.pisteId} = ${pistes.id}
        WHERE ${pistes.problemeId} = ${problemes.id}
          AND (
            ${threadPisteMentions.extrait} ILIKE ${pattern}
            ${fuzzy ? sql`OR word_similarity(${word}, ${threadPisteMentions.extrait}) > ${TRGM_SIMILARITY_THRESHOLD}` : sql``}
          )
      )
    )`;
  });

  const rows = await db
    .select({
      id: problemes.id,
      slug: problemes.slug,
      titre: problemes.titre,
      vehicules: problemes.vehicules,
      symptomes: problemes.symptomes,
      nbPistes: sql<number>`(SELECT count(*) FROM ${pistes} WHERE ${pistes.problemeId} = ${sql.raw('"problemes"."id"')})`,
    })
    .from(problemes)
    .where(sql.join(wordConditions, sql` AND `))
    .limit(limit);
  return rows.map((r) => ({ ...r, nbPistes: Number(r.nbPistes) }));
}

export async function getProblemeBySlug(db: Db, slug: string) {
  return db.query.problemes.findFirst({ where: (p, { eq: eqOp }) => eqOp(p.slug, slug) });
}

export async function getProblemeById(db: Db, id: string) {
  return db.query.problemes.findFirst({ where: (p, { eq: eqOp }) => eqOp(p.id, id) });
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

/**
 * Pistes d'un problème, triées par taux de succès forum (signal app prioritaire au Sprint 3, §7
 * architecture) — ou en ordre aléatoire si `randomize` (monétisation V1, § monetization.md :
 * l'ordre réel des pistes est verrouillé tant que l'utilisateur n'a pas d'abonnement actif).
 */
export async function getPistesForProbleme(
  db: Db,
  problemeId: string,
  randomize = false,
): Promise<PisteWithStats[]> {
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
      ${
        randomize
          ? sql`random()`
          : sql`CASE WHEN coalesce(ps.threads_total, 0) = 0 THEN 0
           ELSE coalesce(ps.threads_confirmed, 0)::float / ps.threads_total END DESC`
      }
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
  postUrl: string | null;
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
      postUrl: threadPisteMentions.postUrl,
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

/** Nombre de déverrouillages gratuits à vie offerts par compte (§ monetization.md). */
export const FREE_UNLOCKS_PER_USER = 5;

export async function hasActiveSubscription(db: Db, userId: string): Promise<boolean> {
  const user = await db.query.users.findFirst({ where: (u, { eq: eqOp }) => eqOp(u.id, userId) });
  if (!user || user.subscriptionStatus !== 'active') return false;
  return !user.subscriptionExpiresAt || user.subscriptionExpiresAt > new Date();
}

export async function countFreeUnlocksUsed(db: Db, userId: string): Promise<number> {
  const rows = await db
    .select({ count: sql<number>`count(*)` })
    .from(unlocks)
    .where(and(eq(unlocks.userId, userId), eq(unlocks.type, 'free')));
  return Number(rows[0]?.count ?? 0);
}

/** Vrai si l'utilisateur voit déjà la fiabilité réelle + les sources forum de cette piste. */
export async function isPisteUnlocked(db: Db, userId: string, pisteId: string): Promise<boolean> {
  if (await hasActiveSubscription(db, userId)) return true;
  const row = await db.query.unlocks.findFirst({
    where: (u, { and: andOp, eq: eqOp }) => andOp(eqOp(u.userId, userId), eqOp(u.pisteId, pisteId)),
  });
  return row !== undefined;
}

/** Mêmes règles qu'{@link isPisteUnlocked}, pour une liste de pistes (évite le N+1 sur /diag). */
export async function getUnlockedPisteIds(
  db: Db,
  userId: string,
  pisteIds: string[],
): Promise<Set<string>> {
  if (pisteIds.length === 0) return new Set();
  if (await hasActiveSubscription(db, userId)) return new Set(pisteIds);
  const rows = await db
    .select({ pisteId: unlocks.pisteId })
    .from(unlocks)
    .where(and(eq(unlocks.userId, userId), inArray(unlocks.pisteId, pisteIds)));
  return new Set(rows.map((r) => r.pisteId));
}

export interface FreeUnlockResult {
  ok: boolean;
  reason?: 'already_unlocked' | 'limit_reached';
}

export interface UnlockedPiste {
  pisteId: string;
  pisteTitre: string;
  problemeSlug: string;
  problemeTitre: string;
  type: 'free' | 'subscription';
  createdAt: Date;
}

/** Pistes débloquées par l'utilisateur (page /compte), les plus récentes en premier. */
export async function getUnlocksForUser(db: Db, userId: string): Promise<UnlockedPiste[]> {
  const rows = await db
    .select({
      pisteId: pistes.id,
      pisteTitre: pistes.titre,
      problemeSlug: problemes.slug,
      problemeTitre: problemes.titre,
      type: unlocks.type,
      createdAt: unlocks.createdAt,
    })
    .from(unlocks)
    .innerJoin(pistes, eq(pistes.id, unlocks.pisteId))
    .innerJoin(problemes, eq(problemes.id, pistes.problemeId))
    .where(eq(unlocks.userId, userId))
    .orderBy(desc(unlocks.createdAt));
  return rows;
}

/** Consomme un déverrouillage gratuit pour cette piste, si le quota de 3 à vie n'est pas atteint. */
export async function unlockPisteFree(
  db: Db,
  userId: string,
  pisteId: string,
): Promise<FreeUnlockResult> {
  if (await isPisteUnlocked(db, userId, pisteId)) {
    return { ok: true, reason: 'already_unlocked' };
  }
  const used = await countFreeUnlocksUsed(db, userId);
  if (used >= FREE_UNLOCKS_PER_USER) {
    return { ok: false, reason: 'limit_reached' };
  }
  await db.insert(unlocks).values({ userId, pisteId, type: 'free' });
  return { ok: true };
}

/** Enregistre une visite (page /compte, sidebar d'historique) — upsert, une ligne par cible vue. */
export async function recordConsultation(
  db: Db,
  userId: string,
  type: 'probleme' | 'piste',
  refId: string,
  titre: string,
  href: string,
): Promise<void> {
  await db
    .insert(consultations)
    .values({ userId, type, refId, titre, href })
    .onConflictDoUpdate({
      target: [consultations.userId, consultations.type, consultations.refId],
      set: { titre, href, vuLe: new Date() },
    });
}

export interface Consultation {
  type: 'probleme' | 'piste';
  refId: string;
  titre: string;
  href: string;
  vuLe: Date;
}

export async function getRecentConsultations(
  db: Db,
  userId: string,
  limit = 8,
): Promise<Consultation[]> {
  const rows = await db
    .select({
      type: consultations.type,
      refId: consultations.refId,
      titre: consultations.titre,
      href: consultations.href,
      vuLe: consultations.vuLe,
    })
    .from(consultations)
    .where(eq(consultations.userId, userId))
    .orderBy(desc(consultations.vuLe))
    .limit(limit);
  return rows;
}

// --- Abonnement Stripe (§ monetization.md) -------------------------------------------------------

export async function getUserById(db: Db, userId: string) {
  return db.query.users.findFirst({ where: (u, { eq: eqOp }) => eqOp(u.id, userId) });
}

/** Retrouve le compte à partir de l'ID client Stripe (webhook subscription.updated/deleted). */
export async function getUserByStripeCustomerId(db: Db, stripeCustomerId: string) {
  return db.query.users.findFirst({
    where: (u, { eq: eqOp }) => eqOp(u.stripeCustomerId, stripeCustomerId),
  });
}

/** Lie un compte à son client Stripe (première souscription). */
export async function setUserStripeCustomerId(
  db: Db,
  userId: string,
  stripeCustomerId: string,
): Promise<void> {
  await db.update(users).set({ stripeCustomerId }).where(eq(users.id, userId));
}

/**
 * Met à jour l'état d'abonnement d'un compte (appelé par le webhook Stripe uniquement — jamais
 * de confiance dans le retour client de Checkout). `expiresAt` = fin de la période payée en cours.
 */
export async function updateUserSubscription(
  db: Db,
  userId: string,
  status: SubscriptionStatus,
  expiresAt: Date | null,
): Promise<void> {
  await db
    .update(users)
    .set({ subscriptionStatus: status, subscriptionExpiresAt: expiresAt })
    .where(eq(users.id, userId));
}

/**
 * Traduit un statut d'abonnement Stripe vers l'enum interne. Stripe expose plus de valeurs que ce
 * qu'on suit : on ne distingue que actif / en défaut de paiement / annulé (§ monetization.md).
 */
export function mapStripeSubscriptionStatus(stripeStatus: string): SubscriptionStatus {
  switch (stripeStatus) {
    case 'active':
    case 'trialing':
      return 'active';
    case 'past_due':
    case 'unpaid':
      return 'past_due';
    case 'canceled':
    case 'incomplete_expired':
      return 'canceled';
    default:
      // incomplete, paused, etc. : pas encore payant, on reste sur "none".
      return 'none';
  }
}
