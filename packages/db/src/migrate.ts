import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { PISTE_STATS_SQL, PISTE_STATS_INDEX_SQL } from './views.js';
import { EXTRA_INDEXES_SQL } from './indexes.js';

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL manquant');

  const client = postgres(databaseUrl, { max: 1 });
  const db = drizzle(client);

  await client.unsafe('CREATE EXTENSION IF NOT EXISTS pg_trgm');

  await migrate(db, { migrationsFolder: './migrations' });

  for (const statement of EXTRA_INDEXES_SQL) {
    await db.execute(statement);
  }
  await db.execute(PISTE_STATS_SQL);
  await db.execute(PISTE_STATS_INDEX_SQL);

  console.log('✓ migrations + extensions + index + piste_stats à jour');
  await client.end();
}

main().catch((err) => {
  console.error(`✗ ${err instanceof Error ? err.message : String(err)}`);
  process.exitCode = 1;
});
