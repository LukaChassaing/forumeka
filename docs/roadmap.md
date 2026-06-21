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
- [x] Build Command Vercel versionné dans `apps/web/vercel.json`
- [ ] Seed réel de 30-50 threads en prod (reste un seed de démo pour l'instant)

## Sprint 4 — Découverte automatisée + multi-forum 🟡 en cours (PR #8, non mergée)

**Objectif** : ne plus dépendre d'une liste d'URLs saisie à la main, étendre au-delà de Caradisiac.

- [x] Colonnes `threads.langue_origine` + `threads.traduit` (déjà en place depuis Sprint 1, prêtes pour la traduction)
- [x] Parser phpBB3 générique (`packages/extractor/src/parsers/phpbb.ts`) — validé sur forum4x4.org, réutilisable pour tout forum basé sur ce moteur
- [x] Module de découverte (`forumeka discover`) avec dédup par `t=` (topic id)
- [x] Pilote de 5 threads forum4x4.org : discover → extract → ingest → refresh-stats → affichage UI, validé de bout en bout
- [x] Deep-link vers le post précis citant l'extrait (`thread_piste_mentions.post_url`) au lieu de la page 1 du thread
- [x] Batching + retry des appels Voyage (évite les 429 silencieux qui donnaient de faux `+0/+0`)
- [ ] **Merger PR #8**
- [ ] Décider : backfill `post_url` pour les 3 threads déjà ingérés sans cette donnée (`e01032f3`, `33999ceb`, `990d341d`), ou laisser tel quel jusqu'au prochain seed
- [ ] Lancer le seed réel de 30-50 threads (mix Caradisiac + forum4x4.org) via ce pipeline
- [ ] Parser pour un forum anglophone (TDIClub) + pipeline de traduction EN→FR — reporté après le seed FR, le badge "traduit" et les colonnes sont déjà prêts
- [ ] Recalcul taux de succès (§7) — formule blend app/forum, **dépriorisé tant que le volume d'avis app est trop faible**

## Prochaines étapes pour raccourcir le temps de déploiement du MVP (ordre conseillé)

1. **Confirmer que l'UI s'affiche correctement** après `pnpm install` lancé depuis la racine du repo (le bug d'affichage "claqué" signalé venait probablement d'un `pnpm install` lancé dans `apps/web` au lieu de la racine, cassant les symlinks workspace de Tailwind/Next).
2. **Merger PR #8** une fois CI verte (prettier/tsc/vitest) — débloque tout le reste.
3. **Décider du backfill `post_url`** pour les 3 threads forum4x4.org déjà ingérés (sinon leurs liens forum restent vers la page 1 jusqu'au prochain seed de ces mêmes threads).
4. **Lancer le seed réel de 30-50 threads** (mix Caradisiac + forum4x4.org) — c'est le seul item bloquant restant des Sprints 1/4 et la condition pour que l'app ait un contenu réellement utile en prod (actuellement seed de démo : 1 problème, 2 pistes).
5. **Appliquer les migrations + `refresh-stats` en prod** (Neon prod, pas seulement la branche `seed-test`) une fois le seed validé.
6. **Vérifier `apps/web/.env.local`** existe avec `DATABASE_URL` pointant vers la bonne instance Neon avant tout test UI local.
7. Seulement après un MVP avec contenu réel en prod : reprendre Sprint 3 (notation/bookmarks/commentaires) et l'extension forum anglophone + traduction.

## Sprint 3 — Couche communautaire

- [ ] Notation user post-réparation (`worked` / `failed` / `partial`)
- [ ] Bookmarks
- [ ] Commentaires sur thread/piste
- [ ] Modération manuelle basique
