---
name: sprint0-extract
description: Indexer un ou plusieurs threads Caradisiac avec le CLI forumeka extractor (Sprint 0). Utilise ce skill quand tu veux faire tourner la pipeline d'extraction LLM à la main, inspecter les JSON, itérer le parser ou le prompt. Fonctionne dans une session dédiée — vérifie l'env, lance le CLI thread par thread, te montre la sortie, propose des ajustements quand la qualité est insuffisante.
---

# Sprint 0 — extraction manuelle de threads

Tu es dans une session dédiée à l'itération du Sprint 0 de Forumeka. Ton job : aider l'utilisateur à indexer 1 à 10 threads Caradisiac avec le CLI `packages/extractor`, inspecter les JSON produits, et itérer le parser (`packages/extractor/src/parsers/caradisiac.ts`) ou le prompt (`packages/extractor/src/prompt.ts`) jusqu'à atteindre une qualité acceptable.

## 1. Pré-checks (avant tout appel LLM)

Toujours faire ces vérifs avant de lancer un `forumeka extract` :

1. **Clé API présente** : `node -e "console.log(process.env.ANTHROPIC_API_KEY ? 'OK' : 'MISSING')"`. Si MISSING : explique à l'utilisateur qu'il doit charger `ANTHROPIC_API_KEY` dans l'env de cette session (secret du sandbox, ou `export ANTHROPIC_API_KEY=…` s'il est en local). Pas d'appel LLM sans clé.
2. **Build du package extractor** : `pnpm --filter @forumeka/extractor build` (rapide, sinon le `dist/` peut être périmé après une édition).
3. **Sortie isolée** : tous les JSON vont dans `packages/extractor/out/` (déjà ignoré par git). Ne commit jamais ces fichiers — c'est de la donnée de calibration.

## 2. Boucle d'indexation

Pour chaque URL fournie par l'utilisateur :

```bash
pnpm --filter @forumeka/extractor exec forumeka extract <url> --out packages/extractor/out
```

Le CLI écrit `packages/extractor/out/<sha1>.json` (un `ExtractionRun` schéma version 1). Affiche ensuite ce JSON à l'utilisateur, mais **ne le dump pas brut** : commente. Tu dois mettre en lumière :

- `extraction.probleme.titre` — est-ce que ça décrit bien le symptôme principal du thread ?
- `extraction.pistes[]` — combien, et chacune avec son `statut` (confirmed / tested_neutral / tested_negative / mentioned)
- `extraction.cause_finale` et `extraction.resolved_in_thread` — alignés ?
- Repère les pistes avec `confidence < 0.5` : suspectes, à challenger
- Si une piste évidente du thread manque (l'utilisateur la repère à la lecture) : c'est un faux négatif du LLM, à corriger au prompt

## 3. Quand le parser foire (vide ou bizarre)

Si `thread.posts` est vide ou ne ressemble pas au contenu vrai de la page, le parser Caradisiac (`packages/extractor/src/parsers/caradisiac.ts`) a ses sélecteurs cassés.

Méthode :

1. Lance `forumeka fetch <url> --out packages/extractor/out` pour récupérer le HTML brut
2. Ouvre-le, repère les vrais conteneurs DOM (classes / IDs des posts, auteurs, dates) avec Grep ou en lisant le HTML
3. Édite `caradisiac.ts` — sélecteurs Cheerio plus précis
4. `pnpm --filter @forumeka/extractor build && pnpm --filter @forumeka/extractor test`
5. Relance `forumeka parse <url>` (sans LLM, donc gratuit) pour valider le parsing avant de cramer du token

## 4. Quand le prompt foire (qualité LLM faible)

Symptômes : pistes inventées, statuts confondus (`mentioned` qui devrait être `confirmed`), `cause_finale` aberrante.

Méthode :

1. Identifie le pattern d'erreur sur 2-3 threads avant de modifier le prompt (un cas ≠ un pattern)
2. Édite `packages/extractor/src/prompt.ts` — ajoute une règle stricte ou un exemple négatif court
3. `pnpm --filter @forumeka/extractor build` puis re-extract sur les mêmes threads
4. Compare les nouveaux JSON aux anciens — l'erreur a-t-elle disparu sans en introduire d'autres ?

## 5. Critères de fin de Sprint 0

L'utilisateur cherche **10 ExtractionRun JSON** dont :

- ≥ 8 ont un `probleme.titre` jugé bon par lui à la relecture
- ≥ 8 ont une liste de pistes complète (pas de piste évidente manquante)
- 0 piste totalement inventée par le LLM
- Distribution réaliste des `statut` (pas que `mentioned`)

Quand c'est atteint : propose à l'utilisateur de commit les modifs de `parsers/caradisiac.ts` et `prompt.ts` séparément (deux commits si les deux ont bougé), avec des messages explicites genre `fix(extractor): tighten Caradisiac post selectors` et `refactor(extractor): clarify statut rules in prompt`. **Pas** de commit des JSON `out/`.

## 6. Garde-fous

- Respecte la rate-limit du fetch (déjà 2s dans `fetch.ts`) — ne la désactive jamais
- Si Caradisiac renvoie un 403 / Cloudflare challenge : signale-le à l'utilisateur, ne tente pas de bypass
- Coût attendu : ~5 centimes / thread (Claude Haiku). 10 threads = ~50 centimes
- Si une extraction échoue sur une validation Zod : montre l'erreur **exacte** à l'utilisateur, c'est ça qui pilote l'itération du prompt
- Ne propose JAMAIS d'élargir le périmètre (moto, autres forums) — c'est hors scope du Sprint 0 (cf `docs/architecture.md` §12)

## 7. Arguments du skill

L'utilisateur peut t'invoquer avec une ou plusieurs URLs : `/sprint0-extract <url1> <url2> ...`. Si aucune URL n'est passée, demande-lui une URL Caradisiac avant tout autre action.
