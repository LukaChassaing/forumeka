# Roadmap

## Sprint 0 — Pipeline d'extraction CLI ✅ mergé

**Objectif** : 10 threads Caradisiac indexés à la main, JSON inspectés, prompt itéré.

- [x] Squelette mono-repo (`apps/web`, `packages/extractor`, `packages/db`)
- [x] CLI `forumeka fetch | parse | extract`
- [x] Schéma Zod aligné sur §3 du doc d'archi
- [x] Prompt Claude Haiku avec les 4 statuts (§4)
- [x] Respect robots.txt + rate-limit + UA identifiable
- [x] Parser Caradisiac affiné sur le markup Invision Power Board (multi-page, multi-pistes par thread)
- [ ] 10 threads indexés, prompt itéré, qualité jugée acceptable
- [ ] Sortie : un dossier `out/` avec 10 `ExtractionRun` JSON

## Sprint 1 — DB + ingestion ✅ mergé

- [x] Schéma Drizzle des 9 tables (§3) + `users` minimal (FK, détaillé Sprint 2)
- [x] Migrations versionnées (`packages/db/migrations`)
- [x] Extensions PG : `pgvector`, `pg_trgm` ; colonnes `tsvector` en place (triggers de génération à affiner)
- [x] Worker `pg-boss` qui ingère les `ExtractionRun` (queue + handler)
- [x] Déduplication v1 (similarity matching Voyage `voyage-3-lite`, seuil 0.85, + `piste_aliases`)
- [x] Vue matérialisée `piste_stats`
- [x] CLI admin `forumeka-db ingest|enqueue|worker|refresh-stats`
- [ ] Seed réel de 30-50 threads (à faire en continu via le CLI)

## Sprint 2 — Web app minimale ✅ mergé

- [x] Next 15 App Router + Tailwind, design system beige/gris/noir/blanc
- [x] Auth.js + Resend magic link
- [x] Page recherche `/`
- [x] Page résultats `/diag/[slug]`
- [x] Page piste `/piste/[id]` avec sources
- [x] Pattern d'affichage "X sur N <verbe>" (§6)
- [ ] Autocomplete véhicule + symptôme sur la page recherche (à affiner)

## MVP déployé en production ✅

- [x] Hébergement Vercel (`forumeka.vercel.app`) + Neon Postgres (`eu-central-1`, Frankfurt)
- [x] Migrations + extensions PG + vue `piste_stats` appliquées sur Neon
- [x] Bug critique corrigé : middleware d'auth forcé en runtime Node.js (Edge ne peut pas ouvrir de socket TCP vers Postgres, cassait toute validation de session)
- [x] Resend configuré avec domaine vérifié `mail.forumeka.fr`, magic link testé en prod
- [x] Données de démo seedées (1 problème Clio 3, 2 pistes, 1 thread)
- [ ] Build Command Vercel à versionner dans le repo (actuellement seulement dans les settings dashboard, pas reproductible)
- [ ] Seed réel de 30-50 threads en prod (reste un seed de démo pour l'instant)

## Sprint 3 — Couche communautaire

- [ ] Notation user post-réparation (`worked` / `failed` / `partial`)
- [ ] Bookmarks
- [ ] Commentaires sur thread/piste
- [ ] Recalcul taux de succès (§7) — formule de départ
- [ ] Modération manuelle basique
