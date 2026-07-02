'use server';

import { redirect } from 'next/navigation';
import { getUserById, setUserStripeCustomerId, hasActiveSubscription } from '@forumeka/db';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { getStripe, priceIdForPlan, baseUrl, type PlanId } from '@/lib/stripe';

/**
 * Crée (ou réutilise) le client Stripe du compte puis ouvre une session Checkout pour le plan
 * choisi. L'état d'abonnement n'est jamais mis à jour ici : c'est le webhook qui fait foi une fois
 * le paiement confirmé (§ monetization.md).
 */
export async function createCheckoutSession(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) redirect('/connexion?next=/abonnement');

  const plan = formData.get('plan');
  if (plan !== 'monthly' && plan !== 'yearly') redirect('/abonnement');

  const userId = session.user.id;
  if (await hasActiveSubscription(db, userId)) redirect('/compte');

  const user = await getUserById(db, userId);
  const stripe = getStripe();

  let customerId = user?.stripeCustomerId ?? null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user?.email ?? session.user.email ?? undefined,
      metadata: { userId },
    });
    customerId = customer.id;
    await setUserStripeCustomerId(db, userId, customerId);
  }

  const checkout = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceIdForPlan(plan as PlanId), quantity: 1 }],
    client_reference_id: userId,
    subscription_data: { metadata: { userId } },
    allow_promotion_codes: true,
    success_url: `${baseUrl()}/compte?abonnement=succes`,
    cancel_url: `${baseUrl()}/abonnement?abonnement=annule`,
    locale: 'fr',
  });

  if (!checkout.url) throw new Error('Stripe Checkout : URL de session manquante');
  redirect(checkout.url);
}

/** Ouvre le portail de facturation Stripe (gérer/annuler l'abonnement, mettre à jour la carte). */
export async function openBillingPortal(): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) redirect('/connexion?next=/compte');

  const user = await getUserById(db, session.user.id);
  if (!user?.stripeCustomerId) redirect('/abonnement');

  const portal = await getStripe().billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${baseUrl()}/compte`,
  });
  redirect(portal.url);
}
