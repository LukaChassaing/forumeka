import { customType } from 'drizzle-orm/pg-core';

/** tsvector column — généré côté DB via trigger/expression, jamais écrit depuis l'app. */
export const tsvector = customType<{ data: string }>({
  dataType() {
    return 'tsvector';
  },
});

/** bytea column — contenu brut compressé (gzip) d'un thread. */
export const bytea = customType<{ data: Buffer }>({
  dataType() {
    return 'bytea';
  },
});

/** numrange column — ex: coût estimé `[80, 150]`. Représenté en JS comme la chaîne Postgres brute. */
export const numrange = customType<{ data: string }>({
  dataType() {
    return 'numrange';
  },
});
