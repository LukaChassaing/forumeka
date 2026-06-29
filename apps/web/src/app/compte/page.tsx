import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  hasActiveSubscription,
  countFreeUnlocksUsed,
  FREE_UNLOCKS_PER_USER,
  getUnlocksForUser,
} from '@forumeka/db';
import { auth } from '@/auth';
import { db } from '@/lib/db';

function formatDateFr(date: Date): string {
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default async function ComptePage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/connexion');

  const userId = session.user.id;
  const [subscribed, freeUnlocksUsed, unlocksHistory] = await Promise.all([
    hasActiveSubscription(db, userId),
    countFreeUnlocksUsed(db, userId),
    getUnlocksForUser(db, userId),
  ]);
  const freeUnlocksRemaining = Math.max(0, FREE_UNLOCKS_PER_USER - freeUnlocksUsed);
  const label = session.user.name ?? session.user.email ?? 'Mon compte';
  const showEmailSeparately = session.user.name && session.user.email;

  return (
    <div>
      <Link href="/" className="text-sm text-ink-500 hover:text-blue-700">
        ← Retour
      </Link>
      <div className="mt-4">
        <h1 className="text-xl font-bold text-ink-900">{label}</h1>
        {showEmailSeparately && <p className="text-sm italic text-ink-500">{session.user.email}</p>}
      </div>

      <div className="mt-8 rounded-xl border border-ink-100 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium uppercase tracking-wide text-ink-500">Abonnement</p>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              subscribed ? 'bg-green-100 text-green-800' : 'bg-ink-100 text-ink-600'
            }`}
          >
            {subscribed ? 'Premium actif' : 'Compte gratuit'}
          </span>
        </div>
        {subscribed ? (
          <p className="mt-3 text-sm text-ink-700">
            Tu as accès à la fiabilité réelle et aux sources forum de toutes les pistes.
          </p>
        ) : (
          <>
            <p className="mt-3 text-sm text-ink-700">
              Passe Premium pour voir l&apos;ordre réel des pistes, leur fiabilité, et toutes les
              sources forum sans limite.
            </p>
            <Link
              href="/abonnement"
              className="mt-4 inline-flex items-center rounded-lg bg-ink-900 px-4 py-2 text-sm font-medium text-beige-50 hover:bg-ink-700"
            >
              Voir les offres
            </Link>
          </>
        )}
      </div>

      {!subscribed && (
        <div className="mt-4 rounded-xl border border-ink-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium uppercase tracking-wide text-ink-500">
            Déblocages gratuits
          </p>
          <div className="mt-3 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink-100">
              <div
                className="h-full rounded-full bg-ink-900"
                style={{
                  width: `${(freeUnlocksUsed / FREE_UNLOCKS_PER_USER) * 100}%`,
                }}
              />
            </div>
            <p className="shrink-0 text-sm font-medium text-ink-700">
              {freeUnlocksUsed}/{FREE_UNLOCKS_PER_USER} utilisés
            </p>
          </div>
          <p className="mt-2 text-sm text-ink-500">
            {freeUnlocksRemaining > 0
              ? `${freeUnlocksRemaining} déblocage${freeUnlocksRemaining > 1 ? 's' : ''} gratuit${freeUnlocksRemaining > 1 ? 's' : ''} restant${freeUnlocksRemaining > 1 ? 's' : ''}, à vie.`
              : 'Tous tes déblocages gratuits sont utilisés.'}
          </p>

          {unlocksHistory.length > 0 && (
            <ul className="mt-4 divide-y divide-ink-100 border-t border-ink-100">
              {unlocksHistory.map((u) => (
                <li key={u.pisteId} className="flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <Link
                      href={`/piste/${u.pisteId}`}
                      className="block truncate text-sm font-medium text-ink-900 hover:text-blue-700"
                    >
                      Piste : {u.pisteTitre}
                    </Link>
                    <Link
                      href={`/diag/${u.problemeSlug}`}
                      className="block truncate text-xs text-ink-500 hover:text-blue-700"
                    >
                      Problème : {u.problemeTitre}
                    </Link>
                  </div>
                  <span className="shrink-0 text-xs text-ink-400">
                    {formatDateFr(u.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
