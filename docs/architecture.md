# Architecture Forumeka

> Document de cadrage technique. À lire avant d'écrire du code.

## 1. Concept produit

Voir le [README](../README.md) pour le pitch produit (quoi, pour qui, modèle économique). Le pari technique qui sous-tend toute l'architecture ci-dessous : les forums auto sont la plus grande base de connaissance diagnostique au monde, mais inutilisable telle quelle. Les LLMs permettent enfin d'en extraire du savoir structuré.

## 2. Principe central : inversion d'entité

L'entité centrale n'est **pas le thread** mais **la piste** (cause possible d'un problème).

- Les **threads** sont des _sources_ qui mentionnent des pistes
- Les **users** sont des _validateurs_ qui notent les pistes après réparation
- Les **problèmes** sont des clusters sémantiques de symptômes

Cette inversion est critique : elle permet d'agréger toute la connaissance dispersée sur un même symptôme dans une fiche unique, avec ses sources traçables et ses statistiques de succès. Sans cette inversion, on retombe sur "un thread = une fiche" et on n'agrège rien.

## 3. Schéma de données

### `problemes`

Symptômes agrégés, dédupliqués par similarité sémantique.

| Colonne         | Type          | Notes                                     |
| --------------- | ------------- | ----------------------------------------- |
| `id`            | UUID PK       |                                           |
| `slug`          | TEXT UNIQUE   | pour l'URL `/diag/[slug]`                 |
| `titre`         | TEXT          | ex: "1.5 dCi K9K cale à chaud"            |
| `description`   | TEXT          |                                           |
| `vehicules`     | JSONB         | ex: `['Clio 3 K9K', 'Megane 2 K9K']`      |
| `symptomes`     | TEXT[]        | ex: `['calage à chaud', 'voyant moteur']` |
| `search_vector` | TSVECTOR      | full-text search                          |
| `metadata`      | JSONB         | champs dynamiques                         |
| `source_type`   | TEXT          | `human` / `llm` / `user_contribution`     |
| `source_model`  | TEXT          | ex: `claude-opus-4-6`                     |
| `reviewed_by`   | UUID FK users |                                           |
| `reviewed_at`   | TIMESTAMPTZ   |                                           |

### `pistes`

Causes possibles, rattachées à un problème, dédupliquées par similarité.

| Colonne                                                     | Type     | Notes                                                                                                          |
| ----------------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------- |
| `id`                                                        | UUID PK  |                                                                                                                |
| `probleme_id`                                               | UUID FK  |                                                                                                                |
| `titre`                                                     | TEXT     | ex: "Capteur PMH"                                                                                              |
| `description`                                               | TEXT     | procédure de test/remplacement — colonne en place, **non alimentée** (voir [monetization.md](monetization.md)) |
| `cout_estime_eur`                                           | NUMRANGE | ex: `[80, 150]`                                                                                                |
| `difficulte`                                                | INTEGER  | 1-5                                                                                                            |
| `metadata`                                                  | JSONB    |                                                                                                                |
| `source_type`, `source_model`, `reviewed_by`, `reviewed_at` |          | provenance                                                                                                     |

### `piste_aliases`

Variantes textuelles d'une piste pour matching et désambiguïsation.

| Colonne    | Type    | Notes                                                |
| ---------- | ------- | ---------------------------------------------------- |
| `id`       | UUID PK |                                                      |
| `piste_id` | UUID FK |                                                      |
| `alias`    | TEXT    | ex: "sonde PMH", "capteur vilebrequin", "CKP sensor" |

### `threads`

Contenu forum scrapé et indexé.

| Colonne                  | Type                | Notes                                                       |
| ------------------------ | ------------------- | ----------------------------------------------------------- |
| `id`                     | UUID PK             |                                                             |
| `url`                    | TEXT UNIQUE         |                                                             |
| `forum`                  | TEXT                | ex: `forum-auto.com`                                        |
| `titre`                  | TEXT                |                                                             |
| `date_thread`            | DATE                |                                                             |
| `nb_pages`               | INTEGER             |                                                             |
| `resolved_in_thread`     | BOOLEAN             |                                                             |
| `cause_finale_id`        | UUID FK pistes NULL | la piste qui a résolu le thread                             |
| `raw_content_compressed` | BYTEA               | contenu original compressé                                  |
| `langue_origine`         | TEXT                | ex: `fr`, `en` — défaut `fr`                                |
| `traduit`                | BOOLEAN             | `true` si `extrait`/synthèse traduits en FR — affiché en UI |
| `metadata`               | JSONB               |                                                             |
| `indexed_at`             | TIMESTAMPTZ         |                                                             |

### `thread_piste_mentions`

Lien entre un thread et une piste, avec le statut tel qu'extrait du thread.

| Colonne              | Type                  | Notes                                                                                                                                           |
| -------------------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                 | UUID PK               |                                                                                                                                                 |
| `thread_id`          | UUID FK               |                                                                                                                                                 |
| `piste_id`           | UUID FK               |                                                                                                                                                 |
| `statut_dans_thread` | ENUM                  | voir section 4                                                                                                                                  |
| `extrait`            | TEXT                  | citation pertinente <300 char                                                                                                                   |
| `confidence`         | REAL                  | 0-1 confiance de l'extraction                                                                                                                   |
| `post_url`           | TEXT NULL             | lien deep-link vers le post phpBB précis citant `extrait` (fallback `threads.url` si absent — extraction antérieure à la capture des `post_id`) |
| UNIQUE               | (thread_id, piste_id) |                                                                                                                                                 |

### `piste_ratings`

Notations users post-intervention. **Sépare strictement du signal forum.**

| Colonne             | Type                             | Notes                             |
| ------------------- | -------------------------------- | --------------------------------- |
| `id`                | UUID PK                          |                                   |
| `piste_id`          | UUID FK                          |                                   |
| `user_id`           | UUID FK                          |                                   |
| `probleme_id`       | UUID FK                          | contexte dans lequel testé        |
| `verdict`           | ENUM                             | `worked` / `failed` / `partial`   |
| `vehicule_user`     | TEXT                             | contexte: sur quoi l'user a testé |
| `commentaire_court` | TEXT                             |                                   |
| `created_at`        | TIMESTAMPTZ                      |                                   |
| UNIQUE              | (piste_id, user_id, probleme_id) | un user ne note qu'une fois       |

### `bookmarks`

| Colonne      | Type                 | Notes |
| ------------ | -------------------- | ----- |
| `user_id`    | UUID FK              |       |
| `thread_id`  | UUID FK              |       |
| `created_at` | TIMESTAMPTZ          |       |
| PK           | (user_id, thread_id) |       |

### `commentaires`

| Colonne         | Type         | Notes                      |
| --------------- | ------------ | -------------------------- |
| `id`            | UUID PK      |                            |
| `thread_id`     | UUID FK NULL |                            |
| `piste_id`      | UUID FK NULL | rattaché à thread OU piste |
| `user_id`       | UUID FK      |                            |
| `contenu`       | TEXT         |                            |
| `upvotes`       | INTEGER      |                            |
| `created_at`    | TIMESTAMPTZ  |                            |
| `search_vector` | TSVECTOR     |                            |

### `search_log`

Signal de demande pour piloter l'indexation prioritaire.

| Colonne             | Type         | Notes                        |
| ------------------- | ------------ | ---------------------------- |
| `id`                | UUID PK      |                              |
| `user_id`           | UUID FK NULL |                              |
| `query`             | TEXT         |                              |
| `results_count`     | INTEGER      |                              |
| `clicked_thread_id` | UUID FK NULL |                              |
| `satisfaction`      | ENUM NULL    | `found` / `partial` / `none` |
| `created_at`        | TIMESTAMPTZ  |                              |

### `piste_stats` (vue matérialisée)

Pré-calcule les compteurs forum/app par piste pour des requêtes rapides. Refresh après writes significatifs (trigger ou cron).

## 4. Les 4 statuts d'extraction forum

Quand le LLM lit un thread, il classe **chaque** piste mentionnée dans un de ces 4 statuts :

- **`confirmed`** — piste testée, a résolu le problème
- **`tested_neutral`** — piste testée, sans effet (rien fait)
- **`tested_negative`** — piste testée, situation aggravée
- **`mentioned`** — piste suggérée mais pas testée dans ce thread

Cette granularité permet de reconstruire le récit d'un diagnostic. _"Le gars a essayé les injecteurs (`tested_neutral`), puis la pompe HP (`tested_negative`), puis le PMH (`confirmed`)"_ — c'est une lecture impossible à reconstruire en parcourant Google.

## 5. Séparation stricte signal forum / signal app

**Ne JAMAIS fusionner les deux compteurs dans l'affichage.** Épistémiquement, ce sont des choses différentes :

|           | Signal forum                  | Signal app                    |
| --------- | ----------------------------- | ----------------------------- |
| Source    | Extraction LLM d'un thread    | Notation user post-réparation |
| Fiabilité | Moyenne (LLM interprète)      | Élevée (user a réparé)        |
| Volume    | Gros au départ                | Faible, croît avec usage      |
| Biais     | Anciens, parfois non vérifiés | Spam possible, à modérer      |

Les deux apparaissent côte à côte dans l'UI, jamais additionnés.

## 6. Règles d'affichage UI

### Pattern uniforme pour les compteurs

```
X sur N <verbe>
```

Exemple actuel (signal forum uniquement, signal app pas encore implémenté — voir §7) :

- `14 threads sur 17 confirment`

### Règles précises

- **Forum** : raw count toujours
- **Lignes cliquables** avec chevron `›` à droite, **pas de texte CTA redondant** type "voir la liste"
- **Pas d'alerte "piège classique"** ni autre badge : le tri/badge de fiabilité dit déjà ce qu'il faut

Le signal app (`piste_ratings`, notations post-réparation) est dépriorisé (voir [roadmap.md](roadmap.md)) : la table existe en base mais n'est pas encore branchée à l'UI. Quand ce sera fait, il devra rester **affiché séparément du signal forum, jamais fusionné** (§5) — pas de pattern figé pour l'instant tant que la fonctionnalité n'est pas planifiée.

## 7. Tri et gating des pistes (V1)

Le tri par taux de succès réel (forum) n'est visible **qu'une fois la piste débloquée** (abonnement ou unlock gratuit). En version gratuite/anonyme, les pistes s'affichent dans un **ordre aléatoire**, sans badge de fiabilité — c'est un choix produit délibéré, pas un manque : voir [monetization.md](monetization.md) pour le détail du gating et sa justification (le rang lui-même révèle quelle piste est la bonne, donc on ne peut pas le donner gratuitement).

Le signal app, une fois implémenté, viendra s'ajouter au tri de la vue débloquée — pondération à définir à ce moment-là (pas de formule figée pour l'instant, l'ancienne formule blend 0.7/0.3 était prématurée tant que `piste_ratings` n'a aucune donnée).

