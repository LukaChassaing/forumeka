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

Détails et décisions : [docs/architecture.md](docs/architecture.md).

## État

Sprints 0, 1 et 2 mergés. **MVP déployé en production** : [forumeka.vercel.app](https://forumeka.vercel.app) (Vercel + Neon Frankfurt, auth magic link via Resend sur `mail.forumeka.fr`).

**En cours (PR #8, non mergée)** : extension du pipeline d'extraction à un 2e forum, **forum4x4.org** (moteur phpBB3), avec un parser générique réutilisable pour tout forum phpBB3. Pilote de 5 threads validé de bout en bout (discover → extract → ingest → refresh-stats → affichage UI). Corrections associées : fermeture propre des connexions DB en CLI, lien de chaque source forum vers le post précis cité (deep-link `?p=...#p...`) plutôt que la page 1 du thread.

Sprint 3 (couche communautaire) à venir. Voir [docs/roadmap.md](docs/roadmap.md).

### Déploiement (Vercel)

- **Hosting** : Vercel, projet `forumeka`, Root Directory = `apps/web`, Production branch = `main`.
- **DB** : Neon Postgres (région `eu-central-1`, pg_trgm activé), connectée via `DATABASE_URL` (host pooler).
- **Email** : Resend, domaine vérifié `mail.forumeka.fr` (DNS chez IONOS), `RESEND_FROM=noreply@mail.forumeka.fr`.
- **Build Command custom** (le monorepo pnpm n'est pas buildé par défaut par Vercel — ses dépendances workspace doivent être construites avant l'app), versionné dans [`apps/web/vercel.json`](apps/web/vercel.json) :
  ```
  cd ../.. && pnpm --filter @forumeka/extractor build && pnpm --filter @forumeka/db build && pnpm --filter @forumeka/web build
  ```
- **Variables d'env requises** : `DATABASE_URL`, `AUTH_SECRET`, `RESEND_API_KEY`, `RESEND_FROM`.
