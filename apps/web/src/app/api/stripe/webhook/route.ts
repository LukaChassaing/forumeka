import type Stripe from 'stripe';
import {
  getUserByStripeCustomerId,
  updateUserSubscription,
  mapStripeSubscriptionStatus,
} from '@forumeka/db';
import { db } from '@/lib/db';
import { getStripe } from '@/lib/stripe';

// Node runtime obligatoire : vérification de signature (crypto) + socket TCP vers Postgres.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Fin de la période payée en cours. Depuis l'API 2025, l'info est portée par les items, pas la sub. */
function subscriptionPeriodEnd(sub: Stripe.Subscription): Date | null {
  const end = sub.items?.data?.[0]?.current_period_end;
  return typeof end === 'number' ? new Date(end * 1000) : null;
}

/** Résout le compte concerné (metadata.userId posé au Checkout, sinon lookup par client Stripe). */
async function resolveUserId(sub: Stripe.Subscription): Promise<string | null> {
  const fromMetadata = sub.metadata?.userId;
  if (fromMetadata) return fromMetadata;
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
  const user = await getUserByStripeCustomerId(db, customerId);
  return user?.id ?? null;
}

/** Reporte l'état d'une subscription Stripe sur le compte (source de vérité unique de l'abonnement). */
async function applySubscription(sub: Stripe.Subscription): Promise<void> {
  const userId = await resolveUserId(sub);
  if (!userId) {
    console.warn(`[stripe] subscription ${sub.id} sans compte associé, ignorée`);
    return;
  }
  const status = sub.status === 'canceled' ? 'canceled' : mapStripeSubscriptionStatus(sub.status);
  await updateUserSubscription(db, userId, status, subscriptionPeriodEnd(sub));
}

export async function POST(req: Request): Promise<Response> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[stripe] STRIPE_WEBHOOK_SECRET manquant');
    return new Response('Webhook non configuré', { status: 500 });
  }

  const signature = req.headers.get('stripe-signature');
  if (!signature) return new Response('Signature manquante', { status: 400 });

  const stripe = getStripe();
  const payload = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(payload, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'signature invalide';
    console.error(`[stripe] échec de vérification du webhook : ${message}`);
    return new Response(`Signature invalide : ${message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        if (session.mode === 'subscription' && session.subscription) {
          const subId =
            typeof session.subscription === 'string'
              ? session.subscription
              : session.subscription.id;
          const sub = await stripe.subscriptions.retrieve(subId);
          await applySubscription(sub);
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        await applySubscription(event.data.object);
        break;
      }
      default:
        // Les autres événements ne nous concernent pas — on les acquitte quand même (200).
        break;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[stripe] erreur de traitement de ${event.type} : ${message}`);
    // 500 → Stripe rejouera l'événement.
    return new Response('Erreur de traitement', { status: 500 });
  }

  return new Response(null, { status: 200 });
}
