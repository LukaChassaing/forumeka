# Forumeka

> Diagnostic auto collaboratif — pistes de panne classées par taux de succès, sourcées forums et retours users.

## Quoi

Un utilisateur tape un symptôme en langage naturel (_"Clio 3 1.5 dCi cale à chaud"_) et obtient les **pistes de diagnostic** classées par taux de succès, avec leurs **sources forums** et les **retours d'autres users** post-réparation.

## Structure

```
forumeka/
├── apps/
│   └── web/                 # Next.js 15 — Sprint 2
├── packages/
│   ├── extractor/           # CLI d'extraction (Sprint 0) ✅
│   └── db/                  # Schéma Drizzle + ingestion (Sprint 1) ✅
└── docs/
    ├── architecture.md      # Cadrage technique complet
    └── roadmap.md           # État sprint par sprint
```

## Démarrage

```bash
pnpm install
cp .env.example .env        # remplir ANTHROPIC_API_KEY, VOYAGE_API_KEY, DATABASE_URL
pnpm --filter @forumeka/extractor build
pnpm --filter @forumeka/extractor exec forumeka extract <url-thread-caradisiac>

# DB : migrations + extensions PG + vue piste_stats
pnpm --filter @forumeka/db build
pnpm --filter @forumeka/db db:migrate

# Ingestion d'un ExtractionRun JSON (dédup par similarité)
pnpm --filter @forumeka/db exec forumeka-db ingest out/<fichier>.json
```

## Stack

Next.js 15 · TypeScript · Tailwind · Postgres + pgvector · Drizzle · Auth.js + Resend · pg-boss · Claude Haiku/Sonnet · Voyage embeddings · Vercel + Neon.

Détails et décisions : [docs/architecture.md](docs/architecture.md).

## État

Sprint 0 et 1 mergés (CLI d'extraction, DB + ingestion). Sprint 2 à venir (web app). Voir [docs/roadmap.md](docs/roadmap.md).
