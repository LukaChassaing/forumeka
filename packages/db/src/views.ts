import { sql } from 'drizzle-orm';

/**
 * Vue matérialisée piste_stats — compteurs forum pré-calculés par piste.
 * Le signal app (piste_ratings) est agrégé à part, jamais fusionné (cf. architecture §5).
 * Refresh : après chaque ingestion de thread, et après chaque piste_rating (Sprint 3).
 */
export const PISTE_STATS_SQL = sql`
  CREATE MATERIALIZED VIEW IF NOT EXISTS piste_stats AS
  SELECT
    p.id AS piste_id,
    p.probleme_id,
    count(*) FILTER (WHERE tpm.statut_dans_thread = 'confirmed') AS threads_confirmed,
    count(*) AS threads_total,
    count(DISTINCT pr.id) FILTER (WHERE pr.verdict = 'worked') AS app_worked,
    count(DISTINCT pr.id) AS app_total
  FROM pistes p
  LEFT JOIN thread_piste_mentions tpm ON tpm.piste_id = p.id
  LEFT JOIN piste_ratings pr ON pr.piste_id = p.id
  GROUP BY p.id, p.probleme_id;
`;

export const PISTE_STATS_INDEX_SQL = sql`
  CREATE UNIQUE INDEX IF NOT EXISTS piste_stats_piste_id_idx ON piste_stats (piste_id);
`;

export const REFRESH_PISTE_STATS_SQL = sql`
  REFRESH MATERIALIZED VIEW CONCURRENTLY piste_stats;
`;
