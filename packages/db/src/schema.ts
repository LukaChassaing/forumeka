import {
  pgTable,
  uuid,
  text,
  integer,
  real,
  boolean,
  jsonb,
  timestamp,
  date,
  primaryKey,
  unique,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { tsvector, numrange, bytea } from './columns.js';

export const sourceTypeEnum = pgEnum('source_type', ['human', 'llm', 'user_contribution']);
export const statutPisteEnum = pgEnum('statut_dans_thread', [
  'confirmed',
  'tested_neutral',
  'tested_negative',
  'mentioned',
]);
export const verdictEnum = pgEnum('verdict', ['worked', 'failed', 'partial']);
export const satisfactionEnum = pgEnum('satisfaction', ['found', 'partial', 'none']);
export const crawlStatusEnum = pgEnum('crawl_status', [
  'discovered',
  'processing',
  'ingested',
  'failed',
  'skipped',
]);

/** Schéma Auth.js (DrizzleAdapter) — magic link Resend, voir §11/§12 architecture. */
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: timestamp('email_verified', { withTimezone: true }),
  image: text('image'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const accounts = pgTable(
  'accounts',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (table) => [primaryKey({ columns: [table.provider, table.providerAccountId] })],
);

export const sessions = pgTable('sessions', {
  sessionToken: text('session_token').primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { withTimezone: true }).notNull(),
});

export const verificationTokens = pgTable(
  'verification_tokens',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { withTimezone: true }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.identifier, table.token] })],
);

export const problemes = pgTable('problemes', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  titre: text('titre').notNull(),
  description: text('description'),
  vehicules: jsonb('vehicules').notNull().$type<string[]>(),
  symptomes: text('symptomes').array().notNull(),
  searchVector: tsvector('search_vector'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  sourceType: sourceTypeEnum('source_type').notNull().default('llm'),
  sourceModel: text('source_model'),
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
});

export const pistes = pgTable('pistes', {
  id: uuid('id').primaryKey().defaultRandom(),
  problemeId: uuid('probleme_id')
    .notNull()
    .references(() => problemes.id, { onDelete: 'cascade' }),
  titre: text('titre').notNull(),
  description: text('description'),
  coutEstimeEur: numrange('cout_estime_eur'),
  difficulte: integer('difficulte'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  sourceType: sourceTypeEnum('source_type').notNull().default('llm'),
  sourceModel: text('source_model'),
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
});

export const pisteAliases = pgTable('piste_aliases', {
  id: uuid('id').primaryKey().defaultRandom(),
  pisteId: uuid('piste_id')
    .notNull()
    .references(() => pistes.id, { onDelete: 'cascade' }),
  alias: text('alias').notNull(),
});

export const threads = pgTable('threads', {
  id: uuid('id').primaryKey().defaultRandom(),
  url: text('url').notNull().unique(),
  forum: text('forum').notNull(),
  titre: text('titre').notNull(),
  dateThread: date('date_thread'),
  nbPages: integer('nb_pages').notNull(),
  resolvedInThread: boolean('resolved_in_thread').notNull().default(false),
  causeFinaleId: uuid('cause_finale_id').references(() => pistes.id),
  rawContentCompressed: bytea('raw_content_compressed'),
  langueOrigine: text('langue_origine').notNull().default('fr'),
  traduit: boolean('traduit').notNull().default(false),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  indexedAt: timestamp('indexed_at', { withTimezone: true }).notNull().defaultNow(),
});

export const threadPisteMentions = pgTable(
  'thread_piste_mentions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    threadId: uuid('thread_id')
      .notNull()
      .references(() => threads.id, { onDelete: 'cascade' }),
    pisteId: uuid('piste_id')
      .notNull()
      .references(() => pistes.id, { onDelete: 'cascade' }),
    statutDansThread: statutPisteEnum('statut_dans_thread').notNull(),
    extrait: text('extrait'),
    confidence: real('confidence').notNull(),
    postUrl: text('post_url'),
  },
  (table) => [unique().on(table.threadId, table.pisteId)],
);

export const pisteRatings = pgTable(
  'piste_ratings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    pisteId: uuid('piste_id')
      .notNull()
      .references(() => pistes.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    problemeId: uuid('probleme_id')
      .notNull()
      .references(() => problemes.id, { onDelete: 'cascade' }),
    verdict: verdictEnum('verdict').notNull(),
    vehiculeUser: text('vehicule_user'),
    commentaireCourt: text('commentaire_court'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique().on(table.pisteId, table.userId, table.problemeId)],
);

export const bookmarks = pgTable(
  'bookmarks',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    threadId: uuid('thread_id')
      .notNull()
      .references(() => threads.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.threadId] })],
);

export const commentaires = pgTable('commentaires', {
  id: uuid('id').primaryKey().defaultRandom(),
  threadId: uuid('thread_id').references(() => threads.id, { onDelete: 'cascade' }),
  pisteId: uuid('piste_id').references(() => pistes.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  contenu: text('contenu').notNull(),
  upvotes: integer('upvotes').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  searchVector: tsvector('search_vector'),
});

export const searchLog = pgTable('search_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  query: text('query').notNull(),
  resultsCount: integer('results_count').notNull().default(0),
  clickedThreadId: uuid('clicked_thread_id').references(() => threads.id),
  satisfaction: satisfactionEnum('satisfaction'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/** File d'indexation persistante : permet de lancer/relancer le crawl sans perdre la progression (§ roadmap indexation). */
export const crawlQueue = pgTable('crawl_queue', {
  id: uuid('id').primaryKey().defaultRandom(),
  threadUrl: text('thread_url').notNull().unique(),
  forum: text('forum').notNull(),
  subForumLabel: text('sub_forum_label'),
  status: crawlStatusEnum('status').notNull().default('discovered'),
  attempts: integer('attempts').notNull().default(0),
  error: text('error'),
  discoveredAt: timestamp('discovered_at', { withTimezone: true }).notNull().defaultNow(),
  processedAt: timestamp('processed_at', { withTimezone: true }),
});
