# Développement

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
    ├── monetization.md      # Scope monétisation V1
    ├── development.md       # Ce fichier
    └── roadmap.md           # État sprint par sprint
```

## Démarrage

```bash
pnpm install
cp .env.example .env        # remplir ANTHROPIC_API_KEY, DATABASE_URL
pnpm --filter @forumeka/extractor build
pnpm --filter @forumeka/extractor exec forumeka extract <url-thread-caradisiac>

# DB : migrations + extensions PG + vue piste_stats
pnpm --filter @forumeka/db build
pnpm --filter @forumeka/db db:migrate

# Ingestion d'un ExtractionRun JSON (dédup par similarité)
pnpm --filter @forumeka/db exec forumeka-db ingest out/<fichier>.json
```

## Stack

Next.js 15 · TypeScript · Tailwind · Postgres + pg_trgm · Drizzle · Auth.js + Resend · pg-boss · Claude Haiku/Sonnet · Vercel + Neon.

Détails et décisions : [architecture.md](architecture.md).

## État

Sprints 0, 1 et 2 mergés. **MVP déployé en production** : [forumeka.vercel.app](https://forumeka.vercel.app) (Vercel + Neon Frankfurt, auth magic link via Resend sur `mail.forumeka.fr`).

Pipeline d'extraction étendu à un 2e forum, **forum4x4.org** (moteur phpBB3), avec un parser générique réutilisable pour tout forum phpBB3. Seed réel de 30 threads ingéré sur la branche Neon `seed-test`.

Sprint 3 (couche communautaire) et monétisation V1 à venir. Voir [roadmap.md](roadmap.md) et [monetization.md](monetization.md).

## Déploiement (Vercel)

- **Hosting** : Vercel, projet `forumeka`, Root Directory = `apps/web`, Production branch = `main`.
- **DB** : Neon Postgres (région `eu-central-1`, pg_trgm activé), connectée via `DATABASE_URL` (host pooler).
- **Email** : Resend, domaine vérifié `mail.forumeka.fr` (DNS chez IONOS), `RESEND_FROM=noreply@mail.forumeka.fr`.
- **Build Command custom** (le monorepo pnpm n'est pas buildé par défaut par Vercel — ses dépendances workspace doivent être construites avant l'app), versionné dans [`apps/web/vercel.json`](../apps/web/vercel.json) :
  ```
  cd ../.. && pnpm --filter @forumeka/extractor build && pnpm --filter @forumeka/db build && pnpm --filter @forumeka/web build
  ```
- **Variables d'env requises** : `DATABASE_URL`, `AUTH_SECRET`, `RESEND_API_KEY`, `RESEND_FROM`.
