import Link from 'next/link';
import { redirect } from 'next/navigation';
import { hasActiveSubscription } from '@forumeka/db';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { PLANS } from '@/lib/stripe';
import { createCheckoutSession, openBillingPortal } from './actions';

export default async function AbonnementPage({
  searchParams,
}: {
  searchParams: Promise<{ abonnement?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect('/connexion?next=/abonnement');

  const subscribed = await hasActiveSubscription(db, session.user.id);
  const { abonnement } = await searchParams;

  if (subscribed) {
    return (
      <div>
        <Link href="/compte" className="text-sm text-ink-500 hover:text-blue-700">
          ← Mon compte
        </Link>
        <div className="mt-6 rounded-xl border border-ink-100 bg-white p-6 shadow-sm">
          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
            Premium actif
          </span>
          <p className="mt-4 text-ink-700">
            Tu as accès à la fiabilité réelle et aux sources forum de toutes les pistes, sans
            limite.
          </p>
          <form action={openBillingPortal} className="mt-4">
            <button
              type="submit"
              className="inline-flex items-center rounded-lg border border-ink-200 px-4 py-2 text-sm font-medium text-ink-900 hover:bg-ink-50"
            >
              Gérer mon abonnement
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Link href="/compte" className="text-sm text-ink-500 hover:text-blue-700">
        ← Mon compte
      </Link>

      <h1 className="mt-4 text-2xl font-bold text-ink-900">Passe Premium</h1>
      <p className="mt-2 text-ink-700">
        Débloque l&apos;ordre réel des pistes, leur fiabilité, et toutes les sources forum sans
        limite.
      </p>

      {abonnement === 'annule' && (
        <p className="mt-4 rounded-lg bg-ink-100 px-4 py-3 text-sm text-ink-600">
          Paiement annulé — aucun montant n&apos;a été prélevé. Tu peux réessayer quand tu veux.
        </p>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {Object.values(PLANS).map((plan) => (
          <form
            key={plan.id}
            action={createCheckoutSession}
            className="flex flex-col rounded-xl border border-ink-100 bg-white p-6 shadow-sm"
          >
            <input type="hidden" name="plan" value={plan.id} />
            <p className="text-sm font-medium uppercase tracking-wide text-ink-500">{plan.label}</p>
            <p className="mt-2">
              <span className="text-3xl font-bold text-ink-900">{plan.price}</span>
              <span className="text-ink-500">{plan.period}</span>
            </p>
            {plan.note && <p className="mt-1 text-sm text-green-700">{plan.note}</p>}
            <button
              type="submit"
              className="mt-6 inline-flex items-center justify-center rounded-lg bg-ink-900 px-4 py-2 text-sm font-medium text-beige-50 hover:bg-ink-700"
            >
              Choisir {plan.label.toLowerCase()}
            </button>
          </form>
        ))}
      </div>

      <p className="mt-6 text-sm text-ink-500">
        Paiement sécurisé par Stripe (carte ou PayPal). Résiliable à tout moment depuis ton compte.
      </p>
    </div>
  );
}