## 8. Traçabilité de provenance

Toute entité créée (problème, piste) porte :

- `source_type` : `human` / `llm` / `user_contribution`
- `source_model` : ex `claude-opus-4-6`, `gpt-4o-mini`
- `source_prompt_hash` : pour reproduire si besoin
- `reviewed_by` : qui a validé
- `reviewed_at` : quand

Bénéfices :

- Régénération sélective si un modèle s'avère médiocre rétroactivement
- Badge "Vérifié expert" pour les fiches `human`-only
- Audit / détection de dérive
- Différenciation visuelle possible en UI

## 9. Déduplication

C'est le défi technique central. Sans déduplication, "Capteur PMH", "sonde PMH", "capteur vilebrequin" et "CKP" deviennent 4 pistes distinctes et le bénéfice agrégé disparaît.

Trois mécanismes complémentaires :

1. **Similarity matching à l'extraction** : nouvelle piste/problème extrait → similarité trigramme (`pg_trgm`, fonction `similarity(titre, ...)`) avec les titres existants → si similarité > seuil (0.5, à calibrer), on rattache à l'entité existante au lieu d'en créer une nouvelle
2. **Canonical names + alias** : table `piste_aliases` listant les variantes
3. **Merge manuel** : interface admin pour fusionner les pistes similaires détectées algorithmiquement

