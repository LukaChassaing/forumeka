# Architecture Forumeka

> Document de cadrage technique. À lire avant d'écrire du code.

## 1. Concept produit

L'utilisateur tape un symptôme en langage naturel (ex: _"Clio 3 1.5 dCi cale à chaud"_). Forumeka retourne une fiche **problème** avec ses **pistes** de diagnostic, classées par taux de succès, sourcées à la fois par :

- les **threads forum** (extraction LLM)
- les **retours users** post-réparation (notations dans l'app)

Le pari : les forums auto sont la plus grande base de connaissance diagnostique au monde, mais inutilisable. Les LLMs permettent enfin d'en extraire du savoir structuré, et la couche communautaire de l'app le valide/affine en continu.

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
| `titre`         | TEXT          | ex: "1.5 dCi K9K cale à chaud"            |
| `description`   | TEXT          |                                           |
| `vehicules`     | JSONB         | ex: `['Clio 3 K9K', 'Megane 2 K9K']`      |
| `symptomes`     | TEXT[]        | ex: `['calage à chaud', 'voyant moteur']` |
| `embedding`     | VECTOR(1536)  | pour recherche sémantique                 |
| `search_vector` | TSVECTOR      | full-text search                          |
| `metadata`      | JSONB         | champs dynamiques                         |
| `source_type`   | TEXT          | `human` / `llm` / `user_contribution`     |
| `source_model`  | TEXT          | ex: `claude-opus-4-6`                     |
| `reviewed_by`   | UUID FK users |                                           |
| `reviewed_at`   | TIMESTAMPTZ   |                                           |

### `pistes`

Causes possibles, rattachées à un problème, dédupliquées par similarité.

| Colonne                                                     | Type         | Notes                          |
| ----------------------------------------------------------- | ------------ | ------------------------------ |
| `id`                                                        | UUID PK      |                                |
| `probleme_id`                                               | UUID FK      |                                |
| `titre`                                                     | TEXT         | ex: "Capteur PMH"              |
| `description`                                               | TEXT         | procédure de test/remplacement |
| `cout_estime_eur`                                           | NUMRANGE     | ex: `[80, 150]`                |
| `difficulte`                                                | INTEGER      | 1-5                            |
| `embedding`                                                 | VECTOR(1536) |                                |
| `metadata`                                                  | JSONB        |                                |
| `source_type`, `source_model`, `reviewed_by`, `reviewed_at` |              | provenance                     |

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
| `query_embedding`   | VECTOR(1536) |                              |
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

Exemples :

- `14 threads sur 17 confirment`
- `7 avis app sur 8 confirment`
- `1 avis app sur 1 confirme`
- `0 avis app — donner mon retour` (CTA actif)

### Règles précises

- **Forum** : raw count toujours
- **App** : raw count tant que N < seuil (5 ou 10 à calibrer)
- **Cas zéro** : pas de masquage, on affiche `0 avis app — donner mon retour` (invitation passive à contribuer)
- **Lignes cliquables** avec chevron `›` à droite, **pas de texte CTA redondant** type "voir la liste"
- **Pas d'alerte "piège classique"** ni autre badge : le **tri par taux de succès** dit déjà ce qu'il faut

### Maquette de référence

```
Clio 3 / Megane 2 / Modus — 1.5 dCi K9K — cale à chaud

Pistes connues, classées par taux de succès:

1. Capteur PMH
   📚 14 threads sur 17 confirment                 ›
   🟢 7 avis app sur 8 confirment                  ›

2. Pompe gavage en cuve
   📚 6 threads sur 9 confirment                   ›
   🟢 1 avis app sur 1 confirme                    ›

3. Connecteur calculateur
   📚 3 threads sur 8 confirment                   ›
   ⚪ donner mon retour                            ›

4. Injecteurs
   📚 2 threads sur 22 confirment                  ›
   🔴 1 avis app sur 14 confirme                   ›
```

## 7. Tri des pistes

Ordonnancement par taux de succès. Signal app prioritaire, fallback forum quand l'app n'a pas encore assez de données.

Formule de départ (à calibrer pendant le MVP) :

```
si n_app >= seuil_app:
    score = 0.7 * taux_app + 0.3 * taux_forum
sinon:
    score = taux_forum
```

À affiner avec des poids dépendants de la confidence forum et du volume.

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

1. **Similarity matching à l'extraction** : nouvelle piste extraite → embedding → si similarité > seuil (0.85+) avec une piste existante, on rattache au lieu de créer
2. **Canonical names + alias** : table `piste_aliases` listant les variantes
3. **Merge manuel** : interface admin pour fusionner les pistes similaires détectées algorithmiquement

Aucun algo n'est parfait. Le merge manuel reste indispensable, surtout en phase early.

Idem pour les `problemes` : "Clio 3 cale à chaud" et "Clio III calage moteur chaud" doivent matcher. Même approche.

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

| Couche         | Choix                                                   | Note                                                                            |
| -------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Frontend / API | **Next.js 15 App Router + TypeScript**                  | SSR pour SEO crucial                                                            |
| Styling        | **Tailwind**                                            |                                                                                 |
| DB             | **Postgres (Neon)**                                     | Free tier généreux, branching gratuit                                           |
| Extensions PG  | **pgvector** (vector search) + **FTS natif** (tsvector) | Pas d'Elasticsearch / Qdrant à ce stade                                         |
| ORM            | **Drizzle**                                             | **PAS Prisma**. Typesafe, syntaxe SQL-like, colle avec le pattern colonne+JSONB |
| Auth           | **Auth.js (NextAuth)** + **Resend** magic link          | **PAS Supabase Auth, PAS Clerk**                                                |
| Queue          | **pg-boss**                                             | Queue dans Postgres, zéro infra additionnelle                                   |
| LLM extraction | **Claude Haiku** (volume)                               | Coût ~5 centimes par thread                                                     |
| LLM synthèse   | **Claude Sonnet** (qualité)                             | Pour les requêtes user                                                          |
| Embeddings     | **Voyage `voyage-3-lite`**                              | Validé : prix bas, FR correct, indépendant d'OpenAI                             |
| Hosting        | **Vercel** (déploiement git push)                       |                                                                                 |

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

## 12. Décisions tranchées (ne pas rediscuter)

- **Périmètre véhicules** : auto seulement au démarrage. Pas de moto/utilitaire.
- **Scraping forums** : ~~fetch à la demande user uniquement~~ **mise à jour post-MVP** : découverte automatisée de threads autorisée pour le seed, mais bornée (liste de sous-forums ciblés, pas de crawl illimité) et rate-limitée. Respect robots.txt, User-Agent identifiable. Pas de redistribution du contenu brut, seulement synthèse + lien source.
- **Forum cible Sprint 0** : Caradisiac (forum.caradisiac.com). **Extension validée (PR #8)** : phpBB3 générique (parser dédié, ex. forum4x4.org) — réutilisable pour tout forum basé sur ce moteur sans nouveau parser. Forums anglophones (ex: TDIClub) autorisés pour enrichir le seed, avec traduction EN→FR automatique du contenu extrait et badge "traduit" visible sur les sources concernées.
- **Confidentialité** : **public-only**. Pas de mode "indexation privée". L'effet réseau de la base mutualisée est central.
- **Auth** : **obligatoire dès la première recherche**, magic link via email.
- **Gating** : ultra-limité sur free tier pour protéger les coûts LLM. Free tier détaillé à calibrer.
- **Modération** : manuelle au début, suffit jusqu'à plusieurs centaines d'users actifs.
- **Hébergement** : Vercel + Neon, validé.
- **Pas de moto/utilitaire** au démarrage.
- **Pas de Supabase, pas de Prisma, pas de Clerk.**
- **Esthétique** : beige / gris / noir / blanc strict. Alignée sur luka-chassaing.fr. Pas de couleur d'accent.

## 13. Plan d'exécution

Voir [roadmap.md](roadmap.md).

- **Sprint 0** — pipeline d'extraction CLI validé sur 10 threads — 1 week-end
- **Sprint 1** — DB Postgres + admin indexation manuelle, seed 30-50 threads — 2 week-ends
- **Sprint 2** — web app minimale (auth + recherche + consultation) — 2-3 week-ends
- **Sprint 3** — couche communautaire (ratings, bookmarks, commentaires) — 2 week-ends

Total : 7-9 week-ends, en pointillé sur 3-4 mois.

## 14. Hors scope MVP

- MCP server custom pour Claude Code → agent admin (reporté post-MVP)
- Extension navigateur "indexer ce thread en 1 clic"
- Ingestion YouTube (transcripts vidéos diag) et Reddit
- Pool d'embeddings partagés
- Modèle économique précis (freemium + abonnement, ordre 3-5€/mois)
- Stratégie de distribution / acquisition
