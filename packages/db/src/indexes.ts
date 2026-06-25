import { sql } from 'drizzle-orm';

/** Index additionnels non générés par drizzle-kit (FK lookups + recherche). */
export const EXTRA_INDEXES_SQL = [
  sql`CREATE INDEX IF NOT EXISTS pistes_probleme_id_idx ON pistes (probleme_id)`,
  sql`CREATE INDEX IF NOT EXISTS piste_aliases_piste_id_idx ON piste_aliases (piste_id)`,
  sql`CREATE INDEX IF NOT EXISTS piste_aliases_alias_trgm_idx ON piste_aliases USING gin (alias gin_trgm_ops)`,
  sql`CREATE INDEX IF NOT EXISTS problemes_titre_trgm_idx ON problemes USING gin (titre gin_trgm_ops)`,
  sql`CREATE INDEX IF NOT EXISTS pistes_titre_trgm_idx ON pistes USING gin (titre gin_trgm_ops)`,
  sql`CREATE INDEX IF NOT EXISTS thread_piste_mentions_thread_id_idx ON thread_piste_mentions (thread_id)`,
  sql`CREATE INDEX IF NOT EXISTS thread_piste_mentions_piste_id_idx ON thread_piste_mentions (piste_id)`,
];
