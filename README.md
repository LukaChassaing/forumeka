# Forumeka

[![Live](https://img.shields.io/badge/live-forumeka.vercel.app-black?logo=vercel&logoColor=white)](https://forumeka.vercel.app)
[![Hosted on Vercel](https://img.shields.io/badge/hosted%20on-Vercel-000000?logo=vercel&logoColor=white)](https://vercel.com)
[![Database Neon](https://img.shields.io/badge/database-Neon%20Postgres-00E599?logo=postgresql&logoColor=white)](https://neon.tech)
[![CI](https://github.com/LukaChassaing/forumeka/actions/workflows/ci.yml/badge.svg)](https://github.com/LukaChassaing/forumeka/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-all%20rights%20reserved-lightgrey)](LICENSE)

> La solution à ton problème de voiture est forcément quelque part. Il suffit de savoir où chercher.

## Le problème

Une panne auto a presque toujours déjà été résolue par quelqu'un, sur un forum, il y a parfois plusieurs années — noyée dans 14 pages de discussion. Trouver la bonne réponse demande de tout lire, de trier le vrai du faux, et de recouper plusieurs avis contradictoires.

## Ce que fait Forumeka

Tu tapes ton symptôme en langage naturel (*"Clio 3 1.5 dCi cale à chaud"*), Forumeka te remonte les **pistes de diagnostic** déjà discutées sur les forums automobiles, **classées par taux de réussite réel** plutôt que par popularité du sujet — avec la source exacte (l'extrait du message, le lien vers le fil) pour chaque piste.

L'idée n'est pas de remplacer les forums, mais de leur redonner de la visibilité : Forumeka renvoie systématiquement vers le fil d'origine, et encourage à y poster quand une piste manque encore de confirmation.

## Pour qui

Toute personne qui galère sur une panne et n'a pas envie (ou pas le temps) de fouiller des heures de forum pour trouver la bonne piste.

## Modèle

Gratuit pour chercher et consulter les pistes connues. Un abonnement (mensuel ou annuel) débloque le détail des pistes les plus fiables et leurs sources. Détails : [docs/monetization.md](docs/monetization.md).

## En savoir plus

- [docs/architecture.md](docs/architecture.md) — choix techniques et cadrage
- [docs/roadmap.md](docs/roadmap.md) — état d'avancement par sprint
- [docs/development.md](docs/development.md) — installation, commandes, déploiement