Aucun algo n'est parfait. Le merge manuel reste indispensable, surtout en phase early.

Idem pour les `problemes` : "Clio 3 cale à chaud" et "Clio III calage moteur chaud" doivent matcher. Même approche.

> **Décision (remplace l'approche par embeddings Voyage utilisée jusqu'au Sprint 1)** : le matching trigramme texte-sur-texte est plus simple, ne dépend d'aucun SaaS externe (donc aucun risque de rate-limit/coût/panne tiers), et reste suffisant pour les variantes de formulation proches ("Capteur PMH" / "sonde PMH"). Limite connue : un vrai synonyme sans recoupement de caractères (ex. "CKP sensor" sans aucun mot commun) ne sera pas détecté automatiquement — c'est le rôle du merge manuel et des `piste_aliases` de combler ce cas.

## 10. Workflow ingestion vs migrations

Distinction critique à NE PAS confondre :

|           | Migrations de schéma           | Ingestion de données                  |
| --------- | ------------------------------ | ------------------------------------- |
| Quoi      | ALTER TABLE, ADD COLUMN, index | INSERT INTO threads, pistes, mentions |
| Fréquence | Rare (semaines)                | Continue (chaque indexation)          |
| Process   | GitHub PR + CI + merge → prod  | API directe via worker authentifié    |
| Outil     | Drizzle Kit                    | Worker pg-boss                        |

