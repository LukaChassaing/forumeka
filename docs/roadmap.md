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

## Sprint 1 — DB + ingestion ⬅ en cours

- [ ] Schéma Drizzle des 9 tables (§3)
- [ ] Migrations versionnées
- [ ] Extensions PG : `pgvector`, FTS `tsvector`
- [ ] Worker `pg-boss` qui ingère les JSON du Sprint 0
- [ ] Déduplication v1 (similarity matching Voyage + alias)
- [ ] Vue matérialisée `piste_stats`
- [ ] CLI admin `forumeka ingest <fichier.json>`

## Sprint 2 — Web app minimale

- [ ] Next 15 App Router + Tailwind, design system beige/gris/noir/blanc
- [ ] Auth.js + Resend magic link
- [ ] Page recherche `/` (autocomplete véhicule + symptôme)
- [ ] Page résultats `/diag/[slug]`
- [ ] Page piste `/piste/[id]` avec sources
- [ ] Pattern d'affichage "X sur N <verbe>" (§6)

## Sprint 3 — Couche communautaire

- [ ] Notation user post-réparation (`worked` / `failed` / `partial`)
- [ ] Bookmarks
- [ ] Commentaires sur thread/piste
- [ ] Recalcul taux de succès (§7) — formule de départ
- [ ] Modération manuelle basique
