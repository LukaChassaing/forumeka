import { customType } from 'drizzle-orm/pg-core';

/** pgvector column — stocke un vecteur de `dimensions` floats. */
export const vector = customType<{
  data: number[];
  driverData: string;
  config: { dimensions: number };
}>({
  dataType(config) {
    return `vector(${config?.dimensions ?? 1536})`;
  },
  toDriver(value) {
    return `[${value.join(',')}]`;
  },
  fromDriver(value) {
    return value.slice(1, -1).split(',').map(Number);
  },
});

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