L'ingestion ne passe **JAMAIS** par PR. Une PR par thread indexé saturerait GitHub et n'apporterait aucune valeur.

L'agent admin (Claude Code + MCP custom à définir post-MVP) opère via les APIs, pas via Git.

## 11. Stack technique

| Couche         | Choix                                                     | Note                                                                            |
| -------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Frontend / API | **Next.js 15 App Router + TypeScript**                    | SSR pour SEO crucial                                                            |
| Styling        | **Tailwind**                                              |                                                                                 |
| DB             | **Postgres (Neon)**                                       | Free tier généreux, branching gratuit                                           |
| Extensions PG  | **pg_trgm** (similarité texte) + **FTS natif** (tsvector) | Pas d'Elasticsearch / Qdrant / SaaS d'embeddings à ce stade                     |
| ORM            | **Drizzle**                                               | **PAS Prisma**. Typesafe, syntaxe SQL-like, colle avec le pattern colonne+JSONB |
| Auth           | **Auth.js (NextAuth)** + **Resend** magic link            | **PAS Supabase Auth, PAS Clerk**                                                |
| Queue          | **pg-boss**                                               | Queue dans Postgres, zéro infra additionnelle                                   |
| LLM extraction | **Claude Haiku** (volume)                                 | Coût ~5 centimes par thread                                                     |
| LLM synthèse   | **Claude Sonnet** (qualité)                               | Pour les requêtes user                                                          |
| Hosting        | **Vercel** (déploiement git push)                         |                                                                                 |

**Recherche et déduplication** : entièrement basées sur le texte stocké en base (`ILIKE` + `pg_trgm`), pas d'embeddings ni de fournisseur SaaS externe (Voyage retiré — voir §9). Plus simple à opérer, aucun coût ni rate-limit tiers, et suffisant pour le volume actuel.

### 11bis. Déploiement — points d'attention monorepo

- **Middleware Auth.js en runtime Node.js obligatoire** : `export const runtime = 'nodejs'` dans `apps/web/src/middleware.ts`. Le runtime Edge par défaut de Next.js ne peut pas ouvrir de socket TCP, donc `postgres-js` (utilisé par `DrizzleAdapter`) ne peut jamais valider une session depuis le middleware — bug silencieux en prod, aucune erreur de build.
- **Imports `@forumeka/db` par sous-chemin** (`@forumeka/db/client`, `@forumeka/db/schema`) plutôt que le barrel `@forumeka/db` dans tout code potentiellement bundlé en Edge — le barrel réexporte du code Node-only (`pg-boss`, etc.) qui casse le build Edge.
- **Build Vercel** : Root Directory = `apps/web`, mais Vercel ne construit pas les packages workspace (`packages/db`, `packages/extractor`) par défaut. Build Command à override en dashboard :
  ```
  cd ../.. && pnpm --filter @forumeka/extractor build && pnpm --filter @forumeka/db build && pnpm --filter @forumeka/web build
  ```
  (ordre topologique : `extractor` est une dépendance de `db`, qui est une dépendance de `web`)
- **Migrations Neon depuis un environnement HTTPS-only** : si l'environnement d'exécution ne permet pas le TCP sortant (port 5432), utiliser le driver HTTP `@neondatabase/serverless` (`neon()` + `sql.query(rawSql)`) plutôt que `drizzle-kit migrate` / `postgres-js`.
- **CLI `forumeka-db` (ingest/refresh-stats)** : toujours fermer la connexion (`db.$client.end()` dans un `finally`), sinon le process Node ne se termine jamais (pool `postgres-js` qui garde le socket ouvert).
- **`piste_stats` (vue matérialisée)** : penser à `REFRESH MATERIALIZED VIEW CONCURRENTLY` après chaque ingestion (`pnpm --filter @forumeka/db exec forumeka-db refresh-stats`), sinon l'UI affiche des stats périmées sans erreur visible.

