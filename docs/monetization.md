# Monétisation V1

Statut : gating, compte utilisateur **et Stripe (Checkout + webhook)** implémentés. L'abonnement
payant est fonctionnel une fois les clés/prix Stripe configurés (voir « Configuration Stripe » plus
bas).

## Pricing & abonnement

- **4,99 €/mois** ou **39,99 €/an**, un seul prix, pas de palier ni d'achat à l'unité.
- **5 déverrouillages gratuits à vie** par compte (relevé de 3 à 5 en pratique pour les problèmes
  à beaucoup de pistes). Une fois épuisés : un seul CTA, "Abonne-toi".
- Paiement : **Stripe Checkout**, avec PayPal activé comme moyen de paiement natif dans Stripe (pas d'intégration séparée). Implémenté : page `/abonnement`, Checkout hébergé, portail de facturation Stripe pour gérer/résilier.
- Objectifs business par paliers (pas un chiffre figé) : 10 payants (2-3 mois, jalon de validation) → 50 (6-12 mois) → 100 (12-18 mois, dépend surtout du rythme d'indexation de contenu).

## Gating

| Élément                                                  | Visible sans payer ?                                                     |
| -------------------------------------------------------- | ------------------------------------------------------------------------ |
| `problème.titre` + véhicule + symptômes                  | Toujours (SEO, jamais touché)                                            |
| Intro "X pistes connues, Y confirmées par la communauté" | Toujours (accroche, ne révèle pas laquelle)                              |
| Titre de toutes les pistes                               | Toujours, **ordre aléatoire** (`ORDER BY random()` à chaque affichage)   |
| Badge de fiabilité (Très/Probable/Peu probable)          | Verrouillé — remplacé par un badge neutre **"🔒 Voir la fiabilité"**     |
| Sources forum (extrait, lien thread, nb confirmations)   | Verrouillé                                                               |

Payer débloque deux choses : l'ordre/fiabilité réelle des pistes, et la preuve forum (sources).
Le déverrouillage (gratuit ou abonnement) est **par piste**, pas par problème entier.

`piste.description` n'est **pas** dans le scope : la colonne existe en base mais reste non alimentée (pas de valeur claire une fois verrouillée, risque d'hallucination LLM sur du contenu mécanique).

## CTA

- Piste sans confirmation → CTA vers le forum source (poster/relancer le sujet). **Non implémenté.**

## Contraintes techniques

- Jamais de cloaking — même HTML servi à tous (bots et humains).
- Verrouillage **obligatoirement côté serveur** : ne jamais renvoyer les champs payants dans le HTML si l'utilisateur n'est pas autorisé (pas un simple masquage CSS). Implémenté : les sources forum ne sont même pas requêtées côté serveur si l'accès n'est pas déverrouillé.
- Table `unlocks` créée (`user_id`, `piste_id`, `type`, `expires_at`) pour tracker l'abonnement actif et les unlocks gratuits consommés. Colonnes `stripe_customer_id`, `subscription_status`, `subscription_expires_at` ajoutées sur `users`.
- Page `/compte` : statut abonnement, compteur de déblocages gratuits restants, historique des pistes débloquées.
- **Stripe** : page `/abonnement` (offres mensuel/annuel), Checkout hébergé, portail de facturation. Le statut d'abonnement n'est **jamais** dérivé du retour client de Checkout : seul le webhook `/api/stripe/webhook` (signature vérifiée) écrit `users.subscription_status`/`subscription_expires_at`. `hasActiveSubscription()` exige `status = 'active'` ET une échéance non dépassée.

## Configuration Stripe

Variables d'env (voir `.env.example`) : `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_YEARLY`.

1. Créer deux **Prices récurrents** dans le Dashboard Stripe (4,99€/mois, 39,99€/an) → renseigner leurs IDs `price_...`.
2. Créer un **endpoint webhook** vers `https://<domaine>/api/stripe/webhook`, écouter `checkout.session.completed`, `customer.subscription.created|updated|deleted` → renseigner le `whsec_...`.
3. Activer **PayPal** comme moyen de paiement dans les réglages Stripe (aucun code supplémentaire).
4. En local : `stripe listen --forward-to localhost:3000/api/stripe/webhook` fournit un `whsec_` de test.

## Reste à faire (post-V1)

- CTA "piste sans confirmation → forum" (page piste), toujours non implémenté.
- Rappels de fin de période / relances d'échec de paiement (au-delà du statut `past_due` déjà géré).
