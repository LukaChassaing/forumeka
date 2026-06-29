# Roadmap

## Sprint 0 — Pipeline d'extraction CLI ✅ mergé

**Objectif** : 10 threads Caradisiac indexés à la main, JSON inspectés, prompt itéré.

- [x] Squelette mono-repo (`apps/web`, `packages/extractor`, `packages/db`)
- [x] CLI `forumeka fetch | parse | extract`
- [x] Schéma Zod aligné sur §3 du doc d'archi
- [x] Prompt Claude Haiku avec les 4 statuts (§4)
- [x] Respect robots.txt + rate-limit + UA identifiable
- [x] Parser Caradisiac affiné sur le markup Invision Power Board (multi-page, multi-pistes par thread)

## Sprint 1 — DB + ingestion ✅ mergé

- [x] Schéma Drizzle des 9 tables (§3) + `users` minimal (FK, détaillé Sprint 2)
- [x] Migrations versionnées (`packages/db/migrations`)
- [x] Extensions PG : `pg_trgm` ; colonnes `tsvector` en place (triggers de génération à affiner)
- [x] Worker `pg-boss` qui ingère les `ExtractionRun` (queue + handler)
- [x] Déduplication v1 (similarity matching trigramme `pg_trgm`, seuil 0.5, + `piste_aliases`)
- [x] Vue matérialisée `piste_stats`
- [x] CLI admin `forumeka-db ingest|enqueue|worker|refresh-stats`

## Sprint 2 — Web app minimale ✅ mergé

- [x] Next 15 App Router + Tailwind, design system beige/gris/noir/blanc
- [x] Auth.js + Resend magic link
- [x] Page recherche `/`
- [x] Page résultats `/diag/[slug]`
- [x] Page piste `/piste/[id]` avec sources
- [x] Pattern d'affichage "X sur N <verbe>" (§6)

## MVP déployé en production ✅

- [x] Hébergement Vercel (`forumeka.vercel.app`) + Neon Postgres (`eu-central-1`, Frankfurt)
- [x] Migrations + extensions PG + vue `piste_stats` appliquées sur Neon
- [x] Bug critique corrigé : middleware d'auth forcé en runtime Node.js (Edge ne peut pas ouvrir de socket TCP vers Postgres, cassait toute validation de session)
- [x] Resend configuré avec domaine vérifié `mail.forumeka.fr`, magic link testé en prod
- [x] Build Command Vercel versionné dans `apps/web/vercel.json`

## Sprint 4 — Découverte automatisée + multi-forum ✅ mergé

**Objectif** : ne plus dépendre d'une liste d'URLs saisie à la main, étendre au-delà de Caradisiac.

- [x] Colonnes `threads.langue_origine` + `threads.traduit` (prêtes pour la traduction)
- [x] Parser phpBB3 générique (`packages/extractor/src/parsers/phpbb.ts`) — validé sur forum4x4.org, réutilisable pour tout forum basé sur ce moteur
- [x] Module de découverte (`forumeka discover`) avec dédup par `t=` (topic id)
- [x] Deep-link vers le post précis citant l'extrait (`thread_piste_mentions.post_url`) au lieu de la page 1 du thread
- [x] Suppression de Voyage/pgvector : recherche et dédup 100% trigramme (`pg_trgm`), plus aucune dépendance SaaS externe
- [ ] Parser pour un forum anglophone (TDIClub) + pipeline de traduction EN→FR — reporté, le badge "traduit" et les colonnes sont déjà prêts

## Seed réel — 30 threads forum4x4.org ✅ fait (branche Neon `seed-test`)

- [x] Discover + extract + ingest sur 30 threads (sous-forums Mécanique/Pratique/Pneus), 0 échec de parsing
- [x] Backfill `post_url` des mentions sans deep-link (18 mentions corrigées par correspondance de mots-clés)
- [x] `refresh-stats` exécuté — `piste_stats` à jour (67 pistes, 22 problèmes)
- [ ] **Caradisiac reste bloqué par Cloudflare** (`fetch failed` confirmé) — le seed est 100% forum4x4.org pour l'instant ; le contournement Cloudflare (§11ter de l'archi) reste à faire avant de pouvoir mixer les deux sources
- [ ] Appliquer ce seed (ou un seed équivalent élargi) sur la branche Neon de **prod**, pas seulement `seed-test`

## Refonte UI recherche/diag/piste ✅ mergé (PR #10)

- [x] Recherche élargie aux extraits de threads cités (pas seulement titre/véhicules/symptômes), via `word_similarity` sur les mots ≥5 caractères
- [x] Fix du comptage `nbPistes` (sous-requête Drizzle mal qualifiée)
- [x] Page d'accueil refaite (logo, stats, exemples de recherche)
- [x] Page diagnostic : badges de probabilité (Très probable / Probable / Peu probable) basés sur le taux de confirmation forum
- [x] Page piste : sources reformatées, fil d'Ariane, extrait en italique
- [x] Header sticky avec recherche permanente (sauf sur l'accueil)

## Monétisation V1 🟡 gating en place, Stripe à faire

Scope détaillé : [monetization.md](monetization.md).

- [x] Pricing, gating et contraintes techniques actés
- [x] Table `unlocks` (`user_id`, `piste_id`, `type` free/subscription, `expires_at`) + colonnes abonnement sur `users`
- [x] Verrouillage côté serveur des sources forum + badge de fiabilité (jamais de cloaking) — sources forum non récupérées du tout si non débloqué
- [x] Ordre aléatoire des pistes sur la page diagnostic pour les non-abonnés (`ORDER BY random()`), ordre réel réservé aux abonnés
- [x] 5 déverrouillages gratuits à vie par compte, consommés un par un (`/piste/[id]`)
- [x] Page `/compte` (statut abonnement, compteur gratuits, historique des déverrouillages)
- [ ] Intégration Stripe Checkout (mensuel 4,99€ / annuel 39,99€) + PayPal comme moyen de paiement natif — `/abonnement` est un lien mort en attendant
- [ ] Webhook Stripe pour mettre à jour `users.subscription_status`/`subscription_expires_at`
- [ ] CTA "piste sans confirmation → forum"

## Compte utilisateur et navigation ✅ mergé

- [x] Menu déroulant "Compte et abonnement" dans le header (avatar retiré, juste libellé + chevron)
- [x] Sidebar "Marques les plus indexées" (gauche) et "Consulté récemment" (droite) sur grand écran, table `consultations` pour l'historique
- [x] Pages `/forums` et `/vehicules` (listes cliquables depuis les tuiles de stats de la home)
- [x] Thème clair/sombre (bouton dans le header, palette via variables CSS, persisté en `localStorage`)
- [x] Footer + pages légales (`/mentions-legales`, `/cgu`, `/confidentialite`, `/contact`)
- [x] Indicateur de chargement entre les pages (`app/loading.tsx`)

## Prochaines étapes (ordre conseillé)

1. **Intégrer Stripe** (Checkout + webhook) pour rendre l'abonnement réellement payant — c'est le seul morceau qui manque pour que la monétisation V1 soit complète.
2. **Dresser une liste de forums cibles** (au-delà de Caradisiac/forum4x4.org) pour élargir la couverture une fois la monétisation bouclée.
3. **Indexer le maximum de threads possible** sur ces forums via le pipeline existant (discover → extract → ingest), en continu.
4. Appliquer le seed (30 threads actuels + ce qui suit) sur la branche Neon de **prod**.
5. Lever le blocage Cloudflare sur Caradisiac pour récupérer cette source.
