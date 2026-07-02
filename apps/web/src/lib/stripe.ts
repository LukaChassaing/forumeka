import Stripe from 'stripe';

let _stripe: Stripe | null = null;

/** Client Stripe (lazy) — la clé secrète n'est requise qu'à la première utilisation runtime. */
export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY manquant');
    // Pas d'apiVersion épinglée : on suit la version par défaut du compte + du SDK installé.
    _stripe = new Stripe(key);
  }
  return _stripe;
}

export type PlanId = 'monthly' | 'yearly';

interface PlanConfig {
  id: PlanId;
  label: string;
  price: string;
  period: string;
  note?: string;
  /** Nom de la variable d'env contenant l'ID de Price Stripe (créé dans le dashboard). */
  priceEnv: 'STRIPE_PRICE_MONTHLY' | 'STRIPE_PRICE_YEARLY';
}

/** Offres Premium — un seul niveau, facturation mensuelle ou annuelle (§ monetization.md). */
export const PLANS: Record<PlanId, PlanConfig> = {
  monthly: {
    id: 'monthly',
    label: 'Mensuel',
    price: '4,99 €',
    period: '/mois',
    priceEnv: 'STRIPE_PRICE_MONTHLY',
  },
  yearly: {
    id: 'yearly',
    label: 'Annuel',
    price: '39,99 €',
    period: '/an',
    note: 'soit ~2 mois offerts',
    priceEnv: 'STRIPE_PRICE_YEARLY',
  },
};

/** ID de Price Stripe pour un plan, lu dans l'env. Lève si non configuré. */
export function priceIdForPlan(plan: PlanId): string {
  const priceId = process.env[PLANS[plan].priceEnv];
  if (!priceId) throw new Error(`${PLANS[plan].priceEnv} manquant`);
  return priceId;
}

/** URL de base pour les redirections Stripe (success/cancel/portail). */
export function baseUrl(): string {
  return process.env.AUTH_URL?.replace(/\/$/, '') ?? 'http://localhost:3000';
}
