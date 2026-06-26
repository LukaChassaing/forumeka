# Monétisation V1

Statut : scope figé, prêt à implémenter.

## Pricing & abonnement

- **4,99 €/mois** ou **39,99 €/an**, un seul prix, pas de palier ni d'achat à l'unité.
- **3 déverrouillages gratuits à vie** par compte. Une fois épuisés : un seul CTA, "Abonne-toi".
- Paiement : **Stripe Checkout**, avec PayPal activé comme moyen de paiement natif dans Stripe (pas d'intégration séparée).
- Objectifs business par paliers (pas un chiffre figé) : 10 payants (2-3 mois, jalon de validation) → 50 (6-12 mois) → 100 (12-18 mois, dépend surtout du rythme d'indexation de contenu).

## Gating

| Élément | Visible sans payer ? |
|---|---|
| `problème.titre` + véhicule + symptômes | Toujours (SEO, jamais touché) |
| Intro "X pistes connues, Y confirmées par la communauté" | Toujours (accroche, ne révèle pas laquelle) |
| Titre de toutes les pistes | Toujours, **ordre aléatoire** (`ORDER BY random()` à chaque affichage) |
| Badge de fiabilité (Très/Probable/Peu probable) | Verrouillé — remplacé par un badge neutre **"🔒 Fiabilité verrouillée"** |
| Sources forum (extrait, lien thread, nb confirmations) | Verrouillé |

Payer débloque deux choses : l'ordre/fiabilité réelle des pistes, et la preuve forum (sources).

`piste.description` n'est **pas** dans le scope : la colonne existe en base mais reste non alimentée (pas de valeur claire une fois verrouillée, risque d'hallucination LLM sur du contenu mécanique).

## CTA

- Piste sans confirmation → CTA vers le forum source (poster/relancer le sujet).

## Contraintes techniques

- Jamais de cloaking — même HTML servi à tous (bots et humains).
- Verrouillage **obligatoirement côté serveur** : ne jamais renvoyer les champs payants dans le HTML si l'utilisateur n'est pas autorisé (pas un simple masquage CSS).
- Table `unlocks` à créer (`user_id`, `piste_id`, `type`, `expires_at`) pour tracker l'abonnement actif et les unlocks gratuits consommés.