### 11ter. Contournement Cloudflare pour Caradisiac

Caradisiac (forum cible Sprint 0) renvoie systématiquement un challenge Cloudflare (403) à `fetch`/`undici`, peu importe le User-Agent — un challenge JS ne peut pas être résolu sans exécuter du JS dans un vrai moteur de rendu. Plan retenu pour récupérer son contenu malgré tout :

- **Approche** : navigateur headless (Playwright) à la place de `fetch` pour les requêtes vers les domaines protégés par Cloudflare — laisse le challenge JS s'exécuter normalement comme un vrai navigateur, puis extrait le HTML rendu.
- **Scope limité** : uniquement pour les domaines qui le nécessitent (Caradisiac) ; `forum4x4.org` et les autres forums sans protection continuent sur `fetch` simple, plus léger et plus rapide.
- **Rate-limiting renforcé** : un navigateur headless est plus lourd et plus visible qu'un `fetch` — garder un rate-limit prudent et respecter `robots.txt` comme pour les autres forums (§12).
- **Alternative à garder en tête si Playwright s'avère insuffisant** (Cloudflare durcit parfois ses challenges) : un service tiers de résolution de challenge (ex. FlareSolverr, ou une API de scraping dédiée) — non retenu en premier choix pour rester sans dépendance SaaS externe, dans le même esprit que le retrait de Voyage (§9).

## 12. Décisions tranchées (ne pas rediscuter)

- **Périmètre véhicules** : auto seulement au démarrage. Pas de moto/utilitaire.
- **Scraping forums** : ~~fetch à la demande user uniquement~~ **mise à jour post-MVP** : découverte automatisée de threads autorisée pour le seed, mais bornée (liste de sous-forums ciblés, pas de crawl illimité) et rate-limitée. Respect robots.txt, User-Agent identifiable. Pas de redistribution du contenu brut, seulement synthèse + lien source.
- **Forum cible Sprint 0** : Caradisiac (forum.caradisiac.com). **Bloqué par Cloudflare** (challenge JS systématique, 403 quel que soit le User-Agent/IP — `fetch`/`undici` ne peut pas résoudre un challenge JS) : voir §11ter pour le plan de contournement. **Extension validée (PR #8)** : phpBB3 générique (parser dédié, ex. forum4x4.org, sans protection anti-bot) — réutilisable pour tout forum basé sur ce moteur sans nouveau parser, utilisé en attendant que le contournement Cloudflare soit en place. Forums anglophones (ex: TDIClub) autorisés pour enrichir le seed, avec traduction EN→FR automatique du contenu extrait et badge "traduit" visible sur les sources concernées.
- **Confidentialité** : **public-only**. Pas de mode "indexation privée". L'effet réseau de la base mutualisée est central.
- **Auth** : **mise à jour V1 monétisation** — recherche et consultation libres, sans compte (bon pour le SEO et l'acquisition). Compte requis seulement pour les unlocks gratuits et l'abonnement. Magic link via email. Détail complet : [monetization.md](monetization.md).
- **Gating** : précisé en V1, voir [monetization.md](monetization.md) — ne pas rediscuter le découpage titre/fiabilité/preuve sans relire ce doc d'abord.
- **Modération** : manuelle au début, suffit jusqu'à plusieurs centaines d'users actifs.
- **Hébergement** : Vercel + Neon, validé.
- **Pas de moto/utilitaire** au démarrage.
- **Pas de Supabase, pas de Prisma, pas de Clerk.**
- **Esthétique** : beige / gris / noir / blanc strict. Alignée sur luka-chassaing.fr. Pas de couleur d'accent.

## 13. Plan d'exécution

État sprint par sprint, à jour en continu : [roadmap.md](roadmap.md). Ne pas dupliquer cette liste ici — elle dérive systématiquement.

## 14. Hors scope MVP

- MCP server custom pour Claude Code → agent admin (reporté post-MVP)
- Extension navigateur "indexer ce thread en 1 clic"
- Ingestion YouTube (transcripts vidéos diag) et Reddit
- Pool d'embeddings partagés
- Stratégie de distribution / acquisition (au-delà du SEO organique déjà en place)

Le modèle économique est désormais scopé, voir [monetization.md](monetization.md) — ce n'est plus hors scope.
